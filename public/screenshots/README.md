# LunarSafe Application Screenshots

This directory contains real, unedited screenshots captured from the final build of LunarSafe running at `1920x1080` (browser viewport, dark theme) and rendered PDF pages from `evidence/mission_report.pdf`.

All captures are fully reproducible via `node scripts/capture_screenshots.mjs`.

## Screenshot Evidence Matrix

| Filename | Description | Resolution | File Size | SHA-256 Digest | Evidenced Claim |
| :--- | :--- | :---: | :---: | :--- | :--- |
| [`1.png`](./1.png) | 3D Moon Overview, CLPS Mission Browser Tab | 1920×1080 | 192,315 B | `97ed427f4590a30da2165e63dee6ae661622bf35afc6edbe4b942587d51d13cc` | Real-time 3D lunar terrain rendering with all 13 Artemis III candidate landing sites from NASA LRO LOLA DEMs. |
| [`2.png`](./2.png) | Slope Overlay Active & Sensor Controls | 1920×1080 | 231,626 B | `e3700d39267a091a4dee70747080dcda89366b4dad4232709066fe03035754c3` | Horn (1981) finite-difference slope overlay and Hurst RMS roughness controls on physical terrain mesh. |
| [`3.png`](./3.png) | Candidate Region Telemetry (Malapert Mountain) | 1920×1080 | 199,523 B | `f46cb2c92c06c3333feef39970aba9d14ced4c224508f0abae69e661a9cc0e12` | Site telemetry showing estimated slope (7.20°), roughness, illustrative solar illumination, Earth comm, and Relative Safety Index. |
| [`4.png`](./4.png) | Artemis III Decision & Rank Matrix | 1920×1080 | 162,818 B | `cef0c8d6b8c76cdd4ea80d5c8409936e97b2265a93d5d0d515f36be8382a8c39` | Live 13-site ranking matrix at 10.0° tolerance displaying Relative Safety Index (heuristic), 10 Safe / 3 Hazard summary, and sorting. |
| [`5.png`](./5.png) | Tamper-evident SHA-256 Audit Ledger | 1920×1080 | 151,724 B | `f830aa667b84b6a0ab75fe613e0b7de7d89960e934d89fb54554c1144366bfd3` | Sealed SHA-256 cryptographic verification digest and reproducible JSON audit payload containing `estimatedSlopeDeg`. |
| [`6a.png`](./6a.png) | What-If Sensitivity at 8.0° Tolerance | 1920×1080 | 129,280 B | `fe0b92d662a2fb9db837941d2f161af0ba0fe7a66a50967d3df6d697fa5c5fb9` | Parameter sensitivity: `de Gerlache Rim 1` (slope 9.60°) classified as `LIMIT EXCEEDED` under strict 8.0° CLPS tolerance. |
| [`6b.png`](./6b.png) | What-If Sensitivity at 15.0° Tolerance | 1920×1080 | 129,236 B | `b374332db76ff19cc040db0e59e3eb3ae993135ee421ed861a2db0138270f0ff` | Parameter sensitivity: SAME site `de Gerlache Rim 1` dynamically re-ranked to `PERMISSIBLE` (Safe) under 15.0° tolerance. |
| [`7.png`](./7.png) | 2D Hazard Analyzer Scan (TMC-2 South Pole) | 1920×1080 | 130,035 B | `37805ed50456e93ebf924f49856dc5b23f82489cdd45beef8adb05d5d1060225` | Real scan of `ch2_tmc2_south_pole.png` showing 16,384 evaluated 24m cells, 99.16% safe area, and 4-stage hash chain display. |
| [`8.png`](./8.png) | Multi-Method Analysis (CV vs YOLOv5) | 1920×1080 | 126,104 B | `0876c1820dd4705601E3F08C9F6E499A2F00911488C964422738A548FC22FC92` | Dual-engine comparison: deterministic CV vs advisory YOLOv5 AI sidecar with IoU matching and non-deterministic advisory caveats. |
| [`9.png`](./9.png) | Automated 3x Determinism Test Suite | 1920×1080 | 115,919 B | `8e8d2d58dee6d0211934198d57f57435fcbbbb7f22c123f2ed68379429219d19` | Terminal run of `npm run test:determinism` proving 3 consecutive passes with 100% bit-identical hash chain matching (all 24 assertions). |
| [`10.png`](./10.png) | Aerospace Mission Audit Report (Page 1) | 1241×1754 | 195,383 B | `0d47e2e96da84853b99392e6ad04ea91ff7c12b47e1772614fd877c26f964c7e` | Page 1 of `evidence/mission_report.pdf` rendered at 150 DPI with full telemetry, 4-stage hashes, and mission standards. |
| [`11.png`](./11.png) | Aerospace Mission Audit Report (Page 2) | 1241×1754 | 141,881 B | `2a998da39b3a920c034075d5a1f6a1314a32fe9e8a187669cac00e781639a237` | Page 2 of `evidence/mission_report.pdf` detailing Section 6 Multi-Method Analysis, IoU cross-validation, and advisory disclaimer. |
