import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BROWSER_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;
const PORT = 9225;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getDebuggerUrl() {
  for (let i = 0; i < 25; i++) {
    try {
      const res = await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${PORT}/json`, resolve);
        req.on('error', reject);
      });
      let body = '';
      for await (const chunk of res) body += chunk;
      const targets = JSON.parse(body);
      const page = targets.find(t => t.type === 'page');
      if (page && page.webSocketDebuggerUrl) {
        return page.webSocketDebuggerUrl;
      }
    } catch {
      // retry
    }
    await sleep(250);
  }
  throw new Error("Could not connect to browser debugging port");
}

async function run() {
  console.log('Launching headless browser on port ' + PORT + '...');
  const browser = spawn(BROWSER_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--window-size=1400,1600',
    '--user-data-dir=C:\\Users\\stuti\\AppData\\Local\\Temp\\edge_scan_history_session',
    'about:blank'
  ]);

  try {
    const wsUrl = await getDebuggerUrl();
    const ws = new WebSocket(wsUrl);
    let id = 1;
    const callbacks = new Map();

    const send = (method, params = {}) => {
      const reqId = id++;
      return new Promise((resolve, reject) => {
        callbacks.set(reqId, { resolve, reject });
        ws.send(JSON.stringify({ id: reqId, method, params }));
      });
    };

    await new Promise(resolve => {
      ws.onopen = resolve;
    });

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && callbacks.has(data.id)) {
        const { resolve, reject } = callbacks.get(data.id);
        callbacks.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };

    console.log('Enabling CDP domains...');
    await send('Page.enable');
    await send('Runtime.enable');
    await send('DOM.enable');

    console.log('Navigating to http://localhost:5000...');
    await send('Page.navigate', { url: 'http://localhost:5000' });
    await sleep(3000);

    console.log('Clicking CH2_TMC2_MANZINUS_C sample button...');
    const clickRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const tmcBtn = buttons.find(b => b.textContent && b.textContent.includes('CH2_TMC2_MANZINUS_C'));
          if (tmcBtn) {
            tmcBtn.click();
            return 'CLICKED_TMC2';
          }
          return 'TMC2_BTN_NOT_FOUND';
        })()
      `,
      returnByValue: true
    });
    console.log('Button click status:', clickRes.result.value);

    console.log('Waiting for deterministic analysis and scan store update...');
    await sleep(4000);

    // Scroll to the Scan History Table
    await send('Runtime.evaluate', {
      expression: `
        const table = document.querySelector('[data-testid="scan-history-table"]');
        if (table) {
          table.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
      `
    });
    await sleep(1000);

    // Extract table row text
    const tableDataRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const rows = Array.from(document.querySelectorAll('[data-testid="scan-history-table"] tbody tr'));
          return rows.map(r => Array.from(r.querySelectorAll('td')).map(td => td.textContent.trim()));
        })()
      `,
      returnByValue: true
    });
    console.log('Table Rows:', JSON.stringify(tableDataRes.result.value, null, 2));

    // Capture screenshot of the table
    console.log('Capturing screenshot of Scan History Table...');
    const clipRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.querySelector('[data-testid="scan-history-table"]');
          if (!el) return null;
          const rect = el.getBoundingClientRect();
          return {
            x: rect.left,
            y: rect.top + window.scrollY,
            width: rect.width,
            height: rect.height,
            scale: 1
          };
        })()
      `,
      returnByValue: true
    });

    let screenshotParams = { format: 'png' };
    if (clipRes.result.value) {
      screenshotParams.clip = clipRes.result.value;
    }

    const shot = await send('Page.captureScreenshot', screenshotParams);
    const shotBuffer = Buffer.from(shot.data, 'base64');
    fs.writeFileSync('scan_history_table.png', shotBuffer);
    console.log('Saved screenshot to scan_history_table.png (Size:', shotBuffer.length, 'bytes)');

    // Test PDF, CSV, JSON downloads
    console.log('\n--- Testing Downloads (PDF, CSV, JSON) ---');
    const downloadTestRes = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const raw = localStorage.getItem('lunarsafe_scan_history');
          if (!raw) return { error: 'No scans in localStorage' };
          const scans = JSON.parse(raw);
          if (!scans.length) return { error: 'Empty scans' };
          const scan = scans[0];

          // Fetch from the server endpoint /api/scan/report/:id
          const pdfRes = await fetch('/api/scan/report/' + scan.id + '?format=pdf');
          const pdfBlob = await pdfRes.blob();

          const csvRes = await fetch('/api/scan/report/' + scan.id + '?format=csv');
          const csvText = await csvRes.text();

          const jsonRes = await fetch('/api/scan/report/' + scan.id + '?format=json');
          const jsonText = await jsonRes.text();

          return {
            scanId: scan.id,
            pdfBytes: pdfBlob.size,
            csvBytes: new Blob([csvText]).size,
            jsonBytes: new Blob([jsonText]).size,
            recommendation: scan.recommendation,
            confidence: scan.confidence,
            reasoning: scan.reasoning
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    console.log('Download Test Results:', downloadTestRes.result.value);

    // Save actual downloaded test files to verify sizes
    const { scanId } = downloadTestRes.result.value;
    if (scanId) {
      const httpGet = (url) => new Promise((res, rej) => {
        http.get(url, (response) => {
          const chunks = [];
          response.on('data', c => chunks.push(c));
          response.on('end', () => res(Buffer.concat(chunks)));
          response.on('error', rej);
        });
      });

      const pdfBuf = await httpGet(`http://localhost:5000/api/scan/report/${scanId}?format=pdf`);
      const csvBuf = await httpGet(`http://localhost:5000/api/scan/report/${scanId}?format=csv`);
      const jsonBuf = await httpGet(`http://localhost:5000/api/scan/report/${scanId}?format=json`);

      fs.writeFileSync(`report_${scanId}.pdf`, pdfBuf);
      fs.writeFileSync(`report_${scanId}.csv`, csvBuf);
      fs.writeFileSync(`report_${scanId}.json`, jsonBuf);

      console.log(`Saved report_${scanId}.pdf: ${pdfBuf.length} bytes`);
      console.log(`Saved report_${scanId}.csv: ${csvBuf.length} bytes`);
      console.log(`Saved report_${scanId}.json: ${jsonBuf.length} bytes`);
    }

    // Step 10: Reload the page and confirm persistence
    console.log('\n--- Reloading Page to Confirm Persistence ---');
    await send('Page.reload');
    await sleep(3000);

    const reloadedTableDataRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const rows = Array.from(document.querySelectorAll('[data-testid="scan-history-table"] tbody tr'));
          return rows.map(r => Array.from(r.querySelectorAll('td')).map(td => td.textContent.trim()));
        })()
      `,
      returnByValue: true
    });
    console.log('Reloaded Table Rows:', JSON.stringify(reloadedTableDataRes.result.value, null, 2));

    ws.close();
    console.log('\n✓ All in-browser verification steps completed successfully.');
  } finally {
    browser.kill();
  }
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
