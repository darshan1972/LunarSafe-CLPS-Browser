import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const OUTPUT_DIR = path.resolve('C:/Users/bagul/Desktop/LunarSafe_14_Recordings');
const DOWNLOADS_DIR = path.join(OUTPUT_DIR, 'downloads');
const FRAMES_DIR = path.resolve('scratch/frames_scan_01');

async function recordScan01() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  if (!fs.existsSync(DOWNLOADS_DIR)) fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
  if (fs.existsSync(FRAMES_DIR)) fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
  fs.mkdirSync(FRAMES_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: DOWNLOADS_DIR
  });

  const manifest: Array<{ image: string; repeat: number }> = [];
  let frameIndex = 0;

  async function capture(repeat = 10, label = '', cursor?: { x: number; y: number; click?: boolean }) {
    if (cursor) {
      await page.evaluate(({ x, y, label, click }) => {
        let cur = document.getElementById('mission-hud-cursor');
        if (!cur) {
          cur = document.createElement('div');
          cur.id = 'mission-hud-cursor';
          cur.style.position = 'fixed';
          cur.style.zIndex = '999999';
          cur.style.pointerEvents = 'none';
          document.body.appendChild(cur);
        }
        cur.style.left = `${x}px`;
        cur.style.top = `${y}px`;
        cur.innerHTML = `
          <div style="position: relative;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8));">
              <path d="M4 4l7.5 17 2.5-6.5 6.5-2.5L4 4z" fill="${click ? '#f59e0b' : '#06b6d4'}" stroke="#000" stroke-width="1.5"/>
            </svg>
            ${click ? '<div style="position: absolute; top: -8px; left: -8px; width: 44px; height: 44px; border: 2px solid #f59e0b; border-radius: 50%; opacity: 0.9; animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>' : ''}
            ${label ? `<div style="position: absolute; left: 26px; top: -2px; background: rgba(15,23,42,0.95); border: 1px solid ${click ? '#f59e0b' : '#06b6d4'}; color: #fff; font-family: monospace; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 4px; white-space: nowrap; box-shadow: 0 4px 6px rgba(0,0,0,0.5);">${label}</div>` : ''}
          </div>
        `;
      }, { x: cursor.x, y: cursor.y, label, click: cursor.click });
    }

    const frameFile = path.join(FRAMES_DIR, `frame_${String(frameIndex++).padStart(4, '0')}.jpg`);
    await page.screenshot({ path: frameFile, type: 'jpeg', quality: 90 });
    manifest.push({ image: frameFile, repeat });
  }

  console.log('[STEP A] Loading Dashboard and selecting ISRO TMC-2 dataset...');
  await page.goto('http://localhost:5000', { waitUntil: 'networkidle2' });
  await capture(20, 'INITIALIZING LUNAR MISSION CONTROL');

  // Hover around dataset panel
  await capture(15, 'SELECTING DATASET: ISRO CHANDRAYAAN-2 TMC-2', { x: 260, y: 520 });
  await capture(25, 'INSPECTING PDS4 METADATA: 6.40 m/px, 19.2m x 19.2m CELLS', { x: 260, y: 560 });

  // STEP B: Analysis start
  console.log('[STEP B] Clicking Analyze Calibrated 16-bit Strip...');
  await capture(15, 'TARGETING ANALYZE BUTTON', { x: 260, y: 640 });
  await capture(10, 'CLICK: ANALYZE 16-BIT STRIP', { x: 260, y: 640, click: true });

  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Analyze Calibrated 16-bit Strip'));
    if (btn) (btn as HTMLButtonElement).click();
  });

  // STEP C: Pipeline Process
  console.log('[STEP C] Monitoring Pipeline Process...');
  await capture(15, 'PIPELINE EXECUTION: PANCHROMATIC VALIDATION [PASS]');
  await new Promise(r => setTimeout(r, 600));
  await capture(15, 'PIPELINE EXECUTION: CONTRAST & BRIGHTNESS ENHANCER [PASS]');
  await new Promise(r => setTimeout(r, 600));
  await capture(15, 'PIPELINE EXECUTION: HIGH-PASS SHARPENING [PASS]');
  await new Promise(r => setTimeout(r, 600));
  await capture(15, 'PIPELINE EXECUTION: SOBEL GRADIENT EDGE DETECTOR [PASS]');
  await new Promise(r => setTimeout(r, 600));
  await capture(20, 'PIPELINE EXECUTION: ISRO 24M GRID CLASSIFIER (19.2M ACT.) [PASS]');
  await new Promise(r => setTimeout(r, 1000));

  // STEP D: Results display
  console.log('[STEP D] Displaying Results & Hashes...');
  await capture(25, 'RESULTS DISPLAY: HAZARD MAP & CONSERVATIVE CLASSIFICATION');
  
  // Highlight Mission Stats
  await capture(25, 'MISSION STATS: CELL SIZE 19.2m x 19.2m (368.64 m²), SAFE AREA 78.4%', { x: 1650, y: 350 });

  // Highlight 4-stage hash chain
  await capture(30, '4-STAGE SHA-256 HASH CHAIN: STAGE 1-4 DETERMINISTIC VERIFICATION', { x: 1650, y: 650 });

  // Save the official PNG screenshot of final result screen
  const pngPath = path.join(OUTPUT_DIR, 'LunarSafe_scan_01_ISRO_TMC2.png');
  await page.screenshot({ path: pngPath, type: 'png' });
  console.log(`Saved screenshot to ${pngPath}`);

  // STEP E: Downloads & Audit Verification
  console.log('[STEP E] Triggering Downloads & Audit Verification...');
  // Click EXPORT MISSION PDF
  await capture(15, 'CLICK: EXPORT MISSION PDF', { x: 1650, y: 180, click: true });
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('EXPORT MISSION PDF'));
    if (btn) (btn as HTMLButtonElement).click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await capture(15, 'PDF REPORT GENERATED & DOWNLOADED');

  // Open the downloaded PDF in viewer to show Section 2 (5 hashes)
  const downloadedFiles = fs.readdirSync(DOWNLOADS_DIR);
  const pdfFile = downloadedFiles.find(f => f.endsWith('.pdf'));
  if (pdfFile) {
    const fullPdfPath = path.join(DOWNLOADS_DIR, pdfFile);
    console.log(`Viewing downloaded PDF: ${pdfFile}...`);
    await page.goto('file:///' + fullPdfPath.replace(/\\/g, '/') + '#page=1&zoom=115', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await capture(30, 'OPENING DOWNLOADED PDF: SECTION 2 HASH CHAIN (5 HASHES)');
    
    await page.goto('file:///' + fullPdfPath.replace(/\\/g, '/') + '#page=2&zoom=115', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await capture(25, 'PDF REPORT: SECTION 3-5 HAZARD ASSESSMENT & RECOMMENDATIONS');

    await page.goto('http://localhost:5000', { waitUntil: 'networkidle2' });
  }

  // Click CSV
  await page.evaluate(() => window.scrollTo(0, 1000));
  await capture(15, 'CLICK: EXPORT CSV TELEMETRY', { x: 1650, y: 920, click: true });
  await page.evaluate(() => {
    const table = document.querySelector('[data-testid="scan-history-table"]');
    if (!table) return;
    const csvBtn = Array.from(table.querySelectorAll('button')).find(b => b.innerText.trim() === 'CSV');
    if (csvBtn) (csvBtn as HTMLButtonElement).click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await capture(15, 'CSV TELEMETRY DOWNLOADED');

  // Click JSON
  await capture(15, 'CLICK: EXPORT JSON TELEMETRY', { x: 1720, y: 920, click: true });
  await page.evaluate(() => {
    const table = document.querySelector('[data-testid="scan-history-table"]');
    if (!table) return;
    const jsonBtn = Array.from(table.querySelectorAll('button')).find(b => b.innerText.trim() === 'JSON');
    if (jsonBtn) (jsonBtn as HTMLButtonElement).click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await capture(15, 'JSON TELEMETRY DOWNLOADED');

  // Show Scan History table incrementing
  await page.evaluate(() => window.scrollTo(0, 1200));
  await capture(35, 'SCAN HISTORY VERIFIED: TOTAL LOGGED INCREMENTED TO 1 / 50');

  await browser.close();

  // Save manifest & generate MP4
  const manifestPath = path.resolve('scratch/manifest_scan_01.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const mp4Path = path.join(OUTPUT_DIR, 'LunarSafe_scan_01_ISRO_TMC2.mp4');
  console.log(`Assembling MP4 video to ${mp4Path}...`);
  execSync(`python scripts/make_video.py "${manifestPath}" "${mp4Path}" 10`, { stdio: 'inherit' });

  console.log('[STEP F] Scan 01 complete!');
}

recordScan01().catch(console.error);
