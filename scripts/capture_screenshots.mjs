import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const screenshotsDir = path.join(rootDir, 'public', 'screenshots');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('=================================================================');
  console.log('       LUNARSAFE AUTOMATED SCREENSHOT CAPTURE ENGINE             ');
  console.log('=================================================================\n');

  console.log(`[TARGET DIR]: ${screenshotsDir}`);

  // 1. Launch Puppeteer browser
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    defaultViewport: { width: 1920, height: 1080 },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1920,1080',
      '--force-dark-mode',
      '--enable-features=WebPlatformPredictableOverflowScroll',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('[BROWSER] Navigating to http://localhost:5000 ...');
  await page.goto('http://localhost:5000', { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait for 3D viewer, shaders, and candidate geojson pins to load
  console.log('[BROWSER] Waiting 7s for WebGL terrain and 13 pins to initialize...');
  await sleep(7000);

  // -------------------------------------------------------------
  // SCREENSHOT 1: 3D Moon Overview, CLPS Mission Browser Tab
  // -------------------------------------------------------------
  console.log('\n--- CAPTURING 1.png (3D Moon Overview, 13 Artemis III Pins) ---');
  // Ensure we are on CLPS_BROWSER view, no side panel open, no modal open
  await page.evaluate(() => {
    // Click outside or ensure selected site is null
    const clpsTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('CLPS MISSION BROWSER'));
    if (clpsTab) clpsTab.click();
  });
  await sleep(1500);
  const path1 = path.join(screenshotsDir, '1.png');
  await page.screenshot({ path: path1 });
  console.log(`[SAVED] 1.png (${fs.statSync(path1).size} bytes)`);

  // -------------------------------------------------------------
  // SCREENSHOT 2: Slope Overlay ON, Roughness Toggle & Legend Visible
  // -------------------------------------------------------------
  console.log('\n--- CAPTURING 2.png (Slope Overlay Active + Legend) ---');
  await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div'));
    for (const d of divs) {
      if (d.textContent.includes('NASA Slope Overlay') && d.className.includes('cursor-pointer')) {
        d.click();
        break;
      }
    }
  });
  await sleep(2500); // Wait for WebGL material map update
  const path2 = path.join(screenshotsDir, '2.png');
  await page.screenshot({ path: path2 });
  console.log(`[SAVED] 2.png (${fs.statSync(path2).size} bytes)`);

  // Reset slope overlay back off
  await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div'));
    for (const d of divs) {
      if (d.textContent.includes('NASA Slope Overlay') && d.className.includes('cursor-pointer')) {
        d.click();
        break;
      }
    }
  });
  await sleep(1000);

  // -------------------------------------------------------------
  // SCREENSHOT 3: Side Panel for Malapert Mountain at Tolerance 10.0°
  // -------------------------------------------------------------
  console.log('\n--- CAPTURING 3.png (Side Panel: Malapert Mountain at 10.0°) ---');
  // Open Rank Matrix modal to select Malapert Mountain
  await page.evaluate(() => {
    const rankBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Rank Matrix'));
    if (rankBtn) rankBtn.click();
  });
  await sleep(1200);

  // Click Focus on Malapert Mountain row
  await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tr'));
    for (const row of rows) {
      if (row.textContent.includes('Malapert Mountain')) {
        const focusBtn = row.querySelector('button');
        if (focusBtn) focusBtn.click();
        break;
      }
    }
  });
  await sleep(600);

  // Close Rank Matrix modal so side panel is visible
  await page.evaluate(() => {
    const modalClose = document.querySelector('div[role="dialog"] button, .fixed button');
    // Find close button with X in modal
    const closeBtns = Array.from(document.querySelectorAll('button')).filter(b => {
      const parent = b.closest('.fixed');
      return parent && b.querySelector('svg');
    });
    if (closeBtns.length > 0) closeBtns[0].click();
  });
  await sleep(2000); // Camera flys / side panel animates in

  const path3 = path.join(screenshotsDir, '3.png');
  await page.screenshot({ path: path3 });
  console.log(`[SAVED] 3.png (${fs.statSync(path3).size} bytes)`);

  // -------------------------------------------------------------
  // SCREENSHOT 4: Rank Matrix Modal Open at Tolerance 10.0°
  // -------------------------------------------------------------
  console.log('\n--- CAPTURING 4.png (Rank Matrix Modal at 10.0°, All 13 Rows) ---');
  await page.evaluate(() => {
    const rankBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Rank Matrix'));
    if (rankBtn) rankBtn.click();
  });
  await sleep(1500);

  const path4 = path.join(screenshotsDir, '4.png');
  await page.screenshot({ path: path4 });
  console.log(`[SAVED] 4.png (${fs.statSync(path4).size} bytes)`);

  // Close Rank Matrix modal
  await page.evaluate(() => {
    const closeBtns = Array.from(document.querySelectorAll('button')).filter(b => {
      const parent = b.closest('.fixed');
      return parent && b.querySelector('svg');
    });
    if (closeBtns.length > 0) closeBtns[0].click();
  });
  await sleep(1000);

  // -------------------------------------------------------------
  // SCREENSHOT 5: SHA-256 Verification Modal for Malapert Mountain
  // -------------------------------------------------------------
  console.log('\n--- CAPTURING 5.png (SHA-256 Verification Modal for Malapert Mountain) ---');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent.includes('SHA-256 Data Verified') || b.textContent.includes('AUDIT PROOF')
    );
    if (btn) btn.click();
  });
  await sleep(1500);

  const path5 = path.join(screenshotsDir, '5.png');
  await page.screenshot({ path: path5 });
  console.log(`[SAVED] 5.png (${fs.statSync(path5).size} bytes)`);

  // Close verification modal
  await page.evaluate(() => {
    const closeBtns = Array.from(document.querySelectorAll('button')).filter(b => {
      const parent = b.closest('.fixed');
      return parent && b.querySelector('svg');
    });
    if (closeBtns.length > 0) closeBtns[0].click();
  });
  await sleep(1000);

  // -------------------------------------------------------------
  // SCREENSHOT 6a: What-If at 8.0° on de Gerlache Rim 1 (Hazard)
  // -------------------------------------------------------------
  console.log('\n--- CAPTURING 6a.png (What-If: de Gerlache Rim 1 at 8.0° -> Hazard) ---');
  // Re-open Rank Matrix to select de Gerlache Rim 1
  await page.evaluate(() => {
    const rankBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Rank Matrix'));
    if (rankBtn) rankBtn.click();
  });
  await sleep(1000);

  await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tr'));
    for (const row of rows) {
      if (row.textContent.includes('de Gerlache Rim 1')) {
        const focusBtn = row.querySelector('button');
        if (focusBtn) focusBtn.click();
        break;
      }
    }
  });
  await sleep(600);

  // Close Rank Matrix modal
  await page.evaluate(() => {
    const closeBtns = Array.from(document.querySelectorAll('button')).filter(b => {
      const parent = b.closest('.fixed');
      return parent && b.querySelector('svg');
    });
    if (closeBtns.length > 0) closeBtns[0].click();
  });
  await sleep(1500);

  // Set tolerance slider to 8.0°
  await page.evaluate(() => {
    const slider = document.querySelector('input[type="range"][min="8.0"]');
    if (slider) {
      slider.value = '8';
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      slider.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await sleep(1000);

  const path6a = path.join(screenshotsDir, '6a.png');
  await page.screenshot({ path: path6a });
  console.log(`[SAVED] 6a.png (${fs.statSync(path6a).size} bytes)`);

  // -------------------------------------------------------------
  // SCREENSHOT 6b: What-If at 15.0° on de Gerlache Rim 1 (Safe)
  // -------------------------------------------------------------
  console.log('\n--- CAPTURING 6b.png (What-If: de Gerlache Rim 1 at 15.0° -> Safe) ---');
  // Set tolerance slider to 15.0°
  await page.evaluate(() => {
    const slider = document.querySelector('input[type="range"][min="8.0"]');
    if (slider) {
      slider.value = '15';
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      slider.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await sleep(1000);

  const path6b = path.join(screenshotsDir, '6b.png');
  await page.screenshot({ path: path6b });
  console.log(`[SAVED] 6b.png (${fs.statSync(path6b).size} bytes)`);

  // -------------------------------------------------------------
  // SCREENSHOT 7: Scan Results View for ch2_tmc2_south_pole.png
  // -------------------------------------------------------------
  console.log('\n--- CAPTURING 7.png (Scan Results: ch2_tmc2_south_pole.png, 16384 Cells) ---');
  // Click SPACE BAG in header
  await page.evaluate(() => {
    const bagBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('SPACE BAG'));
    if (bagBtn) bagBtn.click();
  });
  await sleep(1500);

  // In Space Bag modal, select "ISRO TMC-2 South Polar Strip & Corridor Profile"
  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h3, div, p')).filter(el =>
      el.textContent.includes('ISRO TMC-2 South Polar Strip')
    );
    for (const h of headings) {
      const container = h.closest('.border') || h.closest('div');
      if (container) {
        const scanBtn = Array.from(container.querySelectorAll('button')).find(b =>
          b.textContent.includes('SELECT & SCAN')
        );
        if (scanBtn) {
          scanBtn.click();
          return;
        }
      }
    }
  });

  // Wait for deterministic scan pipeline to execute
  console.log('[BROWSER] Waiting 5s for image processing pipeline to finish...');
  await sleep(5000);

  const path7 = path.join(screenshotsDir, '7.png');
  await page.screenshot({ path: path7 });
  console.log(`[SAVED] 7.png (${fs.statSync(path7).size} bytes)`);

  // -------------------------------------------------------------
  // SCREENSHOT 8: Multi-Method Analysis (CV vs YOLO) Panel
  // -------------------------------------------------------------
  console.log('\n--- CAPTURING 8.png (Multi-Method Analysis: CV vs YOLO Sidecar) ---');
  // Scroll down so the external AI benchmark button and panel are in view
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent.includes('Run AI Detection (External YOLO)')
    );
    if (btn) {
      btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      btn.click();
    }
  });

  // Wait for YOLO detection response from sidecar (:8000)
  console.log('[BROWSER] Waiting 6s for YOLO sidecar detection & cross-validation matching...');
  await sleep(6000);

  // Position viewport so Multi-Method panel is clearly shown
  await page.evaluate(() => {
    const panel = document.querySelector('.border-purple-500\\/40') || document.querySelector('.bg-purple-900\\/10');
    if (panel) {
      panel.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  });
  await sleep(1000);

  const path8 = path.join(screenshotsDir, '8.png');
  await page.screenshot({ path: path8 });
  console.log(`[SAVED] 8.png (${fs.statSync(path8).size} bytes)`);

  await browser.close();

  // -------------------------------------------------------------
  // SCREENSHOT 9: Terminal Output of npm run test:determinism
  // -------------------------------------------------------------
  console.log('\n--- CAPTURING 9.png (Terminal Output: npm run test:determinism) ---');
  let termOutput = '';
  try {
    termOutput = execSync('npm run test:determinism', {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    termOutput = (err.stdout || '') + '\n' + (err.stderr || '');
  }

  // Escape HTML
  const safeOutput = termOutput
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const termBrowser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
  });
  const termPage = await termBrowser.newPage();
  await termPage.setViewport({ width: 1920, height: 1080 });

  const terminalHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body {
        margin: 0;
        padding: 40px;
        background-color: #0d1117;
        color: #c9d1d9;
        font-family: 'Consolas', 'Menlo', 'Monaco', 'Courier New', monospace;
        font-size: 14px;
        line-height: 1.5;
        box-sizing: border-box;
      }
      .window {
        background-color: #161b22;
        border: 1px solid #30363d;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
        max-width: 1800px;
        margin: 0 auto;
      }
      .title-bar {
        background-color: #21262d;
        padding: 12px 18px;
        display: flex;
        align-items: center;
        border-bottom: 1px solid #30363d;
      }
      .buttons {
        display: flex;
        gap: 8px;
        margin-right: 16px;
      }
      .btn {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        display: inline-block;
      }
      .btn.red { background-color: #ff5f56; }
      .btn.yellow { background-color: #ffbd2e; }
      .btn.green { background-color: #27c93f; }
      .title {
        color: #8b949e;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.5px;
      }
      pre {
        margin: 0;
        padding: 24px;
        overflow-x: auto;
        color: #58a6ff;
        white-space: pre-wrap;
      }
      .pass { color: #3fb950; font-weight: bold; }
      .hash { color: #79c0ff; font-family: inherit; }
    </style>
  </head>
  <body>
    <div class="window">
      <div class="title-bar">
        <div class="buttons">
          <span class="btn red"></span>
          <span class="btn yellow"></span>
          <span class="btn green"></span>
        </div>
        <span class="title">pwsh — npm run test:determinism (3x Bit-Identical Audit Verification)</span>
      </div>
      <pre>${safeOutput}</pre>
    </div>
  </body>
  </html>
  `;

  await termPage.setContent(terminalHtml);
  await sleep(1000);
  const path9 = path.join(screenshotsDir, '9.png');
  await termPage.screenshot({ path: path9 });
  await termBrowser.close();
  console.log(`[SAVED] 9.png (${fs.statSync(path9).size} bytes)`);

  // -------------------------------------------------------------
  // SCREENSHOT 10 & 11: Pages 1 and 2 of evidence/mission_report.pdf
  // -------------------------------------------------------------
  console.log('\n--- RENDERING 10.png & 11.png from evidence/mission_report.pdf ---');
  execSync(
    'python -c "import pymupdf; doc = pymupdf.open(\'evidence/mission_report.pdf\'); m = pymupdf.Matrix(150/72, 150/72); doc[0].get_pixmap(matrix=m).save(\'public/screenshots/10.png\'); doc[1].get_pixmap(matrix=m).save(\'public/screenshots/11.png\'); print(\'Rendered 10.png and 11.png\')"',
    { cwd: rootDir, stdio: 'inherit' }
  );

  console.log('\n=================================================================');
  console.log('       ALL 12 SCREENSHOTS CAPTURED SUCCESSFULLY                  ');
  console.log('=================================================================\n');
}

main().catch((err) => {
  console.error('[ERROR] Screenshot capture pipeline failed:', err);
  process.exit(1);
});
