"""
hybrid_model.src.quantum_circuit — 8-Qubit Data-Re-uploading VQC
=================================================================

The quantum heart of the hybrid classifier. Design decisions, each
grounded in the research synthesis:

1. **Rich readout (critical)**: we return the **full computational-basis
   probability distribution** (``2**n_qubits = 256`` real probabilities),
   not just a handful of Pauli expectations. The SU(2)-vs-shallow-VQC
   critique (ArXiv 2608.07822) identified *measurement compression* as
   the principal reason shallow circuits underperform classical heads;
   exposing the full probability vector is the direct counter-measure.
   The classical projection head then learns to recombine these 256
   dimensions.

2. **Data re-uploading (trained embedding, not a fixed kernel)**:
   classical features are re-encoded *inside every variational block*.
   ArXiv 2608.26224 shows trainable hybrid embeddings beat fixed quantum
   kernels within an 8-qubit budget.

3. **Depth**: ``re_uploads >= 6`` blocks — the critique's "depth-3 is too
   shallow" lesson, while avoiding barren-plateau depths by keeping a
   compact, periodic ansatz (RY/RZ + ring CNOT).

4. **Hostile-to-phase-damping, good-for-regularization noise**: an
   optional, *small* depolarizing channel (finite-noise optimum theory,
   ArXiv 2608.24229) can be toggled on to act as controlled
   regularization. On a simulator it is cheap; on real IBM hardware the
   finite device noise plays a comparable role.

5. **Hardware portability**: the circuit is built from elementary gates
   (RY, RZ, CNOT) compatible with IBM real-hardware backends, so the same
   circuit definition compiles to ``default.qubit`` (simulator) or an
   IBM ``SamplerV2`` runtime backend for on-device execution.

Differentiation uses ``diff_method="backprop"`` on ``default.qubit`` —
the mathematically-correct choice for *probability* (non-expectation)
outputs, fully autodiff-compatible with PyTorch and natively batched.
"""

from __future__ import annotations

import numpy as np
import pennylane as qml
import torch
from pennylane import numpy as pnp

DEFAULT_STRONG_LAYERS = 6
DEFAULT_QUBITS = 8


def build_quantum_circuit(n_qubits: int = DEFAULT_QUBITS,
                          re_uploads: int = DEFAULT_STRONG_LAYERS,
                          depolarizing_rate: float = 0.0,
                          device_name: str = "default.qubit",
                          wires_offset: int = 0):
    """
    Build a PennyLane device + qnode for the 8-qubit re-uploading VQC.

    Parameters
    ----------
    n_qubits : number of physical qubits (default 8 -> 256-dim state).
    re_uploads : number of variational/data-re-uploading blocks (>= 1).
    depolarizing_rate : 0..1 probability of a depolarizing error channel
        after each gate (finite-noise regularization); 0 = noiseless.
    device_name : PennyLane device id (default "default.qubit").
    wires_offset : qubit offset for embedding into a larger register
        (kept for future wider backends / real-device qubit maps).

    Returns
    -------
    (device, qnode) where the qnode signature is ``qnode(z, weights) -> probs``
    with ``z : (batch, n_qubits)`` [0, pi]-scaled angles and
    ``weights : (re_uploads, n_qubits, 3)`` trainable rotations.
    """
    wires = list(range(wires_offset, wires_offset + n_qubits))

    dev = qml.device(device_name, wires=wires)

    @qml.qnode(dev, interface="torch", diff_method="backprop")
    def circuit(z: torch.Tensor, weights: torch.Tensor):
        batch = z.shape[0]
        # --- Data re-uploading variational blocks ---------------------
        for l in range(re_uploads):
            # 1) Re-encode data every block (trainable embedding).
            for w_i, qubit in enumerate(wires):
                qml.RY(z[:, w_i], wires=qubit)
            # 2) Trainable single-qubit SU(2) rotations.
            for w_i, qubit in enumerate(wires):
                qml.Rot(weights[l, w_i, 0], weights[l, w_i, 1],
                        weights[l, w_i, 2], wires=qubit)
            # 3) Ring CNOT entanglement.
            for i in range(n_qubits):
                qml.CNOT(wires=[wires[i], wires[(i + 1) % n_qubits]])
            # 4) Optional depolarizing noise (finite-noise regularization).
            if depolarizing_rate > 0:
                for qubit in wires:
                    qml.DepolarizingChannel(depolarizing_rate, wires=qubit)

        # --- Full computational-basis readout ---------------------------
        # batched qnode -> (batch, 2**n_qubits) probabilities (sums to 1).
        return qml.probs(wires=wires)

    return dev, circuit


class QuantumLayer(torch.nn.Module):
    """
    A torch-compatible wrapper around the re-uploading VQC.

    Wraps the PennyLane qnode so it behaves like a normal ``nn.Module``
    layer: ``forward(z) -> (batch, 2**n_qubits)`` probability features.
    Parameters live in-self as raw PennyLane weights (shape
    ``(re_uploads, n_qubits, 3)``). By default the layer is **frozen**
    (``requires_grad=False``) — for two-stage hybrids we keep the encoder
    frozen and only the classical projection head is trainable, but a user
    may unfreeze quantum weights for end-to-end fine-tune via
    ``freeze(False)``.
    """

    def __init__(self, n_qubits: int = DEFAULT_QUBITS,
                 re_uploads: int = DEFAULT_STRONG_LAYERS,
                 depolarizing_rate: float = 0.0, trainable: bool = False,
                 device_name: str = "default.qubit"):
        super().__init__()
        self.n_qubits = n_qubits
        self.re_uploads = re_uploads
        self._dev, self._qnode = build_quantum_circuit(
            n_qubits=n_qubits, re_uploads=re_uploads,
            depolarizing_rate=depolarizing_rate, device_name=device_name,
        )
        # Weights: (re_uploads, n_qubits, 3)
        rng = np.random.default_rng(0)
        init = (rng.random((re_uploads, n_qubits, 3)) * 2 * np.pi - np.pi)
        self._weights = torch.nn.Parameter(
            torch.tensor(init, dtype=torch.float32), requires_grad=trainable
        )
        self.out_dim = 2 ** n_qubits
        self.freeze(not trainable)

    def freeze(self, freeze: bool = True):
        """Freeze/unfreeze the quantum variational weights."""
        self._weights.requires_grad_(not freeze)

    def forward(self, z: torch.Tensor) -> torch.Tensor:
        """
        z : (batch, n_qubits) latent angles in [-pi, pi] (ideally [0, pi]).
        Returns : (batch, 2**n_qubits) probability features.
        """
        # Pass latent + weights as CPU tensors into the qnode (PennyLane
        # backprop is CPU-native). Crucially, we do NOT detach the weights
        # so gradient flows back into self._weights when trainable; the
        # latent is detached (it comes from the frozen backbone encoder).
        z_cpu = z.detach().cpu().float()
        w_cpu = self._weights.to("cpu").float()
        probs = self._qnode(z_cpu, w_cpu)
        probs = torch.as_tensor(probs, dtype=torch.float32)
        probs = torch.clamp(probs, min=1e-10)
        probs = probs / probs.sum(dim=-1, keepdim=True)  # numerical safety
        return probs.to(z.device)

    def extra_repr(self) -> str:
        return (f"n_qubits={self.n_qubits}, re_uploads={self.re_uploads}, "
                f"out_dim={self.out_dim}")
