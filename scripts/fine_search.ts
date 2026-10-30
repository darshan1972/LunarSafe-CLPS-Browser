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

  let sum = 0, sumSq = 0;
  for (let i = 0; i < u16.length; i++) {
    sum += u16[i];
    sumSq += u16[i] * u16[i];
  }
  const mean = sum / u16.length;
  const std = Math.sqrt(sumSq / u16.length - mean * mean);
  console.log(`Mean: ${mean.toFixed(2)}, StdDev: ${std.toFixed(2)}`);
  console.log(`Mean - 2*Std: ${(mean - 2 * std).toFixed(2)}, Mean + 2*Std: ${(mean + 2 * std).toFixed(2)}`);
  console.log(`Mean - 1.5*Std: ${(mean - 1.5 * std).toFixed(2)}, Mean + 1.5*Std: ${(mean + 1.5 * std).toFixed(2)}`);
  console.log(`Mean - 1*Std: ${(mean - std).toFixed(2)}, Mean + 1*Std: ${(mean + std).toFixed(2)}`);

  const results: any[] = [];

  for (let low = 36; low <= 46; low += 1) {
    for (let high = 85; high <= 96; high += 1) {
      const lum = new Uint8Array(width * height);
      for (let i = 0; i < u16.length; i++) {
        lum[i] = Math.min(255, Math.max(0, Math.round(((u16[i] - low) / (high - low)) * 255)));
      }
      const slopeRes = DeterministicLunarEngine.computeSobelSlope(lum, width, height);
      const det = DeterministicLunarEngine.detectCratersAndBoulders(lum, slopeRes.slopeMap, width, height, 6.4);
      
      const score = Math.abs(det.craters.length - 664) + Math.abs(det.boulders.length - 403);
      if (score < 40) {
        console.log(`low=${low}, high=${high} -> Craters: ${det.craters.length}, Boulders: ${det.boulders.length} (score=${score})`);
        results.push({ low, high, craters: det.craters.length, boulders: det.boulders.length, score });
      }
    }
  }

  results.sort((a, b) => a.score - b.score);
  console.log('\nClosest:');
  console.log(results.slice(0, 10));
}

main().catch(console.error);
