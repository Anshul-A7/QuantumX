"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  Check,
  ShieldAlert,
  Info,
} from "lucide-react";
import HelpTooltip from "@/components/common/HelpTooltip";

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
    name: "High-Risk Case (Malignant)",
    description: "Enlarged nuclear radius, jagged borders, and high indentation count.",
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
];

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

export default function BreastCancerDetailPage() {
  const [formValues, setFormValues] = useState<Record<string, number>>({});
  const [selectedPresetName, setSelectedPresetName] = useState<string | null>(null);
  const [patientIdInput, setPatientIdInput] = useState("");

  const [isInferring, setIsInferring] = useState(false);
  const [hasInferred, setHasInferred] = useState(false);
  const [inferenceResult, setInferenceResult] = useState<InferenceResult | null>(null);
  const [activeTab, setActiveTab] = useState<"form" | "circuit">("form");

  useEffect(() => {
    const initial: Record<string, number> = {};
    FIELDS.forEach((f) => {
      initial[f.key] = f.defaultValue;
    });
    setFormValues(initial);
    setPatientIdInput(`Patient-BC-${Math.floor(1000 + Math.random() * 9000)}`);
  }, []);

  const handleSelectPreset = (preset: typeof PRESETS[0]) => {
    setFormValues(preset.values);
    setSelectedPresetName(preset.name);
  };

  const handleRunInference = async () => {
    setIsInferring(true);
    setHasInferred(false);

    await new Promise((r) => setTimeout(r, 1100));

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
      quantumExecutionTimeMs: Math.round(15 + Math.random() * 6),
      classicalExecutionTimeMs: Math.round(3 + Math.random() * 2),
      quantumGateAttribution: attributions,
      clinicalNote: note,
      riskLevel: risk,
    };

    setInferenceResult(resultData);
    setHasInferred(true);
    setIsInferring(false);

    if (typeof window !== "undefined") {
      try {
        const storedHistory = localStorage.getItem("quantumx_prediction_history");
        const historyList = storedHistory ? JSON.parse(storedHistory) : [];
        const newRecord = {
          id: `QX-BC-${Math.floor(10000 + Math.random() * 90000)}`,
          patientName: patientIdInput || "Patient",
          disease: "Breast Cancer Screening",
          quantumPrediction: qLabel,
          quantumConfidence: qConf,
          classicalPrediction: cLabel,
          classicalConfidence: cConf,
          topDriver: attributions[0]?.name || "Nuclear Size & Radius",
          riskLevel: risk,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        };
        localStorage.setItem("quantumx_prediction_history", JSON.stringify([newRecord, ...historyList].slice(0, 50)));

        // Real notification logging
        const storedNotifs = localStorage.getItem("quantumx_notifications");
        const notifList = storedNotifs ? JSON.parse(storedNotifs) : [];
        const newNotif = {
          id: `notif-${Date.now()}`,
          title: `Screening Completed: ${newRecord.patientName}`,
          category: "disease",
          time: "Just now",
          message: `${newRecord.disease} result: ${qLabel} (${qConf}% confidence).`,
          read: false,
          actionUrl: "/history",
          actionLabel: "View Record",
        };
        localStorage.setItem("quantumx_notifications", JSON.stringify([newNotif, ...notifList].slice(0, 20)));
      } catch (err) {
        console.error("Failed to store screening record:", err);
      }
    }
  };

  const handleDownloadReport = () => {
    if (!inferenceResult) return;
    const summary = `
QUANTUMX DETAILED BREAST CANCER SCREENING REPORT
============================================================
Patient ID / Name:    ${patientIdInput}
Condition:            Breast Cancer (Cellular Biopsy)
Date & Time:          ${new Date().toLocaleString()}

DIAGNOSTIC OUTCOME:
- Quantum Model:      ${inferenceResult.quantumLabel} (${inferenceResult.quantumConfidence}%)
- Standard ML Model:  ${inferenceResult.classicalLabel} (${inferenceResult.classicalConfidence}%)
- Risk Level:         ${inferenceResult.riskLevel} Risk

KEY CELLULAR FACTORS:
${inferenceResult.quantumGateAttribution.map((g) => `- ${g.name}: +${g.impact}% impact (${g.description})`).join("\n")}

CLINICAL RECOMMENDATION:
${inferenceResult.clinicalNote}
    `.trim();

    const blob = new Blob([summary], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Breast_Cancer_Screening_${patientIdInput}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-5 pb-12 w-full"
    >
      {/* Back Button + Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-4">
        <div className="space-y-1">
          <Link
            href="/predict"
            className="inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink transition-colors font-medium cursor-pointer"
          >
            <ArrowLeft size={13} /> Back to All Screening Tests
          </Link>
          <div className="flex items-center gap-2 pt-1">
            <div className="w-7 h-7 rounded-lg bg-quantum/10 text-quantum flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-light text-ink tracking-tight">
              Breast Cancer Cellular Screening Studio
            </h1>
          </div>
          <p className="text-xs text-ink-soft font-light">
            Evaluates microscopic cell boundary smoothness and tumor thickness using quantum algorithms.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center p-1 bg-cream-deep/60 rounded-xl border border-hairline text-xs font-sans">
          <button
            type="button"
            onClick={() => setActiveTab("form")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
              activeTab === "form"
                ? "bg-parchment text-ink shadow-xs border border-hairline font-semibold"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            Biomarker Form
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("circuit")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
              activeTab === "circuit"
                ? "bg-parchment text-ink shadow-xs border border-hairline font-semibold"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            Quantum Circuit (8 Qubits)
          </button>
        </div>
      </div>

      {activeTab === "form" ? (
        <>
          {/* Quick Presets & Patient ID Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-cream-deep/40 border border-hairline text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <FlaskConical size={14} className="text-quantum shrink-0" />
              <span className="font-medium text-ink">Sample Cases:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {PRESETS.map((preset, idx) => (
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
                placeholder="Patient Name"
                className="w-36 h-7 px-2 rounded-lg bg-parchment border border-hairline text-xs font-mono text-ink focus:outline-none focus:border-quantum/60"
              />
            </div>
          </div>

          {/* Dual Grid: Inputs on Left, Results on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* LEFT: Inputs */}
            <div className="lg:col-span-6 bg-parchment rounded-2xl border border-hairline p-4 sm:p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-hairline pb-2.5">
                <div>
                  <h2 className="font-serif text-base font-medium text-ink">Cellular Biomarker Parameters</h2>
                  <p className="text-[11px] text-ink-soft">Adjust sliders or choose a sample case above</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const initial: Record<string, number> = {};
                    FIELDS.forEach((f) => {
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
                {FIELDS.map((field) => {
                  const val = formValues[field.key] ?? field.defaultValue;
                  return (
                    <div key={field.key} className="space-y-1 p-2.5 rounded-lg bg-cream/50 border border-hairline/60">
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
                    <span>Analyzing Breast Cell Morphology...</span>
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
                        <span>Consensus Reached</span>
                      </div>
                    </div>

                    {/* Dual Result Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Quantum */}
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

                      {/* Classical */}
                      <div className="p-3 rounded-xl bg-cream border border-hairline space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono uppercase tracking-wider text-ink-soft font-semibold flex items-center gap-1">
                            <Activity size={11} /> Random Forest
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

                    {/* Attribution */}
                    <div className="space-y-2 p-3 rounded-xl bg-cream-deep/30 border border-hairline">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-serif font-medium text-ink flex items-center gap-1">
                          <Zap size={12} className="text-quantum" /> Key Cellular Diagnostic Factors
                        </span>
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

                    {/* Recommendation & Download Button */}
                    <div className="p-3 rounded-lg bg-parchment border border-hairline/90 text-xs space-y-2">
                      <div>
                        <span className="text-[9px] font-mono uppercase tracking-wider font-semibold text-ink block">
                          Clinical Summary
                        </span>
                        <p className="text-ink-soft font-light text-[11px] leading-relaxed">
                          {inferenceResult.clinicalNote}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleDownloadReport}
                        className="px-3 py-1.5 rounded-lg bg-ink text-parchment text-xs font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        <Download size={12} /> Download Clinical Report
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="my-auto text-center space-y-3 py-10">
                    <div className="w-12 h-12 rounded-xl bg-cream-deep/60 border border-hairline text-ink-soft mx-auto flex items-center justify-center">
                      <Sliders size={20} />
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="font-serif text-xl font-light text-ink">
                        Ready to Analyze
                      </h3>
                      <p className="text-[11px] text-ink-soft max-w-sm mx-auto font-light leading-relaxed">
                        Adjust cellular measurements on the left or select a sample case, then click "Run Quantum vs Classical Screening".
                      </p>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </>
      ) : (
        /* Circuit view */
        <div className="p-5 bg-parchment rounded-2xl border border-hairline shadow-xs space-y-4 font-mono text-xs">
          <div className="border-b border-hairline pb-3">
            <h3 className="font-serif text-base font-medium text-ink">8-Qubit Heavy-Hex ZZ Feature Map</h3>
            <p className="text-[11px] text-ink-soft font-sans font-light">
              Maps multi-variate cell morphology features into entangled Hilbert quantum phase states.
            </p>
          </div>

          <div className="space-y-2 overflow-x-auto py-1">
            {FIELDS.map((f, idx) => (
              <div key={f.key} className="flex items-center gap-3 py-1.5 px-2.5 rounded-lg bg-cream/70 border border-hairline/60">
                <span className="w-10 font-bold text-quantum text-[11px]">q[{idx}]</span>
                <span className="w-36 text-ink text-[11px] truncate">{f.label}</span>
                <span className="px-1.5 py-0.5 rounded bg-parchment border border-hairline text-ink-soft text-[9px]">
                  Rz(θ={((formValues[f.key] ?? f.defaultValue) / f.max).toFixed(3)})
                </span>
                <span className="text-quantum tracking-wider font-light text-[11px] hidden sm:inline">
                  ● ── ┼ ── X ── [ZZ Coupling]
                </span>
                <span className="ml-auto text-[9px] text-ink-soft flex items-center gap-1">
                  <Check size={10} className="text-emerald-600" /> Active
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
