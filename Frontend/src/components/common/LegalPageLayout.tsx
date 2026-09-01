"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Lock, FileText, Cookie, Activity } from "lucide-react";

interface LegalPageLayoutProps {
  title: string;
  subtitle: string;
  badge: string;
  lastUpdated?: string;
  iconType?: "shield" | "lock" | "file" | "cookie";
  children: React.ReactNode;
}

export function LegalPageLayout({
  title,
  subtitle,
  badge,
  lastUpdated = "September 1, 2026",
  iconType = "shield",
  children,
}: LegalPageLayoutProps) {
  const renderIcon = () => {
    switch (iconType) {
      case "lock":
        return <Lock size={12} className="text-quantum" />;
      case "file":
        return <FileText size={12} className="text-quantum" />;
      case "cookie":
        return <Cookie size={12} className="text-quantum" />;
      default:
        return <Shield size={12} className="text-quantum" />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#FDFBF7] font-sans selection:bg-quantum selection:text-black antialiased">
      {/* Minimal Header */}
      <header className="fixed top-0 inset-x-0 z-50 px-6 lg:px-12 h-20 flex items-center justify-between border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link
            href="/home"
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-white/10"
            aria-label="Back to Home Dashboard"
          >
            <ArrowLeft size={18} />
          </Link>
          <Link href="/home" className="flex items-center gap-2.5 group">
            <span className="h-2 w-2 rounded-full bg-quantum animate-pulse" />
            <span className="font-serif text-xl font-medium tracking-tight text-white group-hover:opacity-90 transition-opacity">
              QuantumX
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40 hidden sm:inline-block">
              · Medical Platform
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/predict/demo"
            className="rounded-full px-5 py-2 text-xs font-mono uppercase tracking-wider text-white/80 border border-white/10 hover:border-white/30 hover:bg-white/[0.05] transition-all hidden sm:inline-flex items-center gap-1.5"
          >
            <Activity size={12} className="text-quantum" />
            Launch Demo
          </Link>
          <Link
            href="/login"
            className="rounded-full px-5 py-2 bg-white text-black font-semibold text-xs uppercase tracking-wider hover:bg-gray-100 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-36 pb-28 px-6 lg:px-12 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10.5px] font-mono font-semibold uppercase tracking-[0.2em] bg-white/[0.06] text-quantum border border-white/10 mb-6">
            {renderIcon()}
            {badge}
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white mb-4 font-serif">
            {title}
          </h1>

          <p className="text-lg text-white/70 font-light leading-relaxed mb-6 max-w-2xl">
            {subtitle}
          </p>

          <div className="flex items-center gap-4 text-xs font-mono text-white/40 uppercase tracking-widest pb-12 border-b border-white/10 mb-12">
            <span>Last Updated: {lastUpdated}</span>
            <span>•</span>
            <span>Document ID: QX-POL-2026</span>
          </div>

          {/* Legal Prose Content */}
          <div className="space-y-10 text-white/75 text-[15.5px] leading-[1.8] font-light">
            {children}
          </div>

          {/* Bottom Card */}
          <div className="mt-16 rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-quantum mb-1">
                <Lock size={13} />
                <span>Cryptographic Provenance</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed max-w-lg">
                All QuantumX diagnostic executions produce immutable, SHA-256 hashed provenance receipts linking the exact input tensor, VQC state, and gate ablation metrics.
              </p>
            </div>
            <Link
              href="/predict/demo"
              className="shrink-0 px-6 py-3 rounded-full bg-white text-black font-semibold text-xs uppercase tracking-wider hover:bg-gray-100 transition-colors"
            >
              Test Pipeline
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-white/10 bg-black/60 py-8 px-6 lg:px-12 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 QUANTUMX RESEARCH PLATFORM</span>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link>
            <Link href="/cookies" className="hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
