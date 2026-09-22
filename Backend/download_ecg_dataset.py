"""Download ECG dataset from Kaggle using API token."""
import os
import sys
import zipfile
import requests
from pathlib import Path

DATASET = "evilspirit05/ecg-analysis"
OUTPUT_DIR = Path(__file__).parent / "data" / "datasets" / "cardiac"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

ZIP_PATH = OUTPUT_DIR / "ecg-analysis.zip"

# Use the new KGAT token format
TOKEN = os.environ.get("KAGGLE_API_TOKEN", "KGAT_bc9483c061e356b52cf4bd294cdded98")

print(f"Downloading dataset: {DATASET}")
print(f"Output directory: {OUTPUT_DIR}")

# Try direct download with token in header
url = f"https://www.kaggle.com/api/v1/datasets/download/{DATASET}"
headers = {"Authorization": f"Bearer {TOKEN}"}

try:
    resp = requests.get(url, headers=headers, stream=True, timeout=120)
    if resp.status_code == 200:
        total = int(resp.headers.get('content-length', 0))
        downloaded = 0
        with open(ZIP_PATH, 'wb') as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)
                downloaded += len(chunk)
                if total > 0:
                    pct = (downloaded / total) * 100
                    print(f"\rDownloading: {pct:.1f}% ({downloaded}/{total} bytes)", end="", flush=True)
        print(f"\nDownload complete: {ZIP_PATH}")
        
        # Extract
        print("Extracting...")
        with zipfile.ZipFile(ZIP_PATH, 'r') as z:
            z.extractall(OUTPUT_DIR)
        print(f"Extracted to: {OUTPUT_DIR}")
        
        # List contents
        for root, dirs, files in os.walk(OUTPUT_DIR):
            level = root.replace(str(OUTPUT_DIR), '').count(os.sep)
            indent = ' ' * 2 * level
            print(f'{indent}{os.path.basename(root)}/')
            if level < 3:
                subindent = ' ' * 2 * (level + 1)
                for file in files[:5]:
                    print(f'{subindent}{file}')
                if len(files) > 5:
                    print(f'{subindent}... and {len(files)-5} more files')
        
        # Clean up zip
        os.remove(ZIP_PATH)
        print("Cleaned up zip file.")
    else:
        print(f"HTTP {resp.status_code}: {resp.text[:500]}")
        print("Trying alternative authentication...")
        
        # Try with basic auth using token as password
        resp2 = requests.get(url, auth=("token", TOKEN), stream=True, timeout=120)
        if resp2.status_code == 200:
            with open(ZIP_PATH, 'wb') as f:
                for chunk in resp2.iter_content(chunk_size=8192):
                    f.write(chunk)
            print(f"Download complete (alt auth): {ZIP_PATH}")
            with zipfile.ZipFile(ZIP_PATH, 'r') as z:
                z.extractall(OUTPUT_DIR)
            print(f"Extracted to: {OUTPUT_DIR}")
            os.remove(ZIP_PATH)
        else:
            print(f"Alt auth also failed: HTTP {resp2.status_code}")
            print("Please download manually from: https://www.kaggle.com/datasets/evilspirit05/ecg-analysis")
            print(f"Extract to: {OUTPUT_DIR}")
            sys.exit(1)

except Exception as e:
    print(f"Error: {e}")
    print("Please download manually from: https://www.kaggle.com/datasets/evilspirit05/ecg-analysis")
    print(f"Extract to: {OUTPUT_DIR}")
    sys.exit(1)
