/**
 * LunarSafe Mission Software — Lunar Engine V2 (Deterministic + Uncertainty Wrapper)
 * Team Rocket · AEROX Club · Parul University · Project Head: Darshan Patil
 *
 * Wraps the frozen DeterministicLunarEngine to add propagated slope uncertainty (sigma)
 * and conservative hazard classification while maintaining 100% bit-identical hash chain integrity.
 */

import {
  DeterministicLunarEngine,
  ImagePixelData,
  ProcessingOptions,
} from './imageProcessor';
import { ProcessedAnalysisResult } from '../types';
import { computeSlopeUncertainty, LOLA_VERTICAL_SIGMA_M } from './uncertainty';
import {
  classifyHazardConservative,
  ConservativeHazardResult,
} from './hazardClassifier';

export interface AnalysisResultV2 {
  deterministicResult: ProcessedAnalysisResult;
  conservativeHazard: ConservativeHazardResult;
  meanSigmaSlopeDeg: number;
  maxSigmaSlopeDeg: number;
}

export class LunarEngineV2 {
  /**
   * Complete analysis pipeline:
   * Pass 1: Unmodified DeterministicLunarEngine (generates canonical SHA-256 hash chain)
   * Pass 2: Uncertainty propagation and conservative landing safety classification
   */
  public static async processLunarImage(
    rawBuffer: Uint8Array | ArrayBuffer,
    pixelData: ImagePixelData,
    options: ProcessingOptions = {},
    sigmaElevM: number = LOLA_VERTICAL_SIGMA_M,
    sigmaMultiplier: number = 2.0
  ): Promise<AnalysisResultV2> {
    // 1. Run unmodified deterministic pipeline (preserves hash chain)
    const deterministicResult = await DeterministicLunarEngine.processLunarImage(
      rawBuffer,
      pixelData,
      options
    );

    // 2. Compute propagated slope uncertainty
    const gsd = options.pixelScaleMeters || 1.0;
    const { meanSigmaSlopeDeg, maxSigmaSlopeDeg, perPixelSigma } = computeSlopeUncertainty(
      deterministicResult.slopeMap,
      deterministicResult.width,
      deterministicResult.height,
      gsd,
      sigmaElevM
    );

    // 3. Build crater and boulder spatial hazard masks from detections
    const totalPixels = deterministicResult.width * deterministicResult.height;
    const craterMask = new Uint8Array(totalPixels);
    const boulderMask = new Uint8Array(totalPixels);

    if (deterministicResult.craters) {
      for (const c of deterministicResult.craters) {
        if (c.isHazard && c.box) {
          const x1 = Math.max(0, Math.floor(c.box.x1));
          const y1 = Math.max(0, Math.floor(c.box.y1));
          const x2 = Math.min(deterministicResult.width - 1, Math.ceil(c.box.x2));
          const y2 = Math.min(deterministicResult.height - 1, Math.ceil(c.box.y2));
          for (let y = y1; y <= y2; y++) {
            const rowOffset = y * deterministicResult.width;
            for (let x = x1; x <= x2; x++) {
              craterMask[rowOffset + x] = 1;
            }
          }
        }
      }
    }

    if (deterministicResult.boulders) {
      for (const b of deterministicResult.boulders) {
        if (b.isHazard && b.box) {
          const x1 = Math.max(0, Math.floor(b.box.x1));
          const y1 = Math.max(0, Math.floor(b.box.y1));
          const x2 = Math.min(deterministicResult.width - 1, Math.ceil(b.box.x2));
          const y2 = Math.min(deterministicResult.height - 1, Math.ceil(b.box.y2));
          for (let y = y1; y <= y2; y++) {
            const rowOffset = y * deterministicResult.width;
            for (let x = x1; x <= x2; x++) {
              boulderMask[rowOffset + x] = 1;
            }
          }
        }
      }
    }

    // 4. Classify conservative hazards over 24m cells
    const safeSlopeThreshold = options.maxSlopeDeg || 10.0;
    const conservativeHazard = classifyHazardConservative(
      deterministicResult.slopeMap,
      perPixelSigma,
      deterministicResult.width,
      deterministicResult.height,
      gsd,
      craterMask,
      boulderMask,
      safeSlopeThreshold,
      sigmaMultiplier
    );

    return {
      deterministicResult,
      conservativeHazard,
      meanSigmaSlopeDeg,
      maxSigmaSlopeDeg,
    };
  }
}

// Wrapper function export for direct functional usage
export const analyzeImageV2 = LunarEngineV2.processLunarImage;
