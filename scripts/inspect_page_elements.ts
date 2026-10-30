import puppeteer from 'puppeteer-core';
import path from 'path';

async function inspectPage() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5000', { waitUntil: 'networkidle2' });

  // Upload apollo11_lola_dem.png
  const fileInput = await page.$('input[type="file"]');
  await fileInput?.uploadFile(path.resolve('src/assets/dem/apollo11_lola_dem.png'));
  await new Promise(r => setTimeout(r, 4000));

  const pageInfo = await page.evaluate(() => {
    // Find all export buttons
    const buttons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim());
    const text = document.body.innerText;
    return { buttons, textSnippet: text.substring(0, 1500) };
  });

  console.log('Buttons:', pageInfo.buttons);
  console.log('Text Snippet:\n', pageInfo.textSnippet);
  await browser.close();
}

inspectPage().catch(console.error);
