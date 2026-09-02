"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Heart,
  Droplets,
  Lock,
  ArrowRight,
  X,
  Microscope,
  Layers,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Activity,
  History,
  CheckCircle2,
  AlertCircle,
  Zap
} from "lucide-react";
import HelpTooltip from "@/components/common/HelpTooltip";

interface DiseaseModule {
  key: string;
  title: string;
  category: string;
  datasetName: string;
  status: "active" | "beta_locked";
  statusLabel: string;
  icon: any;
  description: string;
  targetUrl?: string;
  metrics: {
    cohortSize: string;
    engine: string;
    accuracy: string;
  };
}

const DISEASE_MODULES: DiseaseModule[] = [
  {
    key: "breast_cancer",
    title: "Breast Cancer Screening Studio",
    category: "Oncology & Cytopathology",
    datasetName: "569 Verified FNA Biopsies",
    status: "active",
    statusLabel: "Ready (v1.0-PROD)",
    icon: Microscope,
    description: "Evaluates 8 fine-needle biopsy cellular morphometric biomarkers (cell radius, perimeter, concavity, and texture) using 8-qubit variational quantum circuits and classical ensembles.",
    targetUrl: "/predict/breast-cancer",
    metrics: {
      cohortSize: "569 Tissue Cases",
      engine: "Dual-Engine (Transfinite-1 & CX-01)",
      accuracy: "98.2% Consensus"
    }
  },
  {
    key: "heart_disease",
    title: "Cardiovascular Disease Risk",
    category: "Cardiology & Vascular",
    datasetName: "303 Patient Records",
    status: "beta_locked",
    statusLabel: "Beta / Calibrating",
    icon: Heart,
    description: "Evaluates non-linear correlations between exercise ECG ST wave depression, resting systolic pressure, and fluoroscopy vessel constriction markers.",
    metrics: {
      cohortSize: "303 Clinical Records",
      engine: "Cardiovascular VQC Ansatz",
      accuracy: "Under Multi-Center Trial"
    }
  },
  {
    key: "kidney_neurological",
    title: "Neurological & Kidney Disease",
    category: "Nephrology & Neurology",
    datasetName: "400 Patient Records",
    status: "beta_locked",
    statusLabel: "Beta / Calibrating",
    icon: Droplets,
    description: "Evaluates serum creatinine clearance decay, blood urea nitrogen retention, and neurological signaling anomalies to forecast acute filtration loss.",
    metrics: {
      cohortSize: "400 Renal Records",
      engine: "Tensor-Entangled Renal VQC",
      accuracy: "Under Multi-Center Trial"
    }
  }
];

export default function PredictHubPage() {
  const router = useRouter();
  const [lockedModal, setLockedModal] = useState<{ isOpen: boolean; title: string; category: string } | null>(null);

  const handleModuleClick = (mod: DiseaseModule) => {
    if (mod.status === "active" && mod.targetUrl) {
      router.push(mod.targetUrl);
    } else {
      setLockedModal({
        isOpen: true,
        title: mod.title,
        category: mod.category
      });
    }
  };

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* LOCKED NOTICE MODAL */}
      <AnimatePresence>
        {lockedModal?.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-hairline bg-parchment p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">
                      {lockedModal.title}
                    </h3>
                    <span className="text-[11px] font-mono text-amber-700 font-medium">
                      Clinical Calibration Phase (Locked)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLockedModal(null)}
                  className="rounded-lg p-1.5 text-ink-soft hover:bg-cream hover:text-ink cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-ink-soft leading-relaxed">
                <p>
                  The <strong className="text-ink">{lockedModal.title}</strong> module is currently undergoing multi-center validation and quantum noise mitigation before clinical deployment.
                </p>
                <div className="p-3 rounded-xl bg-cream/40 border border-hairline flex items-center gap-2.5 text-ink">
                  <CheckCircle2 size={16} className="text-quantum shrink-0" />
                  <span>
                    Our <strong>Breast Cancer Cellular Screening Studio</strong> is fully active with dual classical-quantum pipelines ready for live screening.
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setLockedModal(null)}
                  className="px-3 py-1.5 rounded-xl border border-hairline text-xs text-ink hover:bg-cream cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLockedModal(null);
                    router.push("/predict/breast-cancer");
                  }}
                  className="px-4 py-1.5 rounded-xl bg-ink text-parchment text-xs font-semibold hover:bg-ink/90 flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <span>Open Breast Cancer Studio</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOP DIRECTORY HEADER */}
      <div className="border-b border-hairline pb-5 space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-quantum" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-quantum font-bold">
            DIAGNOSTIC SCREENING PORTAL
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-light text-ink tracking-tight">
              Patient Disease Screening Hub
            </h1>
            <p className="text-xs text-ink-soft font-light">
              Select an active disease module below to launch its dedicated clinical screening studio.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/predict/breast-cancer"
              className="px-3.5 py-2 rounded-xl bg-ink hover:bg-ink/90 text-parchment text-xs font-semibold flex items-center gap-2 transition-all shadow-xs"
            >
              <Microscope size={14} className="text-quantum" />
              <span>Launch Active Studio</span>
              <ArrowRight size={13} className="text-parchment/70" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3 DISEASE MODULE SELECTION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        {DISEASE_MODULES.map((mod) => {
          const isActive = mod.status === "active";
          const IconComp = mod.icon;

          return (
            <div
              key={mod.key}
              onClick={() => handleModuleClick(mod)}
              className={`rounded-2xl border p-5.5 flex flex-col justify-between transition-all relative overflow-hidden cursor-pointer shadow-xs ${
                isActive
                  ? "bg-white border-quantum/40 hover:border-quantum hover:shadow-md ring-1 ring-quantum/20"
                  : "bg-parchment border-hairline opacity-85 hover:opacity-100 hover:border-amber-300"
              }`}
            >
              {/* Card Top: Icon, Category & Status Badge */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                      isActive
                        ? "bg-quantum/10 text-quantum border border-quantum/20"
                        : "bg-amber-50 text-amber-600 border border-amber-200"
                    }`}
                  >
                    <IconComp size={22} />
                  </div>
                  {isActive ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ● READY (v1.0-PROD)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                      <Lock size={10} /> BETA (LOCKED)
                    </span>
                  )}
                </div>

                {/* Module Details */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-ink-soft font-semibold block">
                    {mod.category}
                  </span>
                  <h3 className="font-serif text-lg font-medium text-ink leading-tight">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-ink-soft leading-relaxed">
                    {mod.description}
                  </p>
                </div>
              </div>

              {/* Card Bottom: Metrics & Action */}
              <div className="pt-4 border-t border-hairline mt-5 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-ink-soft">
                  <div>
                    <span className="block text-[9px] uppercase font-semibold text-ink-soft/70">Cohort</span>
                    <strong className="text-ink">{mod.metrics.cohortSize}</strong>
                  </div>
                  <div className="text-right">
                    <span className="block text-[9px] uppercase font-semibold text-ink-soft/70">Validation</span>
                    <strong className={isActive ? "text-emerald-700" : "text-amber-700"}>
                      {mod.metrics.accuracy}
                    </strong>
                  </div>
                </div>

                {isActive ? (
                  <Link
                    href={mod.targetUrl!}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full py-2.5 px-3 rounded-xl bg-ink hover:bg-ink/90 text-parchment text-xs font-semibold flex items-center justify-between transition-all"
                  >
                    <span>Open Clinical Studio</span>
                    <ArrowRight size={13} className="text-quantum" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleModuleClick(mod);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-cream hover:bg-cream-deep/60 border border-hairline text-ink-soft hover:text-ink text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Lock size={12} className="text-amber-600" />
                    <span>In Clinical Calibration</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MULTI-DISEASE SCREENING ARCHITECTURE OVERVIEW */}
      <div className="bg-parchment rounded-2xl border border-hairline p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-hairline pb-3">
          <div>
            <h2 className="font-serif text-lg font-medium text-ink">
              QuantumX Multi-Disease Screening Architecture
            </h2>
            <p className="text-xs text-ink-soft">
              How dual-engine classical and variational quantum models evaluate clinical risk
            </p>
          </div>
          <span className="text-xs font-mono text-quantum font-semibold bg-quantum/10 px-2.5 py-1 rounded-full border border-quantum/20">
            Validated Framework
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Dual Engine Run */}
          <div className="p-4 rounded-xl bg-white border border-hairline space-y-2 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-quantum/10 text-quantum flex items-center justify-center">
              <Zap size={16} />
            </div>
            <h4 className="text-xs font-bold text-ink">Simultaneous Dual-Engine Execution</h4>
            <p className="text-xs text-ink-soft leading-relaxed">
              Every screening pass concurrently runs classical ML baseline (CX-01) and an 8-qubit variational quantum classifier (Transfinite-1) on independent pipelines.
            </p>
          </div>

          {/* Card 2: SHAP Explainability */}
          <div className="p-4 rounded-xl bg-white border border-hairline space-y-2 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity size={16} />
            </div>
            <h4 className="text-xs font-bold text-ink">Directional SHAP Risk Attribution</h4>
            <p className="text-xs text-ink-soft leading-relaxed">
              Calculates distinct quantum and classical feature impacts so clinicians know which exact cellular or physiological measurements elevated risk.
            </p>
          </div>

          {/* Card 3: IBM Hardware Path */}
          <div className="p-4 rounded-xl bg-white border border-hairline space-y-2 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Cpu size={16} />
            </div>
            <h4 className="text-xs font-bold text-ink">Physical IBM Quantum Target (Aleph-1)</h4>
            <p className="text-xs text-ink-soft leading-relaxed">
              Built on 127-qubit IBM Eagle superconducting quantum hardware architecture with automated Pauli-Z tensor mapping and readout error mitigation.
            </p>
          </div>
        </div>

        {/* Quick System Navigation Footer */}
        <div className="pt-3 border-t border-hairline flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-ink-soft font-mono text-[11px]">
            Ready to test? Access live diagnostics or explore system benchmarks.
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/benchmarks"
              className="text-xs font-medium text-ink hover:text-quantum hover:underline flex items-center gap-1"
            >
              <TrendingUp size={13} />
              <span>Model Benchmarks</span>
            </Link>
            <Link
              href="/hardware"
              className="text-xs font-medium text-ink hover:text-quantum hover:underline flex items-center gap-1"
            >
              <Cpu size={13} />
              <span>Hardware Telemetry</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
