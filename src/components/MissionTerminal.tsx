import React, { useRef, useEffect } from 'react';
import { Terminal, Trash2, CheckCircle2, AlertTriangle, AlertOctagon, Info } from 'lucide-react';
import { MissionLog } from '../types';

interface MissionTerminalProps {
  logs: MissionLog[];
  onClearLogs?: () => void;
  isStreaming?: boolean;
}

const MissionTerminalComponent: React.FC<MissionTerminalProps> = ({
  logs,
  onClearLogs,
  isStreaming,
}) => {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [logs.length]);

  const getLevelBadge = (level: MissionLog['level']) => {
    switch (level) {
      case 'SUCCESS':
        return (
          <span className="text-isro-emerald flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>[SUCCESS]</span>
          </span>
        );
      case 'WARN':
        return (
          <span className="text-isro-amber flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3" />
            <span>[WARN]</span>
          </span>
        );
      case 'HAZARD':
        return (
          <span className="text-isro-crimson flex items-center space-x-1">
            <AlertOctagon className="w-3 h-3" />
            <span>[HAZARD]</span>
          </span>
        );
      default:
        return (
          <span className="text-isro-cyan flex items-center space-x-1">
            <Info className="w-3 h-3" />
            <span>[INFO]</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-space-800 rounded-lg border border-space-700 overflow-hidden flex flex-col h-full shadow-lg">
      {/* Header */}
      <div className="border-b border-space-700 bg-space-850 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-isro-cyan" />
          <h2 className="text-xs font-bold uppercase font-mono tracking-wider text-white">
            Mission Terminal (Live Telemetry)
          </h2>
          {isStreaming && (
            <span className="w-2 h-2 rounded-full bg-isro-emerald animate-ping" />
          )}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono text-space-400">
            {logs.length} EVENTS
          </span>
          {onClearLogs && (
            <button
              type="button"
              onClick={onClearLogs}
              className="p-1 rounded hover:bg-space-750 text-space-400 hover:text-white"
              title="Clear Terminal"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Terminal logs body */}
      <div className="flex-1 bg-space-950 p-3 font-mono text-[11px] overflow-y-auto space-y-1.5 max-h-72 min-h-[160px]">
        {logs.length === 0 ? (
          <div className="text-space-500 italic py-4 text-center">
            Mission terminal standby. Ingest lunar imagery to stream pipeline telemetry.
          </div>
        ) : (
          logs.map(log => (
            <div key={log.id} className="flex items-start space-x-2 leading-relaxed">
              <span className="text-space-500 shrink-0 select-none">
                {log.timestamp.substring(11, 19)}
              </span>
              <div className="shrink-0 font-semibold">{getLevelBadge(log.level)}</div>
              <span className="text-space-400 shrink-0 font-medium">[{log.module}]:</span>
              <span className="text-space-200 break-all">{log.message}</span>
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
};

export const MissionTerminal = React.memo(MissionTerminalComponent);
