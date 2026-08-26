"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { ShieldCheck, ArrowRight, ArrowLeft, RefreshCw } from "lucide-react";
import FloatingCard from "@/components/ui/FloatingCard";

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (val: string, index: number) => {
    if (val.length > 1) {
      val = val.slice(-1);
    }
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Auto-advance focus
    if (val && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen cream-gradient flex flex-col justify-center py-12 px-6 lg:px-8 relative overflow-hidden">
      
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-200/25 rounded-full blur-[140px]" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
        </Link>
        <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight">
          Two-Factor Authentication
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Enter the 6-digit cryptographic security code sent to your authenticated mobile authenticator.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <FloatingCard depth={10}>
          <div className="bg-white/85 backdrop-blur-2xl border border-black/[0.06] py-10 px-6 sm:px-10 rounded-3xl shadow-2xl shadow-emerald-500/5">
            <form className="space-y-6" action="/home" method="GET">
              
              {/* 6 Digit Input Grid */}
              <div className="flex items-center justify-between gap-2 sm:gap-3">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputsRef.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(e.target.value, idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    className="w-11 h-14 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono border border-black/[0.1] rounded-2xl bg-slate-50/70 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all shadow-sm"
                  />
                ))}
              </div>

              <Link
                href="/home"
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 text-sm"
              >
                Verify & Enter Workspace <ArrowRight className="w-4 h-4" />
              </Link>
            </form>

            <div className="mt-8 pt-6 border-t border-black/[0.06] flex items-center justify-between text-xs">
              <Link href="/login" className="inline-flex items-center gap-1 font-bold text-slate-500 hover:text-slate-800">
                <ArrowLeft className="w-3.5 h-3.5" /> Change Account
              </Link>
              <button
                type="button"
                className="font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Resend Code
              </button>
            </div>
          </div>
        </FloatingCard>
      </div>
    </div>
  );
}
