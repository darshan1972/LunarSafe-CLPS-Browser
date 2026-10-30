import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';
import { DeterministicLunarEngine } from '../src/lib/imageProcessor';

async function generateOverlay() {
  const filePath = path.resolve('src/assets/samples/isro_psr_southpole_crop.png');
  const rawBuffer = fs.readFileSync(filePath);
  const parsed = PNG.sync.read(rawBuffer);

  const pixelData = {
    width: parsed.width,
    height: parsed.height,
    data: new Uint8ClampedArray(parsed.data),
  };

  const result = await DeterministicLunarEngine.processLunarImage(rawBuffer, pixelData, {
    pixelScaleMeters: 1.0,
    gridSizeMeters: 24,
    maxSlopeDeg: 10.0,
  });

  // Create an RGBA copy for drawing overlay
  const overlayPng = new PNG({ width: parsed.width, height: parsed.height });
  for (let i = 0; i < parsed.data.length; i++) {
    overlayPng.data[i] = parsed.data[i];
  }

  // Draw detected crater boxes in red
  result.craters.forEach(c => {
    const { x1, y1, x2, y2 } = c.box;
    for (let x = x1; x <= x2; x++) {
      setPixel(overlayPng, x, y1, 255, 60, 60);
      setPixel(overlayPng, x, y2, 255, 60, 60);
    }
    for (let y = y1; y <= y2; y++) {
      setPixel(overlayPng, x1, y, 255, 60, 60);
      setPixel(overlayPng, x2, y, 255, 60, 60);
    }
  });

  // Draw candidate safe zones in green
  result.safeZones.forEach(sz => {
    // sz center
    const [cx, cy] = sz.centerPixel;
    for (let dx = -5; dx <= 5; dx++) {
      setPixel(overlayPng, cx + dx, cy, 0, 230, 118);
      setPixel(overlayPng, cx, cy + dx, 0, 230, 118);
    }
  });

  function setPixel(png: PNG, x: number, y: number, r: number, g: number, b: number) {
    if (x >= 0 && x < png.width && y >= 0 && y < png.height) {
      const idx = (y * png.width + x) * 4;
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = 255;
    }
  }

  const outBuf = PNG.sync.write(overlayPng);
  const outPath = path.resolve('src/assets/samples/psr_overlay_visual.png');
  fs.writeFileSync(outPath, outBuf);

  const artifactPath = 'C:\\Users\\stuti\\.gemini\\antigravity\\brain\\0e78ad1c-a579-4db3-ae19-50f8173f5349\\psr_overlay_visual.png';
  fs.writeFileSync(artifactPath, outBuf);

  console.log(`Saved overlay visual with ${result.craters.length} crater boxes to ${outPath} and artifact directory`);
}

generateOverlay().catch(console.error);
