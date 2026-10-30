import * as fs from 'fs';
import * as path from 'path';
import { computeSlopeUncertainty } from '../src/lib/uncertainty';

console.log('============================================================');
console.log('       LUNARSAFE PHASE 4: SLOPE UNCERTAINTY TEST SUITE       ');
console.log('============================================================\n');

let allPassed = true;

// TEST 1: Flat DEM with sigmaElevM = 1.0 -> mean slope 0°, mean sigma slope > 0°
console.log('--- TEST 1: Flat DEM Uncertainty Floor ---');
const w1 = 64, h1 = 64, gsd1 = 59.225;
const flatDEM = new Float32Array(w1 * h1); // all zeros
const res1 = computeSlopeUncertainty(flatDEM, w1, h1, gsd1, 1.0);

console.log(`Flat DEM Mean Slope:        ${res1.meanSlopeDeg.toFixed(2)}° (Target: 0.00°)`);
console.log(`Flat DEM Mean Sigma:        ${res1.meanSigmaSlopeDeg.toFixed(4)}° (Uncertainty floor)`);
console.log(`Flat DEM Max Sigma:         ${res1.maxSigmaSlopeDeg.toFixed(4)}°`);

const assert1_slope = res1.meanSlopeDeg === 0;
const assert1_sigma = res1.meanSigmaSlopeDeg > 0;
console.log(`[ASSERT 1A] Mean Slope is 0.00°:    ${assert1_slope ? 'PASS' : 'FAIL'}`);
console.log(`[ASSERT 1B] Mean Sigma is > 0.00°:   ${assert1_sigma ? 'PASS' : 'FAIL'}\n`);
if (!assert1_slope || !assert1_sigma) allPassed = false;

// TEST 2: Synthetic 10° plane -> verify sigma matches analytical formula within 1%
console.log('--- TEST 2: Synthetic 10.0° Plane Analytical Verification ---');
const w2 = 64, h2 = 64, gsd2 = 59.225;
const plane10Rad = (10.0 * Math.PI) / 180.0;
const plane10DEM = new Float32Array(w2 * h2);
for (let y = 0; y < h2; y++) {
  for (let x = 0; x < w2; x++) {
    plane10DEM[y * w2 + x] = x * gsd2 * Math.tan(plane10Rad);
  }
}
const res2 = computeSlopeUncertainty(plane10DEM, w2, h2, gsd2, 1.0);
const baseSigmaDeg = ((Math.sqrt(3) * 1.0) / (4.0 * gsd2)) * (180.0 / Math.PI);
const analyticalSigma10Deg = baseSigmaDeg * Math.cos(plane10Rad) * Math.cos(plane10Rad);
const errRelPercent = (Math.abs(res2.meanSigmaSlopeDeg - analyticalSigma10Deg) / analyticalSigma10Deg) * 100.0;

console.log(`Computed Mean Slope:        ${res2.meanSlopeDeg.toFixed(2)}° (Target: 10.00°)`);
console.log(`Computed Mean Sigma:        ${res2.meanSigmaSlopeDeg.toFixed(4)}°`);
console.log(`Analytical Sigma (Formula): ${analyticalSigma10Deg.toFixed(4)}°`);
console.log(`Relative Discrepancy:       ${errRelPercent.toFixed(3)}% (Threshold: < 1.0%)`);

const assert2 = errRelPercent < 1.0 && Math.abs(res2.meanSlopeDeg - 10.0) < 0.05;
console.log(`[ASSERT 2] Matches Analytical within 1%: ${assert2 ? 'PASS' : 'FAIL'}\n`);
if (!assert2) allPassed = false;

// TEST 3: Real Apollo 11 LOLA .tif DEM -> report mean slope and mean sigma
console.log('--- TEST 3: Real Apollo 11 LOLA .tif DEM ---');
const apolloTifPath = path.resolve('src/assets/dem/apollo11_lola_dem.tif');
const apolloBuf = fs.readFileSync(apolloTifPath);
const apolloDEM = new Float32Array(apolloBuf.buffer, apolloBuf.byteOffset, apolloBuf.byteLength / 4);
const res3 = computeSlopeUncertainty(apolloDEM, 64, 64, 59.225, 1.0);

console.log(`Apollo 11 LOLA DEM Size:     ${apolloDEM.length} floats (64x64)`);
console.log(`Apollo 11 Mean Slope:        ${res3.meanSlopeDeg.toFixed(2)}°`);
console.log(`Apollo 11 Mean Sigma:        ${res3.meanSigmaSlopeDeg.toFixed(4)}° (± band)`);
console.log(`Apollo 11 Max Sigma:         ${res3.maxSigmaSlopeDeg.toFixed(4)}°`);
console.log(`Apollo 11 95% CI (±2 sigma): [${Math.max(0, res3.meanSlopeDeg - 2 * res3.meanSigmaSlopeDeg).toFixed(2)}°, ${(res3.meanSlopeDeg + 2 * res3.meanSigmaSlopeDeg).toFixed(2)}°]`);

const assert3 = res3.meanSlopeDeg > 0 && res3.meanSigmaSlopeDeg > 0;
console.log(`[ASSERT 3] Real DEM Uncertainty Evaluated: ${assert3 ? 'PASS' : 'FAIL'}\n`);
if (!assert3) allPassed = false;

// TEST 4: Verify sigma scales linearly with sigmaElevM (doubling input doubles output)
console.log('--- TEST 4: Linear Scaling with Vertical Uncertainty (sigmaElevM) ---');
const res4_base = computeSlopeUncertainty(flatDEM, w1, h1, gsd1, 1.0);
const res4_double = computeSlopeUncertainty(flatDEM, w1, h1, gsd1, 2.0);
const linearRatio = res4_double.meanSigmaSlopeDeg / res4_base.meanSigmaSlopeDeg;

console.log(`Sigma at sigmaElev = 1.0m:   ${res4_base.meanSigmaSlopeDeg.toFixed(4)}°`);
console.log(`Sigma at sigmaElev = 2.0m:   ${res4_double.meanSigmaSlopeDeg.toFixed(4)}°`);
console.log(`Ratio (Expected: 2.0000):   ${linearRatio.toFixed(4)}`);

const assert4 = Math.abs(linearRatio - 2.0) < 0.001;
console.log(`[ASSERT 4] Linear Scaling Verified (within 0.1%): ${assert4 ? 'PASS' : 'FAIL'}\n`);
if (!assert4) allPassed = false;

// TEST 5: Verify sigma scales inversely with GSD (halving GSD doubles output)
console.log('--- TEST 5: Inverse Scaling with GSD ---');
const res5_base = computeSlopeUncertainty(flatDEM, w1, h1, 59.225, 1.0);
const res5_halfGsd = computeSlopeUncertainty(flatDEM, w1, h1, 59.225 / 2.0, 1.0);
const invRatio = res5_halfGsd.meanSigmaSlopeDeg / res5_base.meanSigmaSlopeDeg;

console.log(`Sigma at GSD = 59.225m:      ${res5_base.meanSigmaSlopeDeg.toFixed(4)}°`);
console.log(`Sigma at GSD = 29.6125m:     ${res5_halfGsd.meanSigmaSlopeDeg.toFixed(4)}°`);
console.log(`Ratio (Expected: 2.0000):   ${invRatio.toFixed(4)}`);

const assert5 = Math.abs(invRatio - 2.0) < 0.001;
console.log(`[ASSERT 5] Inverse GSD Scaling Verified (within 0.1%): ${assert5 ? 'PASS' : 'FAIL'}\n`);
if (!assert5) allPassed = false;

console.log('============================================================');
console.log(`FINAL RESULT: ${allPassed ? 'ALL UNCERTAINTY TESTS PASSED' : 'SOME TESTS FAILED'}`);
console.log('============================================================');

if (!allPassed) {
  process.exit(1);
}
