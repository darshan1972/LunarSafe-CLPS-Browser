import { getWorkflowRecommendation, WorkflowType } from '../src/lib/workflowSelector';

console.log('============================================================');
console.log('LUNARSAFE PHASE 8: WORKFLOW SELECTOR TEST SUITE');
console.log('============================================================\n');

// ---------------------------------------------------------------------
// TEST 1: PRE_MISSION_SITE_SELECTION -> CV
// ---------------------------------------------------------------------
console.log('--- TEST 1: PRE_MISSION_SITE_SELECTION ---');
const rec1 = getWorkflowRecommendation('PRE_MISSION_SITE_SELECTION');
console.log(`Workflow: ${rec1.workflow} | Primary: ${rec1.primaryMethod} | Title: "${rec1.title}"`);
if (rec1.primaryMethod !== 'CV') {
  throw new Error(`Test 1 Failed: Expected primaryMethod 'CV', got '${rec1.primaryMethod}'`);
}
console.log('[ASSERT 1] PRE_MISSION_SITE_SELECTION primaryMethod === CV: PASS\n');

// ---------------------------------------------------------------------
// TEST 2: POST_MISSION_VERIFICATION -> BOTH
// ---------------------------------------------------------------------
console.log('--- TEST 2: POST_MISSION_VERIFICATION ---');
const rec2 = getWorkflowRecommendation('POST_MISSION_VERIFICATION');
console.log(`Workflow: ${rec2.workflow} | Primary: ${rec2.primaryMethod} | Title: "${rec2.title}"`);
if (rec2.primaryMethod !== 'BOTH') {
  throw new Error(`Test 2 Failed: Expected primaryMethod 'BOTH', got '${rec2.primaryMethod}'`);
}
console.log('[ASSERT 2] POST_MISSION_VERIFICATION primaryMethod === BOTH: PASS\n');

// ---------------------------------------------------------------------
// TEST 3: INDEPENDENT_AUDIT -> BOTH
// ---------------------------------------------------------------------
console.log('--- TEST 3: INDEPENDENT_AUDIT ---');
const rec3 = getWorkflowRecommendation('INDEPENDENT_AUDIT');
console.log(`Workflow: ${rec3.workflow} | Primary: ${rec3.primaryMethod} | Title: "${rec3.title}"`);
if (rec3.primaryMethod !== 'BOTH') {
  throw new Error(`Test 3 Failed: Expected primaryMethod 'BOTH', got '${rec3.primaryMethod}'`);
}
console.log('[ASSERT 3] INDEPENDENT_AUDIT primaryMethod === BOTH: PASS\n');

// ---------------------------------------------------------------------
// TEST 4: REAL_TIME_ONBOARD -> CV
// ---------------------------------------------------------------------
console.log('--- TEST 4: REAL_TIME_ONBOARD ---');
const rec4 = getWorkflowRecommendation('REAL_TIME_ONBOARD');
console.log(`Workflow: ${rec4.workflow} | Primary: ${rec4.primaryMethod} | Title: "${rec4.title}"`);
if (rec4.primaryMethod !== 'CV') {
  throw new Error(`Test 4 Failed: Expected primaryMethod 'CV', got '${rec4.primaryMethod}'`);
}
console.log('[ASSERT 4] REAL_TIME_ONBOARD primaryMethod === CV: PASS\n');

// ---------------------------------------------------------------------
// TEST 5: TRAINING_DATA_GENERATION -> CV
// ---------------------------------------------------------------------
console.log('--- TEST 5: TRAINING_DATA_GENERATION ---');
const rec5 = getWorkflowRecommendation('TRAINING_DATA_GENERATION');
console.log(`Workflow: ${rec5.workflow} | Primary: ${rec5.primaryMethod} | Title: "${rec5.title}"`);
if (rec5.primaryMethod !== 'CV') {
  throw new Error(`Test 5 Failed: Expected primaryMethod 'CV', got '${rec5.primaryMethod}'`);
}
console.log('[ASSERT 5] TRAINING_DATA_GENERATION primaryMethod === CV: PASS\n');

// ---------------------------------------------------------------------
// TEST 6: Validation across all 5 workflows
// ---------------------------------------------------------------------
console.log('--- TEST 6: Non-empty fields and caveats check for all workflows ---');
const allWorkflows: WorkflowType[] = [
  'PRE_MISSION_SITE_SELECTION',
  'POST_MISSION_VERIFICATION',
  'INDEPENDENT_AUDIT',
  'REAL_TIME_ONBOARD',
  'TRAINING_DATA_GENERATION',
];

for (const wf of allWorkflows) {
  const rec = getWorkflowRecommendation(wf);
  if (!rec.title || rec.title.trim().length === 0) {
    throw new Error(`Test 6 Failed: Workflow ${wf} has empty title`);
  }
  if (!rec.description || rec.description.trim().length === 0) {
    throw new Error(`Test 6 Failed: Workflow ${wf} has empty description`);
  }
  if (!rec.reasoning || rec.reasoning.trim().length === 0) {
    throw new Error(`Test 6 Failed: Workflow ${wf} has empty reasoning`);
  }
  if (!Array.isArray(rec.caveats) || rec.caveats.length < 1) {
    throw new Error(`Test 6 Failed: Workflow ${wf} must have at least 1 caveat`);
  }
  for (const c of rec.caveats) {
    if (!c || c.trim().length === 0) {
      throw new Error(`Test 6 Failed: Workflow ${wf} contains empty caveat`);
    }
  }
  console.log(`✓ [${wf}]: valid title, description, reasoning, and ${rec.caveats.length} caveats`);
}
console.log('[ASSERT 6] All workflows have valid title, description, reasoning, and >=1 caveat: PASS\n');

console.log('============================================================');
console.log('FINAL RESULT: ALL WORKFLOW SELECTOR TESTS PASSED');
console.log('============================================================');
