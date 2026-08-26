import React from 'react';
import { Activity, Brain, Database, Cpu } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white p-8 font-sans selection:bg-cyan-500/30">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <h1 className="text-4xl font-light tracking-tight flex items-center gap-3">
              <Brain className="w-10 h-10 text-cyan-400" />
              Quantum<span className="font-semibold text-cyan-400">X</span>
            </h1>
            <p className="text-gray-400 mt-2 text-sm tracking-wide">
              Hybrid Quantum Machine Learning Platform for Early Disease Detection
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-sm">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              QPU Status: <span className="text-cyan-400 font-medium">Ready</span>
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Dataset */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-colors group">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-200">Dataset Ingestion</h2>
              <Database className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Upload and preprocess high-dimensional biomedical data for classical and quantum pipelines.
            </p>
            <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
              Configure Pipeline
            </button>
          </div>

          {/* Card 2: Training */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-colors group">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-200">Hybrid Training</h2>
              <Cpu className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors" />
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Execute QK-SVM and VQC models alongside XGBoost and Random Forest baselines.
            </p>
            <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
              Initialize Run
            </button>
          </div>

          {/* Card 3: Results */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/50 transition-colors group">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-200">Explainability</h2>
              <Activity className="w-5 h-5 text-gray-500 group-hover:text-emerald-400 transition-colors" />
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Visualize Quantum SHAP values and benchmark metrics (Accuracy, Sensitivity, Specificity).
            </p>
            <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
              View Analytics
            </button>
          </div>

        </div>
        
        {/* Chart / Activity Placeholder */}
        <div className="w-full h-64 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 flex items-center justify-center">
          <p className="text-gray-500 text-sm font-medium">Visualization Module Ready (Recharts)</p>
        </div>

      </div>
    </main>
  );
}
