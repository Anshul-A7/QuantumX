"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Eye, EyeOff, Loader2, Check, CheckCircle2, ArrowLeft, X } from "lucide-react";
import { AuthService } from "@/services/auth.service";
import BrandLogo from "@/components/common/BrandLogo";

const easeOut = [0.16, 1, 0.3, 1] as const;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const t = searchParams.get("token");
    if (!t) {
      setErrorMessage("Missing or invalid cryptographic recovery token. Please request a new link.");
    } else {
      setToken(t);
    }
  }, [searchParams]);

  // Password strength criteria
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const criteria = [
    { label: "8+ Characters", met: hasMinLength },
    { label: "Uppercase (A-Z)", met: hasUppercase },
    { label: "Number (0-9)", met: hasNumber },
    { label: "Symbol (@#$)", met: hasSpecial },
  ];

  const strengthScore = criteria.filter((c) => c.met).length;

  const getStrengthMeta = () => {
    switch (strengthScore) {
      case 1: return { label: "Basic", color: "bg-red-500", text: "text-red-700", border: "border-red-200", badgeBg: "bg-red-50/80" };
      case 2: return { label: "Moderate", color: "bg-amber-500", text: "text-amber-700", border: "border-amber-200", badgeBg: "bg-amber-50/80" };
      case 3: return { label: "Robust", color: "bg-teal-500", text: "text-teal-700", border: "border-teal-200", badgeBg: "bg-teal-50/80" };
      case 4: return { label: "Cryptographic Grade", color: "bg-quantum", text: "text-quantum", border: "border-quantum/30", badgeBg: "bg-quantum/10" };
      default: return { label: "Required", color: "bg-ink/10", text: "text-muted-foreground", border: "border-hairline", badgeBg: "bg-cream-deep/40" };
    }
  };

  const strengthMeta = getStrengthMeta();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!token) {
      setErrorMessage("Invalid reset token. Please request a new link.");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter a new passkey.");
      return;
    }

    if (password.length > 72) {
      setErrorMessage("Passkey cannot be longer than 72 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passkeys do not match. Please verify.");
      return;
    }

    if (strengthScore < 3) {
      setErrorMessage("Please choose a stronger passkey satisfying at least 3 criteria.");
      return;
    }

    setIsLoading(true);

    try {
      await AuthService.resetPassword(token, password);
      setIsSuccess(true);
      setIsLoading(false);

      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reset passkey. The link may have expired.";
      setErrorMessage(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-cream flex items-center justify-center p-4 sm:p-6 md:p-8 py-8 sm:py-12 font-sans selection:bg-ink selection:text-parchment overflow-y-auto relative">
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
        className="w-full max-w-6xl min-h-[720px] bg-parchment rounded-[2.5rem] border border-hairline/90 shadow-[0_24px_60px_-30px_rgba(60,50,35,0.4)] overflow-hidden grid grid-cols-1 lg:grid-cols-12"
      >
        {/* Left Column: Quantum Coherence Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1, ease: easeOut }}
          className="hidden lg:flex lg:col-span-6 relative bg-ink p-12 flex-col justify-between overflow-hidden rounded-[2.2rem] m-3"
        >
          <motion.img
            src="/images/auth-manifold.jpg"
            alt="Quantum Security Architecture"
            animate={{ scale: [1, 1.04, 1], rotate: [0, 0.4, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-ink/40 pointer-events-none" />

          {/* Top Brand Label */}
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

          {/* Bottom Quote */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: easeOut }}
            className="relative z-10 space-y-4 max-w-md"
          >
            <h1 className="font-serif text-4xl sm:text-5xl font-light tracking-tight text-parchment leading-[1.12]">
              Set New <br />
              Research Passkey
            </h1>
            <p className="text-parchment/75 text-sm sm:text-base font-light leading-relaxed">
              Your research workbench is secured with zero-knowledge safeguards. Establish a new strong passkey to re-enter.
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

          {/* Form Content */}
          <div className="my-auto max-w-md w-full mx-auto py-6">
            <AnimatePresence mode="wait">
              {isSuccess ? (
                /* Success State */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: easeOut }}
                  className="text-center py-8 space-y-5"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    className="w-14 h-14 rounded-2xl bg-quantum/10 border border-quantum/30 text-quantum mx-auto flex items-center justify-center shadow-xs"
                  >
                    <CheckCircle2 size={24} />
                  </motion.div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-light text-ink tracking-tight">
                    Passkey Updated
                  </h3>
                  <p className="text-ink-soft text-xs sm:text-sm font-light leading-relaxed max-w-sm mx-auto">
                    Your credentials have been securely updated. Redirecting you to sign in automatically...
                  </p>
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3, ease: "linear" }}
                    className="h-0.5 bg-quantum rounded-full mx-auto max-w-[200px]"
                  />
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-ink text-parchment font-medium text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-xs"
                  >
                    Sign In Immediately
                  </Link>
                </motion.div>
              ) : (
                /* Form State */
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="text-center mb-8">
                    <h2 className="font-serif text-3xl sm:text-4xl font-light text-ink tracking-tight mb-2">
                      Set New Password
                    </h2>
                    <p className="text-ink-soft text-xs sm:text-sm font-light">
                      Choose a new password for your account
                    </p>
                  </div>

                  {/* Error Message */}
                  <AnimatePresence>
                    {errorMessage && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -8 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -8 }}
                        className="mb-6 p-3.5 rounded-xl bg-red-50/80 border border-red-200 text-red-700 text-xs flex items-center gap-2 overflow-hidden"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        <span>{errorMessage}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* New Password */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-ink/80">
                          New Password
                        </label>
                        {password.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${strengthMeta.badgeBg} ${strengthMeta.border} ${strengthMeta.text}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${strengthMeta.color}`} />
                            <span>{strengthMeta.label}</span>
                          </motion.div>
                        )}
                      </div>

                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          maxLength={72}
                          placeholder="Enter new password"
                          className="w-full h-12 pl-4 pr-11 rounded-xl bg-cream/70 border border-hairline text-sm text-ink placeholder:text-muted-foreground/50 focus:outline-none focus:border-quantum/60 focus:bg-parchment transition-all shadow-2xs font-sans"
                          required
                          disabled={!token}
                        />
                        <motion.button
                          whileTap={{ scale: 0.85, rotate: 15 }}
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink transition-colors cursor-pointer"
                        >
                          <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                              key={showPassword ? "hide" : "show"}
                              initial={{ opacity: 0, rotate: -30, scale: 0.8 }}
                              animate={{ opacity: 1, rotate: 0, scale: 1 }}
                              exit={{ opacity: 0, rotate: 30, scale: 0.8 }}
                              transition={{ duration: 0.2 }}
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </motion.div>
                          </AnimatePresence>
                        </motion.button>
                      </div>

                      {/* Strength Bar + Criteria Badges */}
                      {password.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="pt-2 space-y-2.5 overflow-hidden"
                        >
                          <div className="grid grid-cols-4 gap-1.5">
                            {[1, 2, 3, 4].map((step) => {
                              const isMet = step <= strengthScore;
                              return (
                                <div key={step} className="h-1.5 rounded-full bg-hairline overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: isMet ? "100%" : "0%" }}
                                    transition={{ duration: 0.35, ease: "easeOut" }}
                                    className={`h-full rounded-full ${
                                      strengthScore === 4 ? "bg-quantum" :
                                      strengthScore === 3 ? "bg-teal-600" :
                                      strengthScore === 2 ? "bg-amber-500" : "bg-red-400"
                                    }`}
                                  />
                                </div>
                              );
                            })}
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 pt-1">
                            {criteria.map((item, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all duration-300 ${
                                  item.met
                                    ? "bg-quantum/10 border-quantum/30 text-quantum"
                                    : "bg-cream-deep/30 border-hairline text-muted-foreground"
                                }`}
                              >
                                <motion.div
                                  animate={{ scale: item.met ? [1, 1.25, 1] : 1 }}
                                  transition={{ duration: 0.3 }}
                                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                                    item.met ? "bg-quantum text-parchment" : "bg-hairline text-transparent"
                                  }`}
                                >
                                  <Check size={9} strokeWidth={3} />
                                </motion.div>
                                <span className="truncate">{item.label}</span>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-ink/80">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          maxLength={72}
                          placeholder="Confirm new password"
                          className="w-full h-12 pl-4 pr-11 rounded-xl bg-cream/70 border border-hairline text-sm text-ink placeholder:text-muted-foreground/50 focus:outline-none focus:border-quantum/60 focus:bg-parchment transition-all shadow-2xs font-sans"
                          required
                          disabled={!token}
                        />
                        <motion.button
                          whileTap={{ scale: 0.85, rotate: 15 }}
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink transition-colors cursor-pointer"
                        >
                          <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                              key={showConfirmPassword ? "hide" : "show"}
                              initial={{ opacity: 0, rotate: -30, scale: 0.8 }}
                              animate={{ opacity: 1, rotate: 0, scale: 1 }}
                              exit={{ opacity: 0, rotate: 30, scale: 0.8 }}
                              transition={{ duration: 0.2 }}
                            >
                              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </motion.div>
                          </AnimatePresence>
                        </motion.button>
                      </div>
                      {confirmPassword.length > 0 && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`text-[11px] font-mono mt-1 ${
                            password === confirmPassword ? "text-quantum font-semibold" : "text-red-500"
                          }`}
                        >
                          {password === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                        </motion.p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isLoading || !token}
                      className="w-full h-12 mt-2 rounded-xl bg-ink text-parchment font-medium text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Updating Password...</span>
                        </>
                      ) : (
                        <span>Set New Password</span>
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
