import zipfile
import hashlib
from pathlib import Path

zip_path = Path("LunarSafe_Claude_Handoff_v3.zip")
with zipfile.ZipFile(zip_path, "r") as z:
    namelist = z.namelist()
    print(f"Total files in zip: {len(namelist)}")
    
    print("\n--- FIRST 50 ENTRIES ---")
    for i, name in enumerate(namelist[:50], 1):
        info = z.getinfo(name)
        print(f"{i:2d}. {name} ({info.file_size:,} bytes)")
        
    print("\n--- CHECKING REQUIRED FILES ---")
    required = [
        "src/lib/imageProcessor.ts",
        "src/lib/sessionIntegrity.ts",
        "src/lib/encryption.ts",
        "src/lib/digitalSignature.ts",
        "src/lib/isroPds4Parser.ts",
        "src/lib/isroImageLoader.ts",
        "src/lib/scanReportGenerator.ts",
        "src/App.tsx",
        "src/components/ScanHistoryTable.tsx",
        "server.ts",
        "tests/security.test.ts",
        "tests/isroData.test.ts",
        "tests/determinism.test.ts",
    ]
    for r in required:
        present = r in namelist
        status = "PRESENT" if present else "MISSING"
        flag = "PASS" if present else "FAIL"
        print(f"[{flag}] {r}: {status}")
        
    print("\n--- CHECKING EXCLUDED FILES ---")
    forbidden_prefixes = ["node_modules/", "dist/", ".git/", "scratch/", ".cache/"]
    forbidden_exact = [".env", ".scan_history.json", ".scan_history.enc", ".signing_key.pem"]
    
    violations = []
    for name in namelist:
        for prefix in forbidden_prefixes:
            if name.startswith(prefix):
                violations.append(name)
        if name in forbidden_exact:
            violations.append(name)
        if name.endswith(".img"):
            violations.append(name)
            
    if violations:
        print("VIOLATIONS FOUND:", violations)
    else:
        print("NO FORBIDDEN FILES FOUND. All exclusions verified.")
        
    print("\n--- CHECKING IMAGEPROCESSOR.TS INSIDE ZIP ---")
    data = z.read("src/lib/imageProcessor.ts")
    h = hashlib.sha256(data).hexdigest().upper()
    print(f"Size: {len(data):,} bytes (Target: 41,408 bytes)")
    print(f"SHA256: {h}")
    print(f"Hash match: {h == 'EB4D61367E6BD4855C8FF38A0E58869B80BD2E6C16713DCA9334E3AAF643C715'}")
