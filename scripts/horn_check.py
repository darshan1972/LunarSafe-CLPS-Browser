import json, sys, numpy as np
# Reads the repo's DEM tiles, which are raw little-endian float32 files with a .tif extension (not real GeoTIFFs).
SITES = {"Apollo 11": "apollo11_lola_dem", "Shiv Shakti": "shiv_shakti_lola_dem",
         "Shackleton": "shackleton_lola_dem", "Apollo 17": "marginal_site_lola_dem"}
base = sys.argv[1] if len(sys.argv) > 1 else "src/assets/dem"
for name, stem in SITES.items():
    m = json.load(open(f"{base}/{stem}.meta.json"))
    gsd, w, h = m["gsdMetersPerPixel"], m["width"], m["height"]
    z = np.fromfile(f"{base}/{stem}.tif", dtype="<f4").astype(np.float64).reshape(h, w)
    a,b,c = z[:-2,:-2], z[:-2,1:-1], z[:-2,2:]
    d,f   = z[1:-1,:-2], z[1:-1,2:]
    g,hh,i = z[2:,:-2], z[2:,1:-1], z[2:,2:]
    dzdx = ((c + 2*f + i) - (a + 2*d + g)) / (8*gsd)
    dzdy = ((g + 2*hh + i) - (a + 2*b + c)) / (8*gsd)
    s = np.degrees(np.arctan(np.hypot(dzdx, dzdy)))
    print(f"{name:12s} mean Horn slope = {s.mean():.2f} deg")
