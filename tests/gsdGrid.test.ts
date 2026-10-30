import { computeGridCellPixels, assertCanDetectBoulders, InstrumentResolutionError } from '../src/lib/grid';
import { parsePds4XmlMetadata } from '../src/lib/metadataParser';

console.log('============================================================');
console.log('LUNARSAFE PHASE 1: GSD PROPAGATION & RESOLUTION TEST');
console.log('============================================================');

const CELL_METERS = 24; // ISRO standard 24m landing cell

// Test case 1: OHRC (0.25 m/pixel)
const gsdOHRC = 0.25;
const pixelsOHRC = computeGridCellPixels(CELL_METERS, gsdOHRC);
console.log(`[OHRC]     GSD: ${gsdOHRC} m/px  | 24m cell = ${pixelsOHRC} pixels`);

// Test case 2: LROC NAC (0.5 m/pixel)
const gsdLROC = 0.5;
const pixelsLROC = computeGridCellPixels(CELL_METERS, gsdLROC);
console.log(`[LROC NAC] GSD: ${gsdLROC} m/px   | 24m cell = ${pixelsLROC} pixels`);

// Test case 3: TMC-2 (5.0 m/pixel)
const gsdTMC2 = 5.0;
const pixelsTMC2 = computeGridCellPixels(CELL_METERS, gsdTMC2);
console.log(`[TMC-2]    GSD: ${gsdTMC2} m/px   | 24m cell = ${pixelsTMC2} pixels`);

// Assert distinct values
if (pixelsOHRC !== 96) {
  throw new Error(`Expected OHRC 24m cell to be 96 pixels, got ${pixelsOHRC}`);
}
if (pixelsLROC !== 48) {
  throw new Error(`Expected LROC NAC 24m cell to be 48 pixels, got ${pixelsLROC}`);
}
if (pixelsTMC2 !== 4) {
  throw new Error(`Expected TMC-2 24m cell to be 4 pixels, got ${pixelsTMC2}`);
}

const uniqueSizes = new Set([pixelsOHRC, pixelsLROC, pixelsTMC2]);
if (uniqueSizes.size !== 3) {
  throw new Error(`Expected 3 distinct grid cell pixel sizes, but found ${uniqueSizes.size}`);
}
console.log(`✓ PROOF: Same 100x100 pixel buffer produces 3 distinct grid cell dimensions: [${pixelsOHRC}px, ${pixelsLROC}px, ${pixelsTMC2}px]`);

// Test Instrument Gate: Boulder detection on TMC-2 (5.0 m/px)
console.log('\n--- Testing Instrument Resolution Gate for Boulder Detection ---');
let caughtExpectedError = false;
try {
  console.log(`Checking boulder detection capability on TMC-2 (GSD = ${gsdTMC2} m/px)...`);
  assertCanDetectBoulders(gsdTMC2);
} catch (err: any) {
  if (err instanceof InstrumentResolutionError) {
    caughtExpectedError = true;
    console.log(`✓ Expected error caught successfully:`);
    console.log(`  "${err.message}"`);
  } else {
    throw new Error(`Caught unexpected error type: ${err}`);
  }
}

if (!caughtExpectedError) {
  throw new Error('InstrumentResolutionError was NOT thrown for TMC-2 (5.0 m/px)!');
}

// Test Instrument Gate: Boulder detection on OHRC (0.25 m/px) - should pass
assertCanDetectBoulders(gsdOHRC);
console.log(`✓ Boulder detection allowed on OHRC (0.25 m/px) - Passed.`);

// Test PDS4 XML metadata parser
console.log('\n--- Testing PDS4 XML Metadata Parser ---');
const sampleXml = `
<?xml version="1.0" encoding="UTF-8"?>
<Product_Observational xmlns="http://pds.nasa.gov/pds4/pds/v1">
  <Identification_Area>
    <logical_identifier>urn:isro:issdc:ch2_ohrc_shivshakti:001</logical_identifier>
    <title>Chandrayaan-2 OHRC Landing Zone Image</title>
  </Identification_Area>
  <Observation_Area>
    <target_name>Moon</target_name>
    <Observing_System>
      <Observing_System_Component>
        <name>OHRC</name>
      </Observing_System_Component>
    </Observing_System>
    <Discipline_Area>
      <pixel_resolution unit="m/pixel">0.25</pixel_resolution>
      <solar_azimuth_angle unit="deg">134.5</solar_azimuth_angle>
      <solar_elevation_angle unit="deg">18.2</solar_elevation_angle>
    </Discipline_Area>
  </Observation_Area>
</Product_Observational>
`;

const parsed = parsePds4XmlMetadata(sampleXml);
console.log(`Parsed PDS4 Metadata: Instrument=${parsed.instrument}, GSD=${parsed.gsdMetersPerPixel} m/px, SunElev=${parsed.sunElevationDeg}°`);
if (parsed.instrument !== 'OHRC' || parsed.gsdMetersPerPixel !== 0.25) {
  throw new Error('PDS4 XML Metadata parser failed to extract correct OHRC metadata.');
}
console.log('✓ PDS4 XML Metadata Parser verified successfully.');

console.log('\n============================================================');
console.log('ALL PHASE 1 GSD PROPAGATION CHECKS PASSED SUCCESSFULLY.');
console.log('============================================================');
