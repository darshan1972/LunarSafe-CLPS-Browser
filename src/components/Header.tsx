import React, { useState, useEffect } from 'react';
import {
  Shield,
  Satellite,
  Image as ImageIcon,
  BookOpen,
  Bot,
  Briefcase,
  Info,
} from 'lucide-react';
import { DataSourceStatus } from '../types';

export type AppViewMode = 'CLPS_BROWSER' | 'ANALYZER' | 'GALLERY' | 'DOSSIER';

interface HeaderProps {
  nasaStatus?: DataSourceStatus;
  isroStatus?: DataSourceStatus;
  isProcessing?: boolean;
  currentView?: AppViewMode;
  onSelectView?: (view: AppViewMode) => void;
  galleryItemCount?: number;
  onOpenAgentOm?: () => void;
  onOpenSpaceBag?: () => void;
  onAiBenchmarkClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  nasaStatus: _nasaStatus,
  isroStatus: _isroStatus,
  isProcessing: _isProcessing = false,
  currentView = 'CLPS_BROWSER',
  onSelectView,
  galleryItemCount = 16,
  onOpenAgentOm,
  onOpenSpaceBag,
  onAiBenchmarkClick,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-space-700 bg-space-850 px-4 lg:px-6 py-2.5 sticky top-0 z-50 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand & Mission Title */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-black border border-slate-800 shadow-inner">
            <Satellite className="w-5 h-5 text-isro-cyan" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-isro-emerald animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base lg:text-lg font-bold tracking-wider font-mono text-white">
                LUNAR<span className="text-zinc-400">SAFE</span>
              </span>
              <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-mono">
                CLPS MISSION BROWSER
              </span>
              <span className="hidden md:inline-flex px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded bg-zinc-900 text-zinc-300 border border-zinc-800 font-mono">
                NASA LRO • ISRO CH-2
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans hidden sm:block">
              NASA Space Apps Challenge 2026 • Commercial Lunar Payload Services Landing Site Telemetry
            </p>
          </div>
        </div>

        {/* Center-Left: Navigation View Switcher */}
        <div className="flex items-center rounded-lg bg-zinc-950 border border-zinc-800 p-1 font-mono text-xs shadow-inner">
          {/* CLPS MISSION BROWSER (PRIMARY DEFAULT VIEW) */}
          <button
            type="button"
            onClick={() => onSelectView?.('CLPS_BROWSER')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-all font-semibold ${
              currentView === 'CLPS_BROWSER'
                ? 'bg-isro-cyan text-black font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CLPS MISSION BROWSER</span>
            <span className="sm:hidden">CLPS</span>
            <span className="relative flex h-2 w-2 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </button>

          {/* HAZARD ANALYZER */}
          <button
            type="button"
            onClick={() => onSelectView?.('ANALYZER')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-all font-semibold ${
              currentView === 'ANALYZER'
                ? 'bg-white text-black font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden md:inline">HAZARD ANALYZER</span>
            <span className="md:hidden">ANALYZER</span>
          </button>

          {/* SPACE GALLERY */}
          <button
            type="button"
            onClick={() => onSelectView?.('GALLERY')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-all font-semibold ${
              currentView === 'GALLERY'
                ? 'bg-white text-black font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="hidden md:inline">SPACE GALLERY</span>
            <span className="md:hidden">GALLERY</span>
            <span className={`ml-1 px-1.5 py-0.2 rounded text-[10px] font-bold ${
              currentView === 'GALLERY' ? 'bg-zinc-800 text-white' : 'bg-zinc-900 text-zinc-300'
            }`}>
              {galleryItemCount}
            </span>
          </button>

          {/* SCIENCE DOSSIER */}
          <button
            type="button"
            onClick={() => onSelectView?.('DOSSIER')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-all font-semibold ${
              currentView === 'DOSSIER'
                ? 'bg-white text-black font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">SCIENCE DOSSIER</span>
            <span className="lg:hidden">DOSSIER</span>
          </button>

          {/* SPACE BAG */}
          {onOpenSpaceBag && (
            <button
              type="button"
              onClick={onOpenSpaceBag}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded transition-all font-semibold text-zinc-400 hover:text-white"
              title="Open Lunar Space Bag Repository & Scan History"
            >
              <Briefcase className="w-3.5 h-3.5 text-zinc-300" />
              <span>SPACE BAG</span>
            </button>
          )}
        </div>

        {/* Right: AI Benchmark, AGENT OM & UTC Telemetry Clock */}
        <div className="flex items-center space-x-3">
          {/* AI Cross-Validation: YOLOv5 (Active) Status Widget */}
          <div
            onClick={onAiBenchmarkClick}
            className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 hover:border-emerald-400 text-xs font-mono transition-all cursor-pointer shadow-sm group"
            title="Deterministic safety math. AI used for independent cross-validation."
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-zinc-300 font-semibold text-[11px]">
              AI Cross-Validation: <span className="text-emerald-400 font-bold">YOLOv5 (Active)</span>
            </span>
            <Info className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-300 transition-colors shrink-0" />
          </div>

          {/* Agent OM Co-Pilot Button */}
          {onOpenAgentOm && (
            <button
              type="button"
              onClick={onOpenAgentOm}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-white font-mono text-xs font-bold transition-all shadow-md active:scale-95"
              title="Ask Agent OM - Autonomous Planetary Science AI Co-Pilot"
            >
              <div className="relative flex items-center justify-center">
                <Bot className="w-4 h-4 text-cyan-400" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400" />
              </div>
              <span className="tracking-wide text-white">AGENT OM</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-cyan-400 text-black font-bold">
                AI
              </span>
            </button>
          )}

          {/* UTC Clock & Live Indicator */}
          <div className="hidden xl:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-black/60 border border-white/5 font-mono text-xs text-zinc-400">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{utcTime}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
