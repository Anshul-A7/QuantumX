import Link from "next/link";
import { Activity } from "lucide-react";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white selection:bg-purple-900/50">
      <header className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight">QuantumX</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</Link>
            <Link href="#technology" className="text-sm text-gray-400 hover:text-white transition-colors">Technology</Link>
            <Link href="/login" className="text-sm font-medium px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 transition-colors">
              Sign In
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t border-white/5 py-8 text-center text-sm text-gray-500">
        <p>© 2026 QuantumX. Built for high-precision diagnostics.</p>
      </footer>
    </div>
  );
}
