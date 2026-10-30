import { computeSlopeFromDEM, computeSobelSlopeApprox } from '../src/lib/demSlope';

console.log('============================================================');
console.log('       LUNARSAFE PHASE 2: HORN (1981) DEM SLOPE TEST SUITE   ');
console.log('============================================================\n');

let allPassed = true;

// -------------------------------------------------------------
// TEST 1: Synthetic Plane Tilted at 10 Degrees
// -------------------------------------------------------------
console.log('--- TEST 1: Synthetic Plane Tilted at 10.0° ---');
const width1 = 100;
const height1 = 100;
const gsd1 = 1.0; // 1 meter per pixel
const targetAngleDeg = 10.0;
const targetSlopeRad = (targetAngleDeg * Math.PI) / 180.0;
const tanSlope = Math.tan(targetSlopeRad);

const planeDEM = new Float32Array(width1 * height1);
for (let y = 0; y < height1; y++) {
  for (let x = 0; x < width1; x++) {
    planeDEM[y * width1 + x] = x * gsd1 * tanSlope;
  }
}

const resultPlane = computeSlopeFromDEM(planeDEM, width1, height1, gsd1);
console.log(`Computed Mean Slope: ${resultPlane.meanSlopeDeg}° (Target: ${targetAngleDeg}°)`);
console.log(`Computed Max Slope:  ${resultPlane.maxSlopeDeg}°`);
console.log(`Method Tag:          ${resultPlane.method}`);

const planeError = Math.abs(resultPlane.meanSlopeDeg - targetAngleDeg);
const planePass = planeError <= 0.01 && resultPlane.method === 'DEM_HORN_EXACT';
console.log(`[ASSERT 1] 10° Plane Mean Slope within 0.01°: ${planePass ? `PASS (Error = ${planeError.toFixed(5)}°)` : 'FAIL'}`);
if (!planePass) allPassed = false;

// -------------------------------------------------------------
// TEST 2: Flat Plane (0.0° Slope)
// -------------------------------------------------------------
console.log('\n--- TEST 2: Flat Horizontal Plane (0.0° Slope) ---');
const flatDEM = new Float32Array(width1 * height1);
flatDEM.fill(1737.4); // constant elevation

const resultFlat = computeSlopeFromDEM(flatDEM, width1, height1, gsd1);
console.log(`Computed Mean Slope: ${resultFlat.meanSlopeDeg}° (Expected: 0.00°)`);
console.log(`Computed Max Slope:  ${resultFlat.maxSlopeDeg}° (Expected: 0.00°)`);
console.log(`Method Tag:          ${resultFlat.method}`);

const flatPass = resultFlat.meanSlopeDeg === 0 && resultFlat.maxSlopeDeg === 0 && resultFlat.method === 'DEM_HORN_EXACT';
console.log(`[ASSERT 2] Flat Plane Slope is 0.00°:         ${flatPass ? 'PASS (Exact Zero)' : 'FAIL'}`);
if (!flatPass) allPassed = false;

// -------------------------------------------------------------
// TEST 3: Synthetic Cone (Max Slope Matches Mathematical Max)
// -------------------------------------------------------------
console.log('\n--- TEST 3: Synthetic Cone (Max Slope Matches Mathematical Max) ---');
const coneW = 101;
const coneH = 101;
const coneGsd = 1.0;
const coneAngleDeg = 25.0;
const coneSlopeRad = (coneAngleDeg * Math.PI) / 180.0;
const coneS = Math.tan(coneSlopeRad);
const xc = 50;
const yc = 50;

const coneDEM = new Float32Array(coneW * coneH);
for (let y = 0; y < coneH; y++) {
  for (let x = 0; x < coneW; x++) {
    const dist = Math.sqrt((x - xc) * (x - xc) + (y - yc) * (y - yc)) * coneGsd;
    coneDEM[y * coneW + x] = Math.max(0, 100.0 - coneS * dist);
  }
}

const resultCone = computeSlopeFromDEM(coneDEM, coneW, coneH, coneGsd);
console.log(`Cone Mathematical Flank Slope: ${coneAngleDeg}°`);
console.log(`Computed Max Slope:             ${resultCone.maxSlopeDeg}°`);
console.log(`Computed Mean Slope:            ${resultCone.meanSlopeDeg}°`);

const coneError = Math.abs(resultCone.maxSlopeDeg - coneAngleDeg);
const conePass = coneError <= 0.05 && resultCone.method === 'DEM_HORN_EXACT';
console.log(`[ASSERT 3] Cone Max Slope Matches 25.0°:      ${conePass ? `PASS (Error = ${coneError.toFixed(5)}°)` : 'FAIL'}`);
if (!conePass) allPassed = false;

// -------------------------------------------------------------
// TEST 4: Sobel Approximation Method Tag & Execution
// -------------------------------------------------------------
console.log('\n--- TEST 4: Sobel Approximation Method ---');
const gray = new Uint8ClampedArray(width1 * height1);
for (let i = 0; i < width1 * height1; i++) {
  gray[i] = Math.round((i % width1) * (255 / width1));
}
const resultSobel = computeSobelSlopeApprox(gray, width1, height1);
console.log(`Sobel Method Tag: ${resultSobel.method}`);
console.log(`Sobel Mean Slope: ${resultSobel.meanSlopeDeg}°`);
const sobelPass = resultSobel.method === 'SOBEL_APPROXIMATE' && resultSobel.maxSlopeDeg > 0;
console.log(`[ASSERT 4] Sobel Output Tagged 'SOBEL_APPROXIMATE': ${sobelPass ? 'PASS' : 'FAIL'}`);
if (!sobelPass) allPassed = false;

console.log('\n============================================================');
console.log(`FINAL RESULT: ${allPassed ? 'ALL PHASE 2 DEM SLOPE TESTS PASSED' : 'SOME TESTS FAILED'}`);
console.log('============================================================');

if (!allPassed) {
  process.exit(1);
}
