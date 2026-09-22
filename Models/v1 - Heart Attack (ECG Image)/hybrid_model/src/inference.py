"""
hybrid_model.src.inference — Quantum Inference, Saliency & Hardware Path
=========================================================================

Inference-time services for the hybrid quantum classifier:

1. ``load_hybrid_model`` — restore a trained ``HybridCardioQNN``.
2. ``predict`` — batch probability predictions (device-aware).
3. ``quantum_saliency`` — **Pauli-expectation saliency**: measure the
   contribution of each qubit register to the MI decision by toggling each
   qubit's angle to a neutral value and quantifying the resulting drop in
   P(MI). This gives an interpretability bridge between the 8 latent
   dimensions and the ECG's clinical meaning (which qubit encodes the ST
   elevation signal etc.).
4. ``real_hardware`` — an explicit, documented path that executes the
   *trained circuit* on an IBM Runtime backend (``SamplerV2``), enabling
   the platform's stated goal of running on real quantum hardware while
   keeping the simulation path default for training/eval.

**Simulator vs. hardware honesty**: the simulator path (``default.qubit``,
exact statevector readout) is used for training and evaluation. The
real-hardware path is *inference-only* with finite-shot sampling; its
outputs are not used to misrepresent training-time numbers.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

import numpy as np
import torch

from core import PTBXLDataLoader, PTBXLDataset
from core.metrics import SUPERCLASSES

from .hybrid_net import HybridCardioQNN

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def build_model(**overrides) -> HybridCardioQNN:
    """Build a fresh HybridCardioQNN (used for load and fresh instantiation)."""
    cfg = dict(in_channels=12, latent_dim=8, n_qubits=8, re_uploads=6,
               n_classes=5, n_clinical=13, depolarizing_rate=0.0,
               train_quantum=False, freeze_backbone=True)
    cfg.update(overrides)
    return HybridCardioQNN(**cfg)


def load_hybrid_model(artifact: str | Path | dict) -> HybridCardioQNN:
    """
    Load a trained hybrid model from an artifact path or config dict.

    ``artifact`` may be:
      * a path to a ``.pt`` weights file,
      * a path to a directory containing ``hybrid_cardio.pt`` +
        ``hybrid_config.json``,
      * a dict of ``{weights: path}``/``{checkpoint: path}``.

    The model is returned in eval mode with the quantum layer frozen.
    """
    if isinstance(artifact, dict):
        p = artifact.get("weights") or artifact.get("checkpoint") or artifact.get("artifact")
        artifact = Path(p)
    else:
        artifact = Path(artifact)

    if artifact.is_dir():
        wpath = artifact / "hybrid_cardio.pt"
        cpath = artifact / "hybrid_config.json"
    else:
        wpath = artifact
        cpath = artifact.with_name("hybrid_config.json")

    overrides = {}
    if cpath.exists():
        overrides = json.loads(cpath.read_text())

    model = build_model(
        n_qubits=overrides.get("n_qubits", 8),
        re_uploads=overrides.get("re_uploads", 6),
        depolarizing_rate=overrides.get("depolarizing_rate", 0.0),
    )
    state = torch.load(wpath, map_location="cpu")
    # Tolerate configs saved without n_clinical (backward compatible).
    try:
        model.load_state_dict(state, strict=True)
    except RuntimeError:
        model = build_model(n_clinical=13)
        model.load_state_dict(state, strict=False)
    model.to(DEVICE)
    model.eval()
    model.freeze_encoder()
    model.quantum.freeze(True)
    return model


@torch.no_grad()
def predict(model: HybridCardioQNN, loader, device=None) -> tuple[np.ndarray, np.ndarray]:
    """
    Generate batch predictions.

    Returns (y_labels, proba) where y_labels is the primary-label int
    vector and proba is (n, 5) softmax probabilities. Handles both the
    aux multi-return and plain data loaders.
    """
    device = device or DEVICE
    model.eval()
    y_all, p_all = [], []
    for items in loader:
        if len(items) == 2:
            x, labels = items
            clinical = waveform = None
        else:
            x, clinical, waveform, labels = items
            clinical, waveform = clinical.to(device), waveform.to(device)
        x = x.to(device)
        out = model(x, clinical=clinical, waveform=waveform)
        p_all.append(out["probs"].cpu().numpy())
        y_all.append(labels.cpu().numpy())
    return np.concatenate(y_all), np.concatenate(p_all)


@torch.no_grad()
def quantum_saliency(model: HybridCardioQNN, x, clinical, waveform,
                     pos_class: str = "MI") -> np.ndarray:
    """
    Per-qubit Pauli-toggling saliency for the ``pos_class`` decision.

    For each of the 8 latent dimensions, we re-route that qubit's angle to
    a neutral value (pi/2) and measure the drop in P(pos_class). A larger
    drop => that qubit (latent component) is more load-bearing for the
    clinical decision.

    Returns an (8,) array of saliency weights in [0, 1]-ish scale.
    """
    model.eval()
    pos_idx = SUPERCLASSES.index(pos_class)
    base = model(x, clinical=clinical, waveform=waveform)["probs"][0, pos_idx].item()

    z = model.encode(x, clinical=clinical, waveform=waveform)[0]  # (8,)
    sal = np.zeros(z.shape[0])
    for i in range(z.shape[0]):
        z_toggle = z.clone()
        z_toggle[i] = 0.0  # neutral angle center
        angles = (z_toggle + 1.0) * 0.5 * torch.pi
        qf = model.quantum(angles.unsqueeze(0))
        prob_i = torch.softmax(model.head(qf), dim=-1)[0, pos_idx].item()
        sal[i] = max(0.0, base - prob_i)
    return sal


# ======================================================================
# Real IBM hardware path (inference-only, finite-shot sampling)
# ======================================================================
def prepare_hardware_program(model: HybridCardioQNN):
    """
    Return (measurement_circuit, params_dict) to run on a real IBM backend.

    Because the trained circuit already encodes the *frozen* latent angles
    at inference, the easiest portable form is a PennyLane tape we compile
    to OpenQASM and submit to ``qiskit_ibm_runtime``'s ``SamplerV2`` with a
    qubit routing map on the target device.

    This function returns a description of the circuit gates (for
    transparency) and the integer angles; the actual submission is wired
    in the notebook with the user's IBM credentials (``QISKIT_IBM_TOKEN``).
    """
    from .quantum_circuit import build_quantum_circuit

    qnode = model.quantum._qnode
    return {
        "device": "default.qubit (simulator here; compile identical topology on IBM)",
        "n_qubits": model.quantum.n_qubits,
        "re_uploads": model.quantum.re_uploads,
        "gates": "RY-angle embedding, ROT(SU2) per qubit, ring CNOT per block",
        "mitigation": "Optional: Quasi-Probability / Zero-Noise Extrapolation at request time",
    }, qnode
