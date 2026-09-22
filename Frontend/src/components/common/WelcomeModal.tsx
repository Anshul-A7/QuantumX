"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Sparkles,
  Cpu,
  Activity,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { AuthService } from "@/services/auth.service";
import { NotificationService } from "@/services/notification.service";

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState("Investigator");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isNewReg = localStorage.getItem("quantumx_is_new_registration");
      const dismissed = localStorage.getItem("quantumx_welcome_modal_dismissed");
      const storedName = localStorage.getItem("quantumx_user_name");
      const cached = AuthService.getCachedUser();

      let resolvedName = storedName || cached?.fullName || cached?.username || "";
      resolvedName = resolvedName.replace(/_/g, " ").trim();
      if (!resolvedName || resolvedName.toLowerCase() === "anonymous" || resolvedName === "") {
        resolvedName = "Doctor";
      }

      setUserName(resolvedName);

      // Show modal ONLY for newly registered accounts on their very 1st arrival
      if (isNewReg === "true" && !dismissed) {
        setIsOpen(true);
        NotificationService.createNotification({
          title: "Welcome to QuantumX Workbench",
          category: "system",
          message: "Your quantum medical workspace is active and ready to use.",
          actionUrl: "/predict",
        }).catch(() => {});
      }
    }
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("quantumx_is_new_registration");
      localStorage.setItem("quantumx_welcome_modal_dismissed", "true");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-sans">
          {/* Backdrop Blur with Subtle Vignette */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-black/50 backdrop-blur-md transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
          >
            {/* Ambient Radial Accent */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-quantum/10 rounded-full blur-3xl -mr-28 -mt-28 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none" />

            {/* Top Close Button */}
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Close welcome message"
              title="Close"
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border flex items-center justify-center transition-all cursor-pointer z-20 group shadow-xs"
            >
              <X size={16} className="group-hover:rotate-90 transition-transform duration-200" />
            </button>

            {/* Header Banner */}
            <div className="p-6 sm:p-8 pb-5 border-b border-border bg-muted/20 relative z-10">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-bold">
                  Account Verified &bull; System Ready
                </span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-light text-foreground tracking-tight">
                Welcome to QuantumX, {userName}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-light mt-1.5 leading-relaxed max-w-xl">
                Your medical research workspace is active and ready to run quantum screenings and AI diagnostics.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="p-6 sm:p-8 space-y-4 overflow-y-auto relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                  Workspace Capabilities
                </span>
                <span className="text-[10px] font-mono text-quantum font-medium">
                  Dual-Engine Core
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Feature 1 */}
                <Link
                  href="/predict"
                  onClick={handleDismiss}
                  className="p-4 rounded-2xl bg-muted/30 hover:bg-muted/60 border border-border hover:border-quantum/50 transition-all group flex flex-col justify-between shadow-2xs hover:shadow-sm"
                >
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-quantum/10 text-quantum flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Sparkles size={16} />
                    </div>
                    <h3 className="font-serif text-sm font-medium text-foreground group-hover:text-quantum transition-colors">
                      Clinical Predictor
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-light mt-1 leading-relaxed">
                      Run oncology &amp; cardiology screenings with quantum Hilbert space kernels.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-quantum font-semibold flex items-center gap-1 mt-3">
                    Launch Studio <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>

                {/* Feature 2 */}
                <Link
                  href="/hardware"
                  onClick={handleDismiss}
                  className="p-4 rounded-2xl bg-muted/30 hover:bg-muted/60 border border-border hover:border-quantum/50 transition-all group flex flex-col justify-between shadow-2xs hover:shadow-sm"
                >
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-quantum/10 text-quantum flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Cpu size={16} />
                    </div>
                    <h3 className="font-serif text-sm font-medium text-foreground group-hover:text-quantum transition-colors">
                      IBM Hardware
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-light mt-1 leading-relaxed">
                      Monitor 127Q Eagle lattice calibration and ZNE noise mitigation in real time.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-quantum font-semibold flex items-center gap-1 mt-3">
                    View QPU <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>

                {/* Feature 3 */}
                <Link
                  href="/benchmarks"
                  onClick={handleDismiss}
                  className="p-4 rounded-2xl bg-muted/30 hover:bg-muted/60 border border-border hover:border-quantum/50 transition-all group flex flex-col justify-between shadow-2xs hover:shadow-sm"
                >
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-quantum/10 text-quantum flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Activity size={16} />
                    </div>
                    <h3 className="font-serif text-sm font-medium text-foreground group-hover:text-quantum transition-colors">
                      Benchmarks
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-light mt-1 leading-relaxed">
                      Review McNemar &chi;&sup2; significance tests and Cohen&apos;s d validation proofs.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-quantum font-semibold flex items-center gap-1 mt-3">
                    Results <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </div>

              {/* Status Note */}
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 flex items-center gap-3 mt-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={14} />
                </div>
                <div className="text-[11px] text-muted-foreground leading-snug">
                  <span className="font-medium text-foreground">Zero Data Fallbacks:</span> All patient diagnoses, QPU runs, and notifications are stored directly in your secure database.
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-5 sm:p-6 pt-3 bg-muted/20 border-t border-border flex flex-col-reverse sm:flex-row items-center justify-between gap-3 relative z-10">
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-center"
              >
                Skip &amp; Start Exploring
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-foreground text-background hover:opacity-90 transition-all text-xs font-medium flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                Get Started with QuantumX <ArrowRight size={13} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
