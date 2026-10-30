import fs from 'fs';
import path from 'path';
import { parsePds4Label } from '../src/lib/isroPds4Parser';
import { loadIsroRawImage } from '../src/lib/isroImageLoader';
import { DeterministicLunarEngine } from '../src/lib/imageProcessor';
import { CraterConsolidationService } from '../src/lib/craterConsolidation';

async function testConsolidationSpeed() {
  const xmlPath = path.resolve('src/assets/isro_data/ch2_tmc_ncn_20260823T1657513854_d_img_d18.xml');
  const imgPath = path.resolve('src/assets/isro_data/ch2_tmc_ncn_20260823T1657513854_d_img_d18.img');
  const meta = parsePds4Label(xmlPath);
  const fd = fs.openSync(imgPath, 'r');

  console.log('Testing speed on 5 tiles...');
  const t0 = Date.now();
  for (let i = 0; i < 5; i++) {
    const tile = loadIsroRawImage(imgPath, (i % 8) * 512, Math.floor(i / 8) * 512, 512, { metadata: meta, fd });
    const dummyBuffer = Buffer.from(tile.data.buffer);
    const res = await DeterministicLunarEngine.processLunarImage(
      dummyBuffer,
      { width: 512, height: 512, data: tile.data },
      { pixelScaleMeters: 6.4, gridSizeMeters: 24, maxSlopeDeg: 10.0, solarIncidenceDeg: meta.solarIncidence }
    );
    const cons = CraterConsolidationService.consolidate(res.craters, 6.4);
    console.log(`Tile ${i}: raw = ${res.craters.length}, distinct = ${cons.distinctCratersCount}`);
  }
  fs.closeSync(fd);
  console.log(`5 tiles took: ${Date.now() - t0} ms`);
}

testConsolidationSpeed().catch(console.error);
