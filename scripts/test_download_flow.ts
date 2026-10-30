import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

async function testDownload() {
  const downloadDir = path.resolve('C:/Users/bagul/Desktop/LunarSafe_14_Recordings/downloads');
  if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadDir
  });

  await page.goto('http://localhost:5000', { waitUntil: 'networkidle2' });
  
  // Click Analyze Calibrated 16-bit Strip
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Analyze Calibrated 16-bit Strip'));
    if (btn) (btn as HTMLButtonElement).click();
  });
  await new Promise(r => setTimeout(r, 4000));
  
  // Click PDF button in ScanHistoryTable
  await page.evaluate(() => {
    const table = document.querySelector('[data-testid="scan-history-table"]');
    if (!table) return;
    const pdfBtn = Array.from(table.querySelectorAll('button')).find(b => b.innerText.trim() === 'PDF');
    if (pdfBtn) (pdfBtn as HTMLButtonElement).click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // Click CSV button
  await page.evaluate(() => {
    const table = document.querySelector('[data-testid="scan-history-table"]');
    if (!table) return;
    const csvBtn = Array.from(table.querySelectorAll('button')).find(b => b.innerText.trim() === 'CSV');
    if (csvBtn) (csvBtn as HTMLButtonElement).click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Click JSON button
  await page.evaluate(() => {
    const table = document.querySelector('[data-testid="scan-history-table"]');
    if (!table) return;
    const jsonBtn = Array.from(table.querySelectorAll('button')).find(b => b.innerText.trim() === 'JSON');
    if (jsonBtn) (jsonBtn as HTMLButtonElement).click();
  });
  await new Promise(r => setTimeout(r, 1000));

  console.log('Downloaded files:', fs.readdirSync(downloadDir));

  await browser.close();
}

testDownload().catch(console.error);
