import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';
import { DeterministicLunarEngine } from '../src/lib/imageProcessor';

async function runDeterminismTests() {
  console.log('================================================================');
  console.log('       LUNARSAFE 3X DETERMINISM & MISSION ENGINE TEST SUITE     ');
  console.log('================================================================\n');

  const samplePath = path.resolve('src/assets/samples/ch2_tmc2_south_pole.png');
  if (!fs.existsSync(samplePath)) {
    throw new Error(`Sample file not found at ${samplePath}`);
  }

  const rawBuffer = fs.readFileSync(samplePath);
  const parsedPng = PNG.sync.read(rawBuffer);

  const pixelData = {
    width: parsedPng.width,
    height: parsedPng.height,
    data: new Uint8ClampedArray(parsedPng.data),
  };

  console.log(`[TEST TARGET]: Chandrayaan-2 TMC-2 Nadir Strip`);
  console.log(`Dimensions: ${pixelData.width} x ${pixelData.height} px`);
  console.log(`Raw Buffer Size: ${rawBuffer.byteLength} bytes\n`);

  console.log('--- EXECUTING 3 CONSECUTIVE PASSES ---');

  // Run 1
  const t0 = performance.now();
  const res1 = await DeterministicLunarEngine.processLunarImage(rawBuffer, pixelData, {
    pixelScaleMeters: 5.0, // TMC-2 5m DEM resolution
    gridSizeMeters: 24,    // ISRO 24m standard
    maxSlopeDeg: 10.0,
  });
  const dur1 = (performance.now() - t0).toFixed(2);
  console.log(`[RUN 1 COMPLETED] (${dur1}ms)`);
  console.log(`  Input Hash:  ${res1.evidence.inputImageHash}`);
  console.log(`  Slope Hash:  ${res1.evidence.slopeMapHash}`);
  console.log(`  Grid Hash:   ${res1.evidence.gridClassificationHash}`);
  console.log(`  Zones Hash:  ${res1.evidence.candidateZonesHash}`);
  console.log(`  Slope Stats: Min=${res1.minSlopeDeg}°, Mean=${res1.meanSlopeDeg}°, Max=${res1.maxSlopeDeg}°`);
  console.log(`  Grid Stats:  Total=${res1.evidence.cellCountTotal}, Safe=${res1.evidence.cellCountSafe} (${res1.evidence.safeAreaPercentage}%), Hazard=${res1.evidence.cellCountHazard}`);
  console.log(`  Detections:  Craters=${res1.craters.length}, Boulders=${res1.boulders.length}`);
  console.log(`  Safe Sites:  Found=${res1.safeZones.length} contiguous zones\n`);

  // Run 2
  const t1 = performance.now();
  const res2 = await DeterministicLunarEngine.processLunarImage(rawBuffer, pixelData, {
    pixelScaleMeters: 5.0,
    gridSizeMeters: 24,
    maxSlopeDeg: 10.0,
  });
  const dur2 = (performance.now() - t1).toFixed(2);
  console.log(`[RUN 2 COMPLETED] (${dur2}ms)`);
  console.log(`  Input Hash:  ${res2.evidence.inputImageHash}`);
  console.log(`  Slope Hash:  ${res2.evidence.slopeMapHash}`);
  console.log(`  Grid Hash:   ${res2.evidence.gridClassificationHash}`);
  console.log(`  Zones Hash:  ${res2.evidence.candidateZonesHash}`);
  console.log(`  Slope Stats: Min=${res2.minSlopeDeg}°, Mean=${res2.meanSlopeDeg}°, Max=${res2.maxSlopeDeg}°\n`);

  // Run 3
  const t2 = performance.now();
  const res3 = await DeterministicLunarEngine.processLunarImage(rawBuffer, pixelData, {
    pixelScaleMeters: 5.0,
    gridSizeMeters: 24,
    maxSlopeDeg: 10.0,
  });
  const dur3 = (performance.now() - t2).toFixed(2);
  console.log(`[RUN 3 COMPLETED] (${dur3}ms)`);
  console.log(`  Input Hash:  ${res3.evidence.inputImageHash}`);
  console.log(`  Slope Hash:  ${res3.evidence.slopeMapHash}`);
  console.log(`  Grid Hash:   ${res3.evidence.gridClassificationHash}`);
  console.log(`  Zones Hash:  ${res3.evidence.candidateZonesHash}`);
  console.log(`  Slope Stats: Min=${res3.minSlopeDeg}°, Mean=${res3.meanSlopeDeg}°, Max=${res3.maxSlopeDeg}°\n`);

  console.log('--- VERIFYING DETERMINISM ASSERTIONS ---');

  // Assertion 1: Bit-identical input hashes
  const inputMatches = (res1.evidence.inputImageHash === res2.evidence.inputImageHash) &&
                       (res2.evidence.inputImageHash === res3.evidence.inputImageHash);
  console.log(`[ASSERT 1] Input Buffer Hashes Match:          ${inputMatches ? 'PASS (100% Bit-Identical)' : 'FAIL'}`);

  // Assertion 2: Bit-identical slope map hashes
  const slopeMatches = (res1.evidence.slopeMapHash === res2.evidence.slopeMapHash) &&
                       (res2.evidence.slopeMapHash === res3.evidence.slopeMapHash);
  console.log(`[ASSERT 2] Calibrated Slope Map Hashes Match:  ${slopeMatches ? 'PASS (100% Bit-Identical)' : 'FAIL'}`);

  // Assertion 3: Bit-identical 24m grid hashes
  const gridMatches = (res1.evidence.gridClassificationHash === res2.evidence.gridClassificationHash) &&
                      (res2.evidence.gridClassificationHash === res3.evidence.gridClassificationHash);
  console.log(`[ASSERT 3] 24m Grid Classification Hashes Match: ${gridMatches ? 'PASS (100% Bit-Identical)' : 'FAIL'}`);

  // Assertion 4: Bit-identical candidate zones hashes
  const zonesMatches = (res1.evidence.candidateZonesHash === res2.evidence.candidateZonesHash) &&
                       (res2.evidence.candidateZonesHash === res3.evidence.candidateZonesHash);
  console.log(`[ASSERT 4] Candidate Landing Zones Hashes Match: ${zonesMatches ? 'PASS (100% Bit-Identical)' : 'FAIL'}`);

  // Assertion 5: Slope physics constraints (0° <= slope <= 90°)
  const slopeValid = res1.minSlopeDeg >= 0 && res1.maxSlopeDeg <= 90 && res1.meanSlopeDeg < 90;
  console.log(`[ASSERT 5] Calibrated Slope within 0–90°:       ${slopeValid ? `PASS (Min=${res1.minSlopeDeg}°, Max=${res1.maxSlopeDeg}°)` : 'FAIL'}`);

  // Assertion 6: Realistic crater density (small fraction of grid)
  const craterFraction = res1.craters.length / res1.evidence.cellCountTotal;
  const craterFractionValid = craterFraction > 0 && craterFraction < 0.35;
  console.log(`[ASSERT 6] Crater Count is Realistic Fraction:   ${craterFractionValid ? `PASS (${res1.craters.length} craters across ${res1.evidence.cellCountTotal} cells, ${(craterFraction * 100).toFixed(1)}%)` : 'FAIL'}`);

  // Assertion 7: Safe landing zones discovered
  const safeZonesValid = res1.safeZones.length > 0 && res1.safeZones[0].meanSlopeDeg <= 10.0;
  console.log(`[ASSERT 7] Valid Safe Zones Identified:         ${safeZonesValid ? `PASS (Top site area: ${res1.safeZones[0].areaM2.toLocaleString()} m², slope: ${res1.safeZones[0].meanSlopeDeg}°)` : 'FAIL'}`);

  // Test 8: Color-variance rejection filter on terrestrial image
  console.log('\n--- TESTING PANCHROMATIC COLOR-VARIANCE REJECTION ---');
  const colorPath = path.resolve('src/assets/samples/color_terrestrial.png');
  const colorBuffer = fs.readFileSync(colorPath);
  const parsedColorPng = PNG.sync.read(colorBuffer);
  const colorPixelData = {
    width: parsedColorPng.width,
    height: parsedColorPng.height,
    data: new Uint8ClampedArray(parsedColorPng.data),
  };

  let colorRejectionPassed = false;
  try {
    await DeterministicLunarEngine.processLunarImage(colorBuffer, colorPixelData);
  } catch (err: any) {
    if (err.message.includes('Panchromatic Validation Failed')) {
      colorRejectionPassed = true;
      console.log(`[ASSERT 8] Color Image Correctly Rejected:      PASS (${err.message.split(':')[1]?.trim()})`);
    } else {
      console.log(`[ASSERT 8] Unexpected Error: ${err.message}`);
    }
  }

  if (!colorRejectionPassed) {
    console.log(`[ASSERT 8] Color Image Rejection:              FAIL (Image was not rejected!)`);
  }

  const allPassed = inputMatches && slopeMatches && gridMatches && zonesMatches && slopeValid && craterFractionValid && safeZonesValid && colorRejectionPassed;

  console.log('\n================================================================');
  console.log(`  FINAL VERIFICATION RESULT: ${allPassed ? 'ALL TESTS PASSED (100% AUDIT SATISFIED)' : 'FAILED'}`);
  console.log('================================================================');

  if (!allPassed) {
    process.exit(1);
  }
}

runDeterminismTests().catch(err => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
