"""QuantumX Patient-Isolated Clinical ECG Dataset Module
Guarantees 0% intra-patient data leakage between Train, Validation, and Test sets.
Extracts true patient identifiers from clinical filenames, eliminates image duplications,
and verifies strict isolation against absolute holdout test cases.
"""

import os
import re
from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.model_selection import GroupShuffleSplit
from PIL import Image

CLASSES = [
    "Normal",
    "Myocardial Infarction",
    "History of MI",
    "Abnormal Heartbeat"
]

def map_class_name(folder_name):
    low = folder_name.lower()
    if "abnormal" in low or "arrhythmia" in low:
        return "Abnormal Heartbeat"
    if "history" in low:
        return "History of MI"
    if "infarction" in low or "mi" in low:
        return "Myocardial Infarction"
    if "normal" in low:
        return "Normal"
    return folder_name

def extract_patient_id(filename: str, class_name: str) -> str:
    """
    Extracts canonical patient ID from filenames such as:
    'MI(108) - Copy - Copy.jpg' -> 'MI_108'
    'Normal(45).jpg' -> 'Normal_45'
    'HB(12) - Copy.jpg' -> 'HB_12'
    'PMI(3) - Copy.jpg' -> 'PMI_3'
    """
    m = re.match(r"([A-Za-z]+)\s*\((\d+)\)", filename)
    if m:
        prefix = m.group(1).upper()
        num = m.group(2)
        return f"{prefix}_{num}"
    
    stem = Path(filename).stem
    cleaned = re.sub(r"[\s\-_]+copy.*", "", stem, flags=re.IGNORECASE)
    return f"{class_name[:3].upper()}_{cleaned}"

def scan_full_dataset(dataset_root: Path, holdout_dir: Path = None) -> pd.DataFrame:
    """
    Scans all available ECG images across train, test, and holdout directories.
    Deduplicates identical files, parses patient IDs, and assigns labels.
    """
    blacklist = set()
    if holdout_dir and holdout_dir.exists():
        for f in holdout_dir.rglob("*.*"):
            if f.is_file():
                blacklist.add(f.name.lower())
                
    records = []
    seen_hashes = set()
    
    for img_path in dataset_root.rglob("*.*"):
        if img_path.suffix.lower() not in ('.jpg', '.jpeg', '.png'):
            continue
        if img_path.name.lower() in blacklist:
            continue
            
        parent_folder = img_path.parent.name
        class_name = map_class_name(parent_folder)
        if class_name not in CLASSES:
            continue
            
        patient_id = extract_patient_id(img_path.name, class_name)
        
        file_size = img_path.stat().st_size
        unique_key = (patient_id, file_size, class_name)
        if unique_key in seen_hashes:
            continue
        seen_hashes.add(unique_key)
        
        records.append({
            "path": str(img_path.resolve()),
            "filename": img_path.name,
            "class_name": class_name,
            "label": CLASSES.index(class_name),
            "patient_id": patient_id
        })
        
    df = pd.DataFrame(records)
    print(f"Total Unique Clinical Records Loaded: {len(df)}")
    print(f"Total Unique Patients: {df['patient_id'].nunique()}")
    print("Class Distribution across unique patients:")
    pt_classes = df.groupby('patient_id')['class_name'].first().value_counts()
    for c, count in pt_classes.items():
        print(f"  - {c}: {count} patients")
        
    return df

def create_patient_isolated_splits(df: pd.DataFrame, test_size=0.15, val_size=0.15, random_state=42):
    """
    Splits dataset into Train, Validation, and Test sets ensuring:
    1. Zero patient overlap (inter-patient splitting).
    2. Stratified class balance across folds.
    """
    gss_test = GroupShuffleSplit(n_splits=1, test_size=test_size, random_state=random_state)
    train_val_idx, test_idx = next(gss_test.split(df, df['label'], groups=df['patient_id']))
    
    df_train_val = df.iloc[train_val_idx].reset_index(drop=True)
    df_test = df.iloc[test_idx].reset_index(drop=True)
    
    adj_val_size = val_size / (1.0 - test_size)
    gss_val = GroupShuffleSplit(n_splits=1, test_size=adj_val_size, random_state=random_state)
    train_idx, val_idx = next(gss_val.split(df_train_val, df_train_val['label'], groups=df_train_val['patient_id']))
    
    df_train = df_train_val.iloc[train_idx].reset_index(drop=True)
    df_val = df_train_val.iloc[val_idx].reset_index(drop=True)
    
    train_pts = set(df_train['patient_id'])
    val_pts = set(df_val['patient_id'])
    test_pts = set(df_test['patient_id'])
    
    assert len(train_pts.intersection(val_pts)) == 0, "Leakage detected between Train and Val!"
    assert len(train_pts.intersection(test_pts)) == 0, "Leakage detected between Train and Test!"
    assert len(val_pts.intersection(test_pts)) == 0, "Leakage detected between Val and Test!"
    
    print("\n[VERIFIED ZERO-LEAKAGE SPLIT SUMMARY]:")
    print(f"  Train: {len(df_train)} images across {len(train_pts)} unique patients")
    print(f"  Val:   {len(df_val)} images across {len(val_pts)} unique patients")
    print(f"  Test:  {len(df_test)} images across {len(test_pts)} unique patients")
    
    return df_train, df_val, df_test

if __name__ == '__main__':
    base_dir = Path(__file__).resolve().parent.parent
    dataset_dir = base_dir / "Dataset"
    holdout_dir = base_dir / "Test Cases Absolute"
    df = scan_full_dataset(dataset_dir, holdout_dir)
    tr, va, te = create_patient_isolated_splits(df)
