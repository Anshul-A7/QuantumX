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
  Zap,
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
      const cached = AuthService.getCachedUser();

      if (cached) {
        setUserName(cached.fullName || cached.username || "Investigator");
      }

      // Show popup if new registration or not yet dismissed
      if (isNewReg === "true" || !dismissed) {
        setIsOpen(true);
        // Ensure welcome notifications exist in Supabase/local
        NotificationService.createNotification({
          title: "Welcome to QuantumX Workbench",
          category: "system",
          message: "Your quantum-classical clinical workbench account is fully active and calibrated for IBM Quantum hardware.",
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
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-ink/60 backdrop-blur-sm transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl bg-parchment rounded-3xl border border-hairline shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
          >
            {/* Top Close Button (Cross) */}
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Close welcome message"
              title="Close"
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-cream-deep/70 hover:bg-cream-deep text-ink-soft hover:text-ink border border-hairline flex items-center justify-center transition-all cursor-pointer z-20 group"
            >
              <X size={17} className="group-hover:rotate-90 transition-transform duration-200" />
            </button>

            {/* Header Banner */}
            <div className="p-6 sm:p-8 pb-4 border-b border-hairline bg-cream/40">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-quantum animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-quantum font-semibold">
                  Account Verified &amp; Ready
                </span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-light text-ink tracking-tight">
                Welcome to QuantumX, {userName}
              </h2>
              <p className="text-xs sm:text-sm text-ink-soft font-light mt-1.5 leading-relaxed">
                Your medical research workspace is connected to physical superconducting quantum hardware and statevector neural networks.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="p-6 sm:p-8 space-y-3.5 overflow-y-auto">
              <span className="text-[11px] font-mono uppercase tracking-wider text-ink-soft block font-medium">
                Workspace Capabilities:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Feature 1 */}
                <Link
                  href="/predict"
                  onClick={handleDismiss}
                  className="p-4 rounded-2xl bg-cream-deep/40 hover:bg-cream-deep border border-hairline hover:border-quantum/40 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-quantum/10 text-quantum flex items-center justify-center mb-3">
                      <Sparkles size={16} />
                    </div>
                    <h3 className="font-serif text-sm font-medium text-ink group-hover:text-quantum transition-colors">
                      Clinical Predictor
                    </h3>
                    <p className="text-[11px] text-ink-soft font-light mt-1 leading-relaxed">
                      Run oncology &amp; cardiology screenings with quantum Hilbert space kernels.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-quantum font-medium flex items-center gap-1 mt-3">
                    Launch <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>

                {/* Feature 2 */}
                <Link
                  href="/hardware"
                  onClick={handleDismiss}
                  className="p-4 rounded-2xl bg-cream-deep/40 hover:bg-cream-deep border border-hairline hover:border-quantum/40 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-quantum/10 text-quantum flex items-center justify-center mb-3">
                      <Cpu size={16} />
                    </div>
                    <h3 className="font-serif text-sm font-medium text-ink group-hover:text-quantum transition-colors">
                      IBM Hardware
                    </h3>
                    <p className="text-[11px] text-ink-soft font-light mt-1 leading-relaxed">
                      Monitor 127Q Eagle lattice calibration and ZNE noise mitigation in real time.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-quantum font-medium flex items-center gap-1 mt-3">
                    View QPU <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>

                {/* Feature 3 */}
                <Link
                  href="/benchmarks"
                  onClick={handleDismiss}
                  className="p-4 rounded-2xl bg-cream-deep/40 hover:bg-cream-deep border border-hairline hover:border-quantum/40 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-quantum/10 text-quantum flex items-center justify-center mb-3">
                      <Activity size={16} />
                    </div>
                    <h3 className="font-serif text-sm font-medium text-ink group-hover:text-quantum transition-colors">
                      Benchmarks
                    </h3>
                    <p className="text-[11px] text-ink-soft font-light mt-1 leading-relaxed">
                      Review McNemar $\chi^2$ significance tests and Cohen&apos;s $d$ validation proofs.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-quantum font-medium flex items-center gap-1 mt-3">
                    Results <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
              </div>

              {/* Status Note */}
              <div className="p-3.5 rounded-2xl bg-cream border border-hairline/80 flex items-center gap-3 mt-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <div className="text-[11px] text-ink font-light leading-snug">
                  <span className="font-medium text-ink">Zero Data Fallbacks:</span> All patient diagnoses, QPU runs, and notifications are stored directly in your secure database.
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-5 sm:p-6 pt-3 bg-cream/70 border-t border-hairline flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-mono text-ink-soft hover:text-ink transition-colors cursor-pointer text-center"
              >
                Skip &amp; Start Exploring
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-ink text-parchment hover:opacity-90 transition-all text-xs font-medium flex items-center justify-center gap-2 cursor-pointer shadow-xs"
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
