# ⚛️ QuantumX v1: End-to-End Hybrid Quantum & Classical ML Training Engine

> **System Designation**: QuantumX Platform — Clinical Biomarker & Variational Quantum Classifier Pipeline  
> **Target Pathology**: Malignant vs. Benign Neoplasm Stratification (Wisconsin Diagnostic Breast Cancer — WDBC)  
> **Architecture Class**: 8-Qubit Variational Quantum Classifier (VQC) & Classical Benchmark Ensemble  
> **Primary Interactive Artifact**: [`QuantumX_v1_Training_Pipeline.ipynb`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1/QuantumX_v1_Training_Pipeline.ipynb)  
> **Source Directory**: [`Models/v1/src/`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1/src/) (Sequentially Numbered Engines 01 to 10)  
> **Benchmark Artifacts**: [`Models/v1/benchmarks/`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1/benchmarks/)  
> **Production Weights**: [`Models/v1/artifacts_v1/`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1/artifacts_v1/)  
> **Compliance & Protocol**: Smart India Hackathon 2026 (SIH26139) — Zero-Data-Leakage Tri-Model Benchmark Verification Protocol (TM-BVP)

---

## 1. System Overview & Clinical Problem Formulation

QuantumX v1 is an enterprise-grade medical machine learning and quantum computing framework engineered for high-precision diagnostic cytopathology triage. Using fine-needle aspirate (FNA) cellular morphometry from the Wisconsin Diagnostic Breast Cancer (WDBC) dataset ($N = 569$ patients, 30 continuous nuclear characteristics), QuantumX v1 addresses the challenge of resolving ambiguous, borderline cellular dysplasia where classical linear boundaries experience elevated false-negative rates.

The platform executes a parallel benchmarking protocol: high-performance classical champions (XGBoost, SVM-RBF, Random Forest, PyTorch MLP) are evaluated side-by-side with an 8-Qubit Parameterized Quantum Circuit operating in a $2^8 = 256$-dimensional complex Hilbert state space ($\mathbb{C}^{256}$).

---

## 2. Scientific Literature Foundations & Theoretical Equations

### 1. WDBC Comparative Benchmark Framework (Gluhovic et al., 2026 — Paper 33)
* **Theoretical Rationale**: Demonstrates that mapping non-linear cytopathology feature correlations into an 8-qubit quantum state space preserves discriminatory decision boundaries while respecting physical NISQ coherence constraints.
* **Clinical Target**: Distinguishing malignant neoplasms (cellular pleomorphism, irregular contours, high density) from benign dysplasia.

### 2. Improved Simulated Annealing (ISA) Feature Selection (PMC12939053 — Paper 37)
* **Optimization Objective Function**:
  $$\min_{S \subseteq \mathcal{F}} \text{Cost}(S) = (1 - \text{Accuracy}_{\text{CV}}(S)) + \beta \frac{|S|}{D}$$
  where $\mathcal{F}$ is the 30-feature candidate space, $D = 30$, $|S| = 8$ selected biomarkers, and $\beta = 0.05$ is the feature sparsity penalty.
* **Metropolis-Hastings Acceptance Criterion**:
  $$P(\text{accept}) = \exp\left(-\frac{\Delta \text{Cost}}{T_k}\right), \quad T_{k+1} = \alpha T_k, \quad \alpha = 0.92$$
  with dynamic perturbation reconstructing candidate subsets using $\pm 1$ and $\pm 2$ feature mutations.

### 3. Superconducting Quantum Noise Emulation & Error Mitigation (PMC13111684 — Paper 30)
* **Quantum Noise Channels**:
  * **Depolarizing Error Channel**: $\mathcal{E}_{\text{dep}}(\rho) = (1 - p)\rho + \frac{p}{3}\sum_{k \in \{X, Y, Z\}} \sigma_k \rho \sigma_k$
  * **Thermal Relaxation ($T_1$) & Pure Dephasing ($T_2$)**: Calibrated across Baseline ($p_{1q}=0.0004, p_{2q}=0.003, \text{SPAM}=0.01$), Target ($0.0002, 0.0005, 0.005$), and Desired ($0.00012, 0.00029, 0.0029$) hardware tiers.
* **Richardson Polynomial Zero-Noise Extrapolation (ZNE)**:
  $$\hat{E}_{\text{ZNE}} = \sum_{j=1}^M \gamma_j E(\lambda_j), \quad \text{where } \sum_{j=1}^M \gamma_j = 1 \text{ and } \sum_{j=1}^M \gamma_j \lambda_j^k = 0 \quad (\forall k \in \{1, \dots, M-1\})$$

### 4. QuantumNeuroXAI Multi-Level Explainability (Nature Sci Rep 2026 — Paper 17)
* **Level 1 (Input Feature Attribution)**: Directional TreeSHAP and permutation feature importance.
* **Level 2 (Quantum Gate Ablation Saliency)**: Evaluates the causal impact of each quantum gate $G_k$ on the predicted malignancy probability:
  $$\mathcal{S}(G_k) = |\hat{y}(\boldsymbol{\theta}) - \hat{y}_{\setminus G_k}(\boldsymbol{\theta})|$$
* **Level 3 (Subsystem Entanglement Entropy)**: Von Neumann entropy measuring bipartite state entanglement across wire bipartitions:
  $$S(\rho_A) = -\text{Tr}(\rho_A \ln \rho_A), \quad \rho_A = \text{Tr}_B(|\psi\rangle\langle\psi|)$$

### 5. Quantum Hyperdimensional Computing (Nature npj Unconv Comp 2026 — Paper 18)
* **High-Dimensional State Encoding**: Maps 8 normalized continuous biomarker coordinates into $\mathbb{C}^{256}$, providing holographic noise resilience against local gate decoherence.

### 6. Tri-Model Benchmark Verification Protocol (TM-BVP)
* **50-Fold Repeated Stratified Cross-Validation**: 10 distinct stratified folds evaluated across 5 random seeds with zero data leakage.
* **McNemar's Chi-Squared Contingency Test**:
  $$\chi^2 = \frac{(|b - c| - 1)^2}{b + c}, \quad p < 0.05$$
* **Huang et al. (2021) Geometric Kernel Difference Metric**:
  $$s_K(K_Q, K_C) = \sqrt{\frac{1}{N} \text{Tr}\left((K_Q - K_C)^2\right)}$$

---

## 3. Directory Layout & Complete File Inventory

```
Models/v1/
├── QuantumX_v1_Training_Pipeline.ipynb   # Primary interactive research notebook
├── INSIGHTS.md                            # Comprehensive telemetry, saliency & circuit pruning report
├── README.md                              # Complete system architecture documentation (this file)
├── artifacts_v1/                          # Serialized model weights and production checkpoints
│   ├── feature_scaler.joblib              # Zero-leakage Winsorized StandardScaler parameters
│   ├── quantum_scaler.joblib              # MinMax scaler mapping features to [0, π]
│   ├── svm_rbf_production.joblib          # Trained RBF Support Vector Machine model
│   ├── xgboost_production.joblib          # Trained XGBoost Gradient Boosted Trees model
│   ├── random_forest_production.joblib    # Trained Random Forest model (1000 estimators)
│   ├── vqc_weights.npy                    # Trained 8-qubit VQC rotation parameters (shape: 2 × 8 × 3)
│   ├── vqc_config.json                    # Quantum circuit hyperparameters and ansatz configuration
│   ├── feature_metadata.json              # Canonical selected feature names and indices
│   ├── benchmark_report.json              # Comprehensive 50-fold statistical evaluation summary
│   └── QuantumX_v1_Trained_Models_Bundle.zip # Compressed offline weights archive
├── benchmarks/                            # Publication-grade figures, ROC curves, and reports
│   ├── Figure1_MultiMetric_Comparison.png # Multi-metric comparative bar chart with error bars
│   ├── Figure2_ROC_Curves.png             # Receiver Operating Characteristic (ROC) curves & AUROC
│   ├── Figure3_Quantum_Saliency_Heatmap.png # QXplain causal gate ablation saliency heatmaps
│   ├── Figure4_Quantum_Circuit_Architecture.png # Rendered 8-qubit PennyLane circuit diagram
│   ├── Figure_Master_Benchmark_Dashboard.png # Master 4-panel publication benchmark dashboard
│   ├── QuantumX_v1_Training_Convergence_and_Saliency_Execution.png # VQC loss descent & convergence plot
│   └── QuantumX_v1_Comprehensive_Scientific_Report.md # Formal report with signed OpenQASM 3.0 receipts
└── src/                                   # Numbered sequential pipeline source files
    ├── 01_data_preprocessing_engine.py    # Step 01: Ingestion, scaling, ISA feature selection
    ├── 02_classical_benchmark_suite.py    # Step 02: Classical classifiers (XGBoost, SVM, RF, MLP)
    ├── 03_quantum_circuits_and_ansatz.py  # Step 03: PennyLane quantum state embeddings and VQC
    ├── 04_quantum_noise_and_error_mitigation.py # Step 04: Superconducting noise emulation & ZNE
    ├── 05_quantum_explainability_xai.py   # Step 05: QXplain gate saliency & OpenQASM 3.0 export
    ├── 06_train_and_verification_pipeline.py # Step 06: Master 50-fold training loop & stats
    ├── 07_classical_inference_engine.py   # Step 07: Dedicated classical inference service (CX-01)
    ├── 08_quantum_hybrid_inference_engine.py # Step 08: Dedicated quantum inference service (QX-01)
    ├── 09_clinical_risk_stratification_engine.py # Step 09: Calibrated risk scoring & triage tiers
    ├── 10_generate_benchmark_graphs.py    # Step 10: Scientific plotting & figure generation
    └── __init__.py                        # Dynamic module loader and package exports
```

---

## 4. Detailed Specification of Source Modules (`src/`)

### [`01_data_preprocessing_engine.py`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1/src/01_data_preprocessing_engine.py)
* **Purpose**: Ingests WDBC cytopathology data, enforces strict fold isolation (zero leakage), applies 1st/99th percentile Winsorization, scales features to the rotational interval $[0, \pi]$, and executes Simulated Annealing feature selection.
* **Key Classes & Methods**: `load_wdbc_dataset`, `FoldPreprocessor`, `ImprovedSimulatedAnnealingSelector`, `GeometricDifferenceCalculator`.

### [`02_classical_benchmark_suite.py`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1/src/02_classical_benchmark_suite.py)
* **Purpose**: Defines and tunes the classical champion classifier suite: XGBoost (`n_estimators=100, max_depth=3`), Support Vector Machine (`kernel='rbf', C=10.0, gamma='scale'`), Random Forest (`n_estimators=1000`), ElasticNet Logistic Regression, and PyTorch Deep MLP.
* **Key Classes & Methods**: `XGBoostChampion`, `SVMRBFChampion`, `RandomForestChampion`, `ElasticNetLogisticChampion`, `PyTorchMLPChampion`, `evaluate_classifier`.

### [`03_quantum_circuits_and_ansatz.py`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1/src/03_quantum_circuits_and_ansatz.py)
* **Purpose**: Constructs PennyLane quantum circuits across 8 wires: Hadamard superposition $H^{\otimes 8}$, single-qubit phase rotations $R_z(2x_i)$, second-order entangling blocks $\text{CNOT} \to R_z(2(\pi-x_i)(\pi-x_j)) \to \text{CNOT}$, $L=2$ Strongly Entangling Layers with circular CNOTs, and Pauli-$Z$ observable expectation measurements $\langle \sigma_z^{(i)} \rangle$.
* **Key Classes & Methods**: `zz_feature_map`, `strongly_entangling_ansatz`, `VariationalQuantumClassifier`, `QuantumKernelSVM`, `HQNNChampion`.

### [`04_quantum_noise_and_error_mitigation.py`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1/src/04_quantum_noise_and_error_mitigation.py)
* **Purpose**: Emulates physical superconducting quantum processor noise (depolarizing, amplitude/phase damping, readout SPAM) and implements Richardson polynomial Zero-Noise Extrapolation across noise scale factors $\lambda \in \{1.0, 1.5, 2.0, 3.0\}$.
* **Key Classes & Methods**: `NoisyQuantumDevice`, `ZeroNoiseExtrapolator`.

### [`05_quantum_explainability_xai.py`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1/src/05_quantum_explainability_xai.py)
* **Purpose**: Implements QXplain Level 2 causal gate ablation saliency $\mathcal{S}(G_k)$, Level 3 subsystem Von Neumann entanglement entropy, and generates cryptographically signed OpenQASM 3.0 circuit receipts with SHA-256 validation hashes.
* **Key Classes & Methods**: `compute_input_feature_importance`, `QuantumGateAblator`, `compute_von_neumann_entropy`, `CryptographicQuantumReceiptGenerator`.

### [`06_train_and_verification_pipeline.py`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1/src/06_train_and_verification_pipeline.py)
* **Purpose**: Master orchestrator executing 50-fold repeated stratified cross-validation, Parameter-Shift gradient computation, Adam optimization, model serialization, McNemar's $\chi^2$ discordance contingency matrix calculation, and Wilcoxon signed-rank verification.
* **Key Classes & Methods**: `StatisticalSignificanceEngine`, `QuantumXMasterPipeline`.

### [`07_classical_inference_engine.py`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1/src/07_classical_inference_engine.py)
* **Purpose**: Dedicated standalone inference service for classical models (`CX-01`). Loads production weights from `artifacts_v1/`, expands 8 canonical features to 30 baseline dimensions, computes a weighted ensemble probability ($0.50 \cdot P_{\text{SVM}} + 0.35 \cdot P_{\text{XGB}} + 0.15 \cdot P_{\text{RF}}$), evaluates directional SHAP attributions, and returns calibrated clinical risk tiers in $<5\text{ ms}$.
* **Key Classes & Methods**: `AegisClassicalEngine`, `aegis_engine`.

### [`08_quantum_hybrid_inference_engine.py`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1/src/08_quantum_hybrid_inference_engine.py)
* **Purpose**: Dedicated standalone inference service for the hybrid quantum model (`QX-01`). Executes the 8-qubit VQC on local CPU statevector simulators ($<15\text{ ms}$) or compiles to real IBM Quantum superconducting QPUs via Qiskit Runtime, calculating live gate ablation saliencies and OpenQASM 3.0 receipts.
* **Key Classes & Methods**: `QuantumXHybridEngine`, `quantumx_engine`.

### [`09_clinical_risk_stratification_engine.py`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1/src/09_clinical_risk_stratification_engine.py)
* **Purpose**: Synthesizes model output probabilities with the empirical Morphometric Evidence Index (MEI) derived from WDBC class-conditional quantiles, mapping predictions into continuous Risk Scores ($0.0$ to $100.0$) and four actionable triage tiers: `LOW RISK`, `BORDERLINE`, `HIGH RISK`, and `CRITICAL`.
* **Key Classes & Methods**: `compute_calibrated_clinical_risk`, `calculate_morphometric_evidence_index`.

### [`10_generate_benchmark_graphs.py`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1/src/10_generate_benchmark_graphs.py)
* **Purpose**: Standalone scientific plotting script rendering high-resolution ($300\ \text{DPI}$) publication figures and dashboards directly into [`Models/v1/benchmarks/`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1/benchmarks/).

### [`__init__.py`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1/src/__init__.py)
* **Purpose**: Package initialization script providing dynamic module loading and exposing all pipeline classes and singletons for clean external imports.

---

## 5. Execution Instructions

### Option A: Interactive Jupyter Notebook (Recommended)
1. Open [`QuantumX_v1_Training_Pipeline.ipynb`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1/QuantumX_v1_Training_Pipeline.ipynb).
2. If executing on Google Colab, select **Runtime > Change runtime type > T4 GPU**.
3. Run all cells sequentially. The notebook executes data ingestion, simulated annealing feature selection, model training, noise simulation, gate saliency heatmap generation, and OpenQASM 3.0 export.

### Option B: Local Command-Line Execution (Python CLI)
```powershell
# Navigate to repository root
cd c:\Users\anshu\OneDrive\Desktop\QuantumX

# 1. Run full master training & verification pipeline (50-fold CV)
.\Backend\.venv\Scripts\python.exe Models/v1/src/06_train_and_verification_pipeline.py

# 2. Test classical production inference engine (CX-01)
.\Backend\.venv\Scripts\python.exe Models/v1/src/07_classical_inference_engine.py

# 3. Test quantum hybrid production inference engine (QX-01)
.\Backend\.venv\Scripts\python.exe Models/v1/src/08_quantum_hybrid_inference_engine.py

# 4. Generate publication benchmark figures and master dashboard
.\Backend\.venv\Scripts\python.exe Models/v1/src/10_generate_benchmark_graphs.py
```
