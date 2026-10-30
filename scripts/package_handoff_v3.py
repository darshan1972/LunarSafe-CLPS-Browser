import os
import zipfile
import hashlib
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
OUTPUT_ZIP = ROOT_DIR / "LunarSafe_Claude_Handoff_v3.zip"

# Strict exclusion sets
EXCLUDE_DIRS = {
    "node_modules",
    "dist",
    ".git",
    "scratch",
    ".cache",
    ".system_generated",
    "__pycache__",
    ".pytest_cache",
    "temp_extract",
}

EXCLUDE_EXACT_FILES = {
    ".env",
    ".scan_history.json",
    ".scan_history.enc",
    ".signing_key.pem",
}

EXCLUDE_EXTENSIONS = {
    ".pyc",
    ".img",  # 392 MB ISRO raw raster
}

# Directories to include recursively
INCLUDE_DIRS = ["src", "tests"]

# Specific root files to include
INCLUDE_ROOT_FILES = [
    "server.ts",
    "package.json",
    "tsconfig.json",
    "vite.config.ts",
    "index.html",
    "README.md",
    "tailwind.config.js",
    "postcss.config.js",
    "package-lock.json",
]

def should_exclude(rel_path_str: str) -> bool:
    parts = rel_path_str.replace("\\", "/").split("/")
    
    # Check directory exclusions
    for p in parts[:-1]:
        if p in EXCLUDE_DIRS:
            return True
            
    filename = parts[-1]
    
    # Check exact file exclusions
    if filename in EXCLUDE_EXACT_FILES:
        return True
        
    # Check extension exclusions (.img, .pyc, .zip)
    ext = os.path.splitext(filename)[1].lower()
    if ext in EXCLUDE_EXTENSIONS:
        return True
    if ext == ".zip":
        return True
        
    return False

print(f"Creating {OUTPUT_ZIP.name}...")
if OUTPUT_ZIP.exists():
    OUTPUT_ZIP.unlink()

files_added = []

with zipfile.ZipFile(OUTPUT_ZIP, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zipf:
    # 1. Add requested root files
    for rfile in INCLUDE_ROOT_FILES:
        full_p = ROOT_DIR / rfile
        if full_p.exists() and not should_exclude(rfile):
            zipf.write(full_p, rfile)
            files_added.append(rfile)
            print(f"  + Added root file: {rfile}")

    # 2. Add include directories (src, tests)
    for idir in INCLUDE_DIRS:
        dir_path = ROOT_DIR / idir
        if not dir_path.exists():
            continue
        for root, dirs, files in os.walk(dir_path):
            # Filter directories
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            for file in sorted(files):
                full_p = Path(root) / file
                rel_p = full_p.relative_to(ROOT_DIR).as_posix()
                if not should_exclude(rel_p):
                    zipf.write(full_p, rel_p)
                    files_added.append(rel_p)

# Calculate SHA256 of the zip file
sha256 = hashlib.sha256()
with open(OUTPUT_ZIP, "rb") as f:
    while chunk := f.read(65536):
        sha256.update(chunk)
zip_hash = sha256.hexdigest().upper()

zip_size_bytes = OUTPUT_ZIP.stat().st_size
zip_size_mb = zip_size_bytes / (1024 * 1024)

print("\n--- PACKAGE GENERATED SUCCESSFULLY ---")
print(f"Full Path: {OUTPUT_ZIP.resolve()}")
print(f"Size:      {zip_size_bytes:,} bytes ({zip_size_mb:.2f} MB)")
print(f"SHA-256:   {zip_hash}")
print(f"Total entries: {len(files_added)}")
