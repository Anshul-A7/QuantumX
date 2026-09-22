import os
import sys
import numpy as np
import torch
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from src.dataset_loader import PTBXLDataLoader
from src.hybrid_model import WaveletQuantumCardioX

class QuantumECGInferenceEngine:
    """
    End-to-End Quantum Diagnostic Inference Engine for 12-Lead ECGs.
    Accepts raw signals, WFDB records, or synthetic digitized image inputs,
    converts them to Continuous Wavelet Scalograms, and outputs 8-qubit quantum diagnostic predictions.
    """

    def __init__(self, checkpoint_path: str = None):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.classes = ['NORM', 'MI', 'STTC', 'CD', 'HYP']
        self.class_descriptions = {
            'NORM': 'Normal Sinus Baseline (No acute pathology detected)',
            'MI': 'Acute / Prior Myocardial Infarction (Heart Attack — Critical Alert)',
            'STTC': 'ST-T Ischemia & Hypoxia (Subtle pre-infarction tissue oxygen starvation)',
            'CD': 'Conduction Disturbance (Bundle Branch Blocks / AV Conduction Delay)',
            'HYP': 'Ventricular & Atrial Hypertrophy (Chronic heart muscle strain & thickening)'
        }
        
        self.model = WaveletQuantumCardioX(in_channels=12, latent_dim=8, n_classes=5).to(self.device)
        self.model.eval()

        if checkpoint_path and os.path.exists(checkpoint_path):
            self.model.load_state_dict(torch.load(checkpoint_path, map_location=self.device))
            print(f"Loaded trained quantum checkpoint from: {checkpoint_path}")

    def predict_signal(self, signal_12lead: np.ndarray) -> dict:
        """
        signal_12lead shape: (1000, 12) or (timepoints, 12)
        Returns structured clinical probabilities and quantum state vector.
        """
        import pywt
        scales = np.arange(1, 33)
        scalograms = []
        for lead_idx in range(12):
            coefs, _ = pywt.cwt(signal_12lead[:, lead_idx], scales, 'morl')
            scalograms.append(coefs)
        
        scalogram = np.array(scalograms, dtype=np.float32)  # (12, 32, 1000)
        scalogram = scalogram[:, :, ::8]  # (12, 32, 125)

        tensor_x = torch.tensor(scalogram, dtype=torch.float32).unsqueeze(0).to(self.device)

        with torch.no_grad():
            out = self.model(tensor_x)
            probs = out["probabilities"].squeeze(0).cpu().numpy()
            latent_z = out["latent_z"].squeeze(0).cpu().numpy()

        results = {
            "predictions": {c: float(p) for c, p in zip(self.classes, probs)},
            "quantum_latent_angles": [float(z) for z in latent_z],
            "highest_risk_category": self.classes[int(np.argmax(probs))],
            "highest_risk_probability": float(np.max(probs)),
            "clinical_summary": self.class_descriptions[self.classes[int(np.argmax(probs))]]
        }
        return results

if __name__ == "__main__":
    print("=" * 80)
    print("  [DEMO] TESTING QUANTUMX V2 END-TO-END INFERENCE ENGINE")
    print("=" * 80)

    engine = QuantumECGInferenceEngine()
    
    # Generate test 12-lead ECG signal with simulated ST elevation in anterior leads (V1-V4)
    time_pts = np.linspace(0, 10, 1000)
    simulated_ecg = np.zeros((1000, 12), dtype=np.float32)
    for lead in range(12):
        simulated_ecg[:, lead] = np.sin(2 * np.pi * 1.2 * time_pts) * 0.5
        if lead in [6, 7, 8, 9]:  # V1-V4
            simulated_ecg[200:400, lead] += 0.35  # Anterior STEMI pattern

    report = engine.predict_signal(simulated_ecg)
    print("\nClinical Inference Output:")
    for cat, prob in report["predictions"].items():
        bar = "█" * int(prob * 30)
        print(f"  • {cat:5s}: {prob*100:5.1f}% | {bar}")

    print(f"\nTop Finding: {report['highest_risk_category']} ({report['highest_risk_probability']*100:.1f}%)")
    print(f"Clinical Summary: {report['clinical_summary']}")
    print(f"Quantum Latent State (8 Qubits): {[round(x, 3) for x in report['quantum_latent_angles']]}")
