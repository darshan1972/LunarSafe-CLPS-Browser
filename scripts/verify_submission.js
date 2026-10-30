import fs from 'fs';
import path from 'path';

const target = 'C:\\Users\\bagul\\Desktop\\LunarSafe_ISRO_Submission';

console.log('--- VERIFYING JSON FILES ---');
const jsonFiles = [
  path.join(target, '05_Data_and_Maps', 'full_analysis_results.json'),
  path.join(target, '05_Data_and_Maps', 'multi_site_validation_results.json'),
  path.join(target, '05_Data_and_Maps', 'tmc2_south_pole_labels.json')
];

for (const j of jsonFiles) {
  try {
    const raw = fs.readFileSync(j, 'utf-8');
    const parsed = JSON.parse(raw);
    console.log(`[PASS] Valid JSON: ${path.basename(j)} (${raw.length} bytes, keys: ${Object.keys(parsed).length})`);
  } catch (err) {
    console.error(`[FAIL] JSON error in ${j}:`, err.message);
  }
}

console.log('\n--- VERIFYING COVERAGE MAP ---');
const mapPath = path.join(target, '03_Full_ISRO_Analysis', 'full_coverage_map.png');
if (fs.existsSync(mapPath) && fs.statSync(mapPath).size > 0) {
  console.log(`[PASS] Coverage map exists: ${mapPath} (${fs.statSync(mapPath).size} bytes)`);
} else {
  console.error(`[FAIL] Missing coverage map: ${mapPath}`);
}

console.log('\n--- VERIFYING PDF FILES (READABILITY & HEADER CHECK) ---');
const pdfDirList = [
  '01_Validation_Reports',
  '02_Scientific_Documentation',
  '03_Full_ISRO_Analysis',
  '04_Master_Dossiers'
];

let pdfCount = 0;
for (const d of pdfDirList) {
  const fullDir = path.join(target, d);
  const files = fs.readdirSync(fullDir).filter(f => f.toLowerCase().endsWith('.pdf'));
  for (const f of files) {
    pdfCount++;
    const pPath = path.join(fullDir, f);
    const buf = fs.readFileSync(pPath);
    const header = buf.slice(0, 5).toString('ascii');
    const isPdf = header.startsWith('%PDF-');
    console.log(`[PDF ${pdfCount}] ${d}/${f}: size=${buf.length} bytes, header=${header.trim()} (valid: ${isPdf})`);
  }
}
console.log(`\nTotal PDFs verified: ${pdfCount}`);
