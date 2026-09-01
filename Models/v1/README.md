# ⚛️ QuantumX Model Training Environment (v1)

This directory contains the foundational dataset ingestion, zero-leakage preprocessing, and Colab training pipeline for **QuantumX**.

---

## 📁 Directory Structure
```
Models/v1/
├── QuantumX_Training_Pipeline_v1.ipynb   # Full Google Colab training notebook
├── data_loaders.py                      # Standalone zero-leakage dataset loaders
└── README.md                            # Architecture & execution guide
```

---

## 🩺 Supported Datasets & Benchmarks

| Dataset | Modality | Samples ($N$) | Features ($D$) | Target Distribution | Quantum Encoding |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **WDBC (Breast Cancer)** | Fine Needle Aspirate | 569 | 30 | 357 Benign (62.7%) / 212 Malignant (37.3%) | 8-Qubit ZZ-Feature Map |
| **Cleveland Heart Disease** | Clinical Biomarkers | 303 | 13 | 164 Healthy (54.1%) / 139 Cardiac Risk (45.9%) | 6-Qubit Angle / ZZ Map |
| **Chronic Kidney Disease** | Nephrology & Blood | 400 | 24 | 150 Non-CKD (37.5%) / 250 CKD (62.5%) | 6-Qubit ZZ-Feature Map |

---

## 🔬 Zero-Leakage Preprocessing Protocol

1. **Winsorization**:
   Clipped strictly on training partition to $[q_{0.01}, q_{0.99}]$ quantiles to eliminate extreme sensor outliers.
2. **Standard Scaling**:
   $$z = \frac{x - \mu_{\text{train}}}{\sigma_{\text{train}}}$$
3. **Phase-Space Normalization**:
   Maps PCA components to $[-\pi, \pi]$ for parameterized rotation gates ($R_y, R_z$) without angle saturation.
4. **Validation**:
   5-fold stratified cross-validation with 10 repetitions ($50$ trials total).

---

## 🚀 How to Run in Google Colab

1. Open [Google Colab](https://colab.research.google.com/).
2. Click **Upload** and select [`QuantumX_Training_Pipeline_v1.ipynb`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1/QuantumX_Training_Pipeline_v1.ipynb).
3. Set Runtime to **T4 GPU** (`Runtime > Change runtime type > T4 GPU`).
4. Execute Step 1 (Dependency Setup) and Step 3 (Dataset Loaders & Visualizations).
