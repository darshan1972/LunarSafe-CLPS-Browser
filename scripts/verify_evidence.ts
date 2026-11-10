import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface ExpectedEvidence {
  file: string;
  sha256: string;
}

const EXPECTED_EVIDENCE: ExpectedEvidence[] = [
  {
    file: 'telemetry_scan.json',
    sha256: 'aa652579e74a8c4d1e241c85b4e43acc40038b32ef0267a5b559e22ad21b9979',
  },
  {
    file: 'telemetry_scan.csv',
    sha256: '7217a9a0fd1ec85f3f9408d2dfda40e5d69ca8c457d65cf978e7fd02c20a5cb0',
  },
  {
    file: 'mission_report.pdf',
    sha256: '757ed54fdf0ea24a1df07896109ce6d5800e52aebf5f96f95eeaf8d61b9d1ab4',
  },
  {
    file: 'rank_matrix_tolerance10.csv',
    sha256: '6a74e842d0c53dde27093112739cd004ddb0e39ade868276e59a82f580910b69',
  },
];

const EXPECTED_STAGE_HASHES: Record<string, string> = {
  inputImageHash: 'fcb622e0c414539dad7b3ffac8b8b99b7da81ba59407a338b4532cf61ce7fb23',
  slopeMapHash: 'f28a0edce38c66060b2714c43bef3216fbbd0244139e7550a4b6aa3c5d707b7a',
  gridClassificationHash: 'bfd4a138861e05125a8e8399a887069ab140a79fb0793755b8b6823d223c56ab',
  candidateZonesHash: '8e3f02a2159b86b09cbae59fc2b1871154f5c0536e872f1d6cf0b6f22f65a58d',
};

const EXPECTED_ENGINE_METRICS = {
  canonicalBytes: 42045,
  canonicalSha256: 'c50568bd719eb755d702a5debdba0785e95b9f6422504be5295cfea07543570b',
};

function computeSha256(buf: Buffer): string {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

async function verifyEvidence(): Promise<void> {
  console.log('================================================================');
  console.log('        LUNARSAFE 2.0 INDEPENDENT EVIDENCE VERIFICATION         ');
  console.log('================================================================\n');

  let allPassed = true;
  const rootDir = process.cwd();
  const evidenceDir = path.join(rootDir, 'evidence');

  // --- CHECK 1: Engine Code Integrity ---
  console.log('--- 1. CORE ENGINE CODE INTEGRITY (src/lib/imageProcessor.ts) ---');
  const enginePath = path.join(rootDir, 'src', 'lib', 'imageProcessor.ts');
  if (!fs.existsSync(enginePath)) {
    console.error(`[FAIL] Engine file not found: ${enginePath}`);
    allPassed = false;
  } else {
    const rawContent = fs.readFileSync(enginePath, 'utf8');
    const canonicalLf = rawContent.replace(/\r\n/g, '\n');
    const canonicalBytes = Buffer.byteLength(canonicalLf, 'utf8');
    const canonicalSha256 = crypto.createHash('sha256').update(canonicalLf, 'utf8').digest('hex');

    const bytesMatch = canonicalBytes === EXPECTED_ENGINE_METRICS.canonicalBytes;
    const shaMatch = canonicalSha256 === EXPECTED_ENGINE_METRICS.canonicalSha256;

    console.log(`Canonical LF Bytes:  ${canonicalBytes} (Expected: ${EXPECTED_ENGINE_METRICS.canonicalBytes}) -> ${bytesMatch ? 'PASS' : 'FAIL'}`);
    console.log(`Canonical SHA-256:   ${canonicalSha256} -> ${shaMatch ? 'PASS' : 'FAIL'}`);

    if (!bytesMatch || !shaMatch) {
      allPassed = false;
    }
  }

  // --- CHECK 2: Evidence File Checksums ---
  console.log('\n--- 2. EVIDENCE REPOSITORY CHECKSUMS (evidence/SHA256SUMS.txt) ---');
  const sumsPath = path.join(evidenceDir, 'SHA256SUMS.txt');
  if (!fs.existsSync(sumsPath)) {
    console.error(`[FAIL] SHA256SUMS.txt not found at ${sumsPath}`);
    allPassed = false;
  } else {
    console.log(`Found: ${sumsPath}`);
  }

  for (const item of EXPECTED_EVIDENCE) {
    const filePath = path.join(evidenceDir, item.file);
    if (!fs.existsSync(filePath)) {
      console.error(`[FAIL] Missing evidence file: ${filePath}`);
      allPassed = false;
      continue;
    }

    const fileBuf = fs.readFileSync(filePath);
    const actualHash = computeSha256(fileBuf);
    const isMatch = actualHash === item.sha256;

    console.log(`[${isMatch ? 'PASS' : 'FAIL'}] ${item.file}`);
    console.log(`       Actual:   ${actualHash}`);
    console.log(`       Expected: ${item.sha256}`);

    if (!isMatch) {
      allPassed = false;
    }
  }

  // --- CHECK 3: Cryptographic Stage Hashes inside telemetry_scan.json ---
  console.log('\n--- 3. CRYPTOGRAPHIC STAGE HASHES (evidence/telemetry_scan.json) ---');
  const jsonPath = path.join(evidenceDir, 'telemetry_scan.json');
  if (fs.existsSync(jsonPath)) {
    try {
      const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      const evidence = jsonContent.evidence || jsonContent;

      for (const [key, expectedHash] of Object.entries(EXPECTED_STAGE_HASHES)) {
        const actualHash = evidence[key];
        const isMatch = actualHash === expectedHash;
        console.log(`[${isMatch ? 'PASS' : 'FAIL'}] ${key}`);
        console.log(`       Actual:   ${actualHash}`);
        console.log(`       Expected: ${expectedHash}`);
        if (!isMatch) {
          allPassed = false;
        }
      }
    } catch (err: any) {
      console.error(`[FAIL] Failed to parse telemetry_scan.json: ${err.message}`);
      allPassed = false;
    }
  }

  console.log('\n================================================================');
  if (allPassed) {
    console.log('  VERIFICATION RESULT: ALL CHECKS PASSED (100% REPRODUCIBLE)   ');
    console.log('================================================================\n');
    process.exit(0);
  } else {
    console.error('  VERIFICATION RESULT: ONE OR MORE CHECKS FAILED               ');
    console.log('================================================================\n');
    process.exit(1);
  }
}

verifyEvidence().catch((err) => {
  console.error('[ERROR] Verification script exception:', err);
  process.exit(1);
});
