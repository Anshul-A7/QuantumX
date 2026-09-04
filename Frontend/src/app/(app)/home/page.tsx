"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Stethoscope,
  Activity,
  History,
  Cpu,
  ArrowRight,
  ShieldCheck,
  Zap,
  Play,
  FlaskConical,
  Inbox,
  Clock,
  Sparkles,
  ChevronRight,
  Heart,
  Droplets,
} from "lucide-react";
import HelpTooltip from "@/components/common/HelpTooltip";
import { useQuantumBackend } from "@/hooks/useQuantumBackend";



const DISEASE_MODULES = [
  {
    key: "breast_cancer",
    title: "Breast Cancer Screening",
    category: "Cancer Care",
    icon: Sparkles,
    dataset: "569 Verified Clinical Samples",
    features: "Cell Shape & Texture Analysis",
    target: "Malignant vs Benign",
    advantage: "+3.8% Better Accuracy",
    description: "Evaluates microscopic cell boundary smoothness and tumor thickness using quantum algorithms.",
    route: "/predict/breast-cancer",
    tooltip: "Uses quantum computing to detect subtle irregular tumor shapes that traditional computer tests often miss.",
  },
  {
    key: "heart_disease",
    title: "Heart Disease Risk",
    category: "Cardiology",
    icon: Heart,
    dataset: "303 Patient Health Records",
    features: "Blood Pressure, Vessels & Stress",
    target: "High Risk vs Healthy",
    advantage: "+4.2% Better Accuracy",
    description: "Detects hidden interactions between exercise heart rates, blood pressure, and vessel blockages.",
    route: "/predict/heart-disease",
    tooltip: "Finds complex multi-symptom risk combinations between cholesterol, exercise test results, and blood pressure.",
  },
  {
    key: "chronic_kidney",
    title: "Kidney Disease Screening",
    category: "Kidney Care",
    icon: Droplets,
    dataset: "400 Kidney Health Profiles",
    features: "Blood & Urine Health Markers",
    target: "Kidney Disease vs Normal",
    advantage: "+2.9% Better Accuracy",
    description: "Monitors blood sugar, urea filtration, and protein levels to forecast kidney health changes.",
    route: "/predict/chronic-kidney",
    tooltip: "Analyzes early kidney filtration biomarkers to identify loss of renal function before severe symptoms start.",
  },
];

import { AuthService } from "@/services/auth.service";
import { ScreeningService, type StoredPrediction } from "@/services/screening.service";

export default function HomePage() {
  const { backend } = useQuantumBackend();
  const [userName, setUserName] = useState<string>("");
  const [recentPredictions, setRecentPredictions] = useState<StoredPrediction[]>([]);

  useEffect(() => {
    // 1. Load real user profile
    const cachedUser = AuthService.getCachedUser();
    if (cachedUser) {
      setUserName(cachedUser.fullName || cachedUser.username || "Investigator");
    }

    // 2. Instant 0ms cached screenings load
    const cached = ScreeningService.getCachedScreenings();
    if (cached && cached.length > 0) {
      setRecentPredictions(cached.slice(0, 5));
    }

    // 3. Parallel background sync with Supabase DB
    ScreeningService.getScreenings()
      .then((records) => {
        setRecentPredictions((records || []).slice(0, 5));
      })
      .catch(() => {});
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6 pb-12 w-full"
    >
      {/* ========================================================================= */}
      {/* 1. EXECUTIVE WELCOME BANNER */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="w-full bg-parchment rounded-2xl border border-hairline/90 p-5 sm:p-6 md:p-7 shadow-xs relative overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cream-deep/60 border border-hairline text-[11px] font-sans text-ink-soft">
              <span className="w-1.5 h-1.5 rounded-full bg-quantum" />
              <span>Quantum-Assisted Medical Diagnostics System</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-light text-ink tracking-tight">
              Welcome, <span className="italic font-normal">{userName}</span>
            </h1>
            <p className="text-ink-soft text-xs sm:text-sm font-light leading-relaxed">
              Run quick diagnostic screenings for patients, compare quantum and standard computer predictions side by side, and review past reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/predict"
              className="px-4 py-2 rounded-lg bg-ink text-parchment font-medium text-xs tracking-wider hover:opacity-90 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Play size={12} className="fill-parchment" /> Start Patient Screening
            </Link>
            <Link
              href="/benchmarks"
              className="px-4 py-2 rounded-lg bg-cream-deep/70 hover:bg-cream border border-hairline text-ink font-medium text-xs tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Activity size={12} /> Model Accuracy
            </Link>
          </div>
        </div>

        {/* 4 Summary Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-5 mt-5 border-t border-hairline">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-ink-soft">Available Tests</span>
              <HelpTooltip text="Three specialized health categories: Breast Cancer, Heart Disease, and Kidney Function." />
            </div>
            <div className="font-serif text-xl sm:text-2xl text-ink font-light">3 <span className="text-[10px] font-sans text-ink-soft">conditions</span></div>
            <p className="text-[10px] text-ink-soft font-light">Cancer, Heart, and Kidney</p>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-ink-soft">Quantum Advantage</span>
              <HelpTooltip text="Our quantum model achieves up to 4.2% higher accuracy on complex, intertwined patient symptoms compared to traditional computer algorithms." />
            </div>
            <div className="font-serif text-xl sm:text-2xl text-quantum font-light">+4.2% <span className="text-[10px] font-sans text-ink-soft">Accuracy Edge</span></div>
            <p className="text-[10px] text-ink-soft font-light">Higher accuracy on complex cases</p>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-ink-soft">Screenings Run</span>
              <HelpTooltip text="Total number of patients screened in this browser session." />
            </div>
            <div className="font-serif text-xl sm:text-2xl text-ink font-light">{recentPredictions.length} <span className="text-[10px] font-sans text-ink-soft">patients</span></div>
            <p className="text-[10px] text-ink-soft font-light">In your active session</p>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-ink-soft">Computing Mode</span>
              <HelpTooltip text="The quantum processor or simulation engine actively analyzing patient data." />
            </div>
            <div className="font-serif text-xl sm:text-2xl text-ink font-light">
              {backend === "ibmq_eagle" ? "127-Qubit" : "GPU Sim"} <span className="text-[10px] font-sans text-ink-soft">System</span>
            </div>
            <p className="text-[10px] text-ink-soft font-light">
              {backend === "ibmq_eagle" ? "IBM Quantum Processor" : "GPU Matrix Engine Active"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ========================================================================= */}
      {/* 2. PRIMARY CLINICAL DISEASE MODULES */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-light text-ink tracking-tight">
              Diagnostic Categories
            </h2>
            <p className="text-xs text-ink-soft font-light">
              Select a medical condition below to open the screening test form.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {DISEASE_MODULES.map((disease) => {
            const Icon = disease.icon;
            return (
              <motion.div
                key={disease.key}
                whileHover={{ y: -2 }}
                className="p-4 sm:p-5 rounded-xl border border-hairline bg-parchment flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-quantum/10 text-quantum flex items-center justify-center">
                        <Icon size={16} />
                      </div>
                      <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-quantum">
                        {disease.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono text-ink-soft">{disease.advantage}</span>
                      <HelpTooltip text={disease.tooltip} />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-serif text-base sm:text-lg font-medium text-ink leading-snug">
                      {disease.title}
                    </h3>
                    <p className="text-[11px] text-ink-soft font-light line-clamp-3 mt-1 leading-relaxed">
                      {disease.description}
                    </p>
                  </div>

                  <div className="space-y-1 pt-1 font-mono text-[10px] text-ink-soft">
                    <div className="flex justify-between">
                      <span>Validation Data:</span>
                      <span className="text-ink truncate max-w-[140px]">{disease.dataset}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Analyzed Factors:</span>
                      <span className="text-ink truncate max-w-[140px]">{disease.features}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-hairline flex items-center justify-between">
                  <span className="text-[10px] font-mono text-quantum font-medium">{disease.target}</span>
                  <Link
                    href={disease.route}
                    className="text-xs font-semibold text-ink hover:text-quantum flex items-center gap-1 transition-colors"
                  >
                    Screen Patient <ChevronRight size={13} />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. RECENT PATIENT SCREENING ACTIVITY */}
      {/* ========================================================================= */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-light text-ink tracking-tight">
              Recent Patient Screenings
            </h2>
            <p className="text-xs text-ink-soft font-light">
              History of diagnostic tests executed during your current session.
            </p>
          </div>

          {recentPredictions.length > 0 && (
            <Link
              href="/history"
              className="text-xs font-semibold text-ink hover:text-quantum flex items-center gap-1 transition-colors"
            >
              View Full History ({recentPredictions.length}) <ArrowRight size={13} />
            </Link>
          )}
        </div>

        {recentPredictions.length === 0 ? (
          /* GENUINE REAL EMPTY STATE */
          <div className="p-8 sm:p-12 rounded-2xl bg-parchment border border-hairline shadow-2xs text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cream-deep/60 border border-hairline text-ink-soft mx-auto flex items-center justify-center">
              <Inbox size={22} className="text-ink-soft" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="font-serif text-lg font-medium text-ink">
                No patient screenings run yet
              </h3>
              <p className="text-xs text-ink-soft font-light leading-relaxed">
                Click below to start your first patient screening and compare quantum and traditional computer predictions.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/predict"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-ink text-parchment font-medium text-xs tracking-wider hover:opacity-90 transition-all shadow-sm cursor-pointer"
              >
                <Sparkles size={13} className="text-quantum" /> Start Patient Screening
              </Link>
            </div>
          </div>
        ) : (
          /* POPULATED ACTIVITY TABLE */
          <div className="bg-parchment rounded-2xl border border-hairline shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-cream-deep/40 border-b border-hairline text-[11px] font-mono uppercase tracking-wider text-ink-soft">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Case ID</th>
                    <th className="py-3.5 px-4 font-semibold">Patient Name</th>
                    <th className="py-3.5 px-4 font-semibold">Test Category</th>
                    <th className="py-3.5 px-4 font-semibold">Quantum Prediction</th>
                    <th className="py-3.5 px-4 font-semibold">Standard Model</th>
                    <th className="py-3.5 px-4 font-semibold">Key Factor</th>
                    <th className="py-3.5 px-4 font-semibold">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline text-ink">
                  {recentPredictions.map((pred, i) => (
                    <tr key={i} className="hover:bg-cream/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-quantum">
                        {pred.id}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-xs text-ink">{pred.patientName}</td>
                      <td className="py-3.5 px-4 text-ink-soft text-xs">{pred.disease}</td>
                      <td className="py-3.5 px-4 font-mono font-medium">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] ${
                          pred.riskLevel === "High"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}>
                          {pred.quantumPrediction} ({pred.quantumConfidence}%)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-ink-soft text-xs">
                        {pred.classicalPrediction} ({pred.classicalConfidence}%)
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-ink truncate max-w-[180px]">
                        {pred.topDriver}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-ink-soft font-mono">{pred.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </motion.div>
  );
}
