import Link from "next/link";
import { Activity, Cpu, ArrowUpRight, Github, Shield, Sparkles } from "lucide-react";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      
      {/* Light Cream Glass Header */}
      <header className="sticky top-0 z-50 w-full bg-[#FAF8F5]/80 backdrop-blur-xl border-b border-black/[0.06] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
              <Activity className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight text-slate-900 flex items-center gap-1.5">
                QuantumX
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 uppercase tracking-wide">
                  v2.4
                </span>
              </span>
              <span className="text-[10px] font-medium text-slate-500 -mt-0.5">
                Hybrid QML Diagnostic Platform
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <Link href="#features" className="hover:text-indigo-600 transition-colors">
              Features
            </Link>
            <Link href="#demo" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
              Live Simulator <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            </Link>
            <Link href="#benchmarks" className="hover:text-indigo-600 transition-colors">
              Benchmarks
            </Link>
            <Link href="#architecture" className="hover:text-indigo-600 transition-colors">
              Architecture
            </Link>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-xs font-semibold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              QPU Connected
            </div>
            
            <Link
              href="/login"
              className="text-sm font-semibold px-4 py-2.5 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-black/[0.03] transition-colors"
            >
              Sign In
            </Link>

            <Link
              href="/home"
              className="text-sm font-semibold px-5 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md shadow-slate-900/10 flex items-center gap-1.5"
            >
              Workspace <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Light Cream Editorial Footer */}
      <footer className="border-t border-black/[0.06] bg-[#F7F4EE]/90 backdrop-blur-md pt-16 pb-12 text-slate-600 text-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            
            {/* Col 1: Brand & Mission */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <Activity className="h-4 w-4" />
                </div>
                <span className="font-bold text-lg text-slate-900">QuantumX</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pioneering high-precision biomedical diagnostics through hybrid variational quantum circuits and mathematically verified Q-SHAP explainability.
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Licensed under Apache 2.0</span>
              </div>
            </div>

            {/* Col 2: Platform */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Platform</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="#demo" className="hover:text-indigo-600 transition-colors">Variational Classifier</Link></li>
                <li><Link href="#demo" className="hover:text-indigo-600 transition-colors">Quantum Kernel SVM</Link></li>
                <li><Link href="#architecture" className="hover:text-indigo-600 transition-colors">Q-SHAP Attribution</Link></li>
                <li><Link href="/home" className="hover:text-indigo-600 transition-colors">Clinical Workspace</Link></li>
              </ul>
            </div>

            {/* Col 3: Research & Hardware */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Quantum Ecosystem</h4>
              <ul className="space-y-2 text-xs">
                <li><span className="text-slate-700 font-medium">IBM Quantum Runtime</span> (Qiskit 2.x)</li>
                <li><span className="text-slate-700 font-medium">PennyLane Autodiff</span> (Xanadu)</li>
                <li><span className="text-slate-700 font-medium">UCI & PhysioNet Data</span></li>
                <li><Link href="#benchmarks" className="hover:text-indigo-600 transition-colors">Comparative Studies</Link></li>
              </ul>
            </div>

            {/* Col 4: Legal & Security */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Compliance & Legal</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/terms" className="hover:text-indigo-600 transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link></li>
                <li><span className="text-slate-500">HIPAA Data Architecture</span></li>
                <li><span className="text-slate-500">Zero Retention Protocol</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-black/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© 2026 QuantumX Platform. All rights reserved.</p>
            <p className="font-mono text-[11px] text-slate-400">
              QPU Backend: ibmq_qasm_simulator • 127-Qubit Eagle Architecture Ready
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
