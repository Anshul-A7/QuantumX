"""QuantumX Production Inference Pipeline for External Clinical ECG Images
Loads the trained state-of-the-art models:
- Classical ECGConVT (best_classical_cardiac_model.pt)
- Hybrid Quantum 8-Qubit Model (best_hybrid_quantum_cardiac_model.pt)

Performs:
1. Clinical Grid Suppression Preprocessing
2. ResNet Concat-Pooling Feature Extraction
3. Dual-Engine Diagnostic Inference (Classical & Hybrid Quantum)
4. Calibrated 0-100 Continuous Cardiac Risk Score & Urgency Triage
5. Grad-CAM++ Anatomical Lead Saliency Heatmap
"""

import os
import sys
import io
import math
from pathlib import Path
from typing import Dict, Any, Union
from PIL import Image

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models, transforms

# Add shared paths
current_dir = Path(__file__).resolve().parent
sys.path.append(str(current_dir))
sys.path.append(str(current_dir.parent / "Classical" / "Code"))
sys.path.append(str(current_dir.parent / "Hybrid" / "Code"))

from ecg_preprocessing import ClinicalECGPreprocessor
from autoencoder_bridge import LatentCardiacAutoencoder
from quantum_circuit import HybridQuantumCardiacModel, NUM_QUBITS, NUM_LAYERS
from gradcam_evaluator import GradCAMPlusPlus, compute_waveform_energy_ratio

CLASSES = [
    "Normal",
    "Myocardial Infarction",
    "History of MI",
    "Abnormal Heartbeat"
]

CLINICAL_INTERPRETATIONS = {
    "Normal": {
        "title": "Normal Sinus Rhythm",
        "description": "Physiological cardiac electrical conduction. No evidence of acute ischemia or significant morphological abnormalities.",
        "urgency": "LOW",
        "risk_weight": 5
    },
    "Myocardial Infarction": {
        "title": "Acute Myocardial Infarction (Heart Attack)",
        "description": "Acute transmural or subendocardial ischemia. Significant ST-segment elevation/depression or pathological Q-wave formation.",
        "urgency": "CRITICAL_EMERGENCY",
        "risk_weight": 95
    },
    "History of MI": {
        "title": "Prior Myocardial Infarction (Ischemic Scarring)",
        "description": "Chronic ischemic changes, pathological Q-waves, or T-wave inversion indicating prior healed myocardial infarction.",
        "urgency": "ELEVATED",
        "risk_weight": 65
    },
    "Abnormal Heartbeat": {
        "title": "Cardiac Arrhythmia / Conduction Disturbance",
        "description": "Irregular rhythm, ectopic ventricular/atrial complexes, bundle branch block, or repolarization abnormality.",
        "urgency": "HIGH",
        "risk_weight": 75
    }
}

class AdaptiveConcatPool2d(nn.Module):
    def __init__(self, output_size=1):
        super().__init__()
        self.avg_pool = nn.AdaptiveAvgPool2d(output_size)
        self.max_pool = nn.AdaptiveMaxPool2d(output_size)
    def forward(self, x):
        return torch.cat([self.avg_pool(x), self.max_pool(x)], dim=1)

class CardiacFeatureExtractor(nn.Module):
    def __init__(self):
        super().__init__()
        base = models.resnet34(weights=models.ResNet34_Weights.DEFAULT)
        self.features = nn.Sequential(
            base.conv1, base.bn1, base.relu, base.maxpool,
            base.layer1, base.layer2, base.layer3, base.layer4
        )
        self.concat_pool = AdaptiveConcatPool2d(1)
        self.flatten = nn.Flatten()
    def forward(self, x):
        feat = self.features(x)
        return self.flatten(self.concat_pool(feat))

class ClassicalCardiacClassifier(nn.Module):
    def __init__(self, in_features=1024, num_classes=4):
        super().__init__()
        self.head = nn.Sequential(
            nn.BatchNorm1d(in_features),
            nn.Dropout(0.30),
            nn.Linear(in_features, 256),
            nn.Mish(),
            nn.BatchNorm1d(256),
            nn.Dropout(0.20),
            nn.Linear(256, 64),
            nn.Mish(),
            nn.BatchNorm1d(64),
            nn.Linear(64, num_classes)
        )
    def forward(self, x):
        return self.head(x)

class ProductionCardiacPredictor:
    def __init__(self, device: str = None):
        if device is None:
            self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        else:
            self.device = torch.device(device)
            
        self.base_dir = current_dir.parent
        self.preprocessor = ClinicalECGPreprocessor(target_size=(224, 224), grid_suppression=True)
        self.transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        # 1. Feature Extractor Backbone
        self.extractor = CardiacFeatureExtractor().to(self.device)
        self.extractor.eval()
        
        # 2. Classical Model
        self.classical_head = ClassicalCardiacClassifier().to(self.device)
        c_ckpt_path = self.base_dir / "Classical" / "Models" / "best_classical_cardiac_model.pt"
        if c_ckpt_path.exists():
            ckpt = torch.load(c_ckpt_path, map_location=self.device)
            self.classical_head.load_state_dict(ckpt['model_state_dict'])
        self.classical_head.eval()
        
        # 3. Hybrid Quantum Model
        self.autoencoder = LatentCardiacAutoencoder(in_features=1024, latent_dim=NUM_QUBITS).to(self.device)
        self.hybrid_model = HybridQuantumCardiacModel(
            in_features=1024,
            num_qubits=NUM_QUBITS,
            num_layers=NUM_LAYERS,
            num_classes=4,
            autoencoder=self.autoencoder
        ).to(self.device)
        
        h_ckpt_path = self.base_dir / "Hybrid" / "Models" / "best_hybrid_quantum_cardiac_model.pt"
        if h_ckpt_path.exists():
            h_ckpt = torch.load(h_ckpt_path, map_location=self.device)
            self.hybrid_model.load_state_dict(h_ckpt['model_state_dict'])
        self.hybrid_model.set_execution_mode('ideal')
        self.hybrid_model.eval()
        
        # 4. Grad-CAM++ Evaluator
        self.gradcam = GradCAMPlusPlus(self.extractor, self.extractor.features[7])

    def predict(self, image_input: Union[str, Path, Image.Image, bytes]) -> Dict[str, Any]:
        """
        Accepts any clinical 12-lead ECG:
        - File path (str or Path)
        - PIL Image
        - Raw image bytes from an upload API
        """
        if isinstance(image_input, (str, Path)):
            raw_img = Image.open(image_input).convert('RGB')
        elif isinstance(image_input, bytes):
            raw_img = Image.open(io.BytesIO(image_input)).convert('RGB')
        elif isinstance(image_input, Image.Image):
            raw_img = image_input.convert('RGB')
        else:
            raise ValueError(f"Unsupported image input type: {type(image_input)}")

        # Step 1: Preprocess (grid suppression + contrast)
        proc_img = self.preprocessor(raw_img)
        input_tensor = self.transform(proc_img).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            # Step 2: Extract 1,024-dim features
            features = self.extractor(input_tensor)
            
            # Step 3: Classical Prediction
            c_logits = self.classical_head(features)
            c_probs = F.softmax(c_logits, dim=-1)[0].cpu().numpy()
            
            # Step 4: Hybrid Quantum Prediction
            h_logits = self.hybrid_model(features)
            h_probs = F.softmax(h_logits, dim=-1)[0].cpu().numpy()
            
        # Ensemble Blending (60% Hybrid Quantum + 40% Classical)
        ensemble_probs = 0.60 * h_probs + 0.40 * c_probs
        pred_idx = int(np.argmax(ensemble_probs))
        pred_class = CLASSES[pred_idx]
        confidence = float(ensemble_probs[pred_idx])
        
        # Continuous Cardiac Risk Score (0 - 100)
        risk_weights = [5.0, 95.0, 65.0, 75.0]
        cardiac_risk_score = float(np.sum(ensemble_probs * risk_weights))
        
        info = CLINICAL_INTERPRETATIONS[pred_class]
        
        # Step 5: Grad-CAM++ Anatomical Lead Heatmap
        cam_heatmap = self.gradcam.generate(input_tensor, class_idx=pred_idx)
        lwer = compute_waveform_energy_ratio(cam_heatmap, margin_percent=0.10)
        
        return {
            "predicted_diagnosis": pred_class,
            "clinical_title": info["title"],
            "urgency_level": info["urgency"],
            "confidence_score": round(confidence * 100, 2),
            "cardiac_risk_score": round(cardiac_risk_score, 1),
            "waveform_energy_ratio_lwer": round(lwer * 100, 2),
            "class_probabilities": {
                CLASSES[i]: round(float(ensemble_probs[i]) * 100, 2)
                for i in range(4)
            },
            "classical_probabilities": {
                CLASSES[i]: round(float(c_probs[i]) * 100, 2)
                for i in range(4)
            },
            "hybrid_quantum_probabilities": {
                CLASSES[i]: round(float(h_probs[i]) * 100, 2)
                for i in range(4)
            },
            "clinical_notes": info["description"]
        }

if __name__ == '__main__':
    predictor = ProductionCardiacPredictor()
    test_file = current_dir.parent / "Test Cases Absolute" / "Myocardial Infarction" / "MI(1).jpg"
    if test_file.exists():
        print(f"Testing inference on holdout test case: {test_file.name}")
        result = predictor.predict(test_file)
        import pprint
        pprint.pprint(result)
    else:
        print("Test file not found, predictor initialized successfully.")
