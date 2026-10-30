/**
 * LunarSafe Mission Software — Hazard Detection Validation Suite
 * Team Rocket · AEROX Club · Parul University · Project Head: Darshan Patil
 *
 * Implements ground-truth validation for crater and boulder detection against
 * authentic lunar surface features. Calculates Precision, Recall, F1-Score,
 * False Positive Rate (FPR), and False Negative Rate (FNR) via Intersection over Union (IoU).
 */

export interface LabeledFeature {
  x: number;
  y: number;
  radius: number;
  id?: string;
  type?: 'crater' | 'boulder';
  notes?: string;
}

export interface DetectedFeature {
  x: number;
  y: number;
  radius: number;
  confidence?: number;
  type?: 'crater' | 'boulder';
  id?: string;
}

export interface ValidationMetrics {
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  f1Score: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
}

export interface FeatureMatch {
  detection: DetectedFeature;
  label: LabeledFeature;
  iou: number;
}

export interface DetailedValidationResult extends ValidationMetrics {
  matchedPairs: FeatureMatch[];
  unmatchedDetections: DetectedFeature[];
  unmatchedLabels: LabeledFeature[];
  iouThreshold: number;
  totalDetections: number;
  totalLabels: number;
}

export interface GroundTruthDataset {
  dataset: string;
  image: string;
  resolution_m_per_px: number;
  dimensions: { width: number; height: number };
  total_features: number;
  craters: LabeledFeature[];
  boulders: LabeledFeature[];
}

/**
 * Calculates standard bounding box Intersection over Union (IoU)
 * between two circular features defined by center (x, y) and radius.
 */
export function computeFeatureIoU(
  a: { x: number; y: number; radius: number },
  b: { x: number; y: number; radius: number }
): number {
  if (a.radius <= 0 || b.radius <= 0) return 0;

  const axMin = a.x - a.radius;
  const axMax = a.x + a.radius;
  const ayMin = a.y - a.radius;
  const ayMax = a.y + a.radius;

  const bxMin = b.x - b.radius;
  const bxMax = b.x + b.radius;
  const byMin = b.y - b.radius;
  const byMax = b.y + b.radius;

  const interX1 = Math.max(axMin, bxMin);
  const interY1 = Math.max(ayMin, byMin);
  const interX2 = Math.min(axMax, bxMax);
  const interY2 = Math.min(ayMax, byMax);

  const interWidth = Math.max(0, interX2 - interX1);
  const interHeight = Math.max(0, interY2 - interY1);
  const interArea = interWidth * interHeight;

  const areaA = (axMax - axMin) * (ayMax - ayMin);
  const areaB = (bxMax - bxMin) * (byMax - byMin);
  const unionArea = areaA + areaB - interArea;

  if (unionArea <= 0) return 0;
  return Number((interArea / unionArea).toFixed(4));
}

/**
 * Validates a set of detections against ground-truth labels using greedy IoU bipartite matching.
 *
 * Edge cases:
 * - If no detections provided -> all metrics = 0
 * - If no labels provided -> all metrics = 0
 */
export function validateDetections(
  detections: DetectedFeature[],
  labels: LabeledFeature[],
  iouThreshold: number = 0.5
): ValidationMetrics {
  const detailed = validateDetectionsDetailed(detections, labels, iouThreshold);
  return {
    truePositives: detailed.truePositives,
    falsePositives: detailed.falsePositives,
    falseNegatives: detailed.falseNegatives,
    precision: detailed.precision,
    recall: detailed.recall,
    f1Score: detailed.f1Score,
    falsePositiveRate: detailed.falsePositiveRate,
    falseNegativeRate: detailed.falseNegativeRate,
  };
}

/**
 * Detailed validation returning match pairs and unmatched items for in-depth audit reporting.
 */
export function validateDetectionsDetailed(
  detections: DetectedFeature[],
  labels: LabeledFeature[],
  iouThreshold: number = 0.5
): DetailedValidationResult {
  // Edge cases per specification
  if (!detections || detections.length === 0 || !labels || labels.length === 0) {
    return {
      truePositives: 0,
      falsePositives: 0,
      falseNegatives: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
      falsePositiveRate: 0,
      falseNegativeRate: 0,
      matchedPairs: [],
      unmatchedDetections: detections ? [...detections] : [],
      unmatchedLabels: labels ? [...labels] : [],
      iouThreshold,
      totalDetections: detections ? detections.length : 0,
      totalLabels: labels ? labels.length : 0,
    };
  }

  // Sort detections by confidence descending if available, else preserve order
  const sortedDetections = [...detections].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));

  const matchedPairs: FeatureMatch[] = [];
  const matchedLabelIndices = new Set<number>();
  const unmatchedDetections: DetectedFeature[] = [];

  for (const det of sortedDetections) {
    let bestLabelIdx = -1;
    let bestIoU = -1;

    for (let li = 0; li < labels.length; li++) {
      if (matchedLabelIndices.has(li)) continue;
      const iou = computeFeatureIoU(det, labels[li]);
      if (iou > bestIoU) {
        bestIoU = iou;
        bestLabelIdx = li;
      }
    }

    if (bestLabelIdx !== -1 && bestIoU >= iouThreshold) {
      matchedLabelIndices.add(bestLabelIdx);
      matchedPairs.push({
        detection: det,
        label: labels[bestLabelIdx],
        iou: bestIoU,
      });
    } else {
      unmatchedDetections.push(det);
    }
  }

  const unmatchedLabels: LabeledFeature[] = labels.filter((_, idx) => !matchedLabelIndices.has(idx));

  const truePositives = matchedPairs.length;
  const falsePositives = unmatchedDetections.length;
  const falseNegatives = unmatchedLabels.length;

  const precision = (truePositives + falsePositives > 0)
    ? Number((truePositives / (truePositives + falsePositives)).toFixed(4))
    : 0;

  const recall = (truePositives + falseNegatives > 0)
    ? Number((truePositives / (truePositives + falseNegatives)).toFixed(4))
    : 0;

  const f1Score = (precision + recall > 0)
    ? Number(((2 * precision * recall) / (precision + recall)).toFixed(4))
    : 0;

  const falsePositiveRate = (truePositives + falsePositives > 0)
    ? Number((falsePositives / (truePositives + falsePositives)).toFixed(4))
    : 0;

  const falseNegativeRate = (truePositives + falseNegatives > 0)
    ? Number((falseNegatives / (truePositives + falseNegatives)).toFixed(4))
    : 0;

  return {
    truePositives,
    falsePositives,
    falseNegatives,
    precision,
    recall,
    f1Score,
    falsePositiveRate,
    falseNegativeRate,
    matchedPairs,
    unmatchedDetections,
    unmatchedLabels,
    iouThreshold,
    totalDetections: detections.length,
    totalLabels: labels.length,
  };
}

/**
 * Helper to convert raw engine detections to standard DetectedFeature array.
 */
export function convertEngineDetections(
  rawCraters: Array<{ center: [number, number]; box?: { x1: number; y1: number; x2: number; y2: number }; confidence?: number; id?: string }>,
  rawBoulders: Array<{ center: [number, number]; box?: { x1: number; y1: number; x2: number; y2: number }; confidence?: number; id?: string }>
): {
  craters: DetectedFeature[];
  boulders: DetectedFeature[];
  all: DetectedFeature[];
} {
  const craters: DetectedFeature[] = rawCraters.map((c, i) => {
    const radius = c.box
      ? Math.max(1, Math.round((c.box.x2 - c.box.x1) / 2))
      : 6;
    return {
      x: c.center[0],
      y: c.center[1],
      radius,
      confidence: c.confidence ?? 0.8,
      type: 'crater',
      id: c.id || `crater-${i + 1}`,
    };
  });

  const boulders: DetectedFeature[] = rawBoulders.map((b, i) => {
    const radius = b.box
      ? Math.max(1, Math.round((b.box.x2 - b.box.x1) / 2))
      : 3;
    return {
      x: b.center[0],
      y: b.center[1],
      radius,
      confidence: b.confidence ?? 0.75,
      type: 'boulder',
      id: b.id || `boulder-${i + 1}`,
    };
  });

  return {
    craters,
    boulders,
    all: [...craters, ...boulders],
  };
}
