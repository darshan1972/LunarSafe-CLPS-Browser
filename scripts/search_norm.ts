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

  let minVal = 65535, maxVal = 0;
  for (let i = 0; i < u16.length; i++) {
    if (u16[i] < minVal) minVal = u16[i];
    if (u16[i] > maxVal) maxVal = u16[i];
  }

  // Let's test a fine grid of linear scaling:
  // val8 = Math.min(255, Math.max(0, Math.round((u16 - low) / (high - low) * 255)))
  // We want craters ~ 664, boulders ~ 403.
  console.log('Searching for parameters matching ~664 craters and ~403 boulders...');

  const bestMatches: any[] = [];

  // Low can range from 0 to 40, High from 80 to 200
  for (let low = 0; low <= 50; low += 5) {
    for (let high = 70; high <= 220; high += 10) {
      if (high <= low + 10) continue;
      
      const lum = new Uint8Array(width * height);
      const rgba = new Uint8ClampedArray(width * height * 4);
      for (let i = 0; i < u16.length; i++) {
        const v = Math.min(255, Math.max(0, Math.round(((u16[i] - low) / (high - low)) * 255)));
        lum[i] = v;
        rgba[i * 4] = v;
        rgba[i * 4 + 1] = v;
        rgba[i * 4 + 2] = v;
        rgba[i * 4 + 3] = 255;
      }
      
      const slopeRes = DeterministicLunarEngine.computeSobelSlope(lum, width, height);
      const det = DeterministicLunarEngine.detectCratersAndBoulders(lum, slopeRes.slopeMap, width, height, 6.4);
      
      const craterDiff = Math.abs(det.craters.length - 664);
      const boulderDiff = Math.abs(det.boulders.length - 403);
      const score = craterDiff + boulderDiff;
      
      if (craterDiff < 150 && boulderDiff < 150) {
        console.log(`low=${low}, high=${high} -> Craters: ${det.craters.length}, Boulders: ${det.boulders.length} (score=${score})`);
        bestMatches.push({ low, high, craters: det.craters.length, boulders: det.boulders.length, score });
      }
    }
  }

  bestMatches.sort((a, b) => a.score - b.score);
  console.log('\nTop 5 matches:');
  console.log(bestMatches.slice(0, 5));
}

main().catch(console.error);
