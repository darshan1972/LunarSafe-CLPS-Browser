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

  for (let hc of [126.0, 126.5, 127.0, 127.5, 128.0]) {
    const rgba = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < u16.length; i++) {
      const norm = Math.max(0, Math.min(1, (u16[i] - 27) / (hc - 27)));
      const v = Math.min(255, Math.max(0, Math.round(Math.pow(norm, 0.43) * 255)));
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
    console.log(`highCut=${hc.toFixed(1)} -> Craters: ${res.craters.length}, Boulders: ${res.boulders.length}, Safe%: ${res.evidence.safeAreaPercentage.toFixed(1)}%`);
  }
}

main().catch(console.error);
