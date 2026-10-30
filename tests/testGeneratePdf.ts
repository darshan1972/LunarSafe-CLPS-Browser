import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';
import { DeterministicLunarEngine } from '../src/lib/imageProcessor';
import { generatePDF } from '../src/lib/scanReportGenerator';
import { ScanRecord } from '../src/lib/scanRecord';

async function main() {
  const samplePath = path.resolve('src/assets/samples/ch2_tmc2_south_pole.png');
  const rawBuffer = fs.readFileSync(samplePath);
  const parsedPng = PNG.sync.read(rawBuffer);

  const pixelData = {
    width: parsedPng.width,
    height: parsedPng.height,
    data: new Uint8ClampedArray(parsedPng.data),
  };

  const res = await DeterministicLunarEngine.processLunarImage(rawBuffer, pixelData, {
    pixelScaleMeters: 5.0,
    gridSizeMeters: 24,
    maxSlopeDeg: 10.0,
  });

  const base64Raw = 'data:image/png;base64,' + rawBuffer.toString('base64');

  const record: ScanRecord = {
    id: 'scan-' + Date.now() + '-tmc2',
    timestamp: new Date().toISOString(),
    instrument: 'Chandrayaan-2 TMC-2 Nadir Strip',
    gsdMetersPerPixel: 5.0,
    coordinates: null,
    meanSlopeDeg: res.meanSlopeDeg,
    maxSlopeDeg: res.maxSlopeDeg,
    craterCount: res.craters.length,
    boulderCount: res.boulders.length,
    safeAreaPercentage: res.evidence.safeAreaPercentage,
    hazardAreaPercentage: 100 - res.evidence.safeAreaPercentage,
    contiguousZoneCount: res.safeZones.length,
    topSiteAreaM2: res.safeZones[0]?.areaM2 || 0,
    recommendation: 'SAFE',
    confidence: 'HIGH',
    reasoning: 'Evaluation complete',
    inputImageHash: res.evidence.inputImageHash,
    slopeMapHash: res.evidence.slopeMapHash,
    gridClassificationHash: res.evidence.gridClassificationHash,
    candidateZonesHash: res.evidence.candidateZonesHash,
    executionLog: res.modules.map(m => ({ module: m.name, status: m.status, timingMs: m.timingMs })),
    rawImageDataUrl: base64Raw,
    hazardOverlayDataUrl: base64Raw,
  };

  const pdfBlob = generatePDF(record);
  const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());
  const outPath = path.resolve('test_tmc2_report.pdf');
  fs.writeFileSync(outPath, pdfBuffer);

  console.log('PDF Generated successfully at ' + outPath);
  console.log('PDF File size in bytes: ' + pdfBuffer.byteLength);
}

main().catch(console.error);
