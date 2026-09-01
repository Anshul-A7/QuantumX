import Link from "next/link";

export default function DemoPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6 font-sans text-ink">
      <div className="max-w-md text-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-quantum">
          Test environment
        </span>
        <h1 className="mt-5 font-serif text-4xl font-light tracking-tight">Provisioning</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
          The sandbox for running hybrid inference against sample cohorts is being prepared. It will expose
          dataset selection, circuit configuration, and side-by-side classical baselines.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-full border border-hairline px-5 py-2.5 text-[14px] transition-colors hover:bg-cream-deep"
        >
          Back to overview
        </Link>
      </div>
    </main>
  );
}
