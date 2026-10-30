import * as fs from 'fs';
import * as path from 'path';
import { classifyHazardConservative } from '../src/lib/hazardClassifier';
import { computeSlopeFromDEM } from '../src/lib/demSlope';
import { computeSlopeUncertainty } from '../src/lib/uncertainty';

console.log('============================================================');
console.log('    LUNARSAFE PHASE 5: CONSERVATIVE HAZARD CLASSIFIER TEST   ');
console.log('============================================================\n');

let allPassed = true;

// TEST 1: Synthetic 9.5° plane with sigma = 1.0
// cellSafe = 1 (9.5 <= 10.0), cellSafeConservative = 0 (9.5 + 2*1.0 = 11.5 > 10.0)
console.log('--- TEST 1: Marginal Safe Slope with Uncertainty Exceeding Threshold ---');
const w1 = 48, h1 = 48, gsd1 = 1.0;
const slopeMap1 = new Float32Array(w1 * h1).fill(9.5);
const sigmaMap1 = new Float32Array(w1 * h1).fill(1.0);

const res1 = classifyHazardConservative(slopeMap1, sigmaMap1, w1, h1, gsd1, null, null, 10.0, 2.0);
console.log(`Test 1 Slope:               9.50°`);
console.log(`Test 1 Sigma:               1.00°`);
console.log(`Test 1 Upper Bound:         ${res1.cellUpperBoundDeg[0].toFixed(2)}° (Threshold: 10.00°)`);
console.log(`Deterministic Safe Count:   ${res1.safeCount} / ${res1.cellSafe.length}`);
console.log(`Conservative Safe Count:    ${res1.safeCountConservative} / ${res1.cellSafeConservative.length}`);

const assert1 = (res1.safeCount === res1.cellSafe.length) && (res1.safeCountConservative === 0);
console.log(`[ASSERT 1] cellSafe = 1 AND cellSafeConservative = 0: ${assert1 ? 'PASS' : 'FAIL'}\n`);
if (!assert1) allPassed = false;

// TEST 2: Synthetic 5.0° plane with sigma = 0.5
// both cellSafe = 1 AND cellSafeConservative = 1 (5.0 + 2*0.5 = 6.0 <= 10.0)
console.log('--- TEST 2: Robust Safe Slope (Both Safe) ---');
const slopeMap2 = new Float32Array(w1 * h1).fill(5.0);
const sigmaMap2 = new Float32Array(w1 * h1).fill(0.5);

const res2 = classifyHazardConservative(slopeMap2, sigmaMap2, w1, h1, gsd1, null, null, 10.0, 2.0);
console.log(`Test 2 Slope:               5.00°`);
console.log(`Test 2 Sigma:               0.50°`);
console.log(`Test 2 Upper Bound:         ${res2.cellUpperBoundDeg[0].toFixed(2)}° (Threshold: 10.00°)`);
console.log(`Deterministic Safe Count:   ${res2.safeCount} / ${res2.cellSafe.length}`);
console.log(`Conservative Safe Count:    ${res2.safeCountConservative} / ${res2.cellSafeConservative.length}`);

const assert2 = (res2.safeCount === res2.cellSafe.length) && (res2.safeCountConservative === res2.cellSafeConservative.length);
console.log(`[ASSERT 2] cellSafe = 1 AND cellSafeConservative = 1: ${assert2 ? 'PASS' : 'FAIL'}\n`);
if (!assert2) allPassed = false;

// TEST 3: Synthetic 15.0° plane with sigma = 0.5
// both cellSafe = 0 (15.0 > 10.0)
console.log('--- TEST 3: Steep Hazard Slope (Both Hazard) ---');
const slopeMap3 = new Float32Array(w1 * h1).fill(15.0);
const sigmaMap3 = new Float32Array(w1 * h1).fill(0.5);

const res3 = classifyHazardConservative(slopeMap3, sigmaMap3, w1, h1, gsd1, null, null, 10.0, 2.0);
console.log(`Test 3 Slope:               15.00°`);
console.log(`Test 3 Sigma:               0.50°`);
console.log(`Test 3 Upper Bound:         ${res3.cellUpperBoundDeg[0].toFixed(2)}° (Threshold: 10.00°)`);
console.log(`Deterministic Safe Count:   ${res3.safeCount} / ${res3.cellSafe.length}`);
console.log(`Conservative Safe Count:    ${res3.safeCountConservative} / ${res3.cellSafeConservative.length}`);

const assert3 = (res3.safeCount === 0) && (res3.safeCountConservative === 0);
console.log(`[ASSERT 3] cellSafe = 0 AND cellSafeConservative = 0: ${assert3 ? 'PASS' : 'FAIL'}\n`);
if (!assert3) allPassed = false;

// TEST 4: Real Apollo 11 LOLA DEM
console.log('--- TEST 4: Real Apollo 11 LOLA DEM Assessment ---');
const apolloBuf = fs.readFileSync(path.resolve('src/assets/dem/apollo11_lola_dem.tif'));
const apolloDEM = new Float32Array(apolloBuf.buffer, apolloBuf.byteOffset, apolloBuf.byteLength / 4);
const apolloGSD = 59.225;
const slopeRes = computeSlopeFromDEM(apolloDEM, 64, 64, apolloGSD);
const uncertRes = computeSlopeUncertainty(apolloDEM, 64, 64, apolloGSD, 1.0);

const res4 = classifyHazardConservative(
  slopeRes.slopeMap,
  uncertRes.perPixelSigma,
  64,
  64,
  apolloGSD,
  null,
  null,
  10.0,
  2.0
);

const diffSafe = res4.safeCount - res4.safeCountConservative;
const pctReduction = res4.safeCount > 0 ? ((diffSafe / res4.safeCount) * 100).toFixed(1) : '0';

console.log(`Apollo 11 Total Cells:      ${res4.cellSafe.length}`);
console.log(`Deterministic Safe Count:   ${res4.safeCount} (${((res4.safeCount / res4.cellSafe.length) * 100).toFixed(1)}%)`);
console.log(`Conservative Safe Count:    ${res4.safeCountConservative} (${((res4.safeCountConservative / res4.cellSafeConservative.length) * 100).toFixed(1)}%)`);
console.log(`Difference (Filtered Out):  ${diffSafe} cells (${pctReduction}% reduction)`);

const assert4 = res4.safeCountConservative <= res4.safeCount;
console.log(`[ASSERT 4] Apollo 11 Assessment Valid: ${assert4 ? 'PASS' : 'FAIL'}\n`);
if (!assert4) allPassed = false;

// TEST 5: Confirm safeCountConservative <= safeCount always across all scenarios
console.log('--- TEST 5: Monotonicity Property: safeCountConservative <= safeCount ---');
const passesMonotonicity = [res1, res2, res3, res4].every(r => r.safeCountConservative <= r.safeCount);
console.log(`Checked Tests 1-4:          ${passesMonotonicity ? 'PASS (Strictly Monotonic)' : 'FAIL'}`);

// Run additional random verification sweeps:
let randomSweepPass = true;
for (let s = 0; s < 10; s++) {
  const randSlope = new Float32Array(100).map(() => Math.random() * 20);
  const randSigma = new Float32Array(100).map(() => Math.random() * 2);
  const sweepRes = classifyHazardConservative(randSlope, randSigma, 10, 10, 1.0, null, null, 10.0, 2.0);
  if (sweepRes.safeCountConservative > sweepRes.safeCount) {
    randomSweepPass = false;
  }
}
console.log(`Random Terrain Sweeps (10x): ${randomSweepPass ? 'PASS (100% Invariant)' : 'FAIL'}`);

const assert5 = passesMonotonicity && randomSweepPass;
console.log(`[ASSERT 5] safeCountConservative <= safeCount Always: ${assert5 ? 'PASS' : 'FAIL'}\n`);
if (!assert5) allPassed = false;

console.log('============================================================');
console.log(`FINAL RESULT: ${allPassed ? 'ALL CONSERVATIVE HAZARD TESTS PASSED' : 'SOME TESTS FAILED'}`);
console.log('============================================================');

if (!allPassed) {
  process.exit(1);
}
