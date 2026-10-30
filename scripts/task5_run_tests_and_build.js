import { execSync } from 'child_process';
import fs from 'fs';

console.log('============================================================');
console.log('      RUNNING TEST SUITES & PRODUCTION BUILD FOR TASK 5     ');
console.log('============================================================\n');

function runCommand(name, cmd) {
  console.log(`>>> RUNNING: ${name} (${cmd})`);
  const start = Date.now();
  let output = '';
  let exitCode = 0;
  try {
    output = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (err) {
    exitCode = err.status || 1;
    output = (err.stdout ? err.stdout.toString() : '') + (err.stderr ? err.stderr.toString() : '');
  }
  const duration = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`>>> FINISHED: ${name} (Exit code: ${exitCode}, Duration: ${duration}s)\n`);
  return { name, cmd, exitCode, output, duration };
}

const results = {};

results.determinism = runCommand('Test Determinism', 'npm run test:determinism');
results.security = runCommand('Test Security', 'npm run test:security');
results.isro = runCommand('Test ISRO', 'npm run test:isro');
results.multiSite = runCommand('Test Multi-Site', 'npm run test:multiSiteValidation');
results.fullPipeline = runCommand('Test ISRO Full Pipeline', 'npm run test:isroFullPipeline');
results.build = runCommand('Production Build', 'npm run build');

fs.writeFileSync('task5_test_outputs.json', JSON.stringify(results, null, 2));
console.log('Saved all test and build outputs to task5_test_outputs.json');
