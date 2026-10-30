import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer-core';
import { generatePDF } from '../src/lib/scanReportGenerator';
import { ScanRecord } from '../src/lib/scanRecord';

async function main() {
  console.log('=== GENERATING ISRO TMC-2 REPORT WITH CORRECTED CELL SIZE ===\n');

  const gsdM = 6.4;
  const pixelCount = Math.floor(24 / gsdM);
  const actualCellM = pixelCount * gsdM;
  const cellAreaM2 = actualCellM * actualCellM;

  console.log(`GSD: ${gsdM} m/px`);
  console.log(`Pixel count per cell: ${pixelCount} px`);
  console.log(`Actual cell size: ${actualCellM.toFixed(1)}m × ${actualCellM.toFixed(1)}m`);
  console.log(`Cell area: ${cellAreaM2.toFixed(2)} m²\n`);

  const samplePath = path.resolve('src/assets/samples/ch2_tmc2_south_pole.png');
  const base64Raw = 'data:image/png;base64,' + fs.readFileSync(samplePath).toString('base64');

  const record: ScanRecord = {
    id: 'scan-isro-tmc2-calibrated',
    timestamp: new Date().toISOString(),
    instrument: 'ISRO Chandrayaan-2 TMC-2',
    gsdMetersPerPixel: 6.4,
    coordinates: { lat: 77.53, lon: 12.843 },
    meanSlopeDeg: 5.02,
    maxSlopeDeg: 14.18,
    craterCount: 1366,
    boulderCount: 15,
    safeAreaPercentage: 89.8,
    hazardAreaPercentage: 10.2,
    contiguousZoneCount: 3,
    topSiteAreaM2: 9557729.28,
    recommendation: 'SAFE',
    confidence: 'HIGH',
    reasoning: 'Calibrated ISRO TMC-2 raster analysis complete with corrected 19.2m dynamic geometry.',
    inputImageHash: '0cfdec05c414539dad7b3ffac8b8b99b7da81ba59407a338b4532cf61ce7fb23',
    slopeMapHash: 'f28a0edce38c66060b2714c43bef3216fbbd0244139e7550a4b6aa3c5d707b7a',
    gridClassificationHash: 'bfd4a138861e05125a8e8399a887069ab140a79fb0793755b8b6823d223c56ab',
    candidateZonesHash: '8e3f02a2159b86b09cbae59fc2b1871154f5c0536e872f1d6cf0b6f22f65a58d',
    sessionIntegrityHash: 'c72f630f89ba3fbb9b9a3a73f94f7b5d8a8b717785d20486a34ff34be6ca6afc',
    executionLog: [
      { module: 'ISRO 24m Grid Classifier', status: 'DONE', timingMs: 18.8, output: `Safe: 89.8% (Actual cell size: ${actualCellM.toFixed(1)}m × ${actualCellM.toFixed(1)}m, ${cellAreaM2.toFixed(1)} m²)` }
    ],
    rawImageDataUrl: base64Raw,
    hazardOverlayDataUrl: base64Raw,
  };

  const pdfBlob = generatePDF(record);
  const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());
  const pdfPath = path.resolve('scripts/output/isro_tmc2_corrected_cell_size.pdf');
  fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
  fs.writeFileSync(pdfPath, pdfBuffer);
  console.log(`PDF written to: ${pdfPath} (${pdfBuffer.byteLength} bytes)`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1800, deviceScaleFactor: 2 });
    const fileUrl = 'file:///' + pdfPath.replace(/\\/g, '/');

    await page.goto(fileUrl + '#page=1&zoom=130', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));

    const outPng = path.resolve('scripts/output/pdf_corrected_cell_size.png');
    await page.screenshot({ path: outPng });
    console.log(`Screenshot saved to: ${outPng}`);

    // Copy to artifact directory
    const artifactDir = 'C:\\Users\\bagul\\.gemini\\antigravity\\brain\\baed6b60-3d6b-4b88-a0f6-7cae06dced5f';
    if (fs.existsSync(artifactDir)) {
      const artPng = path.join(artifactDir, 'pdf_corrected_cell_size.png');
      fs.copyFileSync(outPng, artPng);
      console.log(`Copied to artifact path: ${artPng}`);
    }
  } finally {
    await browser.close();
  }

  console.log('\n[PASS] PDF and Screenshot generation complete!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
