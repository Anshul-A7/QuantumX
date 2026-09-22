import os
import sys
import time
import zipfile
import threading
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.stdout.reconfigure(encoding='utf-8')

TARGET_DIR = os.path.abspath(r"Models\v1 - Heart Attack (ECG Image)\data")
ZIP_PATH = os.path.abspath(r"Models\v1 - Heart Attack (ECG Image)\ptbxl_full.zip")
URL = "https://physionet-open.s3.amazonaws.com/ptb-xl/ptb-xl-1.0.3.zip"
NUM_THREADS = 32

os.makedirs(TARGET_DIR, exist_ok=True)

print("=" * 70, flush=True)
print(f"[*] Turbo Segmented Multi-Threaded PTB-XL Downloader ({NUM_THREADS} threads)", flush=True)
print(f"[*] Source URL: {URL}", flush=True)
print(f"[*] Destination: {ZIP_PATH}", flush=True)
print("=" * 70, flush=True)

# 1. Get total length
req = urllib.request.Request(URL, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=30) as resp:
    total_size = int(resp.headers.get('Content-Length', 0))

print(f"[*] File Size Verified: {total_size / (1024**3):.2f} GB ({total_size:,} bytes)", flush=True)

# Pre-allocate file
with open(ZIP_PATH, 'wb') as f:
    f.seek(total_size - 1)
    f.write(b'\0')

part_size = total_size // NUM_THREADS
ranges = []
for i in range(NUM_THREADS):
    start = i * part_size
    end = (start + part_size - 1) if i < NUM_THREADS - 1 else (total_size - 1)
    ranges.append((i, start, end))

downloaded_bytes = 0
lock = threading.Lock()
start_time = time.time()
last_report_time = start_time

def download_range(part_id, start_byte, end_byte):
    global downloaded_bytes, last_report_time
    part_req = urllib.request.Request(
        URL,
        headers={
            'User-Agent': 'Mozilla/5.0',
            'Range': f'bytes={start_byte}-{end_byte}'
        }
    )
    
    with urllib.request.urlopen(part_req, timeout=45) as response:
        curr_pos = start_byte
        with open(ZIP_PATH, 'r+b') as out_f:
            out_f.seek(start_byte)
            while curr_pos <= end_byte:
                read_amount = min(64 * 1024, end_byte - curr_pos + 1)
                chunk = response.read(read_amount)
                if not chunk:
                    break
                out_f.write(chunk)
                curr_pos += len(chunk)
                
                with lock:
                    downloaded_bytes += len(chunk)
                    curr_time = time.time()
                    if curr_time - last_report_time >= 2.0 or downloaded_bytes == total_size:
                        elapsed = curr_time - start_time
                        speed_mb = (downloaded_bytes / (1024 * 1024)) / (elapsed if elapsed > 0 else 1)
                        percent = (downloaded_bytes / total_size * 100)
                        print(f"[PROGRESS] {downloaded_bytes / (1024*1024):.1f} MB / {total_size / (1024*1024):.1f} MB ({percent:.1f}%) | Speed: {speed_mb:.2f} MB/s", flush=True)
                        last_report_time = curr_time

print(f"[*] Launching {NUM_THREADS} concurrent download streams...", flush=True)
with ThreadPoolExecutor(max_workers=NUM_THREADS) as executor:
    futures = [executor.submit(download_range, r[0], r[1], r[2]) for r in ranges]
    for future in as_completed(futures):
        future.result()

print(f"\n[+] All streams completed in {time.time() - start_time:.1f}s!", flush=True)

# 2. Verify Zip Integrity
print(f"[*] Verifying Zip integrity (CRC32 checksum check)...", flush=True)
with zipfile.ZipFile(ZIP_PATH, 'r') as zf:
    bad_file = zf.testzip()
    if bad_file is not None:
        print(f"[ERROR] Corrupted file found in archive: {bad_file}", flush=True)
        sys.exit(1)
    
    namelist = zf.namelist()
    print(f"[+] Zip integrity 100% verified! Archive contains {len(namelist):,} valid entries.", flush=True)
    print(f"[*] Extracting archive into {TARGET_DIR}...", flush=True)
    
    extract_start = time.time()
    for idx, member in enumerate(namelist):
        parts = member.split('/')
        if len(parts) > 1 and 'ptb-xl' in parts[0].lower():
            rel_path = os.path.join(*parts[1:])
        else:
            rel_path = member
        
        if not rel_path:
            continue
            
        dest_path = os.path.join(TARGET_DIR, rel_path)
        if member.endswith('/'):
            os.makedirs(dest_path, exist_ok=True)
        else:
            os.makedirs(os.path.dirname(dest_path), exist_ok=True)
            with zf.open(member) as source, open(dest_path, 'wb') as target:
                target.write(source.read())
        
        if (idx + 1) % 5000 == 0 or (idx + 1) == len(namelist):
            print(f"[*] Extracted {idx + 1:,} / {len(namelist):,} files...", flush=True)

    print(f"[+] Extraction complete in {time.time() - extract_start:.1f}s!", flush=True)

# 3. Final Verification
r100_dir = os.path.join(TARGET_DIR, "records100")
dat_count = sum(len([f for f in files if f.endswith('.dat')]) for _, _, files in os.walk(r100_dir))
print(f"[+] Total records100 .dat files verified on disk: {dat_count:,} / 21,837", flush=True)

if os.path.exists(ZIP_PATH):
    os.remove(ZIP_PATH)
    print(f"[+] Temporary zip archive removed.", flush=True)

print("\n[SUCCESS] Entire uncorrupted PTB-XL dataset is ready!", flush=True)
