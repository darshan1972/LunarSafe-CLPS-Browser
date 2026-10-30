import fs from 'fs';
import path from 'path';
import { DeterministicLunarEngine } from '../src/lib/imageProcessor';

async function main() {
  const imgPath = path.resolve('src/assets/isro_data/ch2_tmc_ncn_20260823T1657513854_d_img_d18.img');
  const fd = fs.openSync(imgPath, 'r');
  const col = 800, row = 45000, width = 512, height = 512, totalSamples = 4000;
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

  console.log('Searching normalizations via processLunarImage...');

  // Let's test different scalings / transforms:
  // 1. Min-max scaling: (v - min) / (max - min) * 255
  // 2. Linear scaling: a * v + b
  // 3. What if rawVal / 255?
  // 4. What if rawVal itself? (val8 = v)
  // Let's test a and b:
  for (let a = 0.5; a <= 2.5; a += 0.25) {
    for (let b = -40; b <= 60; b += 10) {
      const rgba = new Uint8ClampedArray(width * height * 4);
      for (let i = 0; i < u16.length; i++) {
        const v = Math.min(255, Math.max(0, Math.round(u16[i] * a + b)));
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
      if (Math.abs(res.craters.length - 664) < 80 || Math.abs(res.boulders.length - 403) < 80) {
        console.log(`a=${a.toFixed(2)}, b=${b} -> Craters: ${res.craters.length}, Boulders: ${res.boulders.length}, Safe%: ${res.evidence.safeAreaPercentage.toFixed(1)}%`);
      }
    }
  }
}

main().catch(console.error);
