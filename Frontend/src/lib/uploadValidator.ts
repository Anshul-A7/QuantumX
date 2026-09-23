/**
 * ====================================================================================================
 * QuantumX — Smart Upload Validation Engine
 * ====================================================================================================
 * Multi-layer content validation for all uploads across disease screening studios.
 *
 * Layer 1: File Type Gate — Ensures file extension + MIME type match the target disease.
 * Layer 2: Content Relevance (Images) — Gemini Vision API classifies ECG vs non-ECG images.
 * Layer 3: Content Relevance (Tabular/PDF) — Checks extracted fields match canonical schemas.
 * Layer 4: Extraction Confidence Scoring — Per-field confidence with clear provenance badges.
 *
 * Prevents: wallpapers, selfies, bank statements, random documents from polluting inference.
 * ====================================================================================================
 */

// ── Types ───────────────────────────────────────────────────────────────────────

export type DiseaseTarget = "breast_cancer" | "cardiac_ecg" | "neurological";

export type ValidationVerdict = "accepted" | "rejected" | "warning";

export type FieldConfidenceTier =
  | "exact_match"        // 1.0 — field key matched verbatim
  | "alias_match"        // 0.9 — matched via known alias
  | "ai_semantic"        // 0.8 — Gemini resolved the mapping
  | "geometric_derived"  // 0.7 — computed from related measurements
  | "correlation_scaled" // 0.65 — scaled from worst/SE features
  | "cohort_imputed";    // 0.5 — population median fallback

export interface FieldConfidence {
  key: string;
  value: number;
  tier: FieldConfidenceTier;
  confidence: number;
  source: string; // human-readable provenance
  isWithinRange: boolean;
  warning?: string;
}

export interface ValidationResult {
  verdict: ValidationVerdict;
  message: string;
  details?: string;
  confidence: number; // 0.0–1.0 overall file confidence
  fieldConfidences?: FieldConfidence[];
  rejectionReason?: string;
  suggestedDisease?: DiseaseTarget;
}

export interface ImageValidationResult {
  isRelevant: boolean;
  confidence: number;
  description: string;
  rejectionReason?: string;
}

// ── File Extension & MIME Whitelist ──────────────────────────────────────────────

const BREAST_CANCER_ALLOWED_EXTENSIONS = new Set([
  "csv", "tsv", "json", "pdf", "txt", "log",
]);

const CARDIAC_ECG_ALLOWED_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "webp", "bmp", "tiff", "tif", "pdf", "zip",
]);

const BREAST_CANCER_ALLOWED_MIMES = new Set([
  "text/csv", "text/tab-separated-values", "application/json",
  "application/pdf", "text/plain",
]);

const CARDIAC_ECG_ALLOWED_MIMES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/bmp",
  "image/tiff", "application/pdf", "application/zip",
  "application/x-zip-compressed", "application/octet-stream",
]);

// ── Canonical Biomarker Ranges (WDBC) ──────────────────────────────────────────

const BREAST_CANCER_FIELD_RANGES: Record<string, { min: number; max: number; label: string }> = {
  radius_mean:         { min: 4.0,   max: 35.0,   label: "Cell Size (Radius)" },
  texture_mean:        { min: 5.0,   max: 50.0,   label: "Surface Texture" },
  perimeter_mean:      { min: 25.0,  max: 250.0,  label: "Cell Perimeter" },
  area_mean:           { min: 50.0,  max: 3500.0, label: "Nuclear Area" },
  smoothness_mean:     { min: 0.01,  max: 0.40,   label: "Border Smoothness" },
  compactness_mean:    { min: 0.001, max: 0.60,   label: "Compactness Index" },
  concavity_mean:      { min: 0.0,   max: 0.60,   label: "Indentation Depth" },
  concave_points_mean: { min: 0.0,   max: 0.35,   label: "Indentation Count" },
};

// ── Layer 1: File Type Gate ─────────────────────────────────────────────────────

export function validateFileType(
  file: File,
  targetDisease: DiseaseTarget,
): ValidationResult {
  const fileName = file.name.toLowerCase();
  const ext = fileName.split(".").pop() || "";
  const mime = file.type.toLowerCase();

  // ZIP files are universally accepted for batch processing
  if (ext === "zip") {
    return {
      verdict: "accepted",
      message: "ZIP archive accepted for batch processing.",
      confidence: 1.0,
    };
  }

  if (targetDisease === "breast_cancer") {
    // Breast cancer studio: tabular/PDF only. Reject raw images (those are for ECG).
    if (CARDIAC_ECG_ALLOWED_EXTENSIONS.has(ext) && !BREAST_CANCER_ALLOWED_EXTENSIONS.has(ext)) {
      return {
        verdict: "rejected",
        message: "Image files cannot be processed in the Breast Cancer studio.",
        details: `"${file.name}" appears to be an image file. The Breast Cancer Screening Studio processes tabular biopsy data (CSV, JSON, PDF lab reports). For ECG image analysis, please use the Heart Attack & Cardiac ECG Studio instead.`,
        confidence: 0,
        rejectionReason: "wrong_disease_modality",
        suggestedDisease: "cardiac_ecg",
      };
    }
    if (!BREAST_CANCER_ALLOWED_EXTENSIONS.has(ext)) {
      return {
        verdict: "rejected",
        message: `File type ".${ext}" is not supported for breast cancer screening.`,
        details: `Accepted formats: .CSV, .TSV, .JSON, .PDF, .TXT`,
        confidence: 0,
        rejectionReason: "unsupported_file_type",
      };
    }
  }

  if (targetDisease === "cardiac_ecg") {
    // Cardiac ECG studio: images, PDFs (containing ECG images), ZIPs
    if (BREAST_CANCER_ALLOWED_EXTENSIONS.has(ext) && !CARDIAC_ECG_ALLOWED_EXTENSIONS.has(ext)) {
      // CSV/TSV/JSON → wrong studio
      return {
        verdict: "rejected",
        message: "Tabular data files cannot be processed in the Cardiac ECG Studio.",
        details: `"${file.name}" appears to be a tabular data file. The Cardiac ECG Studio processes 12-lead ECG images. For tabular biomarker screening, please use the Breast Cancer Screening Studio.`,
        confidence: 0,
        rejectionReason: "wrong_disease_modality",
        suggestedDisease: "breast_cancer",
      };
    }
    if (!CARDIAC_ECG_ALLOWED_EXTENSIONS.has(ext)) {
      return {
        verdict: "rejected",
        message: `File type ".${ext}" is not supported for cardiac ECG analysis.`,
        details: `Accepted formats: .JPG, .JPEG, .PNG, .WEBP, .PDF (containing ECG), .ZIP (containing ECG images)`,
        confidence: 0,
        rejectionReason: "unsupported_file_type",
      };
    }
  }

  return {
    verdict: "accepted",
    message: "File type accepted.",
    confidence: 1.0,
  };
}

// ── Layer 2: Image Content Relevance (Gemini Vision API) ────────────────────────

export async function validateImageContent(
  base64Image: string,
  targetDisease: DiseaseTarget,
): Promise<ImageValidationResult> {
  // Only ECG images need vision validation
  if (targetDisease !== "cardiac_ecg") {
    return { isRelevant: true, confidence: 1.0, description: "Non-image validation not required." };
  }

  try {
    const response = await fetch("/api/ai/validate-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        base64Image,
        targetDisease,
      }),
    });

    if (!response.ok) {
      // If API fails, allow through with warning (don't block on API failure)
      console.warn("[UploadValidator] Vision API call failed, allowing through:", response.status);
      return {
        isRelevant: true,
        confidence: 0.5,
        description: "Validation service unavailable. Image accepted with reduced confidence.",
      };
    }

    const data = await response.json();
    return {
      isRelevant: data.isValid ?? true,
      confidence: data.confidence ?? 0.5,
      description: data.description || "",
      rejectionReason: data.rejectionReason,
    };
  } catch (err) {
    console.warn("[UploadValidator] Vision API error, allowing through:", err);
    return {
      isRelevant: true,
      confidence: 0.5,
      description: "Validation service unavailable. Image accepted with reduced confidence.",
    };
  }
}

// ── Layer 3: Tabular Content Relevance ──────────────────────────────────────────

export function validateExtractedFields(
  extractedFields: Record<string, number>,
  targetDisease: DiseaseTarget,
): ValidationResult {
  if (targetDisease !== "breast_cancer") {
    return {
      verdict: "accepted",
      message: "Field validation not applicable for this disease type.",
      confidence: 1.0,
    };
  }

  const canonicalKeys = Object.keys(BREAST_CANCER_FIELD_RANGES);
  const matchedKeys = canonicalKeys.filter((k) => k in extractedFields && extractedFields[k] !== undefined);

  if (matchedKeys.length === 0) {
    return {
      verdict: "rejected",
      message: "No breast cancer biomarkers detected in this document.",
      details:
        "This document doesn't appear to contain breast cancer biopsy cell measurements. Please upload a pathology lab report containing cellular morphometric data (radius, texture, perimeter, area, smoothness, compactness, concavity, concave points).",
      confidence: 0,
      rejectionReason: "no_relevant_fields",
    };
  }

  // Check value ranges
  const fieldConfidences: FieldConfidence[] = [];
  let outOfRangeCount = 0;

  for (const key of matchedKeys) {
    const value = extractedFields[key];
    const range = BREAST_CANCER_FIELD_RANGES[key];
    const isWithinRange = value >= range.min && value <= range.max;

    if (!isWithinRange) outOfRangeCount++;

    fieldConfidences.push({
      key,
      value,
      tier: "exact_match", // will be overridden by parser with actual tier
      confidence: isWithinRange ? 0.95 : 0.4,
      source: isWithinRange ? "Extracted from document" : "Value outside expected clinical range",
      isWithinRange,
      warning: isWithinRange
        ? undefined
        : `${range.label} value ${value} is outside the expected clinical range (${range.min}–${range.max}). Please verify.`,
    });
  }

  if (outOfRangeCount > matchedKeys.length * 0.6) {
    return {
      verdict: "warning",
      message: `${outOfRangeCount} of ${matchedKeys.length} extracted values are outside expected clinical ranges.`,
      details:
        "Most extracted values appear unusual for breast cancer biopsy measurements. This document may not be a cytopathology lab report, or the values may have been incorrectly extracted. Please verify each field carefully before proceeding.",
      confidence: 0.3,
      fieldConfidences,
      rejectionReason: "values_out_of_range",
    };
  }

  const overallConfidence = matchedKeys.length >= 6 ? 0.95 : matchedKeys.length >= 4 ? 0.8 : 0.6;

  return {
    verdict: matchedKeys.length >= 3 ? "accepted" : "warning",
    message: `${matchedKeys.length} of 8 biomarker fields successfully extracted.`,
    confidence: overallConfidence,
    fieldConfidences,
  };
}

// ── Layer 4: Confidence Tier Scoring ────────────────────────────────────────────

export function computeFieldConfidence(
  tier: FieldConfidenceTier,
): number {
  switch (tier) {
    case "exact_match":        return 1.0;
    case "alias_match":        return 0.9;
    case "ai_semantic":        return 0.8;
    case "geometric_derived":  return 0.7;
    case "correlation_scaled": return 0.65;
    case "cohort_imputed":     return 0.5;
    default:                   return 0.5;
  }
}

export function getConfidenceBadge(confidence: number): {
  label: string;
  color: "green" | "amber" | "red";
  description: string;
} {
  if (confidence >= 0.8) {
    return {
      label: "High Confidence",
      color: "green",
      description: "Value directly extracted or closely matched from the source document.",
    };
  }
  if (confidence >= 0.6) {
    return {
      label: "Moderate Confidence",
      color: "amber",
      description: "Value derived from related measurements or resolved via AI semantic analysis. Please verify.",
    };
  }
  return {
    label: "Low Confidence",
    color: "red",
    description: "Value estimated from population averages, not from your actual lab report. Manual verification strongly recommended.",
  };
}

// ── Composite Full-File Validation Pipeline ─────────────────────────────────────

export async function runFullValidation(
  file: File,
  targetDisease: DiseaseTarget,
  extractedFields?: Record<string, number>,
  base64Image?: string,
): Promise<ValidationResult> {
  // Step 1: File type gate
  const typeResult = validateFileType(file, targetDisease);
  if (typeResult.verdict === "rejected") {
    return typeResult;
  }

  // Step 2: Image content relevance (for ECG images)
  if (base64Image && targetDisease === "cardiac_ecg") {
    const imageResult = await validateImageContent(base64Image, targetDisease);
    if (!imageResult.isRelevant) {
      return {
        verdict: "rejected",
        message: "This doesn't appear to be a clinical ECG image.",
        details: imageResult.rejectionReason ||
          "Please upload a 12-lead ECG strip or electrocardiogram recording. Personal photos, screenshots, and non-medical images cannot be processed.",
        confidence: 0,
        rejectionReason: "not_ecg_image",
      };
    }
    if (imageResult.confidence < 0.7) {
      return {
        verdict: "warning",
        message: "Image content could not be confidently identified as an ECG.",
        details: `Confidence: ${(imageResult.confidence * 100).toFixed(0)}%. ${imageResult.description}`,
        confidence: imageResult.confidence,
      };
    }
  }

  // Step 3: Tabular content relevance (for extracted fields)
  if (extractedFields && targetDisease === "breast_cancer") {
    return validateExtractedFields(extractedFields, targetDisease);
  }

  return {
    verdict: "accepted",
    message: "File passed all validation checks.",
    confidence: 1.0,
  };
}
