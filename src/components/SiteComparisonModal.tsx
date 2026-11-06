import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Trophy,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Sun,
  Layers,
  ArrowUpDown,
  Download,
} from 'lucide-react';
import { ARTEMIS_III_SITES, ArtemisSite, computeLunarSafeScore } from '../data/artemisSitesData';

export interface SiteComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  tolerance: number;
  onSelectSite?: (site: any, slope: number) => void;
  selectedSiteName?: string;
}

const SiteComparisonModalComponent: React.FC<SiteComparisonModalProps> = ({
  isOpen,
  onClose,
  tolerance,
  onSelectSite,
  selectedSiteName,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'slope' | 'lighting' | 'name'>('score');
  const [sortAsc, setSortAsc] = useState(false);
  const [geoSites, setGeoSites] = useState<ArtemisSite[]>(ARTEMIS_III_SITES);

  // Dynamically load and parse official NASA Artemis III GeoJSON catalog
  useEffect(() => {
    fetch('/data/A3_Named_regions.geojson')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.features) && data.features.length > 0) {
          const parsed: ArtemisSite[] = data.features.map((f: any) => ({
            id: f.id || f.properties?.code || `A3-${Math.random()}`,
            name: f.properties?.name || 'Unnamed Region',
            code: f.properties?.code || '',
            latitude: f.properties?.latitude ?? f.geometry?.coordinates?.[1] ?? -88,
            longitude: f.properties?.longitude ?? f.geometry?.coordinates?.[0] ?? 0,
            elevation_m: f.properties?.elevation_m ?? 0,
            clps_mission: f.properties?.clps_mission || 'CLPS Polar Explorer',
            primary_target: f.properties?.primary_target || 'Candidate Landing Zone',
            lighting_pct: f.properties?.lighting_pct !== undefined ? Number(f.properties.lighting_pct) : undefined,
            base_slope_deg: f.properties?.base_slope_deg ?? 7.0,
            roughness_index: f.properties?.roughness_index ?? 0.28,
            description: f.properties?.description || '',
            earth_comm: f.properties?.earth_comm !== undefined ? Boolean(f.properties.earth_comm) : undefined,
          }));
          setGeoSites(parsed);
        }
      })
      .catch(() => {});
  }, []);

  // Compute live scores and ranks based on active lander slope tolerance
  const rankedSites = useMemo(() => {
    const list = geoSites.map((site) => {
      const score = computeLunarSafeScore(site.base_slope_deg, tolerance);
      const isSafe = site.base_slope_deg <= tolerance;
      return {
        ...site,
        score,
        isSafe,
      };
    });

    // Default rank by score descending
    list.sort((a, b) => b.score - a.score);
    const withRank = list.map((s, idx) => ({ ...s, rank: idx + 1 }));

    // Apply active sort
    withRank.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'score') cmp = b.score - a.score;
      else if (sortBy === 'slope') cmp = a.base_slope_deg - b.base_slope_deg;
      else if (sortBy === 'lighting') cmp = (b.lighting_pct ?? -1) - (a.lighting_pct ?? -1);
      else if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      return sortAsc ? -cmp : cmp;
    });

    return withRank;
  }, [geoSites, tolerance, sortBy, sortAsc]);

  const filteredSites = useMemo(() => {
    if (!searchTerm.trim()) return rankedSites;
    const q = searchTerm.toLowerCase();
    return rankedSites.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.clps_mission.toLowerCase().includes(q)
    );
  }, [rankedSites, searchTerm]);

  const stats = useMemo(() => {
    const safeCount = rankedSites.filter((s) => s.isSafe).length;
    const topSite = rankedSites[0];
    const avgSlope = (
      rankedSites.reduce((acc, s) => acc + s.base_slope_deg, 0) / rankedSites.length
    ).toFixed(1);
    return {
      total: rankedSites.length,
      safeCount,
      hazardCount: rankedSites.length - safeCount,
      topSiteName: topSite ? topSite.name : 'N/A',
      avgSlope,
    };
  }, [rankedSites]);

  const handleExportCsv = () => {
    const headers = [
      'Rank',
      'Site Name',
      'Code',
      'Latitude',
      'Longitude',
      'Elevation (m)',
      'Sampled Slope (deg)',
      'Lander Tolerance (deg)',
      'Relative Safety Index (heuristic)',
      'Lighting (%)',
      'Earth Comm Visibility',
      'Roughness Index',
      'Touchdown Status',
      'CLPS Target Mission',
    ];

    const rows = rankedSites.map((s) => [
      s.rank,
      `"${s.name}"`,
      s.code,
      s.latitude,
      s.longitude,
      s.elevation_m,
      s.base_slope_deg,
      tolerance,
      s.score,
      s.lighting_pct !== undefined ? s.lighting_pct : 'n/a',
      s.earth_comm !== undefined ? (s.earth_comm ? 'YES' : 'NO') : 'n/a',
      s.roughness_index,
      s.isSafe ? 'VERIFIED_SAFE' : 'LIMIT_EXCEEDED',
      `"${s.clps_mission}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NASA_CLPS_Site_Ranking_Matrix_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelect = (site: ArtemisSite) => {
    if (onSelectSite) {
      // Create GeoJSON-like feature envelope
      const feature = {
        type: 'Feature',
        id: site.id,
        properties: {
          ...site,
        },
        geometry: {
          type: 'Point',
          coordinates: [site.longitude, site.latitude],
        },
      };
      onSelectSite(feature, site.base_slope_deg);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn font-mono">
      <div className="bg-space-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-space-850/80 flex items-start justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 mt-0.5 shadow-inner">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-semibold">
                  NASA CLPS Mission Decision Matrix
                </span>
                <span className="px-2 py-0.2 rounded text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 font-bold">
                  100% DETERMINISTIC PHYSICS
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Artemis III Candidate Sites Multi-Ranking
              </h2>
              <p className="text-xs text-zinc-400 font-sans mt-0.5">
                Comparative ranking across all 13 South Pole regions calibrated for lander tolerance: ≤{' '}
                <span className="text-amber-300 font-bold font-mono">{tolerance.toFixed(1)}°</span>.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close ranking matrix"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Metrics Bar */}
        <div className="px-4 py-3 bg-space-950/60 border-b border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
            <span className="text-[10px] text-zinc-400 block">Total Evaluated Sites:</span>
            <span className="text-sm font-bold text-white">{stats.total} Candidate Regions</span>
          </div>
          <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
            <span className="text-[10px] text-zinc-400 block">Permissible Touchdown Zones:</span>
            <span className="text-sm font-bold text-emerald-400">
              {stats.safeCount} Safe / {stats.hazardCount} Exceeded
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
            <span className="text-[10px] text-zinc-400 block">Top Touchdown Target:</span>
            <span className="text-sm font-bold text-cyan-300 truncate block" title={stats.topSiteName}>
              {stats.topSiteName}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
            <span className="text-[10px] text-zinc-400 block">Mean South Pole Slope:</span>
            <span className="text-sm font-bold text-amber-300">{stats.avgSlope}°</span>
          </div>
        </div>

        {/* Action Controls & Search */}
        <div className="p-3 sm:px-5 sm:py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search Artemis region or CLPS mission..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-600 text-xs font-semibold transition-all shadow-sm"
              title="Download ranked matrix as CSV"
            >
              <Download className="w-3.5 h-3.5 text-zinc-300" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-4 sm:p-5">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[11px] text-zinc-400 uppercase tracking-wider">
                <th className="pb-2.5 pl-2">Rank</th>
                <th
                  onClick={() => {
                    if (sortBy === 'name') setSortAsc(!sortAsc);
                    else {
                      setSortBy('name');
                      setSortAsc(false);
                    }
                  }}
                  className="pb-2.5 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Region Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => {
                    if (sortBy === 'slope') setSortAsc(!sortAsc);
                    else {
                      setSortBy('slope');
                      setSortAsc(true);
                    }
                  }}
                  className="pb-2.5 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Sampled Slope</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => {
                    if (sortBy === 'score') setSortAsc(!sortAsc);
                    else {
                      setSortBy('score');
                      setSortAsc(false);
                    }
                  }}
                  className="pb-2.5 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Relative Safety Index (heuristic)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => {
                    if (sortBy === 'lighting') setSortAsc(!sortAsc);
                    else {
                      setSortBy('lighting');
                      setSortAsc(false);
                    }
                  }}
                  className="pb-2.5 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Lighting %</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="pb-2.5">Earth Comm</th>
                <th className="pb-2.5 hidden sm:table-cell">Roughness</th>
                <th className="pb-2.5">Status</th>
                <th className="pb-2.5 text-right pr-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans text-xs">
              {filteredSites.map((site) => {
                const isSelected = selectedSiteName === site.name;
                return (
                  <tr
                    key={site.id}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-cyan-950/40 border-l-2 border-cyan-400'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <td className="py-3 pl-2 font-mono">
                      {site.rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-400 text-black font-bold text-[10px]">
                          1
                        </span>
                      ) : site.rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-zinc-300 text-black font-bold text-[10px]">
                          2
                        </span>
                      ) : site.rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-700 text-white font-bold text-[10px]">
                          3
                        </span>
                      ) : (
                        <span className="text-zinc-500 font-mono text-xs">#{site.rank}</span>
                      )}
                    </td>
                    <td className="py-3 pr-2">
                      <div className="font-bold text-white text-xs tracking-wide font-mono">
                        {site.name}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {site.latitude.toFixed(2)}°S, {site.longitude.toFixed(2)}°E • {site.elevation_m}m
                      </div>
                      <div className="text-[10px] text-zinc-500 truncate max-w-xs" title={site.clps_mission}>
                        {site.clps_mission}
                      </div>
                    </td>
                    <td className="py-3 pr-2 font-mono font-bold text-xs">
                      <span className={site.base_slope_deg <= tolerance ? 'text-emerald-300' : 'text-red-300'}>
                        {site.base_slope_deg.toFixed(1)}°
                      </span>
                    </td>
                    <td className="py-3 pr-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-mono font-bold text-xs ${
                            site.isSafe ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {site.score}
                        </span>
                        <div className="w-16 h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/10 hidden md:block">
                          <div
                            style={{ width: `${Math.max(5, Math.min(100, site.score))}%` }}
                            className={`h-full rounded-full ${
                              site.isSafe ? 'bg-emerald-400' : 'bg-red-500'
                            }`}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-2 font-mono text-xs text-amber-300">
                      {site.lighting_pct !== undefined ? (
                        <div className="flex items-center gap-1">
                          <Sun className="w-3 h-3 text-amber-400" />
                          <span>{site.lighting_pct.toFixed(1)}%</span>
                        </div>
                      ) : (
                        <span className="text-zinc-500 font-normal">n/a</span>
                      )}
                    </td>
                    <td className="py-3 pr-2 font-mono text-xs">
                      {site.earth_comm !== undefined ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                            site.earth_comm
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                              : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/50'
                          }`}
                        >
                          {site.earth_comm ? 'YES' : 'NO'}
                        </span>
                      ) : (
                        <span className="text-zinc-500 font-normal">n/a</span>
                      )}
                    </td>
                    <td className="py-3 pr-2 font-mono text-[11px] text-zinc-400 hidden sm:table-cell">
                      <div className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-zinc-500" />
                        <span>{site.roughness_index.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          site.isSafe
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                            : 'bg-red-950/60 text-red-300 border-red-500/40'
                        }`}
                      >
                        {site.isSafe ? (
                          <>
                            <ShieldCheck className="w-3 h-3" />
                            <span>SAFE</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3" />
                            <span>LIMIT</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 pr-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleSelect(site)}
                        className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
                          isSelected
                            ? 'bg-cyan-500 text-black shadow-sm'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                        title="Focus this region on 3D Moon"
                      >
                        <div className="flex items-center gap-1">
                          <span>{isSelected ? 'Active' : 'Focus'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 sm:px-5 bg-space-850 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>FIPS 180-4 Deterministic Safety Assessment • NASA Artemis III Candidate Regions</span>
          </div>
          <span>Team Rocket • NASA Space Apps Challenge 2026</span>
        </div>
      </div>
    </div>
  );
};

export const SiteComparisonModal = React.memo(SiteComparisonModalComponent);
