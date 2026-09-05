# ⚛️ QuantumX v1: End-to-End Hybrid Quantum & Classical ML Training Engine

## 📖 Overview
QuantumX v1 is an enterprise-grade medical machine learning and quantum computing training framework designed for rigorous clinical biomarker classification, quantum kernel advantage screening, and physical NISQ noise emulation.

The **primary research artifact** is the interactive Jupyter Notebook [`QuantumX_v1_Training_Pipeline.ipynb`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1/QuantumX_v1_Training_Pipeline.ipynb), which executes the complete end-to-end pipeline with live visual outputs and training telemetry. The modular Python source code in [`src/`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1/src/) provides clean, reusable production engines, training pipelines, and standalone inference endpoints.

---

## 🔬 Key Scientific Literature & Theoretical Foundations

1. **WDBC Comparative Benchmark (Paper 33 - Jovana Gluhovic, 2026)**:
   - Evaluates classical baselines (SVM, ANN) against quantum models (QSVM, Hybrid QNN) on the Wisconsin Diagnostic Breast Cancer dataset (569 samples, 30 morphological features).
   - Demonstrates that 8-qubit feature mapping retains clinical discriminative boundaries while fitting near-term quantum hardware constraints.
2. **Improved Simulated Annealing (ISA) Feature Selection (Paper 37 - PMC12939053)**:
   - Metaheuristic combinatorial search utilizing a composite fitness cost:
     $$\text{Cost} = (1 - \text{Accuracy}) + \beta \frac{n_f}{D}$$
   - Dynamic neighbor reconstruction ($\pm 1, \pm 2$) to eliminate feature redundancy and maximize clinical sensitivity.
3. **Hybrid QML Architecture & Quantum Noise Effects (Paper 30 - PMC13111684)**:
   - Emulation of physical superconducting quantum error channels (depolarizing, amplitude/phase damping, and SPAM errors).
   - Hardware calibration across three tiers: **Baseline** ($p_{1q}=0.0004, p_{2q}=0.003, \text{SPAM}=0.01$), **Target** ($0.0002/0.0005/0.005$), and **Desired** ($0.00012/0.00029/0.00294$).
   - **Zero-Noise Extrapolation (ZNE)** with Richardson polynomial extrapolation across scale factors $\lambda \in [1.0, 1.5, 2.0, 3.0]$.
4. **QuantumNeuroXAI Explainability (Paper 17 - Nature Sci Rep 2026)**:
   - Multi-level explainability architecture: Level 1 (Feature attribution), Level 2 (Quantum Gate Ablation Saliency $\mathcal{S}(G_k) = |\hat{y} - \hat{y}_{\setminus G_k}|$), and Level 3 (Von Neumann Entanglement Entropy $S(\rho_A) = -\text{Tr}(\rho_A \ln \rho_A)$).
5. **Quantum Hyperdimensional Computing (Paper 18 - Nature npj Unconv Comp 2026)**:
   - High-dimensional Hilbert state encoding, Hadamard interferometry inner-product overlap, and holographic noise resilience.
6. **Tri-Model Benchmark Verification Protocol (TM-BVP)**:
   - 50-fold repeated stratified cross-validation (10 splits $\times$ 5 repeats) with strict zero-leakage preprocessing.
   - **McNemar's Chi-Squared Contingency Test** ($\chi^2 = \frac{(|b - c| - 1)^2}{b + c}, p < 0.05$).
   - **Wilcoxon Signed-Rank Test** & **Cohen's $d$ Effect Size**.
   - **Huang et al. Geometric Difference Metric** ($s_K$).

---

## 📂 Sequential Modular Architecture ([`Models/v1/src/`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1/src/))

The source modules are strictly ordered in a 10-step logical execution sequence:

| # | File Name | Role in Platform | Key Classes & Methods |
| :---: | :--- | :--- | :--- |
| **01** | [`01_data_preprocessing_engine.py`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1/src/01_data_preprocessing_engine.py) | **Data Ingestion & Feature Selection**: Ingestion of cytopathology features, zero-leakage fold-isolated preprocessing, metaheuristic Simulated Annealing (ISA) feature selection, and Huang et al. $s_K$ geometric difference calculation. | `load_wdbc_dataset`, `FoldPreprocessor`, `ImprovedSimulatedAnnealingSelector`, `GeometricDifferenceCalculator` |
| **02** | [`02_classical_benchmark_suite.py`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1/src/02_classical_benchmark_suite.py) | **Classical SOTA Benchmark Suite**: Comprehensive classical classifiers with hyperparameter tuning (XGBoost, SVM-RBF, Random Forest, ElasticNet Logistic Regression, and PyTorch Deep MLP). | `XGBoostChampion`, `SVMRBFChampion`, `RandomForestChampion`, `ElasticNetLogisticChampion`, `PyTorchMLPChampion`, `evaluate_classifier` |
| **03** | [`03_quantum_circuits_and_ansatz.py`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1/src/03_quantum_circuits_and_ansatz.py) | **Quantum Circuits & Kernels**: PennyLane 8-qubit quantum state embeddings (Second-Order Pauli-$Z$ ZZ Map, Strongly Entangling Ansatz, Variational Quantum Classifier VQC, Quantum Kernel SVM, and Hybrid QNN). | `zz_feature_map`, `strongly_entangling_ansatz`, `VariationalQuantumClassifier`, `QuantumKernelSVM`, `HQNNChampion` |
| **04** | [`04_quantum_noise_and_error_mitigation.py`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1/src/04_quantum_noise_and_error_mitigation.py) | **Physical Quantum Noise & Error Mitigation**: Emulates physical superconducting QPU noise channels (depolarizing, amplitude/phase damping, readout SPAM) and performs Richardson polynomial Zero-Noise Extrapolation (ZNE). | `NoisyQuantumDevice`, `ZeroNoiseExtrapolator` |
| **05** | [`05_quantum_explainability_xai.py`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1/src/05_quantum_explainability_xai.py) | **Quantum Explainability (XAI)**: QXplain causal gate ablation saliency $\mathcal{S}(G_k)$, sub-system Von Neumann entanglement entropy, and cryptographically signed OpenQASM 3.0 circuit receipts. | `compute_input_feature_importance`, `QuantumGateAblator`, `compute_von_neumann_entropy`, `CryptographicQuantumReceiptGenerator` |
| **06** | [`06_train_and_verification_pipeline.py`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1/src/06_train_and_verification_pipeline.py) | **Master Training Loop & Statistical Evaluation**: Orchestrates 50-fold repeated stratified CV, hyperparameter optimization, model checkpointing, McNemar's $\chi^2$ test, and Wilcoxon signed-rank verification. | `StatisticalSignificanceEngine`, `QuantumXMasterPipeline` |
| **07** | [`07_classical_inference_engine.py`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1/src/07_classical_inference_engine.py) | **Standalone Classical Inference Service (`CX-01`)**: High-speed production inference service loading saved weights to evaluate incoming patient vectors via SVM-RBF, XGBoost, and Random Forest with directional SHAP attributions. | `AegisClassicalEngine`, `aegis_engine` |
| **08** | [`08_quantum_hybrid_inference_engine.py`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1/src/08_quantum_hybrid_inference_engine.py) | **Standalone Quantum Hybrid Inference Service (`QX-01`)**: Production-grade inference service executing the 8-Qubit VQC model on PennyLane CPU statevector simulator ($<15\ \text{ms}$) or real IBM Quantum QPUs. | `QuantumXHybridEngine`, `quantum_engine` |
| **09** | [`09_clinical_risk_stratification_engine.py`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1/src/09_clinical_risk_stratification_engine.py) | **Calibrated Clinical Risk Stratification**: Computes calibrated risk scores, assigns patient clinical triage tiers (Low, Intermediate, Elevated, Critical), and formats recommendations. | `compute_calibrated_clinical_risk`, `calculate_morphometric_evidence_index` |
| **10** | [`10_generate_benchmark_graphs.py`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1/src/10_generate_benchmark_graphs.py) | **Scientific Publication Visualizer**: Standalone script generating high-resolution multi-metric comparison plots, ROC curves, saliency heatmaps, and master benchmark dashboards. | Standalone Visualization Script |
| **PKG** | [`__init__.py`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1/src/__init__.py) | **Package Initialization & Dynamic Module Loader**: Exposes all pipeline engines and classes for unified modular imports. | Package Initializer |

---

## ⚡ Execution Instructions

### Option A: Interactive Jupyter Notebook / Google Colab (Recommended)
1. Open [`QuantumX_v1_Training_Pipeline.ipynb`](file:///c:/Users/anshu/OneDrive/Desktop/QuantumX/Models/v1/QuantumX_v1_Training_Pipeline.ipynb).
2. If executing on Google Colab, select **Runtime > Change runtime type > T4 GPU**.
3. Run all cells sequentially. The notebook executes data ingestion, simulated annealing feature selection, model training, noise simulation, gate saliency heatmap generation, and OpenQASM 3.0 export.

### Option B: Local Execution (Python CLI)
```bash
# Navigate to repository root
cd c:\Users\anshu\OneDrive\Desktop\QuantumX

# Run master training & verification pipeline
.\Backend\.venv\Scripts\python.exe Models/v1/src/06_train_and_verification_pipeline.py

# Run classical inference
.\Backend\.venv\Scripts\python.exe Models/v1/src/07_classical_inference_engine.py

# Run quantum hybrid inference
.\Backend\.venv\Scripts\python.exe Models/v1/src/08_quantum_hybrid_inference_engine.py

# Generate publication benchmark plots
.\Backend\.venv\Scripts\python.exe Models/v1/src/10_generate_benchmark_graphs.py
```
