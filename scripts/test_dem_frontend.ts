import puppeteer from 'puppeteer-core';
import path from 'path';

async function testDemFrontend() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5000', { waitUntil: 'networkidle2' });
  await page.waitForSelector('input[type="file"]');

  const fileInput = await page.$('input[type="file"]');
  console.log('Uploading apollo11_lola_dem.tif...');
  await fileInput?.uploadFile(path.resolve('src/assets/dem/apollo11_lola_dem.tif'));
  await new Promise(r => setTimeout(r, 4000));

  const text = await page.evaluate(() => document.body.innerText);
  console.log('Contains 1.22°:', text.includes('1.22°') || text.includes('1.22'));
  console.log('Contains Apollo 11:', text.includes('Apollo 11') || text.includes('apollo11'));
  console.log('Contains SAFE:', text.includes('SAFE'));
  console.log('Contains Total Logged:', text.includes('Total Logged:'));

  // Look for mission stats snippet
  const idx = text.indexOf('MISSION STATS');
  if (idx !== -1) {
    console.log('\n--- MISSION STATS SNIPPET ---\n', text.substring(idx, idx + 400));
  } else {
    console.log('Full text snippet (500 chars):\n', text.substring(500, 1000));
  }

  await browser.close();
}

testDemFrontend().catch(console.error);
