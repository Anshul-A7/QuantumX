"""
hybrid_model.src — Hybrid Quantum ECG Classifier
=================================================

A two-stage hybrid model that fuses a classical CNN image encoder with a
trainable 8-qubit data-re-uploading variational quantum circuit.

Exports
-------
* :class:`HybridCardioQNN`   — the end-to-end hybrid network.
* :class:`ScalogramEncoder`  — CNN image backbone -> 8-D latent.
* :func:`build_quantum_circuit` / :class:`QuantumLayer` — the PQC.
* :func:`train_hybrid_model` — two-stage training entrypoint.
"""

from .backbone import ScalogramEncoder, to_quantum_angle
from .quantum_circuit import QuantumLayer, build_quantum_circuit
from .hybrid_net import HybridCardioQNN
from .train import train_hybrid_model

__all__ = [
    "HybridCardioQNN",
    "ScalogramEncoder",
    "to_quantum_angle",
    "QuantumLayer",
    "build_quantum_circuit",
    "train_hybrid_model",
]
