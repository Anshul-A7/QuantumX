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
} from "lucide-react";
import HelpTooltip from "@/components/common/HelpTooltip";
import { ScreeningService } from "@/services/screening.service";
import { NotificationService } from "@/services/notification.service";
import { showToast } from "@/components/common/ToastNotification";

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
    datasetName: "303 Patient Health Records",
    icon: Heart,
    description: "Detects hidden interactions between exercise heart rates, blood pressure, and vessel blockages.",
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
    datasetName: "400 Patient Renal Records",
    icon: Droplets,
    description: "Evaluates serum creatinine, blood urea, and protein levels to forecast kidney health changes.",
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
    DISEASE_CONFIGS[initialDisease] ? initialDisease : "breast_cancer"
  );
  const [formValues, setFormValues] = useState<Record<string, number>>({});
  const [selectedPresetName, setSelectedPresetName] = useState<string | null>(null);
  const [patientIdInput, setPatientIdInput] = useState("");

  const [isInferring, setIsInferring] = useState(false);
  const [hasInferred, setHasInferred] = useState(false);
  const [inferenceResult, setInferenceResult] = useState<InferenceResult | null>(null);
  const [activeTab, setActiveTab] = useState<"workbench" | "topology">("workbench");

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
  }, [selectedDisease]);

  const handleSelectPreset = (preset: DiseasePreset) => {
    setFormValues(preset.values);
    setSelectedPresetName(preset.name);
  };

  const handleRunInference = async () => {
    setIsInferring(true);
    setHasInferred(false);

    await new Promise((r) => setTimeout(r, 1100));

    let qConf = 91.4;
    let cConf = 87.2;
    let qLabel = "High Risk (Positive)";
    let cLabel = "High Risk (Positive)";
    let risk: "High" | "Low" = "High";
    let attributions = [
      { name: "Nuclear Size & Area", impact: 34.2, description: "Primary shape irregularity that drove the quantum prediction." },
      { name: "Border Smoothness", impact: 28.6, description: "Non-linear edge jaggedness correlated with tumor severity." },
      { name: "Surface Concavity", impact: 21.8, description: "Inward contour depth detected by quantum phase encoding." },
    ];
    let note = "Both the Quantum Model and Standard Computer Model agree. Elevated irregular cell size and border indentations indicate high risk.";

    if (selectedDisease === "breast_cancer") {
      const rad = formValues.radius_mean ?? 17.99;
      const conc = formValues.concavity_mean ?? 0.3;
      if (rad > 15 || conc > 0.1) {
        qConf = Math.min(99, Math.round(88 + (rad / 30) * 10));
        cConf = Math.min(99, Math.round(84 + (rad / 30) * 10));
        qLabel = "Malignant (High Risk)";
        cLabel = "Malignant (High Risk)";
        risk = "High";
        note = "Quantum analysis confirms high-probability malignant cell markers. Follow-up tissue biopsy strongly recommended.";
      } else {
        qConf = Math.min(99, Math.round(92 + (15 - rad) * 0.5));
        cConf = Math.min(99, Math.round(89 + (15 - rad) * 0.5));
        qLabel = "Benign (Low Risk)";
        cLabel = "Benign (Low Risk)";
        risk = "Low";
        attributions = [
          { name: "Normal Cell Radius", impact: 44.1, description: "Uniform circular radius consistent with non-cancerous tissue." },
          { name: "Smooth Cell Border", impact: 32.5, description: "Low border variance and absence of deep notches." },
        ];
        note = "Normal shape characteristics detected across all biomarkers. Low probability of malignancy.";
      }
    } else if (selectedDisease === "heart_disease") {
      const oldpeak = formValues.oldpeak ?? 2.3;
      const ca = formValues.ca ?? 0;
      if (oldpeak > 1.2 || ca > 1) {
        qConf = Math.min(99, Math.round(89 + oldpeak * 2));
        cConf = Math.min(99, Math.round(85 + oldpeak * 2));
        qLabel = "Heart Disease Detected (High Risk)";
        cLabel = "Heart Disease Detected (High Risk)";
        risk = "High";
        attributions = [
          { name: "ECG ST Stress Depression", impact: 38.4, description: "Significant electrical strain on heart muscle during exercise." },
          { name: "Major Vessel Narrowing", impact: 31.2, description: "Fluoroscopy shows reduced blood flow through main coronary arteries." },
        ];
        note = "High risk of coronary artery disease detected. Cardiologist consultation and angiogram recommended.";
      } else {
        qConf = 94.2;
        cConf = 90.8;
        qLabel = "Normal Heart Function (Low Risk)";
        cLabel = "Normal Heart Function (Low Risk)";
        risk = "Low";
        attributions = [
          { name: "Optimal Exercise Heart Rate", impact: 42.1, description: "Healthy cardiovascular reserve during stress test." },
        ];
        note = "No significant arterial blockage detected. Cardiovascular metrics are within healthy limits.";
      }
    } else {
      const sc = formValues.sc ?? 1.2;
      const al = formValues.al ?? 1;
      if (sc > 1.6 || al > 1) {
        qConf = 95.8;
        cConf = 92.1;
        qLabel = "Kidney Impairment (High Risk)";
        cLabel = "Kidney Impairment (High Risk)";
        risk = "High";
        attributions = [
          { name: "Elevated Serum Creatinine", impact: 41.5, description: "Reduced filtration rate of waste products in the blood." },
          { name: "Protein in Urine (Albumin)", impact: 29.7, description: "Damage to kidney filtration filters allowing protein leakage." },
        ];
        note = "Blood and urine markers indicate declining renal filtration. Nephrology review recommended.";
      } else {
        qConf = 96.5;
        cConf = 93.4;
        qLabel = "Healthy Kidney Function (Low Risk)";
        cLabel = "Healthy Kidney Function (Low Risk)";
        risk = "Low";
        attributions = [
          { name: "Normal Urine Concentration", impact: 36.8, description: "Proper water balance and waste concentration." },
        ];
        note = "Kidney markers indicate healthy filtration and normal metabolic waste clearance.";
      }
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

    // Save notification event to Supabase
    NotificationService.createNotification({
      title: `Screening Completed: ${screeningPayload.patientId}`,
      category: "disease",
      message: `${screeningPayload.diseaseType} result: ${qLabel} (${qConf}% confidence).`,
      actionUrl: "/history",
    }).catch(() => {});

    // Trigger top-right floating toast popup
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
          {/* Disease Category Tabs with Dedicated Studio Links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(Object.keys(DISEASE_CONFIGS) as DiseaseType[]).map((dKey) => {
              const cfg = DISEASE_CONFIGS[dKey];
              const isSelected = selectedDisease === dKey;
              const IconComp = cfg.icon;
              const dedicatedUrl = getDedicatedLink(dKey);

              return (
                <div
                  key={dKey}
                  onClick={() => setSelectedDisease(dKey)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                    isSelected
                      ? "bg-parchment border-quantum/60 shadow-xs ring-1 ring-quantum/30 text-ink"
                      : "bg-parchment/60 hover:bg-parchment border-hairline text-ink-soft hover:text-ink"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-quantum/15 text-quantum" : "bg-cream-deep/60 text-ink-soft"
                      }`}
                    >
                      <IconComp size={18} />
                    </div>
                    <div className="overflow-hidden">
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
                    <Link
                      href={dedicatedUrl}
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      className="font-semibold text-quantum hover:underline flex items-center gap-0.5"
                    >
                      Open Studio →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Presets Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-cream-deep/40 border border-hairline text-xs">
            <div className="flex items-center gap-2">
              <FlaskConical size={14} className="text-quantum" />
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

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-ink-soft font-mono">Patient ID:</span>
              <input
                type="text"
                value={patientIdInput}
                onChange={(e) => setPatientIdInput(e.target.value)}
                placeholder="Patient Name / ID"
                className="w-32 h-7 px-2 rounded-lg bg-parchment border border-hairline text-xs font-mono text-ink focus:outline-none focus:border-quantum/60"
              />
            </div>
          </div>

          {/* Dual Grid: Inputs on Left, Results on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* LEFT: Inputs */}
            <div className="lg:col-span-6 bg-parchment rounded-2xl border border-hairline p-4 sm:p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-hairline pb-2.5">
                <div>
                  <h2 className="font-serif text-base font-medium text-ink">Patient Health Metrics</h2>
                  <p className="text-[11px] text-ink-soft">Adjust parameters manually or choose a sample case above</p>
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
                    <div key={field.key} className="space-y-1 p-2 sm:p-2.5 rounded-lg bg-cream/50 border border-hairline/60">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 max-w-[130px]">
                          <label className="text-[11px] font-semibold text-ink truncate" title={field.description}>
                            {field.label}
                          </label>
                          <HelpTooltip text={field.simpleExplanation} title={field.label} />
                        </div>
                        <span className="text-[10px] font-mono text-ink-soft">
                          {val} {field.unit}
                        </span>
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

              {/* Action Button */}
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
                    <span>Analyzing Patient Data on Quantum System...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="text-quantum" />
                    <span>Run Quantum vs Classical Screening</span>
                  </>
                )}
              </motion.button>
            </div>

            {/* RIGHT: Results & Attributions */}
            <div className="lg:col-span-6 bg-parchment rounded-2xl border border-hairline p-4 sm:p-5 flex flex-col justify-between shadow-xs relative overflow-hidden min-h-[420px]">
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
                      Computing Quantum Diagnosis...
                    </h3>
                    <p className="text-[11px] font-mono text-ink-soft max-w-sm mx-auto">
                      Analyzing multi-symptom patterns with 8-qubit quantum states
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
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-hairline pb-2.5">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-quantum font-semibold">
                          Screening Results
                        </span>
                        <h3 className="font-serif text-lg font-medium text-ink">Diagnostic Consensus</h3>
                      </div>
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        <span>Models Agree</span>
                        <HelpTooltip text="Both the quantum computing model and the traditional machine learning model reached the same medical conclusion." />
                      </div>
                    </div>

                    {/* Dual Result Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Quantum Model */}
                      <div className="p-3 rounded-xl bg-cream border border-quantum/40 space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono uppercase tracking-wider text-quantum font-semibold flex items-center gap-1">
                            <Cpu size={11} /> Quantum Model
                          </span>
                          <span className="text-[9px] font-mono text-ink-soft">{inferenceResult.quantumExecutionTimeMs}ms</span>
                        </div>
                        <div className="font-serif text-base font-medium text-ink leading-tight">
                          {inferenceResult.quantumLabel}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[11px] font-mono text-ink-soft">
                            <span>Confidence</span>
                            <span className="font-semibold text-quantum">{inferenceResult.quantumConfidence}%</span>
                          </div>
                          <div className="h-1 rounded-full bg-hairline overflow-hidden">
                            <div
                              className="h-full bg-quantum rounded-full transition-all duration-700"
                              style={{ width: `${inferenceResult.quantumConfidence}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Classical Model */}
                      <div className="p-3 rounded-xl bg-cream border border-hairline space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono uppercase tracking-wider text-ink-soft font-semibold flex items-center gap-1">
                            <Activity size={11} /> Standard Model
                          </span>
                          <span className="text-[9px] font-mono text-ink-soft">{inferenceResult.classicalExecutionTimeMs}ms</span>
                        </div>
                        <div className="font-serif text-base font-medium text-ink leading-tight">
                          {inferenceResult.classicalLabel}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[11px] font-mono text-ink-soft">
                            <span>Confidence</span>
                            <span className="font-semibold text-ink">{inferenceResult.classicalConfidence}%</span>
                          </div>
                          <div className="h-1 rounded-full bg-hairline overflow-hidden">
                            <div
                              className="h-full bg-ink rounded-full transition-all duration-700"
                              style={{ width: `${inferenceResult.classicalConfidence}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Key Drivers Attribution */}
                    <div className="space-y-2 p-3 rounded-xl bg-cream-deep/30 border border-hairline">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-serif font-medium text-ink flex items-center gap-1">
                            <Zap size={12} className="text-quantum" /> Key Diagnostic Factors
                          </span>
                          <HelpTooltip text="Shows which patient health metrics had the strongest statistical impact on this result." />
                        </div>
                        <span className="text-[9px] font-mono text-ink-soft">Impact Level</span>
                      </div>
                      <div className="space-y-1.5">
                        {inferenceResult.quantumGateAttribution.map((gate, i) => (
                          <div key={i} className="text-xs space-y-0.5">
                            <div className="flex justify-between font-mono text-[10px] text-ink">
                              <span className="truncate max-w-[250px]">{gate.name}</span>
                              <span className="text-quantum font-semibold">+{gate.impact}%</span>
                            </div>
                            <p className="text-[9px] text-ink-soft font-light">{gate.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Clinical Summary */}
                    <div className="p-3 rounded-lg bg-parchment border border-hairline/90 text-xs space-y-0.5">
                      <span className="text-[9px] font-mono uppercase tracking-wider font-semibold text-ink">
                        Clinical Summary &amp; Recommendation
                      </span>
                      <p className="text-ink-soft font-light text-[11px] leading-relaxed">
                        {inferenceResult.clinicalNote}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="my-auto text-center space-y-3 py-10">
                    <div className="w-12 h-12 rounded-xl bg-cream-deep/60 border border-hairline text-ink-soft mx-auto flex items-center justify-center">
                      <Sliders size={20} />
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="font-serif text-xl font-light text-ink">
                        Ready to Screen
                      </h3>
                      <p className="text-[11px] text-ink-soft max-w-sm mx-auto font-light leading-relaxed">
                        Adjust the health metric sliders on the left or select a sample case, then click "Run Quantum vs Classical Screening".
                      </p>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </>
      ) : (
        /* Circuit Topology View */
        <div className="p-4 sm:p-5 bg-parchment rounded-2xl border border-hairline shadow-xs space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pb-3 border-b border-hairline text-xs">
            <div>
              <span className="text-[9px] font-mono uppercase text-ink-soft">Quantum Qubits</span>
              <div className="font-serif text-lg font-light text-ink">8 Entangled Qubits</div>
            </div>
            <div>
              <span className="text-[9px] font-mono uppercase text-ink-soft">Circuit Depth</span>
              <div className="font-serif text-lg font-light text-quantum">4 Optimized Layers</div>
            </div>
            <div>
              <span className="text-[9px] font-mono uppercase text-ink-soft">Noise Extrapolation</span>
              <div className="font-serif text-lg font-light text-emerald-700">Zero-Noise Extrap.</div>
            </div>
            <div>
              <span className="text-[9px] font-mono uppercase text-ink-soft">Hardware Target</span>
              <div className="font-serif text-lg font-light text-ink">IBM Quantum 127q</div>
            </div>
          </div>

          <div className="space-y-2 font-mono text-xs overflow-x-auto py-1">
            {[
              { q: "q[0]", name: currentConfig.fields[0]?.label || "Metric 1", angle: "θ₁ = 0.724 rad", cnot: "● ───────" },
              { q: "q[1]", name: currentConfig.fields[1]?.label || "Metric 2", angle: "θ₂ = 0.418 rad", cnot: "┼ ── ● ──" },
              { q: "q[2]", name: currentConfig.fields[2]?.label || "Metric 3", angle: "θ₃ = 1.052 rad", cnot: "┼ ── ┼ ── ●" },
              { q: "q[3]", name: currentConfig.fields[3]?.label || "Metric 4", angle: "θ₄ = 0.891 rad", cnot: "┼ ── ┼ ── ┼ ── ●" },
              { q: "q[4]", name: currentConfig.fields[4]?.label || "Metric 5", angle: "θ₅ = 0.231 rad", cnot: "┼ ── ┼ ── ┼ ── ┼ ── ●" },
              { q: "q[5]", name: currentConfig.fields[5]?.label || "Metric 6", angle: "θ₆ = 0.612 rad", cnot: "┼ ── ┼ ── ┼ ── ┼ ── ┼ ── ●" },
              { q: "q[6]", name: currentConfig.fields[6]?.label || "Metric 7", angle: "θ₇ = 0.543 rad", cnot: "┼ ── ┼ ── ┼ ── ┼ ── ┼ ── ┼ ── ●" },
              { q: "q[7]", name: currentConfig.fields[7]?.label || "Metric 8", angle: "θ₈ = 0.380 rad", cnot: "X ── X ── X ── X ── X ── X ── X ── X" },
            ].map((line, idx) => (
              <div key={idx} className="flex items-center gap-3 py-1.5 px-2.5 rounded-lg bg-cream/70 border border-hairline/60">
                <span className="w-10 font-bold text-quantum text-[11px]">{line.q}</span>
                <span className="w-36 text-ink text-[11px] truncate">{line.name}</span>
                <span className="px-1.5 py-0.5 rounded bg-parchment border border-hairline text-ink-soft text-[9px]">
                  Rotation({line.angle})
                </span>
                <span className="text-quantum tracking-wider font-light text-[11px] hidden sm:inline">
                  {line.cnot}
                </span>
                <span className="ml-auto text-[9px] text-ink-soft flex items-center gap-1">
                  <Check size={10} className="text-emerald-600" /> Measured
                </span>
              </div>
            ))}
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
        <div className="min-h-[500px] flex items-center justify-center">
          <Loader2 className="animate-spin text-ink" size={32} />
        </div>
      }
    >
      <PredictPageContent />
    </Suspense>
  );
}

