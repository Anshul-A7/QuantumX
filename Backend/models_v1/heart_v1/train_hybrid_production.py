"""
================================================================================
QuantumX: Authentic Hybrid Quantum-Classical Cardiac Classifier Training
================================================================================
Trains genuine PennyLane 8-Qubit Variational Quantum Circuit (VQC) with:
  1. Frozen trained ResNet-18 feature encoder (512-dim latent space)
  2. Trainable bottleneck (512 -> 64 -> 8) with Tanh angle scaling
  3. Trainable 8-Qubit Strongly Entangled VQC (2 layers, 48 parameters)
  4. Trainable readout head (8 -> 32 -> 4 classes)
  5. Feature caching for fast high-efficiency quantum training
================================================================================
"""

import os
import sys
import time
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.optim.lr_scheduler import CosineAnnealingLR
from torch.utils.data import TensorDataset, DataLoader
from torchvision import models, transforms
from PIL import Image
import pennylane as qml

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
ARTIFACTS_DIR = BASE_DIR / "artifacts"
ENCODER_PATH = ARTIFACTS_DIR / "cardiac_encoder.pt"
OUTPUT_MODEL_PATH = ARTIFACTS_DIR / "cardiac_hybrid_production.pt"

DATASET_ROOT = Path(__file__).resolve().parent.parent.parent.parent / "Models" / "v1 - Heart Attack (ECG Image)" / "data" / "clean_deduplicated"

CLASS_NAMES = ["Normal", "Myocardial Infarction", "History of MI", "Abnormal Heartbeat"]
CLASS_MAP = {name: i for i, name in enumerate(CLASS_NAMES)}

N_QUBITS = 8
N_LAYERS = 2

# ── Quantum Circuit Definition ────────────────────────────────────────────────
qdev = qml.device("default.qubit", wires=N_QUBITS)

@qml.qnode(qdev, interface="torch", diff_method="backprop")
def quantum_vqc(inputs, weights):
    qml.AngleEmbedding(inputs, wires=range(N_QUBITS), rotation='Y')
    qml.StronglyEntanglingLayers(weights, wires=range(N_QUBITS))
    return [qml.expval(qml.PauliZ(i)) for i in range(N_QUBITS)]

wshape = qml.StronglyEntanglingLayers.shape(n_layers=N_LAYERS, n_wires=N_QUBITS)


# ── Hybrid Model Architecture ─────────────────────────────────────────────────
class HybridQuantumClassifier(nn.Module):
    def __init__(self, num_classes=4, n_qubits=8, n_layers=2):
        super().__init__()
        self.n_qubits = n_qubits
        self.n_layers = n_layers

        # Bottleneck: 512 -> 64 -> 8 angles in [-pi, pi]
        self.bottleneck = nn.Sequential(
            nn.Linear(512, 64),
            nn.ReLU(True),
            nn.Dropout(0.2),
            nn.Linear(64, n_qubits),
            nn.Tanh()  # Output in [-1, 1], multiplied by pi before angle embedding
        )

        # 48 Variational Quantum Parameters
        self.quantum_weights = nn.Parameter(torch.randn(*wshape) * 0.15)

        # Readout Head: 8 Pauli-Z expectation values -> 4 class logits
        self.readout = nn.Sequential(
            nn.Linear(n_qubits, 32),
            nn.ReLU(True),
            nn.Dropout(0.15),
            nn.Linear(32, num_classes)
        )

    def forward(self, features):
        """
        features: [B, 512] cached visual embeddings
        """
        # 1. Bottleneck to 8 angles
        angles = self.bottleneck(features) * np.pi  # Scale to [-pi, pi]

        # 2. Quantum VQC Circuit execution per sample
        batch_size = angles.shape[0]
        q_outs = []
        for i in range(batch_size):
            expvals = quantum_vqc(angles[i].cpu(), self.quantum_weights)
            q_outs.append(torch.stack(expvals).to(features.device))
        
        q_tensor = torch.stack(q_outs).float()  # [B, 8]

        # 3. Readout head
        logits = self.readout(q_tensor)
        return logits


# ── Feature Extraction & Caching ──────────────────────────────────────────────
IMAGE_TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def load_encoder(device):
    print(f"Loading feature encoder from: {ENCODER_PATH}")
    resnet = models.resnet18(weights=None)
    resnet.fc = nn.Identity()
    ckpt = torch.load(ENCODER_PATH, map_location=device)
    resnet.load_state_dict(ckpt["state_dict"])
    resnet.to(device)
    resnet.eval()
    return resnet

def extract_features_for_split(encoder, split_dir: Path, device) -> Tuple[torch.Tensor, torch.Tensor]:
    print(f"Scanning images in: {split_dir}")
    feature_list = []
    label_list = []

    valid_exts = {".png", ".jpg", ".jpeg", ".bmp"}

    for class_name in CLASS_NAMES:
        class_folder = split_dir / class_name
        if not class_folder.exists():
            print(f"  Warning: class folder missing: {class_folder}")
            continue
        
        class_idx = CLASS_MAP[class_name]
        img_paths = [p for p in class_folder.iterdir() if p.suffix.lower() in valid_exts]
        print(f"  {class_name}: {len(img_paths)} images")

        for img_path in img_paths:
            try:
                img = Image.open(img_path).convert("RGB")
                tensor = IMAGE_TRANSFORM(img).unsqueeze(0).to(device)
                with torch.no_grad():
                    feat = encoder(tensor).squeeze().cpu()  # [512]
                feature_list.append(feat)
                label_list.append(class_idx)
            except Exception as e:
                print(f"Error loading {img_path}: {e}")

    X = torch.stack(feature_list).float()
    y = torch.tensor(label_list, dtype=torch.long)
    print(f"Extracted split {split_dir.name}: X={X.shape}, y={y.shape}")
    return X, y


# ── Training Routine ──────────────────────────────────────────────────────────
def main():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using Compute Device: {device}")

    # 1. Load trained encoder
    encoder = load_encoder(device)

    # 2. Extract features for train, val, test
    X_train, y_train = extract_features_for_split(encoder, DATASET_ROOT / "train", device)
    X_val, y_val = extract_features_for_split(encoder, DATASET_ROOT / "val", device)
    X_test, y_test = extract_features_for_split(encoder, DATASET_ROOT / "test", device)

    # Compute class weights to handle imbalance
    class_counts = np.bincount(y_train.numpy(), minlength=4).astype(np.float32)
    total_samples = len(y_train)
    weights = total_samples / (4.0 * np.maximum(class_counts, 1.0))
    class_weights_tensor = torch.tensor(weights, dtype=torch.float32).to(device)
    print(f"Class counts in train: {class_counts.tolist()}")
    print(f"Calculated class weights: {weights.tolist()}")

    # Create DataLoaders
    batch_size = 16
    train_loader = DataLoader(TensorDataset(X_train, y_train), batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(TensorDataset(X_val, y_val), batch_size=batch_size, shuffle=False)
    test_loader = DataLoader(TensorDataset(X_test, y_test), batch_size=batch_size, shuffle=False)

    # 3. Initialize Model, Loss, Optimizer
    torch.manual_seed(42)
    np.random.seed(42)
    model = HybridQuantumClassifier(num_classes=4, n_qubits=N_QUBITS, n_layers=N_LAYERS).to(device)

    criterion = nn.CrossEntropyLoss(weight=class_weights_tensor)
    optimizer = optim.Adam(model.parameters(), lr=0.008, weight_decay=1e-4)
    epochs = 20
    scheduler = CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-5)

    print("\n" + "=" * 60)
    print(f"Starting Training: 8-Qubit Transfinite-1 VQC ({epochs} Epochs)")
    print("=" * 60)

    best_val_acc = 0.0
    best_weights = None

    t0 = time.time()
    for epoch in range(1, epochs + 1):
        ep_t0 = time.time()
        model.train()
        train_loss = 0.0
        train_correct = 0

        for bx, by in train_loader:
            bx, by = bx.to(device), by.to(device)
            optimizer.zero_grad()
            logits = model(bx)
            loss = criterion(logits, by)
            loss.backward()
            optimizer.step()

            train_loss += loss.item() * bx.size(0)
            preds = logits.argmax(dim=1)
            train_correct += (preds == by).sum().item()

        scheduler.step()

        train_loss /= len(X_train)
        train_acc = (train_correct / len(X_train)) * 100.0

        # Validation
        model.eval()
        val_loss = 0.0
        val_correct = 0
        with torch.no_grad():
            for bx, by in val_loader:
                bx, by = bx.to(device), by.to(device)
                logits = model(bx)
                loss = criterion(logits, by)
                val_loss += loss.item() * bx.size(0)
                preds = logits.argmax(dim=1)
                val_correct += (preds == by).sum().item()

        val_loss /= len(X_val)
        val_acc = (val_correct / len(X_val)) * 100.0
        ep_time = time.time() - ep_t0

        print(f"Epoch {epoch:02d}/{epochs:02d} [{ep_time:.1f}s] | Train Loss: {train_loss:.4f}, Acc: {train_acc:.1f}% | Val Loss: {val_loss:.4f}, Acc: {val_acc:.1f}%")

        if val_acc >= best_val_acc:
            best_val_acc = val_acc
            best_weights = {
                "bottleneck_state_dict": model.bottleneck.state_dict(),
                "quantum_weights": model.quantum_weights.data.clone(),
                "readout_state_dict": model.readout.state_dict(),
                "best_val_acc": val_acc,
                "best_val_loss": val_loss,
                "epoch": epoch
            }

    print("\n" + "=" * 60)
    print(f"Training Complete in {time.time() - t0:.1f}s. Best Val Acc: {best_val_acc:.1f}%")
    print("=" * 60)

    # 4. Final Evaluation on Unseen Test Split
    print("\nEvaluating on Independent Test Split...")
    model.bottleneck.load_state_dict(best_weights["bottleneck_state_dict"])
    model.quantum_weights.data.copy_(best_weights["quantum_weights"])
    model.readout.load_state_dict(best_weights["readout_state_dict"])
    model.eval()

    test_correct = 0
    all_preds = []
    all_targets = []
    with torch.no_grad():
        for bx, by in test_loader:
            bx, by = bx.to(device), by.to(device)
            logits = model(bx)
            preds = logits.argmax(dim=1)
            test_correct += (preds == by).sum().item()
            all_preds.extend(preds.cpu().numpy().tolist())
            all_targets.extend(by.cpu().numpy().tolist())

    test_acc = (test_correct / len(X_test)) * 100.0
    print(f"Test Accuracy: {test_acc:.2f}% ({test_correct}/{len(X_test)})")

    # Save artifact
    production_payload = {
        "model_signature": "QuantumX Transfinite-1 Cardiac",
        "architecture": "Bottleneck(512->64->8) -> 8-Qubit VQC (AngleEmbedding + 2x StronglyEntanglingLayers) -> Readout(8->32->4)",
        "n_qubits": N_QUBITS,
        "n_layers": N_LAYERS,
        "quantum_params": int(np.prod(wshape)),
        "classes": CLASS_NAMES,
        "bottleneck_state_dict": best_weights["bottleneck_state_dict"],
        "quantum_weights": best_weights["quantum_weights"],
        "readout_state_dict": best_weights["readout_state_dict"],
        "test_accuracy": test_acc,
        "val_accuracy": best_val_acc,
        "trained_timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }

    torch.save(production_payload, OUTPUT_MODEL_PATH)
    print(f"\nSaved Trained Hybrid Quantum Model to: {OUTPUT_MODEL_PATH}")


if __name__ == "__main__":
    main()
