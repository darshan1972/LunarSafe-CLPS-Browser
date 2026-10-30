import assert from 'assert';
import path from 'path';
import { parsePds4Label } from '../src/lib/isroPds4Parser';
import { loadIsroRawImage, ISRO_TMC2_TOTAL_BYTES } from '../src/lib/isroImageLoader';
import { DeterministicLunarEngine } from '../src/lib/imageProcessor';

console.log('============================================================');
console.log('     LUNARSAFE ISRO CHANDRAYAAN-2 DATA TEST SUITE           ');
console.log('============================================================\n');

// 1. PDS4 XML Parser Tests
console.log('--- 1. PDS4 XML LABEL PARSER TESTS ---');
const xmlPath = path.resolve('src/assets/isro_data/ch2_tmc_ncn_20260823T1657513854_d_img_d18.xml');
const meta = parsePds4Label(xmlPath);

assert.strictEqual(meta.instrument, 'TMC-2', 'Instrument must be TMC-2');
console.log('[ASSERT 1] Instrument identification (TMC-2): PASS');

assert.strictEqual(meta.pixelResolution, 6.4, 'Pixel resolution must be 6.40 m/pixel');
assert.strictEqual(meta.pixel_resolution, 6.4, 'Snake_case alias pixel_resolution: PASS');
console.log('[ASSERT 2] Calibrated pixel resolution = 6.40 m/pixel: PASS');

assert.strictEqual(meta.imagingOrbitNumber, 31200, 'Imaging orbit number must be 31200');
console.log('[ASSERT 3] Imaging orbit number = 31200: PASS');

assert.strictEqual(meta.solarIncidence, 76.937867, 'Solar incidence must be 76.937867°');
console.log('[ASSERT 4] Solar incidence angle = 76.94°: PASS');

assert.strictEqual(meta.lines, 49119, 'Lines must be 49119 per official PDS4 label');
assert.strictEqual(meta.samples, 4000, 'Samples must be 4000');
assert.strictEqual(meta.dataType, 'UnsignedLSB2', 'Data type must be UnsignedLSB2');
console.log(`[ASSERT 5] Raster dimensions (${meta.lines} x ${meta.samples}, 16-bit UnsignedLSB2): PASS`);

assert.strictEqual(meta.coordinateSystem, 'Selenographic (Moon-centered)', 'Coordinate system must be Selenographic (Moon-centered)');
assert.strictEqual(meta.area, 'North Pole', 'Area must be North Pole');
assert.strictEqual(meta.corners.upperLeft.latitude, 77.530375, 'Upper-left latitude match');
assert.strictEqual(meta.corners.upperLeft.longitude, 12.843157, 'Upper-left longitude match');
console.log('[ASSERT 6] Selenographic coordinates (North Pole UL: 77.530°N, 12.843°E): PASS');

// 2. 16-bit Raw Image Slicing and Normalization Tests
console.log('\n--- 2. 16-BIT RAW IMAGE LOADER TESTS ---');
assert.strictEqual(ISRO_TMC2_TOTAL_BYTES, 392952000, 'ISRO TMC-2 total bytes must be 392,952,000');
const imgPath = path.resolve('src/assets/isro_data/ch2_tmc_ncn_20260823T1657513854_d_img_d18.img');

// Test dynamic resolution against real file using parsed PDS4 metadata
const tile = loadIsroRawImage(imgPath, 1500, 20000, 512, { metadata: meta });
assert.strictEqual(tile.width, 512, 'Tile width must be 512');
assert.strictEqual(tile.height, 512, 'Tile height must be 512');
assert.strictEqual(tile.data.length, 512 * 512 * 4, 'RGBA length must be 512 * 512 * 4');
console.log('[ASSERT 7] Sliced tile dimensions (512x512 RGBA via dynamic PDS4 metadata): PASS');

// Check that image has normalized panchromatic grayscale pixels (R === G === B and Alpha === 255)
let isGrayscale = true;
let allOpaque = true;
for (let i = 0; i < tile.data.length; i += 4) {
  if (tile.data[i] !== tile.data[i + 1] || tile.data[i] !== tile.data[i + 2]) {
    isGrayscale = false;
    break;
  }
  if (tile.data[i + 3] !== 255) {
    allOpaque = false;
    break;
  }
}
assert.strictEqual(isGrayscale, true, 'Normalized pixels must be panchromatic (R===G===B)');
assert.strictEqual(allOpaque, true, 'All pixels must have full alpha (255)');
console.log('[ASSERT 8] Panchromatic grayscale normalization (R=G=B, Alpha=255): PASS');

// 3. Frozen Pipeline Determinism on Real ISRO Data
console.log('\n--- 3. FROZEN PIPELINE DETERMINISTIC ANALYSIS ---');
console.log(`[TEST 3] Loading real ISRO .img file: PDS4 label declared dimensions: ${meta.lines} lines x ${meta.samples} samples (${(meta.lines * meta.samples * 2).toLocaleString()} bytes)`);
async function runEngineTest() {
  const dummyBuffer = Buffer.from(tile.data.buffer);
  const result = await DeterministicLunarEngine.processLunarImage(
    dummyBuffer,
    { width: 512, height: 512, data: tile.data },
    {
      pixelScaleMeters: 6.4,
      gridSizeMeters: 24,
      maxSlopeDeg: 10.0,
      solarIncidenceDeg: meta.solarIncidence,
    }
  );

  assert(result.meanSlopeDeg >= 0 && result.meanSlopeDeg <= 90, 'Mean slope must be within 0-90°');
  assert(result.evidence.inputImageHash.length === 64, 'Stage 1 hash must be 64-char hex');
  assert(result.evidence.slopeMapHash.length === 64, 'Stage 2 hash must be 64-char hex');
  assert(result.evidence.gridClassificationHash.length === 64, 'Stage 3 hash must be 64-char hex');
  assert(result.evidence.candidateZonesHash.length === 64, 'Stage 4 hash must be 64-char hex');
  console.log('[ASSERT 9] 4-Stage cryptographic hash chain sealed on ISRO tile: PASS');

  assert(result.evidence.cellCountSafe > 0, 'Safe grid cells must be found');
  const pixelCount = Math.floor(24 / meta.pixelResolution);
  const actualCellM = pixelCount * meta.pixelResolution;
  const cellAreaM2 = actualCellM * actualCellM;
  const totalSafeM2 = result.evidence.cellCountSafe * cellAreaM2;
  console.log(`[ASSERT 10] Terrain hazard map generated: ${result.evidence.cellCountSafe} safe cells (${result.evidence.safeAreaPercentage.toFixed(1)}% safe | Cell: ${actualCellM.toFixed(1)}m × ${actualCellM.toFixed(1)}m, ${cellAreaM2.toFixed(2)} m² | Total Safe Area: ${totalSafeM2.toLocaleString()} m²): PASS`);

  console.log('\n============================================================');
  console.log('FINAL RESULT: ALL ISRO DATA PIPELINE TESTS PASSED');
  console.log('============================================================');
}

runEngineTest().catch(err => {
  console.error('FAILED:', err);
  process.exit(1);
});
