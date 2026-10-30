export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Detection {
  bbox: BoundingBox;
  confidence: number;
  source: 'CV' | 'YOLO';
  class_name?: string;
}

export interface ComparisonResult {
  cvCount: number;
  yoloCount: number;
  matchedCount: number;
  cvOnlyCount: number;
  yoloOnlyCount: number;
  agreementPercentage: number;
  interpretation: string;
  matches: Array<{
    cv: Detection;
    yolo: Detection;
    iou: number;
  }>;
}

/**
 * Standard Intersection over Union (IoU) calculation.
 * Returns intersection area / union area.
 * Returns 0 if no overlap or invalid/degenerate boxes, 1 if identical.
 */
export function computeIoU(a: BoundingBox, b: BoundingBox): number {
  const axMin = Math.min(a.x1, a.x2);
  const axMax = Math.max(a.x1, a.x2);
  const ayMin = Math.min(a.y1, a.y2);
  const ayMax = Math.max(a.y1, a.y2);

  const bxMin = Math.min(b.x1, b.x2);
  const bxMax = Math.max(b.x1, b.x2);
  const byMin = Math.min(b.y1, b.y2);
  const byMax = Math.max(b.y1, b.y2);

  const interX1 = Math.max(axMin, bxMin);
  const interY1 = Math.max(ayMin, byMin);
  const interX2 = Math.min(axMax, bxMax);
  const interY2 = Math.min(ayMax, byMax);

  const interWidth = Math.max(0, interX2 - interX1);
  const interHeight = Math.max(0, interY2 - interY1);
  const interArea = interWidth * interHeight;

  const areaA = Math.max(0, axMax - axMin) * Math.max(0, ayMax - ayMin);
  const areaB = Math.max(0, bxMax - bxMin) * Math.max(0, byMax - byMin);
  const unionArea = areaA + areaB - interArea;

  if (unionArea <= 0) {
    return 0;
  }

  return interArea / unionArea;
}

/**
 * Compares deterministic CV detections with YOLO AI detections using IoU matching.
 */
export function compareDetections(
  cvDetections: Detection[],
  yoloDetections: Detection[],
  iouThreshold: number = 0.5
): ComparisonResult {
  const cvCount = cvDetections.length;
  const yoloCount = yoloDetections.length;

  const matches: Array<{
    cv: Detection;
    yolo: Detection;
    iou: number;
  }> = [];

  const matchedCvIndices = new Set<number>();

  for (const yolo of yoloDetections) {
    let bestCvIndex = -1;
    let bestIoU = -1;

    for (let i = 0; i < cvDetections.length; i++) {
      if (matchedCvIndices.has(i)) continue;
      const iou = computeIoU(yolo.bbox, cvDetections[i].bbox);
      if (iou > bestIoU) {
        bestIoU = iou;
        bestCvIndex = i;
      }
    }

    if (bestCvIndex !== -1 && bestIoU >= iouThreshold) {
      matchedCvIndices.add(bestCvIndex);
      matches.push({
        cv: cvDetections[bestCvIndex],
        yolo,
        iou: bestIoU,
      });
    }
  }

  const matchedCount = matches.length;
  const yoloOnlyCount = yoloCount - matchedCount;
  const cvOnlyCount = cvCount - matchedCount;
  const agreementPercentage = yoloCount > 0 ? (matchedCount / yoloCount) * 100 : 0;

  let interpretation = '';
  if (agreementPercentage >= 80) {
    interpretation = 'High agreement. Both methods detect the same major features.';
  } else if (agreementPercentage >= 50) {
    interpretation = 'Moderate agreement. YOLO detects the largest features; CV detects additional smaller features.';
  } else {
    interpretation = 'Low agreement. Methods use different criteria. Review manually.';
  }

  return {
    cvCount,
    yoloCount,
    matchedCount,
    cvOnlyCount,
    yoloOnlyCount,
    agreementPercentage,
    interpretation,
    matches,
  };
}
