"""QuantumX Latent Cardiac Autoencoder Module
Bridges 1024-dimensional classical CNN backbone representations to 8-dimensional
quantum phase space. Pre-trained with reconstruction loss to guarantee preservation
of fine cardiac morphology (ST elevation, T-wave inversion) without gradient starvation.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, TensorDataset

class LatentCardiacAutoencoder(nn.Module):
    """Symmetric Autoencoder preserving salient spatial variance from the 1024-dim
    backbone before passing into the 8-qubit quantum phase space."""
    def __init__(self, in_features=1024, latent_dim=8):
        super().__init__()
        self.in_features = in_features
        self.latent_dim = latent_dim
        
        self.encoder = nn.Sequential(
            nn.BatchNorm1d(in_features),
            nn.Linear(in_features, 256),
            nn.Mish(),
            nn.BatchNorm1d(256),
            nn.Dropout(0.10),
            nn.Linear(256, 64),
            nn.Mish(),
            nn.BatchNorm1d(64),
            nn.Linear(64, latent_dim),
            nn.Tanh()  # Bounded strictly to [-1, 1] for [-pi, pi] phase angle scaling
        )
        
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, 64),
            nn.Mish(),
            nn.BatchNorm1d(64),
            nn.Linear(64, 256),
            nn.Mish(),
            nn.BatchNorm1d(256),
            nn.Dropout(0.10),
            nn.Linear(256, in_features)
        )

    def forward(self, x):
        z = self.encoder(x)
        x_rec = self.decoder(z)
        return x_rec, z

    def encode(self, x):
        return self.encoder(x)

def train_latent_autoencoder(model, train_features, val_features=None, epochs=50, batch_size=64, lr=1e-3, device='cuda'):
    """Pre-trains the bottleneck autoencoder using MSE reconstruction loss."""
    model.to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-5)
    criterion = nn.MSELoss()
    
    train_ds = TensorDataset(train_features)
    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    
    val_loader = None
    if val_features is not None:
        val_ds = TensorDataset(val_features)
        val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False)
        
    print(f"\n[AUTOENCODER PRETRAINING]: Training on {len(train_features)} samples for {epochs} epochs...")
    best_loss = float('inf')
    best_state = None
    
    for epoch in range(epochs):
        model.train()
        train_loss = 0.0
        for (batch_x,) in train_loader:
            batch_x = batch_x.to(device)
            optimizer.zero_grad()
            recon, z = model(batch_x)
            loss = criterion(recon, batch_x)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * len(batch_x)
        scheduler.step()
        train_loss /= len(train_features)
        
        val_loss = 0.0
        if val_loader:
            model.eval()
            with torch.no_grad():
                for (batch_x,) in val_loader:
                    batch_x = batch_x.to(device)
                    recon, z = model(batch_x)
                    loss = criterion(recon, batch_x)
                    val_loss += loss.item() * len(batch_x)
            val_loss /= len(val_features)
            
            if val_loss < best_loss:
                best_loss = val_loss
                best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}
        else:
            if train_loss < best_loss:
                best_loss = train_loss
                best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}
                
        if (epoch + 1) % 10 == 0 or epoch == epochs - 1:
            val_str = f" | Val MSE: {val_loss:.6f}" if val_loader else ""
            print(f"  Epoch [{epoch+1:02d}/{epochs:02d}] - Train MSE: {train_loss:.6f}{val_str}")
            
    if best_state:
        model.load_state_dict(best_state)
    print(f"[AUTOENCODER PRETRAINING COMPLETE] Best Reconstruction MSE: {best_loss:.6f}")
    return model
