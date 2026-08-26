export default function Page() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FAF8F5] text-[#0F172A] p-6">
      <div className="text-center space-y-4 max-w-md w-full p-10 rounded-3xl bg-white border border-black/[0.06] shadow-xl shadow-slate-900/5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-700">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
          QuantumX Platform
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Under Development
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          The hybrid quantum diagnostic architecture and workspace are currently under active development.
        </p>
      </div>
    </main>
  );
}
