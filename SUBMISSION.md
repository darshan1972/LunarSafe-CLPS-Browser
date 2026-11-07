# NASA Space Apps Challenge 2026 Submission

- **Project Name**: LunarSafe 2.0
- **Challenge**: CLPS Lunar Mission Browser / Planetary Landing Site Selection
- **Team**: Team Rocket · AEROX Club · Parul University
- **Project Lead**: DARSHAN BAGUL (PATIL)
- **Author**: DARSHAN BAGUL (PATIL)
- **GitHub Repository**: [https://github.com/darshan1972/LunarSafe-CLPS-Browser/tree/nasa-submission](https://github.com/darshan1972/LunarSafe-CLPS-Browser/tree/nasa-submission)

## What Is Computed vs. Estimated
| Feature | Source / method | Status |
|---|---|---|
| 4 benchmark DEM tiles | Horn 3×3 slope + uncertainty on LOLA DEM tiles | Computed; results fall inside published ranges at 3 sites (Apollo 11, Shiv Shakti, Shackleton); Apollo 17 is a sensitivity test, not ground truth |
| Uploaded-image scans | Sobel intensity proxy + 24 m grid + BFS | Computed, deterministic; proxy only |
| 13 Artemis III sites | Hard-coded `base_slope_deg` estimates | Illustrative estimates, not Horn-computed |
| 3D pins and what-if slider | Single-pixel decode of the 512×512 colour slope texture | Approximate, interactive |
| Relative Safety Index | Heuristic formula | Not a mission-grade score |
| YOLOv5 sidecar | Pretrained crater detector | Advisory only; never affects the safety result |
| SHA-256 chain + session seal | Hashes of pipeline stages | Tamper-evident and reproducible; does not prove physical correctness |

> [!NOTE]
> The `lighting_pct`, `earth_comm`, and `sunAngleDeg` values in the 13 Artemis III sites are illustrative estimates from the catalog, not live-computed solar/communication windows.

## Executive Summary

LunarSafe 2.0 is a research-grade 3D planetary mission planning and hazard characterization workstation developed for NASA's Artemis III and Commercial Lunar Payload Services (CLPS) missions. Designed to evaluate the rugged topography of the lunar South Pole, the platform renders hardware-accelerated 3D terrain meshes displaced by authentic NASA Lunar Reconnaissance Orbiter (LRO) LOLA Digital Elevation Models (DEMs) and maps all 13 official Artemis III candidate landing regions in real-time. The 3D viewer utilizes an optimized 512×512 regional texture for high-performance interactive exploration; the rigorous Horn pipeline is applied to the 4 benchmark DEM tiles and to uploaded-image scans, whereas the 13 Artemis sites use `base_slope_deg` estimates plus sampling from the 512×512 texture.

What makes LunarSafe 2.0 distinctive is its emphasis on reproducibility and transparency. The slope and hazard engine is deterministic classical mathematics (Horn 1981 3×3 weighted finite-difference slope, first-order uncertainty propagation, 24 m grid partitioning), applied to the 4 benchmark DEM tiles and to uploaded-image scans, with no neural network in the safety result. Each stage is hashed into a tamper-evident SHA-256 chain, so identical inputs can be shown to produce identical outputs; the hashes demonstrate consistency and integrity, not physical correctness. An external YOLOv5 sidecar runs as an advisory benchmark only and never feeds the safety result. The 13 Artemis III site values and the what-if slider are interactive estimates.

---

### Key Capabilities & Artifacts
1. **Interactive 3D Moon & CLPS Browser**: Real-time terrain displacement, dynamic solar illumination, and raycast telemetry for all 13 candidate sites.
2. **What-If Slope Tolerance Engine**: Instant dynamic safety score re-evaluations across user-defined spacecraft slope limits ($8.0^\circ$ to $15.0^\circ$).
3. **NASA Data Provenance**: Complete scientific traceability to NASA PDS archives documented in [`DATA_PROVENANCE_REPORT.md`](./DATA_PROVENANCE_REPORT.md).
4. **Visual Evidence**: Multi-page high-definition presentation screenshots compiled in [`NASA_App_Screenshots.pdf`](./NASA_App_Screenshots.pdf).
