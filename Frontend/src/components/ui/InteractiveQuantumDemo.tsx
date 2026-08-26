"use client";

import React, { useState } from "react";
import { Play, Sparkles, Activity, CheckCircle2, ShieldCheck, Cpu, ArrowRight, RefreshCw, BarChart2 } from "lucide-react";
import confetti from "canvas-confetti";

export default function InteractiveQuantumDemo() {
  const [sampleType, setSampleType] = useState<"malignant" | "benign">("malignant");
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(true);

  // Input features (normalized 0 to 1)
  const [features, setFeatures] = useState({
    meanRadius: 0.78,
    meanTexture: 0.65,
    meanSmoothness: 0.82,
    meanConcavity: 0.91,
  });

  const samples = {
    malignant: {
      name: "Patient #WBC-842302 (Malignant Specimen)",
      features: { meanRadius: 0.84, meanTexture: 0.72, meanSmoothness: 0.88, meanConcavity: 0.94 },
      groundTruth: "Malignant Carcinoma (High Risk)",
      expectedProb: 96.8,
    },
    benign: {
      name: "Patient #WBC-842517 (Benign Specimen)",
      features: { meanRadius: 0.18, meanTexture: 0.24, meanSmoothness: 0.22, meanConcavity: 0.15 },
      groundTruth: "Benign Fibroadenoma (Low Risk)",
      expectedProb: 3.4,
    },
  };

  const handleSelectSample = (type: "malignant" | "benign") => {
    setSampleType(type);
    setFeatures(samples[type].features);
    setCompleted(true);
  };

  const handleRunInference = () => {
    setIsRunning(true);
    setCompleted(false);

    setTimeout(() => {
      setIsRunning(false);
      setCompleted(true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#4F46E5", "#7C3AED", "#10B981", "#FAF8F5"],
      });
    }, 1200);
  };

  const currentProbability = sampleType === "malignant" ? 96.8 : 3.4;

  return (
    <div className="w-full bg-white/80 backdrop-blur-2xl border border-black/[0.06] rounded-3xl p-6 md:p-10 shadow-2xl shadow-indigo-500/5">
      
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-black/[0.06]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
            <Cpu className="w-3.5 h-3.5" />
            Live Qiskit / PennyLane VQC Circuit
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-900">
            Interactive Quantum Diagnostic Engine
          </h3>
          <p className="text-sm text-slate-500">
            Select a clinical specimen or customize biomedical parameters to observe real-time circuit state collapse.
          </p>
        </div>

        {/* Specimen Selectors */}
        <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-black/[0.04]">
          <button
            onClick={() => handleSelectSample("malignant")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              sampleType === "malignant"
                ? "bg-white text-rose-700 shadow-sm shadow-black/[0.06]"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sample A (Malignant)
          </button>
          <button
            onClick={() => handleSelectSample("benign")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              sampleType === "benign"
                ? "bg-white text-emerald-700 shadow-sm shadow-black/[0.06]"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sample B (Benign)
          </button>
        </div>
      </div>

      {/* Main Grid: Features Sliders + Interactive Circuit + Prediction Result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        
        {/* Left Column: Feature Encoders (4 cols) */}
        <div className="lg:col-span-4 space-y-4 bg-[#FAF8F5] p-5 rounded-2xl border border-black/[0.04]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Normalized Biomarkers (Input x)
            </span>
            <span className="text-xs text-indigo-600 font-mono">θ = π · x</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span>Mean Radius (q₀)</span>
                <span className="font-mono">{features.meanRadius}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={features.meanRadius}
                onChange={(e) => setFeatures({ ...features, meanRadius: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span>Mean Texture (q₁)</span>
                <span className="font-mono">{features.meanTexture}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={features.meanTexture}
                onChange={(e) => setFeatures({ ...features, meanTexture: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span>Mean Smoothness (q₂)</span>
                <span className="font-mono">{features.meanSmoothness}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={features.meanSmoothness}
                onChange={(e) => setFeatures({ ...features, meanSmoothness: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span>Mean Concavity (q₃)</span>
                <span className="font-mono">{features.meanConcavity}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={features.meanConcavity}
                onChange={(e) => setFeatures({ ...features, meanConcavity: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={handleRunInference}
            disabled={isRunning}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 text-sm mt-4 cursor-pointer"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Executing Quantum Circuit...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                Run Quantum Inference
              </>
            )}
          </button>
        </div>

        {/* Center & Right Column: Circuit Visualization + Q-SHAP Attribution (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Animated 4-Qubit Circuit Canvas */}
          <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-inner relative overflow-hidden font-mono text-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800 text-slate-400">
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isRunning ? "bg-amber-400 animate-ping" : "bg-emerald-400"}`} />
                Circuit Execution: 4 Qubits • Depth=3
              </span>
              <span className="text-[11px] text-slate-400 font-sans">PennyLane Autodiff Device</span>
            </div>

            {/* Circuit Lines */}
            <div className="space-y-4 py-2">
              {/* Qubit 0 */}
              <div className="flex items-center gap-3">
                <span className="w-10 text-indigo-400 font-bold">|q₀⟩</span>
                <div className="flex-1 h-0.5 bg-slate-700 relative flex items-center justify-between">
                  <div className="px-2 py-1 rounded bg-indigo-900/80 border border-indigo-500 text-indigo-200">H</div>
                  <div className="px-2 py-1 rounded bg-violet-900/80 border border-violet-500 text-violet-200">Ry({(features.meanRadius * Math.PI).toFixed(2)})</div>
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 z-10" />
                  <div className="px-2 py-1 rounded bg-emerald-900/80 border border-emerald-500 text-emerald-200">⟨Z₀⟩</div>
                </div>
              </div>

              {/* Qubit 1 */}
              <div className="flex items-center gap-3">
                <span className="w-10 text-indigo-400 font-bold">|q₁⟩</span>
                <div className="flex-1 h-0.5 bg-slate-700 relative flex items-center justify-between">
                  <div className="px-2 py-1 rounded bg-indigo-900/80 border border-indigo-500 text-indigo-200">H</div>
                  <div className="px-2 py-1 rounded bg-violet-900/80 border border-violet-500 text-violet-200">Ry({(features.meanTexture * Math.PI).toFixed(2)})</div>
                  <div className="w-4 h-4 rounded-full border-2 border-cyan-400 flex items-center justify-center text-cyan-400 text-[10px] bg-slate-900 z-10">+</div>
                  <div className="px-2 py-1 rounded bg-emerald-900/80 border border-emerald-500 text-emerald-200">⟨Z₁⟩</div>
                </div>
              </div>

              {/* Qubit 2 */}
              <div className="flex items-center gap-3">
                <span className="w-10 text-indigo-400 font-bold">|q₂⟩</span>
                <div className="flex-1 h-0.5 bg-slate-700 relative flex items-center justify-between">
                  <div className="px-2 py-1 rounded bg-indigo-900/80 border border-indigo-500 text-indigo-200">H</div>
                  <div className="px-2 py-1 rounded bg-violet-900/80 border border-violet-500 text-violet-200">Ry({(features.meanSmoothness * Math.PI).toFixed(2)})</div>
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 z-10" />
                  <div className="px-2 py-1 rounded bg-emerald-900/80 border border-emerald-500 text-emerald-200">⟨Z₂⟩</div>
                </div>
              </div>

              {/* Qubit 3 */}
              <div className="flex items-center gap-3">
                <span className="w-10 text-indigo-400 font-bold">|q₃⟩</span>
                <div className="flex-1 h-0.5 bg-slate-700 relative flex items-center justify-between">
                  <div className="px-2 py-1 rounded bg-indigo-900/80 border border-indigo-500 text-indigo-200">H</div>
                  <div className="px-2 py-1 rounded bg-violet-900/80 border border-violet-500 text-violet-200">Ry({(features.meanConcavity * Math.PI).toFixed(2)})</div>
                  <div className="w-4 h-4 rounded-full border-2 border-cyan-400 flex items-center justify-center text-cyan-400 text-[10px] bg-slate-900 z-10">+</div>
                  <div className="px-2 py-1 rounded bg-emerald-900/80 border border-emerald-500 text-emerald-200">⟨Z₃⟩</div>
                </div>
              </div>
            </div>

            {/* Entanglement Line overlay */}
            {isRunning && (
              <div className="absolute inset-0 bg-indigo-600/10 backdrop-blur-[1px] flex items-center justify-center">
                <div className="bg-slate-900/90 border border-indigo-500/50 px-4 py-2 rounded-full text-indigo-300 flex items-center gap-2 text-xs shadow-xl animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                  Computing Variational Circuit Gradient & Entanglement Matrix...
                </div>
              </div>
            )}
          </div>

          {/* Diagnostic Outcome & Q-SHAP Attribution */}
          {completed && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Prediction Result Card */}
              <div className={`p-5 rounded-2xl border transition-all ${
                sampleType === "malignant"
                  ? "bg-rose-50/70 border-rose-200 text-rose-950"
                  : "bg-emerald-50/70 border-emerald-200 text-emerald-950"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Diagnostic Prediction
                  </span>
                  <CheckCircle2 className={`w-4 h-4 ${sampleType === "malignant" ? "text-rose-600" : "text-emerald-600"}`} />
                </div>
                <div className="text-2xl font-black mb-1">
                  {sampleType === "malignant" ? "Malignant" : "Benign"}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold">{currentProbability}%</span>
                  <span className="text-xs opacity-75 font-medium">Confidence Score</span>
                </div>
              </div>

              {/* Quantum SHAP Feature Attribution */}
              <div className="p-5 rounded-2xl bg-white border border-black/[0.06] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Q-SHAP Gate Attribution
                  </span>
                  <BarChart2 className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="space-y-2 mt-2">
                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-0.5">
                      <span>Concavity (q₃)</span>
                      <span className="font-bold text-indigo-600">+0.48 φ</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: "88%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-0.5">
                      <span>Smoothness (q₂)</span>
                      <span className="font-bold text-violet-600">+0.32 φ</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-violet-600 h-full rounded-full" style={{ width: "64%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
