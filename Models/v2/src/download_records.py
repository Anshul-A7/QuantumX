import os
import sys
import urllib.request
import pandas as pd
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.stdout.reconfigure(encoding='utf-8')

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
BASE_URL = "https://physionet.org/files/ptb-xl/1.0.3/"

db_path = os.path.join(DATA_DIR, "ptbxl_database.csv")
if not os.path.exists(db_path):
    print("❌ ptbxl_database.csv not found. Run download_ptbxl.py first.")
    sys.exit(1)

df_db = pd.read_csv(db_path)
print(f"================================================================")
print(f"  📥 QUANTUMX V2: PTB-XL WAVEFORM STREAM DOWNLOADER")
print(f"  Total Available Records: {len(df_db):,}")
print(f"================================================================")

def download_record(rel_path_no_ext):
    """Downloads both .hea and .dat for a single WFDB record."""
    success = True
    for ext in ['.hea', '.dat']:
        rel_file = rel_path_no_ext + ext
        local_path = os.path.join(DATA_DIR, rel_file)
        os.makedirs(os.path.dirname(local_path), exist_ok=True)

        if os.path.exists(local_path) and os.path.getsize(local_path) > 0:
            continue

        url = BASE_URL + rel_file.replace('\\', '/')
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=15) as resp, open(local_path, 'wb') as out_f:
                out_f.write(resp.read())
        except Exception as e:
            success = False
    return success

def download_fold(fold_id: int = 10, max_workers: int = 8):
    """Downloads all records for a specific stratified fold."""
    fold_records = df_db[df_db.strat_fold == fold_id]['filename_lr'].tolist()
    print(f"\n⏳ Starting parallel download for Fold {fold_id} ({len(fold_records)} records)...")
    
    completed = 0
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(download_record, rec): rec for rec in fold_records}
        for future in as_completed(futures):
            if future.result():
                completed += 1
            if completed % 100 == 0 or completed == len(fold_records):
                print(f"  • Fold {fold_id} Progress: {completed}/{len(fold_records)} records downloaded ({(completed/len(fold_records))*100:.1f}%)")

    print(f"✅ Fold {fold_id} complete ({completed} records ready in {DATA_DIR})")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--fold", type=int, default=10, help="Fold to download (1-10, default 10 for test)")
    parser.add_argument("--all", action="store_true", help="Download all folds (1-10)")
    parser.add_argument("--workers", type=int, default=12, help="Number of parallel download threads")
    args = parser.parse_args()

    if args.all:
        for f in range(1, 11):
            download_fold(f, max_workers=args.workers)
    else:
        download_fold(args.fold, max_workers=args.workers)
