# NASA Space Apps Challenge 2026 Submission

- **Project Name**: LunarSafe 2.0
- **Challenge**: CLPS Lunar Mission Browser / Planetary Landing Site Selection
- **Team**: Team Rocket · AEROX Club · Parul University
- **Project Lead**: Darshan Patil
- **GitHub Repository**: [https://github.com/darshan1972/LunarSafe-CLPS-Browser/tree/nasa-submission](https://github.com/darshan1972/LunarSafe-CLPS-Browser/tree/nasa-submission)

## Executive Summary

LunarSafe 2.0 is an aerospace-grade 3D planetary mission planning and hazard characterization workstation developed for NASA's Artemis III and Commercial Lunar Payload Services (CLPS) missions. Designed to evaluate the rugged topography of the lunar South Pole, the platform renders hardware-accelerated 3D terrain meshes displaced by authentic NASA Lunar Reconnaissance Orbiter (LRO) LOLA Digital Elevation Models (DEMs) and maps all 13 official Artemis III candidate landing regions in real-time.

What makes LunarSafe 2.0 truly unique is its unyielding commitment to scientific integrity and flight safety: all slope gradients, roughness indices, and landing hazard classifications are computed using strictly deterministic classical flight-physics mathematics (Horn 1981 finite-difference models and 24-meter landing grid partitioning) rather than black-box AI. To guarantee total non-repudiation, every computation stage is permanently sealed into an immutable FIPS 180-4 SHA-256 cryptographic audit trail. Concurrently, an external YOLOv5 deep learning sidecar runs strictly in parallel as an advisory benchmark, giving mission planners independent cross-validation of obstacle detection while preserving 100% bit-identical determinism for mission-critical flight decisions.

---

### Key Capabilities & Artifacts
1. **Interactive 3D Moon & CLPS Browser**: Real-time terrain displacement, dynamic solar illumination, and raycast telemetry for all 13 candidate sites.
2. **What-If Slope Tolerance Engine**: Instant dynamic safety score re-evaluations across user-defined spacecraft slope limits ($5^\circ$ to $15^\circ$).
3. **NASA Data Provenance**: Complete scientific traceability to NASA PDS archives documented in [`DATA_PROVENANCE_REPORT.md`](./DATA_PROVENANCE_REPORT.md).
4. **Visual Evidence**: Multi-page high-definition presentation screenshots compiled in [`NASA_App_Screenshots.pdf`](./NASA_App_Screenshots.pdf).
