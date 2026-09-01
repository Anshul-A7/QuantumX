"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Loader2, Mail, RefreshCw, X, CheckCircle2 } from "lucide-react";
import { AuthService } from "@/services/auth.service";
import BrandLogo from "@/components/common/BrandLogo";
import { useRouter, useSearchParams } from "next/navigation";

const easeOut = [0.16, 1, 0.3, 1] as const;

function VerifyEmailForm() {
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(60);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  // 60-Second Resend Countdown Timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!token.trim() || token.trim().length !== 6) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }

    if (!email) {
      setErrorMessage("Missing email address reference. Please register again.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await AuthService.verifyEmail(email, token.trim());

      if (typeof window !== "undefined") {
        localStorage.setItem("quantumx_user_name", response.user.username);
        localStorage.setItem("quantumx_user_email", response.user.email);
        localStorage.setItem("quantumx_is_new_registration", "true");
        if (response.user.profileImageUrl) {
          localStorage.setItem("quantumx_user_avatar", response.user.profileImageUrl);
        }
      }

      setSuccessMessage("Identity verified successfully! Redirecting to your workbench...");
      setTimeout(() => {
        router.push("/home");
      }, 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid or expired verification code.";
      setErrorMessage(message);
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending || !email) return;

    setIsResending(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await AuthService.resendOtp(email);
      setSuccessMessage(res.message || "A fresh verification code has been dispatched to your email.");
      setResendCooldown(res.cooldownSeconds || 60);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not resend code. Please try again.";
      setErrorMessage(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-cream flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans selection:bg-ink selection:text-parchment overflow-hidden relative">
      {/* Top-Right Cross Button to Landing (Outside Card) */}
      <Link
        href="/"
        aria-label="Back to landing page"
        className="fixed top-6 right-6 z-50 w-10 h-10 rounded-full bg-parchment/90 hover:bg-parchment border border-hairline/90 backdrop-blur-md flex items-center justify-center text-ink-soft hover:text-ink transition-all hover:scale-105 shadow-sm group cursor-pointer"
      >
        <X size={18} className="group-hover:rotate-90 transition-transform duration-200" />
      </Link>

      {/* Luxury Split Card Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: easeOut }}
        className="w-full max-w-6xl min-h-[700px] bg-parchment rounded-[2.5rem] border border-hairline/90 shadow-[0_24px_60px_-30px_rgba(60,50,35,0.4)] overflow-hidden grid grid-cols-1 lg:grid-cols-12"
      >
        
        {/* Left Column: Quantum Coherence Card */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: easeOut }}
          className="hidden lg:flex lg:col-span-6 relative bg-ink p-12 flex-col justify-between overflow-hidden rounded-[2.2rem] m-3"
        >
          <motion.img
            src="/images/auth-coherence.jpg"
            alt="Identity Verification Enclave"
            animate={{ scale: [1, 1.04, 1], rotate: [0, -0.4, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-85"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-ink/40 pointer-events-none" />

          {/* Top Brand Quote Header */}
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative z-10"
          >
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono tracking-[0.25em] uppercase font-semibold text-parchment/90 drop-shadow-sm">
                IDENTITY PROTOCOL
              </span>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="h-[1px] w-12 bg-parchment/50" 
              />
            </div>
          </motion.div>

          {/* Bottom Editorial Quote */}
          <motion.div 
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: easeOut }}
            className="relative z-10 space-y-4 max-w-md"
          >
            <h1 className="font-serif text-4xl sm:text-5xl font-light tracking-tight text-parchment leading-[1.12]">
              Verify Institutional <br />
              Identity
            </h1>
            <p className="text-parchment/75 text-sm sm:text-base font-light leading-relaxed">
              We ensure authentic cohort credentials before granting access to high-performance quantum screening execution queues.
            </p>
          </motion.div>
        </motion.div>

        {/* Right Column: Clean Cream Form */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: easeOut }}
          className="lg:col-span-6 p-8 sm:p-12 md:p-16 flex flex-col justify-between bg-parchment"
        >
          
          {/* Top Header */}
          <div className="flex items-center justify-between">
            <BrandLogo />

            <motion.div whileHover={{ x: -3 }}>
              <Link 
                href="/login"
                className="text-xs font-mono uppercase tracking-wider text-ink-soft hover:text-ink transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </motion.div>
          </div>

          {/* Form Content Area */}
          <div className="my-auto max-w-md w-full mx-auto py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4 }}
              >
                <div className="text-center mb-6">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    className="w-12 h-12 rounded-2xl bg-quantum/10 border border-quantum/30 text-quantum mx-auto flex items-center justify-center shadow-xs mb-3"
                  >
                    <Mail size={20} />
                  </motion.div>
                  <h2 className="font-serif text-3xl sm:text-4xl font-light text-ink tracking-tight mb-2">
                    Check Your Inbox
                  </h2>
                  <p className="text-ink-soft text-xs sm:text-sm font-light leading-relaxed">
                    We've dispatched a 6-digit verification code to <br/>
                    <span className="font-semibold text-ink font-mono">{email || "your institutional email"}</span>
                  </p>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3.5 rounded-xl bg-red-50/80 border border-red-200 text-red-700 text-xs flex items-center gap-2"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    <span>{errorMessage}</span>
                  </motion.div>
                )}

                {/* Success Banner */}
                {successMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3.5 rounded-xl bg-teal-50/80 border border-teal-200 text-teal-800 text-xs flex items-center gap-2"
                  >
                    <CheckCircle2 size={14} className="text-teal-600 shrink-0" />
                    <span>{successMessage}</span>
                  </motion.div>
                )}

                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-ink/80">
                        6-Digit Security Code
                      </label>
                      <span className="text-[10px] font-mono text-muted-foreground">Expires in 15 mins</span>
                    </div>
                    <input
                      type="text"
                      value={token}
                      onChange={(e) => setToken(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full h-14 px-4 rounded-xl bg-cream/70 border border-hairline text-2xl text-center tracking-[0.5em] font-mono text-ink placeholder:text-muted-foreground/30 focus:outline-none focus:border-quantum/60 focus:bg-parchment transition-all shadow-2xs"
                      required
                      autoFocus
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading || token.length !== 6}
                    className="w-full h-12 mt-2 rounded-xl bg-ink text-parchment font-medium text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Verifying Security Code...</span>
                      </>
                    ) : (
                      <span>Verify Email & Enter Workbench</span>
                    )}
                  </motion.button>
                </form>

                {/* Resend Code Button & Countdown Timer */}
                <div className="mt-5 p-3 rounded-xl bg-cream-deep/30 border border-hairline flex items-center justify-between text-xs">
                  <span className="text-ink-soft">Didn't receive the email?</span>
                  {resendCooldown > 0 ? (
                    <span className="font-mono font-medium text-ink-soft text-[11px]">
                      Resend in <span className="text-ink font-semibold">{resendCooldown}s</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isResending}
                      className="inline-flex items-center gap-1.5 font-semibold text-quantum hover:underline cursor-pointer disabled:opacity-50"
                    >
                      {isResending ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw size={12} />
                          <span>Resend Code</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Footer Switcher */}
          <div className="text-center text-xs text-ink-soft pt-4">
            Wrong email address?{" "}
            <Link href="/register" className="font-semibold text-ink hover:underline">
              Create account with another email
            </Link>
          </div>

        </motion.div>

      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="animate-spin text-ink" size={32} />
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}

