import { dispatchAgentQuestion } from '../src/lib/agentDispatcher';

async function runTests() {
  console.log('=== RUNNING AGENT OM STATE REASONER TESTS ===\n');

  let passed = 0;
  let failed = 0;

  // Question A: Last Scan
  const qA = 'What was the result of the last scan?';
  const resA = dispatchAgentQuestion(qA);
  console.log(`Question A: "${qA}"`);
  console.log(`Response A: "${resA}"`);
  const passA =
    resA.includes('No scan has been run yet') ||
    (resA.includes('hazards') && resA.includes('safe zones') && resA.includes('slope'));
  if (passA) {
    console.log('✔ Question A PASSED\n');
    passed++;
  } else {
    console.error('❌ Question A FAILED\n');
    failed++;
  }

  // Question B: Components Online
  const qB = 'Which components are currently online?';
  const resB = dispatchAgentQuestion(qB);
  console.log(`Question B: "${qB}"`);
  console.log(`Response B: "${resB}"`);
  const passB =
    resB.includes('Deterministic CV Engine is ONLINE') &&
    resB.includes('Uncertainty Filter is') &&
    resB.includes('Gemini Vision is') &&
    resB.includes('Agent OM is ONLINE');
  if (passB) {
    console.log('✔ Question B PASSED\n');
    passed++;
  } else {
    console.error('❌ Question B FAILED\n');
    failed++;
  }

  // Question C: Out of scope
  const qC = 'What is the capital of France?';
  const resC = dispatchAgentQuestion(qC);
  console.log(`Question C: "${qC}"`);
  console.log(`Response C: "${resC}"`);
  const passC = resC.includes(
    'I am Agent OM, specialized exclusively in lunar landing safety analysis and mission system status. I cannot assist with questions outside lunar terrain analysis and flight telemetry.'
  );
  if (passC) {
    console.log('✔ Question C PASSED\n');
    passed++;
  } else {
    console.error('❌ Question C FAILED\n');
    failed++;
  }

  console.log(`Summary: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
