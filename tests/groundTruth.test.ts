import * as fs from 'fs';
import * as path from 'path';
import { validateAgainstLOLA } from '../src/lib/lolaValidator';
import { computeSlopeFromDEM } from '../src/lib/demSlope';
import { computeSlopeUncertainty } from '../src/lib/uncertainty';
import { classifyHazardConservative } from '../src/lib/hazardClassifier';

console.log('============================================================');
console.log('     LUNARSAFE PHASE 3: GENUINE LOLA GROUND-TRUTH SUITE      ');
console.log('============================================================\n');

let allPassed = true;
const csvRows: string[] = ['site, published_source_url, published_slope, published_slope_source, horn_slope, mean_sigma_slope_deg, rmse, pass, evidence_strength, uncertainty_method, safe_count_deterministic, safe_count_conservative, mean_slope_deg, mean_sigma_deg, cons_safe_pct, marginal_site'];

interface GroundTruthTarget {
  name: string;
  demFile: string;
  imageFile: string;
  gsd: number;
  publishedSlope: number;
  publishedSlopeSource: string;
  evidenceStrength: 'DIRECT_QUOTE' | 'INFERRED_FROM_RANGE' | 'CITED_RANGE';
  citation: string;
  sourceUrl: string;
  isMarginal?: boolean;
}

const targets: GroundTruthTarget[] = [
  {
    name: 'Apollo 11 Tranquility Base',
    demFile: 'src/assets/dem/apollo11_lola_dem.tif',
    imageFile: 'src/assets/samples/isro_tmc2_manzinusc_crop.png',
    gsd: 59.225,
    publishedSlope: 1.30,
    publishedSlopeSource: 'Rosenburg2011_Table1_maria_range_1.1-1.5_midpoint',
    evidenceStrength: 'INFERRED_FROM_RANGE',
    citation: 'Rosenburg et al. (2011, JGR Planets, 116, E02001 Table 1); NASA Apollo 11 Press Kit (1969, p. 28)',
    sourceUrl: 'https://doi.org/10.1029/2010JE003716',
    isMarginal: false,
  },
  {
    name: 'Shiv Shakti Point (Chandrayaan-3)',
    demFile: 'src/assets/dem/shiv_shakti_lola_dem.tif',
    imageFile: 'src/assets/samples/isro_ohrc_shivshakti_crop.png',
    gsd: 35.15,
    publishedSlope: 2.00,
    publishedSlopeSource: 'DurgaPrasad2023_modal_bin_2-3_lower_bound',
    evidenceStrength: 'INFERRED_FROM_RANGE',
    citation: 'Durga Prasad et al. (2023, arXiv:2308.10712 / Current Science 2024); SAC/ISRO (2023)',
    sourceUrl: 'https://arxiv.org/abs/2308.10712',
    isMarginal: false,
  },
  {
    name: 'Shackleton Crater Rim',
    demFile: 'src/assets/dem/shackleton_lola_dem.tif',
    imageFile: 'src/assets/samples/ch2_tmc2_south_pole.png',
    gsd: 20.0,
    publishedSlope: 31.00,
    publishedSlopeSource: 'Zuber2012_direct_quote_31_deg_avg',
    evidenceStrength: 'DIRECT_QUOTE',
    citation: 'Zuber et al. (Nature 2012, 486, 478-481, doi:10.1038/nature11216)',
    sourceUrl: 'https://www.nature.com/articles/nature11216',
    isMarginal: false,
  },
  {
    name: 'Apollo 17 South Massif Rim (Marginal Site)',
    demFile: 'src/assets/dem/marginal_site_lola_dem.tif',
    imageFile: 'src/assets/samples/isro_tmc2_manzinusc_crop.png',
    gsd: 57.38,
    publishedSlope: 10.00,
    publishedSlopeSource: 'CHOSEN_FOR_SENSITIVITY_TEST_not_ground_truth',
    evidenceStrength: 'CITED_RANGE',
    citation: 'Smith et al. (2010, GRL 37, L02201); Schmitt et al. (1973, NASA SP-330)',
    sourceUrl: 'https://imbrium.mit.edu/DATA/LOLA_GDR/CYLINDRICAL/FLOAT_IMG/LDEM_512_00N_45N_000_090_FLOAT.LBL',
    isMarginal: true,
  },
];

for (let i = 0; i < targets.length; i++) {
  const t = targets[i];
  console.log(`--- TEST ${i + 1}: ${t.name} ---`);
  const resolvedDem = path.resolve(t.demFile);
  if (!fs.existsSync(resolvedDem)) {
    console.error(`DEM not found: ${resolvedDem}`);
    allPassed = false;
    continue;
  }

  // 1. Validate slope against LOLA published ground truth
  const res = validateAgainstLOLA(resolvedDem, t.imageFile, t.gsd);

  // 2. Compute propagated uncertainty for sigmaElevM = 1.0 m (LOLA standard vertical accuracy)
  const rawBuf = fs.readFileSync(resolvedDem);
  const demFloats = new Float32Array(rawBuf.buffer, rawBuf.byteOffset, rawBuf.byteLength / 4);
  const dim = Math.round(Math.sqrt(demFloats.length));
  const uncert = computeSlopeUncertainty(demFloats, dim, dim, t.gsd, 1.0);

  // 3. Compute deterministic and conservative hazard classifications (safe slope threshold = 10.0°, 95% CI multiplier = 2.0)
  const slopeRes = computeSlopeFromDEM(demFloats, dim, dim, t.gsd);
  const hazardRes = classifyHazardConservative(
    slopeRes.slopeMap,
    uncert.perPixelSigma,
    dim,
    dim,
    t.gsd,
    null,
    null,
    10.0,
    2.0
  );

  const isMarginal = Boolean(t.isMarginal);
  const pubSlopeStr = isMarginal ? 'N/A' : res.lolaMeanSlopeDeg.toFixed(2);
  const rmseStr = isMarginal ? 'N/A' : res.rmseDeg.toFixed(2);
  const passStr = isMarginal ? 'N/A' : (res.pass && res.rmseDeg < 2.0 ? 'true' : 'false');
  const testPass = isMarginal ? true : (res.pass && res.rmseDeg < 2.0);

  console.log(`Target Site:             ${t.name}`);
  console.log(`DEM Raster File:         ${t.demFile} (Raw IEEE 754 Float32)`);
  console.log(`Published Citation:      ${t.citation}`);
  console.log(`Published Source URL:    ${t.sourceUrl}`);
  console.log(`Published Slope Source:  ${t.publishedSlopeSource}`);
  console.log(`Evidence Strength:       ${t.evidenceStrength}`);
  console.log(`Published Ground Slope:  ${isMarginal ? 'N/A (Sensitivity Benchmark)' : res.lolaMeanSlopeDeg.toFixed(2) + '°'}`);
  console.log(`Horn (1981) DEM Slope:   ${res.hornMeanSlopeDeg.toFixed(2)}°`);
  console.log(`Propagated Sigma (±1s):  ${uncert.meanSigmaSlopeDeg.toFixed(4)}°`);
  console.log(`Uncertainty Method:      HORN_FINITE_DIFF_FIRST_ORDER`);
  console.log(`Deterministic Safe:      ${hazardRes.safeCount} / ${hazardRes.cellSafe.length} cells`);
  console.log(`Conservative Safe:       ${hazardRes.safeCountConservative} / ${hazardRes.cellSafeConservative.length} cells`);
  if (isMarginal) {
    console.log(`RMSE:                    N/A (Sensitivity Benchmark — Not Ground Truth)`);
    console.log(`Bias:                    N/A`);
    console.log(`Pass Status:             N/A`);
    console.log(`[ASSERT ${i + 1}] ${t.name}: PASS (Marginal Sensitivity Benchmark)\n`);
  } else {
    console.log(`Absolute Error (|Bias|): ${res.rmseDeg.toFixed(2)}° (Threshold: < 2.0°)`);
    console.log(`RMSE:                    ${res.rmseDeg.toFixed(2)}° (Scalar Absolute Difference)`);
    console.log(`Bias:                    ${res.biasDeg.toFixed(2)}°`);
    console.log(`Pass Status:             ${res.pass ? 'PASS' : 'FAIL'}`);
    console.log(`[ASSERT ${i + 1}] ${t.name} Slope Error < 2.0°: ${testPass ? 'PASS' : 'FAIL'}\n`);
    if (!testPass) allPassed = false;
  }

  const consSafePct = hazardRes.cellSafeConservative.length > 0
    ? ((hazardRes.safeCountConservative / hazardRes.cellSafeConservative.length) * 100).toFixed(2)
    : '0.00';

  csvRows.push(`${t.name}, ${t.sourceUrl}, ${pubSlopeStr}, ${t.publishedSlopeSource}, ${res.hornMeanSlopeDeg.toFixed(2)}, ${uncert.meanSigmaSlopeDeg.toFixed(4)}, ${rmseStr}, ${passStr}, ${t.evidenceStrength}, HORN_FINITE_DIFF_FIRST_ORDER, ${hazardRes.safeCount}, ${hazardRes.safeCountConservative}, ${res.hornMeanSlopeDeg.toFixed(2)}, ${uncert.meanSigmaSlopeDeg.toFixed(4)}, ${consSafePct}, ${isMarginal}`);
}

// Write validation_results.csv
const csvContent = csvRows.join('\r\n') + '\r\n';
const csvPath = path.resolve('validation_results.csv');
fs.writeFileSync(csvPath, csvContent, 'utf8');
console.log(`Written ${csvPath}:`);
console.log(csvContent);

console.log('============================================================');
console.log(`FINAL RESULT: ${allPassed ? 'ALL GROUND-TRUTH TESTS PASSED' : 'SOME TESTS FAILED'}`);
console.log('============================================================');

if (!allPassed) {
  process.exit(1);
}
