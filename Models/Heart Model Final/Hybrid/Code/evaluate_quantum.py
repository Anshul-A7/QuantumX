"""QuantumX Production Hybrid Quantum Evaluator
Evaluates best_hybrid_quantum_cardiac_model.pt on Dataset/test and exports metrics to Test/ and Diagram/
"""

import os
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from PIL import Image

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, Dataset
from torchvision import models, transforms
from sklearn.metrics import classification_report, confusion_matrix

from quantum_circuit import HybridQuantumCardiacModel
from train_quantum import CardiacFeatureExtractor, scan_dataset, RawECGDataset, CLASSES

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

def evaluate_quantum():
    script_dir = Path(__file__).resolve().parent
    root_dir = script_dir.parent
    dataset_root = (root_dir.parent / "Dataset").resolve()
    test_dir = dataset_root / "test"
    
    ckpt_path = root_dir / "Models" / "best_hybrid_quantum_cardiac_model.pt"
    if not ckpt_path.exists():
        print(f"Error: Hybrid checkpoint not found at {ckpt_path}. Please train first.")
        return
        
    print(f"Loading hybrid quantum checkpoint: {ckpt_path}")
    ckpt = torch.load(ckpt_path, map_location=device)
    model = HybridQuantumCardiacModel().to(device)
    model.load_state_dict(ckpt['model_state_dict'])
    model.eval()
    
    # Feature extractor
    encoder = CardiacFeatureExtractor().to(device)
    classical_ckpt = (root_dir.parent / "Classical" / "Models" / "best_classical_cardiac_model.pt").resolve()
    if classical_ckpt.exists():
        c_ckpt = torch.load(classical_ckpt, map_location=device)
        encoder.load_state_dict({k: v for k, v in c_ckpt['model_state_dict'].items() if 'layer' in k or 'stem' in k}, strict=False)
    encoder.eval()
    
    # Blacklist strict holdout files
    abs_test_dir = (root_dir.parent / "Test Cases Absolute").resolve()
    blacklist = set()
    if abs_test_dir.exists():
        for root, _, files in os.walk(abs_test_dir):
            for f in files:
                blacklist.add(f.lower())
                
    df_test = scan_dataset(test_dir, blacklist=blacklist)
    print(f"Evaluating Hybrid Quantum model on {len(df_test)} test images...")
    
    eval_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    test_loader = DataLoader(RawECGDataset(df_test, eval_transforms), batch_size=32, shuffle=False)
    
    all_preds, all_targets = [], []
    with torch.no_grad():
        for imgs, lbls in test_loader:
            imgs = imgs.to(device)
            feats = encoder(imgs)
            outs = model(feats)
            preds = outs.argmax(dim=1)
            all_preds.extend(preds.cpu().numpy())
            all_targets.extend(lbls.numpy())
            
    all_preds = np.array(all_preds)
    all_targets = np.array(all_targets)
    
    acc = (all_preds == all_targets).mean() * 100.0
    print(f"\n==========================================")
    print(f"HYBRID QUANTUM TEST ACCURACY: {acc:.2f}%")
    print(f"PREVIOUS BASELINE:           28.57% (Random Guess)")
    print(f"NET IMPROVEMENT:             +{acc - 28.57:.2f}%")
    print(f"==========================================\n")
    
    rep = classification_report(all_targets, all_preds, target_names=CLASSES, digits=4)
    print(rep)
    
    # Save report
    test_dir_out = root_dir / "Test"
    test_dir_out.mkdir(exist_ok=True)
    out_file = test_dir_out / "quantum_test_report.txt"
    with open(out_file, "w") as fp:
        fp.write(f"Hybrid Quantum Test Accuracy: {acc:.2f}%\n")
        fp.write(f"Previous Random Baseline: 28.57%\n\n")
        fp.write(rep)
    print(f"Report saved to: {out_file}")
    
    # Save diagram
    diag_dir = root_dir / "Diagram"
    diag_dir.mkdir(exist_ok=True)
    cm = confusion_matrix(all_targets, all_preds, normalize='true')
    plt.figure(figsize=(7, 6))
    sns.heatmap(cm, annot=True, fmt='.2%', cmap='Purples', xticklabels=CLASSES, yticklabels=CLASSES)
    plt.title(f"Hybrid Quantum Confusion Matrix (Acc: {acc:.2f}%)")
    plt.xlabel("Predicted Diagnosis")
    plt.ylabel("True Diagnosis")
    plt.tight_layout()
    diag_path = diag_dir / "quantum_confusion_matrix.png"
    plt.savefig(diag_path, dpi=300)
    print(f"Diagram saved to: {diag_path}")

    # ==============================================================================
    # 5. BALANCED QUANTUM-CLASSICAL Q-SHAP EXPLANATION (16 QUANTUM OBSERVABLES)
    # ==============================================================================
    print("\nGenerating Balanced Hybrid Quantum Q-SHAP Explainability Decomposition...")
    from shap_explainer_quantum import HybridQuantumShapExplainer
    
    # Assemble balanced background from train set
    df_train_all = scan_dataset(dataset_root / "train", blacklist=blacklist)
    bg_tensors = []
    for cls in CLASSES:
        sub = df_train_all[df_train_all['class_name'] == cls]
        chosen = sub.sample(min(4, len(sub)), random_state=42)
        for _, row in chosen.iterrows():
            img = Image.open(row['path']).convert('RGB')
            bg_tensors.append(eval_transforms(img))
    bg_batch_imgs = torch.stack(bg_tensors, dim=0).to(device)
    
    with torch.no_grad():
        bg_feats_1024 = encoder(bg_batch_imgs)
        
    q_shap_explainer = HybridQuantumShapExplainer(model, bg_feats_1024)
    
    # Pick a sample from test set
    sample_row = df_test.iloc[0]
    sample_img = Image.open(sample_row['path']).convert('RGB')
    sample_tensor = eval_transforms(sample_img).unsqueeze(0).to(device)
    with torch.no_grad():
        sample_feat_1024 = encoder(sample_tensor)
        
    q_exp = q_shap_explainer.explain_sample(sample_feat_1024, nsamples=40)
    q_report = q_shap_explainer.generate_explanation_report(q_exp)
    print(q_report)
    
    q_report_path = test_dir_out / "quantum_shap_report.txt"
    with open(q_report_path, "w") as fp:
        fp.write(q_report)
    print(f"Quantum SHAP Report saved to: {q_report_path}")
    
    q_diag_path = diag_dir / "quantum_shap_balanced_explanation.png"
    q_shap_explainer.plot_balanced_explanation(q_exp, save_path=str(q_diag_path))

if __name__ == '__main__':
    evaluate_quantum()
