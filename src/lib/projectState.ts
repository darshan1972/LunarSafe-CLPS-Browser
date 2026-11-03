import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface ProjectState {
  lastScan: {
    id: string;
    instrument: string;
    timestamp: string;
    imagePath: string;
    hazardCount: number;
    hazardPatchCount?: number;
    boulderCount?: number;
    safeCellCount?: number;
    safeAreaPercentage?: number;
    safeZoneCount: number;
    contiguousZoneCount?: number;
    topSiteAreaM2?: number;
    meanSlopeDeg: number;
    maxSlopeDeg?: number;
    frameMaxSlopeDeg?: number;
    selectedZoneMaxSlopeDeg?: number;
    recommendation: string;
    hashChain: {
      stage1Input: string;
      stage2Slope: string;
      stage3Grid: string;
      stage4Zones: string;
    };
  } | null;
  components: {
    deterministicEngine: { status: 'ONLINE' | 'OFFLINE'; byteSize: number; sha256: string };
    uncertaintyFilter: { status: 'ONLINE' | 'OFFLINE' };
    geminiVision: { status: 'CONFIGURED' | 'UNCONFIGURED' };
    agentOm: { status: 'ONLINE' | 'OFFLINE' };
  };
  environment: {
    nodeVersion: string;
    platform: string;
    port: number;
  };
}

export function getProjectState(): ProjectState {
  const isBrowser = typeof window !== 'undefined';

  if (isBrowser) {
    let lastScan: ProjectState['lastScan'] = null;
    try {
      if (window.localStorage) {
        const stored = window.localStorage.getItem('lunarsafe_nasa_scan_history');
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list) && list.length > 0) {
            const latest = list[0];
            lastScan = {
              id: latest.id || 'scan-latest',
              instrument: latest.instrument || 'NASA LRO',
              timestamp: latest.timestamp || new Date().toISOString(),
              imagePath: latest.imagePath || latest.instrument || latest.id || 'NASA LRO',
              hazardCount: latest.hazardPatchCount ?? latest.hazardCount ?? latest.craterCount ?? 0,
              hazardPatchCount: latest.hazardPatchCount ?? latest.hazardCount ?? latest.craterCount ?? 0,
              boulderCount: latest.boulderCount,
              safeCellCount: latest.safeCellCount,
              safeAreaPercentage: latest.safeAreaPercentage,
              safeZoneCount: latest.safeZoneCount ?? latest.contiguousZoneCount ?? 0,
              contiguousZoneCount: latest.safeZoneCount ?? latest.contiguousZoneCount ?? 0,
              topSiteAreaM2: latest.topSiteAreaM2,
              meanSlopeDeg: latest.meanSlopeDeg ?? 0,
              maxSlopeDeg: latest.maxSlopeDeg,
              frameMaxSlopeDeg: latest.frameMaxSlopeDeg ?? latest.maxSlopeDeg,
              selectedZoneMaxSlopeDeg: latest.selectedZoneMaxSlopeDeg,
              recommendation: latest.recommendation || 'SAFE',
              hashChain: {
                stage1Input: latest.inputImageHash || latest.hashChain?.stage1Input || latest.evidence?.sha256Hash || latest.stage1Hash || '',
                stage2Slope: latest.slopeMapHash || latest.hashChain?.stage2Slope || latest.evidence?.stage2SlopeHash || latest.stage2SlopeHash || '',
                stage3Grid: latest.gridClassificationHash || latest.hashChain?.stage3Grid || latest.evidence?.stage3GridHash || latest.stage3GridHash || '',
                stage4Zones: latest.candidateZonesHash || latest.hashChain?.stage4Zones || latest.evidence?.stage4ZonesHash || latest.stage4ZonesHash || '',
              },
            };
          }
        }
      }
    } catch {
      // Ignore localStorage parse errors
    }

    const portNum = window.location ? Number(window.location.port) || 3000 : 3000;
    return {
      lastScan,
      components: {
        deterministicEngine: {
          status: 'ONLINE',
          byteSize: 41930,
          sha256: '8ca34c558c41f0b324a207a1d758476d397319999313d59a5919e75912882956',
        },
        uncertaintyFilter: {
          status: 'ONLINE',
        },
        geminiVision: {
          status: (typeof window !== 'undefined' && ((window as any).__GEMINI_CONFIGURED__ || (typeof process !== 'undefined' && process.env?.VITE_GEMINI_API_KEY))) ? 'CONFIGURED' : 'UNCONFIGURED',
        },
        agentOm: {
          status: 'ONLINE',
        },
      },
      environment: {
        nodeVersion: 'browser',
        platform: typeof navigator !== 'undefined' ? navigator.platform : 'browser',
        port: portNum,
      },
    };
  }

  // Node.js runtime environment (safely isolated)
  const nodeFs: any = fs;
  const nodePath: any = path;
  const nodeCrypto: any = crypto;
  const cwd = typeof process !== 'undefined' && typeof process.cwd === 'function' ? process.cwd() : '.';
  const envObj = typeof process !== 'undefined' && process.env ? process.env : {};

  // 1. Read last scan from .scan_history.json
  let lastScan: ProjectState['lastScan'] = null;
  try {
    const historyPath = nodePath?.resolve ? nodePath.resolve(cwd, '.scan_history.json') : '.scan_history.json';
    if (nodeFs?.existsSync && nodeFs.existsSync(historyPath)) {
      const raw = nodeFs.readFileSync(historyPath, 'utf8');
      const data = JSON.parse(raw);
      const list = Array.isArray(data) ? data : (data.scans || []);
      if (list.length > 0) {
        const latest = list[0];
        lastScan = {
          id: latest.id,
          instrument: latest.instrument,
          timestamp: latest.timestamp,
          imagePath: latest.imagePath || latest.instrument || latest.id,
          hazardCount: latest.hazardPatchCount ?? latest.hazardCount ?? latest.craterCount,
          hazardPatchCount: latest.hazardPatchCount ?? latest.hazardCount ?? latest.craterCount,
          boulderCount: latest.boulderCount,
          safeCellCount: latest.safeCellCount,
          safeAreaPercentage: latest.safeAreaPercentage,
          safeZoneCount: latest.safeZoneCount ?? latest.contiguousZoneCount,
          contiguousZoneCount: latest.safeZoneCount ?? latest.contiguousZoneCount,
          topSiteAreaM2: latest.topSiteAreaM2,
          meanSlopeDeg: latest.meanSlopeDeg,
          maxSlopeDeg: latest.maxSlopeDeg,
          frameMaxSlopeDeg: latest.frameMaxSlopeDeg ?? latest.maxSlopeDeg,
          selectedZoneMaxSlopeDeg: latest.selectedZoneMaxSlopeDeg,
          recommendation: latest.recommendation,
          hashChain: {
            stage1Input: latest.inputImageHash || latest.hashChain?.stage1Input || latest.evidence?.sha256Hash || latest.stage1Hash || '',
            stage2Slope: latest.slopeMapHash || latest.hashChain?.stage2Slope || latest.evidence?.stage2SlopeHash || latest.stage2SlopeHash || '',
            stage3Grid: latest.gridClassificationHash || latest.hashChain?.stage3Grid || latest.evidence?.stage3GridHash || latest.stage3GridHash || '',
            stage4Zones: latest.candidateZonesHash || latest.hashChain?.stage4Zones || latest.evidence?.stage4ZonesHash || latest.stage4ZonesHash || '',
          },
        };
      }
    }
  } catch (err) {
    // Ignore JSON read errors
  }

  // 2. Deterministic CV Engine status & metrics
  let byteSize = 0;
  let sha256 = '';
  let engineStatus: 'ONLINE' | 'OFFLINE' = 'OFFLINE';

  const possiblePaths = [
    nodePath?.resolve ? nodePath.resolve(cwd, 'src/lib/imageProcessor.ts') : 'src/lib/imageProcessor.ts',
    'src/lib/imageProcessor.ts',
  ];

  for (const p of possiblePaths) {
    if (nodeFs?.existsSync && nodeFs.existsSync(p)) {
      const content = nodeFs.readFileSync(p);
      byteSize = content.length;
      if (nodeCrypto?.createHash) {
        sha256 = nodeCrypto.createHash('sha256').update(content).digest('hex');
      }
      engineStatus = 'ONLINE';
      break;
    }
  }

  // 3. Uncertainty Filter status
  const uncertaintyPath = nodePath?.resolve ? nodePath.resolve(cwd, 'src/lib/uncertainty.ts') : 'src/lib/uncertainty.ts';
  const uncertaintyStatus: 'ONLINE' | 'OFFLINE' = (nodeFs?.existsSync && nodeFs.existsSync(uncertaintyPath)) ? 'ONLINE' : 'OFFLINE';

  // 4. Gemini status
  const geminiStatus: 'CONFIGURED' | 'UNCONFIGURED' = envObj.GEMINI_API_KEY ? 'CONFIGURED' : 'UNCONFIGURED';

  return {
    lastScan,
    components: {
      deterministicEngine: {
        status: engineStatus,
        byteSize,
        sha256,
      },
      uncertaintyFilter: {
        status: uncertaintyStatus,
      },
      geminiVision: {
        status: geminiStatus,
      },
      agentOm: {
        status: 'ONLINE',
      },
    },
    environment: {
      nodeVersion: typeof process !== 'undefined' ? process.version : 'node',
      platform: typeof process !== 'undefined' ? process.platform : 'node',
      port: Number(envObj.PORT) || 5000,
    },
  };
}
