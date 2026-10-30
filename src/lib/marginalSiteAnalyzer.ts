/**
 * LunarSafe Mission Software — Marginal Site Sensitivity Analyzer
 * Team Rocket · AEROX Club · Parul University · Project Head: Darshan Patil
 *
 * Evaluates the sensitivity of safe landing site selection to DEM vertical accuracy (sigma_z)
 * across candidate terrain, quantifying the reduction in safe landing area under conservative
 * uncertainty bounds.
 */

import { computeSlopeFromDEM } from './demSlope';
import { computeSlopeUncertainty } from './uncertainty';
import { classifyHazardConservative } from './hazardClassifier';

export interface SensitivityResult {
  sigmaElevM: number;
  safeCountDet: number;
  safeCountCons: number;
  reductionPct: number;
}

/**
 * Analyzes landing cell safety sensitivity across varying elevation uncertainty levels.
 *
 * @param dem Raw float elevation grid (Float32Array)
 * @param width Raster width in pixels
 * @param height Raster height in pixels
 * @param gsdMetersPerPixel Ground sample distance in meters/pixel
 * @param sigmaElevLevels Array of DEM vertical uncertainty levels to test (in meters)
 * @param slopeThresholdDeg Deterministic safe slope threshold in degrees (e.g., 10.0°)
 * @param sigmaMultiplier Confidence interval multiplier (e.g., 2.0 for ~95% confidence)
 * @returns Array of SensitivityResult for each sigma level
 */
export function analyzeSensitivity(
  dem: Float32Array,
  width: number,
  height: number,
  gsdMetersPerPixel: number,
  sigmaElevLevels: number[],
  slopeThresholdDeg: number = 10.0,
  sigmaMultiplier: number = 2.0
): SensitivityResult[] {
  const { slopeMap } = computeSlopeFromDEM(dem, width, height, gsdMetersPerPixel);

  return sigmaElevLevels.map((sigmaElevM) => {
    const { perPixelSigma } = computeSlopeUncertainty(
      dem,
      width,
      height,
      gsdMetersPerPixel,
      sigmaElevM
    );

    const classification = classifyHazardConservative(
      slopeMap,
      perPixelSigma,
      width,
      height,
      gsdMetersPerPixel,
      null,
      null,
      slopeThresholdDeg,
      sigmaMultiplier
    );

    const safeCountDet = classification.safeCount;
    const safeCountCons = classification.safeCountConservative;
    const reductionPct =
      safeCountDet > 0
        ? ((safeCountDet - safeCountCons) / safeCountDet) * 100.0
        : 0.0;

    return {
      sigmaElevM,
      safeCountDet,
      safeCountCons,
      reductionPct,
    };
  });
}
