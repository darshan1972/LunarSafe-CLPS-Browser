import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import { DeterministicLunarEngine } from '../src/lib/imageProcessor';
import { computeSlopeFromDEM } from '../src/lib/demSlope';

async function testDemToEngine(tifName: string, gsd: number) {
  const filePath = path.resolve('src/assets/dem', tifName);
  const buf = fs.readFileSync(filePath);
  const floats = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
  const dim = Math.round(Math.sqrt(floats.length));

  // Compute exact Horn slope
  const horn = computeSlopeFromDEM(floats, dim, dim, gsd);
  console.log(`[${tifName}] Exact Horn Mean Slope: ${horn.meanSlopeDeg}°`);

  // Normalize floats to 8-bit grayscale for display and panchromatic engine
  let min = Infinity, max = -Infinity;
  for (let i = 0; i < floats.length; i++) {
    if (floats[i] < min) min = floats[i];
    if (floats[i] > max) max = floats[i];
  }
  const range = max - min || 1;

  const png = new PNG({ width: dim, height: dim });
  for (let i = 0; i < floats.length; i++) {
    const val = Math.round(((floats[i] - min) / range) * 255);
    png.data[i * 4] = val;
    png.data[i * 4 + 1] = val;
    png.data[i * 4 + 2] = val;
    png.data[i * 4 + 3] = 255;
  }
  const pngBuf = PNG.sync.write(png);

  // Run engine
  const res = await DeterministicLunarEngine.processLunarImage(
    pngBuf.buffer,
    { width: dim, height: dim, data: new Uint8ClampedArray(png.data) },
    { pixelScaleMeters: gsd, gridSizeMeters: 24, maxSlopeDeg: 10.0 }
  );

  console.log(`[${tifName}] Engine Safe%: ${res.evidence.safeAreaPercentage}%, Cells: ${res.evidence.cellCountSafe}/${res.evidence.totalCellsEvaluated}, MeanSlope: ${res.meanSlopeDeg.toFixed(2)}°`);
}

async function run() {
  await testDemToEngine('apollo11_lola_dem.tif', 59.225);
  await testDemToEngine('shiv_shakti_lola_dem.tif', 35.15);
  await testDemToEngine('shackleton_lola_dem.tif', 20.0);
  await testDemToEngine('marginal_site_lola_dem.tif', 57.38);
  await testDemToEngine('lola_sample.tif', 80.0);
}

run().catch(console.error);
