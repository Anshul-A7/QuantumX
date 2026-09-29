"""QuantumX State-of-the-Art Classical 12-Lead ECG Image Classifier
Architecture: ECGConVT (Multi-Scale Dilated ResNet + Multi-Head Self-Attention + CBAM)
Clinical Enhancements: CLAHE Preprocessing, Adaptive Concat Pooling (1024d), Focal Loss + Label Smoothing, Temperature Calibration
"""

import os
import sys
import time
import math
import copy
import json
import random
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from PIL import Image, ImageEnhance

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, Dataset
from torchvision import models, transforms
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score

def seed_everything(seed=42):
    random.seed(seed)
    os.environ['PYTHONHASHSEED'] = str(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed(seed)
        torch.cuda.manual_seed_all(seed)
        torch.backends.cudnn.deterministic = True
        torch.backends.cudnn.benchmark = False

seed_everything(42)

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
    if not os.path.exists(dir_path):
        return pd.DataFrame(records)
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
                records.append({
                    "path": str(f),
                    "class_name": clean_name,
                    "label": CLASSES.index(clean_name)
                })
    return pd.DataFrame(records)

# ==============================================================================
# 1. ADAPTIVE ECG PREPROCESSING (PAPER GRID SUPPRESSION & WAVEFORM ENHANCEMENT)
# ==============================================================================
class AdaptiveECGPreprocessor:
    def __init__(self, target_size=(224, 224)):
        self.target_size = target_size

    def __call__(self, img):
        if img.mode != 'RGB':
            img = img.convert('RGB')
        img = img.resize(self.target_size, Image.Resampling.BILINEAR)
        # Increase contrast so black ink of cardiac tracing pops against pink/red paper grid
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.30)
        return img

# ==============================================================================
# 2. CBAM ATTENTION & MULTI-HEAD SELF-ATTENTION MODULES
# ==============================================================================
class ChannelAttention(nn.Module):
    def __init__(self, in_planes, ratio=16):
        super().__init__()
        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        self.max_pool = nn.AdaptiveMaxPool2d(1)
        reduced = max(in_planes // ratio, 8)
        self.fc1 = nn.Conv2d(in_planes, reduced, 1, bias=False)
        self.act = nn.Mish()
        self.fc2 = nn.Conv2d(reduced, in_planes, 1, bias=False)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        avg_out = self.fc2(self.act(self.fc1(self.avg_pool(x))))
        max_out = self.fc2(self.act(self.fc1(self.max_pool(x))))
        return self.sigmoid(avg_out + max_out)

class SpatialAttention(nn.Module):
    def __init__(self, kernel_size=7):
        super().__init__()
        self.conv = nn.Conv2d(2, 1, kernel_size, padding=kernel_size // 2, bias=False)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        avg_out = torch.mean(x, dim=1, keepdim=True)
        max_out, _ = torch.max(x, dim=1, keepdim=True)
        return self.sigmoid(self.conv(torch.cat([avg_out, max_out], dim=1)))

class CBAM(nn.Module):
    def __init__(self, in_planes, ratio=16):
        super().__init__()
        self.ca = ChannelAttention(in_planes, ratio)
        self.sa = SpatialAttention()

    def forward(self, x):
        x = x * self.ca(x)
        x = x * self.sa(x)
        return x

class MultiHeadLeadSelfAttention(nn.Module):
    """Computes global self-attention across spatial lead patches to model
    reciprocal ST elevation/depression across the 12-lead paper layout."""
    def __init__(self, embed_dim=512, num_heads=8):
        super().__init__()
        self.mha = nn.MultiheadAttention(embed_dim, num_heads, batch_first=True)
        self.norm = nn.LayerNorm(embed_dim)

    def forward(self, x):
        # x shape: (B, C, H, W)
        B, C, H, W = x.shape
        # Flatten spatial grid into tokens: (B, H*W, C)
        tokens = x.flatten(2).permute(0, 2, 1)
        attn_out, _ = self.mha(tokens, tokens, tokens)
        tokens = self.norm(tokens + attn_out)
        # Reshape back to (B, C, H, W)
        return tokens.permute(0, 2, 1).view(B, C, H, W)

# ==============================================================================
# 3. ECGConVT ARCHITECTURE (CNN + VISION TRANSFORMER HYBRID)
# ==============================================================================
class AdaptiveConcatPool2d(nn.Module):
    def __init__(self, output_size=1):
        super().__init__()
        self.avg_pool = nn.AdaptiveAvgPool2d(output_size)
        self.max_pool = nn.AdaptiveMaxPool2d(output_size)

    def forward(self, x):
        return torch.cat([self.avg_pool(x), self.max_pool(x)], dim=1)

class MultiScaleDilatedConv(nn.Module):
    def __init__(self, in_ch, out_ch):
        super().__init__()
        ch = out_ch // 3
        rem = out_ch - (ch * 2)
        self.c1 = nn.Conv2d(in_ch, ch, 3, padding=1, dilation=1, bias=False)
        self.c2 = nn.Conv2d(in_ch, ch, 3, padding=2, dilation=2, bias=False)
        self.c3 = nn.Conv2d(in_ch, rem, 3, padding=4, dilation=4, bias=False)
        self.bn = nn.BatchNorm2d(out_ch)
        self.act = nn.Mish()

    def forward(self, x):
        return self.act(self.bn(torch.cat([self.c1(x), self.c2(x), self.c3(x)], dim=1)))

class ECGConVT(nn.Module):
    """Hybrid CNN-Transformer architecture for 12-lead visual ECG analysis."""
    def __init__(self, num_classes=4, pretrained=True):
        super().__init__()
        base = models.resnet34(weights=models.ResNet34_Weights.DEFAULT if pretrained else None)
        
        # Convolutional Backbone
        self.stem = nn.Sequential(base.conv1, base.bn1, base.relu, base.maxpool)
        self.layer1 = base.layer1  # 64
        self.layer2 = base.layer2  # 128
        self.layer3 = base.layer3  # 256
        self.layer4 = base.layer4  # 512
        
        # Multi-scale dilated refinement
        self.multiscale = MultiScaleDilatedConv(512, 512)
        
        # Dual-Attention CBAM
        self.cbam = CBAM(512, ratio=16)
        
        # Global Transformer Self-Attention across leads
        self.transformer_attn = MultiHeadLeadSelfAttention(embed_dim=512, num_heads=8)
        
        # Adaptive Concat Pooling: 512 * 2 = 1024-dim
        self.concat_pool = AdaptiveConcatPool2d(1)
        self.flatten = nn.Flatten()
        
        # Clinical Classification Head
        self.head = nn.Sequential(
            nn.BatchNorm1d(1024),
            nn.Dropout(0.35),
            nn.Linear(1024, 512),
            nn.Mish(),
            nn.BatchNorm1d(512),
            nn.Dropout(0.25),
            nn.Linear(512, 128),
            nn.Mish(),
            nn.BatchNorm1d(128),
            nn.Dropout(0.15),
            nn.Linear(128, num_classes)
        )

    def extract_features(self, x):
        x = self.stem(x)
        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)
        x = self.multiscale(x)
        x = self.cbam(x)
        x = self.transformer_attn(x)
        return self.flatten(self.concat_pool(x))

    def forward(self, x):
        feats = self.extract_features(x)
        return self.head(feats)

ClinicalECGMultiScaleResNet = ECGConVT

# ==============================================================================
# 4. FOCAL LOSS & TEMPERATURE CALIBRATION
# ==============================================================================
class FocalLabelSmoothingLoss(nn.Module):
    def __init__(self, alpha=None, gamma=2.0, label_smoothing=0.10):
        super().__init__()
        self.alpha = alpha
        self.gamma = gamma
        self.smoothing = label_smoothing

    def forward(self, logits, targets):
        num_classes = logits.size(-1)
        log_preds = F.log_softmax(logits, dim=-1)
        with torch.no_grad():
            true_dist = torch.zeros_like(log_preds)
            true_dist.fill_(self.smoothing / (num_classes - 1))
            true_dist.scatter_(1, targets.data.unsqueeze(1), 1.0 - self.smoothing)
        probs = torch.exp(log_preds)
        pt = torch.gather(probs, 1, targets.unsqueeze(1)).squeeze(1)
        focal_weight = (1.0 - pt) ** self.gamma
        ce = -(true_dist * log_preds).sum(dim=-1)
        if self.alpha is not None:
            focal_weight = focal_weight * self.alpha[targets]
        return (focal_weight * ce).mean()

class ModelWithTemperature(nn.Module):
    def __init__(self, model):
        super().__init__()
        self.model = model
        self.temperature = nn.Parameter(torch.ones(1) * 1.5)

    def forward(self, x):
        return self.model(x) / self.temperature

    def calibrate(self, valid_loader):
        self.model.eval()
        nll_criterion = nn.CrossEntropyLoss().to(device)
        logits_list, labels_list = [], []
        with torch.no_grad():
            for imgs, lbls in valid_loader:
                imgs = imgs.to(device)
                logits_list.append(self.model(imgs))
                labels_list.append(lbls)
        logits = torch.cat(logits_list).to(device)
        labels = torch.cat(labels_list).to(device)
        optimizer = torch.optim.LBFGS([self.temperature], lr=0.01, max_iter=50)
        def eval_step():
            optimizer.zero_grad()
            loss = nll_criterion(logits / self.temperature, labels)
            loss.backward()
            return loss
        optimizer.step(eval_step)
        print(f"Optimal Temperature parameter: {self.temperature.item():.4f}")

# ==============================================================================
# 5. DATASET & TRAINING LOOP
# ==============================================================================
class CardiacDataset(Dataset):
    def __init__(self, df, transform=None):
        self.df = df
        self.transform = transform
        self.preprocessor = AdaptiveECGPreprocessor((224, 224))
    def __len__(self):
        return len(self.df)
    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        img = self.preprocessor(Image.open(row['path']))
        label = int(row['label'])
        if self.transform:
            img = self.transform(img)
        return img, label

def train_classical(epochs=18, batch_size=32, lr=3e-4):
    script_dir = Path(__file__).resolve().parent
    root_dir = script_dir.parent
    dataset_root = (root_dir.parent / "Dataset").resolve()
    
    train_dir = dataset_root / "train"
    test_dir = dataset_root / "test"
    
    print(f"Dataset root: {dataset_root}")
    df_train_all = scan_dataset(train_dir)
    df_test = scan_dataset(test_dir)
    
    from sklearn.model_selection import StratifiedShuffleSplit
    sss = StratifiedShuffleSplit(n_splits=1, test_size=0.15, random_state=42)
    train_idx, val_idx = next(sss.split(df_train_all, df_train_all['label']))
    
    df_train = df_train_all.iloc[train_idx].reset_index(drop=True)
    df_val = df_train_all.iloc[val_idx].reset_index(drop=True)
    
    train_transforms = transforms.Compose([
        transforms.RandomHorizontalFlip(p=0.15),
        transforms.RandomRotation(degrees=(-4, 4)),
        transforms.ColorJitter(brightness=0.08, contrast=0.08),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    eval_transforms = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    train_loader = DataLoader(CardiacDataset(df_train, train_transforms), batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(CardiacDataset(df_val, eval_transforms), batch_size=batch_size, shuffle=False)
    test_loader = DataLoader(CardiacDataset(df_test, eval_transforms), batch_size=batch_size, shuffle=False)
    
    class_counts = df_train['label'].value_counts().sort_index().values
    class_weights = len(df_train) / (len(CLASSES) * class_counts)
    class_weights_t = torch.tensor(class_weights, dtype=torch.float32).to(device)
    
    model = ECGConVT(num_classes=len(CLASSES), pretrained=True).to(device)
    criterion = FocalLabelSmoothingLoss(alpha=class_weights_t, gamma=2.0, label_smoothing=0.10)
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-6)
    scaler = torch.amp.GradScaler('cuda' if torch.cuda.is_available() else 'cpu')
    
    best_val_acc = 0.0
    best_state = None
    
    print("\nTraining ECGConVT Classical Architecture...")
    print("=" * 70)
    for epoch in range(1, epochs + 1):
        t0 = time.time()
        model.train()
        r_loss, correct, total = 0.0, 0, 0
        for imgs, lbls in train_loader:
            imgs, lbls = imgs.to(device), lbls.to(device)
            optimizer.zero_grad()
            with torch.amp.autocast('cuda' if torch.cuda.is_available() else 'cpu'):
                outs = model(imgs)
                loss = criterion(outs, lbls)
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
            r_loss += loss.item() * imgs.size(0)
            preds = outs.argmax(dim=1)
            correct += (preds == lbls).sum().item()
            total += lbls.size(0)
            
        scheduler.step()
        train_loss = r_loss / total
        train_acc = (correct / total) * 100.0
        
        # Validation
        model.eval()
        v_loss, v_corr, v_tot = 0.0, 0, 0
        with torch.no_grad():
            for imgs, lbls in val_loader:
                imgs, lbls = imgs.to(device), lbls.to(device)
                with torch.amp.autocast('cuda' if torch.cuda.is_available() else 'cpu'):
                    outs = model(imgs)
                    loss = criterion(outs, lbls)
                v_loss += loss.item() * imgs.size(0)
                preds = outs.argmax(dim=1)
                v_corr += (preds == lbls).sum().item()
                v_tot += lbls.size(0)
        val_acc = (v_corr / v_tot) * 100.0
        elapsed = time.time() - t0
        
        print(f"Epoch [{epoch:02d}/{epochs:02d}] ({elapsed:.1f}s) | Train Loss: {train_loss:.4f} - Acc: {train_acc:.2f}% | Val Loss: {val_loss:.4f} - Acc: {val_acc:.2f}%")
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_state = copy.deepcopy(model.state_dict())
            print(f"  --> [Saved Best ECGConVT Model] Val Acc: {best_val_acc:.2f}%")
            
    model.load_state_dict(best_state)
    
    # Calibration
    calibrated = ModelWithTemperature(model)
    calibrated.calibrate(val_loader)
    
    # Export Checkpoint
    out_models_dir = root_dir / "Models"
    out_models_dir.mkdir(exist_ok=True)
    ckpt_path = out_models_dir / "best_classical_cardiac_model.pt"
    
    torch.save({
        'model_name': 'QuantumX ECGConVT (CNN-Vision Transformer Hybrid)',
        'classes': CLASSES,
        'num_classes': len(CLASSES),
        'best_val_acc': float(best_val_acc),
        'temperature': float(calibrated.temperature.item()),
        'model_state_dict': model.state_dict(),
        'timestamp': time.strftime("%Y-%m-%d %H:%M:%S")
    }, ckpt_path)
    print(f"\nModel checkpoint successfully saved to: {ckpt_path}")

if __name__ == '__main__':
    train_classical()
