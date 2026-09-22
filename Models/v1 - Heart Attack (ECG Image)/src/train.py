import os
import sys
import time
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from sklearn.metrics import roc_auc_score, f1_score, accuracy_score

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from src.dataset_loader import PTBXLDataLoader
from src.hybrid_model import WaveletQuantumCardioX

class PTBXLDataset(Dataset):
    """PyTorch Dataset wrapper for streaming PTB-XL records into CWT Scalograms."""

    def __init__(self, data_loader: PTBXLDataLoader, split_df, max_samples: int = None):
        self.loader = data_loader
        self.df = split_df
        if max_samples:
            self.df = self.df.iloc[:max_samples]
        self.ecg_ids = self.df.index.tolist()
        self.classes = self.loader.diagnostic_classes

    def __len__(self):
        return len(self.ecg_ids)

    def __getitem__(self, idx):
        ecg_id = self.ecg_ids[idx]
        try:
            data, _ = self.loader.load_raw_waveform(ecg_id)
            # Compute CWT Scalogram: (12, 32, 1000) -> downsampled to (12, 32, 125)
            scalogram = self.loader.compute_cwt_spectrogram(data, num_scales=32)
            # Downsample along time dimension for fast spatial CNN encoding
            scalogram = scalogram[:, :, ::8]  # (12, 32, 125)
        except Exception:
            # Fallback zero tensor if file is still downloading
            scalogram = np.zeros((12, 32, 125), dtype=np.float32)

        labels = self.df.loc[ecg_id, self.classes].values.astype(np.float32)
        return torch.tensor(scalogram, dtype=torch.float32), torch.tensor(labels, dtype=torch.float32)

def train_quantum_model(data_dir: str, epochs: int = 5, batch_size: int = 16, lr: float = 0.003):
    print("=" * 80)
    print("  [TRAINING] QUANTUMX V2: WAVELET-QUANTUM CARDIOVASCULAR ENGINE")
    print("=" * 80)

    loader = PTBXLDataLoader(data_dir=data_dir, sampling_rate=100)
    train_df, val_df, test_df = loader.get_split()

    print(f"Cohort: Train={len(train_df)} | Val={len(val_df)} | Test={len(test_df)}")

    train_ds = PTBXLDataset(loader, train_df, max_samples=128)
    test_ds = PTBXLDataset(loader, test_df, max_samples=64)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    test_loader = DataLoader(test_ds, batch_size=batch_size, shuffle=False)

    model = WaveletQuantumCardioX(in_channels=12, latent_dim=8, n_classes=5)
    criterion = nn.BCEWithLogitsLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)

    for epoch in range(1, epochs + 1):
        t0 = time.time()
        model.train()
        total_loss = 0.0

        for batch_x, batch_y in train_loader:
            optimizer.zero_grad()
            out = model(batch_x)
            loss = criterion(out["logits"], batch_y)
            loss.backward()
            optimizer.step()
            total_loss += loss.item() * len(batch_x)

        avg_loss = total_loss / len(train_ds)
        elapsed = time.time() - t0
        print(f"Epoch [{epoch}/{epochs}] - Loss: {avg_loss:.4f} - Time: {elapsed:.2f}s")

    print("\nTraining Complete. Saving Quantum Model Checkpoint...")
    checkpoint_dir = os.path.abspath(os.path.join(data_dir, "..", "checkpoints"))
    os.makedirs(checkpoint_dir, exist_ok=True)
    torch.save(model.state_dict(), os.path.join(checkpoint_dir, "quantumx_v2_model.pt"))
    print(f"Saved to {os.path.join(checkpoint_dir, 'quantumx_v2_model.pt')}")

if __name__ == "__main__":
    data_directory = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
    train_quantum_model(data_directory, epochs=2, batch_size=8)
