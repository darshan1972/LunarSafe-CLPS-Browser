import { BoundingBox, CraterDetection, BoulderDetection } from '../types';

export interface ConsolidatedCrater {
  id: string;
  centroid: [number, number];          // [x, y] in pixels
  centerMeters: [number, number];      // [x, y] in ground meters
  box: BoundingBox;                    // Bounding box enclosing all constituent patches
  boundingDiameterPixels: number;      // Max bounding span in pixels
  boundingDiameterM: number;           // Physical diameter in meters
  depthEstM: number;                  // Maximum estimated depth among constituent patches
  isHazard: boolean;                   // True if any constituent patch is hazardous
  confidence: number;                  // Mean confidence across constituent patches
  patchCount: number;                  // Number of raw 8x8 patches consolidated into this crater
  constituentPatchIds: string[];       // IDs of grouped patches
}

export interface ConsolidationResult {
  consolidatedCraters: ConsolidatedCrater[];
  distinctCratersCount: number;
  rawPatchCount: number;
  adjacencyThresholdPixels: number;
}

export class CraterConsolidationService {
  /**
   * Fundamental spatial sampling resolution:
   * The sliding window detector evaluates 8x8 pixel patches.
   * Two patches are physically contiguous if their bounding boxes are separated by
   * no more than 1 patch-width (8 pixels) of space.
   */
  public static readonly DEFAULT_PATCH_SIZE_PIXELS = 8;

  /**
   * Consolidates raw 8x8 hazard feature patches into discrete crater objects
   * using a Disjoint-Set (Union-Find) connected component analysis.
   */
  public static consolidate(
    rawPatches: (CraterDetection | BoulderDetection)[],
    pixelScaleMeters: number,
    adjacencyPaddingPixels: number = CraterConsolidationService.DEFAULT_PATCH_SIZE_PIXELS
  ): ConsolidationResult {
    const rawCount = rawPatches.length;
    if (rawCount === 0) {
      return {
        consolidatedCraters: [],
        distinctCratersCount: 0,
        rawPatchCount: 0,
        adjacencyThresholdPixels: adjacencyPaddingPixels,
      };
    }

    // 1. Initialize Disjoint-Set (Union-Find)
    const parent = new Int32Array(rawCount);
    for (let i = 0; i < rawCount; i++) {
      parent[i] = i;
    }

    function find(i: number): number {
      let root = i;
      while (root !== parent[root]) {
        root = parent[root];
      }
      // Path compression
      let curr = i;
      while (curr !== root) {
        const next = parent[curr];
        parent[curr] = root;
        curr = next;
      }
      return root;
    }

    function union(i: number, j: number): void {
      const rootI = find(i);
      const rootJ = find(j);
      if (rootI !== rootJ) {
        parent[rootI] = rootJ;
      }
    }

    // 2. Perform pairwise adjacency check with physical 1-patch clearance buffer
    const delta = adjacencyPaddingPixels;
    for (let i = 0; i < rawCount; i++) {
      const b1 = rawPatches[i].box;
      for (let j = i + 1; j < rawCount; j++) {
        const b2 = rawPatches[j].box;
        const overlaps = !(
          b1.x2 + delta < b2.x1 - delta ||
          b1.x1 - delta > b2.x2 + delta ||
          b1.y2 + delta < b2.y1 - delta ||
          b1.y1 - delta > b2.y2 + delta
        );
        if (overlaps) {
          union(i, j);
        }
      }
    }

    // 3. Group patches by connected component root
    const componentMap = new Map<number, number[]>();
    for (let i = 0; i < rawCount; i++) {
      const root = find(i);
      let list = componentMap.get(root);
      if (!list) {
        list = [];
        componentMap.set(root, list);
      }
      list.push(i);
    }

    // 4. Build consolidated crater objects
    const consolidated: ConsolidatedCrater[] = [];
    let craterIndex = 1;

    for (const indices of componentMap.values()) {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      let sumX = 0;
      let sumY = 0;
      let maxDepth = 0;
      let sumConf = 0;
      let isHazard = false;
      const constituentIds: string[] = [];

      for (const idx of indices) {
        const p = rawPatches[idx];
        constituentIds.push(p.id);
        sumX += p.center[0];
        sumY += p.center[1];
        if (p.box.x1 < minX) minX = p.box.x1;
        if (p.box.y1 < minY) minY = p.box.y1;
        if (p.box.x2 > maxX) maxX = p.box.x2;
        if (p.box.y2 > maxY) maxY = p.box.y2;
        const featureDepth = (p as any).depthEstM ?? (p as any).heightEstM ?? 0;
        if (featureDepth > maxDepth) maxDepth = featureDepth;
        if (p.isHazard) isHazard = true;
        sumConf += p.confidence;
      }

      const count = indices.length;
      const centroidX = Number((sumX / count).toFixed(1));
      const centroidY = Number((sumY / count).toFixed(1));
      const widthPx = maxX - minX;
      const heightPx = maxY - minY;
      const boundingDiameterPixels = Number(Math.max(widthPx, heightPx).toFixed(1));
      const boundingDiameterM = Number((boundingDiameterPixels * pixelScaleMeters).toFixed(2));
      const meanConfidence = Number((sumConf / count).toFixed(2));

      consolidated.push({
        id: `crater-obj-${craterIndex++}`,
        centroid: [centroidX, centroidY],
        centerMeters: [
          Number((centroidX * pixelScaleMeters).toFixed(1)),
          Number((centroidY * pixelScaleMeters).toFixed(1)),
        ],
        box: { x1: minX, y1: minY, x2: maxX, y2: maxY },
        boundingDiameterPixels,
        boundingDiameterM,
        depthEstM: maxDepth,
        isHazard: isHazard || maxDepth >= 1.0 || boundingDiameterM >= 3.0,
        confidence: meanConfidence,
        patchCount: count,
        constituentPatchIds: constituentIds,
      });
    }

    // Sort by descending physical diameter for clear mission ranking
    consolidated.sort((a, b) => b.boundingDiameterM - a.boundingDiameterM);

    return {
      consolidatedCraters: consolidated,
      distinctCratersCount: consolidated.length,
      rawPatchCount: rawCount,
      adjacencyThresholdPixels: adjacencyPaddingPixels,
    };
  }
}
