/**
 * LunarSafe Mission Software — Advanced Planetary Engineering Verification Suite
 * Team Rocket · AEROX Club · Parul University · Project Head: DARSHAN BAGUL (PATIL)
 *
 * Verifies:
 * 1. AHP Multi-Criteria Landing Site Ranking Matrix (AHP/TOPSIS + Earth visibility + solar duty cycle)
 * 2. Crater Ellipse Fitting & Depth-to-Diameter (d/D) Morphometry (Pike 1977 scaling)
 * 3. Bekker Terramechanics-Aware Energy Traverse Planner (A* pathfinding with regolith rolling resistance)
 */

import assert from 'assert';
import { ARTEMIS_III_SITES } from '../src/data/artemisSitesData';
import { AHPRankingEngine, AHP_CRITERIA_MATRIX } from '../src/lib/ahpRankingEngine';
import { CraterMorphometryService } from '../src/lib/craterMorphometry';
import { TerramechanicsPlannerService, DEFAULT_ROVER_SPECS } from '../src/lib/terramechanicsPlanner';
import { GridCell, SafeLandingZone } from '../src/types';

console.log('================================================================================');
console.log('    LUNARSAFE ADVANCED PLANETARY ENGINEERING MODULES VERIFICATION SUITE         ');
console.log('================================================================================\n');

// -----------------------------------------------------------------------------
// TEST SUITE 1: AHP MULTI-CRITERIA DECISION ANALYSIS (AHP / TOPSIS)
// -----------------------------------------------------------------------------
console.log('--- TEST SUITE 1: AHP MULTI-CRITERIA DECISION ANALYSIS ---');

// 1.1 Pairwise Matrix Consistency
const ahpWeights = AHPRankingEngine.computeAHPWeights(AHP_CRITERIA_MATRIX);
console.log(`[AHP] Priority Weights: Slope=${(ahpWeights.weights[0]*100).toFixed(1)}%, Solar=${(ahpWeights.weights[1]*100).toFixed(1)}%, DTE=${(ahpWeights.weights[2]*100).toFixed(1)}%, Roughness=${(ahpWeights.weights[3]*100).toFixed(1)}%, Prominence=${(ahpWeights.weights[4]*100).toFixed(1)}%`);
console.log(`[AHP] Principal Eigenvalue λ_max = ${ahpWeights.lambdaMax.toFixed(3)}, CI = ${ahpWeights.ci.toFixed(4)}, CR = ${ahpWeights.cr.toFixed(4)}`);

assert(ahpWeights.isConsistent, 'AHP comparison matrix must satisfy Saaty consistency (CR < 0.10)');
assert(ahpWeights.cr < 0.10, `Consistency ratio ${ahpWeights.cr} must be strictly < 0.10`);
assert.strictEqual(ahpWeights.weights.length, 5, 'Must have 5 normalized criteria weights');
const weightSum = ahpWeights.weights.reduce((a, b) => a + b, 0);
assert(Math.abs(weightSum - 1.0) < 1e-5, 'AHP weights must sum to 1.0');
console.log('[ASSERT 1.1] Saaty AHP Matrix Consistency Verification (CR < 0.10): PASS');

// 1.2 Earth Visibility & DTE Radio Elevation
const shackletonDte = AHPRankingEngine.computeEarthElevationDeg(-89.54, 129.78, 1120);
console.log(`[DTE] Shackleton Peak Earth Elevation: ${shackletonDte.elevationDeg}°, Availability: ${shackletonDte.availabilityPct}%, Status: ${shackletonDte.dteStatus}`);
assert(shackletonDte.elevationDeg > 0, 'Shackleton Peak must have positive geometric Earth elevation');
assert.strictEqual(shackletonDte.dteStatus, 'MARGINAL_LIBRATION', 'Shackleton summit requires librational compensation');

const faustiniDte = AHPRankingEngine.computeEarthElevationDeg(-87.16, 77.0, 1500);
console.log(`[DTE] Faustini Rim Earth Elevation: ${faustiniDte.elevationDeg}°, Availability: ${faustiniDte.availabilityPct}%, Status: ${faustiniDte.dteStatus}`);
assert.strictEqual(faustiniDte.dteStatus, 'CONTINUOUS_LOS', 'Lower-latitude ridge crest maintains continuous DTE line of sight');

const deepPsrDte = AHPRankingEngine.computeEarthElevationDeg(-89.95, 0.0, -3500);
console.log(`[DTE] Deep South Pole Depression Earth Elevation: ${deepPsrDte.elevationDeg}°, Availability: ${deepPsrDte.availabilityPct}%, Status: ${deepPsrDte.dteStatus}`);
assert(deepPsrDte.elevationDeg < 1.0, 'Deep polar crater floors suffer from severe Earth occultation');
console.log('[ASSERT 1.2] Direct-to-Earth (DTE) Radio Elevation & Horizon Masking: PASS');

// 1.3 Full Artemis III 13-Site AHP/TOPSIS Evaluation
const rankingResult = AHPRankingEngine.evaluateLandingSites(ARTEMIS_III_SITES, 10.0);
assert.strictEqual(rankingResult.evaluations.length, 13, 'Must evaluate all 13 Artemis III candidate sites');
assert(rankingResult.topCandidate.ahpScore >= 75.0, 'Top candidate must achieve high composite score');
assert(rankingResult.topCandidate.isCertifiedSafe, 'Top candidate must be certified flight-safe');
console.log(`[AHP RANKING] Top Candidate: Rank 1 = ${rankingResult.topCandidate.name} (Score: ${rankingResult.topCandidate.ahpScore}/100, TOPSIS Closeness: ${rankingResult.topCandidate.topsisCloseness})`);
console.log(`[ASSERT 1.3] Multi-Criteria AHP/TOPSIS Matrix (13 Sites Ranked): PASS`);

// -----------------------------------------------------------------------------
// TEST SUITE 2: CRATER ELLIPSE FITTING & DEPTH-TO-DIAMETER (d/D) MORPHOMETRY
// -----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 2: CRATER ELLIPSE FITTING & DEPTH-TO-DIAMETER (d/D) ---');

// 2.1 Ellipse Moments on Simple Crater
const mockCraterBox = { x1: 100, y1: 100, x2: 150, y2: 140 }; // 50px x 40px
const ellipseProfile = CraterMorphometryService.fitEllipseToCrater(
  mockCraterBox,
  undefined,
  1.0, // 1 m/pixel
  'crater-test-1'
);

console.log(`[ELLIPSE] Semi-major a = ${ellipseProfile.semiMajorM}m, Semi-minor b = ${ellipseProfile.semiMinorM}m, Circularity = ${ellipseProfile.circularity}`);
console.log(`[PIKE 1977] Diameter D = ${ellipseProfile.diameterM}m, Depth d = ${ellipseProfile.depthPikeM}m, d/D = ${ellipseProfile.depthToDiameterRatio}, Wall Slope = ${ellipseProfile.rimSlopeDeg}°`);

assert.strictEqual(ellipseProfile.semiMajorM, 25.0, 'Semi-major axis must match half of max span');
assert.strictEqual(ellipseProfile.semiMinorM, 20.0, 'Semi-minor axis must match half of min span');
assert.strictEqual(ellipseProfile.diameterM, 50.0, 'Physical diameter must equal 2 * semi-major axis');
assert.strictEqual(ellipseProfile.craterClass, 'SIMPLE_BOWL', '50m crater must be classified as SIMPLE_BOWL');
// For D = 50m: d = 0.196 * 50^1.010 = 0.196 * 51.52 = ~10.1m
assert(ellipseProfile.depthPikeM > 9.5 && ellipseProfile.depthPikeM < 11.0, 'Depth must follow Pike (1977) d = 0.196 * D^1.010');
assert(ellipseProfile.depthToDiameterRatio >= 0.18 && ellipseProfile.depthToDiameterRatio <= 0.22, 'Simple crater d/D ratio must lie in 0.18-0.22 range');
assert(ellipseProfile.isHazard, '50m crater with 10m depth must be flagged as FLIGHT HAZARD');
console.log('[ASSERT 2.1] Pike (1977) Power-Law Depth-to-Diameter Verification: PASS');

// 2.2 Micro-Crater Classification
const microBox = { x1: 10, y1: 10, x2: 14, y2: 14 }; // 4m diameter at 1 m/px
const microProfile = CraterMorphometryService.fitEllipseToCrater(microBox, undefined, 1.0, 'micro-1');
assert.strictEqual(microProfile.craterClass, 'MICRO_CRATER', 'Craters < 10m must be classified as MICRO_CRATER');
console.log(`[ASSERT 2.2] Micro-Crater Morphology & Scale Transition Verification: PASS`);

// -----------------------------------------------------------------------------
// TEST SUITE 3: BEKKER TERRAMECHANICS-AWARE ENERGY TRAVERSE PLANNER
// -----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 3: BEKKER TERRAMECHANICS ENERGY TRAVERSE PLANNER ---');

// 3.1 Resistance Forces on Level and Sloped Ground
const levelForces = TerramechanicsPlannerService.computeTractiveForce(0.0, DEFAULT_ROVER_SPECS);
console.log(`[TERRAMECHANICS 0°] Grade: ${levelForces.gradeForceN}N, Roll: ${levelForces.rollingForceN}N, Sinkage: ${levelForces.sinkageForceN}N, Total: ${levelForces.tractiveForceN}N`);
assert(levelForces.gradeForceN === 0, 'On 0° slope, grade force must be zero');
assert(levelForces.tractiveForceN > 35 && levelForces.tractiveForceN < 90, 'On level ground, tractive force is purely rolling & sinkage resistance');

const slopeForces = TerramechanicsPlannerService.computeTractiveForce(8.0, DEFAULT_ROVER_SPECS);
console.log(`[TERRAMECHANICS 8°] Grade: ${slopeForces.gradeForceN}N, Roll: ${slopeForces.rollingForceN}N, Total: ${slopeForces.tractiveForceN}N`);
assert(slopeForces.gradeForceN > 65.0, 'Ascending 8° slope creates positive grade resistance');
assert(slopeForces.tractiveForceN > levelForces.tractiveForceN, 'Sloped climbing requires higher tractive force than flat ground');

const extremeSlopeForces = TerramechanicsPlannerService.computeTractiveForce(18.0, DEFAULT_ROVER_SPECS);
assert.strictEqual(extremeSlopeForces.isTraversable, false, 'Slopes > 15° must be classified as untraversable tip-over hazard');
assert.strictEqual(extremeSlopeForces.tractiveForceN, Infinity, 'Untraversable slope cost must be Infinity');
console.log('[ASSERT 3.1] Bekker Gravitational Grade & Soil Resistance Formulation: PASS');

// 3.2 A* Energy-Optimal Traverse on Grid
const cols = 10;
const rows = 10;
const cellSizeM = 24.0;
const mockCells: GridCell[][] = [];

for (let y = 0; y < rows; y++) {
  const row: GridCell[] = [];
  for (let x = 0; x < cols; x++) {
    const isHazard = (x === 4 && y >= 2 && y <= 7); // Vertical obstacle ridge at column 4
    row.push({
      gx: x,
      gy: y,
      pixelBounds: {
        x1: x * 24,
        y1: y * 24,
        x2: (x + 1) * 24,
        y2: (y + 1) * 24,
      },
      isSafe: !isHazard,
      meanSlopeDeg: isHazard ? 20.0 : 3.5,
      maxSlopeDeg: isHazard ? 25.0 : 4.8,
      boulderCount: isHazard ? 5 : 0,
      craterCount: isHazard ? 3 : 0,
      hazardReason: isHazard ? 'SLOPE_EXCEEDED' : 'NONE',
    });
  }
  mockCells.push(row);
}

const mockStartZone: SafeLandingZone = {
  id: 'ZONE_ALPHA_1',
  centerGrid: [1, 5],
  centerPixel: [24, 120],
  areaM2: 50000,
  cellCount: 86,
  widthM: 220,
  heightM: 220,
  meanSlopeDeg: 2.5,
  clearanceMarginM: 48,
  cells: [[1, 5], [1, 4], [2, 5]],
  rank: 1,
  safetyScore: 96,
};

const mockTargetZone: SafeLandingZone = {
  id: 'ZONE_BETA_2',
  centerGrid: [8, 5],
  centerPixel: [192, 120],
  areaM2: 40000,
  cellCount: 69,
  widthM: 200,
  heightM: 200,
  meanSlopeDeg: 3.0,
  clearanceMarginM: 48,
  cells: [[8, 5], [8, 4], [7, 5]],
  rank: 2,
  safetyScore: 92,
};

const traversePlan = TerramechanicsPlannerService.planTraverse(
  mockCells,
  cols,
  rows,
  cellSizeM,
  mockStartZone,
  mockTargetZone,
  5.0, // 5° polar solar elevation
  DEFAULT_ROVER_SPECS
);

assert(traversePlan !== null, 'A* Terramechanic planner must find valid path around obstacle ridge');
assert(traversePlan.totalDistanceM > 0, 'Path length must be positive');
assert(traversePlan.totalEnergyWh > 0, 'Total consumed energy must be positive');
assert(traversePlan.totalSolarGeneratedWh > 0, 'Solar array must generate recharge power');
assert(traversePlan.isSafeTraverse, 'Planned path must stay within safe slope limits');
assert(traversePlan.maxSlopeDeg <= 15.0, 'Traverse route must not exceed 15° max slope');

console.log(`[TRAVERSE RESULT] ${traversePlan.scientificSummary}`);
console.log(`[TRAVERSE STATS] Waypoints: ${traversePlan.waypoints.length}, Distance: ${traversePlan.totalDistanceM}m, Net Energy: ${traversePlan.netEnergyWh} Wh, Peak Power: ${traversePlan.peakPowerWatts}W`);
console.log('[ASSERT 3.2] A* Terramechanics Pathfinding & Obstacle Ridge Evasion: PASS');

console.log('\n================================================================================');
console.log('FINAL VERIFICATION RESULT: ALL ADVANCED PLANETARY ENGINEERING TESTS PASSED');
console.log('================================================================================\n');
