/**
 * ====================================================================================================
 * QuantumX — Batch Screening Orchestration Service
 * ====================================================================================================
 * Manages batch execution lifecycle: dispatches records to inference APIs, tracks progress,
 * persists results, and generates exportable datasets.
 *
 * Flow: BatchUploadPanel → batchFileProcessor → batch.service → inference APIs → BatchResultsTable
 *
 * Supports:
 *   - Breast Cancer tabular records → /api/inference/breast-cancer
 *   - Cardiac ECG images → Backend /inference/cardiac-ecg
 *   - Per-record progress tracking (pending → running → success → error)
 *   - Batch session persistence (localStorage + Supabase via ScreeningService)
 *   - CSV/JSON/PDF-ZIP export
 * ====================================================================================================
 */

import { type ParsedRecord, type BatchChunk } from "@/lib/batchFileProcessor";
import { ScreeningService, type StoredPrediction } from "@/services/screening.service";
import { generateReportBlob, generateBatchSummaryPdf, type ReportPayload, type BatchSummaryEntry, type BiomarkerEntry } from "@/lib/pdfReportGenerator";
import JSZip from "jszip";
import { saveAs } from "file-saver";

// ── Types ───────────────────────────────────────────────────────────────────────

export type BatchRecordStatus = "pending" | "running" | "success" | "error" | "rejected";

export interface BatchRecord {
  rowIndex: number;
  patientId: string;
  patientName: string;
  status: BatchRecordStatus;
  diseaseType: string;
  inputData: Record<string, number>;
  imageBase64?: string;
  imageName?: string;
  // Results (populated after inference)
  quantumPrediction?: string;
  classicalPrediction?: string;
  quantumRiskScore?: number;
  classicalRiskScore?: number;
  quantumConfidence?: number;
  classicalConfidence?: number;
  riskLevel?: "High" | "Low" | "Borderline";
  riskTag?: string;
  riskTier?: string;
  consensusStatus?: "Concordant" | "Discordant";
  topDriver?: string;
  topDriverImpact?: number;
  latencyMs?: number;
  attributions?: any[];
  error?: string;
  rejectionReason?: string;
  fullResult?: any; // complete API response for detailed view
}

export interface BatchSession {
  batchId: string;
  uploadedFileName: string;
  diseaseType: string;
  totalRecords: number;
  records: BatchRecord[];
  startTime: string;
  endTime?: string;
  // Aggregate stats
  processedCount: number;
  successCount: number;
  errorCount: number;
  rejectedCount: number;
  highRiskCount: number;
  lowRiskCount: number;
  borderlineCount: number;
  concordantCount: number;
  discordantCount: number;
  averageRiskScore: number;
  executionTimeMs: number;
  isComplete: boolean;
}

export type ProgressCallback = (session: BatchSession) => void;

// ── Batch ID Generator ──────────────────────────────────────────────────────────

function generateBatchId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 6);
  return `QX-BATCH-${ts}-${rand}`.toUpperCase();
}

// ── Breast Cancer Inference ─────────────────────────────────────────────────────

async function inferBreastCancer(record: ParsedRecord): Promise<any> {
  const response = await fetch("/api/inference/breast-cancer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      biomarkers: record.data,
      model_family: "quantumx_hybrid_v1",
      execution_mode: "simulator",
      patient_info: {
        patient_id: record.patientId,
        name: record.patientName,
      },
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`Inference failed with status ${response.status}`);
  }

  return response.json();
}

// ── Cardiac ECG Inference ───────────────────────────────────────────────────────

async function inferCardiacEcg(record: ParsedRecord): Promise<any> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  let base64Data = record.imageBase64 || "";
  if (base64Data.includes(",")) {
    base64Data = base64Data.split(",")[1];
  }

  const response = await fetch(`${backendUrl}/inference/cardiac-ecg`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_base64: base64Data,
      filename: record.imageName || "ecg_image.jpg",
      model_name: "transfinite_1",
    }),
    signal: AbortSignal.timeout(45000),
  });

  if (!response.ok) {
    throw new Error(`Cardiac ECG inference failed with status ${response.status}`);
  }

  return response.json();
}

// ── Batch Execution Engine ──────────────────────────────────────────────────────

export async function executeBatch(
  chunks: BatchChunk[],
  diseaseType: "breast_cancer" | "cardiac_ecg",
  uploadedFileName: string,
  onProgress: ProgressCallback,
): Promise<BatchSession> {
  const batchId = generateBatchId();
  const allRecords: BatchRecord[] = [];

  // Flatten all records from all chunks
  for (const chunk of chunks) {
    for (const record of chunk.records) {
      allRecords.push({
        rowIndex: record.rowIndex,
        patientId: record.patientId,
        patientName: record.patientName,
        status: "pending",
        diseaseType: diseaseType === "cardiac_ecg" ? "Heart Attack & Cardiac ECG" : "Breast Cancer Screening",
        inputData: record.data,
        imageBase64: record.imageBase64,
        imageName: record.imageName,
      });
    }
  }

  const session: BatchSession = {
    batchId,
    uploadedFileName,
    diseaseType: diseaseType === "cardiac_ecg" ? "Heart Attack & Cardiac ECG" : "Breast Cancer Screening",
    totalRecords: allRecords.length,
    records: allRecords,
    startTime: new Date().toISOString(),
    processedCount: 0,
    successCount: 0,
    errorCount: 0,
    rejectedCount: 0,
    highRiskCount: 0,
    lowRiskCount: 0,
    borderlineCount: 0,
    concordantCount: 0,
    discordantCount: 0,
    averageRiskScore: 0,
    executionTimeMs: 0,
    isComplete: false,
  };

  onProgress(session);

  const startTime = performance.now();

  // Process in micro-batches of 5 concurrent requests
  const CONCURRENCY = 5;

  for (let i = 0; i < allRecords.length; i += CONCURRENCY) {
    const batch = allRecords.slice(i, i + CONCURRENCY);
    const promises = batch.map(async (record, batchIdx) => {
      const globalIdx = i + batchIdx;
      session.records[globalIdx].status = "running";
      onProgress({ ...session });

      try {
        let result: any;

        if (diseaseType === "breast_cancer") {
          const parsed: ParsedRecord = {
            rowIndex: record.rowIndex,
            patientId: record.patientId,
            patientName: record.patientName,
            data: record.inputData,
          };
          result = await inferBreastCancer(parsed);
        } else {
          const parsed: ParsedRecord = {
            rowIndex: record.rowIndex,
            patientId: record.patientId,
            patientName: record.patientName,
            data: {},
            imageBase64: record.imageBase64,
            imageName: record.imageName,
          };
          result = await inferCardiacEcg(parsed);
        }

        // Extract results
        const dc = result.dual_comparison;
        const tfResult = dc?.transfinite_1 || result;
        const cxResult = dc?.cx_01;

        session.records[globalIdx].status = "success";
        session.records[globalIdx].quantumPrediction = tfResult?.prediction_label || result.prediction_label || "Unknown";
        session.records[globalIdx].classicalPrediction = cxResult?.prediction_label || result.prediction_label || "Unknown";
        session.records[globalIdx].quantumRiskScore = tfResult?.risk_score ?? result.composite_risk_score ?? 0;
        session.records[globalIdx].classicalRiskScore = cxResult?.risk_score ?? result.composite_risk_score ?? 0;
        session.records[globalIdx].quantumConfidence = tfResult?.confidence ?? result.confidence ?? 0;
        session.records[globalIdx].classicalConfidence = cxResult?.confidence ?? result.confidence ?? 0;
        session.records[globalIdx].riskTag = result.risk_tag || tfResult?.risk_tag || "LOW_RISK";
        session.records[globalIdx].riskTier = result.risk_tier || tfResult?.risk_tier || "";
        session.records[globalIdx].latencyMs = result.latency_ms || 0;
        session.records[globalIdx].attributions = result.shap_attributions || [];
        session.records[globalIdx].topDriver = result.shap_attributions?.[0]?.featureName || "";
        session.records[globalIdx].topDriverImpact = result.shap_attributions?.[0]?.impactPercentage || 0;
        session.records[globalIdx].fullResult = result;

        // Consensus
        const qPred = session.records[globalIdx].quantumPrediction;
        const cPred = session.records[globalIdx].classicalPrediction;
        session.records[globalIdx].consensusStatus = qPred === cPred ? "Concordant" : "Discordant";

        // Risk level
        const riskScore = session.records[globalIdx].quantumRiskScore || 0;
        if (riskScore >= 65) {
          session.records[globalIdx].riskLevel = "High";
          session.highRiskCount++;
        } else if (riskScore >= 45) {
          session.records[globalIdx].riskLevel = "Borderline";
          session.borderlineCount++;
        } else {
          session.records[globalIdx].riskLevel = "Low";
          session.lowRiskCount++;
        }

        if (session.records[globalIdx].consensusStatus === "Concordant") {
          session.concordantCount++;
        } else {
          session.discordantCount++;
        }

        session.successCount++;
      } catch (err: any) {
        session.records[globalIdx].status = "error";
        session.records[globalIdx].error = err.message || "Unknown inference error";
        session.errorCount++;
      }

      session.processedCount++;
      onProgress({ ...session });
    });

    await Promise.allSettled(promises);
  }

  // Final stats
  const successRecords = session.records.filter((r) => r.status === "success");
  session.averageRiskScore = successRecords.length > 0
    ? successRecords.reduce((sum, r) => sum + (r.quantumRiskScore || 0), 0) / successRecords.length
    : 0;
  session.executionTimeMs = performance.now() - startTime;
  session.endTime = new Date().toISOString();
  session.isComplete = true;

  onProgress({ ...session });

  // Persist batch log to localStorage
  saveBatchSession(session);

  // Persist individual records to ScreeningService (async, non-blocking)
  persistBatchRecords(session).catch((err) => {
    console.warn("[BatchService] Background persistence warning:", err);
  });

  return session;
}

// ── Persistence ─────────────────────────────────────────────────────────────────

function saveBatchSession(session: BatchSession): void {
  if (typeof window === "undefined") return;
  try {
    const email = localStorage.getItem("quantumx_user_email") || "default";
    const key = `quantumx_batch_sessions_${email}`;
    const existing = localStorage.getItem(key);
    const sessions: BatchSession[] = existing ? JSON.parse(existing) : [];

    // Store session without full result objects to save space
    const compactSession: BatchSession = {
      ...session,
      records: session.records.map((r) => ({
        ...r,
        fullResult: undefined, // strip heavy data
        imageBase64: undefined, // strip image data
      })),
    };

    sessions.unshift(compactSession);
    // Keep max 50 batch sessions
    if (sessions.length > 50) sessions.length = 50;
    localStorage.setItem(key, JSON.stringify(sessions));
  } catch (err) {
    console.warn("[BatchService] Could not save batch session:", err);
  }
}

export function getBatchSessions(): BatchSession[] {
  if (typeof window === "undefined") return [];
  try {
    const email = localStorage.getItem("quantumx_user_email") || "default";
    const key = `quantumx_batch_sessions_${email}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function persistBatchRecords(session: BatchSession): Promise<void> {
  const successRecords = session.records.filter((r) => r.status === "success");

  // Persist first 100 to Supabase to avoid rate limiting
  const toStore = successRecords.slice(0, 100);

  for (const record of toStore) {
    try {
      await ScreeningService.createScreening({
        id: `${session.batchId}-${record.rowIndex}`,
        patientId: record.patientId,
        patientName: record.patientName,
        diseaseType: record.diseaseType,
        disease: record.diseaseType,
        quantumPrediction: record.quantumPrediction || "Unknown",
        quantumRiskScore: record.quantumRiskScore,
        quantumConfidence: record.quantumConfidence || 0,
        classicalPrediction: record.classicalPrediction || "Unknown",
        classicalRiskScore: record.classicalRiskScore,
        classicalConfidence: record.classicalConfidence || 0,
        riskLevel: record.riskLevel || "Low",
        topDriver: record.topDriver,
        topDriverImpact: record.topDriverImpact,
        consensusStatus: record.consensusStatus,
        inputFeatures: record.inputData,
      });
    } catch {
      // Non-critical — continue
    }
  }
}

// ── Export: CSV ──────────────────────────────────────────────────────────────────

export function exportBatchAsCSV(session: BatchSession): void {
  const headers = [
    "Row", "Patient ID", "Patient Name", "Disease Type",
    "Quantum Prediction", "Classical Prediction",
    "Quantum Risk Score", "Classical Risk Score",
    "Quantum Confidence", "Classical Confidence",
    "Risk Level", "Risk Tag", "Consensus", "Top Driver", "Status",
  ];

  const rows = session.records.map((r) => [
    r.rowIndex + 1,
    r.patientId,
    r.patientName,
    r.diseaseType,
    r.quantumPrediction || "",
    r.classicalPrediction || "",
    r.quantumRiskScore?.toFixed(1) || "",
    r.classicalRiskScore?.toFixed(1) || "",
    r.quantumConfidence?.toFixed(1) || "",
    r.classicalConfidence?.toFixed(1) || "",
    r.riskLevel || "",
    r.riskTag || "",
    r.consensusStatus || "",
    r.topDriver || "",
    r.status,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  saveAs(blob, `QuantumX_Batch_${session.batchId}.csv`);
}

// ── Export: JSON ─────────────────────────────────────────────────────────────────

export function exportBatchAsJSON(session: BatchSession): void {
  const exportData = {
    batchId: session.batchId,
    generatedAt: new Date().toISOString(),
    totalRecords: session.totalRecords,
    stats: {
      successCount: session.successCount,
      errorCount: session.errorCount,
      highRiskCount: session.highRiskCount,
      concordantCount: session.concordantCount,
      averageRiskScore: session.averageRiskScore,
      executionTimeMs: session.executionTimeMs,
    },
    records: session.records.map((r) => ({
      rowIndex: r.rowIndex,
      patientId: r.patientId,
      patientName: r.patientName,
      diseaseType: r.diseaseType,
      status: r.status,
      quantumPrediction: r.quantumPrediction,
      classicalPrediction: r.classicalPrediction,
      quantumRiskScore: r.quantumRiskScore,
      classicalRiskScore: r.classicalRiskScore,
      quantumConfidence: r.quantumConfidence,
      classicalConfidence: r.classicalConfidence,
      riskLevel: r.riskLevel,
      riskTag: r.riskTag,
      consensusStatus: r.consensusStatus,
      topDriver: r.topDriver,
      inputData: r.inputData,
    })),
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  saveAs(blob, `QuantumX_Batch_${session.batchId}.json`);
}

// ── Export: PDF ZIP ──────────────────────────────────────────────────────────────

export const BIOMARKER_LABELS: Record<string, { label: string; unit: string; benignMed: number; normalMax: number }> = {
  radius_mean:         { label: "Cell Size (Radius)",     unit: "μm",     benignMed: 12.15, normalMax: 14.95 },
  texture_mean:        { label: "Surface Texture",        unit: "std",    benignMed: 17.91, normalMax: 22.87 },
  perimeter_mean:      { label: "Cell Perimeter",         unit: "μm",     benignMed: 78.08, normalMax: 93.80 },
  area_mean:           { label: "Nuclear Area",           unit: "μm²",    benignMed: 462.8, normalMax: 649.0 },
  smoothness_mean:     { label: "Border Smoothness",      unit: "index",  benignMed: 0.0925, normalMax: 0.1060 },
  compactness_mean:    { label: "Compactness Index",      unit: "index",  benignMed: 0.0801, normalMax: 0.1150 },
  concavity_mean:      { label: "Indentation Depth",      unit: "index",  benignMed: 0.0461, normalMax: 0.0926 },
  concave_points_mean: { label: "Indentation Count",      unit: "count",  benignMed: 0.0257, normalMax: 0.0480 },
};

export async function exportBatchAsPdfZip(
  session: BatchSession,
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  const zip = new JSZip();
  const successRecords = session.records.filter((r) => r.status === "success");

  // 1. Generate summary PDF
  const summaryEntries: BatchSummaryEntry[] = successRecords.map((r, i) => ({
    index: i + 1,
    patientId: r.patientId,
    patientName: r.patientName,
    diseaseType: r.diseaseType,
    quantumPrediction: r.quantumPrediction || "",
    classicalPrediction: r.classicalPrediction || "",
    riskScore: r.quantumRiskScore || 0,
    riskTag: r.riskTag || "LOW_RISK",
    confidence: r.quantumConfidence || 0,
    consensusStatus: r.consensusStatus || "Concordant",
  }));

  const summaryPdf = generateBatchSummaryPdf(
    session.batchId,
    session.uploadedFileName,
    summaryEntries,
    {
      totalRecords: session.totalRecords,
      highRiskCount: session.highRiskCount,
      concordantCount: session.concordantCount,
      averageRiskScore: session.averageRiskScore,
      executionTimeMs: session.executionTimeMs,
    },
  );
  zip.file("00_Batch_Summary_Report.pdf", summaryPdf.output("blob"));

  // 2. Generate individual PDFs
  for (let i = 0; i < successRecords.length; i++) {
    const r = successRecords[i];
    onProgress?.(i + 1, successRecords.length);

    const biomarkers: BiomarkerEntry[] = Object.entries(r.inputData || {}).map(([key, val]) => {
      const meta = BIOMARKER_LABELS[key] || { label: key, unit: "", benignMed: 0, normalMax: 0 };
      return {
        key,
        label: meta.label,
        value: val as number,
        unit: meta.unit,
        benignMedian: meta.benignMed,
        normalMax: meta.normalMax,
      };
    });

    const mapAttrs = (arr: any[]) => arr.map((a: any) => ({
      featureName: a.featureName || a.feature_name || "",
      measuredValue: a.measuredValue || a.measured_value || 0,
      baselineValue: a.baselineValue || a.baseline_value || 0,
      impactPercentage: a.impactPercentage || a.impact_percentage || 0,
      direction: (a.direction || "protective") as "risk_elevating" | "protective",
      quantumImpact: a.quantumImpact || a.quantum_impact || "",
    }));

    const payload: ReportPayload = {
      patient: {
        patientName: r.patientName,
        patientId: r.patientId,
        patientAge: "N/A",
        patientGender: "Not Specified",
        diseaseType: r.diseaseType.includes("Cardiac") ? "cardiac_ecg" : "breast_cancer",
      },
      biomarkers,
      transfinite1: {
        engineName: "Transfinite-1",
        engineDescription: "8-Qubit ZZ Variational Quantum Classifier (Simulator)",
        modelType: "hybrid",
        predictionLabel: r.quantumPrediction || "Unknown",
        confidence: r.quantumConfidence || 0,
        riskScore: r.quantumRiskScore || 0,
        riskTier: r.riskTier || "",
        riskTag: r.riskTag || "LOW_RISK",
        clinicalAction: "Refer to clinical provider for follow-up.",
        latencyMs: r.latencyMs || 15,
        architecture: "8-Qubit ZZ Pauli Tensor Map",
        attributions: mapAttrs(r.attributions || []),
        qubits: 8,
        ansatz: "StronglyEntanglingLayers",
        circuitDepth: 36,
        cnotCount: 16,
        variationalParams: 48,
      },
      cx01: {
        engineName: "CX-01",
        engineDescription: "Classical SVM-RBF + XGBoost Ensemble",
        modelType: "classical",
        predictionLabel: r.classicalPrediction || "Unknown",
        confidence: r.classicalConfidence || 0,
        riskScore: r.classicalRiskScore || 0,
        riskTier: r.riskTier || "",
        riskTag: r.riskTag || "LOW_RISK",
        clinicalAction: "Refer to clinical provider for follow-up.",
        latencyMs: 2.5,
        architecture: "30-Feature Regularized Hyperplane",
        attributions: mapAttrs(r.attributions || []),
      },
      consensusStatus: (r.consensusStatus as "Concordant" | "Discordant") || "Concordant",
    };

    const blob = generateReportBlob(payload);
    const fileName = `${String(i + 1).padStart(4, "0")}_${r.patientId}_Report.pdf`;
    zip.file(fileName, blob);

    // Yield to event loop every 10 records to prevent UI freeze
    if (i % 10 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  // 3. Save ZIP
  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, `QuantumX_Batch_${session.batchId}_Reports.zip`);
}
