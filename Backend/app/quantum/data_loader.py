"""
QuantumX — Breast Cancer Oncology (WDBC) Data Ingestion & Preprocessing
Strictly implements Section 5 & 12 of the Master Architecture Blueprint.
Zero-Leakage Fold-Internal Scaler & Winsorization.
"""

from typing import Generator, Tuple, List, Dict, Any
import numpy as np
import pandas as pd
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import RepeatedStratifiedKFold


FEATURE_NAMES = [
    "mean_radius", "mean_texture", "mean_perimeter", "mean_area",
    "mean_smoothness", "mean_compactness", "mean_concavity", "mean_concave_points",
    "mean_symmetry", "mean_fractal_dimension",
    "radius_error", "texture_error", "perimeter_error", "area_error",
    "smoothness_error", "compactness_error", "concavity_error", "concave_points_error",
    "symmetry_error", "fractal_dimension_error",
    "worst_radius", "worst_texture", "worst_perimeter", "worst_area",
    "worst_smoothness", "worst_compactness", "worst_concavity", "worst_concave_points",
    "worst_symmetry", "worst_fractal_dimension"
]


class FoldPreprocessor:
    """
    Fold-internal robust data scaler preventing data leakage.
    Applies Winsorization (1st-99th percentile clip) and Standard Scaling
    computed strictly on the training partition.
    """
    def __init__(self, lower_q: float = 0.01, upper_q: float = 0.99):
        self.lower_q = lower_q
        self.upper_q = upper_q
        self.lower_bounds: np.ndarray | None = None
        self.upper_bounds: np.ndarray | None = None
        self.means: np.ndarray | None = None
        self.stds: np.ndarray | None = None

    def fit(self, X: np.ndarray) -> "FoldPreprocessor":
        self.lower_bounds = np.quantile(X, self.lower_q, axis=0)
        self.upper_bounds = np.quantile(X, self.upper_q, axis=0)
        X_clipped = np.clip(X, self.lower_bounds, self.upper_bounds)
        self.means = np.mean(X_clipped, axis=0)
        self.stds = np.std(X_clipped, axis=0)
        # Avoid division by zero
        self.stds[self.stds < 1e-8] = 1.0
        return self

    def transform(self, X: np.ndarray) -> np.ndarray:
        if self.lower_bounds is None or self.means is None or self.stds is None:
            raise ValueError("FoldPreprocessor must be fitted before transform")
        X_clipped = np.clip(X, self.lower_bounds, self.upper_bounds)
        return (X_clipped - self.means) / self.stds

    def fit_transform(self, X: np.ndarray) -> np.ndarray:
        return self.fit(X).transform(X)


class WDBCDataLoader:
    """
    Wisconsin Diagnostic Breast Cancer dataset loader (UCI ID 17).
    N = 569, D = 30 features.
    Class 0: Benign (357 samples, 62.7%)
    Class 1: Malignant (212 samples, 37.3%)
    """
    def __init__(self):
        data = load_breast_cancer()
        self.X_raw = data.data.astype(np.float32)
        # Scikit-learn default: 0 is Malignant, 1 is Benign.
        # We invert so: 0 = Benign, 1 = Malignant (standard clinical convention)
        self.y = (1 - data.target).astype(np.int64)
        self.feature_names = FEATURE_NAMES
        self.sample_count = len(self.y)
        self.feature_dim = self.X_raw.shape[1]

    def get_raw_data(self) -> Tuple[np.ndarray, np.ndarray]:
        return self.X_raw, self.y

    def get_repeated_stratified_folds(
        self, n_splits: int = 5, n_repeats: int = 10, random_state: int = 42
    ) -> Generator[Tuple[int, np.ndarray, np.ndarray, np.ndarray, np.ndarray, FoldPreprocessor], None, None]:
        """
        Yields 50 evaluation splits (5-folds x 10 repeats) with zero-leakage preprocessors.
        """
        rskf = RepeatedStratifiedKFold(n_splits=n_splits, n_repeats=n_repeats, random_state=random_state)
        for fold_idx, (train_idx, test_idx) in enumerate(rskf.split(self.X_raw, self.y)):
            X_train_raw = self.X_raw[train_idx]
            y_train = self.y[train_idx]
            X_test_raw = self.X_raw[test_idx]
            y_test = self.y[test_idx]

            preprocessor = FoldPreprocessor().fit(X_train_raw)
            X_train = preprocessor.transform(X_train_raw)
            X_test = preprocessor.transform(X_test_raw)

            yield fold_idx, X_train, y_train, X_test, y_test, preprocessor


def get_default_sample(patient_type: str = "malignant") -> Dict[str, Any]:
    """Provides a reference patient feature profile for demo screening."""
    loader = WDBCDataLoader()
    X, y = loader.get_raw_data()
    target_class = 1 if patient_type == "malignant" else 0
    indices = np.where(y == target_class)[0]
    idx = indices[0]
    sample_values = X[idx].tolist()
    return {
        "sample_id": f"PATIENT-WDBC-{idx:03d}",
        "ground_truth": "Malignant" if target_class == 1 else "Benign",
        "features": dict(zip(FEATURE_NAMES, sample_values)),
    }
