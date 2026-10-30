# LunarSafe: Deterministic Lunar Landing Hazard Detection & Verification System

Team Rocket · AEROX Club · Parul University · Project Head: Darshan Patil

> **Problem Statement ID**: Developed for **SIH1732** (*Enhancement of Permissible Slope and Hazard Assessment for Safe Lunar Landing*, ISRO) / cross-referenced as **SIH1519** in preliminary problem indexes.

LunarSafe is an aerospace-grade mission analysis and landing hazard assessment workstation developed for high-resolution orbital imagery (Chandrayaan-2 TMC-2 / OHRC, LROC NAC, and NASA LOLA DEMs). It pairs a strictly deterministic computer vision pipeline with scoped external AI modules and cryptographic verification.

> [!IMPORTANT]
> **Physical Slope vs. Intensity Proxy**: The Sobel-based slope computed from 2D panchromatic optical images is an intensity gradient proxy, not physical slope. Physical slope requires a Digital Elevation Model (DEM) and is computed via Horn's (1981) finite-difference method. Only the DEM/Horn path is physical.

---

## 1. System Architecture

LunarSafe is organized into four modular layers with clear separation between deterministic flight-physics logic and external AI:

1. **Deterministic CV Engine (`src/lib/imageProcessor.ts`, 41,408 bytes, frozen, zero AI)**:
   - Evaluates orbital terrain topography, surface slope gradients, boulder distributions, and crater hazard boundaries.
   - Operates strictly on deterministic mathematical algorithms (Sobel spatial convolutions, Horn gradient estimators, morphological feature tracking, and BFS contiguous flood-fills).
   - Zero neural networks, zero probabilistic heuristics, zero floating hallucinations. Every run on identical input produces identical bits.

2. **Real Gemini AI Modules (Scoped, External, Clearly Labeled)**:
   - **Gemini Vision Validator**: Receives raw base64 orbital imagery to perform broad geological morphology checks (confirming genuine lunar regolith vs terrestrial images). Strictly cannot compute or alter numeric slopes or hazard statistics.
   - **Gemini Narrative Generator**: Translates deterministic scan numbers into a concise 3-sentence plain-English executive briefing for flight controllers.
   - Isolated behind explicit API routes (`/api/gemini/validate`, `/api/gemini/narrative`) and clearly labeled in UI and logs as non-deterministic external AI.

3. **Agent OM State Reasoner (Live Telemetry & Deterministic Dispatch)**:
   - State-aware planetary science co-pilot reading live project telemetry (`ProjectState`).
   - Reads `.scan_history.json`, dynamic component health, file hashes, and runtime environment.
   - Maps user queries across 6 discrete intent classes (`LAST_SCAN`, `COMPONENT_STATUS`, `HASH_CHAIN`, `RECOMMENDATION`, `ENVIRONMENT`, `OUT_OF_SCOPE`).

4. **Cryptographic Audit Trail (4 SHA-256 Stages)**:
   - Maintains an immutable cryptographic hash chain sealing each computation stage: Input Raw Image -> Calibrated Slope Map -> 24m Grid Classification -> Candidate Touchdown Zones.

---

## 2. What This System Does NOT Do (MANDATORY DISCLAIMER)

- **Does NOT run on flight hardware**: LunarSafe is a ground-segment mission planning and post-flight telemetry audit tool. It is not onboard flight avionics firmware.
- **Does NOT use AI for slope calculation or hazard classification**: All slopes, hazard masks, crater counts, boulder profiles, and landing zone rankings are computed 100% deterministically by classical CV algorithms.
- **Does NOT have real-time ISRO telemetry**: Operates on archived PDS4 Chandrayaan-2/3 product labels, public planetary datasets, and validated calibration swaths.
- **Does NOT replace ISRO onboard LHDAC**: Chandrayaan-3's onboard Lander Hazard Detection and Avoidance Camera (LHDAC) executes specialized real-time spacecraft guidance during powered descent. LunarSafe serves as an independent pre-mission analysis and post-scan verification platform.
- **No boulder detection from YOLO**: The current HuggingFace model only has one class ('crater'). Boulder detection currently relies only on the classical CV pipeline.
- **The YOLO sidecar is not certified for operational use**: It is a research and comparison benchmark only.

---

## External YOLO AI Benchmark (Optional Sidecar)

LunarSafe includes an OPTIONAL external Python sidecar for YOLO-based crater detection. This is a BENCHMARK service, NOT part of the deterministic hash chain.

### What it is
- A FastAPI service running on port 8000
- Uses YOLOv5 (ultralytics/yolov5) with the HuggingFace model `Gurveer05/moon-crater-boulder-detection-yolov5`
- Detects craters with high confidence (85-95%)
- Output is for comparison only — it does NOT modify the deterministic hazard classification

### What it is NOT
- Not part of the 4-stage SHA-256 hash chain
- Not used to compute slope, safe area, or landing recommendations
- Not deterministic (CPU float non-associativity applies)
- Detected 7 craters on TMC-2 sample vs 87 from classical CV (different criteria, both correct)

### How to run
```bash
cd lunar-ai-sidecar
python -m uvicorn main:app --port 8000
```

### Endpoints
- `GET /health`: Health check returning model status, device (`cpu`), and class mapping (`{0: 'crater'}`).
- `POST /detect`: Accepts multipart form image uploads (`file`), runs YOLOv5 inference, and returns detected bounding boxes, confidence scores, and crater count.
- `POST /upscale`: Placeholder endpoint for super-resolution.

### Architecture
- Standalone FastAPI server running on port 8000.
- Decoupled from the Node/Express core server on port 5000.
- Express server acts as a reverse proxy via `POST /api/ai/detect`, converting base64 client payloads to multipart form data and forwarding to the sidecar.
- Results are displayed in an isolated purple dashboard drawer, clearly separated from the 4-stage deterministic cryptographic ledger.

### Dependencies
- Python 3.11+
- `fastapi`, `uvicorn[standard]`, `python-multipart`
- `torch`, `torchvision`, `yolov5`
- `dill`, `pillow`, `numpy`, `huggingface_hub`

---

## 3. Cryptographic Determinism Specification

Every scan generates a sequential cryptographic ledger consisting of 4 distinct SHA-256 stage hashes:

- **Stage 1 (Raw Input Buffer)**: SHA-256 of the raw binary image payload bytes.
- **Stage 2 (Slope Gradient Map)**: SHA-256 of the raw `Float32Array` slope array (radians converted to degrees).
- **Stage 3 (24m Grid Classification)**: SHA-256 of serialized boolean cell safety masks and mean slope fields.
- **Stage 4 (Touchdown Candidate Zones)**: SHA-256 of BFS contiguous safe zone clusters, coordinates, and rankings.

Verification Command:
```bash
npm run test:determinism
```
Baseline Golden Hashes (Chandrayaan-2 TMC-2 Nadir Strip, `src/assets/samples/ch2_tmc2_south_pole.png`):
- Stage 1 Input: `fcb622e0c414539dad7b3ffac8b8b99b7da81ba59407a338b4532cf61ce7fb23`
- Stage 2 Slope: `f28a0edce38c66060b2714c43bef3216fbbd0244139e7550a4b6aa3c5d707b7a`
- Stage 3 Grid:  `bfd4a138861e05125a8e8399a887069ab140a79fb0793755b8b6823d223c56ab`
- Stage 4 Zones: `8e3f02a2159b86b09cbae59fc2b1871154f5c0536e872f1d6cf0b6f22f65a58d`

### Grid Cell Geometry & Resolution Scaling
Raster grid cells dynamically discretize continuous terrain into integer pixel kernels:
- **Raster Cell Pixel Count**: $\text{pixelCount} = \lfloor \frac{\text{cellMeters}}{\text{GSD}} \rfloor$
- **Actual Cell Dimension**: $\text{actualCellMeters} = \text{pixelCount} \times \text{GSD}$
- **Actual Cell Area**: $\text{cellAreaM2} = \text{actualCellMeters}^2$

Examples across sensor modalities:
- **TMC-2 Nominal (GSD = 5.0 m/px)**: $\lfloor 24 / 5 \rfloor = 4\text{ px} \implies 20\text{m} \times 20\text{m} = 400\text{ m}^2$
- **TMC-2 Calibrated (GSD = 6.4 m/px)**: $\lfloor 24 / 6.4 \rfloor = 3\text{ px} \implies 19.2\text{m} \times 19.2\text{m} = 368.64\text{ m}^2$
- **OHRC High-Res (GSD = 0.25 m/px)**: $\lfloor 24 / 0.25 \rfloor = 96\text{ px} \implies 24\text{m} \times 24\text{m} = 576\text{ m}^2$

Reported cell dimensions and safe zone footprints strictly reflect the physical coverage of the discretized raster cells.

### ISRO PDS4 Raw Raster Ingestion & Dynamic-Range Calibration
The bug was a dynamic-range assumption error. The loader divided raw pixel values by 65,535, but the sensor's actual dynamic range for this observation was only ~9–455. This crushed all pixels to near-zero, producing a blank image. The fix applies a 2-sigma dynamic-range stretch with gamma correction (gamma = 0.43), computed from the tile's actual mean and standard deviation.

---

## 4. Scientific Ground Truth Validation

LunarSafe's Horn slope estimation engine is validated against published lunar topographic datasets from NASA Lunar Reconnaissance Orbiter (LRO) LOLA DEMs:

| Site | Location | Sensor / Product | Horn Mean Slope | Published Slope | Absolute Error of Mean Slope (\|Bias\|) | Source & Citation | Evidence Strength |
|---|---|---|---|---|---|---|---|
| **Apollo 11 Landing Site** | Mare Tranquillitatis (0.67°N, 23.47°E) | LOLA 64 PPD Float32 DEM | 1.22° | 1.30° | 0.08° | Rosenburg et al. (2011, JGR 116, E02001, Table 1 mare plains 1.1°–1.5° midpoint: 1.30°) | Strong (Direct published range midpoint) |
| **Shiv Shakti Point** | Chandrayaan-3 Site (69.37°S, 32.35°E) | LOLA South Pole 60m DEM | 2.33° | 2.00° | 0.33° | Durga Prasad et al. (2023, Current Science 125(7), modal bin 2°–3° lower bound) | Medium (Regional modal estimate) |
| **Shackleton Crater Rim** | Lunar South Pole (89.9°S, 0.0°E) | LOLA Polar 20m DEM | 32.42° | 31.00° | 1.42° | Zuber et al. (2012, Nature 486, direct quote: "slopes of >30°") | Strong (Published peer-reviewed text) |
| **Apollo 17 South Massif** | South Massif Rim | LOLA 64 PPD Float32 DEM | 9.98° | N/A | N/A | CHOSEN_FOR_SENSITIVITY_TEST_not_ground_truth | Synthetic / Sensitivity Calibration |

*Note on Evaluation Metric: The benchmark compares the scalar mean slope of the DEM with the single published scalar ground-truth reference slope. Therefore, this metric is mathematically the absolute error of mean slope ($|\bar{\theta}_{\text{Horn}} - \bar{\theta}_{\text{pub}}|$), which equals the absolute bias ($|\text{Bias}|$). It is not an N-pixel spatial RMSE. (When evaluated against the 1.20° lower-mare estimate, Apollo 11 absolute bias is 0.02°).*

Verification Command:
```bash
npm run test:groundtruth
```

---

## 5. Uncertainty Quantification

Digital Elevation Models are subject to vertical measurement uncertainty. Following Smith et al. (2010, GRL 37, L02201, doi:10.1029/2009GL041746), LOLA altimetry has a vertical standard deviation $\sigma_z = 1.0\text{ m}$.

### Analytical Error Propagation
Applying first-order error propagation to Horn's finite-difference slope equation:
$$\sigma_{\text{slope}} = \frac{\sqrt{3} \cdot \sigma_z}{4 \cdot \text{GSD}} \cos^2(S) \times \frac{180}{\pi}$$

where $S$ is the local slope angle in radians, and GSD is the ground sample distance in meters per pixel.

### Conservative Hazard Classification
A cell is classified as safe only when its 95% upper confidence bound meets the safety threshold $\theta$:
$$\text{Cell Safe} \iff \bar{\theta} + k \cdot \sigma_{\text{slope}} \le \theta_{\text{safe}} \quad (k=2.0)$$

### Real-DEM Impact & Sensitivity
- **Flat Maria / Regional Plains (Shiv Shakti Point)**: Nominal slope is $2.33^\circ \ll 10^\circ$. Uncertainty filtering changes 7 cells out of 4,096 ($0.17\%$).
- **Marginal Terrain Sensitivity (Apollo 17 Rim)**: For terrain hovering near the critical threshold (Apollo 17 South Massif Rim, mean slope 9.98°), uncertainty propagation filters **150 cells out of 2,224 safe cells (6.74% reduction)**, preventing landings on false-safe boundary zones.

---

## 6. Module Execution States

The application runtime transparently distinguishes and displays execution states:

- **Group 1: Deterministic CV Engine (Zero AI Claim)**
  - Always runs on the client/worker thread. 100% reproducible and bit-identical.
  - Submodules: Panchromatic Pre-Filter, Sobel Gradient Estimator, 24m Grid Classifier, BFS Zone Extractor, Cryptographic Sealer.
- **Group 2: Scoped Gemini AI Modules (No Number Inventions)**
  - Strictly external and opt-in via user interaction.
  - Submodules: Gemini Vision Validator, Gemini Mission Narrative Generator.
  - Labeled prominently in UI drawers: *"External AI — Not Deterministic"*.

---

## 7. Agent OM Architecture

Agent OM is a rule-based state-aware reasoner grounded strictly in system telemetry:

- **`ProjectState` Interface**: Dynamically reads `.scan_history.json`, dynamic `imageProcessor.ts` SHA-256 and byte size, uncertainty module status, Gemini configuration state, Node version, and platform.
- **Intent Classification (`src/lib/agentIntent.ts`)**:
  1. `LAST_SCAN`: Queries last scan telemetry, hazard counts, safe zones, mean slope, and hash chain.
  2. `COMPONENT_STATUS`: Reports real-time health and sha256 checksums of internal engines.
  3. `HASH_CHAIN`: Returns 4-stage cryptographic seals.
  4. `RECOMMENDATION`: Derives flight GO/CAUTION/ABORT recommendations based strictly on verified scan metrics.
  5. `ENVIRONMENT`: Inspects server host platform, Node runtime, and network ports.
  6. `OUT_OF_SCOPE`: Gracefully declines non-mission trivia (e.g. "What is the capital of France?").

---

## 8. Quick Start

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0

### Installation & Execution
```bash
# 1. Install dependencies
npm install

# 2. Run local development server (Vite frontend on :3000)
npm run dev

# 3. Run production build & full backend (:5000)
npm run serve
```

---

## 9. Reproduction

Run the full automated end-to-end verification pipeline:

```powershell
# Windows PowerShell
.\reproduce.ps1

# Linux / macOS Bash
chmod +x reproduce.sh
./reproduce.sh
```

The script executes all 10 verification steps sequentially:
1. `npm install`
2. `npm run test:determinism` (seals 4 golden hashes)
3. `npm run test:gsd` (GSD resolution validation)
4. `npm run test:dem` (Horn slope analytical tests)
5. `npm run test:groundtruth` (NASA LOLA benchmark)
6. `npm run test:uncertainty` (Analytical error propagation)
7. `npm run test:hazardconservative` (Conservative classification)
8. `npm run test:marginal` (Threshold-proximity sensitivity analysis)
9. `npm run test:agentom` (State-aware reasoner queries A, B, C)
10. `npm run build` (Production compilation)

---

## 10. Docker Deployment

### Docker Configuration
- Base Image: `node:20-slim`
- Multi-port exposure: `5000` (API & Telemetry) and `3000` (Frontend)
- Volume mount: `./data:/app/data` for scan records and generated PDF reports

### Build & Run
```bash
# Build standalone image
docker build -t lunarsafe:1.0.0 .

# Run with docker-compose
docker-compose up -d
```

### Environment Variables (`.env` or compose)
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
PORT=5000
```

---

## Security Features

LunarSafe includes three cryptographic security features that work 
on commodity hardware. No TEE, no cloud, no special hardware required.

### 1. 5-Stage Hash Chain

Stages 1-4: Deterministic pipeline (input, slope, grid, zones)
Stage 5: Session Integrity (timestamp, device ID, software version)

The 5-stage chain provides a complete audit trail. Stage 5 records 
the session metadata at the time of processing.

### 2. Encrypted Scan History (AES-256-GCM)

Scan history can be encrypted with AES-256-GCM using PBKDF2 key 
derivation (100,000 iterations, SHA-256, 16-byte salt). Set these 
environment variables to enable:

ENCRYPT_SCAN_HISTORY=true
ENCRYPT_SCAN_PASSWORD=your-strong-password

When disabled, scan history is stored as plaintext JSON (backward 
compatible).

### 3. Digitally Signed PDF Reports (Ed25519)

Every PDF report can be digitally signed with Ed25519. The signature 
can be independently verified using the embedded public key.

Signing is performed via POST /api/report/sign.
Verification is performed via POST /api/report/verify.

### Honest Limitations

- Session integrity hash is not hardware-backed
- Password strength depends on user's choice
- Private key is stored locally as a PEM file
- This is NOT a TEE — no hardware isolation
- Not certified by ISRO, NASA, or any space agency

---

## 11. Team & Project Information

- **Project**: LunarSafe Autonomous Planetary Landing Hazard Detection System
- **Organization**: Team Rocket · AEROX Club · Parul University
- **Project Head**: Darshan Patil
- **Affiliation**: Centre of Excellence in Space Science & Technology, Faculty of Engineering & Technology, Parul University, Vadodara, Gujarat, India.
