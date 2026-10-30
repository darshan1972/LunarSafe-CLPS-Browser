import os
import zipfile
import hashlib
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
DESKTOP_DIR = Path(os.path.expanduser("~")) / "Desktop"
OUTPUT_ZIP = DESKTOP_DIR / "LunarSafe_Final_Submission_v4.zip"

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
    "dashboard_screenshot.png",
    "dashboard_with_console.png",
    "test_snap.png",
    "modified_test.png",
    "one_pixel_changed.png",
}

EXCLUDE_EXTENSIONS = {
    ".pyc",
    ".img",   # 392 MB raw binary raster
    ".zip",   # do not nest existing zips
}

# Directories to include recursively
INCLUDE_DIRS = ["src", "tests", "scripts"]

# Root files to include
INCLUDE_ROOT_FILES = [
    # PDFs
    "LunarSafe_Methodology.pdf",
    "LunarSafe_Algorithms.pdf",
    "LunarSafe_Validation_Results.pdf",
    "LunarSafe_Error_Analysis.pdf",
    "LunarSafe_Limitations.pdf",
    "LunarSafe_References.pdf",
    "LUNARSAFE_COMPLETE_MASTER_PROJECT_DOSSIER.pdf",
    "LUNARSAFE_COMPLETE_TECHNICAL_DOSSIER.pdf",
    "LunarSafe_ISRO_Cover_Letter.pdf",
    "LunarSafe_Executive_Summary.pdf",
    "LunarSafe_multi_site_validation_report.pdf",
    "LunarSafe_hazard_validation_report.pdf",
    "LunarSafe_full_isro_analysis_report.pdf",
    # Documentation & Specifications
    "README.md",
    "PROJECT_STATE.md",
    "MISSION_SPECIFICATIONS_AND_CONDITIONS.md",
    "LUNARSAFE_COMPLETE_SYSTEM_CONDITION_AND_REAL_EVIDENCE_DOSSIER.md",
    "LUNARSAFE_MASTER_SPECIFICATION_AND_VERIFICATION_DOSSIER.md",
    # HTML dossiers
    "LUNARSAFE_COMPLETE_MASTER_PROJECT_DOSSIER.html",
    "LUNARSAFE_COMPLETE_TECHNICAL_DOSSIER.html",
    "LUNARSAFE_MASTER_SPECIFICATION_AND_VERIFICATION_DOSSIER.html",
    # Config & Core files
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "vite.config.ts",
    "tailwind.config.js",
    "postcss.config.js",
    "server.ts",
    "index.html",
    "reproduce.ps1",
    "reproduce.sh",
    "docker-compose.yml",
    "Dockerfile",
    # Data files in root
    "validation_results.csv",
    "multi_site_validation_results.csv",
    "multi_site_validation_results.json",
]


def should_exclude(rel_path: Path) -> bool:
    for part in rel_path.parts[:-1]:
        if part in EXCLUDE_DIRS:
            return True
    filename = rel_path.name
    if filename in EXCLUDE_EXACT_FILES:
        return True
    if rel_path.suffix.lower() in EXCLUDE_EXTENSIONS:
        return True
    return False


def collect_files():
    files_to_add = {}  # rel_path_str -> full_path

    # 1. Root files
    for rf in INCLUDE_ROOT_FILES:
        full_p = ROOT_DIR / rf
        if full_p.is_file():
            files_to_add[rf.replace("\\", "/")] = full_p

    # 2. Directories
    for d in INCLUDE_DIRS:
        dir_p = ROOT_DIR / d
        if not dir_p.is_dir():
            continue
        for root, dirs, files in os.walk(dir_p):
            dirs[:] = [sub for sub in dirs if sub not in EXCLUDE_DIRS]
            for f in files:
                full_p = Path(root) / f
                rel_p = full_p.relative_to(ROOT_DIR)
                if not should_exclude(rel_p):
                    files_to_add[str(rel_p).replace("\\", "/")] = full_p

    return files_to_add


def main():
    if OUTPUT_ZIP.exists():
        OUTPUT_ZIP.unlink()

    files = collect_files()
    print(f"Collected {len(files)} files to bundle into {OUTPUT_ZIP.name}...")

    # Verification of frozen engine before bundling
    engine_path = ROOT_DIR / "src" / "lib" / "imageProcessor.ts"
    with open(engine_path, "rb") as f:
        engine_bytes = f.read()
    engine_sha = hashlib.sha256(engine_bytes).hexdigest().upper()
    print(f"Engine Size: {len(engine_bytes)} bytes")
    print(f"Engine SHA256: {engine_sha}")
    assert len(engine_bytes) == 41930, f"Expected 41930 bytes, got {len(engine_bytes)}"
    assert engine_sha == "8CA34C558C41F0B324A207A1D758476D397319999313D59A5919E75912882956", f"Engine hash mismatch: {engine_sha}"

    # Verify no big-endian in text files
    banned_words = [b"big-endian", b"readuint16be", b"endianness"]
    for arc_name, full_path in files.items():
        if full_path.suffix.lower() in {".ts", ".js", ".cjs", ".md", ".html", ".json", ".txt"}:
            with open(full_path, "rb") as f:
                content = f.read()
            for bw in banned_words:
                if bw in content.lower():
                    # check if it is in loader context
                    raise ValueError(f"Found '{bw.decode()}' in {arc_name}")

    # Build the zip
    with zipfile.ZipFile(OUTPUT_ZIP, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for arc_name in sorted(files.keys()):
            full_path = files[arc_name]
            zf.write(full_path, arc_name)

    # Compute hash and size
    with open(OUTPUT_ZIP, "rb") as f:
        zip_bytes = f.read()
    zip_size = len(zip_bytes)
    zip_hash = hashlib.sha256(zip_bytes).hexdigest().upper()

    print("\n========================================================")
    print("      LUNARSAFE FINAL SUBMISSION V4 ZIP CREATED         ")
    print("========================================================")
    print(f"Full Path: {OUTPUT_ZIP}")
    print(f"File Size: {zip_size:,} bytes")
    print(f"SHA-256: {zip_hash}")
    print(f"Total Files inside: {len(files)}")


if __name__ == "__main__":
    main()
