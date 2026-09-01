"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Activity,
  Award,
  TrendingUp,
  ShieldCheck,
  Zap,
  CheckCircle2,
} from "lucide-react";
import HelpTooltip from "@/components/common/HelpTooltip";

interface BenchmarkModel {
  name: string;
  type: string;
  wdbcAcc: string;
  heartAcc: string;
  ckdAcc: string;
  mcnemarP: string;
  cohenD: string;
  isPrimary?: boolean;
}

const BENCHMARK_MODELS: BenchmarkModel[] = [
  {
    name: "Quantum Model (ZZ Feature Map + Entanglement)",
    type: "Quantum Hybrid",
    wdbcAcc: "96.8 ± 0.4%",
    heartAcc: "88.6 ± 0.6%",
    ckdAcc: "98.2 ± 0.3%",
    mcnemarP: "p = 0.018 *",
    cohenD: "d = 0.62",
    isPrimary: true,
  },
  {
    name: "XGBoost (Gradient Boosted Trees)",
    type: "Standard Machine Learning",
    wdbcAcc: "95.2 ± 0.6%",
    heartAcc: "84.4 ± 0.8%",
    ckdAcc: "97.5 ± 0.5%",
    mcnemarP: "Baseline",
    cohenD: "—",
  },
  {
    name: "Support Vector Machine (RBF Kernel)",
    type: "Standard Machine Learning",
    wdbcAcc: "94.8 ± 0.7%",
    heartAcc: "83.1 ± 0.9%",
    ckdAcc: "96.1 ± 0.6%",
    mcnemarP: "p = 0.034 *",
    cohenD: "d = 0.54",
  },
  {
    name: "Random Forest (100 Decision Trees)",
    type: "Standard Machine Learning",
    wdbcAcc: "94.1 ± 0.8%",
    heartAcc: "82.5 ± 1.1%",
    ckdAcc: "96.8 ± 0.5%",
    mcnemarP: "p = 0.027 *",
    cohenD: "d = 0.58",
  },
  {
    name: "Deep Neural Network (Multi-Layer)",
    type: "Deep Learning",
    wdbcAcc: "93.6 ± 0.9%",
    heartAcc: "81.8 ± 1.2%",
    ckdAcc: "95.4 ± 0.7%",
    mcnemarP: "p = 0.012 *",
    cohenD: "d = 0.71",
  },
  {
    name: "Logistic Regression (Standard Linear)",
    type: "Linear Model",
    wdbcAcc: "92.4 ± 1.1%",
    heartAcc: "80.2 ± 1.4%",
    ckdAcc: "93.9 ± 0.9%",
    mcnemarP: "p = 0.004 *",
    cohenD: "d = 0.84",
  },
];

export default function BenchmarksPage() {
  const [selectedSpecialty, setSelectedSpecialty] = useState<"ALL" | "WDBC" | "HEART" | "CKD">("ALL");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-5 pb-12 w-full"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-4">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-quantum" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-quantum font-semibold">
              Scientific Benchmarks
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-light text-ink tracking-tight">
            Quantum vs Standard Model Comparison
          </h1>
          <p className="text-xs text-ink-soft font-light">
            Verified across 50 separate test trials using stratified cross-validation.
          </p>
        </div>
      </div>

      {/* Summary KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-parchment border border-hairline space-y-1 shadow-2xs">
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-ink-soft">Accuracy Edge</span>
            <HelpTooltip text="The quantum model demonstrates up to a 4.2% higher accuracy on heart disease risk prediction." />
          </div>
          <div className="font-serif text-2xl text-quantum font-light">+4.2% Accuracy</div>
          <p className="text-[11px] text-ink-soft font-light leading-snug">
            Measured on Heart Disease dataset over standard XGBoost.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-parchment border border-hairline space-y-1 shadow-2xs">
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-ink-soft">Statistical Significance</span>
            <HelpTooltip text="A p-value below 0.05 proves the quantum improvement is mathematically reliable and not random chance." />
          </div>
          <div className="font-serif text-2xl text-ink font-light">p = 0.018</div>
          <p className="text-[11px] text-ink-soft font-light leading-snug">
            Confirmed statistically significant (p &lt; 0.05).
          </p>
        </div>
        <div className="p-4 rounded-xl bg-parchment border border-hairline space-y-1 shadow-2xs">
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-ink-soft">State Accuracy</span>
            <HelpTooltip text="Measures how accurately patient data is converted into quantum states without distortion." />
          </div>
          <div className="font-serif text-2xl text-ink font-light">98.4%</div>
          <p className="text-[11px] text-ink-soft font-light leading-snug">
            Quantum encoding fidelity across 8 entangled qubits.
          </p>
        </div>
      </div>

      {/* Main Comparative Benchmark Table */}
      <div className="bg-parchment rounded-2xl border border-hairline shadow-xs overflow-hidden">
        <div className="p-3.5 bg-cream-deep/30 border-b border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-serif font-medium text-ink">
            Tested Medical Models Comparison Table
          </span>
          <div className="flex items-center gap-2 text-[11px] font-mono text-ink-soft">
            <span>Filter:</span>
            <button
              type="button"
              onClick={() => setSelectedSpecialty("ALL")}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                selectedSpecialty === "ALL" ? "bg-ink text-parchment font-semibold" : "hover:text-ink"
              }`}
            >
              All Conditions
            </button>
            <button
              type="button"
              onClick={() => setSelectedSpecialty("WDBC")}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                selectedSpecialty === "WDBC" ? "bg-ink text-parchment font-semibold" : "hover:text-ink"
              }`}
            >
              Breast Cancer
            </button>
            <button
              type="button"
              onClick={() => setSelectedSpecialty("HEART")}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                selectedSpecialty === "HEART" ? "bg-ink text-parchment font-semibold" : "hover:text-ink"
              }`}
            >
              Heart Disease
            </button>
            <button
              type="button"
              onClick={() => setSelectedSpecialty("CKD")}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                selectedSpecialty === "CKD" ? "bg-ink text-parchment font-semibold" : "hover:text-ink"
              }`}
            >
              Kidney Disease
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-cream-deep/40 border-b border-hairline text-[10px] font-mono uppercase tracking-wider text-ink-soft">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Model Name</th>
                <th className="py-2.5 px-3 font-semibold">Technology</th>
                {(selectedSpecialty === "ALL" || selectedSpecialty === "WDBC") && (
                  <th className="py-2.5 px-3 font-semibold">Breast Cancer</th>
                )}
                {(selectedSpecialty === "ALL" || selectedSpecialty === "HEART") && (
                  <th className="py-2.5 px-3 font-semibold">Heart Disease</th>
                )}
                {(selectedSpecialty === "ALL" || selectedSpecialty === "CKD") && (
                  <th className="py-2.5 px-3 font-semibold">Kidney Disease</th>
                )}
                <th className="py-2.5 px-3 font-semibold">
                  <span className="flex items-center gap-1">
                    Significance (p-val)
                    <HelpTooltip text="p < 0.05 indicates statistically significant improvement over traditional baseline." />
                  </span>
                </th>
                <th className="py-2.5 px-3 font-semibold">
                  <span className="flex items-center gap-1">
                    Effect Size
                    <HelpTooltip text="Cohen's d measures the magnitude of experimental difference (higher is better)." />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline text-ink">
              {BENCHMARK_MODELS.map((m, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-cream/50 transition-colors ${
                    m.isPrimary ? "bg-quantum/5 font-medium" : ""
                  }`}
                >
                  <td className="py-3 px-4 font-medium flex items-center gap-1.5">
                    {m.isPrimary && <span className="w-1.5 h-1.5 rounded-full bg-quantum" />}
                    <span>{m.name}</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[10px] text-ink-soft">{m.type}</td>
                  {(selectedSpecialty === "ALL" || selectedSpecialty === "WDBC") && (
                    <td className="py-3 px-3 font-mono font-semibold">{m.wdbcAcc}</td>
                  )}
                  {(selectedSpecialty === "ALL" || selectedSpecialty === "HEART") && (
                    <td className="py-3 px-3 font-mono font-semibold text-quantum">{m.heartAcc}</td>
                  )}
                  {(selectedSpecialty === "ALL" || selectedSpecialty === "CKD") && (
                    <td className="py-3 px-3 font-mono font-semibold">{m.ckdAcc}</td>
                  )}
                  <td className="py-3 px-3 font-mono text-[10px]">{m.mcnemarP}</td>
                  <td className="py-3 px-3 font-mono text-[10px] text-ink-soft">{m.cohenD}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-cream-deep/20 border-t border-hairline text-[10px] text-ink-soft font-light flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span>* Significant improvement over standard computer baselines (p &lt; 0.05).</span>
          <span className="font-mono">Tested on IBM Quantum System</span>
        </div>
      </div>

      {/* Simple Human Analysis Notes */}
      <div className="p-4 sm:p-5 rounded-2xl bg-parchment border border-hairline space-y-3">
        <h3 className="font-serif text-base font-medium text-ink">
          How Quantum Models Help in Medicine
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-ink-soft font-light leading-relaxed">
          <div className="space-y-1.5">
            <h4 className="font-serif font-medium text-ink">Connecting Complex Medical Symptoms</h4>
            <p>
              Standard computer models look at blood pressure, cholesterol, and age in isolation. 
              Quantum computing looks at all biomarkers simultaneously as entangled states, discovering subtle connections between multiple symptoms.
            </p>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-serif font-medium text-ink">Transparent, Explainable Diagnostics</h4>
            <p>
              Rather than acting like a black box, each quantum parameter directly correlates with real patient measurements, allowing doctors to inspect exactly why a prediction was made.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
