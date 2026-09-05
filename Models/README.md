# ⚛️ QuantumX Machine Learning & Quantum Model Registry

> **Platform Architecture**: QuantumX Hybrid Quantum-Classical Clinical Intelligence Platform  
> **Primary Repository**: Medical AI, Quantum Machine Learning (QML), and Tri-Model Verification Protocols  
> **Compliance Standard**: Zero-Data-Leakage Tri-Model Benchmark Verification Protocol (TM-BVP)  
> **Active Production Suite**: [`Models/v1 - Breast Cancer/`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1%20-%20Breast%20Cancer/)  

---

## 1. Executive Summary & Model Portfolio

The `Models/` registry hosts the clinical machine learning architectures, parameterized quantum circuits, and statistical verification engines developed for the QuantumX platform. The architectures leverage dual-execution paradigms—combining state-of-the-art classical models (Gradient Boosted Trees, RBF Support Vector Machines, Deep Neural Networks) with Variational Quantum Classifiers (VQC) and Quantum Kernel Methods operating in high-dimensional Hilbert spaces ($\mathbb{C}^{2^n}$).

### Model Directory Index

#### [`v1 - Breast Cancer/`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1%20-%20Breast%20Cancer/) (Active Production Pipeline)
* **Clinical Target**: Malignant vs. Benign Cytopathology Triage (Wisconsin Diagnostic Breast Cancer — WDBC).
* **Architecture Class**: 8-Qubit Parameterized Quantum Circuit (PQC) & Classical Benchmark Ensemble (XGBoost, SVM-RBF, Random Forest, PyTorch MLP).
* **Feature Selection**: Improved Simulated Annealing (ISA) selecting $d = 8$ canonical nuclear biomarkers with geometric kernel difference verification ($s_K$).
* **Quantum Circuit**: 8-Wire Second-Order Pauli-$Z$ ($ZZ$) Feature Map with $L = 2$ Strongly Entangling Layers ($48$ variational rotation parameters).
* **Noise Mitigation**: Calibrated Superconducting Quantum Noise Channels (Depolarizing, Thermal Relaxation, SPAM) with Richardson Polynomial Zero-Noise Extrapolation (ZNE).
* **Explainability**: QXplain Multi-Level XAI (Level 1 SHAP, Level 2 Gate Ablation Saliency $\mathcal{S}(G_k)$, Level 3 Subsystem Entanglement Entropy) and Cryptographically Signed OpenQASM 3.0 Receipts.
* **Master Interactive Artifact**: [`QuantumX_v1_Training_Pipeline.ipynb`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1%20-%20Breast%20Cancer/QuantumX_v1_Training_Pipeline.ipynb).
* **Complete System Documentation**: [`Models/v1 - Breast Cancer/README.md`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1%20-%20Breast%20Cancer/README.md).

---

## 2. Theoretical Foundations & Scientific Literature

All models implemented in the QuantumX registry are grounded in peer-reviewed scientific literature and rigorous clinical trial data standards:

1. **WDBC Comparative Benchmark Framework (Gluhovic et al., 2026 — Paper 33)**: Establishes the comparative baseline between classical kernel methods and parameterized quantum circuits on fine-needle aspirate (FNA) nuclear morphometry.
2. **Improved Simulated Annealing Feature Selection (PMC12939053 — Paper 37)**: Implements adaptive combinatorial optimization minimizing $\text{Cost}(S) = (1 - \text{Accuracy}_{\text{CV}}(S)) + \beta \frac{|S|}{D}$ to isolate high-signal biomarker submanifolds.
3. **Superconducting Quantum Noise Emulation (PMC13111684 — Paper 30)**: Integrates calibrated noise models reflecting transmon superconducting qubit decoherence ($T_1, T_2$) and applies Richardson Zero-Noise Extrapolation $\hat{E}_{\text{ZNE}} = \sum_{j=1}^M \gamma_j E(\lambda_j)$.
4. **QuantumNeuroXAI Explainability (Nature Sci Rep 2026 — Paper 17)**: Formulates gate ablation saliency metrics $\mathcal{S}(G_k) = |\hat{y}(\boldsymbol{\theta}) - \hat{y}_{\setminus G_k}(\boldsymbol{\theta})|$ and bipartite Von Neumann entanglement entropy $S(\rho_A) = -\text{Tr}(\rho_A \ln \rho_A)$ for verifiable quantum decisions.
5. **Quantum Hyperdimensional Computing (Nature npj Unconv Comp 2026 — Paper 18)**: Holographic state embedding in $256$-dimensional complex Hilbert state space for distributed noise resilience.
6. **Tri-Model Benchmark Verification Protocol (TM-BVP)**: 50-fold repeated stratified cross-validation with zero data leakage, McNemar's chi-squared discordance testing ($\chi^2$), and Wilcoxon signed-rank verification.

---

## 3. Directory Layout & Module Structure

```
Models/
├── README.md                              # Model registry specification (this file)
└── v1 - Breast Cancer/                    # Breast cancer diagnostic and quantum pipeline
    ├── README.md                          # Exhaustive v1 system architecture documentation
    ├── QuantumX_v1_Training_Pipeline.ipynb # Primary interactive Colab/Jupyter training notebook
    └── src/                               # Numbered sequential pipeline source files (01 to 10)
        ├── 01_data_preprocessing_engine.py    # Step 01: Ingestion, zero-leakage scaling, ISA selection
        ├── 02_classical_benchmark_suite.py    # Step 02: Classical classifiers (XGBoost, SVM, RF, MLP)
        ├── 03_quantum_circuits_and_ansatz.py  # Step 03: PennyLane state embeddings & VQC circuits
        ├── 04_quantum_noise_and_error_mitigation.py # Step 04: Superconducting noise emulation & ZNE
        ├── 05_quantum_explainability_xai.py   # Step 05: QXplain gate saliency & OpenQASM receipts
        ├── 06_train_and_verification_pipeline.py # Step 06: Master 50-fold training loop & stats
        ├── 07_classical_inference_engine.py   # Step 07: Dedicated classical inference service (CX-01)
        ├── 08_quantum_hybrid_inference_engine.py # Step 08: Dedicated quantum inference service (QX-01)
        ├── 09_clinical_risk_stratification_engine.py # Step 09: Calibrated risk scoring & triage tiers
        ├── 10_generate_benchmark_graphs.py    # Step 10: Scientific plotting & figure generation
        └── __init__.py                        # Dynamic package initialization & export bindings
```

---

## 4. Execution & CLI Quickstart

All model engines are executable via Python command line or the interactive Jupyter notebook.

### Option A: Interactive Research Notebook
Open [`Models/v1 - Breast Cancer/QuantumX_v1_Training_Pipeline.ipynb`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1%20-%20Breast%20Cancer/QuantumX_v1_Training_Pipeline.ipynb) in Jupyter Lab, VS Code, or Google Colab (with GPU acceleration).

### Option B: Local CLI Execution
```powershell
# Navigate to repository root
cd c:\Users\anshu\OneDrive\Desktop\QuantumX

# 1. Execute Master 50-Fold Repeated CV Training Loop
.\Backend\.venv\Scripts\python.exe "Models/v1 - Breast Cancer/src/06_train_and_verification_pipeline.py"

# 2. Run Classical Production Inference Engine (CX-01)
.\Backend\.venv\Scripts\python.exe "Models/v1 - Breast Cancer/src/07_classical_inference_engine.py"

# 3. Run Hybrid Quantum Production Inference Engine (QX-01)
.\Backend\.venv\Scripts\python.exe "Models/v1 - Breast Cancer/src/08_quantum_hybrid_inference_engine.py"

# 4. Generate Publication Figures & Dashboards
.\Backend\.venv\Scripts\python.exe "Models/v1 - Breast Cancer/src/10_generate_benchmark_graphs.py"
```
