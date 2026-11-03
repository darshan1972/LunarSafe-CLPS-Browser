import React, { useState } from 'react';
import {
  FileCheck2,
  Copy,
  Check,
  RotateCw,
  Clock,
  ShieldCheck,
  Hash,
  Layers,
  FileDown,
} from 'lucide-react';
import { EvidenceRecord, ProcessedAnalysisResult } from '../types';
import { PdfReportGenerator } from '../lib/pdfReportGenerator';

interface EvidencePanelProps {
  evidence: EvidenceRecord | null;
  onReverify: () => Promise<void>;
  isReverifying: boolean;
  reverifySuccess?: boolean;
  analysis?: ProcessedAnalysisResult | null;
  targetName?: string;
  rawImageBitmap?: ImageBitmap | HTMLImageElement | null;
}

const EvidencePanelComponent: React.FC<EvidencePanelProps> = ({
  evidence,
  onReverify,
  isReverifying,
  reverifySuccess,
  analysis,
  targetName,
  rawImageBitmap,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = () => {
    if (!analysis) return;
    try {
      setIsExportingPdf(true);

      // 1. Capture Raw Lunar Image Data URL
      let rawDataUrl: string | undefined;
      if (rawImageBitmap && typeof document !== 'undefined') {
        const offscreen = document.createElement('canvas');
        offscreen.width = analysis.width;
        offscreen.height = analysis.height;
        const ctx = offscreen.getContext('2d');
        if (ctx) {
          ctx.drawImage(rawImageBitmap, 0, 0, analysis.width, analysis.height);
          rawDataUrl = offscreen.toDataURL('image/jpeg', 0.85);
        }
      }

      // 2. Capture Live Hazard Overlay Canvas Data URL
      let overlayDataUrl: string | undefined;
      if (typeof document !== 'undefined') {
        const hazardCanvas = document.getElementById('lunar-hazard-canvas') as HTMLCanvasElement | null;
        if (hazardCanvas) {
          overlayDataUrl = hazardCanvas.toDataURL('image/jpeg', 0.85);
        }
      }

      PdfReportGenerator.downloadPdf(analysis, targetName || 'LUNAR_TARGET', {
        rawDataUrl,
        overlayDataUrl,
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!evidence) {
    return (
      <div className="bg-space-800 rounded-lg border border-space-700 p-4 text-center text-xs text-space-400 font-mono">
        <FileCheck2 className="w-6 h-6 mx-auto mb-2 text-space-500" />
        <div>Awaiting image analysis to generate cryptographic SHA-256 evidence chain.</div>
      </div>
    );
  }

  const hashStages = [
    {
      label: 'Stage 1: Raw Input Buffer',
      hash: evidence.inputImageHash,
      desc: 'Bit-exact SHA-256 of uploaded raw lunar image bytes',
      key: 'raw',
    },
    {
      label: 'Stage 2: Calibrated Slope Map',
      hash: evidence.slopeMapHash,
      desc: 'SHA-256 over Float32Array slope values (0–90° clamped)',
      key: 'slope',
    },
    {
      label: 'Stage 3: 24m Classified Grid',
      hash: evidence.gridClassificationHash,
      desc: 'SHA-256 over binary state matrix (1=Safe, 0=Hazard)',
      key: 'grid',
    },
    {
      label: 'Stage 4: Candidate Landing Zones',
      hash: evidence.candidateZonesHash,
      desc: 'SHA-256 of canonical JSON for ranked touchdown candidate zones',
      key: 'zones',
    },
  ];

  return (
    <div className="bg-space-800 rounded-lg border border-space-700 p-4 space-y-4 shadow-lg">
      {/* Evidence Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-space-700 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold tracking-wide text-white uppercase font-mono">
                Evidence Panel & Cryptographic Audit
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold">
                BIT-DETERMINISTIC
              </span>
            </div>
            <p className="text-xs text-space-400">
              End-to-end cryptographic verification proving zero non-determinism or generative fabrication
            </p>
          </div>
        </div>

        {/* Re-verify Button */}
        <div className="flex items-center space-x-2">
          {reverifySuccess && (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-[11px] font-mono text-emerald-400">
              <Check className="w-3.5 h-3.5" />
              <span>100% BIT-MATCH CONFIRMED</span>
              {evidence.reverifyDeltaMs && (
                <span className="text-space-400">({evidence.reverifyDeltaMs}ms)</span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={onReverify}
            disabled={isReverifying}
            className={`px-3 py-1.5 rounded text-xs font-mono font-semibold flex items-center space-x-1.5 transition-colors border ${
              isReverifying
                ? 'bg-space-750 border-space-600 text-space-400 cursor-not-allowed'
                : 'bg-cyan-950/40 hover:bg-cyan-900/40 border-cyan-500 text-cyan-300'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isReverifying ? 'animate-spin' : ''}`} />
            <span>{isReverifying ? 'RE-VERIFYING...' : 'RE-VERIFY (LIVE RE-RUN)'}</span>
          </button>

          {analysis && (
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-3 py-1.5 rounded text-xs font-mono font-semibold flex items-center space-x-1.5 transition-colors border bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500 text-emerald-400"
              title="Download client-generated audit-ready PDF assessment report"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? 'EXPORTING...' : 'EXPORT MISSION PDF'}</span>
            </button>
          )}
        </div>
      </div>

      {/* SHA-256 Stage Hashes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {hashStages.map(stage => (
          <div
            key={stage.key}
            className="p-3 rounded-md bg-space-850 border border-space-750 space-y-1.5 hover:border-space-600 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-mono font-medium text-space-200">
                <Hash className="w-3.5 h-3.5 text-cyan-400" />
                <span>{stage.label}</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(stage.hash, stage.key)}
                className="p-1 rounded hover:bg-space-750 text-space-400 hover:text-white transition-colors"
                title="Copy SHA-256"
              >
                {copiedKey === stage.key ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div className="bg-space-900 px-2.5 py-1.5 rounded border border-space-800 font-mono text-[11px] text-cyan-300 break-all select-all">
              {stage.hash}
            </div>

            <p className="text-[10px] text-space-500 font-sans">{stage.desc}</p>
          </div>
        ))}
      </div>

      {/* Module Execution Timings Table & Summary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
        {/* Execution Timings */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-space-300">
            <span className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>PER-MODULE EXECUTION LOG (REAL MEASURED TIMINGS):</span>
            </span>
            <span className="text-space-400">Total: {evidence.totalDurationMs}ms</span>
          </div>

          <div className="bg-space-850 rounded border border-space-750 overflow-hidden text-[11px] font-mono">
            <div className="grid grid-cols-12 bg-space-900 px-3 py-1.5 text-space-400 font-semibold border-b border-space-750">
              <div className="col-span-8">Module Algorithm</div>
              <div className="col-span-4 text-right">Execution Duration</div>
            </div>
            <div className="divide-y divide-space-800 max-h-48 overflow-y-auto">
              {Object.entries(evidence.executionTimings || {}).map(([name, time]) => (
                <div key={name} className="grid grid-cols-12 px-3 py-1.5 hover:bg-space-800/60">
                  <div className="col-span-8 text-space-200">{name}</div>
                  <div className="col-span-4 text-right text-emerald-400 font-semibold">{time} ms</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Numerical Summary Stats */}
        <div className="space-y-2">
          <div className="text-xs font-mono text-space-300 flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>MISSION STATS (NASA 24M TARGET):</span>
          </div>

          <div className="bg-black rounded border border-slate-800 p-3 space-y-2 text-xs font-mono shadow-inner">
            <div className="flex justify-between">
              <span className="text-white/70">Image Grid:</span>
              <span className="text-white font-bold">{(evidence.gridDimensions?.cols ?? 1)} × {(evidence.gridDimensions?.rows ?? 1)} cells</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Total Evaluated:</span>
              <span className="text-white font-bold">
                {evidence.cellCountTotal ?? (evidence as any).totalCellsEvaluated ?? 0} cells ({(((evidence.cellCountTotal ?? (evidence as any).totalCellsEvaluated ?? 0) * ((analysis ? Math.floor(24 / analysis.pixelScaleMeters) * analysis.pixelScaleMeters : 20) ** 2)) / 10000).toFixed(1)} ha)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Safe Cells (≤10°):</span>
              <span className="text-white font-bold">{evidence.cellCountSafe ?? 0} ({evidence.safeAreaPercentage ?? 0}%)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Hazard Cells:</span>
              <span className="text-red-500 font-bold">{evidence.cellCountHazard ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Hazard Feature Patches:</span>
              <span className="text-red-400 font-bold">{evidence.cratersFound ?? 0}</span>
            </div>
            {evidence.distinctCratersCount !== undefined && (
              <div className="flex justify-between">
                <span className="text-white/70">Distinct Craters:</span>
                <span className="text-white font-bold font-mono">{evidence.distinctCratersCount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-white/70">Boulders Detected:</span>
              <span className="text-red-400 font-bold">{evidence.bouldersFound ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const EvidencePanel = React.memo(EvidencePanelComponent);
