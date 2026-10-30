import path from 'path';
import fs from 'fs';
import { parsePds4Label } from '../src/lib/isroPds4Parser';
import { loadIsroRawImage } from '../src/lib/isroImageLoader';
import { DeterministicLunarEngine } from '../src/lib/imageProcessor';
import { CraterConsolidationService } from '../src/lib/craterConsolidation';

async function main() {
  console.log('=== INVESTIGATING CRATER COUNT ANOMALY ===');

  const xmlPath = path.resolve('src/assets/isro_data/ch2_tmc_ncn_20260823T1657513854_d_img_d18.xml');
  const imgPath = path.resolve('src/assets/isro_data/ch2_tmc_ncn_20260823T1657513854_d_img_d18.img');
  const meta = parsePds4Label(xmlPath);

  // 1. Single tile test at sample location (startX=1500, startY=20000)
  console.log('\n--- SINGLE TILE EVALUATION (startX=1500, startY=20000, 512x512) ---');
  const tile1 = loadIsroRawImage(imgPath, 1500, 20000, 512, { metadata: meta });
  const buf1 = Buffer.from(tile1.data.buffer);
  const res1 = await DeterministicLunarEngine.processLunarImage(
    buf1,
    { width: 512, height: 512, data: tile1.data },
    { pixelScaleMeters: 6.4, gridSizeMeters: 24, maxSlopeDeg: 10.0, solarIncidenceDeg: meta.solarIncidence }
  );

  console.log(`Tile 1 craters.length: ${res1.craters.length}`);
  console.log(`Tile 1 boulders.length: ${res1.boulders.length}`);
  console.log(`Tile 1 meanSlope: ${res1.meanSlopeDeg.toFixed(2)}°`);
  console.log(`Tile 1 safePercent: ${res1.evidence.safeAreaPercentage.toFixed(2)}%`);

  // Run consolidation on Tile 1
  const cons1 = CraterConsolidationService.consolidate(res1.craters, 6.4);
  console.log(`Tile 1 consolidated distinct craters: ${cons1.distinctCratersCount}`);
  console.log(`Tile 1 raw patch count: ${cons1.rawPatchCount}`);
  console.log(`Ratio raw/distinct: ${(cons1.rawPatchCount / (cons1.distinctCratersCount || 1)).toFixed(2)}x`);

  // 2. Evaluate several diverse tiles across the swath
  const testCoords = [
    { x: 0, y: 0, desc: 'Northern pole edge (col 0, row 0)' },
    { x: 1000, y: 10000, desc: 'Upper polar swath (col 1, row 19)' },
    { x: 2000, y: 25000, desc: 'Mid swath (col 3, row 48)' },
    { x: 3000, y: 40000, desc: 'Lower swath (col 5, row 78)' },
  ];

  let rawCounts: number[] = [];
  let distinctCounts: number[] = [];

  for (const c of testCoords) {
    const t = loadIsroRawImage(imgPath, c.x, c.y, 512, { metadata: meta });
    const b = Buffer.from(t.data.buffer);
    const r = await DeterministicLunarEngine.processLunarImage(
      b,
      { width: 512, height: 512, data: t.data },
      { pixelScaleMeters: 6.4, gridSizeMeters: 24, maxSlopeDeg: 10.0, solarIncidenceDeg: meta.solarIncidence }
    );
    const cons = CraterConsolidationService.consolidate(r.craters, 6.4);
    rawCounts.push(r.craters.length);
    distinctCounts.push(cons.distinctCratersCount);
    console.log(`\nTile at (${c.x}, ${c.y}) [${c.desc}]:`);
    console.log(`  Raw patches: ${r.craters.length}`);
    console.log(`  Distinct craters (consolidated): ${cons.distinctCratersCount}`);
    console.log(`  Mean slope: ${r.meanSlopeDeg.toFixed(2)}°`);
  }

  // 3. Compare with full_analysis_results.json
  const fullJson = JSON.parse(fs.readFileSync('src/assets/isro_data/full_analysis_results.json', 'utf8'));
  console.log('\n--- FULL ANALYSIS SWATH STATS (768 TILES) ---');
  console.log(`Total reported craters in JSON: ${fullJson.summary.totalCratersDetected}`);
  console.log(`Total reported boulders in JSON: ${fullJson.summary.totalBouldersDetected}`);
  const avgRawPerTile = fullJson.summary.totalCratersDetected / fullJson.tiles.length;
  console.log(`Average raw patches per tile: ${avgRawPerTile.toFixed(2)}`);
  console.log(`Scaled across 768 tiles: ${(avgRawPerTile * 768).toFixed(0)}`);

  const avgDistinctEstimated = distinctCounts.reduce((a, b) => a + b, 0) / distinctCounts.length;
  console.log(`Average distinct craters per sample tile: ${avgDistinctEstimated.toFixed(2)}`);
  console.log(`Estimated true distinct craters across 768 tiles: ${(avgDistinctEstimated * 768).toFixed(0)}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
