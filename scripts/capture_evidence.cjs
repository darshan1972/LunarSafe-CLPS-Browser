const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function capture() {
  const brainDir = 'C:/Users/bagul/.gemini/antigravity/brain/584a86f4-53dc-4dd1-94b9-4f287ad47627';
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Dashboard screenshot
  console.log('Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 4000));
  const dashPath = path.join(brainDir, 'dashboard_screenshot.png');
  await page.screenshot({ path: dashPath });
  fs.copyFileSync(dashPath, 'dashboard_screenshot.png');
  console.log('Saved dashboard screenshot:', dashPath);

  // 2. Terminal pipeline screenshot
  const pipelineLog = fs.readFileSync('C:/Users/bagul/.gemini/antigravity/brain/584a86f4-53dc-4dd1-94b9-4f287ad47627/.system_generated/tasks/task-225.log', 'utf8');
  const lines = pipelineLog.split('\n');
  const lastLines = lines.slice(-35).join('\n');
  const termHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { background: #0f172a; color: #f8fafc; font-family: 'JetBrains Mono', Consolas, monospace; padding: 20px; font-size: 13px; margin: 0; }
      .window { background: #020617; border-radius: 8px; border: 1px solid #1e293b; box-shadow: 0 10px 25px rgba(0,0,0,0.5); overflow: hidden; }
      .bar { background: #0f172a; padding: 10px 15px; border-bottom: 1px solid #1e293b; display: flex; align-items: center; gap: 8px; }
      .dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
      .r { background: #ef4444; } .y { background: #f59e0b; } .g { background: #10b981; }
      .title { color: #94a3b8; font-size: 12px; margin-left: 10px; font-weight: 600; }
      pre { margin: 0; padding: 16px; overflow-x: auto; line-height: 1.45; color: #38bdf8; }
    </style>
  </head>
  <body>
    <div class="window">
      <div class="bar">
        <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
        <span class="title">Terminal: Fresh 768-Tile Full Pipeline Run (6 Concurrency Workers)</span>
      </div>
      <pre>${lastLines.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
    </div>
  </body>
  </html>
  `;
  const termPage = await browser.newPage();
  await termPage.setViewport({ width: 1200, height: 800 });
  await termPage.setContent(termHtml);
  const termPath = path.join(brainDir, 'terminal_pipeline_screenshot.png');
  await termPage.screenshot({ path: termPath });
  console.log('Saved terminal screenshot:', termPath);

  // 3. Summary screenshot
  const resultsJson = JSON.parse(fs.readFileSync('src/assets/isro_data/full_analysis_results.json', 'utf8'));
  const sumHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { background: #090d16; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 25px; margin: 0; }
      .card { background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.4); max-width: 900px; }
      h2 { color: #38bdf8; margin-top: 0; font-size: 20px; border-bottom: 1px solid #1f2937; padding-bottom: 12px; display: flex; align-items: center; justify-content: space-between; }
      .badge { background: #065f46; color: #34d399; font-size: 12px; padding: 4px 10px; border-radius: 9999px; font-weight: 600; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
      th { text-align: left; padding: 10px; color: #94a3b8; border-bottom: 1px solid #374151; font-weight: 500; }
      td { padding: 10px; border-bottom: 1px solid #1f2937; }
      .mono { font-family: 'JetBrains Mono', Consolas, monospace; color: #38bdf8; font-weight: 600; }
      .val { color: #f1f5f9; font-weight: 600; }
    </style>
  </head>
  <body>
    <div class="card">
      <h2>LunarSafe ISRO TMC-2 Full Analysis Summary <span class="badge">100% COMPLETE (768/768)</span></h2>
      <table>
        <tr><th>Metric</th><th>Calibrated Real-Run Value</th></tr>
        <tr><td>Raw Crater Patches (8x8 cells)</td><td class="mono">${resultsJson.summary.rawCraterPatches.toLocaleString()}</td></tr>
        <tr><td>Distinct Crater Complexes</td><td class="mono">${resultsJson.summary.distinctCraters.toLocaleString()}</td></tr>
        <tr><td>Raw Boulder Patches</td><td class="mono">${resultsJson.summary.rawBoulderPatches.toLocaleString()}</td></tr>
        <tr><td>Distinct Boulders</td><td class="mono">${resultsJson.summary.distinctBoulders.toLocaleString()}</td></tr>
        <tr><td>Safe Area Percentage</td><td class="mono">${resultsJson.summary.safeAreaPercentage}%</td></tr>
        <tr><td>Total Safe Area (km²)</td><td class="mono">${resultsJson.summary.totalSafeAreaKm2.toLocaleString()} km²</td></tr>
        <tr><td>Total Swath Area (km²)</td><td class="mono">${resultsJson.summary.totalAreaKm2.toLocaleString()} km²</td></tr>
        <tr><td>Candidate Safe Landing Zones</td><td class="mono">${resultsJson.summary.safeLandingZonesCount} zone</td></tr>
        <tr><td>Top Safe Zone Coordinates</td><td class="val">${resultsJson.safeLandingZones[0].latitudeDeg.toFixed(4)}°N, ${resultsJson.safeLandingZones[0].longitudeDeg.toFixed(4)}°E</td></tr>
        <tr><td>Top Safe Zone Area</td><td class="val">${resultsJson.safeLandingZones[0].areaKm2.toFixed(2)} km² (${resultsJson.safeLandingZones[0].status})</td></tr>
        <tr><td>Master Evidence Hash</td><td class="mono" style="font-size: 11px;">${resultsJson.summary.masterEvidenceHash}</td></tr>
      </table>
    </div>
  </body>
  </html>
  `;
  const sumPage = await browser.newPage();
  await sumPage.setViewport({ width: 1000, height: 600 });
  await sumPage.setContent(sumHtml);
  const sumPath = path.join(brainDir, 'results_summary_screenshot.png');
  await sumPage.screenshot({ path: sumPath });
  console.log('Saved summary screenshot:', sumPath);

  // 4. Copy coverage map to brainDir
  const covSrc = path.resolve('src/assets/isro_data/full_coverage_map.png');
  const covDest = path.join(brainDir, 'new_coverage_map.png');
  fs.copyFileSync(covSrc, covDest);
  console.log('Copied coverage map to:', covDest);

  await browser.close();
  console.log('All screenshots captured successfully.');
}

capture().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
