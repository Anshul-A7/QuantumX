"""
====================================================================================================
QuantumX Classical Models: State-of-the-Art Baseline Suite & PyTorch Deep MLP
====================================================================================================
This module implements the complete suite of highly-tuned classical machine learning models used
in Tier 2 of the Tri-Model Benchmark Verification Protocol (TM-BVP).

Models Implemented:
1. XGBoost Champion: Extreme Gradient Boosting with tree histogram partitioning and L2 regularization.
2. SVM-RBF Champion: Support Vector Classifier with Gaussian Radial Basis Function kernel and Platt calibration.
3. Random Forest Champion: Ensemble of 200 de-correlated decision trees with out-of-bag scoring.
4. ElasticNet Logistic Champion: Regularized linear model with L1/L2 penalty optimization.
5. PyTorch Deep MLP Champion: Multilayer Perceptron with Batch Normalization, GELU activations, Dropout,
   and AdamW optimizer with Cosine Annealing learning rate schedule.
====================================================================================================
"""

import logging
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import TensorDataset, DataLoader
from typing import Dict, Any, Optional, Tuple, List, Union
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, roc_auc_score, f1_score, precision_score, recall_score, brier_score_loss
import xgboost as xgb

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("QuantumX.ClassicalModels")


# ==================================================================================================
# 1. CLASSICAL CHAMPION WRAPPERS
# ==================================================================================================

class XGBoostChampion:
    """Extreme Gradient Boosting Classifier tuned for clinical diagnostic benchmarks."""
    def __init__(self, 
                 n_estimators: int = 150, 
                 max_depth: int = 4, 
                 learning_rate: float = 0.05,
                 subsample: float = 0.8,
                 colsample_bytree: float = 0.8,
                 reg_alpha: float = 0.1,
                 reg_lambda: float = 1.0,
                 random_state: int = 42):
        self.model = xgb.XGBClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            learning_rate=learning_rate,
            subsample=subsample,
            colsample_bytree=colsample_bytree,
            reg_alpha=reg_alpha,
            reg_lambda=reg_lambda,
            eval_metric="logloss",
            random_state=random_state,
            use_label_encoder=False
        )

    def fit(self, X: np.ndarray, y: np.ndarray) -> 'XGBoostChampion':
        self.model.fit(X, y)
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        return self.model.predict(X)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        return self.model.predict_proba(X)

    def get_feature_importances(self) -> np.ndarray:
        return self.model.feature_importances_


class SVMRBFChampion:
    """Support Vector Machine with Gaussian Radial Basis Function (RBF) Kernel and Platt calibration."""
    def __init__(self, C: float = 10.0, gamma: str = "scale", random_state: int = 42):
        self.model = SVC(
            C=C,
            kernel="rbf",
            gamma=gamma,
            probability=True,
            random_state=random_state
        )

    def fit(self, X: np.ndarray, y: np.ndarray) -> 'SVMRBFChampion':
        self.model.fit(X, y)
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        return self.model.predict(X)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        return self.model.predict_proba(X)


class RandomForestChampion:
    """Random Forest Ensemble with 200 estimators and balanced subsampling."""
    def __init__(self, n_estimators: int = 200, max_depth: Optional[int] = 8, random_state: int = 42):
        self.model = RandomForestClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            class_weight="balanced",
            random_state=random_state,
            n_jobs=-1
        )

    def fit(self, X: np.ndarray, y: np.ndarray) -> 'RandomForestChampion':
        self.model.fit(X, y)
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        return self.model.predict(X)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        return self.model.predict_proba(X)

    def get_feature_importances(self) -> np.ndarray:
        return self.model.feature_importances_


class ElasticNetLogisticChampion:
    """Regularized Logistic Regression with ElasticNet penalty."""
    def __init__(self, C: float = 1.0, l1_ratio: float = 0.5, random_state: int = 42):
        self.model = LogisticRegression(
            penalty="elasticnet",
            solver="saga",
            C=C,
            l1_ratio=l1_ratio,
            max_iter=1000,
            random_state=random_state
        )

    def fit(self, X: np.ndarray, y: np.ndarray) -> 'ElasticNetLogisticChampion':
        self.model.fit(X, y)
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        return self.model.predict(X)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        return self.model.predict_proba(X)


# ==================================================================================================
# 2. DEEP PYTORCH MULTILAYER PERCEPTRON (MLP)
# ==================================================================================================

class _MLPModule(nn.Module):
    def __init__(self, in_features: int, hidden_dim_1: int = 64, hidden_dim_2: int = 32, dropout_p: float = 0.2):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(in_features, hidden_dim_1),
            nn.BatchNorm1d(hidden_dim_1),
            nn.GELU(),
            nn.Dropout(dropout_p),
            nn.Linear(hidden_dim_1, hidden_dim_2),
            nn.BatchNorm1d(hidden_dim_2),
            nn.GELU(),
            nn.Dropout(dropout_p),
            nn.Linear(hidden_dim_2, 2)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.network(x)


class PyTorchMLPChampion:
    """Deep Multilayer Perceptron with Batch Normalization, GELU activations, and AdamW optimizer."""
    def __init__(self, 
                 hidden_dim_1: int = 64, 
                 hidden_dim_2: int = 32, 
                 lr: float = 1e-3, 
                 weight_decay: float = 1e-4, 
                 epochs: int = 80, 
                 batch_size: int = 32,
                 random_state: int = 42):
        self.hidden_dim_1 = hidden_dim_1
        self.hidden_dim_2 = hidden_dim_2
        self.lr = lr
        self.weight_decay = weight_decay
        self.epochs = epochs
        self.batch_size = batch_size
        self.random_state = random_state
        
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model: Optional[_MLPModule] = None

    def fit(self, X: np.ndarray, y: np.ndarray) -> 'PyTorchMLPChampion':
        torch.manual_seed(self.random_state)
        in_features = X.shape[1]
        self.model = _MLPModule(in_features, self.hidden_dim_1, self.hidden_dim_2).to(self.device)
        
        X_t = torch.tensor(X, dtype=torch.float32)
        y_t = torch.tensor(y, dtype=torch.long)
        dataset = TensorDataset(X_t, y_t)
        loader = DataLoader(dataset, batch_size=self.batch_size, shuffle=True)
        
        optimizer = optim.AdamW(self.model.parameters(), lr=self.lr, weight_decay=self.weight_decay)
        scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=self.epochs)
        criterion = nn.CrossEntropyLoss()
        
        self.model.train()
        for epoch in range(self.epochs):
            for batch_X, batch_y in loader:
                batch_X, batch_y = batch_X.to(self.device), batch_y.to(self.device)
                optimizer.zero_grad()
                outputs = self.model(batch_X)
                loss = criterion(outputs, batch_y)
                loss.backward()
                optimizer.step()
            scheduler.step()
            
        return self

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        if self.model is None:
            raise RuntimeError("PyTorch MLP must be fitted before predict_proba().")
        self.model.eval()
        X_t = torch.tensor(X, dtype=torch.float32).to(self.device)
        with torch.no_grad():
            logits = self.model(X_t)
            probs = torch.softmax(logits, dim=1).cpu().numpy()
        return probs

    def predict(self, X: np.ndarray) -> np.ndarray:
        probs = self.predict_proba(X)
        return np.argmax(probs, axis=1)


# ==================================================================================================
# 3. BENCHMARK SUITE RUNNER
# ==================================================================================================

def evaluate_classifier(clf: Any, X_test: np.ndarray, y_test: np.ndarray) -> Dict[str, float]:
    """Computes full clinical diagnostic evaluation metrics for a trained classifier."""
    preds = clf.predict(X_test)
    probs = clf.predict_proba(X_test)[:, 1] if hasattr(clf, "predict_proba") else preds
    
    acc = accuracy_score(y_test, preds)
    f1 = f1_score(y_test, preds, zero_division=0)
    precision = precision_score(y_test, preds, zero_division=0)
    recall = recall_score(y_test, preds, zero_division=0)  # Sensitivity
    
    # Specificity = TN / (TN + FP)
    tn = np.sum((y_test == 0) & (preds == 0))
    fp = np.sum((y_test == 0) & (preds == 1))
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    
    try:
        auroc = roc_auc_score(y_test, probs)
    except Exception:
        auroc = 0.5
        
    brier = brier_score_loss(y_test, probs)
    
    return {
        "accuracy": float(acc),
        "sensitivity": float(recall),
        "specificity": float(specificity),
        "precision": float(precision),
        "f1_score": float(f1),
        "auroc": float(auroc),
        "brier_score": float(brier),
        "false_negative_rate": float(1.0 - recall)
    }


def train_and_evaluate_all_classical(X_train: np.ndarray, 
                                     y_train: np.ndarray, 
                                     X_test: np.ndarray, 
                                     y_test: np.ndarray) -> Dict[str, Dict[str, Any]]:
    """Trains and benchmarks all 5 classical models on the provided training and test sets."""
    models = {
        "XGBoost": XGBoostChampion(),
        "SVM-RBF": SVMRBFChampion(),
        "RandomForest": RandomForestChampion(),
        "ElasticNet-LR": ElasticNetLogisticChampion(),
        "PyTorch-MLP": PyTorchMLPChampion()
    }
    
    results = {}
    for name, clf in models.items():
        logger.info(f"Training classical model: {name}...")
        clf.fit(X_train, y_train)
        metrics = evaluate_classifier(clf, X_test, y_test)
        results[name] = {
            "model_instance": clf,
            "metrics": metrics
        }
        logger.info(f"{name} -> Accuracy: {metrics['accuracy']*100:.2f}%, AUROC: {metrics['auroc']:.4f}, "
                    f"F1: {metrics['f1_score']:.4f}, Sensitivity: {metrics['sensitivity']*100:.2f}%")
        
    return results


# ==================================================================================================
# MODULE SELF-TEST
# ==================================================================================================

if __name__ == "__main__":
    logger.info("Executing Classical Models self-test...")
    np.random.seed(42)
    X_synth = np.random.randn(200, 8)
    y_synth = (X_synth[:, 0] + X_synth[:, 1] > 0).astype(int)
    
    res = train_and_evaluate_all_classical(X_synth[:150], y_synth[:150], X_synth[150:], y_synth[150:])
    assert len(res) == 5, "All 5 classical models should be evaluated"
    logger.info("Classical Models Self-Test PASSED successfully.")
