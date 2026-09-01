"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Droplets,
  ArrowLeft,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function ChronicKidneyDetailPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6 pb-12 w-full max-w-4xl mx-auto"
    >
      {/* Back Button */}
      <Link
        href="/predict"
        className="inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink transition-colors font-medium cursor-pointer"
      >
        <ArrowLeft size={13} /> Back to Screening Hub
      </Link>

      {/* Lock / Calibration Card */}
      <div className="rounded-3xl border border-amber-500/30 bg-card p-8 sm:p-10 shadow-xl space-y-6 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center shadow-inner">
          <Lock size={32} />
        </div>

        <div className="space-y-2 max-w-lg mx-auto">
          <span className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 inline-block">
            Clinical Calibration in Progress
          </span>
          <h1 className="font-serif text-3xl font-light text-foreground tracking-tight">
            Chronic Kidney & Renal Risk Studio
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed pt-1">
            Apologies: The Chronic Kidney Disease screening pipeline is currently locked while undergoing calibrated superconducting noise emulation (Paper 30) and TM-BVP statistical cross-validation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto text-left pt-2">
          <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1">
            <span className="text-[10px] font-mono uppercase text-muted-foreground font-semibold">Status</span>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Roadmap Phase</p>
            <p className="text-[11px] text-muted-foreground">Active multi-qubit verification.</p>
          </div>
          <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1">
            <span className="text-[10px] font-mono uppercase text-muted-foreground font-semibold">Live Module</span>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Breast Cancer</p>
            <p className="text-[11px] text-muted-foreground">8-Qubit VQC validated.</p>
          </div>
          <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1">
            <span className="text-[10px] font-mono uppercase text-muted-foreground font-semibold">Verification</span>
            <p className="text-xs font-semibold text-foreground">McNemar χ²</p>
            <p className="text-[11px] text-muted-foreground">95% Bootstrap CI testing.</p>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/predict/breast-cancer"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <Sparkles size={14} />
            <span>Launch Breast Cancer Cellular Studio</span>
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/predict"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            Return to Screening Hub
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
