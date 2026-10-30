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

const sorted = Array.from(u16).sort((a, b) => a - b);
const n = sorted.length;
const median = sorted[Math.floor(n / 2)];
const q1 = sorted[Math.floor(n * 0.25)];
const q3 = sorted[Math.floor(n * 0.75)];
const iqr = q3 - q1;

console.log('Q1 (25%):', q1);
console.log('Median (50%):', median);
console.log('Q3 (75%):', q3);
console.log('IQR:', iqr);
console.log('Q1 - 1.5*IQR:', q1 - 1.5 * iqr);
console.log('Q3 + 1.5*IQR:', q3 + 1.5 * iqr);
console.log('Q1 - 1.0*IQR:', q1 - 1.0 * iqr);
console.log('Q3 + 0.5*IQR:', q3 + 0.5 * iqr);

// What about mean and std?
let sum = 0, sumSq = 0;
for (let v of u16) {
  sum += v;
  sumSq += v * v;
}
const mean = sum / n;
const std = Math.sqrt(sumSq / n - mean * mean);
console.log('mean:', mean, 'std:', std);

// What about:
// low = mean - 1.7 * std
// high = mean + 0.9 * std
console.log('mean - 1.706 * std:', mean - 1.706 * std);
console.log('mean + 0.919 * std:', mean + 0.919 * std);
