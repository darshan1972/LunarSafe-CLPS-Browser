import fs from 'fs';
import path from 'path';
import { fork } from 'child_process';
import os from 'os';
import { parsePds4Label } from '../src/lib/isroPds4Parser';
import { TileJob, TileJobResult } from '../src/lib/isroTileWorker';

interface StoredTileResult {
  craters: number;
  distinctCraters: number;
  boulders: number;
  distinctBoulders: number;
}

async function main() {
  console.log('=== CALCULATING EXACT POST-CONSOLIDATION DISTINCT CRATERS & BOULDERS FOR ALL 768 TILES ===');
  const t0 = Date.now();

  const xmlPath = path.resolve('src/assets/isro_data/ch2_tmc_ncn_20260823T1657513854_d_img_d18.xml');
  const imgPath = path.resolve('src/assets/isro_data/ch2_tmc_ncn_20260823T1657513854_d_img_d18.img');
  const meta = parsePds4Label(xmlPath);

  const numCols = 8;
  const numRows = 96;
  const totalTiles = 768;
  const tileSize = 512;

  const jobs: TileJob[] = [];
  let tileIndex = 0;
  for (let row = 0; row < numRows; row++) {
    const tileY = row * tileSize;
    const tileHeight = Math.min(tileSize, 49119 - tileY);
    for (let col = 0; col < numCols; col++) {
      const tileX = col * tileSize;
      const tileWidth = Math.min(tileSize, 4000 - tileX);
      jobs.push({
        tileIndex,
        col,
        row,
        tileX,
        tileY,
        tileWidth,
        tileHeight,
        isEdge: tileWidth !== tileSize || tileHeight !== tileSize,
        filePath: imgPath,
        metadata: meta,
        pixelScaleMeters: 6.4,
        gridSizeMeters: 24,
        maxSlopeDeg: 10.0,
        solarIncidenceDeg: meta.solarIncidence,
      });
      tileIndex++;
    }
  }

  // Load existing results to identify active tiles
  const existingJson = JSON.parse(fs.readFileSync('src/assets/isro_data/full_analysis_results.json', 'utf8'));
  const activeJobs = jobs.filter(j => existingJson.tiles[j.tileIndex].craters > 0 || existingJson.tiles[j.tileIndex].boulders > 0);
  console.log(`Total tiles: ${totalTiles}. Active tiles: ${activeJobs.length}. Zero-feature tiles: ${totalTiles - activeJobs.length}`);

  const checkpointPath = path.resolve('scripts/exact_consolidation_checkpoint.json');
  let allResults: Record<number, StoredTileResult> = {};
  if (fs.existsSync(checkpointPath)) {
    try {
      allResults = JSON.parse(fs.readFileSync(checkpointPath, 'utf8'));
      console.log(`Loaded checkpoint with ${Object.keys(allResults).length} already-processed tiles.`);
    } catch (e) {
      console.log('Starting fresh checkpoint.');
    }
  }

  const queue: TileJob[] = activeJobs.filter(j => allResults[j.tileIndex] === undefined);
  console.log(`Remaining active tiles to process: ${queue.length}`);

  let completedCount = Object.keys(allResults).length;
  const concurrency = 3;
  console.log(`Spawning ${concurrency} worker processes with dynamic work queue (memory-safe mode)...`);

  const workerScript = path.resolve('src/lib/isroTileWorker.ts');
  const BATCH_SIZE = 3;

  let lastCheckpointTime = Date.now();
  function saveCheckpoint() {
    fs.writeFileSync(checkpointPath, JSON.stringify(allResults, null, 2));
  }

  const workers = Array.from({ length: concurrency }, (_, workerId) => {
    return new Promise<void>((resolve, reject) => {
      const child = fork(workerScript, [], {
        execArgv: ['--import', 'tsx', '--max-old-space-size=1536'],
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      });

      function dispatchNext() {
        if (queue.length > 0) {
          const batch = queue.splice(0, BATCH_SIZE);
          child.send({ type: 'PROCESS_BATCH', jobs: batch });
        } else {
          child.send({ type: 'CLOSE' });
        }
      }

      child.on('message', (msg: { type: string; results?: TileJobResult[] }) => {
        if (msg.type === 'READY') {
          dispatchNext();
        } else if (msg.type === 'BATCH_RESULTS' && msg.results) {
          for (const r of msg.results) {
            allResults[r.tileIndex] = {
              craters: r.craters,
              distinctCraters: r.distinctCraters,
              boulders: r.boulders,
              distinctBoulders: r.distinctBoulders ?? r.boulders,
            };
            completedCount++;
          }

          if (Date.now() - lastCheckpointTime > 5000 || queue.length === 0) {
            saveCheckpoint();
            lastCheckpointTime = Date.now();
          }

          const pct = ((completedCount / activeJobs.length) * 100).toFixed(1);
          console.log(`  [PROGRESS] Worker ${workerId} done batch | Total: ${completedCount}/${activeJobs.length} (${pct}%) | Queue left: ${queue.length}`);

          dispatchNext();
        }
      });

      child.stderr?.on('data', d => process.stderr.write(d));
      child.on('exit', () => resolve());
      child.on('error', err => reject(err));

      child.send({ type: 'INIT', filePath: imgPath });
    });
  });

  await Promise.all(workers);
  saveCheckpoint();

  // Collate distinct craters & boulders for all 768 tiles
  let totalRawCraters = 0;
  let totalDistinctCraters = 0;
  let totalRawBoulders = 0;
  let totalDistinctBoulders = 0;
  const tileDistinctMap: Record<number, StoredTileResult> = {};

  for (let i = 0; i < totalTiles; i++) {
    if (allResults[i]) {
      const r = allResults[i];
      totalRawCraters += r.craters;
      totalDistinctCraters += r.distinctCraters;
      totalRawBoulders += r.boulders;
      totalDistinctBoulders += r.distinctBoulders;
      tileDistinctMap[i] = r;
    } else {
      tileDistinctMap[i] = { rawCraters: 0, distinctCraters: 0, rawBoulders: 0, distinctBoulders: 0 } as any;
    }
  }

  const consolidationRatio = Number((totalRawCraters / Math.max(1, totalDistinctCraters)).toFixed(2));

  console.log('\n============================================================');
  console.log('EXACT POST-CONSOLIDATION SWATH METRICS:');
  console.log(`Total Tiles:                      ${totalTiles}`);
  console.log(`Raw Crater Patches:               ${totalRawCraters.toLocaleString()}`);
  console.log(`Distinct Craters:                 ${totalDistinctCraters.toLocaleString()}`);
  console.log(`Raw Boulder Patches:              ${totalRawBoulders.toLocaleString()}`);
  console.log(`Distinct Boulders:                ${totalDistinctBoulders.toLocaleString()}`);
  console.log(`Crater Consolidation Ratio:       ${consolidationRatio}x`);
  console.log(`Elapsed Time:                     ${((Date.now() - t0) / 1000).toFixed(1)} seconds`);
  console.log('============================================================');

  const finalMetrics = {
    rawCraterPatches: totalRawCraters,
    distinctCraters: totalDistinctCraters,
    rawBoulderPatches: totalRawBoulders,
    distinctBoulders: totalDistinctBoulders,
    consolidationRatio,
    tileDistinctMap,
  };

  fs.writeFileSync('scripts/exact_consolidation_metrics.json', JSON.stringify(finalMetrics, null, 2));
  console.log('Saved exact metrics to scripts/exact_consolidation_metrics.json');
}

main().catch(console.error);
