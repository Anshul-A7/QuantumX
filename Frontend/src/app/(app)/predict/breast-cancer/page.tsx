"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  ArrowLeft,
  Cpu,
  Activity,
  Zap,
  Sliders,
  RotateCcw,
  FlaskConical,
  CheckCircle2,
  Download,
  Info,
  UploadCloud,
  Calculator,
  Link2,
  Unlink2,
  X,
  User,
  Calendar,
  Hash,
  RefreshCw,
  Phone,
  FileCheck2,
  ChevronRight,
  Eye,
  ShieldCheck,
  Layers,
  Lock,
  ExternalLink,
  Microscope,
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
  { key: "radius_mean", label: "Cell Size (Radius)", min: 6.0, max: 30.0, step: 0.1, defaultValue: 17.99, unit: "μm", description: "Mean distances from center to perimeter points", simpleExplanation: "Average radius of the cell nucleus under microscope." },
  { key: "texture_mean", label: "Surface Texture", min: 9.0, max: 40.0, step: 0.1, defaultValue: 10.38, unit: "std", description: "Standard deviation of gray-scale values", simpleExplanation: "Variation in gray-scale texture across the cell." },
  { key: "perimeter_mean", label: "Cell Perimeter", min: 40.0, max: 190.0, step: 0.5, defaultValue: 122.8, unit: "μm", description: "Mean size of the core tumor perimeter", simpleExplanation: "Total boundary length around the cell nucleus." },
  { key: "area_mean", label: "Nuclear Area", min: 140.0, max: 2500.0, step: 1.0, defaultValue: 1001.0, unit: "μm²", description: "Mean nuclear spatial area", simpleExplanation: "Total two-dimensional area of the nucleus." },
  { key: "smoothness_mean", label: "Border Smoothness", min: 0.05, max: 0.25, step: 0.005, defaultValue: 0.1184, unit: "idx", description: "Local variation in radius lengths", simpleExplanation: "How smooth or jagged the cell boundary appears." },
  { key: "compactness_mean", label: "Compactness", min: 0.01, max: 0.35, step: 0.005, defaultValue: 0.2776, unit: "idx", description: "Perimeter² / area - 1.0", simpleExplanation: "Measure of how dense and tightly packed the cell is." },
  { key: "concavity_mean", label: "Indentation Depth", min: 0.0, max: 0.45, step: 0.005, defaultValue: 0.3001, unit: "idx", description: "Severity of concave portions of contour", simpleExplanation: "How deep the inward curves/indentations are." },
  { key: "concave_points_mean", label: "Indentation Count", min: 0.0, max: 0.25, step: 0.005, defaultValue: 0.1471, unit: "cnt", description: "Number of concave portions of contour", simpleExplanation: "Total number of inward irregular notches on the cell." },
];

const PRESETS = [
  {
    name: "Case A: Clear Low Risk (Ananya Mehta)",
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

  // Patient Demographics State
  const [patientName, setPatientName] = useState("Elena Vance");
  const [patientId, setPatientId] = useState("");
  const [patientAge, setPatientAge] = useState<number>(54);
  const [patientGender, setPatientGender] = useState("Female");
  const [intakeDate, setIntakeDate] = useState("");
  const [accessionNumber, setAccessionNumber] = useState("");
  const [contactNumber, setContactNumber] = useState("+91 98765 43210");
  const [isPatientIntakeOpen, setIsPatientIntakeOpen] = useState(true);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [linkGeometry, setLinkGeometry] = useState(false);
  const [inlineHelperKey, setInlineHelperKey] = useState<string | null>(null);

  const [isInferring, setIsInferring] = useState(false);
  const [hasInferred, setHasInferred] = useState(false);
  const [screeningResult, setScreeningResult] = useState<any>(null);
  const [aiSynthesis, setAiSynthesis] = useState<any>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [activeTab, setActiveTab] = useState<"form" | "circuit">("form");

  const handleNavigateToAnalysis = () => {
    try {
      const payload = {
        patientInfo: {
          name: patientName,
          patient_id: patientId,
          age: patientAge,
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

  useEffect(() => {
    const initial: Record<string, number> = {};
    FIELDS.forEach((f) => {
      initial[f.key] = f.defaultValue;
    });
    setFormValues(initial);
    generateNewPatientIdentity();
  }, []);

  const generateNewPatientIdentity = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setPatientId(`QX-BC-${randomSuffix}`);
    setAccessionNumber(`ACC-2026-08${Math.floor(10 + Math.random() * 90)}`);
    setIntakeDate(new Date().toISOString().split("T")[0]);
  };

  const handleSelectPreset = (preset: typeof PRESETS[0]) => {
    setFormValues(preset.values);
    setDerivedNotes({});
    setSelectedPresetName(preset.name);
    setPatientName(preset.patientName);
    setPatientAge(preset.patientAge);
    setPatientGender(preset.patientGender);
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

    const name = metadata.patientName || patientName;
    const id = metadata.patientId || patientId;
    const age = metadata.patientAge || patientAge;
    const gender = metadata.patientGender || patientGender;
    const date = metadata.intakeDate || intakeDate;
    const acc = metadata.accessionNumber || accessionNumber;

    if (metadata.patientId) setPatientId(metadata.patientId);
    if (metadata.patientName) setPatientName(metadata.patientName);
    if (metadata.patientAge) setPatientAge(metadata.patientAge);
    if (metadata.patientGender) setPatientGender(metadata.patientGender);
    if (metadata.intakeDate) setIntakeDate(metadata.intakeDate);
    if (metadata.accessionNumber) setAccessionNumber(metadata.accessionNumber);

    showToast({
      title: "Report Imported & Analyzed",
      message: `Extracted 8 biomarkers for ${name}. Running dual-engine screening...`,
      type: "quantum",
    });

    executeInferenceEngine(extractedValues, name, id, age, gender, date, acc);
  };

  const handleRunInference = () => {
    executeInferenceEngine(
      formValues,
      patientName,
      patientId,
      patientAge,
      patientGender,
      intakeDate,
      accessionNumber
    );
  };

  const handleValueChange = (key: string, numVal: number, fromDerivation?: string) => {
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

  const executeInlineDerivation = (targetKey: string, method: string) => {
    const currentRadius = formValues.radius_mean || 17.99;
    const currentArea = formValues.area_mean || 1001.0;
    const currentPerim = formValues.perimeter_mean || 122.8;

    if (method === "from_area" && targetKey === "radius_mean") {
      const calcR = Math.sqrt(currentArea / Math.PI);
      handleValueChange("radius_mean", parseFloat(calcR.toFixed(2)), "Derived from Nuclear Area: r = √(A/π)");
    } else if (method === "from_perimeter" && targetKey === "radius_mean") {
      const calcR = currentPerim / (2 * Math.PI);
      handleValueChange("radius_mean", parseFloat(calcR.toFixed(2)), "Derived from Perimeter: r = P / 2π");
    } else if (method === "from_radius" && targetKey === "area_mean") {
      const calcA = Math.PI * Math.pow(currentRadius, 2);
      handleValueChange("area_mean", parseFloat(calcA.toFixed(1)), "Derived from Radius: A = πr²");
    } else if (method === "from_radius" && targetKey === "perimeter_mean") {
      const calcP = 2 * Math.PI * currentRadius;
      handleValueChange("perimeter_mean", parseFloat(calcP.toFixed(1)), "Derived from Radius: P = 2πr");
    } else if (method === "cohort_median") {
      const fieldObj = FIELDS.find((f) => f.key === targetKey);
      if (fieldObj) {
        handleValueChange(targetKey, fieldObj.defaultValue, `Applied Cohort Baseline: ${fieldObj.defaultValue} ${fieldObj.unit}`);
      }
    }
    setInlineHelperKey(null);
  };

  const handleReset = () => {
    const initial: Record<string, number> = {};
    FIELDS.forEach((f) => {
      initial[f.key] = f.defaultValue;
    });
    setFormValues(initial);
    setDerivedNotes({});
    setSelectedPresetName(null);
    setHasInferred(false);
    setScreeningResult(null);
  };

  const getRiskColor = (tier: string) => {
    if (tier?.includes("HIGH")) return "text-red-500 bg-red-500/10 border-red-500/20";
    if (tier?.includes("BORDERLINE") || tier?.includes("INDETERMINATE")) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 pb-12 w-full"
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
              <Sparkles size={20} />
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
                Fine-Needle Aspiration (FNA) Nuclear Morphometry • Wisconsin Diagnostic Breast Cancer (WDBC)
              </p>
            </div>
          </div>
        </div>

        {/* Global Import Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-parchment hover:bg-cream border border-hairline text-ink text-xs font-medium flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <UploadCloud size={14} className="text-quantum" />
            <span>Import Lab Report / JSON</span>
          </button>
        </div>
      </div>

      {/* DUAL-ENGINE ARCHITECTURE SELECTION BAR */}
      <div className="bg-parchment rounded-2xl border border-hairline p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-ink-soft uppercase tracking-wider font-mono">
            Active Engine:
          </span>
          <div className="inline-flex p-1 rounded-xl bg-cream border border-hairline">
            <button
              onClick={() => setSelectedModelFamily("quantumx_hybrid_v1")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                selectedModelFamily === "quantumx_hybrid_v1"
                  ? "bg-ink text-parchment shadow-xs"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <Zap size={13} className="text-quantum" />
              <span>Quantum Hybrid</span>
            </button>
            <button
              onClick={() => setSelectedModelFamily("aegis_classical_v1")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                selectedModelFamily === "aegis_classical_v1"
                  ? "bg-ink text-parchment shadow-xs"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <Activity size={13} className="text-blue-400" />
              <span>CX-01 (Classical)</span>
            </button>
          </div>
        </div>

        {/* Quantum Execution Mode (Only when Quantum Hybrid selected) */}
        {selectedModelFamily === "quantumx_hybrid_v1" ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ink-soft uppercase tracking-wider font-mono">
              Quantum Target:
            </span>
            <div className="inline-flex p-1 rounded-xl bg-cream border border-hairline">
              <button
                onClick={() => setExecutionMode("simulator")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  executionMode === "simulator"
                    ? "bg-quantum text-black shadow-xs font-bold"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                <Cpu size={13} />
                <span>Transfinite-1 (Simulator)</span>
              </button>
              <button
                onClick={() => setIsIbmModalOpen(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  executionMode === "real_ibm_qpu"
                    ? "bg-purple-600 text-white shadow-xs font-bold"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                <Lock size={12} className="text-amber-500" />
                <span>Aleph-1 (IBM QPU)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-xs text-ink-soft font-mono">
            <span>Baseline Engine: CX-01 (SVM-RBF + XGBoost Ensemble)</span>
          </div>
        )}
      </div>

      {/* PATIENT INTAKE ACCORDION */}
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
                Patient Demographics & Medical Case Metadata
              </h3>
              <p className="text-[11px] font-mono text-ink-soft">
                {patientName} ({patientId || "Unassigned"}) • Age: {patientAge} • Gender: {patientGender}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-quantum">
            {isPatientIntakeOpen ? "Collapse −" : "Expand +"}
          </span>
        </button>

        {isPatientIntakeOpen && (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-parchment">
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-ink-soft">Patient Full Name</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-hairline bg-parchment text-ink text-xs font-medium focus:outline-none focus:border-quantum"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-ink-soft">Patient ID</label>
              <input
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-hairline bg-parchment text-ink text-xs font-mono focus:outline-none focus:border-quantum"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-ink-soft">Age (Years)</label>
              <input
                type="number"
                value={patientAge}
                onChange={(e) => setPatientAge(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-1.5 rounded-xl border border-hairline bg-parchment text-ink text-xs font-mono focus:outline-none focus:border-quantum"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-ink-soft">Gender</label>
              <select
                value={patientGender}
                onChange={(e) => setPatientGender(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-hairline bg-parchment text-ink text-xs font-medium focus:outline-none focus:border-quantum"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* BENCHMARK PRESET SELECTORS */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-ink-soft font-semibold">
          Scientific Calibration Cohorts (WDBC Ground Truth)
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handleSelectPreset(preset)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
                selectedPresetName === preset.name
                  ? "border-quantum bg-quantum/5 ring-1 ring-quantum"
                  : "border-hairline bg-parchment hover:bg-cream"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-ink">{preset.patientName}</span>
                <span className="text-[10px] font-mono text-quantum font-semibold">Load Case</span>
              </div>
              <p className="text-[11px] text-ink-soft line-clamp-2 leading-relaxed">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* MAIN SCREENING WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Parameter Sliders */}
        <div className="lg:col-span-6 bg-parchment rounded-2xl border border-hairline p-5 space-y-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-hairline pb-3">
            <div>
              <h2 className="font-serif text-lg font-medium text-ink">8 Morphometric Biomarkers</h2>
              <p className="text-xs text-ink-soft">Adjust parameters or use automatic circular geometry coupling</p>
            </div>
            <button
              onClick={handleReset}
              className="text-xs font-mono text-ink-soft hover:text-ink flex items-center gap-1 transition-colors"
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FIELDS.map((field) => {
              const val = formValues[field.key] ?? field.defaultValue;
              return (
                <div key={field.key} className="p-3 rounded-xl bg-cream/30 border border-hairline space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-ink">{field.label}</span>
                    <span className="text-xs font-mono font-bold text-quantum">
                      {val} <span className="text-[10px] text-ink-soft">{field.unit}</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={val}
                    onChange={(e) => handleValueChange(field.key, parseFloat(e.target.value))}
                    className="w-full accent-quantum cursor-pointer"
                  />
                  <p className="text-[10px] text-ink-soft leading-tight">{field.simpleExplanation}</p>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleRunInference}
            disabled={isInferring}
            className="w-full py-3 rounded-xl bg-ink hover:bg-ink/90 text-parchment font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            {isInferring ? (
              <>
                <div className="h-3.5 w-3.5 rounded-full border-2 border-parchment border-t-transparent animate-spin" />
                <span>Processing {selectedModelFamily === "quantumx_hybrid_v1" ? (executionMode === "real_ibm_qpu" ? "Aleph-1" : "Transfinite-1") : "CX-01"} Telemetry...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} className="text-quantum" />
                <span>Run {selectedModelFamily === "quantumx_hybrid_v1" ? (executionMode === "real_ibm_qpu" ? "Aleph-1 (IBM QPU)" : "Transfinite-1 (Quantum)") : "CX-01 (Classical)"} Screening</span>
              </>
            )}
          </button>
        </div>

        {/* RIGHT: Results Panel */}
        <div className="lg:col-span-6 bg-parchment rounded-2xl border border-hairline p-5 space-y-5 shadow-xs min-h-[480px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {isInferring ? (
              <div className="my-auto text-center space-y-3 py-16">
                <div className="w-12 h-12 rounded-2xl bg-quantum/10 border border-quantum/30 text-quantum mx-auto flex items-center justify-center animate-pulse">
                  <Cpu size={24} />
                </div>
                <h3 className="font-serif text-lg text-ink font-medium">
                  Evaluating Telemetry for {patientName}...
                </h3>
                <p className="text-xs text-ink-soft font-mono">
                  Executing {selectedModelFamily} across high-dimensional feature space
                </p>
              </div>
            ) : hasInferred && screeningResult ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Result Header */}
                <div className="flex items-center justify-between border-b border-hairline pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-quantum font-bold">
                      {screeningResult.engine} • {screeningResult.execution_mode?.toUpperCase()}
                    </span>
                    <h3 className="font-serif text-xl font-medium text-ink">
                      {patientName} ({patientId})
                    </h3>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold border ${getRiskColor(screeningResult.risk_tier)}`}>
                    {screeningResult.risk_tier}
                  </span>
                </div>

                {/* Risk Score Meter */}
                <div className="p-4 rounded-2xl bg-cream/40 border border-hairline flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-ink-soft uppercase tracking-wider font-mono">
                      Continuous Clinical Risk Score
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black font-mono text-ink">
                        {screeningResult.composite_risk_score}
                      </span>
                      <span className="text-xs text-ink-soft font-mono">/ 100.0</span>
                    </div>
                    <p className="text-[11px] text-ink-soft">
                      Confidence: <strong className="text-ink">{screeningResult.confidence}%</strong> • Latency: <strong className="text-ink">{screeningResult.latency_ms} ms</strong>
                    </p>
                  </div>
                  <div className="h-16 w-16 rounded-2xl bg-parchment border border-hairline flex flex-col items-center justify-center shadow-inner">
                    <span className="text-xs font-mono font-bold text-quantum">
                      {screeningResult.prediction_label}
                    </span>
                  </div>
                </div>

                {/* Primary Risk Drivers */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-ink font-mono uppercase tracking-wider">
                    Primary Morphometric Risk Drivers (SHAP)
                  </span>
                  <div className="space-y-1.5">
                    {(screeningResult.shap_attributions || []).slice(0, 3).map((attr: any, idx: number) => {
                      const isRisk = attr.direction === "risk_elevating";
                      return (
                        <div key={idx} className="p-2.5 rounded-xl bg-cream/30 border border-hairline text-xs flex items-center justify-between">
                          <span className="font-medium text-ink">{attr.featureName}</span>
                          <span className={`font-mono font-bold ${isRisk ? "text-red-500" : "text-emerald-600"}`}>
                            {isRisk ? "+" : "-"}{attr.impactPercentage?.toFixed(1)}% impact
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Clinical Finding Note */}
                <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
                    <Info size={14} />
                    <span>Clinical Finding Summary</span>
                  </div>
                  <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
                    {screeningResult.clinical_action}
                  </p>
                </div>

                {/* Prominent "View Complete Analysis" Hero Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleNavigateToAnalysis}
                    className="w-full py-3.5 px-4 rounded-xl bg-ink hover:bg-ink/90 text-parchment font-semibold text-xs flex items-center justify-between transition-all shadow-md cursor-pointer border border-ink"
                  >
                    <div className="flex items-center gap-2">
                      <Microscope size={16} className="text-quantum" />
                      <span>🔬 View Complete Diagnostic Analysis & Telemetry</span>
                    </div>
                    <ChevronRight size={15} className="text-parchment/70" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="my-auto text-center space-y-3 py-16">
                <div className="w-12 h-12 rounded-2xl bg-cream-deep text-ink-soft mx-auto flex items-center justify-center">
                  <Sliders size={22} />
                </div>
                <div className="space-y-1 max-w-xs mx-auto">
                  <h3 className="font-serif text-lg text-ink font-medium">Ready to Screen</h3>
                  <p className="text-xs text-ink-soft leading-relaxed">
                    Select a preset case or adjust sliders on the left, then click &ldquo;Run Screening&rdquo; to execute the model.
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
                    <Cpu size={20} />
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
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold"
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
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30"
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
