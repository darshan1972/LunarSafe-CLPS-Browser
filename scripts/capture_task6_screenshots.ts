import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer-core';

async function captureTask6Screenshots() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--window-size=1400,1200']
  });

  const brainDir = 'C:\\Users\\bagul\\.gemini\\antigravity\\brain\\baed6b60-3d6b-4b88-a0f6-7cae06dced5f';
  const submissionScreenshotsDir = 'C:\\Users\\bagul\\Desktop\\LunarSafe_ISRO_Submission\\07_Screenshots';

  const targets = [
    {
      pdf: 'LunarSafe_ISRO_Cover_Letter.pdf',
      page: 1,
      zoom: 140,
      outName: 'isro_cover_letter_page1.png'
    },
    {
      pdf: 'LunarSafe_Executive_Summary.pdf',
      page: 1,
      zoom: 140,
      outName: 'isro_executive_summary_page1.png'
    },
    {
      pdf: 'LunarSafe_Executive_Summary.pdf',
      page: 2,
      zoom: 140,
      outName: 'isro_executive_summary_page2.png'
    }
  ];

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1900, deviceScaleFactor: 2 });

  for (const t of targets) {
    const pdfPath = path.resolve(t.pdf);
    const pdfUrl = 'file:///' + pdfPath.replace(/\\/g, '/');
    console.log(`Loading ${t.pdf} Page ${t.page}...`);
    await page.goto(`${pdfUrl}#page=${t.page}&zoom=${t.zoom}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1800));

    const outPng = path.join(brainDir, t.outName);
    await page.screenshot({ path: outPng });
    console.log(`Saved screenshot: ${outPng} (${fs.statSync(outPng).size} bytes)`);

    if (fs.existsSync(submissionScreenshotsDir)) {
      const copyDest = path.join(submissionScreenshotsDir, t.outName);
      fs.copyFileSync(outPng, copyDest);
      console.log(`Copied to submission screenshots: ${copyDest}`);
    }
  }

  await browser.close();
  console.log('All Task 6 Screenshots successfully captured.');
}

captureTask6Screenshots().catch(err => {
  console.error('Failed to capture Task 6 screenshots:', err);
  process.exit(1);
});
