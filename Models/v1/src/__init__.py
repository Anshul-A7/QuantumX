"""
====================================================================================================
QuantumX v1 Modular Pipeline Package
====================================================================================================
Provides unified access to the sequential execution pipeline:
- 01_data_preprocessing_engine.py          : Ingestion, Zero-Leakage Preprocessing, ISA Feature Selection, s_K Metric
- 02_classical_benchmark_suite.py          : Classical SOTA Suite (XGBoost, SVM-RBF, Random Forest, PyTorch MLP)
- 03_quantum_circuits_and_ansatz.py        : PennyLane Circuits (ZZ Map, Strongly Entangling Ansatz, VQC, QSVM, HQNN)
- 04_quantum_noise_and_error_mitigation.py : Superconducting Noise Channels (Paper 30) & Zero-Noise Extrapolation
- 05_quantum_explainability_xai.py         : QXplain Saliency S(G_k), Von Neumann Entropy & OpenQASM 3.0 Receipts
- 06_train_and_verification_pipeline.py    : 50-Fold Repeated Stratified CV & Statistical Significance Testing
- aegis_classical_v1.py                    : Dedicated Standalone Classical Inference Service (CX-01)
- quantumx_hybrid_v1.py                    : Dedicated Standalone Quantum Hybrid Inference Service (QX-01)
- risk_stratification_engine.py            : Calibrated Clinical Risk Stratification Engine
====================================================================================================
"""

import os
import sys
import importlib.util

_src_dir = os.path.dirname(os.path.abspath(__file__))

def _import_ordered_module(module_name: str, file_name: str):
    file_path = os.path.join(_src_dir, file_name)
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Failed to load spec for {file_name}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module

# Load numbered modules dynamically
data_engine = _import_ordered_module("data_engine", "01_data_preprocessing_engine.py")
classical_models = _import_ordered_module("classical_models", "02_classical_benchmark_suite.py")
quantum_circuits = _import_ordered_module("quantum_circuits", "03_quantum_circuits_and_ansatz.py")
quantum_noise = _import_ordered_module("quantum_noise", "04_quantum_noise_and_error_mitigation.py")
quantum_xai = _import_ordered_module("quantum_xai", "05_quantum_explainability_xai.py")
train_engine = _import_ordered_module("train_engine", "06_train_and_verification_pipeline.py")

# Expose key classes and symbols
load_wdbc_dataset = data_engine.load_wdbc_dataset
FoldPreprocessor = data_engine.FoldPreprocessor
ImprovedSimulatedAnnealingSelector = data_engine.ImprovedSimulatedAnnealingSelector
GeometricDifferenceCalculator = data_engine.GeometricDifferenceCalculator

XGBoostChampion = classical_models.XGBoostChampion
SVMRBFChampion = classical_models.SVMRBFChampion
RandomForestChampion = classical_models.RandomForestChampion
ElasticNetLogisticChampion = classical_models.ElasticNetLogisticChampion
PyTorchMLPChampion = classical_models.PyTorchMLPChampion
evaluate_classifier = classical_models.evaluate_classifier

VariationalQuantumClassifier = quantum_circuits.VariationalQuantumClassifier
QuantumKernelSVM = quantum_circuits.QuantumKernelSVM
HQNNChampion = quantum_circuits.HQNNChampion

NoisyQuantumDevice = quantum_noise.NoisyQuantumDevice
ZeroNoiseExtrapolator = quantum_noise.ZeroNoiseExtrapolator

compute_input_feature_importance = quantum_xai.compute_input_feature_importance
QuantumGateAblator = quantum_xai.QuantumGateAblator
compute_von_neumann_entropy = quantum_xai.compute_von_neumann_entropy
CryptographicQuantumReceiptGenerator = quantum_xai.CryptographicQuantumReceiptGenerator

StatisticalSignificanceEngine = train_engine.StatisticalSignificanceEngine
QuantumXMasterPipeline = train_engine.QuantumXMasterPipeline
