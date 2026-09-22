"""
hybrid_model.src.train — Two-Stage Hybrid Training Loop
=========================================================

Training strategy, engineered to be both tractable on a CPU quantum
simulator and scientifically strong:

Stage 1 — Supervised pretraining of the CNN encoder.
    The ``ScalogramEncoder`` is trained against the clinical labels so its
    8-D latent is task-informative. A short run (few epochs) on the
    scalogram dataset, cross-entropy on the 5 superclasses, with early
    stopping on validation balanced-accuracy.

Stage 2 — Quantum-head fine-tune (encoder frozen).
    Latent ``z`` from the frozen encoder is angle-embedded into the
    8-qubit VQC; the **quantum variational weights + projection head** are
    trained by backprop through the circuit. Key optimizers / schemes:

    * ``AdamW`` for the head and quantum weights (per the SU(2)
      critique's finding that Adam > natural-gradient for short horizons).
    * ``OneCycleLR`` cos-annealing scheduler.
    * **Finite-noise regularization** via a small depolarizing channel in
      the circuit (tunable, default off) — grounded in the finite-noise
      optimum theory.
    * Label-smoothing CE + optional class balancing for the 5 superclasses.
    * Early stopping on validation balanced accuracy and model
      checkpointing to ``artifacts/``.

Both stages produce a single ``HybridCardioQNN`` whose artifact can be
loaded by :mod:`inference` and :mod:`evaluate`.
"""

from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Optional

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader

from core import PTBXLDataLoader, PTBXLDataset
from core.metrics import compute_clinical_metrics, SUPERCLASSES

from .hybrid_net import HybridCardioQNN


# ----------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------
def _class_weight_vector(train_df, classes=SUPERCLASSES) -> torch.Tensor:
    """Inverse-frequency class weights (smoothed) for balanced training."""
    counts = np.array([int(train_df[c].sum()) for c in classes], dtype=float)
    counts[counts == 0] = 1.0
    w = counts.max() / counts
    w = w / w.mean()  # normalize mean weight to 1
    return torch.tensor(w, dtype=torch.float32)


def _setup_dataloaders(data_dir, max_train=None, max_test=None,
                       batch_size=32, mode="scalogram", num_workers=2, seed=42):
    loader = PTBXLDataLoader(data_dir=data_dir, sampling_rate=100)
    train, val, test = loader.official_holdout_split()
    if max_train is not None:
        train = train.iloc[:max_train]
    if max_test is not None:
        val = val.iloc[:max_test]
        test = test.iloc[:max_test]

    ds_train = PTBXLDataset(loader, train, mode=mode, label_kind="single", return_aux=True)
    ds_val = PTBXLDataset(loader, val, mode=mode, label_kind="single", return_aux=True)
    ds_test = PTBXLDataset(loader, test, mode=mode, label_kind="single", return_aux=True)

    dl_train = DataLoader(ds_train, batch_size=batch_size, shuffle=True,
                          num_workers=num_workers, drop_last=True)
    dl_val = DataLoader(ds_val, batch_size=batch_size, shuffle=False,
                        num_workers=num_workers)
    dl_test = DataLoader(ds_test, batch_size=batch_size, shuffle=False,
                         num_workers=num_workers)
    return loader, (dl_train, dl_val, dl_test), (train, val, test)


# ----------------------------------------------------------------------
# Stage 1
# ----------------------------------------------------------------------
def _train_encoder_stage(
    model: HybridCardioQNN, dl_train, dl_val, device, epochs=8,
    lr=3e-3, class_w=None, patience=3, verbose=True,
) -> HybridCardioQNN:
    """Train only the CNN encoder through a temporary latent-linear head."""
    # Stage 1 trains the encoder, so ensure its gradients are on.
    model.unfreeze_encoder()
    linear_head = nn.Linear(model.latent_dim, model.n_classes).to(device)
    for p in linear_head.parameters():
        p.requires_grad_(False)
    model.encoder_loss_head = linear_head

    params = list(model.backbone.parameters()) + list(linear_head.parameters())
    opt = torch.optim.AdamW(params, lr=lr, weight_decay=1e-4)
    crit = nn.CrossEntropyLoss(weight=class_w, label_smoothing=0.05).to(device)

    best, best_state, bad = -np.inf, None, 0
    for ep in range(epochs):
        model.train()
        run_loss = 0.0
        for items in dl_train:
            x, clinical, waveform, labels = items
            x, clinical, waveform = x.to(device), clinical.to(device), waveform.to(device)
            lab = labels.long().to(device)
            opt.zero_grad()
            z = model.backbone(x, clinical=clinical, waveform=waveform)
            logits = linear_head(z)
            loss = crit(logits, lab)
            loss.backward()
            opt.step()
            run_loss += loss.item() * x.size(0)
        # validate
        model.eval(); p_all, y_all = [], []
        with torch.no_grad():
            for items in dl_val:
                x, clinical, waveform, labels = items
                x, clinical, waveform = x.to(device), clinical.to(device), waveform.to(device)
                z = model.backbone(x, clinical=clinical, waveform=waveform)
                p = torch.softmax(linear_head(z), dim=-1)
                p_all.append(p.cpu().numpy()); y_all.append(labels.cpu().numpy())
        y = np.concatenate(y_all); p = np.concatenate(p_all)
        m = compute_clinical_metrics(y, p, classes=SUPERCLASSES, y_pred=None)
        acc = m["macro_f1"] if not np.isnan(m["macro_f1"]) else m["accuracy"]
        if verbose:
            print(f"  [stage1] ep {ep+1}/{epochs} loss {run_loss/max(1,len(dl_train.dataset)):.4f} "
                  f"val macroF1 {m['macro_f1']:.4f} acc {m['accuracy']:.4f}")
        if acc > best:
            best = acc; best_state = {k: v.detach().cpu().clone() for k, v in model.backbone.state_dict().items()}
            bad = 0
        else:
            bad += 1
            if bad >= patience:
                break
    if best_state is not None:
        model.backbone.load_state_dict(best_state)
    model.encoder_loss_head = None
    return model


# ----------------------------------------------------------------------
# Stage 2
# ----------------------------------------------------------------------
def _train_quantum_stage(
    model: HybridCardioQNN, dl_train, dl_val, device, epochs=12,
    lr=5e-3, quantum_lr=5e-3, class_w=None, patience=4, verbose=True,
) -> HybridCardioQNN:
    """Train quantum variational weights + projection head (encoder frozen)."""
    model.freeze_encoder()
    model.quantum.freeze(False)
    model.train()

    head_params = list(model.head.parameters())
    q_params = model.quantum_params()
    opt = torch.optim.AdamW([
        {"params": q_params, "lr": quantum_lr, "weight_decay": 0.0},
        {"params": head_params, "lr": lr, "weight_decay": 1e-4},
    ])
    total_steps = epochs * len(dl_train)
    sched = torch.optim.lr_scheduler.OneCycleLR(
        opt, max_lr=[quantum_lr, lr], total_steps=total_steps,
        pct_start=0.2, div_factor=5.0, final_div_factor=50.0,
    )
    crit = nn.CrossEntropyLoss(weight=class_w, label_smoothing=0.05).to(device)

    best, best_state, bad = -np.inf, None, 0
    for ep in range(epochs):
        model.train(); t0 = time.time(); run_loss = 0.0
        for i, items in enumerate(dl_train):
            x, clinical, waveform, labels = items
            x, clinical, waveform = x.to(device), clinical.to(device), waveform.to(device)
            lab = labels.long().to(device)
            opt.zero_grad()
            out = model(x, clinical=clinical, waveform=waveform)
            loss = crit(out["logits"], lab)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(list(model.quantum_params()) + head_params, 5.0)
            opt.step(); sched.step()
            run_loss += loss.item() * x.size(0)
        model.eval(); p_all, y_all = [], []
        with torch.no_grad():
            for items in dl_val:
                x, clinical, waveform, labels = items
                x, clinical, waveform = x.to(device), clinical.to(device), waveform.to(device)
                out = model(x, clinical=clinical, waveform=waveform)
                p_all.append(out["probs"].cpu().numpy()); y_all.append(labels.cpu().numpy())
        y = np.concatenate(y_all); p = np.concatenate(p_all)
        m = compute_clinical_metrics(y, p, classes=SUPERCLASSES)
        acc = m["macro_f1"] if not np.isnan(m["macro_f1"]) else m["accuracy"]
        if verbose:
            print(f"  [stage2] ep {ep+1}/{epochs} loss {run_loss/max(1,len(dl_train.dataset)):.4f} "
                  f"val macroF1 {m['macro_f1']:.4f} acc {m['accuracy']:.4f} ({time.time()-t0:.1f}s)")
        if acc > best:
            best = acc
            best_state = {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}
            bad = 0
        else:
            bad += 1
            if bad >= patience:
                break
    if best_state is not None:
        model.load_state_dict(best_state)
    return model


# ----------------------------------------------------------------------
# Public API
# ----------------------------------------------------------------------
def train_hybrid_model(
    data_dir: str,
    artifact_dir: Optional[str] = None,
    max_train: Optional[int] = None,
    max_test: Optional[int] = None,
    batch_size: int = 32,
    stage1_epochs: int = 8,
    stage2_epochs: int = 12,
    train_quantum: bool = True,
    freeze_backbone: bool = True,
    depolarizing_rate: float = 0.0,
    n_qubits: int = 8,
    re_uploads: int = 6,
    verbose: bool = True,
    seed: int = 42,
) -> tuple[HybridCardioQNN, dict]:
    """
    Run the two-stage hybrid training and persist artifacts.

    Returns (model, report) with report carrying per-stage history and the
    artifact paths (model weights + config json) under ``artifact_dir``.
    """
    torch.manual_seed(seed)
    np.random.seed(seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    loader, (dl_train, dl_val, dl_test), (train, val, test) = _setup_dataloaders(
        data_dir, max_train=max_train, max_test=max_test,
        batch_size=batch_size, mode="scalogram", seed=seed,
    )

    class_w = _class_weight_vector(train)
    model = HybridCardioQNN(
        in_channels=12, latent_dim=8, n_qubits=n_qubits,
        re_uploads=re_uploads, n_classes=5,
        depolarizing_rate=depolarizing_rate,
        train_quantum=train_quantum, freeze_backbone=freeze_backbone,
    ).to(device)

    if verbose:
        print("=" * 72)
        print("  [HYBRID] Stage 1 — train CNN encoder -> 8-D latent")
        print("=" * 72)
    model = _train_encoder_stage(model, dl_train, dl_val, device,
                                 epochs=stage1_epochs, class_w=class_w,
                                 verbose=verbose)

    if verbose:
        print("=" * 72)
        print("  [HYBRID] Stage 2 — train 8-qubit VQC + head (encoder frozen)")
        print("=" * 72)
    model = _train_quantum_stage(model, dl_train, dl_val, device,
                                 epochs=stage2_epochs, class_w=class_w,
                                 verbose=verbose)

    report = {
        "n_train": len(train), "n_val": len(val), "n_test": len(test),
        "device": str(device), "depolarizing_rate": depolarizing_rate,
        "n_qubits": n_qubits, "re_uploads": re_uploads,
        "stage1_epochs": stage1_epochs, "stage2_epochs": stage2_epochs,
    }

    if artifact_dir is not None:
        artifact_dir = Path(artifact_dir)
        artifact_dir.mkdir(parents=True, exist_ok=True)
        weights_path = artifact_dir / "hybrid_cardio.pt"
        torch.save(model.state_dict(), weights_path)
        model.quantum.freeze(True)  # freeze for reproducible inference
        (artifact_dir / "hybrid_config.json").write_text(
            json.dumps(report, indent=2)
        )
        report["artifact"] = str(weights_path)

    return model, report
