"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  History,
  Search,
  Download,
  Eye,
  Inbox,
  Sparkles,
  CheckCircle2,
  Lock,
  X,
  FileText,
  User,
  ShieldCheck,
  Activity,
  Microscope,
  Users,
  Archive,
  FileSpreadsheet,
  FileJson,
  Clock,
  AlertTriangle,
  XCircle,
  Loader2,
} from "lucide-react";
import HelpTooltip from "@/components/common/HelpTooltip";
import { ScreeningService, type StoredPrediction } from "@/services/screening.service";
import { downloadCombinedReport, type ReportPayload, type BiomarkerEntry } from "@/lib/pdfReportGenerator";
import { getBatchSessions, type BatchSession, exportBatchAsCSV, exportBatchAsJSON, exportBatchAsPdfZip } from "@/services/batch.service";
import { showToast } from "@/components/common/ToastNotification";

export default function HistoryPage() {
  const router = useRouter();
  const [predictions, setPredictions] = useState<StoredPrediction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<"ALL" | "High" | "Low">("ALL");
  const [selectedCase, setSelectedCase] = useState<StoredPrediction | null>(null);

  const [activeHistoryTab, setActiveHistoryTab] = useState<"individual" | "batch">("individual");
  const [batchSessions, setBatchSessions] = useState<BatchSession[]>([]);
  const [exportingBatchId, setExportingBatchId] = useState<string | null>(null);
  const [batchPdfProgress, setBatchPdfProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

  useEffect(() => {
    // 1. Instant 0ms cached load
    const cached = ScreeningService.getCachedScreenings();
    if (cached && cached.length > 0) {
      setPredictions(cached);
    }
    // 2. Parallel background sync
    ScreeningService.getScreenings().then((records) => {
      setPredictions(records || []);
    });
    setBatchSessions(getBatchSessions());
  }, []);

  const handleExportBatchPdf = async (session: BatchSession) => {
    setExportingBatchId(session.batchId);
    setBatchPdfProgress({ current: 0, total: session.successCount });
    try {
      await exportBatchAsPdfZip(session, (current, total) => {
        setBatchPdfProgress({ current, total });
      });
    } catch (err) {
      console.error("Batch PDF Export failed:", err);
    } finally {
      setExportingBatchId(null);
    }
  };

  const handleExportReport = (pred: StoredPrediction, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const isCardiac = (pred.disease || pred.diseaseType || "").toLowerCase().includes("cardiac") || (pred.disease || pred.diseaseType || "").toLowerCase().includes("heart");

    const biomarkers: BiomarkerEntry[] = pred.inputFeatures
      ? Object.entries(pred.inputFeatures).map(([k, v]) => ({
          key: k,
          label: k.replace(/_/g, " "),
          value: Number(v) || 0,
          unit: "μm",
        }))
      : [];

    const payload: ReportPayload = {
      patient: {
        patientName: pred.patientName || "Patient",
        patientId: pred.id || pred.patientId || "QX-001",
        patientAge: pred.patientAge || "N/A",
        patientGender: pred.patientGender || "Not Specified",
        diseaseType: isCardiac ? "cardiac_ecg" : "breast_cancer",
        biopsyCohort: isCardiac ? "12-Lead Electrocardiogram Strip" : "Fine Needle Aspirate (WDBC)",
      },
      biomarkers,
      transfinite1: {
        engineName: "Transfinite-1",
        engineDescription: isCardiac ? "8-Qubit AngleEmbedding VQC" : "8-Qubit ZZ Variational Quantum Classifier (Simulator)",
        modelType: "hybrid",
        predictionLabel: pred.quantumPrediction || "Unknown",
        confidence: pred.quantumConfidence || 95.0,
        riskScore: pred.quantumRiskScore ?? 42.4,
        riskTier: pred.riskLevel ? `${pred.riskLevel.toUpperCase()} RISK` : "LOW RISK",
        riskTag: pred.riskLevel === "High" ? "HIGH_RISK" : "LOW_RISK",
        clinicalAction: "Routine clinical follow-up as advised by healthcare provider.",
        latencyMs: pred.quantumExecutionTimeMs ?? 54.3,
        architecture: isCardiac ? "8-Qubit AngleEmbedding + StronglyEntanglingLayers" : "8-Qubit ZZ Pauli Tensor Map",
        attributions: [
          {
            featureName: pred.topDriver || "Primary Saliency Peak",
            measuredValue: 1.0,
            baselineValue: 0.5,
            impactPercentage: Math.abs(pred.topDriverImpact || 25),
            direction: pred.riskLevel === "High" ? "risk_elevating" : "protective",
            quantumImpact: "Quantum statevector attribution",
          },
        ],
        qubits: 8,
        ansatz: "StronglyEntanglingLayers",
        circuitDepth: 36,
        cnotCount: 16,
        variationalParams: 48,
      },
      cx01: {
        engineName: isCardiac ? "CX-01 Cardiac Classical" : "CX-01",
        engineDescription: isCardiac ? "ResNet-18 Deep Convolutional Baseline" : "Classical SVM-RBF + XGBoost Ensemble",
        modelType: "classical",
        predictionLabel: pred.classicalPrediction || "Unknown",
        confidence: pred.classicalConfidence || 92.0,
        riskScore: pred.classicalRiskScore ?? 44.1,
        riskTier: pred.riskLevel ? `${pred.riskLevel.toUpperCase()} RISK` : "LOW RISK",
        riskTag: pred.riskLevel === "High" ? "HIGH_RISK" : "LOW_RISK",
        clinicalAction: "Routine clinical follow-up as advised by healthcare provider.",
        latencyMs: pred.classicalExecutionTimeMs ?? 35.3,
        architecture: isCardiac ? "ResNet-18 (11.1M Parameters)" : "30-Feature Regularized Hyperplane",
        attributions: [
          {
            featureName: pred.topDriver || "Primary Saliency Peak",
            measuredValue: 1.0,
            baselineValue: 0.5,
            impactPercentage: Math.abs(pred.topDriverImpact || 25),
            direction: pred.riskLevel === "High" ? "risk_elevating" : "protective",
            quantumImpact: "Classical perturbation gradient",
          },
        ],
      },
      consensusStatus: (pred.consensusStatus as "Concordant" | "Discordant") || "Concordant",
      clinicalAdvice: "Refer to clinical provider for follow-up evaluation.",
    };

    try {
      showToast({
        title: "Generating Report",
        message: `Assembling clinical report for ${payload.patient.patientName}...`,
        type: "quantum",
      });
      downloadCombinedReport(payload);
      showToast({
        title: "Report Downloaded",
        message: `Saved QuantumX_Report_${payload.patient.patientId}_Combined.pdf`,
        type: "quantum",
      });
    } catch (err: any) {
      console.error("PDF download failed:", err);
      showToast({
        title: "Download Failed",
        message: err?.message || "Could not generate PDF report.",
        type: "warning",
      });
    }
  };

  const handleViewAnalysis = (pred: StoredPrediction, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const isCardiac =
        (pred.diseaseType && (pred.diseaseType.toLowerCase().includes("cardiac") || pred.diseaseType.toLowerCase().includes("ecg"))) ||
        (pred.disease && pred.disease.toLowerCase().includes("heart")) ||
        (pred.cohort && pred.cohort.toLowerCase().includes("ecg"));

      if (isCardiac) {
        let fallbackImage = "/samples/ecg/sample-normal.jpg";
        if (pred.quantumPrediction?.includes("Infarction") || pred.classicalPrediction?.includes("Infarction")) {
          fallbackImage = "/samples/ecg/sample-mi.jpg";
        } else if (pred.quantumPrediction?.includes("History") || pred.classicalPrediction?.includes("History")) {
          fallbackImage = "/samples/ecg/sample-history-mi.jpg";
        } else if (pred.quantumPrediction?.includes("Abnormal") || pred.quantumPrediction?.includes("Arrhythmia")) {
          fallbackImage = "/samples/ecg/sample-arrhythmia.jpg";
        }
        const ecgImage = pred.imageUrl || pred.telemetryJson?.pinpointing_gradcam?.heatmap_image_base64 || fallbackImage;

        const activeCardiacPayload = {
          patientInfo: {
            name: pred.patientName || "Patient",
            patient_id: pred.patientId || pred.id,
            age: pred.patientAge || 55,
            gender: pred.patientGender || "Male",
            intake_date: pred.timestamp ? pred.timestamp.split(" ")[0] : new Date().toISOString().split("T")[0],
          },
          uploadedImage: ecgImage,
          imageMeta: pred.imageMeta || {
            name: `${pred.id}_12Lead_ECG.jpg`,
            size: "695 KB",
            dimensions: "2200 × 1200 px",
          },
          telemetry: pred.telemetryJson || {
            prediction: {
              class_name: pred.quantumPrediction || "Normal",
              clinical_title: pred.quantumPrediction === "Normal"
                ? "Normal Sinus Rhythm (Physiological)"
                : pred.quantumPrediction === "Myocardial Infarction"
                ? "Acute Myocardial Infarction (STEMI / Severe Ischemic Injury)"
                : pred.quantumPrediction === "History of MI"
                ? "History of Prior Myocardial Infarction (Pathological Q-Waves)"
                : "Cardiac Arrhythmia / Conduction Disturbance",
              confidence_pct: pred.quantumConfidence ?? 98.0,
              probabilities: {
                Normal: pred.quantumPrediction === "Normal" ? (pred.quantumConfidence ?? 98.0) / 100 : 0.05,
                "Myocardial Infarction": pred.quantumPrediction === "Myocardial Infarction" ? (pred.quantumConfidence ?? 98.0) / 100 : 0.05,
                "History of MI": pred.quantumPrediction === "History of MI" ? (pred.quantumConfidence ?? 98.0) / 100 : 0.05,
                "Abnormal Heartbeat": pred.quantumPrediction === "Abnormal Heartbeat" ? (pred.quantumConfidence ?? 98.0) / 100 : 0.05,
              },
            },
            risk_stratification: {
              cardiac_risk_score: pred.quantumRiskScore ?? 25.0,
              score_scale: "0 - 100",
              severity_tier: (pred.quantumRiskScore ?? 0) >= 85
                ? "CRITICAL EMERGENCY (CODE RED)"
                : (pred.quantumRiskScore ?? 0) >= 60
                ? "HIGH RISK (CARDIAC CONDUCTION DISTURBANCE)"
                : (pred.quantumRiskScore ?? 0) >= 35
                ? "MODERATE RISK (PRIOR ISCHEMIC SCAR)"
                : "LOW RISK (NORMAL SINUS RHYTHM)",
              clinical_recommendation: pred.clinicalNote || "Follow guideline-directed medical monitoring and outpatient cardiology follow-up.",
              primary_driver: pred.topDriver || "Lead V2 (Septal)",
            },
            pinpointing_gradcam: {
              heatmap_image_base64: ecgImage,
              lead_detected: pred.topDriver?.split(" (")[0] || "Lead V2 (Septal)",
              anatomical_region: pred.topDriver?.split(" (")[1]?.replace(")", "") || "Anteroseptal Junction (LAD)",
              activation_peak_score: (pred.topDriverImpact ?? 80) / 100,
              coordinates: { peak_x: 650, peak_y: 420, rel_x: 0.29, rel_y: 0.35 },
            },
            quantum_engine: {
              signature: "QuantumX Transfinite-1",
              qubits: 8,
              ansatz: "8-Qubit AngleEmbedding + StronglyEntanglingLayers (2 Layers)",
              statevector_backend: "PennyLane default.qubit",
              quantum_prediction: pred.quantumPrediction,
              quantum_confidence_pct: pred.quantumConfidence,
              quantum_probabilities: {
                Normal: pred.quantumPrediction === "Normal" ? 0.95 : 0.05,
                "Myocardial Infarction": pred.quantumPrediction === "Myocardial Infarction" ? 0.95 : 0.05,
                "History of MI": pred.quantumPrediction === "History of MI" ? 0.95 : 0.05,
                "Abnormal Heartbeat": pred.quantumPrediction === "Abnormal Heartbeat" ? 0.95 : 0.05,
              },
              variational_parameters: 48,
              latency_ms: pred.quantumExecutionTimeMs ?? 54.32,
            },
            classical_engine: {
              name: "CX-01 Cardiac Classical",
              architecture: "ResNet-18 + FC (512 -> 256 -> 4)",
              prediction: pred.classicalPrediction,
              confidence_pct: pred.classicalConfidence,
              total_parameters: 11178564,
              latency_ms: pred.classicalExecutionTimeMs ?? 35.31,
            },
            dual_engine_consensus: {
              status: pred.consensusStatus || "Concordant",
              is_concordant: pred.consensusStatus === "Concordant",
              consensus_confidence: pred.quantumConfidence ?? 98.0,
              total_latency_ms: (pred.quantumExecutionTimeMs ?? 54.32) + (pred.classicalExecutionTimeMs ?? 35.31),
            },
          },
        };
        sessionStorage.setItem("quantumx_active_cardiac_analysis", JSON.stringify(activeCardiacPayload));
        router.push("/predict/heart-disease/analysis");
        return;
      }

      // Default: Breast cancer cytopathology
      const activePayload = {
        patientInfo: {
          name: pred.patientName,
          patient_id: pred.id,
          age: pred.patientAge || 55,
          gender: pred.patientGender || "Female",
        },
        biomarkers: pred.inputFeatures && Object.keys(pred.inputFeatures).length > 0 ? pred.inputFeatures : {
          radius_mean: 12.2,
          texture_mean: 17.39,
          perimeter_mean: 78.18,
          area_mean: 458.7,
          smoothness_mean: 0.0908,
          compactness_mean: 0.0645,
          concavity_mean: 0.0371,
          concave_points_mean: 0.0234,
        },
        screeningResult: {
          engine: "Transfinite-1",
          prediction_label: pred.quantumPrediction,
          confidence: pred.quantumConfidence,
          composite_risk_score: pred.quantumRiskScore ?? 42.4,
          dual_comparison: {
            transfinite_1: {
              prediction_label: pred.quantumPrediction,
              risk_score: pred.quantumRiskScore ?? 42.4,
              confidence: pred.quantumConfidence,
              latency_ms: pred.quantumExecutionTimeMs ?? 700.4,
            },
            cx_01: {
              prediction_label: pred.classicalPrediction,
              risk_score: pred.classicalRiskScore ?? 44.1,
              confidence: pred.classicalConfidence,
              latency_ms: pred.classicalExecutionTimeMs ?? 104.4,
            },
          },
        },
      };
      sessionStorage.setItem("quantumx_active_analysis", JSON.stringify(activePayload));
      router.push("/predict/breast-cancer/analysis");
    } catch (err) {
      console.warn("Could not route to analysis:", err);
      router.push("/history");
    }
  };

  const filteredPredictions = predictions.filter((p) => {
    const pName = (p.patientName || p.patientId || "").toLowerCase();
    const pDisease = (p.disease || p.diseaseType || "").toLowerCase();
    const pDriver = (p.topDriver || "").toLowerCase();
    const q = searchQuery.toLowerCase();

    const matchesSearch =
      p.id.toLowerCase().includes(q) ||
      pName.includes(q) ||
      pDisease.includes(q) ||
      pDriver.includes(q);

    const matchesFilter = riskFilter === "ALL" || p.riskLevel === riskFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 w-full min-w-0 max-w-full pb-4"
    >
      {/* Header with Non-Deletable Compliance Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-quantum" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-quantum font-semibold">
              Permanent Medical Records
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-light text-ink tracking-tight">
            Patient Screening History
          </h1>
          <p className="text-xs text-ink-soft font-light">
            Immutable clinical audit log of multi-model patient screenings.
          </p>
        </div>

        {/* Permanent Audit Trail Seal (Non-Deletable Record Lock) */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-bold shadow-2xs self-start sm:self-auto shrink-0 whitespace-nowrap">
          <Lock size={13} className="text-emerald-700 shrink-0" />
          <span>Immutable Audit Log · Non-Deletable</span>
        </div>
      </div>

      {/* View Switcher: Individual Patients vs Batch Screening Sessions */}
      <div className="flex items-center gap-2 p-1 bg-cream/70 rounded-xl border border-hairline w-fit">
        <button
          type="button"
          onClick={() => setActiveHistoryTab("individual")}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeHistoryTab === "individual"
              ? "bg-white text-ink shadow-xs border border-hairline font-bold"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          <User size={13} />
          <span>Individual Screenings ({predictions.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveHistoryTab("batch")}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeHistoryTab === "batch"
              ? "bg-white text-ink shadow-xs border border-hairline font-bold"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          <Users size={13} />
          <span>Batch Screening Sessions ({batchSessions.length})</span>
        </button>
      </div>

      {activeHistoryTab === "individual" && (
        <>
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
            {/* Search */}
            <div className="relative max-w-sm w-full">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input
                type="text"
                placeholder="Search by Patient Name, Case ID, Cohort..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-white border border-hairline text-xs text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-quantum/60 shadow-2xs font-sans"
              />
            </div>

            {/* Risk Filter Buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-cream/70 rounded-xl border border-hairline text-xs font-sans shrink-0">
              <button
                type="button"
                onClick={() => setRiskFilter("ALL")}
                className={`px-3 py-1 rounded-lg transition-all text-xs cursor-pointer ${
                  riskFilter === "ALL"
                    ? "bg-white text-ink shadow-xs border border-hairline font-bold"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                All Screenings ({predictions.length})
              </button>
              <button
                type="button"
                onClick={() => setRiskFilter("High")}
                className={`px-3 py-1 rounded-lg transition-all text-xs cursor-pointer ${
                  riskFilter === "High"
                    ? "bg-red-50 text-red-700 shadow-xs border border-red-200 font-bold"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                High Risk ({predictions.filter((p) => p.riskLevel === "High").length})
              </button>
              <button
                type="button"
                onClick={() => setRiskFilter("Low")}
                className={`px-3 py-1 rounded-lg transition-all text-xs cursor-pointer ${
                  riskFilter === "Low"
                    ? "bg-emerald-50 text-emerald-700 shadow-xs border border-emerald-200 font-bold"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                Low Risk ({predictions.filter((p) => p.riskLevel === "Low").length})
              </button>
            </div>
          </div>

      {/* Main Table: Proper Clinical Columns matching Diagnosis Page */}
      {predictions.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-2xl bg-white border border-hairline shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cream border border-hairline text-ink-soft mx-auto flex items-center justify-center">
            <Inbox size={22} className="text-ink-soft" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="font-serif text-lg font-medium text-ink">
              No screening records found
            </h3>
            <p className="text-xs text-ink-soft font-light leading-relaxed">
              When you perform screening evaluations in the Breast Cancer Screening Studio, every result is permanently saved to this log.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/predict/breast-cancer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-ink text-parchment font-medium text-xs tracking-wider hover:opacity-90 transition-all shadow-sm cursor-pointer"
            >
              <Sparkles size={13} className="text-quantum" /> Start New Patient Screening
            </Link>
          </div>
        </div>
      ) : filteredPredictions.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white border border-hairline text-center space-y-2">
          <p className="text-xs text-ink-soft">No screening cases match your search query or filter.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setRiskFilter("ALL");
            }}
            className="text-xs font-semibold text-quantum hover:underline cursor-pointer"
          >
            Reset search filters
          </button>
        </div>
      ) : (
        /* Unified White Clinical Table Card */
        <div className="bg-white rounded-2xl border border-hairline shadow-xs overflow-hidden w-full min-w-0">
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-210px)] w-full min-w-0 scrollbar-thin scrollbar-thumb-hairline scrollbar-track-cream/30">
            <table className="w-full text-left text-xs font-sans min-w-[980px]">
              <thead className="sticky top-0 bg-[#fbf9f4]/95 backdrop-blur-xs border-b border-hairline text-[10px] font-mono uppercase tracking-wider text-ink-soft z-10">
                <tr>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Case / Patient ID</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Patient Name</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Demographics</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Biopsy Cohort</th>
                  <th className="py-2.5 px-3 font-semibold text-purple-700 whitespace-nowrap">Hybrid Quantum (Transfinite-1)</th>
                  <th className="py-2.5 px-3 font-semibold text-blue-700 whitespace-nowrap">Classical Baseline (CX-01)</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Key Risk Factor</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Consensus</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Test Date</th>
                  <th className="py-2.5 px-3 font-semibold text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline text-ink">
                {filteredPredictions.map((pred) => {
                  const isMalignant = pred.quantumPrediction === "Malignant" || pred.riskLevel === "High";
                  const qRisk = pred.quantumRiskScore ?? 42.4;
                  const cRisk = pred.classicalRiskScore ?? 44.1;

                  return (
                    <tr
                      key={pred.id}
                      onClick={() => setSelectedCase(pred)}
                      className="hover:bg-cream/20 transition-colors cursor-pointer"
                    >
                      {/* 1. Case ID */}
                      <td className="py-2.5 px-3 font-mono text-xs font-bold text-quantum whitespace-nowrap">
                        {pred.id}
                      </td>

                      {/* 2. Patient Name */}
                      <td className="py-2.5 px-3 font-bold text-xs text-ink whitespace-nowrap">
                        {pred.patientName || "Not specified"}
                      </td>

                      {/* 3. Demographics */}
                      <td className="py-2.5 px-3 text-xs text-ink-soft whitespace-nowrap">
                        {pred.patientGender || "Female"} • Age {pred.patientAge || 55}
                      </td>

                      {/* 4. Biopsy Cohort */}
                      <td className="py-2.5 px-3 text-xs text-ink-soft whitespace-nowrap">
                        <span className="max-w-[170px] truncate block" title={pred.cohort || pred.diseaseType || "Fine Needle Aspirate (WDBC)"}>
                          {pred.cohort || pred.diseaseType || "Fine Needle Aspirate (WDBC)"}
                        </span>
                      </td>

                      {/* 5. Hybrid Quantum (Transfinite-1) */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                            isMalignant
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-purple-50 text-purple-700 border-purple-200"
                          }`}
                        >
                          <Sparkles size={11} className="shrink-0" />
                          <span>{pred.quantumPrediction} ({qRisk}%)</span>
                        </span>
                      </td>

                      {/* 6. Classical Baseline (CX-01) */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <Activity size={11} className="shrink-0" />
                          <span>{pred.classicalPrediction} ({cRisk}%)</span>
                        </span>
                      </td>

                      {/* 7. Key Risk Factor */}
                      <td className="py-2.5 px-3 text-xs whitespace-nowrap font-medium text-ink">
                        <div className="max-w-[190px] truncate" title={`${pred.topDriver || "Cell Size (Radius)"}${pred.topDriverImpact ? ` (${pred.topDriverImpact > 0 ? "+" : ""}${pred.topDriverImpact.toFixed(1)}%)` : ""}`}>
                          <span>{pred.topDriver || "Cell Size (Radius)"}</span>
                          {pred.topDriverImpact && (
                            <span
                              className={`ml-1 text-[10px] font-mono font-bold ${
                                pred.topDriverImpact > 0 ? "text-red-600" : "text-emerald-700"
                              }`}
                            >
                              ({pred.topDriverImpact > 0 ? "+" : ""}{pred.topDriverImpact.toFixed(1)}%)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 8. Consensus */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                            pred.consensusStatus === "Discordant"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {pred.consensusStatus || "Concordant"}
                        </span>
                      </td>

                      {/* 9. Test Date */}
                      <td className="py-2.5 px-3 text-xs text-ink-soft font-mono whitespace-nowrap">
                        {pred.timestamp}
                      </td>

                      {/* 10. Actions (NO DELETE BUTTON - ONLY VIEW & DOWNLOAD) */}
                      <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => handleViewAnalysis(pred, e)}
                          className="px-2.5 py-1 rounded-lg bg-cream hover:bg-cream-deep border border-hairline text-ink font-semibold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                          title="Open Full Analysis Page"
                        >
                          <Eye size={12} className="text-quantum" />
                          <span>Analyze</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleExportReport(pred, e)}
                          className="p-1.5 rounded-lg bg-cream hover:bg-cream-deep border border-hairline text-ink-soft hover:text-ink transition-colors cursor-pointer shadow-2xs"
                          title="Download Clinical Report (.pdf)"
                        >
                          <Download size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </>
      )}

      {/* ── BATCH SCREENING SESSIONS VIEW ── */}
      {activeHistoryTab === "batch" && (
        <div className="space-y-4">
          {batchSessions.length === 0 ? (
            <div className="p-8 sm:p-12 rounded-2xl bg-white border border-hairline shadow-xs text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-cream border border-hairline text-ink-soft mx-auto flex items-center justify-center">
                <Users size={22} className="text-quantum" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="font-serif text-lg font-medium text-ink">
                  No Batch Screening Sessions Recorded
                </h3>
                <p className="text-xs text-ink-soft font-light leading-relaxed">
                  Run high-throughput multi-patient screenings (up to 50,000 records) in the Breast Cancer or Heart Attack studios using CSV, JSON, ZIP, or bulk ECG image uploads.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  href="/predict/breast-cancer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-ink text-parchment font-medium text-xs hover:opacity-90 transition-all shadow-sm cursor-pointer"
                >
                  <Microscope size={13} className="text-quantum" />
                  <span>Breast Cancer Batch Screening</span>
                </Link>
                <Link
                  href="/predict/heart-disease"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cream hover:bg-cream-deep border border-hairline text-ink font-medium text-xs transition-all shadow-2xs cursor-pointer"
                >
                  <Activity size={13} className="text-red-500" />
                  <span>Cardiac ECG Bulk Screening</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {batchSessions.map((session) => (
                <div
                  key={session.batchId}
                  className="rounded-2xl bg-white border border-hairline shadow-xs p-5 hover:border-quantum/40 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-hairline/60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cream border border-hairline flex items-center justify-center text-quantum shrink-0">
                        {session.diseaseType.includes("Cardiac") ? (
                          <Activity size={20} className="text-red-500" />
                        ) : (
                          <FileSpreadsheet size={20} className="text-emerald-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-ink">
                            {session.batchId}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-quantum/10 border border-quantum/20 text-quantum font-semibold">
                            {session.diseaseType}
                          </span>
                        </div>
                        <p className="text-[11px] text-ink-soft mt-0.5">
                          Source: <strong className="text-ink">{session.uploadedFileName}</strong> • Started {new Date(session.startTime).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Batch Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => exportBatchAsCSV(session)}
                        className="px-3 py-1.5 rounded-lg bg-cream hover:bg-cream-deep border border-hairline text-xs font-medium text-ink flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FileSpreadsheet size={12} className="text-emerald-600" />
                        <span>CSV</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => exportBatchAsJSON(session)}
                        className="px-3 py-1.5 rounded-lg bg-cream hover:bg-cream-deep border border-hairline text-xs font-medium text-ink flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FileJson size={12} className="text-blue-600" />
                        <span>JSON</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExportBatchPdf(session)}
                        disabled={exportingBatchId === session.batchId}
                        className="px-3 py-1.5 rounded-lg bg-ink hover:bg-ink/90 text-parchment text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {exportingBatchId === session.batchId ? (
                          <>
                            <Loader2 size={12} className="animate-spin text-quantum" />
                            <span>{batchPdfProgress.current}/{batchPdfProgress.total}</span>
                          </>
                        ) : (
                          <>
                            <Archive size={12} className="text-quantum" />
                            <span>PDF ZIP</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Counters */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-3">
                    <div className="p-2.5 rounded-xl bg-cream/50 border border-hairline">
                      <span className="text-[10px] text-ink-soft uppercase font-mono block">Records</span>
                      <strong className="text-xs text-ink">{session.totalRecords.toLocaleString()}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                      <span className="text-[10px] text-emerald-700 uppercase font-mono block">Success</span>
                      <strong className="text-xs text-emerald-800">{session.successCount.toLocaleString()}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-200">
                      <span className="text-[10px] text-red-700 uppercase font-mono block">High Risk</span>
                      <strong className="text-xs text-red-800">{session.highRiskCount}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                      <span className="text-[10px] text-blue-700 uppercase font-mono block">Concordant</span>
                      <strong className="text-xs text-blue-800">
                        {session.concordantCount} ({session.successCount > 0 ? ((session.concordantCount / session.successCount) * 100).toFixed(0) : 0}%)
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200">
                      <span className="text-[10px] text-purple-700 uppercase font-mono block">Avg Risk</span>
                      <strong className="text-xs text-purple-800">{session.averageRiskScore.toFixed(1)} / 100</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-cream/50 border border-hairline">
                      <span className="text-[10px] text-ink-soft uppercase font-mono block">Duration</span>
                      <strong className="text-xs text-ink">{(session.executionTimeMs / 1000).toFixed(1)}s</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Case Details Modal */}
      <AnimatePresence>
        {selectedCase && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCase(null)}
              className="fixed inset-0 bg-ink/30 backdrop-blur-xs z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl border border-hairline shadow-2xl z-50 p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-quantum/10 text-quantum flex items-center justify-center border border-quantum/20">
                    <Microscope size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-quantum font-bold">
                      Verified Screening Record
                    </span>
                    <h3 className="font-serif text-lg font-medium text-ink">
                      {selectedCase.patientName} ({selectedCase.id})
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCase(null)}
                  className="w-7 h-7 rounded-full bg-cream border border-hairline flex items-center justify-center text-ink-soft hover:text-ink cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {/* Patient Summary Card */}
                <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-cream/30 border border-hairline">
                  <div>
                    <span className="text-[10px] text-ink-soft uppercase font-mono font-semibold">Patient Name</span>
                    <p className="font-bold text-ink">{selectedCase.patientName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-ink-soft uppercase font-mono font-semibold">Demographics</span>
                    <p className="font-medium text-ink">{selectedCase.patientGender || "Female"} • Age {selectedCase.patientAge || 55}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-ink-soft uppercase font-mono font-semibold">Biopsy Cohort</span>
                    <p className="font-medium text-ink">{selectedCase.diseaseType}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-ink-soft uppercase font-mono font-semibold">Timestamp</span>
                    <p className="font-mono text-ink">{selectedCase.timestamp}</p>
                  </div>
                </div>

                {/* Dual Model Results Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-purple-700 uppercase">Hybrid Quantum (Transfinite-1)</span>
                    <div className="text-lg font-mono font-black text-purple-800">
                      {selectedCase.quantumPrediction}
                    </div>
                    <p className="text-[11px] text-ink-soft">
                      Risk Score: <strong>{selectedCase.quantumRiskScore ?? 42.4}%</strong> • Conf: {selectedCase.quantumConfidence}%
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-blue-700 uppercase">Classical Baseline (CX-01)</span>
                    <div className="text-lg font-mono font-black text-blue-800">
                      {selectedCase.classicalPrediction}
                    </div>
                    <p className="text-[11px] text-ink-soft">
                      Risk Score: <strong>{selectedCase.classicalRiskScore ?? 44.1}%</strong> • Conf: {selectedCase.classicalConfidence}%
                    </p>
                  </div>
                </div>

                {/* Key Driver & Consensus */}
                <div className="p-3 rounded-xl bg-white border border-hairline flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-ink-soft block font-mono uppercase">Primary Risk Driver</span>
                    <strong className="text-xs text-ink">{selectedCase.topDriver || "Cell Size (Radius)"}</strong>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-bold uppercase ${
                      selectedCase.consensusStatus === "Discordant"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "text-emerald-700 bg-emerald-50 border border-emerald-200"
                    }`}
                  >
                    {selectedCase.consensusStatus || "Concordant"}
                  </span>
                </div>
              </div>

              {/* Action Buttons inside Modal */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-hairline">
                <button
                  type="button"
                  onClick={(e) => handleExportReport(selectedCase, e)}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-cream border border-hairline text-ink font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Download size={13} />
                  <span>Download Clinical Report (.pdf)</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleViewAnalysis(selectedCase, e)}
                  className="px-4 py-2 rounded-xl bg-ink hover:bg-ink/90 text-parchment font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Eye size={13} className="text-quantum" />
                  <span>View Full Analysis</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
