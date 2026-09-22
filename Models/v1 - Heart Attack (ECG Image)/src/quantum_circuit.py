import pennylane as qml
from pennylane import numpy as pnp
import torch
import torch.nn as nn

class QuantumECGClassifier(nn.Module):
    """
    8-Qubit Variational Quantum Circuit (VQC) for Multi-Class Cardiovascular Diagnosis.
    Operates in a 2^8 = 256-dimensional complex Hilbert state space.
    """

    def __init__(self, n_qubits: int = 8, n_layers: int = 4, n_classes: int = 5):
        super().__init__()
        self.n_qubits = n_qubits
        self.n_layers = n_layers
        self.n_classes = n_classes

        # Initialize PennyLane Quantum Device (Default Qubit Statevector Engine)
        self.dev = qml.device("default.qubit", wires=self.n_qubits)

        # Define QNode
        @qml.qnode(self.dev, interface="torch", diff_method="backprop")
        def qnode(inputs, weights):
            # 1. Continuous Angle Embedding across 8 Qubits
            qml.AngleEmbedding(inputs, wires=range(self.n_qubits), rotation="Y")

            # 2. Multi-Layer Strongly Entangling Quantum Circuit
            for l in range(self.n_layers):
                # Parameterized single-qubit rotations (Rot = Rz * Ry * Rz)
                for i in range(self.n_qubits):
                    qml.Rot(weights[l, i, 0], weights[l, i, 1], weights[l, i, 2], wires=i)
                
                # All-to-all and circular CNOT entanglement topology
                for i in range(self.n_qubits):
                    qml.CNOT(wires=[i, (i + 1) % self.n_qubits])
                for i in range(0, self.n_qubits - 1, 2):
                    qml.CZ(wires=[i, i + 1])

            # 3. Expectation Values of Pauli-Z Observables
            return [qml.expval(qml.PauliZ(i)) for i in range(self.n_qubits)]

        self.qnode = qnode

        # Trainable Quantum Weights Tensor: Shape (n_layers, n_qubits, 3)
        weight_shapes = {"weights": (self.n_layers, self.n_qubits, 3)}
        self.qlayer = qml.qnn.TorchLayer(self.qnode, weight_shapes)

        # Classical Output Projection Head (8 Pauli-Z expectations -> 5 diagnostic superclasses)
        self.fc_head = nn.Sequential(
            nn.Linear(self.n_qubits, 32),
            nn.LayerNorm(32),
            nn.GELU(),
            nn.Dropout(0.1),
            nn.Linear(32, self.n_classes)
        )

    def forward(self, latent_z: torch.Tensor) -> torch.Tensor:
        """
        latent_z shape: (batch_size, 8) in range [-pi, pi]
        outputs logits: (batch_size, 5) -> NORM, MI, STTC, CD, HYP
        """
        q_out = self.qlayer(latent_z)
        logits = self.fc_head(q_out)
        return logits
