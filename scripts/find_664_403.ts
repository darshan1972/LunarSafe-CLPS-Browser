import fs from 'fs';
import path from 'path';
import { DeterministicLunarEngine } from '../src/lib/imageProcessor';
import { CraterConsolidationService } from '../src/lib/craterConsolidation';

async function main() {
  const imgPath = path.resolve('src/assets/isro_data/ch2_tmc_ncn_20260823T1657513854_d_img_d18.img');
  const fd = fs.openSync(imgPath, 'r');
  const col = 800, row = 45000, width = 512, height = 512, totalSamples = 4000;
  const u16 = new Uint16Array(width * height);
  const lineBuf = Buffer.alloc(width * 2);
  for (let y = 0; y < height; y++) {
    const fileOffset = ((row + y) * totalSamples + col) * 2;
    fs.readSync(fd, lineBuf, 0, width * 2, fileOffset);
    for (let x = 0; x < width; x++) {
      u16[y * width + x] = lineBuf.readUInt16LE(x * 2);
    }
  }
  fs.closeSync(fd);

  let minVal = 65535, maxVal = 0;
  for (let i = 0; i < u16.length; i++) {
    if (u16[i] < minVal) minVal = u16[i];
    if (u16[i] > maxVal) maxVal = u16[i];
  }
  console.log(`Tile (800, 45000) raw stats: min=${minVal}, max=${maxVal}`);

  // Test different pixelScaleMeters, e.g. 5.0 vs 6.4
  // Test different scaling / normalization methods
  const gsdList = [6.4, 5.0];

  // What normalizations could have been used?
  // 1. Min-max normalization: (v - min) / (max - min) * 255
  // 2. Global TMC-2 normalization (e.g. max 1023 for 10-bit or 4095 for 12-bit TMC-2 sensor!)
  // WAIT! TMC-2 sensor is 10-bit or 12-bit or 16-bit?
  // 3. Contrast stretch / percentiles
  // 4. Square root / gamma
  // 6. Dynamic-range assumption error (sensor actual dynamic range ~9-455 vs naive 65535, 2-sigma stretch with gamma 0.43)

  const methods: { name: string; fn: (v: number) => number }[] = [
    { name: 'MinMax Round', fn: v => Math.min(255, Math.max(0, Math.round(((v - minVal) / (maxVal - minVal)) * 255))) },
    { name: 'MinMax Floor', fn: v => Math.min(255, Math.max(0, Math.floor(((v - minVal) / (maxVal - minVal)) * 255))) },
    { name: '10-bit scale (1023)', fn: v => Math.min(255, Math.round((v / 1023) * 255)) },
    { name: '12-bit scale (4095)', fn: v => Math.min(255, Math.round((v / 4095) * 255)) },
    { name: 'Direct clamp 255', fn: v => Math.min(255, v) },
  ];

  // Also test percentiles
  const sorted = Array.from(u16).sort((a, b) => a - b);
  for (const p of [0.5, 1, 2, 3, 5]) {
    const low = sorted[Math.floor(sorted.length * (p / 100))];
    const high = sorted[Math.floor(sorted.length * (1 - p / 100))];
    methods.push({
      name: `Percentile ${p}%-${100-p}% (low=${low}, high=${high})`,
      fn: v => Math.min(255, Math.max(0, Math.round(((v - low) / (high - low)) * 255)))
    });
  }

  // Also test gamma / log
  methods.push({
    name: 'Gamma 0.5',
    fn: v => Math.min(255, Math.round(Math.pow((v - minVal) / (maxVal - minVal), 0.5) * 255))
  });
  methods.push({
    name: 'Gamma 2.0',
    fn: v => Math.min(255, Math.round(Math.pow((v - minVal) / (maxVal - minVal), 2.0) * 255))
  });

  for (const gsd of gsdList) {
    console.log(`\n=== TESTING GSD = ${gsd} ===`);
    for (const m of methods) {
      const rgba = new Uint8ClampedArray(width * height * 4);
      for (let i = 0; i < u16.length; i++) {
        const v8 = m.fn(u16[i]);
        const idx = i * 4;
        rgba[idx] = v8;
        rgba[idx + 1] = v8;
        rgba[idx + 2] = v8;
        rgba[idx + 3] = 255;
      }
      const dummyBuf = Buffer.from(rgba.buffer);
      const res = await DeterministicLunarEngine.processLunarImage(
        dummyBuf,
        { width, height, data: rgba },
        { pixelScaleMeters: gsd, gridSizeMeters: 24, maxSlopeDeg: 10, solarIncidenceDeg: 76.937867 }
      );
      const cons = CraterConsolidationService.consolidate(res.craters, gsd);
      console.log(`${m.name} -> Raw Craters: ${res.craters.length}, Distinct Craters: ${cons.distinctCratersCount}, Boulders: ${res.boulders.length}, Safe%: ${res.evidence.safeAreaPercentage.toFixed(1)}%`);
    }
  }
}

main().catch(console.error);
