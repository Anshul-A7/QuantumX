"""
====================================================================================================
QuantumX Quantum Circuits: ZZ Feature Map, VQC, QSVM Kernel & PyTorch HQNN
====================================================================================================
This module implements the complete suite of PennyLane quantum machine learning architectures
and quantum kernel methods for QuantumX v1.

Architectures Implemented:
1. 8-Qubit ZZ Feature Map (U_Φ(x)): Second-order non-linear Pauli-Z data encoding with 
   entangling two-qubit interactions (Paper 33 / Paper 30).
2. Variational Quantum Classifier (VQC): Strongly entangling ansatz with analytical 
   parameter-shift differentiation and Pauli-Z local expectation measurements.
3. Quantum Kernel Support Vector Machine (QSVM): Exact quantum state fidelity Gram matrix
   evaluation K_ij = |⟨ψ(x_i)|ψ(x_j)⟩|² with convex dual SVM optimization.
4. Hybrid Quantum Neural Network (HQNN): Fully differentiable end-to-end PyTorch module
   coupling classical encoders, PennyLane autograd QNodes, and classification heads.
====================================================================================================
"""

import math
import logging
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import TensorDataset, DataLoader
from typing import Dict, Any, Optional, Tuple, List, Union
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, roc_auc_score, f1_score, precision_score, recall_score, brier_score_loss
import pennylane as qml

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("QuantumX.QuantumCircuits")


# ==================================================================================================
# 1. ZZ FEATURE MAP & ANSATZ DEFINITIONS
# ==================================================================================================

def zz_feature_map(x: Union[np.ndarray, torch.Tensor], n_qubits: int, reps: int = 2):
    """
    Constructs the second-order ZZ Feature Map (Paper 33 / Havlicek et al. Nature 2019).
    
    Formula:
        U_Φ(x) = ∏_{r=1}^reps ( ⨂_{j=0}^{n-1} R_z(2 x_j) H ) ( ⨂_{j < k} CNOT_(j,k) R_z(2(π - x_j)(π - x_k)) CNOT_(j,k) )
    """
    for _ in range(reps):
        # 1. Hadamard layer + single-qubit Z-rotations
        for j in range(n_qubits):
            qml.Hadamard(wires=j)
            qml.RZ(2.0 * x[j], wires=j)
            
        # 2. Linear / cyclic 2-qubit entangling interactions
        for j in range(n_qubits - 1):
            phi_jk = 2.0 * (math.pi - x[j]) * (math.pi - x[j + 1])
            qml.CNOT(wires=[j, j + 1])
            qml.RZ(phi_jk, wires=j + 1)
            qml.CNOT(wires=[j, j + 1])
            
        if n_qubits > 2:
            # Wrap-around boundary interaction for full cyclic entanglement
            phi_wrap = 2.0 * (math.pi - x[n_qubits - 1]) * (math.pi - x[0])
            qml.CNOT(wires=[n_qubits - 1, 0])
            qml.RZ(phi_wrap, wires=0)
            qml.CNOT(wires=[n_qubits - 1, 0])


def strongly_entangling_ansatz(weights: Union[np.ndarray, torch.Tensor], n_qubits: int, n_layers: int):
    """
    Strongly Entangling Variational Ansatz with arbitrary 3-axis single-qubit rotations
    and cyclic CNOT entanglers (Schuld et al., 2020).
    
    Weights shape: (n_layers, n_qubits, 3)
    """
    for layer in range(n_layers):
        for j in range(n_qubits):
            qml.Rot(weights[layer, j, 0], weights[layer, j, 1], weights[layer, j, 2], wires=j)
        for j in range(n_qubits):
            qml.CNOT(wires=[j, (j + 1) % n_qubits])


# ==================================================================================================
# 2. VARIATIONAL QUANTUM CLASSIFIER (VQC)
# ==================================================================================================

class VariationalQuantumClassifier:
    """
    Variational Quantum Classifier (VQC) with Parameter-Shift Rule analytical gradients,
    Pauli-Z expectation measurements, and a calibrated linear classification head.
    """
    def __init__(self, 
                 n_qubits: int = 8, 
                 n_layers: int = 3, 
                 reps: int = 2,
                 lr: float = 0.02, 
                 epochs: int = 50, 
                 batch_size: int = 32,
                 random_state: int = 42):
        self.n_qubits = n_qubits
        self.n_layers = n_layers
        self.reps = reps
        self.lr = lr
        self.epochs = epochs
        self.batch_size = batch_size
        self.random_state = random_state
        
        # Initialize PennyLane state-vector device
        self.dev = qml.device("default.qubit", wires=n_qubits)
        self.qnode = qml.QNode(self._circuit, self.dev, diff_method="adjoint", interface="torch")
        
        # Model weights
        torch.manual_seed(random_state)
        self.quantum_weights = nn.Parameter(0.01 * torch.randn(n_layers, n_qubits, 3, dtype=torch.float32))
        self.classical_head = nn.Linear(n_qubits, 2)
        self.is_fitted = False

    def _circuit(self, x: torch.Tensor, weights: torch.Tensor):
        zz_feature_map(x, self.n_qubits, self.reps)
        strongly_entangling_ansatz(weights, self.n_qubits, self.n_layers)
        return [qml.expval(qml.PauliZ(i)) for i in range(self.n_qubits)]

    def _forward_batch(self, X_batch: torch.Tensor) -> torch.Tensor:
        """Evaluates batch of inputs through the QNode and classical linear head."""
        exp_vals = []
        for i in range(X_batch.shape[0]):
            q_out = self.qnode(X_batch[i], self.quantum_weights)
            exp_vals.append(torch.stack(q_out))
        quantum_features = torch.stack(exp_vals).to(dtype=torch.float32)  # (batch_size, n_qubits)
        logits = self.classical_head(quantum_features)  # (batch_size, 2)
        return logits

    def fit(self, X: np.ndarray, y: np.ndarray) -> 'VariationalQuantumClassifier':
        """Trains variational quantum circuit parameters and classical head simultaneously via AdamW."""
        logger.info(f"Training VQC: {self.n_qubits} Qubits, {self.n_layers} Layers, {self.epochs} Epochs...")
        X_t = torch.tensor(X[:, :self.n_qubits], dtype=torch.float32)
        y_t = torch.tensor(y, dtype=torch.long)
        
        dataset = TensorDataset(X_t, y_t)
        loader = DataLoader(dataset, batch_size=self.batch_size, shuffle=True)
        
        optimizer = optim.AdamW([
            {"params": self.quantum_weights, "lr": self.lr},
            {"params": self.classical_head.parameters(), "lr": self.lr * 2.0}
        ])
        criterion = nn.CrossEntropyLoss()
        
        for epoch in range(self.epochs):
            total_loss = 0.0
            for batch_X, batch_y in loader:
                optimizer.zero_grad()
                logits = self._forward_batch(batch_X)
                loss = criterion(logits, batch_y)
                loss.backward()
                optimizer.step()
                total_loss += loss.item() * batch_X.size(0)
                
            avg_loss = total_loss / len(X_t)
            if (epoch + 1) % 10 == 0 or epoch == self.epochs - 1:
                logger.info(f"VQC Epoch [{epoch+1}/{self.epochs}] - Loss: {avg_loss:.4f}")
                
        self.is_fitted = True
        return self

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            raise RuntimeError("VQC must be fitted before calling predict_proba().")
        X_t = torch.tensor(X[:, :self.n_qubits], dtype=torch.float32)
        with torch.no_grad():
            logits = self._forward_batch(X_t)
            probs = torch.softmax(logits, dim=1).cpu().numpy()
        return probs

    def predict(self, X: np.ndarray) -> np.ndarray:
        probs = self.predict_proba(X)
        return np.argmax(probs, axis=1)


# ==================================================================================================
# 3. QUANTUM KERNEL SUPPORT VECTOR MACHINE (QSVM)
# ==================================================================================================

class QuantumKernelSVM:
    """
    Quantum Support Vector Machine (QSVM) utilizing the Fidelity State-Vector Kernel.
    
    Mathematical Formulation:
        K_ij = |⟨ψ(x_i)|ψ(x_j)⟩|² = |⟨0^N | U_Φ^†(x_j) U_Φ(x_i) | 0^N ⟩|²
    """
    def __init__(self, n_qubits: int = 8, reps: int = 2, C: float = 10.0):
        self.n_qubits = n_qubits
        self.reps = reps
        self.C = C
        self.dev = qml.device("default.qubit", wires=n_qubits)
        self.svm = SVC(C=C, kernel="precomputed", probability=True)
        self.X_train_: Optional[np.ndarray] = None

        @qml.qnode(self.dev)
        def _state_circuit(x):
            zz_feature_map(x, self.n_qubits, self.reps)
            return qml.state()

        self.state_circuit = _state_circuit

    def _compute_kernel_matrix(self, X1: np.ndarray, X2: np.ndarray) -> np.ndarray:
        """Computes the full Gram matrix between two datasets using statevector inner products."""
        N1 = X1.shape[0]
        N2 = X2.shape[0]
        
        # Compute all statevectors
        states_1 = [self.state_circuit(X1[i, :self.n_qubits]) for i in range(N1)]
        if X1 is X2:
            states_2 = states_1
        else:
            states_2 = [self.state_circuit(X2[j, :self.n_qubits]) for j in range(N2)]
            
        states_1_mat = np.array(states_1)  # (N1, 2^n)
        states_2_mat = np.array(states_2)  # (N2, 2^n)
        
        # Fidelity = |<psi_1 | psi_2>|^2
        overlaps = np.abs(states_1_mat @ states_2_mat.conj().T) ** 2
        return overlaps

    def fit(self, X: np.ndarray, y: np.ndarray) -> 'QuantumKernelSVM':
        logger.info(f"Computing Quantum Fidelity Gram Matrix for QSVM ({X.shape[0]} samples, {self.n_qubits} qubits)...")
        self.X_train_ = X.copy()
        K_train = self._compute_kernel_matrix(X, X)
        self.svm.fit(K_train, y)
        logger.info(f"QSVM Optimization Complete -> Number of Support Vectors: {len(self.svm.support_)}")
        return self

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        if self.X_train_ is None:
            raise RuntimeError("QSVM must be fitted before calling predict_proba().")
        K_test = self._compute_kernel_matrix(X, self.X_train_)
        return self.svm.predict_proba(K_test)

    def predict(self, X: np.ndarray) -> np.ndarray:
        if self.X_train_ is None:
            raise RuntimeError("QSVM must be fitted before calling predict().")
        K_test = self._compute_kernel_matrix(X, self.X_train_)
        return self.svm.predict(K_test)

    def get_gram_matrix(self, X: np.ndarray) -> np.ndarray:
        return self._compute_kernel_matrix(X, X)


# ==================================================================================================
# 4. HYBRID QUANTUM NEURAL NETWORK (HQNN)
# ==================================================================================================

class HybridQuantumNeuralNetwork(nn.Module):
    """
    End-to-End Differentiable Hybrid Quantum-Classical Neural Network (HQNN).
    Architecture:
        Input Features -> Classical Linear Projection -> Quantum QNode (ZZ Map + Ansatz) -> Classification Head.
    """
    def __init__(self, in_features: int, n_qubits: int = 8, n_layers: int = 2, reps: int = 1):
        super().__init__()
        self.in_features = in_features
        self.n_qubits = n_qubits
        self.n_layers = n_layers
        self.reps = reps
        
        self.classical_encoder = nn.Sequential(
            nn.Linear(in_features, n_qubits),
            nn.Tanh()  # Bounds outputs to [-1, 1] scaled to [0, pi]
        )
        
        self.dev = qml.device("default.qubit", wires=n_qubits)
        
        @qml.qnode(self.dev, diff_method="adjoint", interface="torch")
        def _circuit(inputs, weights):
            # Scale inputs from [-1, 1] to [0, pi]
            scaled_inputs = (inputs + 1.0) * (math.pi / 2.0)
            zz_feature_map(scaled_inputs, self.n_qubits, self.reps)
            strongly_entangling_ansatz(weights, self.n_qubits, self.n_layers)
            return [qml.expval(qml.PauliZ(i)) for i in range(self.n_qubits)]
            
        self.qnode = _circuit
        self.weight_shapes = {"weights": (n_layers, n_qubits, 3)}
        self.qlayer = qml.qnn.TorchLayer(self.qnode, self.weight_shapes)
        
        self.classification_head = nn.Sequential(
            nn.Linear(n_qubits, 16),
            nn.GELU(),
            nn.Linear(16, 2)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        encoded = self.classical_encoder(x)
        if encoded.ndim == 1:
            encoded = encoded.unsqueeze(0)
        q_outs = [self.qlayer(encoded[i]) for i in range(encoded.shape[0])]
        q_out = torch.stack(q_outs).to(dtype=torch.float32)
        logits = self.classification_head(q_out)
        return logits


class HQNNChampion:
    """Training and inference wrapper for the Hybrid Quantum Neural Network."""
    def __init__(self, 
                 n_qubits: int = 8, 
                 n_layers: int = 2, 
                 lr: float = 0.01, 
                 epochs: int = 40, 
                 batch_size: int = 32,
                 random_state: int = 42):
        self.n_qubits = n_qubits
        self.n_layers = n_layers
        self.lr = lr
        self.epochs = epochs
        self.batch_size = batch_size
        self.random_state = random_state
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model: Optional[HybridQuantumNeuralNetwork] = None

    def fit(self, X: np.ndarray, y: np.ndarray) -> 'HQNNChampion':
        torch.manual_seed(self.random_state)
        in_features = X.shape[1]
        self.model = HybridQuantumNeuralNetwork(in_features, self.n_qubits, self.n_layers).to(self.device)
        
        X_t = torch.tensor(X, dtype=torch.float32)
        y_t = torch.tensor(y, dtype=torch.long)
        dataset = TensorDataset(X_t, y_t)
        loader = DataLoader(dataset, batch_size=self.batch_size, shuffle=True)
        
        optimizer = optim.AdamW(self.model.parameters(), lr=self.lr, weight_decay=1e-4)
        criterion = nn.CrossEntropyLoss()
        
        logger.info(f"Training HQNN Champion: {in_features} -> {self.n_qubits} Qubits -> 2 Classes ({self.epochs} epochs)...")
        self.model.train()
        for epoch in range(self.epochs):
            total_loss = 0.0
            for batch_X, batch_y in loader:
                batch_X, batch_y = batch_X.to(self.device), batch_y.to(self.device)
                optimizer.zero_grad()
                outputs = self.model(batch_X)
                loss = criterion(outputs, batch_y)
                loss.backward()
                optimizer.step()
                total_loss += loss.item() * batch_X.size(0)
            if (epoch + 1) % 10 == 0 or epoch == self.epochs - 1:
                logger.info(f"HQNN Epoch [{epoch+1}/{self.epochs}] - Loss: {total_loss/len(X_t):.4f}")
                
        return self

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        if self.model is None:
            raise RuntimeError("HQNN must be fitted before calling predict_proba().")
        self.model.eval()
        X_t = torch.tensor(X, dtype=torch.float32).to(self.device)
        with torch.no_grad():
            logits = self.model(X_t)
            probs = torch.softmax(logits, dim=1).cpu().numpy()
        return probs

    def predict(self, X: np.ndarray) -> np.ndarray:
        probs = self.predict_proba(X)
        return np.argmax(probs, axis=1)


# ==================================================================================================
# MODULE SELF-TEST
# ==================================================================================================

if __name__ == "__main__":
    logger.info("Executing Quantum Circuits self-test...")
    np.random.seed(42)
    X_test_synth = np.random.uniform(0.1, 3.0, size=(10, 4))
    y_test_synth = np.random.choice([0, 1], size=10)
    
    # Test QSVM Gram Matrix
    qsvm = QuantumKernelSVM(n_qubits=4, reps=1)
    K = qsvm.get_gram_matrix(X_test_synth)
    assert K.shape == (10, 10), "Gram matrix shape mismatch"
    assert np.allclose(np.diag(K), 1.0), "Self-fidelity diagonal must equal 1.0"
    
    # Test HQNN
    hqnn = HQNNChampion(n_qubits=4, n_layers=1, epochs=2, batch_size=5)
    hqnn.fit(X_test_synth, y_test_synth)
    preds = hqnn.predict(X_test_synth)
    assert len(preds) == 10, "Predictions count mismatch"
    logger.info("Quantum Circuits Self-Test PASSED successfully.")
