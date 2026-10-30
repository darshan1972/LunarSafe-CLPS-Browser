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
function getPctOfVal(v: number) {
  const idx = sorted.findIndex(x => x >= v);
  return (idx / sorted.length) * 100;
}

console.log('Percentile of 37:', getPctOfVal(37).toFixed(2), '%');
console.log('Percentile of 38:', getPctOfVal(38).toFixed(2), '%');
console.log('Percentile of 93:', getPctOfVal(93).toFixed(2), '%');
console.log('Percentile of 94:', getPctOfVal(94).toFixed(2), '%');
console.log('Percentile of 95:', getPctOfVal(95).toFixed(2), '%');

// What if it's min-max with a specific multiplier?
// What if rawVal is 10-bit or scaled by a factor?
