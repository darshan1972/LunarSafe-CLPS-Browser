import fs from 'fs';
import path from 'path';
import { DeterministicLunarEngine } from '../src/lib/imageProcessor';
import { loadIsroRawImage } from '../src/lib/isroImageLoader';

async function main() {
  const imgPath = path.resolve('src/assets/isro_data/ch2_tmc_ncn_20260823T1657513854_d_img_d18.img');
  const fd = fs.openSync(imgPath, 'r');

  const col = 800;
  const row = 45000;
  const width = 512;
  const height = 512;
  const totalSamples = 4000;

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

  let minVal = 65535, maxVal = 0, sumVal = 0;
  const uniqueSet = new Set<number>();
  for (let i = 0; i < u16.length; i++) {
    const v = u16[i];
    if (v < minVal) minVal = v;
    if (v > maxVal) maxVal = v;
    sumVal += v;
    uniqueSet.add(v);
  }
  const meanVal = sumVal / u16.length;

  console.log('====================================================');
  console.log('DIAGNOSTIC RAW STATS FOR TILE (col 800, row 45000):');
  console.log(`  Tile Min Value:       ${minVal}`);
  console.log(`  Tile Max Value:       ${maxVal}`);
  console.log(`  Tile Mean Value:      ${meanVal.toFixed(2)}`);
  console.log(`  Number of Unique DNs: ${uniqueSet.size}`);
  console.log('====================================================\n');

  // Test current isroImageLoader result:
  console.log('--- CURRENT isroImageLoader.ts RESULT ---');
  const currentTile = loadIsroRawImage(imgPath, col, row, 512);
  const currentBuf = Buffer.from(currentTile.data.buffer);
  const curRes = await DeterministicLunarEngine.processLunarImage(
    currentBuf,
    { width, height, data: currentTile.data },
    { pixelScaleMeters: 6.4, gridSizeMeters: 24.0, maxSlopeDeg: 10.0, solarIncidenceDeg: 76.937867 }
  );
  console.log(`Current: Craters = ${curRes.craters.length}, Boulders = ${curRes.boulders.length}, Safe% = ${curRes.evidence.safeAreaPercentage.toFixed(2)}%\n`);

  async function testNorm(name: string, getVal8: (v: number) => number) {
    const rgba = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < u16.length; i++) {
      const v8 = getVal8(u16[i]);
      const idx = i * 4;
      rgba[idx] = v8;
      rgba[idx + 1] = v8;
      rgba[idx + 2] = v8;
      rgba[idx + 3] = 255;
    }
    const dummyBuf = Buffer.from(rgba.buffer);
    const res = await DeterministicLunarEngine.processLunarImage(
      dummyBuf,
      { width, height, data: rgba },
      { pixelScaleMeters: 6.4, gridSizeMeters: 24.0, maxSlopeDeg: 10.0, solarIncidenceDeg: 76.937867 }
    );
    console.log(`${name} -> Craters: ${res.craters.length}, Boulders: ${res.boulders.length}, Safe%: ${res.evidence.safeAreaPercentage.toFixed(2)}%`);
  }

  console.log('--- TESTING NORMALIZATION METHODS ---');
  await testNorm('Method A: Min-Max Math.round((v - min)/(max - min)*255)', v => {
    return Math.min(255, Math.max(0, Math.round(((v - minVal) / (maxVal - minVal)) * 255)));
  });

  await testNorm('Method B: Min-Max Math.floor((v - min)/(max - min)*255)', v => {
    return Math.min(255, Math.max(0, Math.floor(((v - minVal) / (maxVal - minVal)) * 255)));
  });

  await testNorm('Method C: Direct v clamped to 255', v => {
    return Math.min(255, v);
  });

  await testNorm('Method D: Scale by max (v / max * 255)', v => {
    return Math.min(255, Math.max(0, Math.round((v / maxVal) * 255)));
  });

  // What about contrast stretching (1% - 99% percentile)?
  const sorted = Array.from(u16).sort((a, b) => a - b);
  const p1 = sorted[Math.floor(sorted.length * 0.01)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  console.log(`\nPercentiles: 1% = ${p1}, 99% = ${p99}`);
  await testNorm('Method E: 1%-99% Percentile stretch', v => {
    return Math.min(255, Math.max(0, Math.round(((v - p1) / (p99 - p1)) * 255)));
  });
}

main().catch(console.error);
