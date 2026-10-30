import fs from 'fs';
import path from 'path';

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

const low = 37.70, high = 94.75;
const lum = new Uint8Array(width * height);
let min = 255, max = 0, sum = 0;
for (let i = 0; i < u16.length; i++) {
  const v = Math.min(255, Math.max(0, Math.round(((u16[i] - low) / (high - low)) * 255)));
  lum[i] = v;
  if (v < min) min = v;
  if (v > max) max = v;
  sum += v;
}
console.log('Stretched image stats:');
console.log(`min=${min}, max=${max}, mean=${(sum / lum.length).toFixed(2)}`);

// What happens if we pass lum into enhanceContrastAndBrightness?
// In imageProcessor.ts:
const length = width * height;
const range = max - min;
const mean = sum / length;
const isDarkPSR = mean < 60;
const alpha = isDarkPSR ? 0.35 : 0.15;
console.log(`mean=${mean.toFixed(2)}, isDarkPSR=${isDarkPSR}, alpha=${alpha}`);
