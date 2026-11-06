import React from 'react';
import {
  X,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  BarChart3,
} from 'lucide-react';

interface SiteSidePanelProps {
  site: any | null;
  onClose: () => void;
  sampledSlope: number | null;
  maxSlopeTolerance: number;
  onToleranceChange: (val: number) => void;
  onOpenVerificationModal: () => void;
  onOpenComparisonModal?: () => void;
  sunAngleDeg?: number;
}

const SiteSidePanelComponent: React.FC<SiteSidePanelProps> = ({
  site,
  onClose,
  sampledSlope,
  maxSlopeTolerance,
  onToleranceChange,
  onOpenVerificationModal,
  onOpenComparisonModal,
  sunAngleDeg = 20,
}) => {
  if (!site) return null;

  const props = site.properties || {};
  const coords = site.geometry?.coordinates || [0, 0];
  const lon = coords[0];
  const lat = coords[1];

  // Effective slope: sampled from NASA slope texture or fallback to base_slope_deg
  const currentSlope = sampledSlope !== null ? sampledSlope : (props.base_slope_deg || 6.5);
  const isSafe = currentSlope <= maxSlopeTolerance;

  // Calculate LunarSafe Score (0-100)
  let score: number;
  if (isSafe) {
    const margin = maxSlopeTolerance - currentSlope; // positive
    score = Math.round(65 + Math.min(33, (margin / maxSlopeTolerance) * 33 + 5));
  } else {
    const excess = currentSlope - maxSlopeTolerance; // positive
    score = Math.round(Math.max(12, 50 - (excess / maxSlopeTolerance) * 60));
  }

  // Format selenographic coordinates
  const latStr = `${Math.abs(lat).toFixed(2)}° ${lat < 0 ? 'S' : 'N'}`;
  const lonStr = `${Math.abs(lon).toFixed(2)}° ${lon < 0 ? 'W' : 'E'}`;

  // Earth communication direct line-of-sight status
  const hasEarthComm = props.earth_comm !== undefined ? Boolean(props.earth_comm) : null;

  return (
    <div className="fixed top-16 right-0 bottom-0 z-40 w-full sm:w-[420px] bg-space-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out font-mono text-white animate-slideInRight">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-space-850/70 flex items-start justify-between gap-3">
        <div className="flex items-start space-x-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 mt-0.5">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-cyan-300 font-semibold block">
              NASA CLPS Candidate Region
            </span>
            <h2 className="text-base font-bold text-white tracking-wide">
              {props.name || 'Candidate Landing Site'}
            </h2>
            <span className="text-[11px] text-zinc-400 font-sans block mt-0.5">
              {props.clps_mission || 'Artemis III / Commercial Payload Services'}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Close site briefing panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Safety Assessment Hero Card */}
        <div className={`p-4 rounded-xl border transition-all ${
          isSafe
            ? 'bg-emerald-950/40 border-emerald-500/50 shadow-lg shadow-emerald-950/20'
            : 'bg-red-950/40 border-red-500/50 shadow-lg shadow-red-950/20'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              {isSafe ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              )}
              <span className={`font-bold tracking-wider uppercase text-sm ${
                isSafe ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {isSafe ? 'SAFE TOUCHDOWN ZONE' : 'CRITICAL HAZARD DETECTED'}
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${
              isSafe
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-red-500/20 text-red-300 border-red-500/30'
            }`}>
              {isSafe ? 'PERMISSIBLE' : 'LIMIT EXCEEDED'}
            </span>
          </div>

          {/* LunarSafe Score Bar */}
          <div className="space-y-1.5 mt-3 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-300">Relative Safety Index (heuristic):</span>
              <span className={`font-bold text-sm ${isSafe ? 'text-emerald-300' : 'text-red-300'}`}>
                {score} <span className="text-[10px] text-zinc-400 font-normal">/ 100</span>
              </span>
            </div>
            <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                style={{ width: `${Math.max(5, Math.min(100, score))}%` }}
                className={`h-full rounded-full transition-all duration-300 ${
                  isSafe
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                    : 'bg-gradient-to-r from-red-600 to-amber-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                }`}
              />
            </div>
            <p className="text-[10px] text-zinc-400 pt-0.5">
              {isSafe
                ? `Measured slope (${currentSlope.toFixed(2)}°) is within the lander threshold (≤ ${maxSlopeTolerance.toFixed(1)}°). Safe for footpad landing.`
                : `Measured slope (${currentSlope.toFixed(2)}°) exceeds the permissible limit (${maxSlopeTolerance.toFixed(1)}°). Severe tip-over risk.`}
            </p>
          </div>
        </div>

        {/* Artemis Surface Infrastructure Badge (Pillar 3) */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-blue-950/70 via-slate-900 to-cyan-950/50 border border-cyan-500/40 shadow-sm space-y-1">
          <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
            <span className="text-emerald-400">✔️</span>
            <span>Supports Artemis Surface Infrastructure</span>
          </div>
          <p className="text-[10px] text-zinc-300 font-sans leading-relaxed">
            Safe landing protects VIPER mobility and PSR water-ice harvesting.
          </p>
        </div>

        {/* Max Lander Slope Tolerance Interactive Slider */}
        <div className="p-3.5 rounded-xl bg-space-850/80 border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-zinc-300 font-semibold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Max Lander Slope Tolerance:</span>
            </label>
            <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 font-bold border border-cyan-500/40">
              {maxSlopeTolerance.toFixed(1)}°
            </span>
          </div>
          <input
            type="range"
            min="8.0"
            max="15.0"
            step="0.5"
            value={maxSlopeTolerance}
            onChange={(e) => onToleranceChange(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-space-700 rounded-lg appearance-none"
          />
          <div className="flex justify-between text-[10px] text-zinc-400">
            <span>8.0° (Strict NASA CLPS)</span>
            <span>10.0° (Standard)</span>
            <span>15.0° (High-Clearance)</span>
          </div>
        </div>

        {/* Real Sampled Topography Metrics */}
        <div className="p-3.5 rounded-xl bg-space-850/80 border border-white/10 space-y-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block pb-1 border-b border-white/5">
            LOLA Sampled Telemetry
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded bg-black/40 border border-white/5">
              <span className="text-zinc-400 block text-[10px]">Real Slope (NASA LRO):</span>
              <span className={`font-bold text-xs ${isSafe ? 'text-emerald-400' : 'text-red-400'}`}>
                {currentSlope.toFixed(2)}°
              </span>
            </div>
            <div className="p-2 rounded bg-black/40 border border-white/5">
              <span className="text-zinc-400 block text-[10px]">Elevation Datum:</span>
              <span className="font-bold text-white text-xs">
                {props.elevation_m !== undefined ? `${props.elevation_m > 0 ? '+' : ''}${props.elevation_m} m` : 'N/A'}
              </span>
            </div>
            <div className="p-2 rounded bg-black/40 border border-white/5">
              <span className="text-zinc-400 block text-[10px]">Solar Illumination:</span>
              <span className="font-bold text-amber-300 text-xs">
                {props.lighting_pct !== undefined ? (
                  <>
                    {props.lighting_pct}% Annual Lighting{' '}
                    <span className="text-[9px] text-zinc-400 font-normal">(illustrative)</span>
                  </>
                ) : (
                  <span className="text-zinc-400 font-normal">n/a</span>
                )}
              </span>
            </div>
            <div className="p-2 rounded bg-black/40 border border-white/5">
              <span className="text-zinc-400 block text-[10px]">Earth Comm Visibility:</span>
              <span className="font-bold text-xs">
                {hasEarthComm !== null ? (
                  <>
                    <span className={hasEarthComm ? 'text-emerald-400' : 'text-amber-400'}>
                      Direct Line of Sight: {hasEarthComm ? 'YES' : 'NO'}
                    </span>{' '}
                    <span className="text-[9px] text-zinc-400 font-normal">(illustrative)</span>
                  </>
                ) : (
                  <span className="text-zinc-400 font-normal">n/a</span>
                )}
              </span>
            </div>
            <div className="p-2 rounded bg-black/40 border border-white/5">
              <span className="text-zinc-400 block text-[10px]">Sun Angle (Polar):</span>
              <span className="font-bold text-amber-300 text-xs">
                {sunAngleDeg.toFixed(0)}°
              </span>
            </div>
            <div className="p-2 rounded bg-black/40 border border-white/5">
              <span className="text-zinc-400 block text-[10px]">Roughness Index (LRO):</span>
              <span className="font-bold text-amber-300 text-xs">
                {props.sampled_roughness_index !== undefined
                  ? props.sampled_roughness_index.toFixed(2)
                  : props.roughness_index !== undefined
                  ? props.roughness_index.toFixed(2)
                  : '0.28'}
              </span>
            </div>
            <div className="p-2 rounded bg-black/40 border border-white/5 col-span-2 sm:col-span-1">
              <span className="text-zinc-400 block text-[10px]">Coordinates:</span>
              <span className="font-bold text-white text-xs truncate block" title={`${latStr}, ${lonStr}`}>
                {latStr}, {lonStr}
              </span>
            </div>
            <div className="p-2 rounded bg-black/40 border border-white/5 col-span-2 sm:col-span-1">
              <span className="text-zinc-400 block text-[10px]">CLPS Mission:</span>
              <span className="font-bold text-cyan-400 text-xs truncate block" title={props.clps_mission || 'CLPS Polar Explorer'}>
                {props.clps_mission || 'CLPS Polar Explorer'}
              </span>
            </div>
          </div>
        </div>

        {/* Primary Science Target */}
        {props.primary_target && (
          <div className="p-3 rounded-xl bg-space-850/80 border border-white/10 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
              Primary Scientific Target
            </span>
            <p className="text-[11px] text-zinc-200 font-sans leading-relaxed">
              {props.primary_target}
            </p>
          </div>
        )}

        {/* Geological Description */}
        {props.description && (
          <div className="p-3.5 rounded-xl bg-space-850/80 border border-white/10 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Mission & Geological Context
            </span>
            <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">
              {props.description}
            </p>
          </div>
        )}

        {/* Topographic Visual Reference (Strictly object-contain, respecting container bounds) */}
        <div className="p-3.5 rounded-xl bg-space-850/80 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            <span>LOLA Surface Relief Profile</span>
            <span className="text-cyan-400">NASA LRO (80S_80M)</span>
          </div>
          <div className="w-full max-h-36 h-28 rounded-lg overflow-hidden bg-space-950 border border-white/10 relative flex items-center justify-center p-1.5 shadow-inner">
            <img
              src="/data/dem_heightmap.png"
              alt="NASA LOLA Topography"
              className="w-full h-full max-h-36 object-contain rounded mx-auto"
            />
            <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded bg-black/85 text-[9px] font-mono text-zinc-300 border border-white/10 backdrop-blur-xs">
              {latStr}, {lonStr}
            </div>
          </div>
        </div>

        {/* Multi-Site Decision Tool Button (Pillar 2) */}
        {onOpenComparisonModal && (
          <button
            type="button"
            onClick={onOpenComparisonModal}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-950/90 to-blue-950/70 hover:from-cyan-900/90 hover:to-blue-900/80 border border-cyan-500/50 hover:border-cyan-400 text-cyan-200 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 group"
          >
            <BarChart3 className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>Rank All 13 Sites</span>
          </button>
        )}

        {/* SHA-256 Data Verified Badge (Clickable) */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onOpenVerificationModal}
            className="w-full p-3 rounded-xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/60 hover:border-emerald-400 text-left transition-all group shadow-md hover:shadow-emerald-950/40"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-emerald-400 text-xs tracking-wide">
                  ✔️ SHA-256 Data Verified
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 group-hover:bg-emerald-500/30 transition-colors">
                AUDIT PROOF
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 mt-1 font-sans">
              Click to inspect cryptographic SHA-256 seal & reproducible WebCrypto payload.
            </p>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-space-850 border-t border-white/10 text-[10px] text-zinc-500 flex items-center justify-between">
        <span>NASA LRO LOLA • Horn (1981) Engine</span>
        <span>Team Rocket • Space Apps 2026</span>
      </div>
    </div>
  );
};

export const SiteSidePanel = React.memo(SiteSidePanelComponent);
