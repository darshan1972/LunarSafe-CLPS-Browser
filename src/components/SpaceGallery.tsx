import React, { useState, useMemo } from 'react';
import {
  SPACE_GALLERY_DATA,
  SpaceGalleryItem,
} from '../data/spaceGalleryData';
import {
  Search,
  Filter,
  ExternalLink,
  ShieldCheck,
  Compass,
  Layers,
  Info,
  X,
  Satellite,
  Globe,
  Sparkles,
  ArrowRight,
  Database,
  CheckCircle2,
  Maximize2,
} from 'lucide-react';

interface SpaceGalleryProps {
  onAnalyzeItem?: (item: SpaceGalleryItem) => void;
  onBackToAnalyzer?: () => void;
}

export const SpaceGallery: React.FC<SpaceGalleryProps> = ({
  onAnalyzeItem,
  onBackToAnalyzer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgency, setSelectedAgency] = useState<'ALL' | 'ISRO' | 'NASA' | 'JOINT'>('ALL');
  const [selectedMission, setSelectedMission] = useState<string>('ALL');
  const [activeModalItem, setActiveModalItem] = useState<SpaceGalleryItem | null>(null);

  // Filter items based on agency, mission, and search query
  const filteredItems = useMemo(() => {
    return SPACE_GALLERY_DATA.filter((item) => {
      // Agency Filter
      if (selectedAgency === 'ISRO' && item.agency !== 'ISRO') return false;
      if (selectedAgency === 'NASA' && item.agency !== 'NASA') return false;
      if (selectedAgency === 'JOINT' && item.agency !== 'JOINT_ISRO_NASA') return false;

      // Mission Filter
      if (selectedMission !== 'ALL' && item.mission !== selectedMission) return false;

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = item.title.toLowerCase().includes(q);
        const inTarget = item.targetRegion.toLowerCase().includes(q);
        const inInstrument = item.instrument.toLowerCase().includes(q);
        const inDesc = item.description.toLowerCase().includes(q);
        const inFeatures = item.technicalDetails.geologicalFeatures.some(f => f.toLowerCase().includes(q));
        const inCoord = item.lunarCoordinates
          ? `${item.lunarCoordinates.lat} ${item.lunarCoordinates.lng}`.toLowerCase().includes(q)
          : false;

        if (!inTitle && !inTarget && !inInstrument && !inDesc && !inFeatures && !inCoord) {
          return false;
        }
      }

      return true;
    });
  }, [searchQuery, selectedAgency, selectedMission]);

  // Unique mission list for dropdown
  const missionList = useMemo(() => {
    const set = new Set<string>();
    SPACE_GALLERY_DATA.forEach((item) => set.add(item.mission));
    return Array.from(set);
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner: Gallery Title, Quick Return, and Legal Compliance Notice */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-zinc-900 text-zinc-300 border border-zinc-700">
                ISRO PRADAN & ISSDC
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-zinc-900 text-zinc-300 border border-zinc-700">
                NASA PDS ARCHIVE
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-zinc-900 text-zinc-300 border border-zinc-700">
                PUBLIC DOMAIN / OPEN SCIENCE
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-2 font-mono">
              OFFICIAL LUNAR EXPLORATION SPACE GALLERY
            </h1>
            <p className="text-sm text-zinc-400 max-w-3xl mt-1">
              Curated repository of authentic planetary surface imagery acquired by Indian Space Research Organisation (ISRO)
              and National Aeronautics and Space Administration (NASA) lunar missions. Every image includes official catalog
              identifiers, physical ground sampling resolution, selenographic coordinates, and direct ingestion into the LunarSafe
              deterministic hazard evaluation engine.
            </p>
          </div>

          {onBackToAnalyzer && (
            <button
              type="button"
              onClick={onBackToAnalyzer}
              className="self-start md:self-center px-4 py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-black border border-white font-mono text-xs font-bold transition-all flex items-center space-x-2 shrink-0 shadow-sm"
            >
              <span>RETURN TO HAZARD ANALYZER</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Legal Access & Archival Policy Disclosure */}
        <div className="mt-4 pt-3 border-t border-zinc-800 flex items-start space-x-3 text-xs text-zinc-400 font-mono">
          <ShieldCheck className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-zinc-200">Legal Access & Archival Compliance:</strong> Lunar imagery is sourced formally under
            the <span className="text-white">NASA Open Access Guidelines (17 U.S.C. § 105 - Works of the United States Government)</span> and
            the <span className="text-white">ISRO Open Science & National Data Sharing and Accessibility Policy (NDSAP, Govt. of India)</span> via
            ISSDC PRADAN. Images are authentic lunar telemetry and orbital swaths intended for scientific research, educational analysis, and autonomous hazard assessment.
          </p>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by crater, coordinates (e.g. 69.37°S), instrument, mineralogy..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-black border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white font-mono"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Agency Filter Tabs */}
        <div className="flex items-center rounded-lg bg-black border border-zinc-800 p-1 text-xs font-mono">
          <button
            type="button"
            onClick={() => setSelectedAgency('ALL')}
            className={`px-3 py-1.5 rounded transition-all font-semibold ${
              selectedAgency === 'ALL'
                ? 'bg-white text-black font-bold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            ALL AGENCIES
          </button>
          <button
            type="button"
            onClick={() => setSelectedAgency('ISRO')}
            className={`px-3 py-1.5 rounded transition-all font-semibold flex items-center space-x-1.5 ${
              selectedAgency === 'ISRO'
                ? 'bg-white text-black font-bold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>ISRO</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedAgency('NASA')}
            className={`px-3 py-1.5 rounded transition-all font-semibold flex items-center space-x-1.5 ${
              selectedAgency === 'NASA'
                ? 'bg-white text-black font-bold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>NASA</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedAgency('JOINT')}
            className={`px-3 py-1.5 rounded transition-all font-semibold ${
              selectedAgency === 'JOINT'
                ? 'bg-white text-black font-bold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            JOINT
          </button>
        </div>

        {/* Mission Filter Dropdown */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <Filter className="w-4 h-4 text-zinc-400" />
          <select
            value={selectedMission}
            onChange={(e) => setSelectedMission(e.target.value)}
            className="px-3 py-2 rounded-lg bg-black border border-zinc-800 text-zinc-300 text-xs font-mono focus:outline-none focus:border-white cursor-pointer"
          >
            <option value="ALL">All Space Missions ({SPACE_GALLERY_DATA.length})</option>
            {missionList.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Result Counter */}
        <div className="text-xs font-mono text-zinc-400">
          Showing <span className="text-white font-bold">{filteredItems.length}</span> of{' '}
          <span className="text-white">{SPACE_GALLERY_DATA.length}</span> Records
        </div>
      </div>

      {/* Gallery Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredItems.map((item) => {
          const isIsro = item.agency === 'ISRO';
          const isNasa = item.agency === 'NASA';

          return (
            <div
              key={item.id}
              className="group bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl overflow-hidden shadow-lg transition-all duration-300 flex flex-col hover:-translate-y-1"
            >
              {/* Image Preview Container */}
              <div className="relative aspect-4/3 bg-black overflow-hidden cursor-pointer" onClick={() => setActiveModalItem(item)}>
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  onError={(e) => {
                    if (item.localFallbackUrl) {
                      e.currentTarget.src = item.localFallbackUrl;
                    }
                  }}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

                {/* Badges on Top of Image */}
                <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border border-zinc-700 bg-zinc-900/90 text-white shadow-sm flex items-center space-x-1">
                    {isIsro && <Satellite className="w-3 h-3 text-white" />}
                    {isNasa && <Globe className="w-3 h-3 text-white" />}
                    <span>{item.agency.replace('_', ' ')}</span>
                  </span>

                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-black/80 text-zinc-300 border border-zinc-800 backdrop-blur-sm">
                    {item.mission}
                  </span>
                </div>

                {/* Resolution Badge */}
                <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/90 text-zinc-200 border border-zinc-800 backdrop-blur-sm z-10">
                  {item.resolution}
                </div>

                {/* Maximizer Icon */}
                <div className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/80 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                  <Maximize2 className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <h3
                    className="text-sm font-bold text-white group-hover:text-zinc-300 transition-colors line-clamp-2 leading-snug cursor-pointer"
                    onClick={() => setActiveModalItem(item)}
                  >
                    {item.title}
                  </h3>

                  {/* Coordinates & Target Region */}
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex items-center space-x-1.5 text-zinc-400">
                      <Compass className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">{item.targetRegion}</span>
                    </div>

                    {item.lunarCoordinates && (
                      <div className="flex items-center space-x-1.5 text-zinc-300 pl-5">
                        <span className="text-white font-semibold">
                          {item.lunarCoordinates.lat}, {item.lunarCoordinates.lng}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Short Description */}
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Geological Feature Pills */}
                <div className="pt-2 border-t border-zinc-800 space-y-2.5">
                  <div className="flex flex-wrap gap-1">
                    {item.technicalDetails.geologicalFeatures.slice(0, 2).map((feat, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-900 text-zinc-300 border border-zinc-800"
                      >
                        {feat}
                      </span>
                    ))}
                    {item.technicalDetails.geologicalFeatures.length > 2 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-900 text-zinc-500">
                        +{item.technicalDetails.geologicalFeatures.length - 2}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveModalItem(item)}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-mono font-medium transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <Info className="w-3.5 h-3.5 text-zinc-400" />
                      <span>DEEP SPECS</span>
                    </button>

                    {item.canAnalyzeInEngine && onAnalyzeItem && (
                      <button
                        type="button"
                        onClick={() => onAnalyzeItem(item)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black border border-white text-xs font-mono font-bold transition-all flex items-center justify-center space-x-1.5 shadow-sm"
                        title="Load directly into 24m hazard pipeline"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>ANALYZE</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-12 text-center space-y-3">
          <Database className="w-10 h-10 text-zinc-600 mx-auto" />
          <h4 className="text-base font-bold text-white font-mono">No Matching Planetary Imagery Found</h4>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Try adjusting your search query or switching filters to view other lunar orbit passes or surface photographs.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedAgency('ALL');
              setSelectedMission('ALL');
            }}
            className="px-4 py-2 rounded-lg bg-zinc-900 text-zinc-200 border border-zinc-700 text-xs font-mono hover:text-white"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Deep Details & Technical Specifications Modal */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="sticky top-0 bg-black/95 backdrop-blur-sm border-b border-zinc-800 p-5 flex items-center justify-between z-20">
              <div className="space-y-1 pr-4">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border border-zinc-700 bg-zinc-900 text-white">
                    {activeModalItem.agency.replace('_', ' ')}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-900 text-zinc-300 border border-zinc-800">
                    {activeModalItem.mission}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-900 text-white border border-zinc-800">
                    {activeModalItem.resolution}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white font-mono leading-tight">
                  {activeModalItem.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setActiveModalItem(null)}
                className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-1">
              {/* Image Banner */}
              <div className="relative rounded-xl overflow-hidden bg-black border border-zinc-800 max-h-[380px] flex items-center justify-center">
                <img
                  src={activeModalItem.imageUrl}
                  alt={activeModalItem.title}
                  onError={(e) => {
                    if (activeModalItem.localFallbackUrl) {
                      e.currentTarget.src = activeModalItem.localFallbackUrl;
                    }
                  }}
                  className="w-full h-full max-h-[380px] object-contain"
                />
                <div className="absolute bottom-3 left-3 px-3 py-1 rounded bg-black/90 border border-zinc-800 text-xs font-mono text-zinc-300 backdrop-blur-sm">
                  Acquired: <span className="text-white">{activeModalItem.acquisitionDate}</span> | Instrument:{' '}
                  <span className="text-white font-bold">{activeModalItem.instrument}</span>
                </div>
              </div>

              {/* Primary Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Mission Observation Summary
                </h4>
                <p className="text-sm text-zinc-200 leading-relaxed font-sans">
                  {activeModalItem.description}
                </p>
              </div>

              {/* Scientific & Engineering Significance */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-mono font-bold text-white uppercase">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Scientific & Planetary Landing Significance</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {activeModalItem.technicalDetails.missionSignificance}
                </p>
              </div>

              {/* Technical Specifications Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-zinc-400" />
                  <span>Telemetry & Sensor Specifications</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                    <span className="text-zinc-400 text-[11px]">TARGET REGION</span>
                    <div className="text-white font-semibold">{activeModalItem.targetRegion}</div>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                    <span className="text-zinc-400 text-[11px]">SELENOGRAPHIC COORDINATES</span>
                    <div className="text-white font-semibold">
                      {activeModalItem.lunarCoordinates
                        ? `${activeModalItem.lunarCoordinates.lat}, ${activeModalItem.lunarCoordinates.lng}`
                        : 'Global / Wide Swath'}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                    <span className="text-zinc-400 text-[11px]">INSTRUMENT & SENSOR ARCHITECTURE</span>
                    <div className="text-white">{activeModalItem.instrument}</div>
                    <div className="text-zinc-400 text-[11px]">{activeModalItem.technicalDetails.sensorType}</div>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                    <span className="text-zinc-400 text-[11px]">SPECTRAL BAND & ILLUMINATION</span>
                    <div className="text-white">{activeModalItem.technicalDetails.spectralBand || 'Panchromatic'}</div>
                    {activeModalItem.technicalDetails.solarZenithAngle && (
                      <div className="text-zinc-400 text-[11px]">Solar Zenith: {activeModalItem.technicalDetails.solarZenithAngle}</div>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                    <span className="text-zinc-400 text-[11px]">ALTITUDE / PROXIMITY</span>
                    <div className="text-white">
                      {activeModalItem.technicalDetails.altitudeKm !== undefined
                        ? activeModalItem.technicalDetails.altitudeKm < 1
                          ? `${activeModalItem.technicalDetails.altitudeKm * 1000} m surface proximity`
                          : `${activeModalItem.technicalDetails.altitudeKm} km polar orbit`
                        : 'Lunar Orbit'}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                    <span className="text-zinc-400 text-[11px]">
                      {activeModalItem.agency === 'ISRO' ? 'CATALOG REGISTRATION STATUS' : 'PRODUCT REGISTRATION IDENTIFIER'}
                    </span>
                    <div className="text-white font-medium text-xs leading-snug">
                      {activeModalItem.pdsId || activeModalItem.nasaId || activeModalItem.isroReleaseId || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Observed Geological Features & Hazards */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Identified Geomorphological Features
                </h4>
                <div className="flex flex-wrap gap-2">
                  {activeModalItem.technicalDetails.geologicalFeatures.map((feat, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md text-xs font-mono bg-zinc-900 text-zinc-200 border border-zinc-800 flex items-center space-x-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      <span>{feat}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Legal Access & Rights Declaration Box */}
              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-mono font-bold text-white">
                    <ShieldCheck className="w-4 h-4 text-white" />
                    <span>FORMAL LEGAL ACCESS & ARCHIVE CITATION</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-200 border border-zinc-700">
                    {activeModalItem.licensing.status === 'PUBLIC_DOMAIN' ? 'PUBLIC DOMAIN' : 'OPEN SCIENCE ACCESS'}
                  </span>
                </div>

                <p className="text-xs text-zinc-300 font-mono leading-relaxed">
                  {activeModalItem.licensing.legalCitation}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono">
                  <a
                    href={activeModalItem.officialSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white underline hover:text-zinc-300 flex items-center space-x-1 font-semibold"
                  >
                    <span>View Official Agency Catalog Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <span className="text-zinc-600">•</span>
                  <a
                    href={activeModalItem.licensing.termsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-400 hover:text-white flex items-center space-x-1"
                  >
                    <span>License / Terms of Use</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="sticky bottom-0 bg-black/95 backdrop-blur-sm border-t border-zinc-800 p-4 flex items-center justify-end gap-3 z-20">
              <button
                type="button"
                onClick={() => setActiveModalItem(null)}
                className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono font-medium transition-colors"
              >
                Close
              </button>

              {activeModalItem.canAnalyzeInEngine && onAnalyzeItem && (
                <button
                  type="button"
                  onClick={() => {
                    const item = activeModalItem;
                    setActiveModalItem(null);
                    onAnalyzeItem(item);
                  }}
                  className="px-5 py-2 rounded-lg bg-white text-black hover:bg-zinc-200 font-mono text-xs font-bold transition-all shadow-md flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>LOAD & ANALYZE IN HAZARD ENGINE</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
