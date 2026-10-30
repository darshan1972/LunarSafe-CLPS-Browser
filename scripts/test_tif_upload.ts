import puppeteer from 'puppeteer-core';
import path from 'path';

async function testTif() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:5000', { waitUntil: 'networkidle2' });
  const fileInput = await page.$('input[type="file"]');
  console.log('Uploading apollo11_lola_dem.tif...');
  await fileInput?.uploadFile(path.resolve('src/assets/dem/apollo11_lola_dem.tif'));
  await new Promise(r => setTimeout(r, 3000));
  const err = await page.evaluate(() => {
    const el = document.querySelector('.text-red-400') || document.querySelector('[role="alert"]') || document.body;
    return el.textContent?.substring(0, 300);
  });
  console.log('Result/Error:', err);
  await browser.close();
}
testTif().catch(console.error);
