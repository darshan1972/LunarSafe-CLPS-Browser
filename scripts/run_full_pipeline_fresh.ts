/**
 * LunarSafe Mission Software — Full 768-Tile ISRO Pipeline Execution
 * Team Rocket · Parul University
 *
 * Re-processes all 768 tiles of the 392 MB calibrated TMC-2 strip
 * using the fixed isroImageLoader (16-bit LE, 2-sigma contrast stretch, gamma 0.43).
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { processFullIsroImage } from '../src/lib/isroFullPipeline';

async function main() {
  const imgPath = path.resolve('src/assets/isro_data/ch2_tmc_ncn_20260823T1657513854_d_img_d18.img');
  const xmlPath = path.resolve('src/assets/isro_data/ch2_tmc_ncn_20260823T1657513854_d_img_d18.xml');

  if (!fs.existsSync(imgPath)) {
    throw new Error(`ISRO image file not found: ${imgPath}`);
  }

  console.log('================================================================================');
  console.log('      LAUNCHING FRESH 768-TILE FULL PIPELINE EXECUTION (ISRO TMC-2)             ');
  console.log('================================================================================\n');

  const t0 = performance.now();

  const result = await processFullIsroImage(imgPath, 512, {
    xmlPath,
    gridSizeMeters: 24,
    maxSlopeDeg: 10.0,
    reuseExisting: false, // FORCE FRESH EXECUTION ON ALL 768 TILES
    concurrency: 6,
  });

  const durationSec = ((performance.now() - t0) / 1000).toFixed(1);

  console.log('\n================================================================================');
  console.log('             FULL 768-TILE RUN COMPLETED SUCCESSFULLY                          ');
  console.log(`             Total Duration: ${durationSec} seconds                            `);
  console.log('================================================================================\n');

  const { summary, safeLandingZones } = result;
  const topZone = safeLandingZones[0];

  console.log('--- EVIDENCE 1: FULL-STRIP ACTUAL METRICS ---');
  console.log(`- rawCraterPatches:       ${summary.rawCraterPatches}`);
  console.log(`- distinctCraters:        ${summary.distinctCraters}`);
  console.log(`- rawBoulderPatches:      ${summary.rawBoulderPatches}`);
  console.log(`- distinctBoulders:       ${summary.distinctBoulders}`);
  console.log(`- safeAreaPercentage:     ${summary.safeAreaPercentage}%`);
  console.log(`- totalSafeAreaKm2:       ${summary.totalSafeAreaKm2} km²`);
  console.log(`- safeLandingZonesCount:  ${summary.safeLandingZonesCount}`);
  if (topZone) {
    console.log(`- Top Safe Zone:          ${topZone.name}`);
    console.log(`  Coordinates:            ${topZone.latitudeDeg.toFixed(4)}°N, ${topZone.longitudeDeg.toFixed(4)}°E`);
    console.log(`  Area:                   ${topZone.areaKm2.toFixed(2)} km² (${topZone.areaM2.toLocaleString()} m²)`);
    console.log(`  Mean Slope:             ${topZone.meanSlopeDeg.toFixed(2)}°`);
    console.log(`  Safe Rating:            ${topZone.status}`);
  }
}

main().catch(err => {
  console.error('\n[FATAL PIPELINE ERROR]:', err);
  process.exit(1);
});
