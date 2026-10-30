const { execSync } = require('child_process');
const fs = require('fs');

fs.writeFileSync('test_print.html', '<html><body style="font-family:sans-serif;"><h1>Test Print OK</h1><p>Testing Chrome Headless PDF generation.</p></body></html>');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPdf = 'C:\\Users\\stuti\\AppData\\Local\\Temp\\test_print.pdf';
if (fs.existsSync(outPdf)) fs.unlinkSync(outPdf);
execSync(`"${chrome}" --headless=new --disable-gpu --no-sandbox --print-to-pdf="${outPdf}" test_print.html`, { stdio: 'inherit' });
if (fs.existsSync(outPdf)) {
  const stat = fs.statSync(outPdf);
  console.log('PDF generated successfully! Size:', stat.size, 'bytes');
  fs.copyFileSync(outPdf, 'test_print.pdf');
  console.log('Copied to test_print.pdf');
}

