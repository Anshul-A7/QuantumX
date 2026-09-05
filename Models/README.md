# ⚛️ QuantumX Machine Learning & Quantum Model Registry

> **Platform Architecture**: QuantumX Hybrid Quantum-Classical Clinical Intelligence Platform  
> **Primary Repository**: Medical AI, Quantum Machine Learning (QML), and Tri-Model Verification Protocols  
> **Compliance Standard**: Zero-Data-Leakage Tri-Model Benchmark Verification Protocol (TM-BVP)  
> **Active Production Suite**: [`Models/v1 - Breast Cancer/`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1%20-%20Breast%20Cancer/)  

---

## 1. Multi-Disease Hierarchical Architecture & Taxonomy

The QuantumX platform is structured across three primary clinical disease pillars. Each disease domain is categorized by its specific diagnostic test modality, progressing from initial working baseline implementations (`v1`) to advanced, enhanced iterations (`v2`, `v3`):

```
Models/
├── README.md                                          # Master Model Registry specification (this file)
│
├── Breast Cancer/                                     # Disease Category 1: Oncology & Cytopathology
│   └── FNA Cytopathology (Nuclear Morphometry)/       # Test Modality: Fine Needle Aspiration Biopsy
│       ├── v1/                                        # [Active Production] 8-Qubit VQC & Classical Ensemble
│       ├── v2/                                        # [Improved Iteration] Multi-Ansatz Hardware Mitigation
│       └── v3/                                        # [Improved Iteration] Fault-Tolerant Quantum Kernels
│
├── Cardiovascular Disease/                            # Disease Category 2: Cardiology & Emergency Triage
│   ├── Heart Attack (ECG Image)/                      # Modality A: 12-Lead Continuous Wavelet Spectrogram
│   │   ├── v1/                                        # [Active Production] PTB-XL Wavelet + Hybrid QNN
│   │   └── v2/                                        # [Improved Iteration] Multi-Scale Dynamic Wavelet QNN
│   ├── Biochemical Blood Panel (Tabular 1)/           # Modality B: Molecular Biomarkers (hs-cTnI, NT-proBNP)
│   │   └── v1/                                        # [Active Production] Extreme Gradient Boosted Trees
│   └── Hemodynamic & Stress Profile (Tabular 2)/      # Modality C: Physiological Circulation & Vitals
│       └── v1/                                        # [Active Production] Calibrated Clinical Risk Engine
│
└── Neurological Disease/                              # Disease Category 3: Neurology & Neuro-Degeneration
    └── (Under Development / Roadmap Specification)    # Future Multi-Modal EEG / Biomarker Modality
```

---

## 2. Iterative Model Roadmap & Strategic Mandate

1. **Phase 1 (Baseline Operational Deployment — Active)**:
   - Construct, train, and statistically verify the core `v1` working models across all three diagnostic categories (Breast Cancer FNA Cytopathology, Cardiovascular 12-Lead ECG Spectrograms, and Cardiovascular Molecular/Hemodynamic Tabular Panels).
   - Ensure zero data leakage, strict fold isolation, and end-to-end integration with the FastAPI backend inference services.

2. **Phase 2 (Iterative Improvement & Algorithmic Evolution — `v2`, `v3`)**:
   - Once all `v1` baselines are operational, systematically upgrade each model to improved `v2` and `v3` generations.
   - Target enhancements include deeper quantum entanglement ansatzes, hardware-calibrated Zero-Noise Extrapolation (ZNE), Pauli Error Cancellation (PEC), and adaptive feature selection.
   - Maintain strict organizational hygiene by nesting each new iteration within its designated disease root and test modality directory.

---

## 3. Active Production Directory: [`v1 - Breast Cancer/`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1%20-%20Breast%20Cancer/)

### Clinical & Technical Profile
* **Target Pathology**: Malignant vs. Benign Cytopathology Triage (Wisconsin Diagnostic Breast Cancer — WDBC).
* **Architecture Class**: 8-Qubit Parameterized Quantum Circuit (PQC) & Classical Benchmark Ensemble (XGBoost, SVM-RBF, Random Forest, PyTorch MLP).
* **Feature Selection**: Improved Simulated Annealing (ISA) selecting $d = 8$ canonical nuclear biomarkers with geometric kernel difference verification ($s_K$).
* **Quantum Circuit**: 8-Wire Second-Order Pauli-$Z$ ($ZZ$) Feature Map with $L = 2$ Strongly Entangling Layers ($48$ variational rotation parameters).
* **Noise Mitigation**: Calibrated Superconducting Quantum Noise Channels (Depolarizing, Thermal Relaxation, SPAM) with Richardson Polynomial Zero-Noise Extrapolation (ZNE).
* **Explainability**: QXplain Multi-Level XAI (Level 1 SHAP, Level 2 Gate Ablation Saliency $\mathcal{S}(G_k)$, Level 3 Subsystem Entanglement Entropy) and Cryptographically Signed OpenQASM 3.0 Receipts.
* **Master Interactive Artifact**: [`QuantumX_v1_Training_Pipeline.ipynb`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1%20-%20Breast%20Cancer/QuantumX_v1_Training_Pipeline.ipynb).
* **Complete System Documentation**: [`Models/v1 - Breast Cancer/README.md`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1%20-%20Breast%20Cancer/README.md).

### Component Layout
```
Models/v1 - Breast Cancer/
├── README.md                              # Complete v1 platform architecture documentation
├── QuantumX_v1_Training_Pipeline.ipynb    # Primary interactive research notebook (Colab / GPU)
├── artifacts_v1/                          # Pretrained model weights, scalers, and JSON configs
├── benchmarks/                            # Publication-grade figures, ROC curves, and reports
├── Test Cases - Breast Cancer/            # 9 multi-modal clinical test cases (5 Benign, 4 Malignant)
└── src/                                   # 10 modular, executable production engines
    ├── 01_data_preprocessing_engine.py    # Ingestion, scaling, ISA feature selection
    ├── 02_classical_benchmark_suite.py    # Classical classifiers (XGBoost, SVM, RF, MLP)
    ├── 03_quantum_circuits_and_ansatz.py  # PennyLane state embeddings & VQC circuits
    ├── 04_quantum_noise_and_error_mitigation.py # Superconducting noise emulation & ZNE
    ├── 05_quantum_explainability_xai.py   # QXplain gate saliency & OpenQASM receipts
    ├── 06_train_and_verification_pipeline.py # Master 50-fold training loop & stats
    ├── 07_classical_inference_engine.py   # Dedicated classical inference service (CX-01)
    ├── 08_quantum_hybrid_inference_engine.py # Dedicated quantum inference service (QX-01)
    ├── 09_clinical_risk_stratification_engine.py # Calibrated risk scoring & triage tiers
    ├── 10_generate_benchmark_graphs.py    # Scientific plotting & figure generation
    └── __init__.py                        # Dynamic package loader & export bindings
```

---

## 4. Execution & CLI Quickstart (Modules 01 to 10)

Every module in the active `Models/v1 - Breast Cancer/src/` engine is a standalone, executable script equipped with integrated validation self-tests.

```powershell
# Navigate to repository root
cd c:\Users\anshu\OneDrive\Desktop\QuantumX

# --- Core Modules & Quantum Pipeline Engines ---
# 01. Run Data Preprocessing & Simulated Annealing (ISA) Self-Test
.\Backend\.venv\Scripts\python.exe "Models/v1 - Breast Cancer/src/01_data_preprocessing_engine.py"

# 02. Run Classical Benchmark Suite Self-Test (XGBoost, SVM, RF, ElasticNet, MLP)
.\Backend\.venv\Scripts\python.exe "Models/v1 - Breast Cancer/src/02_classical_benchmark_suite.py"

# 03. Run Quantum Circuits, VQC & HQNN Self-Test
.\Backend\.venv\Scripts\python.exe "Models/v1 - Breast Cancer/src/03_quantum_circuits_and_ansatz.py"

# 04. Run Superconducting Quantum Noise & Richardson ZNE Self-Test
.\Backend\.venv\Scripts\python.exe "Models/v1 - Breast Cancer/src/04_quantum_noise_and_error_mitigation.py"

# 05. Run QXplain Gate Saliency & OpenQASM 3.0 Receipt Generator
.\Backend\.venv\Scripts\python.exe "Models/v1 - Breast Cancer/src/05_quantum_explainability_xai.py"

# 06. Execute Master 50-Fold Repeated CV Training & Statistical Verification
.\Backend\.venv\Scripts\python.exe "Models/v1 - Breast Cancer/src/06_train_and_verification_pipeline.py"

# --- Production Inference & Clinical Triage ---
# 07. Run Dedicated Classical Production Inference Engine (CX-01)
.\Backend\.venv\Scripts\python.exe "Models/v1 - Breast Cancer/src/07_classical_inference_engine.py"

# 08. Run Dedicated Hybrid Quantum Production Inference Engine (QX-01)
.\Backend\.venv\Scripts\python.exe "Models/v1 - Breast Cancer/src/08_quantum_hybrid_inference_engine.py"

# 09. Run Clinical Risk Stratification & Morphometric Evidence Index (MEI) Engine
.\Backend\.venv\Scripts\python.exe "Models/v1 - Breast Cancer/src/09_clinical_risk_stratification_engine.py"

# 10. Generate High-Resolution Publication Figures & Master Dashboard
.\Backend\.venv\Scripts\python.exe "Models/v1 - Breast Cancer/src/10_generate_benchmark_graphs.py"
```

---

## 5. Scientific Literature & Mathematical Foundations

1. **WDBC Comparative Benchmark Framework (Gluhovic et al., 2026 — Paper 33)**: Establishes comparative baselines between classical kernel methods and parameterized quantum circuits on fine-needle aspirate (FNA) nuclear morphometry.
2. **Improved Simulated Annealing Feature Selection (PMC12939053 — Paper 37)**: Implements adaptive combinatorial optimization minimizing $\text{Cost}(S) = (1 - \text{Accuracy}_{\text{CV}}(S)) + \beta \frac{|S|}{D}$ to isolate high-signal biomarker submanifolds.
3. **Superconducting Quantum Noise Emulation (PMC13111684 — Paper 30)**: Integrates calibrated noise models reflecting transmon superconducting qubit decoherence ($T_1, T_2$) and applies Richardson Zero-Noise Extrapolation $\hat{E}_{\text{ZNE}} = \sum_{j=1}^M \gamma_j E(\lambda_j)$.
4. **QuantumNeuroXAI Explainability (Nature Sci Rep 2026 — Paper 17)**: Formulates gate ablation saliency metrics $\mathcal{S}(G_k) = |\hat{y}(\boldsymbol{\theta}) - \hat{y}_{\setminus G_k}(\boldsymbol{\theta})|$ and bipartite Von Neumann entanglement entropy $S(\rho_A) = -\text{Tr}(\rho_A \ln \rho_A)$ for verifiable quantum decisions.
5. **Quantum Hyperdimensional Computing (Nature npj Unconv Comp 2026 — Paper 18)**: Holographic state embedding in $256$-dimensional complex Hilbert state space for distributed noise resilience.
6. **Tri-Model Benchmark Verification Protocol (TM-BVP)**: 50-fold repeated stratified cross-validation with zero data leakage, McNemar's chi-squared discordance testing ($\chi^2$), and Wilcoxon signed-rank verification.
