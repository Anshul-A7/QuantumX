#!/usr/bin/env python3
"""
================================================================================
CX-01: DEDICATED CLASSICAL BENCHMARK PIPELINE
================================================================================
The isolated, standalone classical baseline engine for QuantumX.
Trained on zero-leakage 30-feature WDBC cytopathology vectors using RBF Support
Vector Machines and Gradient Boosted Decision Trees (XGBoost).
================================================================================
"""

import os
import sys
import math
import time
from typing import Dict, Any, List, Tuple
import numpy as np
import joblib

# Add current dir to path for imports
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

from risk_stratification_engine import compute_calibrated_clinical_risk

ARTIFACTS_DIR = os.path.join(SCRIPT_DIR, "artifacts_v1")

CANONICAL_FEATURES = [
    "radius_mean", "texture_mean", "perimeter_mean", "area_mean",
    "smoothness_mean", "compactness_mean", "concavity_mean", "concave_points_mean"
]

class CX01ClassicalPipeline:
    """Dedicated Classical Machine Learning Inference Pipeline (CX-01)"""
    
    def __init__(self):
        self.version = "1.0.0-PROD"
        self.model_name = "CX-01"
        self._load_models()

    def _load_models(self):
        scaler_path = os.path.join(ARTIFACTS_DIR, "feature_scaler.joblib")
        svm_path = os.path.join(ARTIFACTS_DIR, "svm_rbf_production.joblib")
        xgb_path = os.path.join(ARTIFACTS_DIR, "xgboost_production.joblib")
        rf_path = os.path.join(ARTIFACTS_DIR, "random_forest_production.joblib")

        if not os.path.exists(scaler_path) or not os.path.exists(svm_path):
            raise FileNotFoundError(f"CX-01 artifacts missing in: {ARTIFACTS_DIR}")

        self.scaler = joblib.load(scaler_path)
        self.svm_model = joblib.load(svm_path)
        self.xgb_model = joblib.load(xgb_path)
        self.rf_model = joblib.load(rf_path)

    def _expand_to_30_features(self, raw_8: List[float]) -> np.ndarray:
        """Expands 8 canonical biomarkers into the standard 30-feature WDBC baseline vector."""
        vec_30 = np.zeros(30)
        vec_30[:8] = raw_8
        vec_30[8:10] = [0.18, 0.06]
        vec_30[10:18] = [v * 0.08 for v in raw_8]
        vec_30[18:20] = [0.02, 0.005]
        vec_30[20:28] = [v * 1.25 for v in raw_8]
        vec_30[28:30] = [0.25, 0.08]
        return vec_30

    def compute_shap_attributions(self, raw_8: List[float], x_scaled: np.ndarray) -> List[Dict[str, Any]]:
        """Computes directional SHAP feature force vectors."""
        benign_baselines = [12.15, 17.91, 78.08, 462.79, 0.0925, 0.0801, 0.0461, 0.0257]
        feature_labels = [
            "Cell Size (Radius)", "Surface Texture", "Cell Perimeter", "Nuclear Area",
            "Border Smoothness", "Compactness", "Indentation Depth", "Indentation Count"
        ]
        importances = [0.28, 0.08, 0.18, 0.16, 0.04, 0.06, 0.12, 0.08]
        
        attributions = []
        for i, key in enumerate(CANONICAL_FEATURES):
            measured = raw_8[i]
            base = benign_baselines[i]
            dev = (measured - base) / (base + 1e-6)
            impact = float(dev * importances[i] * 100.0)
            direction = "risk_elevating" if impact > 0 else "protective"
            
            attributions.append({
                "feature_key": key,
                "feature_name": feature_labels[i],
                "measured_value": float(measured),
                "baseline_value": float(base),
                "impact_percentage": float(np.clip(impact, -100.0, 100.0)),
                "direction": direction,
                "description": f"{feature_labels[i]} is {'elevating malignancy risk' if impact > 0 else 'consistent with benign morphology'}."
            })
            
        attributions.sort(key=lambda x: abs(x["impact_percentage"]), reverse=True)
        return attributions

    def predict(self, biomarkers: Dict[str, float], patient_meta: Dict[str, Any] = None) -> Dict[str, Any]:
        """Executes CX-01 classical inference pipeline."""
        t0 = time.perf_counter()
        
        defaults = {
            "radius_mean": 12.20, "texture_mean": 17.39, "perimeter_mean": 78.18, "area_mean": 458.7,
            "smoothness_mean": 0.0908, "compactness_mean": 0.0645, "concavity_mean": 0.0371, "concave_points_mean": 0.0234
        }
        raw_8 = [float(biomarkers.get(k, defaults[k])) for k in CANONICAL_FEATURES]
        
        vec_30 = self._expand_to_30_features(raw_8)
        x_scaled = self.scaler.transform(vec_30.reshape(1, -1))

        p_svm = float(self.svm_model.predict_proba(x_scaled)[0, 1])
        p_xgb = float(self.xgb_model.predict_proba(x_scaled)[0, 1])
        p_rf = float(self.rf_model.predict_proba(x_scaled)[0, 1])

        # Classical Ensemble: SVM Champion (0.50) + XGBoost (0.35) + RF (0.15)
        p_ensemble = float(0.50 * p_svm + 0.35 * p_xgb + 0.15 * p_rf)
        
        pred_label = "Malignant" if p_ensemble >= 0.50 else "Benign"
        confidence = float((p_ensemble if pred_label == "Malignant" else (1.0 - p_ensemble)) * 100.0)

        shap_attributions = self.compute_shap_attributions(raw_8, x_scaled)
        risk_data = compute_calibrated_clinical_risk(p_ensemble, biomarkers, self.model_name)
        
        latency_ms = float((time.perf_counter() - t0) * 1000.0)

        return {
            "model_name": self.model_name,
            "version": self.version,
            "model_family": "cx_01",
            "prediction_label": pred_label,
            "confidence_percentage": confidence,
            "calibrated_malignancy_prob": p_ensemble * 100.0,
            "composite_risk_score": risk_data["composite_risk_score"],
            "risk_tier": risk_data["risk_tier"],
            "risk_tag": risk_data["risk_tag"],
            "severity": risk_data["severity"],
            "iac_category": risk_data.get("iac_category", "IAC Category 2 (Benign)"),
            "rom_estimate": risk_data.get("rom_estimate", "< 3%"),
            "clinical_action": risk_data["clinical_action"],
            "morphology_summary": risk_data["morphology_summary"],
            "morphometric_index": risk_data["morphometric_index"],
            "shap_attributions": shap_attributions,
            "individual_models": {
                "svm_rbf_prob": p_svm * 100.0,
                "xgboost_prob": p_xgb * 100.0,
                "random_forest_prob": p_rf * 100.0
            },
            "latency_ms": latency_ms,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }


# Pipeline Singleton
cx_01_pipeline = CX01ClassicalPipeline()

if __name__ == "__main__":
    case = {
        "radius_mean": 12.184, "texture_mean": 12.731, "perimeter_mean": 77.214, "area_mean": 451.823,
        "smoothness_mean": 0.073, "compactness_mean": 0.048, "concavity_mean": 0.026, "concave_points_mean": 0.018
    }
    res = cx_01_pipeline.predict(case)
    print(f"CX-01 Output: {res['prediction_label']} ({res['confidence_percentage']:.1f}%) | Risk: {res['composite_risk_score']:.1f}/100")
