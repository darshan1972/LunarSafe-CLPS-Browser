import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer-core';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1900, deviceScaleFactor: 2 });

  const pdfPath = path.resolve('scripts/output/audit_verified_report.pdf');
  const fileUrl = 'file:///' + pdfPath.replace(/\\/g, '/');

  // Load PDF viewer on page 1
  await page.goto(fileUrl + '#page=1&zoom=130', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'scripts/output/pdf_page1_section2.png' });
  console.log('Saved page 1');

  // Load PDF viewer on page 3 (Section 6)
  await page.goto(fileUrl + '#page=3&zoom=130', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'scripts/output/pdf_page3_section6.png' });
  console.log('Saved page 3');

  await browser.close();
}

main().catch(console.error);
