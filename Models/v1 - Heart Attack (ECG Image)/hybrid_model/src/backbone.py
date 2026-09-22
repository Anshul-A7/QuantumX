"""
hybrid_model.src.backbone — CNN Encoder with Coronary-Territory Prior
=======================================================================

The "classical" half of the hybrid. Two clinically-grounded upgrades over a
plain CNN:

1. **Coronary-artery-territory prior (clinically-grounded inductive
   bias).** In acute myocardial infarction the 12 leads are *not*
   interchangeable channels — they localize injury to specific coronary
   territories (Hernandez et al., BSPC 2026):

   * **Anterior / Septal (LAD):** leads V1, V2, V3, V4
   * **Inferior (RCA):** leads II, III, aVF   (often *reciprocal* ST
     depression in I, aVL)
   * **Lateral (LCx):** leads I, aVL, V5, V6

   A lightweight territory branch aggregates per-territory signal
   statistics from the raw waveform and feeds them into the fusion. This
   gives the encoder a prior for localized STEMI/NSTEMI detection and
   their reciprocal ST changes, without fragile hand-built attention.

2. **Tri-modal prior fusion.** The CWT scalogram latent is concatenated
   with the hand-crafted clinical biomarkers (HRV, QRS width, ST elevation
   proxies) so the 8-D quantum embedding ``z`` is anchored by medical
   ground-truth priors — the "image + tabular" fusion the task calls for.

The output remains the fixed ``latent_dim``-dimensional (default 8) latent
in ``[-1, 1]`` that the 8-qubit VQC consumes.
"""

from __future__ import annotations

import torch
import torch.nn as nn

# Coronary arterial territories -> lead indices (0-11).
LEAD_NAMES = ["I", "II", "III", "AVR", "AVL", "AVF", "V1", "V2", "V3", "V4", "V5", "V6"]
ANTERIOR = [LEAD_NAMES.index(x) for x in ["V1", "V2", "V3", "V4"]]
INFERIOR = [LEAD_NAMES.index(x) for x in ["II", "III", "AVF"]]
LATERAL = [LEAD_NAMES.index(x) for x in ["I", "AVL", "V5", "V6"]]


class TerritoryPrior(nn.Module):
    """
    Aggregates per-territory waveform statistics into a small vector.

    For each coronary territory we compute mean/std/amplitude of the
    member leads over time, then project to a compact representation.
    Averaged leads per territory encode the reciprocal ST relationships
    (e.g. inferior territory excitation mirrored by lateral depression)
    that a bare channelwise-CNN may dilute.

    Input : waveform (B, T, 12)   Output : (B, territory_dim)
    """

    def __init__(self, territory_dim: int = 8):
        super().__init__()
        self.territories = {"anterior": ANTERIOR,
                            "inferior": INFERIOR,
                            "lateral": LATERAL}
        n_groups = len(self.territories)
        # Per territory: mean, std, abs-max  -> 3 features each -> 9 stats.
        self.proj = nn.Sequential(
            nn.Linear(n_groups * 3, 32),
            nn.GELU(),
            nn.Linear(32, territory_dim),
        )

    def forward(self, waveform: torch.Tensor) -> torch.Tensor:
        B, T, L = waveform.shape
        stats = []
        for name, idxs in self.territories.items():
            t = waveform[:, :, idxs]                 # (B, T, k)
            stats.append(t.mean(dim=1).mean(dim=-1, keepdim=True))   # mean
            stats.append(t.std(dim=1).mean(dim=-1, keepdim=True))    # std
            stats.append(t.abs().max(dim=1).values.mean(dim=-1, keepdim=True))  # peak
        v = torch.cat(stats, dim=1)                  # (B, n_groups*3)
        return self.proj(v)


class ClinicalFeatureBranch(nn.Module):
    """Encodes the hand-crafted clinical biomarkers into a small latent."""

    def __init__(self, n_clinical: int = 13, out_dim: int = 32):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(n_clinical, 32),
            nn.GELU(),
            nn.LayerNorm(32),
            nn.Linear(32, out_dim),
        )

    def forward(self, clinical: torch.Tensor) -> torch.Tensor:
        return self.net(clinical)


class ScalogramEncoder(nn.Module):
    """
    Multi-lead wavelet image encoder with coronary-territory prior + tri-
    modal clinical feature fusion, producing an 8-D latent.

    Modalities
    ----------
    * ``x``        : (batch, 12, scales, T) CWT scalogram "image".
    * ``clinical`` : (batch, 13) hand-crafted ECG biomarkers (optional).
    * ``waveform`` : (batch, T, 12) raw waveform for territory prior
                     (optional; zeros used when omitted).
    """

    def __init__(self, in_channels: int = 12, latent_dim: int = 8,
                 base_channels: int = 24, n_clinical: int = 13):
        super().__init__()
        self.in_channels = in_channels
        self.latent_dim = latent_dim
        self.n_clinical = n_clinical

        # 1. Spatial encoder over the scalogram image.
        self.stem = nn.Sequential(
            nn.Conv2d(in_channels, base_channels, kernel_size=3, stride=2,
                      padding=1),
            nn.BatchNorm2d(base_channels),
            nn.GELU(),
            nn.Conv2d(base_channels, base_channels * 2, kernel_size=3,
                      stride=2, padding=1),
            nn.BatchNorm2d(base_channels * 2),
            nn.GELU(),
            nn.Conv2d(base_channels * 2, base_channels * 4, kernel_size=3,
                      stride=1, padding=1),
            nn.BatchNorm2d(base_channels * 4),
            nn.GELU(),
            nn.AdaptiveAvgPool2d((1, 1)),
        )

        # 2. Coronary-territory prior over the raw waveform.
        self.territory_prior = TerritoryPrior(territory_dim=8)

        # 3. Clinical feature branch (tabular priors).
        self.clinical_branch = ClinicalFeatureBranch(n_clinical=n_clinical,
                                                     out_dim=32)

        # 4. Fusion -> latent.
        fusion_in = base_channels * 4 + 8 + 32
        self.fusion = nn.Sequential(
            nn.Linear(fusion_in, 64),
            nn.GELU(),
            nn.LayerNorm(64),
            nn.Linear(64, latent_dim),
            nn.Tanh(),  # latent z in [-1, 1]
        )

    def forward(self, x: torch.Tensor,
                clinical: torch.Tensor | None = None,
                waveform: torch.Tensor | None = None) -> torch.Tensor:
        """
        x: (B, 12, scales, T) scalogram image.
        clinical: (B, 13) optional clinical biomarkers.
        waveform: (B, T, 12) optional raw waveform for territory prior.

        Returns z: (B, latent_dim) in [-1, 1].
        """
        img = self.stem(x).flatten(1)              # (B, base_channels*4)

        if waveform is not None:
            ter = self.territory_prior(waveform)   # (B, 8)
        else:
            ter = torch.zeros(x.size(0), 8, device=x.device)

        if clinical is None:
            clinical = torch.zeros(x.size(0), self.n_clinical, device=x.device)
        cli = self.clinical_branch(clinical)       # (B, 32)

        fused = torch.cat([img, ter, cli], dim=1)  # (B, fusion_in)
        return self.fusion(fused)


def to_quantum_angle(z: torch.Tensor, scale: float = None) -> torch.Tensor:
    """Map the [-1,1] encoder latent to [0, pi] rotation angles."""
    if scale is None:
        scale = torch.pi
    return (z + 1.0) * 0.5 * scale
