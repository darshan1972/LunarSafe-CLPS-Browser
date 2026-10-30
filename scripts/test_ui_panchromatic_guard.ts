import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

async function runUITest() {
  console.log('================================================================');
  console.log('LUNARSAFE BROWSER UI TEST: PANCHROMATIC GUARD REJECTION');
  console.log('================================================================\n');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (!fs.existsSync(chromePath)) {
    throw new Error(`Chrome not found at ${chromePath}`);
  }

  const samplePath = path.resolve('src/assets/samples/color_terrestrial.png');
  if (!fs.existsSync(samplePath)) {
    throw new Error(`Test sample not found at ${samplePath}`);
  }

  // Count records in .scan_history.json before test
  const historyPath = path.resolve('.scan_history.json');
  let scansBefore = 0;
  if (fs.existsSync(historyPath)) {
    const data = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    scansBefore = Array.isArray(data) ? data.length : 0;
  }
  console.log(`[PRE-TEST STATE]: Scans recorded in .scan_history.json: ${scansBefore}`);

  console.log('[BROWSER]: Launching headless Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    console.log('[BROWSER]: Navigating to http://localhost:5000...');
    await page.goto('http://localhost:5000', { waitUntil: 'domcontentloaded', timeout: 15000 });

    const pageTitle = await page.title();
    console.log(`[BROWSER]: Page loaded. Title: "${pageTitle}"`);

    // Locate the file input
    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) {
      throw new Error('Could not find file input element on page');
    }
    console.log('[BROWSER]: Located file input element.');

    console.log(`[BROWSER]: Uploading non-lunar colour photo: ${samplePath}`);
    await fileInput.uploadFile(samplePath);

    // Wait for rejection UI to appear
    console.log('[BROWSER]: Waiting for Panchromatic Guard Rejection UI...');
    await page.waitForFunction(
      () => {
        const text = document.body.innerText;
        return (
          text.includes('Panchromatic Guard Rejection') ||
          text.includes('Panchromatic Validation Error') ||
          text.includes('Single-band panchromatic lunar sensor requirement')
        );
      },
      { timeout: 10000 }
    );

    // Extract rejection details from the DOM
    const rejectionData = await page.evaluate(() => {
      const bodyTextLower = document.body.innerText.toLowerCase();
      const hasRejectionTitle =
        bodyTextLower.includes('panchromatic guard rejection') ||
        bodyTextLower.includes('panchromatic validation error');
      const hasRejectionDetail =
        bodyTextLower.includes('single-band panchromatic lunar sensor requirement') ||
        bodyTextLower.includes('chromatic variance');
      const hasAbortedNotice =
        bodyTextLower.includes('aborted: non-lunar panchromatic rejection') ||
        bodyTextLower.includes('0 craters, 0 boulders');

      // Check localStorage scan history
      const localScans = localStorage.getItem('lunarsafe_scan_history');
      const parsedLocal = localScans ? JSON.parse(localScans) : [];

      return {
        hasRejectionTitle,
        hasRejectionDetail,
        hasAbortedNotice,
        localScanCount: parsedLocal.length,
      };
    });

    console.log('\n--- BROWSER UI REJECTION OBSERVATION ---');
    console.log(`Panchromatic Guard Rejection Screen Rendered: ${rejectionData.hasRejectionTitle ? 'YES (Confirmed)' : 'NO'}`);
    console.log(`Rejection Detail Explanation Present:        ${rejectionData.hasRejectionDetail ? 'YES (Confirmed)' : 'NO'}`);
    console.log(`Hazard Detection Aborted Notice Present:      ${rejectionData.hasAbortedNotice ? 'YES (Confirmed)' : 'NO'}`);

    // Check .scan_history.json after test
    let scansAfter = 0;
    if (fs.existsSync(historyPath)) {
      const dataAfter = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      scansAfter = Array.isArray(dataAfter) ? dataAfter.length : 0;
    }
    console.log(`[POST-TEST STATE]: Scans in .scan_history.json: ${scansAfter} (Before: ${scansBefore})`);
    console.log(`[POST-TEST STATE]: Scans in localStorage:       ${rejectionData.localScanCount}`);

    // Take screenshot
    const screenshotDir = path.resolve('scratch');
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
    const screenshotPath = path.join(screenshotDir, 'ui_rejection_screenshot.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`[SCREENSHOT]: Saved UI evidence to ${screenshotPath}`);

    // Assertions
    const rejectionConfirmed = rejectionData.hasRejectionTitle;
    const noNewFileRecord = scansAfter === scansBefore;

    console.log('\n--- TEST ASSERTIONS ---');
    console.log(`[ASSERT 1] Panchromatic Guard Rejection UI displayed: ${rejectionConfirmed ? 'PASS' : 'FAIL'}`);
    console.log(`[ASSERT 2] No scan record written to scan history:   ${noNewFileRecord ? 'PASS (0 records added)' : 'FAIL'}`);

    if (rejectionConfirmed && noNewFileRecord) {
      console.log('\n============================================================');
      console.log('UI TEST RESULT: PASSED (Panchromatic Guard rejection 100% verified)');
      console.log('============================================================');
    } else {
      console.error('\nUI TEST RESULT: FAILED');
      process.exit(1);
    }
  } finally {
    await browser.close();
  }
}

runUITest().catch(err => {
  console.error('UI Test Error:', err);
  process.exit(1);
});
