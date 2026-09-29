"""QuantumX Production Hybrid Quantum Cardiac Classifier Trainer
Architecture: 8-Qubit Universal Data Re-Uploading VQC + ResQNet Residual Highway + Bilinear Gated Fusion
"""

import os
import sys
import time
import copy
from pathlib import Path

import numpy as np
import pandas as pd
from PIL import Image

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, TensorDataset, Dataset
from torchvision import models, transforms

from quantum_circuit import HybridQuantumCardiacModel, draw_quantum_circuit, NUM_QUBITS, NUM_LAYERS

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

CLASSES = [
    "Normal",
    "Myocardial Infarction",
    "History of MI",
    "Abnormal Heartbeat"
]

def map_class_name(folder_name):
    low = folder_name.lower()
    if "abnormal" in low or "arrhythmia" in low:
        return "Abnormal Heartbeat"
    if "history" in low:
        return "History of MI"
    if "infarction" in low or "mi" in low:
        return "Myocardial Infarction"
    if "normal" in low:
        return "Normal"
    return folder_name

def scan_dataset(dir_path, blacklist=None):
    records = []
    if blacklist is None:
        blacklist = set()
    for class_folder in os.listdir(dir_path):
        folder_path = Path(dir_path) / class_folder
        if not folder_path.is_dir():
            continue
        clean_name = map_class_name(class_folder)
        if clean_name not in CLASSES:
            continue
        for ext in ("*.jpg", "*.png", "*.jpeg"):
            for f in folder_path.glob(ext):
                if f.name.lower() in blacklist:
                    continue
                records.append({"path": str(f), "class_name": clean_name, "label": CLASSES.index(clean_name)})
    return pd.DataFrame(records)

class AdaptiveConcatPool2d(nn.Module):
    def __init__(self, output_size=1):
        super().__init__()
        self.avg_pool = nn.AdaptiveAvgPool2d(output_size)
        self.max_pool = nn.AdaptiveMaxPool2d(output_size)
    def forward(self, x):
        return torch.cat([self.avg_pool(x), self.max_pool(x)], dim=1)

class CardiacFeatureExtractor(nn.Module):
    def __init__(self):
        super().__init__()
        base = models.resnet34(weights=models.ResNet34_Weights.DEFAULT)
        self.features = nn.Sequential(
            base.conv1, base.bn1, base.relu, base.maxpool,
            base.layer1, base.layer2, base.layer3, base.layer4
        )
        self.concat_pool = AdaptiveConcatPool2d(1)
        self.flatten = nn.Flatten()
    def forward(self, x):
        feat = self.features(x)
        return self.flatten(self.concat_pool(feat))

class RawECGDataset(Dataset):
    def __init__(self, df, transform):
        self.df = df
        self.transform = transform
    def __len__(self):
        return len(self.df)
    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        img = Image.open(row['path']).convert('RGB')
        return self.transform(img), int(row['label'])

def train_quantum(epochs=20, lr=1e-3):
    script_dir = Path(__file__).resolve().parent
    root_dir = script_dir.parent
    dataset_root = (root_dir.parent / "Dataset").resolve()
    classical_ckpt_path = (root_dir.parent / "Classical" / "Models" / "best_classical_cardiac_model.pt").resolve()
    
    # Save diagram
    diag_dir = root_dir / "Diagram"
    diag_dir.mkdir(exist_ok=True)
    circ_file = diag_dir / "quantum_circuit_architecture.txt"
    with open(circ_file, "w", encoding="utf-8") as fp:
        fp.write(draw_quantum_circuit())
    print(f"Quantum circuit architecture saved to: {circ_file}")
    
    encoder = CardiacFeatureExtractor().to(device)
    if classical_ckpt_path.exists():
        print(f"Loading visual features from: {classical_ckpt_path}")
        ckpt = torch.load(classical_ckpt_path, map_location=device)
        st = {k: v for k, v in ckpt['model_state_dict'].items() if 'layer' in k or 'stem' in k}
        encoder.load_state_dict(st, strict=False)
        print("Pretrained cardiac features loaded!")
    else:
        print(f"Classical checkpoint not found at {classical_ckpt_path}. Using base ImageNet features.")
    encoder.eval()
    
    # Build blacklist set from Test Cases Absolute
    abs_test_dir = (root_dir.parent / "Test Cases Absolute").resolve()
    blacklist = set()
    if abs_test_dir.exists():
        for root, _, files in os.walk(abs_test_dir):
            for f in files:
                blacklist.add(f.lower())
    print(f"Strict holdout blacklisted images: {len(blacklist)}")
    
    df_train_all = scan_dataset(dataset_root / "train", blacklist=blacklist)
    df_test = scan_dataset(dataset_root / "test", blacklist=blacklist)
    
    from sklearn.model_selection import StratifiedShuffleSplit
    sss = StratifiedShuffleSplit(n_splits=1, test_size=0.15, random_state=42)
    train_idx, val_idx = next(sss.split(df_train_all, df_train_all['label']))
    
    df_train = df_train_all.iloc[train_idx].reset_index(drop=True)
    df_val = df_train_all.iloc[val_idx].reset_index(drop=True)
    
    eval_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    def cache_feats(df, desc):
        ds = RawECGDataset(df, eval_transforms)
        loader = DataLoader(ds, batch_size=64, shuffle=False)
        all_f, all_l = [], []
        print(f"{desc} ({len(df)} images)...")
        with torch.no_grad():
            for imgs, lbls in loader:
                imgs = imgs.to(device)
                f = encoder(imgs)
                all_f.append(f.cpu())
                all_l.append(lbls)
        return torch.cat(all_f, dim=0), torch.cat(all_l, dim=0)
        
    X_train, y_train = cache_feats(df_train, "Caching Train Manifold")
    X_val, y_val = cache_feats(df_val, "Caching Val Manifold")
    X_test, y_test = cache_feats(df_test, "Caching Test Manifold")
    
    train_loader = DataLoader(TensorDataset(X_train, y_train), batch_size=32, shuffle=True)
    val_loader = DataLoader(TensorDataset(X_val, y_val), batch_size=32, shuffle=False)
    test_loader = DataLoader(TensorDataset(X_test, y_test), batch_size=32, shuffle=False)
    
    hybrid_model = HybridQuantumCardiacModel().to(device)
    criterion = nn.CrossEntropyLoss(label_smoothing=0.05)
    optimizer = torch.optim.AdamW(hybrid_model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-5)
    
    best_val_acc = 0.0
    best_weights = None
    
    print("\nBeginning Universal Data Re-Uploading Hybrid Training...")
    for epoch in range(1, epochs + 1):
        t0 = time.time()
        hybrid_model.train()
        r_loss, correct, total = 0.0, 0, 0
        for bx, by in train_loader:
            bx, by = bx.to(device), by.to(device)
            optimizer.zero_grad()
            outs = hybrid_model(bx)
            loss = criterion(outs, by)
            loss.backward()
            optimizer.step()
            
            r_loss += loss.item() * bx.size(0)
            preds = outs.argmax(dim=1)
            correct += (preds == by).sum().item()
            total += by.size(0)
            
        scheduler.step()
        train_acc = (correct / total) * 100.0
        
        # Validation
        hybrid_model.eval()
        v_loss, v_corr, v_tot = 0.0, 0, 0
        with torch.no_grad():
            for bx, by in val_loader:
                bx, by = bx.to(device), by.to(device)
                outs = hybrid_model(bx)
                loss = criterion(outs, by)
                v_loss += loss.item() * bx.size(0)
                preds = outs.argmax(dim=1)
                v_corr += (preds == by).sum().item()
                v_tot += by.size(0)
        val_acc = (v_corr / v_tot) * 100.0
        
        elapsed = time.time() - t0
        print(f"Epoch [{epoch:02d}/{epochs:02d}] ({elapsed:.1f}s) Train Acc: {train_acc:.2f}% | Val Acc: {val_acc:.2f}%")
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_weights = copy.deepcopy(hybrid_model.state_dict())
            
    hybrid_model.load_state_dict(best_weights)
    
    # Save checkpoint to Hybrid/Models
    out_models_dir = root_dir / "Models"
    out_models_dir.mkdir(exist_ok=True)
    out_path = out_models_dir / "best_hybrid_quantum_cardiac_model.pt"
    
    torch.save({
        'model_name': 'QuantumX 8-Qubit Universal Data Re-Uploading Hybrid Cardiac Classifier',
        'classes': CLASSES,
        'num_qubits': NUM_QUBITS,
        'num_layers': NUM_LAYERS,
        'best_val_acc': float(best_val_acc),
        'model_state_dict': hybrid_model.state_dict()
    }, out_path)
    print(f"\nHybrid Quantum Model successfully saved to: {out_path}")

if __name__ == '__main__':
    train_quantum()
