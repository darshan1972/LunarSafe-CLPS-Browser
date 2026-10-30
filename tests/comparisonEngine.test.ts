import { computeIoU, compareDetections, Detection, BoundingBox } from '../src/lib/comparisonEngine';

console.log('============================================================');
console.log('LUNARSAFE PHASE 8: CV VS YOLO COMPARISON ENGINE TEST SUITE');
console.log('============================================================\n');

// ---------------------------------------------------------------------
// TEST 1: computeIoU with identical boxes -> 1.0
// ---------------------------------------------------------------------
console.log('--- TEST 1: computeIoU with identical boxes ---');
const box1A: BoundingBox = { x1: 10, y1: 10, x2: 50, y2: 50 };
const box1B: BoundingBox = { x1: 10, y1: 10, x2: 50, y2: 50 };
const iou1 = computeIoU(box1A, box1B);
console.log(`Identical boxes IoU: ${iou1}`);
if (iou1 !== 1.0) {
  throw new Error(`Test 1 Failed: Expected IoU 1.0, got ${iou1}`);
}
console.log('[ASSERT 1] computeIoU with identical boxes = 1.0: PASS\n');

// ---------------------------------------------------------------------
// TEST 2: computeIoU with no overlap -> 0.0
// ---------------------------------------------------------------------
console.log('--- TEST 2: computeIoU with no overlap ---');
const box2A: BoundingBox = { x1: 0, y1: 0, x2: 20, y2: 20 };
const box2B: BoundingBox = { x1: 30, y1: 30, x2: 50, y2: 50 };
const iou2 = computeIoU(box2A, box2B);
console.log(`Disjoint boxes IoU: ${iou2}`);
if (iou2 !== 0.0) {
  throw new Error(`Test 2 Failed: Expected IoU 0.0, got ${iou2}`);
}
console.log('[ASSERT 2] computeIoU with no overlap = 0.0: PASS\n');

// ---------------------------------------------------------------------
// TEST 3: computeIoU with 50% overlap -> ~0.333
// ---------------------------------------------------------------------
console.log('--- TEST 3: computeIoU with 50% overlap ---');
// Box A: [0, 0, 10, 10] -> area = 100
// Box B: [5, 0, 15, 10] -> area = 100
// Overlap: [5, 0, 10, 10] -> area = 50 (half of each box)
// Union: 100 + 100 - 50 = 150 (1.5x each box)
// IoU: 50 / 150 = 1/3 ~ 0.333333...
const box3A: BoundingBox = { x1: 0, y1: 0, x2: 10, y2: 10 };
const box3B: BoundingBox = { x1: 5, y1: 0, x2: 15, y2: 10 };
const iou3 = computeIoU(box3A, box3B);
console.log(`50% overlap IoU: ${iou3.toFixed(4)} (Expected ~0.3333)`);
if (Math.abs(iou3 - 1 / 3) > 1e-4) {
  throw new Error(`Test 3 Failed: Expected IoU ~0.3333, got ${iou3}`);
}
console.log('[ASSERT 3] computeIoU with 50% overlap ~ 0.333: PASS\n');

// ---------------------------------------------------------------------
// TEST 4: compareDetections with 7 CV and 7 YOLO detections all matching
// ---------------------------------------------------------------------
console.log('--- TEST 4: compareDetections with 7 CV and 7 YOLO all matching ---');
const cvDets7: Detection[] = [];
const yoloDets7: Detection[] = [];
for (let i = 0; i < 7; i++) {
  const bbox: BoundingBox = { x1: i * 50, y1: 0, x2: i * 50 + 30, y2: 30 };
  cvDets7.push({ bbox, confidence: 0.9, source: 'CV', class_name: 'crater' });
  yoloDets7.push({ bbox: { ...bbox }, confidence: 0.95, source: 'YOLO', class_name: 'crater' });
}
const res4 = compareDetections(cvDets7, yoloDets7, 0.5);
console.log(`CV Count: ${res4.cvCount}, YOLO Count: ${res4.yoloCount}`);
console.log(`Matched Count: ${res4.matchedCount}, Agreement: ${res4.agreementPercentage}%`);
console.log(`Interpretation: "${res4.interpretation}"`);
if (res4.matchedCount !== 7) {
  throw new Error(`Test 4 Failed: Expected matchedCount 7, got ${res4.matchedCount}`);
}
if (res4.agreementPercentage !== 100) {
  throw new Error(`Test 4 Failed: Expected agreementPercentage 100, got ${res4.agreementPercentage}`);
}
if (res4.yoloOnlyCount !== 0 || res4.cvOnlyCount !== 0) {
  throw new Error(`Test 4 Failed: Expected 0 yoloOnly and 0 cvOnly`);
}
if (res4.interpretation !== 'High agreement. Both methods detect the same major features.') {
  throw new Error(`Test 4 Failed: Unexpected interpretation "${res4.interpretation}"`);
}
console.log('[ASSERT 4] 7 CV and 7 YOLO matching -> matchedCount = 7, agreement = 100%: PASS\n');

// ---------------------------------------------------------------------
// TEST 5: compareDetections with 10 CV and 5 YOLO detections, 3 matching
// ---------------------------------------------------------------------
console.log('--- TEST 5: compareDetections with 10 CV and 5 YOLO, 3 matching ---');
const cvDets10: Detection[] = [];
for (let i = 0; i < 10; i++) {
  cvDets10.push({
    bbox: { x1: i * 40, y1: 0, x2: i * 40 + 25, y2: 25 },
    confidence: 0.88,
    source: 'CV',
    class_name: 'crater',
  });
}
const yoloDets5: Detection[] = [];
// 3 matching with CV indices 0, 1, 2
for (let i = 0; i < 3; i++) {
  yoloDets5.push({
    bbox: { x1: i * 40, y1: 0, x2: i * 40 + 25, y2: 25 },
    confidence: 0.92,
    source: 'YOLO',
    class_name: 'crater',
  });
}
// 2 non-matching (located far away)
yoloDets5.push({
  bbox: { x1: 500, y1: 500, x2: 530, y2: 530 },
  confidence: 0.85,
  source: 'YOLO',
  class_name: 'crater',
});
yoloDets5.push({
  bbox: { x1: 600, y1: 600, x2: 630, y2: 630 },
  confidence: 0.82,
  source: 'YOLO',
  class_name: 'crater',
});

const res5 = compareDetections(cvDets10, yoloDets5, 0.5);
console.log(`CV Count: ${res5.cvCount}, YOLO Count: ${res5.yoloCount}`);
console.log(`Matched Count: ${res5.matchedCount}, YOLO Only: ${res5.yoloOnlyCount}, CV Only: ${res5.cvOnlyCount}`);
console.log(`Agreement: ${res5.agreementPercentage}%`);
console.log(`Interpretation: "${res5.interpretation}"`);

if (res5.matchedCount !== 3) {
  throw new Error(`Test 5 Failed: Expected matchedCount 3, got ${res5.matchedCount}`);
}
if (res5.yoloOnlyCount !== 2) {
  throw new Error(`Test 5 Failed: Expected yoloOnlyCount 2, got ${res5.yoloOnlyCount}`);
}
if (res5.cvOnlyCount !== 7) {
  throw new Error(`Test 5 Failed: Expected cvOnlyCount 7, got ${res5.cvOnlyCount}`);
}
if (res5.agreementPercentage !== 60) {
  throw new Error(`Test 5 Failed: Expected agreementPercentage 60, got ${res5.agreementPercentage}`);
}
if (res5.interpretation !== 'Moderate agreement. YOLO detects the largest features; CV detects additional smaller features.') {
  throw new Error(`Test 5 Failed: Unexpected interpretation "${res5.interpretation}"`);
}
console.log('[ASSERT 5] 10 CV and 5 YOLO, 3 matching -> matched = 3, yoloOnly = 2, cvOnly = 7: PASS\n');

// ---------------------------------------------------------------------
// TEST 6: compareDetections with 0 YOLO -> agreementPercentage = 0, all CV are cvOnly
// ---------------------------------------------------------------------
console.log('--- TEST 6: compareDetections with 0 YOLO ---');
const cvDets6: Detection[] = [
  { bbox: { x1: 0, y1: 0, x2: 15, y2: 15 }, confidence: 0.9, source: 'CV' },
  { bbox: { x1: 30, y1: 30, x2: 45, y2: 45 }, confidence: 0.85, source: 'CV' },
  { bbox: { x1: 60, y1: 60, x2: 75, y2: 75 }, confidence: 0.8, source: 'CV' },
  { bbox: { x1: 90, y1: 90, x2: 105, y2: 105 }, confidence: 0.75, source: 'CV' },
];
const res6 = compareDetections(cvDets6, [], 0.5);
console.log(`CV Count: ${res6.cvCount}, YOLO Count: ${res6.yoloCount}`);
console.log(`Matched Count: ${res6.matchedCount}, CV Only: ${res6.cvOnlyCount}, YOLO Only: ${res6.yoloOnlyCount}`);
console.log(`Agreement: ${res6.agreementPercentage}%`);
console.log(`Interpretation: "${res6.interpretation}"`);

if (res6.yoloCount !== 0) {
  throw new Error(`Test 6 Failed: Expected yoloCount 0, got ${res6.yoloCount}`);
}
if (res6.matchedCount !== 0) {
  throw new Error(`Test 6 Failed: Expected matchedCount 0, got ${res6.matchedCount}`);
}
if (res6.cvOnlyCount !== cvDets6.length) {
  throw new Error(`Test 6 Failed: Expected cvOnlyCount ${cvDets6.length}, got ${res6.cvOnlyCount}`);
}
if (res6.yoloOnlyCount !== 0) {
  throw new Error(`Test 6 Failed: Expected yoloOnlyCount 0, got ${res6.yoloOnlyCount}`);
}
if (res6.agreementPercentage !== 0) {
  throw new Error(`Test 6 Failed: Expected agreementPercentage 0, got ${res6.agreementPercentage}`);
}
if (res6.interpretation !== 'Low agreement. Methods use different criteria. Review manually.') {
  throw new Error(`Test 6 Failed: Unexpected interpretation "${res6.interpretation}"`);
}
console.log('[ASSERT 6] 0 YOLO -> agreementPercentage = 0, all CV are cvOnly: PASS\n');

console.log('============================================================');
console.log('FINAL RESULT: ALL COMPARISON ENGINE TESTS PASSED');
console.log('============================================================');
