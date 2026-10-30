import React from 'react';
import { Target, Shield, CheckCircle2 } from 'lucide-react';
import { SafeLandingZone } from '../types';

interface LandingSitesPanelProps {
  safeZones: SafeLandingZone[];
  onSelectZone?: (zone: SafeLandingZone) => void;
}

export const LandingSitesPanel: React.FC<LandingSitesPanelProps> = ({
  safeZones,
  onSelectZone,
}) => {
  if (!safeZones || safeZones.length === 0) {
    return (
      <div className="bg-space-800 rounded-lg border border-space-700 p-4 space-y-2">
        <div className="flex items-center space-x-2 text-isro-cyan">
          <Target className="w-4 h-4" />
          <h2 className="text-sm font-semibold tracking-wide uppercase font-mono text-white">
            Landing Site Recommendations
          </h2>
        </div>
        <p className="text-xs text-space-400 font-mono">
          Awaiting terrain classification to extract contiguous safe landing sites.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-space-800 rounded-lg border border-space-700 p-4 space-y-3 shadow-lg">
      <div className="flex items-center justify-between border-b border-space-700 pb-2.5">
        <div className="flex items-center space-x-2">
          <Target className="w-4 h-4 text-isro-cyan" />
          <h2 className="text-sm font-semibold tracking-wide uppercase font-mono text-white">
            Recommended Landing Sites (Top 3)
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-space-850 border border-space-700 text-isro-emerald">
          BFS CONTIGUOUS
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {safeZones.map(zone => {
          const isPrimary = zone.rank === 1;

          return (
            <div
              key={zone.id}
              onClick={() => onSelectZone?.(zone)}
              className={`p-3 rounded-lg border transition-all cursor-pointer space-y-2.5 ${
                isPrimary
                  ? 'bg-isro-emerald/10 border-isro-emerald hover:border-isro-emerald/80 shadow-md'
                  : 'bg-space-850 border-space-750 hover:border-space-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                      isPrimary ? 'bg-isro-emerald text-white' : 'bg-space-700 text-space-200'
                    }`}
                  >
                    {zone.rank}
                  </div>
                  <span className="font-mono font-bold text-xs text-white">
                    {isPrimary ? 'PRIMARY SITE' : `CONTINGENCY ${zone.rank}`}
                  </span>
                </div>

                <div className="flex items-center space-x-1 font-mono text-[11px] text-isro-emerald font-semibold">
                  <Shield className="w-3 h-3" />
                  <span>{zone.safetyScore}/100</span>
                </div>
              </div>

              <div className="space-y-1 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-space-400">Site ID:</span>
                  <span className="text-isro-cyan font-medium">{zone.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-space-400">Touchdown Area:</span>
                  <span className="text-white font-medium">{zone.areaM2.toLocaleString()} m²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-space-400">Footprint:</span>
                  <span className="text-space-200">{zone.widthM}m × {zone.heightM}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-space-400">Mean Slope:</span>
                  <span className="text-isro-emerald font-semibold">{zone.meanSlopeDeg}° (≤10°)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-space-400">Hazard Margin:</span>
                  <span className="text-space-200">{zone.clearanceMarginM}m buffer</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-space-400">Grid Center:</span>
                  <span className="text-space-300">[{zone.centerGrid[0]}, {zone.centerGrid[1]}]</span>
                </div>
              </div>

              {/* Mini Footprint Geometric Visualizer (object-contain, bounded) */}
              <div className="w-full h-12 rounded bg-space-950 border border-space-700/60 p-1 flex items-center justify-center relative overflow-hidden">
                <svg className="w-full h-full max-h-12 object-contain" viewBox="0 0 160 40">
                  <rect x="5" y="5" width="150" height="30" rx="3" fill="none" stroke="rgba(56, 189, 248, 0.2)" strokeDasharray="3 3" />
                  <ellipse cx="80" cy="20" rx="35" ry="12" fill={isPrimary ? "rgba(16, 185, 129, 0.2)" : "rgba(56, 189, 248, 0.15)"} stroke={isPrimary ? "#10B981" : "#38BDF8"} strokeWidth="1.5" />
                  <circle cx="80" cy="20" r="2.5" fill="#FFFFFF" />
                  <text x="80" y="36" fill="#94A3B8" fontSize="8" textAnchor="middle" fontFamily="monospace">
                    {zone.widthM}m × {zone.heightM}m FOOTPRINT
                  </text>
                </svg>
              </div>

              <div className="pt-2 border-t border-space-700/60 flex items-center justify-between text-[10px] font-mono text-space-400">
                <span>{zone.cellCount} connected 24m cells</span>
                {isPrimary && (
                  <span className="text-isro-emerald font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>OPTIMAL</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
