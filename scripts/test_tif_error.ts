import puppeteer from 'puppeteer-core';
import path from 'path';

async function testTif() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  await page.goto('http://localhost:5000', { waitUntil: 'networkidle2' });
  const fileInput = await page.$('input[type="file"]');
  await fileInput?.uploadFile(path.resolve('src/assets/dem/apollo11_lola_dem.tif'));
  await new Promise(r => setTimeout(r, 4000));
  const errText = await page.evaluate(() => {
    const errorEl = Array.from(document.querySelectorAll('*')).find(e => e.textContent && (e.textContent.includes('Upload error') || e.textContent.includes('Failed')));
    return errorEl ? errorEl.textContent : 'none';
  });
  console.log('Error found:', errText);
  await browser.close();
}
testTif().catch(console.error);
