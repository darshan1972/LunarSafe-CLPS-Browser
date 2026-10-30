import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

const baseDir = 'C:\\Users\\bagul\\Desktop\\LunarSafe_ISRO_Submission';
const zipPath = 'C:\\Users\\bagul\\Desktop\\LunarSafe_ISRO_Submission.zip';
const enginePath = path.resolve('src/lib/imageProcessor.ts');

console.log('============================================================');
console.log('      TASK 5 — LUNARSAFE MASTER PACKAGE FINAL VERIFICATION   ');
console.log('============================================================\n');

// STEP 1: Verify 7 Subfolders
console.log('--- STEP 1: FOLDER STRUCTURE VERIFICATION ---');
const expectedSubfolders = [
  '01_Validation_Reports',
  '02_Scientific_Documentation',
  '03_Full_ISRO_Analysis',
  '04_Master_Dossiers',
  '05_Data_and_Maps',
  '06_Source_Code',
  '07_Screenshots'
];

let subfolderCheck = true;
const subfolderResults = [];
for (const sub of expectedSubfolders) {
  const p = path.join(baseDir, sub);
  const exists = fs.existsSync(p) && fs.statSync(p).isDirectory();
  subfolderResults.push({ subfolder: sub, exists });
  if (!exists) subfolderCheck = false;
  console.log(`Subfolder [${sub}]: exists = ${exists}`);
}
console.log(`Step 1 Status: ${subfolderCheck ? 'PASS' : 'FAIL'}\n`);

// STEP 2: Verify All 12 PDFs
console.log('--- STEP 2: ALL 12 PDFS INTEGRITY VERIFICATION ---');
const expectedPdfs = [
  { sub: '01_Validation_Reports', file: 'LunarSafe_hazard_validation_report.pdf' },
  { sub: '01_Validation_Reports', file: 'LunarSafe_multi_site_validation_report.pdf' },
  { sub: '02_Scientific_Documentation', file: 'LunarSafe_Methodology.pdf' },
  { sub: '02_Scientific_Documentation', file: 'LunarSafe_Algorithms.pdf' },
  { sub: '02_Scientific_Documentation', file: 'LunarSafe_Validation_Results.pdf' },
  { sub: '02_Scientific_Documentation', file: 'LunarSafe_Error_Analysis.pdf' },
  { sub: '02_Scientific_Documentation', file: 'LunarSafe_Limitations.pdf' },
  { sub: '02_Scientific_Documentation', file: 'LunarSafe_References.pdf' },
  { sub: '03_Full_ISRO_Analysis', file: 'LunarSafe_full_isro_analysis_report.pdf' },
  { sub: '04_Master_Dossiers', file: 'LUNARSAFE_COMPLETE_MASTER_PROJECT_DOSSIER.pdf' },
  { sub: '04_Master_Dossiers', file: 'LUNARSAFE_COMPLETE_TECHNICAL_DOSSIER.pdf' },
  { sub: '01_Validation_Reports', file: 'audit_verified_report.pdf' }
];

let pdfsCheck = true;
const pdfResults = [];
expectedPdfs.forEach((item, idx) => {
  const fullPath = path.join(baseDir, item.sub, item.file);
  let size = 0;
  let headerValid = false;
  if (fs.existsSync(fullPath)) {
    const buf = fs.readFileSync(fullPath);
    size = buf.length;
    const header = buf.slice(0, 5).toString('ascii');
    headerValid = header.startsWith('%PDF-');
  }
  if (!headerValid || size === 0) pdfsCheck = false;
  const res = { index: idx + 1, name: `${item.sub}/${item.file}`, size, headerValid };
  pdfResults.push(res);
  console.log(`[PDF ${idx + 1}] ${item.file}: size=${size} bytes, headerValid=${headerValid ? 'YES' : 'NO'}`);
});
console.log(`Step 2 Status: ${pdfsCheck ? 'PASS' : 'FAIL'} (Total PDFs: ${pdfResults.length})\n`);

// STEP 3: Verify Coverage Map
console.log('--- STEP 3: COVERAGE MAP VERIFICATION ---');
const mapPath = path.join(baseDir, '03_Full_ISRO_Analysis', 'full_coverage_map.png');
let mapCheck = false;
let mapDetails = {};
if (fs.existsSync(mapPath)) {
  const mapBuf = fs.readFileSync(mapPath);
  const size = mapBuf.length;
  // PNG IHDR is at offset 16 (4 bytes width, 4 bytes height network-byte-order uint32)
  const width = mapBuf.readUInt32BE(16);
  const height = mapBuf.readUInt32BE(20);
  mapDetails = { path: mapPath, size, width, height };
  mapCheck = size > 0 && width === 1000 && height === 2000;
  console.log(`Coverage Map Path: ${mapPath}`);
  console.log(`Size: ${size} bytes`);
  console.log(`Dimensions: ${width} × ${height} px`);
  console.log(`Valid: ${mapCheck ? 'YES' : 'NO'}`);
} else {
  console.error('Coverage map NOT found at:', mapPath);
}
console.log(`Step 3 Status: ${mapCheck ? 'PASS' : 'FAIL'}\n`);

// STEP 4: Verify Data Files
console.log('--- STEP 4: DATA FILES PARSING VERIFICATION ---');
const dataFiles = [
  { sub: '05_Data_and_Maps', file: 'full_analysis_results.json', type: 'json' },
  { sub: '05_Data_and_Maps', file: 'multi_site_validation_results.json', type: 'json' },
  { sub: '05_Data_and_Maps', file: 'multi_site_validation_results.csv', type: 'csv' },
  { sub: '05_Data_and_Maps', file: 'tmc2_south_pole_labels.json', type: 'json' }
];

let dataCheck = true;
const dataResults = [];
for (const item of dataFiles) {
  const p = path.join(baseDir, item.sub, item.file);
  let parsed = false;
  let keyCount = 0;
  let size = 0;
  if (fs.existsSync(p)) {
    const raw = fs.readFileSync(p, 'utf-8');
    size = Buffer.byteLength(raw, 'utf-8');
    if (item.type === 'json') {
      try {
        const obj = JSON.parse(raw);
        parsed = true;
        keyCount = Object.keys(obj).length;
      } catch (err) {
        parsed = false;
      }
    } else if (item.type === 'csv') {
      const lines = raw.trim().split('\n');
      parsed = lines.length > 1;
      keyCount = lines.length; // row count
    }
  }
  if (!parsed) dataCheck = false;
  dataResults.push({ name: item.file, size, parsed: parsed ? 'YES' : 'NO', keyCount });
  console.log(`[DATA] ${item.file}: size=${size} bytes, parsed=${parsed ? 'YES' : 'NO'}, keyCount/rows=${keyCount}`);
}
console.log(`Step 4 Status: ${dataCheck ? 'PASS' : 'FAIL'}\n`);

// STEP 5: Verify Zip Archive
console.log('--- STEP 5: ZIP ARCHIVE VERIFICATION ---');
let zipCheck = false;
let zipDetails = {};
if (fs.existsSync(zipPath)) {
  const zipBuf = fs.readFileSync(zipPath);
  const size = zipBuf.length;
  const hash = crypto.createHash('sha256').update(zipBuf).digest('hex').toUpperCase();

  // Count files inside zip using PowerShell
  const countCmd = `powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::OpenRead('${zipPath.replace(/\\/g, '\\\\')}').Entries.Count"`;
  const entriesCount = parseInt(execSync(countCmd).toString().trim(), 10);

  zipDetails = { path: zipPath, size, hash, entriesCount };
  zipCheck = size > 0 && entriesCount >= 150;
  console.log(`Zip Path: ${zipPath}`);
  console.log(`Size: ${size} bytes (${(size / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`SHA-256: ${hash}`);
  console.log(`Entries inside: ${entriesCount} (Requirement: 150+)`);
  console.log(`Zip Valid: ${zipCheck ? 'YES' : 'NO'}`);
} else {
  console.error('Zip NOT found at:', zipPath);
}
console.log(`Step 5 Status: ${zipCheck ? 'PASS' : 'FAIL'}\n`);

// STEP 6: Frozen Engine Verification
console.log('--- STEP 6: FROZEN ENGINE VERIFICATION ---');
const engineBuf = fs.readFileSync(enginePath);
const engineSize = engineBuf.length;
const engineHash = crypto.createHash('sha256').update(engineBuf).digest('hex').toUpperCase();
const expectedSize = 41930;
const expectedHash = '8CA34C558C41F0B324A207A1D758476D397319999313D59A5919E75912882956';
const engineMatch = (engineSize === expectedSize) && (engineHash === expectedHash);

console.log(`File: ${enginePath}`);
console.log(`Byte size: ${engineSize} (Expected: ${expectedSize}) -> ${engineSize === expectedSize ? 'MATCH' : 'MISMATCH'}`);
console.log(`SHA-256: ${engineHash}`);
console.log(`Expected: ${expectedHash}`);
console.log(`Match Status: ${engineMatch ? '100% BIT-IDENTICAL' : 'FAILED'}`);
console.log(`Step 6 Status: ${engineMatch ? 'PASS' : 'FAIL'}\n`);

fs.writeFileSync('task5_checks.json', JSON.stringify({
  subfolders: subfolderResults,
  pdfs: pdfResults,
  coverageMap: mapDetails,
  dataFiles: dataResults,
  zip: zipDetails,
  frozenEngine: { size: engineSize, hash: engineHash, match: engineMatch }
}, null, 2));

console.log('Check results saved to task5_checks.json');
