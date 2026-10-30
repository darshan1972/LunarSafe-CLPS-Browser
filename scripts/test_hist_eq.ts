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

  // 1. Standard Histogram Equalization
  const hist = new Uint32Array(256);
  for (let v of u16) {
    hist[Math.min(255, v)]++;
  }
  const cdf = new Float32Array(256);
  let cdfMin = 0;
  let cum = 0;
  for (let i = 0; i < 256; i++) {
    cum += hist[i];
    cdf[i] = cum;
    if (cdfMin === 0 && hist[i] > 0) cdfMin = cum;
  }
  const totalPx = width * height;
  const eqLum = new Uint8Array(width * height);
  for (let i = 0; i < u16.length; i++) {
    const v = Math.min(255, u16[i]);
    eqLum[i] = Math.round(((cdf[v] - cdfMin) / (totalPx - cdfMin)) * 255);
  }

  const slopeRes = DeterministicLunarEngine.computeSobelSlope(eqLum, width, height);
  const det = DeterministicLunarEngine.detectCratersAndBoulders(eqLum, slopeRes.slopeMap, width, height, 6.4);
  console.log(`Histogram Equalization -> Craters: ${det.craters.length}, Boulders: ${det.boulders.length}`);
}

main().catch(console.error);
