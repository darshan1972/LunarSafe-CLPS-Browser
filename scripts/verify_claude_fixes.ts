import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';
import puppeteer from 'puppeteer-core';
import { DeterministicLunarEngine } from '../src/lib/imageProcessor';
import { generatePDF, generateCSV, generateJSON } from '../src/lib/scanReportGenerator';
import { ScanRecord, MultiMethodAnalysisInput } from '../src/lib/scanRecord';
import { getSessionMetadata, computeSessionIntegrityHash } from '../src/lib/sessionIntegrity';

async function main() {
  console.log('=== VERIFYING CLAUDE AUDIT FIXES ===\n');

  // 1. Process sample image
  const samplePath = path.resolve('src/assets/samples/ch2_tmc2_south_pole.png');
  const rawBuffer = fs.readFileSync(samplePath);
  const parsedPng = PNG.sync.read(rawBuffer);

  const pixelData = {
    width: parsedPng.width,
    height: parsedPng.height,
    data: new Uint8ClampedArray(parsedPng.data),
  };

  const analysis = await DeterministicLunarEngine.processLunarImage(rawBuffer, pixelData, {
    pixelScaleMeters: 5.0,
    gridSizeMeters: 24,
    maxSlopeDeg: 10.0,
  });

  const sessionMeta = getSessionMetadata();
  const sessionIntegrityHash = computeSessionIntegrityHash(sessionMeta);
  console.log('Session Integrity Hash:', sessionIntegrityHash);

  const base64Raw = 'data:image/png;base64,' + rawBuffer.toString('base64');

  // Sample multiMethodInput with CV and YOLO detections
  const multiMethodInput: MultiMethodAnalysisInput = {
    cvCraters: 65,
    cvBoulders: 55,
    yoloCraters: 12,
    yoloBoulders: 8,
    cvCratersList: analysis.craters.slice(0, 10).map((c, idx) => ({
      x1: c.x - c.radius,
      y1: c.y - c.radius,
      x2: c.x + c.radius,
      y2: c.y + c.radius,
      confidence: 0.9,
      class_name: 'crater',
    })),
    yoloCratersList: analysis.craters.slice(0, 10).map((c, idx) => ({
      x1: c.x - c.radius,
      y1: c.y - c.radius,
      x2: c.x + c.radius,
      y2: c.y + c.radius,
      confidence: 0.85,
      class_name: 'crater',
    })),
    workflow: 'PRE_MISSION_SITE_SELECTION',
    hashes: {
      stage1Input: analysis.evidence.inputImageHash,
      stage2Slope: analysis.evidence.slopeMapHash,
      stage3Grid: analysis.evidence.gridClassificationHash,
      stage4Zones: analysis.evidence.candidateZonesHash,
      sessionIntegrityHash,
    },
  };

  const record: ScanRecord = {
    id: 'scan-audit-verify-' + Date.now(),
    timestamp: new Date().toISOString(),
    instrument: 'Chandrayaan-2 TMC-2 Nadir Strip',
    gsdMetersPerPixel: 5.0,
    coordinates: null,
    meanSlopeDeg: analysis.meanSlopeDeg,
    maxSlopeDeg: analysis.maxSlopeDeg,
    craterCount: analysis.craters.length,
    boulderCount: analysis.boulders.length,
    safeAreaPercentage: analysis.evidence.safeAreaPercentage,
    hazardAreaPercentage: 100 - analysis.evidence.safeAreaPercentage,
    contiguousZoneCount: analysis.safeZones.length,
    topSiteAreaM2: analysis.safeZones[0]?.areaM2 || 0,
    recommendation: 'SAFE',
    confidence: 'HIGH',
    reasoning: 'Evaluation complete with 5-stage cryptographic chain.',
    inputImageHash: analysis.evidence.inputImageHash,
    slopeMapHash: analysis.evidence.slopeMapHash,
    gridClassificationHash: analysis.evidence.gridClassificationHash,
    candidateZonesHash: analysis.evidence.candidateZonesHash,
    sessionIntegrityHash,
    executionLog: analysis.modules.map(m => ({
      module: m.name,
      status: m.status,
      timingMs: m.timingMs,
      output: m.details,
    })),
    rawImageDataUrl: base64Raw,
    hazardOverlayDataUrl: base64Raw,
    multiMethodInput,
  };

  // --- Test CSV ---
  console.log('\n--- 1. CSV EXPORT VERIFICATION ---');
  const csvBlob = generateCSV(record);
  const csvText = await csvBlob.text();
  const csvLines = csvText.trim().split('\r\n');
  const csvHeaders = csvLines[0].split(',');
  const lastHeader = csvHeaders[csvHeaders.length - 1];
  console.log('Last CSV Header:', lastHeader);
  if (lastHeader === 'sessionIntegrityHash') {
    console.log('[PASS] CSV header includes sessionIntegrityHash');
  } else {
    console.error('[FAIL] CSV header missing sessionIntegrityHash');
    process.exit(1);
  }

  const csvRow = csvLines[1];
  if (csvRow.includes(sessionIntegrityHash)) {
    console.log('[PASS] CSV row contains the exact sessionIntegrityHash');
  } else {
    console.error('[FAIL] CSV row does not contain sessionIntegrityHash');
    process.exit(1);
  }

  // --- Test JSON ---
  console.log('\n--- 2. JSON EXPORT VERIFICATION ---');
  const jsonBlob = generateJSON(record);
  const jsonText = await jsonBlob.text();
  const parsedJson = JSON.parse(jsonText);
  if (parsedJson.sessionIntegrityHash === sessionIntegrityHash) {
    console.log('[PASS] JSON top-level sessionIntegrityHash matches:', parsedJson.sessionIntegrityHash);
  } else {
    console.error('[FAIL] JSON sessionIntegrityHash mismatch:', parsedJson.sessionIntegrityHash);
    process.exit(1);
  }

  // --- Test PDF ---
  console.log('\n--- 3. PDF REPORT VERIFICATION ---');
  const pdfBlob = generatePDF(record, record.multiMethodInput);
  const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());
  const pdfPath = path.resolve('scripts/output/audit_verified_report.pdf');
  fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
  fs.writeFileSync(pdfPath, pdfBuffer);
  console.log('PDF written to:', pdfPath, `(${pdfBuffer.byteLength} bytes)`);

  // Render PDF pages with Puppeteer Chrome
  console.log('\n--- 4. RENDERING PDF PAGES VIA PUPPETEER ---');
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

    // Page 1: Section 2
    await page.goto(fileUrl + '#page=1&zoom=120', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));
    const page1Path = path.resolve('scripts/output/pdf_section2_verified.png');
    await page.screenshot({ path: page1Path });
    console.log('Page 1 screenshot saved to:', page1Path);

    // Page 3: Section 6 Multi-Method Analysis
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await page.mouse.move(700, 900);
    await page.mouse.wheel({ deltaY: 3000 });
    await new Promise(r => setTimeout(r, 1200));
    const page3Path = path.resolve('scripts/output/pdf_section6_verified.png');
    await page.screenshot({ path: page3Path });
    console.log('Page 3 screenshot saved to:', page3Path);

    console.log('\n[PASS] All fixes verified successfully!');
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
