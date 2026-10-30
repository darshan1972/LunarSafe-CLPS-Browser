import React, { useRef, useEffect, useState } from 'react';
import {
  Layers,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertOctagon,
  Sparkles,
} from 'lucide-react';
import { ProcessedAnalysisResult, GridCell } from '../types';
import { Terrain3DViewer } from './Terrain3DViewer';

interface HazardCanvasProps {
  analysis: ProcessedAnalysisResult | null;
  rawImageBitmap: ImageBitmap | HTMLImageElement | null;
  isProcessing: boolean;
  errorMessage?: string | null;
}

interface LayerVisibility {
  baseImage: boolean;
  slopeHeatmap: boolean;
  isroGrid: boolean;
  craters: boolean;
  boulders: boolean;
  safeZones: boolean;
  roverPath: boolean;
}

export const HazardCanvas: React.FC<HazardCanvasProps> = ({
  analysis,
  rawImageBitmap,
  isProcessing,
  errorMessage,
}) => {
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const width = analysis?.width || 512;
  const height = analysis?.height || 512;

  const [layers, setLayers] = useState<LayerVisibility>({
    baseImage: true,
    slopeHeatmap: false,
    isroGrid: true,
    craters: true,
    boulders: true,
    safeZones: true,
    roverPath: true,
  });

  const [zoom, setZoom] = useState<number>(1.0);
  const [hoverCell, setHoverCell] = useState<GridCell | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [viewDimension, setViewDimension] = useState<'2d' | '3d'>('2d');

  const toggleLayer = (key: keyof LayerVisibility) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Render on canvas whenever analysis, bitmap, zoom, or layer visibility changes
  useEffect(() => {
    // 1. Base Image Layer Canvas
    const baseCanvas = baseCanvasRef.current;
    if (baseCanvas) {
      baseCanvas.width = width;
      baseCanvas.height = height;
      const baseCtx = baseCanvas.getContext('2d');
      if (baseCtx) {
        baseCtx.clearRect(0, 0, width, height);
        if (layers.baseImage) {
          if (rawImageBitmap && !errorMessage) {
            baseCtx.drawImage(rawImageBitmap, 0, 0, width, height);
          } else {
            baseCtx.fillStyle = '#1A1A1E';
            baseCtx.fillRect(0, 0, width, height);
            if (!errorMessage) {
              baseCtx.fillStyle = '#2A2A30';
              baseCtx.font = '14px monospace';
              baseCtx.textAlign = 'center';
              baseCtx.fillText('NO LUNAR IMAGERY LOADED', width / 2, height / 2 - 10);
              baseCtx.font = '11px sans-serif';
              baseCtx.fillStyle = '#71717A';
              baseCtx.fillText('Upload a Chandrayaan-2 TMC-2 / OHRC image to begin deterministic analysis', width / 2, height / 2 + 15);
            }
          }
        } else {
          baseCtx.fillStyle = '#0B0B0D';
          baseCtx.fillRect(0, 0, width, height);
        }
      }
    }

    // 2. Overlays Layer Canvas (24m Grid, Slope, Hazards, Craters, Boulders, Touchdown Zones)
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    if (!analysis || errorMessage) return;

    // 2. Slope Heatmap Layer
    if (layers.slopeHeatmap && analysis.slopeMap) {
      const imgData = ctx.createImageData(width, height);
      const data = imgData.data;
      const slopeMap = analysis.slopeMap;

      for (let i = 0; i < width * height; i++) {
        const slope = slopeMap[i];
        const idx = i * 4;

        // Color ramp: 0° (Green) -> 5° (Yellow) -> 10° (Orange) -> >10° (Deep Red)
        if (slope <= 5.0) {
          const t = slope / 5.0;
          data[idx] = Math.round(t * 220);         // R
          data[idx + 1] = Math.round(180 + t * 40); // G
          data[idx + 2] = 40;                      // B
          data[idx + 3] = 140;                     // Alpha
        } else if (slope <= 10.0) {
          const t = (slope - 5.0) / 5.0;
          data[idx] = 240;                         // R
          data[idx + 1] = Math.round(220 * (1 - t));// G
          data[idx + 2] = 20;                      // B
          data[idx + 3] = 160;                     // Alpha
        } else {
          // Hazard slopes > 10°
          data[idx] = 239;                         // R
          data[idx + 1] = 68;                      // G
          data[idx + 2] = 68;                      // B
          data[idx + 3] = 190;                     // Alpha
        }
      }

      // Draw onto temporary canvas to blend
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      tempCanvas.getContext('2d')?.putImageData(imgData, 0, 0);
      ctx.globalAlpha = 0.65;
      ctx.drawImage(tempCanvas, 0, 0);
      ctx.globalAlpha = 1.0;
    }

    // 3. ISRO 24m Grid Overlay Layer
    if (layers.isroGrid && analysis.gridCells) {
      for (let gy = 0; gy < analysis.gridRows; gy++) {
        for (let gx = 0; gx < analysis.gridCols; gx++) {
          const cell = analysis.gridCells[gy][gx];
          const b = cell.pixelBounds;
          const w = b.x2 - b.x1;
          const h = b.y2 - b.y1;

          if (cell.isSafe) {
            // SAFE cell (Blue tint)
            ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
            ctx.fillRect(b.x1, b.y1, w, h);
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(b.x1 + 0.5, b.y1 + 0.5, w - 1, h - 1);
          } else {
            // HAZARD cell (Red tint)
            ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
            ctx.fillRect(b.x1, b.y1, w, h);
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.65)';
            ctx.lineWidth = 1;
            ctx.strokeRect(b.x1 + 0.5, b.y1 + 0.5, w - 1, h - 1);

            // Diagonal hazard slash
            ctx.beginPath();
            ctx.moveTo(b.x1, b.y1);
            ctx.lineTo(b.x2, b.y2);
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
            ctx.stroke();
          }
        }
      }
    }

    // 4. Detected Craters Layer
    if (layers.craters && analysis.craters) {
      for (const crater of analysis.craters) {
        const [cx, cy] = crater.center;
        const radius = Math.max(3, (crater.box.x2 - crater.box.x1) / 2);

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = crater.isHazard ? '#EF4444' : '#38BDF8';
        ctx.lineWidth = crater.isHazard ? 2 : 1.5;
        ctx.stroke();

        // Crosshairs in crater center
        ctx.beginPath();
        ctx.moveTo(cx - 2, cy);
        ctx.lineTo(cx + 2, cy);
        ctx.moveTo(cx, cy - 2);
        ctx.lineTo(cx, cy + 2);
        ctx.strokeStyle = crater.isHazard ? '#EF4444' : '#38BDF8';
        ctx.stroke();

        // Label if sufficiently large
        if (radius > 8) {
          ctx.font = '9px monospace';
          ctx.fillStyle = crater.isHazard ? '#EF4444' : '#FFFFFF';
          ctx.textAlign = 'center';
          ctx.fillText(`Ø${crater.diameterM.toFixed(1)}m`, cx, cy - radius - 3);
        }
      }
    }

    // 5. Detected Boulders Layer
    if (layers.boulders && analysis.boulders) {
      for (const boulder of analysis.boulders) {
        const b = boulder.box;
        const bw = b.x2 - b.x1;
        const bh = b.y2 - b.y1;

        ctx.strokeStyle = boulder.isHazard ? '#EF4444' : '#38BDF8';
        ctx.lineWidth = boulder.isHazard ? 2 : 1.5;
        ctx.strokeRect(b.x1, b.y1, bw, bh);

        // Highlight marker
        ctx.fillStyle = boulder.isHazard ? 'rgba(239, 68, 68, 0.4)' : 'rgba(56, 189, 248, 0.35)';
        ctx.fillRect(b.x1, b.y1, bw, bh);

        ctx.font = '8px monospace';
        ctx.fillStyle = boulder.isHazard ? '#EF4444' : '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(`H:${boulder.heightEstM}m`, b.x1 + bw / 2, b.y1 - 2);
      }
    }

    // 6. Safe Landing Zones Layer (Pulsing Target Ellipses & Ranks)
    if (layers.safeZones && analysis.safeZones) {
      analysis.safeZones.forEach((zone, idx) => {
        const [cx, cy] = zone.centerPixel;
        const radiusX = Math.max(16, (zone.widthM / 24) * 12);
        const radiusY = Math.max(16, (zone.heightM / 24) * 12);

        // Outer touchdown buffer ellipse
        ctx.beginPath();
        ctx.ellipse(cx, cy, radiusX + 6, radiusY + 6, 0, 0, Math.PI * 2);
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = idx === 0 ? '#38BDF8' : '#60A5FA';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]);

        // Main touchdown boundary
        ctx.beginPath();
        ctx.ellipse(cx, cy, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.strokeStyle = idx === 0 ? '#38BDF8' : '#60A5FA';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = idx === 0 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(96, 165, 250, 0.2)';
        ctx.fill();

        // Crosshair reticle at landing center
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy);
        ctx.lineTo(cx + 10, cy);
        ctx.moveTo(cx, cy - 10);
        ctx.lineTo(cx, cy + 10);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Rank badge
        ctx.fillStyle = idx === 0 ? '#2563EB' : '#1D4ED8';
        ctx.beginPath();
        ctx.arc(cx, cy - radiusY - 14, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${zone.rank}`, cx, cy - radiusY - 14);

        // Site Name Label
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(zone.id, cx, cy + radiusY + 12);
        ctx.font = '9px monospace';
        ctx.fillStyle = '#BAE6FD';
        ctx.fillText(`${zone.areaM2.toLocaleString()}m² | ${zone.meanSlopeDeg}° slope`, cx, cy + radiusY + 23);
      });
    }

    // 7. A* Rover / Descent Traversal Path
    if (layers.roverPath && analysis.roverPath && analysis.roverPath.waypoints.length > 1) {
      const pts = analysis.roverPath.waypoints;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i][0], pts[i][1]);
      }
      ctx.setLineDash([5, 3]);
      ctx.strokeStyle = '#38BDF8'; // Blue trajectory
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.setLineDash([]);

      // Waypoint nodes
      for (const [wx, wy] of pts) {
        ctx.beginPath();
        ctx.arc(wx, wy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
      }
    }
  }, [analysis, rawImageBitmap, layers, zoom, errorMessage]);

  // Handle Mouse Move over Canvas to identify hovered 24m cell
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !analysis || errorMessage) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const px = Math.floor((e.clientX - rect.left) * scaleX);
    const py = Math.floor((e.clientY - rect.top) * scaleY);

    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    // Find corresponding grid cell
    const pixelsPerGrid = Math.max(1, Math.round(24 / analysis.pixelScaleMeters));
    const gx = Math.floor(px / pixelsPerGrid);
    const gy = Math.floor(py / pixelsPerGrid);

    if (
      gx >= 0 &&
      gx < analysis.gridCols &&
      gy >= 0 &&
      gy < analysis.gridRows &&
      analysis.gridCells[gy] &&
      analysis.gridCells[gy][gx]
    ) {
      setHoverCell(analysis.gridCells[gy][gx]);
    } else {
      setHoverCell(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverCell(null);
    setMousePos(null);
  };

  return (
    <div className="bg-space-800 rounded-lg border border-space-700 overflow-hidden flex flex-col h-full shadow-lg">
      {/* Canvas Header & Layer Toggles */}
      <div className="border-b border-space-700 bg-space-850 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-isro-cyan" />
            <span className="font-semibold text-white font-mono uppercase tracking-wider">
              Hazard Terrain Map (24m ISRO Grid)
            </span>
            {analysis && (
              <span className="text-[11px] font-mono text-space-400">
                [{analysis.width}×{analysis.height} px · {analysis.gridCols}×{analysis.gridRows} cells]
              </span>
            )}
          </div>

          {/* 2D vs 3D Dimension Switcher */}
          <div className="flex items-center rounded-md bg-space-900 border border-space-700/80 p-0.5">
            <button
              type="button"
              onClick={() => setViewDimension('2d')}
              className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold transition-colors ${
                viewDimension === '2d'
                  ? 'bg-isro-cyan/25 text-isro-cyan border border-isro-cyan/40'
                  : 'text-space-400 hover:text-white'
              }`}
            >
              2D GRID
            </button>
            <button
              type="button"
              onClick={() => setViewDimension('3d')}
              className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold transition-colors flex items-center space-x-1 ${
                viewDimension === '3d'
                  ? 'bg-isro-cyan/25 text-isro-cyan border border-isro-cyan/40'
                  : 'text-space-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3 text-isro-cyan" />
              <span>3D RELIEF</span>
            </button>
          </div>
        </div>

        {/* Multi-Layer Controls */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
          <button
            type="button"
            onClick={() => toggleLayer('baseImage')}
            className={`px-2 py-1 rounded border flex items-center space-x-1 ${
              layers.baseImage ? 'bg-space-750 border-space-600 text-white' : 'bg-space-900 border-space-800 text-space-500'
            }`}
          >
            {layers.baseImage ? <Eye className="w-3 h-3 text-isro-cyan" /> : <EyeOff className="w-3 h-3" />}
            <span>Imagery</span>
          </button>

          <button
            type="button"
            onClick={() => toggleLayer('slopeHeatmap')}
            className={`px-2 py-1 rounded border flex items-center space-x-1 ${
              layers.slopeHeatmap ? 'bg-isro-orange/20 border-isro-orange text-white' : 'bg-space-900 border-space-800 text-space-500'
            }`}
          >
            <span>Slope</span>
          </button>

          <button
            type="button"
            onClick={() => toggleLayer('isroGrid')}
            className={`px-2 py-1 rounded border flex items-center space-x-1 ${
              layers.isroGrid ? 'bg-isro-emerald/20 border-isro-emerald text-white' : 'bg-space-900 border-space-800 text-space-500'
            }`}
          >
            <span>24m Grid</span>
          </button>

          <button
            type="button"
            onClick={() => toggleLayer('craters')}
            className={`px-2 py-1 rounded border flex items-center space-x-1 ${
              layers.craters ? 'bg-isro-cyan/20 border-isro-cyan text-white' : 'bg-space-900 border-space-800 text-space-500'
            }`}
          >
            <span>Hazard Patches</span>
          </button>

          <button
            type="button"
            onClick={() => toggleLayer('boulders')}
            className={`px-2 py-1 rounded border flex items-center space-x-1 ${
              layers.boulders ? 'bg-isro-amber/20 border-isro-amber text-white' : 'bg-space-900 border-space-800 text-space-500'
            }`}
          >
            <span>Boulders</span>
          </button>

          <button
            type="button"
            onClick={() => toggleLayer('safeZones')}
            className={`px-2 py-1 rounded border flex items-center space-x-1 ${
              layers.safeZones ? 'bg-isro-emerald/20 border-isro-emerald text-white' : 'bg-space-900 border-space-800 text-space-500'
            }`}
          >
            <span>Safe Zones</span>
          </button>

          <button
            type="button"
            onClick={() => toggleLayer('roverPath')}
            className={`px-2 py-1 rounded border flex items-center space-x-1 ${
              layers.roverPath ? 'bg-isro-amber/20 border-isro-amber text-white' : 'bg-space-900 border-space-800 text-space-500'
            }`}
          >
            <span>A* Traversal</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center space-x-1 pl-2 border-l border-space-700">
            <button
              type="button"
              onClick={() => setZoom(z => Math.max(0.75, z - 0.25))}
              className="p-1 rounded bg-space-800 hover:bg-space-750 text-space-300"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] text-space-400 w-8 text-center">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom(z => Math.min(2.5, z + 0.25))}
              className="p-1 rounded bg-space-800 hover:bg-space-750 text-space-300"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1.0)}
              className="p-1 rounded bg-space-800 hover:bg-space-750 text-space-300"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* High-Tech Aerospace Calibration Readout Header */}
      <div className="bg-space-900 border-b border-space-700/80 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-zinc-300">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-space-850 border border-space-700 shadow-xs">
            <span className="text-zinc-400">GSD:</span>
            <span className="text-isro-cyan font-bold">
              {analysis?.pixelScaleMeters ? `${analysis.pixelScaleMeters.toFixed(2)} m/px` : '0.25 m/px'}
            </span>
          </div>
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-space-850 border border-space-700 shadow-xs">
            <span className="text-zinc-400">GRID:</span>
            <span className="text-emerald-400 font-bold">24m ISRO Criterion</span>
          </div>
          <div className="hidden sm:flex items-center space-x-1.5 px-2 py-0.5 rounded bg-space-850 border border-space-700 shadow-xs">
            <span className="text-zinc-400">MATRIX:</span>
            <span className="text-white font-medium">
              {analysis ? `${analysis.gridCols}×${analysis.gridRows} cells` : '21×21 cells'}
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-1.5 px-2 py-0.5 rounded bg-space-850 border border-space-700 shadow-xs">
            <span className="text-zinc-400">FOV:</span>
            <span className="text-zinc-200">
              {analysis ? `${((analysis.width || 512) * (analysis.pixelScaleMeters || 0.25)).toFixed(0)}m × ${((analysis.height || 512) * (analysis.pixelScaleMeters || 0.25)).toFixed(0)}m` : '128m × 128m'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-[10px]">
          <span className="text-zinc-400 font-mono">SAFETY THRESHOLD:</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 font-bold">
            ≤ 10.0° SAFE
          </span>
          <span className="px-1.5 py-0.5 rounded bg-red-950/70 text-red-300 border border-red-500/40 font-bold">
            &gt; 10.0° HAZARD
          </span>
        </div>
      </div>

      {/* 3D Viewport */}
      {viewDimension === '3d' && (
        <div className="relative flex-1 w-full h-full min-h-[440px]">
          <Terrain3DViewer
            analysis={analysis}
            rawImageBitmap={rawImageBitmap}
          />
        </div>
      )}

      {/* Main 2D Canvas Viewport (Locked 1:1 Aspect-Ratio Container) */}
      <div
        ref={containerRef}
        className={`relative flex-1 bg-space-950 flex items-center justify-center overflow-auto p-4 min-h-[420px] ${
          viewDimension === '3d' ? 'hidden' : ''
        }`}
      >
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease-out',
            aspectRatio: `${width} / ${height}`,
            width: `${Math.min(width, 680)}px`,
            maxWidth: '100%',
          }}
          className="relative shadow-2xl rounded-lg border border-space-700/80 bg-space-950 overflow-hidden flex items-center justify-center"
        >
          {/* Base Imagery Canvas (Locked 1:1) */}
          <canvas
            ref={baseCanvasRef}
            id="lunar-base-canvas"
            className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
          />

          {/* Overlays Canvas (24m Grid, Slope, Hazards, Craters, Boulders, Touchdown - Locked 1:1) */}
          <canvas
            ref={canvasRef}
            id="lunar-hazard-canvas"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="absolute top-0 left-0 w-full h-full cursor-crosshair"
          />

          {isProcessing && (
            <div className="absolute inset-0 bg-space-950/70 backdrop-blur-xs flex items-center justify-center font-mono text-xs text-isro-cyan">
              COMPUTING DETERMINISTIC HAZARD MAP...
            </div>
          )}

          {errorMessage && (
            <div className="absolute inset-0 bg-red-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-30">
              <div className="w-14 h-14 rounded-full bg-red-900/60 border border-red-500/80 flex items-center justify-center text-red-400 mb-3 shadow-2xl">
                <AlertOctagon className="w-8 h-8" />
              </div>
              <h3 className="font-mono font-bold text-sm text-red-400 uppercase tracking-wide mb-1">
                Panchromatic Guard Rejection
              </h3>
              <p className="font-mono text-xs text-red-200/90 max-w-md mb-2">
                {errorMessage}
              </p>
              <div className="text-[11px] font-mono text-space-400 max-w-sm border-t border-red-900/50 pt-2 mt-1">
                Single-band panchromatic lunar sensor requirement (TMC-2/OHRC) violated. Hazard detection aborted (0 craters, 0 boulders evaluated).
              </div>
            </div>
          )}

          {/* Real-time cell hover tooltip */}
          {hoverCell && mousePos && (
            <div
              style={{ left: `${mousePos.x + 15}px`, top: `${mousePos.y + 15}px` }}
              className="pointer-events-none absolute z-40 bg-space-900/95 border border-space-600 rounded p-2.5 shadow-2xl backdrop-blur-sm text-xs font-mono text-space-100 min-w-[200px]"
            >
              <div className="flex items-center justify-between border-b border-space-700 pb-1 mb-1.5">
                <span className="text-space-400">CELL [{hoverCell.gx}, {hoverCell.gy}]</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  hoverCell.isSafe ? 'bg-isro-emerald/20 text-isro-emerald border border-isro-emerald/40' : 'bg-isro-crimson/20 text-isro-crimson border border-isro-crimson/40'
                }`}>
                  {hoverCell.isSafe ? 'SAFE ZONE' : 'HAZARD'}
                </span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-space-400">Mean Slope:</span>
                  <span className={hoverCell.meanSlopeDeg <= 10 ? 'text-isro-emerald font-semibold' : 'text-isro-crimson font-semibold'}>
                    {hoverCell.meanSlopeDeg}° {hoverCell.meanSlopeDeg > 10 && '(>10° max)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-space-400">Peak Slope:</span>
                  <span>{hoverCell.maxSlopeDeg}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-space-400">Hazard Patches:</span>
                  <span>{hoverCell.craterCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-space-400">Boulders:</span>
                  <span>{hoverCell.boulderCount}</span>
                </div>
                {hoverCell.hazardReason && hoverCell.hazardReason !== 'NONE' && (
                  <div className="pt-1 text-[10px] text-isro-crimson border-t border-space-800 flex items-center space-x-1">
                    <AlertOctagon className="w-3 h-3 shrink-0" />
                    <span>Trigger: {hoverCell.hazardReason.replace('_', ' ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="px-3 py-2 bg-space-850/80 border-t border-space-700/60 flex flex-wrap items-center justify-between text-[11px] text-space-400 font-mono gap-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-isro-cyan/40 border border-isro-cyan" />
            <span className="text-white">Safe (≤10°)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-isro-crimson/40 border border-isro-crimson" />
            <span className="text-isro-crimson">Hazard (&gt;10° or obstacles)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-full border border-isro-crimson" />
            <span className="text-white">Hazard Patch (Ø &gt; 1m)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-sm border border-isro-cyan" />
            <span className="text-isro-cyan">Boulder (H &gt; 0.3m)</span>
          </div>
        </div>

        <div>
          <span>
            Scale: 1 cell = {analysis ? `${(Math.floor(24 / analysis.pixelScaleMeters) * analysis.pixelScaleMeters).toFixed(1)}m × ${(Math.floor(24 / analysis.pixelScaleMeters) * analysis.pixelScaleMeters).toFixed(1)}m (${((Math.floor(24 / analysis.pixelScaleMeters) * analysis.pixelScaleMeters) ** 2).toFixed(1)}m²)` : '24m × 24m (576m²)'} per ISRO Chandrayaan standard
          </span>
        </div>
      </div>
    </div>
  );
};
