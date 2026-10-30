/**
 * LunarSafe Mission Software — DEM-Based Slope Computation
 * Team Rocket · AEROX Club · Parul University · Project Head: Darshan Patil
 *
 * Implements Horn's (1981) third-order finite difference slope algorithm
 * for genuine lunar elevation matrices (DEM / DTM) with true GSD spatial anchoring.
 */

export type SlopeMethod = 'DEM_HORN_EXACT' | 'SOBEL_APPROXIMATE';

export interface SlopeResult {
  slopeMap: Float32Array;
  meanSlopeDeg: number;
  maxSlopeDeg: number;
  method: SlopeMethod;
}

// Theoretical maximum Sobel magnitude for 8-bit input:
// Gx_max = 4 * 255 = 1020, Gy_max = 4 * 255 = 1020
// G_max = sqrt(1020^2 + 1020^2) = 1020 * sqrt(2) ≈ 1442.49783362
export const THEORETICAL_MAX_SOBEL = Math.SQRT2 * 4 * 255;

/**
 * Computes exact physical surface slope in degrees from a Digital Elevation Model (DEM)
 * using Horn's (1981) third-order finite difference scheme with 8 * GSD weighting.
 *
 * Horn (1981) Formulation:
 *   dzdx = ((z[x+1, y-1] + 2*z[x+1, y] + z[x+1, y+1]) - (z[x-1, y-1] + 2*z[x-1, y] + z[x-1, y+1])) / (8 * gsd)
 *   dzdy = ((z[x-1, y+1] + 2*z[x, y+1] + z[x+1, y+1]) - (z[x-1, y-1] + 2*z[x, y-1] + z[x+1, y-1])) / (8 * gsd)
 *   slopeDeg = atan(sqrt(dzdx^2 + dzdy^2)) * (180 / PI)
 */
export function computeSlopeFromDEM(
  dem: Float32Array,
  width: number,
  height: number,
  gsdMetersPerPixel: number
): SlopeResult {
  const slopeMap = new Float32Array(width * height);
  let sumSlope = 0.0;
  let maxSlope = 0.0;

  // Boundary handler: linear gradient extrapolation preserves exact planar slopes at edges
  function getZ(x: number, y: number): number {
    const cx = Math.max(0, Math.min(width - 1, x));
    const cy = Math.max(0, Math.min(height - 1, y));
    let z = dem[cy * width + cx];
    if (x < 0) z += (dem[cy * width + 0] - dem[cy * width + 1]);
    if (x >= width) z += (dem[cy * width + width - 1] - dem[cy * width + width - 2]);
    if (y < 0) z += (dem[0 * width + cx] - dem[1 * width + cx]);
    if (y >= height) z += (dem[(height - 1) * width + cx] - dem[(height - 2) * width + cx]);
    return z;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const z00 = getZ(x - 1, y - 1);
      const z10 = getZ(x,     y - 1);
      const z20 = getZ(x + 1, y - 1);

      const z01 = getZ(x - 1, y);
      const z21 = getZ(x + 1, y);

      const z02 = getZ(x - 1, y + 1);
      const z12 = getZ(x,     y + 1);
      const z22 = getZ(x + 1, y + 1);

      // Horn's (1981) third-order finite difference
      const dzdx = ((z20 + 2 * z21 + z22) - (z00 + 2 * z01 + z02)) / (8 * gsdMetersPerPixel);
      const dzdy = ((z02 + 2 * z12 + z22) - (z00 + 2 * z10 + z20)) / (8 * gsdMetersPerPixel);

      const slopeRad = Math.atan(Math.sqrt(dzdx * dzdx + dzdy * dzdy));
      const slopeDeg = (slopeRad * 180.0) / Math.PI;

      const idx = y * width + x;
      slopeMap[idx] = slopeDeg;

      sumSlope += slopeDeg;
      if (slopeDeg > maxSlope) maxSlope = slopeDeg;
    }
  }

  const meanSlope = sumSlope / (width * height);

  return {
    slopeMap,
    meanSlopeDeg: Number(meanSlope.toFixed(2)),
    maxSlopeDeg: Number(maxSlope.toFixed(2)),
    method: 'DEM_HORN_EXACT',
  };
}

/**
 * Approximate slope estimation from 2D monochromatic intensity imagery using Sobel kernels.
 * Tagged explicitly as SOBEL_APPROXIMATE because intensity gradients only approximate slope
 * under specific illumination geometry.
 */
export function computeSobelSlopeApprox(
  gray: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number
): SlopeResult {
  const slopeMap = new Float32Array(width * height);
  let minSlope = 90.0;
  let maxSlope = 0.0;
  let sumSlope = 0.0;

  // Sobel kernels:
  // Gx: [-1, 0, 1; -2, 0, 2; -1, 0, 1]
  // Gy: [-1, -2, -1; 0, 0, 0; 1, 2, 1]
  for (let y = 0; y < height; y++) {
    const y0 = y > 0 ? y - 1 : 0;
    const y2 = y < height - 1 ? y + 1 : height - 1;

    const r0 = y0 * width;
    const r1 = y * width;
    const r2 = y2 * width;

    for (let x = 0; x < width; x++) {
      const x0 = x > 0 ? x - 1 : 0;
      const x2 = x < width - 1 ? x + 1 : width - 1;

      const p00 = gray[r0 + x0];
      const p01 = gray[r0 + x];
      const p02 = gray[r0 + x2];

      const p10 = gray[r1 + x0];
      const p12 = gray[r1 + x2];

      const p20 = gray[r2 + x0];
      const p21 = gray[r2 + x];
      const p22 = gray[r2 + x2];

      const gx = (p02 + 2 * p12 + p22) - (p00 + 2 * p10 + p20);
      const gy = (p20 + 2 * p21 + p22) - (p00 + 2 * p01 + p02);

      const magnitude = Math.sqrt(gx * gx + gy * gy);

      // Calibrated slope in degrees against theoretical max Sobel:
      // Ratio = magnitude / THEORETICAL_MAX_SOBEL in [0, 1]
      // Slope = arcsin(ratio) * (180 / PI)
      const ratio = Math.min(1.0, magnitude / THEORETICAL_MAX_SOBEL);
      const slopeRad = Math.asin(ratio);
      let slopeDeg = (slopeRad * 180.0) / Math.PI;

      // Ensure clamping to [0, 90]
      slopeDeg = Math.min(90.0, Math.max(0.0, slopeDeg));

      const idx = r1 + x;
      slopeMap[idx] = slopeDeg;

      if (slopeDeg < minSlope) minSlope = slopeDeg;
      if (slopeDeg > maxSlope) maxSlope = slopeDeg;
      sumSlope += slopeDeg;
    }
  }

  const meanSlope = sumSlope / (width * height);

  return {
    slopeMap,
    meanSlopeDeg: Number(meanSlope.toFixed(2)),
    maxSlopeDeg: Number(maxSlope.toFixed(2)),
    method: 'SOBEL_APPROXIMATE',
  };
}
