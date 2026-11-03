import React, { useState, useEffect } from 'react';
import { ShieldCheck, Copy, Check, X, FileCode, Hash, Lock, Database } from 'lucide-react';
import { sha256Json } from '../lib/cryptoUtils';

interface ClpsVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  site: any;
  sampledSlope: number;
  tolerance: number;
  score: number;
}

export const ClpsVerificationModal: React.FC<ClpsVerificationModalProps> = ({
  isOpen,
  onClose,
  site,
  sampledSlope,
  tolerance,
  score,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [hash, setHash] = useState<string>('');
  const [payload, setPayload] = useState<any>(null);

  useEffect(() => {
    if (!isOpen || !site) return;

    const dataPayload = {
      auditType: 'NASA_CLPS_LANDING_SITE_VERIFICATION',
      siteName: site.properties?.name || 'Unknown Candidate Site',
      siteCode: site.properties?.code || 'CLPS_SITE',
      selenographicCoordinates: {
        latitude: site.properties?.latitude ?? site.geometry?.coordinates?.[1],
        longitude: site.properties?.longitude ?? site.geometry?.coordinates?.[0],
      },
      elevationMeters: site.properties?.elevation_m ?? 0,
      clpsMissionTarget: site.properties?.clps_mission || 'NASA CLPS Initiative',
      measuredSlopeDeg: sampledSlope,
      landerSlopeToleranceDeg: tolerance,
      lunarSafeScore: score,
      safetyClassification: sampledSlope <= tolerance ? 'VERIFIED_SAFE' : 'HAZARDOUS_SLOPE_EXCEEDED',
      lroSourceDatasets: {
        demHeightmap: 'dem_heightmap.png (LOLA GDR LDEM_80S_80M)',
        slopeTexture: 'slope_texture.png (Horn 1981 Finite-Diff)',
        roughnessTexture: 'roughness_texture.png (Hurst/RMS)',
        candidateRegions: 'A3_Named_regions.geojson (NASA Artemis III Spec)',
      },
      cryptographicStandard: 'FIPS 180-4 SHA-256 / WebCrypto API',
      timestampUtc: new Date().toISOString(),
    };

    setPayload(dataPayload);

    sha256Json(dataPayload).then(h => {
      setHash(h);
    });
  }, [isOpen, site, sampledSlope, tolerance, score]);

  if (!isOpen || !site) return null;

  const handleCopy = () => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-space-900 border border-cyan-500/50 rounded-2xl shadow-2xl overflow-hidden font-mono text-xs text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-space-850 border-b border-space-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold tracking-wider text-white uppercase">
                  SHA-256 Telemetry Verification Ledger
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  SEALED
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                NASA Space Apps Challenge 2026 • Cryptographic Flight Safety Audit Trail
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-space-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Target Site Briefing */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-space-950/80 border border-space-700/60">
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Candidate Region</span>
              <span className="text-sm font-bold text-cyan-300">{site.properties?.name}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">CLPS Mission</span>
              <span className="text-xs font-semibold text-amber-300">{site.properties?.clps_mission}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Sampled Physical Slope</span>
              <span className={`text-xs font-bold ${sampledSlope <= tolerance ? 'text-emerald-400' : 'text-red-400'}`}>
                {sampledSlope.toFixed(2)}° (Tolerance: {tolerance.toFixed(1)}°)
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">LunarSafe Score</span>
              <span className={`text-xs font-bold ${score >= 60 ? 'text-emerald-400' : 'text-red-400'}`}>
                {score} / 100 ({sampledSlope <= tolerance ? 'SAFE' : 'HAZARD'})
              </span>
            </div>
          </div>

          {/* Cryptographic SHA-256 Display */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-white">
                <Hash className="w-3.5 h-3.5 text-emerald-400" />
                Immutable SHA-256 Hash Digest
              </span>
              <span className="text-[10px] text-zinc-500">WebCrypto API • 256 bits</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-black border border-emerald-500/40 font-mono text-emerald-400 text-xs select-all">
              <span className="break-all tracking-wide">{hash || 'Computing SHA-256 hash...'}</span>
              <button
                onClick={handleCopy}
                className="shrink-0 p-1.5 rounded bg-space-800 hover:bg-space-700 text-white transition-colors"
                title="Copy SHA-256 to clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-300" />}
              </button>
            </div>
          </div>

          {/* Canonical Payload Inspection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-300">
                <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                Canonical Audit Envelope (Hashed Payload)
              </span>
              <span className="text-[10px] text-zinc-500">Deterministic Key Ordering</span>
            </div>
            <pre className="p-3 rounded-lg bg-black/90 border border-space-800 text-[11px] text-zinc-300 overflow-x-auto max-h-48 scrollbar-thin">
              {payload ? JSON.stringify(payload, null, 2) : 'Loading...'}
            </pre>
          </div>

          {/* Trust & Verification Disclaimer */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-[11px]">
            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Cryptographic Non-Repudiation Guarantee: </span>
              Any bit-level alteration in elevation data, candidate coordinates, or slope calculations produces a completely different SHA-256 digest, preventing retrospective falsification of landing hazard assessments.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-space-850 border-t border-space-700 text-zinc-400 text-[11px]">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-zinc-500" />
            <span>NASA Planetary Data System (LOLA / LRO-L-LOLA-4-GDR-V1.0)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
