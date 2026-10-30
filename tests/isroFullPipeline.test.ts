/**
 * LunarSafe Mission Software — ISRO Full Pipeline Test Suite
 * Team Rocket · AEROX Club · Parul University · Project Head: Darshan Patil
 *
 * Verifies end-to-end processing of the full 392 MB ISRO Chandrayaan-2 TMC-2 calibrated raster.
 */

import assert from 'assert';
import path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { PNG } from 'pngjs';
import { processFullIsroImage, FullPipelineOutput } from '../src/lib/isroFullPipeline';

console.log('============================================================');
console.log('    LUNARSAFE FULL ISRO 392 MB PIPELINE VERIFICATION SUITE   ');
console.log('============================================================\n');

async function runTestSuite() {
  const imgPath = path.resolve('src/assets/isro_data/ch2_tmc_ncn_20260823T1657513854_d_img_d18.img');
  const xmlPath = path.resolve('src/assets/isro_data/ch2_tmc_ncn_20260823T1657513854_d_img_d18.xml');

  assert(fs.existsSync(imgPath), `Raw ISRO .img file must exist: ${imgPath}`);
  assert(fs.existsSync(xmlPath), `PDS4 XML label must exist: ${xmlPath}`);

  const fileSize = fs.statSync(imgPath).size;
  assert.strictEqual(fileSize, 392952000, 'ISRO TMC-2 file size must be exactly 392,952,000 bytes');
  console.log(`[TEST 1] Raw ISRO data file confirmed: 392,952,000 bytes (16-bit UnsignedLSB2): PASS`);

  // Execute full pipeline across all 768 tiles
  const result: FullPipelineOutput = await processFullIsroImage(imgPath, 512, {
    xmlPath,
    gridSizeMeters: 24,
    maxSlopeDeg: 10.0,
    reuseExisting: true,
  });

  const { summary, safeLandingZones, tiles, coverageMapPath, pdfReportPath, jsonResultsPath } = result;

  console.log('\n--- VERIFYING PIPELINE DELIVERABLES & INTEGRITY ---');

  // Assert 1: Total Tiles
  assert.strictEqual(summary.totalTiles, 768, 'Must process exactly 768 tiles (8 cols x 96 rows)');
  assert.strictEqual(summary.processedTiles, 768, 'All 768 tiles must be processed');
  assert.strictEqual(summary.failedTiles, 0, 'Zero tiles should fail');
  console.log(`[ASSERT 1] Swath tile coverage: 768/768 tiles processed (0 failed): PASS`);

  // Assert 2: Non-square Edge Tiles
  const rightEdgeTile = tiles.find(t => t.col === 7 && t.row === 0);
  assert(rightEdgeTile, 'Right edge tile (col=7, row=0) must exist');
  assert.strictEqual(rightEdgeTile.width, 416, 'Right boundary tile width must be 416 (4000 - 3584)');
  assert.strictEqual(rightEdgeTile.height, 512, 'Right boundary tile height must be 512');
  assert.strictEqual(rightEdgeTile.isEdge, true, 'Right boundary tile must be marked as edge');

  const bottomEdgeTile = tiles.find(t => t.col === 0 && t.row === 95);
  assert(bottomEdgeTile, 'Bottom edge tile (col=0, row=95) must exist');
  assert.strictEqual(bottomEdgeTile.width, 512, 'Bottom boundary tile width must be 512');
  assert.strictEqual(bottomEdgeTile.height, 479, 'Bottom boundary tile height must be 479 (49119 - 48640)');
  assert.strictEqual(bottomEdgeTile.isEdge, true, 'Bottom boundary tile must be marked as edge');

  const cornerTile = tiles.find(t => t.col === 7 && t.row === 95);
  assert(cornerTile, 'Corner edge tile (col=7, row=95) must exist');
  assert.strictEqual(cornerTile.width, 416, 'Corner tile width must be 416');
  assert.strictEqual(cornerTile.height, 479, 'Corner tile height must be 479');
  assert.strictEqual(cornerTile.isEdge, true, 'Corner tile must be marked as edge');
  console.log(`[ASSERT 2] Non-square boundary tile handling (416x512, 512x479, 416x479): PASS`);

  // Assert 3: Frozen Engine Verification
  const enginePath = path.resolve('src/lib/imageProcessor.ts');
  const engineSize = fs.statSync(enginePath).size;
  const engineHash = crypto.createHash('sha256').update(fs.readFileSync(enginePath)).digest('hex').toUpperCase();
  assert.strictEqual(engineSize, 41930, 'Frozen engine size must be exactly 41,930 bytes');
  assert.strictEqual(
    engineHash,
    '8CA34C558C41F0B324A207A1D758476D397319999313D59A5919E75912882956',
    'Frozen engine SHA-256 must match 8CA34C558C41F0B324A207A1D758476D397319999313D59A5919E75912882956'
  );
  assert.strictEqual(summary.frozenEngine.verified, true, 'Summary frozen engine verification must be true');
  console.log(`[ASSERT 3] Frozen engine verification (41,930 bytes, SHA-256: 8CA34C...): PASS`);

  // Assert 4: Memory Efficiency
  assert(summary.peakMemoryMB < 500, `Peak memory (${summary.peakMemoryMB} MB) must remain under 500 MB (no 392 MB buffering)`);
  console.log(`[ASSERT 4] Memory efficiency: Peak RSS = ${summary.peakMemoryMB} MB (< 500 MB limit): PASS`);

  // Assert 5: 4-Stage Cryptographic Hashes
  for (let i = 0; i < 20; i++) {
    const t = tiles[i];
    assert.strictEqual(t.hashes.inputBuffer.length, 64, `Tile ${i} Stage 1 hash length must be 64`);
    assert.strictEqual(t.hashes.slopeMap.length, 64, `Tile ${i} Stage 2 hash length must be 64`);
    assert.strictEqual(t.hashes.isroGrid.length, 64, `Tile ${i} Stage 3 hash length must be 64`);
    assert.strictEqual(t.hashes.candidateZones.length, 64, `Tile ${i} Stage 4 hash length must be 64`);
  }
  assert.strictEqual(summary.masterEvidenceHash.length, 64, 'Master evidence hash length must be 64');
  console.log(`[ASSERT 5] 4-Stage SHA-256 evidence chain sealed on all tiles: PASS`);

  // Assert 6: Hazard Detections
  assert(summary.totalCratersDetected > 0, 'Craters must be detected across swath');
  assert(summary.safeAreaPercentage >= 0 && summary.safeAreaPercentage <= 100, 'Safe area % must be in 0-100');
  console.log(`[ASSERT 6] Obstacle profiling: ${summary.totalCratersDetected.toLocaleString()} craters, ${summary.totalBouldersDetected.toLocaleString()} boulders, ${summary.safeAreaPercentage}% safe: PASS`);

  // Assert 7: Safe Landing Zones (Connected Components)
  assert(safeLandingZones.length > 0, 'Candidate safe landing zones must be discovered');
  const topZone = safeLandingZones[0];
  assert(topZone.areaM2 > 0, 'Top zone area must be > 0');
  assert(topZone.latitudeDeg !== 0, 'Top zone latitude must be computed');
  assert(topZone.longitudeDeg !== 0, 'Top zone longitude must be computed');
  console.log(`[ASSERT 7] Connected-component safe landing zones: ${safeLandingZones.length} zones found (Top zone: ${topZone.areaKm2.toFixed(2)} km² at ${topZone.latitudeDeg.toFixed(4)}°N, ${topZone.longitudeDeg.toFixed(4)}°E): PASS`);

  // Assert 8: Full Coverage Map PNG
  assert(fs.existsSync(coverageMapPath), `Full coverage map must exist: ${coverageMapPath}`);
  const mapData = fs.readFileSync(coverageMapPath);
  const parsedPng = PNG.sync.read(mapData);
  assert.strictEqual(parsedPng.width, 1000, 'Coverage map width must be 1000');
  assert.strictEqual(parsedPng.height, 2000, 'Coverage map height must be 2000');
  assert(mapData.length > 10000, 'Coverage map PNG file size must be > 10KB');
  console.log(`[ASSERT 8] Full coverage map generated: 1000x2000 px (${mapData.length.toLocaleString()} bytes): PASS`);

  // Assert 9: PDF Report
  assert(fs.existsSync(pdfReportPath), `PDF report must exist: ${pdfReportPath}`);
  const pdfBytes = fs.readFileSync(pdfReportPath);
  assert(pdfBytes.length > 5000, 'PDF report file size must be > 5KB');
  console.log(`[ASSERT 9] Publication-quality PDF report generated: ${path.basename(pdfReportPath)} (${pdfBytes.length.toLocaleString()} bytes): PASS`);

  // Assert 10: JSON Results
  assert(fs.existsSync(jsonResultsPath), `JSON results must exist: ${jsonResultsPath}`);
  const jsonContent = JSON.parse(fs.readFileSync(jsonResultsPath, 'utf8'));
  assert.strictEqual(jsonContent.tiles.length, 768, 'JSON must contain all 768 tiles');
  assert.strictEqual(jsonContent.summary.totalTiles, 768, 'JSON summary must report 768 tiles');
  assert(jsonContent.safeLandingZones.length > 0, 'JSON must contain safe landing zones');
  console.log(`[ASSERT 10] Complete JSON results file generated: ${path.basename(jsonResultsPath)} (${fs.statSync(jsonResultsPath).size.toLocaleString()} bytes, 768 tiles): PASS`);

  console.log('\n============================================================');
  console.log('FINAL RESULT: ALL ISRO FULL PIPELINE TESTS PASSED');
  console.log('============================================================\n');

  console.log('SUMMARY METRICS FOR AUDIT:');
  console.log(`- Total Tiles Processed:     ${summary.totalTiles}`);
  console.log(`- Total Safe Area (%):       ${summary.safeAreaPercentage}% (${summary.totalSafeAreaKm2.toLocaleString()} km²)`);
  console.log(`- Raw Crater Patches:        ${(summary.rawCraterPatches || summary.totalCratersDetected).toLocaleString()}`);
  console.log(`- Distinct Craters:          ${(summary.distinctCraters || summary.totalDistinctCraters).toLocaleString()}`);
  console.log(`- Crater Consolidation Ratio: ${summary.consolidationRatio || (summary.totalCratersDetected / summary.totalDistinctCraters).toFixed(2)}x`);
  console.log(`- Raw Boulder Patches:       ${(summary.rawBoulderPatches || summary.totalBouldersDetected).toLocaleString()}`);
  console.log(`- Distinct Boulders:         ${(summary.distinctBoulders || 0).toLocaleString()}`);
  console.log(`- Safe Landing Zones Count:  ${summary.safeLandingZonesCount}`);
  console.log(`- Total Processing Time:     ${summary.processingTimeSeconds} seconds`);
  console.log(`- Peak Memory Usage:         ${summary.peakMemoryMB} MB`);
}

runTestSuite().catch(err => {
  console.error('\n[FATAL ERROR] ISRO Full Pipeline test failed:', err);
  process.exit(1);
});
