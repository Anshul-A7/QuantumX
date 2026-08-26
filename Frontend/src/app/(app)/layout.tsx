import Link from "next/link";
import { Activity, LayoutDashboard, Database, ShieldAlert, LogOut, Cpu, Sparkles, User, Bell } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen cream-gradient text-slate-900 flex">
      
      {/* Light Cream Luxury Sidebar */}
      <aside className="w-72 border-r border-black/[0.06] bg-white/80 backdrop-blur-xl flex flex-col shrink-0">
        
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 border-b border-black/[0.06]">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-slate-900 tracking-tight">QuantumX</span>
              <span className="text-[10px] font-medium text-slate-400 -mt-0.5">Clinical Workspace</span>
            </div>
          </Link>
        </div>
        
        {/* Workspace Navigation */}
        <nav className="flex-1 py-6 px-4 space-y-1.5">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </div>

          <Link
            href="/home"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-indigo-50/80 text-indigo-700 font-semibold border border-indigo-100/60 shadow-sm"
          >
            <LayoutDashboard className="w-4 h-4 text-indigo-600" />
            <span>Active Diagnostics</span>
          </Link>

          <Link
            href="#"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-slate-600 hover:bg-black/[0.03] hover:text-slate-900 font-medium transition-colors"
          >
            <Database className="w-4 h-4 text-slate-400" />
            <span>Biomedical Datasets</span>
          </Link>

          <Link
            href="#"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-slate-600 hover:bg-black/[0.03] hover:text-slate-900 font-medium transition-colors"
          >
            <ShieldAlert className="w-4 h-4 text-slate-400" />
            <span>Q-SHAP Explainability</span>
          </Link>

          <div className="pt-6 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Hardware Telemetry
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-black/[0.05] space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-600" /> IBM Quantum
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                Online
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Backend: ibm_kyiv (127 Qubits)
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: "94%" }} />
            </div>
            <div className="text-[10px] text-slate-400 flex justify-between">
              <span>Avg Coherence T₁</span>
              <span className="font-mono">248.5 µs</span>
            </div>
          </div>
        </nav>
        
        {/* User Card & Logout */}
        <div className="p-4 border-t border-black/[0.06]">
          <div className="flex items-center gap-3 p-2 rounded-2xl bg-[#FAF8F5] border border-black/[0.04]">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              DR
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">Dr. Anshul R.</p>
              <p className="text-[10px] text-slate-500 truncate">Principal Investigator</p>
            </div>
          </div>
          
          <Link
            href="/"
            className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out of Session
          </Link>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Workspace Top Bar */}
        <header className="h-20 border-b border-black/[0.06] bg-white/70 backdrop-blur-xl flex items-center justify-between px-8 shrink-0">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Clinical Diagnostic Console
            </h1>
            <p className="text-xs text-slate-500">
              Session ID: <span className="font-mono font-medium text-slate-700">QMX-2026-WBCD-094</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-700">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
              <span>Hybrid Autodiff Engine Active</span>
            </div>
            
            <Link
              href="/"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-sm"
            >
              Exit to Portal
            </Link>
          </div>
        </header>

        {/* Scrollable Clinical Viewport */}
        <div className="flex-1 overflow-auto p-8 relative">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
