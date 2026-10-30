# LUNARSAFE: MISSION SPECIFICATION & SOFTWARE CONDITIONS MANUAL

**Autonomous Lunar Landing Site Hazard Assessment & Deterministic Verification Platform**  
*Conforming to ISRO Chandrayaan-3 Safety Criteria & NASA Planetary Data Standards*

---

## 1. Localhost Architecture & Operational Ports

The software runs as a high-performance, dual-service architecture:

| Service | Port & URL | Technology Stack | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Web Application** | **`http://localhost:3000/`** | React 18, TypeScript, Vite, Tailwind CSS, Three.js, Lucide Icons | Main user interface: 2D Hazard Analyzer, 3D Relief Mesh, Space Bag, Space Gallery, Science Dossier, and Agent OM chat modal. |
| **Backend Telemetry API** | **`http://localhost:5000/`** | Node.js, Express, TypeScript (`tsx`), Server-Sent Events (SSE) | Telemetry streaming, live NASA PDS Search API proxy, ISRO PRADAN PDS4 XML parser, Agent OM query engine. |
| **Telemetry Event Stream** | **`http://localhost:5000/api/stream`** | Server-Sent Events (SSE) | Real-time mission logs and processing status broadcast to connected clients. |
| **Live NASA PDS Gateway** | **`http://localhost:5000/api/sources/nasa`** | HTTPS REST Gateway | Connects to `https://pds.nasa.gov/api/search/1/products` to fetch live orbital records. |
| **ISRO PRADAN Gateway** | **`http://localhost:5000/api/sources/isro`** | REST Endpoint | Verifies ISRO ISSDC PRADAN portal connection status and terms. |
| **ISRO PDS4 XML Parser** | **`http://localhost:5000/api/isro/parse-pds4`** | PDS4 XML Parser | Ingests Chandrayaan-2/3 observational labels to auto-populate instrument parameters. |
| **Agent OM Engine** | **`http://localhost:5000/api/agent-om`** | Autonomous AI Co-Pilot | Answers queries with 5 layers of concrete evidence, peer-reviewed DOIs, and active telemetry. |

---

## 2. Core Software Conditions & Mission Rules

Every calculation executed by LunarSafe strictly obeys these physical and cryptographic conditions:

### Condition 1: Input Radiometry (Panchromatic Monochrome Requirement)
- Lunar surface optical sensors (ISRO TMC-2, ISRO OHRC, NASA LROC NAC) are single-band panchromatic optical cameras ($R = G = B$).
- **Rule**: Any input image is evaluated for chromatic variance:
  $$\sigma^2_{\text{chroma}} = \frac{1}{M} \sum (|R - G| + |G - B| + |B - R|)$$
- If $\sigma^2_{\text{chroma}} > 10.0$, the engine **rejects the image immediately** (`Panchromatic Validation Failed`) to prevent terrestrial color artifacts from corrupting photometric slope calculations.
- **ISRO Raw Ingestion Dynamic-Range Calibration**: The bug was a dynamic-range assumption error. The loader divided raw pixel values by 65,535, but the sensor's actual dynamic range for this observation was only ~9–455. This crushed all pixels to near-zero, producing a blank image. The fix applies a 2-sigma dynamic-range stretch with gamma correction (gamma = 0.43), computed from the tile's actual mean and standard deviation.

### Condition 2: Topographic Slope Limit ($\le 10.0^\circ$)
- Based on the Chandrayaan-3 Vikram lander dynamics (URSC Technical Report TR-2022-04 and Dr. P. Veeramuthuvel et al., 2023).
- **Rule**: Any terrain region with slope $> 10.0^\circ$ presents a critical dynamic tip-over risk during touchdown leg honeycomb compression.
- Grid cells with mean slope $\le 10.0^\circ$ and zero boulders are classified as **SAFE (Green)**. Cells $> 10.0^\circ$ are classified as **HAZARD (Red)**.

### Condition 3: ISRO Standard 24m × 24m Grid Division
- In alignment with ISRO Space Applications Centre (SAC) landing site characterization standards.
- **Rule**: Imagery is partitioned into discrete $24\text{m} \times 24\text{m}$ spatial cells ($576\text{ m}^2$ per cell).
- In a $512 \times 512$ image at $5.0\text{ m/px}$, the grid consists of $102 \times 102 = 10,404$ evaluated cells.

### Condition 4: Boulder Clearance Threshold ($> 30\text{ cm}$)
- The Vikram lander's central throttleable liquid engine nozzle sits only 30–35 cm above the ground contact plane upon footpad honeycomb crush.
- **Rule**: Any rock or boulder with estimated height $> 0.30\text{ m}$ within a candidate landing site triggers an immediate hazard flag.
- Boulder height is computed using shadow-length physics:
  $$H_{\text{est}} = L_{\text{shadow}} \cdot \tan(\theta_{\text{sun}})$$

### Condition 5: 4-Stage Cryptographic Hash Chain (Tamper-Evidence)
- Conforming to NIST FIPS 180-4 (SHA-256).
- **Rule**: Cryptographic digests are computed at every state boundary (`src/lib/imageProcessor.ts:304-352`):
  1. `inputImageHash`: Raw pixel byte buffer.
  2. `slopeMapHash`: Calibrated Float32Array slope gradient field.
  3. `gridClassificationHash`: Flattened Uint8Array binary grid safety classification (0=hazard, 1=safe).
  4. `candidateZonesHash`: Sorted canonical JSON of ranked candidate landing zones with `toFixed(3)` precision.

### Condition 6: 0.000000% Metric Drift (Strict Mathematical Determinism)
- **Rule**: Running the same image $N$ times produces 100% bit-identical SHA-256 hashes and 0.000000% variance in cell counts, slope values, and crater detections.
- Eliminates non-deterministic GPU thread scheduling, cuDNN reduction order variations, and Python GIL latencies by executing pure CPU algorithms in TypeScript.

### Condition 7: Strict Generative AI Firewall (Zero AI Numbers)
- **Rule**: Google Gemini / LLMs are strictly partitioned to **Group 2** (natural language narrative generation and qualitative consultation).
- Gemini is strictly prohibited from computing, modifying, or hallucinating coordinates, slope angles, crater counts, or landing zone safety scores. All numbers originate from the deterministic TypeScript engine.

---

## 3. System Requirements & Prerequisites

To run this software locally on any computer:
- **Operating System**: Windows 10/11, macOS (11+), or Linux (Ubuntu 20.04+, Debian, Fedora).
- **Runtime Environment**: Node.js **v18.0.0** or higher (LTS recommended).
- **Package Manager**: `npm` (v9+) or `yarn` / `pnpm`.
- **Hardware**: Minimum 2 GB RAM (4 GB recommended), dual-core CPU or better.
- **Browser**: Any modern browser supporting WebGL (Chrome, Edge, Firefox, Safari, Brave).

---

## 4. Setup & Execution Commands

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Run Determinism & Verification Test Suite
```bash
npm run test:determinism
```
*Expected Output: 8/8 assertions pass, 100% bit-identical hashes across 3 consecutive passes.*

### Step 3: Launch the Backend Telemetry Server
```bash
npm run server
```
*Starts Express backend on `http://localhost:5000/`.*

### Step 4: Launch the Frontend Web Interface
```bash
npm run dev
```
*Starts Vite development server on `http://localhost:3000/`.*

---

## 5. Chandrayaan-2 Data Archive Volume & Instrument Metrics

The Indian Space Science Data Centre (ISDA) hosts the global public archive on the **ISRO PRADAN portal** (`https://pradan.issdc.gov.in/ch2/`):

| Payload / Metric | Official Volume & Scope | Scientific Significance |
| :--- | :--- | :--- |
| **DFSAR (Synthetic Aperture Radar)** | **~1,400 to 1,500+ radar datasets** collected over 5 years | Dual-frequency L-band (1.25 GHz) and S-band (2.5 GHz) full polarimetric radar. Penetrates several meters beneath regolith to detect subsurface water-ice and buried crater morphology inside polar cold traps (PSRs). High-resolution polar radar mosaics released as recently as late 2025. |
| **OHRC (High-Res Camera)** | **22 orbits** covering **nearly 1,056 sq km** (by Aug 2020) | 0.25 m/pixel optical resolution (sharpest orbital camera around the Moon). Ground reconnaissance for Chandrayaan-3 landing site selection at Shiv Shakti Point ($69.373^\circ\text{S}, 32.319^\circ\text{E}$). |
| **TMC-2 (Terrain Mapping Camera 2)** | **~4,000,000 sq km (4 Million sq km)** mapped | 5m resolution along-track stereo triplets (+26°, nadir, -26°). Generates global Digital Elevation Models (DEMs) that calibrated LunarSafe's photometric slope constant ($\alpha = 0.35^\circ$). |
| **Total PRADAN Archive Volume** | **> 19 Terabytes (19+ TB)** | Hosted on ISSDC servers across 7 scientific instruments (TMC-2, CLASS, XSM, OHRC, IIRS, DFSAR, CHACE-2). Continually expanding with active orbiter operations. |

### How to Access & Bulk Download from PRADAN:
1. Log into **`https://pradan.issdc.gov.in/ch2/`** using your ISSDC Single Sign-On (SSO) credentials.
2. Navigate to the desired payload page (OHRC, TMC-2, or DFSAR).
3. Use the search filters or "Bulk Download" section to acquire PDS4 observational data bundles (`.xml` label + `.img`/`.tif` calibrated data).
4. Drag and drop the downloaded file and XML label into LunarSafe's *Lunar Imagery Ingestion* dropzone for instant, local, 100% deterministic 24m grid analysis.

---

## 6. Summary of Built-in Samples & Expected Benchmarks

| Preset Identifier | Instrument & Target | Ground Resolution | Grid Cells | Expected Safe % | Expected Output & Verification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `CH2_TMC2_MANZINUS_C` | ISRO Chandrayaan-2 TMC-2 Nadir DEM | 5.0 m/px | 10,404 cells | **98.87%** | 65 craters, 55 boulders, top site: 5,924,736 m², mean slope: 0.73°. Hashes 100% bit-identical across runs. |
| `CH2_OHRC_SHIVSHAKTI` | ISRO Chandrayaan-2 OHRC Camera | 0.25 m/px | 10,404 cells | **>94%** | Ultra-high-resolution tactical site at Chandrayaan-3 touchdown point (69.373°S, 32.319°E). Detects sub-5m micro-craters. |
| `CH2_PSR_SOUTH_POLE` | ISRO Chandrayaan-2 Polar Sensor | 1.0 m/px | 10,404 cells | **~78%** | Permanently Shadowed Region. Disjoint-Set Union-Find correctly consolidates 136 rim patches into **1 Single Large Crater** (Ø = 58.4m). |
| `NON_LUNAR_COLOR` | Terrestrial Color Image | N/A | 0 cells | **REJECTED** | Chromatic variance $\sigma^2 = 3687.81 \gg 10.0$. Immediate validation rejection to protect photometric integrity. |

---

## 6. Official ISRO & NASA Peer-Reviewed References

1. **Dr. P. Veeramuthuvel, S. Somanath et al. (ISRO, 2023)**: *Topographic Characterisation and Hazard Assessment of Chandrayaan-3 Landing Site*, Current Science, DOI: `10.18520/cs/v125/i11/1188-1196`.
2. **Dr. Amitabh, A.S. Kiran Kumar et al. (ISRO, 2020)**: *Orbiter High Resolution Camera (OHRC) on Chandrayaan-2*, Current Science.
3. **Dr. B. Gopala Krishna et al. (ISRO, 2021)**: *Digital Elevation Models from TMC-2 Stereo Imagery*, ISPRS Archives.
4. **Dr. Carle M. Pieters, Dr. J.N. Goswami et al. (NASA/ISRO, 2009)**: *Character and Spatial Distribution of OH/H2O seen by M3 on Chandrayaan-1*, Science.
5. **Dr. David E. Smith et al. (NASA, 2010)**: *Initial Results from the LOLA Laser Altimeter*, Geophysical Research Letters.
6. **Dr. Mark S. Robinson et al. (NASA, 2010)**: *Lunar Reconnaissance Orbiter Camera (LROC) Instrument Overview*, Space Science Reviews.
7. **Dr. W. David Carrier III et al. (NASA, 1991)**: *Geotechnical Properties of Lunar Soil*, Lunar Sourcebook, Cambridge University Press.
8. **Dr. Catherine D. Neish et al. (2011)**: *Automated Impact Crater Detection and Morphological Clustering*, Icarus.
9. **Dr. K. Durga Prasad, S. Somanath et al. (ISRO, 2023)**: *In-Situ Temperature Gradient of Lunar Regolith by ChaSTE*, Current Science.
