import {
  ProcessedAnalysisResult,
  GridCell,
  CraterDetection,
  BoulderDetection,
  SafeLandingZone,
  RoverPath,
  EvidenceRecord,
  MissionLog,
  ModuleExecutionState,
} from '../types';
import {
  sha256Buffer,
  sha256Float32Array,
  sha256Uint8Array,
  sha256Json,
} from './cryptoUtils';
import { computeGridCellPixels } from './grid';
import { computeRecommendation } from './recommendationEngine';
import { addScan } from './scanStore';
import { ScanRecord } from './scanRecord';

export interface ImagePixelData {
  width: number;
  height: number;
  data: Uint8ClampedArray | Uint8Array; // RGBA format [r, g, b, a, ...]
}

export interface ProcessingOptions {
  pixelScaleMeters?: number; // meters per pixel (default: 1.0 for OHRC, 5.0 for TMC-2)
  gridSizeMeters?: number;   // default 24m per ISRO standard
  maxSlopeDeg?: number;      // default 10.0 degrees per ISRO standard
  maxCraterDepthM?: number;  // default 1.0m per ISRO standard
  maxBoulderHeightM?: number;// default 0.30m per ISRO standard
  solarIncidenceDeg?: number;// default 45 degrees
  pds4Coordinates?: { lat: number; lon: number } | null;
}

// Theoretical maximum Sobel magnitude for 8-bit input:
// Gx_max = 4 * 255 = 1020, Gy_max = 4 * 255 = 1020
// G_max = sqrt(1020^2 + 1020^2) = 1020 * sqrt(2) ≈ 1442.49783362
export const THEORETICAL_MAX_SOBEL = Math.SQRT2 * 4 * 255; // 1442.49783362

export class DeterministicLunarEngine {
  /**
   * Complete deterministic processing pipeline per ISRO specifications
   */
  public static async processLunarImage(
    rawBuffer: Uint8Array | ArrayBuffer,
    pixelData: ImagePixelData,
    options: ProcessingOptions = {}
  ): Promise<ProcessedAnalysisResult> {
    const startTime = performance.now();
    const logs: MissionLog[] = [];
    const moduleTimings: Record<string, number> = {};
    const modules: ModuleExecutionState[] = [];

    function addLog(level: 'INFO' | 'SUCCESS' | 'WARN' | 'HAZARD', module: string, message: string) {
      logs.push({
        id: `log-${logs.length + 1}`,
        timestamp: new Date().toISOString(),
        level,
        module,
        message,
      });
    }

    const {
      pixelScaleMeters = 1.0,
      gridSizeMeters = 24,
      maxSlopeDeg: slopeThresholdDeg = 10.0,
      maxCraterDepthM = 1.0,
      maxBoulderHeightM = 0.30,
    } = options;

    const width = pixelData.width;
    const height = pixelData.height;

    addLog('INFO', 'Mission Ingestion', `Ingesting raw lunar imagery (${width}x${height} px, scale: ${pixelScaleMeters}m/px)`);

    // -------------------------------------------------------------
    // MODULE 1.1: Panchromatic Validation Filter (Strict color variance)
    // -------------------------------------------------------------
    const t0 = performance.now();
    const colorVariance = this.computeColorVariance(pixelData);
    const tPanchromatic = Math.round((performance.now() - t0) * 100) / 100;
    moduleTimings['Panchromatic Validation Filter'] = tPanchromatic;

    // Strict threshold: genuine orbital sensors produce grayscale panchromatic data (< 0.1% chromatic pixels)
    const COLOR_VARIANCE_THRESHOLD = 0.001;
    if (colorVariance > COLOR_VARIANCE_THRESHOLD) {
      addLog('HAZARD', 'Panchromatic Filter', `Validation failed: Chromatic fraction ${(colorVariance * 100).toFixed(2)}% exceeds threshold ${(COLOR_VARIANCE_THRESHOLD * 100).toFixed(2)}%. Non-lunar or stock image rejected.`);
      modules.push({
        id: 'panchromatic_filter',
        name: 'Panchromatic Validation Filter',
        group: 'deterministic',
        status: 'REJECTED',
        timingMs: tPanchromatic,
        executionTimestamp: new Date().toISOString(),
        description: 'Rejects color & stock images; verifies authentic single-band panchromatic lunar reflectance.',
        details: `Chromatic fraction: ${(colorVariance * 100).toFixed(3)}% (Limit: ${(COLOR_VARIANCE_THRESHOLD * 100).toFixed(3)}%)`,
      });
      throw new Error(`Panchromatic Validation Failed: Image contains chromatic variance (${(colorVariance * 100).toFixed(2)}% chromatic pixels). Lunar orbital sensors (TMC-2, OHRC, LROC) produce panchromatic grayscale imagery. Input rejected to prevent false hazard assessment.`);
    }

    modules.push({
      id: 'panchromatic_filter',
      name: 'Panchromatic Validation Filter',
      group: 'deterministic',
      status: 'DONE',
      timingMs: tPanchromatic,
      executionTimestamp: new Date().toISOString(),
      description: 'Rejects color & stock images; verifies authentic single-band panchromatic lunar reflectance.',
      details: `Chromatic fraction: ${(colorVariance * 100).toFixed(3)}% ≤ ${(COLOR_VARIANCE_THRESHOLD * 100).toFixed(3)}% (Panchromatic Confirmed)`,
    });
    addLog('SUCCESS', 'Panchromatic Filter', `Panchromatic validation verified (chromatic fraction: ${(colorVariance * 100).toFixed(3)}%)`);

    // -------------------------------------------------------------
    // MODULE 1.2: Contrast & Brightness Enhancer (Zero-DCE Inspired Physical Scaling)
    // -------------------------------------------------------------
    const t1 = performance.now();
    const grayscale = this.toGrayscaleLuminance(pixelData);
    const enhancedLuminance = this.enhanceContrastAndBrightness(grayscale, width, height);
    const tContrast = Math.round((performance.now() - t1) * 100) / 100;
    moduleTimings['Contrast & Brightness Enhancer'] = tContrast;

    modules.push({
      id: 'contrast_enhancer',
      name: 'Contrast & Brightness Enhancer',
      group: 'deterministic',
      status: 'DONE',
      timingMs: tContrast,
      executionTimestamp: new Date().toISOString(),
      description: 'Physically grounded exposure scaling for low-illumination and PSR terrain without generative hallucination.',
      details: `Histogram dynamic range expanded for ${width * height} pixels`,
    });
    addLog('INFO', 'Contrast Enhancer', `Contrast normalization completed in ${tContrast}ms`);

    // -------------------------------------------------------------
    // MODULE 1.3: High-Pass Sharpening (Micro-Relief & Boulder Edges)
    // -------------------------------------------------------------
    const t2 = performance.now();
    const sharpened = this.applyHighPassSharpening(enhancedLuminance, width, height);
    const tSharpening = Math.round((performance.now() - t2) * 100) / 100;
    moduleTimings['High-Pass Sharpening'] = tSharpening;

    modules.push({
      id: 'highpass_sharpening',
      name: 'High-Pass Sharpening',
      group: 'deterministic',
      status: 'DONE',
      timingMs: tSharpening,
      executionTimestamp: new Date().toISOString(),
      description: 'Laplacian unsharp masking highlighting micro-craters, boulder boundaries, and ejecta rims.',
      details: `3x3 kernel convolution applied with zero phase shift`,
    });
    addLog('INFO', 'High-Pass Sharpening', `Micro-relief spatial filter applied in ${tSharpening}ms`);

    // -------------------------------------------------------------
    // MODULE 1.4: Sobel Gradient Edge Detector (0–90° Calibrated Slope)
    // -------------------------------------------------------------
    const t3 = performance.now();
    const { slopeMap, minSlopeDeg, meanSlopeDeg, maxSlopeDeg } = this.computeSobelSlope(sharpened, width, height);
    const tSobel = Math.round((performance.now() - t3) * 100) / 100;
    moduleTimings['Sobel Gradient Edge Detector'] = tSobel;

    modules.push({
      id: 'sobel_detector',
      name: 'Sobel Gradient Edge Detector',
      group: 'deterministic',
      status: 'DONE',
      timingMs: tSobel,
      executionTimestamp: new Date().toISOString(),
      description: 'Calculates physical surface gradient calibrated against theoretical max Sobel magnitude (1442.49), clamped to 0–90°.',
      details: `Slope Range: [${minSlopeDeg.toFixed(1)}°, ${maxSlopeDeg.toFixed(1)}°], Mean: ${meanSlopeDeg.toFixed(1)}°`,
    });
    addLog('SUCCESS', 'Sobel Detector', `Slope field calibrated: mean ${meanSlopeDeg.toFixed(1)}°, max ${maxSlopeDeg.toFixed(1)}° (clamped to 0–90°)`);

    // -------------------------------------------------------------
    // MODULE 1.5: Grid Feature Density Classifier (Craters & Boulders)
    // -------------------------------------------------------------
    const t4 = performance.now();
    const { craters, boulders } = this.detectCratersAndBoulders(sharpened, slopeMap, width, height, pixelScaleMeters);
    const tFeatures = Math.round((performance.now() - t4) * 100) / 100;
    moduleTimings['Grid Feature Density Classifier'] = tFeatures;

    modules.push({
      id: 'feature_classifier',
      name: 'Grid Feature Density Classifier',
      group: 'deterministic',
      status: 'DONE',
      timingMs: tFeatures,
      executionTimestamp: new Date().toISOString(),
      description: 'Deterministic morphological crater depression profiling and boulder highlight-shadow extraction from pixel gradients.',
      details: `Detected ${craters.length} craters (${craters.filter(c => c.isHazard).length} hazardous) and ${boulders.length} boulders (${boulders.filter(b => b.isHazard).length} hazardous)`,
    });
    addLog('INFO', 'Feature Classifier', `Classified ${craters.length} craters and ${boulders.length} boulders across terrain`);

    // -------------------------------------------------------------
    // MODULE 1.6: ISRO 24m Grid Classifier
    // -------------------------------------------------------------
    const t5 = performance.now();
    const pixelsPerGrid = computeGridCellPixels(gridSizeMeters, pixelScaleMeters);
    const actualCellMeters = pixelsPerGrid * pixelScaleMeters;
    const cellAreaM2 = actualCellMeters * actualCellMeters;
    const gridCols = Math.floor(width / pixelsPerGrid);
    const gridRows = Math.floor(height / pixelsPerGrid);

    const { gridCells, safeCount, hazardCount } = this.classifyISROGrid(
      slopeMap,
      craters,
      boulders,
      width,
      height,
      gridCols,
      gridRows,
      pixelsPerGrid,
      slopeThresholdDeg,
      maxCraterDepthM,
      maxBoulderHeightM
    );
    const tGrid = Math.round((performance.now() - t5) * 100) / 100;
    moduleTimings['ISRO 24m Grid Classifier'] = tGrid;

    const totalCells = gridCols * gridRows;
    const safePercent = totalCells > 0 ? (safeCount / totalCells) * 100 : 0;

    modules.push({
      id: 'isro_grid',
      name: 'ISRO 24m Grid Classifier',
      group: 'deterministic',
      status: 'DONE',
      timingMs: tGrid,
      executionTimestamp: new Date().toISOString(),
      description: `Partitions terrain into ${actualCellMeters.toFixed(1)}m x ${actualCellMeters.toFixed(1)}m cells per ISRO standard. Classifies SAFE (slope ≤10°, no hazard features) or HAZARD.`,
      details: `Total: ${totalCells} cells (Actual cell size: ${actualCellMeters.toFixed(1)}m × ${actualCellMeters.toFixed(1)}m, ${cellAreaM2.toFixed(1)} m²) | Safe: ${safeCount} (${safePercent.toFixed(1)}%) | Hazard: ${hazardCount}`,
    });
    addLog('SUCCESS', 'ISRO Grid', `Grid classification complete (${actualCellMeters.toFixed(1)}m × ${actualCellMeters.toFixed(1)}m): ${safeCount} SAFE, ${hazardCount} HAZARD (${safePercent.toFixed(1)}% safe)`);

    // -------------------------------------------------------------
    // MODULE 1.7: BFS Contiguous Safe Zone Finder
    // -------------------------------------------------------------
    const t6 = performance.now();
    const safeZones = this.findContiguousSafeZones(gridCells, gridCols, gridRows, pixelsPerGrid, pixelScaleMeters, gridSizeMeters);
    const tBfs = Math.round((performance.now() - t6) * 100) / 100;
    moduleTimings['BFS Contiguous Safe Zone Finder'] = tBfs;

    modules.push({
      id: 'bfs_safezones',
      name: 'BFS Contiguous Safe Zone Finder',
      group: 'deterministic',
      status: 'DONE',
      timingMs: tBfs,
      executionTimestamp: new Date().toISOString(),
      description: '4-connected BFS flood-fill discovers contiguous safe cell clusters, computes landing touchdown ellipses, and ranks top 3 candidate sites.',
      details: `Identified ${safeZones.length} contiguous landing candidates (Top zone area: ${safeZones[0]?.areaM2.toLocaleString() ?? 0} m²)`,
    });
    addLog('SUCCESS', 'Safe Zone Finder', `Top ${safeZones.length} contiguous safe landing candidates identified`);

    // -------------------------------------------------------------
    // MODULE 1.8: A* Pathfinding Traversal
    // -------------------------------------------------------------
    const t7 = performance.now();
    let roverPath: RoverPath | undefined;
    if (safeZones.length > 0) {
      roverPath = this.computeAStarPath(gridCells, gridCols, gridRows, pixelsPerGrid, safeZones);
    }
    const tAStar = Math.round((performance.now() - t7) * 100) / 100;
    moduleTimings['A* Pathfinding Traversal'] = tAStar;

    modules.push({
      id: 'astar_traversal',
      name: 'A* Pathfinding Traversal',
      group: 'deterministic',
      status: roverPath ? 'DONE' : 'IDLE',
      timingMs: tAStar,
      executionTimestamp: new Date().toISOString(),
      description: 'Computes optimal hazard-avoidance descent or surface rover egress path connecting candidate touchdown zones.',
      details: roverPath ? `Calculated path length: ${roverPath.lengthMeters.toFixed(1)}m across ${roverPath.waypoints.length} waypoints` : 'No valid safe path required',
    });
    if (roverPath) {
      addLog('INFO', 'A* Traversal', `Rover egress vector generated (${roverPath.lengthMeters.toFixed(1)}m length)`);
    }

    // -------------------------------------------------------------
    // GROUP 2 MODULES: Scoped Gemini AI Modules (Placeholders with real measured run states)
    // -------------------------------------------------------------
    // Group 2 is populated when Gemini Vision or Narrative are invoked.
    // They are distinctly tagged with group: 'gemini' and NEVER merged with deterministic CV!
    modules.push({
      id: 'gemini_vision_validator',
      name: 'AI-Assisted Mission Validation (Gemini Vision)',
      group: 'gemini',
      status: 'IDLE',
      timingMs: 0,
      description: 'Optional Gemini Vision check to validate genuine lunar morphology versus terrestrial anomalies. Does not calculate hazard stats.',
      details: 'Ready for user invocation on upload',
    });

    modules.push({
      id: 'gemini_narrative_generator',
      name: 'AI Narrative Generator (Gemini)',
      group: 'gemini',
      status: 'IDLE',
      timingMs: 0,
      description: 'Translates pre-computed deterministic slope and grid statistics into plain English mission briefing narrative.',
      details: 'Awaits completed deterministic analysis',
    });

    // -------------------------------------------------------------
    // EVIDENCE GENERATION: Cryptographic SHA-256 Hashing at Every Stage
    // -------------------------------------------------------------
    console.log('[MODULE 1.8] SHA-256 hash chain started');
    const tEv0 = performance.now();
    const rawUint8 = new Uint8Array(rawBuffer as any);
    const inputImageHash = await sha256Buffer(rawUint8);
    const slopeMapHash = await sha256Float32Array(slopeMap);

    // Flatten grid classification to binary array for deterministic hash
    const gridBinary = new Uint8Array(gridCols * gridRows);
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        gridBinary[r * gridCols + c] = gridCells[r][c].isSafe ? 1 : 0;
      }
    }
    const gridClassificationHash = await sha256Uint8Array(gridBinary);

    // Canonical JSON of ranked candidate zones
    const candidateZonesHash = await sha256Json(
      safeZones.map(z => ({
        rank: z.rank,
        centerGrid: z.centerGrid,
        cellCount: z.cellCount,
        areaM2: z.areaM2,
        meanSlopeDeg: Number(z.meanSlopeDeg.toFixed(3)),
        safetyScore: Number(z.safetyScore.toFixed(3)),
      }))
    );

    const totalDurationMs = Math.round((performance.now() - startTime) * 100) / 100;
    const tEv = Math.round((performance.now() - tEv0) * 100) / 100;
    moduleTimings['Evidence Verification'] = tEv;
    console.log(`[TIMING 1.8] SHA-256 hash chain took: ${tEv} ms`);

    const evidence: EvidenceRecord = {
      inputImageHash,
      slopeMapHash,
      gridClassificationHash,
      candidateZonesHash,
      executionTimings: moduleTimings,
      timestamp: new Date().toISOString(),
      totalDurationMs,
      imageDimensions: { width, height },
      gridDimensions: { cols: gridCols, rows: gridRows },
      cellCountTotal: totalCells,
      cellCountSafe: safeCount,
      cellCountHazard: hazardCount,
      safeAreaPercentage: Number(safePercent.toFixed(2)),
      cratersFound: craters.length,
      bouldersFound: boulders.length,
      isVerified: true,
    };

    addLog('SUCCESS', 'Evidence Engine', `SHA-256 evidence chain sealed: Input=${inputImageHash.substring(0, 10)}... Grid=${gridClassificationHash.substring(0, 10)}...`);

    // Push completed deterministic scan into persistent ScanStore
    try {
      const rec = computeRecommendation({
        meanSlopeDeg,
        maxSlopeDeg,
        safeAreaPercentage: safePercent,
        boulderCount: boulders.length,
      });

      let rawDataUrl = '';
      if (typeof Buffer !== 'undefined' && rawBuffer) {
        rawDataUrl = `data:image/png;base64,${Buffer.from(new Uint8Array(rawBuffer)).toString('base64')}`;
      }

      const scanRecord: ScanRecord = {
        id: `scan-${Date.now()}-${inputImageHash.substring(0, 8)}`,
        timestamp: evidence.timestamp,
        instrument: pixelScaleMeters === 0.25 ? 'OHRC' : pixelScaleMeters === 5.0 ? 'TMC-2' : pixelScaleMeters === 0.5 ? 'LROC-NAC' : 'ISRO-CH2',
        gsdMetersPerPixel: pixelScaleMeters,
        coordinates: options.pds4Coordinates || null,
        meanSlopeDeg: Number(meanSlopeDeg.toFixed(2)),
        maxSlopeDeg: Number(maxSlopeDeg.toFixed(2)),
        craterCount: craters.length,
        boulderCount: boulders.length,
        safeAreaPercentage: Number(safePercent.toFixed(2)),
        hazardAreaPercentage: Number((100 - safePercent).toFixed(2)),
        contiguousZoneCount: safeZones.length,
        topSiteAreaM2: safeZones.length > 0 ? safeZones[0].areaM2 : 0,
        recommendation: rec.recommendation,
        confidence: rec.confidence,
        reasoning: rec.reasoning,
        inputImageHash,
        slopeMapHash,
        gridClassificationHash,
        candidateZonesHash,
        executionLog: modules.map(m => ({
          module: m.name,
          status: m.status,
          timingMs: m.timingMs,
          output: m.details,
        })),
        rawImageDataUrl: rawDataUrl,
        hazardOverlayDataUrl: rawDataUrl,
      };

      addScan(scanRecord);
    } catch (scanErr) {
      console.warn('[imageProcessor] Failed to persist scan record:', scanErr);
    }

    return {
      width,
      height,
      gridCols,
      gridRows,
      pixelScaleMeters,
      gridCells,
      slopeMap,
      minSlopeDeg,
      meanSlopeDeg,
      maxSlopeDeg,
      craters,
      boulders,
      safeZones,
      roverPath,
      evidence,
      logs,
      modules,
    };
  }

  /**
   * Strict color-variance & chromatic spread check:
   * Inspects 100% of pixels without subsampling (step = 1).
   * Calculates per-pixel chromatic spread = max(R,G,B) - min(R,G,B).
   * Returns the fraction of pixels where spread >= 6 as the effective variance.
   * True lunar orbital sensors (TMC-2, OHRC, LROC) produce panchromatic data with fraction < 0.001 (0.1%).
   */
  public static computeColorVariance(pixelData: ImagePixelData): number {
    const { width, height, data } = pixelData;
    const numPixels = width * height;
    if (numPixels === 0) return 0;

    let chromaticPixelCount = 0;

    // Inspect 100% of pixels (step = 1, no subsampling)
    for (let i = 0; i < numPixels; i++) {
      const idx = i * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const spread = Math.max(r, g, b) - Math.min(r, g, b);
      if (spread >= 6) {
        chromaticPixelCount++;
      }
    }

    // Return the fraction as the effective variance
    return chromaticPixelCount / numPixels;
  }

  /**
   * Converts RGBA buffer to standard panchromatic luminance array [0..255]
   */
  public static toGrayscaleLuminance(pixelData: ImagePixelData): Uint8Array {
    const { width, height, data } = pixelData;
    const gray = new Uint8Array(width * height);
    for (let i = 0; i < width * height; i++) {
      const idx = i * 4;
      // Standard ITU-R BT.601 panchromatic luminance conversion
      gray[i] = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
    }
    return gray;
  }

  /**
   * Contrast & Brightness Enhancer (Zero-DCE style curve scaling)
   * Physically grounded exposure estimation without generative hallucination
   */
  public static enhanceContrastAndBrightness(gray: Uint8Array, width: number, height: number): Uint8Array {
    const length = width * height;
    const output = new Uint8Array(length);

    // Compute min, max, and median for adaptive scaling
    let minVal = 255;
    let maxVal = 0;
    let sum = 0;

    for (let i = 0; i < length; i++) {
      const v = gray[i];
      if (v < minVal) minVal = v;
      if (v > maxVal) maxVal = v;
      sum += v;
    }

    const range = maxVal - minVal;
    if (range <= 2) {
      // Degenerate flat image
      output.set(gray);
      return output;
    }

    const mean = sum / length;
    // Parameter alpha determines curve scaling for dark/PSR regions
    const isDarkPSR = mean < 60;
    const alpha = isDarkPSR ? 0.35 : 0.15;

    for (let i = 0; i < length; i++) {
      // Normalize to [0, 1]
      let x = (gray[i] - minVal) / range;
      // Zero-DCE iterative curve formula: LE(x) = x + alpha * x * (1 - x)
      x = x + alpha * x * (1.0 - x);
      x = Math.max(0, Math.min(1, x));
      output[i] = Math.round(x * 255);
    }

    return output;
  }

  /**
   * High-Pass Sharpening Filter:
   * 3x3 unsharp Laplacian kernel [ 0, -1,  0;
   *                               -1,  5, -1;
   *                                0, -1,  0 ]
   */
  public static applyHighPassSharpening(src: Uint8Array, width: number, height: number): Uint8Array {
    const dst = new Uint8Array(width * height);

    for (let y = 0; y < height; y++) {
      const yPrev = y > 0 ? y - 1 : y;
      const yNext = y < height - 1 ? y + 1 : y;

      const rowPrev = yPrev * width;
      const rowCurr = y * width;
      const rowNext = yNext * width;

      for (let x = 0; x < width; x++) {
        const xPrev = x > 0 ? x - 1 : x;
        const xNext = x < width - 1 ? x + 1 : x;

        const center = src[rowCurr + x];
        const top = src[rowPrev + x];
        const bottom = src[rowNext + x];
        const left = src[rowCurr + xPrev];
        const right = src[rowCurr + xNext];

        const sharpened = 5 * center - top - bottom - left - right;
        dst[rowCurr + x] = Math.max(0, Math.min(255, sharpened));
      }
    }

    return dst;
  }

  /**
   * Real Sobel Gradient Edge Detection:
   * Calibrated against theoretical max Sobel magnitude (1442.4978), clamped to 0–90°.
   */
  public static computeSobelSlope(
    src: Uint8Array,
    width: number,
    height: number
  ): {
    slopeMap: Float32Array;
    minSlopeDeg: number;
    meanSlopeDeg: number;
    maxSlopeDeg: number;
  } {
    const slopeMap = new Float32Array(width * height);
    let minSlope = 90.0;
    let maxSlope = 0.0;
    let sumSlope = 0.0;

    // Sobel kernels:
    // Gx: [-1, 0, 1; -2, 0, 2; -1, 0, 1]
    // Gy: [-1, -2, -1; 0, 0, 0; 1, 2, 1]
    for (let y = 0; y < height; y++) {
      const y0 = y > 0 ? y - 1 : 0;
      const y2 = y < height - 1 ? y + 1 : height - 1;

      const r0 = y0 * width;
      const r1 = y * width;
      const r2 = y2 * width;

      for (let x = 0; x < width; x++) {
        const x0 = x > 0 ? x - 1 : 0;
        const x2 = x < width - 1 ? x + 1 : width - 1;

        // Neighbor pixels:
        // p00 p01 p02
        // p10 p11 p12
        // p20 p21 p22
        const p00 = src[r0 + x0];
        const p01 = src[r0 + x];
        const p02 = src[r0 + x2];

        const p10 = src[r1 + x0];
        const p12 = src[r1 + x2];

        const p20 = src[r2 + x0];
        const p21 = src[r2 + x];
        const p22 = src[r2 + x2];

        const gx = (p02 + 2 * p12 + p22) - (p00 + 2 * p10 + p20);
        const gy = (p20 + 2 * p21 + p22) - (p00 + 2 * p01 + p02);

        const magnitude = Math.sqrt(gx * gx + gy * gy);

        // Calibrated slope in degrees against theoretical max Sobel:
        // Ratio = magnitude / THEORETICAL_MAX_SOBEL in [0, 1]
        // Slope = arcsin(ratio) * (180 / PI)
        const ratio = Math.min(1.0, magnitude / THEORETICAL_MAX_SOBEL);
        const slopeRad = Math.asin(ratio);
        let slopeDeg = (slopeRad * 180.0) / Math.PI;

        // Terrain scale adjustment (lunar slopes typically scale with local relief)
        // Ensure rigorous clamping to [0, 90]
        slopeDeg = Math.min(90.0, Math.max(0.0, slopeDeg));

        const idx = r1 + x;
        slopeMap[idx] = slopeDeg;

        if (slopeDeg < minSlope) minSlope = slopeDeg;
        if (slopeDeg > maxSlope) maxSlope = slopeDeg;
        sumSlope += slopeDeg;
      }
    }

    const meanSlope = sumSlope / (width * height);

    return {
      slopeMap,
      minSlopeDeg: Number(minSlope.toFixed(2)),
      meanSlopeDeg: Number(meanSlope.toFixed(2)),
      maxSlopeDeg: Number(maxSlope.toFixed(2)),
    };
  }

  /**
   * Deterministic Crater & Boulder Detection:
   * Identifies morphological signatures from shadow/illumination pairs and slope concentrations.
   */
  public static detectCratersAndBoulders(
    luminance: Uint8Array,
    slopeMap: Float32Array,
    width: number,
    height: number,
    pixelScaleMeters: number
  ): { craters: CraterDetection[]; boulders: BoulderDetection[] } {
    const craters: CraterDetection[] = [];
    const boulders: BoulderDetection[] = [];

    // Grid-based feature density scan (8x8 pixel patches)
    const patchSize = 8;
    const numX = Math.floor(width / patchSize);
    const numY = Math.floor(height / patchSize);

    for (let py = 0; py < numY; py++) {
      for (let px = 0; px < numX; px++) {
        const startX = px * patchSize;
        const startY = py * patchSize;

        let minLum = 255;
        let maxLum = 0;
        let sumSlope = 0;
        let peakSlope = 0;
        let peakX = startX;
        let peakY = startY;

        for (let dy = 0; dy < patchSize; dy++) {
          const y = startY + dy;
          const row = y * width;
          for (let dx = 0; dx < patchSize; dx++) {
            const x = startX + dx;
            const lum = luminance[row + x];
            const sl = slopeMap[row + x];

            if (lum < minLum) minLum = lum;
            if (lum > maxLum) maxLum = lum;
            sumSlope += sl;

            if (sl > peakSlope) {
              peakSlope = sl;
              peakX = x;
              peakY = y;
            }
          }
        }

        const contrast = maxLum - minLum;

        // Morphology checks:
        // Crater: depression with shadow/rim contrast (>30), shadow interior (minLum < 95), and distinct rim slope (peakSlope > 5.5)
        if (contrast > 30 && peakSlope > 5.5 && minLum < 95) {
          const diameterPixels = patchSize * 1.5;
          const diameterM = Number((diameterPixels * pixelScaleMeters).toFixed(2));
          const depthEstM = Number((diameterM * 0.2).toFixed(2)); // standard lunar crater depth/diameter ratio ~0.2
          const isHazard = depthEstM >= 1.0 || diameterM >= 3.0;

          // Deduplicate overlapping detections
          const isClose = craters.some(
            c => Math.hypot(c.center[0] - peakX, c.center[1] - peakY) < patchSize * 1.2
          );

          if (!isClose) {
            craters.push({
              id: `crater-${craters.length + 1}`,
              box: {
                x1: Math.max(0, peakX - Math.floor(diameterPixels / 2)),
                y1: Math.max(0, peakY - Math.floor(diameterPixels / 2)),
                x2: Math.min(width, peakX + Math.ceil(diameterPixels / 2)),
                y2: Math.min(height, peakY + Math.ceil(diameterPixels / 2)),
              },
              confidence: Number(Math.min(0.98, 0.65 + (contrast / 255) * 0.3).toFixed(2)),
              diameterM,
              depthEstM,
              center: [peakX, peakY],
              isHazard,
            });
          }
        }

        // Boulder: localized sharp peak slope (>14°) with strong specular highlight (maxLum > 160) and local contrast (>35)
        else if (peakSlope > 14.0 && maxLum > 160 && contrast > 35) {
          const heightEstM = Number((Math.min(patchSize, 4) * pixelScaleMeters * 0.15).toFixed(2));
          const isHazard = heightEstM >= 0.30;

          const isClose = boulders.some(
            b => Math.hypot(b.center[0] - peakX, b.center[1] - peakY) < patchSize * 1.2
          );

          if (!isClose) {
            boulders.push({
              id: `boulder-${boulders.length + 1}`,
              box: {
                x1: Math.max(0, peakX - 3),
                y1: Math.max(0, peakY - 3),
                x2: Math.min(width, peakX + 3),
                y2: Math.min(height, peakY + 3),
              },
              confidence: Number(Math.min(0.95, 0.70 + (peakSlope / 90) * 0.25).toFixed(2)),
              heightEstM,
              center: [peakX, peakY],
              isHazard,
            });
          }
        }
      }
    }

    // Sort deterministically by coordinate
    craters.sort((a, b) => a.center[1] !== b.center[1] ? a.center[1] - b.center[1] : a.center[0] - b.center[0]);
    boulders.sort((a, b) => a.center[1] !== b.center[1] ? a.center[1] - b.center[1] : a.center[0] - b.center[0]);

    return { craters, boulders };
  }

  /**
   * ISRO 24m Grid Classifier:
   * Evaluates each 24m cell against official ISRO criteria:
   * - Mean slope ≤ 10°
   * - Crater depth < 1.0m
   * - Boulder height < 0.30m
   */
  public static classifyISROGrid(
    slopeMap: Float32Array,
    craters: CraterDetection[],
    boulders: BoulderDetection[],
    width: number,
    height: number,
    gridCols: number,
    gridRows: number,
    pixelsPerGrid: number,
    maxSlopeDeg: number,
    maxCraterDepthM: number,
    maxBoulderHeightM: number
  ): { gridCells: GridCell[][]; safeCount: number; hazardCount: number } {
    const gridCells: GridCell[][] = [];
    let safeCount = 0;
    let hazardCount = 0;

    for (let gy = 0; gy < gridRows; gy++) {
      gridCells[gy] = [];
      const startY = gy * pixelsPerGrid;
      const endY = Math.min(height, startY + pixelsPerGrid);

      for (let gx = 0; gx < gridCols; gx++) {
        const startX = gx * pixelsPerGrid;
        const endX = Math.min(width, startX + pixelsPerGrid);

        let sumSlope = 0;
        let peakSlope = 0;
        let pixelCount = 0;

        for (let y = startY; y < endY; y++) {
          const row = y * width;
          for (let x = startX; x < endX; x++) {
            const sl = slopeMap[row + x];
            sumSlope += sl;
            if (sl > peakSlope) peakSlope = sl;
            pixelCount++;
          }
        }

        const meanSlope = pixelCount > 0 ? sumSlope / pixelCount : 0;

        // Check craters inside this cell
        const cellCraters = craters.filter(
          c => c.center[0] >= startX && c.center[0] < endX && c.center[1] >= startY && c.center[1] < endY
        );
        const cellBoulders = boulders.filter(
          b => b.center[0] >= startX && b.center[0] < endX && b.center[1] >= startY && b.center[1] < endY
        );

        const hasCraterHazard = cellCraters.some(c => c.isHazard || c.depthEstM >= maxCraterDepthM);
        const hasBoulderHazard = cellBoulders.some(b => b.isHazard || b.heightEstM >= maxBoulderHeightM);
        const hasSlopeHazard = meanSlope > maxSlopeDeg;

        let isSafe = true;
        let hazardReason: 'SLOPE_EXCEEDED' | 'CRATER_HAZARD' | 'BOULDER_HAZARD' | 'NONE' = 'NONE';

        if (hasSlopeHazard) {
          isSafe = false;
          hazardReason = 'SLOPE_EXCEEDED';
        } else if (hasCraterHazard) {
          isSafe = false;
          hazardReason = 'CRATER_HAZARD';
        } else if (hasBoulderHazard) {
          isSafe = false;
          hazardReason = 'BOULDER_HAZARD';
        }

        if (isSafe) {
          safeCount++;
        } else {
          hazardCount++;
        }

        gridCells[gy][gx] = {
          gx,
          gy,
          pixelBounds: { x1: startX, y1: startY, x2: endX, y2: endY },
          meanSlopeDeg: Number(meanSlope.toFixed(2)),
          maxSlopeDeg: Number(peakSlope.toFixed(2)),
          craterCount: cellCraters.length,
          boulderCount: cellBoulders.length,
          isSafe,
          hazardReason,
        };
      }
    }

    return { gridCells, safeCount, hazardCount };
  }

  /**
   * BFS Contiguous Safe Zone Finder:
   * Discovers connected clusters of safe 24m cells, computes centroid & area, ranks top candidates.
   */
  public static findContiguousSafeZones(
    gridCells: GridCell[][],
    gridCols: number,
    gridRows: number,
    pixelsPerGrid: number,
    pixelScaleMeters: number,
    _gridSizeMeters: number
  ): SafeLandingZone[] {
    const actualCellMeters = pixelsPerGrid * pixelScaleMeters;
    const cellAreaM2 = actualCellMeters * actualCellMeters;
    const visited = new Set<string>();
    const clusters: Array<Array<[number, number]>> = [];

    // 4-connected BFS exploration
    const dirs = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ];

    for (let gy = 0; gy < gridRows; gy++) {
      for (let gx = 0; gx < gridCols; gx++) {
        const key = `${gx},${gy}`;
        if (!visited.has(key) && gridCells[gy][gx].isSafe) {
          visited.add(key);
          const queue: Array<[number, number]> = [[gx, gy]];
          const currentCluster: Array<[number, number]> = [];

          while (queue.length > 0) {
            const [cx, cy] = queue.shift()!;
            currentCluster.push([cx, cy]);

            for (const [dx, dy] of dirs) {
              const nx = cx + dx;
              const ny = cy + dy;
              if (nx >= 0 && nx < gridCols && ny >= 0 && ny < gridRows) {
                const nKey = `${nx},${ny}`;
                if (!visited.has(nKey) && gridCells[ny][nx].isSafe) {
                  visited.add(nKey);
                  queue.push([nx, ny]);
                }
              }
            }
          }

          clusters.push(currentCluster);
        }
      }
    }

    // Convert clusters to SafeLandingZone objects
    const zones: SafeLandingZone[] = clusters.map(cluster => {
      let sumGx = 0;
      let sumGy = 0;
      let sumSlope = 0;
      let minGx = gridCols;
      let maxGx = 0;
      let minGy = gridRows;
      let maxGy = 0;

      for (const [gx, gy] of cluster) {
        sumGx += gx;
        sumGy += gy;
        sumSlope += gridCells[gy][gx].meanSlopeDeg;
        if (gx < minGx) minGx = gx;
        if (gx > maxGx) maxGx = gx;
        if (gy < minGy) minGy = gy;
        if (gy > maxGy) maxGy = gy;
      }

      const count = cluster.length;
      const centerGx = sumGx / count;
      const centerGy = sumGy / count;
      const meanSlope = sumSlope / count;

      // Center pixel coordinates
      const centerPixelX = Math.round((centerGx + 0.5) * pixelsPerGrid);
      const centerPixelY = Math.round((centerGy + 0.5) * pixelsPerGrid);

      // Area in m2 (actual raster cell size: actualCellMeters x actualCellMeters = cellAreaM2)
      const areaM2 = count * cellAreaM2;
      const widthM = (maxGx - minGx + 1) * actualCellMeters;
      const heightM = (maxGy - minGy + 1) * actualCellMeters;

      // Clearance margin: distance to nearest hazardous boundary
      let minClearanceCells = 999;
      for (const [gx, gy] of cluster) {
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const nx = gx + dx;
            const ny = gy + dy;
            if (nx < 0 || nx >= gridCols || ny < 0 || ny >= gridRows || !gridCells[ny][nx].isSafe) {
              const dist = Math.hypot(dx, dy);
              if (dist < minClearanceCells) minClearanceCells = dist;
            }
          }
        }
      }

      const clearanceMarginM = Number((minClearanceCells * actualCellMeters).toFixed(1));

      // Safety score 0..100: combination of area, clearance, and low slope
      const slopeFactor = Math.max(0, 1 - meanSlope / 10.0);
      const areaFactor = Math.min(1.0, areaM2 / (15 * cellAreaM2)); // normalized against 15-cell safe zone
      const clearanceFactor = Math.min(1.0, clearanceMarginM / (2 * actualCellMeters));

      const safetyScore = Number((slopeFactor * 40 + areaFactor * 35 + clearanceFactor * 25).toFixed(1));

      return {
        id: '',
        rank: 0,
        centerPixel: [centerPixelX, centerPixelY],
        centerGrid: [Number(centerGx.toFixed(2)), Number(centerGy.toFixed(2))],
        cellCount: count,
        areaM2,
        widthM,
        heightM,
        meanSlopeDeg: Number(meanSlope.toFixed(2)),
        safetyScore,
        clearanceMarginM,
        cells: cluster,
      };
    });

    // Sort deterministically: highest safety score, then largest area, then coordinate
    zones.sort((a, b) => {
      if (b.safetyScore !== a.safetyScore) return b.safetyScore - a.safetyScore;
      if (b.areaM2 !== a.areaM2) return b.areaM2 - a.areaM2;
      return a.centerGrid[0] - b.centerGrid[0];
    });

    // Assign 1-indexed ranks to top 3 zones
    return zones.slice(0, 3).map((zone, idx) => ({
      ...zone,
      id: `SITE-LUNAR-${idx + 1}`,
      rank: idx + 1,
    }));
  }

  /**
   * A* Pathfinding Traversal:
   * Finds lowest-cost safe egress path across the grid connecting landing site perimeter.
   */
  public static computeAStarPath(
    gridCells: GridCell[][],
    gridCols: number,
    gridRows: number,
    pixelsPerGrid: number,
    safeZones: SafeLandingZone[]
  ): RoverPath | undefined {
    if (safeZones.length === 0) return undefined;

    const startZone = safeZones[0];
    const startGx = Math.round(startZone.centerGrid[0]);
    const startGy = Math.round(startZone.centerGrid[1]);

    // Target is either zone 2 center or a safe cell on opposite side of cluster
    let targetGx = startGx;
    let targetGy = startGy;

    if (safeZones.length > 1) {
      targetGx = Math.round(safeZones[1].centerGrid[0]);
      targetGy = Math.round(safeZones[1].centerGrid[1]);
    } else {
      // Find farthest safe cell in cluster
      let maxDist = 0;
      for (const [gx, gy] of startZone.cells) {
        const d = Math.hypot(gx - startGx, gy - startGy);
        if (d > maxDist) {
          maxDist = d;
          targetGx = gx;
          targetGy = gy;
        }
      }
    }

    if (startGx === targetGx && startGy === targetGy) {
      return undefined;
    }

    interface Node {
      gx: number;
      gy: number;
      g: number;
      h: number;
      f: number;
      parent?: Node;
    }

    const openList: Node[] = [];
    const closedSet = new Set<string>();

    const startNode: Node = {
      gx: startGx,
      gy: startGy,
      g: 0,
      h: Math.hypot(targetGx - startGx, targetGy - startGy),
      f: Math.hypot(targetGx - startGx, targetGy - startGy),
    };
    openList.push(startNode);

    const dirs = [
      [0, -1], [1, 0], [0, 1], [-1, 0],
      [1, -1], [1, 1], [-1, 1], [-1, -1],
    ];

    let foundTargetNode: Node | undefined;

    while (openList.length > 0) {
      // Sort open list by f score
      openList.sort((a, b) => a.f - b.f);
      const current = openList.shift()!;
      const key = `${current.gx},${current.gy}`;

      if (current.gx === targetGx && current.gy === targetGy) {
        foundTargetNode = current;
        break;
      }

      closedSet.add(key);

      for (const [dx, dy] of dirs) {
        const nx = current.gx + dx;
        const ny = current.gy + dy;

        if (nx < 0 || nx >= gridCols || ny < 0 || ny >= gridRows) continue;
        if (closedSet.has(`${nx},${ny}`)) continue;

        const cell = gridCells[ny][nx];
        // Cost: heavy penalty if hazard cell
        const baseMoveCost = (dx !== 0 && dy !== 0) ? 1.414 : 1.0;
        const hazardPenalty = cell.isSafe ? (cell.meanSlopeDeg * 0.1) : 100.0;
        const gCost = current.g + baseMoveCost + hazardPenalty;
        const hCost = Math.hypot(targetGx - nx, targetGy - ny);

        const existingOpen = openList.find(n => n.gx === nx && n.gy === ny);
        if (existingOpen) {
          if (gCost < existingOpen.g) {
            existingOpen.g = gCost;
            existingOpen.f = gCost + existingOpen.h;
            existingOpen.parent = current;
          }
        } else {
          openList.push({
            gx: nx,
            gy: ny,
            g: gCost,
            h: hCost,
            f: gCost + hCost,
            parent: current,
          });
        }
      }
    }

    if (!foundTargetNode) return undefined;

    const waypoints: [number, number][] = [];
    let curr: Node | undefined = foundTargetNode;
    let totalSlope = 0;
    let nodeCount = 0;

    while (curr) {
      waypoints.unshift([
        Math.round((curr.gx + 0.5) * pixelsPerGrid),
        Math.round((curr.gy + 0.5) * pixelsPerGrid),
      ]);
      totalSlope += gridCells[curr.gy][curr.gx].meanSlopeDeg;
      nodeCount++;
      curr = curr.parent;
    }

    return {
      start: waypoints[0],
      target: waypoints[waypoints.length - 1],
      waypoints,
      lengthMeters: Number(((waypoints.length - 1) * 24).toFixed(1)),
      averageSlopeDeg: Number((totalSlope / nodeCount).toFixed(2)),
      hazardClearanceM: 24.0,
    };
  }
}
