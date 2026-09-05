import torch
import torch.nn as nn
import torch.nn.functional as F
from .quantum_circuit import QuantumECGClassifier

class WaveletQuantumCardioX(nn.Module):
    """
    QuantumX v2 Hybrid Quantum-Classical Architecture (HQNN).
    Combines a 2D Multi-Lead Wavelet Convolutional Backbone with an 8-Qubit Entangled VQC.
    """

    def __init__(self, in_channels: int = 12, latent_dim: int = 8, n_classes: int = 5):
        super().__init__()
        self.in_channels = in_channels
        self.latent_dim = latent_dim
        self.n_classes = n_classes

        # 1. Multi-Lead 2D Wavelet Convolutional Feature Extractor
        self.conv_stem = nn.Sequential(
            nn.Conv2d(in_channels, 32, kernel_size=5, stride=2, padding=2),
            nn.BatchNorm2d(32),
            nn.GELU(),
            nn.MaxPool2d(2),

            nn.Conv2d(32, 64, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(64),
            nn.GELU(),
            nn.MaxPool2d(2),

            nn.Conv2d(64, 128, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(128),
            nn.GELU(),
            nn.AdaptiveAvgPool2d((1, 1))
        )

        # 2. Continuous Latent Bottleneck to 8 Dimensions (Normalized to [-pi, pi])
        self.latent_projector = nn.Sequential(
            nn.Linear(128, 64),
            nn.GELU(),
            nn.Linear(64, latent_dim),
            nn.Tanh()  # Bounds to [-1, 1]
        )

        # 3. 8-Qubit Entangled Variational Quantum Circuit (2^8 = 256 Hilbert Space)
        self.quantum_head = QuantumECGClassifier(n_qubits=latent_dim, n_layers=4, n_classes=n_classes)

    def forward(self, x_scalograms: torch.Tensor) -> dict:
        """
        Input x_scalograms: (batch_size, 12, scales, timepoints)
        Returns:
            - logits: (batch_size, 5) -> Multi-label / Multi-class predictions
            - latent_z: (batch_size, 8) -> Encoded quantum angles
        """
        features = self.conv_stem(x_scalograms)  # (batch_size, 128, 1, 1)
        features = features.view(features.size(0), -1)  # (batch_size, 128)
        
        # Scale latent vector to [-pi, pi] for angle embedding
        latent_z = self.latent_projector(features) * 3.141592653589793
        
        # Pass through 8-Qubit VQC
        logits = self.quantum_head(latent_z)
        
        return {
            "logits": logits,
            "latent_z": latent_z,
            "probabilities": torch.sigmoid(logits)
        }
