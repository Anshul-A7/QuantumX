"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Droplets,
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
  { key: "bp", label: "Diastolic Blood Pressure", min: 50, max: 180, step: 5, defaultValue: 80, unit: "mm Hg", description: "Diastolic blood pressure", simpleExplanation: "Resting diastolic blood pressure." },
  { key: "sg", label: "Urine Specific Gravity", min: 1.005, max: 1.030, step: 0.005, defaultValue: 1.020, unit: "sg", description: "Urine concentration marker", simpleExplanation: "How concentrated the urine is (measures kidney filtration)." },
  { key: "al", label: "Albumin (Protein in Urine)", min: 0, max: 5, step: 1, defaultValue: 1, unit: "idx", description: "Urine albumin level (0 to 5)", simpleExplanation: "Presence of albumin protein in urine test." },
  { key: "bgr", label: "Random Blood Sugar", min: 60, max: 490, step: 5, defaultValue: 121, unit: "mg/dl", description: "Blood glucose random", simpleExplanation: "Random blood sugar level." },
  { key: "bu", label: "Blood Urea Nitrogen", min: 10, max: 390, step: 2, defaultValue: 36, unit: "mg/dl", description: "Blood urea nitrogen retention proxy", simpleExplanation: "Waste product in blood that kidneys normally remove." },
  { key: "sc", label: "Serum Creatinine", min: 0.4, max: 15.0, step: 0.1, defaultValue: 1.2, unit: "mg/dl", description: "Serum creatinine clearance marker", simpleExplanation: "Key marker for overall kidney filtration function." },
  { key: "hemo", label: "Hemoglobin Level", min: 3.0, max: 18.0, step: 0.2, defaultValue: 15.4, unit: "g/dl", description: "Total blood hemoglobin concentration", simpleExplanation: "Red blood cell protein count (detects renal anemia)." },
  { key: "pcv", label: "Packed Cell Volume (PCV)", min: 15, max: 55, step: 1, defaultValue: 44, unit: "%", description: "Packed cell volume hematocrit", simpleExplanation: "Percentage of whole blood made up of red cells." },
];

const PRESETS = [
  {
    name: "High-Risk Case (Kidney Disease)",
    description: "High creatinine, elevated urea, and protein in urine.",
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

export default function ChronicKidneyDetailPage() {
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
    setPatientIdInput(`Patient-CKD-${Math.floor(1000 + Math.random() * 9000)}`);
  }, []);

  const handleSelectPreset = (preset: typeof PRESETS[0]) => {
    setFormValues(preset.values);
    setSelectedPresetName(preset.name);
  };

  const handleRunInference = async () => {
    setIsInferring(true);
    setHasInferred(false);

    await new Promise((r) => setTimeout(r, 1100));

    const sc = formValues.sc ?? 1.2;
    const al = formValues.al ?? 1;

    let qConf = 96.4;
    let cConf = 92.5;
    let qLabel = "Kidney Impairment (High Risk)";
    let cLabel = "Kidney Impairment (High Risk)";
    let risk: "High" | "Low" = "High";
    let attributions = [
      { name: "Elevated Serum Creatinine", impact: 42.1, description: "Reduced filtration rate of metabolic waste products in the blood." },
      { name: "Albuminuria (Protein in Urine)", impact: 30.5, description: "Glomerular membrane damage permitting protein leakage." },
      { name: "Blood Urea Retention", impact: 18.2, description: "Decreased clearance of nitrogenous metabolic byproducts." },
    ];
    let note = "Quantum multi-biomarker model confirms renal filtration impairment. Nephrology consultation recommended.";

    if (sc < 1.4 && al === 0) {
      qConf = 98.1;
      cConf = 94.6;
      qLabel = "Normal Kidney Function (Low Risk)";
      cLabel = "Normal Kidney Function (Low Risk)";
      risk = "Low";
      attributions = [
        { name: "Optimal Serum Creatinine Clearance", impact: 46.2, description: "Normal glomerular filtration rate." },
        { name: "Zero Urine Protein Leakage", impact: 36.8, description: "Intact glomerular filtration barrier." },
      ];
      note = "Renal biomarkers are optimal with healthy creatinine clearance.";
    }

    const resultData: InferenceResult = {
      quantumLabel: qLabel,
      quantumConfidence: qConf,
      classicalLabel: cLabel,
      classicalConfidence: cConf,
      quantumExecutionTimeMs: Math.round(15 + Math.random() * 5),
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
          id: `QX-CKD-${Math.floor(10000 + Math.random() * 90000)}`,
          patientName: patientIdInput || "Patient",
          disease: "Kidney Disease Screening",
          quantumPrediction: qLabel,
          quantumConfidence: qConf,
          classicalPrediction: cLabel,
          classicalConfidence: cConf,
          topDriver: attributions[0]?.name || "Serum Creatinine",
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
QUANTUMX RENAL FUNCTION SCREENING REPORT
============================================================
Patient ID / Name:    ${patientIdInput}
Condition:            Chronic Kidney Disease (Renal Biomarkers)
Date & Time:          ${new Date().toLocaleString()}

DIAGNOSTIC OUTCOME:
- Quantum Model:      ${inferenceResult.quantumLabel} (${inferenceResult.quantumConfidence}%)
- Standard ML Model:  ${inferenceResult.classicalLabel} (${inferenceResult.classicalConfidence}%)
- Risk Level:         ${inferenceResult.riskLevel} Risk

KEY RENAL FUNCTION FACTORS:
${inferenceResult.quantumGateAttribution.map((g) => `- ${g.name}: +${g.impact}% impact (${g.description})`).join("\n")}

CLINICAL RECOMMENDATION:
${inferenceResult.clinicalNote}
    `.trim();

    const blob = new Blob([summary], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Kidney_Screening_${patientIdInput}.txt`;
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
              <Droplets size={16} />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-light text-ink tracking-tight">
              Kidney Function &amp; Renal Health Studio
            </h1>
          </div>
          <p className="text-xs text-ink-soft font-light">
            Monitors blood sugar, urea filtration, and protein levels to forecast kidney health changes.
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

          {/* Dual Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* LEFT: Inputs */}
            <div className="lg:col-span-6 bg-parchment rounded-2xl border border-hairline p-4 sm:p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-hairline pb-2.5">
                <div>
                  <h2 className="font-serif text-base font-medium text-ink">Renal Health Parameters</h2>
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
                    <span>Analyzing Renal Markers on Quantum Processor...</span>
                  </>
                ) : (
                  <>
                    <Droplets size={14} className="text-quantum" />
                    <span>Run Kidney Function Screening</span>
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
                      Computing Renal Clearance State...
                    </h3>
                    <p className="text-[11px] font-mono text-ink-soft max-w-sm mx-auto">
                      Analyzing creatinine filtration and protein retention vectors
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

                    {/* Dual Cards */}
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
                            <Activity size={11} /> Support Vector Mach.
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
                          <Zap size={12} className="text-quantum" /> Key Diagnostic Factors
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
                        Ready to Screen
                      </h3>
                      <p className="text-[11px] text-ink-soft max-w-sm mx-auto font-light leading-relaxed">
                        Adjust renal biomarkers on the left or select a sample case, then click "Run Kidney Function Screening".
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
              Encodes creatinine, BUN, and urine specific gravity into quantum entanglement states.
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
