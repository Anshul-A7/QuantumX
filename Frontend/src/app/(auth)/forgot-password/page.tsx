import Link from "next/link";
import { Activity, ArrowLeft, ArrowRight, Mail, KeyRound } from "lucide-react";
import FloatingCard from "@/components/ui/FloatingCard";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen cream-gradient flex flex-col justify-center py-12 px-6 lg:px-8 relative overflow-hidden">
      
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-200/30 rounded-full blur-[140px]" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <KeyRound className="h-6 w-6 text-white" />
          </div>
        </Link>
        <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight">
          Reset Password
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Enter your registered institutional email to receive cryptographic recovery credentials.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <FloatingCard depth={10}>
          <div className="bg-white/85 backdrop-blur-2xl border border-black/[0.06] py-10 px-6 sm:px-10 rounded-3xl shadow-2xl shadow-indigo-500/5">
            <form className="space-y-5" action="/login" method="GET">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Registered Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="researcher@university.edu"
                    className="block w-full pl-10 pr-3.5 py-3 border border-black/[0.08] rounded-xl bg-slate-50/60 placeholder-slate-400 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 text-sm"
              >
                Send Password Reset Link <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-black/[0.06] text-center">
              <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          </div>
        </FloatingCard>
      </div>
    </div>
  );
}
