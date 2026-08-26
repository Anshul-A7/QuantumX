import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 md:py-24 px-6 text-slate-700">
      
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Return to Platform Overview
      </Link>

      <div className="bg-white/80 backdrop-blur-2xl border border-black/[0.06] rounded-3xl p-8 md:p-12 shadow-xl shadow-slate-900/5 space-y-8">
        
        <div className="border-b border-black/[0.06] pb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Legal Architecture</span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-950 mt-1">
            Terms of Service
          </h1>
          <p className="text-xs text-slate-400 mt-2">
            Last Updated: August 2026 • Governed under Apache 2.0 Open-Source IP Clauses
          </p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">1. Nature of the Service & Medical Disclaimer</h2>
            <p>
              QuantumX is an advanced research platform deploying hybrid variational quantum circuits (VQC) and quantum kernel support vector machines (QSVM) for biomedical feature analysis. All diagnostic probabilities, state-vector projections, and Q-SHAP feature attributions are provided exclusively for computational research, validation, and benchmarking purposes.
            </p>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-900 text-xs font-medium">
              <strong>Caution:</strong> QuantumX does not offer formal medical diagnoses or direct clinical treatments. Healthcare practitioners must exercise independent clinical discretion before interpreting any algorithmic outputs.
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">2. Quantum Computing Resource Usage</h2>
            <p>
              Workloads dispatched to real quantum processing units (QPUs) via IBM Quantum Qiskit Runtime or simulator nodes are queued based on availability. QuantumX is not liable for runtime latency or gate noise fluctuations inherent in NISQ-era quantum hardware.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">3. Intellectual Property & Open Source Licensing</h2>
            <p>
              The QuantumX framework, circuit topology engines, and visualization modules are released under the <strong>Apache License 2.0</strong>, providing explicit patent protection and open collaboration standards.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
