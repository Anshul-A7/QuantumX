"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Loader2, Mail, X } from "lucide-react";
import { AuthService } from "@/services/auth.service";
import BrandLogo from "@/components/common/BrandLogo";

const easeOut = [0.16, 1, 0.3, 1] as const;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage("Please enter the institutional email associated with your workspace.");
      return;
    }

    setIsLoading(true);

    try {
      await AuthService.forgotPassword(email.trim());
      setIsSubmitted(true);
      setIsLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to send recovery instructions. Please check the address.";
      setErrorMessage(message);
      setIsLoading(false);
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
        
        {/* Left Column: Quantum Coherence Artwork */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: easeOut }}
          className="hidden lg:flex lg:col-span-6 relative bg-ink p-12 flex-col justify-between overflow-hidden rounded-[2.2rem] m-3"
        >
          <motion.img
            src="/images/auth-manifold.jpg"
            alt="Quantum Security Enclave"
            animate={{ scale: [1, 1.04, 1], rotate: [0, 0.4, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
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
                CRYPTOGRAPHIC ENCLAVE
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
              Passkey <br />
              Restoration
            </h1>
            <p className="text-parchment/75 text-sm sm:text-base font-light leading-relaxed">
              Workspace checkpoints are guarded with deterministic cryptographic integrity. Identity tokens are cryptographically verified before access is restored.
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
                className="text-xs font-semibold text-ink-soft hover:text-ink transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </motion.div>
          </div>

          {/* Form Content Area */}
          <div className="my-auto max-w-md w-full mx-auto py-8">
            <AnimatePresence mode="wait">
              {!isSubmitted ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="text-center mb-8">
                    <h2 className="font-serif text-3xl sm:text-4xl font-light text-ink tracking-tight mb-2">
                      Reset Password
                    </h2>
                    <p className="text-ink-soft text-xs sm:text-sm font-light">
                      Enter your email and we'll send you a reset link
                    </p>
                  </div>

                  {errorMessage && (
                    <motion.div 
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-3.5 rounded-xl bg-red-50/80 border border-red-200 text-red-700 text-xs flex items-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      <span>{errorMessage}</span>
                    </motion.div>
                  )}

                  <form onSubmit={handleReset} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-ink/80">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full h-12 px-4 rounded-xl bg-cream/70 border border-hairline text-sm text-ink placeholder:text-muted-foreground/50 focus:outline-none focus:border-quantum/60 focus:bg-parchment transition-all shadow-2xs font-sans"
                        required
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 mt-2 rounded-xl bg-ink text-parchment font-medium text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Sending Link...</span>
                        </>
                      ) : (
                        <span>Send Reset Link</span>
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: easeOut }}
                  className="text-center py-6 space-y-4"
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    className="w-14 h-14 rounded-2xl bg-quantum/10 border border-quantum/30 text-quantum mx-auto flex items-center justify-center shadow-xs"
                  >
                    <Mail size={24} />
                  </motion.div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-light text-ink tracking-tight">
                    Check Your Inbox
                  </h3>
                  <p className="text-ink-soft text-xs sm:text-sm font-light leading-relaxed max-w-sm mx-auto">
                    We have sent a password reset link to <span className="font-semibold text-ink">{email}</span>. Click the link in the email to choose a new password.
                  </p>
                  <div className="pt-4">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Link
                        href="/login"
                        className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-ink text-parchment font-medium text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-xs"
                      >
                        Return to Sign In
                      </Link>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Footer */}
          <div className="text-center text-xs text-ink-soft pt-4">
            Remember your password?{" "}
            <Link href="/login" className="font-semibold text-ink hover:underline">
              Sign In
            </Link>
          </div>

        </motion.div>

      </motion.div>
    </div>
  );
}
