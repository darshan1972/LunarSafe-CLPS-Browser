import puppeteer from 'puppeteer-core';
import path from 'path';

async function testUpload() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:5000', { waitUntil: 'networkidle2' });
  await page.waitForSelector('input[type="file"]');
  const fileInput = await page.$('input[type="file"]');
  if (!fileInput) throw new Error('File input not found');

  console.log('Uploading apollo11_lola_dem.png...');
  await fileInput.uploadFile(path.resolve('src/assets/dem/apollo11_lola_dem.png'));
  await new Promise(r => setTimeout(r, 4000));

  const text = await page.evaluate(() => document.body.innerText);
  console.log('Page has Apollo / Safe:', text.includes('apollo11') || text.includes('Apollo'), text.includes('SAFE'));
  await browser.close();
}

testUpload().catch(console.error);
