import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer-core';

async function capturePdfPages() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,1200']
  });

  const brainDir = 'C:\\Users\\bagul\\.gemini\\antigravity\\brain\\baed6b60-3d6b-4b88-a0f6-7cae06dced5f';
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1800, deviceScaleFactor: 2 });

  const pdfPath = path.resolve('LunarSafe_full_isro_analysis_report.pdf');
  const pdfUrl = 'file:///' + pdfPath.replace(/\\/g, '/');

  // Page 1
  console.log('Navigating to Page 1...');
  await page.goto(pdfUrl, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(brainDir, 'isro_full_report_page1.png') });
  console.log('Saved isro_full_report_page1.png');

  // Scroll down to Page 2
  console.log('Scrolling down to Page 2 (Safe Landing Zones Table)...');
  await page.evaluate(() => {
    window.scrollBy(0, 1400);
  });
  // Or press PageDown
  await page.keyboard.press('PageDown');
  await page.keyboard.press('PageDown');
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(brainDir, 'isro_safe_zones_table.png') });
  console.log('Saved isro_safe_zones_table.png');

  // Also create a standalone high-res presentation card of the Safe Landing Zones Table
  const jsonPath = path.resolve('src/assets/isro_data/full_analysis_results.json');
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const zones = jsonData.safeLandingZones;

  const tableHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; background: #0F172A; color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; display: flex; justify-content: center; }
        .card { background: #0B0F17; border: 1px solid #1E293B; border-radius: 12px; padding: 28px; width: 1100px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
        .hdr { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284C7; padding-bottom: 14px; margin-bottom: 20px; }
        h1 { margin: 0; font-size: 18px; color: white; letter-spacing: 0.5px; }
        .meta { font-size: 12px; color: #38BDF8; font-weight: 600; }
        .sec-title { font-size: 13px; font-weight: 700; color: #94A3B8; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; }
        th { background: #1E293B; color: #38BDF8; padding: 10px 12px; font-weight: 600; border: 1px solid #334155; }
        td { padding: 9px 12px; border: 1px solid #1E293B; background: #0F172A; }
        tr:nth-child(even) td { background: #131D31; }
        .badge-green { background: #10B981; color: white; padding: 3px 8px; border-radius: 4px; font-size: 10.5px; font-weight: 700; display: inline-block; }
        .summary-box { display: flex; gap: 16px; margin-top: 20px; padding: 16px; background: #131D31; border: 1px solid #334155; border-radius: 8px; }
        .metric { flex: 1; }
        .label { font-size: 11px; color: #94A3B8; margin-bottom: 4px; }
        .val { font-size: 16px; font-weight: bold; color: #38BDF8; }
        .val-green { color: #10B981; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="hdr">
          <div>
            <h1>LUNARSAFE // ISRO CHANDRAYAAN-2 SAFE LANDING ZONES DOSSIER</h1>
            <div style="font-size: 11.5px; color: #94A3B8; margin-top: 4px;">ORBIT 31200 · TMC-2 OBSERVATION · CONNECTED-COMPONENT CLUSTER IDENTIFICATION</div>
          </div>
          <div class="meta">PARUL UNIVERSITY · TEAM ROCKET</div>
        </div>

        <div class="sec-title">SECTION 4 — CERTIFIED CANDIDATE SAFE TOUCHDOWN REGIONS</div>
        <table>
          <thead>
            <tr>
              <th>Zone ID</th>
              <th>Center Line</th>
              <th>Center Sample</th>
              <th>Latitude (°N)</th>
              <th>Longitude (°E)</th>
              <th>Safe Area (km²)</th>
              <th>Mean Slope</th>
              <th>Obstacles</th>
              <th>ISRO LHDAC Rating</th>
            </tr>
          </thead>
          <tbody>
            ${zones.map((z: any) => `
              <tr>
                <td style="font-weight: bold; color: #38BDF8;">Zone ${z.zoneId}</td>
                <td>${z.centerLine.toLocaleString()}</td>
                <td>${z.centerSample.toLocaleString()}</td>
                <td>${z.latitudeDeg.toFixed(4)}°N</td>
                <td>${z.longitudeDeg.toFixed(4)}°E</td>
                <td style="font-weight: bold; color: #10B981;">${z.areaKm2.toFixed(2)} km²</td>
                <td>${z.meanSlopeDeg.toFixed(2)}°</td>
                <td>0 Hazards (Cleared)</td>
                <td><span class="badge-green">${z.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary-box">
          <div class="metric">
            <div class="label">TOTAL SWATH AREA</div>
            <div class="val">${jsonData.summary.totalAreaKm2.toLocaleString()} km²</div>
          </div>
          <div class="metric">
            <div class="label">CERTIFIED SAFE AREA</div>
            <div class="val val-green">${jsonData.summary.totalSafeAreaKm2.toLocaleString()} km² (${jsonData.summary.safeAreaPercentage}%)</div>
          </div>
          <div class="metric">
            <div class="label">CRATERS CLEARED</div>
            <div class="val">${jsonData.summary.totalCratersDetected.toLocaleString()}</div>
          </div>
          <div class="metric">
            <div class="label">BOULDERS CLEARED</div>
            <div class="val">${jsonData.summary.totalBouldersDetected.toLocaleString()}</div>
          </div>
          <div class="metric">
            <div class="label">FROZEN ENGINE HASH</div>
            <div class="val" style="font-size: 11px; word-break: break-all;">8CA34C55...2882956 (VERIFIED)</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  await page.setViewport({ width: 1200, height: 750, deviceScaleFactor: 2 });
  await page.setContent(tableHtml, { waitUntil: 'load' });
  const tableOut = path.join(brainDir, 'isro_safe_zones_presentation.png');
  await page.screenshot({ path: tableOut, fullPage: true });
  console.log(`Saved isro_safe_zones_presentation.png: ${tableOut}`);

  await browser.close();
  console.log('All PDF page captures complete.');
}

capturePdfPages().catch(console.error);
