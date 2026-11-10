# LunarSafe 2.0 - Independent Verification Guide

This guide enables judges, auditors, and independent reviewers to rigorously verify the code integrity, deterministic reproducibility, and cryptographic artifact checksums of LunarSafe 2.0.

> [!NOTE]
> Hashes cannot be decoded; they are recomputed and compared. A passing check shows reproducibility, not physical correctness.

---

## 6-Level Verification Matrix

| Level | Verification Target | Linux / macOS Command | Windows (PowerShell) Command | Expected Outcome |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Git Branch & HEAD** | `git branch --show-current && git log -1 --oneline` | `git branch --show-current; git log -1 --oneline` | `nasa-submission` branch, clean working tree |
| **2** | **Core Engine File Integrity** | `node -e "const fs=require('fs'),c=require('crypto'),d=fs.readFileSync('src/lib/imageProcessor.ts','utf8').replace(/\r\n/g,'\n');console.log(Buffer.byteLength(d),c.createHash('sha256').update(d).digest('hex'))"` | `node -e "const fs=require('fs'),c=require('crypto'),d=fs.readFileSync('src/lib/imageProcessor.ts','utf8').replace(/\r\n/g,'\n');console.log(Buffer.byteLength(d),c.createHash('sha256').update(d).digest('hex'))"` | `42045` bytes<br>`c50568bd719eb755d702a5debdba0785e95b9f6422504be5295cfea07543570b` |
| **3** | **3x Determinism Test Suite** | `npm run test:determinism` | `npm run test:determinism` | `ALL TESTS PASSED (100% AUDIT SATISFIED)` with 3 bit-identical passes |
| **4** | **Evidence Files Checksums** | `cd evidence && sha256sum -c SHA256SUMS.txt` | `npm run verify:evidence` | `aa652579...` (`telemetry_scan.json`)<br>`7217a9a0...` (`telemetry_scan.csv`)<br>`757ed54f...` (`mission_report.pdf`)<br>`6a74e842...` (`rank_matrix_tolerance10.csv`) |
| **5** | **Cryptographic Stage Hashes** | `node -e "const j=JSON.parse(fs.readFileSync('evidence/telemetry_scan.json'));console.log(j.evidence)"` | `node -e "const j=JSON.parse(fs.readFileSync('evidence/telemetry_scan.json'));console.log(j.evidence)"` | Stage 1: `fcb622e0...`<br>Stage 2: `f28a0edc...`<br>Stage 3: `bfd4a138...`<br>Stage 4: `8e3f02a2...` |
| **6** | **TypeScript & Build Check** | `npx tsc --noEmit && npm run build` | `npx tsc --noEmit; npm run build` | Exit code 0, 0 compiler errors |

---

## Detailed Step-by-Step Instructions

### Level 1: Git Branch and Working Tree
Confirm you are inspecting the official submission branch:
```bash
git branch --show-current
git log -1 --oneline
```
- **Expected Branch**: `nasa-submission`
- **Working Tree**: Clean (no uncommitted modifications).

---

### Level 2: Core Engine Code Integrity
LunarSafe's mathematical and cryptographic engine resides entirely in `src/lib/imageProcessor.ts`. Ensure this file has not been altered:
```bash
node -e "const fs=require('fs'),c=require('crypto'),d=fs.readFileSync('src/lib/imageProcessor.ts','utf8').replace(/\r\n/g,'\n');console.log('Bytes:',Buffer.byteLength(d),'SHA-256:',c.createHash('sha256').update(d).digest('hex'))"
```
- **Canonical LF Byte Count**: `42045`
- **Canonical LF SHA-256**: `c50568bd719eb755d702a5debdba0785e95b9f6422504be5295cfea07543570b`

---

### Level 3: Deterministic Reproducibility Test
Run the automated determinism harness:
```bash
npm run test:determinism
```
- **Expected Output**:
  - Run 1, Run 2, and Run 3 produce identical hashes for all stages (`inputImageHash`, `slopeMapHash`, `gridClassificationHash`, `candidateZonesHash`).
  - `ALL TESTS PASSED (100% AUDIT SATISFIED)`.

---

### Level 4: Evidence Files Cryptographic Checksums
Validate the 4 official artifacts in `evidence/` against `evidence/SHA256SUMS.txt`:
```bash
npm run verify:evidence
```
Or directly using standard utilities:
- **Linux/macOS**:
  ```bash
  cd evidence && sha256sum -c SHA256SUMS.txt
  ```
- **PowerShell**:
  ```powershell
  Get-FileHash evidence/* -Algorithm SHA256
  ```

**Expected Checksums:**
```text
aa652579e74a8c4d1e241c85b4e43acc40038b32ef0267a5b559e22ad21b9979  telemetry_scan.json
7217a9a0fd1ec85f3f9408d2dfda40e5d69ca8c457d65cf978e7fd02c20a5cb0  telemetry_scan.csv
757ed54fdf0ea24a1df07896109ce6d5800e52aebf5f96f95eeaf8d61b9d1ab4  mission_report.pdf
6a74e842d0c53dde27093112739cd004ddb0e39ade868276e59a82f580910b69  rank_matrix_tolerance10.csv
```

---

### Level 5: Cryptographic Stage Hashes in Telemetry
Inspect the tamper-evident execution trail stored in `evidence/telemetry_scan.json`:
```bash
node -e "const j=JSON.parse(fs.readFileSync('evidence/telemetry_scan.json'));console.log(JSON.stringify(j.evidence, null, 2))"
```
**Expected Hashes:**
- `inputImageHash`: `fcb622e0c414539dad7b3ffac8b8b99b7da81ba59407a338b4532cf61ce7fb23`
- `slopeMapHash`: `f28a0edce38c66060b2714c43bef3216fbbd0244139e7550a4b6aa3c5d707b7a`
- `gridClassificationHash`: `bfd4a138861e05125a8e8399a887069ab140a79fb0793755b8b6823d223c56ab`
- `candidateZonesHash`: `8e3f02a2159b86b09cbae59fc2b1871154f5c0536e872f1d6cf0b6f22f65a58d`

*(Note: The session seal field is present in the schema but was not populated in this export run.)*

---

### Level 6: Compilation & Build Validation
Verify full type safety and production build compilation:
```bash
npx tsc --noEmit
npm run build
```
- **Exit Code**: `0`
- **Compiler Errors**: `0`
