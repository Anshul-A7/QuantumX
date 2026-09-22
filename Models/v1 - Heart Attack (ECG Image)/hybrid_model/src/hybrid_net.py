"""
hybrid_model.src.hybrid_net — HybridCardioQNN
==============================================

End-to-end hybrid quantum-classical network fusing three modalities:

    scalogram image + clinical biomarkers + coronary-territory prior
        -> ScalogramEncoder (CNN) -> z in R^8 (frozen)
        -> 8-qubit re-uploading VQC (full 256-prob readout)
        -> ClinicalProjectionHead -> 5 superclass logits

GPU/CPU contract (per user guidance)
------------------------------------
* The CNN encoder runs on the compute device (CUDA when available).
* Latent ``z`` is converted to angles, moved to **CPU**, and fed into the
  PennyLane circuit (native backprop on CPU).
* The 256-dimensional probability features are moved back to the compute
  device before entering the classical projection head, so there are
  never CUDA-tensor mismatches at the boundary.
"""

from __future__ import annotations

import torch
import torch.nn as nn

from .backbone import ScalogramEncoder, to_quantum_angle
from .quantum_circuit import QuantumLayer

SUPERCLASSES = ["NORM", "MI", "STTC", "CD", "HYP"]


class ClinicalProjectionHead(nn.Module):
    """Classical stack that maps quantum features to class logits."""

    def __init__(self, quantum_out_dim: int = 256, hidden: int = 64,
                 n_classes: int = 5, dropout: float = 0.15):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(quantum_out_dim, hidden),
            nn.LayerNorm(hidden),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden, n_classes),
        )

    def forward(self, quantum_feats: torch.Tensor) -> torch.Tensor:
        return self.net(quantum_feats)


class HybridCardioQNN(nn.Module):
    """Scalogram-CNN + territory/clinical priors -> 8-qubit VQC -> head."""

    def __init__(
        self,
        in_channels: int = 12,
        latent_dim: int = 8,
        n_qubits: int = 8,
        re_uploads: int = 6,
        n_classes: int = 5,
        n_clinical: int = 13,
        depolarizing_rate: float = 0.0,
        train_quantum: bool = True,
        freeze_backbone: bool = True,
    ):
        super().__init__()
        self.n_classes = n_classes
        self.latent_dim = latent_dim
        self.n_clinical = n_clinical

        # Backbone encoder (image + territory prior + clinical fusion).
        self.backbone = ScalogramEncoder(in_channels=in_channels,
                                         latent_dim=latent_dim,
                                         n_clinical=n_clinical)
        self.freeze_backbone = freeze_backbone
        if freeze_backbone:
            self.freeze_encoder()

        # Quantum layer with the full 256-prob readout.
        self.quantum = QuantumLayer(
            n_qubits=n_qubits, re_uploads=re_uploads,
            depolarizing_rate=depolarizing_rate,
            trainable=train_quantum,
        )
        self.quantum.freeze(not train_quantum)

        # Classical projection head.
        self.head = ClinicalProjectionHead(
            quantum_out_dim=self.quantum.out_dim, n_classes=n_classes,
        )

    # ------------------------------------------------------------------
    def freeze_encoder(self):
        """Freeze the CNN encoder (keep it a fixed feature extractor)."""
        for p in self.backbone.parameters():
            p.requires_grad_(False)
        self.backbone.eval()

    def unfreeze_encoder(self):
        for p in self.backbone.parameters():
            p.requires_grad_(True)
        self.backbone.train()

    def quantum_params(self):
        return [self.quantum._weights]

    def head_params(self):
        return list(self.head.parameters())

    # ------------------------------------------------------------------
    def encode(self, x, clinical=None, waveform=None):
        """(batch,12,scales,T) [+ aux] -> z in [-1,1] (batch, latent)."""
        with torch.set_grad_enabled(not self.freeze_backbone):
            z = self.backbone(x, clinical=clinical, waveform=waveform)
        return z

    def forward(self, x, clinical=None, waveform=None) -> dict:
        """
        x: (batch, 12, 32, 125) scalograms on compute device.
        clinical: (batch, 13) optional clinical biomarkers.
        waveform: (batch, T, 12) optional raw waveform for territory prior.

        Returns dict with:
            logits (batch,5), probs (softmax), latent_z (batch,8),
            quantum_features (batch,256).
        """
        z = self.encode(x, clinical=clinical, waveform=waveform)
        angles = to_quantum_angle(z)          # [-1,1] -> [0,pi]
        qf = self.quantum(angles)             # CPU qnode -> back to device
        logits = self.head(qf)                # device head
        return {
            "logits": logits,
            "probs": torch.softmax(logits, dim=-1),
            "latent_z": z,
            "quantum_features": qf,
        }
