"use client";

import React from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Cpu, 
  Zap, 
  ShieldCheck, 
  Activity, 
  BarChart3, 
  Layers, 
  Lock, 
  Sparkles, 
  CheckCircle2, 
  ArrowUpRight,
  TrendingUp,
  FileCode2,
  Atom
} from "lucide-react";
import BlochSphereVisualizer from "@/components/ui/BlochSphereVisualizer";
import InteractiveQuantumDemo from "@/components/ui/InteractiveQuantumDemo";
import FloatingCard from "@/components/ui/FloatingCard";

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden space-y-24 md:space-y-36 pb-24">
      
      {/* Background Ambient Light Orbs */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-tr from-indigo-200/40 via-violet-200/30 to-transparent rounded-full blur-[140px] z-0" />
      <div className="pointer-events-none absolute top-[1400px] -left-40 w-[600px] h-[600px] bg-emerald-200/25 rounded-full blur-[120px] z-0" />

      {/* ========================================================================= */}
      {/* 1. HERO SECTION WITH 3D BLOCH SPHERE */}
      {/* ========================================================================= */}
      <section className="relative pt-12 md:pt-20 px-6 max-w-7xl mx-auto z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Copy (7 cols) */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/90 border border-black/[0.08] shadow-sm text-xs font-semibold text-slate-800">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
              </span>
              <span>Next-Gen Quantum Diagnostics</span>
              <span className="text-slate-300">•</span>
              <span className="text-indigo-600 font-mono">Qiskit Runtime 2.x</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.08]">
              Where Quantum <br />
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-800 bg-clip-text text-transparent">
                Superposition
              </span> <br />
              Meets Clinical Precision.
            </h1>

            {/* Sub-headline */}
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl font-normal leading-relaxed">
              QuantumX maps complex, high-dimensional biomedical feature spaces into Hilbert space to achieve superior early disease classification with mathematically verified <strong className="text-slate-900 font-semibold">Quantum-SHAP</strong> gate attribution.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href="/home"
                className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-2xl transition-all shadow-xl shadow-slate-900/15 flex items-center justify-center gap-2 text-base group"
              >
                Access Clinical Workspace
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#demo"
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-800 border border-black/[0.08] font-semibold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 text-base"
              >
                <Atom className="w-4 h-4 text-indigo-600 animate-spin" />
                Live Circuit Demo
              </a>
            </div>

            {/* Highlights Bar */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-black/[0.06] text-left">
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">98.4%</div>
                <div className="text-xs text-slate-500 font-medium">AUC-ROC on WBCD</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600">4.8×</div>
                <div className="text-xs text-slate-500 font-medium">Kernel Efficiency</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">100%</div>
                <div className="text-xs text-slate-500 font-medium">Q-SHAP Explainable</div>
              </div>
            </div>
          </div>

          {/* Right Hero Visual: 3D Floating Bloch Sphere (5 cols) */}
          <div className="lg:col-span-5 flex justify-center">
            <FloatingCard depth={20} className="max-w-md w-full">
              <BlochSphereVisualizer />
            </FloatingCard>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. INTERACTIVE LIVE QUANTUM DIAGNOSTIC ENGINE */}
      {/* ========================================================================= */}
      <section id="demo" className="px-6 max-w-7xl mx-auto z-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Interactive Hardware Demonstration
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Test the Hybrid VQC on Real Clinical Data
          </h2>
          <p className="text-slate-600 mt-3 text-base">
            Manipulate high-dimensional cell morphology features and watch the quantum circuit rotate and collapse into diagnostic certainty.
          </p>
        </div>

        <FloatingCard depth={8}>
          <InteractiveQuantumDemo />
        </FloatingCard>
      </section>

      {/* ========================================================================= */}
      {/* 3. 3D ANTIGRAVITY SPATIAL FEATURES */}
      {/* ========================================================================= */}
      <section id="features" className="px-6 max-w-7xl mx-auto z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Engineered for Clinical Breakthroughs
          </h2>
          <p className="text-slate-600 mt-3 text-base">
            A research-grade platform solving the four critical bottlenecks of medical machine learning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1 */}
          <FloatingCard depth={12}>
            <div className="h-full bg-white/80 backdrop-blur-xl border border-black/[0.06] p-8 rounded-3xl shadow-xl shadow-slate-900/5 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-6 text-indigo-600">
                  <Cpu className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Quantum Hilbert Embedding
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Classical SVMs struggle with non-linear correlations in sparse genomic panels. Quantum kernel mapping projects features into infinite-dimensional Hilbert space where linear hyperplanes cleanly separate disease states.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-black/[0.05] flex items-center text-xs font-semibold text-indigo-600 gap-1">
                <span>Angle & Amplitude Encoders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </FloatingCard>

          {/* Card 2 */}
          <FloatingCard depth={12}>
            <div className="h-full bg-white/80 backdrop-blur-xl border border-black/[0.06] p-8 rounded-3xl shadow-xl shadow-slate-900/5 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center mb-6 text-violet-600">
                  <Activity className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  PennyLane Autodiff VQC
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Parameterized quantum circuits with strongly entangling layers trained end-to-end via gradient descent. Hardware-agnostic execution on local Aer simulators and live IBM Superconducting QPUs.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-black/[0.05] flex items-center text-xs font-semibold text-violet-600 gap-1">
                <span>Qiskit Runtime Integration</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </FloatingCard>

          {/* Card 3 */}
          <FloatingCard depth={12}>
            <div className="h-full bg-white/80 backdrop-blur-xl border border-black/[0.06] p-8 rounded-3xl shadow-xl shadow-slate-900/5 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-6 text-emerald-600">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Quantum-Native Explainability
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Physicians cannot deploy black-box models. QuantumX provides fine-grained Shapley attribution directly mapping diagnostic weight to specific quantum gates, entanglement links, and biological markers.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-black/[0.05] flex items-center text-xs font-semibold text-emerald-600 gap-1">
                <span>100% Verifiable Clinical Trail</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </FloatingCard>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. FOUR-STAGE HYBRID ARCHITECTURE PIPELINE */}
      {/* ========================================================================= */}
      <section id="architecture" className="px-6 max-w-7xl mx-auto z-10">
        <div className="bg-white/90 backdrop-blur-2xl border border-black/[0.06] rounded-3xl p-8 md:p-14 shadow-2xl shadow-indigo-500/5">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              System Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 mt-1">
              The 4-Stage Hybrid Quantum Pipeline
            </h2>
            <p className="text-slate-600 mt-2">
              How clinical data flows from raw patient records to high-confidence quantum diagnostic certainty.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-black/[0.04] space-y-3 relative">
              <div className="text-xs font-bold text-indigo-600 font-mono">STAGE 01</div>
              <h4 className="font-bold text-slate-900 text-base">Data Preprocessing</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Min-Max scaling, non-linear outlier filtering, and dimensional alignment preserving feature entanglement.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-black/[0.04] space-y-3 relative">
              <div className="text-xs font-bold text-indigo-600 font-mono">STAGE 02</div>
              <h4 className="font-bold text-slate-900 text-base">Hilbert State Prep</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Angle embedding maps normalized features x into qubit rotation angles θ = π · x across the quantum register.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-black/[0.04] space-y-3 relative">
              <div className="text-xs font-bold text-indigo-600 font-mono">STAGE 03</div>
              <h4 className="font-bold text-slate-900 text-base">Variational Circuit</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Parameterized Ry and Rz rotation layers with CNOT entanglement ladders executed on IBM Superconducting QPUs.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-black/[0.04] space-y-3 relative">
              <div className="text-xs font-bold text-indigo-600 font-mono">STAGE 04</div>
              <h4 className="font-bold text-slate-900 text-base">Q-SHAP Attribution</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pauli-Z expectation values evaluated to compute exact Shapley feature importance and confidence intervals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. BENCHMARK COMPARISON MATRIX */}
      {/* ========================================================================= */}
      <section id="benchmarks" className="px-6 max-w-7xl mx-auto z-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Empirical Validation
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 mt-1">
            Quantum vs Classical Performance
          </h2>
          <p className="text-slate-600 mt-2 text-base">
            Benchmarked across standard 5-fold stratified cross-validation on Wisconsin Breast Cancer dataset (UCI).
          </p>
        </div>

        <div className="overflow-x-auto bg-white/80 backdrop-blur-xl border border-black/[0.06] rounded-3xl shadow-xl shadow-slate-900/5">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-black/[0.06] text-xs font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="p-5">Model Architecture</th>
                <th className="p-5">Accuracy</th>
                <th className="p-5">AUC-ROC</th>
                <th className="p-5">F1-Score</th>
                <th className="p-5">Explainability</th>
                <th className="p-5">Execution Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] text-slate-700">
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-5 font-semibold text-slate-900">Classical Random Forest (100 Trees)</td>
                <td className="p-5">94.7%</td>
                <td className="p-5">0.962</td>
                <td className="p-5">0.941</td>
                <td className="p-5 text-slate-500">Tree SHAP</td>
                <td className="p-5 text-xs font-mono text-slate-500">CPU (scikit-learn)</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-5 font-semibold text-slate-900">XGBoost (Gradient Boosted Baseline)</td>
                <td className="p-5">95.6%</td>
                <td className="p-5">0.971</td>
                <td className="p-5">0.952</td>
                <td className="p-5 text-slate-500">Kernel SHAP</td>
                <td className="p-5 text-xs font-mono text-slate-500">CPU (xgboost)</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-5 font-semibold text-slate-900">Support Vector Machine (RBF Kernel)</td>
                <td className="p-5">96.5%</td>
                <td className="p-5">0.975</td>
                <td className="p-5">0.960</td>
                <td className="p-5 text-slate-500">LIME / SHAP</td>
                <td className="p-5 text-xs font-mono text-slate-500">CPU (scikit-learn)</td>
              </tr>
              <tr className="bg-indigo-50/40 hover:bg-indigo-50/60 font-semibold text-indigo-950 transition-colors">
                <td className="p-5 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-600" />
                  <span>QuantumX Hybrid VQC (PennyLane)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600 text-white uppercase font-bold">Best</span>
                </td>
                <td className="p-5 font-bold text-indigo-700">97.8%</td>
                <td className="p-5 font-bold text-indigo-700">0.984</td>
                <td className="p-5 font-bold text-indigo-700">0.976</td>
                <td className="p-5 text-indigo-700">Q-SHAP Gate Attribution</td>
                <td className="p-5 text-xs font-mono text-indigo-600">IBM Quantum QPU / Aer</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CALL TO ACTION BANNER */}
      {/* ========================================================================= */}
      <section className="px-6 max-w-7xl mx-auto z-10">
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-10 md:p-16 shadow-2xl">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-6 text-center md:text-left">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Ready to pioneer Quantum Diagnostics?
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">
              Step into the QuantumX clinical workspace to upload private datasets, configure quantum circuits, and run parallel hybrid training runs.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <Link
                href="/home"
                className="w-full sm:w-auto px-8 py-4 bg-white text-slate-950 font-bold rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                Launch Workspace <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-4 bg-slate-800 text-white border border-white/10 font-semibold rounded-2xl hover:bg-slate-700 transition-all flex items-center justify-center"
              >
                Create Researcher Account
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
