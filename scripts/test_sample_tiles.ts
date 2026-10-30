import path from 'path';
import fs from 'fs';
import { parsePds4Label } from '../src/lib/isroPds4Parser';
import { loadIsroRawImage } from '../src/lib/isroImageLoader';
import { DeterministicLunarEngine } from '../src/lib/imageProcessor';
import { CraterConsolidationService } from '../src/lib/craterConsolidation';

async function main() {
  const xmlPath = path.resolve('src/assets/isro_data/ch2_tmc_ncn_20260823T1657513854_d_img_d18.xml');
  const imgPath = path.resolve('src/assets/isro_data/ch2_tmc_ncn_20260823T1657513854_d_img_d18.img');
  const meta = parsePds4Label(xmlPath);
  const fd = fs.openSync(imgPath, 'r');

  const testIndices = [0, 1, 2, 3, 4, 10, 20, 50, 100, 200];
  for (const i of testIndices) {
    const col = i % 8;
    const row = Math.floor(i / 8);
    const tile = loadIsroRawImage(imgPath, col * 512, row * 512, 512, { metadata: meta, fd });
    const dummy = Buffer.from(tile.data.buffer);
    const res = await DeterministicLunarEngine.processLunarImage(
      dummy,
      { width: 512, height: 512, data: tile.data },
      { pixelScaleMeters: 6.4, gridSizeMeters: 24, maxSlopeDeg: 10.0, solarIncidenceDeg: meta.solarIncidence }
    );
    const craterCons = CraterConsolidationService.consolidate(res.craters, 6.4);
    const boulderCons = CraterConsolidationService.consolidate(res.boulders as any, 6.4);
    console.log(`Tile ${i}: craters raw=${res.craters.length}, distinct=${craterCons.distinctCratersCount} | boulders raw=${res.boulders.length}, distinct=${boulderCons.distinctCratersCount}`);
  }
  fs.closeSync(fd);
}

main().catch(console.error);
