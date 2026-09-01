import { Metadata } from "next";
import { LegalPageLayout } from "@/components/common/LegalPageLayout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy and data protection policy for QuantumX biomedical data handling and cryptographic audit protocols.",
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy & Data Protection Policy"
      subtitle="How QuantumX safeguards biomedical data, protects analytical workflows, and guarantees zero data-leakage during hybrid quantum processing."
      badge="Data Security & HIPAA Alignment"
      iconType="lock"
    >
      <section className="space-y-4">
        <h2 className="text-2xl font-serif font-normal text-white border-b border-white/10 pb-2">
          1. Data Minimization & Zero-Leakage Architecture
        </h2>
        <p>
          QuantumX operates under strict data minimization principles. We do not collect, store, or sell personal identifiers or raw patient biological specimens. All computational workloads entering the preprocessing autoencoder are normalized into bounded feature vectors prior to quantum angle encoding.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-serif font-normal text-white border-b border-white/10 pb-2">
          2. Information We Process
        </h2>
        <ul className="list-disc pl-6 space-y-2 text-white/70">
          <li>
            <strong>Authentication Data:</strong> Email address, hashed credentials (Argon2id/bcrypt), or Google OAuth tokens necessary for managing secure user sessions.
          </li>
          <li>
            <strong>Diagnostic Feature Tensors:</strong> De-identified numerical vectors representing continuous biometric markers (e.g., nuclear perimeter, area, concavity, or transcriptomic counts).
          </li>
          <li>
            <strong>Execution Provenance:</strong> Algorithmic runtime telemetry, including optimization loss curves, parameter-shift gradients, and QPU shot counts.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-serif font-normal text-white border-b border-white/10 pb-2">
          3. Quantum Cloud Transmission & IBM Runtime
        </h2>
        <p>
          When real hardware execution mode is selected, parameterized quantum circuits are transpiled to native basis gates (CX, Rz, SX) and transmitted to IBM Quantum Runtime endpoints over TLS 1.3 encrypted connections. Only abstract circuit instructions and rotation angles are communicated to physical cryostats; no clinical patient context is ever exposed to external QPU schedulers.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-serif font-normal text-white border-b border-white/10 pb-2">
          4. Cryptographic Receipt Provenance
        </h2>
        <p>
          Every inference request generates a verifiable SHA-256 cryptographic receipt. This digest encapsulates the model configuration, the exact random seed utilized in stratified k-fold splits, and the resulting gate ablation importance scores. These receipts allow research audits without requiring persistent retention of raw underlying feature matrices.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-serif font-normal text-white border-b border-white/10 pb-2">
          5. User Rights & Data Deletion
        </h2>
        <p>
          You hold the absolute right to purge your uploaded datasets, custom VQC checkpoints, and analytical logs from our encrypted databases at any time through the Settings dashboard or by dispatching a deletion request to our compliance team.
        </p>
      </section>
    </LegalPageLayout>
  );
}
