import { Cpu, Zap, Activity, ChevronRight, FileCode, Database } from "lucide-react";

export default function HomeWorkspace() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Active Model</p>
            <p className="text-xl font-semibold">Hybrid QSVM (4-qubit)</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Zap className="w-6 h-6 text-purple-400" />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Target Dataset</p>
            <p className="text-xl font-semibold">Wisconsin Breast Cancer</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Database className="w-6 h-6 text-blue-400" />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Backend Target</p>
            <p className="text-xl font-semibold">ibmq_qasm_simulator</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gray-500/10 flex items-center justify-center">
            <Cpu className="w-6 h-6 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Circuit Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Quantum Circuit Topology</h3>
              <button className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors">
                Edit Configuration <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center border border-white/5 rounded-xl bg-black/50 overflow-hidden relative">
              {/* Fake circuit visualization */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
              <div className="relative z-10 flex flex-col gap-8 w-full max-w-md px-8 text-mono text-sm text-gray-400 font-mono">
                <div className="flex items-center gap-4">
                  <span className="w-12">q_0 |0⟩</span>
                  <div className="flex-1 h-px bg-white/20 relative">
                    <div className="absolute top-1/2 left-4 -translate-y-1/2 w-8 h-8 bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-300">H</div>
                    <div className="absolute top-1/2 left-20 -translate-y-1/2 w-8 h-8 bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-300">Ry</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="w-12">q_1 |0⟩</span>
                  <div className="flex-1 h-px bg-white/20 relative">
                    <div className="absolute top-1/2 left-4 -translate-y-1/2 w-8 h-8 bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-300">H</div>
                    <div className="absolute top-1/2 left-20 -translate-y-1/2 w-8 h-8 bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-300">Ry</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Actions & Logs */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/20">
            <h3 className="font-semibold text-lg mb-2">Execute Training Run</h3>
            <p className="text-sm text-gray-400 mb-6">Initialize parallel classical and quantum training loops for benchmarking.</p>
            <button className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
              <Activity className="w-4 h-4" /> Start Execution
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex-1 min-h-[240px] flex flex-col">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-gray-400" />
              Engine Logs
            </h3>
            <div className="flex-1 bg-black/50 border border-white/5 rounded-xl p-4 font-mono text-xs text-gray-500 overflow-y-auto">
              <div className="mb-2 text-green-400">[SYSTEM] Initialization complete.</div>
              <div className="mb-2">[DATA] Loaded 569 samples from Wisconsin Breast Cancer target.</div>
              <div className="mb-2 animate-pulse">[WAIT] Awaiting payload execution...</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
