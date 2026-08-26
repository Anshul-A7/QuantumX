import Link from "next/link";
import { ShieldCheck, ArrowLeft, Lock } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 md:py-24 px-6 text-slate-700">
      
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Return to Platform Overview
      </Link>

      <div className="bg-white/80 backdrop-blur-2xl border border-black/[0.06] rounded-3xl p-8 md:p-12 shadow-xl shadow-slate-900/5 space-y-8">
        
        <div className="border-b border-black/[0.06] pb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Data Integrity & Privacy</span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-950 mt-1">
            Privacy Policy & HIPAA Architecture
          </h1>
          <p className="text-xs text-slate-400 mt-2">
            Effective Date: August 2026 • Compliant with Global Medical Research Privacy Standards
          </p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">1. Zero-Retention Medical Data Policy</h2>
            <p>
              QuantumX adheres to a strict data minimization doctrine. Biomedical tabular features (e.g. Wisconsin Breast Cancer metrics) ingested through the client are transformed directly into quantum rotation vectors in volatile execution memory. No patient identifiable health information (PHI) is persisted or stored in plain-text databases.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">2. Quantum Circuit Obfuscation</h2>
            <p>
              When dispatching variational quantum circuits to IBM Quantum superconducting backends via Qiskit Runtime, only compiled OpenQASM 3.0 quantum gate sequences are transmitted. No underlying patient identifiers or raw dataset matrices ever traverse third-party quantum networks.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">3. Cryptographic Security Standards</h2>
            <p>
              All sessions are protected via TLS 1.3 encryption with HMAC-SHA256 authenticated JSON Web Tokens (JWT). Workspace access requires mandatory Multi-Factor Authentication.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
