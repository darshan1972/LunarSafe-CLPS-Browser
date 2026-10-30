import puppeteer from 'puppeteer-core';
import * as path from 'path';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000)); // wait for animations / 3D canvas

    const screenshotPath = path.resolve('dashboard_screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`Screenshot saved successfully: ${screenshotPath}`);
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('Failed to take screenshot:', err);
  process.exit(1);
});
