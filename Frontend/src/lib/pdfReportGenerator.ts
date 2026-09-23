/**
 * ====================================================================================================
 * QuantumX — Clinical PDF Report Generator
 * ====================================================================================================
 * Generates publication-grade multi-page clinical diagnostic PDF reports using jsPDF.
 *
 * Two primary report modes:
 *   1. CLASSICAL   — CX-01 (SVM-RBF + XGBoost) — No quantum terminology
 *   2. HYBRID      — Transfinite-1 (8-Qubit VQC Simulator) or Aleph-1 (IBM 127-Qubit QPU)
 *
 * Each report contains:
 *   Page 1: Header, Patient Info, Uploaded Data
 *   Page 2: Predictions, Risk Stratification, Model Identity
 *   Page 3: SHAP / Gate Explainability
 *   Page 4: QuantumX Agent Summary & Clinical Advice
 *   Page 5: Circuit / Technical Data & Model Comparison
 *   Page 6: Closing Message, Regulatory Disclaimer, Signature
 *
 * Model Signatures: Each report carries a unique deterministic signature hash.
 * ====================================================================================================
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ── Types ───────────────────────────────────────────────────────────────────────

export interface PatientReportData {
  patientName: string;
  patientId: string;
  patientAge: number | string;
  patientGender: string;
  diseaseType: string; // "breast_cancer" | "cardiac_ecg"
  biopsyCohort?: string;
}

export interface BiomarkerEntry {
  key: string;
  label: string;
  value: number;
  unit: string;
  benignMedian?: number;
  normalMax?: number;
}

export interface AttributionEntry {
  featureName: string;
  measuredValue: number;
  baselineValue: number;
  impactPercentage: number;
  direction: "risk_elevating" | "protective";
  quantumImpact: string;
}

export interface ModelReportData {
  modelType: "classical" | "hybrid";
  engineName: string; // "CX-01" | "Transfinite-1" | "Aleph-1"
  engineDescription: string;
  predictionLabel: string; // "Benign" | "Malignant" | "Normal" | "Myocardial Infarction" etc.
  confidence: number;
  riskScore: number;
  riskTier: string;
  riskTag: string;
  iacCategory?: string;
  romEstimate?: string;
  clinicalAction: string;
  morphologySummary?: string;
  latencyMs: number;
  architecture: string;
  attributions: AttributionEntry[];
  // Quantum-specific
  quantumExpectation?: number;
  qubits?: number;
  ansatz?: string;
  circuitDepth?: number;
  cnotCount?: number;
  variationalParams?: number;
  // Hardware-specific (Aleph-1)
  hardwareReceipt?: {
    qpuTarget: string;
    jobId: string;
    shots: number;
    readoutErrorMitigation: string;
    dynamicalDecoupling: string;
    physicalQubitsMapped: number[];
    status: string;
    qasmHash: string;
  };
}

export interface ComparisonData {
  cx01: {
    prediction: string;
    confidence: number;
    riskScore: number;
    latencyMs: number;
  };
  transfinite1: {
    prediction: string;
    confidence: number;
    riskScore: number;
    latencyMs: number;
  };
  consensusStatus: "Concordant" | "Discordant";
}

export interface ReportPayload {
  patient: PatientReportData;
  biomarkers: BiomarkerEntry[];
  primaryModel: ModelReportData;
  comparison?: ComparisonData;
  aiSummary?: string;
  clinicalAdvice?: string;
  // Cardiac-specific
  ecgLeadDetected?: string;
  ecgAnatomicalRegion?: string;
  gradcamBase64?: string;
}

// ── Signature Hash Generator ────────────────────────────────────────────────────

function generateSignatureHash(payload: ReportPayload): string {
  const seed = `${payload.patient.patientId}-${payload.primaryModel.engineName}-${Date.now()}-${payload.primaryModel.riskScore}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  const hexHash = Math.abs(hash).toString(16).padStart(8, "0").slice(0, 8);
  return `QX-SIG-${hexHash}`;
}

// ── Color Palette ───────────────────────────────────────────────────────────────

const COLORS = {
  primary: [15, 23, 42] as [number, number, number],         // slate-900
  secondary: [100, 116, 139] as [number, number, number],    // slate-500
  accent: [124, 58, 237] as [number, number, number],        // violet-600
  success: [22, 163, 74] as [number, number, number],        // green-600
  danger: [220, 38, 38] as [number, number, number],         // red-600
  warning: [217, 119, 6] as [number, number, number],        // amber-600
  border: [226, 232, 240] as [number, number, number],       // slate-200
  lightBg: [248, 250, 252] as [number, number, number],      // slate-50
  white: [255, 255, 255] as [number, number, number],
};

function getSeverityColor(riskTag: string): [number, number, number] {
  switch (riskTag) {
    case "LOW_RISK": return COLORS.success;
    case "MILD_SUSPICION": return COLORS.success;
    case "BORDERLINE": return COLORS.warning;
    case "HIGH_RISK": return COLORS.danger;
    case "CRITICAL_RISK": return COLORS.danger;
    default: return COLORS.secondary;
  }
}

// ── Closing Message Logic ───────────────────────────────────────────────────────

function getClosingMessage(riskTag: string, predictionLabel: string): string {
  const lower = predictionLabel.toLowerCase();

  if (riskTag === "LOW_RISK" || riskTag === "MILD_SUSPICION" || lower.includes("benign") || lower.includes("normal")) {
    return "Your screening results show reassuring patterns within healthy clinical parameters. Continue with your regular health checkups and maintain your wellness routine. Taking care of your health is the best investment — stay healthy and stay well.";
  }
  if (riskTag === "BORDERLINE" || lower.includes("atypical") || lower.includes("borderline") || lower.includes("indeterminate")) {
    return "Your results indicate some areas that warrant further clinical evaluation. This does not necessarily indicate a serious condition, but follow-up diagnostic tests are recommended to ensure completeness. Please schedule an appointment with your healthcare provider to discuss the next steps. Your proactive approach to health screening is commendable.";
  }
  // HIGH_RISK / CRITICAL_RISK / Malignant / MI
  return "We understand that receiving these results may be concerning. Please remember that early detection is one of the most powerful tools in modern medicine, and this screening is designed to give you the best possible head start. Consult with your healthcare provider for a thorough clinical evaluation and personalized treatment plan. You are not alone — wishing you strength, resilience, and a swift path to recovery.";
}

// ── Core PDF Generator ──────────────────────────────────────────────────────────

export function generateSingleReport(payload: ReportPayload): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  const signatureHash = generateSignatureHash(payload);
  const reportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  const isClassical = payload.primaryModel.modelType === "classical";
  const isHybrid = payload.primaryModel.modelType === "hybrid";
  const isAleph = payload.primaryModel.engineName === "Aleph-1";

  let yPos = 0;

  // ── Utility: Footer on Every Page ───────────────────────────────────────────
  function addFooter(pageNum: number) {
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.secondary);
    doc.text(
      `QuantumX Health Intelligence Platform — Report ${signatureHash} — Page ${pageNum}`,
      pageWidth / 2, pageHeight - 8, { align: "center" },
    );
    doc.setDrawColor(...COLORS.border);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
  }

  // ── Utility: Section Header ─────────────────────────────────────────────────
  function addSectionHeader(title: string, y: number): number {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.primary);
    doc.text(title, margin, y);
    doc.setDrawColor(...COLORS.accent);
    doc.setLineWidth(0.6);
    doc.line(margin, y + 1.5, margin + doc.getTextWidth(title), y + 1.5);
    return y + 8;
  }

  // ── Utility: Key-Value Row ──────────────────────────────────────────────────
  function addKeyValue(key: string, value: string, y: number, bold = false): number {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.secondary);
    doc.text(key, margin + 2, y);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...COLORS.primary);
    doc.text(String(value), margin + 58, y);
    return y + 5.5;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // PAGE 1: HEADER & PATIENT INFORMATION
  // ═══════════════════════════════════════════════════════════════════════════════

  // Header bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.white);
  doc.text("QuantumX", margin, 14);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Clinical Diagnostic Screening Report", margin, 21);
  // Right side — model identity
  doc.setFontSize(8);
  doc.text(
    isClassical ? "Classical Baseline Engine Report" : (isAleph ? "IBM Quantum Hardware Report" : "Hybrid Quantum Simulator Report"),
    pageWidth - margin, 14, { align: "right" },
  );
  doc.text(signatureHash, pageWidth - margin, 21, { align: "right" });

  yPos = 38;

  // Report Metadata
  doc.setFillColor(...COLORS.lightBg);
  doc.roundedRect(margin, yPos, contentWidth, 20, 2, 2, "F");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.secondary);
  doc.text(`Report ID: ${signatureHash}`, margin + 4, yPos + 6);
  doc.text(`Generated: ${reportDate}`, margin + 4, yPos + 12);
  doc.text(`Engine: ${payload.primaryModel.engineName} (${payload.primaryModel.engineDescription})`, margin + 4, yPos + 18);
  doc.text("Platform: QuantumX Health Intelligence v2.0", pageWidth - margin - 4, yPos + 6, { align: "right" });
  doc.text(`Disease Module: ${payload.patient.diseaseType === "cardiac_ecg" ? "Heart Attack & Cardiac ECG" : "Breast Cancer Screening"}`, pageWidth - margin - 4, yPos + 12, { align: "right" });

  yPos += 28;

  // Patient Information Section
  yPos = addSectionHeader("Patient Information & Clinical Intake", yPos);
  yPos = addKeyValue("Patient Name:", payload.patient.patientName || "Not Specified", yPos, true);
  yPos = addKeyValue("Patient ID:", payload.patient.patientId || "QX-001", yPos);
  yPos = addKeyValue("Age:", `${payload.patient.patientAge || "N/A"} years`, yPos);
  yPos = addKeyValue("Gender:", payload.patient.patientGender || "Not Specified", yPos);
  yPos = addKeyValue("Biopsy / Modality:", payload.patient.biopsyCohort || (payload.patient.diseaseType === "cardiac_ecg" ? "12-Lead Clinical ECG" : "Fine Needle Aspirate (WDBC)"), yPos);
  yPos = addKeyValue("Screening Date:", reportDate, yPos);

  yPos += 6;

  // Uploaded Biomarker Data Table
  if (payload.biomarkers.length > 0) {
    yPos = addSectionHeader("Submitted Cell Measurements", yPos);

    autoTable(doc, {
      startY: yPos,
      margin: { left: margin, right: margin },
      head: [["Biomarker", "Measured Value", "Unit", "Healthy Avg", "Normal Limit"]],
      body: payload.biomarkers.map((b) => [
        b.label,
        b.value.toFixed(4),
        b.unit,
        b.benignMedian !== undefined ? b.benignMedian.toFixed(4) : "—",
        b.normalMax !== undefined ? b.normalMax.toFixed(4) : "—",
      ]),
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontSize: 8,
        fontStyle: "bold",
        halign: "left",
      },
      bodyStyles: {
        fontSize: 8,
        textColor: COLORS.primary,
        cellPadding: 2.5,
      },
      alternateRowStyles: {
        fillColor: COLORS.lightBg,
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 42 },
        1: { halign: "right", cellWidth: 30 },
        2: { halign: "center", cellWidth: 16 },
        3: { halign: "right", cellWidth: 30 },
        4: { halign: "right", cellWidth: 30 },
      },
      theme: "grid",
    });

    yPos = (doc as any).lastAutoTable.finalY + 6;
  }

  addFooter(1);

  // ═══════════════════════════════════════════════════════════════════════════════
  // PAGE 2: PREDICTION & RISK STRATIFICATION
  // ═══════════════════════════════════════════════════════════════════════════════
  doc.addPage();
  yPos = 20;

  // Model Identity Banner
  const severityColor = getSeverityColor(payload.primaryModel.riskTag);
  doc.setFillColor(...severityColor);
  doc.roundedRect(margin, yPos, contentWidth, 12, 2, 2, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.white);
  const modelBannerText = isClassical
    ? "Classical Baseline Engine — CX-01 (SVM-RBF + XGBoost Ensemble)"
    : isAleph
      ? "IBM Quantum Hardware — Aleph-1 (127-Qubit Eagle r3 Superconducting QPU)"
      : "Hybrid Quantum Simulator — Transfinite-1 (8-Qubit ZZ Variational Circuit)";
  doc.text(modelBannerText, pageWidth / 2, yPos + 8, { align: "center" });

  yPos += 20;
  yPos = addSectionHeader("Diagnostic Assessment", yPos);

  // Primary Prediction
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...severityColor);
  doc.text(payload.primaryModel.predictionLabel.toUpperCase(), margin + 2, yPos + 2);
  yPos += 10;

  yPos = addKeyValue("Model Confidence:", `${payload.primaryModel.confidence.toFixed(1)}%`, yPos, true);
  yPos = addKeyValue("Continuous Risk Score:", `${payload.primaryModel.riskScore.toFixed(1)} / 100.0`, yPos, true);
  yPos = addKeyValue("Risk Category:", payload.primaryModel.riskTier, yPos, true);
  if (payload.primaryModel.iacCategory) {
    yPos = addKeyValue("IAC Yokohama Category:", payload.primaryModel.iacCategory, yPos);
  }
  if (payload.primaryModel.romEstimate) {
    yPos = addKeyValue("Risk of Malignancy (ROM):", payload.primaryModel.romEstimate, yPos);
  }
  yPos = addKeyValue("Inference Latency:", `${payload.primaryModel.latencyMs.toFixed(2)} ms`, yPos);
  yPos = addKeyValue("Model Architecture:", payload.primaryModel.architecture, yPos);
  yPos = addKeyValue("Model Signature:", signatureHash, yPos);

  yPos += 4;

  // Clinical Action
  yPos = addSectionHeader("Recommended Clinical Action", yPos);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.primary);
  const clinicalLines = doc.splitTextToSize(payload.primaryModel.clinicalAction || "Routine follow-up.", contentWidth - 4);
  doc.text(clinicalLines, margin + 2, yPos);
  yPos += clinicalLines.length * 4.5 + 4;

  // Morphology Summary
  if (payload.primaryModel.morphologySummary) {
    yPos = addSectionHeader("Cellular Morphology Summary", yPos);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.primary);
    const morphLines = doc.splitTextToSize(payload.primaryModel.morphologySummary, contentWidth - 4);
    doc.text(morphLines, margin + 2, yPos);
    yPos += morphLines.length * 4.5 + 4;
  }

  // Cardiac-specific ECG info
  if (payload.ecgLeadDetected) {
    yPos = addSectionHeader("ECG Lead Localization", yPos);
    yPos = addKeyValue("Triggered Lead:", payload.ecgLeadDetected, yPos, true);
    if (payload.ecgAnatomicalRegion) {
      yPos = addKeyValue("Anatomical Region:", payload.ecgAnatomicalRegion, yPos);
    }
  }

  addFooter(2);

  // ═══════════════════════════════════════════════════════════════════════════════
  // PAGE 3: EXPLAINABILITY (SHAP / GATE ATTRIBUTIONS)
  // ═══════════════════════════════════════════════════════════════════════════════
  doc.addPage();
  yPos = 20;

  const explainTitle = isClassical
    ? "Classical SHAP Feature Attribution Analysis"
    : "Quantum Gate Saliency & Feature Attribution Analysis";
  yPos = addSectionHeader(explainTitle, yPos);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondary);
  doc.text(
    isClassical
      ? "Directional feature importance computed via classical hyperplane perturbation analysis."
      : "Pauli tensor gate ablation saliency scores measuring each qubit's contribution to the variational wavefunction collapse.",
    margin + 2, yPos,
  );
  yPos += 8;

  if (payload.primaryModel.attributions.length > 0) {
    autoTable(doc, {
      startY: yPos,
      margin: { left: margin, right: margin },
      head: [["Feature", "Measured", "Baseline", "Impact %", "Direction"]],
      body: payload.primaryModel.attributions.map((a) => [
        a.featureName,
        a.measuredValue.toFixed(4),
        a.baselineValue.toFixed(4),
        `${a.impactPercentage.toFixed(1)}%`,
        a.direction === "risk_elevating" ? "⬆ Risk Elevating" : "⬇ Protective",
      ]),
      headStyles: {
        fillColor: isClassical ? [30, 58, 138] : COLORS.accent,
        textColor: COLORS.white,
        fontSize: 8,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 8,
        textColor: COLORS.primary,
        cellPadding: 2.5,
      },
      alternateRowStyles: {
        fillColor: COLORS.lightBg,
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 42 },
        1: { halign: "right", cellWidth: 26 },
        2: { halign: "right", cellWidth: 26 },
        3: { halign: "right", cellWidth: 22 },
        4: { halign: "center", cellWidth: 32 },
      },
      theme: "grid",
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;
  }

  // Top Risk / Protective factors
  const riskFactors = payload.primaryModel.attributions.filter((a) => a.direction === "risk_elevating").slice(0, 3);
  const protFactors = payload.primaryModel.attributions.filter((a) => a.direction === "protective").slice(0, 3);

  if (riskFactors.length > 0) {
    yPos = addSectionHeader("Top Risk-Elevating Factors", yPos);
    riskFactors.forEach((f, i) => {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.danger);
      doc.text(`${i + 1}. ${f.featureName} — ${f.quantumImpact} (measured: ${f.measuredValue.toFixed(4)})`, margin + 4, yPos);
      yPos += 5;
    });
    yPos += 4;
  }

  if (protFactors.length > 0) {
    yPos = addSectionHeader("Top Protective Factors", yPos);
    protFactors.forEach((f, i) => {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.success);
      doc.text(`${i + 1}. ${f.featureName} — ${f.quantumImpact} (measured: ${f.measuredValue.toFixed(4)})`, margin + 4, yPos);
      yPos += 5;
    });
  }

  addFooter(3);

  // ═══════════════════════════════════════════════════════════════════════════════
  // PAGE 4: QUANTUMX AGENT SUMMARY & CLINICAL ADVICE
  // ═══════════════════════════════════════════════════════════════════════════════
  doc.addPage();
  yPos = 20;

  yPos = addSectionHeader("QuantumX Clinical Intelligence Summary", yPos);

  if (payload.aiSummary) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.primary);
    const summaryLines = doc.splitTextToSize(payload.aiSummary, contentWidth - 8);
    doc.text(summaryLines, margin + 4, yPos);
    yPos += summaryLines.length * 4.2 + 8;
  } else {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...COLORS.secondary);
    doc.text("Automated clinical assessment based on verified database standards and morphometric analysis.", margin + 4, yPos);
    yPos += 10;
  }

  // Clinical Advice
  if (payload.clinicalAdvice) {
    yPos = addSectionHeader("Clinical Advice & Recommended Next Steps", yPos);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.primary);
    const adviceLines = doc.splitTextToSize(payload.clinicalAdvice, contentWidth - 8);
    doc.text(adviceLines, margin + 4, yPos);
    yPos += adviceLines.length * 4.2 + 8;
  }

  addFooter(4);

  // ═══════════════════════════════════════════════════════════════════════════════
  // PAGE 5: TECHNICAL DATA & MODEL COMPARISON
  // ═══════════════════════════════════════════════════════════════════════════════
  doc.addPage();
  yPos = 20;

  // Quantum Circuit Info (for hybrid/hardware)
  if (isHybrid) {
    yPos = addSectionHeader("Quantum Circuit Architecture", yPos);
    yPos = addKeyValue("Ansatz:", payload.primaryModel.ansatz || "StronglyEntanglingLayers", yPos);
    yPos = addKeyValue("Qubits:", `${payload.primaryModel.qubits || 8}`, yPos);
    yPos = addKeyValue("Circuit Depth:", `${payload.primaryModel.circuitDepth || 36}`, yPos);
    yPos = addKeyValue("CNOT Gate Count:", `${payload.primaryModel.cnotCount || 16}`, yPos);
    yPos = addKeyValue("Variational Parameters:", `${payload.primaryModel.variationalParams || 48}`, yPos);
    yPos = addKeyValue("Feature Map:", "ZZ Pauli Tensor Product Encoding", yPos);

    if (isAleph && payload.primaryModel.hardwareReceipt) {
      yPos += 4;
      yPos = addSectionHeader("IBM Quantum Hardware Receipt", yPos);
      const hr = payload.primaryModel.hardwareReceipt;
      yPos = addKeyValue("QPU Target:", hr.qpuTarget, yPos);
      yPos = addKeyValue("Job ID:", hr.jobId, yPos);
      yPos = addKeyValue("Measurement Shots:", `${hr.shots}`, yPos);
      yPos = addKeyValue("Readout Mitigation:", hr.readoutErrorMitigation, yPos);
      yPos = addKeyValue("Dynamical Decoupling:", hr.dynamicalDecoupling, yPos);
      yPos = addKeyValue("Physical Qubits:", `[${hr.physicalQubitsMapped.join(", ")}]`, yPos);
      yPos = addKeyValue("QASM Hash:", hr.qasmHash, yPos);
      yPos = addKeyValue("Status:", hr.status, yPos);
    }

    yPos += 6;
  }

  // Model Comparison Table
  if (payload.comparison) {
    yPos = addSectionHeader("Dual-Engine Model Comparison", yPos);
    const c = payload.comparison;

    autoTable(doc, {
      startY: yPos,
      margin: { left: margin, right: margin },
      head: [["Metric", "CX-01 (Classical)", "Transfinite-1 (Quantum)"]],
      body: [
        ["Prediction", c.cx01.prediction, c.transfinite1.prediction],
        ["Confidence", `${c.cx01.confidence.toFixed(1)}%`, `${c.transfinite1.confidence.toFixed(1)}%`],
        ["Risk Score", `${c.cx01.riskScore.toFixed(1)} / 100`, `${c.transfinite1.riskScore.toFixed(1)} / 100`],
        ["Inference Latency", `${c.cx01.latencyMs.toFixed(2)} ms`, `${c.transfinite1.latencyMs.toFixed(2)} ms`],
        ["Architecture", "SVM-RBF + XGBoost (30-dim)", "8-Qubit ZZ VQC (256-dim Hilbert)"],
        ["Consensus", c.consensusStatus, c.consensusStatus === "Concordant" ? "✓ Agreement" : "⚠ Divergence"],
      ],
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontSize: 8,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 8,
        textColor: COLORS.primary,
        cellPadding: 2.5,
      },
      alternateRowStyles: {
        fillColor: COLORS.lightBg,
      },
      theme: "grid",
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;
  }

  addFooter(5);

  // ═══════════════════════════════════════════════════════════════════════════════
  // PAGE 6: CLOSING MESSAGE & REGULATORY DISCLAIMER
  // ═══════════════════════════════════════════════════════════════════════════════
  doc.addPage();
  yPos = 20;

  // Closing Message
  yPos = addSectionHeader("Patient Message", yPos);
  const closingMsg = getClosingMessage(payload.primaryModel.riskTag, payload.primaryModel.predictionLabel);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.primary);
  const closingLines = doc.splitTextToSize(closingMsg, contentWidth - 8);
  doc.text(closingLines, margin + 4, yPos);
  yPos += closingLines.length * 5 + 10;

  // Regulatory Disclaimer
  doc.setFillColor(255, 245, 238); // warm amber-50
  doc.roundedRect(margin, yPos, contentWidth, 42, 2, 2, "F");
  doc.setDrawColor(...COLORS.warning);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, yPos, contentWidth, 42, 2, 2, "S");

  yPos += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.warning);
  doc.text("REGULATORY & CLINICAL DISCLAIMER", margin + 4, yPos);
  yPos += 5;

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.primary);
  const disclaimerText =
    "This screening report is generated by QuantumX, a research-grade clinical decision-support platform developed for SIH26139. " +
    "It does NOT constitute a formal clinical diagnosis, medical prescription, or treatment recommendation. " +
    "Binary cytopathological classification (Benign vs. Malignant) does NOT replace formal TNM disease staging (Stages 0–IV), " +
    "which requires histopathological tissue biopsy and surgical pathological evaluation. " +
    "All diagnostic decisions must be made by qualified healthcare professionals in accordance with established clinical protocols. " +
    "This platform is intended for research, educational, and decision-support purposes only.";
  const disclaimerLines = doc.splitTextToSize(disclaimerText, contentWidth - 10);
  doc.text(disclaimerLines, margin + 4, yPos);
  yPos += disclaimerLines.length * 3.8 + 10;

  // Report Verification
  yPos += 6;
  doc.setDrawColor(...COLORS.border);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 6;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondary);
  doc.text(`Report Signature: ${signatureHash}`, margin + 2, yPos);
  doc.text(`Generated: ${reportDate}`, pageWidth - margin - 2, yPos, { align: "right" });
  yPos += 5;
  doc.text("QuantumX Health Intelligence Platform — SIH26139 — Hybrid Quantum Machine Learning for Early Disease Detection", pageWidth / 2, yPos, { align: "center" });

  addFooter(6);

  return doc;
}

// ── Convenience: Download Single Report ─────────────────────────────────────────

export function downloadSingleReport(payload: ReportPayload): void {
  const doc = generateSingleReport(payload);
  const fileName = `QuantumX_Report_${payload.patient.patientId || "Patient"}_${payload.primaryModel.engineName}.pdf`;
  doc.save(fileName);
}

// ── Batch: Generate individual PDFs as Blob array ───────────────────────────────

export function generateReportBlob(payload: ReportPayload): Blob {
  const doc = generateSingleReport(payload);
  return doc.output("blob");
}

// ── Batch Summary PDF ───────────────────────────────────────────────────────────

export interface BatchSummaryEntry {
  index: number;
  patientId: string;
  patientName: string;
  diseaseType: string;
  quantumPrediction: string;
  classicalPrediction: string;
  riskScore: number;
  riskTag: string;
  confidence: number;
  consensusStatus: string;
}

export function generateBatchSummaryPdf(
  batchId: string,
  fileName: string,
  entries: BatchSummaryEntry[],
  stats: {
    totalRecords: number;
    highRiskCount: number;
    concordantCount: number;
    averageRiskScore: number;
    executionTimeMs: number;
  },
): jsPDF {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Header
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 22, "F");
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.white);
  doc.text("QuantumX — Batch Screening Summary Report", margin, 14);
  doc.setFontSize(9);
  doc.text(`Batch: ${batchId} | Source: ${fileName} | ${new Date().toLocaleDateString()}`, pageWidth - margin, 14, { align: "right" });

  let yPos = 30;

  // Stats
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text(`Total Records: ${stats.totalRecords}`, margin, yPos);
  doc.text(`High Risk: ${stats.highRiskCount}`, margin + 50, yPos);
  doc.text(`Concordant: ${stats.concordantCount} (${((stats.concordantCount / stats.totalRecords) * 100).toFixed(1)}%)`, margin + 100, yPos);
  doc.text(`Avg Risk Score: ${stats.averageRiskScore.toFixed(1)}`, margin + 170, yPos);
  doc.text(`Execution: ${(stats.executionTimeMs / 1000).toFixed(1)}s`, margin + 230, yPos);

  yPos += 8;

  // Table
  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    head: [["#", "Patient ID", "Name", "Disease", "Quantum", "Classical", "Risk Score", "Risk Level", "Conf %", "Consensus"]],
    body: entries.map((e) => [
      String(e.index),
      e.patientId,
      e.patientName,
      e.diseaseType,
      e.quantumPrediction,
      e.classicalPrediction,
      `${e.riskScore.toFixed(1)}`,
      e.riskTag,
      `${e.confidence.toFixed(1)}%`,
      e.consensusStatus,
    ]),
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontSize: 7,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 7,
      textColor: COLORS.primary,
      cellPadding: 1.8,
    },
    alternateRowStyles: {
      fillColor: COLORS.lightBg,
    },
    theme: "grid",
  });

  return doc;
}
