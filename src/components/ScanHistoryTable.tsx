/**
 * LunarSafe Mission Software — Scan History & Recommendation Table Component
 * Team Rocket · AEROX Club · Parul University · Project Head: Darshan Patil
 */

import React, { useEffect, useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  Clock,
  ShieldCheck,
  AlertTriangle,
  XOctagon,
  Trash2,
} from 'lucide-react';
import { ScanRecord } from '../lib/scanRecord';
import * as scanStore from '../lib/scanStore';
import { generatePDF, generateCSV, generateJSON } from '../lib/scanReportGenerator';

export const ScanHistoryTable: React.FC = () => {
  const [scans, setScans] = useState<ScanRecord[]>([]);

  useEffect(() => {
    // Subscribe to scanStore updates
    const unsubscribe = scanStore.subscribe(updatedScans => {
      setScans(updatedScans);
    });
    return () => unsubscribe();
  }, []);

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownloadPDF = (scan: ScanRecord) => {
    const blob = generatePDF(scan, scan.multiMethodInput);
    triggerDownload(blob, `LunarSafe_Report_${scan.id}.pdf`);
  };

  const handleDownloadCSV = (scan: ScanRecord) => {
    const blob = generateCSV(scan);
    triggerDownload(blob, `LunarSafe_Telemetry_${scan.id}.csv`);
  };

  const handleDownloadJSON = (scan: ScanRecord) => {
    const blob = generateJSON(scan);
    triggerDownload(blob, `LunarSafe_Telemetry_${scan.id}.json`);
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="w-full bg-space-900 border border-space-700 rounded-xl p-6 shadow-2xl space-y-5" data-testid="scan-history-table">
      {/* Formal Aerospace Letterhead */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-space-700 pb-4 gap-3">
        <div>
          <div className="flex items-center space-x-2 text-isro-orange font-mono text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-isro-orange" />
            <span>Team Rocket · AEROX Club · Parul University</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-wide font-sans mt-0.5">
            📋 Scan History & Flight Recommendations
          </h2>
          <div className="text-xs text-space-400 font-mono mt-0.5">
            Project Head: <span className="text-white font-semibold">Darshan Patil</span> &nbsp;|&nbsp; Standard: <span className="text-cyan-400">ISRO Chandrayaan-3 LHDAC</span>
          </div>
        </div>

        {scans.length > 0 && (
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono text-space-400 bg-space-800 px-2.5 py-1 rounded border border-space-700">
              Total Logged: <strong className="text-white">{scans.length}</strong> / 50
            </span>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Clear all logged scan history?')) {
                  scanStore.clearAllScans();
                }
              }}
              className="text-xs text-space-400 hover:text-red-400 p-1.5 rounded hover:bg-space-800 transition-colors flex items-center space-x-1"
              title="Clear all scans"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-mono">Clear</span>
            </button>
          </div>
        )}
      </div>

      {/* Table Content */}
      {scans.length === 0 ? (
        <div className="py-12 text-center text-space-400 font-mono text-sm border border-dashed border-space-700 rounded-lg bg-space-850">
          <Clock className="w-8 h-8 text-space-500 mx-auto mb-2 opacity-50" />
          <p>No scans yet.</p>
          <p className="text-xs text-space-500 mt-1">
            Run an analysis from the Mission Ingestion panel above to record and evaluate landing telemetry.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-space-700 rounded-lg">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-space-800 text-space-300 uppercase tracking-wider border-b border-space-700">
              <tr>
                <th className="px-3 py-3">Scan Time</th>
                <th className="px-3 py-3">Instrument</th>
                <th className="px-3 py-3">GSD</th>
                <th className="px-3 py-3">Mean Slope</th>
                <th className="px-3 py-3">Max Slope</th>
                <th className="px-3 py-3">Craters</th>
                <th className="px-3 py-3">Boulders</th>
                <th className="px-3 py-3">Safe %</th>
                <th className="px-3 py-3">Recommendation</th>
                <th className="px-3 py-3">Confidence</th>
                <th className="px-3 py-3 text-center">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-space-800 bg-space-850">
              {scans.map((scan) => {
                const isSafe = scan.recommendation === 'SAFE';
                const isCaution = scan.recommendation === 'CAUTION';
                const isUnsafe = scan.recommendation === 'UNSAFE';

                const recBadgeClass = isSafe
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : isCaution
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-red-500/15 text-red-400 border border-red-500/30';

                const confBadgeClass =
                  scan.confidence === 'HIGH'
                    ? 'text-cyan-300 bg-cyan-900/30 border border-cyan-700/40'
                    : scan.confidence === 'MEDIUM'
                    ? 'text-yellow-300 bg-yellow-900/30 border border-yellow-700/40'
                    : 'text-zinc-400 bg-zinc-800/40 border border-zinc-700/40';

                return (
                  <tr key={scan.id} className="hover:bg-space-800/60 transition-colors">
                    <td className="px-3 py-3 text-space-200 whitespace-nowrap">
                      {formatTimestamp(scan.timestamp)}
                    </td>
                    <td className="px-3 py-3 text-white font-semibold whitespace-nowrap">
                      {scan.instrument}
                    </td>
                    <td className="px-3 py-3 text-space-300 whitespace-nowrap">
                      {scan.gsdMetersPerPixel} m/px
                    </td>
                    <td className="px-3 py-3 text-space-200">
                      {scan.meanSlopeDeg.toFixed(2)}°
                    </td>
                    <td className="px-3 py-3 text-space-200">
                      {scan.maxSlopeDeg.toFixed(2)}°
                    </td>
                    <td className="px-3 py-3 text-space-300">
                      {scan.craterCount}
                    </td>
                    <td className="px-3 py-3 text-space-300">
                      {scan.boulderCount}
                    </td>
                    <td className="px-3 py-3 font-semibold text-white">
                      {scan.safeAreaPercentage.toFixed(1)}%
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${recBadgeClass}`}>
                        {isSafe && <ShieldCheck className="w-3 h-3 mr-1" />}
                        {isCaution && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {isUnsafe && <XOctagon className="w-3 h-3 mr-1" />}
                        {scan.recommendation}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${confBadgeClass}`}>
                        {scan.confidence}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleDownloadPDF(scan)}
                          className="px-2 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/50 rounded flex items-center space-x-1 transition-all hover:scale-105 active:scale-95"
                          title="Download Official 2-Page PDF Mission Report"
                        >
                          <FileText className="w-3 h-3" />
                          <span>PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadCSV(scan)}
                          className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 rounded flex items-center space-x-1 transition-all hover:scale-105 active:scale-95"
                          title="Download CSV Telemetry Record"
                        >
                          <FileSpreadsheet className="w-3 h-3" />
                          <span>CSV</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadJSON(scan)}
                          className="px-2 py-1 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-700/50 rounded flex items-center space-x-1 transition-all hover:scale-105 active:scale-95"
                          title="Download Full JSON Telemetry"
                        >
                          <FileCode className="w-3 h-3" />
                          <span>JSON</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
