"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Cpu,
  Zap,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Server,
  RefreshCw,
  Sliders,
  Layers,
} from "lucide-react";
import HelpTooltip from "@/components/common/HelpTooltip";
import { useQuantumBackend } from "@/hooks/useQuantumBackend";
import { showToast } from "@/components/common/ToastNotification";

export default function HardwarePage() {
  const { backend: activeBackend, setBackend: setActiveBackend } = useQuantumBackend();
  const [mitigationMode, setMitigationMode] = useState<"zne" | "trex" | "none">("zne");

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
              System Infrastructure
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-light text-ink tracking-tight">
            Quantum Computing Hardware &amp; Backends
          </h1>
          <p className="text-xs text-ink-soft font-light">
            Real-time status of physical quantum processors and GPU-accelerated simulation engines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              showToast({
                title: "Hardware Calibrated",
                message: "IBM Quantum Eagle telemetry & ZNE parameters updated.",
                type: "quantum",
              })
            }
            className="px-3 py-1.5 rounded-lg border border-hairline bg-parchment hover:bg-cream text-ink text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw size={13} /> Refresh Status
          </button>
        </div>
      </div>

      {/* Backend Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* IBM Quantum Eagle */}
        <div
          onClick={() => setActiveBackend("ibmq_eagle")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 relative overflow-hidden ${
            activeBackend === "ibmq_eagle"
              ? "bg-parchment border-quantum/60 shadow-xs ring-1 ring-quantum/30"
              : "bg-parchment/60 hover:bg-parchment border-hairline"
          }`}
        >
          {activeBackend === "ibmq_eagle" && (
            <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-quantum" />
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-quantum/10 border border-quantum/25 text-quantum flex items-center justify-center">
                <Cpu size={20} />
              </div>
              <div>
                <h3 className="font-serif text-base font-medium text-ink">IBM Quantum Computer (Eagle)</h3>
                <span className="text-[10px] font-mono text-ink-soft">127 Physical Quantum Qubits</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
              Online
            </span>
          </div>

          <p className="text-xs text-ink-soft font-light leading-relaxed">
            Real physical superconducting quantum hardware connected via IBM Quantum Cloud API. Computes entangled statevector diagnostics.
          </p>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-hairline font-mono text-[11px]">
            <div>
              <span className="text-[9px] text-ink-soft uppercase flex items-center gap-0.5">
                Coherence (T₁)
                <HelpTooltip text="Average time quantum information remains stable before environmental noise disrupts it." />
              </span>
              <span className="font-semibold text-ink">184.2 μs</span>
            </div>
            <div>
              <span className="text-[9px] text-ink-soft uppercase flex items-center gap-0.5">
                Dephasing (T₂)
                <HelpTooltip text="Measure of quantum phase stability during multi-gate calculations." />
              </span>
              <span className="font-semibold text-ink">142.6 μs</span>
            </div>
            <div>
              <span className="text-[9px] text-ink-soft uppercase flex items-center gap-0.5">
                Gate Accuracy
                <HelpTooltip text="Physical operation fidelity when entangling two qubits." />
              </span>
              <span className="font-semibold text-quantum">99.16%</span>
            </div>
          </div>
        </div>

        {/* High-Speed GPU Simulator */}
        <div
          onClick={() => setActiveBackend("gpu_simulator")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 relative overflow-hidden ${
            activeBackend === "gpu_simulator"
              ? "bg-parchment border-quantum/60 shadow-xs ring-1 ring-quantum/30"
              : "bg-parchment/60 hover:bg-parchment border-hairline"
          }`}
        >
          {activeBackend === "gpu_simulator" && (
            <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-quantum" />
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cream-deep/80 border border-hairline text-ink flex items-center justify-center">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="font-serif text-base font-medium text-ink">High-Speed GPU Simulator</h3>
                <span className="text-[10px] font-mono text-ink-soft">32-Qubit Ideal Matrix Engine</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200">
              Ultra Fast
            </span>
          </div>

          <p className="text-xs text-ink-soft font-light leading-relaxed">
            High-performance GPU calculation engine. Simulates perfect zero-noise quantum equations with instantaneous calculation speed.
          </p>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-hairline font-mono text-[11px]">
            <div>
              <span className="text-[9px] text-ink-soft uppercase block">Response Time</span>
              <span className="font-semibold text-ink">&lt; 4.2 ms</span>
            </div>
            <div>
              <span className="text-[9px] text-ink-soft uppercase block">Noise Level</span>
              <span className="font-semibold text-emerald-700">Zero (Ideal)</span>
            </div>
            <div>
              <span className="text-[9px] text-ink-soft uppercase block">Math Precision</span>
              <span className="font-semibold text-ink">64-bit Float</span>
            </div>
          </div>
        </div>
      </div>

      {/* Noise Reduction Options */}
      <div className="p-4 sm:p-5 rounded-2xl bg-parchment border border-hairline space-y-4 shadow-xs">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-serif text-base font-medium text-ink">Quantum Noise Reduction Protocols</h3>
            <HelpTooltip text="Methods used to filter out thermal and electromagnetic interference during physical quantum computer runs." />
          </div>
          <p className="text-xs text-ink-soft font-light">
            Choose how quantum measurement signals are filtered and cleaned during screening execution.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            onClick={() => setMitigationMode("zne")}
            className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1 ${
              mitigationMode === "zne"
                ? "bg-cream border-quantum/60 ring-1 ring-quantum/30"
                : "bg-cream/40 hover:bg-cream border-hairline"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-serif text-sm font-medium text-ink">Zero-Noise Extrapolation</span>
              {mitigationMode === "zne" && <CheckCircle2 size={13} className="text-quantum" />}
            </div>
            <p className="text-[11px] text-ink-soft font-light leading-snug">
              Artificially scales noise levels and calculates backwards to estimate the perfect zero-noise medical reading.
            </p>
          </div>

          <div
            onClick={() => setMitigationMode("trex")}
            className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1 ${
              mitigationMode === "trex"
                ? "bg-cream border-quantum/60 ring-1 ring-quantum/30"
                : "bg-cream/40 hover:bg-cream border-hairline"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-serif text-sm font-medium text-ink">Measurement Twirling</span>
              {mitigationMode === "trex" && <CheckCircle2 size={13} className="text-quantum" />}
            </div>
            <p className="text-[11px] text-ink-soft font-light leading-snug">
              Randomizes sensor measurements to eliminate detector bias and sensor inaccuracies.
            </p>
          </div>

          <div
            onClick={() => setMitigationMode("none")}
            className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1 ${
              mitigationMode === "none"
                ? "bg-cream border-quantum/60 ring-1 ring-quantum/30"
                : "bg-cream/40 hover:bg-cream border-hairline"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-serif text-sm font-medium text-ink">Raw Direct Execution</span>
              {mitigationMode === "none" && <CheckCircle2 size={13} className="text-quantum" />}
            </div>
            <p className="text-[11px] text-ink-soft font-light leading-snug">
              Fastest execution without mathematical error post-processing.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
