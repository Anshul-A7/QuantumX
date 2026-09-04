"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Eye, EyeOff, Loader2, X } from "lucide-react";
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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Auth Check Guard
  useEffect(() => {
    if (AuthService.isAuthenticated()) {
      AuthService.getCurrentUser()
        .then(() => {
          router.replace("/home");
        })
        .catch(() => {
          setIsCheckingAuth(false);
        });
    } else {
      setIsCheckingAuth(false);
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter both your email address and password.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await AuthService.login({ email, password });

      if (typeof window !== "undefined") {
        localStorage.setItem("quantumx_user_email", response.user.email);
        localStorage.setItem("quantumx_user_name", response.user.username);
        if (response.user.profileImageUrl) {
          localStorage.setItem("quantumx_user_avatar", response.user.profileImageUrl);
        }
      }

      router.push("/home");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid email or password.";
      if (message === "EMAIL_NOT_VERIFIED") {
        router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
        return;
      }
      setErrorMessage(message);
      setIsLoading(false);
    }
  };

  const handleGoogleClick = () => {
    setIsGoogleLoading(true);
    const hiddenBtn = document.getElementById("g_id_signin_hidden")?.querySelector("div[role=button]") as HTMLElement | null;
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

        const container = document.getElementById("g_id_signin_hidden");
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

  const isAnyLoading = isLoading || isGoogleLoading;

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-cream">
        <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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

      {/* Luxury Split Card with Smooth Fade-In */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.97, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easeOut }}
        className="w-full max-w-6xl min-h-[720px] bg-parchment rounded-[2.5rem] border border-hairline/90 shadow-[0_24px_60px_-30px_rgba(60,50,35,0.4)] overflow-hidden grid grid-cols-1 lg:grid-cols-12"
      >
        {/* LEFT COLUMN: 3D Quantum Manifold Artwork */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1, ease: easeOut }}
          className="hidden lg:flex lg:col-span-6 relative bg-ink p-12 flex-col justify-between overflow-hidden rounded-[2.2rem] m-3 shadow-md"
        >
          <motion.img
            src="/images/auth-manifold.jpg"
            alt="Quantum Manifold Coherence"
            animate={{ scale: [1, 1.04, 1], rotate: [0, 0.4, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-85"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-ink/40 pointer-events-none" />

          {/* Top Label */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono tracking-[0.25em] uppercase font-semibold text-parchment/90 drop-shadow-sm">
                HYBRID QUANTUM ENCLAVE
              </span>
              <div className="h-[1px] w-12 bg-parchment/50" />
            </div>
          </div>

          {/* Bottom Quote */}
          <div className="relative z-10 space-y-4 max-w-md">
            <h1 className="font-serif text-4xl sm:text-5xl font-light tracking-tight text-parchment leading-[1.12]">
              Recovering <br />
              Pre-Symptomatic Signal
            </h1>
            <p className="text-parchment/75 text-sm sm:text-base font-light leading-relaxed">
              Higher-order epistatic interactions live in curved feature manifolds. Quantum feature spaces keep the geometry intact.
            </p>
          </div>
        </motion.div>

        {/* RIGHT COLUMN: Clean Cream Sign In Form */}
        <motion.div 
          initial={{ opacity: 0, x: 25 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: easeOut }}
          className="lg:col-span-6 p-8 sm:p-12 md:p-16 flex flex-col justify-between bg-parchment"
        >
          
          {/* Top Header Row with Logo & Pill Switcher */}
          <div className="flex items-center justify-between pb-4">
            <BrandLogo />

            {/* Pill Switcher */}
            <div className="flex items-center p-1 bg-cream-deep/60 rounded-full border border-hairline text-xs font-medium">
              <div className="relative px-3.5 py-1.5 text-ink rounded-full">
                <motion.div
                  layoutId="auth-tab-pill"
                  className="absolute inset-0 bg-parchment rounded-full border border-hairline/80 shadow-xs"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
                <span className="relative z-10 font-semibold">Sign In</span>
              </div>
              <Link 
                href="/register" 
                className="relative px-3.5 py-1.5 text-ink-soft hover:text-ink transition-colors rounded-full"
              >
                Sign Up
              </Link>
            </div>
          </div>

          {/* Form Content Area with Smooth Fade */}
          <div className="my-auto max-w-md w-full mx-auto py-6">
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center mb-8"
            >
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-ink tracking-tight mb-2">
                Welcome Back
              </h2>
              <p className="text-ink-soft text-xs sm:text-sm font-light">
                Enter your email and password to sign in
              </p>
            </motion.div>

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

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
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

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-ink/80">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    maxLength={72}
                    placeholder="Enter your password"
                    className="w-full h-12 pl-4 pr-11 rounded-xl bg-cream/70 border border-hairline text-sm text-ink placeholder:text-muted-foreground/50 focus:outline-none focus:border-quantum/60 focus:bg-parchment transition-all shadow-2xs font-sans"
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
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <div 
                  onClick={() => setRememberMe(!rememberMe)}
                  className="flex items-center gap-2.5 cursor-pointer select-none"
                >
                  <div className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-300 ${
                    rememberMe ? "bg-ink" : "bg-hairline"
                  }`}>
                    <motion.div 
                      layout
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className={`w-4 h-4 rounded-full bg-parchment shadow-xs ${
                        rememberMe ? "ml-auto" : "mr-auto"
                      }`} 
                    />
                  </div>
                  <span className="text-ink-soft">Remember me</span>
                </div>

                <Link
                  href="/forgot-password"
                  className="font-medium text-ink-soft hover:text-ink transition-colors hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Primary Sign In Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isAnyLoading}
                className="w-full h-12 mt-2 rounded-xl bg-ink text-parchment font-medium text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </motion.button>

              {/* Divider */}
              <div className="relative my-3 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-hairline" />
                </div>
                <span className="relative bg-parchment px-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  or continue with
                </span>
              </div>

              {/* Google Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleGoogleClick}
                disabled={isAnyLoading}
                className="w-full h-12 rounded-xl border border-hairline/90 bg-cream/60 hover:bg-cream text-ink font-medium text-sm transition-all flex items-center justify-center gap-3 shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {isGoogleLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Connecting with Google...</span>
                  </>
                ) : (
                  <>
                    <GoogleIcon className="h-4 w-4 shrink-0" />
                    <span>Sign in with Google</span>
                  </>
                )}
              </motion.button>
              <div id="g_id_signin_hidden" className="hidden" aria-hidden="true" />
            </form>
          </div>

          {/* Bottom Footer Switcher */}
          <div className="text-center text-xs text-ink-soft pt-4">
            Don't have an account?{" "}
            <Link href="/register" className="font-semibold text-ink hover:underline">
              Sign Up
            </Link>
          </div>

        </motion.div>

      </motion.div>
    </div>
  );
}
