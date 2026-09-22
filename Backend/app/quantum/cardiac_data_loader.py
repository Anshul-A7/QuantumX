"""
================================================================================
QuantumX — Cardiac Arrhythmia ECG Signal Data Ingestion & Preprocessing
MIT-BIH Arrhythmia Database (Kaggle Heartbeat Categorization)
================================================================================

Dataset Details:
  - Source: PhysioNet MIT-BIH Arrhythmia Database → Kaggle preprocessed CSVs
  - Training File: mitbih_train.csv (87,554 samples)
  - Test File: mitbih_test.csv (21,892 samples)
  - Dimensions: 188 columns — 187 ECG signal values + 1 label column
  - Original 5-Class Labels: N(0), S(1), V(2), F(3), Q(4)
  - Binary Encoding: Normal (0) vs Abnormal (1) for cardiac risk detection

Clinical Context:
  - Class 0 (Normal): Regular sinus rhythm heartbeats
  - Class 1 (Supra-ventricular): Atrial premature beats, aberrant atrial premature beats
  - Class 2 (Ventricular): Premature ventricular contractions — CRITICAL cardiac emergency
  - Class 3 (Fusion): Fusion of ventricular and normal beat — requires urgent cardiology
  - Class 4 (Unclassifiable): Paced beats, fusion of paced and normal

Zero-Leakage Architecture:
  - Pre-split by Kaggle (patient-independent: different patients in train vs test)
  - Fold-internal Winsorization (1st–99th percentile clip) + Standard Scaling
  - Class weighting computed per-fold to handle severe imbalance (~82% Normal)
================================================================================
"""

from typing import Generator, Tuple, List, Dict, Any, Optional
import os
import numpy as np
import pandas as pd
from pathlib import Path

# ─── Dataset Configuration ───────────────────────────────────────────────────
CARDIAC_DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "datasets" / "cardiac"
TRAIN_CSV = CARDIAC_DATA_DIR / "mitbih_train.csv"
TEST_CSV = CARDIAC_DATA_DIR / "mitbih_test.csv"

ECG_SIGNAL_DIM = 187  # 187 time-step ECG signal features
NUM_ORIGINAL_CLASSES = 5
BINARY_CLASSES = ["Normal", "Abnormal"]

# 5-Class label mapping for reference
FIVE_CLASS_NAMES = {
    0: "Normal (N)",
    1: "Supra-ventricular (S)",
    2: "Ventricular (V)",
    3: "Fusion (F)",
    4: "Unclassifiable (Q)",
}

# Clinical feature names for the 8-dim bottleneck representation
CARDIAC_BOTTLENECK_FEATURES = [
    "R-Peak Amplitude",
    "QRS Complex Width",
    "ST Segment Deviation",
    "P-Wave Morphology",
    "T-Wave Symmetry",
    "Heart Rate Variability",
    "Signal Energy Density",
    "Waveform Entropy",
]


class CardiacFoldPreprocessor:
    """
    Fold-internal robust ECG signal scaler preventing data leakage.
    Applies Winsorization (1st–99th percentile clip) and Standard Scaling
    computed strictly on the training partition of each fold.

    This mirrors the FoldPreprocessor architecture from the WDBC pipeline
    to maintain consistent engineering standards across all disease models.
    """

    def __init__(self, lower_q: float = 0.01, upper_q: float = 0.99):
        self.lower_q = lower_q
        self.upper_q = upper_q
        self.lower_bounds: Optional[np.ndarray] = None
        self.upper_bounds: Optional[np.ndarray] = None
        self.means: Optional[np.ndarray] = None
        self.stds: Optional[np.ndarray] = None
        self.is_fitted = False

    def fit(self, X: np.ndarray) -> "CardiacFoldPreprocessor":
        """Compute Winsorized scaling parameters from training data only."""
        self.lower_bounds = np.quantile(X, self.lower_q, axis=0)
        self.upper_bounds = np.quantile(X, self.upper_q, axis=0)
        X_clipped = np.clip(X, self.lower_bounds, self.upper_bounds)
        self.means = np.mean(X_clipped, axis=0)
        self.stds = np.std(X_clipped, axis=0)
        # Prevent division by zero for near-constant channels
        self.stds[self.stds < 1e-8] = 1.0
        self.is_fitted = True
        return self

    def transform(self, X: np.ndarray) -> np.ndarray:
        """Apply fitted scaling parameters to transform ECG signals."""
        if not self.is_fitted:
            raise ValueError("CardiacFoldPreprocessor must be fitted before transform")
        X_clipped = np.clip(X, self.lower_bounds, self.upper_bounds)
        return (X_clipped - self.means) / self.stds

    def fit_transform(self, X: np.ndarray) -> np.ndarray:
        """Fit and transform in a single call."""
        return self.fit(X).transform(X)


class MITBIHCardiacDataLoader:
    """
    MIT-BIH Arrhythmia Database ECG Heartbeat loader.

    Dataset Statistics (after binary encoding):
      Training: 87,554 samples (72,471 Normal + 15,083 Abnormal)
      Testing:  21,892 samples (18,118 Normal + 3,774 Abnormal)
      Class Ratio: ~82.8% Normal vs ~17.2% Abnormal (4.8:1 imbalance)

    This loader provides:
      1. Raw data access for custom training loops
      2. Stratified K-Fold cross-validation with zero-leakage preprocessors
      3. Scarce-data subsetting for quantum advantage evaluation
      4. Class weight computation for balanced training
    """

    def __init__(self):
        if not TRAIN_CSV.exists() or not TEST_CSV.exists():
            raise FileNotFoundError(
                f"MIT-BIH Cardiac dataset not found.\n"
                f"Expected:\n"
                f"  - {TRAIN_CSV}\n"
                f"  - {TEST_CSV}\n"
                f"Download from: https://www.kaggle.com/datasets/shayanfazeli/heartbeat\n"
                f"Place mitbih_train.csv and mitbih_test.csv in: {CARDIAC_DATA_DIR}"
            )

        # Load raw CSV data
        train_df = pd.read_csv(TRAIN_CSV, header=None)
        test_df = pd.read_csv(TEST_CSV, header=None)

        # Extract features (columns 0-186) and labels (column 187)
        self.X_train_raw = train_df.iloc[:, :ECG_SIGNAL_DIM].values.astype(np.float32)
        self.y_train_5class = train_df.iloc[:, ECG_SIGNAL_DIM].values.astype(np.int64)

        self.X_test_raw = test_df.iloc[:, :ECG_SIGNAL_DIM].values.astype(np.float32)
        self.y_test_5class = test_df.iloc[:, ECG_SIGNAL_DIM].values.astype(np.int64)

        # Binary encoding: Normal (0) vs Abnormal (1)
        self.y_train = (self.y_train_5class > 0).astype(np.int64)
        self.y_test = (self.y_test_5class > 0).astype(np.int64)

        # Dataset statistics
        self.train_count = len(self.y_train)
        self.test_count = len(self.y_test)
        self.signal_dim = ECG_SIGNAL_DIM
        self.n_train_normal = int(np.sum(self.y_train == 0))
        self.n_train_abnormal = int(np.sum(self.y_train == 1))
        self.n_test_normal = int(np.sum(self.y_test == 0))
        self.n_test_abnormal = int(np.sum(self.y_test == 1))
        self.class_ratio = self.n_train_normal / max(self.n_train_abnormal, 1)

    def get_raw_data(self) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """Returns (X_train, y_train, X_test, y_test) raw arrays."""
        return self.X_train_raw, self.y_train, self.X_test_raw, self.y_test

    def get_class_weights(self) -> Dict[int, float]:
        """Compute class weights inversely proportional to class frequency."""
        total = self.train_count
        weight_normal = total / (2.0 * self.n_train_normal)
        weight_abnormal = total / (2.0 * self.n_train_abnormal)
        return {0: float(weight_normal), 1: float(weight_abnormal)}

    def get_class_weight_tensor(self) -> float:
        """Returns the positive class weight ratio for BCEWithLogitsLoss."""
        return float(self.n_train_normal / max(self.n_train_abnormal, 1))

    def get_scarce_data_subset(
        self, fraction: float, random_state: int = 42
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Returns a stratified subset of training data for scarce-data evaluation.

        Args:
            fraction: Float between 0.0 and 1.0 (e.g., 0.15 for 15%)
            random_state: Random seed for reproducibility

        Returns:
            (X_subset, y_subset) maintaining class proportions
        """
        rng = np.random.RandomState(random_state)
        n_total = len(self.y_train)
        n_subset = max(int(n_total * fraction), 10)

        # Stratified sampling
        idx_normal = np.where(self.y_train == 0)[0]
        idx_abnormal = np.where(self.y_train == 1)[0]

        n_normal = max(int(len(idx_normal) * fraction), 5)
        n_abnormal = max(int(len(idx_abnormal) * fraction), 5)

        selected_normal = rng.choice(idx_normal, size=n_normal, replace=False)
        selected_abnormal = rng.choice(idx_abnormal, size=n_abnormal, replace=False)

        selected_idx = np.concatenate([selected_normal, selected_abnormal])
        rng.shuffle(selected_idx)

        return self.X_train_raw[selected_idx], self.y_train[selected_idx]

    def get_stratified_folds(
        self, n_splits: int = 5, random_state: int = 42
    ) -> Generator[
        Tuple[int, np.ndarray, np.ndarray, np.ndarray, np.ndarray, CardiacFoldPreprocessor],
        None,
        None,
    ]:
        """
        Yields stratified K-Fold cross-validation splits with zero-leakage preprocessors.

        Each fold yields:
          (fold_idx, X_train_scaled, y_train, X_val_scaled, y_val, preprocessor)
        """
        from sklearn.model_selection import StratifiedKFold

        skf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=random_state)

        for fold_idx, (train_idx, val_idx) in enumerate(skf.split(self.X_train_raw, self.y_train)):
            X_fold_train = self.X_train_raw[train_idx]
            y_fold_train = self.y_train[train_idx]
            X_fold_val = self.X_train_raw[val_idx]
            y_fold_val = self.y_train[val_idx]

            preprocessor = CardiacFoldPreprocessor().fit(X_fold_train)
            X_fold_train_scaled = preprocessor.transform(X_fold_train)
            X_fold_val_scaled = preprocessor.transform(X_fold_val)

            yield fold_idx, X_fold_train_scaled, y_fold_train, X_fold_val_scaled, y_fold_val, preprocessor

    def get_dataset_summary(self) -> Dict[str, Any]:
        """Returns a comprehensive dataset summary for reporting."""
        return {
            "dataset_name": "MIT-BIH Arrhythmia Database (Kaggle Heartbeat Categorization)",
            "source": "PhysioNet / Kaggle shayanfazeli/heartbeat",
            "signal_dimension": self.signal_dim,
            "train_samples": self.train_count,
            "test_samples": self.test_count,
            "total_samples": self.train_count + self.test_count,
            "train_normal": self.n_train_normal,
            "train_abnormal": self.n_train_abnormal,
            "test_normal": self.n_test_normal,
            "test_abnormal": self.n_test_abnormal,
            "class_ratio": round(self.class_ratio, 2),
            "binary_classes": BINARY_CLASSES,
            "five_class_names": FIVE_CLASS_NAMES,
            "preprocessing": "Winsorized (1st-99th percentile) + Standard Scaling (fold-internal)",
        }


def get_default_cardiac_sample(sample_type: str = "abnormal") -> Dict[str, Any]:
    """
    Provides a reference ECG signal for demo cardiac screening.

    Args:
        sample_type: "abnormal" for a cardiac arrhythmia sample, "normal" for sinus rhythm
    """
    loader = MITBIHCardiacDataLoader()
    X_train, y_train, _, _ = loader.get_raw_data()
    target_class = 1 if sample_type == "abnormal" else 0
    indices = np.where(y_train == target_class)[0]
    idx = indices[0]
    signal = X_train[idx].tolist()

    return {
        "sample_id": f"PATIENT-MITBIH-{idx:05d}",
        "ground_truth": "Abnormal (Cardiac Arrhythmia)" if target_class == 1 else "Normal (Sinus Rhythm)",
        "ecg_signal": signal,
        "signal_length": len(signal),
        "original_5class": int(loader.y_train_5class[idx]),
        "original_5class_name": FIVE_CLASS_NAMES.get(int(loader.y_train_5class[idx]), "Unknown"),
    }
