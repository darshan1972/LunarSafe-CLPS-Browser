import { chromium } from 'playwright';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function generateScreenshots() {
  console.log('🚀 Launching headless browser for NASA App Presentation Capture...');

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=swiftshader', '--enable-webgl']
    });
  } catch (err) {
    console.log('Standard launch failed, attempting with system Chrome:', err.message);
    browser = await chromium.launch({
      headless: true,
      channel: 'chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  console.log('🌐 Loading http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 45000 });

  // 1. Wait for canvas and 3D data to initialize
  await page.waitForSelector('canvas', { timeout: 30000 });
  console.log('⏳ Waiting for 3D terrain mesh and textures to render...');
  await page.waitForTimeout(5000);

  // Take Screenshot 1: The default 3D Moon view
  console.log('📸 Capturing Screenshot 1: Default 3D Moon view...');
  const shot1 = await page.screenshot({ fullPage: false });

  // Take Screenshot 2: The 3D Moon with the "NASA Slope Overlay" toggled ON
  console.log('📸 Capturing Screenshot 2: NASA Slope Overlay toggled ON...');
  const slopeToggle = page.locator('text=NASA Slope Overlay').first();
  if (await slopeToggle.isVisible()) {
    await slopeToggle.click();
  } else {
    await page.evaluate(() => window.__setSlopeOverlay?.(true));
  }
  await page.waitForTimeout(3000);
  const shot2 = await page.screenshot({ fullPage: false });

  // Take Screenshot 3: Clicking the Malapert Mountain pin to show the side panel
  console.log('📸 Capturing Screenshot 3: Malapert Mountain telemetry side panel...');
  await page.evaluate(() => window.__selectArtemisSite?.('Malapert Mountain'));
  await page.waitForSelector('text=Malapert Mountain', { timeout: 15000 });
  await page.waitForTimeout(3000);
  const shot3 = await page.screenshot({ fullPage: false });

  // Take Screenshot 4: Clicking the "Rank All 13 Sites" button to show the matrix
  console.log('📸 Capturing Screenshot 4: Artemis III Multi-Site Ranking Matrix...');
  const rankButton = page.locator('button:has-text("Rank All 13 Sites")').first();
  if (await rankButton.isVisible()) {
    await rankButton.click();
  } else {
    await page.evaluate(() => window.__openRankMatrix?.());
  }
  await page.waitForSelector('text=Artemis III Candidate Sites Multi-Ranking', { timeout: 15000 });
  await page.waitForTimeout(3000);
  const shot4 = await page.screenshot({ fullPage: false });

  // Take Screenshot 5: Clicking the SHA-256 Crypto badge to show the hash popup
  console.log('📸 Capturing Screenshot 5: SHA-256 Cryptographic Audit modal...');
  // Close the ranking matrix cleanly
  await page.evaluate(() => window.__closeRankMatrix?.());
  await page.waitForTimeout(1000);

  // Open the SHA-256 Data Verified audit modal
  await page.evaluate(() => window.__openCryptoAudit?.());
  await page.waitForSelector('text=SHA-256 Telemetry Verification Ledger', { timeout: 15000 });
  await page.waitForTimeout(3000);
  const shot5 = await page.screenshot({ fullPage: false });

  await browser.close();

  // Combine into a single PDF
  console.log('📄 Assembling screenshots into NASA_App_Screenshots.pdf...');
  const pdfDoc = await PDFDocument.create();

  const shots = [
    { buf: shot1, name: '1. Default 3D Moon View' },
    { buf: shot2, name: '2. NASA Slope Overlay ON' },
    { buf: shot3, name: '3. Malapert Mountain Telemetry' },
    { buf: shot4, name: '4. Artemis III Ranking Matrix' },
    { buf: shot5, name: '5. SHA-256 Cryptographic Audit' },
  ];

  for (const shot of shots) {
    const img = await pdfDoc.embedPng(shot.buf);
    const pdfPage = pdfDoc.addPage([1920, 1080]);
    pdfPage.drawImage(img, {
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
    });
  }

  const pdfBytes = await pdfDoc.save();

  // Save in local project root and parent project root
  const dest1 = path.resolve('NASA_App_Screenshots.pdf');
  const dest2 = path.resolve('..', 'NASA_App_Screenshots.pdf');

  fs.writeFileSync(dest1, pdfBytes);
  try {
    fs.writeFileSync(dest2, pdfBytes);
  } catch {}

  console.log(`🎉 Successfully generated: ${dest1}`);
  console.log(`📁 File Size: ${(pdfBytes.length / (1024 * 1024)).toFixed(2)} MB (5 pages @ 1920x1080)`);
}

generateScreenshots().catch(err => {
  console.error('❌ Error generating screenshots:', err);
  process.exit(1);
});
