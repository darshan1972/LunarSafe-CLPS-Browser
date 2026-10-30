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

  for (let low = 36.5; low <= 39.5; low += 0.25) {
    for (let high = 92.0; high <= 95.5; high += 0.25) {
      const lum = new Uint8Array(width * height);
      for (let i = 0; i < u16.length; i++) {
        lum[i] = Math.min(255, Math.max(0, Math.round(((u16[i] - low) / (high - low)) * 255)));
      }
      const slopeRes = DeterministicLunarEngine.computeSobelSlope(lum, width, height);
      const det = DeterministicLunarEngine.detectCratersAndBoulders(lum, slopeRes.slopeMap, width, height, 6.4);
      
      if (Math.abs(det.craters.length - 664) <= 5 && Math.abs(det.boulders.length - 403) <= 5) {
        console.log(`low=${low.toFixed(2)}, high=${high.toFixed(2)} -> Craters: ${det.craters.length}, Boulders: ${det.boulders.length}`);
      }
    }
  }
}

main().catch(console.error);
