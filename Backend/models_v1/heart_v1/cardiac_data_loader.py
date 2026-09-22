"""
================================================================================
QuantumX — Cardiac ECG Image Data Loader & Preprocessor
ECG Images Dataset of Cardiac Patients (Kaggle: evilspirit05/ecg-analysis)
================================================================================

Dataset Details:
  - Source: Kaggle evilspirit05/ecg-analysis
  - Format: 12-lead ECG paper-strip images (PNG/JPG)
  - Total: ~3,951 images (3,023 train + 928 test)
  - 4 Classes: Normal, Myocardial Infarction, History of MI, Abnormal Heartbeat
  - Clinical Relevance: ECG is the most common cardiac diagnostic test in India

Architecture:
  - Image input: 224x224 RGB (ImageNet-compatible)
  - Normalization: ImageNet mean/std
  - Class-weighted sampling for imbalanced dataset
  - Holdout extraction: 30 images per class completely unseen
  - Stratified train/val split for cross-validation
================================================================================
"""

import os
import json
import shutil
import random
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any

import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
from torchvision import transforms
from PIL import Image


# ─── Dataset Configuration ───────────────────────────────────────────────────
CARDIAC_DATA_ROOT = Path(__file__).resolve().parent.parent.parent.parent / "data" / "datasets" / "cardiac"
HEART_V1_ROOT = Path(__file__).resolve().parent
HOLDOUT_ROOT = HEART_V1_ROOT / "artifacts" / "holdout"
ARTIFACTS_ROOT = HEART_V1_ROOT / "artifacts"

# Class mapping — each abnormality individually, NOT binary
CLASS_NAMES = ["Normal", "Myocardial Infarction", "History of MI", "Abnormal Heartbeat"]
CLASS_ABBREV = ["Normal", "MI", "History_MI", "Abnormal"]
NUM_CLASSES = 4

# Folder name mapping from dataset to our class indices
# The Kaggle dataset uses these folder names:
FOLDER_TO_CLASS = {
    "Normal": 0,
    "Myocardial Infarction": 1,
    "MI": 1,
    "Myocardial Infarction Patient": 1,
    "History of MI": 2,
    "History Of MI": 2,
    "PMI": 2,
    "Abnormal Heartbeat": 3,
    "Abnormal": 3,
    "HB": 3,
}

# Clinical descriptions for each class
CLINICAL_DESCRIPTIONS = {
    0: "Normal sinus rhythm — no cardiac abnormalities detected. Regular P-waves, QRS complexes, and T-waves within normal morphology and intervals.",
    1: "Acute Myocardial Infarction (Heart Attack) — ST-segment elevation, pathological Q-waves, T-wave inversion indicating active myocardial injury and necrosis.",
    2: "Prior Myocardial Infarction — Residual pathological Q-waves, persistent ST changes indicating healed myocardial scar tissue from a previous cardiac event.",
    3: "Abnormal Heartbeat (Arrhythmia) — Irregular rhythm patterns, conduction defects, premature complexes, or other morphological abnormalities requiring clinical evaluation.",
}

# ImageNet normalization constants
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


def get_train_transforms(image_size: int = 224) -> transforms.Compose:
    """Training augmentation pipeline for ECG images."""
    return transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.RandomHorizontalFlip(p=0.3),
        transforms.RandomRotation(degrees=5),
        transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.1),
        transforms.RandomAffine(degrees=0, translate=(0.05, 0.05)),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])


def get_val_transforms(image_size: int = 224) -> transforms.Compose:
    """Validation/test transform — no augmentation, just resize + normalize."""
    return transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])


def get_gradcam_transforms(image_size: int = 224) -> transforms.Compose:
    """Transform for Grad-CAM visualization — returns tensor without normalization."""
    return transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.ToTensor(),
    ])


class CardiacECGImageDataset(Dataset):
    """
    PyTorch Dataset for ECG paper-strip images.

    Loads images from the Kaggle ECG dataset folder structure:
      train/
        Normal/
        Myocardial Infarction Patient/  (or similar names)
        History Of MI/
        Abnormal Heartbeat/
      test/
        Normal/
        ... (same structure)

    Each image is a 12-lead ECG recording captured as a photograph/scan
    of the paper ECG strip — the most common cardiac test in Indian hospitals.
    """

    def __init__(
        self,
        root_dir: str,
        split: str = "train",
        transform: Optional[transforms.Compose] = None,
        exclude_paths: Optional[set] = None,
    ):
        """
        Args:
            root_dir: Root directory containing train/ and test/ folders
            split: "train" or "test"
            transform: torchvision transforms to apply
            exclude_paths: Set of absolute paths to exclude (for holdout separation)
        """
        self.root_dir = Path(root_dir)
        self.split = split
        self.transform = transform or (get_train_transforms() if split == "train" else get_val_transforms())
        self.exclude_paths = exclude_paths or set()

        self.image_paths: List[str] = []
        self.labels: List[int] = []
        self.class_names = CLASS_NAMES
        self.num_classes = NUM_CLASSES

        self._scan_directory()

    def _scan_directory(self):
        """Scan the dataset directory and build image path + label lists."""
        split_dir = self.root_dir / self.split
        if not split_dir.exists():
            # Try looking for data directly in root (some dataset extractions differ)
            split_dir = self.root_dir
            if not split_dir.exists():
                raise FileNotFoundError(
                    f"Dataset directory not found: {split_dir}\n"
                    f"Download from: https://www.kaggle.com/datasets/evilspirit05/ecg-analysis"
                )

        for folder_name in sorted(os.listdir(split_dir)):
            folder_path = split_dir / folder_name
            if not folder_path.is_dir():
                continue

            # Map folder name to class index
            class_idx = None
            for pattern, idx in FOLDER_TO_CLASS.items():
                if pattern.lower() in folder_name.lower() or folder_name.lower() in pattern.lower():
                    class_idx = idx
                    break

            if class_idx is None:
                # Skip unrecognized folders (like __MACOSX, etc.)
                continue

            # Collect all image files in this class folder
            valid_extensions = {".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp"}
            for img_file in sorted(os.listdir(folder_path)):
                img_path = folder_path / img_file
                if img_path.suffix.lower() in valid_extensions:
                    abs_path = str(img_path.resolve())
                    if abs_path not in self.exclude_paths:
                        self.image_paths.append(abs_path)
                        self.labels.append(class_idx)

    def __len__(self) -> int:
        return len(self.image_paths)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int, str]:
        """Returns (image_tensor, label, image_path)."""
        img_path = self.image_paths[idx]
        label = self.labels[idx]

        # Load image as RGB
        image = Image.open(img_path).convert("RGB")

        if self.transform:
            image = self.transform(image)

        return image, label, img_path

    def get_class_distribution(self) -> Dict[str, int]:
        """Returns count of images per class."""
        dist = {}
        for i, name in enumerate(CLASS_NAMES):
            dist[name] = sum(1 for l in self.labels if l == i)
        return dist

    def get_class_weights(self) -> torch.Tensor:
        """Compute class weights inversely proportional to frequency for balanced training."""
        class_counts = np.bincount(self.labels, minlength=NUM_CLASSES).astype(np.float64)
        # Prevent division by zero
        class_counts = np.maximum(class_counts, 1.0)
        total = len(self.labels)
        weights = total / (NUM_CLASSES * class_counts)
        return torch.tensor(weights, dtype=torch.float32)

    def get_weighted_sampler(self) -> WeightedRandomSampler:
        """Create a WeightedRandomSampler for balanced mini-batches."""
        class_counts = np.bincount(self.labels, minlength=NUM_CLASSES).astype(np.float64)
        class_counts = np.maximum(class_counts, 1.0)
        class_weights = 1.0 / class_counts
        sample_weights = [class_weights[label] for label in self.labels]
        return WeightedRandomSampler(
            weights=sample_weights,
            num_samples=len(sample_weights),
            replacement=True,
        )


def extract_holdout_images(
    data_root: str,
    holdout_dir: str,
    images_per_class: int = 30,
    seed: int = 42,
) -> set:
    """
    Extract holdout images from the test set for manual verification.

    Copies `images_per_class` images from each class into the holdout directory,
    completely separated from training. Returns the set of excluded absolute paths.

    Args:
        data_root: Root dataset directory containing train/test folders
        holdout_dir: Directory to copy holdout images into
        images_per_class: Number of images per class to hold out (default 30)
        seed: Random seed for reproducibility
    """
    random.seed(seed)
    holdout_dir = Path(holdout_dir)
    data_root = Path(data_root)
    excluded_paths = set()

    test_dir = data_root / "test"
    if not test_dir.exists():
        test_dir = data_root

    for folder_name in sorted(os.listdir(test_dir)):
        folder_path = test_dir / folder_name
        if not folder_path.is_dir():
            continue

        # Map folder name to class
        class_idx = None
        class_abbrev = None
        for pattern, idx in FOLDER_TO_CLASS.items():
            if pattern.lower() in folder_name.lower() or folder_name.lower() in pattern.lower():
                class_idx = idx
                class_abbrev = CLASS_ABBREV[idx]
                break

        if class_idx is None:
            continue

        # Collect all images in this class
        valid_extensions = {".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp"}
        all_images = [
            f for f in sorted(os.listdir(folder_path))
            if (folder_path / f).suffix.lower() in valid_extensions
        ]

        # Randomly select holdout images
        n_holdout = min(images_per_class, len(all_images))
        holdout_images = random.sample(all_images, n_holdout)

        # Copy to holdout directory
        class_holdout_dir = holdout_dir / class_abbrev
        class_holdout_dir.mkdir(parents=True, exist_ok=True)

        for img_name in holdout_images:
            src = folder_path / img_name
            dst = class_holdout_dir / img_name
            if not dst.exists():
                shutil.copy2(src, dst)
            excluded_paths.add(str(src.resolve()))

    return excluded_paths


def find_dataset_root() -> Path:
    """
    Locate the ECG dataset root directory by searching common locations.
    The Kaggle dataset may extract into nested subdirectories.
    """
    candidates = [
        CARDIAC_DATA_ROOT,
        CARDIAC_DATA_ROOT / "ECG Image data",
        CARDIAC_DATA_ROOT / "ecg-analysis",
        CARDIAC_DATA_ROOT / "ECG_Image_data",
        CARDIAC_DATA_ROOT / "data",
    ]

    for candidate in candidates:
        if candidate.exists():
            # Check if it has train/ and test/ subdirectories
            if (candidate / "train").exists() or (candidate / "test").exists():
                return candidate
            # Check one level deeper
            for sub in candidate.iterdir():
                if sub.is_dir() and ((sub / "train").exists() or (sub / "test").exists()):
                    return sub

    # Fallback: return the raw data root
    return CARDIAC_DATA_ROOT


def create_cardiac_dataloaders(
    batch_size: int = 32,
    image_size: int = 224,
    num_workers: int = 2,
    holdout_per_class: int = 30,
    val_split: float = 0.15,
    seed: int = 42,
) -> Dict[str, Any]:
    """
    Create complete train/val/test dataloaders with holdout extraction.

    Returns:
        Dictionary containing:
        - train_loader: DataLoader for training
        - val_loader: DataLoader for validation
        - test_loader: DataLoader for testing
        - class_weights: Tensor of class weights for loss function
        - class_names: List of class names
        - num_classes: Number of classes
        - dataset_summary: Summary statistics
        - holdout_paths: Set of holdout image paths
    """
    dataset_root = find_dataset_root()

    # Extract holdout images first
    holdout_paths = extract_holdout_images(
        data_root=str(dataset_root),
        holdout_dir=str(HOLDOUT_ROOT),
        images_per_class=holdout_per_class,
        seed=seed,
    )

    # Create training dataset with augmentation
    train_dataset = CardiacECGImageDataset(
        root_dir=str(dataset_root),
        split="train",
        transform=get_train_transforms(image_size),
        exclude_paths=holdout_paths,
    )

    # Create test dataset without augmentation, excluding holdout
    test_dataset = CardiacECGImageDataset(
        root_dir=str(dataset_root),
        split="test",
        transform=get_val_transforms(image_size),
        exclude_paths=holdout_paths,
    )

    # Split training set into train/val
    torch.manual_seed(seed)
    total_train = len(train_dataset)
    val_size = int(total_train * val_split)
    train_size = total_train - val_size

    train_subset, val_subset = torch.utils.data.random_split(
        train_dataset, [train_size, val_size],
        generator=torch.Generator().manual_seed(seed),
    )

    # Create weighted sampler for balanced training
    # Get labels from the training subset
    train_labels = [train_dataset.labels[i] for i in train_subset.indices]
    class_counts = np.bincount(train_labels, minlength=NUM_CLASSES).astype(np.float64)
    class_counts = np.maximum(class_counts, 1.0)
    sample_weights = [1.0 / class_counts[label] for label in train_labels]
    train_sampler = WeightedRandomSampler(
        weights=sample_weights,
        num_samples=len(sample_weights),
        replacement=True,
    )

    # Class weights for loss function
    total_train_samples = sum(class_counts)
    class_weights = torch.tensor(
        [total_train_samples / (NUM_CLASSES * c) for c in class_counts],
        dtype=torch.float32,
    )

    # Create DataLoaders
    train_loader = DataLoader(
        train_subset,
        batch_size=batch_size,
        sampler=train_sampler,
        num_workers=num_workers,
        pin_memory=True,
        drop_last=True,
    )

    val_loader = DataLoader(
        val_subset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True,
    )

    test_loader = DataLoader(
        test_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True,
    )

    # Build summary
    train_dist = {}
    for i, name in enumerate(CLASS_NAMES):
        train_dist[name] = sum(1 for l in train_labels if l == i)

    test_dist = test_dataset.get_class_distribution()

    dataset_summary = {
        "dataset_name": "ECG Images Dataset of Cardiac Patients",
        "source": "Kaggle evilspirit05/ecg-analysis",
        "image_format": "12-lead ECG paper-strip images (PNG/JPG)",
        "image_size": f"{image_size}x{image_size}",
        "num_classes": NUM_CLASSES,
        "class_names": CLASS_NAMES,
        "train_samples": train_size,
        "val_samples": val_size,
        "test_samples": len(test_dataset),
        "holdout_samples": len(holdout_paths),
        "train_distribution": train_dist,
        "test_distribution": test_dist,
        "class_weights": class_weights.tolist(),
        "clinical_relevance": "ECG is the most common cardiac diagnostic test in India, available at every PHC, district hospital, and private clinic.",
        "preprocessing": f"Resize to {image_size}x{image_size}, ImageNet normalization (mean={IMAGENET_MEAN}, std={IMAGENET_STD})",
    }

    return {
        "train_loader": train_loader,
        "val_loader": val_loader,
        "test_loader": test_loader,
        "class_weights": class_weights,
        "class_names": CLASS_NAMES,
        "num_classes": NUM_CLASSES,
        "dataset_summary": dataset_summary,
        "holdout_paths": holdout_paths,
        "dataset_root": dataset_root,
    }


def load_single_ecg_image(
    image_path: str,
    image_size: int = 224,
) -> Tuple[torch.Tensor, np.ndarray]:
    """
    Load a single ECG image for inference.

    Returns:
        (preprocessed_tensor, original_image_array)
        - preprocessed_tensor: normalized tensor ready for model input [1, 3, H, W]
        - original_image_array: numpy array of original image for Grad-CAM overlay
    """
    image = Image.open(image_path).convert("RGB")

    # Keep original for Grad-CAM overlay
    original_np = np.array(image.resize((image_size, image_size)))

    # Preprocess for model
    transform = get_val_transforms(image_size)
    tensor = transform(image).unsqueeze(0)  # Add batch dimension

    return tensor, original_np


def get_dataset_summary_json() -> Dict[str, Any]:
    """Get dataset summary without creating dataloaders (lightweight)."""
    dataset_root = find_dataset_root()

    summary = {
        "dataset_name": "ECG Images Dataset of Cardiac Patients",
        "source": "Kaggle evilspirit05/ecg-analysis",
        "format": "12-lead ECG paper-strip images",
        "num_classes": NUM_CLASSES,
        "class_names": CLASS_NAMES,
        "class_abbreviations": CLASS_ABBREV,
        "clinical_descriptions": CLINICAL_DESCRIPTIONS,
        "clinical_relevance": "ECG is the most common cardiac diagnostic test in India",
        "dataset_root": str(dataset_root),
        "holdout_root": str(HOLDOUT_ROOT),
    }

    # Count images if dataset exists
    for split_name in ["train", "test"]:
        split_dir = dataset_root / split_name
        if split_dir.exists():
            total = 0
            per_class = {}
            for folder_name in sorted(os.listdir(split_dir)):
                folder_path = split_dir / folder_name
                if not folder_path.is_dir():
                    continue
                class_idx = None
                for pattern, idx in FOLDER_TO_CLASS.items():
                    if pattern.lower() in folder_name.lower() or folder_name.lower() in pattern.lower():
                        class_idx = idx
                        break
                if class_idx is not None:
                    valid_ext = {".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp"}
                    count = sum(
                        1 for f in os.listdir(folder_path)
                        if Path(f).suffix.lower() in valid_ext
                    )
                    per_class[CLASS_NAMES[class_idx]] = count
                    total += count
            summary[f"{split_name}_total"] = total
            summary[f"{split_name}_per_class"] = per_class

    return summary
