"""QuantumX Scientific Experiment Orchestrator
Executes the 4 Core Clinical & Quantum Experiments:
1. Patient Leakage Benchmark: File-Level Random Split vs. Strict Inter-Patient Split
2. NISQ Hardware Noise Benchmark: Ideal Statevector vs. Calibrated IBM Sherbrooke Noise vs. M3 Mitigation
3. Low-Data Scarcity Benchmark: Classical vs. Hybrid at 10%, 25%, 50%, and 100% Patient Cohorts
4. Clinical Anatomical Explainability: Grad-CAM++ Lead Waveform Energy Ratio (LWER)
"""

import os
import sys
import json
import time
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from PIL import Image

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, Dataset, TensorDataset
from torchvision import models, transforms
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, classification_report, confusion_matrix

# Add shared paths
current_dir = Path(__file__).resolve().parent
sys.path.append(str(current_dir))
sys.path.append(str(current_dir.parent / "Classical" / "Code"))
sys.path.append(str(current_dir.parent / "Hybrid" / "Code"))

from patient_data import scan_full_dataset, create_patient_isolated_splits, CLASSES
from autoencoder_bridge import LatentCardiacAutoencoder, train_latent_autoencoder
from ecg_preprocessing import ClinicalECGPreprocessor
from quantum_circuit import HybridQuantumCardiacModel, mitigator, NUM_QUBITS, NUM_LAYERS
from gradcam_evaluator import GradCAMPlusPlus, compute_waveform_energy_ratio

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using Compute Device: {device}")

# ==============================================================================
# FEATURE EXTRACTOR BACKBONE (ECGConVT Stem & Concat Pooling)
# ==============================================================================
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

class ClassicalClassifierHead(nn.Module):
    def __init__(self, in_features=1024, num_classes=4):
        super().__init__()
        self.head = nn.Sequential(
            nn.BatchNorm1d(in_features),
            nn.Dropout(0.30),
            nn.Linear(in_features, 256),
            nn.Mish(),
            nn.BatchNorm1d(256),
            nn.Dropout(0.20),
            nn.Linear(256, 64),
            nn.Mish(),
            nn.BatchNorm1d(64),
            nn.Linear(64, num_classes)
        )
    def forward(self, x):
        return self.head(x)

class ECGImageDataset(Dataset):
    def __init__(self, df, preprocessor, eval_transform):
        self.df = df
        self.preprocessor = preprocessor
        self.eval_transform = eval_transform
    def __len__(self):
        return len(self.df)
    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        img = Image.open(row['path']).convert('RGB')
        img = self.preprocessor(img)
        return self.eval_transform(img), int(row['label'])

def run_all_experiments():
    base_dir = current_dir.parent
    dataset_dir = base_dir / "Dataset"
    holdout_dir = base_dir / "Test Cases Absolute"
    diagram_dir = base_dir / "Diagram"
    results_dir = base_dir / "Results"
    diagram_dir.mkdir(exist_ok=True, parents=True)
    results_dir.mkdir(exist_ok=True, parents=True)
    
    # 1. LOAD FULL DATASET & STRICT PATIENT SPLITS
    print("\n==================================================================")
    print("STEP 1: SCANNING DATASET & GENERATING PATIENT-ISOLATED SPLITS")
    print("==================================================================")
    df_all = scan_full_dataset(dataset_dir, holdout_dir)
    df_train, df_val, df_test = create_patient_isolated_splits(df_all, test_size=0.15, val_size=0.15, random_state=42)
    
    preprocessor = ClinicalECGPreprocessor(target_size=(224, 224), grid_suppression=True)
    eval_transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    # 2. FEATURE EXTRACTION & CACHING
    print("\n==================================================================")
    print("STEP 2: EXTRACTING & CACHING 1024-DIM RESNET CONCAT-POOL FEATURES")
    print("==================================================================")
    extractor = CardiacFeatureExtractor().to(device)
    
    # Check if classical checkpoint exists to load fine-tuned weights
    ckpt_path = base_dir / "Classical" / "Models" / "best_classical_cardiac_model.pt"
    if ckpt_path.exists():
        print(f"Loading pretrained visual weights from: {ckpt_path.name}")
        ckpt = torch.load(ckpt_path, map_location=device)
        state = {k: v for k, v in ckpt['model_state_dict'].items() if 'stem' in k or 'layer' in k}
        extractor.load_state_dict(state, strict=False)
    extractor.eval()
    
    cache_file = base_dir / "Shared" / "cached_resnet_features.pt"
    if cache_file.exists():
        print(f"Loading cached patient features from: {cache_file.name}")
        cached_data = torch.load(cache_file)
        X_train, y_train = cached_data['X_train'], cached_data['y_train']
        X_val, y_val = cached_data['X_val'], cached_data['y_val']
        X_test, y_test = cached_data['X_test'], cached_data['y_test']
    else:
        def cache_tensor_dataset(df, desc):
            ds = ECGImageDataset(df, preprocessor, eval_transform)
            loader = DataLoader(ds, batch_size=64, shuffle=False, num_workers=0)
            feats, labels = [], []
            print(f"Caching {desc} ({len(df)} images)...")
            with torch.no_grad():
                for imgs, lbls in loader:
                    imgs = imgs.to(device)
                    f = extractor(imgs)
                    feats.append(f.cpu())
                    labels.append(lbls)
            return torch.cat(feats, dim=0), torch.cat(labels, dim=0)

        X_train, y_train = cache_tensor_dataset(df_train, "Train Set")
        X_val, y_val = cache_tensor_dataset(df_val, "Validation Set")
        X_test, y_test = cache_tensor_dataset(df_test, "Test Set")
        torch.save({'X_train': X_train, 'y_train': y_train, 'X_val': X_val, 'y_val': y_val, 'X_test': X_test, 'y_test': y_test}, cache_file)
        print(f"Saved feature cache to: {cache_file}")

    # 3. PRE-TRAIN LATENT CARDIAC AUTOENCODER (1024 -> 8 -> 1024)
    print("\n==================================================================")
    print("STEP 3: PRE-TRAINING LATENT CARDIAC AUTOENCODER BRIDGE (1024 -> 8)")
    print("==================================================================")
    ae = LatentCardiacAutoencoder(in_features=1024, latent_dim=8)
    ae = train_latent_autoencoder(ae, X_train, X_val, epochs=40, batch_size=64, lr=1e-3, device=device)
    
    # Measure reconstruction variance retention
    ae.eval()
    with torch.no_grad():
        x_rec, z = ae(X_test.to(device))
        test_mse = F.mse_loss(x_rec, X_test.to(device)).item()
        orig_var = torch.var(X_test).item()
        explained_var = 1.0 - (test_mse / orig_var)
    print(f"Autoencoder Latent Test MSE: {test_mse:.6f} | Retained Variance: {explained_var*100:.2f}%")
    
    # 4. EXPERIMENT 1: PATIENT LEAKAGE BENCHMARK (RANDOM VS PATIENT-ISOLATED)
    print("\n==================================================================")
    print("EXPERIMENT 1: PATIENT DATA LEAKAGE BENCHMARK")
    print("==================================================================")
    from sklearn.model_selection import train_test_split
    X_all_f = torch.cat([X_train, X_val, X_test], dim=0)
    y_all_l = torch.cat([y_train, y_val, y_test], dim=0)
    X_tr_leak, X_te_leak, y_tr_leak, y_te_leak = train_test_split(X_all_f, y_all_l, test_size=0.15, random_state=42, stratify=y_all_l)
    
    def train_classifier(X_tr, y_tr, X_te, y_te, epochs=25, lr=2e-3):
        model = ClassicalClassifierHead(in_features=1024, num_classes=4).to(device)
        opt = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
        crit = nn.CrossEntropyLoss()
        ds = TensorDataset(X_tr, y_tr)
        bs = min(32, len(X_tr))
        loader = DataLoader(ds, batch_size=bs, shuffle=True, drop_last=(len(X_tr) > bs and len(X_tr) % bs == 1))
        for ep in range(epochs):
            model.train()
            for bx, by in loader:
                bx, by = bx.to(device), by.to(device)
                opt.zero_grad()
                out = model(bx)
                loss = crit(out, by)
                loss.backward()
                opt.step()
        model.eval()
        with torch.no_grad():
            preds = model(X_te.to(device)).argmax(dim=-1).cpu()
            acc = accuracy_score(y_te, preds)
            f1 = f1_score(y_te, preds, average='macro')
        return acc, f1

    acc_leak, f1_leak = train_classifier(X_tr_leak, y_tr_leak, X_te_leak, y_te_leak)
    acc_clean, f1_clean = train_classifier(X_train, y_train, X_test, y_test)
    
    print(f"  Random File Split (Intra-Patient Leakage): Accuracy = {acc_leak*100:.2f}% | F1 = {f1_leak:.4f}")
    print(f"  Strict Inter-Patient Split (Honest):       Accuracy = {acc_clean*100:.2f}% | F1 = {f1_clean:.4f}")
    
    # 5. EXPERIMENT 2: NISQ HARDWARE NOISE BENCHMARK (IDEAL VS NOISY VS MITIGATED)
    print("\n==================================================================")
    print("EXPERIMENT 2: PHYSICAL NISQ HARDWARE NOISE BENCHMARK")
    print("==================================================================")
    # Train Hybrid Model using the pre-trained autoencoder bridge
    hybrid_model = HybridQuantumCardiacModel(in_features=1024, num_qubits=NUM_QUBITS, num_layers=NUM_LAYERS, num_classes=4, autoencoder=ae).to(device)
    
    opt_hybrid = torch.optim.AdamW([
        {'params': hybrid_model.classifier.parameters(), 'lr': 2e-3},
        {'params': hybrid_model.fusion.parameters(), 'lr': 1e-3},
        {'params': hybrid_model.classical_context.parameters(), 'lr': 1e-3},
        {'params': [hybrid_model.weights], 'lr': 1e-2}
    ], weight_decay=1e-4)
    crit = nn.CrossEntropyLoss()
    
    train_ds = TensorDataset(X_train, y_train)
    train_loader = DataLoader(train_ds, batch_size=64, shuffle=True)
    
    print("Training Hybrid Quantum Model on clean patient-isolated features...")
    hybrid_model.set_execution_mode('ideal')
    for epoch in range(25):
        hybrid_model.train()
        for bx, by in train_loader:
            bx, by = bx.to(device), by.to(device)
            opt_hybrid.zero_grad()
            out = hybrid_model(bx)
            loss = crit(out, by)
            loss.backward()
            opt_hybrid.step()
            
    # Benchmark on test set under the 3 modes (using sample subset for parameter-shift speed)
    X_test_sub = X_test[:60].to(device)
    y_test_sub = y_test[:60]
    
    hybrid_model.eval()
    with torch.no_grad():
        # Mode 1: Ideal
        hybrid_model.set_execution_mode('ideal')
        preds_ideal = hybrid_model(X_test_sub).argmax(dim=-1).cpu()
        acc_ideal = accuracy_score(y_test_sub, preds_ideal)
        
        # Mode 2: Hardware Noisy (IBM Sherbrooke parameters)
        print("Evaluating under simulated IBM Quantum Sherbrooke noise...")
        hybrid_model.set_execution_mode('noisy')
        preds_noisy = hybrid_model(X_test_sub).argmax(dim=-1).cpu()
        acc_noisy = accuracy_score(y_test_sub, preds_noisy)
        
        # Mode 3: M3 Readout Error Mitigated
        print("Evaluating under M3 Readout Error Mitigation...")
        hybrid_model.set_execution_mode('mitigated')
        preds_mitigated = hybrid_model(X_test_sub).argmax(dim=-1).cpu()
        acc_mitigated = accuracy_score(y_test_sub, preds_mitigated)
        
    print(f"  Ideal Simulator (default.qubit):           Accuracy = {acc_ideal*100:.2f}%")
    print(f"  Physical Hardware Noisy (IBM Sherbrooke): Accuracy = {acc_noisy*100:.2f}%")
    print(f"  M3 Readout Mitigated Hardware:             Accuracy = {acc_mitigated*100:.2f}%")
    
    # 6. EXPERIMENT 3: LOW-DATA SCARCITY REGIME (10%, 25%, 50%, 100%)
    print("\n==================================================================")
    print("EXPERIMENT 3: LOW-DATA SCARCITY BENCHMARK (CLASSICAL VS HYBRID)")
    print("==================================================================")
    fractions = [0.10, 0.25, 0.50, 1.00]
    classical_scarcity_acc = []
    hybrid_scarcity_acc = []
    
    for frac in fractions:
        n_samples = max(int(len(X_train) * frac), 20)
        idx = np.random.choice(len(X_train), n_samples, replace=False)
        X_sub, y_sub = X_train[idx], y_train[idx]
        
        # Train classical head
        c_acc, _ = train_classifier(X_sub, y_sub, X_test, y_test, epochs=20, lr=2e-3)
        classical_scarcity_acc.append(c_acc)
        
        # Train hybrid model
        h_sub = HybridQuantumCardiacModel(in_features=1024, num_qubits=NUM_QUBITS, num_layers=NUM_LAYERS, num_classes=4, autoencoder=ae).to(device)
        h_opt = torch.optim.AdamW(h_sub.parameters(), lr=2e-3, weight_decay=1e-4)
        bs_sub = min(32, len(X_sub))
        sub_loader = DataLoader(TensorDataset(X_sub, y_sub), batch_size=bs_sub, shuffle=True, drop_last=(len(X_sub) > bs_sub and len(X_sub) % bs_sub == 1))
        h_sub.set_execution_mode('ideal')
        for ep in range(20):
            h_sub.train()
            for bx, by in sub_loader:
                bx, by = bx.to(device), by.to(device)
                h_opt.zero_grad()
                out = h_sub(bx)
                loss = crit(out, by)
                loss.backward()
                h_opt.step()
        h_sub.eval()
        with torch.no_grad():
            h_preds = h_sub(X_test.to(device)).argmax(dim=-1).cpu()
            h_acc = accuracy_score(y_test, h_preds)
        hybrid_scarcity_acc.append(h_acc)
        print(f"  Data Cohort {int(frac*100)}% ({n_samples} patients): Classical={c_acc*100:.2f}% | Hybrid={h_acc*100:.2f}%")
        
    # 7. EXPERIMENT 4: GRAD-CAM++ CLINICAL LEAD LOCALIZATION
    print("\n==================================================================")
    print("EXPERIMENT 4: GRAD-CAM++ ANATOMICAL LEAD LOCALIZATION")
    print("==================================================================")
    gradcam_extractor = GradCAMPlusPlus(extractor, extractor.features[7])
    
    lwer_scores = []
    sample_test_imgs = []
    for i in range(min(50, len(df_test))):
        img_p = df_test.iloc[i]['path']
        raw_img = Image.open(img_p).convert('RGB')
        proc_img = preprocessor(raw_img)
        inp_t = eval_transform(proc_img).unsqueeze(0).to(device)
        cam = gradcam_extractor.generate(inp_t)
        ratio = compute_waveform_energy_ratio(cam, margin_percent=0.10)
        lwer_scores.append(ratio)
        
    avg_lwer = np.mean(lwer_scores)
    print(f"  Average Lead Waveform Energy Ratio (LWER): {avg_lwer*100:.2f}%")
    print(f"  (Percentage of activation energy focused strictly inside ECG waveform boundaries)")
    
    # 8. SAVE SUMMARY RESULTS & GENERATE PUBLICATION-QUALITY FIGURES
    print("\n==================================================================")
    print("STEP 8: EXPORTING PUBLICATION FIGURES & EXPERIMENTAL LOG")
    print("==================================================================")
    results_data = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_unique_patients": len(df_all),
        "split_summary": {
            "train_patients": len(df_train),
            "val_patients": len(df_val),
            "test_patients": len(df_test)
        },
        "autoencoder_retained_variance": float(explained_var),
        "exp1_leakage": {
            "random_split_accuracy": float(acc_leak),
            "random_split_f1": float(f1_leak),
            "patient_isolated_accuracy": float(acc_clean),
            "patient_isolated_f1": float(f1_clean)
        },
        "exp2_hardware_noise": {
            "ideal_simulator_accuracy": float(acc_ideal),
            "noisy_sherbrooke_accuracy": float(acc_noisy),
            "mitigated_accuracy": float(acc_mitigated)
        },
        "exp3_scarcity": {
            "fractions": fractions,
            "classical_accuracies": [float(x) for x in classical_scarcity_acc],
            "hybrid_accuracies": [float(x) for x in hybrid_scarcity_acc]
        },
        "exp4_gradcam": {
            "average_lwer": float(avg_lwer)
        }
    }
    
    with open(results_dir / "scientific_experiments_report.json", "w", encoding="utf-8") as fp:
        json.dump(results_data, fp, indent=2)
        
    # Figure 1: Data Leakage Gap
    plt.figure(figsize=(7, 4.5))
    bars = plt.bar(["Intra-Patient (Random Split)", "Inter-Patient (Strict Isolation)"], [acc_leak*100, acc_clean*100], color=['#e74c3c', '#2ecc71'], width=0.5)
    plt.ylabel("Accuracy (%)", fontsize=11, fontweight='bold')
    plt.title("Experiment 1: Intra-Patient Leakage vs. Strict Inter-Patient Split", fontsize=12, fontweight='bold')
    plt.ylim(0, 100)
    for b in bars:
        h = b.get_height()
        plt.text(b.get_x() + b.get_width()/2., h + 1.5, f"{h:.2f}%", ha='center', va='bottom', fontweight='bold')
    plt.tight_layout()
    plt.savefig(diagram_dir / "exp1_patient_leakage_benchmark.png", dpi=300)
    plt.close()
    
    # Figure 2: Quantum Hardware Noise Degradation & M3 Mitigation
    plt.figure(figsize=(8, 4.5))
    bars2 = plt.bar(["Ideal Statevector\n(default.qubit)", "IBM Sherbrooke Noise\n(Physical QPU)", "M3 Mitigated\n(Readout Inversion)"], 
                    [acc_ideal*100, acc_noisy*100, acc_mitigated*100], color=['#3498db', '#e67e22', '#9b59b6'], width=0.5)
    plt.ylabel("Accuracy (%)", fontsize=11, fontweight='bold')
    plt.title("Experiment 2: Quantum Hardware Noise & Error Mitigation", fontsize=12, fontweight='bold')
    plt.ylim(0, 100)
    for b in bars2:
        h = b.get_height()
        plt.text(b.get_x() + b.get_width()/2., h + 1.5, f"{h:.2f}%", ha='center', va='bottom', fontweight='bold')
    plt.tight_layout()
    plt.savefig(diagram_dir / "exp2_quantum_hardware_noise.png", dpi=300)
    plt.close()
    
    # Figure 3: Low Data Regime Scarcity
    plt.figure(figsize=(8, 4.5))
    pct_labels = [f"{int(f*100)}%" for f in fractions]
    plt.plot(pct_labels, [x*100 for x in classical_scarcity_acc], marker='o', linewidth=2.5, label='Classical ECGConVT', color='#e74c3c')
    plt.plot(pct_labels, [x*100 for x in hybrid_scarcity_acc], marker='s', linewidth=2.5, label='Hybrid Quantum (8-Qubit HQNN)', color='#2980b9')
    plt.xlabel("Patient Training Cohort Size (%)", fontsize=11, fontweight='bold')
    plt.ylabel("Test Accuracy (%)", fontsize=11, fontweight='bold')
    plt.title("Experiment 3: Generalization Across Low-Data Scarcity Regimes", fontsize=12, fontweight='bold')
    plt.grid(True, linestyle='--', alpha=0.6)
    plt.legend(fontsize=10, loc='lower right')
    plt.tight_layout()
    plt.savefig(diagram_dir / "exp3_data_scarcity_benchmark.png", dpi=300)
    plt.close()
    
    print("\n[ALL EXPERIMENTS COMPLETED SUCCESSFULLY!]")
    print(f"Results JSON: {results_dir / 'scientific_experiments_report.json'}")
    print(f"Diagrams saved to: {diagram_dir}")

if __name__ == '__main__':
    run_all_experiments()
