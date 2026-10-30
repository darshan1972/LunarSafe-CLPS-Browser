/**
 * LunarSafe Mission Software — Conservative Hazard Classifier with Uncertainty
 * Team Rocket · AEROX Club · Parul University · Project Head: Darshan Patil
 *
 * Integrates deterministic slope maps with propagated DEM vertical uncertainty (sigma)
 * over ISRO standard 24m landing cells to provide conservative landing safety labels.
 */

export interface ConservativeHazardResult {
  cellSafe: Uint8Array;           // 1 = safe, 0 = hazard (deterministic)
  cellSafeConservative: Uint8Array; // 1 = safe including upper bound (conservative)
  cellMeanSlopeDeg: Float32Array;
  cellMeanSigmaDeg: Float32Array;
  cellUpperBoundDeg: Float32Array;   // mean + sigmaMultiplier * sigma (95% CI for multiplier=2)
  safeCount: number;
  safeCountConservative: number;
  hazardCount: number;
  hazardCountConservative: number;
}

/**
 * Classifies hazards over 24m landing cells using both deterministic slope
 * and upper-bound slope (mean + 2*sigma).
 *
 * @param slopeMap Per-pixel slope in degrees
 * @param perPixelSigma Per-pixel propagated slope uncertainty in degrees
 * @param width Image / raster width
 * @param height Image / raster height
 * @param gsdMetersPerPixel Ground sample distance in meters/pixel
 * @param craterMask Optional binary mask of crater hazards (1 = crater, 0 = clear)
 * @param boulderMask Optional binary mask of boulder hazards (1 = boulder, 0 = clear)
 * @param safeSlopeThresholdDeg Safe landing slope threshold (default 10.0°)
 * @param sigmaMultiplier Confidence multiplier (default 2.0 for ~95% confidence)
 */
export function classifyHazardConservative(
  slopeMap: Float32Array,
  perPixelSigma: Float32Array,
  width: number,
  height: number,
  gsdMetersPerPixel: number,
  craterMask?: Uint8Array | null,
  boulderMask?: Uint8Array | null,
  safeSlopeThresholdDeg: number = 10.0,
  sigmaMultiplier: number = 2.0
): ConservativeHazardResult {
  const cellSizePx = Math.max(1, Math.round(24.0 / gsdMetersPerPixel));
  const cols = Math.max(1, Math.ceil(width / cellSizePx));
  const rows = Math.max(1, Math.ceil(height / cellSizePx));
  const totalCells = cols * rows;

  const cellSafe = new Uint8Array(totalCells);
  const cellSafeConservative = new Uint8Array(totalCells);
  const cellMeanSlopeDeg = new Float32Array(totalCells);
  const cellMeanSigmaDeg = new Float32Array(totalCells);
  const cellUpperBoundDeg = new Float32Array(totalCells);

  let safeCount = 0;
  let safeCountConservative = 0;

  for (let cy = 0; cy < rows; cy++) {
    const yStart = cy * cellSizePx;
    const yEnd = Math.min(height, yStart + cellSizePx);

    for (let cx = 0; cx < cols; cx++) {
      const xStart = cx * cellSizePx;
      const xEnd = Math.min(width, xStart + cellSizePx);

      const cellIdx = cy * cols + cx;
      let sumSlope = 0;
      let sumSigma = 0;
      let pixelCount = 0;
      let hasHazardFeature = false;

      for (let y = yStart; y < yEnd; y++) {
        const rowOffset = y * width;
        for (let x = xStart; x < xEnd; x++) {
          const pIdx = rowOffset + x;
          sumSlope += slopeMap[pIdx] || 0;
          sumSigma += perPixelSigma[pIdx] || 0;
          pixelCount++;

          if (craterMask && craterMask[pIdx] > 0) {
            hasHazardFeature = true;
          }
          if (boulderMask && boulderMask[pIdx] > 0) {
            hasHazardFeature = true;
          }
        }
      }

      const meanSlope = pixelCount > 0 ? sumSlope / pixelCount : 0;
      const meanSigma = pixelCount > 0 ? sumSigma / pixelCount : 0;
      const upperBound = meanSlope + sigmaMultiplier * meanSigma;

      cellMeanSlopeDeg[cellIdx] = meanSlope;
      cellMeanSigmaDeg[cellIdx] = meanSigma;
      cellUpperBoundDeg[cellIdx] = upperBound;

      // Deterministic classification: mean slope <= threshold AND clear of craters/boulders
      const isSafeDeterministic = (meanSlope <= safeSlopeThresholdDeg) && !hasHazardFeature;
      if (isSafeDeterministic) {
        cellSafe[cellIdx] = 1;
        safeCount++;
      } else {
        cellSafe[cellIdx] = 0;
      }

      // Conservative classification: upper bound (mean + 2*sigma) <= threshold AND clear
      const isSafeConservative = (upperBound <= safeSlopeThresholdDeg) && !hasHazardFeature;
      if (isSafeConservative) {
        cellSafeConservative[cellIdx] = 1;
        safeCountConservative++;
      } else {
        cellSafeConservative[cellIdx] = 0;
      }
    }
  }

  return {
    cellSafe,
    cellSafeConservative,
    cellMeanSlopeDeg,
    cellMeanSigmaDeg,
    cellUpperBoundDeg,
    safeCount,
    safeCountConservative,
    hazardCount: totalCells - safeCount,
    hazardCountConservative: totalCells - safeCountConservative,
  };
}
