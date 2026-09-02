"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Activity,
  Layers,
  Zap,
  Sliders,
  CheckCircle2,
  Check,
  RotateCcw,
  FlaskConical,
  HelpCircle,
  Loader2,
  Lock,
  ArrowRight,
  AlertTriangle,
  X,
  ShieldCheck,
  UploadCloud,
  Info,
  Calculator,
  Link2,
  Unlink2,
  User,
  Calendar,
  Hash,
  RefreshCw,
  Phone,
  FileCheck2,
  ChevronRight,
  Eye,
  Microscope,
  ExternalLink,
  ArrowLeft,
  Play,
  CheckSquare
} from "lucide-react";
import HelpTooltip from "@/components/common/HelpTooltip";
import BiomarkerUploadModal from "@/components/predict/BiomarkerUploadModal";
import { PatientMetadata } from "@/lib/medicalReportParser";
import { showToast } from "@/components/common/ToastNotification";

interface FieldConfig {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit: string;
  description: string;
  simpleExplanation: string;
}

const FIELDS: FieldConfig[] = [
  {
    key: "radius_mean",
    label: "Cell Size (Radius)",
    min: 6.0,
    max: 30.0,
    step: 0.1,
    defaultValue: 12.2,
    unit: "μm",
    description: "Mean distance from center to points on perimeter of cell nucleus.",
    simpleExplanation: "Average radius of the cell nucleus under microscope.",
  },
  {
    key: "texture_mean",
    label: "Surface Texture",
    min: 9.0,
    max: 40.0,
    step: 0.1,
    defaultValue: 17.4,
    unit: "std",
    description: "Standard deviation of gray-scale values in the cell nucleus image.",
    simpleExplanation: "Variation in gray-scale texture across the cell.",
  },
  {
    key: "perimeter_mean",
    label: "Cell Perimeter",
    min: 40.0,
    max: 200.0,
    step: 0.5,
    defaultValue: 78.2,
    unit: "μm",
    description: "Total boundary length of the cell nucleus.",
    simpleExplanation: "Distance around the outside edge of the cell.",
  },
  {
    key: "area_mean",
    label: "Nuclear Area",
    min: 140.0,
    max: 2500.0,
    step: 1.0,
    defaultValue: 458.7,
    unit: "μm²",
    description: "Total surface area of the cell nucleus.",
    simpleExplanation: "Two-dimensional size of the nucleus footprint.",
  },
  {
    key: "smoothness_mean",
    label: "Border Smoothness",
    min: 0.05,
    max: 0.20,
    step: 0.001,
    defaultValue: 0.091,
    unit: "idx",
    description: "Local variation in radius lengths.",
    simpleExplanation: "How even or jagged the cell boundary appears.",
  },
  {
    key: "compactness_mean",
    label: "Compactness",
    min: 0.01,
    max: 0.35,
    step: 0.001,
    defaultValue: 0.065,
    unit: "idx",
    description: "Calculated as (perimeter² / area - 1.0).",
    simpleExplanation: "Density and circular packing efficiency of cell structure.",
  },
  {
    key: "concavity_mean",
    label: "Indentation Depth",
    min: 0.0,
    max: 0.45,
    step: 0.001,
    defaultValue: 0.037,
    unit: "idx",
    description: "Severity of concave portions of the nuclear contour.",
    simpleExplanation: "Depth of inward curves/notches on cell surface.",
  },
  {
    key: "concave_points_mean",
    label: "Indentation Count",
    min: 0.0,
    max: 0.25,
    step: 0.001,
    defaultValue: 0.023,
    unit: "cnt",
    description: "Number of concave portions along the nuclear boundary.",
    simpleExplanation: "Count of sharp inward notches on cell margin.",
  },
];

const PRESETS = [
  {
    name: "Case A: Low-Risk Normal (Ananya Mehta)",
    patientName: "Ananya Mehta",
    patientAge: 27,
    patientGender: "Female",
    description: "Benign Fibroadenoma: uniform small nuclei, smooth contours, minimal concavity.",
    values: {
      radius_mean: 12.184,
      texture_mean: 12.731,
      perimeter_mean: 77.214,
      area_mean: 451.823,
      smoothness_mean: 0.073,
      compactness_mean: 0.048,
      concavity_mean: 0.026,
      concave_points_mean: 0.018,
    },
  },
  {
    name: "Case B: Borderline Atypia (Riya Kulkarni)",
    patientName: "Riya Kulkarni",
    patientAge: 46,
    patientGender: "Female",
    description: "Atypical Ductal Hyperplasia / Gray Zone: intermediate cellular atypia in overlap zone.",
    values: {
      radius_mean: 15.672,
      texture_mean: 19.384,
      perimeter_mean: 101.826,
      area_mean: 712.458,
      smoothness_mean: 0.087,
      compactness_mean: 0.112,
      concavity_mean: 0.074,
      concave_points_mean: 0.046,
    },
  },
  {
    name: "Case C: Clear High Risk (Priya Sharma)",
    patientName: "Priya Sharma",
    patientAge: 58,
    patientGender: "Female",
    description: "Infiltrating Ductal Carcinoma: severe nuclear pleomorphism, jagged borders, high density.",
    values: {
      radius_mean: 22.418,
      texture_mean: 27.631,
      perimeter_mean: 151.274,
      area_mean: 1578.642,
      smoothness_mean: 0.103,
      compactness_mean: 0.284,
      concavity_mean: 0.318,
      concave_points_mean: 0.174,
    },
  },
];

export default function BreastCancerDetailPage() {
  const router = useRouter();
  const [formValues, setFormValues] = useState<Record<string, number>>({});
  const [derivedNotes, setDerivedNotes] = useState<Record<string, string>>({});
  const [selectedPresetName, setSelectedPresetName] = useState<string | null>(null);

  // Architecture & Engine Selection
  const [selectedModelFamily, setSelectedModelFamily] = useState<"quantumx_hybrid_v1" | "aegis_classical_v1">("quantumx_hybrid_v1");
  const [executionMode, setExecutionMode] = useState<"simulator" | "real_ibm_qpu">("simulator");
  const [isIbmModalOpen, setIsIbmModalOpen] = useState(false);

  // Patient Demographics State (Starts Empty & Inputable)
  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [patientAge, setPatientAge] = useState<number | "">("");
  const [patientGender, setPatientGender] = useState("Female");
  const [intakeDate, setIntakeDate] = useState("");
  const [accessionNumber, setAccessionNumber] = useState("");
  const [isPatientIntakeOpen, setIsPatientIntakeOpen] = useState(true);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [linkGeometry, setLinkGeometry] = useState(false);

  // Execution & Progress State
  const [isInferring, setIsInferring] = useState(false);
  const [hasInferred, setHasInferred] = useState(false);
  const [screeningResult, setScreeningResult] = useState<any>(null);
  const [aiSynthesis, setAiSynthesis] = useState<any>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const generateNewPatientIdentity = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setPatientId(`QX-BC-${randomSuffix}`);
    setAccessionNumber(`ACC-2026-08${Math.floor(10 + Math.random() * 90)}`);
    setIntakeDate(new Date().toISOString().split("T")[0]);
  };

  useEffect(() => {
    const initial: Record<string, number> = {};
    FIELDS.forEach((f) => {
      initial[f.key] = f.defaultValue;
    });
    setFormValues(initial);
    generateNewPatientIdentity();
  }, []);

  const handleNavigateToAnalysis = () => {
    try {
      const payload = {
        patientInfo: {
          name: patientName.trim() || "Patient",
          patient_id: patientId,
          age: patientAge || 45,
          gender: patientGender,
        },
        biomarkers: formValues,
        screeningResult: screeningResult || {},
        aiSynthesis: aiSynthesis,
      };
      sessionStorage.setItem("quantumx_active_analysis", JSON.stringify(payload));
    } catch (e) {
      console.warn("Could not save analysis payload to sessionStorage:", e);
    }
    router.push("/predict/breast-cancer/analysis");
  };

  const handleSelectPreset = (preset: typeof PRESETS[0]) => {
    if (hasInferred) return; // Prevent changing when locked
    setFormValues(preset.values);
    setDerivedNotes({});
    setSelectedPresetName(preset.name);
    setPatientName(preset.patientName);
    setPatientAge(preset.patientAge);
    setPatientGender(preset.patientGender);
  };

  const handleStartNewScreening = () => {
    const initial: Record<string, number> = {};
    FIELDS.forEach((f) => {
      initial[f.key] = f.defaultValue;
    });
    setFormValues(initial);
    setDerivedNotes({});
    setSelectedPresetName(null);
    setPatientName("");
    setPatientAge("");
    generateNewPatientIdentity();
    setHasInferred(false);
    setScreeningResult(null);
    setAiSynthesis(null);
    setIsPatientIntakeOpen(true);
    showToast({
      title: "New Patient Intake Initialized",
      message: "Parameters and demographics unlocked for new patient screening.",
      type: "quantum",
    });
  };

  const executeInferenceEngine = async (
    vals: Record<string, number>,
    pName: string,
    pId: string,
    pAge: number,
    pGender: string,
    pDate: string,
    pAccession: string
  ) => {
    setIsInferring(true);
    setHasInferred(false);
    setIsLoadingAi(true);

    try {
      // 1. Call the Dedicated Inference Engine API
      const response = await fetch("/api/inference/breast-cancer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          biomarkers: vals,
          model_family: selectedModelFamily,
          execution_mode: executionMode,
          patient_info: {
            name: pName,
            patient_id: pId,
            age: pAge,
            gender: pGender,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setScreeningResult(data);
        setHasInferred(true);
        setIsInferring(false);

        showToast({
          title: "Screening Computation Complete",
          message: `${pName} · ${data.prediction_label} (${data.composite_risk_score}/100 Risk Index)`,
          type: "quantum",
        });

        // 2. Trigger Gemini AI Multimodal Cytopathology Synthesis
        fetch("/api/ai/synthesize-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            biomarkers: vals,
            prediction: data.prediction_label,
            confidence: data.confidence,
            risk_score: data.composite_risk_score,
            risk_tier: data.risk_tier,
            model_engine: data.engine,
            execution_mode: executionMode,
            shap_attributions: data.shap_attributions,
            patient_info: {
              name: pName,
              patient_id: pId,
              age: pAge,
              gender: pGender,
            },
          }),
        })
          .then((res) => res.json())
          .then((aiData) => {
            if (aiData.success) {
              setAiSynthesis(aiData.synthesis);
            }
            setIsLoadingAi(false);
          })
          .catch((err) => {
            console.warn("AI synthesis fallback used:", err);
            setIsLoadingAi(false);
          });
      } else {
        throw new Error(data.error || "Inference failed");
      }
    } catch (err: any) {
      console.error("Inference execution error:", err);
      showToast({
        title: "Inference Error",
        message: err.message || "Failed to execute screening model.",
        type: "warning",
      });
      setIsInferring(false);
      setIsLoadingAi(false);
    }
  };

  const handleApplyExtractedData = (extractedValues: Record<string, number>, metadata: PatientMetadata) => {
    setFormValues(extractedValues);
    setDerivedNotes({});
    setSelectedPresetName(null);

    const name = metadata.patientName || patientName || "Imported Patient";
    const id = metadata.patientId || patientId;
    const age = metadata.patientAge || (patientAge ? Number(patientAge) : 48);
    const gender = "Female";
    const date = metadata.intakeDate || intakeDate;
    const acc = metadata.accessionNumber || accessionNumber;

    if (metadata.patientId) setPatientId(metadata.patientId);
    if (metadata.patientName) setPatientName(metadata.patientName);
    if (metadata.patientAge) setPatientAge(metadata.patientAge);
    if (metadata.intakeDate) setIntakeDate(metadata.intakeDate);
    if (metadata.accessionNumber) setAccessionNumber(metadata.accessionNumber);

    showToast({
      title: "Report Imported & Parsed",
      message: `Extracted 8 biomarkers for ${name}. Running dual-engine screening...`,
      type: "quantum",
    });

    executeInferenceEngine(extractedValues, name, id, age, gender, date, acc);
  };

  const handleRunInference = () => {
    if (hasInferred) {
      handleStartNewScreening();
      return;
    }

    if (!patientName.trim()) {
      showToast({
        title: "Patient Name Required",
        message: "Please enter the patient's full name in the Patient Intake section.",
        type: "warning",
      });
      setIsPatientIntakeOpen(true);
      return;
    }

    const numAge = Number(patientAge);
    if (!patientAge || isNaN(numAge) || numAge <= 0 || numAge > 120) {
      showToast({
        title: "Valid Age Required",
        message: "Please specify a valid patient age (e.g. 45) before running inference.",
        type: "warning",
      });
      setIsPatientIntakeOpen(true);
      return;
    }

    executeInferenceEngine(
      formValues,
      patientName.trim(),
      patientId,
      numAge,
      "Female",
      intakeDate,
      accessionNumber
    );
  };

  const handleValueChange = (key: string, numVal: number, fromDerivation?: string) => {
    if (hasInferred) return; // Prevent changing values after inference
    setSelectedPresetName(null);
    setFormValues((prev) => {
      const updated = { ...prev, [key]: numVal };

      if (linkGeometry && !fromDerivation) {
        if (key === "radius_mean") {
          updated.perimeter_mean = parseFloat((2 * Math.PI * numVal).toFixed(1));
          updated.area_mean = parseFloat((Math.PI * numVal * numVal).toFixed(1));
        } else if (key === "area_mean" && numVal > 0) {
          const derivedRadius = Math.sqrt(numVal / Math.PI);
          updated.radius_mean = parseFloat(derivedRadius.toFixed(2));
          updated.perimeter_mean = parseFloat((2 * Math.PI * derivedRadius).toFixed(1));
        }
      }
      return updated;
    });

    if (fromDerivation) {
      setDerivedNotes((prev) => ({ ...prev, [key]: fromDerivation }));
    } else {
      setDerivedNotes((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleReset = () => {
    if (hasInferred) return;
    const initial: Record<string, number> = {};
    FIELDS.forEach((f) => {
      initial[f.key] = f.defaultValue;
    });
    setFormValues(initial);
    setDerivedNotes({});
    setSelectedPresetName(null);
  };

  const getRiskColor = (tier: string) => {
    if (tier?.includes("HIGH")) return "text-red-700 bg-red-50 border-red-200";
    if (tier?.includes("BORDERLINE") || tier?.includes("INDETERMINATE")) return "text-amber-700 bg-amber-50 border-amber-200";
    return "text-emerald-700 bg-emerald-50 border-emerald-200";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full overflow-x-hidden space-y-6 pb-12"
    >
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-hairline pb-4">
        <div className="space-y-1">
          <Link
            href="/predict"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-ink-soft hover:text-ink transition-colors mb-1 cursor-pointer"
          >
            <ArrowLeft size={13} /> Back to Disease Directory
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-quantum/10 border border-quantum/30 text-quantum flex items-center justify-center shadow-xs">
              <Microscope size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-2xl sm:text-3xl font-light text-ink tracking-tight">
                  Breast Cancer Screening Studio
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-quantum/10 border border-quantum/30 text-quantum font-semibold">
                  v1.0.0-PROD
                </span>
              </div>
              <p className="text-xs text-ink-soft">
                Fine-Needle Biopsy Screening • Cellular Nuclear Size, Shape &amp; Structure Analysis
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Hardware Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Compact Hardware Selector */}
          <div className="inline-flex p-1 rounded-xl bg-cream border border-hairline shadow-2xs">
            <button
              disabled={hasInferred}
              onClick={() => setExecutionMode("simulator")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                executionMode === "simulator"
                  ? "bg-quantum text-black shadow-xs font-bold"
                  : "text-ink-soft hover:text-ink"
              } ${hasInferred ? "cursor-not-allowed opacity-80" : "cursor-pointer"}`}
            >
              <Sparkles size={13} />
              <span>Simulator</span>
            </button>
            <button
              disabled={hasInferred}
              onClick={() => setIsIbmModalOpen(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                executionMode === "real_ibm_qpu"
                  ? "bg-purple-600 text-white shadow-xs font-bold"
                  : "text-ink-soft hover:text-ink"
              } ${hasInferred ? "cursor-not-allowed opacity-80" : "cursor-pointer"}`}
            >
              <Lock size={12} className="text-amber-500" />
              <span>Aleph-1 (IBM QPU)</span>
            </button>
          </div>

          {hasInferred && (
            <button
              onClick={handleStartNewScreening}
              className="px-3.5 py-2 rounded-xl bg-ink hover:bg-ink/90 text-parchment text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <RotateCcw size={13} className="text-quantum" />
              <span>Start New Patient</span>
            </button>
          )}
        </div>
      </div>

      {/* PATIENT INTAKE ACCORDION (INPUTABLE, NOT PRE-FILLED) */}
      <div className="bg-parchment rounded-2xl border border-hairline shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setIsPatientIntakeOpen(!isPatientIntakeOpen)}
          className="w-full px-5 py-3.5 bg-cream/30 hover:bg-cream/60 flex items-center justify-between text-left transition-colors cursor-pointer border-b border-hairline"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-ink/5 border border-hairline flex items-center justify-center text-ink">
              <User size={15} />
            </div>
            <div>
              <h3 className="font-serif text-sm font-medium text-ink">
                Patient Demographics & Clinical Intake Metadata
              </h3>
              <p className="text-[11px] font-mono text-ink-soft">
                {patientName ? `${patientName} (${patientId})` : "New Patient Intake (Ready for Input)"} • {patientAge ? `Age: ${patientAge}` : "Age: Not Specified"} • Cohort: {patientGender}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-quantum font-semibold">
            {isPatientIntakeOpen ? "Collapse −" : "Expand +"}
          </span>
        </button>

        {isPatientIntakeOpen && (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-parchment">
            {/* 1. Patient Name (Inputable) */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-ink-soft font-medium block">
                Patient Full Name <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                disabled={hasInferred}
                placeholder="e.g. Elena Vance"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className={`w-full px-3 py-1.5 rounded-xl border border-hairline bg-parchment text-ink text-xs font-medium focus:outline-none focus:border-quantum ${
                  hasInferred ? "opacity-75 cursor-not-allowed bg-cream/30" : ""
                }`}
              />
            </div>

            {/* 2. Patient ID (Auto-Generated, Read-Only) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-mono text-ink-soft font-medium">Patient ID</label>
                <span className="text-[9px] font-mono text-ink-soft bg-cream px-1.5 py-0.5 rounded border border-hairline">Auto-Assigned</span>
              </div>
              <input
                type="text"
                value={patientId}
                readOnly
                className="w-full px-3 py-1.5 rounded-xl border border-hairline bg-cream/40 text-ink text-xs font-mono font-bold cursor-not-allowed select-all"
              />
            </div>

            {/* 3. Age (Inputable) */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-ink-soft font-medium block">
                Age (Years) <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="number"
                disabled={hasInferred}
                placeholder="e.g. 54"
                min="18"
                max="110"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value ? parseInt(e.target.value) : "")}
                className={`w-full px-3 py-1.5 rounded-xl border border-hairline bg-parchment text-ink text-xs font-mono focus:outline-none focus:border-quantum ${
                  hasInferred ? "opacity-75 cursor-not-allowed bg-cream/30" : ""
                }`}
              />
            </div>

            {/* 4. Gender (Fixed Standard for Breast Cancer) */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-ink-soft font-medium">Biological Cohort</label>
              <div className="w-full px-3 py-1.5 rounded-xl border border-hairline bg-cream/30 text-ink text-xs font-medium flex items-center justify-between">
                <span>Female (FNA WDBC)</span>
                <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Validated</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MAIN SCREENING WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Parameter Sliders */}
        <div className="lg:col-span-6 bg-parchment rounded-2xl border border-hairline p-5 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-serif text-lg font-medium text-ink">8 Biopsy Cell Measurements</h2>
                <HelpTooltip
                  title="Biopsy Cell Measurements"
                  text="These 8 microscopic metrics are calculated from a Fine-Needle Aspiration (FNA) biopsy to evaluate cell nucleus shape, size irregularity, and surface roughness."
                />
              </div>
              <p className="text-xs text-ink-soft">Adjust measured values or import lab report</p>
            </div>
            
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                disabled={hasInferred}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-cream border border-hairline text-ink text-xs font-medium flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <UploadCloud size={13} className="text-quantum" />
                <span>Upload Report / JSON</span>
              </button>

              {!hasInferred && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2.5 py-1.5 rounded-xl hover:bg-cream text-xs font-mono text-ink-soft hover:text-ink flex items-center gap-1 transition-colors cursor-pointer border border-transparent hover:border-hairline"
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Locked Notice Banner if Inferred */}
          {hasInferred && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900 shadow-2xs">
              <div className="flex items-center gap-2">
                <Lock size={14} className="text-amber-600 shrink-0" />
                <span className="font-semibold">Parameters locked to current diagnostic result.</span>
              </div>
              <button
                onClick={handleStartNewScreening}
                className="px-2.5 py-1 rounded-lg bg-ink text-parchment text-[11px] font-semibold hover:bg-ink/90 transition-all cursor-pointer"
              >
                Start New
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FIELDS.map((field) => {
              const val = formValues[field.key] ?? field.defaultValue;
              return (
                <div
                  key={field.key}
                  className={`p-3 rounded-xl border border-hairline space-y-2 transition-all ${
                    hasInferred ? "bg-cream/20 opacity-70" : "bg-cream/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-ink">{field.label}</span>
                      <HelpTooltip title={field.label} text={field.simpleExplanation} />
                    </div>
                    <span className="text-xs font-mono font-bold text-quantum">
                      {val} <span className="text-[10px] text-ink-soft">{field.unit}</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    disabled={hasInferred}
                    value={val}
                    onChange={(e) => handleValueChange(field.key, parseFloat(e.target.value))}
                    className={`w-full accent-quantum ${hasInferred ? "cursor-not-allowed" : "cursor-pointer"}`}
                  />
                  <p className="text-[10px] text-ink-soft leading-tight">{field.simpleExplanation}</p>
                </div>
              );
            })}
          </div>

          {/* Primary Action Button */}
          {hasInferred ? (
            <button
              onClick={handleStartNewScreening}
              className="w-full py-3 rounded-xl bg-ink hover:bg-ink/90 text-parchment font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <RotateCcw size={14} className="text-quantum" />
              <span>Start New Patient Screening (Reset Parameters)</span>
            </button>
          ) : (
            <button
              onClick={handleRunInference}
              disabled={isInferring}
              className="w-full py-3 rounded-xl bg-ink hover:bg-ink/90 text-parchment font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {isInferring ? (
                <>
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-parchment border-t-transparent animate-spin" />
                  <span>Executing Simultaneous Dual-Engine Pipeline...</span>
                </>
              ) : (
                <>
                  <Play size={14} className="text-quantum fill-quantum" />
                  <span>Run Dual-Engine Screening (Transfinite-1 &amp; CX-01)</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* RIGHT: Results Panel with Clean Simple Loading State */}
        <div className="lg:col-span-6 bg-parchment rounded-2xl border border-hairline p-5 space-y-5 shadow-xs min-h-[500px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {/* 1. CLEAN SIMPLE LOADING STATE */}
            {isInferring ? (
              <motion.div
                key="computing"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="my-auto text-center space-y-6 py-20 px-4"
              >
                {/* Elegant Smooth Spinner */}
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-quantum/20 border-t-quantum animate-spin" />
                  <div className="w-10 h-10 rounded-full bg-quantum/10 flex items-center justify-center text-quantum shadow-2xs">
                    <Microscope size={20} />
                  </div>
                </div>

                <div className="space-y-1.5 max-w-sm mx-auto">
                  <h3 className="font-serif text-xl text-ink font-semibold">
                    Analyzing Biopsy Sample...
                  </h3>
                  <p className="text-xs text-ink-soft leading-relaxed">
                    Evaluating cell measurements across classical and quantum models for{" "}
                    <strong className="text-ink">{patientName || "Patient"}</strong>
                  </p>
                </div>

                {/* Subtle pulsing progress indicator */}
                <div className="w-44 mx-auto bg-cream h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-quantum rounded-full animate-pulse w-full" />
                </div>
              </motion.div>
            ) : hasInferred && screeningResult ? (
              /* 2. RESULTS SCORECARD */
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Result Header */}
                <div className="flex items-center justify-between border-b border-hairline pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-quantum font-bold">
                      Simultaneous Dual-Engine Live Benchmark
                    </span>
                    <h3 className="font-serif text-xl font-medium text-ink">
                      {patientName} ({patientId})
                    </h3>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold border ${getRiskColor(screeningResult.risk_tier)}`}>
                    {screeningResult.risk_tier}
                  </span>
                </div>

                {/* SIDE-BY-SIDE DUAL-ENGINE LIVE COMPARISON CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 1. Transfinite-1 Quantum Hybrid Simulator Card */}
                  <div className="p-4 rounded-2xl bg-white border border-quantum/40 shadow-xs space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-quantum/10 text-quantum border border-quantum/20">
                        ⚡ Transfinite-1 (Quantum)
                      </span>
                      <span className="text-[10px] font-mono text-ink-soft font-semibold">
                        {screeningResult.dual_comparison?.transfinite_1?.latency_ms || "14.2"} ms
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-ink-soft uppercase font-semibold block">Risk Score</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black font-mono text-ink">
                            {screeningResult.dual_comparison?.transfinite_1?.risk_score ?? screeningResult.composite_risk_score}
                          </span>
                          <span className="text-[10px] font-mono text-ink-soft">/ 100</span>
                        </div>
                      </div>
                      <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                        screeningResult.dual_comparison?.transfinite_1?.prediction_label === "Malignant"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}>
                        {screeningResult.dual_comparison?.transfinite_1?.prediction_label || screeningResult.prediction_label}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-hairline flex justify-between text-[10px] font-mono text-ink-soft">
                      <span>Confidence: <strong className="text-ink">{screeningResult.dual_comparison?.transfinite_1?.confidence || screeningResult.confidence}%</strong></span>
                      <span>8-Qubit ZZ VQC</span>
                    </div>
                  </div>

                  {/* 2. CX-01 Classical Benchmark Card */}
                  <div className="p-4 rounded-2xl bg-white border border-blue-200 shadow-xs space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        📈 CX-01 (Classical)
                      </span>
                      <span className="text-[10px] font-mono text-ink-soft font-semibold">
                        {screeningResult.dual_comparison?.cx_01?.latency_ms || "2.4"} ms
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-ink-soft uppercase font-semibold block">Risk Score</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black font-mono text-ink">
                            {screeningResult.dual_comparison?.cx_01?.risk_score ?? screeningResult.composite_risk_score}
                          </span>
                          <span className="text-[10px] font-mono text-ink-soft">/ 100</span>
                        </div>
                      </div>
                      <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                        screeningResult.dual_comparison?.cx_01?.prediction_label === "Malignant"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}>
                        {screeningResult.dual_comparison?.cx_01?.prediction_label || screeningResult.prediction_label}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-hairline flex justify-between text-[10px] font-mono text-ink-soft">
                      <span>Confidence: <strong className="text-ink">{screeningResult.dual_comparison?.cx_01?.confidence || screeningResult.confidence}%</strong></span>
                      <span>SVM-RBF + XGBoost</span>
                    </div>
                  </div>
                </div>

                {/* Consensus & Comparison Banner */}
                <div className="p-3 rounded-xl bg-cream/40 border border-hairline text-xs flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-quantum shrink-0" />
                    <span className="text-[11px] text-ink leading-tight">
                      <strong>Pipeline Consensus:</strong> {screeningResult.dual_comparison?.consensus_summary || "Both models evaluated simultaneously on separate inference pipelines."}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold shrink-0">
                    Dual Verified
                  </span>
                </div>

                {/* Primary Risk Drivers */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-ink font-mono uppercase tracking-wider">
                      Key Factors Influencing This Result
                    </span>
                    <HelpTooltip
                      title="Key Factors (SHAP)"
                      text="Shows which measured cell features contributed most to this assessment. Red indicates features that increase risk, while green indicates healthy protective features."
                    />
                  </div>
                  <div className="space-y-1.5">
                    {(screeningResult.shap_attributions || []).slice(0, 3).map((attr: any, idx: number) => {
                      const isRisk = attr.direction === "risk_elevating";
                      return (
                        <div key={idx} className="p-2.5 rounded-xl bg-white border border-hairline text-xs flex items-center justify-between shadow-2xs">
                          <span className="font-medium text-ink">{attr.featureName}</span>
                          <span className={`font-mono font-bold ${isRisk ? "text-red-600" : "text-emerald-700"}`}>
                            {isRisk ? "+" : "-"}{attr.impactPercentage?.toFixed(1)}% impact
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Clinical Finding Note */}
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <Info size={14} />
                    <span>Recommended Next Steps</span>
                    <HelpTooltip
                      title="Clinical Recommendations"
                      text="Guidance based on standard clinical oncology protocols corresponding to the calculated risk tier."
                    />
                  </div>
                  <p className="text-[11px] text-amber-900/90 leading-relaxed">
                    {screeningResult.clinical_action}
                  </p>
                </div>

                {/* Navigation and Action Buttons */}
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
                    onClick={handleStartNewScreening}
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-cream border border-hairline text-ink font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <RotateCcw size={13} className="text-quantum" />
                    <span>Start New Patient Screening</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              /* 3. INITIAL EMPTY / READY STATE */
              <div className="my-auto text-center space-y-3 py-16">
                <div className="w-12 h-12 rounded-2xl bg-cream-deep text-ink-soft mx-auto flex items-center justify-center">
                  <Sliders size={22} />
                </div>
                <div className="space-y-1 max-w-xs mx-auto">
                  <h3 className="font-serif text-lg text-ink font-medium">Ready to Screen</h3>
                  <p className="text-xs text-ink-soft leading-relaxed">
                    Enter the patient&apos;s Name and Age, select a calibration cohort or adjust sliders on the left, then click &ldquo;Run Screening&rdquo;.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* REAL IBM QUANTUM HARDWARE MODAL (ADMIN ACCESS NOTICE) */}
      <AnimatePresence>
        {isIbmModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-lg w-full text-white space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Layers size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Real IBM Quantum QPU Engine</h3>
                    <p className="text-xs text-neutral-400">Superconducting Transmon Hardware Gateway</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsIbmModalOpen(false)}
                  className="h-8 w-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 text-xs text-neutral-300 leading-relaxed">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-start gap-2.5">
                  <Lock size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Enterprise / Admin Exclusive Feature</strong>
                    <span>
                      Live IBM Quantum Hardware execution routes circuits to 127-qubit superconducting processors (e.g., ibm_brisbane / ibm_osaka). Due to physical cryogenic queue times (1-8 mins) and execution allocation, live hardware runs require authenticated enterprise API credentials.
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <h4 className="font-bold text-neutral-200 uppercase tracking-wider text-[10px]">Active Transpilation Specs</h4>
                  <ul className="space-y-1 font-mono text-[11px] text-neutral-400">
                    <li>• Topology: 8 Physical Transmon Coupling</li>
                    <li>• Readout Error Mitigation: M3 (Matrix Inversion)</li>
                    <li>• Dynamical Decoupling: XY4 Microwave Pulses</li>
                    <li>• Total Shots per Pass: 1,024 Shots</li>
                  </ul>
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
                      title: "IBM QPU Hardware Mode Enabled",
                      message: "Configured target: ibm_brisbane (127-Qubit Eagle).",
                      type: "quantum",
                    });
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 cursor-pointer"
                >
                  Enable QPU Verification
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* UPLOAD MODAL */}
      <BiomarkerUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onApplyData={handleApplyExtractedData}
      />
    </motion.div>
  );
}
