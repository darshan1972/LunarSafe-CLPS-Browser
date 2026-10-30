import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

const stagingDir = 'C:\\Users\\bagul\\Desktop\\staging_frozen_engine';
const zipPath = 'C:\\Users\\bagul\\Desktop\\LunarSafe_FrozenEngine_Verification.zip';
const projectRoot = 'C:\\Users\\bagul\\OneDrive\\Documents\\team rocket !!!\\team rocket !!!';

console.log('--- PREPARING COMPACT REVIEW PACKAGE FOR CLAUDE ---');

if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

// Helper to copy directory recursively with filtering
function copyFiltered(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      if (
        entry.name === 'node_modules' ||
        entry.name === '.git' ||
        entry.name === 'dist' ||
        entry.name === 'scratch' ||
        entry.name === '.cache'
      ) {
        continue;
      }
      copyFiltered(srcPath, destPath);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      // Exclude .img files
      if (ext === '.img') {
        console.log(`Excluding large binary: ${entry.name}`);
        continue;
      }
      // Exclude large PDFs
      if (ext === '.pdf') {
        console.log(`Excluding PDF: ${entry.name}`);
        continue;
      }
      // Exclude large screenshots
      if (
        ext === '.png' &&
        (entry.name.startsWith('isro_') ||
          entry.name.startsWith('doc') ||
          entry.name.startsWith('multi_site_') ||
          entry.name.startsWith('pdf_') ||
          entry.name.startsWith('full_coverage_map') ||
          entry.name.startsWith('cross_validation'))
      ) {
        console.log(`Excluding screenshot: ${entry.name}`);
        continue;
      }
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy src/
console.log('Copying src/ (excluding .img, .pdf, screenshots)...');
copyFiltered(path.join(projectRoot, 'src'), path.join(stagingDir, 'src'));

// Copy tests/
console.log('Copying tests/...');
copyFiltered(path.join(projectRoot, 'tests'), path.join(stagingDir, 'tests'));

// Copy root config and key files
const rootFiles = ['package.json', 'tsconfig.json', 'vite.config.ts', 'server.ts', 'README.md'];
for (const rf of rootFiles) {
  const p = path.join(projectRoot, rf);
  if (fs.existsSync(p)) {
    fs.copyFileSync(p, path.join(stagingDir, rf));
    console.log(`Copied root file: ${rf}`);
  }
}

// Verify the mandatory files are in staging
const requiredItems = [
  'src/lib/imageProcessor.ts',
  'src/lib/isroPds4Parser.ts',
  'src/lib/isroImageLoader.ts',
  'src/lib/isroFullPipeline.ts',
  'src/lib/grid.ts',
  'src/lib/hazardClassifier.ts',
  'src/lib/uncertainty.ts',
  'src/lib/demSlope.ts',
  'tests/determinism.test.ts',
  'tests/security.test.ts',
  'tests/isroData.test.ts',
  'tests/multiSiteValidation.test.ts',
  'tests/isroFullPipeline.test.ts',
  'package.json',
  'tsconfig.json'
];

console.log('\n--- VERIFYING MANDATORY INCLUSIONS ---');
let allPresent = true;
for (const item of requiredItems) {
  const p = path.join(stagingDir, item.replace(/\//g, path.sep));
  const exists = fs.existsSync(p);
  console.log(`[${exists ? 'YES' : 'NO'}] ${item} (${exists ? fs.statSync(p).size + ' bytes' : 'MISSING'})`);
  if (!exists) allPresent = false;
}

if (!allPresent) {
  throw new Error('Some required items are missing in staging!');
}

console.log('\n--- CREATING COMPACT ZIP ARCHIVE ---');
const zipCmd = `powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('${stagingDir.replace(/\\/g, '\\\\')}', '${zipPath.replace(/\\/g, '\\\\')}', [System.IO.Compression.CompressionLevel]::Optimal, $false)"`;
execSync(zipCmd);

// Clean up staging
fs.rmSync(stagingDir, { recursive: true, force: true });

const zipSize = fs.statSync(zipPath).size;
const zipBuf = fs.readFileSync(zipPath);
const zipHash = crypto.createHash('sha256').update(zipBuf).digest('hex').toUpperCase();

console.log('\nArchive successfully created:');
console.log(`Path: ${zipPath}`);
console.log(`Size: ${zipSize} bytes (${(zipSize / 1024).toFixed(2)} KB)`);
console.log(`SHA-256: ${zipHash}`);
