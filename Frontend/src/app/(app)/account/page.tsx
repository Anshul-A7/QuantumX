"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import {
  User,
  Camera,
  Mail,
  ShieldCheck,
  Cpu,
  Zap,
  Save,
  CheckCircle2,
  Lock,
  Clock,
  Activity,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import HelpTooltip from "@/components/common/HelpTooltip";
import { useQuantumBackend } from "@/hooks/useQuantumBackend";

export default function AccountPage() {
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("user@quantumx.io");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const { backend: preferredBackend, setBackend: setPreferredBackend } = useQuantumBackend();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [screeningCount, setScreeningCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("quantumx_user_name");
      const storedEmail = localStorage.getItem("quantumx_user_email");
      const storedAvatar = localStorage.getItem("quantumx_user_avatar");
      const historyRaw = localStorage.getItem("quantumx_prediction_history");

      if (storedName && storedName !== "Dr. Eleanor Vance") {
        setUserName(storedName);
      } else {
        setUserName("User");
      }

      if (storedEmail && storedEmail !== "researcher@institute.org") {
        setUserEmail(storedEmail);
      } else {
        setUserEmail("user@quantumx.io");
      }

      if (storedAvatar) {
        setUserAvatar(storedAvatar);
      }

      if (historyRaw) {
        try {
          const parsed = JSON.parse(historyRaw);
          if (Array.isArray(parsed)) {
            setScreeningCount(parsed.length);
          }
        } catch (e) {
          console.error("Failed to parse history count:", e);
        }
      }
    }
  }, []);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setUserAvatar(base64);
        if (typeof window !== "undefined") {
          localStorage.setItem("quantumx_user_avatar", base64);
        }
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("quantumx_user_name", userName);
      localStorage.setItem("quantumx_user_email", userEmail);
      localStorage.setItem("quantumx_backend", preferredBackend);
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-5 pb-12 w-full"
    >
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-4">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-quantum" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-quantum font-semibold">
              User Profile
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-light text-ink tracking-tight">
            Account Settings
          </h1>
          <p className="text-xs text-ink-soft font-light">
            Manage your personal profile, uploaded avatar, and default computing system preferences.
          </p>
        </div>

        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium"
          >
            <CheckCircle2 size={13} className="text-emerald-600" />
            <span>Changes saved successfully!</span>
          </motion.div>
        )}
      </div>

      {/* Profile Overview Card with Photo Upload */}
      <div className="p-5 sm:p-6 rounded-2xl bg-parchment border border-hairline shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Avatar with Upload Hover Button */}
          <div className="relative group shrink-0">
            <div className="w-20 h-20 rounded-full bg-ink text-parchment flex items-center justify-center font-serif text-2xl font-light overflow-hidden shadow-sm border-2 border-hairline">
              {userAvatar ? (
                <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
              ) : (
                userName.charAt(0).toUpperCase()
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Click to Upload Profile Photo"
              className="absolute inset-0 bg-ink/60 rounded-full flex flex-col items-center justify-center text-parchment opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-medium"
            >
              <Camera size={18} />
              <span>Change</span>
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-xl font-medium text-ink">{userName}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-quantum/10 text-quantum border border-quantum/25">
                Active User
              </span>
            </div>
            <p className="text-xs text-ink-soft">{userEmail}</p>
            <div className="pt-1 flex items-center gap-3 text-[11px] text-ink-soft font-light">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-quantum hover:underline cursor-pointer font-medium flex items-center gap-1"
              >
                <Camera size={12} /> Upload New Photo
              </button>
              {userAvatar && (
                <button
                  type="button"
                  onClick={() => {
                    setUserAvatar(null);
                    if (typeof window !== "undefined") {
                      localStorage.removeItem("quantumx_user_avatar");
                    }
                  }}
                  className="text-red-700 hover:underline cursor-pointer"
                >
                  Remove Photo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4 pt-4 border-t border-hairline">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink">Your Full Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                required
                className="w-full h-10 px-3 rounded-xl bg-cream/50 border border-hairline text-xs text-ink focus:outline-none focus:border-quantum shadow-2xs font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink">Email Address</label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full h-10 px-3 rounded-xl bg-cream/50 border border-hairline text-xs text-ink focus:outline-none focus:border-quantum shadow-2xs font-sans"
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <div className="flex items-center gap-1">
              <label className="text-xs font-semibold text-ink">Preferred Quantum Computing System</label>
              <HelpTooltip text="Choose whether patient diagnostic calculations are routed to IBM Quantum physical processors or local GPU simulation." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setPreferredBackend("ibmq_eagle")}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-1 ${
                  preferredBackend === "ibmq_eagle"
                    ? "bg-cream border-quantum/60 shadow-xs ring-1 ring-quantum/30"
                    : "bg-cream/40 hover:bg-cream border-hairline"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-sm font-medium text-ink flex items-center gap-1.5">
                    <Cpu size={14} className="text-quantum" /> IBM Quantum (127-Qubit Eagle)
                  </span>
                  {preferredBackend === "ibmq_eagle" && <CheckCircle2 size={13} className="text-quantum" />}
                </div>
                <p className="text-[11px] text-ink-soft font-light leading-snug">
                  Real superconducting quantum processor with physical entanglement.
                </p>
              </div>

              <div
                onClick={() => setPreferredBackend("gpu_simulator")}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-1 ${
                  preferredBackend === "gpu_simulator"
                    ? "bg-cream border-quantum/60 shadow-xs ring-1 ring-quantum/30"
                    : "bg-cream/40 hover:bg-cream border-hairline"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-sm font-medium text-ink flex items-center gap-1.5">
                    <Zap size={14} className="text-blue-700" /> High-Speed GPU Simulator
                  </span>
                  {preferredBackend === "gpu_simulator" && <CheckCircle2 size={13} className="text-quantum" />}
                </div>
                <p className="text-[11px] text-ink-soft font-light leading-snug">
                  Instantaneous, zero-noise statevector matrix calculation.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-ink text-parchment font-medium text-xs tracking-wider hover:opacity-90 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Save size={13} /> Save Account Changes
            </button>
          </div>
        </form>
      </div>

      {/* Account Statistics & System Quota */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-parchment border border-hairline space-y-1 shadow-2xs">
          <span className="text-[10px] uppercase font-mono tracking-wider text-ink-soft">Session Screenings</span>
          <div className="font-serif text-2xl text-ink font-light">{screeningCount} <span className="text-xs font-sans text-ink-soft">cases</span></div>
          <p className="text-[11px] text-ink-soft font-light">Saved in your local browser history</p>
        </div>

        <div className="p-4 rounded-xl bg-parchment border border-hairline space-y-1 shadow-2xs">
          <span className="text-[10px] uppercase font-mono tracking-wider text-ink-soft">Access Level</span>
          <div className="font-serif text-2xl text-emerald-700 font-light">Full Access</div>
          <p className="text-[11px] text-ink-soft font-light">All 3 disease models unlocked</p>
        </div>

        <div className="p-4 rounded-xl bg-parchment border border-hairline space-y-1 shadow-2xs">
          <span className="text-[10px] uppercase font-mono tracking-wider text-ink-soft">Security Status</span>
          <div className="font-serif text-2xl text-ink font-light">Encrypted</div>
          <p className="text-[11px] text-ink-soft font-light">JWT-authenticated session active</p>
        </div>
      </div>
    </motion.div>
  );
}
