"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Settings,
  Sliders,
  ShieldCheck,
  Moon,
  Sun,
  Eye,
  Zap,
  Save,
  CheckCircle2,
  Trash2,
  Download,
  RotateCcw,
  Sparkles,
  Layers,
  Bell,
  Cpu,
} from "lucide-react";
import HelpTooltip from "@/components/common/HelpTooltip";
import { showToast } from "@/components/common/ToastNotification";

export default function SettingsPage() {
  const [autoSaveHistory, setAutoSaveHistory] = useState(true);
  const [autoDownloadReport, setAutoDownloadReport] = useState(false);
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [soundEffects, setSoundEffects] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedAutoSave = localStorage.getItem("quantumx_setting_autosave");
      const savedAutoDl = localStorage.getItem("quantumx_setting_autodl");
      const savedHighContrast = localStorage.getItem("quantumx_setting_highcontrast");
      const historyRaw = localStorage.getItem("quantumx_prediction_history");

      if (savedAutoSave !== null) setAutoSaveHistory(savedAutoSave === "true");
      if (savedAutoDl !== null) setAutoDownloadReport(savedAutoDl === "true");
      if (savedHighContrast !== null) setHighContrastMode(savedHighContrast === "true");

      if (historyRaw) {
        try {
          const parsed = JSON.parse(historyRaw);
          if (Array.isArray(parsed)) setHistoryCount(parsed.length);
        } catch (e) {
          console.error("Failed to parse history:", e);
        }
      }
    }
  }, []);

  const handleSaveSettings = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("quantumx_setting_autosave", String(autoSaveHistory));
      localStorage.setItem("quantumx_setting_autodl", String(autoDownloadReport));
      localStorage.setItem("quantumx_setting_highcontrast", String(highContrastMode));
    }
    setSaveSuccess(true);
    showToast({
      title: "Preferences Saved",
      message: "Workspace configurations updated.",
      type: "success",
    });
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to delete all saved patient screening history?")) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("quantumx_prediction_history");
      }
      setHistoryCount(0);
      showToast({
        title: "History Cleared",
        message: "All patient screening logs have been deleted.",
        type: "info",
      });
    }
  };

  const handleExportAllData = () => {
    if (typeof window !== "undefined") {
      const historyRaw = localStorage.getItem("quantumx_prediction_history") || "[]";
      const blob = new Blob([historyRaw], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `quantumx_audit_export_${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showToast({
        title: "Audit Export Downloaded",
        message: "Complete diagnostic audit log exported.",
        type: "success",
      });
    }
  };

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
              Preferences &amp; System Configuration
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-light text-ink tracking-tight">
            Application Settings
          </h1>
          <p className="text-xs text-ink-soft font-light">
            Configure screening automation, diagnostic display preferences, and local data retention.
          </p>
        </div>

        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium"
          >
            <CheckCircle2 size={13} className="text-emerald-600" />
            <span>Settings saved!</span>
          </motion.div>
        )}
      </div>

      {/* Grid of Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Screening Automation */}
        <div className="p-5 rounded-2xl bg-parchment border border-hairline shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-hairline pb-2.5">
            <div className="w-7 h-7 rounded-lg bg-quantum/10 text-quantum flex items-center justify-center">
              <Zap size={15} />
            </div>
            <div>
              <h2 className="font-serif text-base font-medium text-ink">Screening Automation</h2>
              <p className="text-[11px] text-ink-soft">Control diagnostic test behaviors</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-cream/40 border border-hairline">
              <div className="space-y-0.5 max-w-[280px]">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-ink">Auto-Save Screening Cases</span>
                  <HelpTooltip text="Automatically saves every patient diagnosis directly to your local Screening History." />
                </div>
                <p className="text-[11px] text-ink-soft font-light">Save new test runs automatically to your audit trail.</p>
              </div>
              <input
                type="checkbox"
                checked={autoSaveHistory}
                onChange={(e) => setAutoSaveHistory(e.target.checked)}
                className="w-4 h-4 accent-quantum cursor-pointer rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-cream/40 border border-hairline">
              <div className="space-y-0.5 max-w-[280px]">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-ink">Auto-Generate Report File</span>
                  <HelpTooltip text="Generates a downloadable summary report immediately when a screening finishes." />
                </div>
                <p className="text-[11px] text-ink-soft font-light">Trigger report download on screening completion.</p>
              </div>
              <input
                type="checkbox"
                checked={autoDownloadReport}
                onChange={(e) => setAutoDownloadReport(e.target.checked)}
                className="w-4 h-4 accent-quantum cursor-pointer rounded"
              />
            </div>
          </div>
        </div>

        {/* 2. Display & Interface */}
        <div className="p-5 rounded-2xl bg-parchment border border-hairline shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-hairline pb-2.5">
            <div className="w-7 h-7 rounded-lg bg-cream-deep text-ink flex items-center justify-center">
              <Sliders size={15} />
            </div>
            <div>
              <h2 className="font-serif text-base font-medium text-ink">Interface &amp; Display</h2>
              <p className="text-[11px] text-ink-soft">Visual contrast and ergonomics</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-cream/40 border border-hairline">
              <div className="space-y-0.5 max-w-[280px]">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-ink">High-Contrast Medical Mode</span>
                  <HelpTooltip text="Increases border contrast and darkens text elements for clinical viewing environments." />
                </div>
                <p className="text-[11px] text-ink-soft font-light">Enhanced clarity on bright medical displays.</p>
              </div>
              <input
                type="checkbox"
                checked={highContrastMode}
                onChange={(e) => setHighContrastMode(e.target.checked)}
                className="w-4 h-4 accent-quantum cursor-pointer rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-cream/40 border border-hairline">
              <div className="space-y-0.5 max-w-[280px]">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-ink">Interactive Audio Feedback</span>
                  <HelpTooltip text="Plays gentle sound confirmations when quantum screening passes." />
                </div>
                <p className="text-[11px] text-ink-soft font-light">Subtle audio cues on test completion.</p>
              </div>
              <input
                type="checkbox"
                checked={soundEffects}
                onChange={(e) => setSoundEffects(e.target.checked)}
                className="w-4 h-4 accent-quantum cursor-pointer rounded"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Data Management Section */}
      <div className="p-5 rounded-2xl bg-parchment border border-hairline shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-hairline pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cream-deep text-ink flex items-center justify-center">
              <ShieldCheck size={15} />
            </div>
            <div>
              <h2 className="font-serif text-base font-medium text-ink">Data Retention &amp; Privacy</h2>
              <p className="text-[11px] text-ink-soft">Manage stored records and data exports</p>
            </div>
          </div>
          <span className="text-xs font-mono text-ink-soft">{historyCount} records stored</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <p className="text-ink-soft font-light max-w-md">
            All screening data is stored securely in your local browser storage. You can export the raw audit trail or clear records at any time.
          </p>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExportAllData}
              className="px-3.5 py-2 rounded-xl bg-cream-deep/70 hover:bg-cream border border-hairline text-ink font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download size={13} /> Export Audit JSON
            </button>
            <button
              type="button"
              onClick={handleClearHistory}
              className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 size={13} /> Clear Stored History
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSaveSettings}
          className="px-5 py-2.5 rounded-xl bg-ink text-parchment font-medium text-xs tracking-wider hover:opacity-90 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <Save size={13} /> Save All Preferences
        </button>
      </div>
    </motion.div>
  );
}
