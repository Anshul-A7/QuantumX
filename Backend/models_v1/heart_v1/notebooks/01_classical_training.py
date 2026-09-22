# ---
# jupyter:
#   jupytext:
#     text_representation:
#       extension: .py
#       format_name: percent
#       format_version: '1.3'
#   kernelspec:
#     display_name: Python 3
#     language: python
#     name: python3
# ---

# %% [markdown]
# # QuantumX — Classical Heart Attack Detection Model (CX-01 Cardiac)
# ## ResNet-18 Fine-Tuned on 12-Lead ECG Paper-Strip Images
# 
# **Dataset**: ECG Images of Cardiac Patients (Kaggle evilspirit05/ecg-analysis)  
# **4 Classes**: Normal ECG | Myocardial Infarction | History of MI | Abnormal Heartbeat  
# **Architecture**: ResNet-18 (ImageNet pretrained) → FC(512→4) with class-weighted CrossEntropy  
# **XAI**: Grad-CAM heatmap localization on last convolutional layer  
# **GPU**: NVIDIA RTX 3050 (CUDA)

# %% [markdown]
# ## 1. Environment Setup & Imports

# %%
import os
import sys
import json
import time
import copy
import warnings
from pathlib import Path
from datetime import datetime

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.optim.lr_scheduler import CosineAnnealingLR
from torch.utils.data import DataLoader
import torchvision
from torchvision import models, transforms
from PIL import Image

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import seaborn as sns
from sklearn.metrics import (
    confusion_matrix, classification_report, roc_curve, auc,
    precision_recall_fscore_support, matthews_corrcoef, accuracy_score,
    f1_score,
)
from sklearn.preprocessing import label_binarize

warnings.filterwarnings('ignore')
sns.set_theme(style="whitegrid", font_scale=1.2)

# %%
# Project paths
PROJECT_ROOT = Path(os.getcwd()).resolve()
if 'notebooks' in str(PROJECT_ROOT):
    PROJECT_ROOT = PROJECT_ROOT.parent
HEART_V1_ROOT = PROJECT_ROOT if PROJECT_ROOT.name == 'heart_v1' else PROJECT_ROOT / 'models_v1' / 'heart_v1'
ARTIFACTS_DIR = HEART_V1_ROOT / 'artifacts'
GRAPHS_DIR = ARTIFACTS_DIR / 'graphs'
HOLDOUT_DIR = ARTIFACTS_DIR / 'holdout'
GRAPHS_DIR.mkdir(parents=True, exist_ok=True)

# Add project to path
backend_root = HEART_V1_ROOT.parent.parent
sys.path.insert(0, str(backend_root))
sys.path.insert(0, str(HEART_V1_ROOT))

print(f"Project Root: {PROJECT_ROOT}")
print(f"Heart V1 Root: {HEART_V1_ROOT}")
print(f"Artifacts: {ARTIFACTS_DIR}")
print(f"Graphs: {GRAPHS_DIR}")

# %%
# GPU Configuration
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Device: {device}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"CUDA Version: {torch.version.cuda}")
    print(f"Memory: {torch.cuda.get_device_properties(0).total_mem / 1024**3:.1f} GB")

# %% [markdown]
# ## 2. Dataset Loading & Analysis

# %%
from cardiac_data_loader import (
    create_cardiac_dataloaders, CardiacECGImageDataset,
    CLASS_NAMES, NUM_CLASSES, CLINICAL_DESCRIPTIONS,
    get_val_transforms, find_dataset_root,
    IMAGENET_MEAN, IMAGENET_STD,
)

# Create dataloaders with holdout extraction
data = create_cardiac_dataloaders(
    batch_size=32,
    image_size=224,
    num_workers=2,
    holdout_per_class=30,
    val_split=0.15,
    seed=42,
)

train_loader = data['train_loader']
val_loader = data['val_loader']
test_loader = data['test_loader']
class_weights = data['class_weights'].to(device)
dataset_summary = data['dataset_summary']

print("\n=== DATASET SUMMARY ===")
for k, v in dataset_summary.items():
    if not isinstance(v, (dict, list)):
        print(f"  {k}: {v}")
print(f"\n  Train distribution: {dataset_summary['train_distribution']}")
print(f"  Test distribution: {dataset_summary['test_distribution']}")
print(f"  Class weights: {[f'{w:.3f}' for w in class_weights.cpu().tolist()]}")

# %%
# Visualize sample images from each class
def show_sample_images(loader, class_names, n_per_class=3):
    """Display sample ECG images from each class."""
    fig, axes = plt.subplots(NUM_CLASSES, n_per_class, figsize=(4*n_per_class, 4*NUM_CLASSES))
    fig.suptitle('Sample ECG Images per Class', fontsize=18, fontweight='bold', y=0.98)
    
    class_images = {i: [] for i in range(NUM_CLASSES)}
    
    for images, labels, paths in loader:
        for img, lbl in zip(images, labels):
            lbl_int = lbl.item()
            if len(class_images[lbl_int]) < n_per_class:
                class_images[lbl_int].append(img)
        if all(len(v) >= n_per_class for v in class_images.values()):
            break
    
    mean = torch.tensor(IMAGENET_MEAN).view(3, 1, 1)
    std = torch.tensor(IMAGENET_STD).view(3, 1, 1)
    
    for class_idx in range(NUM_CLASSES):
        for img_idx, img in enumerate(class_images[class_idx][:n_per_class]):
            ax = axes[class_idx, img_idx] if NUM_CLASSES > 1 else axes[img_idx]
            # Denormalize
            img_denorm = img * std + mean
            img_denorm = torch.clamp(img_denorm, 0, 1)
            ax.imshow(img_denorm.permute(1, 2, 0).numpy())
            ax.set_title(f'{class_names[class_idx]}', fontsize=11, fontweight='bold')
            ax.axis('off')
    
    plt.tight_layout()
    plt.savefig(GRAPHS_DIR / 'sample_ecg_images.png', dpi=150, bbox_inches='tight')
    plt.show()
    print(f"Saved: {GRAPHS_DIR / 'sample_ecg_images.png'}")

show_sample_images(train_loader, CLASS_NAMES)

# %% [markdown]
# ## 3. Model Architecture — ResNet-18 Fine-Tuned

# %%
def build_classical_model(num_classes: int = 4, pretrained: bool = True) -> nn.Module:
    """
    Build the CX-01 Cardiac Classical Model.
    
    Architecture:
        ResNet-18 (ImageNet pretrained) backbone
        → Global Average Pooling (already in ResNet)
        → Dropout(0.3)
        → FC(512 → 256) → ReLU → Dropout(0.2)
        → FC(256 → num_classes)
    
    The ResNet-18 backbone provides robust image feature extraction
    pre-trained on 1.2M ImageNet images, then fine-tuned on ECG images.
    """
    model = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1 if pretrained else None)
    
    # Replace the final FC layer with our custom head
    in_features = model.fc.in_features  # 512 for ResNet-18
    model.fc = nn.Sequential(
        nn.Dropout(0.3),
        nn.Linear(in_features, 256),
        nn.ReLU(inplace=True),
        nn.Dropout(0.2),
        nn.Linear(256, num_classes),
    )
    
    return model


model = build_classical_model(num_classes=NUM_CLASSES).to(device)

# Count parameters
total_params = sum(p.numel() for p in model.parameters())
trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
print(f"Total parameters: {total_params:,}")
print(f"Trainable parameters: {trainable_params:,}")
print(f"\nModel Architecture:")
print(model)

# %% [markdown]
# ## 4. Training Configuration

# %%
# Hyperparameters
NUM_EPOCHS = 30
LEARNING_RATE = 1e-3
WEIGHT_DECAY = 1e-4
PATIENCE = 8  # Early stopping patience

# Loss function with class weights
criterion = nn.CrossEntropyLoss(weight=class_weights)

# Optimizer — Adam with weight decay
optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)

# Learning rate scheduler — Cosine Annealing
scheduler = CosineAnnealingLR(optimizer, T_max=NUM_EPOCHS, eta_min=1e-6)

print(f"Epochs: {NUM_EPOCHS}")
print(f"Learning Rate: {LEARNING_RATE}")
print(f"Weight Decay: {WEIGHT_DECAY}")
print(f"Optimizer: Adam")
print(f"Scheduler: CosineAnnealingLR (T_max={NUM_EPOCHS})")
print(f"Loss: CrossEntropyLoss (class-weighted)")
print(f"Class Weights: {class_weights.cpu().tolist()}")

# %% [markdown]
# ## 5. Training Loop

# %%
def train_one_epoch(model, loader, criterion, optimizer, device):
    """Train for one epoch, return avg loss and accuracy."""
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0
    
    for images, labels, _ in loader:
        images, labels = images.to(device), labels.to(device)
        
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item() * images.size(0)
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()
    
    return running_loss / total, 100.0 * correct / total


def evaluate(model, loader, criterion, device):
    """Evaluate model, return avg loss, accuracy, all preds and true labels."""
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0
    all_preds = []
    all_labels = []
    all_probs = []
    
    with torch.no_grad():
        for images, labels, _ in loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)
            
            running_loss += loss.item() * images.size(0)
            probs = torch.softmax(outputs, dim=1)
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
            
            all_preds.extend(predicted.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
            all_probs.extend(probs.cpu().numpy())
    
    return (
        running_loss / total,
        100.0 * correct / total,
        np.array(all_preds),
        np.array(all_labels),
        np.array(all_probs),
    )


# %%
# Training history
history = {
    'train_loss': [], 'val_loss': [],
    'train_acc': [], 'val_acc': [],
    'lr': [],
}

best_val_acc = 0.0
best_model_state = None
patience_counter = 0
training_start = time.time()

print("=" * 80)
print("TRAINING CX-01 CARDIAC CLASSICAL MODEL")
print("=" * 80)

for epoch in range(NUM_EPOCHS):
    epoch_start = time.time()
    
    # Train
    train_loss, train_acc = train_one_epoch(model, train_loader, criterion, optimizer, device)
    
    # Validate
    val_loss, val_acc, _, _, _ = evaluate(model, val_loader, criterion, device)
    
    # Step scheduler
    scheduler.step()
    current_lr = optimizer.param_groups[0]['lr']
    
    # Record history
    history['train_loss'].append(train_loss)
    history['val_loss'].append(val_loss)
    history['train_acc'].append(train_acc)
    history['val_acc'].append(val_acc)
    history['lr'].append(current_lr)
    
    epoch_time = time.time() - epoch_start
    
    # Check for best model
    if val_acc > best_val_acc:
        best_val_acc = val_acc
        best_model_state = copy.deepcopy(model.state_dict())
        patience_counter = 0
        marker = " ★ BEST"
    else:
        patience_counter += 1
        marker = ""
    
    print(f"Epoch [{epoch+1:02d}/{NUM_EPOCHS}] "
          f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.2f}% | "
          f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.2f}% | "
          f"LR: {current_lr:.6f} | Time: {epoch_time:.1f}s{marker}")
    
    # Early stopping
    if patience_counter >= PATIENCE:
        print(f"\nEarly stopping at epoch {epoch+1} (patience={PATIENCE})")
        break

training_time = time.time() - training_start
print(f"\nTraining completed in {training_time:.1f}s ({training_time/60:.1f} min)")
print(f"Best validation accuracy: {best_val_acc:.2f}%")

# Load best model
model.load_state_dict(best_model_state)

# %% [markdown]
# ## 6. Save Model Artifacts

# %%
# Save the trained model
model_path = ARTIFACTS_DIR / 'cardiac_cnn_production.pt'
torch.save({
    'model_state_dict': best_model_state,
    'class_names': CLASS_NAMES,
    'num_classes': NUM_CLASSES,
    'architecture': 'ResNet-18 + Custom FC Head',
    'image_size': 224,
    'total_params': total_params,
    'trainable_params': trainable_params,
    'best_val_acc': best_val_acc,
    'training_epochs': len(history['train_loss']),
    'training_time_seconds': training_time,
}, model_path)
print(f"Model saved: {model_path}")

# Save encoder (frozen backbone) for quantum pipeline
encoder = copy.deepcopy(model)
encoder.fc = nn.Identity()  # Remove FC head, keep feature extractor
encoder_path = ARTIFACTS_DIR / 'cardiac_encoder.pt'
torch.save({
    'model_state_dict': encoder.state_dict(),
    'output_dim': 512,  # ResNet-18 outputs 512-dim features
}, encoder_path)
print(f"Encoder saved: {encoder_path}")

# %% [markdown]
# ## 7. Test Set Evaluation & Metrics

# %%
# Final evaluation on test set
test_loss, test_acc, test_preds, test_labels, test_probs = evaluate(
    model, test_loader, criterion, device
)

print(f"\n{'='*60}")
print(f"TEST SET RESULTS (CX-01 Classical Cardiac)")
print(f"{'='*60}")
print(f"Test Accuracy: {test_acc:.2f}%")
print(f"Test Loss: {test_loss:.4f}")

# Classification report
report = classification_report(
    test_labels, test_preds,
    target_names=CLASS_NAMES,
    digits=4,
    output_dict=True,
)
print(f"\nClassification Report:")
print(classification_report(test_labels, test_preds, target_names=CLASS_NAMES, digits=4))

# Matthews Correlation Coefficient
mcc = matthews_corrcoef(test_labels, test_preds)
print(f"Matthews Correlation Coefficient (MCC): {mcc:.4f}")

# Per-class metrics
precision, recall, f1, support = precision_recall_fscore_support(
    test_labels, test_preds, average=None
)

# %% [markdown]
# ## 8. Generate All Training Graphs

# %%
# === GRAPH 1: Training & Validation Loss Curves ===
fig, ax = plt.subplots(figsize=(12, 6))
epochs_range = range(1, len(history['train_loss']) + 1)
ax.plot(epochs_range, history['train_loss'], 'b-', linewidth=2, label='Training Loss', marker='o', markersize=4)
ax.plot(epochs_range, history['val_loss'], 'r-', linewidth=2, label='Validation Loss', marker='s', markersize=4)
ax.set_xlabel('Epoch', fontsize=14)
ax.set_ylabel('Loss', fontsize=14)
ax.set_title('CX-01 Cardiac: Training & Validation Loss', fontsize=16, fontweight='bold')
ax.legend(fontsize=12)
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig(GRAPHS_DIR / 'classical_loss_curves.png', dpi=150, bbox_inches='tight')
plt.show()
print(f"Saved: classical_loss_curves.png")

# %%
# === GRAPH 2: Training & Validation Accuracy Curves ===
fig, ax = plt.subplots(figsize=(12, 6))
ax.plot(epochs_range, history['train_acc'], 'b-', linewidth=2, label='Training Accuracy', marker='o', markersize=4)
ax.plot(epochs_range, history['val_acc'], 'r-', linewidth=2, label='Validation Accuracy', marker='s', markersize=4)
ax.axhline(y=best_val_acc, color='g', linestyle='--', alpha=0.7, label=f'Best Val Acc: {best_val_acc:.2f}%')
ax.set_xlabel('Epoch', fontsize=14)
ax.set_ylabel('Accuracy (%)', fontsize=14)
ax.set_title('CX-01 Cardiac: Training & Validation Accuracy', fontsize=16, fontweight='bold')
ax.legend(fontsize=12)
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig(GRAPHS_DIR / 'classical_accuracy_curves.png', dpi=150, bbox_inches='tight')
plt.show()
print(f"Saved: classical_accuracy_curves.png")

# %%
# === GRAPH 3: Learning Rate Schedule ===
fig, ax = plt.subplots(figsize=(12, 4))
ax.plot(epochs_range, history['lr'], 'g-', linewidth=2, marker='d', markersize=4)
ax.set_xlabel('Epoch', fontsize=14)
ax.set_ylabel('Learning Rate', fontsize=14)
ax.set_title('CX-01 Cardiac: Learning Rate Schedule (Cosine Annealing)', fontsize=16, fontweight='bold')
ax.set_yscale('log')
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig(GRAPHS_DIR / 'classical_lr_schedule.png', dpi=150, bbox_inches='tight')
plt.show()
print(f"Saved: classical_lr_schedule.png")

# %%
# === GRAPH 4: Confusion Matrix (4×4) ===
cm = confusion_matrix(test_labels, test_preds)
fig, ax = plt.subplots(figsize=(10, 8))
sns.heatmap(
    cm, annot=True, fmt='d', cmap='Blues',
    xticklabels=CLASS_NAMES, yticklabels=CLASS_NAMES,
    ax=ax, linewidths=0.5, linecolor='white',
    annot_kws={'size': 14, 'weight': 'bold'},
)
ax.set_xlabel('Predicted Label', fontsize=14)
ax.set_ylabel('True Label', fontsize=14)
ax.set_title('CX-01 Cardiac: Confusion Matrix (Test Set)', fontsize=16, fontweight='bold')
plt.tight_layout()
plt.savefig(GRAPHS_DIR / 'classical_confusion_matrix.png', dpi=150, bbox_inches='tight')
plt.show()
print(f"Saved: classical_confusion_matrix.png")

# %%
# === GRAPH 5: Normalized Confusion Matrix ===
cm_norm = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]
fig, ax = plt.subplots(figsize=(10, 8))
sns.heatmap(
    cm_norm, annot=True, fmt='.3f', cmap='YlOrRd',
    xticklabels=CLASS_NAMES, yticklabels=CLASS_NAMES,
    ax=ax, linewidths=0.5, linecolor='white',
    annot_kws={'size': 14, 'weight': 'bold'},
    vmin=0, vmax=1,
)
ax.set_xlabel('Predicted Label', fontsize=14)
ax.set_ylabel('True Label', fontsize=14)
ax.set_title('CX-01 Cardiac: Normalized Confusion Matrix (Test Set)', fontsize=16, fontweight='bold')
plt.tight_layout()
plt.savefig(GRAPHS_DIR / 'classical_confusion_matrix_normalized.png', dpi=150, bbox_inches='tight')
plt.show()
print(f"Saved: classical_confusion_matrix_normalized.png")

# %%
# === GRAPH 6: Per-Class Precision, Recall, F1 Bar Chart ===
x = np.arange(NUM_CLASSES)
width = 0.25

fig, ax = plt.subplots(figsize=(14, 7))
bars1 = ax.bar(x - width, precision, width, label='Precision', color='#2196F3', edgecolor='white')
bars2 = ax.bar(x, recall, width, label='Recall', color='#4CAF50', edgecolor='white')
bars3 = ax.bar(x + width, f1, width, label='F1-Score', color='#FF9800', edgecolor='white')

ax.set_xlabel('Class', fontsize=14)
ax.set_ylabel('Score', fontsize=14)
ax.set_title('CX-01 Cardiac: Per-Class Precision, Recall & F1-Score', fontsize=16, fontweight='bold')
ax.set_xticks(x)
ax.set_xticklabels(CLASS_NAMES, fontsize=11)
ax.legend(fontsize=12)
ax.set_ylim(0, 1.15)
ax.grid(True, alpha=0.3, axis='y')

# Add value labels
for bars in [bars1, bars2, bars3]:
    for bar in bars:
        height = bar.get_height()
        ax.annotate(f'{height:.3f}', xy=(bar.get_x() + bar.get_width() / 2, height),
                    xytext=(0, 3), textcoords="offset points", ha='center', va='bottom', fontsize=9)

plt.tight_layout()
plt.savefig(GRAPHS_DIR / 'classical_per_class_metrics.png', dpi=150, bbox_inches='tight')
plt.show()
print(f"Saved: classical_per_class_metrics.png")

# %%
# === GRAPH 7: ROC-AUC Curves (One-vs-Rest) ===
test_labels_bin = label_binarize(test_labels, classes=list(range(NUM_CLASSES)))

fig, ax = plt.subplots(figsize=(10, 8))
colors = ['#2196F3', '#F44336', '#FF9800', '#4CAF50']

for i in range(NUM_CLASSES):
    fpr, tpr, _ = roc_curve(test_labels_bin[:, i], test_probs[:, i])
    roc_auc = auc(fpr, tpr)
    ax.plot(fpr, tpr, color=colors[i], linewidth=2,
            label=f'{CLASS_NAMES[i]} (AUC = {roc_auc:.4f})')

ax.plot([0, 1], [0, 1], 'k--', alpha=0.5, linewidth=1)
ax.set_xlabel('False Positive Rate', fontsize=14)
ax.set_ylabel('True Positive Rate', fontsize=14)
ax.set_title('CX-01 Cardiac: ROC Curves (One-vs-Rest)', fontsize=16, fontweight='bold')
ax.legend(fontsize=11, loc='lower right')
ax.grid(True, alpha=0.3)
ax.set_xlim([-0.02, 1.02])
ax.set_ylim([-0.02, 1.02])
plt.tight_layout()
plt.savefig(GRAPHS_DIR / 'classical_roc_curves.png', dpi=150, bbox_inches='tight')
plt.show()
print(f"Saved: classical_roc_curves.png")

# %% [markdown]
# ## 9. Grad-CAM Visualization

# %%
class GradCAM:
    """
    Grad-CAM implementation for ECG image localization.
    Highlights which regions of the ECG strip contributed to the model's prediction.
    """
    
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        
        # Register hooks
        target_layer.register_forward_hook(self._forward_hook)
        target_layer.register_full_backward_hook(self._backward_hook)
    
    def _forward_hook(self, module, input, output):
        self.activations = output.detach()
    
    def _backward_hook(self, module, grad_input, grad_output):
        self.gradients = grad_output[0].detach()
    
    def generate(self, input_tensor, target_class=None):
        """Generate Grad-CAM heatmap for the given input."""
        self.model.eval()
        output = self.model(input_tensor)
        
        if target_class is None:
            target_class = output.argmax(dim=1).item()
        
        self.model.zero_grad()
        one_hot = torch.zeros_like(output)
        one_hot[0, target_class] = 1.0
        output.backward(gradient=one_hot, retain_graph=True)
        
        # Pool gradients across spatial dimensions
        weights = self.gradients.mean(dim=[2, 3], keepdim=True)
        
        # Weighted combination of activation maps
        cam = (weights * self.activations).sum(dim=1, keepdim=True)
        cam = torch.relu(cam)
        
        # Normalize to [0, 1]
        cam = cam - cam.min()
        if cam.max() > 0:
            cam = cam / cam.max()
        
        # Resize to input image size
        cam = torch.nn.functional.interpolate(
            cam, size=input_tensor.shape[2:], mode='bilinear', align_corners=False
        )
        
        return cam.squeeze().cpu().numpy(), output

# %%
# Generate Grad-CAM heatmaps for test images
target_layer = model.layer4[-1]  # Last conv block of ResNet-18
grad_cam = GradCAM(model, target_layer)

mean = torch.tensor(IMAGENET_MEAN).view(3, 1, 1)
std = torch.tensor(IMAGENET_STD).view(3, 1, 1)

# Collect sample images from each class
class_samples = {i: [] for i in range(NUM_CLASSES)}
for images, labels, paths in test_loader:
    for img, lbl, path in zip(images, labels, paths):
        lbl_int = lbl.item()
        if len(class_samples[lbl_int]) < 3:
            class_samples[lbl_int].append((img, lbl_int, path))
    if all(len(v) >= 3 for v in class_samples.values()):
        break

# Generate Grad-CAM grid
fig, axes = plt.subplots(NUM_CLASSES, 6, figsize=(30, 5*NUM_CLASSES))
fig.suptitle('CX-01 Cardiac: Grad-CAM Heatmap Localization', fontsize=20, fontweight='bold', y=1.0)

for class_idx in range(NUM_CLASSES):
    for sample_idx, (img, lbl, path) in enumerate(class_samples[class_idx][:3]):
        # Original image
        ax_orig = axes[class_idx, sample_idx * 2]
        img_denorm = img * std + mean
        img_denorm = torch.clamp(img_denorm, 0, 1)
        ax_orig.imshow(img_denorm.permute(1, 2, 0).numpy())
        ax_orig.set_title(f'{CLASS_NAMES[class_idx]}\n(Original)', fontsize=11)
        ax_orig.axis('off')
        
        # Grad-CAM overlay
        ax_cam = axes[class_idx, sample_idx * 2 + 1]
        input_tensor = img.unsqueeze(0).to(device)
        heatmap, output = grad_cam.generate(input_tensor, target_class=lbl)
        confidence = torch.softmax(output, dim=1)[0, lbl].item()
        
        ax_cam.imshow(img_denorm.permute(1, 2, 0).numpy())
        ax_cam.imshow(heatmap, alpha=0.5, cmap='jet')
        ax_cam.set_title(f'Grad-CAM\nConf: {confidence:.1%}', fontsize=11)
        ax_cam.axis('off')

plt.tight_layout()
plt.savefig(GRAPHS_DIR / 'classical_gradcam_examples.png', dpi=150, bbox_inches='tight')
plt.show()
print(f"Saved: classical_gradcam_examples.png")

# %% [markdown]
# ## 10. Holdout Evaluation

# %%
# Evaluate on holdout images (completely unseen during training)
holdout_results = []
model.eval()
val_transform = get_val_transforms(224)

for class_abbrev_dir in sorted(HOLDOUT_DIR.iterdir()):
    if not class_abbrev_dir.is_dir():
        continue
    
    class_name = class_abbrev_dir.name
    valid_ext = {'.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.webp'}
    
    for img_file in sorted(class_abbrev_dir.iterdir()):
        if img_file.suffix.lower() not in valid_ext:
            continue
        
        try:
            image = Image.open(img_file).convert('RGB')
            tensor = val_transform(image).unsqueeze(0).to(device)
            
            with torch.no_grad():
                output = model(tensor)
                probs = torch.softmax(output, dim=1)
                pred_class = output.argmax(dim=1).item()
                confidence = probs[0, pred_class].item()
            
            holdout_results.append({
                'file': img_file.name,
                'true_class': class_name,
                'predicted_class': CLASS_NAMES[pred_class],
                'confidence': confidence,
                'correct': class_name.lower() in CLASS_NAMES[pred_class].lower() or 
                           CLASS_NAMES[pred_class].lower() in class_name.lower(),
                'probabilities': probs[0].cpu().tolist(),
            })
        except Exception as e:
            print(f"Error processing {img_file}: {e}")

if holdout_results:
    correct_count = sum(1 for r in holdout_results if r['correct'])
    total_count = len(holdout_results)
    holdout_accuracy = 100.0 * correct_count / total_count
    
    print(f"\n{'='*60}")
    print(f"HOLDOUT EVALUATION (Completely Unseen Images)")
    print(f"{'='*60}")
    print(f"Total Images: {total_count}")
    print(f"Correct: {correct_count}")
    print(f"Holdout Accuracy: {holdout_accuracy:.2f}%")
    
    for r in holdout_results:
        status = "✓" if r['correct'] else "✗"
        print(f"  {status} {r['file']}: True={r['true_class']}, "
              f"Pred={r['predicted_class']} ({r['confidence']:.1%})")
else:
    holdout_accuracy = 0.0
    print("No holdout images found. Place ECG images in the holdout directory.")

# %% [markdown]
# ## 11. Generate Benchmark Report

# %%
# Compute all AUC values
auc_scores = {}
for i in range(NUM_CLASSES):
    fpr, tpr, _ = roc_curve(test_labels_bin[:, i], test_probs[:, i])
    auc_scores[CLASS_NAMES[i]] = float(auc(fpr, tpr))

macro_auc = np.mean(list(auc_scores.values()))

# Build comprehensive benchmark report
benchmark_report = {
    "model_name": "CX-01 Cardiac Classical",
    "model_type": "classical",
    "architecture": "ResNet-18 (ImageNet pretrained) + Custom FC Head",
    "disease": "Heart Attack / Cardiac Arrhythmia",
    "test_type": "12-Lead ECG Paper-Strip Image",
    "dataset": dataset_summary,
    "training": {
        "epochs_trained": len(history['train_loss']),
        "epochs_max": NUM_EPOCHS,
        "training_time_seconds": round(training_time, 2),
        "learning_rate": LEARNING_RATE,
        "weight_decay": WEIGHT_DECAY,
        "optimizer": "Adam",
        "scheduler": "CosineAnnealingLR",
        "batch_size": 32,
        "early_stopping_patience": PATIENCE,
        "gpu": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU",
    },
    "parameters": {
        "total": total_params,
        "trainable": trainable_params,
    },
    "metrics": {
        "test_accuracy": round(test_acc, 4),
        "test_loss": round(test_loss, 6),
        "macro_f1": round(float(f1_score(test_labels, test_preds, average='macro')), 4),
        "weighted_f1": round(float(f1_score(test_labels, test_preds, average='weighted')), 4),
        "mcc": round(float(mcc), 4),
        "macro_auc": round(float(macro_auc), 4),
        "per_class_auc": {k: round(v, 4) for k, v in auc_scores.items()},
        "per_class_precision": {CLASS_NAMES[i]: round(float(precision[i]), 4) for i in range(NUM_CLASSES)},
        "per_class_recall": {CLASS_NAMES[i]: round(float(recall[i]), 4) for i in range(NUM_CLASSES)},
        "per_class_f1": {CLASS_NAMES[i]: round(float(f1[i]), 4) for i in range(NUM_CLASSES)},
        "confusion_matrix": cm.tolist(),
        "best_val_accuracy": round(best_val_acc, 4),
        "holdout_accuracy": round(holdout_accuracy, 4) if holdout_results else None,
    },
    "training_history": {
        "train_loss": [round(x, 6) for x in history['train_loss']],
        "val_loss": [round(x, 6) for x in history['val_loss']],
        "train_acc": [round(x, 4) for x in history['train_acc']],
        "val_acc": [round(x, 4) for x in history['val_acc']],
    },
    "graphs": [
        "classical_loss_curves.png",
        "classical_accuracy_curves.png",
        "classical_lr_schedule.png",
        "classical_confusion_matrix.png",
        "classical_confusion_matrix_normalized.png",
        "classical_per_class_metrics.png",
        "classical_roc_curves.png",
        "classical_gradcam_examples.png",
        "sample_ecg_images.png",
    ],
    "generated_at": datetime.now().isoformat(),
}

# Save benchmark report
report_path = ARTIFACTS_DIR / 'cardiac_benchmark_report.json'
with open(report_path, 'w') as f:
    json.dump(benchmark_report, f, indent=2)
print(f"\nBenchmark report saved: {report_path}")

# %%
# Print summary
print(f"\n{'='*60}")
print(f"CX-01 CARDIAC CLASSICAL MODEL — TRAINING COMPLETE")
print(f"{'='*60}")
print(f"Test Accuracy:      {test_acc:.2f}%")
print(f"Macro F1-Score:     {f1_score(test_labels, test_preds, average='macro'):.4f}")
print(f"Macro AUC-ROC:      {macro_auc:.4f}")
print(f"MCC:                {mcc:.4f}")
print(f"Training Time:      {training_time:.1f}s")
print(f"Parameters:         {total_params:,}")
print(f"Model saved:        {model_path}")
print(f"Encoder saved:      {encoder_path}")
print(f"Report saved:       {report_path}")
print(f"Graphs saved:       {GRAPHS_DIR}")
print(f"{'='*60}")
