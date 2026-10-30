import * as fs from 'fs';
import * as path from 'path';
import { computeSlopeFromDEM } from '../src/lib/demSlope';
import { computeSlopeUncertainty } from '../src/lib/uncertainty';
import { classifyHazardConservative } from '../src/lib/hazardClassifier';
import { analyzeSensitivity } from '../src/lib/marginalSiteAnalyzer';

console.log('============================================================');
console.log('    LUNARSAFE PHASE 5B: MARGINAL SITE & SENSITIVITY TEST   ');
console.log('============================================================\n');

let allPassed = true;

// Load real NASA LOLA DEM tile for marginal site (South Massif Rim, Apollo 17 boundary)
const demPath = path.resolve('src/assets/dem/marginal_site_lola_dem.tif');
const metaPath = path.resolve('src/assets/dem/marginal_site_lola_dem.meta.json');

const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
const buf = fs.readFileSync(demPath);
const dem = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
const width = meta.width;
const height = meta.height;
const gsd = meta.gsdMetersPerPixel;

// 1. Compute Horn's slope
const slopeRes = computeSlopeFromDEM(dem, width, height, gsd);
console.log('--- TEST 1: Marginal Site Terrain Characteristics ---');
console.log(`Site:                ${meta.site}`);
console.log(`Coordinates:         ${meta.coordinates.lat}°N, ${meta.coordinates.lon}°E`);
console.log(`DEM Grid:            ${width}x${height} pixels at GSD = ${gsd} m/pixel`);
console.log(`Mean Slope:          ${slopeRes.meanSlopeDeg.toFixed(2)}°`);
console.log(`Max Slope:           ${slopeRes.maxSlopeDeg.toFixed(2)}°`);

const isSlopeMarginal = slopeRes.meanSlopeDeg >= 5.0 && slopeRes.meanSlopeDeg <= 15.0;
console.log(`[ASSERT 1] Mean slope within marginal band [5°, 15°]: ${isSlopeMarginal ? 'PASS' : 'FAIL'}\n`);
if (!isSlopeMarginal) allPassed = false;

// 2. Conservative Filter Impact at standard LOLA accuracy (sigma_z = 1.0 m, multiplier = 2.0, threshold = 10.0°)
console.log('--- TEST 2: Conservative Uncertainty Filter Impact (sigma_z = 1.0 m) ---');
const uncertRes = computeSlopeUncertainty(dem, width, height, gsd, 1.0);
const hazardRes = classifyHazardConservative(
  slopeRes.slopeMap,
  uncertRes.perPixelSigma,
  width,
  height,
  gsd,
  null,
  null,
  10.0,
  2.0
);

const diffCells = hazardRes.safeCount - hazardRes.safeCountConservative;
const reductionPct = hazardRes.safeCount > 0 ? ((diffCells / hazardRes.safeCount) * 100.0) : 0.0;

console.log(`Total 24m Cells:            ${hazardRes.cellSafe.length}`);
console.log(`Deterministic Safe Cells:   ${hazardRes.safeCount} (${((hazardRes.safeCount / hazardRes.cellSafe.length) * 100).toFixed(2)}%)`);
console.log(`Conservative Safe Cells:    ${hazardRes.safeCountConservative} (${((hazardRes.safeCountConservative / hazardRes.cellSafeConservative.length) * 100).toFixed(2)}%)`);
console.log(`Marginal Cells Filtered:    ${diffCells}`);
console.log(`Safe Area Reduction:        ${reductionPct.toFixed(2)}% (Target: >= 5.0%)`);

const isReductionSufficient = reductionPct >= 5.0;
console.log(`[ASSERT 2] Conservative filter reduces safe area by >= 5%: ${isReductionSufficient ? 'PASS' : 'FAIL'}\n`);
if (!isReductionSufficient) allPassed = false;

// --- SLOPE HISTOGRAM & PROVENANCE OF FILTERED CELLS ---
// EXPLANATION: Cells in the [8, 10) bin are the ones at risk of being filtered,
// because their upper bound (mean + 2*sigma) can exceed the 10° threshold.
// The 6.74% reduction should come from this bin.
console.log('--- Cell Mean Slope Distribution Histogram & Conservative Filter Analysis ---');
console.log('Note: Cells in [8, 10) bin are at risk of being filtered (mean + 2*sigma > 10.0°).');

const bins = [
  { label: '[0, 2)', min: 0, max: 2 },
  { label: '[2, 4)', min: 2, max: 4 },
  { label: '[4, 6)', min: 4, max: 6 },
  { label: '[6, 8)', min: 6, max: 8 },
  { label: '[8, 10)', min: 8, max: 10 },
  { label: '[10, 12)', min: 10, max: 12 },
  { label: '[12, 15)', min: 12, max: 15 },
  { label: '[15, 20)', min: 15, max: 20 },
  { label: '[20, 90)', min: 20, max: 90 },
];

let cellsIn8to10Total = 0;
let filteredFrom8to10 = 0;

console.log('| Slope Bin (deg) | Cell Count | Fraction (%) | Filtered by Conservative Rule |');
console.log('|-----------------|------------|--------------|-------------------------------|');

for (const b of bins) {
  let count = 0;
  let filtered = 0;
  for (let i = 0; i < hazardRes.cellMeanSlopeDeg.length; i++) {
    const s = hazardRes.cellMeanSlopeDeg[i];
    const inBin = b.max === 90 ? (s >= b.min && s <= 90) : (s >= b.min && s < b.max);
    if (inBin) {
      count++;
      if (hazardRes.cellSafe[i] === 1 && hazardRes.cellSafeConservative[i] === 0) {
        filtered++;
      }
    }
  }
  if (b.min === 8 && b.max === 10) {
    cellsIn8to10Total = count;
    filteredFrom8to10 = filtered;
  }
  const frac = (count / hazardRes.cellMeanSlopeDeg.length) * 100.0;
  console.log(`| ${b.label.padEnd(15)} | ${count.toString().padEnd(10)} | ${frac.toFixed(2).padEnd(12)}% | ${filtered.toString().padEnd(29)} |`);
}

console.log('');
console.log(`Total filtered cells: ${diffCells}`);
console.log(`Cells in [8, 10) bin: ${cellsIn8to10Total}`);
console.log(`Fraction of filtered cells that came from [8, 10) bin: ${((filteredFrom8to10 / diffCells) * 100).toFixed(2)}%\n`);

// 3. Sensitivity Sweep across sigma levels [0.5, 1.0, 2.0, 5.0] m
console.log('--- TEST 3: Sensitivity Sweep Across Elevation Uncertainty Levels ---');
const sigmaLevels = [0.5, 1.0, 2.0, 5.0];
const sensitivityResults = analyzeSensitivity(
  dem,
  width,
  height,
  gsd,
  sigmaLevels,
  10.0,
  2.0
);

console.log('| Sigma Elev (m) | Det Safe | Cons Safe | Reduction (%) |');
console.log('|----------------|----------|-----------|---------------|');
for (const s of sensitivityResults) {
  console.log(`| ${s.sigmaElevM.toFixed(1).padEnd(14)} | ${s.safeCountDet.toString().padEnd(8)} | ${s.safeCountCons.toString().padEnd(9)} | ${s.reductionPct.toFixed(2).padEnd(13)}% |`);
}

// Check monotonicity of sensitivity: higher sigma -> lower or equal consSafe
let isMonotonic = true;
for (let i = 1; i < sensitivityResults.length; i++) {
  if (sensitivityResults[i].safeCountCons > sensitivityResults[i - 1].safeCountCons) {
    isMonotonic = false;
  }
}
console.log(`\n[ASSERT 3] Sensitivity sweep monotonically non-increasing: ${isMonotonic ? 'PASS' : 'FAIL'}\n`);
if (!isMonotonic) allPassed = false;

if (!allPassed) {
  console.error('FAILED: One or more Phase 5B assertions failed.');
  process.exit(1);
} else {
  console.log('ALL PHASE 5B TESTS PASSED SUCCESSFULLY.');
}
