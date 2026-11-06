# Evidence & Sample Outputs: LunarSafe 2.0

This directory contains real, authentic sample telemetry outputs exported from the live build of LunarSafe 2.0 for external auditor and judge verification.

## 1. Generation Metadata
- **Input Sample**: `src/assets/samples/ch2_tmc2_south_pole.png` (ISRO Chandrayaan-2 TMC-2 South Polar Strip & Corridor Profile, 512×512 px, 110,426 bytes)
- **Generation Date**: 2026-11-06
- **Git Commit Hash at Generation Time**: `610ddf0a3d6727445b35fb991ab15c9b34f5811c`
- **Frozen Engine Metrics (`src/lib/imageProcessor.ts`)**:
  - Byte Count: `42045` bytes
  - SHA-256 Checksum: `c50568bd719eb755d702a5debdba0785e95b9f6422504be5295cfea07543570b`

---

## 2. Cryptographic Pipeline Stage Hashes
Recorded in [`telemetry_scan.json`](./telemetry_scan.json) for scan ID `scan-1793935884992-fcb622e0`:

| Pipeline Stage | Stage Hash (SHA-256) |
|---|---|
| **Stage 1: Input Buffer** (`inputImageHash`) | `fcb622e0c414539dad7b3ffac8b8b99b7da81ba59407a338b4532cf61ce7fb23` |
| **Stage 2: Calibrated Slope Map** (`slopeMapHash`) | `f28a0edce38c66060b2714c43bef3216fbbd0244139e7550a4b6aa3c5d707b7a` |
| **Stage 3: 24m Grid Classification** (`gridClassificationHash`) | `bfd4a138861e05125a8e8399a887069ab140a79fb0793755b8b6823d223c56ab` |
| **Stage 4: Candidate Landing Zones** (`candidateZonesHash`) | `8e3f02a2159b86b09cbae59fc2b1871154f5c0536e872f1d6cf0b6f22f65a58d` |

### Comparison with `npm run test:determinism`
To independently verify bit-for-bit identity against the automated CLI test suite:
```bash
npm run test:determinism
```
Compare the output under `--- EXECUTING 3 CONSECUTIVE PASSES ---`. Every stage hash above matches the 3 passes in `test:determinism` bit-for-bit.

---

## 3. Important Attestations & Disclaimers
1. **Digital Signature Status**: The PDF report is NOT digitally signed; it contains hash digests only.
2. **AI Scope**: The two Gemini modules appear with status IDLE; no AI output is included.
3. **Consistency vs Physical Truth**: The hashes demonstrate consistency and integrity, not physical correctness.
4. **Rank Matrix Methodology**: The rank matrix uses illustrative per-site slope, lighting and Earth-visibility estimates and a heuristic index; it is not a Horn-computed result.

---

## 4. Exact Steps to Regenerate
1. Build the production application bundle:
   ```bash
   npm run build
   ```
2. Launch the backend server:
   ```bash
   npm run serve
   ```
3. In a web browser, navigate to `http://localhost:5000`.
4. Click **SPACE BAG** in the header, locate **ISRO TMC-2 South Polar Strip & Corridor Profile** (`src/assets/samples/ch2_tmc2_south_pole.png`), and click **SELECT & SCAN**.
5. Once processing completes, scroll to **📋 Scan History & Mission Recommendations** at the bottom of the page.
6. Click the **JSON**, **CSV**, and **PDF** buttons on the resulting scan entry to download `telemetry_scan.json`, `telemetry_scan.csv`, and `mission_report.pdf`.
7. Switch to the **CLPS MISSION BROWSER** view in the top navbar, click **Rank Matrix**, ensure the lander slope tolerance is set to **10.0°**, and click **Export CSV** to download `rank_matrix_tolerance10.csv`.
