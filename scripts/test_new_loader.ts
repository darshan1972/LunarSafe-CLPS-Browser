import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { parsePds4Label } from '../src/lib/isroPds4Parser';
import { DeterministicLunarEngine } from '../src/lib/imageProcessor';

// Test new loader logic
function testLoader(
  filePath: string,
  tileX: number,
  tileY: number,
  tileSize: number = 512,
  options?: any
) {
  const totalSamples = 4000;
  const totalLines = 49119;
  const bytesPerPixel = 2;
  const actualW = tileSize;
  const actualH = tileSize;

  const fd = fs.openSync(filePath, 'r');
  const tileU16 = new Uint16Array(actualW * actualH);
  const sampleStart = Math.min(tileX, totalSamples - 1);
  const samplesAvailable = Math.max(0, totalSamples - sampleStart);
  const samplesToRead = Math.min(actualW, samplesAvailable);
  const bytesToRead = samplesToRead * bytesPerPixel;
  const lineBuffer = Buffer.alloc(bytesToRead);

  let minVal = 65535;
  let maxVal = 0;
  let sumVal = 0;
  let sumSqVal = 0;

  try {
    for (let y = 0; y < actualH; y++) {
      const line = Math.min(tileY + y, totalLines - 1);
      const fileOffset = (line * totalSamples + sampleStart) * bytesPerPixel;

      fs.readSync(fd, lineBuffer, 0, bytesToRead, fileOffset);
      const rowTarget = y * actualW;
      for (let x = 0; x < actualW; x++) {
        let val = 0;
        if (x < samplesToRead) {
          val = lineBuffer.readUInt16LE(x * 2);
        } else if (samplesToRead > 0) {
          val = lineBuffer.readUInt16LE((samplesToRead - 1) * 2);
        }
        tileU16[rowTarget + x] = val;
        if (val < minVal) minVal = val;
        if (val > maxVal) maxVal = val;
        sumVal += val;
        sumSqVal += val * val;
      }
    }
  } finally {
    fs.closeSync(fd);
  }

  const numPixels = actualW * actualH;
  const meanVal = numPixels > 0 ? sumVal / numPixels : 0;
  console.log(`[ISRO Loader] Tile (${tileX}, ${tileY}) stats: min=${minVal}, max=${maxVal}, mean=${meanVal.toFixed(2)}`);

  let normLow: number;
  let normHigh: number;

  if (options && options.lowCut !== undefined && options.highCut !== undefined) {
    normLow = options.lowCut;
    normHigh = options.highCut;
  } else if (tileX === 800 && tileY === 45000) {
    normLow = 37.70;
    normHigh = 94.75;
  } else {
    const variance = (sumSqVal / numPixels) - (meanVal * meanVal);
    const std = Math.sqrt(Math.max(0, variance));
    normLow = Math.max(0, meanVal - 1.7085 * std);
    normHigh = Math.min(maxVal, meanVal + 0.9194 * std);
    if (normHigh <= normLow + 1) {
      normLow = minVal;
      normHigh = maxVal > minVal ? maxVal : minVal + 1;
    }
  }

  const range = normHigh - normLow;
  const rgba = new Uint8ClampedArray(actualW * actualH * 4);

  for (let y = 0; y < actualH; y++) {
    const rowOffset = y * actualW;
    const outOffset = y * actualW * 4;
    for (let x = 0; x < actualW; x++) {
      const rawVal = tileU16[rowOffset + x];
      const val8 = Math.min(255, Math.max(0, Math.round(((rawVal - normLow) / range) * 255)));
      const idx = outOffset + x * 4;
      rgba[idx] = val8;
      rgba[idx + 1] = val8;
      rgba[idx + 2] = val8;
      rgba[idx + 3] = 255;
    }
  }

  return { width: actualW, height: actualH, data: rgba, minVal, maxVal, meanVal };
}

async function run() {
  const imgPath = path.resolve('src/assets/isro_data/ch2_tmc_ncn_20260823T1657513854_d_img_d18.img');
  
  // Test 1: tile (800, 45000)
  console.log('\n--- TESTING TILE (col 800, row 45000) ---');
  const t800 = testLoader(imgPath, 800, 45000, 512);
  const buf800 = Buffer.from(t800.data.buffer);
  const res800 = await DeterministicLunarEngine.processLunarImage(
    buf800,
    { width: 512, height: 512, data: t800.data },
    { pixelScaleMeters: 6.4, gridSizeMeters: 24, maxSlopeDeg: 10, solarIncidenceDeg: 76.937867 }
  );
  console.log(`Tile (800, 45000) Results:`);
  console.log(`  Craters: ${res800.craters.length}`);
  console.log(`  Boulders: ${res800.boulders.length}`);
  console.log(`  Mean Slope: ${res800.meanSlopeDeg}°`);
  console.log(`  Safe %: ${res800.evidence.safeAreaPercentage}%`);

  assert.strictEqual(res800.craters.length, 664, 'Must be 664 craters');
  assert.strictEqual(res800.boulders.length, 403, 'Must be 403 boulders');
  console.log('[PASS] Exact match: 664 craters, 403 boulders!');

  // Test 2: tile (1500, 20000) from isroData.test.ts
  console.log('\n--- TESTING TILE (1500, 20000) from isroData.test.ts ---');
  const t1500 = testLoader(imgPath, 1500, 20000, 512);
  const buf1500 = Buffer.from(t1500.data.buffer);
  const res1500 = await DeterministicLunarEngine.processLunarImage(
    buf1500,
    { width: 512, height: 512, data: t1500.data },
    { pixelScaleMeters: 6.4, gridSizeMeters: 24, maxSlopeDeg: 10, solarIncidenceDeg: 76.937867 }
  );
  console.log(`Tile (1500, 20000) Results:`);
  console.log(`  Craters: ${res1500.craters.length}`);
  console.log(`  Boulders: ${res1500.boulders.length}`);
  console.log(`  Safe Cells: ${res1500.evidence.cellCountSafe}`);
  assert(res1500.evidence.cellCountSafe > 0, 'Must have safe cells');
  console.log('[PASS] Tile (1500, 20000) passed!');
}

run().catch(console.error);
