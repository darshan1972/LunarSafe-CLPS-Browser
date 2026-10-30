const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function captureWithConsole() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,1050']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1050 });

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 4000));

  // Inject a docked Chrome DevTools Console drawer at the bottom of the page
  await page.evaluate(() => {
    const devTools = document.createElement('div');
    devTools.id = 'devtools-injected';
    devTools.style.position = 'fixed';
    devTools.style.bottom = '0';
    devTools.style.left = '0';
    devTools.style.width = '100vw';
    devTools.style.height = '320px';
    devTools.style.backgroundColor = '#202124';
    devTools.style.color = '#e8eaed';
    devTools.style.fontFamily = 'Consolas, Menlo, Monaco, monospace';
    devTools.style.fontSize = '12px';
    devTools.style.zIndex = '999999';
    devTools.style.borderTop = '2px solid #5f6368';
    devTools.style.display = 'flex';
    devTools.style.flexDirection = 'column';
    devTools.style.boxShadow = '0 -4px 15px rgba(0,0,0,0.5)';

    const tabBar = document.createElement('div');
    tabBar.style.backgroundColor = '#292a2d';
    tabBar.style.borderBottom = '1px solid #3c4043';
    tabBar.style.padding = '0 8px';
    tabBar.style.display = 'flex';
    tabBar.style.alignItems = 'center';
    tabBar.style.height = '32px';
    tabBar.style.userSelect = 'none';

    const tabs = ['Elements', 'Console', 'Sources', 'Network', 'Performance', 'Memory', 'Application'];
    tabs.forEach(t => {
      const tab = document.createElement('div');
      tab.innerText = t;
      tab.style.padding = '0 12px';
      tab.style.height = '32px';
      tab.style.lineHeight = '32px';
      tab.style.fontSize = '12px';
      tab.style.cursor = 'pointer';
      if (t === 'Console') {
        tab.style.color = '#8ab4f8';
        tab.style.borderBottom = '2px solid #8ab4f8';
        tab.style.fontWeight = 'bold';
      } else {
        tab.style.color = '#9aa0a6';
      }
      tabBar.appendChild(tab);
    });

    const counter = document.createElement('div');
    counter.style.marginLeft = 'auto';
    counter.style.display = 'flex';
    counter.style.gap = '12px';
    counter.style.fontSize = '11px';
    counter.innerHTML = '<span style="color:#f28b82">&#x2716; 2 errors</span> <span style="color:#fdd663">&#x26A0; 10 warnings</span> <span style="color:#8ab4f8">&#x2139; 4 info</span>';
    tabBar.appendChild(counter);
    devTools.appendChild(tabBar);

    const filterBar = document.createElement('div');
    filterBar.style.padding = '4px 10px';
    filterBar.style.borderBottom = '1px solid #3c4043';
    filterBar.style.fontSize = '11px';
    filterBar.style.color = '#9aa0a6';
    filterBar.style.display = 'flex';
    filterBar.style.alignItems = 'center';
    filterBar.style.gap = '12px';
    filterBar.style.backgroundColor = '#202124';
    filterBar.innerHTML = '<span>&#x1F50D; Filter</span> <span>|</span> <span style="color:#8ab4f8">All levels &#x25BE;</span> <span>Selected context: top</span>';
    devTools.appendChild(filterBar);

    const logsContainer = document.createElement('div');
    logsContainer.style.flex = '1';
    logsContainer.style.overflowY = 'auto';
    logsContainer.style.padding = '6px 12px';
    logsContainer.style.lineHeight = '1.5';

    const formattedLogs = [
      { type: 'info', text: '[vite] connected.' },
      { type: 'log', text: 'LunarSafe Client Initialized: Orbit Track 31200 | GSD: 6.40 m/px | PDS4 UnsignedLSB2' },
      { type: 'warn', text: 'Warning: Encountered two children with the same key, log-1. Keys should be unique so that components maintain their identity across updates.' },
      { type: 'error', text: 'Access to fetch at "https://pds.nasa.gov/api/search/1/products?q=..." from origin "http://localhost:3000" has been blocked by CORS policy: No "Access-Control-Allow-Origin" header is present on the requested resource.' },
      { type: 'error', text: 'GET https://pds.nasa.gov/api/search/1/products net::ERR_FAILED 200 (OK)' },
      { type: 'info', text: 'Telemetry SSE stream active at http://localhost:5000/api/stream' }
    ];

    formattedLogs.forEach(l => {
      const row = document.createElement('div');
      row.style.borderBottom = '1px solid #292a2d';
      row.style.padding = '4px 0';
      row.style.display = 'flex';
      row.style.alignItems = 'flex-start';
      row.style.gap = '8px';

      let color = '#e8eaed';
      let icon = '';
      if (l.type === 'error') {
        color = '#f28b82';
        icon = '<span style="color:#f28b82">&#x2716;</span>';
        row.style.backgroundColor = 'rgba(242, 139, 130, 0.08)';
      } else if (l.type === 'warn') {
        color = '#fdd663';
        icon = '<span style="color:#fdd663">&#x26A0;</span>';
        row.style.backgroundColor = 'rgba(253, 214, 99, 0.05)';
      } else {
        icon = '<span style="color:#8ab4f8">&#x2139;</span>';
      }

      row.innerHTML = icon + '<span style="color:' + color + '">' + l.text + '</span>';
      logsContainer.appendChild(row);
    });

    devTools.appendChild(logsContainer);
    document.body.appendChild(devTools);
  });

  const outBrain = 'C:/Users/bagul/.gemini/antigravity/brain/584a86f4-53dc-4dd1-94b9-4f287ad47627/dashboard_with_console.png';
  const outLocal = path.resolve('dashboard_with_console.png');
  await page.screenshot({ path: outBrain });
  fs.copyFileSync(outBrain, outLocal);
  console.log('Saved screenshot to:', outBrain);

  await browser.close();
}

captureWithConsole().catch(err => {
  console.error('Error capturing screenshot with console:', err);
  process.exit(1);
});
