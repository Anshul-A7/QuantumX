export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto py-24 px-6 text-gray-300">
      <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>

      <div className="space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">1. Information We Collect</h2>
          <p>As a research-grade quantum diagnostic platform, we prioritize data minimization. We collect only the information strictly necessary to provide the service: user authentication credentials (email) and the structured biomedical datasets you explicitly upload for processing.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">2. How We Use Your Data</h2>
          <p>Uploaded datasets are encoded into quantum states (e.g., via Angle Embedding) and processed by our hybrid pipeline. This data is held in volatile memory during the execution of the training or inference loop and is discarded post-computation unless you explicitly save a model artifact to your private workspace.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">3. Third-Party Infrastructure</h2>
          <p>Our hybrid pipeline routes certain computational workloads to external quantum backends (such as IBM Quantum via Qiskit Runtime). Only the mathematical representation of the quantum circuits—not the raw medical data—is transmitted to these external QPU providers.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">4. Security</h2>
          <p>We implement industry-standard encryption for data in transit (TLS) and at rest. Access to the QuantumX workspace requires secure JWT authentication. However, no internet-based service is 100% secure, and we cannot guarantee absolute security of your data.</p>
        </section>
      </div>
    </div>
  );
}
