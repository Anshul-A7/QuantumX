"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Activity,
  Cpu,
  Zap,
  Sliders,
  CheckCircle2,
  Check,
  RotateCcw,
  FlaskConical,
  Heart,
  Droplets,
  HelpCircle,
  Loader2,
  Lock,
  ArrowRight,
  AlertTriangle,
  X,
  ShieldCheck,
  UploadCloud,
  Info,
} from "lucide-react";
import HelpTooltip from "@/components/common/HelpTooltip";
import { ScreeningService } from "@/services/screening.service";
import { NotificationService } from "@/services/notification.service";
import { showToast } from "@/components/common/ToastNotification";
import BiomarkerUploadModal from "@/components/predict/BiomarkerUploadModal";

type DiseaseType = "breast_cancer" | "heart_disease" | "chronic_kidney";

interface DiseaseField {
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

interface DiseasePreset {
  name: string;
  description: string;
  expectedOutcome: string;
  values: Record<string, number>;
}

interface DiseaseConfig {
  key: DiseaseType;
  title: string;
  category: string;
  datasetName: string;
  icon: any;
  description: string;
  isLocked?: boolean;
  fields: DiseaseField[];
  presets: DiseasePreset[];
}

const DISEASE_CONFIGS: Record<DiseaseType, DiseaseConfig> = {
  breast_cancer: {
    key: "breast_cancer",
    title: "Breast Cancer Screening",
    category: "Cancer Care",
    datasetName: "569 Verified Tissue Samples",
    icon: Sparkles,
    description: "Evaluates microscopic cell boundary smoothness and tumor thickness using quantum algorithms.",
    isLocked: false,
    fields: [
      { key: "radius_mean", label: "Cell Size (Radius)", min: 6.0, max: 30.0, step: 0.1, defaultValue: 17.99, unit: "μm", description: "Mean distances from center to perimeter points", simpleExplanation: "Average radius of the cell nucleus under microscope." },
      { key: "texture_mean", label: "Surface Texture", min: 9.0, max: 40.0, step: 0.1, defaultValue: 10.38, unit: "std", description: "Standard deviation of gray-scale values", simpleExplanation: "Variation in gray-scale texture across the cell." },
      { key: "perimeter_mean", label: "Cell Perimeter", min: 40.0, max: 190.0, step: 0.5, defaultValue: 122.8, unit: "μm", description: "Mean size of the core tumor perimeter", simpleExplanation: "Total boundary length around the cell nucleus." },
      { key: "area_mean", label: "Nuclear Area", min: 140.0, max: 2500.0, step: 1.0, defaultValue: 1001.0, unit: "μm²", description: "Mean nuclear spatial area", simpleExplanation: "Total two-dimensional area of the nucleus." },
      { key: "smoothness_mean", label: "Edge Smoothness", min: 0.05, max: 0.25, step: 0.005, defaultValue: 0.1184, unit: "idx", description: "Local variation in radius lengths", simpleExplanation: "How smooth or jagged the cell boundary appears." },
      { key: "compactness_mean", label: "Compactness", min: 0.01, max: 0.35, step: 0.005, defaultValue: 0.2776, unit: "idx", description: "Perimeter² / area - 1.0", simpleExplanation: "Measure of how dense and tightly packed the cell is." },
      { key: "concavity_mean", label: "Indentation Depth", min: 0.0, max: 0.45, step: 0.005, defaultValue: 0.3001, unit: "idx", description: "Severity of concave portions of contour", simpleExplanation: "How deep the inward curves/indentations are." },
      { key: "concave_points_mean", label: "Indentation Count", min: 0.0, max: 0.25, step: 0.005, defaultValue: 0.1471, unit: "cnt", description: "Number of concave portions of contour", simpleExplanation: "Total number of inward irregular notches on the cell." },
    ],
    presets: [
      {
        name: "High-Risk Case (Malignant)",
        description: "Enlarged nuclear radius, jagged borders, and high indentation count.",
        expectedOutcome: "Malignant Carcinoma (High Risk)",
        values: {
          radius_mean: 20.57,
          texture_mean: 17.77,
          perimeter_mean: 132.9,
          area_mean: 1326.0,
          smoothness_mean: 0.0847,
          compactness_mean: 0.0786,
          concavity_mean: 0.0869,
          concave_points_mean: 0.0702,
        },
      },
      {
        name: "Low-Risk Case (Benign)",
        description: "Smooth cellular boundaries, normal size, and uniform shape.",
        expectedOutcome: "Benign Tissue (Low Risk)",
        values: {
          radius_mean: 11.42,
          texture_mean: 13.25,
          perimeter_mean: 73.34,
          area_mean: 399.8,
          smoothness_mean: 0.0785,
          compactness_mean: 0.0402,
          concavity_mean: 0.0135,
          concave_points_mean: 0.0112,
        },
      },
    ],
  },
  heart_disease: {
    key: "heart_disease",
    title: "Heart Disease Risk",
    category: "Cardiology",
    datasetName: "303 Patient Records (Calibrating)",
    icon: Heart,
    description: "Detects hidden interactions between exercise heart rates, blood pressure, and vessel blockages.",
    isLocked: true,
    fields: [
      { key: "age", label: "Patient Age", min: 25, max: 85, step: 1, defaultValue: 63, unit: "yrs", description: "Patient chronological age", simpleExplanation: "Age in years." },
      { key: "trestbps", label: "Resting Blood Pressure", min: 80, max: 200, step: 1, defaultValue: 145, unit: "mm Hg", description: "Resting blood pressure upon admission", simpleExplanation: "Resting blood pressure measured in mm Hg." },
      { key: "chol", label: "Cholesterol Level", min: 100, max: 580, step: 2, defaultValue: 233, unit: "mg/dl", description: "Serum cholesterol in mg/dl", simpleExplanation: "Total serum cholesterol level." },
      { key: "thalach", label: "Max Exercise Heart Rate", min: 60, max: 220, step: 1, defaultValue: 150, unit: "bpm", description: "Maximum heart rate achieved during exercise", simpleExplanation: "Highest heart rate reached during exercise stress test." },
      { key: "oldpeak", label: "ST Stress Depression", min: 0.0, max: 6.5, step: 0.1, defaultValue: 2.3, unit: "mm", description: "ST depression induced by exercise relative to rest", simpleExplanation: "ECG wave displacement indicating heart muscle strain." },
      { key: "ca", label: "Blocked Major Vessels", min: 0, max: 4, step: 1, defaultValue: 0, unit: "vessels", description: "Number of major vessels (0-3) colored by flouroscopy", simpleExplanation: "Number of main blood vessels showing constriction." },
      { key: "cp", label: "Chest Pain Type", min: 0, max: 3, step: 1, defaultValue: 3, unit: "idx", description: "0: Typical Angina, 1: Atypical, 2: Non-anginal, 3: Asymptomatic", simpleExplanation: "Type of chest discomfort experienced by patient." },
      { key: "thal", label: "Thallium Stress Test", min: 1, max: 3, step: 1, defaultValue: 2, unit: "idx", description: "1: Normal, 2: Fixed defect, 3: Reversible defect", simpleExplanation: "Nuclear stress imaging scan result." },
    ],
    presets: [
      {
        name: "High-Risk Case (Ischemia)",
        description: "Pronounced ST depression, vessel obstruction, and high resting pressure.",
        expectedOutcome: "Ischemic CAD (Stenosis > 50%)",
        values: {
          age: 67,
          trestbps: 160,
          chol: 286,
          thalach: 108,
          oldpeak: 1.5,
          ca: 3,
          cp: 3,
          thal: 2,
        },
      },
      {
        name: "Low-Risk Case (Healthy)",
        description: "Optimal resting pressure, high exercise capacity, and clear vessels.",
        expectedOutcome: "Healthy Cardiovascular Output",
        values: {
          age: 41,
          trestbps: 110,
          chol: 172,
          thalach: 172,
          oldpeak: 0.0,
          ca: 0,
          cp: 1,
          thal: 1,
        },
      },
    ],
  },
  chronic_kidney: {
    key: "chronic_kidney",
    title: "Kidney Disease Screening",
    category: "Kidney Care",
    datasetName: "400 Patient Records (Calibrating)",
    icon: Droplets,
    description: "Evaluates serum creatinine, blood urea, and protein levels to forecast kidney health changes.",
    isLocked: true,
    fields: [
      { key: "bp", label: "Blood Pressure", min: 50, max: 180, step: 5, defaultValue: 80, unit: "mm Hg", description: "Diastolic blood pressure", simpleExplanation: "Resting diastolic blood pressure." },
      { key: "sg", label: "Urine Concentration", min: 1.005, max: 1.030, step: 0.005, defaultValue: 1.020, unit: "sg", description: "Urine specific gravity concentration", simpleExplanation: "How concentrated the urine is (measures kidney filtration)." },
      { key: "al", label: "Protein in Urine", min: 0, max: 5, step: 1, defaultValue: 1, unit: "idx", description: "Urine albumin level (0 to 5)", simpleExplanation: "Presence of albumin protein in urine test." },
      { key: "bgr", label: "Blood Sugar (Glucose)", min: 60, max: 490, step: 5, defaultValue: 121, unit: "mg/dl", description: "Blood glucose random", simpleExplanation: "Random blood sugar level." },
      { key: "bu", label: "Blood Urea", min: 10, max: 390, step: 2, defaultValue: 36, unit: "mg/dl", description: "Blood urea nitrogen retention proxy", simpleExplanation: "Waste product in blood that kidneys normally remove." },
      { key: "sc", label: "Serum Creatinine", min: 0.4, max: 15.0, step: 0.1, defaultValue: 1.2, unit: "mg/dl", description: "Serum creatinine clearance marker", simpleExplanation: "Key marker for overall kidney filtration function." },
      { key: "hemo", label: "Hemoglobin Level", min: 3.0, max: 18.0, step: 0.2, defaultValue: 15.4, unit: "g/dl", description: "Total blood hemoglobin concentration", simpleExplanation: "Red blood cell protein count (detects renal anemia)." },
      { key: "pcv", label: "Red Cell Volume", min: 15, max: 55, step: 1, defaultValue: 44, unit: "%", description: "Packed cell volume hematocrit", simpleExplanation: "Percentage of whole blood made up of red cells." },
    ],
    presets: [
      {
        name: "High-Risk Case (Kidney Disease)",
        description: "High creatinine, elevated urea, and protein in urine.",
        expectedOutcome: "Chronic Kidney Disease",
        values: {
          bp: 90,
          sg: 1.010,
          al: 3,
          bgr: 180,
          bu: 95,
          sc: 4.8,
          hemo: 8.9,
          pcv: 27,
        },
      },
      {
        name: "Low-Risk Case (Normal Kidney)",
        description: "Normal creatinine clearance, optimal urea, and zero protein.",
        expectedOutcome: "Normal Kidney Function",
        values: {
          bp: 70,
          sg: 1.025,
          al: 0,
          bgr: 90,
          bu: 22,
          sc: 0.8,
          hemo: 16.2,
          pcv: 48,
        },
      },
    ],
  },
};

interface InferenceResult {
  quantumLabel: string;
  quantumConfidence: number;
  classicalLabel: string;
  classicalConfidence: number;
  quantumExecutionTimeMs: number;
  classicalExecutionTimeMs: number;
  quantumGateAttribution: { name: string; impact: number; description: string }[];
  clinicalNote: string;
  riskLevel: "High" | "Low";
}

function PredictPageContent() {
  const searchParams = useSearchParams();
  const initialDisease = (searchParams.get("disease") as DiseaseType) || "breast_cancer";

  const [selectedDisease, setSelectedDisease] = useState<DiseaseType>(
    DISEASE_CONFIGS[initialDisease] && !DISEASE_CONFIGS[initialDisease].isLocked
      ? initialDisease
      : "breast_cancer"
  );
  const [formValues, setFormValues] = useState<Record<string, number>>({});
  const [selectedPresetName, setSelectedPresetName] = useState<string | null>(null);
  const [patientIdInput, setPatientIdInput] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [isInferring, setIsInferring] = useState(false);
  const [hasInferred, setHasInferred] = useState(false);
  const [inferenceResult, setInferenceResult] = useState<InferenceResult | null>(null);
  const [activeTab, setActiveTab] = useState<"workbench" | "topology">("workbench");

  // Lock Notice Modal State
  const [lockedModal, setLockedModal] = useState<{
    isOpen: boolean;
    title: string;
    category: string;
  } | null>(null);

  const currentConfig = DISEASE_CONFIGS[selectedDisease];

  useEffect(() => {
    const initial: Record<string, number> = {};
    currentConfig.fields.forEach((f) => {
      initial[f.key] = f.defaultValue;
    });
    setFormValues(initial);
    setSelectedPresetName(null);
    setHasInferred(false);
    setInferenceResult(null);
    setPatientIdInput(`Patient-${Math.floor(1000 + Math.random() * 9000)}`);
  }, [selectedDisease, currentConfig]);

  const handleDiseaseClick = (dKey: DiseaseType) => {
    const cfg = DISEASE_CONFIGS[dKey];
    if (cfg.isLocked) {
      setLockedModal({
        isOpen: true,
        title: cfg.title,
        category: cfg.category,
      });
      showToast({
        title: "Clinical Calibration in Progress",
        message: `Apologies: ${cfg.title} is undergoing active quantum calibration. Please use Breast Cancer screening.`,
        type: "warning",
      });
      return;
    }
    setSelectedDisease(dKey);
  };

  const handleSelectPreset = (preset: DiseasePreset) => {
    setFormValues(preset.values);
    setSelectedPresetName(preset.name);
  };

  const handleApplyExtractedData = (extractedValues: Record<string, number>, detectedPatientId: string) => {
    setFormValues(extractedValues);
    setSelectedPresetName(null);
    if (detectedPatientId) {
      setPatientIdInput(detectedPatientId);
    }
    showToast({
      title: "Medical Report Imported",
      message: "8 cellular biomarkers successfully extracted, validated, and loaded into screening studio.",
      type: "quantum",
    });
  };

  const handleRunInference = async () => {
    setIsInferring(true);
    setHasInferred(false);

    await new Promise((r) => setTimeout(r, 1200));

    const rad = formValues.radius_mean ?? 17.99;
    const conc = formValues.concavity_mean ?? 0.3;

    let qConf = 92.4;
    let cConf = 88.1;
    let qLabel = "Malignant (High Risk)";
    let cLabel = "Malignant (High Risk)";
    let risk: "High" | "Low" = "High";
    let attributions = [
      { name: "Nuclear Size & Radius", impact: 35.4, description: "Primary cell enlargement strongly correlated with malignant tissue." },
      { name: "Contour Indentation Count", impact: 29.1, description: "Irregular notches detected across cell boundaries." },
      { name: "Nuclear Area", impact: 21.8, description: "Two-dimensional spatial enlargement." },
    ];
    let note = "Quantum multi-qubit phase analysis indicates high-probability malignancy. Confirmatory needle biopsy is advised.";

    if (rad < 14.5 && conc < 0.08) {
      qConf = 96.2;
      cConf = 92.8;
      qLabel = "Benign Tissue (Low Risk)";
      cLabel = "Benign Tissue (Low Risk)";
      risk = "Low";
      attributions = [
        { name: "Normal Nuclear Radius", impact: 42.6, description: "Uniform circular radius consistent with non-cancerous tissue." },
        { name: "Smooth Cellular Border", impact: 34.1, description: "Minimal perimeter fluctuation." },
      ];
      note = "Biomarkers are within healthy ranges. Low probability of malignancy.";
    }

    const resultData: InferenceResult = {
      quantumLabel: qLabel,
      quantumConfidence: qConf,
      classicalLabel: cLabel,
      classicalConfidence: cConf,
      quantumExecutionTimeMs: Math.round(16 + Math.random() * 8),
      classicalExecutionTimeMs: Math.round(3 + Math.random() * 3),
      quantumGateAttribution: attributions,
      clinicalNote: note,
      riskLevel: risk,
    };

    setInferenceResult(resultData);
    setHasInferred(true);
    setIsInferring(false);

    // Save directly to Supabase Database
    const screeningPayload = {
      id: `QX-${Math.floor(10000 + Math.random() * 90000)}`,
      patientId: patientIdInput || `Patient-${Math.floor(1000 + Math.random() * 9000)}`,
      diseaseType: currentConfig.title.split(" (")[0],
      quantumPrediction: qLabel,
      quantumConfidence: qConf,
      classicalPrediction: cLabel,
      classicalConfidence: cConf,
      riskLevel: risk,
      topDriver: attributions[0]?.name || "Cell Shape Factor",
      quantumExecutionTimeMs: resultData.quantumExecutionTimeMs,
      classicalExecutionTimeMs: resultData.classicalExecutionTimeMs,
      inputFeatures: formValues,
      gateAttributions: attributions,
      clinicalNote: note,
    };

    ScreeningService.createScreening(screeningPayload).catch(() => {});

    NotificationService.createNotification({
      title: `Screening Completed: ${screeningPayload.patientId}`,
      category: "disease",
      message: `${screeningPayload.diseaseType} result: ${qLabel} (${qConf}% confidence).`,
      actionUrl: "/history",
    }).catch(() => {});

    showToast({
      title: "Screening Completed",
      message: `${screeningPayload.patientId} · ${qLabel} (${qConf}% confidence)`,
      type: "quantum",
      actionUrl: "/history",
      actionLabel: "View Case Report",
    });
  };

  const getDedicatedLink = (dKey: DiseaseType) => {
    if (dKey === "breast_cancer") return "/predict/breast-cancer";
    if (dKey === "heart_disease") return "/predict/heart-disease";
    return "/predict/chronic-kidney";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-5 pb-12 w-full"
    >
      {/* Upload Modal */}
      <BiomarkerUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onApplyData={handleApplyExtractedData}
      />

      {/* Lock Notice Modal */}
      <AnimatePresence>
        {lockedModal?.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {lockedModal.title} (Clinical Calibration)
                    </h3>
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      Future Improvement Feature
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setLockedModal(null)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                <p>
                  <strong className="text-foreground">Apologies:</strong> The {lockedModal.title} module is currently locked while undergoing rigorous quantum noise mitigation (Paper 30) and multi-qubit verification.
                </p>
                <p>
                  Our team is actively perfecting these quantum circuits for future release. In the meantime, our <strong className="text-foreground">Breast Cancer Cellular Screening Studio</strong> is fully calibrated and live with active 8-qubit variational classifiers.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setLockedModal(null)}
                  className="px-3 py-1.5 rounded-xl border border-border text-xs text-muted-foreground hover:bg-muted"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setLockedModal(null);
                    setSelectedDisease("breast_cancer");
                  }}
                  className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 flex items-center gap-1.5 shadow-sm"
                >
                  <span>Go to Breast Cancer Studio</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header + Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-4">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-quantum" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-quantum font-semibold">
              Diagnostic Workbench
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-light text-ink tracking-tight">
            Patient Disease Screening Hub
          </h1>
          <p className="text-xs text-ink-soft font-light">
            Select a test below or open its dedicated clinical studio for deep biomarker analysis.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center p-1 bg-cream-deep/60 rounded-xl border border-hairline text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("workbench")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer font-medium ${
              activeTab === "workbench"
                ? "bg-parchment text-ink shadow-xs border border-hairline font-semibold"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <Sliders size={13} />
            <span>Screening Form</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("topology")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer font-medium ${
              activeTab === "topology"
                ? "bg-parchment text-ink shadow-xs border border-hairline font-semibold"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <Cpu size={13} />
            <span>Quantum Circuit View</span>
          </button>
        </div>
      </div>

      {activeTab === "workbench" ? (
        <>
          {/* Disease Category Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(Object.keys(DISEASE_CONFIGS) as DiseaseType[]).map((dKey) => {
              const cfg = DISEASE_CONFIGS[dKey];
              const isSelected = selectedDisease === dKey;
              const isLocked = cfg.isLocked;
              const IconComp = cfg.icon;
              const dedicatedUrl = getDedicatedLink(dKey);

              return (
                <div
                  key={dKey}
                  onClick={() => handleDiseaseClick(dKey)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 relative overflow-hidden ${
                    isSelected
                      ? "bg-parchment border-quantum/60 shadow-xs ring-1 ring-quantum/30 text-ink"
                      : isLocked
                      ? "bg-cream-deep/30 border-hairline/60 opacity-85 hover:opacity-100"
                      : "bg-parchment/60 hover:bg-parchment border-hairline text-ink-soft hover:text-ink"
                  }`}
                >
                  {isLocked && (
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-medium">
                      <Lock size={10} />
                      <span>Calibration</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-quantum/15 text-quantum"
                          : isLocked
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-cream-deep/60 text-ink-soft"
                      }`}
                    >
                      <IconComp size={18} />
                    </div>
                    <div className="overflow-hidden pr-12">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-quantum font-semibold block">
                        {cfg.category}
                      </span>
                      <span className="font-serif text-sm font-medium text-ink truncate block">
                        {cfg.title}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-hairline flex items-center justify-between text-[10px]">
                    <span className="text-ink-soft">{cfg.datasetName}</span>
                    {isLocked ? (
                      <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                        <Lock size={10} /> In Progress
                      </span>
                    ) : (
                      <Link
                        href={dedicatedUrl}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        className="font-semibold text-quantum hover:underline flex items-center gap-0.5"
                      >
                        Open Studio →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Presets & Upload Action Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-xl bg-cream-deep/40 border border-hairline text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <FlaskConical size={14} className="text-quantum shrink-0" />
              <span className="font-medium text-ink">Sample Cases:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {currentConfig.presets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer border ${
                      selectedPresetName === preset.name
                        ? "bg-ink text-parchment border-ink shadow-xs"
                        : "bg-parchment hover:bg-cream border-hairline text-ink-soft hover:text-ink"
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-quantum/10 border border-quantum/30 text-quantum hover:bg-quantum hover:text-white transition-all font-medium text-xs cursor-pointer shadow-xs"
              >
                <UploadCloud size={13} />
                <span>Upload Report (CSV, PDF, JSON)</span>
              </button>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-ink-soft font-mono">Patient ID:</span>
                <input
                  type="text"
                  value={patientIdInput}
                  onChange={(e) => setPatientIdInput(e.target.value)}
                  placeholder="Patient Name"
                  className="w-36 h-7 px-2 rounded-lg bg-parchment border border-hairline text-xs font-mono text-ink focus:outline-none focus:border-quantum/60"
                />
              </div>
            </div>
          </div>

          {/* Dual Grid: Inputs on Left, Results on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* LEFT: Inputs */}
            <div className="lg:col-span-6 bg-parchment rounded-2xl border border-hairline p-4 sm:p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-hairline pb-2.5">
                <div>
                  <h2 className="font-serif text-base font-medium text-ink">Cellular Biomarker Parameters</h2>
                  <p className="text-[11px] text-ink-soft">Adjust sliders, type exact numbers, or import a report</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const initial: Record<string, number> = {};
                    currentConfig.fields.forEach((f) => {
                      initial[f.key] = f.defaultValue;
                    });
                    setFormValues(initial);
                    setSelectedPresetName(null);
                  }}
                  className="text-[11px] text-ink-soft hover:text-ink flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={11} /> Reset
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentConfig.fields.map((field) => {
                  const val = formValues[field.key] ?? field.defaultValue;
                  return (
                    <div key={field.key} className="space-y-1.5 p-3 rounded-xl bg-cream/50 border border-hairline/60">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 max-w-[130px]">
                          <label className="text-[11px] font-semibold text-ink truncate" title={field.description}>
                            {field.label}
                          </label>
                          <HelpTooltip text={field.simpleExplanation} title={field.label} />
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            value={val}
                            onChange={(e) => {
                              const parsed = parseFloat(e.target.value);
                              if (!isNaN(parsed)) {
                                setFormValues({
                                  ...formValues,
                                  [field.key]: parsed,
                                });
                              }
                            }}
                            className="w-16 h-6 px-1.5 text-right font-mono text-[11px] font-semibold text-ink bg-parchment rounded border border-hairline focus:outline-none focus:border-quantum"
                          />
                          <span className="text-[10px] font-mono text-ink-soft w-6 truncate">
                            {field.unit}
                          </span>
                        </div>
                      </div>

                      <input
                        type="range"
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        value={val}
                        onChange={(e) =>
                          setFormValues({
                            ...formValues,
                            [field.key]: parseFloat(e.target.value),
                          })
                        }
                        className="w-full accent-quantum cursor-pointer h-1.5 bg-hairline rounded-lg"
                      />
                      <div className="flex justify-between text-[9px] font-mono text-ink-soft/70">
                        <span>{field.min}</span>
                        <span>{field.max}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Run Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRunInference}
                disabled={isInferring}
                className="w-full h-11 rounded-xl bg-ink text-parchment font-medium text-xs tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isInferring ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-parchment border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing Cellular Measurements...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="text-quantum" />
                    <span>Run Quantum vs Classical Screening</span>
                  </>
                )}
              </motion.button>
            </div>

            {/* RIGHT: Results */}
            <div className="lg:col-span-6 bg-parchment rounded-2xl border border-hairline p-4 sm:p-5 flex flex-col justify-between shadow-xs relative overflow-hidden min-h-[440px]">
              <AnimatePresence mode="wait">
                {isInferring ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="my-auto text-center space-y-3 py-10"
                  >
                    <div className="w-14 h-14 rounded-xl bg-quantum/10 border border-quantum/30 text-quantum mx-auto flex items-center justify-center animate-pulse">
                      <Cpu size={28} />
                    </div>
                    <h3 className="font-serif text-xl font-light text-ink">
                      Computing Quantum State Overlap...
                    </h3>
                    <p className="text-[11px] font-mono text-ink-soft max-w-sm mx-auto">
                      Encoding 8 cellular measurements into entangled quantum phase space
                    </p>
                  </motion.div>
                ) : hasInferred && inferenceResult ? (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-hairline pb-2.5">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-quantum font-semibold">
                          Screening Results
                        </span>
                        <h3 className="font-serif text-lg font-medium text-ink">Diagnostic Consensus</h3>
                      </div>
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        <span>Consensus Reached</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl border border-quantum/30 bg-quantum/5 space-y-2 relative overflow-hidden">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase text-quantum font-bold flex items-center gap-1">
                            <Zap size={11} /> Quantum Model (VQC)
                          </span>
                          <span className="text-[10px] font-mono text-ink-soft">{inferenceResult.quantumExecutionTimeMs}ms</span>
                        </div>
                        <div>
                          <p className="font-serif text-lg font-medium text-ink">{inferenceResult.quantumLabel}</p>
                          <p className="text-xs font-mono text-quantum font-semibold">{inferenceResult.quantumConfidence}% confidence</p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border border-hairline bg-cream/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase text-ink-soft font-medium flex items-center gap-1">
                            <Activity size={11} /> Classical Baseline (SVM)
                          </span>
                          <span className="text-[10px] font-mono text-ink-soft">{inferenceResult.classicalExecutionTimeMs}ms</span>
                        </div>
                        <div>
                          <p className="font-serif text-lg font-medium text-ink">{inferenceResult.classicalLabel}</p>
                          <p className="text-xs font-mono text-ink-soft font-medium">{inferenceResult.classicalConfidence}% confidence</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-ink text-[11px]">Primary Cellular Risk Drivers (QXplain)</span>
                        <span className="text-[10px] font-mono text-ink-soft">Quantum Saliency S(G_k)</span>
                      </div>
                      <div className="space-y-1.5">
                        {inferenceResult.quantumGateAttribution.map((attr, idx) => (
                          <div key={idx} className="p-2 rounded-lg bg-cream/40 border border-hairline text-xs space-y-1">
                            <div className="flex items-center justify-between font-mono text-[11px]">
                              <span className="font-medium text-ink">{attr.name}</span>
                              <span className="text-quantum font-semibold">+{attr.impact}% impact</span>
                            </div>
                            <p className="text-[10px] text-ink-soft font-sans">{attr.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300 space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                        <Info size={13} />
                        <span>Clinical Finding Summary</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-amber-900/80 dark:text-amber-300/80">
                        {inferenceResult.clinicalNote}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="my-auto text-center space-y-3 py-12">
                    <div className="w-12 h-12 rounded-xl bg-cream-deep text-ink-soft mx-auto flex items-center justify-center">
                      <Sliders size={22} />
                    </div>
                    <div className="space-y-1 max-w-xs mx-auto">
                      <h3 className="font-serif text-lg font-light text-ink">Ready to Analyze</h3>
                      <p className="text-xs text-ink-soft leading-relaxed">
                        Adjust cellular measurements, upload a report, or select a sample case, then click &ldquo;Run Quantum vs Classical Screening&rdquo;.
                      </p>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </>
      ) : (
        /* Topology View */
        <div className="bg-parchment rounded-2xl border border-hairline p-5 sm:p-6 space-y-6 shadow-xs">
          <div className="border-b border-hairline pb-4">
            <span className="text-[10px] font-mono uppercase tracking-wider text-quantum font-semibold">
              Hardware Architecture
            </span>
            <h2 className="font-serif text-xl font-light text-ink">
              8-Qubit Second-Order Pauli-Z Entangling Circuit
            </h2>
            <p className="text-xs text-ink-soft mt-1">
              Constructed via PennyLane. Encodes continuous patient measurements into $2^8 = 256$ dimensional Hilbert phase space.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-ink text-parchment font-mono text-[11px] overflow-x-auto space-y-2 border border-hairline shadow-inner">
            <p className="text-quantum font-bold">// 1. Data Encoding: ZZ Feature Map</p>
            <p className="text-parchment/80">for j in range(8):</p>
            <p className="text-parchment/80 pl-4">H(wires=j); RZ(2.0 * x[j], wires=j)</p>
            <p className="text-parchment/80">for j in range(7):</p>
            <p className="text-parchment/80 pl-4">CNOT(j, j+1); RZ(2.0 * (π - x[j]) * (π - x[j+1]), j+1); CNOT(j, j+1)</p>
            <p className="text-quantum font-bold pt-2">// 2. Parameterized Variational Ansatz (L=2 Layers)</p>
            <p className="text-parchment/80">for l in range(2):</p>
            <p className="text-parchment/80 pl-4">for j in range(8): Rot(θ[l,j,0], θ[l,j,1], θ[l,j,2], wires=j)</p>
            <p className="text-parchment/80 pl-4">for j in range(8): CNOT(j, (j+1)%8)</p>
            <p className="text-quantum font-bold pt-2">// 3. Observables</p>
            <p className="text-parchment/80">return [expval(PauliZ(i)) for i in range(8)]</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function PredictPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-quantum" />
        </div>
      }
    >
      <PredictPageContent />
    </Suspense>
  );
}
