/**
 * LunarSafe Mission Software — ISRO Tile Worker Process
 * Team Rocket · AEROX Club · Parul University · Project Head: Darshan Patil
 *
 * Child worker process for concurrent tile processing across the full 392 MB ISRO strip.
 */

import * as fs from 'fs';
import { loadIsroRawImage } from './isroImageLoader';
import { DeterministicLunarEngine } from './imageProcessor';
import { IsroMetadata } from './isroPds4Parser';
import { CraterConsolidationService } from './craterConsolidation';

export interface TileJob {
  tileIndex: number;
  col: number;
  row: number;
  tileX: number;
  tileY: number;
  tileWidth: number;
  tileHeight: number;
  isEdge: boolean;
  filePath: string;
  metadata?: IsroMetadata;
  pixelScaleMeters: number;
  gridSizeMeters: number;
  maxSlopeDeg: number;
  solarIncidenceDeg: number;
}

export interface TileJobResult {
  tileIndex: number;
  col: number;
  row: number;
  tileX: number;
  tileY: number;
  tileWidth: number;
  tileHeight: number;
  isEdge: boolean;
  safePercent: number;
  safeCells: number;
  hazardCells: number;
  totalCells: number;
  craters: number; // Hazardous Crater Patches (raw 8x8 detection patches)
  distinctCraters: number; // Distinct Crater Complexes (post-consolidation)
  boulders: number; // Raw boulder hazard patches
  distinctBoulders: number; // Distinct boulder structures (post-consolidation)
  meanSlopeDeg: number;
  maxSlopeDeg: number;
  hashes: {
    inputBuffer: string;
    slopeMap: string;
    isroGrid: string;
    candidateZones: string;
  };
  durationMs: number;
  success: boolean;
  error?: string;
}

export async function processSingleTile(job: TileJob, fd?: number): Promise<TileJobResult> {
  const t0 = performance.now();
  try {
    const tile = loadIsroRawImage(job.filePath, job.tileX, job.tileY, 512, {
      metadata: job.metadata,
      tileWidth: job.tileWidth,
      tileHeight: job.tileHeight,
      fd: fd,
    });

    const dummyBuffer = Buffer.from(tile.data.buffer);
    const engineResult = await DeterministicLunarEngine.processLunarImage(
      dummyBuffer,
      {
        width: job.tileWidth,
        height: job.tileHeight,
        data: tile.data,
      },
      {
        pixelScaleMeters: job.pixelScaleMeters,
        gridSizeMeters: job.gridSizeMeters,
        maxSlopeDeg: job.maxSlopeDeg,
        solarIncidenceDeg: job.solarIncidenceDeg,
      }
    );

    const consolidation = CraterConsolidationService.consolidate(
      engineResult.craters,
      job.pixelScaleMeters
    );
    const boulderConsolidation = CraterConsolidationService.consolidate(
      engineResult.boulders,
      job.pixelScaleMeters
    );

    const safeCells = engineResult.evidence.cellCountSafe;
    const hazardCells = engineResult.evidence.cellCountHazard;
    const totalCells = safeCells + hazardCells;
    const safePercent = totalCells > 0 ? (safeCells / totalCells) * 100 : engineResult.evidence.safeAreaPercentage;

    return {
      tileIndex: job.tileIndex,
      col: job.col,
      row: job.row,
      tileX: job.tileX,
      tileY: job.tileY,
      tileWidth: job.tileWidth,
      tileHeight: job.tileHeight,
      isEdge: job.isEdge,
      safePercent: Number(safePercent.toFixed(2)),
      safeCells,
      hazardCells,
      totalCells,
      craters: engineResult.craters.length,
      distinctCraters: consolidation.distinctCratersCount,
      boulders: engineResult.boulders.length,
      distinctBoulders: boulderConsolidation.distinctCratersCount,
      meanSlopeDeg: Number(engineResult.meanSlopeDeg.toFixed(2)),
      maxSlopeDeg: Number(engineResult.maxSlopeDeg.toFixed(2)),
      hashes: {
        inputBuffer: engineResult.evidence.inputImageHash,
        slopeMap: engineResult.evidence.slopeMapHash,
        isroGrid: engineResult.evidence.gridClassificationHash,
        candidateZones: engineResult.evidence.candidateZonesHash,
      },
      durationMs: Math.round(performance.now() - t0),
      success: true,
    };
  } catch (err: any) {
    return {
      tileIndex: job.tileIndex,
      col: job.col,
      row: job.row,
      tileX: job.tileX,
      tileY: job.tileY,
      tileWidth: job.tileWidth,
      tileHeight: job.tileHeight,
      isEdge: job.isEdge,
      safePercent: 0,
      safeCells: 0,
      hazardCells: 0,
      totalCells: 0,
      craters: 0,
      distinctCraters: 0,
      boulders: 0,
      distinctBoulders: 0,
      meanSlopeDeg: 0,
      maxSlopeDeg: 0,
      hashes: {
        inputBuffer: '0'.repeat(64),
        slopeMap: '0'.repeat(64),
        isroGrid: '0'.repeat(64),
        candidateZones: '0'.repeat(64),
      },
      durationMs: Math.round(performance.now() - t0),
      success: false,
      error: err.message,
    };
  }
}

// When executed as a child process via fork:
if (process.send) {
  let openFd: number | undefined;

  process.on('message', async (msg: { type: string; jobs?: TileJob[]; filePath?: string }) => {
    if (msg.type === 'INIT' && msg.filePath) {
      try {
        openFd = fs.openSync(msg.filePath, 'r');
      } catch (e) {
        // fd fallback to per-tile
      }
      process.send!({ type: 'READY' });
    } else if (msg.type === 'PROCESS_BATCH' && msg.jobs) {
      const results: TileJobResult[] = [];
      for (const job of msg.jobs) {
        const res = await processSingleTile(job, openFd);
        results.push(res);
      }
      process.send!({ type: 'BATCH_RESULTS', results });
    } else if (msg.type === 'CLOSE') {
      if (openFd !== undefined) {
        try {
          fs.closeSync(openFd);
        } catch (e) {}
      }
      process.exit(0);
    }
  });
}
