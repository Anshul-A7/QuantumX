"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Eye, EyeOff, Loader2, Check, X } from "lucide-react";
import { AuthService } from "@/services/auth.service";
import BrandLogo from "@/components/common/BrandLogo";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
      };
    };
    handleGoogleCredentialResponse?: (response: { credential: string }) => void;
  }
}

function GoogleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

const easeOut = [0.16, 1, 0.3, 1] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Strength Criteria Calculation
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
      case 1:
        return { label: "Basic", color: "bg-red-500", text: "text-red-700", border: "border-red-200", badgeBg: "bg-red-50/80" };
      case 2:
        return { label: "Moderate", color: "bg-amber-500", text: "text-amber-700", border: "border-amber-200", badgeBg: "bg-amber-50/80" };
      case 3:
        return { label: "Robust", color: "bg-teal-500", text: "text-teal-700", border: "border-teal-200", badgeBg: "bg-teal-50/80" };
      case 4:
        return { label: "Cryptographic", color: "bg-quantum", text: "text-quantum", border: "border-quantum/30", badgeBg: "bg-quantum/10" };
      default:
        return { label: "Required", color: "bg-ink/10", text: "text-muted-foreground", border: "border-hairline", badgeBg: "bg-cream-deep/40" };
    }
  };

  const strengthMeta = getStrengthMeta();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    if (password.length > 72) {
      setErrorMessage("Password cannot be longer than 72 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!agreeTerms) {
      setErrorMessage("Please accept the Terms of Service to continue.");
      return;
    }

    setIsLoading(true);

    try {
      await AuthService.register({
        email: email.trim(),
        username: fullName.trim(),
        password,
      });

      router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create account.";
      setErrorMessage(message);
      setIsLoading(false);
    }
  };

  const handleGoogleClick = () => {
    setIsGoogleLoading(true);
    const hiddenBtn = document.getElementById("g_id_signin_hidden_reg")?.querySelector("div[role=button]") as HTMLElement | null;
    if (hiddenBtn) {
      hiddenBtn.click();
    } else if (typeof window !== "undefined" && window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setIsGoogleLoading(false);
        }
      });
    } else {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleCredentialResponse = useCallback(async (response: { credential: string }) => {
    setIsGoogleLoading(true);
    setErrorMessage("");

    try {
      const authResponse = await AuthService.googleLogin(response.credential);

      if (typeof window !== "undefined") {
        localStorage.setItem("quantumx_user_email", authResponse.user.email);
        localStorage.setItem("quantumx_user_name", authResponse.user.username);
        localStorage.setItem("quantumx_is_new_registration", "true");
        if (authResponse.user.profileImageUrl) {
          localStorage.setItem("quantumx_user_avatar", authResponse.user.profileImageUrl);
        }
      }

      router.push("/home");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Google authentication failed.";
      setErrorMessage(message);
      setIsGoogleLoading(false);
    }
  }, [router]);

  const responseCallbackRef = React.useRef(handleGoogleCredentialResponse);
  responseCallbackRef.current = handleGoogleCredentialResponse;

  useEffect(() => {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!googleClientId) return;

    window.handleGoogleCredentialResponse = (response: { credential: string }) => {
      if (responseCallbackRef.current) {
        responseCallbackRef.current(response);
      }
    };

    let initialized = false;
    const initGoogle = () => {
      if (initialized) return;
      if (window.google?.accounts?.id) {
        initialized = true;
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (res: { credential: string }) => {
            if (responseCallbackRef.current) {
              responseCallbackRef.current(res);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true,
        });

        const container = document.getElementById("g_id_signin_hidden_reg");
        if (container) {
          window.google.accounts.id.renderButton(container, {
            type: "standard",
            theme: "outline",
            size: "large",
          });
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      const checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          initGoogle();
          clearInterval(checkInterval);
        }
      }, 200);
      return () => clearInterval(checkInterval);
    }
  }, []);

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

      {/* Luxury Split Card with Opposite Layout (Form on Left, Image on Right) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.97, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easeOut }}
        className="w-full max-w-6xl min-h-[740px] bg-parchment rounded-[2.5rem] border border-hairline/90 shadow-[0_24px_60px_-30px_rgba(60,50,35,0.4)] overflow-hidden grid grid-cols-1 lg:grid-cols-12"
      >
        {/* LEFT COLUMN: Clean Cream Sign Up Form */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: easeOut }}
          className="lg:col-span-6 p-8 sm:p-12 md:p-14 flex flex-col justify-between bg-parchment"
        >
          
          {/* Top Header Row with Logo & Pill Switcher */}
          <div className="flex items-center justify-between pb-2">
            <BrandLogo />

            {/* Pill Switcher */}
            <div className="flex items-center p-1 bg-cream-deep/60 rounded-full border border-hairline text-xs font-medium">
              <Link 
                href="/login" 
                className="relative px-3.5 py-1.5 text-ink-soft hover:text-ink transition-colors rounded-full"
              >
                Sign In
              </Link>
              <div className="relative px-3.5 py-1.5 text-ink rounded-full">
                <motion.div
                  layoutId="auth-tab-pill"
                  className="absolute inset-0 bg-parchment rounded-full border border-hairline/80 shadow-xs"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
                <span className="relative z-10 font-semibold">Sign Up</span>
              </div>
            </div>
          </div>

          {/* Form Content Area with Smooth Fade */}
          <div className="my-auto max-w-md w-full mx-auto py-3">
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center mb-5"
            >
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-ink tracking-tight mb-1">
                Create Account
              </h2>
              <p className="text-ink-soft text-xs sm:text-sm font-light">
                Enter your details to create an account
              </p>
            </motion.div>

            {/* Error Message */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -8 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -8 }}
                  className="mb-4 p-3.5 rounded-xl bg-red-50/80 border border-red-200 text-red-700 text-xs flex items-center gap-2 overflow-hidden"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleRegister} className="space-y-3">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-ink/80">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full h-11 px-4 rounded-xl bg-cream/70 border border-hairline text-sm text-ink placeholder:text-muted-foreground/50 focus:outline-none focus:border-quantum/60 focus:bg-parchment transition-all shadow-2xs font-sans"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-ink/80">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full h-11 px-4 rounded-xl bg-cream/70 border border-hairline text-sm text-ink placeholder:text-muted-foreground/50 focus:outline-none focus:border-quantum/60 focus:bg-parchment transition-all shadow-2xs font-sans"
                  required
                />
              </div>

              {/* Password & Segmented Strength Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-ink/80">
                    Password
                  </label>
                  {password.length > 0 && (
                    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${strengthMeta.badgeBg} ${strengthMeta.border} ${strengthMeta.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${strengthMeta.color}`} />
                      <span>{strengthMeta.label}</span>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    maxLength={72}
                    placeholder="Enter your password"
                    className="w-full h-11 pl-4 pr-11 rounded-xl bg-cream/70 border border-hairline text-sm text-ink placeholder:text-muted-foreground/50 focus:outline-none focus:border-quantum/60 focus:bg-parchment transition-all shadow-2xs font-sans"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* 4-Segment Strength Bar */}
                {password.length > 0 && (
                  <div className="pt-1 space-y-1.5">
                    <div className="grid grid-cols-4 gap-1.5">
                      {[1, 2, 3, 4].map((step) => (
                        <div key={step} className="h-1.5 rounded-full bg-hairline overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              step <= strengthScore
                                ? strengthScore === 4
                                  ? "bg-quantum w-full"
                                  : strengthScore === 3
                                  ? "bg-teal-600 w-full"
                                  : strengthScore === 2
                                  ? "bg-amber-500 w-full"
                                  : "bg-red-400 w-full"
                                : "w-0"
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-ink/80">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    maxLength={72}
                    placeholder="Confirm your password"
                    className="w-full h-11 pl-4 pr-11 rounded-xl bg-cream/70 border border-hairline text-sm text-ink placeholder:text-muted-foreground/50 focus:outline-none focus:border-quantum/60 focus:bg-parchment transition-all shadow-2xs font-sans"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Terms Switch */}
              <div 
                onClick={() => setAgreeTerms(!agreeTerms)}
                className="flex items-center justify-between p-2 rounded-xl bg-cream-deep/40 border border-hairline cursor-pointer select-none"
              >
                <span className="text-[11px] text-ink-soft pr-2">
                  I agree to the <span className="font-semibold text-ink underline">Terms</span> & <span className="font-semibold text-ink underline">Privacy Policy</span>
                </span>
                <div className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors shrink-0 ${
                  agreeTerms ? "bg-ink" : "bg-hairline"
                }`}>
                  <motion.div 
                    layout
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={`w-3.5 h-3.5 rounded-full bg-parchment shadow-xs ${agreeTerms ? "ml-auto" : "mr-auto"}`}
                  />
                </div>
              </div>

              {/* Primary Create Account Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full h-11 rounded-xl bg-ink text-parchment font-medium text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </motion.button>

              {/* Divider */}
              <div className="relative my-2 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-hairline" />
                </div>
                <span className="relative bg-parchment px-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  or continue with
                </span>
              </div>

              {/* Google Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleGoogleClick}
                disabled={isLoading || isGoogleLoading}
                className="w-full h-11 rounded-xl border border-hairline/90 bg-cream/60 hover:bg-cream text-ink font-medium text-sm transition-all flex items-center justify-center gap-3 shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {isGoogleLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Connecting with Google...</span>
                  </>
                ) : (
                  <>
                    <GoogleIcon className="h-4 w-4 shrink-0" />
                    <span>Sign up with Google</span>
                  </>
                )}
              </motion.button>
              <div id="g_id_signin_hidden_reg" className="hidden" aria-hidden="true" />
            </form>
          </div>

          {/* Bottom Footer Switcher */}
          <div className="text-center text-xs text-ink-soft pt-2">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-ink hover:underline">
              Sign In
            </Link>
          </div>

        </motion.div>

        {/* RIGHT COLUMN (Opposite side!): 3D Topological Coherence Artwork */}
        <motion.div 
          initial={{ opacity: 0, x: 25 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: easeOut }}
          className="hidden lg:flex lg:col-span-6 relative bg-ink p-12 flex-col justify-between overflow-hidden rounded-[2.2rem] m-3 shadow-md"
        >
          <motion.img
            src="/images/auth-coherence.jpg"
            alt="Quantum Topological Coherence"
            animate={{ scale: [1, 1.04, 1], rotate: [0, -0.4, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-90"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-ink/30 pointer-events-none" />

          {/* Top Label */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono tracking-[0.25em] uppercase font-semibold text-parchment/90 drop-shadow-sm">
                TOPOLOGICAL RESEARCH PLATFORM
              </span>
              <div className="h-[1px] w-12 bg-parchment/50" />
            </div>
          </div>

          {/* Bottom Quote */}
          <div className="relative z-10 space-y-4 max-w-md">
            <h1 className="font-serif text-4xl sm:text-5xl font-light tracking-tight text-parchment leading-[1.12]">
              High-Fidelity <br />
              Quantum Machine Learning
            </h1>
            <p className="text-parchment/75 text-sm sm:text-base font-light leading-relaxed">
              Join translational oncology cohorts utilizing continuous gate-optimized quantum kernels and interpretable feature circuits.
            </p>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
