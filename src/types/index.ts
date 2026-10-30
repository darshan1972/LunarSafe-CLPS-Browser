export type ModuleGroup = 'deterministic' | 'gemini';
export type ModuleStatus = 'IDLE' | 'ACTIVE' | 'DONE' | 'REJECTED' | 'ERROR';

export interface ModuleExecutionState {
  id: string;
  name: string;
  group: ModuleGroup;
  status: ModuleStatus;
  timingMs: number;
  executionTimestamp?: string;
  description: string;
  details?: string;
}

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface CraterDetection {
  id: string;
  box: BoundingBox;
  confidence: number;
  diameterM: number;
  center: [number, number]; // [x, y] in pixels
  depthEstM: number;
  isHazard: boolean;
}

export interface ConsolidatedCrater {
  id: string;
  centroid: [number, number];
  centerMeters: [number, number];
  box: BoundingBox;
  boundingDiameterPixels: number;
  boundingDiameterM: number;
  depthEstM: number;
  isHazard: boolean;
  confidence: number;
  patchCount: number;
  constituentPatchIds: string[];
}

export interface BoulderDetection {
  id: string;
  box: BoundingBox;
  confidence: number;
  heightEstM: number;
  center: [number, number]; // [x, y] in pixels
  isHazard: boolean;
}

export interface GridCell {
  gx: number;
  gy: number;
  pixelBounds: BoundingBox;
  meanSlopeDeg: number;
  maxSlopeDeg: number;
  craterCount: number;
  boulderCount: number;
  isSafe: boolean;
  hazardReason?: 'SLOPE_EXCEEDED' | 'CRATER_HAZARD' | 'BOULDER_HAZARD' | 'NONE';
}

export interface SafeLandingZone {
  id: string;
  rank: number;
  centerPixel: [number, number]; // [x, y]
  centerGrid: [number, number];  // [gx, gy]
  cellCount: number;
  areaM2: number;                // Each cell is 24m x 24m = 576 m2
  widthM: number;
  heightM: number;
  meanSlopeDeg: number;
  safetyScore: number;           // 0 to 100
  clearanceMarginM: number;
  cells: [number, number][];     // list of [gx, gy]
}

export interface RoverPath {
  start: [number, number];
  target: [number, number];
  waypoints: [number, number][]; // pixel coordinates
  lengthMeters: number;
  averageSlopeDeg: number;
  hazardClearanceM: number;
}

export interface EvidenceRecord {
  inputImageHash: string;
  slopeMapHash: string;
  gridClassificationHash: string;
  candidateZonesHash: string;
  executionTimings: Record<string, number>;
  timestamp: string;
  totalDurationMs: number;
  imageDimensions: { width: number; height: number };
  gridDimensions: { cols: number; rows: number };
  cellCountTotal: number;
  cellCountSafe: number;
  cellCountHazard: number;
  safeAreaPercentage: number;
  cratersFound: number;
  distinctCratersCount?: number;
  bouldersFound: number;
  isVerified: boolean;
  reverifyTimestamp?: string;
  reverifyDeltaMs?: number;
}

export interface MissionLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'HAZARD';
  module: string;
  message: string;
}

export interface DataSourceStatus {
  id: string;
  name: string;
  organization: 'ISRO' | 'NASA';
  url: string;
  status: 'ONLINE' | 'CONNECTED' | 'PORTAL_AUTH_REQUIRED' | 'OFFLINE';
  lastChecked: string;
  latencyMs?: number;
  productCount?: number;
  sampleProducts?: Array<{
    id: string;
    title: string;
    instrument: string;
    time?: string;
    url?: string;
  }>;
  notice?: string;
  archiveVolumeTb?: number;
  payloadMetrics?: {
    dfsarDatasets?: number;
    tmc2CoverageSqKm?: number;
    ohrcCoverageSqKm?: number;
    archiveStatus?: string;
  };
}

export interface ProcessedAnalysisResult {
  width: number;
  height: number;
  gridCols: number;
  gridRows: number;
  pixelScaleMeters: number; // e.g. 1.0 m/px for OHRC or 5.0 m/px for TMC-2
  gridCells: GridCell[][];
  slopeMap: Float32Array;
  minSlopeDeg: number;
  meanSlopeDeg: number;
  maxSlopeDeg: number;
  craters: CraterDetection[];
  consolidatedCraters?: ConsolidatedCrater[];
  distinctCratersCount?: number;
  boulders: BoulderDetection[];
  safeZones: SafeLandingZone[];
  roverPath?: RoverPath;
  evidence: EvidenceRecord;
  logs: MissionLog[];
  modules: ModuleExecutionState[];
  aiValidation?: {
    isLunar: boolean;
    confidence: number;
    terrainType: string;
    observedFeatures: string[];
    disclaimer: string;
  };
  aiNarrative?: {
    summary: string;
    recommendation: string;
    landingSuitability: 'HIGH' | 'MODERATE' | 'CRITICAL' | 'UNSUITABLE';
    disclaimer: string;
  };
}
