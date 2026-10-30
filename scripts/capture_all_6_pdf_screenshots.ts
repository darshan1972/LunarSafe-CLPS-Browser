import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer-core';

async function captureAllPdfs() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,1200']
  });

  const brainDir = 'C:\\Users\\bagul\\.gemini\\antigravity\\brain\\baed6b60-3d6b-4b88-a0f6-7cae06dced5f';

  const docs = [
    { pdf: 'LunarSafe_Methodology.pdf', png: 'doc1_methodology_page1.png' },
    { pdf: 'LunarSafe_Algorithms.pdf', png: 'doc2_algorithms_page1.png' },
    { pdf: 'LunarSafe_Validation_Results.pdf', png: 'doc3_validation_results_page1.png' },
    { pdf: 'LunarSafe_Error_Analysis.pdf', png: 'doc4_error_analysis_page1.png' },
    { pdf: 'LunarSafe_Limitations.pdf', png: 'doc5_limitations_page1.png' },
    { pdf: 'LunarSafe_References.pdf', png: 'doc6_references_page1.png' },
  ];

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1800, deviceScaleFactor: 2 });

  for (const d of docs) {
    const pdfPath = path.resolve(d.pdf);
    const pdfUrl = 'file:///' + pdfPath.replace(/\\/g, '/');
    console.log(`Loading ${d.pdf} Page 1...`);
    await page.goto(pdfUrl + '#page=1&zoom=140', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));

    const outPng = path.join(brainDir, d.png);
    await page.screenshot({ path: outPng });
    console.log(`  Saved screenshot: ${outPng}`);
  }

  await browser.close();
  console.log('All 6 PDF Page 1 screenshots successfully captured.');
}

captureAllPdfs().catch(err => {
  console.error('Failed to capture PDF screenshots:', err);
  process.exit(1);
});
