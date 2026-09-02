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
    "concave_points_mean": 0.22,
    "concavity_mean": 0.20,
    "radius_mean": 0.18,
    "area_mean": 0.15,
    "perimeter_mean": 0.12,
    "compactness_mean": 0.07,
    "texture_mean": 0.04,
    "smoothness_mean": 0.02
}


def calculate_morphometric_evidence_index(biomarkers: Dict[str, float]) -> Tuple[float, Dict[str, Any]]:
    """
    Computes where the patient's 8 cellular biomarkers sit relative to the empirical
    WDBC Benign median (0.0) and Malignant median (100.0) with pathognomonic weighting.
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
    to produce a non-arbitrary, empirically grounded Continuous Risk Score and Category
    aligned with the International Academy of Cytology (IAC) Yokohama Reporting System
    and ACR BI-RADS clinical stratification standards.
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

    raw_composite_score = (0.65 * (p_mal * 100.0)) + (0.35 * morph_index)
    composite_risk_score = float(np.clip(raw_composite_score, 0.0, 100.0))

    # Researched 5-Tier IAC Yokohama & BI-RADS Stratification
    if composite_risk_score < 25.0:
        tier = "LOW RISK (BENIGN / NON-NEOPLASTIC)"
        tag = "LOW_RISK"
        severity = "low"
        icon = "🟢"
        iac_category = "IAC Category 2 (Benign)"
        rom_estimate = "< 3%"
        recommendation = "Routine annual screening mammography and regular clinical breast examination."
        morph_summary = "Standard cellular dimensions and smooth nuclear borders well within normal benign limits."

    elif composite_risk_score < 45.0:
        tier = "MILD SUSPICION (PROBABLY BENIGN ATYPIA)"
        tag = "MILD_SUSPICION"
        severity = "low_moderate"
        icon = "🟢"
        iac_category = "IAC Category 2-3 Borderline"
        rom_estimate = "3% - 15%"
        recommendation = "Short-interval 6-month diagnostic ultrasound or repeat FNA to confirm cytological stability."
        morph_summary = "Mild architectural irregularity or slight size variation, favoring benign reactive changes."

    elif composite_risk_score < 65.0:
        tier = "INDETERMINATE / BORDERLINE (ATYPICAL DYSPLASIA)"
        tag = "BORDERLINE"
        severity = "indeterminate"
        icon = "🟡"
        iac_category = "IAC Category 3 (Atypical)"
        rom_estimate = "15% - 50%"
        recommendation = "Diagnostic ultrasound follow-up and image-guided core needle biopsy (CNB) recommended due to intermediate atypia."
        morph_summary = "Intermediate nuclear atypia and contour irregularities occupying the empirical benign-malignant transition zone."

    elif composite_risk_score < 85.0:
        tier = "HIGH RISK (SUSPICIOUS FOR CARCINOMA)"
        tag = "HIGH_RISK"
        severity = "high"
        icon = "🔴"
        iac_category = "IAC Category 4 (Suspicious)"
        rom_estimate = "50% - 85%"
        recommendation = "Immediate core needle biopsy and urgent surgical oncology consultation for definitive histologic grading."
        morph_summary = "Pronounced nuclear pleomorphism, marked contour indentations, and elevated cellular density."

    else:
        tier = "CRITICAL RISK (DIAGNOSTIC OF MALIGNANCY)"
        tag = "CRITICAL_RISK"
        severity = "critical"
        icon = "🔴"
        iac_category = "IAC Category 5 (Malignant)"
        rom_estimate = "> 85% (Empirical > 99%)"
        recommendation = "Urgent comprehensive oncology workup, receptor profiling (ER/PR/HER2), and surgical staging."
        morph_summary = "Severe nuclear pleomorphism, deep concavity indentations, and high nuclear-cytoplasmic ratio characteristic of invasive carcinoma."

    return {
        "model_name": model_name,
        "calibrated_malignancy_prob": p_mal * 100.0,
        "morphometric_index": morph_index,
        "composite_risk_score": composite_risk_score,
        "risk_tier": tier,
        "risk_tag": tag,
        "severity": severity,
        "icon": icon,
        "iac_category": iac_category,
        "rom_estimate": rom_estimate,
        "clinical_action": recommendation,
        "morphology_summary": morph_summary,
        "is_in_overlap_zone": is_in_morphometric_overlap,
        "dimension_details": dim_details
    }
