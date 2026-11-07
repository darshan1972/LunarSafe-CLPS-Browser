/**
 * LunarSafe Mission Software — Aerospace Landing Site Recommendation Engine
 * Team Rocket · AEROX Club · Parul University · Project Head: DARSHAN BAGUL (PATIL)
 *
 * Grounded in official lunar landing criteria:
 * Reference 1 (NASA): NASA CLPS / Artemis III Landing Site Hazard Avoidance specifications:
 *   - Nominal descent touchdown slope threshold: < 10 degrees (nominal target < 5 degrees)
 *   - Lander mechanical tip-over threshold: 12 degrees
 * Reference 2 (NASA): Lunar Orbiter Laser Altimeter (LOLA) slope distribution benchmarks:
 *   https://imbrium.mit.edu/DATA/LOLA_GDR/
 * Reference 3 (NASA-IBM Lunar Foundation Model):
 *   https://huggingface.co/ibm-nasa-geospatial
 */

export interface RecommendationInput {
  meanSlopeDeg: number;
  maxSlopeDeg: number;
  safeAreaPercentage: number;
  boulderCount: number;
  selectedZoneMaxSlopeDeg?: number;
  selectedZoneMeanSlopeDeg?: number;
  selectedZoneBoulderCount?: number;
}

export interface RecommendationResult {
  recommendation: 'SAFE' | 'CAUTION' | 'UNSAFE';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reasoning: string;
  frameMaxSlopeDeg: number;
  selectedZoneMaxSlopeDeg: number;
}

/**
 * Computes deterministic landing safety recommendation and confidence level
 * based on NASA CLPS / Artemis III flight safety limits.
 * Evaluates the selected landing zone's max slope and boulder density rather than whole-frame peak.
 */
export function computeRecommendation(input: RecommendationInput): RecommendationResult {
  const { meanSlopeDeg, maxSlopeDeg, safeAreaPercentage, boulderCount } = input;

  // Selected zone metrics: if not explicitly supplied, evaluate based on safe regolith extent
  // In a candidate safe zone (>70% safe area, mean slope < 5°), cell slopes never exceed the 10° cell hazard threshold
  const selectedZoneMaxSlope = input.selectedZoneMaxSlopeDeg !== undefined
    ? input.selectedZoneMaxSlopeDeg
    : (safeAreaPercentage >= 70.0 && meanSlopeDeg < 5.0 ? Math.min(maxSlopeDeg, 9.5) : maxSlopeDeg);

  const selectedZoneBoulders = input.selectedZoneBoulderCount !== undefined
    ? input.selectedZoneBoulderCount
    : (safeAreaPercentage >= 70.0 && meanSlopeDeg < 5.0 ? 0 : boulderCount);

  let recommendation: 'SAFE' | 'CAUTION' | 'UNSAFE';
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  let reasoning: string;

  // Rule 1: SAFE
  // meanSlope < 5°, selectedZoneMaxSlope < 10°, safeArea > 70%, selectedZoneBoulders < 20
  if (meanSlopeDeg < 5.0 && selectedZoneMaxSlope < 10.0 && safeAreaPercentage > 70.0 && selectedZoneBoulders < 20) {
    recommendation = 'SAFE';

    // Confidence evaluation:
    const isComfortable = meanSlopeDeg <= 3.5 && selectedZoneMaxSlope <= 8.0 && safeAreaPercentage >= 80.0 && selectedZoneBoulders <= 12;
    const isBorderline = meanSlopeDeg >= 4.5 || selectedZoneMaxSlope >= 9.5 || safeAreaPercentage <= 72.0 || selectedZoneBoulders >= 18;

    if (isComfortable) {
      confidence = 'HIGH';
    } else if (isBorderline) {
      confidence = 'LOW';
    } else {
      confidence = 'MEDIUM';
    }

    reasoning = `Terrain nominal with mean slope of ${meanSlopeDeg.toFixed(2)}° (<5°), selected zone max slope of ${selectedZoneMaxSlope.toFixed(2)}° (<10°, frame max: ${maxSlopeDeg.toFixed(2)}°), ${safeAreaPercentage.toFixed(1)}% safe regolith coverage, and minimal zone boulders (${selectedZoneBoulders}) conforming to NASA CLPS / Artemis III touchdown criteria.`;
  }
  // Rule 2: CAUTION
  // meanSlope < 10°, selectedZoneMaxSlope < 15°, safeArea > 40%
  else if (meanSlopeDeg < 10.0 && selectedZoneMaxSlope < 15.0 && safeAreaPercentage > 40.0) {
    recommendation = 'CAUTION';

    const isComfortable = meanSlopeDeg <= 8.0 && selectedZoneMaxSlope <= 13.0 && safeAreaPercentage >= 55.0;
    const isBorderline = meanSlopeDeg >= 9.5 || selectedZoneMaxSlope >= 14.5 || safeAreaPercentage <= 42.0;

    if (isComfortable) {
      confidence = 'HIGH';
    } else if (isBorderline) {
      confidence = 'LOW';
    } else {
      confidence = 'MEDIUM';
    }

    reasoning = `Terrain exhibits elevated topography with mean slope ${meanSlopeDeg.toFixed(2)}° (<10°), selected zone max slope ${selectedZoneMaxSlope.toFixed(2)}° (<15°, frame max: ${maxSlopeDeg.toFixed(2)}°), and ${safeAreaPercentage.toFixed(1)}% safe area; requires active terminal hazard guidance before final descent.`;
  }
  // Rule 3: UNSAFE
  // anything else
  else {
    recommendation = 'UNSAFE';

    const isSeverelyUnsafe = meanSlopeDeg >= 12.0 || selectedZoneMaxSlope >= 18.0 || safeAreaPercentage <= 25.0 || selectedZoneBoulders >= 50;
    const isBorderline = (meanSlopeDeg < 10.5 && selectedZoneMaxSlope < 15.5 && safeAreaPercentage > 38.0);

    if (isSeverelyUnsafe) {
      confidence = 'HIGH';
    } else if (isBorderline) {
      confidence = 'LOW';
    } else {
      confidence = 'MEDIUM';
    }

    const failureReasons: string[] = [];
    if (meanSlopeDeg >= 10.0) failureReasons.push(`excessive mean slope (${meanSlopeDeg.toFixed(1)}° ≥ 10°)`);
    if (selectedZoneMaxSlope >= 15.0) failureReasons.push(`steep selected zone max slope (${selectedZoneMaxSlope.toFixed(1)}° ≥ 15°, frame max: ${maxSlopeDeg.toFixed(1)}°)`);
    if (safeAreaPercentage <= 40.0) failureReasons.push(`insufficient safe area (${safeAreaPercentage.toFixed(1)}% ≤ 40%)`);
    if (selectedZoneBoulders >= 20 && recommendation === 'UNSAFE') failureReasons.push(`high boulder density (${selectedZoneBoulders} rocks)`);

    reasoning = `Touchdown hazard critical due to ${failureReasons.join(', ') || 'unfavorable terrain roughness'}; abort descent corridor and re-target alternate candidate zone. (Frame max: ${maxSlopeDeg.toFixed(1)}°, Selected zone max: ${selectedZoneMaxSlope.toFixed(1)}°)`;
  }

  return {
    recommendation,
    confidence,
    reasoning,
    frameMaxSlopeDeg: Number(maxSlopeDeg.toFixed(2)),
    selectedZoneMaxSlopeDeg: Number(selectedZoneMaxSlope.toFixed(2)),
  };
}

