import fs from 'fs';
import path from 'path';
import { generateFullIsroReportPdf } from '../src/lib/isroFullPipeline';

async function main() {
  const metricsPath = path.resolve('scripts/exact_consolidation_metrics.json');
  if (!fs.existsSync(metricsPath)) {
    throw new Error(`Metrics file not found: ${metricsPath}`);
  }

  const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
  const resultsPath = path.resolve('src/assets/isro_data/full_analysis_results.json');
  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

  console.log('=== APPLYING CONSOLIDATION METRICS TO full_analysis_results.json ===');
  console.log('Metrics loaded:');
  console.log(`  Raw Crater Patches:   ${metrics.rawCraterPatches.toLocaleString()}`);
  console.log(`  Distinct Craters:     ${metrics.distinctCraters.toLocaleString()}`);
  console.log(`  Raw Boulder Patches:  ${metrics.rawBoulderPatches.toLocaleString()}`);
  console.log(`  Distinct Boulders:    ${metrics.distinctBoulders.toLocaleString()}`);
  console.log(`  Consolidation Ratio:  ${metrics.consolidationRatio}x`);

  // Update summary fields
  results.summary.rawCraterPatches = metrics.rawCraterPatches;
  results.summary.distinctCraters = metrics.distinctCraters;
  results.summary.rawBoulderPatches = metrics.rawBoulderPatches;
  results.summary.distinctBoulders = metrics.distinctBoulders;
  results.summary.consolidationRatio = metrics.consolidationRatio;

  // Backward compatibility fields
  results.summary.totalCratersDetected = metrics.rawCraterPatches;
  results.summary.totalHazardousCraterPatches = metrics.rawCraterPatches;
  results.summary.totalDistinctCraters = metrics.distinctCraters;
  results.summary.totalBouldersDetected = metrics.rawBoulderPatches;

  // Update per-tile metrics
  for (const tile of results.tiles) {
    const tileData = metrics.tileDistinctMap[tile.tileIndex];
    if (tileData) {
      tile.distinctCraters = tileData.distinctCraters;
      tile.distinctBoulders = tileData.distinctBoulders;
    } else {
      tile.distinctCraters = 0;
      tile.distinctBoulders = 0;
    }
  }

  // Also update safeLandingZones if any
  if (results.safeLandingZones && results.safeLandingZones.length > 0) {
    for (const zone of results.safeLandingZones) {
      // Re-sum craters & distinctCraters in zone tile span
      let zoneDistinct = 0;
      let zoneBoulders = 0;
      let zoneDistinctBoulders = 0;
      for (const t of results.tiles) {
        if (
          t.col >= zone.tileSpan.minCol &&
          t.col <= zone.tileSpan.maxCol &&
          t.row >= zone.tileSpan.minRow &&
          t.row <= zone.tileSpan.maxRow
        ) {
          zoneDistinct += t.distinctCraters;
          zoneBoulders += t.boulders;
          zoneDistinctBoulders += t.distinctBoulders;
        }
      }
      zone.totalDistinctCraters = zoneDistinct;
      zone.totalBoulders = zoneBoulders;
      (zone as any).totalDistinctBoulders = zoneDistinctBoulders;
    }
  }

  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`Updated ${resultsPath} successfully.`);

  // Re-generate publication-quality PDF report
  const pdfPath = path.resolve('LunarSafe_full_isro_analysis_report.pdf');
  console.log(`Generating updated PDF report: ${pdfPath}...`);
  generateFullIsroReportPdf(results.summary, results.safeLandingZones, pdfPath);
  console.log(`PDF report generated successfully (${fs.statSync(pdfPath).size.toLocaleString()} bytes).`);
}

main().catch(console.error);
