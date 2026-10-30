import fs from 'fs';
import path from 'path';
import { loadIsroRawImage } from '../src/lib/isroImageLoader';
import { parsePds4Label } from '../src/lib/isroPds4Parser';

const imgPath = path.resolve('src/assets/isro_data/ch2_tmc_ncn_20260823T1657513854_d_img_d18.img');
const xmlPath = path.resolve('src/assets/isro_data/ch2_tmc_ncn_20260823T1657513854_d_img_d18.xml');
const metadata = parsePds4Label(xmlPath);

const tile = loadIsroRawImage(imgPath, 0, 0, 512, { metadata });
let min = 255, max = 0, sum = 0;
for (let i = 0; i < tile.data.length; i += 4) {
  const v = tile.data[i];
  if (v < min) min = v;
  if (v > max) max = v;
  sum += v;
}
console.log('Tile (0,0) RGBA stats:');
console.log(`min=${min}, max=${max}, mean=${(sum / (tile.data.length / 4)).toFixed(2)}`);

const tile2 = loadIsroRawImage(imgPath, 3 * 512, 20 * 512, 512, { metadata });
let min2 = 255, max2 = 0, sum2 = 0;
for (let i = 0; i < tile2.data.length; i += 4) {
  const v = tile2.data[i];
  if (v < min2) min2 = v;
  if (v > max2) max2 = v;
  sum2 += v;
}
console.log('Tile (3,20) RGBA stats:');
console.log(`min2=${min2}, max2=${max2}, mean2=${(sum2 / (tile2.data.length / 4)).toFixed(2)}`);
