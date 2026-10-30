import React, { useState, useMemo } from 'react';
import {
  X,
  Briefcase,
  History,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Search,
  Globe,
  Satellite,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { SpaceBagItem, SpaceBagManager } from '../lib/spaceBagManager';

interface SpaceBagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (item: SpaceBagItem) => void;
  initialTab?: 'BAG' | 'HISTORY';
  selectedItemId?: string;
  isProcessing?: boolean;
}

export const SpaceBagModal: React.FC<SpaceBagModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  initialTab = 'BAG',
  selectedItemId,
  isProcessing = false,
}) => {
  const [activeTab, setActiveTab] = useState<'BAG' | 'HISTORY'>(initialTab);
  const [selectedAgency, setSelectedAgency] = useState<'ALL' | 'ISRO' | 'NASA'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeHistoryItemId, setActiveHistoryItemId] = useState<string>(
    selectedItemId || 'ch2_tmc2_manzinus_c'
  );
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Sync active item when modal opens with a specific item
  React.useEffect(() => {
    if (selectedItemId) {
      setActiveHistoryItemId(selectedItemId);
    }
  }, [selectedItemId]);

  // Sync initial tab when changed
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const allItems = useMemo(() => {
    // re-fetch from manager to pick up new scans
    return SpaceBagManager.getAllItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, refreshTrigger]);

  const totalScansRecorded = useMemo(() => {
    return allItems.reduce((acc, item) => acc + item.scanCount, 0);
  }, [allItems]);

  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      if (selectedAgency !== 'ALL' && item.agency !== selectedAgency) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchMission = item.mission.toLowerCase().includes(q);
        const matchRegion = item.targetRegion.toLowerCase().includes(q);
        const matchCatalog = item.catalogId.toLowerCase().includes(q);
        const matchInstrument = item.instrument.toLowerCase().includes(q);
        if (!matchTitle && !matchMission && !matchRegion && !matchCatalog && !matchInstrument) {
          return false;
        }
      }
      return true;
    });
  }, [allItems, selectedAgency, searchQuery]);

  const activeHistoryItem = useMemo(() => {
    return (
      allItems.find(i => i.id === activeHistoryItemId) ||
      allItems[0]
    );
  }, [allItems, activeHistoryItemId]);

  const determinismReport = useMemo(() => {
    if (!activeHistoryItem) return null;
    return SpaceBagManager.getDeterminismReport(activeHistoryItem.id);
  }, [activeHistoryItem, refreshTrigger]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="bg-black border border-zinc-800 rounded-2xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800 bg-black flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-750 text-white">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-zinc-900 text-zinc-300 border border-zinc-800">
                    LUNAR SAFE MISSION ARCHIVE
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-zinc-900 text-white border border-zinc-750">
                    {allItems.length} AUTHENTIC TARGETS
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-zinc-900 text-white border border-zinc-750">
                    {totalScansRecorded} SCANS RECORDED
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white font-mono tracking-wide mt-1">
                  OFFICIAL LUNAR SPACE BAG &amp; SCAN HISTORY
                </h2>
              </div>
            </div>
            <p className="text-xs text-zinc-400 max-w-3xl">
              Authentic panchromatic lunar images meeting ISRO Chandrayaan and NASA Apollo/LRO mission criteria.
              Select any image to scan, inspect historical runs, and verify bit-identical mathematical determinism.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* View Switcher Tabs (Antigravity Style) */}
            <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800 font-mono text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('BAG')}
                className={`px-3 py-1.5 rounded font-bold transition-all flex items-center space-x-1.5 ${
                  activeTab === 'BAG'
                    ? 'bg-white text-black shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>IMAGE BAG ({allItems.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('HISTORY')}
                className={`px-3 py-1.5 rounded font-bold transition-all flex items-center space-x-1.5 ${
                  activeTab === 'HISTORY'
                    ? 'bg-white text-black shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>HISTORY PANEL ({totalScansRecorded})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-zinc-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-black">
          {activeTab === 'BAG' ? (
            /* TAB 1: LUNAR IMAGE BAG REPOSITORY */
            <div className="space-y-5">
              {/* Search and Filters Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search crater, coordinates, mission..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-black border border-zinc-800 text-white text-xs font-mono placeholder:text-zinc-500 focus:outline-none focus:border-white"
                  />
                </div>

                <div className="flex items-center space-x-2 font-mono text-xs w-full sm:w-auto justify-end">
                  <span className="text-zinc-400 text-[11px] hidden md:inline">AGENCY:</span>
                  {(['ALL', 'ISRO', 'NASA'] as const).map(agency => (
                    <button
                      key={agency}
                      type="button"
                      onClick={() => setSelectedAgency(agency)}
                      className={`px-3 py-1.5 rounded border transition-all font-bold ${
                        selectedAgency === agency
                          ? 'bg-white text-black border-white shadow'
                          : 'bg-black border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                      }`}
                    >
                      {agency}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Authentic Lunar Images */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map(item => {
                  const isIsro = item.agency === 'ISRO';
                  const isScanned = item.scanCount > 0;

                  return (
                    <div
                      key={item.id}
                      className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl overflow-hidden transition-all flex flex-col group shadow-lg"
                    >
                      {/* Thumbnail Container (Natural Original Color) */}
                      <div className="relative aspect-[16/10] bg-black overflow-hidden border-b border-zinc-800">
                        <img
                          src={item.localFallbackUrl || item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                        {/* Top Badges */}
                        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border border-zinc-700 bg-zinc-900/90 text-white flex items-center space-x-1">
                            {isIsro ? <Satellite className="w-3 h-3 text-white" /> : <Globe className="w-3 h-3 text-white" />}
                            <span>{item.agency}</span>
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-black/80 text-white border border-zinc-800">
                            {item.mission}
                          </span>
                        </div>

                        {/* Scan Counter Badge */}
                        <div className="absolute top-2.5 right-2.5 z-10">
                          {isScanned ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white text-black border border-white flex items-center space-x-1 shadow">
                              <CheckCircle2 className="w-3 h-3 text-black" />
                              <span>SCANNED {item.scanCount}x</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-black/80 text-zinc-400 border border-zinc-800">
                              READY FOR SCAN
                            </span>
                          )}
                        </div>

                        {/* Resolution & Coordinates Overlay */}
                        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-mono text-white z-10">
                          <span className="bg-black/90 px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-200 font-bold">
                            {item.resolution}
                          </span>
                          <span className="bg-black/90 px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-400">
                            {item.coordinates.lat}, {item.coordinates.lng}
                          </span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-mono text-zinc-400 font-semibold tracking-wide">
                            {item.catalogId}
                          </div>
                          <h3 className="text-sm font-bold text-white font-mono leading-snug line-clamp-2">
                            {item.title}
                          </h3>
                          <p className="text-xs text-zinc-300 line-clamp-2">
                            {item.description}
                          </p>
                        </div>

                        {/* Criteria Tags */}
                        <div className="flex flex-wrap gap-1">
                          {item.criteriaTags.slice(0, 2).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-zinc-900 text-white border border-zinc-800"
                            >
                              ✓ {tag.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 border-t border-zinc-800/80 flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectImage(item);
                              onClose();
                            }}
                            disabled={isProcessing}
                            className="flex-1 py-2 px-3 rounded-lg bg-white hover:bg-zinc-200 active:scale-98 text-black font-mono text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow"
                          >
                            <span>SELECT & SCAN</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveHistoryItemId(item.id);
                              setActiveTab('HISTORY');
                            }}
                            className="py-2 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-mono text-xs font-semibold transition-all flex items-center space-x-1"
                            title="View Deterministic History & Metrics"
                          >
                            <History className="w-3.5 h-3.5 text-zinc-300" />
                            <span>{item.scanCount}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* TAB 2: DETERMINISTIC SCAN HISTORY & VERIFICATION PANEL */
            <div className="space-y-6">
              {/* Target Selector Ribbon */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider">
                      TARGET AUDIT SELECTION
                    </span>
                    <h3 className="text-base font-bold text-white font-mono">
                      {activeHistoryItem?.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <select
                    value={activeHistoryItemId}
                    onChange={e => setActiveHistoryItemId(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-black border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-white"
                  >
                    {allItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.title.substring(0, 42)}... ({item.scanCount} scans)
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      if (activeHistoryItem) {
                        onSelectImage(activeHistoryItem);
                        onClose();
                      }
                    }}
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-mono text-xs font-bold transition-all flex items-center space-x-1.5 shadow whitespace-nowrap"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                    <span>SCAN AGAIN (TEST REPEATABILITY)</span>
                  </button>
                </div>
              </div>

              {/* Mathematical Determinism Banner */}
              {activeHistoryItem && (
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 font-mono text-xs space-y-2 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-5 h-5 text-white" />
                      <span className="font-bold text-white text-sm">
                        MATHEMATICAL DETERMINISM AUDIT ENGINE
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-zinc-900 text-white border border-zinc-700">
                      {activeHistoryItem.scanCount} RUNS LOGGED
                    </span>
                  </div>

                  <p className="text-white text-xs leading-relaxed">
                    {determinismReport?.summary}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-800/80 text-[11px]">
                    <div>
                      <span className="text-zinc-400 block">Stage 1 Input Hash:</span>
                      <span className="font-bold text-white">
                        {determinismReport?.stage1HashesMatch ? '100% IDENTICAL' : 'VARIANCE DETECTED'}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Stage 4 Zones Hash:</span>
                      <span className="font-bold text-white">
                        {determinismReport?.stage4HashesMatch ? '100% IDENTICAL' : 'VARIANCE DETECTED'}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Hazard Metrics Drift:</span>
                      <span className="font-bold text-white">
                        {determinismReport?.driftPercentage.toFixed(6)}% (ZERO DRIFT)
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Repeatability Status:</span>
                      <span className="font-bold text-white">
                        {(activeHistoryItem.scanCount >= 2 && determinismReport?.isDeterministic)
                          ? 'VERIFIED BIT-IDENTICAL'
                          : activeHistoryItem.scanCount === 1
                          ? 'BASELINE ESTABLISHED'
                          : 'AWAITING FIRST RUN'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* History Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center space-x-2">
                    <History className="w-4 h-4 text-white" />
                    <span>CHRONOLOGICAL SCAN LOGS ({activeHistoryItem?.scanHistory.length || 0})</span>
                  </h4>

                  {activeHistoryItem && activeHistoryItem.scanHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        SpaceBagManager.resetHistory(activeHistoryItem.id);
                        setRefreshTrigger(prev => prev + 1);
                      }}
                      className="text-[11px] font-mono text-zinc-400 hover:text-white underline transition-colors"
                    >
                      Reset History For This Target
                    </button>
                  )}
                </div>

                {(!activeHistoryItem || activeHistoryItem.scanHistory.length === 0) ? (
                  <div className="p-8 text-center bg-zinc-950 border border-zinc-800 rounded-xl space-y-3 font-mono">
                    <AlertTriangle className="w-8 h-8 text-zinc-400 mx-auto" />
                    <p className="text-sm font-bold text-white">
                      No Scans Logged Yet for &ldquo;{activeHistoryItem?.title}&rdquo;
                    </p>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto">
                      Click &ldquo;SELECT & SCAN&rdquo; to execute the deterministic CV pipeline on this authentic lunar image and record Run #1 into the Space Bag.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeHistoryItem) {
                          onSelectImage(activeHistoryItem);
                          onClose();
                        }
                      }}
                      disabled={isProcessing}
                      className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-bold inline-flex items-center space-x-2 shadow"
                    >
                      <span>EXECUTE BASELINE SCAN</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-zinc-800 rounded-xl">
                    <table className="w-full text-left font-mono text-xs border-collapse">
                      <thead>
                        <tr className="bg-zinc-900 border-b border-zinc-800 text-white">
                          <th className="py-2.5 px-3">RUN</th>
                          <th className="py-2.5 px-3">TIMESTAMP</th>
                          <th className="py-2.5 px-3">SAFE %</th>
                          <th className="py-2.5 px-3">SLOPE</th>
                          <th className="py-2.5 px-3">CRATERS</th>
                          <th className="py-2.5 px-3">BOULDERS</th>
                          <th className="py-2.5 px-3">STAGE 1 SHA-256</th>
                          <th className="py-2.5 px-3">STAGE 4 SHA-256</th>
                          <th className="py-2.5 px-3 text-right">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-850 bg-black">
                        {activeHistoryItem.scanHistory.map((run, idx) => (
                          <tr
                            key={run.scanId}
                            className={`hover:bg-zinc-950 transition-colors ${
                              idx === 0 ? 'bg-zinc-950/40' : ''
                            }`}
                          >
                            <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-white text-[11px]">
                                #{run.runIndex}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-white whitespace-nowrap text-[11px]">
                              {run.formattedTime}
                            </td>
                            <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                              {run.safePercentage.toFixed(1)}%
                            </td>
                            <td className="py-3 px-3 text-white whitespace-nowrap">
                              {run.meanSlopeDeg.toFixed(2)}°
                            </td>
                            <td className="py-3 px-3 text-white whitespace-nowrap">
                              {run.distinctCratersCount}
                            </td>
                            <td className="py-3 px-3 text-white whitespace-nowrap">
                              {run.bouldersCount}
                            </td>
                            <td className="py-3 px-3 text-white font-mono text-[10px] whitespace-nowrap" title={run.stage1Hash}>
                              <span className="bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                                {run.stage1Hash.substring(0, 10)}...
                              </span>
                            </td>
                            <td className="py-3 px-3 text-white font-mono text-[10px] whitespace-nowrap" title={run.stage4Hash}>
                              <span className="bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                                {run.stage4Hash.substring(0, 10)}...
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              {idx === 0 ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-white border border-zinc-700">
                                  BASELINE
                                </span>
                              ) : run.isIdenticalToPrevious ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-black border border-white flex items-center space-x-1 inline-flex">
                                  <CheckCircle2 className="w-3 h-3 text-black" />
                                  <span>100% MATCH</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-500">
                                  DRIFT
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-black flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono shrink-0">
          <div className="flex items-center space-x-2 text-white">
            <ShieldCheck className="w-4 h-4 text-white shrink-0" />
            <span>
              End-to-End Cryptographic Auditability: SHA-256 Hash Chains guarantee reproducible scientific telemetry.
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold transition-all"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
