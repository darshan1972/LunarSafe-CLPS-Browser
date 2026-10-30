import React, { useRef } from 'react';
import { Upload, FileText, AlertTriangle, Sparkles, Image as ImageIcon, Layers, Briefcase, History, ArrowRight } from 'lucide-react';

interface ImageDropzoneProps {
  onImageSelected: (file: File | null, sampleId?: string) => void;
  onPds4XmlSelected: (xmlText: string) => void;
  isProcessing: boolean;
  selectedSample: string | null;
  onRunBatchComparison?: () => void;
  isBatchProcessing?: boolean;
  onOpenSpaceBag?: (initialTab?: 'BAG' | 'HISTORY') => void;
}

const SAMPLE_IMAGE_MAP: Record<string, { url: string; title: string }> = {
  tmc2: {
    url: '/src/assets/samples/isro_tmc2_manzinusc_crop.png',
    title: 'CH2_TMC2_MANZINUS_C (5m DEM)',
  },
  ohrc: {
    url: '/src/assets/samples/isro_ohrc_shivshakti_crop.png',
    title: 'CH2_OHRC_SHIVSHAKTI (0.25m High-Res)',
  },
  psr: {
    url: '/src/assets/samples/isro_psr_southpole_crop.png',
    title: 'CH2_PSR_SOUTH_POLE (Permanently Shadowed)',
  },
  color_test: {
    url: '/src/assets/samples/color_terrestrial.png',
    title: 'NON_LUNAR_COLOR (Rejection Filter)',
  },
  isro_calibrated_tmc2: {
    url: '/src/assets/samples/isro_tmc2_manzinusc_crop.png',
    title: 'ISRO TMC-2 Calibrated 16-bit Strip',
  },
};

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  onImageSelected,
  onPds4XmlSelected,
  isProcessing,
  selectedSample,
  onRunBatchComparison,
  isBatchProcessing,
  onOpenSpaceBag,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xmlInputRef = useRef<HTMLInputElement>(null);

  const activeSampleInfo = selectedSample ? SAMPLE_IMAGE_MAP[selectedSample] : null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xml')) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            onPds4XmlSelected(reader.result);
          }
        };
        reader.readAsText(file);
      } else {
        onImageSelected(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImageSelected(e.target.files[0]);
    }
  };

  const handleXmlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onPds4XmlSelected(reader.result);
        }
      };
      reader.readAsText(e.target.files[0]);
    }
  };

  return (
    <div className="bg-space-800 rounded-lg border border-space-700 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Upload className="w-4 h-4 text-isro-cyan" />
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
            Lunar Imagery Ingestion
          </h2>
        </div>
        <span className="text-[11px] font-mono text-space-400">PANCHROMATIC ONLY</span>
      </div>

      {/* Main Drag & Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isProcessing
            ? 'border-space-600 bg-space-850/50 cursor-not-allowed'
            : 'border-space-600 hover:border-isro-cyan/70 hover:bg-space-750/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/tiff, image/bmp"
          onChange={handleFileChange}
          className="hidden"
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center justify-center space-y-2.5">
          <div className="p-3 rounded-full bg-space-750 border border-space-700 text-isro-cyan">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-space-200">
              Drag and drop lunar image or <span className="text-isro-cyan underline">browse files</span>
            </p>
            <p className="text-xs text-space-400">
              Supports Chandrayaan-2 TMC-2 / OHRC (PNG, JPG, TIFF) · Max 50MB
            </p>
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-space-400 font-mono">
            <span className="px-1.5 py-0.5 rounded bg-space-850 border border-space-700">Panchromatic Band</span>
            <span className="px-1.5 py-0.5 rounded bg-space-850 border border-space-700">1m/px or 5m/px</span>
            <span className="px-1.5 py-0.5 rounded bg-space-850 border border-space-700">ISRO 24m Ready</span>
          </div>
        </div>
      </div>

      {/* Active OHRC / Lunar Image Preview Viewport (Strict max-h-64/max-h-80, bg-space-950, object-contain) */}
      {activeSampleInfo && (
        <div className="rounded-lg border border-space-700/80 bg-space-950 p-3 space-y-2 shadow-xl">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="flex items-center space-x-1.5 text-isro-cyan font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>LUNAR IMAGERY VIEWPORT</span>
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
              {selectedSample === 'ohrc' ? 'ISRO OHRC (0.25m)' : 'CALIBRATED SWATH'}
            </span>
          </div>

          {/* Strict Maximum Size Viewport: max-h-64 sm:max-h-80 w-full, bg-space-950, object-contain */}
          <div className="w-full max-h-64 sm:max-h-80 flex items-center justify-center overflow-hidden rounded-lg bg-space-950 border border-white/10 p-2 shadow-2xl relative group">
            <img
              src={activeSampleInfo.url}
              alt={activeSampleInfo.title}
              className="max-h-64 sm:max-h-80 w-auto max-w-full object-contain rounded mx-auto transition-transform duration-300"
            />
            {/* Viewport Reticle Lines */}
            <div className="absolute inset-0 pointer-events-none border border-white/5 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:16px_16px]" />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-0.5 border-t border-white/5">
            <span className="truncate max-w-[200px]" title={activeSampleInfo.title}>
              {activeSampleInfo.title}
            </span>
            <span className="text-emerald-400 font-semibold shrink-0">1-BAND PANCHROMATIC</span>
          </div>
        </div>
      )}

      {/* Space Bag Quick Launcher (Antigravity Style) */}
      {onOpenSpaceBag && (
        <button
          type="button"
          onClick={() => onOpenSpaceBag('BAG')}
          disabled={isProcessing}
          className="w-full py-2.5 px-3 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-white font-mono text-xs font-bold flex items-center justify-between transition-all shadow-md group"
        >
          <div className="flex items-center space-x-2">
            <Briefcase className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
            <span>OPEN LUNAR SPACE BAG</span>
            <span className="px-1.5 py-0.5 rounded bg-white text-black text-[10px] font-bold">
              12 TARGETS
            </span>
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] text-zinc-400 group-hover:text-white">
            <span>ARCHIVE &amp; HISTORY</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>
      )}

      {/* Presets / Sample Ingestion */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
          <span>MISSION BENCHMARKS:</span>
          {onOpenSpaceBag && (
            <button
              type="button"
              onClick={() => onOpenSpaceBag('HISTORY')}
              className="text-[11px] text-zinc-400 hover:text-white font-semibold flex items-center space-x-1 transition-colors"
            >
              <History className="w-3 h-3 text-white" />
              <span>SCAN HISTORY</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Sample 1: TMC-2 */}
          <button
            type="button"
            onClick={() => onImageSelected(null, 'tmc2')}
            disabled={isProcessing}
            className={`p-2.5 text-left rounded-md border transition-all text-xs ${
              selectedSample === 'tmc2'
                ? 'bg-white text-black border-white shadow'
                : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300'
            }`}
          >
            <div className={`font-semibold font-mono text-[11px] ${selectedSample === 'tmc2' ? 'text-black font-bold' : 'text-white'}`}>
              CH2_TMC2_MANZINUS_C
            </div>
            <div className={`text-[11px] ${selectedSample === 'tmc2' ? 'text-zinc-700' : 'text-zinc-400'}`}>
              5m DEM · Manzinus-C
            </div>
          </button>

          {/* Sample 2: OHRC */}
          <button
            type="button"
            onClick={() => onImageSelected(null, 'ohrc')}
            disabled={isProcessing}
            className={`p-2.5 text-left rounded-md border transition-all text-xs ${
              selectedSample === 'ohrc'
                ? 'bg-white text-black border-white shadow'
                : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300'
            }`}
          >
            <div className={`font-semibold font-mono text-[11px] ${selectedSample === 'ohrc' ? 'text-black font-bold' : 'text-white'}`}>
              CH2_OHRC_SHIVSHAKTI
            </div>
            <div className={`text-[11px] ${selectedSample === 'ohrc' ? 'text-zinc-700' : 'text-zinc-400'}`}>
              0.25m Landing Site Swath
            </div>
          </button>

          {/* Sample 3: PSR Dark Crater */}
          <button
            type="button"
            onClick={() => onImageSelected(null, 'psr')}
            disabled={isProcessing}
            className={`p-2.5 text-left rounded-md border transition-all text-xs ${
              selectedSample === 'psr'
                ? 'bg-white text-black border-white shadow'
                : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300'
            }`}
          >
            <div className={`flex items-center space-x-1 font-semibold font-mono text-[11px] ${selectedSample === 'psr' ? 'text-black font-bold' : 'text-white'}`}>
              <Sparkles className="w-3 h-3" />
              <span>CH2_PSR_SOUTH_POLE</span>
            </div>
            <div className={`text-[11px] ${selectedSample === 'psr' ? 'text-zinc-700' : 'text-zinc-400'}`}>
              Shadowed Crater
            </div>
          </button>

          {/* Sample 4: Color stock photo (Verification Filter Test) */}
          <button
            type="button"
            onClick={() => onImageSelected(null, 'color_test')}
            disabled={isProcessing}
            className={`p-2.5 text-left rounded-md border transition-all text-xs ${
              selectedSample === 'color_test'
                ? 'bg-red-950/80 border-red-500 text-white'
                : 'bg-zinc-950 border-zinc-800 hover:border-red-900/50 text-zinc-400'
            }`}
          >
            <div className="flex items-center space-x-1 font-semibold font-mono text-[11px] text-red-400">
              <AlertTriangle className="w-3 h-3" />
              <span>NON_LUNAR_COLOR</span>
            </div>
            <div className="text-[11px] text-zinc-500">Test Rejection Filter</div>
          </button>
        </div>

        {/* Multi-Site Batch Comparison Button */}
        {onRunBatchComparison && (
          <button
            type="button"
            onClick={onRunBatchComparison}
            disabled={isProcessing || isBatchProcessing}
            className="w-full mt-2 py-2 px-3 rounded-md border border-zinc-700 hover:border-zinc-500 bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-sm"
          >
            <Layers className="w-3.5 h-3.5 text-zinc-300" />
            <span>{isBatchProcessing ? 'EVALUATING BATCH PASSES...' : 'MULTI-PASS BATCH COMPARISON (3 SITES)'}</span>
          </button>
        )}
      </div>

      {/* Optional ISRO PDS4 XML Label Ingestion */}
      <div className="pt-2 border-t border-space-700 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-space-400">
          <FileText className="w-3.5 h-3.5 text-space-500" />
          <span>Ingest Chandrayaan PDS4 XML Label:</span>
        </div>
        <button
          type="button"
          onClick={() => xmlInputRef.current?.click()}
          disabled={isProcessing}
          className="px-2.5 py-1 text-[11px] font-mono rounded bg-space-750 hover:bg-space-700 border border-space-600 text-space-200"
        >
          Select XML
        </button>
        <input
          ref={xmlInputRef}
          type="file"
          accept=".xml"
          onChange={handleXmlChange}
          className="hidden"
        />
      </div>
    </div>
  );
};
