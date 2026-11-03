import React from 'react';
import {
  Cpu,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { ModuleExecutionState } from '../types';

interface ModuleStatusPanelProps {
  modules: ModuleExecutionState[];
  isProcessing: boolean;
  onRunGeminiVision?: () => void;
  onRunGeminiNarrative?: () => void;
  geminiVisionRunning?: boolean;
  geminiNarrativeRunning?: boolean;
}

const ModuleStatusPanelComponent: React.FC<ModuleStatusPanelProps> = ({
  modules,
  isProcessing,
  onRunGeminiVision,
  onRunGeminiNarrative,
  geminiVisionRunning,
  geminiNarrativeRunning,
}) => {
  const deterministicModules = modules.filter(m => m.group === 'deterministic');
  const geminiModules = modules.filter(m => m.group === 'gemini');

  const renderStatusBadge = (status: ModuleExecutionState['status'], timingMs: number) => {
    switch (status) {
      case 'DONE':
        return (
          <div className="flex items-center space-x-1.5 text-emerald-400 font-mono text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="font-semibold">DONE</span>
            <span className="text-space-400">({timingMs}ms)</span>
          </div>
        );
      case 'ACTIVE':
        return (
          <div className="flex items-center space-x-1.5 text-amber-400 font-mono text-[11px] animate-pulse">
            <Activity className="w-3.5 h-3.5 animate-spin" />
            <span className="font-bold">ACTIVE</span>
          </div>
        );
      case 'REJECTED':
        return (
          <div className="flex items-center space-x-1.5 text-red-400 font-mono text-[11px]">
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="font-bold">REJECTED</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-1.5 text-space-500 font-mono text-[11px]">
            <Clock className="w-3.5 h-3.5" />
            <span>STANDBY</span>
          </div>
        );
    }
  };

  return (
    <div className="bg-space-800 rounded-lg border border-space-700 p-4 space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-space-700 pb-2.5">
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
            Pipeline Modules & Execution States
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-space-850 border border-space-700 text-space-300">
          STRICT DETERMINISM
        </span>
      </div>

      {/* GROUP 1: Deterministic Computer Vision Engine (No AI Claim) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-xs font-bold font-mono tracking-wide text-space-200 uppercase">
              Group 1: Deterministic CV Engine (Zero AI Claim)
            </span>
          </div>
          <span className="text-[10px] font-mono text-space-400">
            {deterministicModules.filter(m => m.status === 'DONE').length}/{deterministicModules.length} EXECUTED
          </span>
        </div>

        <div className="space-y-1.5">
          {deterministicModules.map(mod => (
            <div
              key={mod.id}
              className="p-2 rounded bg-space-850 border border-space-750 flex flex-col space-y-1 text-xs transition-colors hover:border-space-600"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-space-100">{mod.name}</span>
                {renderStatusBadge(mod.status, mod.timingMs)}
              </div>
              <p className="text-[11px] text-space-400 line-clamp-1">{mod.description}</p>
              {mod.details && (
                <div className="text-[10px] font-mono text-cyan-300/90 bg-space-900/60 px-1.5 py-0.5 rounded border border-space-750 inline-block">
                  {mod.details}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* GROUP 2: Real Gemini AI Modules (Scoped & Transparent) */}
      <div className="pt-2 border-t border-space-700 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs font-bold font-mono tracking-wide text-space-200 uppercase">
              Group 2: Scoped Gemini AI Modules (No Number Inventions)
            </span>
          </div>
          <span className="text-[10px] font-mono text-space-400">
            {geminiModules.filter(m => m.status === 'DONE').length}/{geminiModules.length} EXECUTED
          </span>
        </div>

        <div className="space-y-2">
          {/* Module 2.1: Gemini Vision Terrain Validation */}
          <div className="p-2.5 rounded bg-space-850 border border-space-750 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-space-100 flex items-center space-x-1.5">
                  <span>AI-Assisted Mission Validation</span>
                  <span className="text-[10px] font-mono px-1 rounded bg-space-750 text-cyan-400 border border-space-700">
                    GEMINI VISION
                  </span>
                </div>
                <p className="text-[11px] text-space-400 pt-0.5">
                  Validates authentic lunar surface morphology vs terrestrial imagery. Strictly does NOT calculate slopes or hazard stats.
                </p>
              </div>
              <button
                type="button"
                onClick={onRunGeminiVision}
                disabled={isProcessing || geminiVisionRunning}
                className="px-2.5 py-1 text-[11px] font-mono rounded bg-space-750 hover:bg-space-700 border border-space-600 text-cyan-400 shrink-0 disabled:opacity-50"
              >
                {geminiVisionRunning ? 'ANALYZING...' : 'Run Gemini Validation'}
              </button>
            </div>
          </div>

          {/* Module 2.2: Gemini Mission Narrative Generator */}
          <div className="p-2.5 rounded bg-space-850 border border-space-750 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-space-100 flex items-center space-x-1.5">
                  <span>AI Narrative Generator</span>
                  <span className="text-[10px] font-mono px-1 rounded bg-space-750 text-orange-400 border border-space-700">
                    GEMINI FLASH
                  </span>
                </div>
                <p className="text-[11px] text-space-400 pt-0.5">
                  Synthesizes already-computed deterministic CV numbers into a plain English landing briefing. Never invents or estimates numbers.
                </p>
              </div>
              <button
                type="button"
                onClick={onRunGeminiNarrative}
                disabled={isProcessing || geminiNarrativeRunning}
                className="px-2.5 py-1 text-[11px] font-mono rounded bg-space-750 hover:bg-space-700 border border-space-600 text-orange-400 shrink-0 disabled:opacity-50"
              >
                {geminiNarrativeRunning ? 'GENERATING...' : 'BRIEFING'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ModuleStatusPanel = React.memo(ModuleStatusPanelComponent);
