const { chromium } = require('playwright');
const { spawnSync, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ffmpegExe = execSync('python -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"', { encoding: 'utf8' }).trim();

async function run() {
  const videoDir = path.resolve('temp_record_dir');
  if (fs.existsSync(videoDir)) {
    fs.rmSync(videoDir, { recursive: true, force: true });
  }
  fs.mkdirSync(videoDir, { recursive: true });

  console.log('--- LAUNCHING SYNCHRONIZED DEMO RECORDING ---');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: [
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-webgl',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--window-size=1920,1080',
      '--no-sandbox'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: videoDir,
      size: { width: 1920, height: 1080 }
    }
  });

  const t0 = Date.now();
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForSelector('canvas');
  await page.waitForTimeout(2000); // allow Three.js textures & shaders to settle

  // Inject visible custom glowing cursor
  await page.evaluate(() => {
    const cursor = document.createElement('div');
    cursor.id = 'demo-cursor';
    cursor.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 26px; height: 26px;
      background: radial-gradient(circle, rgba(6,182,212,1) 0%, rgba(6,182,212,0.7) 50%, rgba(6,182,212,0) 80%);
      border: 2.5px solid #ffffff;
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999999;
      transform: translate(-50%, -50%);
      box-shadow: 0 0 25px rgba(6,182,212,1), 0 0 50px rgba(6,182,212,0.6);
      transition: transform 0.08s ease-out, background 0.15s, border-color 0.15s;
    `;
    document.body.appendChild(cursor);

    window.addEventListener('mousemove', e => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    });
    window.addEventListener('mousedown', () => {
      cursor.style.transform = 'translate(-50%, -50%) scale(0.7)';
      cursor.style.background = 'radial-gradient(circle, rgba(239,68,68,1) 0%, rgba(239,68,68,0.8) 60%, rgba(239,68,68,0) 90%)';
      cursor.style.borderColor = '#ffaaaa';
    });
    window.addEventListener('mouseup', () => {
      cursor.style.transform = 'translate(-50%, -50%) scale(1.0)';
      cursor.style.background = 'radial-gradient(circle, rgba(6,182,212,1) 0%, rgba(6,182,212,0.7) 50%, rgba(6,182,212,0) 80%)';
      cursor.style.borderColor = '#ffffff';
    });
  });

  const tStart = Date.now();
  const startOffsetSec = ((tStart - t0) / 1000).toFixed(3);
  console.log(`>>> EXACT START TIMESTAMP: ${startOffsetSec}s from page creation.`);

  async function smoothMove(startX, startY, endX, endY, durationMs) {
    const steps = Math.max(10, Math.floor(durationMs / 25));
    for (let i = 1; i <= steps; i++) {
      const x = startX + (endX - startX) * (i / steps);
      const y = startY + (endY - startY) * (i / steps);
      await page.mouse.move(x, y);
      await page.waitForTimeout(25);
    }
  }

  // ========================================================
  // SCENE 1 [0.0s - 7.60s]: 3D Moon Rotation
  // "This is LunarSafe 2.0. We visualize the Lunar South Pole using real NASA LRO LOLA elevation data..."
  // ========================================================
  console.log('[SCENE 1: 0.0s - 7.60s] Smoothly rotating 3D Moon...');
  await page.mouse.move(1050, 480);
  await page.mouse.down();

  // Smooth rotation drag for 7.0 seconds
  const scene1Steps = 70;
  for (let i = 1; i <= scene1Steps; i++) {
    const x = 1050 - (i * 5.0);
    const y = 480 + Math.sin(i / 7) * 10;
    await page.mouse.move(x, y);
    await page.waitForTimeout(100);
  }
  await page.mouse.up();
  await page.waitForTimeout(600);

  // ========================================================
  // SCENE 2 [7.60s - 14.86s]: What-If Slider to 8.0° (RED HAZARD)
  // "By dragging the slope tolerance, our deterministic engine instantly recalculates safety..."
  // ========================================================
  console.log('[SCENE 2: 7.60s - 14.86s] Selecting Malapert Mountain and dragging slider to 8.0°...');
  await page.evaluate(() => {
    if (window.__selectArtemisSite) window.__selectArtemisSite('Malapert Mountain');
  });

  // Move cursor quickly to slider handle in drawer
  await smoothMove(700, 480, 1680, 390, 500);
  await page.mouse.down();

  // Drag slider left to 8.0° in 800ms
  await smoothMove(1680, 390, 1530, 390, 800);
  await page.mouse.up();

  // Instantly trigger RED hazard state in DOM
  await page.evaluate(() => {
    const range = document.querySelector('input[type="range"][min="8.0"][max="15.0"]');
    if (range) {
      range.value = '8.0';
      range.dispatchEvent(new Event('input', { bubbles: true }));
      range.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  // Move cursor to hover the red card ("CRITICAL HAZARD DETECTED") and 8.0° badge
  await smoothMove(1530, 390, 1680, 260, 500);
  // Hold red state for remaining duration
  await page.waitForTimeout(5460);

  // ========================================================
  // SCENE 3 [14.86s - 20.25s]: Rank All 13 Sites Modal
  // "Our decision matrix compares regions, including solar illumination and Earth communication visibility."
  // ========================================================
  console.log('[SCENE 3: 14.86s - 20.25s] Opening Rank All 13 Sites decision matrix...');
  await smoothMove(1680, 260, 1680, 680, 400);
  await page.mouse.down();
  await page.waitForTimeout(80);
  await page.mouse.up();

  await page.evaluate(() => {
    if (window.__openRankMatrix) window.__openRankMatrix();
  });
  await page.waitForTimeout(400);

  // Hover over Solar Illumination / Lighting %
  await smoothMove(1680, 680, 1080, 430, 700);
  await page.waitForTimeout(1600);

  // Hover over Earth Comm Visibility
  await smoothMove(1080, 430, 1260, 480, 700);
  await page.waitForTimeout(1510);

  // ========================================================
  // SCENE 4 [20.25s - 26.14s]: Live NASA PDS API Connection
  // "We are also live-connected to the NASA Planetary Data System API, querying metadata..."
  // ========================================================
  console.log('[SCENE 4: 20.25s - 26.14s] Closing matrix & pinging live NASA PDS API...');
  await page.evaluate(() => {
    if (window.__closeRankMatrix) window.__closeRankMatrix();
  });
  await page.waitForTimeout(200);

  // Move cursor to PING API button
  const pingBtn = page.locator('button:has-text("PING API"), button:has-text("PINGING...")').first();
  const pingBox = await pingBtn.boundingBox();
  const pX = pingBox ? pingBox.x + pingBox.width / 2 : 360;
  const pY = pingBox ? pingBox.y + pingBox.height / 2 : 210;

  await smoothMove(1260, 480, pX, pY, 600);
  await page.mouse.down();
  await page.waitForTimeout(80);
  await page.mouse.up();

  if (await pingBtn.isVisible()) {
    await pingBtn.click();
  }

  // Watch status change to CONNECTED
  await page.waitForTimeout(1800);
  // Glance at Mission Terminal logs
  await smoothMove(pX, pY, 450, 780, 600);
  await page.waitForTimeout(2610);

  // ========================================================
  // SCENE 5 [26.14s - 34.10s]: SHA-256 Cryptographic Ledger
  // "Every calculation is sealed in a tamper-evident SHA-256 hash chain. Open, reproducible, and auditable. Code on GitHub."
  // ========================================================
  console.log('[SCENE 5: 26.14s - 34.10s] Opening SHA-256 Verification Modal...');
  await smoothMove(450, 780, 1680, 750, 600);
  await page.mouse.down();
  await page.waitForTimeout(80);
  await page.mouse.up();

  await page.evaluate(() => {
    if (window.__openCryptoAudit) window.__openCryptoAudit();
  });
  await page.waitForTimeout(500);

  // Hover over the verified SHA-256 hash digest in the center
  await smoothMove(1680, 750, 960, 520, 700);
  await page.waitForTimeout(6080);

  console.log('--- ALL ACTIONS COMPLETED. Closing browser... ---');
  await context.close();
  await browser.close();

  // Find recorded webm
  const files = fs.readdirSync(videoDir);
  const webmFile = files.find(f => f.endsWith('.webm'));
  const rawWebmPath = path.join(videoDir, webmFile);
  console.log('Recorded raw webm file:', rawWebmPath);

  const masterAudio = path.resolve('audio_clean/master_narration_clean.mp3');
  const finalVideo = path.resolve('LunarSafe_30s_Live_Demo.mp4');
  const evidenceVideo = path.resolve('evidence/LunarSafe_30s_Live_Demo.mp4');
  const rootVideo = path.resolve('../LunarSafe_30s_Live_Demo.mp4');

  console.log(`Multiplexing with frame-accurate seek: -ss ${startOffsetSec}...`);
  const ffmpegArgs = [
    '-y',
    '-i', rawWebmPath,
    '-ss', startOffsetSec,
    '-t', '34.10',
    '-i', masterAudio,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    '-movflags', '+faststart',
    finalVideo
  ];

  const res = spawnSync(ffmpegExe, ffmpegArgs, { stdio: 'inherit' });
  if (res.status !== 0) {
    throw new Error(`FFmpeg exited with code ${res.status}`);
  }

  // Copy to evidence and workspace root
  fs.copyFileSync(finalVideo, evidenceVideo);
  fs.copyFileSync(finalVideo, rootVideo);

  console.log('========================================================');
  console.log('🎉 PERFECTLY SYNCHRONIZED DEMO GENERATED!');
  console.log('Output:', finalVideo);
  console.log('Evidence:', evidenceVideo);
  console.log('Root:', rootVideo);
  console.log('========================================================');
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
