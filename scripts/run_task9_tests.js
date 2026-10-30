import { execSync } from 'child_process';
import fs from 'fs';

console.log('Running 4 test suites for Task 9...');

const suites = [
  { name: 'npm run test:isro', cmd: 'npm run test:isro' },
  { name: 'npm run test:security', cmd: 'npm run test:security' },
  { name: 'npm run test:multiSiteValidation', cmd: 'npm run test:multiSiteValidation' },
  { name: 'npm run test:isroFullPipeline', cmd: 'npm run test:isroFullPipeline' },
];

const outputs = {};

for (const s of suites) {
  console.log(`Executing: ${s.cmd}...`);
  try {
    const out = execSync(s.cmd, { encoding: 'utf8' });
    outputs[s.name] = out;
  } catch (err) {
    outputs[s.name] = (err.stdout ? err.stdout.toString() : '') + (err.stderr ? err.stderr.toString() : '');
  }
}

fs.writeFileSync('task9_test_raw.json', JSON.stringify(outputs, null, 2));
console.log('Saved raw outputs to task9_test_raw.json');
