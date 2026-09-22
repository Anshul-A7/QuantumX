"""
core.metrics — Clinical Classification Metrics & Statistical Verification
===========================================================================

Single source of truth for how both models are scored. Implements the
clinical metric set used throughout the platform plus the paired
significance tests that let the classical benchmark and the hybrid
quantum model be compared rigorously (zero-leakage, per-*patient*).

Metrics
-------
* Accuracy, macro/precision, recall (sensitivity) or MI sensitivity,
  specificity, macro-F1, and ROC-AUC / PR-AUC (``compute_clinical_metrics``).
* Bootstrap 95% confidence intervals (``bootstrap_ci``).
* Paired discordance testing via McNemar's exact test
  (``mcnemar_significance``) and continuous metric comparison via the
  Wilcoxon signed-rank test (``wilcoxon_significance``).
"""

from __future__ import annotations

from typing import Optional

import numpy as np
import pandas as pd
from scipy import stats as sp_stats
from sklearn import metrics as skm

# Ordered diagnostic superclasses, matching PTB-XL's SCP-ECG hierarchy.
SUPERCLASSES = ["NORM", "MI", "STTC", "CD", "HYP"]


def _resolve_labels_to_idx(labels, classes) -> np.ndarray:
    """Map a label vector to integer class indices, tolerating inputs that
    arrive either as class-name strings OR as integer class indices (which
    may be float-typed, e.g. np.float32(1.0) from a "single"-label dataset)."""
    out = []
    for v in labels:
        # Treat whole-number numbers as class indices.
        if isinstance(v, (int, np.integer)) and not isinstance(v, bool):
            out.append(int(v))
            continue
        if isinstance(v, (float, np.floating)) and float(v).is_integer():
            idx = int(v)
            if 0 <= idx < len(classes):
                out.append(idx)
                continue
        out.append(classes.index(str(v)))
    return np.array(out)


def compute_clinical_metrics(
    y_true: np.ndarray,
    y_proba: np.ndarray,
    y_pred: Optional[np.ndarray] = None,
    classes: Optional[list[str]] = None,
    pos_label: str = "MI",
) -> dict:
    """
    Compute the full clinical scorecard for a (multi)classifier.

    Parameters
    ----------
    y_true : (n,) array of true *class labels* (strings or ints).
    y_proba : (n, n_classes) predicted probabilities (rows sum to ~1) OR
        a flat (n,) vector for a binary ``pos_label`` comparison.
    y_pred : optional (n,) predicted class labels (strings/ints). When
        omitted it is inferred as ``argmax`` over ``y_proba``.
    classes : optional ordered label list (defaults to SUPERCLASSES).
    pos_label : class treated as the "disease" class for sensitivity /
        specificity (defaults to "MI" — myocardial infarction).

    Returns
    -------
    dict with keys:
        accuracy, macro_precision, macro_recall, macro_f1,
        sensitivity_<pos>, specificity_<pos>, roc_auc, pr_auc
    """
    if classes is None:
        classes = list(SUPERCLASSES)

    # --- Binary convenience: flat probability vector ---------------------
    binary_pos = bool(np.ndim(y_proba) == 1)
    if binary_pos:
        y_true_bin = (np.asarray(y_true) == pos_label).astype(int)
        y_pred_bin = (y_proba >= 0.5).astype(int) if y_pred is None else (
            np.asarray(y_pred) == pos_label
        ).astype(int)
        auc = skm.roc_auc_score(y_true_bin, y_proba)
        pr_auc = skm.average_precision_score(y_true_bin, y_proba)
        sens = skm.recall_score(y_true_bin, y_pred_bin, zero_division=0)
        tn, fp, fn, tp = skm.confusion_matrix(y_true_bin, y_pred_bin).ravel()
        spec = tn / (tn + fp) if (tn + fp) else 0.0
        return {
            "accuracy": skm.accuracy_score(y_true_bin, y_pred_bin),
            "macro_precision": sens,  # binary -> precision == recall on pos
            "macro_recall": sens,
            "macro_f1": skm.f1_score(y_true_bin, y_pred_bin, zero_division=0)
            if ((tp + fp) and (tp + fn))
            else 0.0,
            "sensitivity_MI": sens,
            "specificity_MI": spec,
            "roc_auc": auc,
            "pr_auc": pr_auc,
        }

    y_true = np.asarray(y_true)
    y_proba = np.asarray(y_proba)
    classes_arr = np.asarray(classes)
    if y_pred is not None:
        y_pred = np.asarray(y_pred)
    else:
        y_pred = classes_arr[np.argmax(y_proba, axis=1)]

    y_true_idx = _resolve_labels_to_idx(y_true, classes)
    y_pred_idx = _resolve_labels_to_idx(y_pred, classes)
    pos_idx = classes.index(pos_label)

    accuracy = skm.accuracy_score(y_true_idx, y_pred_idx)
    macro_precision = skm.precision_score(
        y_true_idx, y_pred_idx, average="macro", zero_division=0
    )
    macro_recall = skm.recall_score(
        y_true_idx, y_pred_idx, average="macro", zero_division=0
    )
    macro_f1 = skm.f1_score(
        y_true_idx, y_pred_idx, average="macro", zero_division=0
    )
    cm = skm.confusion_matrix(y_true_idx, y_pred_idx, labels=range(len(classes)))
    fp = cm[:, pos_idx].sum() - cm[pos_idx, pos_idx]
    fn = cm[pos_idx, :].sum() - cm[pos_idx, pos_idx]
    tp = cm[pos_idx, pos_idx]
    tn = cm.sum() - (tp + fn + fp)
    sensitivity = tp / (tp + fn) if (tp + fn) else 0.0
    specificity = tn / (tn + fp) if (tn + fp) else 0.0

    auc = skm.roc_auc_score(
        y_true_idx, y_proba, multi_class="ovr", average="macro",
        labels=range(len(classes)),
    )
    pr_auc = _macro_average_precision(y_true_idx, y_proba, len(classes))

    return {
        "accuracy": float(accuracy),
        "macro_precision": float(macro_precision),
        "macro_recall": float(macro_recall),
        "macro_f1": float(macro_f1),
        f"sensitivity_{pos_label}": float(sensitivity),
        f"specificity_{pos_label}": float(specificity),
        "roc_auc": float(auc),
        "pr_auc": float(pr_auc),
    }


def _macro_average_precision(y_true_idx, y_proba, n_classes):
    per_class = [
        skm.average_precision_score((y_true_idx == c).astype(int), y_proba[:, c])
        for c in range(n_classes)
    ]
    return float(np.mean(per_class))


def bootstrap_ci(
    y_true: np.ndarray,
    y_score_pos: np.ndarray,
    metric=skm.roc_auc_score,
    n_boot: int = 1000,
    ci: float = 0.95,
    seed: int = 42,
) -> tuple[float, float]:
    """
    Non-parametric bootstrap confidence interval for a binary metric.

    Returns ``(lo, hi)`` bounds at the requested confidence level, robust
    to small, class-imbalanced test sets. Rows are sampled with
    replacement *jointly* (label + score) so the class prior is preserved.
    """
    rng = np.random.default_rng(seed)
    y_true = np.asarray(y_true)
    y_score_pos = np.asarray(y_score_pos)
    n = len(y_true)
    assert n > 0, "empty sample for bootstrap"
    values = np.empty(n_boot)
    for i in range(n_boot):
        idx = rng.integers(0, n, size=n)
        try:
            values[i] = metric(y_true[idx], y_score_pos[idx])
        except ValueError:
            # Single-class bootstrap draw -> AUC undefined; keep as NaN.
            values[i] = np.nan
    values = values[~np.isnan(values)]
    if len(values) == 0:
        return (float("nan"), float("nan"))
    alpha = (1.0 - ci) / 2.0
    lo, hi = np.quantile(values, [alpha, 1.0 - alpha])
    return (float(lo), float(hi))


def _paired_labels(a: np.ndarray, b: np.ndarray):
    """Normalize two binary label vectors and count the 2x2 discordance."""
    a = np.asarray(a).astype(int)
    b = np.asarray(b).astype(int)
    assert a.shape == b.shape, "mismatched prediction vectors"
    n01 = int(np.sum((a == 0) & (b == 1)))
    n10 = int(np.sum((a == 1) & (b == 0)))
    n = len(a)
    return n, n01, n10


def mcnemar_significance(
    y_true: np.ndarray,
    pred_a: np.ndarray,
    pred_b: np.ndarray,
    corrected: bool = True,
) -> dict:
    """
    McNemar's test for *paired* binary classification disagreement.

    Determines whether two classifiers differ significantly given the
    same, matched test set (the correct test for classical-vs-quantum).
    Reports chi-square (with continuity correction) or the exact binomial
    p-value, McNemar's odds ratio, and a signed summary.

    Returns ``{"p_value", "statistic", "n01", "n10", "direction"}`` where
    ``direction`` is ``"a_better"`` / ``"b_better"`` / ``"tie"`` based on
    which classifier wins the discordant pairs.
    """
    n, n01, n10 = _paired_labels(pred_a, pred_b)

    if (n01 + n10) == 0:
        return {
            "p_value": 1.0,
            "statistic": 0.0,
            "n01": n01,
            "n10": n10,
            "direction": "tie",
        }

    # Exact binomial test is exact and safe for small discordant counts.
    exact = sp_stats.binomtest(min(n01, n10), n=n01 + n10, p=0.5)
    if corrected and (n01 + n10) >= 10:
        chi2 = (abs(n01 - n10) - 1) ** 2 / (n01 + n10)
        p_chi2 = sp_stats.chi2.sf(chi2, df=1)
        statistic, p_value = chi2, float(p_chi2)
        test = "mcnemar_corrected_chi2"
    else:
        statistic = float(2 * exact.statistic)
        p_value = exact.pvalue
        test = "mcnemar_exact_binomial"

    if n01 > n10:
        direction = "a_better"
    elif n10 > n01:
        direction = "b_better"
    else:
        direction = "tie"

    return {
        "p_value": float(p_value),
        "statistic": float(statistic),
        "n01": n01,  # A correct, B wrong
        "n10": n10,  # B correct, A wrong
        "direction": direction,
        "test": test,
        "odds_ratio": (n01 + 0.5) / (n10 + 0.5),
    }


def wilcoxon_significance(scores_a: np.ndarray, scores_b: np.ndarray) -> dict:
    """
    Wilcoxon signed-rank test on *paired* per-sample metric scores.

    Used to compare continuous loss/calibration signals (e.g. Brier score
    per patient, log-loss vector) between two models on the matched set.
    """
    scores_a = np.asarray(scores_a, dtype=float)
    scores_b = np.asarray(scores_b, dtype=float)
    if scores_a.shape != scores_b.shape:
        raise ValueError("paired scores must be the same shape")
    diff = scores_a - scores_b
    # Drop ties (zero differences) as required by the signed-rank test.
    nz = diff[diff != 0]
    if len(nz) < 2:
        return {"p_value": 1.0, "statistic": 0.0, "wiener": None, "n_pairs": int(len(diff))}
    stat, p = sp_stats.wilcoxon(nz)
    return {
        "p_value": float(p),
        "statistic": float(stat),
        "n_pairs": int(len(nz)),
        "mean_diff_a_minus_b": float(np.mean(diff)),
    }


def summarize_predictions(
    y_true: np.ndarray,
    proba_a: np.ndarray,
    proba_b: np.ndarray,
    classes: Optional[list[str]] = None,
    pos_label: str = "MI",
) -> pd.DataFrame:
    """
    Build a tidy comparison frame of the classical (``a``) vs hybrid
    quantum (``b``) models on the same test set.

    Rows = samples; columns = true label, both models' MI probability,
    both predicted labels, per-sample correctness of each.

    Returns a pandas DataFrame that the notebooks render and that folds
    cleanly into the significance helpers.
    """
    if classes is None:
        classes = list(SUPERCLASSES)
    classes_arr = np.asarray(classes)
    y_true = np.asarray(y_true)
    pred_a = classes_arr[np.argmax(proba_a, axis=1)]
    pred_b = classes_arr[np.argmax(proba_b, axis=1)]
    return pd.DataFrame(
        {
            "y_true": y_true,
            f"p_{pos_label}_classical": proba_a[:, classes.index(pos_label)],
            f"p_{pos_label}_quantum": proba_b[:, classes.index(pos_label)],
            "pred_classical": pred_a,
            "pred_quantum": pred_b,
            "correct_classical": y_true == pred_a,
            "correct_quantum": y_true == pred_b,
        }
    )
