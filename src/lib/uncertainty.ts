/**
 * LunarSafe Mission Software — DEM Slope Uncertainty Quantification Engine
 * Team Rocket · AEROX Club · Parul University · Project Head: Darshan Patil
 *
 * Implements rigorous first-order error propagation through Horn's (1981)
 * 3×3 weighted finite-difference slope estimator based on DEM vertical accuracy (sigma_z)
 * and horizontal ground sample distance (GSD).
 */

export interface UncertaintyResult {
  slopeDeg: number;
  slopeMinusDeg: number;   // lower bound (slopeDeg - delta)
  slopePlusDeg: number;    // upper bound (slopeDeg + delta)
  sigmaElevM: number;      // input vertical uncertainty
  sigmaSlopeDeg: number;   // propagated slope uncertainty
  method: 'HORN_FINITE_DIFF_FIRST_ORDER';
}

// ASSUMPTION: This derivation assumes independent and identically 
// distributed (i.i.d.) Gaussian elevation errors per pixel. Real DEMs 
// (including LOLA GDR) have spatially correlated errors with correlation 
// length ~1 km. The i.i.d. assumption OVER-ESTIMATES uncertainty at fine 
// GSD. This is appropriate for landing safety: the estimator is 
// conservative by design. At GSD ≤ 1 m, the formula will produce 
// unrealistically large sigma values and should not be used without 
// modifying the correlation model.

/**
 * Analytical Derivation of First-Order Error Propagation through Horn's (1981) Method:
 *
 * 1. Finite Difference Gradients:
 *    Let 3x3 elevation neighbourhood around (x, y) be:
 *      z00  z10  z20
 *      z01  z11  z21
 *      z02  z12  z22
 *
 *    Horn (1981) estimators:
 *      p = dzdx = ((z20 + 2*z21 + z22) - (z00 + 2*z01 + z02)) / (8 * GSD)
 *      q = dzdy = ((z02 + 2*z12 + z22) - (z00 + 2*z10 + z20)) / (8 * GSD)
 *
 * 2. Variance of Gradients (assuming i.i.d. elevation errors with variance sigma_z^2):
 *    sigma_p^2 = sum_i (dp/dz_i)^2 * sigma_z^2
 *              = (1^2 + 2^2 + 1^2 + (-1)^2 + (-2)^2 + (-1)^2) / (8 * GSD)^2 * sigma_z^2
 *              = (1 + 4 + 1 + 1 + 4 + 1) / (64 * GSD^2) * sigma_z^2
 *              = 12 / (64 * GSD^2) * sigma_z^2
 *              = 3 / (16 * GSD^2) * sigma_z^2
 *    sigma_p   = sqrt(12) / (8 * GSD) * sigma_z = sqrt(3) / (4 * GSD) * sigma_z
 *
 *    Similarly:
 *    sigma_q   = sqrt(12) / (8 * GSD) * sigma_z = sqrt(3) / (4 * GSD) * sigma_z
 *
 * 3. Covariance between p and q:
 *    Cov(p, q) = sum_i (dp/dz_i) * (dq/dz_i) * sigma_z^2
 *    Shared cells are the 4 corners:
 *      z00: (-1) * (-1) = +1
 *      z20: (+1) * (-1) = -1
 *      z02: (-1) * (+1) = -1
 *      z22: (+1) * (+1) = +1
 *    Sum of product weights = 1 - 1 - 1 + 1 = 0.
 *    Therefore, Cov(p, q) = 0 (Horn's symmetric stencil renders p and q uncorrelated).
 *
 * 4. Error Propagation to Slope:
 *    Slope S = atan(sqrt(p^2 + q^2))
 *    Let r = sqrt(p^2 + q^2) = tan(S).
 *    dS/dp = (1 / (1 + r^2)) * (dr/dp) = (1 / (1 + p^2 + q^2)) * (p / sqrt(p^2 + q^2))
 *    dS/dq = (1 / (1 + r^2)) * (dr/dq) = (1 / (1 + p^2 + q^2)) * (q / sqrt(p^2 + q^2))
 *
 *    (dS/dp)^2 + (dS/dq)^2 = (p^2 + q^2) / [ (1 + p^2 + q^2)^2 * (p^2 + q^2) ]
 *                          = 1 / (1 + p^2 + q^2)^2
 *                          = 1 / (1 + tan^2(S))^2
 *                          = 1 / (sec^2(S))^2
 *                          = cos^4(S)
 *
 *    sigma_S^2 = (dS/dp)^2 * sigma_p^2 + (dS/dq)^2 * sigma_q^2
 *              = sigma_p^2 * [ (dS/dp)^2 + (dS/dq)^2 ]
 *              = sigma_p^2 * cos^4(S)
 *
 *    sigma_S = sigma_p * cos^2(S)  (in radians)
 *            = [ sqrt(3) * sigma_z / (4 * GSD) ] * cos^2(S)
 *
 *    Converting to degrees:
 *    sigma_S_deg = sigma_S * (180 / pi)
 *                = [ sqrt(3) * sigma_z / (4 * GSD) ] * cos^2(S) * (180 / pi)
 *
 * 5. Boundary Handling & Extrapolation Notice:
 *    For interior pixels (x in [1, width-2], y in [1, height-2]), exact Horn finite difference
 *    weights are strictly valid. At the 1-pixel outer border, boundary conditions use linear extrapolation
 *    z(-1) = 2*z(0) - z(1), which yields an effective variance of 2*sigma_z^2 on extrapolated nodes.
 *    The first-order propagation applies the standard Horn variance model uniformly across the tile.
 *
 * 6. Display-Only Precision Notice:
 *    meanSlopeDeg and meanSigmaSlopeDeg are rounded via .toFixed() exclusively for human-readable console
 *    and UI metrics. Downstream engines, SHA-256 hash chains, and hazard classifiers operate directly
 *    on uncompressed IEEE 754 Float32 arrays without precision loss.
 */

// Standard LOLA vertical accuracy (Smith et al., 2010, GRL 37, L02201, doi:10.1029/2009GL041746)
export const LOLA_VERTICAL_SIGMA_M = 1.0;

export function computeSlopeUncertainty(
  dem: Float32Array,
  width: number,
  height: number,
  gsdMetersPerPixel: number,
  sigmaElevM: number = LOLA_VERTICAL_SIGMA_M
): {
  meanSlopeDeg: number;
  meanSigmaSlopeDeg: number;
  maxSigmaSlopeDeg: number;
  perPixelSigma: Float32Array;
} {
  const totalPixels = width * height;
  const perPixelSigma = new Float32Array(totalPixels);

  if (totalPixels === 0 || gsdMetersPerPixel <= 0) {
    return {
      meanSlopeDeg: 0,
      meanSigmaSlopeDeg: 0,
      maxSigmaSlopeDeg: 0,
      perPixelSigma,
    };
  }

  // Factor: (sqrt(3) * sigmaElevM) / (4 * gsdMetersPerPixel) * (180 / pi)
  const baseSigmaRad = (Math.sqrt(3) * sigmaElevM) / (4.0 * gsdMetersPerPixel);
  const baseSigmaDeg = baseSigmaRad * (180.0 / Math.PI);

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

  let sumSlopeDeg = 0;
  let sumSigmaDeg = 0;
  let maxSigmaDeg = 0;

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

      const dzdx = ((z20 + 2 * z21 + z22) - (z00 + 2 * z01 + z02)) / (8.0 * gsdMetersPerPixel);
      const dzdy = ((z02 + 2 * z12 + z22) - (z00 + 2 * z10 + z20)) / (8.0 * gsdMetersPerPixel);

      const slopeRad = Math.atan(Math.sqrt(dzdx * dzdx + dzdy * dzdy));
      const slopeDeg = (slopeRad * 180.0) / Math.PI;

      // Exact first-order error propagation: sigma_slope = baseSigmaDeg * cos^2(slopeRad)
      const cosSlope = Math.cos(slopeRad);
      const sigmaSlopeDeg = baseSigmaDeg * cosSlope * cosSlope;

      perPixelSigma[y * width + x] = sigmaSlopeDeg;
      sumSlopeDeg += slopeDeg;
      sumSigmaDeg += sigmaSlopeDeg;
      if (sigmaSlopeDeg > maxSigmaDeg) {
        maxSigmaDeg = sigmaSlopeDeg;
      }
    }
  }

  const meanSlopeDeg = Number((sumSlopeDeg / totalPixels).toFixed(2));
  const meanSigmaSlopeDeg = Number((sumSigmaDeg / totalPixels).toFixed(4));
  const maxSigmaSlopeDeg = Number(maxSigmaDeg.toFixed(4));

  return {
    meanSlopeDeg,
    meanSigmaSlopeDeg,
    maxSigmaSlopeDeg,
    perPixelSigma,
  };
}
