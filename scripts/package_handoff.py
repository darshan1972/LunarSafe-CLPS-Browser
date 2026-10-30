import os
import zipfile
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
OUTPUT_ZIP = ROOT_DIR / "LunarSafe_Verified_Handoff.zip"

EXCLUDE_DIRS = {
    "node_modules",
    ".git",
    "__pycache__",
    ".pytest_cache",
    ".system_generated",
    "temp_extract",
}

EXCLUDE_EXTENSIONS = {
    ".pyc",
}

def should_exclude(rel_path: Path) -> bool:
    # Exclude specific directories
    for part in rel_path.parts:
        if part in EXCLUDE_DIRS:
            return True
    # Exclude zip files in the root or generated files
    if rel_path.suffix == ".zip" and len(rel_path.parts) == 1:
        return True
    if rel_path.suffix in EXCLUDE_EXTENSIONS:
        return True
    return False

print(f"Packaging LunarSafe project from {ROOT_DIR}...")
print(f"Output: {OUTPUT_ZIP}")

file_count = 0
total_uncompressed_bytes = 0

with zipfile.ZipFile(OUTPUT_ZIP, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zipf:
    for root, dirs, files in os.walk(ROOT_DIR):
        # Prune excluded directories in-place
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        for file in files:
            full_path = Path(root) / file
            rel_path = full_path.relative_to(ROOT_DIR)
            
            if should_exclude(rel_path):
                continue
                
            zipf.write(full_path, str(rel_path))
            file_count += 1
            total_uncompressed_bytes += full_path.stat().st_size

zip_size_bytes = OUTPUT_ZIP.stat().st_size
zip_size_mb = zip_size_bytes / (1024 * 1024)

print("\n--- PACKAGING COMPLETE ---")
print(f"Archive:               {OUTPUT_ZIP.name}")
print(f"Archive Size:          {zip_size_bytes:,} bytes ({zip_size_mb:.2f} MB)")
print(f"Files Packaged:        {file_count}")
print(f"Uncompressed Data:     {total_uncompressed_bytes:,} bytes ({total_uncompressed_bytes / (1024 * 1024):.2f} MB)")
print(f"Verification Check:    File exists = {OUTPUT_ZIP.exists()}")
