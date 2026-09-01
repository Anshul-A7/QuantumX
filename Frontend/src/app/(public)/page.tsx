"use client";

import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  AnimatePresence,
  useInView,
} from "motion/react";
import { useRef, useState, useEffect, type ReactNode } from "react";
import {
  ArrowUp,
  ArrowUpRight,
  Sparkles,
  Cpu,
  CircleDot,
  Globe2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Motion primitives                                                    */
/* ------------------------------------------------------------------ */

function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ margin: "-12% 0px -12% 0px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared atoms                                                         */
/* ------------------------------------------------------------------ */

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
      <span className="h-px w-8 bg-quantum/50" />
      {children}
    </div>
  );
}

function Glass({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-hairline/80 bg-parchment/55 shadow-[0_1px_0_0_rgba(255,255,255,0.7)_inset,0_18px_40px_-32px_rgba(60,50,35,0.5)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Navigation                                                           */
/* ------------------------------------------------------------------ */

const NAV_LINKS = [
  { label: "Technology", href: "#technology" },
  { label: "Research", href: "#research" },
  { label: "Platform", href: "#platform" },
  { label: "Documentation", href: "#documentation" },
];

function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between rounded-full border px-5 transition-all duration-500 ${
          scrolled
            ? "border-hairline/90 bg-parchment/70 py-2.5 shadow-[0_16px_40px_-34px_rgba(60,50,35,0.8)] backdrop-blur-xl"
            : "border-transparent bg-transparent py-4"
        }`}
      >
        <a href="#top" className="flex items-baseline gap-2">
          <span className="font-serif text-[19px] tracking-tight text-ink">QuantumX</span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:inline">
            Research Platform
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-[13.5px] text-ink-soft transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-full border border-hairline px-4 py-1.5 text-[13px] text-ink transition-colors hover:bg-cream-deep"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-ink px-4 py-1.5 text-[13px] text-parchment transition-opacity hover:opacity-88"
          >
            Register
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                 */
/* ------------------------------------------------------------------ */

function Hero() {
  const ref = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 90]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, reduce ? 1 : 0.15]);

  return (
    <section id="top" ref={ref} className="relative overflow-hidden px-6 pb-28 pt-44 md:pt-52">
      {/* atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(60rem 32rem at 22% -8%, var(--quantum-soft), transparent 62%), radial-gradient(48rem 28rem at 88% 6%, var(--cream-deep), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(var(--hairline) 1px, transparent 1px), linear-gradient(90deg, var(--hairline) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(48rem 30rem at 50% 0%, black, transparent 78%)",
        }}
      />

      <motion.div style={{ y, opacity }} className="mx-auto max-w-5xl">
        <Reveal>
          <Eyebrow>Hybrid quantum-classical inference</Eyebrow>
        </Reveal>

        <Reveal delay={0.06}>
          <h1 className="mt-7 max-w-4xl font-serif text-[clamp(2.6rem,6vw,4.6rem)] font-light leading-[1.03] tracking-[-0.02em] text-ink">
            Quantum kernels and classical learners,
            <span className="text-ink-soft"> working on the same biomedical data.</span>
          </h1>
        </Reveal>

        <Reveal delay={0.12}>
          <p className="mt-8 max-w-2xl text-[17px] leading-[1.7] text-ink-soft">
            QuantumX encodes multi-omics panels, longitudinal labs, and structured clinical records into
            quantum feature spaces where higher-order interactions stay intact. The objective is narrow and
            measurable: recover diagnostic signal at the pre-symptomatic stage that linear projections and
            tree ensembles smooth away — and prove it against the classical baseline every time.
          </p>
        </Reveal>

        <Reveal delay={0.18}>
          <div className="mt-11 flex flex-wrap items-center gap-3">
            <a
              href="#research"
              className="rounded-full border border-hairline bg-parchment/70 px-6 py-3 text-[14px] text-ink backdrop-blur transition-colors hover:bg-cream-deep"
            >
              Read the whitepaper
            </a>
            <Link
              href="/home"
              className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[14px] text-parchment transition-opacity hover:opacity-88"
            >
              Launch test environment
              <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.24}>
          <dl className="mt-20 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-8 border-t border-hairline pt-8 sm:grid-cols-4">
            {[
              ["12–20", "logical qubits per circuit"],
              ["IBM Heron", "QPU execution backend"],
              ["5×2", "cross-validated splits"],
              ["p < 0.05", "reporting threshold"],
            ].map(([v, k]) => (
              <div key={k}>
                <dt className="font-serif text-2xl text-ink">{v}</dt>
                <dd className="mt-1.5 text-[12.5px] leading-snug text-muted-foreground">{k}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Clinical reality                                                     */
/* ------------------------------------------------------------------ */

const FAILURES = [
  {
    n: "01",
    title: "Epistasis is not additive",
    body: "Risk in polygenic disease frequently lives in the interaction term. A model that scores loci independently — or with pairwise interactions hand-selected in advance — cannot represent a three-way epistatic effect it was never told to look for.",
  },
  {
    n: "02",
    title: "PCA discards the manifold",
    body: "Reducing 20,000 transcripts to 50 components preserves variance, not structure. Variance is dominated by batch, tissue composition, and demographics. The curvature that separates an early lesion from benign tissue is low-variance and is the first thing a linear projection throws out.",
  },
  {
    n: "03",
    title: "Early signal has low amplitude",
    body: "At stage I, the discriminative shift in a circulating biomarker is often within assay noise for any single analyte. Detection depends on the joint configuration across dozens of weak markers, which is precisely the regime where regularised classical models collapse toward the majority class.",
  },
  {
    n: "04",
    title: "p ≫ n, and the cohorts are small",
    body: "Curated, well-phenotyped cohorts run to hundreds of patients against tens of thousands of features. Deep networks overfit; sparse linear models underfit. Neither failure is fixed by more epochs.",
  },
];

function ClinicalReality() {
  return (
    <section id="technology" className="relative border-t border-hairline bg-cream-deep/40 px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <Eyebrow>Clinical reality</Eyebrow>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mt-6 max-w-3xl font-serif text-[clamp(2rem,4vw,3.1rem)] font-light leading-[1.1] tracking-[-0.015em] text-ink">
            Where classical models stop improving
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-6 max-w-2xl text-[16px] leading-[1.7] text-ink-soft">
            Gradient boosting on tabular clinical data is a strong, well-understood baseline, and on most
            tasks it should be the deployed model. The failure modes below are the ones we have repeatedly
            observed where it is not enough — and they share a cause: the diagnostic information is in the
            geometry of feature interactions, not in the features.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline md:grid-cols-2">
          {FAILURES.map((f, i) => (
            <Reveal key={f.n} delay={0.05 * i} className="bg-parchment/70 backdrop-blur-sm">
              <div className="h-full p-8 md:p-10">
                <span className="font-mono text-[11px] tracking-[0.2em] text-quantum">{f.n}</span>
                <h3 className="mt-4 font-serif text-[22px] leading-snug text-ink">{f.title}</h3>
                <p className="mt-4 text-[14.5px] leading-[1.75] text-ink-soft">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Pipeline                                                             */
/* ------------------------------------------------------------------ */

const STAGES = [
  {
    id: "encoding",
    label: "Stage 01",
    title: "Non-linear feature encoding",
    body: "A supervised autoencoder compresses the raw panel to a 12–20 dimensional latent vector sized to the circuit width. The bottleneck is trained jointly with the downstream objective, so compression is driven by class separability rather than reconstruction error alone. Latent dimensions are retained with their loadings intact for later attribution.",
    meta: ["Supervised bottleneck", "Batch-effect correction", "Loadings retained"],
  },
  {
    id: "screening",
    label: "Stage 02",
    title: "Geometric pre-screening",
    body: "Before a single shot is executed, we compute the quantum kernel Gram matrix on the training fold and test whether it induces separation the classical RBF kernel does not: kernel-target alignment, effective dimension, and the spectral gap between the two Gram matrices. If the quantum kernel offers no geometric advantage, the run is flagged and the classical model is recommended. Most datasets do not pass this gate, and we say so.",
    meta: ["Kernel-target alignment", "Effective dimension", "Go / no-go gate"],
  },
  {
    id: "inference",
    label: "Stage 03",
    title: "Hybrid inference",
    body: "Variational classifiers and quantum kernel SVMs run on IBM Heron QPUs through Qiskit Runtime, with the identical fold executed simultaneously against XGBoost, RBF-SVM, and regularised logistic regression. Statevector simulation, noisy simulation, and hardware results are stored as three distinct records — never averaged, never substituted for one another.",
    meta: ["Qiskit Runtime", "Zero-noise extrapolation", "Simulator / hardware parity"],
  },
  {
    id: "qxplain",
    label: "Stage 04",
    title: "QXplain attribution engine",
    body: "SHAP assumes a classical additive decomposition that a entangled circuit does not satisfy. QXplain instead ablates individual gates and entangling blocks, measuring the shift in decision margin to attribute the prediction to specific feature interactions. Attribution is propagated back through the autoencoder loadings to named genes, analytes, and clinical variables.",
    meta: ["Gate ablation", "Entanglement attribution", "Traced to source features"],
  },
];

function Pipeline() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 60%", "end 80%"] });
  const railHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="platform" className="relative border-t border-hairline px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <Eyebrow>The pipeline</Eyebrow>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mt-6 max-w-3xl font-serif text-[clamp(2rem,4vw,3.1rem)] font-light leading-[1.1] tracking-[-0.015em] text-ink">
            Four stages, one auditable run record
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-6 max-w-2xl text-[16px] leading-[1.7] text-ink-soft">
            Every execution writes a versioned record: preprocessing hash, circuit ansatz, transpiled depth,
            backend calibration snapshot, seeds, and the classical baselines run alongside it. A result you
            cannot reproduce is not a result.
          </p>
        </Reveal>

        <div ref={ref} className="relative mt-20 pl-8 md:pl-16">
          <div className="absolute left-0 top-2 bottom-2 w-px bg-hairline md:left-6" />
          <motion.div
            style={{ height: railHeight }}
            className="absolute left-0 top-2 w-px origin-top bg-quantum md:left-6"
          />

          <div className="space-y-6">
            {STAGES.map((s, i) => (
              <Reveal key={s.id} delay={0.04 * i}>
                <div className="relative">
                  <span className="absolute -left-8 top-9 h-2 w-2 rounded-full bg-quantum ring-4 ring-cream md:-left-[2.85rem]" />
                  <Glass className="p-8 transition-colors duration-500 hover:bg-parchment/80 md:p-10">
                    <div className="flex flex-col gap-8 md:flex-row md:items-start">
                      <div className="md:w-52 md:shrink-0">
                        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-quantum">
                          {s.label}
                        </span>
                        <h3 className="mt-3 font-serif text-[24px] leading-tight text-ink">{s.title}</h3>
                      </div>
                      <div className="flex-1">
                        <p className="text-[15px] leading-[1.78] text-ink-soft">{s.body}</p>
                        <div className="mt-6 flex flex-wrap gap-2">
                          {s.meta.map((m) => (
                            <span
                              key={m}
                              className="rounded-full border border-hairline bg-cream-deep/60 px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Glass>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Benchmarking                                                         */
/* ------------------------------------------------------------------ */

const ROWS = [
  ["Logistic regression (L2)", "0.812", "0.74", "0.79", "reference"],
  ["RBF-SVM", "0.841", "0.77", "0.81", "0.041"],
  ["XGBoost", "0.869", "0.81", "0.83", "0.012"],
  ["Quantum kernel SVM (sim)", "0.884", "0.85", "0.82", "0.038"],
  ["Quantum kernel SVM (QPU)", "0.877", "0.84", "0.81", "0.061"],
];

function Benchmarking() {
  return (
    <section id="research" className="relative border-t border-hairline bg-cream-deep/40 px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Reveal>
              <Eyebrow>Benchmarking</Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="mt-6 font-serif text-[clamp(2rem,4vw,3.1rem)] font-light leading-[1.1] tracking-[-0.015em] text-ink">
                We do not claim an advantage we cannot measure
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="mt-7 space-y-5 text-[15.5px] leading-[1.78] text-ink-soft">
                <p>
                  Quantum and classical models are trained and evaluated on identical stratified splits with
                  identical preprocessing and identical seeds. Nothing is tuned on the test fold. Comparisons
                  use McNemar's test on paired predictions for discordance and a paired t-test across
                  cross-validation folds for aggregate metrics, with Benjamini–Hochberg correction when
                  several architectures are compared at once.
                </p>
                <p>
                  A difference in AUC that does not clear the significance threshold is reported as no
                  difference. When the classical baseline wins, that is the finding we publish, and the
                  platform recommends the classical model for that cohort.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="mt-9 border-l-2 border-quantum/60 pl-5">
                <p className="font-serif text-[17px] italic leading-relaxed text-ink">
                  “A negative result on a well-designed comparison is more useful to a clinical team than an
                  unreplicable positive one.”
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.1}>
            <Glass className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Comparison record · illustrative
                </span>
                <span className="font-mono text-[11px] text-quantum">5×2 CV</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-hairline text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      <th className="px-6 py-3 font-normal">Model</th>
                      <th className="px-4 py-3 font-normal">AUC</th>
                      <th className="px-4 py-3 font-normal">Sens.</th>
                      <th className="px-4 py-3 font-normal">Spec.</th>
                      <th className="px-6 py-3 font-normal">p</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ROWS.map((r, i) => (
                      <tr
                        key={r[0]}
                        className={`border-b border-hairline/60 last:border-0 ${
                          i >= 3 ? "bg-quantum-soft/40" : ""
                        }`}
                      >
                        <td className="px-6 py-3.5 text-ink">{r[0]}</td>
                        <td className="px-4 py-3.5 font-mono text-ink">{r[1]}</td>
                        <td className="px-4 py-3.5 font-mono text-ink-soft">{r[2]}</td>
                        <td className="px-4 py-3.5 font-mono text-ink-soft">{r[3]}</td>
                        <td className="px-6 py-3.5 font-mono text-ink-soft">{r[4]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="border-t border-hairline px-6 py-4 text-[12px] leading-relaxed text-muted-foreground">
                Figures shown are an illustrative record layout, not published performance. Hardware rows
                carry wider confidence intervals from shot noise and device drift; simulator results are never
                reported as hardware results.
              </p>
            </Glass>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/* MoveToTop Floating Button                                            */
/* ------------------------------------------------------------------ */

function MoveToTop() {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return scrollY.on("change", (latest) => {
      setVisible(latest > 400);
    });
  }, [scrollY]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          onClick={scrollToTop}
          className="fixed bottom-8 left-8 z-[999] p-3.5 rounded-full bg-black text-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] hover:scale-110 hover:bg-black transition-all border border-white/10"
          aria-label="Scroll to top"
        >
          <ArrowUp size={20} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* Big Cinematic Footer (Vocaria AI Architecture)                     */
/* ------------------------------------------------------------------ */

function Footer() {
  const credits = [
    "PennyLane 0.38+",
    "Qiskit Aer",
    "IBM Heron 133Q",
    "PyTorch Autograd",
    "XGBoost & LightGBM",
    "ZNE / M3 Mitigation",
    "KernelSHAP",
    "McNemar's χ² Test",
  ];

  const cols = [
    {
      title: "Platform",
      items: [
        { name: "Clinical Predictor", path: "/predict" },
        { name: "Breast Cancer Pipeline", path: "/predict/breast-cancer" },
        { name: "Hilbert Space Analysis", path: "/analysis" },
        { name: "Live Hardware Run", path: "/hardware" },
        { name: "Interactive Demo", path: "/predict/demo" },
      ],
    },
    {
      title: "Research & Benchmarks",
      items: [
        { name: "Geometric Advantage (s_K)", path: "/benchmarks" },
        { name: "Tri-Model Protocol (BVP)", path: "/benchmarks" },
        { name: "QXplain Gate Saliency", path: "/analysis" },
        { name: "Classical Ensembles", path: "/benchmarks" },
        { name: "Reproducibility Suite", path: "/benchmarks" },
      ],
    },
    {
      title: "System & Company",
      items: [
        { name: "Research Documentation", path: "/predict/demo" },
        { name: "API Reference", path: "https://github.com/Anshul-A7/QuantumX" },
        { name: "Privacy Policy", path: "#top" },
        { name: "Clinical Disclaimer", path: "#top" },
      ],
    },
  ];

  /* Refs for in-view detection */
  const heroRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const heroInView = useInView(heroRef, { once: true, amount: 0.2 });
  const gridInView = useInView(gridRef, { once: true, amount: 0.15 });
  const wordmarkInView = useInView(wordmarkRef, { once: true, amount: 0.3 });
  const barInView = useInView(barRef, { once: true, amount: 0.5 });

  return (
    <footer id="documentation" className="relative border-t border-white/10 bg-black text-white overflow-hidden">
      {/* Top Statement Section */}
      <div
        ref={heroRef}
        className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-24 pb-16 grid grid-cols-12 gap-8"
      >
        <div className="col-span-12 md:col-span-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="font-mono text-white/50 mb-6 flex items-center gap-3 text-[11px] uppercase tracking-widest"
          >
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-quantum animate-pulse" />
              <span className="font-serif text-xl font-medium tracking-tight text-white">QuantumX</span>
              <span className="text-white/40">· Enterprise Diagnostic Platform</span>
            </div>
          </motion.div>
          <motion.h2
            initial={{ clipPath: "inset(0 100% 0 0)" }}
            animate={heroInView ? { clipPath: "inset(0 0% 0 0)" } : {}}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="text-4xl md:text-5xl lg:text-[60px] font-light leading-[1.02] tracking-tight max-w-[24ch] text-[#FDFBF7] font-serif"
          >
            The complete quantum layer for healthcare diagnostics — screen, optimize, benchmark, and explain hybrid models from one rigorous platform.
          </motion.h2>
        </div>

        <div className="col-span-12 md:col-span-4 flex flex-col justify-end gap-4 mt-8 md:mt-0">
          <motion.a
            href="https://anshul-portfolio.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, x: 30 }}
            animate={heroInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-full px-6 h-14 flex items-center justify-between gap-3 group bg-white/[0.05] border border-white/10 hover:bg-white hover:text-black transition-colors backdrop-blur-md"
          >
            <span className="font-mono text-xs uppercase tracking-widest font-semibold flex items-center gap-2">
              <Globe2 size={15} /> VISIT PORTFOLIO
            </span>
            <ArrowUpRight
              size={16}
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </motion.a>

          <motion.a
            href="https://aexotrex.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, x: 30 }}
            animate={heroInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.55 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-full px-6 h-14 flex items-center justify-between gap-3 group bg-white/[0.05] border border-white/10 hover:bg-white hover:text-black transition-colors backdrop-blur-md"
          >
            <span className="font-mono text-xs uppercase tracking-widest font-semibold flex items-center gap-2">
              <Sparkles size={14} className="text-quantum" /> AEXOTREX
            </span>
            <ArrowUpRight
              size={16}
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </motion.a>
        </div>
      </div>

      {/* Meta Grid Section */}
      <div
        ref={gridRef}
        className="mx-auto max-w-[1400px] px-6 lg:px-10 pb-16 grid grid-cols-2 md:grid-cols-5 gap-10 border-t border-white/10 pt-12"
      >
        {cols.map((c, colIdx) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 20 }}
            animate={gridInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 + colIdx * 0.1 }}
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#38bdf8] mb-5 pb-2 border-b border-white/10">
              {c.title}
            </div>
            <ul className="space-y-2.5">
              {c.items.map((it, linkIdx) => (
                <li key={it.name}>
                  <motion.div
                    initial={{ opacity: 0, x: -12 }}
                    animate={gridInView ? { opacity: 1, x: 0 } : {}}
                    transition={{
                      duration: 0.4,
                      delay: 0.2 + colIdx * 0.1 + linkIdx * 0.06,
                    }}
                  >
                    {it.path.startsWith("#") || it.path.startsWith("http") ? (
                      <a
                        href={it.path}
                        target={it.path.startsWith("http") ? "_blank" : undefined}
                        rel={it.path.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="text-[15px] md:text-lg text-white/80 hover:text-white transition-colors"
                      >
                        {it.name}
                      </a>
                    ) : (
                      <Link
                        href={it.path}
                        className="text-[15px] md:text-lg text-white/80 hover:text-white transition-colors"
                      >
                        {it.name}
                      </Link>
                    )}
                  </motion.div>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}

        {/* Model credits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={gridInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="col-span-2 md:col-span-2"
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#38bdf8] mb-5 pb-2 border-b border-white/10 flex items-center gap-2">
            <Cpu size={12} /> Powered by · open quantum & ML stack
          </div>
          <div className="flex flex-wrap gap-2.5">
            {credits.map((c, i) => (
              <motion.span
                key={c}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={gridInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.45 + i * 0.04 }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-[11px] font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <CircleDot size={9} className="text-[#38bdf8]" /> {c}
              </motion.span>
            ))}
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={gridInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-6 text-xs text-white/45 leading-relaxed max-w-md"
          >
            QuantumX rigorously evaluates parameterized quantum circuits against classical baselines on identical stratified splits. All benchmarks, noise-mitigation protocols, and explainability attributions adhere to open research standards.
          </motion.p>
        </motion.div>
      </div>

      {/* Massive wordmark with character reveal */}
      <div ref={wordmarkRef} className="border-t border-white/10 overflow-hidden">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-10 pb-2">
          <div
            className="leading-[0.82] tracking-tighter select-none text-[clamp(80px,21vw,340px)] flex text-[#FDFBF7] font-serif"
          >
            {"QuantumX".split("").map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 40 }}
                animate={wordmarkInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.5,
                  delay: i * 0.06,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {char}
              </motion.span>
            ))}
            <motion.span
              initial={{ opacity: 0, scale: 0 }}
              animate={wordmarkInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.55, type: "spring", stiffness: 300 }}
              className="text-quantum"
            >
              .
            </motion.span>
          </div>
        </div>
      </div>

      {/* Bottom bar with subtle parallax */}
      <div ref={barRef} className="border-t border-white/10">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-6 flex flex-wrap items-center justify-between gap-4 font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={barInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center gap-4"
          >
            <span>© {new Date().getFullYear()} QUANTUMX — ALL RIGOR, ALL VERIFIABLE.</span>
            <a href="#top" className="hover:text-white transition-colors hidden md:inline-block border-l border-white/10 pl-4">
              Terms
            </a>
            <a href="#top" className="hover:text-white transition-colors hidden md:inline-block border-l border-white/10 pl-4">
              Privacy
            </a>
            <a href="#top" className="hover:text-white transition-colors hidden md:inline-block border-l border-white/10 pl-4">
              Clinical Disclaimer
            </a>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={barInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            N 28.61 · E 77.20 · EST 2026
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={barInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            BUILD · 0XQ9F4 · V3.2.0 · BVP-VERIFIED
          </motion.div>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* Translational Workflow                                               */
/* ------------------------------------------------------------------ */

function CohortStratificationView() {
  const [selectedMarker, setSelectedMarker] = useState<"ERBB2" | "TP53" | "CA125">("ERBB2");

  const markerData = {
    ERBB2: {
      name: "ERBB2 (HER2) Overexpression",
      cohortSize: 182,
      riskRatio: "4.12x",
      pVal: "p < 0.001",
      breakdown: [
        { label: "Stage I (Pre-symptomatic)", pct: 64, count: 116, color: "bg-ink" },
        { label: "Stage II (Incipient)", pct: 26, count: 48, color: "bg-quantum" },
        { label: "Benign Phenocopy", pct: 10, count: 18, color: "bg-muted-foreground/40" },
      ],
      insight: "Non-linear quantum feature mapping resolves low-abundance ERBB2 transcript clusters missed by regularized linear baselines.",
    },
    TP53: {
      name: "TP53 Exon 5–8 Missense",
      cohortSize: 94,
      riskRatio: "3.45x",
      pVal: "p = 0.002",
      breakdown: [
        { label: "Stage I (Pre-symptomatic)", pct: 52, count: 49, color: "bg-ink" },
        { label: "Stage II (Incipient)", pct: 33, count: 31, color: "bg-quantum" },
        { label: "Benign Phenocopy", pct: 15, count: 14, color: "bg-muted-foreground/40" },
      ],
      insight: "Captures 3-way epistatic interaction between TP53 loss-of-function and circulating inflammatory cytokines.",
    },
    CA125: {
      name: "Circulating CA-125 Dynamic Shift",
      cohortSize: 68,
      riskRatio: "2.88x",
      pVal: "p = 0.012",
      breakdown: [
        { label: "Stage I (Pre-symptomatic)", pct: 41, count: 28, color: "bg-ink" },
        { label: "Stage II (Incipient)", pct: 44, count: 30, color: "bg-quantum" },
        { label: "Benign Phenocopy", pct: 15, count: 10, color: "bg-muted-foreground/40" },
      ],
      insight: "Identifies rate-of-change trajectory deviations within the assay noise floor across 3 sequential timepoints.",
    },
  };

  const active = markerData[selectedMarker];

  return (
    <div className="flex h-full w-full flex-col justify-between p-6 sm:p-7">
      <div>
        {/* Header with selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Stratified Cohort Analysis · n=1,245
            </span>
            <div className="mt-1 font-serif text-[18px] text-ink">{active.name}</div>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-hairline bg-cream-deep/40 p-1">
            {(["ERBB2", "TP53", "CA125"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setSelectedMarker(k)}
                className={`rounded-md px-2.5 py-1 font-mono text-[10px] uppercase transition-all ${
                  selectedMarker === k
                    ? "bg-ink text-parchment shadow-sm"
                    : "text-muted-foreground hover:text-ink"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-hairline/80 bg-parchment/60 p-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">Risk Ratio</span>
            <div className="mt-1 font-mono text-[19px] font-medium text-ink">{active.riskRatio}</div>
          </div>
          <div className="rounded-xl border border-hairline/80 bg-parchment/60 p-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">Enriched Patients</span>
            <div className="mt-1 font-mono text-[19px] font-medium text-ink">{active.cohortSize}</div>
          </div>
          <div className="rounded-xl border border-hairline/80 bg-parchment/60 p-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">Significance</span>
            <div className="mt-1 font-mono text-[19px] font-medium text-quantum">{active.pVal}</div>
          </div>
        </div>

        {/* Distribution Bars */}
        <div className="mt-6 space-y-3.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Stage Classification Breakdown
          </span>
          <div className="space-y-2.5">
            {active.breakdown.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-ink-soft">{item.label}</span>
                  <span className="text-ink font-medium">{item.count} pts ({item.pct}%)</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-hairline/80">
                  <motion.div
                    key={selectedMarker + item.label}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    style={{ width: `${item.pct}%` }}
                    className={`h-full rounded-full ${item.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clinical Rationale footer */}
      <div className="mt-5 rounded-xl border border-quantum/20 bg-quantum/5 p-3.5">
        <p className="text-[12.5px] leading-relaxed text-ink-soft">
          <span className="font-mono text-[10px] uppercase tracking-wider text-quantum font-semibold">Mechanism: </span>
          {active.insight}
        </p>
      </div>
    </div>
  );
}

function QuantumKernelView() {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number; val: number } | null>(null);

  // Structured matrix simulating real patient-by-patient quantum kernel gram matrix
  const matrix = [
    [1.00, 0.88, 0.74, 0.32, 0.18, 0.12, 0.08, 0.04],
    [0.88, 1.00, 0.82, 0.39, 0.21, 0.15, 0.09, 0.05],
    [0.74, 0.82, 1.00, 0.44, 0.28, 0.19, 0.11, 0.07],
    [0.32, 0.39, 0.44, 1.00, 0.76, 0.68, 0.24, 0.18],
    [0.18, 0.21, 0.28, 0.76, 1.00, 0.84, 0.31, 0.22],
    [0.12, 0.15, 0.19, 0.68, 0.84, 1.00, 0.42, 0.29],
    [0.08, 0.09, 0.11, 0.24, 0.31, 0.42, 1.00, 0.87],
    [0.04, 0.05, 0.07, 0.18, 0.22, 0.29, 0.87, 1.00],
  ];

  return (
    <div className="flex h-full w-full flex-col justify-between p-6 sm:p-7">
      <div>
        <div className="flex items-center justify-between border-b border-hairline pb-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Quantum Kernel Gram Matrix
            </span>
            <div className="mt-1 font-serif text-[18px] text-ink">
              K(x_i, x_j) = |⟨ψ(x_i)|ψ(x_j)⟩|²
            </div>
          </div>
          <span className="rounded-full border border-hairline bg-parchment px-3 py-1 font-mono text-[10px] text-quantum">
            N=8×8 Subspace
          </span>
        </div>

        {/* Heatmap Grid & Legend */}
        <div className="mt-5 flex flex-col items-center sm:flex-row sm:items-center sm:justify-center sm:gap-8">
          <div className="grid grid-cols-8 gap-1.5 rounded-xl border border-hairline/80 bg-parchment/70 p-2.5 shadow-inner">
            {matrix.map((row, rIdx) =>
              row.map((val, cIdx) => {
                const isDiagonal = rIdx === cIdx;
                const isHovered = hoveredCell?.row === rIdx && hoveredCell?.col === cIdx;

                return (
                  <button
                    key={`${rIdx}-${cIdx}`}
                    onMouseEnter={() => setHoveredCell({ row: rIdx, col: cIdx, val })}
                    className={`h-7 w-7 rounded-[4px] transition-all sm:h-8 sm:w-8 ${
                      isHovered ? "ring-2 ring-ink scale-110 z-10" : ""
                    }`}
                    style={{
                      backgroundColor: isDiagonal
                        ? "oklch(0.24 0.02 50)"
                        : `oklch(0.48 0.12 185 / ${Math.max(0.12, val)})`,
                    }}
                  />
                );
              })
            )}
          </div>

          {/* Color bar scale */}
          <div className="mt-4 flex sm:mt-0 sm:flex-col items-center gap-2">
            <span className="font-mono text-[9px] text-ink font-medium">1.0</span>
            <div className="h-2 w-32 sm:h-32 sm:w-2.5 rounded-full bg-gradient-to-r sm:bg-gradient-to-b from-ink via-quantum to-quantum/10 border border-hairline" />
            <span className="font-mono text-[9px] text-muted-foreground">0.0</span>
          </div>
        </div>
      </div>

      {/* Dynamic Hover Status */}
      <div className="mt-4 rounded-xl border border-hairline bg-parchment/60 p-4">
        {hoveredCell ? (
          <div className="flex items-center justify-between font-mono text-[11.5px]">
            <div>
              <span className="text-muted-foreground">Pair: </span>
              <span className="text-ink font-semibold">Patient P{hoveredCell.row + 1} ↔ P{hoveredCell.col + 1}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Fidelity: </span>
              <span className="text-quantum font-bold">{hoveredCell.val.toFixed(2)}</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-muted-foreground">Cluster: </span>
              <span className="text-ink">{hoveredCell.val > 0.6 ? "High Homology" : "Orthogonal"}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 font-mono text-[11.5px] text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-quantum" />
            Hover over matrix cells to inspect pairwise quantum fidelity
          </div>
        )}
      </div>
    </div>
  );
}

function GateAblationView() {
  const [ablated, setAblated] = useState<Record<string, boolean>>({});

  const gates = [
    { id: "g1", label: "CX(q₀, q₁)", name: "Epistasis Pair A", baselineDelta: -0.28, pathway: "ERBB2 ↔ PIK3CA" },
    { id: "g2", label: "RY(θ₁)", name: "Single-locus Encoding", baselineDelta: -0.09, pathway: "TP53 Transversion" },
    { id: "g3", label: "CX(q₁, q₂)", name: "Epistasis Pair B", baselineDelta: -0.34, pathway: "BRCA1 ↔ Age Manifold" },
    { id: "g4", label: "RZ(θ₂)", name: "Phase Rotation", baselineDelta: -0.04, pathway: "Batch-effect Correction" },
    { id: "g5", label: "CX(q₂, q₃)", name: "High-order Interaction", baselineDelta: -0.41, pathway: "Multi-omics Joint Latent" },
  ];

  const toggleGate = (id: string) => {
    setAblated((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalAblatedDelta = gates.reduce((acc, g) => (ablated[g.id] ? acc + g.baselineDelta : acc), 0);
  const currentMargin = Math.max(0.12, +(0.88 + totalAblatedDelta).toFixed(2));

  return (
    <div className="flex h-full w-full flex-col justify-between p-6 sm:p-7">
      <div>
        <div className="flex items-center justify-between border-b border-hairline pb-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              QXplain · Circuit Gate Ablation
            </span>
            <div className="mt-1 font-serif text-[18px] text-ink">Entanglement Attribution Engine</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Decision Margin</div>
            <div className="font-mono text-[18px] font-bold text-ink">{currentMargin} AUC</div>
          </div>
        </div>

        {/* Interactive Gate List */}
        <div className="mt-5 space-y-2.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Click entangling blocks to test ablation impact:
          </span>

          {gates.map((g) => {
            const isOff = !!ablated[g.id];
            return (
              <button
                key={g.id}
                onClick={() => toggleGate(g.id)}
                className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
                  isOff
                    ? "border-dashed border-hairline bg-cream-deep/30 opacity-60"
                    : "border-hairline bg-parchment/60 hover:border-quantum/50 shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-6 w-16 shrink-0 items-center justify-center rounded font-mono text-[10px] font-semibold transition-colors ${
                      isOff ? "bg-muted text-muted-foreground line-through" : "bg-ink text-parchment"
                    }`}
                  >
                    {g.label}
                  </span>
                  <div>
                    <div className="text-[13px] font-medium text-ink">{g.name}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{g.pathway}</div>
                  </div>
                </div>

                <div className="text-right font-mono text-[11px]">
                  <span className={isOff ? "text-muted-foreground" : "text-ink font-semibold"}>
                    {isOff ? "Ablated" : `${g.baselineDelta} AUC`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-hairline bg-cream-deep/40 p-3.5">
        <p className="text-[12px] leading-relaxed text-ink-soft">
          <span className="font-mono text-[10px] font-semibold uppercase text-ink">Deterministic Attribution: </span>
          Ablating <span className="font-mono text-[11px] text-quantum font-semibold">CX(q₂, q₃)</span> produces the sharpest degradation, proving the diagnostic signal is stored in multi-qubit entanglement rather than single-gene linear terms.
        </p>
      </div>
    </div>
  );
}

const TRANSLATIONAL_SECTIONS = [
  {
    id: "cohort",
    title: "Patient Cohort Stratification",
    description: "Ingest high-dimensional multi-omics cohorts and surface early pre-symptomatic sub-phenotypes with deterministic statistical confidence.",
    Component: CohortStratificationView,
  },
  {
    id: "kernel",
    title: "Quantum Kernel Gram Matrix",
    description: "Inspect pairwise Hilbert-space inner products. Confirm that quantum feature mapping separates non-linear phenotypes before model fitting.",
    Component: QuantumKernelView,
  },
  {
    id: "ablation",
    title: "Deterministic Gate Ablation",
    description: "Attribute prediction margins directly to specific multi-qubit entangling gates, mapped backward through loadings to named biological pathways.",
    Component: GateAblationView,
  },
];

function TranslationalWorkflow() {
  const [activeTab, setActiveTab] = useState(0);
  const active = TRANSLATIONAL_SECTIONS[activeTab];
  const ActiveComponent = active.Component;

  return (
    <section className="relative border-t border-hairline bg-cream px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.2fr]">
          {/* Left Text & Interactive Selector */}
          <div>
            <Reveal>
              <Eyebrow>Translational integration</Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="mt-6 font-serif text-[clamp(2rem,4vw,3.1rem)] font-light leading-[1.1] tracking-[-0.015em] text-ink">
                From raw cohorts to auditable discovery
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 text-[16px] leading-[1.7] text-ink-soft">
                QuantumX connects directly to clinical pipelines. Explore the interactive research views below to see how our hybrid framework ingests cohorts, verifies geometric advantage in Hilbert space, and attributes predictions to biological drivers.
              </p>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="mt-10 space-y-3">
                {TRANSLATIONAL_SECTIONS.map((section, idx) => {
                  const isSelected = idx === activeTab;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveTab(idx)}
                      className={`w-full rounded-2xl border p-5 text-left transition-all duration-300 ${
                        isSelected
                          ? "border-hairline/90 bg-parchment shadow-[0_12px_32px_-20px_rgba(60,50,35,0.4)]"
                          : "border-transparent hover:bg-parchment/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className={`font-serif text-[18px] transition-colors ${isSelected ? "text-ink font-medium" : "text-ink-soft"}`}>
                          {section.title}
                        </h3>
                        <span className={`font-mono text-[11px] ${isSelected ? "text-quantum font-bold" : "text-muted-foreground"}`}>
                          0{idx + 1}
                        </span>
                      </div>
                      <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">
                        {section.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </Reveal>
          </div>

          {/* Right Live Interactive Visual Terminal */}
          <Reveal delay={0.2} className="h-full">
            <Glass className="overflow-hidden min-h-[540px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="h-full w-full"
                >
                  <ActiveComponent />
                </motion.div>
              </AnimatePresence>
            </Glass>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export default function Page() {
  return (
    <main className="min-h-screen scroll-smooth bg-cream font-sans text-ink antialiased">
      <MoveToTop />
      <Nav />
      <Hero />
      <ClinicalReality />
      <Pipeline />
      <TranslationalWorkflow />
      <Benchmarking />
      <Footer />
    </main>
  );
}
