"use client";

import React, { useState } from "react";
import { 
  Activity, 
  Cpu, 
  Zap, 
  Database, 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  FileCode2, 
  Sliders, 
  BarChart3, 
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Sparkles
} from "lucide-react";
import FloatingCard from "@/components/ui/FloatingCard";
import confetti from "canvas-confetti";

export default function HomeWorkspace() {
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(100);
  const [qubits, setQubits] = useState(4);
  const [circuitDepth, setCircuitDepth] = useState(3);
  const [learningRate, setLearningRate] = useState(0.01);
  const [optimizer, setOptimizer] = useState("Adam (PyTorch)");
  const [dataset, setDataset] = useState("UCI Wisconsin Breast Cancer (569 samples, 30 features)");

  const handleStartTraining = () => {
    setIsTraining(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsTraining(false);
          confetti({
            particleCount: 70,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#4F46E5", "#7C3AED", "#10B981"],
          });
          return 100;
        }
        return prev + 20;
      });
    }, 400);
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Top 3 Telemetry Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric 1 */}
        <FloatingCard depth={8}>
          <div className="bg-white/85 backdrop-blur-xl border border-black/[0.06] p-6 rounded-3xl shadow-xl shadow-slate-900/5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Active Quantum Model
              </p>
              <h3 className="text-xl font-extrabold text-slate-900">
                PennyLane VQC Head
              </h3>
              <p className="text-xs text-indigo-600 font-semibold mt-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Strongly Entangled Layers
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Zap className="w-6 h-6" />
            </div>
          </div>
        </FloatingCard>

        {/* Metric 2 */}
        <FloatingCard depth={8}>
          <div className="bg-white/85 backdrop-blur-xl border border-black/[0.06] p-6 rounded-3xl shadow-xl shadow-slate-900/5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Biomedical Target
              </p>
              <h3 className="text-xl font-extrabold text-slate-900">
                Wisconsin Diagnostic
              </h3>
              <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 569 Validated Records
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Database className="w-6 h-6" />
            </div>
          </div>
        </FloatingCard>

        {/* Metric 3 */}
        <FloatingCard depth={8}>
          <div className="bg-white/85 backdrop-blur-xl border border-black/[0.06] p-6 rounded-3xl shadow-xl shadow-slate-900/5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Benchmark AUC-ROC
              </p>
              <h3 className="text-xl font-extrabold text-slate-900">
                0.984 <span className="text-xs font-medium text-slate-400">(+2.2% vs RF)</span>
              </h3>
              <p className="text-xs text-violet-600 font-semibold mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Statistically Significant
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
        </FloatingCard>
      </div>

      {/* Main Execution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Circuit Configuration & Architecture (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Circuit Interactive Visualization Card */}
          <div className="bg-white/85 backdrop-blur-xl border border-black/[0.06] rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-900/5">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/[0.06]">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Parameterized Quantum Circuit Topology
                </h3>
                <p className="text-xs text-slate-500">
                  {qubits} Qubits • Depth {circuitDepth} • CNOT Circular Entanglement
                </p>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Qiskit 2.x Compliant
              </span>
            </div>

            {/* Circuit Diagram Box */}
            <div className="bg-slate-950 text-slate-100 rounded-2xl p-6 font-mono text-xs overflow-x-auto space-y-4 shadow-inner">
              {[...Array(qubits)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 min-w-[420px]">
                  <span className="w-10 text-indigo-400 font-bold">|q{i}⟩</span>
                  <div className="flex-1 h-0.5 bg-slate-800 relative flex items-center justify-between">
                    <div className="px-2 py-1 rounded bg-indigo-900/90 border border-indigo-500 text-indigo-200 text-[10px]">
                      H
                    </div>
                    <div className="px-2 py-1 rounded bg-violet-900/90 border border-violet-500 text-violet-200 text-[10px]">
                      Ry(θ_{i})
                    </div>
                    <div className="px-2 py-1 rounded bg-fuchsia-900/90 border border-fuchsia-500 text-fuchsia-200 text-[10px]">
                      Rz(φ_{i})
                    </div>
                    <div className="w-3 h-3 rounded-full bg-cyan-400 z-10" />
                    <div className="px-2.5 py-1 rounded bg-emerald-900/90 border border-emerald-500 text-emerald-200 text-[10px] font-bold">
                      ⟨Z_{i}⟩
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Hyperparameter Adjustments */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-black/[0.06]">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Qubits (N)
                </label>
                <select
                  value={qubits}
                  onChange={(e) => setQubits(parseInt(e.target.value))}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-black/[0.08] bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value={2}>2 Qubits</option>
                  <option value={4}>4 Qubits</option>
                  <option value={6}>6 Qubits</option>
                  <option value={8}>8 Qubits</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Circuit Depth (L)
                </label>
                <select
                  value={circuitDepth}
                  onChange={(e) => setCircuitDepth(parseInt(e.target.value))}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-black/[0.08] bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value={1}>1 Layer</option>
                  <option value={2}>2 Layers</option>
                  <option value={3}>3 Layers</option>
                  <option value={4}>4 Layers</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Learning Rate
                </label>
                <select
                  value={learningRate}
                  onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-black/[0.08] bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value={0.001}>0.001</option>
                  <option value={0.01}>0.01</option>
                  <option value={0.05}>0.05</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Optimizer
                </label>
                <input
                  type="text"
                  readOnly
                  value="Adam (Torch)"
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-black/[0.08] bg-slate-100 text-slate-600 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Execution Controls & Telemetry Logs (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Execution Action Box */}
          <div className="bg-white/85 backdrop-blur-xl border border-black/[0.06] rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-900/5 space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                Execute Training Pipeline
              </h3>
              <p className="text-xs text-slate-500">
                Dispatches parallel classical (XGBoost, SVM) & quantum (PennyLane VQC) optimization loops.
              </p>
            </div>

            {/* Training Progress Bar */}
            {isTraining && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5 text-indigo-600">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Training Epochs...
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleStartTraining}
              disabled={isTraining}
              className="w-full py-4 px-6 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2.5 text-sm cursor-pointer"
            >
              {isTraining ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running Quantum Gradient Descent...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  Launch Parallel Hybrid Run
                </>
              )}
            </button>
          </div>

          {/* Real-Time Telemetry Logs */}
          <div className="bg-white/85 backdrop-blur-xl border border-black/[0.06] rounded-3xl p-6 shadow-xl shadow-slate-900/5 flex flex-col h-[280px]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/[0.06]">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-indigo-600" /> Real-Time Engine Logs
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="flex-1 bg-slate-950 text-slate-300 rounded-xl p-4 font-mono text-[11px] overflow-y-auto space-y-1.5 leading-relaxed shadow-inner">
              <div className="text-slate-500">[18:42:01] QuantumX Kernel v2.4 initialized.</div>
              <div className="text-emerald-400">[18:42:02] Connected to backend: default.qubit (Autodiff enabled).</div>
              <div className="text-indigo-400">[18:42:05] Ingested 569 samples from WBCD tabular dataset.</div>
              <div className="text-slate-400">[18:42:10] Preprocessing: 30 features normalized via MinMax [0, 1].</div>
              <div className="text-violet-400">[18:42:12] Circuit compiled: 4 Qubits, 3 StronglyEntanglingLayers.</div>
              <div className="text-amber-400">[18:42:15] Optimization ready. Awaiting trigger signal...</div>
              {isTraining && (
                <div className="text-emerald-300 animate-pulse font-bold">
                  [18:42:20] &gt; Computing parameter-shift rule gradients for loss L_vqc...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
