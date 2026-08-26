import { ArrowRight, Zap, Shield, Cpu, Activity, Play } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300 mb-8">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Quantum Engine v2.0 Online
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-br from-white to-gray-500 bg-clip-text text-transparent">
            The Future of <br className="hidden md:block" /> Biomedical Diagnostics.
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            QuantumX leverages hybrid quantum-classical machine learning to identify complex disease markers with unprecedented precision and mathematically guaranteed explainability.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
              Access Workspace <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#demo" className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white border border-white/10 font-medium rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
              Try Limited Demo <Play className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-24 px-6 bg-black/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-6">
                <Cpu className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Hybrid QML Pipeline</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Seamlessly integrates classical feature extraction with PennyLane quantum circuits for high-dimensional data processing.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Hardware Agnostic</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Develop on fast local simulators, deploy seamlessly to IBM Quantum superconducting QPUs via Qiskit Runtime.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Quantum SHAP</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Proprietary explainability layer attributing predictions not just to features, but to specific qubit entanglement patterns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Limited Demo Section */}
      <section id="demo" className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Live Prediction Engine</h2>
          <p className="text-gray-400">Test the hybrid model against sample UCI Wisconsin Breast Cancer dataset records.</p>
        </div>

        <div className="max-w-3xl mx-auto p-8 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-8 pb-8 border-b border-white/5">
            <div>
              <div className="text-sm font-medium text-gray-400 mb-1">Target</div>
              <div className="font-semibold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                Malignancy Detection
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-400 mb-1">Backend</div>
              <div className="font-semibold text-white flex items-center gap-2 justify-end">
                <Cpu className="w-4 h-4 text-blue-400" />
                Aer Simulator (4 Qubits)
              </div>
            </div>
          </div>

          <div className="bg-black/50 p-6 rounded-xl border border-white/5 mb-8 font-mono text-sm text-gray-300">
            {`// Input Vector (Normalized)`}<br />
            {`x = [0.82, 0.45, 0.91, 0.12, 0.33, 0.76, 0.88, 0.19]`}<br />
            <br />
            {`> Executing AngleEmbedding...`}<br />
            {`> Applying StronglyEntanglingLayers (depth=3)...`}<br />
            {`> Measuring PauliZ expectation...`}
          </div>

          <div className="flex items-center justify-between">
            <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium">
              Run Inference
            </button>
            <div className="text-sm text-gray-500">
              *Limited to pre-computed samples without authentication.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
