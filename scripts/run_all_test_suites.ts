import { execSync } from 'child_process';

const testSuites = [
  { name: 'Determinism (3x Passes)', cmd: 'npm run test:determinism' },
  { name: 'GSD Scaling & Grid Math', cmd: 'npm run test:gsd' },
  { name: 'DEM Slope (Horn vs Analytical)', cmd: 'npm run test:dem' },
  { name: 'Ground Truth Benchmarks', cmd: 'npm run test:groundtruth' },
  { name: 'Slope Uncertainty Propagation', cmd: 'npm run test:uncertainty' },
  { name: 'Conservative Hazard Classifier', cmd: 'npm run test:hazardconservative' },
  { name: 'Marginal Site & Sensitivity', cmd: 'npm run test:marginal' },
  { name: 'Agent OM State Reasoner', cmd: 'npm run test:agentom' },
  { name: 'CV vs YOLO Comparison Engine', cmd: 'npm run test:comparison' },
  { name: 'Mission Workflow Selector', cmd: 'npm run test:workflow' },
  { name: 'Cryptographic Security & Signatures', cmd: 'npm run test:security' },
  { name: 'Multi-Site Validation (4 Sites)', cmd: 'npm run test:multiSiteValidation' },
  { name: 'Hazard Validation Report', cmd: 'npm run test:hazardValidation' },
  { name: 'ISRO Data Ingestion & PDS4', cmd: 'npm run test:isro' },
  { name: 'Full ISRO 392 MB Swath Pipeline', cmd: 'npm run test:isroFullPipeline' },
];

console.log('============================================================');
console.log('        RUNNING ALL LUNARSAFE MISSION TEST SUITES           ');
console.log('============================================================\n');

const results: Array<{ name: string; cmd: string; pass: boolean; timeMs: number }> = [];

for (const suite of testSuites) {
  process.stdout.write(`Executing ${suite.name} ... `);
  const t0 = Date.now();
  try {
    execSync(suite.cmd, { stdio: 'pipe', encoding: 'utf8' });
    const elapsed = Date.now() - t0;
    console.log(`PASS (${elapsed} ms)`);
    results.push({ name: suite.name, cmd: suite.cmd, pass: true, timeMs: elapsed });
  } catch (err: any) {
    const elapsed = Date.now() - t0;
    console.log(`FAIL (${elapsed} ms)`);
    console.error(err.stdout || err.message);
    results.push({ name: suite.name, cmd: suite.cmd, pass: false, timeMs: elapsed });
  }
}

console.log('\n============================================================');
console.log('                   FULL TEST SUITE SUMMARY                  ');
console.log('============================================================');
console.log('| Suite Name | Status | Execution Time |');
console.log('|---|---|---|');
for (const r of results) {
  console.log(`| ${r.name} | ${r.pass ? 'PASS' : 'FAIL'} | ${r.timeMs} ms |`);
}
const allPassed = results.every(r => r.pass);
console.log('============================================================');
console.log(`OVERALL RESULT: ${allPassed ? 'ALL TEST SUITES PASSED (0 FAILURES)' : 'FAILURES DETECTED'}`);
console.log('============================================================');

if (!allPassed) process.exit(1);
