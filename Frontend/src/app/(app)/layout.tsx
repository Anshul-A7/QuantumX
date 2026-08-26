import Link from "next/link";
import { Activity, LayoutDashboard, Database, ShieldAlert, LogOut } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-black/50 backdrop-blur-xl flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight">QuantumX</span>
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          <Link href="/home" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/10 text-white font-medium">
            <LayoutDashboard className="w-5 h-5 text-purple-400" />
            Workspace
          </Link>
          <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
            <Database className="w-5 h-5" />
            Datasets
          </Link>
          <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
            <ShieldAlert className="w-5 h-5" />
            Q-SHAP Analysis
          </Link>
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gray-800 border border-white/10 flex items-center justify-center text-sm font-medium">
              DR
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Dr. Researcher</p>
              <p className="text-xs text-gray-500 truncate">Clinical Lead</p>
            </div>
          </div>
          <Link href="/" className="mt-4 flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors">
            <LogOut className="w-5 h-5" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/50 backdrop-blur-xl shrink-0">
          <h1 className="text-lg font-semibold">Active Workspace</h1>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-xs text-green-400 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Quantum Engine: Connected
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8 relative">
          {/* subtle background glow */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
