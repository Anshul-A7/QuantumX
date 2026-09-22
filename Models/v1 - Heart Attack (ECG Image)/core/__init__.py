"""
QuantumX Heart-Attack (ECG) v1 — Shared Clinical Signal Core
==============================================================

This package holds the *cross-model* utilities reused by both the
classical benchmark pipeline (``classical_model/``) and the hybrid
quantum pipeline (``hybrid_model/``). It deliberately contains **no
model** definitions so that the classical and quantum classifiers remain
strictly separated while sharing one, single-source-of-truth data and
metrics layer.

Modules
-------
* :mod:`ecg_dataset`   — PTB-XL ingestion, leak-free patient-grouped
                         stratified splits, CWT scalogram caching.
* :mod:`ecg_features`  — Hand-crafted clinical ECG features (HRV, QRS
                         width, ST/T morphology) for the boosting head.
* :mod:`metrics`       — Clinical classification metrics with bootstrap
                         CIs and paired statistical significance tests.

Reference protocol
------------------
* Dataset: PTB-XL (Wagner et al., Nature Sci. Data 2020).
* Benchmark: Strodthoff et al., IEEE JBHI 2021 (strat_fold 1..10,
  fold 10 held out, strict patient-level isolation).
"""

from .ecg_dataset import PTBXLDataLoader, PTBXLDataset, build_grouped_split
from .ecg_features import extract_ecg_features, FEATURE_COLUMNS
from .metrics import (
    compute_clinical_metrics,
    bootstrap_ci,
    mcnemar_significance,
    wilcoxon_significance,
    summarize_predictions,
)

__all__ = [
    "PTBXLDataLoader",
    "PTBXLDataset",
    "build_grouped_split",
    "extract_ecg_features",
    "FEATURE_COLUMNS",
    "compute_clinical_metrics",
    "bootstrap_ci",
    "mcnemar_significance",
    "wilcoxon_significance",
    "summarize_predictions",
]
