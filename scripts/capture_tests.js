import { execSync } from 'child_process';
import fs from 'fs';

console.log('Running test suites for Evidence 6...');

function runAndCapture(cmd) {
  console.log(`Executing: ${cmd}...`);
  try {
    const out = execSync(cmd, { encoding: 'utf8' });
    return out;
  } catch (err) {
    return err.stdout || err.message;
  }
}

const tests = [
  'npm run test:determinism',
  'npm run test:security',
  'npm run test:isro',
  'npm run test:multiSiteValidation',
  'npm run test:isroFullPipeline'
];

let fullReport = '';
for (const t of tests) {
  fullReport += `\n============================================================\nCOMMAND: ${t}\n============================================================\n`;
  fullReport += runAndCapture(t);
}

fs.writeFileSync('scratch_tests.txt', fullReport);
console.log('Saved scratch_tests.txt successfully.');
