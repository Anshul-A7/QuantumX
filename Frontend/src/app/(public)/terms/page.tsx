import { Metadata } from "next";
import { LegalPageLayout } from "@/components/common/LegalPageLayout";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms and conditions governing the use of the QuantumX Hybrid Quantum-Classical Machine Learning Platform.",
};

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      subtitle="Governing the use of QuantumX hybrid quantum-classical algorithms, benchmarking pipelines, and biomedical analytical services."
      badge="Legal & Licensing"
      iconType="file"
    >
      <section className="space-y-4">
        <h2 className="text-2xl font-serif font-normal text-white border-b border-white/10 pb-2">
          1. Acceptance of Terms & Research Mandate
        </h2>
        <p>
          By accessing or utilizing the QuantumX platform, its REST APIs, quantum statevector simulators, or physical quantum processing unit (QPU) dispatch integrations (collectively, the &ldquo;Services&rdquo;), you agree to be bound by these Terms of Service. If you are accessing the Services on behalf of an academic institution, clinical laboratory, or enterprise entity, you represent that you hold full legal authority to bind that entity.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-serif font-normal text-white border-b border-white/10 pb-2">
          2. Investigational & Research Use Only
        </h2>
        <p>
          QuantumX is an investigational scientific computing platform designed to evaluate parameterized quantum circuits (Variational Quantum Classifiers), Hilbert-space feature mappings, and classical gradient boosted baselines.
        </p>
        <div className="rounded-xl border border-quantum/30 bg-quantum/5 p-4 text-sm text-white/90">
          <strong>Mandatory Notice:</strong> The Services are NOT cleared, approved, or classified as medical devices or diagnostic software by the US FDA, EMA, or any national health authority. The predictions, state vectors, and ablation scores produced by the platform must not be used as the sole basis for direct clinical intervention, surgery, or medication without independent verification by licensed medical professionals.
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-serif font-normal text-white border-b border-white/10 pb-2">
          3. Biomedical Data Ingestion & Patient Privacy
        </h2>
        <p>
          Users submitting tabular biomedical records (e.g., Wisconsin Diagnostic Breast Cancer dataset, multi-omics transcriptomics, or cellular morphology features) represent and warrant that:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-white/70">
          <li>
            All submitted datasets are completely de-identified in strict compliance with the HIPAA Safe Harbor method (45 CFR § 164.514) or applicable GDPR anonymization standards.
          </li>
          <li>
            No direct Protected Health Information (PHI) — including patient names, social security numbers, or biometric facial scans — is transmitted to the public pipeline endpoints.
          </li>
          <li>
            The data owner maintains lawful consent and ethics board (IRB) approval for computational modeling and algorithmic analysis.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-serif font-normal text-white border-b border-white/10 pb-2">
          4. Algorithmic Reproducibility & Cryptographic Receipts
        </h2>
        <p>
          QuantumX issues cryptographically signed execution receipts (containing SHA-256 digests of input tensors, parameterized angles and expectation values). You agree not to forge, tamper with, or misrepresent verification signatures or statistical test outcomes (including McNemar&apos;s chi-squared significance metrics or s_K geometric distance metrics).
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-serif font-normal text-white border-b border-white/10 pb-2">
          5. Hardware Resource Quotas & Rate Limits
        </h2>
        <p>
          Access to statevector simulation backends (PennyLane, Qiskit Aer) and cloud QPU backends (IBM Quantum Runtime) is subject to concurrent execution quotas. We reserve the right to throttle or terminate API access if automated scripts generate adversarial denial-of-service traffic or deliberately attempt to saturate quantum queue dispatchers.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-serif font-normal text-white border-b border-white/10 pb-2">
          6. Limitation of Liability
        </h2>
        <p>
          To the maximum extent permitted by applicable law, the QuantumX development team, contributors, and affiliated research partners shall not be held liable for any direct, indirect, incidental, or consequential damages arising from algorithmic variance, quantum hardware decoherence, or downstream clinical interpretations.
        </p>
      </section>
    </LegalPageLayout>
  );
}
