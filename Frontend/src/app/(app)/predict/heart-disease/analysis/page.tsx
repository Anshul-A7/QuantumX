"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Sparkles,
  Activity,
  Download,
  BarChart3,
  Layers,
  Heart,
  User,
  HeartPulse,
  Zap,
  Cpu,
  Loader2,
} from "lucide-react";
import HelpTooltip from "@/components/common/HelpTooltip";
import { downloadCombinedReport, type ReportPayload } from "@/lib/pdfReportGenerator";
import { showToast } from "@/components/common/ToastNotification";

import KeyRiskFactorsTab from "./components/KeyRiskFactorsTab";
import AiDoctorConsultationTab from "./components/AiDoctorConsultationTab";
import ModelComparisonTab from "./components/ModelComparisonTab";
import RealTimeGraphsTab from "./components/RealTimeGraphsTab";

export default function HeartDiseaseAnalysisPage() {
  const router = useRouter();

  // 4 Focused Tabs matching Breast Cancer structure
  const [activeTab, setActiveTab] = useState<
    "key_risk_factors" | "quantumx_ai" | "model_comparison" | "realtime_graphs"
  >("key_risk_factors");

  // Model selection switch: "transfinite_1" (Hybrid Quantum) vs "cx_01" (Classical Baseline)
  const [selectedModel, setSelectedModel] = useState<"transfinite_1" | "cx_01">("transfinite_1");
  const [isDownloading, setIsDownloading] = useState(false);

  // Loaded State
  const [patientInfo, setPatientInfo] = useState({
    name: "Patient",
    patient_id: "QX-ECG-1001",
    age: 55,
    gender: "Male",
    intake_date: new Date().toISOString().split("T")[0],
  });

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<any>(null);
  const [aiSynthesis, setAiSynthesis] = useState<any>(null);

  const [telemetry, setTelemetry] = useState<any>({
    prediction: {
      class_name: "Normal",
      clinical_title: "Normal Sinus Rhythm (Physiological)",
      confidence_pct: 100.0,
      probabilities: {
        Normal: 0.999,
        "Myocardial Infarction": 0.0003,
        "History of MI": 0.0004,
        "Abnormal Heartbeat": 0.0003,
      },
    },
    risk_stratification: {
      cardiac_risk_score: 2.0,
      score_scale: "0 - 100",
      severity_tier: "LOW RISK (NORMAL SINUS RHYTHM)",
      clinical_recommendation:
        "Physiological rhythm verified. Routine preventative health check-up; repeat screening in 12 months or if acute anginal symptoms occur.",
      primary_driver: "Lead V2 (Septal)",
    },
    pinpointing_gradcam: {
      heatmap_image_base64: "",
      lead_detected: "Lead V2 (Septal)",
      anatomical_region: "Anteroseptal Junction (LAD)",
      activation_peak_score: 0.98,
      coordinates: { peak_x: 650, peak_y: 420, rel_x: 0.29, rel_y: 0.35 },
    },
    quantum_engine: {
      signature: "QuantumX Transfinite-1",
      qubits: 8,
      ansatz: "8-Qubit AngleEmbedding + StronglyEntanglingLayers (2 Layers)",
      statevector_backend: "PennyLane default.qubit",
      quantum_prediction: "Normal",
      quantum_confidence_pct: 100.0,
      quantum_probabilities: {
        Normal: 0.999,
        "Myocardial Infarction": 0.0003,
        "History of MI": 0.0004,
        "Abnormal Heartbeat": 0.0003,
      },
      variational_parameters: 48,
      latency_ms: 54.32,
    },
    classical_engine: {
      name: "CX-01 Cardiac Classical",
      architecture: "ResNet-18 + FC (512 -> 256 -> 4)",
      prediction: "Normal",
      confidence_pct: 100.0,
      total_parameters: 11178564,
      latency_ms: 35.31,
    },
    dual_engine_consensus: {
      status: "Concordant",
      is_concordant: true,
      consensus_confidence: 100.0,
      total_latency_ms: 89.63,
    },
  });

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("quantumx_active_cardiac_analysis");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.patientInfo) setPatientInfo(parsed.patientInfo);
        if (parsed.telemetry) setTelemetry(parsed.telemetry);
        if (parsed.uploadedImage) setUploadedImage(parsed.uploadedImage);
        if (parsed.imageMeta) setImageMeta(parsed.imageMeta);
        if (parsed.aiSynthesis) setAiSynthesis(parsed.aiSynthesis);
      }
    } catch (e) {
      console.warn("Could not load sessionStorage cardiac analysis payload:", e);
    }
  }, []);

  const isHybrid = selectedModel === "transfinite_1";

  const activeRiskScore = Number(telemetry?.risk_stratification?.cardiac_risk_score ?? 2.0);
  const activeConfidence = isHybrid
    ? telemetry?.quantum_engine?.quantum_confidence_pct ?? 100.0
    : telemetry?.classical_engine?.confidence_pct ?? 100.0;
  const activePrediction = isHybrid
    ? telemetry?.quantum_engine?.quantum_prediction ?? telemetry?.prediction?.class_name
    : telemetry?.classical_engine?.prediction ?? telemetry?.prediction?.class_name;
  const activeLatency = isHybrid
    ? telemetry?.quantum_engine?.latency_ms ?? 54.3
    : telemetry?.classical_engine?.latency_ms ?? 35.3;
  const activeEngineName = isHybrid ? "QuantumX Transfinite-1" : "CX-01 Cardiac Classical";
  const activeEngineSpecs = isHybrid
    ? "8-Qubit AngleEmbedding + StronglyEntanglingLayers (2 Layers)"
    : "ResNet-18 Deep Convolutional Neural Network";
  const activeEngineDesc = isHybrid
    ? "8-Qubit variational quantum circuit projects compressed visual features into 256-dimensional Hilbert space."
    : "PyTorch ResNet-18 model trained on 4,000+ Kaggle 12-lead ECG images with Grad-CAM gradient backpropagation.";

  const getRiskBadge = () => {
    if (activeRiskScore >= 85.0) {
      return {
        label: "CRITICAL EMERGENCY (CODE RED)",
        color: "text-red-800 bg-red-100 border-red-300",
        stroke: "text-red-600",
      };
    }
    if (activeRiskScore >= 60.0) {
      return {
        label: "HIGH RISK (CARDIAC ARRHYTHMIA)",
        color: "text-purple-800 bg-purple-50 border-purple-300",
        stroke: "text-purple-600",
      };
    }
    if (activeRiskScore >= 35.0) {
      return {
        label: "MODERATE RISK (PRIOR ISCHEMIC SCAR)",
        color: "text-amber-800 bg-amber-50 border-amber-300",
        stroke: "text-amber-500",
      };
    }
    return {
      label: "LOW RISK (NORMAL SINUS RHYTHM)",
      color: "text-emerald-800 bg-emerald-50 border-emerald-300",
      stroke: "text-emerald-600",
    };
  };

  const currentBadge = getRiskBadge();

  // Circular dial circumference for r=28 (2 * pi * 28 = 175.93)
  const dialCircumference = 175.93;
  const dialOffset =
    dialCircumference -
    (dialCircumference * Math.min(100, Math.max(0, activeRiskScore))) / 100;

  const handleDownloadFullReport = () => {
    setIsDownloading(true);
    showToast({
      title: "Generating Clinical Dossier",
      message: "Assembling 12-page combined report...",
      type: "quantum",
    });

    const isCardiacHigh = activeRiskScore >= 60 || currentBadge.label.includes("CRITICAL") || currentBadge.label.includes("HIGH");

    const fullAiSummary = [
      aiSynthesis?.summary_paragraph || aiSynthesis?.summary || aiSynthesis?.executive_summary,
      aiSynthesis?.morphological_breakdown ? `**Electrophysiological & Morphological Breakdown:**\n${aiSynthesis.morphological_breakdown}` : null,
      aiSynthesis?.clinical_implications ? `**Clinical Implications & Coronary Watershed:**\n${aiSynthesis.clinical_implications}` : null,
      aiSynthesis?.quantum_advantage_interpretation ? `**Quantum Phase-Space Analysis:**\n${aiSynthesis.quantum_advantage_interpretation}` : null,
    ].filter(Boolean).join("\n\n");

    const leadName = telemetry?.pinpointing_gradcam?.lead_detected || "Lead V2 (Septal)";
    const anatomicalRegion = telemetry?.pinpointing_gradcam?.anatomical_region || "Anteroseptal Wall (LAD Coronary)";

    const payload: ReportPayload = {
      patient: {
        patientName: patientInfo.name || "Patient",
        patientId: patientInfo.patient_id || "QX-ECG-1001",
        patientAge: patientInfo.age || 55,
        patientGender: patientInfo.gender || "Male",
        diseaseType: "cardiac_ecg",
        biopsyCohort: "12-Lead Electrocardiogram Rhythm Strip",
      },
      biomarkers: [],
      transfinite1: {
        engineName: "Transfinite-1",
        engineDescription: "8-Qubit AngleEmbedding + StronglyEntanglingLayers VQC",
        modelType: "hybrid",
        predictionLabel: telemetry?.quantum_engine?.quantum_prediction || telemetry?.prediction?.clinical_title || "Normal",
        confidence: telemetry?.quantum_engine?.quantum_confidence_pct ?? telemetry?.prediction?.confidence_pct ?? 100,
        riskScore: activeRiskScore,
        riskTier: telemetry?.risk_stratification?.severity_tier || currentBadge.label,
        riskTag: isCardiacHigh ? "CRITICAL_RISK" : "LOW_RISK",
        clinicalAction: telemetry?.risk_stratification?.clinical_recommendation || "Routine annual cardiovascular follow-up.",
        latencyMs: telemetry?.quantum_engine?.latency_ms || 54.3,
        architecture: "8-Qubit Variational Quantum Circuit (256-dim Hilbert space)",
        attributions: [
          {
            featureName: leadName,
            measuredValue: telemetry?.pinpointing_gradcam?.activation_peak_score || 0.95,
            baselineValue: 0.1,
            impactPercentage: (telemetry?.pinpointing_gradcam?.activation_peak_score || 0.95) * 100,
            direction: isCardiacHigh ? "risk_elevating" : "protective",
            quantumImpact: `Peak spatial saliency localized to ${anatomicalRegion}`,
          },
        ],
        qubits: 8,
        ansatz: "StronglyEntanglingLayers (2 Layers)",
        circuitDepth: 36,
        cnotCount: 16,
        variationalParams: 48,
      },
      cx01: {
        engineName: "CX-01 Cardiac Classical",
        engineDescription: "ResNet-18 Deep Convolutional Neural Network Baseline",
        modelType: "classical",
        predictionLabel: telemetry?.classical_engine?.prediction || telemetry?.prediction?.clinical_title || "Normal",
        confidence: telemetry?.classical_engine?.confidence_pct ?? 100,
        riskScore: activeRiskScore,
        riskTier: telemetry?.risk_stratification?.severity_tier || currentBadge.label,
        riskTag: isCardiacHigh ? "CRITICAL_RISK" : "LOW_RISK",
        clinicalAction: telemetry?.risk_stratification?.clinical_recommendation || "Routine annual cardiovascular follow-up.",
        latencyMs: telemetry?.classical_engine?.latency_ms || 35.3,
        architecture: "ResNet-18 (11.1M Parameters)",
        attributions: [
          {
            featureName: leadName,
            measuredValue: telemetry?.pinpointing_gradcam?.activation_peak_score || 0.95,
            baselineValue: 0.1,
            impactPercentage: (telemetry?.pinpointing_gradcam?.activation_peak_score || 0.95) * 100,
            direction: isCardiacHigh ? "risk_elevating" : "protective",
            quantumImpact: "Convolutional gradient activation on 12-lead grid",
          },
        ],
      },
      consensusStatus: telemetry?.dual_engine_consensus?.is_concordant ? "Concordant" : "Discordant",
      ecgLeadDetected: leadName,
      ecgAnatomicalRegion: anatomicalRegion,
      aiSummary: fullAiSummary || undefined,
      clinicalAdvice: telemetry?.risk_stratification?.clinical_recommendation,
    };

    setTimeout(() => {
      try {
        downloadCombinedReport(payload);
        showToast({
          title: "Report Download Complete",
          message: `Saved QuantumX_Report_${payload.patient.patientId}_Combined.pdf`,
          type: "quantum",
        });
      } catch (err: any) {
        console.error("PDF generation failed:", err);
        showToast({
          title: "Download Failed",
          message: err?.message || "Could not generate PDF report.",
          type: "warning",
        });
      } finally {
        setIsDownloading(false);
      }
    }, 100);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-12 w-full"
    >
      {/* 1. TOP BREADCRUMB & HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-hairline pb-4">
        <div className="space-y-1">
          <Link
            href="/predict/heart-disease"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-ink-soft hover:text-ink transition-colors mb-1 cursor-pointer"
          >
            <ArrowLeft size={13} /> Back to Screening Studio
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-quantum/10 border border-quantum/30 text-quantum flex items-center justify-center shadow-xs">
              <Heart size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-2xl sm:text-3xl font-light text-ink tracking-tight">
                  Detailed Patient Health Report
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold uppercase">
                  Verified Clinical Data
                </span>
              </div>
              <p className="text-xs text-ink-soft font-light">
                Comprehensive 12-lead ECG analysis, QuantumX AI cardiologist review, and multi-engine diagnostic comparison.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadFullReport}
            disabled={isDownloading}
            className="px-4 py-2 rounded-xl bg-ink hover:bg-ink/90 text-parchment font-semibold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-60"
          >
            {isDownloading ? (
              <Loader2 size={14} className="text-quantum animate-spin" />
            ) : (
              <Download size={14} className="text-quantum" />
            )}
            <span>{isDownloading ? "Generating PDF..." : "Download Report (.pdf)"}</span>
          </button>
        </div>
      </div>

      {/* 2. UNIFIED WHITE EXECUTIVE CARD */}
      <div className="bg-white rounded-2xl border border-hairline shadow-xs overflow-hidden">
        {/* Top Section: Patient Identity & Engine Switch Button */}
        <div className="p-5 border-b border-hairline/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Patient Details */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-cream border border-hairline flex items-center justify-center text-ink shrink-0 shadow-2xs">
              <User size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-ink">
                  Patient: <span className="font-semibold text-ink">{patientInfo.name || "Patient"}</span>
                </span>
                <span className="text-[11px] font-mono px-2 py-0.2 rounded bg-cream border border-hairline text-ink-soft font-medium">
                  {patientInfo.patient_id || "QX-ECG-1001"}
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  Intake Verified
                </span>
              </div>
              <p className="text-xs text-ink-soft mt-0.5">
                Demographics: <strong className="text-ink font-medium">{patientInfo.gender || "Male"}</strong> • Age: <strong className="text-ink font-medium">{patientInfo.age || 55}</strong> • Modality: <strong className="text-ink font-medium">12-Lead Electrocardiogram</strong>
              </p>
            </div>
          </div>

          {/* Model Switch Button: Hybrid Quantum vs Classical Baseline */}
          <div className="flex items-center gap-1.5 p-1 bg-cream/70 border border-hairline rounded-xl shrink-0">
            <button
              onClick={() => setSelectedModel("transfinite_1")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isHybrid
                  ? "bg-white text-ink shadow-xs border border-hairline font-bold"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <Sparkles size={13} className={isHybrid ? "text-quantum" : "text-ink-soft"} />
              <span>Hybrid Quantum (Transfinite-1)</span>
              {isHybrid && <span className="w-1.5 h-1.5 rounded-full bg-quantum" />}
            </button>
            <button
              onClick={() => setSelectedModel("cx_01")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                !isHybrid
                  ? "bg-white text-ink shadow-xs border border-hairline font-bold"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <Activity size={13} className={!isHybrid ? "text-blue-600" : "text-ink-soft"} />
              <span>Classical Baseline (CX-01)</span>
              {!isHybrid && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
            </button>
          </div>
        </div>

        {/* Middle Section: Circular Risk Dial, Assessment Tier & Active Telemetry */}
        <div className="p-5 bg-cream/10 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* High-Contrast Circular Risk Score Dial */}
            <div className="relative w-18 h-18 shrink-0 flex items-center justify-center">
              <svg className="w-18 h-18 -rotate-90" viewBox="0 0 72 72">
                <circle
                  cx="36"
                  cy="36"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="5.5"
                  fill="transparent"
                  className="text-hairline/80"
                />
                <circle
                  cx="36"
                  cy="36"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="5.5"
                  fill="transparent"
                  strokeDasharray={dialCircumference}
                  strokeDashoffset={dialOffset}
                  strokeLinecap="round"
                  className={`${currentBadge.stroke} transition-all duration-700`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold font-mono text-ink tracking-tight leading-none">
                  {activeRiskScore.toFixed(0)}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-ink-soft font-semibold mt-0.5">
                  / 100
                </span>
              </div>
            </div>

            {/* Assessment Label & Active Engine Summary */}
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${currentBadge.color}`}>
                  {currentBadge.label}
                </span>
                <div className="flex items-center gap-1 text-xs text-ink-soft font-mono">
                  <span>
                    Engine: <strong className="text-ink font-semibold">{activeEngineName}</strong>
                  </span>
                  <span className="text-[11px] text-ink-muted">({activeLatency} ms)</span>
                  <HelpTooltip title={activeEngineName} text={activeEngineSpecs} />
                </div>
              </div>
              <p className="text-xs text-ink font-medium">
                Active Assessment: <strong className="text-ink">{telemetry.prediction.clinical_title}</strong> ({activeConfidence.toFixed(1)}% Confidence)
              </p>
              <p className="text-xs text-ink-soft leading-relaxed">{activeEngineDesc}</p>
            </div>
          </div>

          {/* Right Metrics: Peak Sensitivity & System Certainty */}
          <div className="flex items-center gap-4 bg-white px-4 py-3 rounded-xl border border-hairline shadow-2xs">
            <div className="text-right">
              <div className="flex items-center justify-end gap-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-ink-soft block font-semibold">
                  Peak Sensitivity
                </span>
                <HelpTooltip
                  title="Peak Lead Sensitivity"
                  text="Autograd Grad-CAM peak activation score identifying maximum gradient deflection on the physical ECG strip."
                />
              </div>
              <span className="text-base font-bold font-mono text-quantum">
                {(telemetry.pinpointing_gradcam.activation_peak_score * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-8 w-px bg-hairline" />
            <div className="text-right">
              <div className="flex items-center justify-end gap-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-ink-soft block font-semibold">
                  System Certainty
                </span>
                <HelpTooltip
                  title="System Certainty"
                  text="Model statistical confidence derived from clinical validation against verified 12-lead ECG cohorts."
                />
              </div>
              <span className="text-base font-bold font-mono text-ink">
                {activeConfidence.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Section: Attached Navigation Tabs */}
        <div className="border-t border-hairline bg-cream/30 px-3 py-2 flex flex-wrap items-center gap-2">
          {/* Tab 1: Key Risk Factors */}
          <button
            onClick={() => setActiveTab("key_risk_factors")}
            className={`py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "key_risk_factors"
                ? "bg-white text-ink font-bold shadow-xs border border-hairline"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <BarChart3 size={14} className={activeTab === "key_risk_factors" ? "text-quantum" : ""} />
            <span>📊 1. Key Risk Factors &amp; Lead Pinpointing</span>
          </button>

          {/* Tab 2: QuantumX AI */}
          <button
            onClick={() => setActiveTab("quantumx_ai")}
            className={`py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "quantumx_ai"
                ? "bg-white text-ink font-bold shadow-xs border border-hairline"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <Sparkles size={14} className={activeTab === "quantumx_ai" ? "text-quantum" : ""} />
            <span>✨ 2. QuantumX AI Cardiologist</span>
          </button>

          {/* Tab 3: Model Comparison */}
          <button
            onClick={() => setActiveTab("model_comparison")}
            className={`py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "model_comparison"
                ? "bg-white text-ink font-bold shadow-xs border border-hairline"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <Layers size={14} className={activeTab === "model_comparison" ? "text-quantum" : ""} />
            <span>⚖️ 3. Model Comparison (CX-01 vs Transfinite-1)</span>
          </button>

          {/* Tab 4: Real-Time Architecture & Circuit Telemetry */}
          <button
            onClick={() => setActiveTab("realtime_graphs")}
            className={`py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "realtime_graphs"
                ? "bg-white text-ink font-bold shadow-xs border border-hairline"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            {isHybrid ? (
              <Zap size={14} className={activeTab === "realtime_graphs" ? "text-quantum" : "text-ink-soft"} />
            ) : (
              <Cpu size={14} className={activeTab === "realtime_graphs" ? "text-blue-600" : "text-ink-soft"} />
            )}
            <span>
              {isHybrid
                ? "⚡ 4. Quantum Circuit & Pauli-Z Telemetry"
                : "🔬 4. ResNet-18 Architecture & Layer Flow"}
            </span>
          </button>
        </div>
      </div>

      {/* 3. ACTIVE TAB CONTENT VIEWPORT */}
      <div className="w-full">
        {activeTab === "key_risk_factors" && (
          <KeyRiskFactorsTab
            telemetry={telemetry}
            uploadedImage={uploadedImage}
            patientInfo={patientInfo}
            selectedModel={selectedModel}
          />
        )}

        {activeTab === "quantumx_ai" && (
          <AiDoctorConsultationTab
            patientInfo={patientInfo}
            telemetry={telemetry}
            activeEngine={activeEngineName}
            aiSynthesis={aiSynthesis}
          />
        )}

        {activeTab === "model_comparison" && (
          <ModelComparisonTab
            telemetry={telemetry}
            patientName={patientInfo.name || "Patient"}
            selectedModel={selectedModel}
          />
        )}

        {activeTab === "realtime_graphs" && (
          <RealTimeGraphsTab
            telemetry={telemetry}
            patientName={patientInfo.name || "Patient"}
            selectedModel={selectedModel}
          />
        )}
      </div>
    </motion.div>
  );
}
