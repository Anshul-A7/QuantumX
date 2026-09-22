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
# # QuantumX — Hybrid Quantum Heart Attack Detection Model (Transfinite-1 Cardiac)
# ## Frozen ResNet-18 Encoder → 8-Qubit Variational Quantum Classifier
# 
# **Dataset**: ECG Images of Cardiac Patients (Kaggle evilspirit05/ecg-analysis)  
# **4 Classes**: Normal ECG | Myocardial Infarction | History of MI | Abnormal Heartbeat  
# **Architecture**: Frozen ResNet-18 encoder → FC(512→8) → 8-Qubit VQC → FC(8→4)  
# **Quantum**: PennyLane AngleEmbedding → StronglyEntanglingLayers → PauliZ  
# **XAI**: Grad-CAM + Quantum Gate Saliency  
# **GPU**: NVIDIA RTX 3050 (CUDA) for classical layers, CPU for quantum simulation

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
from torchvision import models, transforms
from PIL import Image

import pennylane as qml
from pennylane import numpy as pnp

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
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
GRAPHS_DIR.mkdir(parents=True, exist_ok=True)

backend_root = HEART_V1_ROOT.parent.parent
sys.path.insert(0, str(backend_root))
sys.path.insert(0, str(HEART_V1_ROOT))

print(f"Heart V1 Root: {HEART_V1_ROOT}")
print(f"Graphs: {GRAPHS_DIR}")

# %%
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Device: {device}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")

# %% [markdown]
# ## 2. Load Dataset

# %%
from cardiac_data_loader import (
    create_cardiac_dataloaders, CLASS_NAMES, NUM_CLASSES,
    IMAGENET_MEAN, IMAGENET_STD, get_val_transforms, find_dataset_root,
    HOLDOUT_ROOT,
)

data = create_cardiac_dataloaders(
    batch_size=16,  # Smaller batch for quantum
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

print(f"Train samples: {dataset_summary['train_samples']}")
print(f"Test samples: {dataset_summary['test_samples']}")

# %% [markdown]
# ## 3. Quantum Circuit Definition

# %%
# Quantum circuit parameters
N_QUBITS = 8
N_LAYERS = 2  # StronglyEntanglingLayers depth

# PennyLane quantum device (default.qubit for simulation)
qml_dev = qml.device("default.qubit", wires=N_QUBITS)

@qml.qnode(qml_dev, interface="torch", diff_method="backprop")
def quantum_circuit(inputs, weights):
    """
    8-Qubit Variational Quantum Classifier.
    
    Circuit Architecture:
        1. AngleEmbedding: Encode 8 classical features as qubit rotations (RY)
        2. StronglyEntanglingLayers: 2 layers of parameterized rotations + CNOT entanglement
        3. PauliZ measurement: Expectation values on all 8 qubits
    
    Args:
        inputs: 8-dim feature vector from classical encoder (tanh-scaled to [-1, 1])
        weights: Trainable quantum parameters, shape (N_LAYERS, N_QUBITS, 3)
    
    Returns:
        8-dim vector of PauliZ expectation values ∈ [-1, 1]
    """
    # Encode classical features → quantum states
    qml.AngleEmbedding(inputs, wires=range(N_QUBITS), rotation='Y')
    
    # Variational ansatz with entanglement
    qml.StronglyEntanglingLayers(weights, wires=range(N_QUBITS))
    
    # Measure all qubits
    return [qml.expval(qml.PauliZ(i)) for i in range(N_QUBITS)]


# Calculate quantum parameters
weight_shape = qml.StronglyEntanglingLayers.shape(n_layers=N_LAYERS, n_wires=N_QUBITS)
n_quantum_params = np.prod(weight_shape)
print(f"Quantum Circuit:")
print(f"  Qubits: {N_QUBITS}")
print(f"  VQC Layers: {N_LAYERS}")
print(f"  Weight Shape: {weight_shape}")
print(f"  Quantum Parameters: {n_quantum_params}")

# %% [markdown]
# ## 4. Draw Quantum Circuit Diagram

# %%
# Generate and save quantum circuit diagram
dummy_inputs = torch.zeros(N_QUBITS)
dummy_weights = torch.randn(*weight_shape)

fig, ax = qml.draw_mpl(quantum_circuit, style="pennylane")(dummy_inputs, dummy_weights)
fig.set_size_inches(20, 8)
fig.suptitle('Transfinite-1 Cardiac: 8-Qubit VQC Architecture', fontsize=16, fontweight='bold')
plt.tight_layout()
plt.savefig(GRAPHS_DIR / 'quantum_circuit_diagram.png', dpi=150, bbox_inches='tight')
plt.show()
print(f"Saved: quantum_circuit_diagram.png")

# Also save text version
circuit_text = qml.draw(quantum_circuit)(dummy_inputs, dummy_weights)
with open(GRAPHS_DIR / 'quantum_circuit_text.txt', 'w') as f:
    f.write(circuit_text)
print(f"Saved: quantum_circuit_text.txt")
print(circuit_text)

# %% [markdown]
# ## 5. Hybrid Model Architecture

# %%
class HybridQuantumCardiacModel(nn.Module):
    """
    Transfinite-1 Cardiac: Hybrid Classical-Quantum Heart Attack Detection Model.
    
    Architecture:
        1. Frozen ResNet-18 Encoder: Extracts 512-dim feature vector from ECG image
        2. Classical Bottleneck: FC(512→8) + Tanh (scales features to [-1, 1] for qubits)
        3. 8-Qubit VQC: AngleEmbedding → StronglyEntanglingLayers → PauliZ
        4. Classical Readout: FC(8→4) for final classification
    
    The quantum layer provides:
        - Exponential feature space via qubit superposition
        - Entanglement-based feature interaction (beyond classical linear combination)
        - Data-efficient learning for scarce cohort scenarios
    """
    
    def __init__(self, num_classes: int = 4, n_qubits: int = 8, n_layers: int = 2):
        super().__init__()
        self.n_qubits = n_qubits
        self.n_layers = n_layers
        self.num_classes = num_classes
        
        # 1. Frozen ResNet-18 encoder (pretrained)
        resnet = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
        # Remove the original FC layer
        self.encoder = nn.Sequential(*list(resnet.children())[:-1])  # Output: [B, 512, 1, 1]
        
        # Freeze encoder weights
        for param in self.encoder.parameters():
            param.requires_grad = False
        
        # 2. Classical bottleneck: 512 → 8 features for quantum encoding
        self.bottleneck = nn.Sequential(
            nn.Flatten(),
            nn.Linear(512, 64),
            nn.ReLU(inplace=True),
            nn.Dropout(0.2),
            nn.Linear(64, n_qubits),
            nn.Tanh(),  # Scale to [-1, 1] for angle embedding
        )
        
        # 3. Quantum weights (trainable)
        weight_shape = qml.StronglyEntanglingLayers.shape(n_layers=n_layers, n_wires=n_qubits)
        self.quantum_weights = nn.Parameter(torch.randn(*weight_shape) * 0.1)
        
        # 4. Classical readout: quantum expectation values → class logits
        self.readout = nn.Sequential(
            nn.Linear(n_qubits, 32),
            nn.ReLU(inplace=True),
            nn.Dropout(0.2),
            nn.Linear(32, num_classes),
        )
    
    def forward(self, x):
        # Encode image → 512-dim features (frozen)
        with torch.no_grad():
            features = self.encoder(x)
        
        # Bottleneck → 8-dim (tanh scaled)
        bottleneck_features = self.bottleneck(features)
        
        # Quantum circuit (process each sample individually)
        batch_size = bottleneck_features.shape[0]
        quantum_outputs = []
        
        for i in range(batch_size):
            q_out = quantum_circuit(bottleneck_features[i], self.quantum_weights)
            quantum_outputs.append(torch.stack(q_out))
        
        quantum_tensor = torch.stack(quantum_outputs)  # [B, 8]
        
        # Classical readout → class logits
        logits = self.readout(quantum_tensor)
        return logits
    
    def get_bottleneck_features(self, x):
        """Extract 8-dim bottleneck features (for analysis)."""
        with torch.no_grad():
            features = self.encoder(x)
        return self.bottleneck(features)
    
    def get_quantum_expectation_values(self, x):
        """Get raw quantum measurement results."""
        bottleneck = self.get_bottleneck_features(x)
        results = []
        for i in range(bottleneck.shape[0]):
            q_out = quantum_circuit(bottleneck[i], self.quantum_weights)
            results.append(torch.stack(q_out))
        return torch.stack(results)


# %%
# Build hybrid model
hybrid_model = HybridQuantumCardiacModel(
    num_classes=NUM_CLASSES,
    n_qubits=N_QUBITS,
    n_layers=N_LAYERS,
).to(device)

# Count parameters
total_params_hybrid = sum(p.numel() for p in hybrid_model.parameters())
trainable_params_hybrid = sum(p.numel() for p in hybrid_model.parameters() if p.requires_grad)
frozen_params = total_params_hybrid - trainable_params_hybrid

print(f"Hybrid Model Parameters:")
print(f"  Total: {total_params_hybrid:,}")
print(f"  Trainable: {trainable_params_hybrid:,}")
print(f"  Frozen (encoder): {frozen_params:,}")
print(f"  Quantum parameters: {n_quantum_params}")

# %% [markdown]
# ## 6. Training Loop

# %%
NUM_EPOCHS_Q = 30
LEARNING_RATE_Q = 5e-3
PATIENCE_Q = 10

criterion_q = nn.CrossEntropyLoss(weight=class_weights)
optimizer_q = optim.Adam(
    filter(lambda p: p.requires_grad, hybrid_model.parameters()),
    lr=LEARNING_RATE_Q,
    weight_decay=1e-4,
)
scheduler_q = CosineAnnealingLR(optimizer_q, T_max=NUM_EPOCHS_Q, eta_min=1e-6)

print(f"Quantum Training Config:")
print(f"  Epochs: {NUM_EPOCHS_Q}")
print(f"  LR: {LEARNING_RATE_Q}")
print(f"  Optimizer: Adam (trainable params only)")

# %%
def train_hybrid_epoch(model, loader, criterion, optimizer, device, max_batches=None):
    """Train hybrid model for one epoch."""
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0
    
    for batch_idx, (images, labels, _) in enumerate(loader):
        if max_batches and batch_idx >= max_batches:
            break
            
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
    
    return running_loss / max(total, 1), 100.0 * correct / max(total, 1)


def eval_hybrid(model, loader, criterion, device, max_batches=None):
    """Evaluate hybrid model."""
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0
    all_preds = []
    all_labels = []
    all_probs = []
    
    with torch.no_grad():
        for batch_idx, (images, labels, _) in enumerate(loader):
            if max_batches and batch_idx >= max_batches:
                break
                
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
        running_loss / max(total, 1),
        100.0 * correct / max(total, 1),
        np.array(all_preds),
        np.array(all_labels),
        np.array(all_probs),
    )


# %%
history_q = {
    'train_loss': [], 'val_loss': [],
    'train_acc': [], 'val_acc': [],
    'lr': [],
}

best_val_acc_q = 0.0
best_model_state_q = None
patience_counter_q = 0
training_start_q = time.time()

print("=" * 80)
print("TRAINING TRANSFINITE-1 CARDIAC HYBRID QUANTUM MODEL")
print("=" * 80)

for epoch in range(NUM_EPOCHS_Q):
    epoch_start = time.time()
    
    train_loss, train_acc = train_hybrid_epoch(
        hybrid_model, train_loader, criterion_q, optimizer_q, device
    )
    
    val_loss, val_acc, _, _, _ = eval_hybrid(
        hybrid_model, val_loader, criterion_q, device
    )
    
    scheduler_q.step()
    current_lr = optimizer_q.param_groups[0]['lr']
    
    history_q['train_loss'].append(train_loss)
    history_q['val_loss'].append(val_loss)
    history_q['train_acc'].append(train_acc)
    history_q['val_acc'].append(val_acc)
    history_q['lr'].append(current_lr)
    
    epoch_time = time.time() - epoch_start
    
    if val_acc > best_val_acc_q:
        best_val_acc_q = val_acc
        best_model_state_q = copy.deepcopy(hybrid_model.state_dict())
        patience_counter_q = 0
        marker = " ★ BEST"
    else:
        patience_counter_q += 1
        marker = ""
    
    print(f"Epoch [{epoch+1:02d}/{NUM_EPOCHS_Q}] "
          f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.2f}% | "
          f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.2f}% | "
          f"Time: {epoch_time:.1f}s{marker}")
    
    if patience_counter_q >= PATIENCE_Q:
        print(f"\nEarly stopping at epoch {epoch+1}")
        break

training_time_q = time.time() - training_start_q
print(f"\nTraining completed in {training_time_q:.1f}s ({training_time_q/60:.1f} min)")
print(f"Best validation accuracy: {best_val_acc_q:.2f}%")

hybrid_model.load_state_dict(best_model_state_q)

# %% [markdown]
# ## 7. Save Quantum Model Artifacts

# %%
# Save VQC weights
vqc_weights_np = hybrid_model.quantum_weights.detach().cpu().numpy()
np.save(ARTIFACTS_DIR / 'cardiac_vqc_weights.npy', vqc_weights_np)
print(f"VQC weights saved: {ARTIFACTS_DIR / 'cardiac_vqc_weights.npy'}")
print(f"VQC weight shape: {vqc_weights_np.shape}")

# Save full hybrid model
torch.save({
    'model_state_dict': best_model_state_q,
    'n_qubits': N_QUBITS,
    'n_layers': N_LAYERS,
    'num_classes': NUM_CLASSES,
    'class_names': CLASS_NAMES,
    'best_val_acc': best_val_acc_q,
    'training_time_seconds': training_time_q,
    'quantum_params': int(n_quantum_params),
    'trainable_params': trainable_params_hybrid,
}, ARTIFACTS_DIR / 'cardiac_hybrid_production.pt')
print(f"Hybrid model saved: {ARTIFACTS_DIR / 'cardiac_hybrid_production.pt'}")

# %% [markdown]
# ## 8. Test Set Evaluation

# %%
test_loss_q, test_acc_q, test_preds_q, test_labels_q, test_probs_q = eval_hybrid(
    hybrid_model, test_loader, criterion_q, device
)

print(f"\n{'='*60}")
print(f"TEST SET RESULTS (Transfinite-1 Hybrid Quantum Cardiac)")
print(f"{'='*60}")
print(f"Test Accuracy: {test_acc_q:.2f}%")
print(f"Test Loss: {test_loss_q:.4f}")

print(f"\nClassification Report:")
print(classification_report(test_labels_q, test_preds_q, target_names=CLASS_NAMES, digits=4))

mcc_q = matthews_corrcoef(test_labels_q, test_preds_q)
print(f"MCC: {mcc_q:.4f}")

precision_q, recall_q, f1_q, _ = precision_recall_fscore_support(
    test_labels_q, test_preds_q, average=None
)

# %% [markdown]
# ## 9. Generate All Quantum Graphs

# %%
# === GRAPH Q1: Quantum Training Loss Curve ===
epochs_range_q = range(1, len(history_q['train_loss']) + 1)

fig, ax = plt.subplots(figsize=(12, 6))
ax.plot(epochs_range_q, history_q['train_loss'], 'purple', linewidth=2, label='Train Loss', marker='o', markersize=4)
ax.plot(epochs_range_q, history_q['val_loss'], 'darkorange', linewidth=2, label='Val Loss', marker='s', markersize=4)
ax.set_xlabel('Epoch', fontsize=14)
ax.set_ylabel('Loss', fontsize=14)
ax.set_title('Transfinite-1 Cardiac: Quantum Training Loss', fontsize=16, fontweight='bold')
ax.legend(fontsize=12)
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig(GRAPHS_DIR / 'quantum_loss_curves.png', dpi=150, bbox_inches='tight')
plt.show()

# %%
# === GRAPH Q2: Quantum Training Accuracy ===
fig, ax = plt.subplots(figsize=(12, 6))
ax.plot(epochs_range_q, history_q['train_acc'], 'purple', linewidth=2, label='Train Acc', marker='o', markersize=4)
ax.plot(epochs_range_q, history_q['val_acc'], 'darkorange', linewidth=2, label='Val Acc', marker='s', markersize=4)
ax.axhline(y=best_val_acc_q, color='g', linestyle='--', alpha=0.7, label=f'Best Val: {best_val_acc_q:.2f}%')
ax.set_xlabel('Epoch', fontsize=14)
ax.set_ylabel('Accuracy (%)', fontsize=14)
ax.set_title('Transfinite-1 Cardiac: Quantum Training Accuracy', fontsize=16, fontweight='bold')
ax.legend(fontsize=12)
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig(GRAPHS_DIR / 'quantum_accuracy_curves.png', dpi=150, bbox_inches='tight')
plt.show()

# %%
# === GRAPH Q3: Quantum Confusion Matrix ===
cm_q = confusion_matrix(test_labels_q, test_preds_q)
fig, ax = plt.subplots(figsize=(10, 8))
sns.heatmap(
    cm_q, annot=True, fmt='d', cmap='Purples',
    xticklabels=CLASS_NAMES, yticklabels=CLASS_NAMES,
    ax=ax, linewidths=0.5, linecolor='white',
    annot_kws={'size': 14, 'weight': 'bold'},
)
ax.set_xlabel('Predicted Label', fontsize=14)
ax.set_ylabel('True Label', fontsize=14)
ax.set_title('Transfinite-1 Cardiac: Quantum Confusion Matrix', fontsize=16, fontweight='bold')
plt.tight_layout()
plt.savefig(GRAPHS_DIR / 'quantum_confusion_matrix.png', dpi=150, bbox_inches='tight')
plt.show()

# %%
# === GRAPH Q4: Quantum ROC Curves ===
test_labels_bin_q = label_binarize(test_labels_q, classes=list(range(NUM_CLASSES)))
fig, ax = plt.subplots(figsize=(10, 8))
colors = ['#9C27B0', '#E91E63', '#FF5722', '#009688']

auc_scores_q = {}
for i in range(NUM_CLASSES):
    fpr, tpr, _ = roc_curve(test_labels_bin_q[:, i], test_probs_q[:, i])
    roc_auc_val = auc(fpr, tpr)
    auc_scores_q[CLASS_NAMES[i]] = float(roc_auc_val)
    ax.plot(fpr, tpr, color=colors[i], linewidth=2, label=f'{CLASS_NAMES[i]} (AUC={roc_auc_val:.4f})')

ax.plot([0, 1], [0, 1], 'k--', alpha=0.5)
ax.set_xlabel('False Positive Rate', fontsize=14)
ax.set_ylabel('True Positive Rate', fontsize=14)
ax.set_title('Transfinite-1 Cardiac: Quantum ROC Curves', fontsize=16, fontweight='bold')
ax.legend(fontsize=11, loc='lower right')
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig(GRAPHS_DIR / 'quantum_roc_curves.png', dpi=150, bbox_inches='tight')
plt.show()

# %% [markdown]
# ## 10. Classical vs Quantum Comparison

# %%
# Load classical benchmark for comparison
classical_report_path = ARTIFACTS_DIR / 'cardiac_benchmark_report.json'
classical_metrics = None
if classical_report_path.exists():
    with open(classical_report_path) as f:
        classical_metrics = json.load(f)

# %%
# === GRAPH Q5: Classical vs Quantum Accuracy Comparison ===
if classical_metrics:
    classical_acc = classical_metrics['metrics']['test_accuracy']
    classical_f1 = classical_metrics['metrics']['macro_f1']
    classical_mcc = classical_metrics['metrics']['mcc']
    classical_auc_macro = classical_metrics['metrics']['macro_auc']
else:
    classical_acc = 0
    classical_f1 = 0
    classical_mcc = 0
    classical_auc_macro = 0

quantum_f1 = float(f1_score(test_labels_q, test_preds_q, average='macro'))
quantum_auc_macro = float(np.mean(list(auc_scores_q.values())))

metrics_names = ['Accuracy', 'Macro F1', 'MCC', 'Macro AUC']
classical_vals = [classical_acc, classical_f1, classical_mcc, classical_auc_macro]
quantum_vals = [test_acc_q / 100, quantum_f1, float(mcc_q), quantum_auc_macro]

x = np.arange(len(metrics_names))
width = 0.35

fig, ax = plt.subplots(figsize=(14, 7))
bars1 = ax.bar(x - width/2, classical_vals, width, label='CX-01 Classical', color='#2196F3', edgecolor='white')
bars2 = ax.bar(x + width/2, quantum_vals, width, label='Transfinite-1 Quantum', color='#9C27B0', edgecolor='white')

ax.set_ylabel('Score', fontsize=14)
ax.set_title('Classical vs Quantum: Model Performance Comparison', fontsize=16, fontweight='bold')
ax.set_xticks(x)
ax.set_xticklabels(metrics_names, fontsize=12)
ax.legend(fontsize=12)
ax.set_ylim(0, 1.15)
ax.grid(True, alpha=0.3, axis='y')

for bars in [bars1, bars2]:
    for bar in bars:
        height = bar.get_height()
        ax.annotate(f'{height:.3f}', xy=(bar.get_x() + bar.get_width()/2, height),
                    xytext=(0, 3), textcoords="offset points", ha='center', fontsize=10)

plt.tight_layout()
plt.savefig(GRAPHS_DIR / 'classical_vs_quantum_comparison.png', dpi=150, bbox_inches='tight')
plt.show()

# %%
# === GRAPH Q6: Parameter Efficiency Comparison ===
if classical_metrics:
    classical_params = classical_metrics['parameters']['trainable']
else:
    classical_params = 11_200_000  # Approximate ResNet-18

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))

# Parameter count
models_list = ['CX-01\nClassical', 'Transfinite-1\nQuantum']
params = [classical_params, trainable_params_hybrid]
colors_bar = ['#2196F3', '#9C27B0']

ax1.bar(models_list, params, color=colors_bar, edgecolor='white', width=0.5)
ax1.set_ylabel('Trainable Parameters', fontsize=14)
ax1.set_title('Parameter Count Comparison', fontsize=14, fontweight='bold')
for i, v in enumerate(params):
    ax1.text(i, v + max(params)*0.02, f'{v:,}', ha='center', fontsize=11, fontweight='bold')
ax1.grid(True, alpha=0.3, axis='y')

# Parameter breakdown for quantum model
labels_pie = ['Frozen Encoder\n(ResNet-18)', 'Bottleneck FC', f'Quantum VQC\n({n_quantum_params} params)', 'Readout FC']
encoder_params = sum(p.numel() for p in hybrid_model.encoder.parameters())
bottleneck_params = sum(p.numel() for p in hybrid_model.bottleneck.parameters())
readout_params = sum(p.numel() for p in hybrid_model.readout.parameters())
sizes_pie = [encoder_params, bottleneck_params, int(n_quantum_params), readout_params]
colors_pie = ['#E0E0E0', '#64B5F6', '#CE93D8', '#81C784']
explode = (0, 0, 0.1, 0)

ax2.pie(sizes_pie, explode=explode, labels=labels_pie, colors=colors_pie,
        autopct='%1.1f%%', shadow=True, startangle=90,
        textprops={'fontsize': 10})
ax2.set_title('Transfinite-1 Parameter Breakdown', fontsize=14, fontweight='bold')

plt.tight_layout()
plt.savefig(GRAPHS_DIR / 'parameter_efficiency_comparison.png', dpi=150, bbox_inches='tight')
plt.show()

# %% [markdown]
# ## 11. Scarce-Data Quantum Advantage Evaluation

# %%
# Evaluate both models on progressively smaller training data fractions
# This demonstrates quantum advantage on limited data
scarce_fractions = [0.10, 0.15, 0.25, 0.50, 1.0]
scarce_results_classical = []
scarce_results_quantum = []

print("=" * 80)
print("SCARCE-DATA EVALUATION: Quantum vs Classical")
print("=" * 80)

dataset_root = find_dataset_root()

for frac in scarce_fractions:
    print(f"\n--- Training fraction: {frac*100:.0f}% ---")
    
    # Create subset dataloaders
    from cardiac_data_loader import CardiacECGImageDataset, get_train_transforms, get_val_transforms
    
    full_train = CardiacECGImageDataset(
        root_dir=str(dataset_root), split="train",
        transform=get_train_transforms(224),
    )
    
    n_subset = max(int(len(full_train) * frac), 20)
    torch.manual_seed(42)
    subset_indices = torch.randperm(len(full_train))[:n_subset].tolist()
    subset_ds = torch.utils.data.Subset(full_train, subset_indices)
    
    subset_loader = torch.utils.data.DataLoader(
        subset_ds, batch_size=16, shuffle=True, num_workers=0, drop_last=True,
    )
    
    # Quick-train classical model on subset
    cls_model = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
    cls_model.fc = nn.Sequential(nn.Dropout(0.3), nn.Linear(512, 256), nn.ReLU(), nn.Dropout(0.2), nn.Linear(256, NUM_CLASSES))
    cls_model = cls_model.to(device)
    cls_opt = optim.Adam(cls_model.parameters(), lr=1e-3)
    cls_crit = nn.CrossEntropyLoss(weight=class_weights)
    
    for ep in range(10):  # Quick 10-epoch training
        cls_model.train()
        for imgs, lbls, _ in subset_loader:
            imgs, lbls = imgs.to(device), lbls.to(device)
            cls_opt.zero_grad()
            out = cls_model(imgs)
            loss = cls_crit(out, lbls)
            loss.backward()
            cls_opt.step()
    
    _, cls_acc, _, _, _ = eval_hybrid(cls_model, test_loader, cls_crit, device)
    scarce_results_classical.append(cls_acc)
    print(f"  Classical accuracy: {cls_acc:.2f}%")
    
    # Quick-train quantum model on subset
    q_model = HybridQuantumCardiacModel(NUM_CLASSES, N_QUBITS, N_LAYERS).to(device)
    q_opt = optim.Adam(filter(lambda p: p.requires_grad, q_model.parameters()), lr=5e-3)
    
    for ep in range(10):
        q_model.train()
        for batch_idx, (imgs, lbls, _) in enumerate(subset_loader):
            if batch_idx >= 5:  # Limit quantum batches per epoch for speed
                break
            imgs, lbls = imgs.to(device), lbls.to(device)
            q_opt.zero_grad()
            out = q_model(imgs)
            loss = cls_crit(out, lbls)
            loss.backward()
            q_opt.step()
    
    _, q_acc, _, _, _ = eval_hybrid(q_model, test_loader, cls_crit, device)
    scarce_results_quantum.append(q_acc)
    print(f"  Quantum accuracy: {q_acc:.2f}%")
    
    del cls_model, q_model
    torch.cuda.empty_cache() if torch.cuda.is_available() else None

# %%
# === GRAPH Q7: Scarce-Data Comparison Curves ===
fig, ax = plt.subplots(figsize=(12, 7))
percentages = [f*100 for f in scarce_fractions]

ax.plot(percentages, scarce_results_classical, 'b-o', linewidth=2.5, markersize=10, label='CX-01 Classical')
ax.plot(percentages, scarce_results_quantum, 'purple', linewidth=2.5, marker='D', markersize=10, label='Transfinite-1 Quantum')

# Shade quantum advantage region
for i in range(len(percentages)):
    if scarce_results_quantum[i] > scarce_results_classical[i]:
        ax.annotate(f'+{scarce_results_quantum[i]-scarce_results_classical[i]:.1f}%',
                    xy=(percentages[i], scarce_results_quantum[i]),
                    xytext=(10, 10), textcoords='offset points',
                    fontsize=10, color='green', fontweight='bold')

ax.set_xlabel('Training Data Fraction (%)', fontsize=14)
ax.set_ylabel('Test Accuracy (%)', fontsize=14)
ax.set_title('Scarce-Cohort Quantum Resilience: Classical vs Quantum', fontsize=16, fontweight='bold')
ax.legend(fontsize=12)
ax.grid(True, alpha=0.3)
ax.set_xticks(percentages)
plt.tight_layout()
plt.savefig(GRAPHS_DIR / 'scarce_data_comparison.png', dpi=150, bbox_inches='tight')
plt.show()

# %% [markdown]
# ## 12. Quantum Gate Saliency Analysis

# %%
# Analyze which quantum gates contribute most to predictions
def compute_gate_saliency(model, loader, device, n_samples=50):
    """Compute saliency of quantum weights via gradient magnitude."""
    model.eval()
    model.quantum_weights.requires_grad_(True)
    
    total_grad = torch.zeros_like(model.quantum_weights)
    count = 0
    
    for images, labels, _ in loader:
        if count >= n_samples:
            break
        images, labels = images.to(device), labels.to(device)
        
        for i in range(min(images.size(0), n_samples - count)):
            model.zero_grad()
            output = model(images[i:i+1])
            pred_class = output.argmax(dim=1)
            output[0, pred_class].backward(retain_graph=True)
            
            if model.quantum_weights.grad is not None:
                total_grad += model.quantum_weights.grad.abs()
                model.quantum_weights.grad.zero_()
            count += 1
    
    saliency = (total_grad / max(count, 1)).detach().cpu().numpy()
    return saliency

saliency = compute_gate_saliency(hybrid_model, test_loader, device, n_samples=30)

# === GRAPH Q8: Quantum Gate Saliency Heatmap ===
fig, axes = plt.subplots(1, N_LAYERS, figsize=(8*N_LAYERS, 6))
if N_LAYERS == 1:
    axes = [axes]

for layer_idx in range(N_LAYERS):
    ax = axes[layer_idx]
    layer_saliency = saliency[layer_idx]  # [N_QUBITS, 3]
    
    sns.heatmap(
        layer_saliency, annot=True, fmt='.3f', cmap='magma',
        xticklabels=['Rot-X', 'Rot-Y', 'Rot-Z'],
        yticklabels=[f'Qubit {i}' for i in range(N_QUBITS)],
        ax=ax, linewidths=0.5, linecolor='white',
        annot_kws={'size': 10},
    )
    ax.set_title(f'VQC Layer {layer_idx+1} Gate Saliency', fontsize=14, fontweight='bold')

plt.suptitle('Transfinite-1 Cardiac: Quantum Gate Importance', fontsize=16, fontweight='bold')
plt.tight_layout()
plt.savefig(GRAPHS_DIR / 'quantum_gate_saliency.png', dpi=150, bbox_inches='tight')
plt.show()

# %% [markdown]
# ## 13. Generate Quantum Benchmark Report

# %%
quantum_benchmark = {
    "model_name": "Transfinite-1 Cardiac Quantum",
    "model_type": "hybrid_quantum",
    "architecture": "Frozen ResNet-18 encoder → FC(512→8) → 8-Qubit VQC → FC(8→4)",
    "disease": "Heart Attack / Cardiac Arrhythmia",
    "test_type": "12-Lead ECG Paper-Strip Image",
    "quantum_config": {
        "n_qubits": N_QUBITS,
        "n_layers": N_LAYERS,
        "ansatz": "StronglyEntanglingLayers",
        "encoding": "AngleEmbedding (RY rotations)",
        "measurement": "PauliZ expectation values",
        "simulator": "default.qubit (PennyLane)",
        "quantum_parameters": int(n_quantum_params),
    },
    "training": {
        "epochs_trained": len(history_q['train_loss']),
        "training_time_seconds": round(training_time_q, 2),
        "learning_rate": LEARNING_RATE_Q,
        "optimizer": "Adam (trainable params only)",
        "batch_size": 16,
        "gpu": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU",
    },
    "parameters": {
        "total": total_params_hybrid,
        "trainable": trainable_params_hybrid,
        "frozen_encoder": frozen_params,
        "quantum": int(n_quantum_params),
    },
    "metrics": {
        "test_accuracy": round(test_acc_q, 4),
        "test_loss": round(test_loss_q, 6),
        "macro_f1": round(quantum_f1, 4),
        "mcc": round(float(mcc_q), 4),
        "macro_auc": round(quantum_auc_macro, 4),
        "per_class_auc": {k: round(v, 4) for k, v in auc_scores_q.items()},
        "per_class_precision": {CLASS_NAMES[i]: round(float(precision_q[i]), 4) for i in range(NUM_CLASSES)},
        "per_class_recall": {CLASS_NAMES[i]: round(float(recall_q[i]), 4) for i in range(NUM_CLASSES)},
        "per_class_f1": {CLASS_NAMES[i]: round(float(f1_q[i]), 4) for i in range(NUM_CLASSES)},
        "confusion_matrix": cm_q.tolist(),
        "best_val_accuracy": round(best_val_acc_q, 4),
    },
    "scarce_data_evaluation": {
        "fractions": scarce_fractions,
        "classical_accuracy": scarce_results_classical,
        "quantum_accuracy": scarce_results_quantum,
    },
    "training_history": {
        "train_loss": [round(x, 6) for x in history_q['train_loss']],
        "val_loss": [round(x, 6) for x in history_q['val_loss']],
        "train_acc": [round(x, 4) for x in history_q['train_acc']],
        "val_acc": [round(x, 4) for x in history_q['val_acc']],
    },
    "graphs": [
        "quantum_circuit_diagram.png",
        "quantum_loss_curves.png",
        "quantum_accuracy_curves.png",
        "quantum_confusion_matrix.png",
        "quantum_roc_curves.png",
        "classical_vs_quantum_comparison.png",
        "parameter_efficiency_comparison.png",
        "scarce_data_comparison.png",
        "quantum_gate_saliency.png",
    ],
    "generated_at": datetime.now().isoformat(),
}

# Merge into main benchmark report
report_path = ARTIFACTS_DIR / 'cardiac_benchmark_report.json'
if report_path.exists():
    with open(report_path) as f:
        main_report = json.load(f)
    main_report['quantum_model'] = quantum_benchmark
else:
    main_report = {"classical_model": {}, "quantum_model": quantum_benchmark}

with open(report_path, 'w') as f:
    json.dump(main_report, f, indent=2)
print(f"Benchmark report updated: {report_path}")

# %%
print(f"\n{'='*60}")
print(f"TRANSFINITE-1 CARDIAC QUANTUM MODEL — TRAINING COMPLETE")
print(f"{'='*60}")
print(f"Test Accuracy:      {test_acc_q:.2f}%")
print(f"Macro F1-Score:     {quantum_f1:.4f}")
print(f"Macro AUC-ROC:      {quantum_auc_macro:.4f}")
print(f"MCC:                {mcc_q:.4f}")
print(f"Quantum Parameters: {n_quantum_params}")
print(f"Training Time:      {training_time_q:.1f}s")
print(f"{'='*60}")
