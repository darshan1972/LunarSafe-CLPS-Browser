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
  cachedNasaStatus?: DataSourceStatus | null;
  isroStatus?: DataSourceStatus | null;
  onRefreshNasa: () => Promise<void>;
  isRefreshingNasa: boolean;
  pds4Metadata?: any;
}

function getFailureLabel(status: DataSourceStatus): string {
  if (status.status === 'TIMED_OUT') return 'TIMED OUT';
  if (status.status === 'HTTP_ERROR' && status.httpStatus) return `HTTP ${status.httpStatus}`;
  return 'OFFLINE';
}

function renderCatalogResults(statusData: DataSourceStatus, isCached: boolean) {
  const products = statusData.sampleProducts || [];
  const totalCount = (statusData.productCount ?? products.length).toLocaleString('en-US');
  const firstProduct = products[0];
  const verifiedTime = statusData.lastChecked
    ? statusData.lastChecked.replace('T', ' ').substring(0, 19) + ' UTC'
    : 'unknown';

  return (
    <div
      className={`space-y-2 rounded border p-2.5 text-xs font-mono ${
        isCached
          ? 'border-amber-700/60 bg-amber-950/20'
          : 'border-space-750 bg-space-850/60'
      }`}
    >
      <div className={`text-[11px] font-bold ${isCached ? 'text-amber-300' : 'text-space-300'}`}>
        {isCached
          ? `CACHED (not live) - last verified ${verifiedTime}`
          : 'LIVE OBSERVATIONAL PRODUCTS RETRIEVED:'}
      </div>

      <div className="text-[11px] text-space-200 leading-snug">
        NASA reports <span className="text-cyan-300 font-semibold">{totalCount}</span> products whose target is the Moon (any mission); showing the first{' '}
        <span className="text-cyan-300 font-semibold">{products.length}</span>.
      </div>

      {firstProduct && (
        <div className="rounded bg-space-900/90 border border-space-700 p-2 space-y-1 text-[10px]">
          <div className="text-space-400 uppercase font-semibold">First Returned Product:</div>
          <div className="text-white font-semibold break-words">{firstProduct.title}</div>
          <div className="text-space-300 break-all">
            <span className="text-space-400">ID:</span> {firstProduct.id}
          </div>
          {firstProduct.mission && (
            <div className="text-cyan-300">
              <span className="text-space-400">Mission:</span> {firstProduct.mission}
            </div>
          )}
        </div>
      )}

      {products.length > 0 && (
        <div className="space-y-1 max-h-36 overflow-y-auto divide-y divide-space-800 bg-space-900/60 rounded border border-space-750 p-2 text-xs font-mono">
          {products.map(p => (
            <div key={p.id} className="pt-1.5 first:pt-0 space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-space-200 truncate max-w-[260px]" title={p.title}>
                  {p.title}
                </span>
                {p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline flex items-center space-x-1 text-[10px] shrink-0"
                  >
                    <span>PDS4 Data</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
              <div className="text-[10px] text-space-400 flex flex-wrap gap-x-2">
                {p.mission && <span>Mission: {p.mission}</span>}
                {p.instrument && <span>Inst: {p.instrument}</span>}
                {p.time && <span>Time: {p.time.substring(0, 10)}</span>}
              </div>
              <div className="text-[9px] text-space-500 truncate" title={p.id}>
                ID: {p.id}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const DataSourcesPanelComponent: React.FC<DataSourcesPanelProps> = ({
  nasaStatus,
  cachedNasaStatus,
  onRefreshNasa,
  isRefreshingNasa,
}) => {
  const isOnline = nasaStatus?.status === 'ONLINE' || nasaStatus?.status === 'CONNECTED';
  const isFailure = nasaStatus !== null && !isOnline && !isRefreshingNasa;
  const failureLabel = isFailure && nasaStatus ? getFailureLabel(nasaStatus) : null;

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
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isRefreshingNasa
                  ? 'bg-cyan-400 animate-pulse'
                  : isOnline
                  ? 'bg-emerald-400 animate-pulse'
                  : isFailure
                  ? 'bg-red-500'
                  : 'bg-zinc-500'
              }`}
            />
            <span className="text-xs font-mono font-bold text-white">
              NASA Planetary Data System (PDS Search API — Catalog Metadata Only)
            </span>
          </div>

          <button
            type="button"
            onClick={onRefreshNasa}
            disabled={isRefreshingNasa}
            className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-mono rounded bg-space-750 hover:bg-space-700 border border-space-600 text-cyan-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshingNasa ? 'animate-spin' : ''}`} />
            <span>{isRefreshingNasa ? 'PINGING...' : 'PING API'}</span>
          </button>
        </div>

        <p className="text-[10px] text-zinc-400 font-sans leading-snug bg-space-900/50 border border-space-750 rounded px-2.5 py-1.5">
          <strong className="text-zinc-300 font-mono">Catalog Metadata Only:</strong> Live catalog query - informational. It does not feed the safety score, hazard calculations, or the 3D map (those use bundled NASA LOLA files).
        </p>

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
            <span
              className={
                isRefreshingNasa
                  ? 'text-cyan-300 font-semibold'
                  : isOnline
                  ? 'text-emerald-400 font-semibold'
                  : isFailure
                  ? 'text-red-400 font-semibold'
                  : 'text-zinc-400 font-semibold'
              }
            >
              {isRefreshingNasa
                ? 'PINGING...'
                : isOnline
                ? `CONNECTED (HTTP ${nasaStatus?.httpStatus || 200} OK)`
                : failureLabel
                ? failureLabel
                : 'NOT CHECKED'}
            </span>
          </div>
          {nasaStatus?.latencyMs !== undefined && (
            <div className="flex justify-between">
              <span className="text-space-400">Query Latency:</span>
              <span className="text-space-200">{nasaStatus.latencyMs} ms</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-space-400">Target Query:</span>
            <span className="text-cyan-400">q=(pds:Target_Identification.pds:name eq &quot;Moon&quot;)</span>
          </div>
          {isFailure && (nasaStatus?.error || nasaStatus?.notice) && (
            <div className="text-[10px] text-red-300 bg-red-950/50 p-2 rounded border border-red-800/70 leading-snug break-words">
              <span className="font-bold text-red-400">{failureLabel}:</span>{' '}
              {nasaStatus.error || nasaStatus.notice}
            </div>
          )}
        </div>

        {/* Live products when ONLINE */}
        {isOnline && nasaStatus && renderCatalogResults(nasaStatus, false)}

        {/* Cached last ONLINE result shown after a failure */}
        {isFailure && cachedNasaStatus && renderCatalogResults(cachedNasaStatus, true)}
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
