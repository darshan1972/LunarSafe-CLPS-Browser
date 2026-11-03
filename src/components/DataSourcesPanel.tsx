import React from 'react';
import {
  Globe,
  ExternalLink,
  RefreshCw,
  Satellite,
  Compass,
  Layers,
} from 'lucide-react';
import { DataSourceStatus } from '../types';

interface DataSourcesPanelProps {
  nasaStatus: DataSourceStatus | null;
  isroStatus?: DataSourceStatus | null;
  onRefreshNasa: () => Promise<void>;
  isRefreshingNasa: boolean;
  pds4Metadata?: any;
}

const DataSourcesPanelComponent: React.FC<DataSourcesPanelProps> = ({
  nasaStatus,
  onRefreshNasa,
  isRefreshingNasa,
}) => {
  return (
    <div className="bg-space-800 rounded-lg border border-space-700 p-4 space-y-3.5 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-space-700 pb-2.5">
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-wide uppercase font-mono text-white">
            NASA Planetary Data Connections
          </h2>
        </div>
        <span className="text-[10px] bg-cyan-950/80 text-cyan-300 px-2 py-0.5 rounded font-mono border border-cyan-800/60 font-semibold">
          NASA PDS • LRO LOLA
        </span>
      </div>

      {/* 1. NASA PDS SEARCH API */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-white">
              NASA Planetary Data System (PDS Search API)
            </span>
          </div>

          <button
            type="button"
            onClick={onRefreshNasa}
            disabled={isRefreshingNasa}
            className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-mono rounded bg-space-750 hover:bg-space-700 border border-space-600 text-cyan-300 transition-colors cursor-pointer disabled:opacity-50"
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
              className="text-cyan-400 hover:underline flex items-center space-x-1"
            >
              <span>pds.nasa.gov/api/search/1/products</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="flex justify-between">
            <span className="text-space-400">Connection Status:</span>
            <span className={nasaStatus?.status === 'ONLINE' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
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
            <span className="text-cyan-400">q=(pds:Target_Identification.pds:name eq &quot;Moon&quot;)</span>
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
                        className="text-cyan-400 hover:underline flex items-center space-x-1 text-[10px]"
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

      {/* 2. NASA LRO LOLA POLAR TOPOGRAPHY SOURCE */}
      <div className="p-3 rounded bg-space-850 border border-space-750 space-y-2 text-xs font-mono">
        <div className="flex items-center justify-between border-b border-space-750 pb-1.5">
          <div className="flex items-center space-x-1.5 text-cyan-300">
            <Satellite className="w-3.5 h-3.5" />
            <span className="font-bold uppercase text-[11px]">NASA LRO LOLA Topography</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/40">
            80S_80M DEM
          </span>
        </div>

        <div className="space-y-1.5 text-[11px]">
          <div className="flex justify-between">
            <span className="text-space-400">Dataset:</span>
            <span className="text-white font-medium">LOLA GDR 80S_80M</span>
          </div>
          <div className="flex justify-between">
            <span className="text-space-400">Coverage:</span>
            <span className="text-white">80°S – 90°S (Lunar South Pole)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-space-400">Resolution:</span>
            <span className="text-white">80 meters / pixel DEM</span>
          </div>
          <div className="flex justify-between">
            <span className="text-space-400">Source:</span>
            <a
              href="https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:underline flex items-center space-x-1"
            >
              <span>NASA PDS Geosciences</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </div>

      {/* 3. NASA ARTEMIS III CANDIDATE REGION CATALOG */}
      <div className="p-3 rounded bg-zinc-900 border border-zinc-800 space-y-2 text-xs font-mono">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-white">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold uppercase text-[11px]">NASA Artemis III Regions</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 font-bold">
            13 Candidate Sites
          </span>
        </div>
        <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
          Autonomous safety analysis evaluated across all 13 NASA Artemis III candidate landing regions using LRO LOLA elevation data and Horn slope topology algorithms.
        </p>
      </div>

      {/* 4. ACTIVE LOCAL NASA DATASETS */}
      <div className="p-3 rounded bg-space-850 border border-space-750 space-y-2 text-xs font-mono">
        <div className="flex items-center justify-between border-b border-space-750 pb-1.5">
          <div className="flex items-center space-x-1.5 text-cyan-300">
            <Layers className="w-3.5 h-3.5" />
            <span className="font-bold uppercase text-[11px]">NASA Topography Assets</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-semibold">
            100% INTEGRATED
          </span>
        </div>
        <div className="space-y-1 text-[10px] text-zinc-300">
          <div className="flex justify-between items-center py-0.5 border-b border-white/5">
            <span className="text-zinc-400">DEM Heightmap (80S_80M):</span>
            <span className="text-emerald-400 font-bold font-mono">dem_heightmap.png</span>
          </div>
          <div className="flex justify-between items-center py-0.5 border-b border-white/5">
            <span className="text-zinc-400">Horn Finite-Diff Slope:</span>
            <span className="text-emerald-400 font-bold font-mono">slope_texture.png</span>
          </div>
          <div className="flex justify-between items-center py-0.5 border-b border-white/5">
            <span className="text-zinc-400">RMS Regolith Roughness:</span>
            <span className="text-emerald-400 font-bold font-mono">roughness_texture.png</span>
          </div>
          <div className="flex justify-between items-center py-0.5">
            <span className="text-zinc-400">Artemis III GeoJSON Catalog:</span>
            <span className="text-emerald-400 font-bold font-mono">A3_Named_regions.geojson</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DataSourcesPanel = React.memo(DataSourcesPanelComponent);
