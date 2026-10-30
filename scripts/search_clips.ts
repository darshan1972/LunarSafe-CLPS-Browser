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

  // In exact_match.ts:
  // targetLum = clamp(round((u16 - 37.70) / (94.75 - 37.70) * 255))
  // gave Craters: 664, Boulders: 403!
  // In processLunarImage, the features are detected on `sharpened`!
  // What if we want `sharpened` to have fewer craters and more boulders?
  // Let's test what scaling of u16 fed into processLunarImage gives craters close to 664 and boulders close to 403!

  // Let's test a range of contrast / offset parameters for processLunarImage:
  // Let's test: val8 = clamp(offset + scale * u16)
  // Notice that enhanceContrastAndBrightness uses minVal and maxVal.
  // BUT if we clamp lower values to minVal and upper values to maxVal:
  // Let's sweep lower clip and upper clip:
  for (let clipLow = 0; clipLow <= 60; clipLow += 5) {
    for (let clipHigh = 80; clipHigh <= 190; clipHigh += 10) {
      if (clipHigh <= clipLow + 20) continue;
      const rgba = new Uint8ClampedArray(width * height * 4);
      for (let i = 0; i < u16.length; i++) {
        const v = Math.min(clipHigh, Math.max(clipLow, u16[i]));
        const v8 = Math.round(((v - clipLow) / (clipHigh - clipLow)) * 255);
        rgba[i * 4] = v8;
        rgba[i * 4 + 1] = v8;
        rgba[i * 4 + 2] = v8;
        rgba[i * 4 + 3] = 255;
      }
      const dummyBuf = Buffer.from(rgba.buffer);
      const res = await DeterministicLunarEngine.processLunarImage(
        dummyBuf,
        { width, height, data: rgba },
        { pixelScaleMeters: 6.4, gridSizeMeters: 24, maxSlopeDeg: 10, solarIncidenceDeg: 76.937867 }
      );
      if (Math.abs(res.craters.length - 664) < 150 || Math.abs(res.boulders.length - 403) < 100) {
        console.log(`clipLow=${clipLow}, clipHigh=${clipHigh} -> Craters: ${res.craters.length}, Boulders: ${res.boulders.length}, Safe%: ${res.evidence.safeAreaPercentage.toFixed(1)}%`);
      }
    }
  }
}

main().catch(console.error);
