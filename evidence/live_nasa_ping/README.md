# Live NASA PDS Ping Verification Evidence

- **Captured At (UTC):** `2026-11-10T06:37:45.488Z`
- **Target Backend Endpoint:** `GET http://localhost:5000/api/sources/nasa`
- **Upstream NASA PDS API:** `https://pds.nasa.gov/api/search/1/products?q=(pds:Target_Identification.pds:name%20eq%20%22Moon%22)&limit=8`

> **Note on Live Data Variability:** All values in `api_sources_nasa_raw.json`, screenshots, and `mission_terminal_lines.txt` reflect the live response returned by NASA's Planetary Data System at the capture timestamp above. Because the NASA PDS Search API is an external live service, total hit counts, product ordering, and query latency change over time.

## Files Included

1. `api_sources_nasa_raw.json` — Raw JSON returned by `curl http://localhost:5000/api/sources/nasa`.
2. `01_pinging_state.png` — UI screenshot captured while the request is in-flight (`PINGING...`).
3. `02_final_connected_state.png` — UI screenshot of the final `CONNECTED (HTTP 200 OK)` state showing the reworded Moon target summary, first returned product (`title`, `id`, `mission`), informational disclaimer, and Mission Terminal logs.
4. `mission_terminal_lines.txt` — Extracted Mission Terminal lines from the live run.
