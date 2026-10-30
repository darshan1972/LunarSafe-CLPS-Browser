import fs from 'fs';
import path from 'path';
import { loadIsroRawImage } from '../src/lib/isroImageLoader';
import { parsePds4Label } from '../src/lib/isroPds4Parser';

const imgPath = path.resolve('src/assets/isro_data/ch2_tmc_ncn_20260823T1657513854_d_img_d18.img');
const xmlPath = path.resolve('src/assets/isro_data/ch2_tmc_ncn_20260823T1657513854_d_img_d18.xml');
const metadata = parsePds4Label(xmlPath);

// Sample raw file directly
const fd = fs.openSync(imgPath, 'r');
const buf = Buffer.alloc(512 * 2);
fs.readSync(fd, buf, 0, 1024, 5000000);
fs.closeSync(fd);
const u16 = new Uint16Array(buf.buffer, buf.byteOffset, 512);
console.log('Sample raw 16-bit values from file:');
console.log(Array.from(u16.slice(0, 20)));

const tile = loadIsroRawImage(imgPath, 1000, 10000, 512, { metadata });
let min = 255, max = 0, sum = 0;
for (let i = 0; i < tile.data.length; i += 4) {
  const v = tile.data[i];
  if (v < min) min = v;
  if (v > max) max = v;
  sum += v;
}
console.log('Normalized 8-bit tile stats:');
console.log(`min=${min}, max=${max}, mean=${(sum / (tile.data.length / 4)).toFixed(2)}`);
