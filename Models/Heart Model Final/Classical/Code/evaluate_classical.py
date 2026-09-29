"""QuantumX Production Classical Evaluator with TTA, Calibration Metrics, and Grad-CAM++
Evaluates best_classical_cardiac_model.pt on Dataset/test and exports results to Test/ and Diagram/
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
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, brier_score_loss

from train_classical import (
    ClinicalECGMultiScaleResNet, ModelWithTemperature,
    CardiacDataset, scan_dataset, CLASSES
)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

def compute_ece(probs, targets, n_bins=10):
    """Computes Expected Calibration Error (ECE) across confidence bins."""
    bin_boundaries = np.linspace(0, 1, n_bins + 1)
    confidences = np.max(probs, axis=1)
    predictions = np.argmax(probs, axis=1)
    accuracies = (predictions == targets)

    ece = 0.0
    for i in range(n_bins):
        bin_lower = bin_boundaries[i]
        bin_upper = bin_boundaries[i + 1]
        in_bin = (confidences > bin_lower) & (confidences <= bin_upper)
        prop_in_bin = np.mean(in_bin)

        if prop_in_bin > 0:
            accuracy_in_bin = np.mean(accuracies[in_bin])
            avg_confidence_in_bin = np.mean(confidences[in_bin])
            ece += np.abs(avg_confidence_in_bin - accuracy_in_bin) * prop_in_bin

    return ece

def evaluate_classical():
    script_dir = Path(__file__).resolve().parent
    root_dir = script_dir.parent
    dataset_root = (root_dir.parent / "Dataset").resolve()
    test_dir = dataset_root / "test"
    
    ckpt_path = root_dir / "Models" / "best_classical_cardiac_model.pt"
    if not ckpt_path.exists():
        print(f"Error: Checkpoint not found at {ckpt_path}. Run train_classical.py first.")
        return
        
    print(f"Loading checkpoint: {ckpt_path}")
    ckpt = torch.load(ckpt_path, map_location=device)
    model = ClinicalECGMultiScaleResNet(num_classes=len(CLASSES), pretrained=False).to(device)
    model.load_state_dict(ckpt['model_state_dict'])
    model.eval()
    
    # Load temperature
    temperature = ckpt.get('temperature', 1.0)
    print(f"Applying Temperature Calibration: T = {temperature:.4f}")
    
    # Blacklist strict holdout files
    abs_test_dir = (root_dir.parent / "Test Cases Absolute").resolve()
    blacklist = set()
    if abs_test_dir.exists():
        for root_d, _, files in os.walk(abs_test_dir):
            for f in files:
                blacklist.add(f.lower())
    print(f"Strict holdout blacklisted images: {len(blacklist)}")

    df_test = scan_dataset(test_dir, blacklist=blacklist)
    print(f"Evaluating on {len(df_test)} test images...")
    
    eval_transforms = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    test_loader = DataLoader(CardiacDataset(df_test, eval_transforms), batch_size=32, shuffle=False)
    
    all_preds, all_targets, all_probs = [], [], []
    with torch.no_grad():
        for imgs, lbls in test_loader:
            imgs = imgs.to(device)
            # Temperature scaled logits
            logits = model(imgs) / temperature
            probs = F.softmax(logits, dim=1)
            preds = probs.argmax(dim=1)
            
            all_preds.extend(preds.cpu().numpy())
            all_targets.extend(lbls.numpy())
            all_probs.extend(probs.cpu().numpy())
            
    all_preds = np.array(all_preds)
    all_targets = np.array(all_targets)
    all_probs = np.array(all_probs)
    
    acc = (all_preds == all_targets).mean() * 100.0
    ece = compute_ece(all_probs, all_targets)
    macro_auc = roc_auc_score(all_targets, all_probs, multi_class='ovr', average='macro')
    
    print("\n==========================================")
    print(f"CLASSICAL MODEL TEST ACCURACY:   {acc:.2f}%")
    print(f"MACRO ONE-VS-REST ROC-AUC:      {macro_auc:.4f}")
    print(f"EXPECTED CALIBRATION ERROR (ECE): {ece:.4f}")
    print("==========================================\n")
    
    rep = classification_report(all_targets, all_preds, target_names=CLASSES, digits=4)
    print(rep)
    
    # Export report to Test/
    test_out_dir = root_dir / "Test"
    test_out_dir.mkdir(exist_ok=True)
    report_file = test_out_dir / "classical_test_report.txt"
    with open(report_file, "w") as fp:
        fp.write(f"QuantumX Multi-Scale CBAM Classical Classifier Evaluation\n")
        fp.write(f"Test Accuracy: {acc:.2f}%\n")
        fp.write(f"Macro ROC-AUC: {macro_auc:.4f}\n")
        fp.write(f"Calibration ECE: {ece:.4f}\n\n")
        fp.write(rep)
    print(f"Report saved to: {report_file}")
    
    # Export Confusion Matrix to Diagram/
    diag_dir = root_dir / "Diagram"
    diag_dir.mkdir(exist_ok=True)
    cm = confusion_matrix(all_targets, all_preds, normalize='true')
    plt.figure(figsize=(7, 6))
    sns.heatmap(cm, annot=True, fmt='.2%', cmap='Blues', xticklabels=CLASSES, yticklabels=CLASSES)
    plt.title(f"Classical Normalized Confusion Matrix (Acc: {acc:.2f}%)")
    plt.xlabel("Predicted Diagnosis")
    plt.ylabel("True Ground Truth")
    plt.tight_layout()
    diag_file = diag_dir / "classical_confusion_matrix.png"
    plt.savefig(diag_file, dpi=300)
    print(f"Confusion matrix saved to: {diag_file}")

    # ==============================================================================
    # 5. BALANCED 12-LEAD SHAP EXPLANATION (PATHO-PHYSIOLOGICAL CAUSALITY)
    # ==============================================================================
    print("\nGenerating Balanced 12-Lead SHAP Explainability Decomposition...")
    from shap_explainer_classical import ClassicalECGShapExplainer, build_stratified_background
    train_dir = dataset_root / "train"
    bg_batch = build_stratified_background(train_dir, samples_per_class=4, blacklist=blacklist)
    shap_explainer = ClassicalECGShapExplainer(model, bg_batch, temperature=temperature)

    # Select representative test sample for in-depth explanation
    sample_row = df_test.iloc[0]
    sample_img = Image.open(sample_row['path']).convert('RGB')
    prep = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    sample_tensor = prep(sample_img).unsqueeze(0).to(device)

    exp = shap_explainer.explain_sample(sample_tensor, nsamples=40)
    shap_report = shap_explainer.generate_explanation_report(exp)
    print(shap_report)

    shap_report_path = test_out_dir / "classical_shap_report.txt"
    with open(shap_report_path, "w") as fp:
        fp.write(shap_report)
    print(f"Classical SHAP Report saved to: {shap_report_path}")

    shap_diag_path = diag_dir / "classical_shap_balanced_explanation.png"
    shap_explainer.plot_balanced_explanation(sample_img, exp, save_path=str(shap_diag_path))

if __name__ == '__main__':
    evaluate_classical()
