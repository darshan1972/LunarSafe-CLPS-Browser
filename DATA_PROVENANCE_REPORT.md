# LunarSafe — NASA Planetary Data Provenance & Ingestion Report

> **Prepared for**: NASA Space Apps Challenge Judges, Technical Reviewers, and Industry Mentors (StarLab, CLPS, Artemis)  
> **Project**: LunarSafe (Autonomous Lunar Landing Site Characterization & Hazard Assessment)  
> **Organization**: Team Rocket · AEROX Club · Parul University  
> **Status**: Open data used under NASA Open Data Policy (17 U.S.C. § 105)

---

## 1. Exact NASA Datasets Used

LunarSafe utilizes authentic, calibrated lunar planetary datasets sourced exclusively from **NASA** missions and official Planetary Data System (PDS) archives. Below is the complete catalog of datasets, exact file names, instrument specifications, and their functional representations within the codebase.

### NASA Planetary Datasets

* **NASA LRO LOLA Lunar South Pole Gridded Digital Elevation Model (GDR)**
  * **Repository Files**: 
    * `public/data/dem_heightmap.png` (Displacement heightmap texture)
    * `public/data/slope_texture.png` (Horn slope classification texture)
    * `public/data/roughness_texture.png` (Surface roughness index texture)
    * `src/assets/dem/lola_sample.tif` & `lola_sample.png` (Raw 32-bit floating-point DEM sample)
    * `src/assets/dem/lola_sample.meta.json` (Companion geodetic metadata)
  * **Mission**: Lunar Reconnaissance Orbiter (LRO)
  * **Instrument**: Lunar Orbiter Laser Altimeter (LOLA)
  * **Original NASA PDS Identifiers**: `LDEM_875S_20M_FLOAT.IMG`, `LDEM_80S_80M_FLOAT.IMG`
  * **Dataset Representation**: Polar stereographic Digital Elevation Model (DEM) covering lunar latitudes from $84^\circ\text{S}$ to $90^\circ\text{S}$ at up to 20 meters/pixel spatial resolution. It encodes absolute terrain elevation relative to the lunar reference radius ($1,737,400\text{ m}$), utilized to generate displaced 3D terrain meshes, compute physical slope gradients, and derive surface roughness indices.

* **Optimized 512×512 WebGL Regional Textures (Local Pre-Processing Pipeline)**
  * **Repository Files**: `public/data/dem_heightmap.png`, `public/data/slope_texture.png`, `public/data/roughness_texture.png`
  * **Pre-Processing Methodology**: To enable high-frame-rate 3D rendering in WebGL without compromising browser responsiveness or exceeding client GPU memory limits, the 512×512 PNG textures were pre-computed locally from the raw NASA LOLA polar DEM (`LDEM_875S_20M_FLOAT.IMG`) using an offline data-processing pipeline.
  * **Texture Roles**:
    1. `dem_heightmap.png`: Encodes normalized elevation values used by Three.js to displace vertices across the 3D lunar terrain mesh.
    2. `slope_texture.png`: Pre-baked Horn (1981) 3×3 weighted finite-difference slope gradients color-banded into landing safety intervals ($\le 5^\circ$ green, $5^\circ\text{–}10^\circ$ amber, $>10^\circ$ crimson).
    3. `roughness_texture.png`: Encodes the local moving-window elevation standard deviation, mapping micro-terrain roughness.
  * **Full-Resolution Separation**: While the client-side 3D viewer samples these optimized 512×512 textures for real-time visualization and interactive slider updates, all rigorous flight-safety math, analytical uncertainty quantification, and benchmark test suites operate directly on the uncompressed floating-point GeoTIFF / raw DEM rasters.

* **NASA LRO LOLA Specific Landing Site Benchmark DEMs (Ground-Truth Validation)**
  * **Repository Files**:
    * `src/assets/dem/shackleton_lola_dem.tif`, `.png`, `.meta.json`: Shackleton Crater Rim ($89.9^\circ\text{S}, 0.0^\circ\text{E}$), $20\text{ m/pixel}$ GSD, elevation range $81.8\text{ m}$ to $1,108.3\text{ m}$. Validates against the published $31.0^\circ$ rim slope benchmark (Zuber et al., *Nature* 2012).
    * `src/assets/dem/apollo11_lola_dem.tif`, `.png`, `.meta.json`: Apollo 11 Tranquility Base ($0.674^\circ\text{N}, 23.473^\circ\text{E}$), $59.225\text{ m/pixel}$ GSD (`LDEM_512_00N_45N_000_090_FLOAT`). Validates against the published $1.30^\circ$ mare plain slope benchmark (Rosenburg et al., *JGR Planets* 2011).
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
    * `PIA12892`: LROC NAC terraced rim and talus boulder cascades in Bürg Crater ($45.0^\circ\text{N}, 28.2^\circ\text{E}$, $0.50\text{ m/pixel}$).
    * `PIA13132`: LROC NAC anorthositic central peak uplift in Bullialdus Crater ($20.7^\circ\text{S}, 22.2^\circ\text{W}$, $0.55\text{ m/pixel}$).
    * `PIA14317`: LROC NAC high-resolution oblique perspective of Tycho Crater central peak ($43.31^\circ\text{S}, 11.36^\circ\text{W}$, $1.5\text{ m/pixel}$).
    * `GSFC_20171208_Archive_e001928`: LOLA polar geodetic elevation map of Shackleton Crater.
    * `as11-37-5458`: Apollo 11 Hasselblad 70mm close-up of LM Eagle footpad resting on lunar regolith ($0.674^\circ\text{N}, 23.473^\circ\text{E}$).
    * `as15-82-11082`: Apollo 15 Hasselblad 70mm telephoto view of fresh impact crater rim and ejecta boulder field ($26.13^\circ\text{N}, 3.63^\circ\text{E}$).
    * `as15-91-12366`: Apollo 15 Metric Mapping Camera 3-inch frame of Crater Posidonius rilles ($31.8^\circ\text{N}, 29.9^\circ\text{E}$).
    * `as17-140-21497`: Apollo 17 Hasselblad 70mm frame of Station 6 fragmented boulder and rolling boulder track at North Massif ($20.19^\circ\text{N}, 30.77^\circ\text{E}$).
  * **Mission**: Lunar Reconnaissance Orbiter (LROC NAC) and Apollo Expeditions (11, 15, 17)
  * **Dataset Representation**: Calibrated optical and medium-format surface photography used for morphological crater/boulder obstacle validation, regolith cohesion verification ($1\text{–}3\text{ kPa}$), bearing strength benchmarks ($100\text{–}200\text{ kPa}$), and Space Gallery dossiers.

---

## 2. Official NASA Data Sources (URLs & Repositories)

All datasets used in LunarSafe originate from official, authoritative NASA planetary data archives:

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

---

## 3. How We Process the Data (The Algorithmic Pipeline)

LunarSafe executes a multi-stage deterministic scientific pipeline that transforms raw NASA binary planetary rasters into interactive 3D terrain models and autonomous hazard clearance scores.

```mermaid
flowchart TD
    subgraph S1["1. Raw NASA Data Ingestion"]
        A1["NASA LOLA Binary DEMs (.IMG, .TIF, .PNG)"] --> B1["Float32Array Elevation Decoding & Georeference Metadata Extraction"]
        A2["NASA Artemis III / CLPS GeoJSON Catalog"] --> B2["FeatureCollection Coordinate Extraction (Lat, Lon, Lighting, Mission)"]
        A3["NASA PDS Live API Feed"] --> B3["Product Bundle Verification & Metadata Synchronization"]
    end

    subgraph S2["2. Topographic & Slope Synthesis"]
        B1 --> C1["Elevation Matrix Normalization (Z-Range Mapping)"]
        B1 --> C2["Horn (1981) 3×3 Weighted Finite-Difference Algorithm (8 × GSD Weighting)"]
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
        B2 --> F1["Polar Stereographic Mathematical Transformation: ρ = 90 + lat, φ = lon × (π/180)"]
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
* **Horn's (1981) Finite Difference Slope Formulation**: Local terrain slope is computed across each pixel $(x, y)$ using Horn's 3×3 weighted finite-difference scheme with $8 \times \text{GSD}$ weighting:
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

---

## 4. Data Compliance & Open Access Statement

> **"All planetary imagery, digital elevation models, and observational telemetry utilized in LunarSafe are sourced exclusively from publicly accessible, open-access archives of NASA (via the Planetary Data System and Solar System Treks under 17 U.S.C. § 105). All datasets are faithfully attributed to their originating instrument teams and space agencies, fully adhering to NASA Open Data Policy and the global competition rules for open scientific research."**

---

*Report prepared by Team Rocket (AEROX Club · Parul University). Maintained in the LunarSafe project repository for review by NASA Space Apps Judges, CLPS commercial partners, and aerospace industry mentors.*
