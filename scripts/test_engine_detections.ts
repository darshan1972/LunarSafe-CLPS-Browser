import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';
import { DeterministicLunarEngine } from '../src/lib/imageProcessor';

async function main() {
  const samplePath = path.resolve('src/assets/samples/ch2_tmc2_south_pole.png');
  const buf = fs.readFileSync(samplePath);
  const png = PNG.sync.read(buf);
  const pixelData = { width: png.width, height: png.height, data: new Uint8ClampedArray(png.data) };
  
  const res = await DeterministicLunarEngine.processLunarImage(buf, pixelData, { pixelScaleMeters: 5.0 });
  console.log('Craters detected count:', res.craters.length);
  console.log('Boulders detected count:', res.boulders.length);
  console.log('Sample craters (first 5):', JSON.stringify(res.craters.slice(0, 5), null, 2));
  console.log('Sample boulders (first 5):', JSON.stringify(res.boulders.slice(0, 5), null, 2));
}

main().catch(console.error);
