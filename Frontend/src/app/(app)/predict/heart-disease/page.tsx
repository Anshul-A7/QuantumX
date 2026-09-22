"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  ArrowLeft,
  UploadCloud,
  Sparkles,
  Activity,
  RotateCcw,
  RotateCw,
  Zap,
  FileText,
  Crosshair,
  User,
  Lock,
  ChevronRight,
  X,
  FileCheck2,
  Languages,
  Loader2,
  Microscope,
  AlertTriangle,
} from "lucide-react";
import { showToast } from "@/components/common/ToastNotification";
import { ScreeningService } from "@/services/screening.service";

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "hi", name: "Hindi (हिंदी)", flag: "🇮🇳" },
  { code: "es", name: "Spanish (Español)", flag: "🇪🇸" },
  { code: "fr", name: "French (Français)", flag: "🇫🇷" },
  { code: "de", name: "German (Deutsch)", flag: "🇩🇪" },
  { code: "ja", name: "Japanese (日本語)", flag: "🇯🇵" },
  { code: "ar", name: "Arabic (العربية)", flag: "🇸🇦" },
];

interface ProbabilityDict {
  Normal: number;
  "Myocardial Infarction": number;
  "History of MI": number;
  "Abnormal Heartbeat": number;
}

interface CardiacTelemetry {
  success: boolean;
  filename: string;
  prediction: {
    class_name: string;
    clinical_title: string;
    confidence_pct: number;
    probabilities: ProbabilityDict;
  };
  risk_stratification: {
    cardiac_risk_score: number;
    score_scale: string;
    severity_tier: string;
    clinical_recommendation: string;
    primary_driver: string;
  };
  pinpointing_gradcam: {
    heatmap_image_base64: string;
    lead_detected: string;
    anatomical_region: string;
    activation_peak_score: number;
    coordinates: {
      peak_x: number;
      peak_y: number;
      rel_x: number;
      rel_y: number;
    };
  };
  quantum_engine: {
    signature: string;
    qubits: number;
    ansatz: string;
    statevector_backend: string;
    quantum_prediction: string;
    quantum_confidence_pct: number;
    quantum_probabilities: ProbabilityDict;
    variational_parameters: number;
    latency_ms: number;
  };
  classical_engine: {
    name: string;
    architecture: string;
    prediction: string;
    confidence_pct: number;
    total_parameters: number;
    latency_ms: number;
  };
  dual_engine_consensus: {
    status: string;
    is_concordant: boolean;
    consensus_confidence: number;
    total_latency_ms: number;
  };
}

const REFERENCE_CASES = [
  {
    key: "mi",
    name: "Reference Case 1: Acute STEMI (Anterior / Lateral)",
    patientName: "Devendra Rao",
    patientAge: 62,
    patientGender: "Male",
    path: "/samples/ecg/sample-mi.jpg",
  },
  {
    key: "normal",
    name: "Reference Case 2: Normal Sinus Rhythm (Physiological)",
    patientName: "Sunita Verma",
    patientAge: 34,
    patientGender: "Female",
    path: "/samples/ecg/sample-normal.jpg",
  },
  {
    key: "history_mi",
    name: "Reference Case 3: Prior Infarction (Old Ischemic Scar)",
    patientName: "Harish Chandra",
    patientAge: 68,
    patientGender: "Male",
    path: "/samples/ecg/sample-history-mi.jpg",
  },
  {
    key: "arrhythmia",
    name: "Reference Case 4: Conduction Arrhythmia (Disturbance)",
    patientName: "Meenakshi Iyer",
    patientAge: 51,
    patientGender: "Female",
    path: "/samples/ecg/sample-arrhythmia.jpg",
  },
];

export default function HeartDiseaseStudioPage() {
  const router = useRouter();

  // Patient Demographics State (clean, inputable)
  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [patientAge, setPatientAge] = useState<number | "">("");
  const [patientGender, setPatientGender] = useState("Male");
  const [intakeDate, setIntakeDate] = useState("");
  const [isPatientIntakeOpen, setIsPatientIntakeOpen] = useState(true);

  // Hardware & Execution Mode
  const [executionMode, setExecutionMode] = useState<"simulator" | "real_ibm_qpu">("simulator");
  const [isIbmModalOpen, setIsIbmModalOpen] = useState(false);

  // Image Upload State
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageMeta, setImageMeta] = useState<{ name: string; size: string; dimensions?: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedReferenceKey, setSelectedReferenceKey] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Results State
  const [telemetry, setTelemetry] = useState<CardiacTelemetry | null>(null);
  const [viewMode, setViewMode] = useState<"heatmap" | "raw">("heatmap");

  // AI Summary, Typewriter & Translation State
  const [aiSynthesis, setAiSynthesis] = useState<any>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [baseEnglishSummary, setBaseEnglishSummary] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isTranslating, setIsTranslating] = useState(false);
  const [typedSummaryText, setTypedSummaryText] = useState("");
  const [isTypingSummary, setIsTypingSummary] = useState(false);
  const typewriterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize auto-assigned patient ID
  useEffect(() => {
    generateNewPatientId();
    const today = new Date().toISOString().split("T")[0];
    setIntakeDate(today);
  }, []);

  const generateNewPatientId = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    setPatientId(`QX-ECG-${rand}`);
  };

  // Typewriter Engine
  const triggerTypewriter = (fullText: string) => {
    if (typewriterTimeoutRef.current) {
      clearTimeout(typewriterTimeoutRef.current);
    }
    setTypedSummaryText("");
    setIsTypingSummary(true);

    let currentIndex = 0;
    const speedMs = 12;

    const step = () => {
      if (currentIndex < fullText.length) {
        currentIndex += 2;
        setTypedSummaryText(fullText.slice(0, currentIndex));
        typewriterTimeoutRef.current = setTimeout(step, speedMs);
      } else {
        setTypedSummaryText(fullText);
        setIsTypingSummary(false);
      }
    };

    step();
  };

  useEffect(() => {
    if (!telemetry) return;

    let fullText = "";
    if (aiSynthesis) {
      if (typeof aiSynthesis === "string") {
        fullText = aiSynthesis;
      } else if (aiSynthesis.summary_paragraph) {
        fullText = aiSynthesis.summary_paragraph;
      } else if (aiSynthesis.summary) {
        fullText = aiSynthesis.summary;
      }
    } else if (!isLoadingAi) {
      fullText = `The 12-lead ECG evaluation for ${patientName || "Patient"} (${patientId}) was analyzed with ${telemetry.prediction.confidence_pct}% certainty, yielding a continuous Cardiac Risk Score of ${telemetry.risk_stratification.cardiac_risk_score} / 100 (${telemetry.risk_stratification.severity_tier}). Primary lead activation detected in ${telemetry.pinpointing_gradcam.lead_detected} (${telemetry.pinpointing_gradcam.anatomical_region}). ${telemetry.risk_stratification.clinical_recommendation}`;
    }

    if (!fullText) return;

    setBaseEnglishSummary(fullText);
    setSelectedLanguage("en");
    triggerTypewriter(fullText);
  }, [aiSynthesis, isLoadingAi, telemetry, patientName, patientId]);

  const handleTranslateSummary = async (langCode: string) => {
    setSelectedLanguage(langCode);
    if (!baseEnglishSummary) return;

    if (langCode === "en") {
      triggerTypewriter(baseEnglishSummary);
      return;
    }

    setIsTranslating(true);
    try {
      const selectedLangObj = LANGUAGES.find((l) => l.code === langCode);
      const res = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: baseEnglishSummary,
          targetLanguage: langCode,
          languageName: selectedLangObj?.name || langCode,
        }),
      });
      const data = await res.json();
      if (data.success && data.translatedText) {
        triggerTypewriter(data.translatedText);
      } else {
        triggerTypewriter(baseEnglishSummary);
      }
    } catch (err) {
      console.warn("Translation failed, keeping original:", err);
      triggerTypewriter(baseEnglishSummary);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleNavigateToAnalysis = () => {
    try {
      const payload = {
        patientInfo: {
          name: patientName.trim() || "Patient",
          patient_id: patientId,
          age: patientAge || 55,
          gender: patientGender,
          intake_date: intakeDate,
        },
        telemetry: telemetry,
        uploadedImage: uploadedImage,
        imageMeta: imageMeta,
        aiSynthesis: aiSynthesis,
        selectedReferenceKey: selectedReferenceKey,
      };
      sessionStorage.setItem("quantumx_active_cardiac_analysis", JSON.stringify(payload));
    } catch (e) {
      console.warn("Could not save cardiac analysis payload to sessionStorage:", e);
    }
    router.push("/predict/heart-disease/analysis");
  };

  const handleRotateImage = () => {
    if (!uploadedImage) return;
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.height;
      canvas.height = img.width;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      const rotatedDataUrl = canvas.toDataURL("image/jpeg", 0.95);
      setUploadedImage(rotatedDataUrl);
      setImageFile(null); // will send base64 data to backend
      setImageMeta((prev: any) =>
        prev
          ? {
              ...prev,
              dimensions: `${canvas.width} × ${canvas.height} px`,
            }
          : null
      );
      setValidationError(null);
      showToast({
        title: "ECG Rotated 90°",
        message: `Image re-oriented to ${canvas.width} × ${canvas.height} px`,
        type: "info",
      });
    };
    img.src = uploadedImage;
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast({
        title: "Invalid File Format",
        message: "Please select an ECG paper strip image (.png, .jpg, .jpeg)",
        type: "warning",
      });
      return;
    }
    setImageFile(file);
    setSelectedReferenceKey(null);
    setTelemetry(null);
    setValidationError(null);

    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(0)} KB`;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedImage(result);

      // Measure dimensions
      const img = new window.Image();
      img.onload = () => {
        setImageMeta({
          name: file.name,
          size: sizeStr,
          dimensions: `${img.width} × ${img.height} px`,
        });
        setValidationError(null);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSelectReferenceCase = (refCase: typeof REFERENCE_CASES[0]) => {
    setSelectedReferenceKey(refCase.key);
    setImageFile(null);
    setUploadedImage(refCase.path);
    setImageMeta({
      name: `${refCase.key.toUpperCase()}_12Lead_ECG.jpg`,
      size: "695 KB",
      dimensions: "2200 × 1200 px",
    });
    setPatientName(refCase.patientName);
    setPatientAge(refCase.patientAge);
    setPatientGender(refCase.patientGender);
    setTelemetry(null);
    setValidationError(null);
  };

  const executeScreening = async () => {
    if (!uploadedImage) {
      showToast({
        title: "No ECG Image",
        message: "Please upload an ECG image to execute diagnostic screening.",
        type: "warning",
      });
      return;
    }

    if (validationError) {
      showToast({
        title: "Invalid ECG Image",
        message: validationError,
        type: "warning",
      });
      return;
    }

    setIsProcessing(true);
    setTelemetry(null);
    setValidationError(null);

    try {
      let res: Response;

      if (selectedReferenceKey) {
        // Direct reference sample route through Next.js API
        res = await fetch("/api/inference/cardiac-demo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sample_type: selectedReferenceKey }),
        });
      } else if (imageFile) {
        // Real user uploaded file via FormData through Next.js API
        const formData = new FormData();
        formData.append("file", imageFile);
        res = await fetch("/api/inference/cardiac-ecg", {
          method: "POST",
          body: formData,
        });
      } else {
        // Real base64 upload through Next.js API
        res = await fetch("/api/inference/cardiac-ecg", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_base64: uploadedImage,
            filename: imageMeta?.name || "patient_ecg.jpg",
          }),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.detail || `Server returned status ${res.status}`;
        setValidationError(errMsg);
        setTelemetry(null);
        setAiSynthesis(null);
        setIsProcessing(false);
        showToast({
          title: "Clinical Guardrail Active",
          message: errMsg,
          type: "warning",
        });
        return;
      }

      const data: CardiacTelemetry = await res.json();
      setTelemetry(data);
      setValidationError(null);
      setIsLoadingAi(true);

      // Persist to unified ScreeningService for History & Recent Screenings
      try {
        const qEng = data.quantum_engine;
        const cEng = data.classical_engine;
        const rStrat = data.risk_stratification;
        const gCam = data.pinpointing_gradcam;
        const isHighRisk = rStrat.severity_tier.includes("CRITICAL") || rStrat.severity_tier.includes("HIGH");

        ScreeningService.createScreening({
          id: patientId || `QX-ECG-${Math.floor(1000 + Math.random() * 9000)}`,
          patientId: patientId || `QX-ECG-${Math.floor(1000 + Math.random() * 9000)}`,
          patientName: patientName.trim() || "Patient",
          patientAge: typeof patientAge === "number" ? patientAge : 55,
          patientGender: patientGender || "Male",
          diseaseType: "12-Lead Electrocardiogram (Cardiac Rhythm)",
          disease: "Heart Disease Screening",
          cohort: "12-Lead Clinical ECG (PTB-XL)",
          modelFamily: "cardiac_dual_engine_v1",
          executionMode: executionMode === "real_ibm_qpu" ? "real_ibm_qpu" : "simulator",
          quantumPrediction: qEng?.quantum_prediction || data.prediction.class_name,
          quantumRiskScore: rStrat.cardiac_risk_score,
          quantumConfidence: qEng?.quantum_confidence_pct ?? data.prediction.confidence_pct,
          classicalPrediction: cEng?.prediction || data.prediction.class_name,
          classicalRiskScore: rStrat.cardiac_risk_score,
          classicalConfidence: cEng?.confidence_pct ?? data.prediction.confidence_pct,
          riskLevel: isHighRisk ? "High" : "Low",
          topDriver: `${gCam.lead_detected} (${gCam.anatomical_region})`,
          topDriverImpact: Math.round(gCam.activation_peak_score * 100),
          consensusStatus: data.dual_engine_consensus?.status?.includes("CONCORDANT") ? "Concordant" : "Discordant",
          quantumExecutionTimeMs: qEng?.latency_ms ?? 35.0,
          classicalExecutionTimeMs: cEng?.latency_ms ?? 10.0,
          clinicalNote: rStrat.clinical_recommendation,
          imageUrl: uploadedImage || (selectedReferenceKey ? REFERENCE_CASES.find(c => c.key === selectedReferenceKey)?.path : "/samples/ecg/sample-mi.jpg"),
          imageMeta: imageMeta || {
            name: "Patient_12Lead_ECG.jpg",
            size: "695 KB",
            dimensions: "2200 × 1200 px",
          },
          telemetryJson: data,
        }).catch((e) => console.warn("Failed to persist cardiac screening record:", e));
      } catch (err) {
        console.warn("ScreeningService save error:", err);
      }

      // Trigger Gemini AI multimodal clinical synthesis for Cardiac ECG
      fetch("/api/ai/synthesize-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condition: "cardiac",
          modality: "ecg",
          prediction: data.prediction.clinical_title || data.prediction.class_name,
          confidence: data.prediction.confidence_pct,
          risk_score: data.risk_stratification.cardiac_risk_score,
          risk_tier: data.risk_stratification.severity_tier,
          risk_tag: data.risk_stratification.severity_tier,
          lead_detected: data.pinpointing_gradcam.lead_detected,
          anatomical_region: data.pinpointing_gradcam.anatomical_region,
          clinical_recommendation: data.risk_stratification.clinical_recommendation,
          model_engine: data.quantum_engine.signature || "QuantumX Transfinite-1",
          execution_mode: executionMode,
          patient_info: {
            name: patientName.trim() || "Patient",
            patient_id: patientId,
            age: patientAge || 55,
            gender: patientGender,
          },
        }),
      })
        .then((r) => r.json())
        .then((aiData) => {
          if (aiData.success) {
            setAiSynthesis(aiData.summary || aiData.synthesis);
          }
          setIsLoadingAi(false);
        })
        .catch((err) => {
          console.warn("AI synthesis fallback used:", err);
          setIsLoadingAi(false);
        });

      showToast({
        title: "Screening Completed",
        message: `${data.prediction.class_name} detected (${data.prediction.confidence_pct}% certainty)`,
        type: "quantum",
      });
    } catch (err: any) {
      console.warn("Cardiac screening network warning:", err);
      showToast({
        title: "Connection Error",
        message: err.message || "Failed to reach backend server. Please ensure the backend is running.",
        type: "warning",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartNewPatient = () => {
    setUploadedImage(null);
    setImageFile(null);
    setImageMeta(null);
    setSelectedReferenceKey(null);
    setTelemetry(null);
    setAiSynthesis(null);
    setTypedSummaryText("");
    setIsTypingSummary(false);
    setBaseEnglishSummary("");
    setSelectedLanguage("en");
    setPatientName("");
    setPatientAge("");
    generateNewPatientId();
    setIsPatientIntakeOpen(true);
    showToast({
      title: "New Patient Session Initialized",
      message: "Ready for new ECG upload.",
      type: "info",
    });
  };

  const getRiskColor = (score: number) => {
    if (score >= 85) return "text-red-600 dark:text-red-400";
    if (score >= 60) return "text-purple-600 dark:text-purple-400";
    if (score >= 35) return "text-amber-600 dark:text-amber-400";
    return "text-emerald-600 dark:text-emerald-400";
  };

  const getRiskBarColor = (score: number) => {
    if (score >= 85) return "bg-red-500";
    if (score >= 60) return "bg-purple-500";
    if (score >= 35) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getSeverityBadge = (tier: string) => {
    if (tier.includes("CRITICAL")) {
      return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30";
    }
    if (tier.includes("HIGH RISK")) {
      return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30";
    }
    if (tier.includes("MODERATE")) {
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
    }
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 pb-12 w-full"
    >
      {/* HEADER SECTION (Matching Breast Cancer style) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-hairline pb-4">
        <div className="space-y-1">
          <Link
            href="/predict"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-ink-soft hover:text-ink transition-colors mb-1 cursor-pointer"
          >
            <ArrowLeft size={13} /> Back to Disease Directory
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 flex items-center justify-center shadow-xs">
              <Heart size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-2xl sm:text-3xl font-light text-ink tracking-tight">
                  12-Lead ECG Cardiac Studio
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-quantum/10 border border-quantum/30 text-quantum font-semibold">
                  v1.0.0-PROD
                </span>
              </div>
              <p className="text-xs text-ink-soft">
                Cardiovascular Screening • 12-Lead Rhythm Strip, ST-Segment Pinpointing &amp; Continuous Risk Scoring
              </p>
            </div>
          </div>
        </div>

        {/* Hardware Selector & Reset Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex p-1 rounded-xl bg-cream border border-hairline shadow-2xs">
            <button
              onClick={() => setExecutionMode("simulator")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${executionMode === "simulator"
                  ? "bg-quantum text-black shadow-xs font-bold"
                  : "text-ink-soft hover:text-ink"
                } cursor-pointer`}
            >
              <Sparkles size={13} />
              <span>Transfinite-1 (Simulator)</span>
            </button>
            <button
              onClick={() => setIsIbmModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 text-ink-soft hover:text-ink cursor-pointer opacity-80"
              title="Aleph-1 (IBM QPU) - Superconducting Hardware"
            >
              <Lock size={12} className="text-amber-500" />
              <span>Aleph-1 (IBM QPU)</span>
              <span className="text-[9px] font-mono text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                Locked
              </span>
            </button>
          </div>

          {telemetry && (
            <button
              onClick={handleStartNewPatient}
              className="px-3.5 py-2 rounded-xl bg-ink hover:bg-ink/90 text-parchment text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <RotateCcw size={13} className="text-quantum" />
              <span>Start New Patient</span>
            </button>
          )}
        </div>
      </div>

      {/* PATIENT INTAKE ACCORDION (Clean White Card, Inputable) */}
      <div className="bg-white rounded-2xl border border-hairline shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setIsPatientIntakeOpen(!isPatientIntakeOpen)}
          className="w-full px-5 py-3.5 bg-white hover:bg-cream/40 flex items-center justify-between text-left transition-colors cursor-pointer border-b border-hairline"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400">
              <User size={15} />
            </div>
            <div>
              <h3 className="font-serif text-sm font-medium text-ink">
                Patient Demographics &amp; Clinical Context
              </h3>
              <p className="text-[11px] font-mono text-ink-soft">
                {patientName ? `${patientName} (${patientId})` : "Patient Not Specified"} •{" "}
                {patientAge ? `Age: ${patientAge}` : "Age: Not Specified"} • Gender: {patientGender}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-quantum font-semibold">
            {isPatientIntakeOpen ? "Collapse −" : "Expand +"}
          </span>
        </button>

        {isPatientIntakeOpen && (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-white">
            {/* 1. Patient Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-ink-soft font-medium block">
                Patient Full Name <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                disabled={Boolean(telemetry)}
                placeholder="e.g. Ramesh Patel"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className={`w-full px-3 py-1.5 rounded-xl border border-hairline bg-cream/20 hover:bg-cream/30 text-ink text-xs font-medium focus:bg-white focus:outline-none focus:border-quantum ${telemetry ? "opacity-75 cursor-not-allowed bg-cream/30" : ""
                  }`}
              />
            </div>

            {/* 2. Patient ID */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-mono text-ink-soft font-medium">Patient ID</label>
                <span className="text-[9px] font-mono text-ink-soft bg-cream px-1.5 py-0.5 rounded border border-hairline">
                  Auto-Assigned
                </span>
              </div>
              <input
                type="text"
                value={patientId}
                readOnly
                className="w-full px-3 py-1.5 rounded-xl border border-hairline bg-cream/40 text-ink text-xs font-mono font-bold cursor-not-allowed select-all"
              />
            </div>

            {/* 3. Age */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-ink-soft font-medium block">
                Age (Years) <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="number"
                disabled={Boolean(telemetry)}
                placeholder="e.g. 58"
                min="18"
                max="105"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value ? parseInt(e.target.value) : "")}
                className={`w-full px-3 py-1.5 rounded-xl border border-hairline bg-cream/20 hover:bg-cream/30 text-ink text-xs font-mono focus:bg-white focus:outline-none focus:border-quantum ${telemetry ? "opacity-75 cursor-not-allowed bg-cream/30" : ""
                  }`}
              />
            </div>

            {/* 4. Gender */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-ink-soft font-medium block">Gender</label>
              <select
                disabled={Boolean(telemetry)}
                value={patientGender}
                onChange={(e) => setPatientGender(e.target.value)}
                className={`w-full px-3 py-1.5 rounded-xl border border-hairline bg-cream/20 hover:bg-cream/30 text-ink text-xs font-medium focus:bg-white focus:outline-none focus:border-quantum ${telemetry ? "opacity-75 cursor-not-allowed bg-cream/30" : ""
                  }`}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* MAIN CLINICAL ECG WORKSPACE */}
      <div className="space-y-6">
        {/* Upload & Workspace Card */}
        <div className="bg-parchment rounded-2xl border border-hairline p-6 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-4">
            <div>
              <h2 className="font-serif text-lg font-medium text-ink">
                12-Lead ECG Acquisition &amp; Ingestion
              </h2>
              <p className="text-xs text-ink-soft">
                Upload your patient&apos;s physical paper ECG rhythm strip or digital image scan
              </p>
            </div>

            {/* Optional reference dropdown (subtle, non-excessive) */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-ink-soft">Reference Benchmark:</span>
              <select
                disabled={Boolean(telemetry)}
                value={selectedReferenceKey || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    setSelectedReferenceKey(null);
                    setUploadedImage(null);
                    setImageMeta(null);
                  } else {
                    const match = REFERENCE_CASES.find((c) => c.key === val);
                    if (match) handleSelectReferenceCase(match);
                  }
                }}
                className="px-2.5 py-1.5 rounded-xl border border-hairline bg-white text-ink text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="">Upload Custom Patient ECG (Default)</option>
                {REFERENCE_CASES.map((rc) => (
                  <option key={rc.key} value={rc.key}>
                    {rc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* CLINICAL REJECTION GUARDRAIL BANNER */}
          {validationError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-ink space-y-2 relative overflow-hidden shadow-xs"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle size={18} />
                </div>
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-amber-950 text-sm flex items-center gap-2">
                    Non-ECG Image Rejected by Clinical Guardrail
                  </h4>
                  <p className="text-amber-900 leading-relaxed font-sans">
                    {validationError}
                  </p>
                  <p className="text-ink-soft text-[11px] pt-1">
                    To maintain strict medical safety and regulatory standards, the QuantumX dual-engine pipeline only executes diagnostic inference on verified 12-lead electrocardiograms matching our trained clinical distribution. Please select a verified test case from the <strong className="text-ink font-mono text-[10px]">Test Cases/Heart_Disease_ECG</strong> folder or upload a standard horizontal 12-lead ECG printout.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Upload Dropzone OR Image Viewport */}
          {!uploadedImage ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${isDragging
                  ? "border-quantum bg-quantum/5"
                  : "border-hairline hover:border-quantum/50 hover:bg-cream/40 bg-white"
                }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                accept="image/*"
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-quantum/10 border border-quantum/20 text-quantum mx-auto flex items-center justify-center mb-3">
                <UploadCloud size={28} />
              </div>
              <h3 className="text-base font-serif font-medium text-ink">
                Upload Patient ECG Paper Strip or Scanned Image
              </h3>
              <p className="text-xs text-ink-soft mt-1.5 max-w-md mx-auto">
                Drag and drop your standard 12-lead ECG printout (.png, .jpg, .jpeg) here, or browse your files.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-quantum bg-quantum/10 px-3 py-1.5 rounded-xl border border-quantum/20">
                <span>Select ECG File</span>
                <ChevronRight size={13} />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image Details Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-hairline">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-quantum/10 border border-quantum/20 text-quantum flex items-center justify-center">
                    <FileCheck2 size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-ink block">
                      {imageMeta?.name || "Patient_12Lead_ECG.jpg"}
                    </span>
                    <span className="text-[11px] font-mono text-ink-soft">
                      {imageMeta?.size || "695 KB"} • {imageMeta?.dimensions || "2200 × 1200 px"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {telemetry && (
                    <div className="flex items-center gap-1 border border-hairline rounded-lg p-0.5 bg-cream/40">
                      <button
                        onClick={() => setViewMode("heatmap")}
                        className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-all cursor-pointer ${viewMode === "heatmap"
                            ? "bg-white text-ink shadow-2xs font-semibold"
                            : "text-ink-soft hover:text-ink"
                          }`}
                      >
                        Grad-CAM Heatmap
                      </button>
                      <button
                        onClick={() => setViewMode("raw")}
                        className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-all cursor-pointer ${viewMode === "raw"
                            ? "bg-white text-ink shadow-2xs font-semibold"
                            : "text-ink-soft hover:text-ink"
                          }`}
                      >
                        Raw ECG Strip
                      </button>
                    </div>
                  )}

                  {!telemetry && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleRotateImage}
                        title="Rotate ECG 90° Clockwise"
                        className="text-xs font-mono text-ink-soft hover:text-ink px-2.5 py-1 rounded-lg border border-hairline hover:bg-cream flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <RotateCw size={13} className="text-quantum" />
                        <span>Rotate 90°</span>
                      </button>
                      <button
                        onClick={() => {
                          setUploadedImage(null);
                          setImageFile(null);
                          setImageMeta(null);
                          setSelectedReferenceKey(null);
                          setValidationError(null);
                        }}
                        className="text-xs font-mono text-ink-soft hover:text-red-600 px-2.5 py-1 rounded-lg border border-hairline hover:bg-red-50 cursor-pointer"
                      >
                        Remove File
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Viewport Display */}
              <div className="relative rounded-2xl overflow-hidden border border-hairline bg-black/5 aspect-[16/8] flex items-center justify-center">
                {telemetry && viewMode === "heatmap" ? (
                  <img
                    src={telemetry.pinpointing_gradcam.heatmap_image_base64}
                    alt="Grad-CAM Pinpointing Heatmap"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={uploadedImage}
                    alt="Uploaded Patient ECG"
                    className="w-full h-full object-contain"
                  />
                )}

                {isProcessing && (
                  <div className="absolute inset-0 bg-white/85 backdrop-blur-xs flex flex-col items-center justify-center space-y-3 z-10">
                    <div className="w-10 h-10 rounded-full border-2 border-quantum border-t-transparent animate-spin" />
                    <div className="text-center space-y-1">
                      <p className="text-sm font-serif font-medium text-ink">
                        Executing Dual-Engine Hilbert Space Inference
                      </p>
                      <p className="text-xs font-mono text-ink-soft">
                        ResNet-18 Grad-CAM Convolution &amp; PennyLane 8-Qubit VQC...
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Pinpoint Attribution Bar */}
              {telemetry && (
                <div className="p-4 rounded-xl bg-white border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 flex items-center justify-center">
                      <Crosshair size={15} />
                    </div>
                    <div>
                      <span className="font-semibold text-ink">
                        {telemetry.pinpointing_gradcam.lead_detected}
                      </span>
                      <span className="text-ink-soft ml-1.5">
                        ({telemetry.pinpointing_gradcam.anatomical_region})
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-ink-soft bg-cream px-2.5 py-1 rounded-md border border-hairline self-start sm:self-auto">
                    Peak Activation: {(telemetry.pinpointing_gradcam.activation_peak_score * 100).toFixed(1)}%
                  </span>
                </div>
              )}

              {/* Trigger Button */}
              {!telemetry && (
                <div className="pt-2">
                  <button
                    onClick={executeScreening}
                    disabled={isProcessing}
                    className="w-full py-3.5 px-6 rounded-xl bg-ink hover:bg-ink/90 text-parchment text-xs font-semibold flex items-center justify-center gap-2.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Zap size={14} className="text-quantum" />
                    <span>Run Quantum-Classical Dual Screening</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CLINICAL TELEMETRY RESULTS (Unified, Compact & Aligned with Breast Cancer) */}
        {telemetry && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-4"
          >
            {/* 1. DUAL-ENGINE SIDE-BY-SIDE BENCHMARK CARDS (WITH INTEGRATED RISK GAUGES) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: QuantumX Transfinite-1 (Hybrid Quantum) */}
              <div className="p-4.5 rounded-2xl bg-white border border-quantum/40 shadow-xs space-y-3.5 relative overflow-hidden flex flex-col justify-between">
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-hairline pb-2.5">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-quantum/15 text-quantum border border-quantum/30 flex items-center gap-1.5">
                      <Sparkles size={12} />
                      <span>{telemetry.quantum_engine.signature}</span>
                    </span>
                    <span className="text-[10px] font-mono text-ink-soft font-semibold">
                      {telemetry.quantum_engine.latency_ms} ms
                    </span>
                  </div>

                  {/* Main Circular Gauge & Prediction */}
                  <div className="py-2.5 flex items-center justify-between gap-3">
                    {/* Circular Score Gauge */}
                    {(() => {
                      const score = Number(telemetry.risk_stratification.cardiac_risk_score ?? 0);
                      const strokeColor = score >= 85 ? "#dc2626" : score >= 60 ? "#9333ea" : score >= 35 ? "#f59e0b" : "#10b981";
                      const radius = 26;
                      const circumference = 2 * Math.PI * radius;
                      const dashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

                      return (
                        <div className="flex flex-col items-center">
                          <div className="relative w-18 h-18 flex items-center justify-center shrink-0">
                            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 64 64">
                              <circle
                                cx="32"
                                cy="32"
                                r={radius}
                                stroke="#f1ede6"
                                strokeWidth="4.5"
                                fill="transparent"
                              />
                              <circle
                                cx="32"
                                cy="32"
                                r={radius}
                                stroke={strokeColor}
                                strokeWidth="4.5"
                                strokeDasharray={circumference}
                                strokeDashoffset={dashoffset}
                                strokeLinecap="round"
                                fill="transparent"
                                className="transition-all duration-700"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                              <span className="text-base font-black font-mono text-ink leading-none">
                                {score.toFixed(1)}
                              </span>
                              <span className="text-[8px] font-mono text-ink-soft mt-0.5">/ 100</span>
                            </div>
                          </div>
                          <span className="text-[9px] font-mono text-ink-soft font-semibold mt-1">Cardiac Risk</span>
                        </div>
                      );
                    })()}

                    {/* Status, Risk Tag & Confidence */}
                    {(() => {
                      const score = Number(telemetry.risk_stratification.cardiac_risk_score ?? 0);
                      const tier = telemetry.risk_stratification.severity_tier;
                      const isCritical = tier.includes("CRITICAL") || score >= 85;
                      const isHigh = tier.includes("HIGH") || (score >= 60 && score < 85);
                      const isModerate = tier.includes("MODERATE") || (score >= 35 && score < 60);

                      const tagLabel = isCritical
                        ? "CRITICAL EMERGENCY"
                        : isHigh
                          ? "HIGH RISK ARRHYTHMIA"
                          : isModerate
                            ? "MODERATE (PRIOR MI)"
                            : "LOW RISK (NORMAL)";

                      const tagBadgeStyle = isCritical
                        ? "bg-red-100 text-red-800 border-red-300"
                        : isHigh
                          ? "bg-purple-50 text-purple-800 border-purple-300"
                          : isModerate
                            ? "bg-amber-50 text-amber-800 border-amber-300"
                            : "bg-emerald-50 text-emerald-800 border-emerald-300";

                      const dotColor = isCritical ? "bg-red-600" : isHigh ? "bg-purple-600" : isModerate ? "bg-amber-500" : "bg-emerald-500";

                      return (
                        <div className="space-y-1 text-right flex flex-col items-end">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border shadow-2xs ${tagBadgeStyle}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                            {tagLabel}
                          </span>

                          <div className="flex items-center gap-1.5 justify-end mt-0.5">
                            <span className={`inline-block text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${isCritical
                                ? "bg-red-50 text-red-700 border-red-200"
                                : isHigh
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : isModerate
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}>
                              {telemetry.prediction.clinical_title}
                            </span>
                          </div>

                          <div className="text-[11px] font-mono text-ink-soft">
                            Confidence: <strong className="text-quantum font-bold">{telemetry.quantum_engine.quantum_confidence_pct}%</strong>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Grad-CAM Lead Pinpointing */}
                  <div className="pt-2.5 border-t border-hairline space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink-soft block">
                      VQC Statevector & Lead Attribution
                    </span>
                    <div className="p-2 rounded-lg bg-cream/40 border border-hairline/60 text-[11px] flex items-center justify-between">
                      <span className="text-ink font-medium truncate">
                        {telemetry.pinpointing_gradcam.lead_detected}
                      </span>
                      <span className="font-mono font-bold text-[10px] text-quantum">
                        Peak: {(telemetry.pinpointing_gradcam.activation_peak_score * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-hairline flex justify-between items-center text-[10px] font-mono text-ink-soft">
                  <span>Engine: 8-Qubit Strongly Entangled VQC</span>
                  <span className="text-emerald-700 font-bold">Simulator Active</span>
                </div>
              </div>

              {/* Card 2: CX-01 Cardiac Classical (Baseline) */}
              <div className="p-4.5 rounded-2xl bg-white border border-blue-200 shadow-xs space-y-3.5 relative overflow-hidden flex flex-col justify-between">
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-hairline pb-2.5">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
                      <Activity size={12} />
                      <span>CX-01 (Classical)</span>
                    </span>
                    <span className="text-[10px] font-mono text-ink-soft font-semibold">
                      {telemetry.classical_engine.latency_ms} ms
                    </span>
                  </div>

                  {/* Main Circular Gauge & Prediction */}
                  <div className="py-2.5 flex items-center justify-between gap-3">
                    {/* Circular Score Gauge */}
                    {(() => {
                      const score = Number(telemetry.risk_stratification.cardiac_risk_score ?? 0);
                      const strokeColor = score >= 85 ? "#dc2626" : score >= 60 ? "#9333ea" : score >= 35 ? "#f59e0b" : "#10b981";
                      const radius = 26;
                      const circumference = 2 * Math.PI * radius;
                      const dashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

                      return (
                        <div className="flex flex-col items-center">
                          <div className="relative w-18 h-18 flex items-center justify-center shrink-0">
                            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 64 64">
                              <circle
                                cx="32"
                                cy="32"
                                r={radius}
                                stroke="#f1ede6"
                                strokeWidth="4.5"
                                fill="transparent"
                              />
                              <circle
                                cx="32"
                                cy="32"
                                r={radius}
                                stroke={strokeColor}
                                strokeWidth="4.5"
                                strokeDasharray={circumference}
                                strokeDashoffset={dashoffset}
                                strokeLinecap="round"
                                fill="transparent"
                                className="transition-all duration-700"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                              <span className="text-base font-black font-mono text-ink leading-none">
                                {score.toFixed(1)}
                              </span>
                              <span className="text-[8px] font-mono text-ink-soft mt-0.5">/ 100</span>
                            </div>
                          </div>
                          <span className="text-[9px] font-mono text-ink-soft font-semibold mt-1">Cardiac Risk</span>
                        </div>
                      );
                    })()}

                    {/* Status, Risk Tag & Confidence */}
                    {(() => {
                      const score = Number(telemetry.risk_stratification.cardiac_risk_score ?? 0);
                      const tier = telemetry.risk_stratification.severity_tier;
                      const isCritical = tier.includes("CRITICAL") || score >= 85;
                      const isHigh = tier.includes("HIGH") || (score >= 60 && score < 85);
                      const isModerate = tier.includes("MODERATE") || (score >= 35 && score < 60);

                      const tagLabel = isCritical
                        ? "CRITICAL EMERGENCY"
                        : isHigh
                          ? "HIGH RISK ARRHYTHMIA"
                          : isModerate
                            ? "MODERATE (PRIOR MI)"
                            : "LOW RISK (NORMAL)";

                      const tagBadgeStyle = isCritical
                        ? "bg-red-100 text-red-800 border-red-300"
                        : isHigh
                          ? "bg-purple-50 text-purple-800 border-purple-300"
                          : isModerate
                            ? "bg-amber-50 text-amber-800 border-amber-300"
                            : "bg-emerald-50 text-emerald-800 border-emerald-300";

                      const dotColor = isCritical ? "bg-red-600" : isHigh ? "bg-purple-600" : isModerate ? "bg-amber-500" : "bg-emerald-500";

                      return (
                        <div className="space-y-1 text-right flex flex-col items-end">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border shadow-2xs ${tagBadgeStyle}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                            {tagLabel}
                          </span>

                          <div className="flex items-center gap-1.5 justify-end mt-0.5">
                            <span className={`inline-block text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${isCritical
                                ? "bg-red-50 text-red-700 border-red-200"
                                : isHigh
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : isModerate
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}>
                              {telemetry.classical_engine.prediction}
                            </span>
                          </div>

                          <div className="text-[11px] font-mono text-ink-soft">
                            Confidence: <strong className="text-ink font-bold">{telemetry.classical_engine.confidence_pct}%</strong>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* ResNet-18 Parameters & Attributions */}
                  <div className="pt-2.5 border-t border-hairline space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink-soft block">
                      ResNet-18 Deep Convolutional Weights
                    </span>
                    <div className="p-2 rounded-lg bg-cream/40 border border-hairline/60 text-[11px] flex items-center justify-between">
                      <span className="text-ink font-medium truncate">
                        {telemetry.pinpointing_gradcam.anatomical_region}
                      </span>
                      <span className="font-mono font-bold text-[10px] text-blue-700">
                        11.2M Parameters
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-hairline flex justify-between items-center text-[10px] font-mono text-ink-soft">
                  <span>Engine: ResNet-18 Deep CNN</span>
                  <span className="text-blue-700 font-bold">Classical Baseline</span>
                </div>
              </div>
            </div>

            {/* 2. COMPACT MULTI-CLASS LIKELIHOOD SPECTRUM */}
            <div className="p-3.5 rounded-2xl bg-white border border-hairline shadow-xs space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-soft font-bold block">
                Multi-Class Likelihood Spectrum
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(telemetry.prediction.probabilities).map(([cls, prob]) => {
                  const isSelected = cls === telemetry.prediction.class_name;
                  return (
                    <div
                      key={cls}
                      className={`p-2 rounded-xl border text-xs ${isSelected
                          ? "border-quantum/50 bg-quantum/5 text-ink font-bold"
                          : "border-hairline bg-cream/20 text-ink-soft"
                        }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="truncate pr-1">{cls}</span>
                        <span className="font-mono">{(prob * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-1 w-full bg-cream rounded-full overflow-hidden mt-1.5">
                        <div
                          className={`h-full ${isSelected ? "bg-quantum" : "bg-ink-soft/30"}`}
                          style={{ width: `${prob * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. QUANTUMX AI SUMMARY (TYPEWRITER & TRANSLATION) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-hairline shadow-xs space-y-3.5 relative overflow-hidden">
              {/* Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-hairline pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-quantum/10 border border-quantum/20 flex items-center justify-center text-quantum shadow-2xs">
                    <FileText size={15} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                      QuantumX AI Summary
                    </h4>
                    <p className="text-[11px] text-ink-soft">
                      Evaluation for {patientName || "Patient"} ({patientId})
                    </p>
                  </div>
                </div>

                {/* Translation Controls & Status */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {(isLoadingAi || isTypingSummary || isTranslating) && (
                    <span className="text-[10px] font-mono text-quantum flex items-center gap-1 font-semibold mr-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-quantum animate-ping" />
                      {isLoadingAi ? "Thinking..." : isTranslating ? "Translating..." : "Writing..."}
                    </span>
                  )}

                  {/* Language Dropdown */}
                  <select
                    value={selectedLanguage}
                    onChange={(e) => {
                      const lang = e.target.value;
                      setSelectedLanguage(lang);
                      handleTranslateSummary(lang);
                    }}
                    disabled={isLoadingAi || isTranslating}
                    className="px-2.5 py-1 rounded-lg border border-hairline bg-cream/30 hover:bg-cream/60 text-ink text-xs font-medium focus:outline-none focus:border-quantum cursor-pointer"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>

                  {/* Translate Button */}
                  <button
                    type="button"
                    onClick={() => handleTranslateSummary(selectedLanguage)}
                    disabled={isLoadingAi || isTranslating}
                    className="px-2.5 py-1 rounded-lg bg-ink hover:bg-ink/90 text-parchment text-xs font-medium flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                    title="AI rewrite and translate summary"
                  >
                    <Languages size={12} className="text-quantum" />
                    <span>Translate</span>
                  </button>
                </div>
              </div>

              {/* Body: Thinking State or Typed Paragraph */}
              {isLoadingAi && !typedSummaryText ? (
                <div className="py-3 px-3.5 rounded-xl bg-parchment/40 border border-hairline flex items-center gap-2.5 text-xs text-ink-soft font-mono">
                  <div className="flex items-center gap-1 text-quantum shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-quantum animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-quantum animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-quantum animate-bounce" />
                  </div>
                  <span className="italic">Thinking... evaluating ECG leads and compiling clinical cardiac summary</span>
                </div>
              ) : isTranslating ? (
                <div className="py-3 px-3.5 rounded-xl bg-parchment/40 border border-hairline flex items-center gap-2.5 text-xs text-ink-soft font-mono">
                  <Loader2 size={13} className="animate-spin text-quantum shrink-0" />
                  <span>Rewriting summary in {LANGUAGES.find(l => l.code === selectedLanguage)?.name}...</span>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-parchment/50 border border-hairline">
                  <p className="text-xs sm:text-[13px] text-ink leading-relaxed whitespace-pre-line font-normal">
                    {typedSummaryText}
                    {isTypingSummary && (
                      <span className="inline-block w-1.5 h-3.5 ml-1 bg-quantum animate-pulse align-middle" />
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* 4. NAVIGATION & ACTION BUTTONS */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleNavigateToAnalysis}
                className="w-full py-3.5 px-4 rounded-xl bg-ink hover:bg-ink/90 text-parchment font-semibold text-xs flex items-center justify-between transition-all shadow-md cursor-pointer border border-ink"
              >
                <div className="flex items-center gap-2">
                  <Microscope size={16} className="text-quantum" />
                  <span>🔬 View Full Patient Analysis Report</span>
                </div>
                <ChevronRight size={15} className="text-parchment/70" />
              </button>

              <button
                type="button"
                onClick={handleStartNewPatient}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-cream border border-hairline text-ink font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <RotateCcw size={13} className="text-quantum" />
                <span>Start New Patient Screening</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* IBM MODAL (Matching Breast Cancer) */}
      <AnimatePresence>
        {isIbmModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 text-neutral-100 rounded-3xl border border-neutral-800 p-6 max-w-lg w-full space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Real IBM Quantum QPU Engine</h3>
                    <p className="text-xs text-neutral-400">Superconducting Transmon Hardware Gateway</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsIbmModalOpen(false)}
                  className="h-8 w-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 text-xs text-neutral-300 leading-relaxed">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-start gap-2.5">
                  <Lock size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Enterprise / Hardware Access</strong>
                    <span>
                      Physical cryogenic IBM Quantum QPU runs (e.g. ibm_brisbane) execute with queue scheduling. Simulator mode runs instantly on GPU tensor statevectors.
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsIbmModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold cursor-pointer"
                >
                  Use High-Speed Simulator
                </button>
                <button
                  onClick={() => {
                    setExecutionMode("real_ibm_qpu");
                    setIsIbmModalOpen(false);
                    showToast({
                      title: "IBM QPU Mode Selected",
                      message: "Configured target: ibm_brisbane.",
                      type: "quantum",
                    });
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 cursor-pointer"
                >
                  Enable Hardware Target
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
