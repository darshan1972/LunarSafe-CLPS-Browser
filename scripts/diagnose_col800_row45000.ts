/**
 * LunarSafe Mission Software — ISRO Raw Data Diagnostics & Feature Verification
 * Team Rocket · Parul University
 *
 * Verifies tile (col 800, row 45000) from raw calibrated ISRO TMC-2 raster:
 * ch2_tmc_ncn_20260823T1657513854_d_img_d18.img
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { loadIsroRawImage } from '../src/lib/isroImageLoader';
import { DeterministicLunarEngine } from '../src/lib/imageProcessor';
import { parsePds4Label } from '../src/lib/isroPds4Parser';

async function runDiagnostic() {
  console.log('================================================================================');
  console.log('     ISRO TMC-2 RAW TILE DIAGNOSTIC & VERIFICATION (col 800, row 45000)        ');
  console.log('================================================================================\n');

  const imgPath = path.resolve('src/assets/isro_data/ch2_tmc_ncn_20260823T1657513854_d_img_d18.img');
  const xmlPath = path.resolve('src/assets/isro_data/ch2_tmc_ncn_20260823T1657513854_d_img_d18.xml');

  if (!fs.existsSync(imgPath)) {
    throw new Error(`File not found: ${imgPath}`);
  }

  const col = 800;
  const row = 45000;
  const tileSize = 512;
  const metadata = fs.existsSync(xmlPath) ? parsePds4Label(xmlPath) : undefined;

  // 1. Raw Direct Extraction to inspect 16-bit DN raster values
  const fd = fs.openSync(imgPath, 'r');
  const totalSamples = 4000;
  const rawU16 = new Uint16Array(tileSize * tileSize);
  const lineBuffer = Buffer.alloc(tileSize * 2);
  const uniqueSet = new Set<number>();
  let rawMin = 65535;
  let rawMax = 0;
  let rawSum = 0;

  for (let y = 0; y < tileSize; y++) {
    const fileOffset = ((row + y) * totalSamples + col) * 2;
    fs.readSync(fd, lineBuffer, 0, tileSize * 2, fileOffset);
    for (let x = 0; x < tileSize; x++) {
      const val = lineBuffer.readUInt16LE(x * 2);
      rawU16[y * tileSize + x] = val;
      if (val < rawMin) rawMin = val;
      if (val > rawMax) rawMax = val;
      rawSum += val;
      uniqueSet.add(val);
    }
  }
  fs.closeSync(fd);

  const rawMean = rawSum / (tileSize * tileSize);

  console.log('--- 1. RAW TILE 16-BIT DN STATISTICAL EVIDENCE ---');
  console.log(`  File:                   ${path.basename(imgPath)}`);
  console.log(`  Coordinates:            Column ${col}, Row ${row} (512 x 512 px)`);
  console.log(`  Byte Offset Range:      ${((row * totalSamples + col) * 2).toLocaleString()} to ${(((row + tileSize) * totalSamples + col + tileSize) * 2).toLocaleString()} bytes`);
  console.log(`  Tile Min Value:         ${rawMin}`);
  console.log(`  Tile Max Value:         ${rawMax}`);
  console.log(`  Tile Mean Value:        ${rawMean.toFixed(2)}`);
  console.log(`  Number of Unique Values:${uniqueSet.size}\n`);

  // 2. Load via isroImageLoader.ts
  console.log('--- 2. LOADING TILE VIA isroImageLoader.ts ---');
  const loadedTile = loadIsroRawImage(imgPath, col, row, tileSize, { metadata });
  const tileBuffer = Buffer.from(loadedTile.data.buffer);
  console.log(`  Loaded Dimensions:      ${loadedTile.width} x ${loadedTile.height} RGBA`);
  console.log(`  Buffer Byte Length:     ${loadedTile.data.length} bytes\n`);

  // 3. Process through Frozen Pipeline Engine
  console.log('--- 3. PROCESSING THROUGH DETERMINISTIC LUNAR ENGINE ---');
  const pixelScaleMeters = metadata?.pixelResolution || 6.4;
  const solarIncidenceDeg = metadata?.solarIncidence || 76.937867;

  const result = await DeterministicLunarEngine.processLunarImage(
    tileBuffer,
    { width: loadedTile.width, height: loadedTile.height, data: loadedTile.data },
    {
      pixelScaleMeters,
      gridSizeMeters: 24,
      maxSlopeDeg: 10.0,
      solarIncidenceDeg,
    }
  );

  console.log(`  Craters Detected:       ${result.craters.length} (Target: ~664)`);
  console.log(`  Boulders Detected:      ${result.boulders.length} (Target: ~403)`);
  console.log(`  Hazardous Craters:      ${result.craters.filter(c => c.isHazard).length}`);
  console.log(`  Hazardous Boulders:     ${result.boulders.filter(b => b.isHazard).length}`);
  console.log(`  Mean Terrain Slope:     ${result.meanSlopeDeg.toFixed(2)}°`);
  console.log(`  Max Terrain Slope:      ${result.maxSlopeDeg.toFixed(2)}°`);
  console.log(`  Safe Landing Area (%):  ${result.evidence.safeAreaPercentage.toFixed(2)}%`);
  console.log(`  Stage 1 (Input Hash):   ${result.evidence.inputImageHash}`);
  console.log(`  Stage 2 (Slope Hash):   ${result.evidence.slopeMapHash}`);
  console.log(`  Stage 3 (Grid Hash):    ${result.evidence.gridClassificationHash}`);
  console.log(`  Stage 4 (Zone Hash):    ${result.evidence.candidateZonesHash}\n`);

  // 4. Frozen Engine Integrity Check
  console.log('--- 4. FROZEN ENGINE INTEGRITY AUDIT ---');
  const enginePath = path.resolve('src/lib/imageProcessor.ts');
  const engineBytes = fs.readFileSync(enginePath);
  const engineSize = engineBytes.length;
  const engineHash = crypto.createHash('sha256').update(engineBytes).digest('hex').toUpperCase();
  const EXPECTED_HASH = '8CA34C558C41F0B324A207A1D758476D397319999313D59A5919E75912882956';
  const EXPECTED_SIZE = 41930;

  console.log(`  Engine File:            ${enginePath}`);
  console.log(`  Engine File Size:       ${engineSize} bytes (Expected: ${EXPECTED_SIZE}) -> ${engineSize === EXPECTED_SIZE ? 'PASS' : 'FAIL'}`);
  console.log(`  Engine SHA-256 Hash:    ${engineHash}`);
  console.log(`  Expected SHA-256 Hash:  ${EXPECTED_HASH}`);
  console.log(`  Integrity Match:        ${engineHash === EXPECTED_HASH ? 'CONFIRMED (100% BIT-IDENTICAL)' : 'MISMATCH'}\n`);

  console.log('================================================================================');
  console.log('                     DIAGNOSTIC VERIFICATION COMPLETE                           ');
  console.log('================================================================================');
}

runDiagnostic().catch(err => {
  console.error('[DIAGNOSTIC ERROR]', err);
  process.exit(1);
});
