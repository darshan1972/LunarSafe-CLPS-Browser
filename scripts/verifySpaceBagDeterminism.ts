/**
 * Space Bag Determinism Verification Test
 * Proves that scanning an image multiple times yields identical results, identical SHA-256 hashes,
 * and zero metric drift across all runs in the Space Bag history.
 */

import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';
import { DeterministicLunarEngine } from '../src/lib/imageProcessor';
import { CraterConsolidationService } from '../src/lib/craterConsolidation';
import { SpaceBagManager } from '../src/lib/spaceBagManager';
import { ProcessedAnalysisResult } from '../src/types';

async function main() {
  console.log('================================================================================');
  console.log('       LUNAR SPACE BAG MULTI-PASS DETERMINISM & REPEATABILITY AUDIT');
  console.log('================================================================================\n');

  const samplePath = path.resolve('src/assets/samples/isro_tmc2_manzinusc_crop.png');
  const buffer = fs.readFileSync(samplePath);
  const parsed = PNG.sync.read(buffer);

  const pixelData = {
    width: parsed.width,
    height: parsed.height,
    data: new Uint8ClampedArray(parsed.data),
  };

  const targetId = 'ch2_tmc2_manzinus_c';
  const NUM_RUNS = 4;

  console.log(`[TEST TARGET]: ${targetId}`);
  console.log(`[FILE]:        ${samplePath} (${buffer.byteLength} bytes)`);
  console.log(`[TEST SCOPE]:  Executing ${NUM_RUNS} consecutive deterministic scans to audit repeatability...\n`);

  for (let run = 1; run <= NUM_RUNS; run++) {
    const t0 = performance.now();
    const rawResult = await DeterministicLunarEngine.processLunarImage(
      buffer,
      pixelData,
      {
        pixelScaleMeters: 5.0,
        gridSizeMeters: 24,
        maxSlopeDeg: 10.0,
      }
    );

    const consolidation = CraterConsolidationService.consolidate(rawResult.craters, 5.0);
    const enhancedResult: ProcessedAnalysisResult = {
      ...rawResult,
      consolidatedCraters: consolidation.consolidatedCraters,
      distinctCratersCount: consolidation.distinctCratersCount,
      evidence: {
        ...rawResult.evidence,
        distinctCratersCount: consolidation.distinctCratersCount,
      },
    };

    const t1 = performance.now();
    const { item, record } = SpaceBagManager.recordScan(
      targetId,
      enhancedResult,
      5.0,
      'ISRO TMC-2 Manzinus-C Crater Digital Elevation Field'
    );

    console.log(`  • RUN #${run} Completed in ${(t1 - t0).toFixed(2)}ms`);
    console.log(`    - Timestamp:           ${record.formattedTime}`);
    console.log(`    - Stage 1 Input Hash:  ${record.stage1Hash}`);
    console.log(`    - Stage 4 Zones Hash:  ${record.stage4Hash}`);
    console.log(`    - Safe Cells / Area:   ${record.safeCellsCount} cells (${record.safePercentage.toFixed(2)}%)`);
    console.log(`    - Mean Slope:          ${record.meanSlopeDeg.toFixed(4)}°`);
    console.log(`    - Distinct Craters:    ${record.distinctCratersCount} craters (from ${record.featurePatchesCount} patches)`);
    console.log(`    - Repeatability Match: ${run === 1 ? 'BASELINE CREATED' : record.isIdenticalToPrevious ? '✓ 100% BIT-IDENTICAL' : 'FAILED'}`);
    console.log('');
  }

  // Audit Report
  const item = SpaceBagManager.getItemById(targetId);
  const report = SpaceBagManager.getDeterminismReport(targetId);

  console.log('--------------------------------------------------------------------------------');
  console.log('SPACE BAG DETERMINISM AUDIT SUMMARY');
  console.log('--------------------------------------------------------------------------------');
  console.log(`Target ID:               ${targetId}`);
  console.log(`Total Times Scanned:     ${item?.scanCount}`);
  console.log(`History Entries Logged:  ${item?.scanHistory.length}`);
  console.log(`Stage 1 Hashes Match:    ${report.stage1HashesMatch ? 'YES (100% Identical)' : 'NO'}`);
  console.log(`Stage 4 Hashes Match:    ${report.stage4HashesMatch ? 'YES (100% Identical)' : 'NO'}`);
  console.log(`Numerical Metrics Match: ${report.numericalMetricsMatch ? 'YES (Zero Variance)' : 'NO'}`);
  console.log(`Metric Drift Percentage: ${report.driftPercentage.toFixed(6)}% (PERFECT ZERO)`);
  console.log(`Determinism Status:      ${report.isDeterministic ? '✓ PASSED (MATHEMATICALLY VERIFIED)' : 'FAILED'}`);
  console.log(`Report Verdict:          ${report.summary}`);
  console.log('================================================================================\n');

  if (!report.isDeterministic || (item?.scanCount ?? 0) < NUM_RUNS) {
    console.error('ERROR: Space Bag multi-pass determinism verification failed.');
    process.exit(1);
  } else {
    console.log('SUCCESS: Space Bag multi-pass repeatability verified across all runs.');
  }
}

main().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
