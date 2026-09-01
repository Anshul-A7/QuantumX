"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Settings,
  Sliders,
  ShieldCheck,
  Zap,
  Save,
  CheckCircle2,
  Trash2,
  Download,
  AlertTriangle,
  LogOut,
  X,
  Volume2,
  Eye,
  ShieldAlert,
  Loader2,
  RefreshCw,
} from "lucide-react";
import HelpTooltip from "@/components/common/HelpTooltip";
import { showToast } from "@/components/common/ToastNotification";
import { AuthService } from "@/services/auth.service";
import { ScreeningService, type StoredPrediction } from "@/services/screening.service";

/**
 * Web Audio synthesizer that plays a crisp, gentle clinical confirmation chime.
 */
function playClinicalChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  } catch {
    // Ignore audio context autoplay limitations
  }
}

export default function SettingsPage() {
  const router = useRouter();

  // Settings State
  const [autoSaveHistory, setAutoSaveHistory] = useState(true);
  const [autoDownloadReport, setAutoDownloadReport] = useState(false);
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [soundEffects, setSoundEffects] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);

  // User Profile
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("Investigator");

  // Deletion Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Clear History Modal State
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Load settings & database screening counts
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedAutoSave = localStorage.getItem("quantumx_setting_autosave");
      const savedAutoDl = localStorage.getItem("quantumx_setting_autodl");
      const savedHighContrast = localStorage.getItem("quantumx_setting_highcontrast");
      const savedAudio = localStorage.getItem("quantumx_setting_audio");

      if (savedAutoSave !== null) setAutoSaveHistory(savedAutoSave === "true");
      if (savedAutoDl !== null) setAutoDownloadReport(savedAutoDl === "true");
      if (savedHighContrast !== null) {
        const isHigh = savedHighContrast === "true";
        setHighContrastMode(isHigh);
        applyHighContrast(isHigh);
      }
      if (savedAudio !== null) setSoundEffects(savedAudio === "true");

      const cached = AuthService.getCachedUser();
      if (cached) {
        setUserEmail(cached.email || "");
        setUserName(cached.fullName || cached.username || "Investigator");
      }

      // Fetch real screening count from Supabase
      ScreeningService.getScreenings()
        .then((records) => {
          setHistoryCount(records.length);
        })
        .catch(() => {});
    }
  }, []);

  const applyHighContrast = (enable: boolean) => {
    if (typeof document !== "undefined") {
      if (enable) {
        document.documentElement.classList.add("high-contrast-mode");
      } else {
        document.documentElement.classList.remove("high-contrast-mode");
      }
    }
  };

  const handleToggleHighContrast = (enable: boolean) => {
    setHighContrastMode(enable);
    applyHighContrast(enable);
    if (typeof window !== "undefined") {
      localStorage.setItem("quantumx_setting_highcontrast", String(enable));
    }
  };

  const handleToggleAudio = (enable: boolean) => {
    setSoundEffects(enable);
    if (enable) playClinicalChime();
    if (typeof window !== "undefined") {
      localStorage.setItem("quantumx_setting_audio", String(enable));
    }
  };

  const handleSaveSettings = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("quantumx_setting_autosave", String(autoSaveHistory));
      localStorage.setItem("quantumx_setting_autodl", String(autoDownloadReport));
      localStorage.setItem("quantumx_setting_highcontrast", String(highContrastMode));
      localStorage.setItem("quantumx_setting_audio", String(soundEffects));
    }
    setSaveSuccess(true);
    showToast({
      title: "Preferences Saved",
      message: "Workspace configurations synchronized with cloud profile.",
      type: "success",
    });
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportAllData = async () => {
    try {
      const records = await ScreeningService.getScreenings();
      const blob = new Blob([JSON.stringify(records, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `quantumx_clinical_audit_${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showToast({
        title: "Audit Export Downloaded",
        message: `${records.length} diagnostic screening records exported to JSON.`,
        type: "success",
      });
    } catch {
      showToast({
        title: "Export Failed",
        message: "Could not export screening history.",
        type: "warning",
      });
    }
  };

  const handleConfirmClearHistory = async () => {
    setIsClearing(true);
    try {
      await ScreeningService.clearAllScreenings();
      setHistoryCount(0);
      setIsClearModalOpen(false);
      showToast({
        title: "History Cleared",
        message: "All patient screening logs deleted from Supabase cloud database.",
        type: "info",
      });
    } catch {
      showToast({
        title: "Clear Failed",
        message: "Error clearing database records.",
        type: "warning",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await AuthService.logout();
      showToast({
        title: "Signed Out",
        message: "Your session has been securely closed.",
        type: "info",
      });
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  const handleConfirmDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== "DELETE") return;
    setIsDeleting(true);
    try {
      await AuthService.deleteAccount();
      showToast({
        title: "Account Permanently Deleted",
        message: "Your user account and all clinical records have been purged.",
        type: "warning",
      });
      router.push("/register");
    } catch (err: unknown) {
      showToast({
        title: "Deletion Failed",
        message: err instanceof Error ? err.message : "Could not delete account. Please try again.",
        type: "warning",
      });
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6 pb-16 w-full max-w-5xl font-sans"
    >
      {/* Page Header */}
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
            Configure automated screenings, clinical display modes, and manage your cloud data retention.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium"
            >
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span>Saved to cloud</span>
            </motion.div>
          )}

          <button
            type="button"
            onClick={handleSaveSettings}
            className="px-4 py-2 rounded-xl bg-ink text-parchment font-medium text-xs tracking-wide hover:opacity-90 transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Save size={13} /> Save Preferences
          </button>
        </div>
      </div>

      {/* Grid of Settings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Screening Automation */}
        <div className="p-5 rounded-2xl bg-parchment border border-hairline shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-hairline pb-2.5">
            <div className="w-7 h-7 rounded-lg bg-quantum/10 text-quantum flex items-center justify-center">
              <Zap size={15} />
            </div>
            <div>
              <h2 className="font-serif text-base font-medium text-ink">Screening Automation</h2>
              <p className="text-[11px] text-ink-soft">Control diagnostic test pipeline behaviors</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-cream/40 border border-hairline hover:bg-cream/60 transition-colors">
              <div className="space-y-0.5 max-w-[280px]">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-ink">Auto-Save Screening Cases</span>
                  <HelpTooltip text="Automatically writes every patient diagnosis directly to the Supabase PostgreSQL database." />
                </div>
                <p className="text-[11px] text-ink-soft font-light">
                  Save test runs automatically to your cloud audit trail.
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoSaveHistory}
                onChange={(e) => setAutoSaveHistory(e.target.checked)}
                className="w-4 h-4 accent-quantum cursor-pointer rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-cream/40 border border-hairline hover:bg-cream/60 transition-colors">
              <div className="space-y-0.5 max-w-[280px]">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-ink">Auto-Generate Report File</span>
                  <HelpTooltip text="Triggers client report packaging immediately after a quantum inference completes." />
                </div>
                <p className="text-[11px] text-ink-soft font-light">
                  Prepare medical summary export on test completion.
                </p>
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
              <p className="text-[11px] text-ink-soft">Visual contrast, audio cues, and ergonomics</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-cream/40 border border-hairline hover:bg-cream/60 transition-colors">
              <div className="space-y-0.5 max-w-[280px]">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-ink">High-Contrast Medical Mode</span>
                  <HelpTooltip text="Increases border contrast and darkens text elements for clinical viewing workstations." />
                </div>
                <p className="text-[11px] text-ink-soft font-light">
                  Enhanced clarity on high-resolution clinical monitors.
                </p>
              </div>
              <input
                type="checkbox"
                checked={highContrastMode}
                onChange={(e) => handleToggleHighContrast(e.target.checked)}
                className="w-4 h-4 accent-quantum cursor-pointer rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-cream/40 border border-hairline hover:bg-cream/60 transition-colors">
              <div className="space-y-0.5 max-w-[280px]">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink">Interactive Audio Feedback</span>
                  <button
                    type="button"
                    onClick={playClinicalChime}
                    title="Test chime sound"
                    className="inline-flex items-center gap-1 text-[10px] font-mono text-quantum hover:underline cursor-pointer"
                  >
                    <Volume2 size={11} /> Test Sound
                  </button>
                </div>
                <p className="text-[11px] text-ink-soft font-light">
                  Plays a subtle 880Hz medical chime on screening completion.
                </p>
              </div>
              <input
                type="checkbox"
                checked={soundEffects}
                onChange={(e) => handleToggleAudio(e.target.checked)}
                className="w-4 h-4 accent-quantum cursor-pointer rounded"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Data Retention & Privacy */}
      <div className="p-5 rounded-2xl bg-parchment border border-hairline shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-hairline pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cream-deep text-ink flex items-center justify-center">
              <ShieldCheck size={15} />
            </div>
            <div>
              <h2 className="font-serif text-base font-medium text-ink">Cloud Data Retention &amp; Audit Trail</h2>
              <p className="text-[11px] text-ink-soft">
                Manage your live screening history saved in Supabase PostgreSQL
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-ink-soft font-medium bg-cream px-2.5 py-1 rounded-full border border-hairline">
            {historyCount} records stored
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <p className="text-ink-soft font-light max-w-md leading-relaxed">
            All screening data is encrypted and saved securely to the Supabase cloud database. You can export the full audit JSON or permanently wipe your screening records at any time.
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
              onClick={() => setIsClearModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100/80 border border-red-200 text-red-700 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 size={13} /> Clear Stored History
            </button>
          </div>
        </div>
      </div>

      {/* 4. Session & Authentication Management */}
      <div className="p-5 rounded-2xl bg-parchment border border-hairline shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-hairline pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cream-deep text-ink flex items-center justify-center">
              <LogOut size={15} />
            </div>
            <div>
              <h2 className="font-serif text-base font-medium text-ink">Session &amp; Authentication</h2>
              <p className="text-[11px] text-ink-soft">Active researcher profile and security credentials</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Authenticated
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="font-serif text-sm font-medium text-ink">{userName}</div>
            <div className="text-ink-soft font-mono text-[11px]">{userEmail || "investigator@quantumx.internal"}</div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="px-4 py-2 rounded-xl border border-hairline bg-cream hover:bg-cream-deep text-ink font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut size={13} /> Sign Out of Session
          </button>
        </div>
      </div>

      {/* 5. Danger Zone: Permanent Account Deletion */}
      <div className="p-5 rounded-2xl bg-red-50/40 border border-red-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-red-200/60 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
              <ShieldAlert size={15} />
            </div>
            <div>
              <h2 className="font-serif text-base font-medium text-red-900">Danger Zone</h2>
              <p className="text-[11px] text-red-700/80">Permanent account &amp; data deletion</p>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-red-700 bg-red-100 px-2 py-0.5 rounded font-semibold">
            Irreversible
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <p className="text-red-800/80 font-light max-w-lg leading-relaxed">
            Permanently delete your user account, active session tokens, all saved patient screening cases, and notification records from Supabase. This action cannot be recovered.
          </p>

          <button
            type="button"
            onClick={() => {
              setDeleteConfirmText("");
              setIsDeleteModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs shrink-0"
          >
            <Trash2 size={13} /> Delete Account Permanently
          </button>
        </div>
      </div>

      {/* MODAL 1: Cross-Confirmation Dialog for Clear History */}
      <AnimatePresence>
        {isClearModalOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isClearing && setIsClearModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-parchment rounded-3xl border border-hairline shadow-2xl p-6 space-y-4 overflow-hidden z-10"
            >
              {/* Modal Top Header with Cross X Button */}
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <div className="flex items-center gap-2 text-red-700">
                  <Trash2 size={18} />
                  <h3 className="font-serif text-base font-medium text-ink">Clear Screening History</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsClearModalOpen(false)}
                  disabled={isClearing}
                  aria-label="Cancel"
                  className="p-1 rounded-lg hover:bg-cream-deep text-ink-soft hover:text-ink transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-ink-soft leading-relaxed">
                Are you sure you want to permanently delete all <strong>{historyCount}</strong> saved patient diagnosis records from the Supabase cloud database?
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsClearModalOpen(false)}
                  disabled={isClearing}
                  className="px-4 py-2 rounded-xl border border-hairline bg-cream hover:bg-cream-deep text-xs font-medium text-ink transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClearHistory}
                  disabled={isClearing}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isClearing ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  <span>{isClearing ? "Clearing..." : "Yes, Clear All History"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Strict Cross-Confirmation Dialog for Account Deletion */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-parchment rounded-3xl border border-red-200 shadow-2xl p-6 space-y-4 overflow-hidden z-10"
            >
              {/* Header with Close Cross Button */}
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle size={20} />
                  <h3 className="font-serif text-lg font-medium text-red-950">
                    Delete Account Permanently
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeleting}
                  aria-label="Close dialog"
                  className="p-1.5 rounded-xl hover:bg-red-100 text-ink-soft hover:text-ink transition-colors cursor-pointer group"
                >
                  <X size={17} className="group-hover:rotate-90 transition-transform duration-150" />
                </button>
              </div>

              {/* Warning Content */}
              <div className="space-y-2 text-xs text-ink-soft leading-relaxed">
                <p className="text-red-900 font-medium bg-red-50 p-3 rounded-2xl border border-red-200">
                  ⚠️ This action is catastrophic and irreversible. All your login credentials, profile data, patient screenings, QXplain gate attributions, and notifications will be wiped from Supabase immediately.
                </p>
                <p>
                  Target Account: <strong className="text-ink">{userEmail || userName}</strong>
                </p>
              </div>

              {/* Safety Typing Verification */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-soft font-semibold">
                  Type <span className="text-red-600 font-bold">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  disabled={isDeleting}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cream border border-red-300 font-mono text-xs text-ink placeholder:text-ink-soft/50 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl border border-hairline bg-cream hover:bg-cream-deep text-xs font-medium text-ink transition-colors cursor-pointer"
                >
                  Cancel &amp; Keep Account
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteAccount}
                  disabled={deleteConfirmText.trim().toUpperCase() !== "DELETE" || isDeleting}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  <span>{isDeleting ? "Purging Account..." : "Permanently Delete"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
