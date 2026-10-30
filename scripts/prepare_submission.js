import fs from 'fs';
import path from 'path';

const targetDir = 'C:\\Users\\bagul\\Desktop\\LunarSafe_ISRO_Submission';
const projectRoot = 'C:\\Users\\bagul\\OneDrive\\Documents\\team rocket !!!\\team rocket !!!';
const brainArtifactsDir = 'C:\\Users\\bagul\\.gemini\\antigravity\\brain\\baed6b60-3d6b-4b88-a0f6-7cae06dced5f';

console.log('--- STEP 1: CREATING DIRECTORY STRUCTURE ---');
const subfolders = [
  '01_Validation_Reports',
  '02_Scientific_Documentation',
  '03_Full_ISRO_Analysis',
  '04_Master_Dossiers',
  '05_Data_and_Maps',
  '06_Source_Code',
  '07_Screenshots'
];

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

for (const sub of subfolders) {
  const fullSub = path.join(targetDir, sub);
  if (!fs.existsSync(fullSub)) {
    fs.mkdirSync(fullSub, { recursive: true });
  }
}
console.log('Directory structure successfully created at:', targetDir);

console.log('\n--- STEP 2: COPYING ALL DOCUMENTS ---');

// 01_Validation_Reports
const validationFiles = [
  { src: 'LunarSafe_hazard_validation_report.pdf', dest: '01_Validation_Reports/LunarSafe_hazard_validation_report.pdf' },
  { src: 'LunarSafe_multi_site_validation_report.pdf', dest: '01_Validation_Reports/LunarSafe_multi_site_validation_report.pdf' },
  { src: 'scripts/output/audit_verified_report.pdf', dest: '01_Validation_Reports/audit_verified_report.pdf' }
];

for (const file of validationFiles) {
  const srcPath = path.resolve(projectRoot, file.src);
  const destPath = path.join(targetDir, file.dest);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied: ${file.src} -> ${file.dest} (${fs.statSync(destPath).size} bytes)`);
  } else {
    console.warn(`WARNING: Missing source file: ${srcPath}`);
  }
}

// 02_Scientific_Documentation
const scientificFiles = [
  'LunarSafe_Methodology.pdf',
  'LunarSafe_Algorithms.pdf',
  'LunarSafe_Validation_Results.pdf',
  'LunarSafe_Error_Analysis.pdf',
  'LunarSafe_Limitations.pdf',
  'LunarSafe_References.pdf'
];

for (const name of scientificFiles) {
  const srcPath = path.resolve(projectRoot, name);
  const destPath = path.join(targetDir, '02_Scientific_Documentation', name);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied: ${name} -> 02_Scientific_Documentation/${name} (${fs.statSync(destPath).size} bytes)`);
  } else {
    console.warn(`WARNING: Missing source file: ${srcPath}`);
  }
}

// 03_Full_ISRO_Analysis
const isroFiles = [
  { src: 'LunarSafe_full_isro_analysis_report.pdf', dest: '03_Full_ISRO_Analysis/LunarSafe_full_isro_analysis_report.pdf' },
  { src: 'src/assets/isro_data/full_coverage_map.png', dest: '03_Full_ISRO_Analysis/full_coverage_map.png' }
];

for (const file of isroFiles) {
  const srcPath = path.resolve(projectRoot, file.src);
  const destPath = path.join(targetDir, file.dest);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied: ${file.src} -> ${file.dest} (${fs.statSync(destPath).size} bytes)`);
  } else {
    console.warn(`WARNING: Missing source file: ${srcPath}`);
  }
}

// 04_Master_Dossiers
const dossierFiles = [
  'LUNARSAFE_COMPLETE_MASTER_PROJECT_DOSSIER.pdf',
  'LUNARSAFE_COMPLETE_TECHNICAL_DOSSIER.pdf'
];

for (const name of dossierFiles) {
  const srcPath = path.resolve(projectRoot, name);
  const destPath = path.join(targetDir, '04_Master_Dossiers', name);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied: ${name} -> 04_Master_Dossiers/${name} (${fs.statSync(destPath).size} bytes)`);
  } else {
    console.warn(`WARNING: Missing source file: ${srcPath}`);
  }
}

// 05_Data_and_Maps
const dataFiles = [
  { src: 'src/assets/isro_data/full_analysis_results.json', dest: '05_Data_and_Maps/full_analysis_results.json' },
  { src: 'multi_site_validation_results.json', dest: '05_Data_and_Maps/multi_site_validation_results.json' },
  { src: 'multi_site_validation_results.csv', dest: '05_Data_and_Maps/multi_site_validation_results.csv' },
  { src: 'src/assets/validation/tmc2_south_pole_labels.json', dest: '05_Data_and_Maps/tmc2_south_pole_labels.json' }
];

for (const file of dataFiles) {
  const srcPath = path.resolve(projectRoot, file.src);
  const destPath = path.join(targetDir, file.dest);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied: ${file.src} -> ${file.dest} (${fs.statSync(destPath).size} bytes)`);
  } else {
    console.warn(`WARNING: Missing source file: ${srcPath}`);
  }
}

// 06_Source_Code
console.log('\nCopying Source Code into 06_Source_Code...');
const sourceCodeTarget = path.join(targetDir, '06_Source_Code');

// Helper to recursively copy directories with filtering
function copyDirRecursive(src, dest, excludeFilter) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (excludeFilter && excludeFilter(srcPath, entry.name)) {
      continue;
    }
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath, excludeFilter);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy src/
copyDirRecursive(
  path.join(projectRoot, 'src'),
  path.join(sourceCodeTarget, 'src'),
  (p, name) => false // copy all src
);
console.log('Copied src/ directory successfully.');

// Copy tests/
copyDirRecursive(
  path.join(projectRoot, 'tests'),
  path.join(sourceCodeTarget, 'tests'),
  (p, name) => false
);
console.log('Copied tests/ directory successfully.');

// Copy individual files
const codeFiles = ['server.ts', 'package.json', 'tsconfig.json', 'vite.config.ts', 'README.md'];
for (const f of codeFiles) {
  const srcPath = path.join(projectRoot, f);
  const destPath = path.join(sourceCodeTarget, f);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied: ${f} -> 06_Source_Code/${f}`);
  }
}

// 07_Screenshots
console.log('\nCopying Screenshots into 07_Screenshots...');
const screenshotsTarget = path.join(targetDir, '07_Screenshots');
if (fs.existsSync(brainArtifactsDir)) {
  const artifactFiles = fs.readdirSync(brainArtifactsDir);
  for (const file of artifactFiles) {
    if (file.toLowerCase().endsWith('.png')) {
      const srcPath = path.join(brainArtifactsDir, file);
      const destPath = path.join(screenshotsTarget, file);
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied screenshot: ${file} (${fs.statSync(destPath).size} bytes)`);
    }
  }
}

console.log('\nAll documents, source code, data, and screenshots copied successfully!');
