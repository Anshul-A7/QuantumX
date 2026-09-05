import os
import sys
import urllib.request
import json
import zipfile
import pandas as pd

sys.stdout.reconfigure(encoding='utf-8')

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
os.makedirs(DATA_DIR, exist_ok=True)

BASE_URL = "https://physionet.org/files/ptb-xl/1.0.3/"

print(f"================================================================")
print(f"  📥 QUANTUMX V2: PTB-XL 12-LEAD ECG DATASET DOWNLOADER")
print(f"  Target Directory: {DATA_DIR}")
print(f"================================================================")

# 1. Download Essential Metadata Files
metadata_files = [
    "ptbxl_database.csv",
    "scp_statements.csv",
    "RECORDS"
]

for fname in metadata_files:
    target_path = os.path.join(DATA_DIR, fname)
    if os.path.exists(target_path) and os.path.getsize(target_path) > 0:
        print(f"✅ Metadata file already exists: {fname} ({os.path.getsize(target_path)/1024:.1f} KB)")
    else:
        url = BASE_URL + fname
        print(f"⏳ Downloading metadata {fname} from {url}...")
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as resp, open(target_path, 'wb') as out_f:
                out_f.write(resp.read())
            print(f"✅ Downloaded: {fname} ({os.path.getsize(target_path)/1024:.1f} KB)")
        except Exception as e:
            print(f"❌ Error downloading {fname}: {e}")

# Verify Metadata Loaded
try:
    df_db = pd.read_csv(os.path.join(DATA_DIR, "ptbxl_database.csv"), index_col="ecg_id")
    df_scp = pd.read_csv(os.path.join(DATA_DIR, "scp_statements.csv"), index_col=0)
    print(f"\n📊 PTB-XL Dataset Loaded Successfully:")
    print(f"  • Total ECG Recordings: {len(df_db):,}")
    print(f"  • Unique Patients: {df_db['patient_id'].nunique():,}")
    print(f"  • Diagnostic SCP Statements: {len(df_scp)}")
    print(f"  • Stratified Cross-Validation Folds: {sorted(df_db['strat_fold'].unique())}")
except Exception as e:
    print(f"❌ Error loading metadata: {e}")
