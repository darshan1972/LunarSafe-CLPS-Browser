# LunarSafe — Planetary Data Provenance & Ingestion Report

> **Prepared for**: NASA Judges, Technical Reviewers, and Industry Mentors (StarLab, CLPS, Artemis)  
> **Project**: LunarSafe (Autonomous Lunar Landing Site Characterization & Hazard Assessment)  
> **Organization**: Team Rocket · AEROX Club · Parul University  
> **Status**: Open data used under NASA Open Access and ISRO NDSAP/ISSDC policies

---

## 1. Exact Datasets Used

LunarSafe utilizes authentic, calibrated lunar planetary datasets sourced exclusively from **NASA** and **ISRO** missions. Below is the complete catalog of datasets, exact file names, instrument specifications, and their functional representations within the codebase.

### A. NASA Datasets

* **NASA LRO LOLA Lunar South Pole Gridded Digital Elevation Model (GDR)**
  * **Repository Files**: 
    * `public/data/dem_heightmap.png` (Displacement heightmap texture)
    * `public/data/slope_texture.png` (Horn 1981 slope classification texture)
    * `public/data/roughness_texture.png` (Surface roughness index texture)
    * `src/assets/dem/lola_sample.tif` & `lola_sample.png` (Raw 32-bit floating-point DEM sample)
    * `src/assets/dem/lola_sample.meta.json` (Companion geodetic metadata)
  * **Mission**: Lunar Reconnaissance Orbiter (LRO)
  * **Instrument**: Lunar Orbiter Laser Altimeter (LOLA)
  * **Original NASA PDS Identifiers**: `LDEM_875S_20M_FLOAT.IMG`, `LDEM_80S_80M_FLOAT.IMG`
  * **Dataset Representation**: Polar stereographic Digital Elevation Model (DEM) covering lunar latitudes from $84^\circ\text{S}$ to $90^\circ\text{S}$ at up to 20 meters/pixel spatial resolution. It encodes absolute terrain elevation relative to the lunar reference radius ($1,737,400\text{ m}$), utilized to generate displaced 3D terrain meshes, compute physical slope gradients, and derive surface roughness indices.

* **NASA LRO LOLA Specific Landing Site Benchmark DEMs (Ground-Truth Validation)**
  * **Repository Files**:
    * `src/assets/dem/shackleton_lola_dem.tif`, `.png`, `.meta.json`: Shackleton Crater Rim ($89.9^\circ\text{S}, 0.0^\circ\text{E}$), $20\text{ m/pixel}$ GSD, elevation range $81.8\text{ m}$ to $1,108.3\text{ m}$. Validates against the published $31.0^\circ$ rim slope benchmark (Zuber et al., *Nature* 2012).
    * `src/assets/dem/apollo11_lola_dem.tif`, `.png`, `.meta.json`: Apollo 11 Tranquility Base ($0.674^\circ\text{N}, 23.473^\circ\text{E}$), $59.225\text{ m/pixel}$ GSD (`LDEM_512_00N_45N_000_090_FLOAT`). Validates against the published $1.30^\circ$ mare plain slope benchmark (Rosenburg et al., *JGR Planets* 2011).
    * `src/assets/dem/shiv_shakti_lola_dem.tif`, `.png`, `.meta.json`: Chandrayaan-3 Shiv Shakti Point ($-69.373^\circ\text{S}, 32.319^\circ\text{E}$), $35.15\text{ m/pixel}$ GSD (`LDEM_512_90S_45S_000_090_FLOAT`). Validates against the pre-landing $2.0^\circ$ terrain slope baseline (SAC/ISRO 2023).
    * `src/assets/dem/marginal_site_lola_dem.tif`, `.png`, `.meta.json`: Apollo 17 South Massif Rim / Taurus-Littrow ($20.01^\circ\text{N}, 30.66^\circ\text{E}$), $57.38\text{ m/pixel}$ GSD. Benchmarks marginal slope boundary conditions ($8^\circ\text{–}12^\circ$, mean $10.0^\circ$) for sensitivity and uncertainty quantification.
  * **Mission**: Lunar Reconnaissance Orbiter (LRO)
  * **Instrument**: Lunar Orbiter Laser Altimeter (LOLA)
  * **Dataset Representation**: Calibrated 32-bit floating-point elevation matrices (`Float32Array`) used by `src/lib/lolaValidator.ts` and `src/lib/marginalSiteAnalyzer.ts` to mathematically benchmark LunarSafe's slope computation against peer-reviewed ground-truth literature.

* **NASA Artemis III Candidate Landing Regions & CLPS Manifest**
  * **Repository Files**: `public/data/A3_Named_regions.geojson`, `src/data/artemisSitesData.ts`
  * **Mission**: Artemis Program (Artemis III) & Commercial Lunar Payload Services (CLPS)
  * **Instrument / Source**: NASA Artemis III Candidate Landing Regions Announcement & NASA Solar System Treks (Moon Trek)
  * **Dataset Representation**: GeoJSON FeatureCollection detailing all 13 official Artemis III candidate landing regions (Faustini Rim A, Peak Near Shackleton, Connecting Ridge, Connecting Ridge Extension, de Gerlache Rim 1 & 2, de Gerlache-Kocher Massif, Haworth, Malapert Mountain, Leibnitz Beta Plateau, Nobile Rim 1 & 2, and Amundsen Rim). Attributes include selenographic coordinates (latitude, longitude), base elevation ($m$), annual lighting percentages ($71.0\%\text{–}91.5\%$), base slope gradients ($4.9^\circ\text{–}13.8^\circ$), surface roughness indices, and target CLPS mission delivery payloads (IM-1, IM-2 PRIME-1, VIPER/Griffin, Firefly Blue Ghost 2, Draper APEX 1.0).

* **NASA Planetary Data System (PDS) Live Product Search Feed**
  * **Code Module**: `src/lib/nasaPdsClient.ts`
  * **Source**: NASA PDS Central Search REST API (`https://pds.nasa.gov/api/search/1/products`)
  * **Dataset Representation**: Dynamic live queries targeting lunar observational products (`q=(pds:Target_Identification.pds:name eq "Moon")`), verifying real-time access to online PDS4 archive bundles, data file URLs, and XML labels across LRO, LOLA, and Apollo collections.

* **NASA High-Resolution Orbital & Surface Photography Reference Imagery**
  * **Repository Files / Identifiers**:
    * `PIA12892` (`src/assets/samples/ch2_tmc2_south_pole.png` fallback): LROC NAC terraced rim and talus boulder cascades in Bürg Crater ($45.0^\circ\text{N}, 28.2^\circ\text{E}$, $0.50\text{ m/pixel}$).
    * `PIA13132` (`src/assets/samples/ch2_ohrc_touchdown.png` fallback): LROC NAC anorthositic central peak uplift in Bullialdus Crater ($20.7^\circ\text{S}, 22.2^\circ\text{W}$, $0.55\text{ m/pixel}$).
    * `PIA14317`: LROC NAC high-resolution oblique perspective of Tycho Crater central peak ($43.31^\circ\text{S}, 11.36^\circ\text{W}$, $1.5\text{ m/pixel}$).
    * `GSFC_20171208_Archive_e001928`: LOLA polar geodetic elevation map of Shackleton Crater.
    * `as11-37-5458`: Apollo 11 Hasselblad 70mm close-up of LM Eagle footpad resting on lunar regolith ($0.674^\circ\text{N}, 23.473^\circ\text{E}$).
    * `as15-82-11082`: Apollo 15 Hasselblad 70mm telephoto view of fresh impact crater rim and ejecta boulder field ($26.13^\circ\text{N}, 3.63^\circ\text{E}$).
    * `as15-91-12366`: Apollo 15 Metric Mapping Camera 3-inch frame of Crater Posidonius rilles ($31.8^\circ\text{N}, 29.9^\circ\text{E}$).
    * `as17-140-21497`: Apollo 17 Hasselblad 70mm frame of Station 6 fragmented boulder and rolling boulder track at North Massif ($20.19^\circ\text{N}, 30.77^\circ\text{E}$).
  * **Mission**: Lunar Reconnaissance Orbiter (LROC NAC) and Apollo Expeditions (11, 15, 17)
  * **Dataset Representation**: Calibrated optical and medium-format surface photography used for morphological crater/boulder obstacle validation, regolith cohesion verification ($1\text{–}3\text{ kPa}$), bearing strength benchmarks ($100\text{–}200\text{ kPa}$), and Space Gallery dossiers.

---

### B. ISRO Datasets

* **ISRO Chandrayaan-2 TMC-2 Calibrated Observational Product (Full 392 MB Swath)**
  * **Repository Files**:
    * `src/assets/isro_data/ch2_tmc_ncn_20260823T1657513854_d_img_d18.img` ($392.95\text{ MB}$ calibrated binary raster, $49,119\text{ lines} \times 4,000\text{ samples}$, UnsignedLSB2 16-bit, $6.40\text{ m/pixel}$ GSD, orbit 31200)
    * `src/assets/isro_data/ch2_tmc_ncn_20260823T1657513854_d_img_d18.xml` (Official ISRO PDS4 XML observational label)
    * `src/assets/isro_data/ch2_tmc_ncn_20260823T1657513854_b_brw_d18.png` & `.xml` (Browse product and label)
    * `src/assets/isro_data/ch2_tmc_ncn_20260823T1657513854_g_grd_d18.csv` & `.xml` (Georeferencing coordinates and spatial grid)
    * `src/assets/isro_data/readme.txt` (Orbit & Attitude Header file specifications)
    * `src/assets/isro_data/full_coverage_map.png` & `full_analysis_results.json` (Pipeline hazard assessment output)
  * **Mission**: Chandrayaan-2 Orbiter
  * **Instrument**: Terrain Mapping Camera-2 (TMC-2)
  * **Logical Identifier**: `urn:isro:isda:ch2_cho.tmc:data_calibrated:ch2_tmc_ncn_20260823t1657513854_d_img_d18`
  * **Dataset Representation**: Full calibrated 16-bit panchromatic radiance swath ($500\text{–}800\text{ nm}$) acquired during descending polar orbit 31200, spanning selenographic latitudes from $69.59^\circ$ to $77.53^\circ$. Processed through LunarSafe's tiled memory pipeline (`isroFullPipeline.ts`) to evaluate 846,253 obstacle cells and isolate safe landing corridors.

* **ISRO Chandrayaan-2 OHRC High-Resolution Landing Site Swaths**
  * **Repository Files**: `src/assets/samples/isro_ohrc_shivshakti_crop.png`, `src/assets/samples/ch2_ohrc_touchdown.png`
  * **Mission**: Chandrayaan-2 Orbiter
  * **Instrument**: Orbiter High Resolution Camera (OHRC)
  * **Dataset Representation**: Panchromatic swath with $0.25\text{ m/pixel}$ ground sampling distance (the highest resolution optical imaging sensor in lunar orbit) acquired from $100\text{ km}$ polar orbit over the South Polar highlands (Manzinus and Simpelius craters). Utilized for sub-meter obstacle detection, boulder identification down to the critical $30\text{ cm}$ landing gear clearance limit, and pre-landing site assessment.

* **ISRO Chandrayaan-2 TMC-2 Manzinus-C Tri-Stereo Strip**
  * **Repository File**: `src/assets/samples/isro_tmc2_manzinusc_crop.png`
  * **Mission**: Chandrayaan-2 Orbiter
  * **Instrument**: Terrain Mapping Camera-2 (TMC-2)
  * **Dataset Representation**: $5.0\text{ m/pixel}$ tri-stereo along-track observation ($+26^\circ$ Fore, Nadir, $-26^\circ$ Aft) over Manzinus-C crater ($69.8^\circ\text{S}, 31.2^\circ\text{E}$). Provides the photogrammetric baseline that calibrated LunarSafe's photometric slope constant ($\alpha = 0.35^\circ$) and verified compliance with the ISRO 24-meter evaluation grid.

* **ISRO Chandrayaan-2 South Polar Permanently Shadowed Region (PSR) & DFSAR Mosaics**
  * **Repository Files**: `src/assets/samples/isro_psr_southpole_crop.png`, `psr_overlay_visual.png`, `psr_shadow_zone.png`
  * **Mission**: Chandrayaan-2 Orbiter
  * **Instrument**: Dual-Frequency Synthetic Aperture Radar (DFSAR) & OHRC High-Dynamic-Range mode
  * **Dataset Representation**: Active polarimetric microwave backscatter (L-band $1.25\text{ GHz}$ and S-band $2.5\text{ GHz}$) and scattered-light optical imagery inside lunar South Pole cold traps ($84.5^\circ\text{S}$ to $85.5^\circ\text{S}$). Maps dielectric boundaries, buried impact rims, and subsurface water-ice deposits where direct sunlight is permanently zero.

* **ISRO Chandrayaan-3 In-Situ Rover & Lander Surface Imagery**
  * **Mission**: Chandrayaan-3
  * **Instruments**: Pragyan Navigation Cameras (NavCam-L / NavCam-R) and Vikram Lander Imager Camera (LIC) / Lander Hazard Detection & Avoidance Camera (LHDAC)
  * **Dataset Representation**: Surface telemetry and imagery captured at Shiv Shakti Point ($-69.373^\circ\text{S}, 32.319^\circ\text{E}$), documenting Pragyan's autonomous obstacle evasion (4-meter crater rim reroute) and Vikram's $40\text{ cm}$ in-situ hop and re-touchdown experiment.

* **ISRO ISSDC PRADAN Archive Connector**
  * **Code Modules**: `src/lib/isroPradanParser.ts`, `src/lib/isroPds4Parser.ts`, `src/components/DataSourcesPanel.tsx`
  * **Source**: Indian Space Science Data Centre (ISSDC) PRADAN Repository (`https://pradan.issdc.gov.in/ch2/`)
  * **Dataset Representation**: Structural schemas and PDS4 label parser (`IsroPds4Metadata`) that validate authentic Chandrayaan-2 XML observational products (`urn:isro:isda:...`) and document the mandatory Single Sign-On (SSO) authentication policy governing ISRO's 19.4+ Terabyte science archive.

---

### C. Joint NASA-ISRO Datasets

* **Chandrayaan-1 Moon Mineralogy Mapper (M3)**
  * **NASA PDS Identifier**: `urn:nasa:pds:m3:spectral_cube_ch1::1.0`, `PIA12885`
  * **Mission**: Chandrayaan-1 (ISRO spacecraft hosting NASA payload)
  * **Instrument**: Moon Mineralogy Mapper (M3 Imaging Spectrometer)
  * **Dataset Representation**: 85-channel contiguous hyperspectral cube ($0.43\text{ to }3.0\text{ }\mu\text{m}$) with $140\text{ m/pixel}$ resolution. Confirmed diagnostic $2.8\text{ }\mu\text{m}$ hydroxyl (OH) and $3.0\text{ }\mu\text{m}$ water ($H_2O$) molecular absorption features across polar crater rims.

---

## 2. Official Data Sources (URLs & Repositories)

All datasets used in LunarSafe originate from official, authoritative NASA and ISRO planetary data archives:

### Official NASA Archives

* **NASA Planetary Data System (PDS) Geosciences Node (LOLA Elevation & DEMs)**:  
  `https://pds-geosciences.wustl.edu/missions/lro/lola.htm`
* **MIT LOLA Science Team Gridded Data Record (GDR) Archive (Direct Polar & Cylindrical Binary IMG / LBL files)**:  
  `https://imbrium.mit.edu/DATA/LOLA_GDR/`  
  * Polar Floating-Point DEMs ($87.5^\circ\text{S}$ to $90^\circ\text{S}$): `https://imbrium.mit.edu/DATA/LOLA_GDR/POLAR/FLOAT_IMG/`
  * Cylindrical Equirectangular DEMs ($0^\circ\text{ to }90^\circ\text{S}$): `https://imbrium.mit.edu/DATA/LOLA_GDR/CYLINDRICAL/FLOAT_IMG/`
* **NASA Goddard Space Flight Center (GSFC) LOLA Science Operations**:  
  `https://lola.gsfc.nasa.gov/`
* **NASA Planetary Data System (PDS) Central API & Search Portal**:  
  `https://pds.nasa.gov/api/search/1/products`  
  `https://pds.nasa.gov/`
* **NASA Planetary Data System LROC Node & ASU LROC Archive**:  
  `https://pds-geosciences.wustl.edu/missions/lro/lroc.htm`  
  `http://lroc.sese.asu.edu/`
* **NASA Solar System Treks (Moon Trek High-Resolution Artemis GIS Portal)**:  
  `https://trek.nasa.gov/moon/`
* **NASA Jet Propulsion Laboratory (JPL) Planetary Photojournal**:  
  `https://photojournal.jpl.nasa.gov/`
* **NASA Image and Video Library**:  
  `https://images.nasa.gov/`
* **NASA-ISRO Chandrayaan-1 Moon Mineralogy Mapper (M3) PDS Archive**:  
  `https://pds-geosciences.wustl.edu/missions/chandrayaan1/m3.htm`

### Official ISRO Archives

* **ISRO PRADAN (Policy-governed Repository of All Data from Chandrayaan-2/3 Missions)**:  
  `https://pradan.issdc.gov.in/ch2/`
* **ISSDC (Indian Space Science Data Centre Main Portal)**:  
  `https://www.issdc.gov.in/`
* **ISRO Space Applications Centre (SAC) PDS4 Metadata Schemas & ISDA Dictionaries**:  
  `https://isda.issdc.gov.in/pds4/isda/v1/ch2_ldd_ISDA_1000.xsd`  
  `https://isda.issdc.gov.in/pds4/isda/v1/ch2_ldd_ISDA_1000.sch`
* **ISRO Official Chandrayaan-3 Mission & Science Release Portal**:  
  `https://www.isro.gov.in/chandrayaan3.html`  
  `https://www.isro.gov.in/chandrayaan3_gallery.html`

---

## 3. How We Process the Data (The Algorithmic Pipeline)

LunarSafe executes a multi-stage deterministic scientific pipeline that transforms raw binary planetary rasters into interactive 3D terrain models and autonomous hazard clearance scores.

```mermaid
flowchart TD
    subgraph S1["1. Raw Planetary Data Ingestion"]
        A1["NASA LOLA Binary DEMs (.IMG, .TIF, .PNG)"] --> B1["Float32Array Elevation Decoding & Georeference Metadata Extraction"]
        A2["ISRO Chandrayaan-2 TMC-2 / OHRC (.IMG, .XML)"] --> B2["PDS4 XML Parsing & Selenographic Geometry Extraction"]
        A3["NASA Artemis III / CLPS GeoJSON"] --> B3["FeatureCollection Coordinate Extraction (Lat, Lon, CLPS Mission)"]
    end

    subgraph S2["2. Topographic & Slope Synthesis"]
        B1 --> C1["Elevation Matrix Normalization (Z-Range Mapping)"]
        B1 --> C2["Horn (1981) 3rd-Order Finite Difference Algorithm (8 × GSD Weighting)"]
        C2 --> D1["Physical Slope Angle Map (Degrees)"]
        D1 --> D2["Offscreen Texture Baking (Green ≤5°, Amber 5°-10°, Red >10°)"]
        C1 --> D3["Surface Roughness Index Texture (Local Elevation StdDev)"]
        C1 --> D4["High-Definition Albedo Texture Synthesis (512×512)"]
    end

    subgraph S3["3. Three.js 3D Terrain & Dynamic Mesh Engine"]
        C1 --> E1["THREE.PlaneGeometry (80×80 units, 128×128 Grid, 16,384 Vertices)"]
        E1 --> E2["CPU Vertex Displacement: pos.setY(i, elevationMeters)"]
        E2 --> E3["Dynamic Vertex Normal Computation: computeVertexNormals()"]
        D2 & D3 & D4 --> E4["THREE.MeshStandardMaterial (ACESFilmic, Non-Destructive Map Swapping)"]
        E3 & E4 --> E5["Rendered 3D Polar Terrain Mesh"]
    end

    subgraph S4["4. Selenographic GeoJSON Mapping & Interactive 3D Markers"]
        B3 --> F1["Polar Stereographic Mathematical Transformation: ρ = 90 + lat, φ = lon × (π/180)"]
        F1 --> F2["Planar Cartesian Coordinates: X = ρ·sin(φ)·(34/6), Z = ρ·cos(φ)·(34/6)"]
        F2 --> F3["Direct Elevation Probing: Y = sampleElevationAt(X, Z) via Offscreen DEM Canvas"]
        F3 --> F4["3D Composite Marker: Glowing Needle + Luminous Top Orb + Ground Ring"]
        F4 --> E5
        E5 --> G1["GPU Raycaster (raycaster.intersectObjects) on Hover & Click"]
        G1 --> G2["Site Telemetry HUD & computeLunarSafeScore() Output"]
    end
```

### Detailed Pipeline Stages

#### 1. Ingestion of Raw NASA GeoTIFFs and PDS IMGs
* **Binary Buffer Parsing**: Handled in `src/lib/demSlope.ts` and `src/lib/lolaValidator.ts`. Raw elevation files (`.tif`, `.img`, or 16-bit `.png`) are read directly into contiguous `Float32Array` buffers. If reading 16-bit PNG containers, 16-bit unsigned integers are unpacked and linearly scaled back into real meters using companion metadata:
  $$\text{Elevation}(m) = \text{minElevMeters} + \left(\frac{u_{16}}{65535}\right) \cdot (\text{maxElevMeters} - \text{minElevMeters})$$
* **Linear Gradient Extrapolation at Boundaries**: To eliminate artificial border clipping artifacts during gradient filtering, edge and corner boundaries are extrapolated using forward and backward difference schemes, preserving true planar slopes across outer raster margins.

#### 2. Conversion to Heightmaps, Slope Textures, and Roughness Maps
* **Elevation Displacement**: In `src/components/Terrain3DViewer.tsx`, the elevation raster is mapped onto an offscreen canvas. Vertices of a `THREE.PlaneGeometry` ($80 \times 80$ spatial units, $128 \times 128$ segments, 16,384 vertices) are displaced along the Y-axis:
  $$\text{pos.setY}(i, \text{elevationMeters}), \quad \text{where } \text{elevationMeters} = (\text{elevationNorm} \cdot 18.0 - 5.0) \cdot \left(\frac{\text{exaggeration}}{2.0}\right)$$
  True physical 3D lighting normals are then dynamically regenerated via `geometry.computeVertexNormals()`.
* **Horn's (1981) Finite Difference Slope Formulation**: Local terrain slope is computed across each pixel $(x, y)$ using Horn's third-order finite difference scheme with $8 \times \text{GSD}$ weighting:
  $$\frac{\partial z}{\partial x} = \frac{(z_{20} + 2z_{21} + z_{22}) - (z_{00} + 2z_{01} + z_{02})}{8 \cdot \text{GSD}}$$
  $$\frac{\partial z}{\partial y} = \frac{(z_{02} + 2z_{12} + z_{22}) - (z_{00} + 2z_{10} + z_{20})}{8 \cdot \text{GSD}}$$
  $$\text{Slope}_{\text{degrees}} = \arctan\left(\sqrt{\left(\frac{\partial z}{\partial x}\right)^2 + \left(\frac{\partial z}{\partial y}\right)^2}\right) \cdot \left(\frac{180^\circ}{\pi}\right)$$
* **Physical Color Classification Texture**: The resulting slope matrix is baked into a 512×512 RGBA texture matching spacecraft landing engineering limits:
  * **Optimal Safe** ($\le 5.0^\circ$): Emerald Green ($R < 100, G > 180, B < 120$)
  * **Acceptable Stability** ($5.1^\circ\text{–}10.0^\circ$): Amber Warning ($R > 180, G > 140, B < 60$)
  * **Tip-Over Hazard** ($> 10.0^\circ$): Crimson Critical ($R > 200, G < 80, B < 80$)
* **Roughness & Albedo Maps**: Standard deviation of elevation across sliding $3 \times 3$ kernels is mapped to a roughness texture, while a high-resolution base albedo texture is synthesized using real LOLA luminance curves with subtle high-frequency regolith grain noise.
* **Non-Destructive GPU Map Swapping**: Texture channels (`Albedo` $\leftrightarrow$ `Slope` $\leftrightarrow$ `Roughness`) are swapped directly on the existing `THREE.MeshStandardMaterial` instance, eliminating GPU memory leaks, geometry recreations, and WebGL context loss.

#### 3. GeoJSON Parsing and 3D Marker Placement
* **Projection Transformation**: Coordinates in `A3_Named_regions.geojson` are defined in lunar spherical coordinates ($[-84^\circ\text{S}, -90^\circ\text{S}]$ latitude, $[-180^\circ, +180^\circ]$ longitude). They are projected onto the 3D plane via polar stereographic projection:
  $$\rho = 90^\circ + \text{latitude} \quad (\rho = 0\text{ at South Pole, up to }6\text{ at }84^\circ\text{S})$$
  $$\phi = \text{longitude} \cdot \left(\frac{\pi}{180^\circ}\right)$$
  $$X = \rho \cdot \sin(\phi) \cdot \left(\frac{34}{6}\right), \quad Z = \rho \cdot \cos(\phi) \cdot \left(\frac{34}{6}\right)$$
* **Terrain Height Snapping**: To guarantee that markers do not float or sink into steep crater walls, the exact elevation $Y$ is sampled directly from the displaced DEM at coordinate $(X, Z)$ via `sampleElevationAt(X, Z)`.
* **Composite 3D Markers**: Each candidate landing site is instantiated as a 3-part interactive Three.js assembly:
  1. A vertical beacon needle (`THREE.CylinderGeometry(0.2, 0.45, 7.5, 16)`)
  2. A glowing top orb (`THREE.SphereGeometry(1.1, 16, 16)`) with emissive shader animation
  3. A ground target boundary ring (`THREE.RingGeometry(1.6, 2.4, 32)`) aligned flat on the terrain surface
* **Interactive Raycasting**: A `THREE.Raycaster` detects pointer interactions, triggers smooth camera lerp transitions to the site, samples the local pixel slope from the offscreen canvas, and displays live site telemetry and the `computeLunarSafeScore()` evaluation.

#### 4. Large-Scale ISRO Swath Tiled Processing (392 MB Calibrated Raster)
* Handled in `src/lib/isroFullPipeline.ts` and `src/lib/isroTileWorker.ts`.
* The 49,119 line $\times$ 4,000 sample Chandrayaan-2 TMC-2 image is streamed using a sliding $1024 \times 1024$ tile worker pool, evaluating individual ISRO $24\text{m} \times 24\text{m}$ grid blocks.
* Morphological obstacle patches ($8 \times 8$ detector hits) are clustered using connected-component analysis (`src/lib/craterConsolidation.ts`), compressing 846,253 raw micro-detections into exact distinct crater complexes and extracting continuous safe touchdown corridors.

---

## 4. Data Compliance & Open Access Statement

> **"All planetary imagery, digital elevation models, and observational telemetry utilized in LunarSafe are sourced exclusively from publicly accessible, open-access archives of NASA (via the Planetary Data System and Solar System Treks under 17 U.S.C. § 105) and ISRO (via the Indian Space Science Data Centre PRADAN portal pursuant to the National Data Sharing and Accessibility Policy). All datasets are faithfully attributed to their originating instrument teams and space agencies, fully adhering to NASA Open Data Policy and the global competition rules for open scientific research."**

---

*Report prepared by Team Rocket (AEROX Club · Parul University). Maintained in the LunarSafe project repository for review by NASA Space Apps Judges, CLPS commercial partners, and aerospace industry mentors.*
