import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';
import {
  validateDetections,
  validateDetectionsDetailed,
  convertEngineDetections,
  LabeledFeature,
  DetectedFeature,
} from '../src/lib/validation/hazardValidation';
import { DeterministicLunarEngine } from '../src/lib/imageProcessor';

async function runHazardValidationTests() {
  console.log('================================================================');
  console.log('    LUNARSAFE PHASE 4: HAZARD DETECTION VALIDATION SUITE        ');
  console.log('    ISRO Flight Readiness & Ground Truth Accuracy Assessment    ');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, msg: string) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ${msg}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ${msg}`);
      process.exitCode = 1;
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Synthetic Data — Perfect Detections
  // --------------------------------------------------------------------------
  console.log('--- TEST 1: Synthetic Data — Perfect Detections (IoU = 1.0) ---');
  const perfectLabels: LabeledFeature[] = [
    { x: 100, y: 100, radius: 10, type: 'crater' },
    { x: 200, y: 200, radius: 15, type: 'crater' },
    { x: 300, y: 300, radius: 5, type: 'boulder' },
    { x: 400, y: 400, radius: 8, type: 'crater' },
    { x: 250, y: 350, radius: 4, type: 'boulder' },
  ];
  const perfectDetections: DetectedFeature[] = perfectLabels.map((l, i) => ({
    x: l.x,
    y: l.y,
    radius: l.radius,
    confidence: 0.95,
    type: l.type,
    id: `det-${i + 1}`,
  }));

  const metrics1 = validateDetections(perfectDetections, perfectLabels, 0.5);
  console.log('  Metrics:', JSON.stringify(metrics1));
  assert(metrics1.truePositives === 5, 'True Positives == 5');
  assert(metrics1.falsePositives === 0, 'False Positives == 0');
  assert(metrics1.falseNegatives === 0, 'False Negatives == 0');
  assert(metrics1.precision === 1.0, 'Precision == 100% (1.0)');
  assert(metrics1.recall === 1.0, 'Recall == 100% (1.0)');
  assert(metrics1.f1Score === 1.0, 'F1-Score == 100% (1.0)');
  assert(metrics1.falsePositiveRate === 0.0, 'False Positive Rate == 0.0');
  assert(metrics1.falseNegativeRate === 0.0, 'False Negative Rate == 0.0');
  console.log();

  // --------------------------------------------------------------------------
  // TEST 2: Synthetic Data — Missing Detections (Recall < 100%)
  // --------------------------------------------------------------------------
  console.log('--- TEST 2: Synthetic Data — Missing Detections (Recall < 100%) ---');
  // 5 ground truth labels, but detector only found 3
  const missingDetections: DetectedFeature[] = perfectDetections.slice(0, 3);
  const metrics2 = validateDetections(missingDetections, perfectLabels, 0.5);
  console.log('  Metrics:', JSON.stringify(metrics2));
  assert(metrics2.truePositives === 3, 'True Positives == 3');
  assert(metrics2.falsePositives === 0, 'False Positives == 0');
  assert(metrics2.falseNegatives === 2, 'False Negatives == 2');
  assert(metrics2.precision === 1.0, 'Precision == 100% (all detections were real)');
  assert(metrics2.recall < 1.0, `Recall < 100% (${(metrics2.recall * 100).toFixed(1)}%)`);
  assert(metrics2.recall === 0.6, 'Recall == 0.6 (3 / 5)');
  assert(metrics2.f1Score < 1.0, `F1-Score < 100% (${(metrics2.f1Score * 100).toFixed(1)}%)`);
  assert(metrics2.falseNegativeRate === 0.4, 'False Negative Rate == 0.4 (40%)');
  console.log();

  // --------------------------------------------------------------------------
  // TEST 3: Synthetic Data — False Detections (Precision < 100%)
  // --------------------------------------------------------------------------
  console.log('--- TEST 3: Synthetic Data — False Detections (Precision < 100%) ---');
  // 5 ground truth labels, but detector found 5 real + 3 false alarms
  const falseDetections: DetectedFeature[] = [
    ...perfectDetections,
    { x: 50, y: 50, radius: 6, confidence: 0.7, type: 'crater', id: 'false-1' },
    { x: 450, y: 150, radius: 4, confidence: 0.65, type: 'boulder', id: 'false-2' },
  ];
  const metrics3 = validateDetections(falseDetections, perfectLabels, 0.5);
  console.log('  Metrics:', JSON.stringify(metrics3));
  assert(metrics3.truePositives === 5, 'True Positives == 5');
  assert(metrics3.falsePositives === 2, 'False Positives == 2');
  assert(metrics3.falseNegatives === 0, 'False Negatives == 0');
  assert(metrics3.precision < 1.0, `Precision < 100% (${(metrics3.precision * 100).toFixed(1)}%)`);
  assert(metrics3.precision === 0.7143, 'Precision == 0.7143 (5 / 7)');
  assert(metrics3.recall === 1.0, 'Recall == 100% (all real labels found)');
  assert(metrics3.falsePositiveRate > 0, `False Positive Rate > 0 (${(metrics3.falsePositiveRate * 100).toFixed(1)}%)`);
  console.log();

  // --------------------------------------------------------------------------
  // TEST 4: Edge Case — No Detections (all metrics = 0)
  // --------------------------------------------------------------------------
  console.log('--- TEST 4: Edge Case — No Detections (all metrics = 0) ---');
  const metrics4 = validateDetections([], perfectLabels, 0.5);
  console.log('  Metrics:', JSON.stringify(metrics4));
  assert(metrics4.truePositives === 0, 'True Positives == 0');
  assert(metrics4.falsePositives === 0, 'False Positives == 0');
  assert(metrics4.falseNegatives === 0, 'False Negatives == 0');
  assert(metrics4.precision === 0, 'Precision == 0');
  assert(metrics4.recall === 0, 'Recall == 0');
  assert(metrics4.f1Score === 0, 'F1-Score == 0');
  assert(metrics4.falsePositiveRate === 0, 'False Positive Rate == 0');
  assert(metrics4.falseNegativeRate === 0, 'False Negative Rate == 0');
  console.log();

  // --------------------------------------------------------------------------
  // TEST 5: Edge Case — No Labels (all metrics = 0)
  // --------------------------------------------------------------------------
  console.log('--- TEST 5: Edge Case — No Labels (all metrics = 0) ---');
  const metrics5 = validateDetections(perfectDetections, [], 0.5);
  console.log('  Metrics:', JSON.stringify(metrics5));
  assert(metrics5.truePositives === 0, 'True Positives == 0');
  assert(metrics5.falsePositives === 0, 'False Positives == 0');
  assert(metrics5.falseNegatives === 0, 'False Negatives == 0');
  assert(metrics5.precision === 0, 'Precision == 0');
  assert(metrics5.recall === 0, 'Recall == 0');
  assert(metrics5.f1Score === 0, 'F1-Score == 0');
  assert(metrics5.falsePositiveRate === 0, 'False Positive Rate == 0');
  assert(metrics5.falseNegativeRate === 0, 'False Negative Rate == 0');
  console.log();

  // --------------------------------------------------------------------------
  // TEST 6: Real ISRO Chandrayaan-2 TMC-2 Validation with Ground Truth
  // --------------------------------------------------------------------------
  console.log('--- TEST 6: Real ISRO TMC-2 South Pole Validation with Ground Truth ---');
  const imagePath = path.resolve('src/assets/samples/ch2_tmc2_south_pole.png');
  const labelsPath = path.resolve('src/assets/validation/tmc2_south_pole_labels.json');

  assert(fs.existsSync(imagePath), `ISRO image exists at ${imagePath}`);
  assert(fs.existsSync(labelsPath), `Ground truth labels exist at ${labelsPath}`);

  const labelsRaw = JSON.parse(fs.readFileSync(labelsPath, 'utf8'));
  const groundTruthCraters: LabeledFeature[] = labelsRaw.craters || [];
  const groundTruthBoulders: LabeledFeature[] = labelsRaw.boulders || [];
  const allGroundTruth: LabeledFeature[] = [...groundTruthCraters, ...groundTruthBoulders];

  console.log(`  Loaded Ground Truth: ${groundTruthCraters.length} craters, ${groundTruthBoulders.length} boulders (Total ${allGroundTruth.length})`);
  assert(allGroundTruth.length >= 100, `Ground truth has at least 100 features (${allGroundTruth.length} >= 100)`);

  // Execute frozen engine
  console.log('  Executing frozen engine on ISRO TMC-2 South Pole image...');
  const rawBuffer = fs.readFileSync(imagePath);
  const parsedPng = PNG.sync.read(rawBuffer);
  const pixelData = {
    width: parsedPng.width,
    height: parsedPng.height,
    data: new Uint8ClampedArray(parsedPng.data),
  };

  const engineResult = await DeterministicLunarEngine.processLunarImage(rawBuffer, pixelData, {
    pixelScaleMeters: 5.0,
    gridSizeMeters: 24,
    maxSlopeDeg: 10.0,
  });

  const converted = convertEngineDetections(engineResult.craters, engineResult.boulders);
  console.log(`  Frozen Engine Detections: ${converted.craters.length} craters, ${converted.boulders.length} boulders (Total ${converted.all.length})`);

  // 1. Crater Validation
  const craterRes = validateDetectionsDetailed(converted.craters, groundTruthCraters, 0.5);
  console.log('\n  [CRATERS VALIDATION @ IoU 0.5]:');
  console.log(`    Total Detected:      ${craterRes.totalDetections}`);
  console.log(`    Total Labeled:       ${craterRes.totalLabels}`);
  console.log(`    Matched (TP):        ${craterRes.truePositives}`);
  console.log(`    False Alarms (FP):   ${craterRes.falsePositives}`);
  console.log(`    Missed (FN):         ${craterRes.falseNegatives}`);
  console.log(`    Precision:           ${(craterRes.precision * 100).toFixed(2)}%`);
  console.log(`    Recall:              ${(craterRes.recall * 100).toFixed(2)}%`);
  console.log(`    F1-Score:            ${(craterRes.f1Score * 100).toFixed(2)}%`);
  console.log(`    False Positive Rate: ${(craterRes.falsePositiveRate * 100).toFixed(2)}%`);
  console.log(`    False Negative Rate: ${(craterRes.falseNegativeRate * 100).toFixed(2)}%`);

  // 2. Boulder Validation
  const boulderRes = validateDetectionsDetailed(converted.boulders, groundTruthBoulders, 0.5);
  console.log('\n  [BOULDERS VALIDATION @ IoU 0.5]:');
  console.log(`    Total Detected:      ${boulderRes.totalDetections}`);
  console.log(`    Total Labeled:       ${boulderRes.totalLabels}`);
  console.log(`    Matched (TP):        ${boulderRes.truePositives}`);
  console.log(`    False Alarms (FP):   ${boulderRes.falsePositives}`);
  console.log(`    Missed (FN):         ${boulderRes.falseNegatives}`);
  console.log(`    Precision:           ${(boulderRes.precision * 100).toFixed(2)}%`);
  console.log(`    Recall:              ${(boulderRes.recall * 100).toFixed(2)}%`);
  console.log(`    F1-Score:            ${(boulderRes.f1Score * 100).toFixed(2)}%`);
  console.log(`    False Positive Rate: ${(boulderRes.falsePositiveRate * 100).toFixed(2)}%`);
  console.log(`    False Negative Rate: ${(boulderRes.falseNegativeRate * 100).toFixed(2)}%`);

  // 3. Combined Features Validation
  const overallRes = validateDetectionsDetailed(converted.all, allGroundTruth, 0.5);
  console.log('\n  [OVERALL HAZARD VALIDATION (CRATERS + BOULDERS) @ IoU 0.5]:');
  console.log(`    Total Detected:      ${overallRes.totalDetections}`);
  console.log(`    Total Labeled:       ${overallRes.totalLabels}`);
  console.log(`    Matched (TP):        ${overallRes.truePositives}`);
  console.log(`    False Alarms (FP):   ${overallRes.falsePositives}`);
  console.log(`    Missed (FN):         ${overallRes.falseNegatives}`);
  console.log(`    Precision:           ${(overallRes.precision * 100).toFixed(2)}%`);
  console.log(`    Recall:              ${(overallRes.recall * 100).toFixed(2)}%`);
  console.log(`    F1-Score:            ${(overallRes.f1Score * 100).toFixed(2)}%`);
  console.log(`    False Positive Rate: ${(overallRes.falsePositiveRate * 100).toFixed(2)}%`);
  console.log(`    False Negative Rate: ${(overallRes.falseNegativeRate * 100).toFixed(2)}%`);

  assert(overallRes.truePositives > 0, `Non-zero true positives (${overallRes.truePositives} > 0)`);
  assert(overallRes.precision > 0.5, `Precision exceeds 50% (${(overallRes.precision * 100).toFixed(1)}% > 50%)`);
  assert(overallRes.recall > 0.5, `Recall exceeds 50% (${(overallRes.recall * 100).toFixed(1)}% > 50%)`);
  assert(overallRes.f1Score > 0.5, `F1-Score exceeds 50% (${(overallRes.f1Score * 100).toFixed(1)}% > 50%)`);

  console.log(`\n================================================================`);
  console.log(`    TEST SUITE SUMMARY: ${passedTests} / ${totalTests} ASSERTIONS PASSED`);
  console.log(`================================================================`);
}

runHazardValidationTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
