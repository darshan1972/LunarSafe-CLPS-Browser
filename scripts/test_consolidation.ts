import fs from 'fs';
import path from 'path';
import { DeterministicLunarEngine } from '../src/lib/imageProcessor';
import { loadIsroRawImage } from '../src/lib/isroImageLoader';
import { parsePds4Label } from '../src/lib/isroPds4Parser';
import { CraterConsolidationService } from '../src/lib/craterConsolidation';

async function testConsolidation() {
  const imgPath = path.resolve('src/assets/isro_data/ch2_tmc_ncn_20260823T1657513854_d_img_d18.img');
  const xmlPath = path.resolve('src/assets/isro_data/ch2_tmc_ncn_20260823T1657513854_d_img_d18.xml');
  const metadata = parsePds4Label(xmlPath);

  const testTiles = [
    { name: 'Tile (0,0) [North Pole top-left]', x: 0, y: 0 },
    { name: 'Tile (3,20) [High Latitude]', x: 3 * 512, y: 20 * 512 },
    { name: 'Tile (2,50) [Mid Swath]', x: 2 * 512, y: 50 * 512 },
    { name: 'Tile (4,80) [Lower Swath]', x: 4 * 512, y: 80 * 512 }
  ];

  console.log('=== CONSOLIDATION TEST ON REAL TILES ===');
  for (const t of testTiles) {
    const rawTile = loadIsroRawImage(imgPath, t.x, t.y, 512, { metadata });
    const dummyBuf = Buffer.from(rawTile.data.buffer);
    const tileRes = await DeterministicLunarEngine.processLunarImage(
      dummyBuf,
      { width: 512, height: 512, data: rawTile.data },
      { pixelScaleMeters: 6.4, gridSizeMeters: 24.0, maxSlopeDeg: 10.0, solarIncidenceDeg: metadata.solarIncidence }
    );

    const consolidated = CraterConsolidationService.consolidate(tileRes.craters, 6.4);
    console.log(`${t.name}:`);
    console.log(`  Raw 8x8 patches detected: ${tileRes.craters.length}`);
    console.log(`  Consolidated distinct craters: ${consolidated.distinctCratersCount}`);
    console.log(`  Consolidation ratio: ${(tileRes.craters.length / Math.max(1, consolidated.distinctCratersCount)).toFixed(1)}x`);
  }
}

testConsolidation().catch(console.error);
