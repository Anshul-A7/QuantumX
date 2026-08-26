import Link from "next/link";
import { Activity, ArrowRight, Lock, Mail, User, ShieldCheck } from "lucide-react";
import FloatingCard from "@/components/ui/FloatingCard";

export default function RegisterPage() {
  return (
    <div className="min-h-screen cream-gradient flex flex-col justify-center py-12 px-6 lg:px-8 relative overflow-hidden">
      
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-200/30 rounded-full blur-[140px]" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Activity className="h-6 w-6 text-white" />
          </div>
        </Link>
        <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight">
          Create Researcher Account
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Join the quantum biomedical network to run hybrid VQC models.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <FloatingCard depth={10}>
          <div className="bg-white/85 backdrop-blur-2xl border border-black/[0.06] py-10 px-6 sm:px-10 rounded-3xl shadow-2xl shadow-indigo-500/5">
            <form className="space-y-4" action="/verify-otp" method="GET">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Full Name & Credentials
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Dr. Eleanor Vance, MD"
                    className="block w-full pl-10 pr-3.5 py-3 border border-black/[0.08] rounded-xl bg-slate-50/60 placeholder-slate-400 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Institutional Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="eleanor@bioclinic.edu"
                    className="block w-full pl-10 pr-3.5 py-3 border border-black/[0.08] rounded-xl bg-slate-50/60 placeholder-slate-400 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Create Master Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 12 characters"
                    className="block w-full pl-10 pr-3.5 py-3 border border-black/[0.08] rounded-xl bg-slate-50/60 placeholder-slate-400 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-500 pt-1 leading-normal">
                By creating an account, you agree to the{" "}
                <Link href="/terms" className="text-indigo-600 font-semibold hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-indigo-600 font-semibold hover:underline">
                  Privacy Policy
                </Link>.
              </div>

              <Link
                href="/verify-otp"
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 text-sm mt-4"
              >
                Proceed to Two-Factor Verification <ArrowRight className="w-4 h-4" />
              </Link>
            </form>

            <div className="mt-8 pt-6 border-t border-black/[0.06] text-center">
              <p className="text-xs text-slate-500">
                Already have an account?{" "}
                <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </FloatingCard>
      </div>
    </div>
  );
}
