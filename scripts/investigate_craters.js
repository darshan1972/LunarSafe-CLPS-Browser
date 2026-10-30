import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import { DeterministicLunarEngine } from '../src/lib/imageProcessor';
import { loadIsroRawImage } from '../src/lib/isroImageLoader';
import { parsePds4Label } from '../src/lib/isroPds4Parser';

async function investigate() {
  console.log('============================================================');
  console.log('         CRATER COUNT DISCREPANCY INVESTIGATION            ');
  console.log('============================================================\n');

  // 1. Test sample image: ch2_tmc2_south_pole.png
  const samplePath = path.resolve('src/assets/samples/ch2_tmc2_south_pole.png');
  const sampleBuf = fs.readFileSync(samplePath);
  const parsedPng = PNG.sync.read(sampleBuf);
  const samplePixelData = {
    width: parsedPng.width,
    height: parsedPng.height,
    data: new Uint8ClampedArray(parsedPng.data),
  };

  const sampleResult = await DeterministicLunarEngine.processLunarImage(
    sampleBuf,
    samplePixelData,
    { pixelScaleMeters: 5.0, gridSizeMeters: 24.0, maxSlopeDeg: 10.0 }
  );
  console.log('--- 1. SAMPLE IMAGE (ch2_tmc2_south_pole.png, 512x512) ---');
  console.log(`Craters detected: ${sampleResult.craters.length}`);
  console.log(`Boulders detected: ${sampleResult.boulders.length}`);
  console.log(`Mean slope: ${sampleResult.meanSlopeDeg.toFixed(2)}°`);
  console.log(`Safe %: ${sampleResult.evidence.safeAreaPercentage}%\n`);

  // 2. Test real ISRO tiles from ch2_tmc_ncn_20260823T1657513854_d_img_d18.img
  const imgPath = path.resolve('src/assets/isro_data/ch2_tmc_ncn_20260823T1657513854_d_img_d18.img');
  const xmlPath = path.resolve('src/assets/isro_data/ch2_tmc_ncn_20260823T1657513854_d_img_d18.xml');
  const metadata = parsePds4Label(xmlPath);

  const testTiles = [
    { name: 'Tile (0,0) [UL: North Pole]', x: 0, y: 0 },
    { name: 'Tile (3,20) [High Latitude]', x: 3 * 512, y: 20 * 512 },
    { name: 'Tile (2,50) [Mid Swath]', x: 2 * 512, y: 50 * 512 },
    { name: 'Tile (4,80) [Lower Swath]', x: 4 * 512, y: 80 * 512 }
  ];

  console.log('--- 2. REAL ISRO TILES (from 392 MB Calibrated .img, 512x512) ---');
  const tileCounts = [];
  for (const t of testTiles) {
    const rawTile = loadIsroRawImage(imgPath, t.x, t.y, 512, { metadata });
    const dummyBuf = Buffer.from(rawTile.data.buffer);
    const tileRes = await DeterministicLunarEngine.processLunarImage(
      dummyBuf,
      { width: 512, height: 512, data: rawTile.data },
      { pixelScaleMeters: 6.4, gridSizeMeters: 24.0, maxSlopeDeg: 10.0, solarIncidenceDeg: metadata.solarIncidence }
    );
    tileCounts.push(tileRes.craters.length);
    console.log(`${t.name}:`);
    console.log(`  Craters detected: ${tileRes.craters.length}`);
    console.log(`  Boulders detected: ${tileRes.boulders.length}`);
    console.log(`  Mean slope: ${tileRes.meanSlopeDeg.toFixed(2)}°`);
    console.log(`  Safe %: ${tileRes.evidence.safeAreaPercentage}%`);

    // Sample first 3 craters to inspect diameters and coordinates
    if (tileRes.craters.length > 0) {
      console.log(`  Sample crater[0]: diam=${tileRes.craters[0].diameterM}m, depth=${tileRes.craters[0].depthEstM}m, center=[${tileRes.craters[0].center}]`);
    }
  }

  // 3. Examine why real tiles have ~1,100 - 1,500 craters while sample has 65
  console.log('\n--- 3. COMPARISON & ANALYSIS ---');
  const avgTileCraters = tileCounts.reduce((a, b) => a + b, 0) / tileCounts.length;
  console.log(`Sample image crater count: 65`);
  console.log(`Average crater count across tested real tiles: ${avgTileCraters.toFixed(1)}`);
  console.log(`Ratio (Real Tile / Sample): ${(avgTileCraters / 65).toFixed(1)}x`);
  console.log(`Scaled across 768 tiles: ${(avgTileCraters * 768).toFixed(0)}`);
}

investigate().catch(console.error);
