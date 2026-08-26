export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-24 px-6 text-gray-300">
      <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>

      <div className="space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
          <p>By accessing and using the QuantumX platform ("Service"), you agree to be bound by these Terms of Service. This platform is a prototype developed for the Smart India Hackathon 2026 and should not be used as a substitute for professional medical advice.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">2. Medical Disclaimer</h2>
          <p>QuantumX provides predictive modeling using hybrid quantum-classical algorithms. The outputs, including Quantum SHAP explainability metrics, are for research and informational purposes only. They do not constitute clinical diagnoses. Always consult a qualified healthcare provider for medical decisions.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">3. Data Usage & Privacy</h2>
          <p>Datasets uploaded to the platform are processed temporarily for the purpose of quantum state preparation and inference. We do not permanently store, sell, or distribute any personally identifiable medical data. Please refer to our Privacy Policy for detailed information on data handling.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">4. Intellectual Property</h2>
          <p>The QuantumX platform architecture, hybrid training orchestration engine, and proprietary visualization tools are the intellectual property of the QuantumX Team, unless governed otherwise by the SIH 2026 competition guidelines or open-source licenses (e.g., Apache 2.0).</p>
        </section>
      </div>
    </div>
  );
}
