"""
hybrid_model.src.evaluate — Statistical Evaluation vs Classical Baseline
===========================================================================

Runs the trained hybrid model on the held-out test fold and compares it
against a classical baseline via paired significance tests, with bootstrap
confidence intervals — the honest, judge-grade head-to-head.

The comparison is *paired*: both models score the exact same patients in
fold 10, so McNemar's exact test (binary disagreement) and the Wilcoxon
signed-rank test (per-sample score) are the correct statistics.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from pathlib import Path

from core import PTBXLDataLoader, PTBXLDataset
from core.metrics import (
    compute_clinical_metrics, bootstrap_ci, mcnemar_significance,
    wilcoxon_significance, SUPERCLASSES,
)

from .inference import load_hybrid_model, predict


def evaluate_hybrid(model, data_dir: str, batch_size: int = 32,
                    max_test: int | None = None) -> dict:
    """Evaluate the trained hybrid on the official test fold 10."""
    loader = PTBXLDataLoader(data_dir=data_dir, sampling_rate=100)
    train, val, test = loader.official_holdout_split()
    if max_test is not None:
        test = test.iloc[:max_test]
    ds = PTBXLDataset(loader, test, mode="scalogram", label_kind="single", return_aux=True)
    from torch.utils.data import DataLoader
    dl = DataLoader(ds, batch_size=batch_size, shuffle=False, num_workers=2)

    y, p = predict(model, dl)
    metrics = compute_clinical_metrics(y, p, classes=SUPERCLASSES)
    mi = (y == SUPERCLASSES.index("MI")).astype(int)
    auc_ci = bootstrap_ci(mi, p[:, SUPERCLASSES.index("MI")])
    metrics["auc_ci"] = auc_ci
    return {"metrics": metrics, "y": y, "proba": p, "n": len(y)}


def compare_with_classical(hybrid_model, classical_proba: np.ndarray,
                           data_dir: str, batch_size: int = 32,
                           max_test: int | None = None) -> dict:
    """
    Paired statistical comparison against a classical model.

    ``classical_proba`` must be the (n, 5) softmax probabilities from the
    classical model on the *identical* test patients, in the same patient
    order, for a valid paired test.

    Returns a dict with both models' metrics, bootstrap CIs, McNemar's
    exact test, Wilcoxon signed-rank on Brier score, and per-class breakouts.
    """
    loader = PTBXLDataLoader(data_dir=data_dir, sampling_rate=100)
    train, val, test = loader.official_holdout_split()
    if max_test is not None:
        test = test.iloc[:max_test]
    ds = PTBXLDataset(loader, test, mode="scalogram", label_kind="single", return_aux=True)
    from torch.utils.data import DataLoader
    dl = DataLoader(ds, batch_size=batch_size, shuffle=False, num_workers=2)

    # NOTE: classical proba is passed in already aligned with `test` order.
    klass_proba = np.asarray(classical_proba)
    assert klass_proba.shape[0] == len(ds), (
        "classical_proba length must match test set length"
    )

    y, hybrid_proba = predict(hybrid_model, dl)

    pos = SUPERCLASSES.index("MI")
    y_bin = (y == pos).astype(int)
    pred_hyb = (hybrid_proba[:, pos] >= 0.5).astype(int)
    pred_klass = (klass_proba[:, pos] >= 0.5).astype(int)

    m_hyb = compute_clinical_metrics(y, hybrid_proba, classes=SUPERCLASSES)
    m_klass = compute_clinical_metrics(y, klass_proba, classes=SUPERCLASSES)

    # Paired significance.
    mc = mcnemar_significance(y_bin, pred_klass, pred_hyb)
    brier_hyb = np.mean((y_bin - hybrid_proba[:, pos]) ** 2)
    brier_klass = np.mean((y_bin - klass_proba[:, pos]) ** 2)
    wcox = wilcoxon_significance(
        (y_bin - hybrid_proba[:, pos]) ** 2,
        (y_bin - klass_proba[:, pos]) ** 2,
    )

    return {
        "hybrid_metrics": m_hyb,
        "classical_metrics": m_klass,
        "hybrid_auc_ci": bootstrap_ci(y_bin, hybrid_proba[:, pos]),
        "classical_auc_ci": bootstrap_ci(y_bin, klass_proba[:, pos]),
        "mcnemar": mc,
        "wilcoxon": wcox,
        "brier_hybrid": float(brier_hyb),
        "brier_classical": float(brier_klass),
        "n": len(y),
        "y": y,
        "hybrid_proba": hybrid_proba,
        "classical_proba": klass_proba,
    }
