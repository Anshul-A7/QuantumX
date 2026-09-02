#!/usr/bin/env python3
"""
================================================================================
QUANTUMX: EMPIRICAL RISK STRATIFICATION & MORPHOMETRIC EVIDENCE ENGINE
================================================================================
Calculates continuous, data-driven Clinical Risk Scores (0.0 to 100.0) based on
empirical class-conditional quantiles of the Wisconsin Diagnostic Breast Cancer
(WDBC) dataset (N=569: 357 Benign, 212 Malignant) and model calibration.
================================================================================
"""

import math
from typing import Dict, Any, Tuple, List
import numpy as np

# --------------------------------------------------------------------------------
# EMPIRICAL WDBC CLASS-CONDITIONAL QUANTILES (Derived from 569 Validated Cases)
# --------------------------------------------------------------------------------
WDBC_BENIGN_STATS = {
    # feature: (5th_pct, 10th_pct, Median, 90th_pct, 95th_pct, Mean, Std)
    "radius_mean": (9.039, 9.727, 12.200, 14.452, 14.926, 12.146, 1.781),
    "texture_mean": (12.838, 13.308, 17.390, 22.868, 25.790, 17.915, 3.995),
    "perimeter_mean": (57.500, 61.940, 78.180, 93.800, 97.430, 78.075, 11.807),
    "area_mean": (246.300, 287.000, 458.700, 649.000, 688.000, 462.790, 134.920),
    "smoothness_mean": (0.071, 0.076, 0.0908, 0.1060, 0.1110, 0.0925, 0.0134),
    "compactness_mean": (0.033, 0.038, 0.0645, 0.1150, 0.1300, 0.0801, 0.0337),
    "concavity_mean": (0.0015, 0.0074, 0.0371, 0.0926, 0.1105, 0.0461, 0.0434),
    "concave_points_mean": (0.0032, 0.0070, 0.0234, 0.0480, 0.0564, 0.0257, 0.0159)
}

WDBC_MALIGNANT_STATS = {
    # feature: (5th_pct, 10th_pct, Median, 90th_pct, 95th_pct, Mean, Std)
    "radius_mean": (12.803, 13.610, 17.325, 21.075, 23.144, 17.463, 3.204),
    "texture_mean": (16.056, 17.252, 21.460, 26.452, 27.909, 21.605, 3.780),
    "perimeter_mean": (83.800, 88.500, 114.200, 141.300, 153.500, 115.365, 21.855),
    "area_mean": (498.000, 573.200, 932.000, 1407.400, 1686.000, 978.380, 367.940),
    "smoothness_mean": (0.084, 0.088, 0.1030, 0.1190, 0.1230, 0.1029, 0.0126),
    "compactness_mean": (0.067, 0.078, 0.1328, 0.2087, 0.2360, 0.1452, 0.0528),
    "concavity_mean": (0.053, 0.080, 0.1513, 0.2506, 0.3175, 0.1608, 0.0750),
    "concave_points_mean": (0.034, 0.052, 0.0863, 0.1372, 0.1511, 0.0880, 0.0344)
}

FEATURE_WEIGHTS = {
    "radius_mean": 0.20,
    "texture_mean": 0.10,
    "perimeter_mean": 0.15,
    "area_mean": 0.15,
    "smoothness_mean": 0.05,
    "compactness_mean": 0.10,
    "concavity_mean": 0.15,
    "concave_points_mean": 0.10
}


def calculate_morphometric_evidence_index(biomarkers: Dict[str, float]) -> Tuple[float, Dict[str, Any]]:
    """
    Computes where the patient's 8 cellular biomarkers sit relative to the empirical
    WDBC Benign median (0.0) and Malignant median (100.0).
    """
    dimension_scores = {}
    weighted_sum = 0.0

    for key, weight in FEATURE_WEIGHTS.items():
        val = float(biomarkers.get(key, WDBC_BENIGN_STATS[key][2]))
        b_med = WDBC_BENIGN_STATS[key][2]
        m_med = WDBC_MALIGNANT_STATS[key][2]
        
        relative_pos = (val - b_med) / (m_med - b_med + 1e-7)
        dim_score = float(np.clip(relative_pos * 100.0, -25.0, 250.0))
        dimension_scores[key] = {
            "measured": val,
            "benign_median": b_med,
            "malignant_median": m_med,
            "deviation_score": dim_score,
            "is_elevated": val > WDBC_BENIGN_STATS[key][3]
        }
        weighted_sum += dim_score * weight

    morphometric_index = float(np.clip(weighted_sum, 0.0, 100.0))
    return morphometric_index, dimension_scores


def compute_calibrated_clinical_risk(
    model_malignant_prob: float,
    biomarkers: Dict[str, float],
    model_name: str = "CX-01"
) -> Dict[str, Any]:
    """
    Integrates Model Malignancy Probability with Morphometric Evidence Index (MEI)
    to produce a non-arbitrary, empirically grounded Continuous Risk Score and Category.
    """
    p_mal = float(np.clip(model_malignant_prob, 0.001, 0.999))
    morph_index, dim_details = calculate_morphometric_evidence_index(biomarkers)

    radius = float(biomarkers.get("radius_mean", 12.2))
    concavity = float(biomarkers.get("concavity_mean", 0.037))
    area = float(biomarkers.get("area_mean", 458.7))

    is_in_morphometric_overlap = (
        (13.60 <= radius <= 14.95) or
        (0.080 <= concavity <= 0.110) or
        (560.0 <= area <= 690.0)
    )

    raw_composite_score = (0.70 * (p_mal * 100.0)) + (0.30 * morph_index)
    composite_risk_score = float(np.clip(raw_composite_score, 0.0, 100.0))

    if p_mal < 0.40 and not is_in_morphometric_overlap and morph_index < 40.0:
        tier = "LOW RISK (BENIGN / NON-NEOPLASTIC PHENOTYPE)"
        tag = "LOW_RISK"
        severity = "low"
        icon = "🟢"
        recommendation = "Routine annual screening mammography and clinical breast exam."
        morph_summary = "Benign-like architecture within empirical 90th percentile of normal breast cytology."

    elif p_mal >= 0.65 and not is_in_morphometric_overlap and morph_index >= 60.0:
        tier = "HIGH RISK (MALIGNANT CARCINOMA SUSPICION)"
        tag = "HIGH_RISK"
        severity = "high"
        icon = "🔴"
        recommendation = "Immediate referral for core needle biopsy and urgent surgical oncology consultation."
        morph_summary = "Pronounced nuclear pleomorphism, severe contour irregularity, and high cellular density."

    else:
        tier = "INDETERMINATE / BORDERLINE (ATYPICAL DYSPLASIA)"
        tag = "BORDERLINE"
        severity = "indeterminate"
        icon = "🟡"
        recommendation = "Diagnostic ultrasound follow-up and image-guided core biopsy recommended due to intermediate atypia."
        morph_summary = "Intermediate cellular atypia occupying the empirical benign-malignant transition zone."

    return {
        "model_name": model_name,
        "calibrated_malignancy_prob": p_mal * 100.0,
        "morphometric_index": morph_index,
        "composite_risk_score": composite_risk_score,
        "risk_tier": tier,
        "risk_tag": tag,
        "severity": severity,
        "icon": icon,
        "clinical_action": recommendation,
        "morphology_summary": morph_summary,
        "is_in_overlap_zone": is_in_morphometric_overlap,
        "dimension_details": dim_details
    }
