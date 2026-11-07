const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow = null;
let backendProcess = null;

const BACKEND_PORT = 5000;
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;
const BACKEND_STARTUP_TIMEOUT_MS = 30000;
const BACKEND_CHECK_INTERVAL_MS = 300;

function waitForBackend(url, timeoutMs, intervalMs) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const check = () => {
      http.get(url, (res) => {
        res.resume();
        resolve(true);
      }).on('error', () => {
        if (Date.now() - startTime > timeoutMs) {
          reject(new Error(`Backend did not start within ${timeoutMs} milliseconds`));
        } else {
          setTimeout(check, intervalMs);
        }
      });
    };
    check();
  });
}

function startBackend() {
  const serverPath = path.join(__dirname, 'dist', 'server.cjs');
  backendProcess = spawn(process.execPath, [serverPath], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      PORT: String(BACKEND_PORT),
      NODE_ENV: 'production',
    },
    stdio: 'ignore',
    windowsHide: true,
  });
  backendProcess.on('error', (err) => {
    console.error('Backend process failed to start:', err);
  });
  backendProcess.on('exit', (code) => {
    console.log('Backend process exited with code:', code);
  });
}

function stopBackend() {
  if (backendProcess && !backendProcess.killed) {
    try {
      backendProcess.kill();
    } catch (err) {
      console.error('Failed to kill backend process:', err);
    }
    backendProcess = null;
  }
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    backgroundColor: '#0B0F17',
    title: 'LunarSafe — Autonomous Lunar Landing Hazard Assessment',
    icon: path.join(__dirname, 'build', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  try {
    await waitForBackend(BACKEND_URL, BACKEND_STARTUP_TIMEOUT_MS, BACKEND_CHECK_INTERVAL_MS);
    await mainWindow.loadURL(BACKEND_URL);
  } catch (err) {
    const errorHtml = `
      <html>
        <head><title>LunarSafe — Backend Error</title></head>
        <body style="background:#0B0F17;color:#F87171;font-family:monospace;padding:40px;">
          <h1>Backend failed to start</h1>
          <p>${err.message}</p>
          <p>Please close the application and try again.</p>
        </body>
      </html>
    `;
    await mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(errorHtml));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Force Reload', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { type: 'separator' },
        { label: 'Quit LunarSafe', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle Fullscreen', accelerator: 'F11', role: 'togglefullscreen' },
        { label: 'Toggle Developer Tools', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Zoom In', role: 'zoomIn' },
        { label: 'Zoom Out', role: 'zoomOut' },
        { label: 'Reset Zoom', role: 'resetZoom' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About LunarSafe',
          click: () => {
            dialog.showMessageBox({
              type: 'info',
              title: 'About LunarSafe',
              message: 'LunarSafe v1.0.0',
              detail: 'Autonomous Lunar Landing Hazard Assessment Platform\n' +
                      'Team Rocket · AEROX Club · Parul University\n' +
                      'Project Head: DARSHAN BAGUL (PATIL)\n\n' +
                      'Frozen Engine: 41,930 bytes\n' +
                      'SHA-256: 8CA34C558C41F0B324A207A1D758476D397319999313D59A5919E75912882956',
            });
          },
        },
        {
          label: 'Documentation',
          click: () => shell.openExternal('https://www.spaceappschallenge.org/2026/create-a-team/'),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(async () => {
  startBackend();
  buildMenu();
  await createWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopBackend();
});

app.on('will-quit', () => {
  stopBackend();
});
