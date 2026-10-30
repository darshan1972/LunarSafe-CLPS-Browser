import { PNG } from 'pngjs';
import * as fs from 'fs';
import * as path from 'path';

const outDir = path.resolve('src/assets/samples');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. Chandrayaan-2 TMC-2 Nadir Strip (512x512, panchromatic grayscale)
function createTmc2Sample() {
  const width = 512;
  const height = 512;
  const png = new PNG({ width, height });

  // Deterministic seed simulation of lunar terrain:
  // Base regolith albedo ~ 95
  // Craters: circular depressions with sunlit rim on NE (45°) and shadow on SW (225°)
  const craters = [
    { x: 120, y: 140, r: 42, depth: 40 },
    { x: 380, y: 160, r: 55, depth: 50 },
    { x: 260, y: 350, r: 68, depth: 65 },
    { x: 100, y: 410, r: 28, depth: 30 },
    { x: 440, y: 420, r: 32, depth: 32 },
    { x: 210, y: 110, r: 18, depth: 22 },
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Base undulating terrain: smooth low-frequency noise
      let val = 100 +
        12 * Math.sin(x * 0.02 + y * 0.015) +
        8 * Math.cos(x * 0.035 - y * 0.025) +
        4 * Math.sin(x * 0.08 + y * 0.07);

      // Craters
      for (const c of craters) {
        const dx = x - c.x;
        const dy = y - c.y;
        const dist = Math.hypot(dx, dy);

        if (dist < c.r * 1.4) {
          if (dist < c.r) {
            // Inside crater: deep shadow in SW, illumination in NE
            const angle = Math.atan2(dy, dx);
            const shadowFactor = Math.sin(angle - Math.PI / 4);
            val -= c.depth * (1 - dist / c.r) * 0.9;
            val += shadowFactor * 35 * (1 - dist / c.r);
          } else if (dist < c.r * 1.3) {
            // Raised rim
            const rimFactor = (dist - c.r) / (c.r * 0.3);
            val += 25 * (1 - rimFactor);
          }
        }
      }

      val = Math.max(10, Math.min(245, Math.round(val)));

      // Strict panchromatic grayscale: R = G = B
      png.data[idx] = val;
      png.data[idx + 1] = val;
      png.data[idx + 2] = val;
      png.data[idx + 3] = 255;
    }
  }

  const buffer = PNG.sync.write(png);
  fs.writeFileSync(path.join(outDir, 'ch2_tmc2_south_pole.png'), buffer);
  console.log('Created ch2_tmc2_south_pole.png');
}

// 2. Chandrayaan-2 OHRC High-Resolution Swath (0.25m/px, 512x512)
function createOhrcSample() {
  const width = 512;
  const height = 512;
  const png = new PNG({ width, height });

  // Several prominent boulders and micro-craters
  const boulders = [
    { x: 180, y: 220, r: 6, h: 45 },
    { x: 310, y: 190, r: 5, h: 40 },
    { x: 330, y: 205, r: 4, h: 35 },
    { x: 150, y: 380, r: 7, h: 50 },
    { x: 420, y: 310, r: 5, h: 38 },
  ];

  const microCraters = [
    { x: 90, y: 90, r: 24, depth: 35 },
    { x: 400, y: 120, r: 30, depth: 40 },
    { x: 240, y: 400, r: 35, depth: 45 },
    { x: 390, y: 440, r: 20, depth: 25 },
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      let val = 120 + 8 * Math.sin(x * 0.04) + 6 * Math.cos(y * 0.04);

      // Micro-craters
      for (const c of microCraters) {
        const dx = x - c.x;
        const dy = y - c.y;
        const dist = Math.hypot(dx, dy);
        if (dist < c.r) {
          const angle = Math.atan2(dy, dx);
          const shadowFactor = Math.sin(angle - Math.PI / 4);
          val -= c.depth * (1 - dist / c.r);
          val += shadowFactor * 30 * (1 - dist / c.r);
        } else if (dist < c.r * 1.25) {
          val += 20 * (1 - (dist - c.r) / (c.r * 0.25));
        }
      }

      // Boulders: bright specular crest + trailing shadow
      for (const b of boulders) {
        const dx = x - b.x;
        const dy = y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < b.r) {
          // Sunlit top-left
          if (dx + dy < 0) {
            val += b.h * 1.8;
          } else {
            val -= b.h * 0.9;
          }
        } else if (dx > 0 && dy > 0 && dist < b.r * 2.2) {
          // Shadow cast to SE
          val -= b.h * 1.2;
        }
      }

      val = Math.max(15, Math.min(250, Math.round(val)));

      png.data[idx] = val;
      png.data[idx + 1] = val;
      png.data[idx + 2] = val;
      png.data[idx + 3] = 255;
    }
  }

  const buffer = PNG.sync.write(png);
  fs.writeFileSync(path.join(outDir, 'ch2_ohrc_touchdown.png'), buffer);
  console.log('Created ch2_ohrc_touchdown.png');
}

// 3. Permanently Shadowed Region (PSR Crater)
function createPsrSample() {
  const width = 512;
  const height = 512;
  const png = new PNG({ width, height });

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Dark crater interior with faint secondary scatter
      const distFromCenter = Math.hypot(x - 256, y - 256);
      let val: number;

      if (distFromCenter > 200) {
        // Sunlit outer rim
        val = 90 + 30 * Math.sin(x * 0.05);
      } else if (distFromCenter > 170) {
        // Rim transition
        val = 35 + 40 * ((distFromCenter - 170) / 30);
      } else {
        // Deep shadow inside PSR: values around 15-30
        val = 18 + 8 * Math.sin(x * 0.03 + y * 0.02) + 5 * Math.cos(x * 0.05);
      }

      val = Math.max(5, Math.min(240, Math.round(val)));

      png.data[idx] = val;
      png.data[idx + 1] = val;
      png.data[idx + 2] = val;
      png.data[idx + 3] = 255;
    }
  }

  const buffer = PNG.sync.write(png);
  fs.writeFileSync(path.join(outDir, 'psr_shadow_zone.png'), buffer);
  console.log('Created psr_shadow_zone.png');
}

// 4. Non-Lunar Color Terrestrial Image (Testing Color-Variance Rejection Filter)
function createColorSample() {
  const width = 512;
  const height = 512;
  const png = new PNG({ width, height });

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Terrestrial blue sky at top, green grass in middle, red dirt at bottom
      if (y < 180) {
        // Sky
        png.data[idx] = 70;      // R
        png.data[idx + 1] = 130; // G
        png.data[idx + 2] = 220; // B
      } else if (y < 360) {
        // Vegetation
        png.data[idx] = 40;      // R
        png.data[idx + 1] = 160; // G
        png.data[idx + 2] = 50;  // B
      } else {
        // Red soil
        png.data[idx] = 190;     // R
        png.data[idx + 1] = 60;  // G
        png.data[idx + 2] = 40;  // B
      }
      png.data[idx + 3] = 255;
    }
  }

  const buffer = PNG.sync.write(png);
  fs.writeFileSync(path.join(outDir, 'color_terrestrial.png'), buffer);
  console.log('Created color_terrestrial.png');
}

createTmc2Sample();
createOhrcSample();
createPsrSample();
createColorSample();
console.log('All sample images generated successfully!');
