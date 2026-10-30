import React, { useState } from 'react';
import {
  Globe,
  ExternalLink,
  RefreshCw,
  Lock,
  FileCode,
} from 'lucide-react';
import { DataSourceStatus } from '../types';
import { IsroPradanConnector } from '../lib/isroPradanParser';

interface DataSourcesPanelProps {
  nasaStatus: DataSourceStatus | null;
  isroStatus: DataSourceStatus | null;
  onRefreshNasa: () => Promise<void>;
  isRefreshingNasa: boolean;
  pds4Metadata?: any;
}

const DataSourcesPanelComponent: React.FC<DataSourcesPanelProps> = ({
  nasaStatus,
  isroStatus,
  onRefreshNasa,
  isRefreshingNasa,
  pds4Metadata,
}) => {
  const [activeTab, setActiveTab] = useState<'nasa' | 'isro'>('nasa');

  return (
    <div className="bg-space-800 rounded-lg border border-space-700 p-4 space-y-3.5 shadow-lg">
      <div className="flex items-center justify-between border-b border-space-700 pb-2.5">
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-isro-cyan" />
          <h2 className="text-sm font-semibold tracking-wide uppercase font-mono text-white">
            Planetary Data Connections
          </h2>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center space-x-1 bg-space-850 p-0.5 rounded border border-space-750 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('nasa')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'nasa'
                ? 'bg-space-750 text-white font-semibold'
                : 'text-space-400 hover:text-white'
            }`}
          >
            NASA PDS (LIVE)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('isro')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'isro'
                ? 'bg-space-750 text-white font-semibold'
                : 'text-space-400 hover:text-white'
            }`}
          >
            ISRO PRADAN (PORTAL)
          </button>
        </div>
      </div>

      {/* NASA PDS TAB */}
      {activeTab === 'nasa' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-isro-emerald animate-pulse" />
              <span className="text-xs font-mono font-bold text-white">
                NASA Planetary Data System (PDS Search API)
              </span>
            </div>

            <button
              type="button"
              onClick={onRefreshNasa}
              disabled={isRefreshingNasa}
              className="flex items-center space-x-1 px-2 py-1 text-[11px] font-mono rounded bg-space-750 hover:bg-space-700 border border-space-600 text-isro-cyan transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshingNasa ? 'animate-spin' : ''}`} />
              <span>{isRefreshingNasa ? 'QUERYING...' : 'PING API'}</span>
            </button>
          </div>

          <div className="bg-space-850 rounded border border-space-750 p-3 space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-space-400">Endpoint:</span>
              <a
                href="https://pds.nasa.gov/api/search/1/products"
                target="_blank"
                rel="noreferrer"
                className="text-isro-cyan hover:underline flex items-center space-x-1"
              >
                <span>pds.nasa.gov/api/search/1/products</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex justify-between">
              <span className="text-space-400">Connection Status:</span>
              <span className={nasaStatus?.status === 'ONLINE' ? 'text-isro-emerald font-semibold' : 'text-isro-amber font-semibold'}>
                {nasaStatus?.status === 'ONLINE' ? 'CONNECTED (HTTP 200 OK)' : 'STANDBY'}
              </span>
            </div>
            {nasaStatus?.latencyMs && (
              <div className="flex justify-between">
                <span className="text-space-400">Query Latency:</span>
                <span className="text-space-200">{nasaStatus.latencyMs} ms</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-space-400">Target Query:</span>
              <span className="text-isro-cyan">q=(pds:Target_Identification.pds:name eq "Moon")</span>
            </div>
          </div>

          {/* Sample live products from NASA PDS */}
          {nasaStatus?.sampleProducts && nasaStatus.sampleProducts.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono text-space-400">
                LIVE OBSERVATIONAL PRODUCTS RETRIEVED:
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto divide-y divide-space-800 bg-space-850 rounded border border-space-750 p-2 text-xs font-mono">
                {nasaStatus.sampleProducts.map(p => (
                  <div key={p.id} className="pt-1.5 first:pt-0 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-space-200 truncate max-w-[280px]">
                        {p.title}
                      </span>
                      {p.url && (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-isro-cyan hover:underline flex items-center space-x-1 text-[10px]"
                        >
                          <span>PDS4 Data</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                    <div className="text-[10px] text-space-400 flex space-x-2">
                      <span>Inst: {p.instrument}</span>
                      {p.time && <span>Time: {p.time.substring(0, 10)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ISRO PRADAN TAB */}
      {activeTab === 'isro' && (
        <div className="space-y-3 text-xs font-mono">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-isro-orange" />
              <span className="font-bold text-white">
                ISRO PRADAN (Chandrayaan-2 Data Archive)
              </span>
            </div>
            {isroStatus && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-space-850 border border-isro-orange/40 text-isro-orange">
                {isroStatus.status.replace(/_/g, ' ')}
              </span>
            )}
          </div>

          {/* Honest Feasibility Notice */}
          <div className="p-3 rounded bg-space-850 border border-space-750 space-y-2">
            <div className="flex items-start space-x-2 text-isro-amber">
              <Lock className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">ISRO ISSDC Authentication Policy:</span>
                <p className="text-[11px] text-space-300 font-sans mt-0.5">
                  PRADAN requires manual Single Sign-On (SSO) authentication. ISRO does not provide an open, unauthenticated public search REST API. Direct portal access and authentic PDS4 label ingestion are supported below. Strictly no simulated feeds.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-space-750 flex flex-wrap gap-2">
              <a
                href={IsroPradanConnector.PORTAL_URL}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded bg-space-750 hover:bg-space-700 border border-space-600 text-isro-cyan flex items-center space-x-1.5 transition-colors"
              >
                <span>Launch ISRO PRADAN Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href={IsroPradanConnector.ISSDC_HOME}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded bg-space-750 hover:bg-space-700 border border-space-600 text-space-300 flex items-center space-x-1.5 transition-colors"
              >
                <span>ISSDC Mission Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Real Chandrayaan-2 Data Volume Metrics */}
          <div className="p-3 rounded bg-zinc-900 border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white uppercase text-[11px] tracking-wider font-mono">
                Chandrayaan-2 Data Volume Metrics
              </span>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 text-[10px] font-bold font-mono">
                19+ Terabytes
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center pt-0.5">
              <div className="bg-black/60 p-2 rounded border border-zinc-800">
                <div className="text-[10px] text-zinc-400 font-mono">DFSAR (Radar)</div>
                <div className="text-xs font-bold text-white mt-0.5 font-mono">1,400–1,500+</div>
                <div className="text-[9px] text-zinc-500">Datasets / Polar Mosaics</div>
              </div>
              <div className="bg-black/60 p-2 rounded border border-zinc-800">
                <div className="text-[10px] text-zinc-400 font-mono">TMC-2 (Camera)</div>
                <div className="text-xs font-bold text-white mt-0.5 font-mono">~4,000,000 km²</div>
                <div className="text-[9px] text-zinc-500">5m Stereo 3D DEMs</div>
              </div>
              <div className="bg-black/60 p-2 rounded border border-zinc-800">
                <div className="text-[10px] text-zinc-400 font-mono">OHRC (High-Res)</div>
                <div className="text-xs font-bold text-white mt-0.5 font-mono">1,056+ km²</div>
                <div className="text-[9px] text-zinc-500">0.25m Landing Swaths</div>
              </div>
            </div>
            <p className="text-[10px] text-zinc-400 font-sans leading-relaxed pt-1.5 border-t border-zinc-800">
              The Chandrayaan-2 orbiter continues active operations with regular releases via the Indian Space Science Data Centre (ISDA), including late 2025 dual-frequency radar mosaics. Authenticated users can bulk-download PDS4 bundles from PRADAN and ingest them directly into LunarSafe.
            </p>
          </div>

          {/* Sample ISRO Products */}
          {isroStatus?.sampleProducts && isroStatus.sampleProducts.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono text-zinc-400">
                CERTIFIED ISRO PRADAN DATA PRODUCTS:
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto divide-y divide-zinc-800 bg-zinc-900 rounded border border-zinc-800 p-2 text-xs font-mono">
                {isroStatus.sampleProducts.map(p => (
                  <div key={p.id} className="pt-1.5 first:pt-0 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-200 truncate max-w-[280px]">
                        {p.title}
                      </span>
                      {p.url && (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-zinc-300 hover:text-white hover:underline flex items-center space-x-1 text-[10px]"
                        >
                          <span>PRADAN</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-500 flex space-x-2">
                      <span>{p.instrument}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PDS4 Label Metadata Display if loaded */}
          {pds4Metadata && (
            <div className="p-3 rounded bg-space-850 border border-space-750 space-y-1.5">
              <div className="flex items-center space-x-1.5 text-isro-emerald">
                <FileCode className="w-4 h-4" />
                <span className="font-bold">PARSED CHANDRAYAAN-2 PDS4 XML:</span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-space-400">Instrument:</span>
                  <span className="text-white">{pds4Metadata.instrumentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-space-400">Observation Start:</span>
                  <span className="text-isro-cyan">{pds4Metadata.startDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-space-400">Target Body:</span>
                  <span className="text-white">{pds4Metadata.targetName}</span>
                </div>
                {pds4Metadata.lines && (
                  <div className="flex justify-between">
                    <span className="text-space-400">Dimensions:</span>
                    <span>{pds4Metadata.lines} lines × {pds4Metadata.samples} samples</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const DataSourcesPanel = React.memo(DataSourcesPanelComponent);
