import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { DeterministicLunarEngine } from '../src/lib/imageProcessor';

async function main() {
  const imgPath = path.resolve('src/assets/isro_data/ch2_tmc_ncn_20260823T1657513854_d_img_d18.img');
  const fd = fs.openSync(imgPath, 'r');
  const col = 1500, row = 20000, width = 512, height = 512, totalSamples = 4000;
  const u16 = new Uint16Array(width * height);
  const lineBuf = Buffer.alloc(width * 2);
  for (let y = 0; y < height; y++) {
    const fileOffset = ((row + y) * totalSamples + col) * 2;
    fs.readSync(fd, lineBuf, 0, width * 2, fileOffset);
    for (let x = 0; x < width; x++) {
      u16[y * width + x] = lineBuf.readUInt16LE(x * 2);
    }
  }
  fs.closeSync(fd);

  let sum = 0, sumSq = 0, minVal = 65535, maxVal = 0;
  for (let v of u16) {
    if (v < minVal) minVal = v;
    if (v > maxVal) maxVal = v;
    sum += v;
    sumSq += v * v;
  }
  const mean = sum / u16.length;
  const std = Math.sqrt(sumSq / u16.length - mean * mean);

  const lowCut = Math.max(0, mean - 2.20 * std);
  const highCut = Math.min(maxVal, mean + 2.36 * std);
  const gamma = 0.43;

  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < u16.length; i++) {
    const norm = Math.max(0, Math.min(1, (u16[i] - lowCut) / (highCut - lowCut)));
    const v = Math.min(255, Math.max(0, Math.round(Math.pow(norm, gamma) * 255)));
    rgba[i * 4] = v;
    rgba[i * 4 + 1] = v;
    rgba[i * 4 + 2] = v;
    rgba[i * 4 + 3] = 255;
  }

  const dummyBuf = Buffer.from(rgba.buffer);
  const res = await DeterministicLunarEngine.processLunarImage(
    dummyBuf,
    { width, height, data: rgba },
    { pixelScaleMeters: 6.4, gridSizeMeters: 24, maxSlopeDeg: 10, solarIncidenceDeg: 76.937867 }
  );

  console.log(`Tile (1500, 20000):`);
  console.log(`  Safe Cells: ${res.evidence.cellCountSafe}`);
  console.log(`  Safe %: ${res.evidence.safeAreaPercentage.toFixed(2)}%`);
  console.log(`  Craters: ${res.craters.length}`);
  console.log(`  Boulders: ${res.boulders.length}`);
  console.log(`  Mean Slope: ${res.meanSlopeDeg.toFixed(2)}°`);
  assert(res.evidence.cellCountSafe > 0, 'Safe cells must be > 0');
  console.log('PASS!');
}

main().catch(console.error);
