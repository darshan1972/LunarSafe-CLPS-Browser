/**
 * LunarSafe Mission Software — Formal Scan Record Specification
 * Team Rocket · AEROX Club · Parul University · Project Head: Darshan Patil
 */

import { WorkflowType } from './workflowSelector';

export interface ExecutionLogEntry {
  module: string;
  status: string;
  timingMs: number;
  output?: string;
}

export interface MultiMethodAnalysisInput {
  cvCraters: number;
  cvBoulders: number;
  yoloCraters: number;
  yoloBoulders: number;
  yoloCratersList: Array<{ x1: number; y1: number; x2: number; y2: number; confidence: number; class_name: string }>;
  cvCratersList: Array<{ x1: number; y1: number; x2: number; y2: number; confidence: number; class_name: string }>;
  workflow: WorkflowType;
  hashes: {
    stage1Input: string;
    stage2Slope: string;
    stage3Grid: string;
    stage4Zones: string;
    sessionIntegrityHash?: string;
  };
}

export interface ScanRecord {
  id: string;
  timestamp: string;
  instrument: string;
  gsdMetersPerPixel: number;
  coordinates: {
    lat: number;
    lon: number;
  } | null;
  meanSlopeDeg: number;
  maxSlopeDeg: number;
  frameMaxSlopeDeg?: number;
  selectedZoneMaxSlopeDeg?: number;
  slopeUncertaintyDeg?: number;
  craterCount: number;
  hazardPatchCount?: number;
  hazardCount?: number;
  boulderCount: number;
  safeCellCount?: number;
  safeZoneCount?: number;
  safeAreaPercentage: number;
  safeAreaPercentageConservative?: number;
  hazardAreaPercentage: number;
  contiguousZoneCount: number;
  topSiteAreaM2: number;
  recommendation: 'SAFE' | 'CAUTION' | 'UNSAFE';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reasoning: string;
  inputImageHash: string;
  slopeMapHash: string;
  gridClassificationHash: string;
  candidateZonesHash: string;
  sessionIntegrityHash?: string;
  executionLog: ExecutionLogEntry[];
  rawImageDataUrl: string;
  hazardOverlayDataUrl: string;
  multiMethodInput?: MultiMethodAnalysisInput;
}

