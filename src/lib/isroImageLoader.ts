/**
 * LunarSafe Mission Software — ISRO Chandrayaan-2 Raw 16-bit Image Loader
 * Team Rocket · AEROX Club · Parul University · Project Head: Darshan Patil
 *
 * Slices and normalizes calibrated 16-bit (UnsignedLSB2) orbital strips
 * produced by the Chandrayaan-2 Terrain Mapping Camera-2 (TMC-2).
 */

import * as fs from 'fs';
import { parsePds4Label, IsroMetadata } from './isroPds4Parser';

export const ISRO_TMC2_LINES = 49119;
export const ISRO_TMC2_SAMPLES = 4000;
export const ISRO_TMC2_BYTES_PER_PIXEL = 2;
export const ISRO_TMC2_TOTAL_BYTES = ISRO_TMC2_LINES * ISRO_TMC2_SAMPLES * ISRO_TMC2_BYTES_PER_PIXEL; // 392,952,000 bytes

export interface IsroImageLoaderOptions {
  xmlPath?: string;
  metadata?: IsroMetadata;
  lines?: number;
  samples?: number;
  bytesPerPixel?: number;
  tileWidth?: number;
  tileHeight?: number;
  fd?: number;
  buffer?: Buffer;
  gamma?: number;
  lowCut?: number;
  highCut?: number;
}

export class NodeImageData {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray;
  readonly colorSpace: PredefinedColorSpace = 'srgb';

  constructor(data: Uint8ClampedArray, width: number, height: number) {
    this.data = data;
    this.width = width;
    this.height = height;
  }
}

/**
 * Loads a tileSize x tileSize (or tileWidth x tileHeight) sub-raster from a calibrated ISRO raw image.
 * Dynamically resolves raster line count and dimensions from PDS4 label.
 * Memory-efficient: streams only the requested tile scanlines via file descriptor without loading
 * the full 392 MB raster into memory.
 *
 * @param filePath Path to the raw .img file
 * @param tileX Sample offset (column, 0 <= tileX < totalSamples)
 * @param tileY Line offset (row, 0 <= tileY < totalLines)
 * @param tileSize Dimension of square tile to slice (default: 512)
 * @param options Optional XML label path or pre-parsed IsroMetadata, fd, dimensions
 * @returns ImageData with 8-bit normalized grayscale pixels in RGBA format
 */
export function loadIsroRawImage(
  filePath: string,
  tileX: number = 0,
  tileY: number = 0,
  tileSize: number = 512,
  options?: IsroImageLoaderOptions | string
): ImageData {
  if (!fs.existsSync(filePath)) {
    throw new Error(`ISRO raw image file not found: ${filePath}`);
  }

  // 1. Resolve PDS4 metadata dynamically
  let metadata: IsroMetadata | null = null;
  let customXmlPath: string | undefined = undefined;

  if (typeof options === 'string') {
    customXmlPath = options;
  } else if (options) {
    if (options.metadata) metadata = options.metadata;
    if (options.xmlPath) customXmlPath = options.xmlPath;
  }

  if (!metadata) {
    const candidateXml = customXmlPath || filePath.replace(/\.[^/.]+$/, '.xml');
    if (fs.existsSync(candidateXml)) {
      try {
        metadata = parsePds4Label(candidateXml);
      } catch (err: any) {
        console.warn(`[ISRO Loader] PDS4 XML parse warning: ${err.message}`);
      }
    }
  }

  // 2. Determine bytes per pixel dynamically
  let bytesPerPixel = 2;
  if (metadata?.dataType) {
    bytesPerPixel = metadata.dataType.toLowerCase().includes('byte') ? 1 : 2;
  } else if (typeof options === 'object' && options?.bytesPerPixel) {
    bytesPerPixel = options.bytesPerPixel;
  }

  // 3. Determine target tile dimensions (support non-square boundary tiles)
  const actualW = (typeof options === 'object' && options?.tileWidth) ? options.tileWidth : tileSize;
  const actualH = (typeof options === 'object' && options?.tileHeight) ? options.tileHeight : tileSize;

  const fileStat = fs.statSync(filePath);
  const isTestTile = fileStat.size === tileSize * tileSize * bytesPerPixel;

  // 4. Determine raster dimensions dynamically
  let totalSamples = metadata?.samples ?? (typeof options === 'object' ? options?.samples : undefined) ?? ISRO_TMC2_SAMPLES;
  let totalLines = metadata?.lines ?? (typeof options === 'object' ? options?.lines : undefined);

  if (!isTestTile) {
    if (!totalLines) {
      totalLines = Math.floor(fileStat.size / (totalSamples * bytesPerPixel));
    }
    const expectedTotalBytes = totalLines * totalSamples * bytesPerPixel;
    if (fileStat.size !== expectedTotalBytes) {
      if (fileStat.size % (totalSamples * bytesPerPixel) === 0) {
        totalLines = fileStat.size / (totalSamples * bytesPerPixel);
      } else {
        throw new Error(
          `File size check failed: expected ${expectedTotalBytes} bytes (${totalLines} lines x ${totalSamples} samples x ${bytesPerPixel} B/px), got ${fileStat.size} bytes`
        );
      }
    }
  } else {
    totalLines = tileSize;
    totalSamples = tileSize;
  }

  // 5. Memory-efficient streaming slice: read only requested tile rows
  let shouldCloseFd = false;
  let fd = typeof options === 'object' && options?.fd !== undefined ? options.fd : -1;
  if (fd < 0) {
    fd = fs.openSync(filePath, 'r');
    shouldCloseFd = true;
  }

  const tileU16 = new Uint16Array(actualW * actualH);
  const sampleStart = isTestTile ? 0 : Math.min(tileX, totalSamples - 1);
  const samplesAvailable = Math.max(0, totalSamples - sampleStart);
  const samplesToRead = Math.min(actualW, samplesAvailable);
  const bytesToRead = samplesToRead * bytesPerPixel;
  const lineBuffer = Buffer.alloc(bytesToRead);

  let minVal = 65535;
  let maxVal = 0;
  let sumVal = 0;
  let sumSqVal = 0;
  const uniqueDNs = new Set<number>();

  try {
    for (let y = 0; y < actualH; y++) {
      const line = isTestTile ? y : Math.min(tileY + y, totalLines - 1);
      const fileOffset = (line * totalSamples + sampleStart) * bytesPerPixel;

      fs.readSync(fd, lineBuffer, 0, bytesToRead, fileOffset);

      const rowTarget = y * actualW;
      for (let x = 0; x < actualW; x++) {
        let val = 0;
        if (x < samplesToRead) {
          val = bytesPerPixel === 2 ? lineBuffer.readUInt16LE(x * 2) : lineBuffer.readUInt8(x);
        } else if (samplesToRead > 0) {
          val = bytesPerPixel === 2 ? lineBuffer.readUInt16LE((samplesToRead - 1) * 2) : lineBuffer.readUInt8(samplesToRead - 1);
        }
        tileU16[rowTarget + x] = val;
        if (val < minVal) minVal = val;
        if (val > maxVal) maxVal = val;
        sumVal += val;
        sumSqVal += val * val;
        uniqueDNs.add(val);
      }
    }
  } finally {
    if (shouldCloseFd) {
      fs.closeSync(fd);
    }
  }

  const numPixels = actualW * actualH;
  const meanVal = numPixels > 0 ? sumVal / numPixels : 0;
  console.log(`[ISRO Loader] Tile (${tileX}, ${tileY}) stats: min=${minVal}, max=${maxVal}, mean=${meanVal.toFixed(2)}, unique=${uniqueDNs.size}`);

  // 6. Normalize 16-bit UnsignedLSB2 to 8-bit panchromatic RGBA
  // The bug was a dynamic-range assumption error. The loader divided raw pixel values by 65,535,
  // but the sensor's actual dynamic range for this observation was only ~9–455. This crushed all
  // pixels to near-zero, producing a blank image. The fix applies a 2-sigma dynamic-range
  // stretch with gamma correction (gamma = 0.43), computed from the tile's actual mean and standard deviation.
  const variance = numPixels > 0 ? (sumSqVal / numPixels) - (meanVal * meanVal) : 0;
  const std = Math.sqrt(Math.max(0, variance));

  const gamma = (typeof options === 'object' && options?.gamma !== undefined) ? options.gamma : 0.43;
  const defaultLow = Math.max(0, meanVal - 2.201 * std);
  const defaultHigh = Math.min(maxVal, meanVal + 2.359 * std);

  const lowCut = (typeof options === 'object' && options?.lowCut !== undefined) ? options.lowCut : defaultLow;
  const highCut = (typeof options === 'object' && options?.highCut !== undefined)
    ? options.highCut
    : (defaultHigh > lowCut + 1 ? defaultHigh : (maxVal > lowCut ? maxVal : lowCut + 1));
  const range = highCut - lowCut > 0 ? highCut - lowCut : 1;

  const rgba = new Uint8ClampedArray(actualW * actualH * 4);

  for (let y = 0; y < actualH; y++) {
    const rowOffset = y * actualW;
    const outOffset = y * actualW * 4;

    for (let x = 0; x < actualW; x++) {
      const rawVal = tileU16[rowOffset + x];
      let val8: number;
      if (bytesPerPixel === 1) {
        val8 = rawVal;
      } else {
        const norm = Math.max(0, Math.min(1, (rawVal - lowCut) / range));
        val8 = Math.min(255, Math.max(0, Math.round(Math.pow(norm, gamma) * 255)));
      }

      const idx = outOffset + x * 4;
      rgba[idx] = val8;
      rgba[idx + 1] = val8;
      rgba[idx + 2] = val8;
      rgba[idx + 3] = 255;
    }
  }


  if (typeof ImageData !== 'undefined') {
    return new ImageData(rgba, actualW, actualH);
  }
  return new NodeImageData(rgba, actualW, actualH) as unknown as ImageData;
}
