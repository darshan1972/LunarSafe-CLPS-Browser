#!/usr/bin/env bash
set -e

echo "=== LUNARSAFE REPRODUCIBILITY VERIFICATION ==="
FAILED=0

run_step() {
  NAME=$1
  CMD=$2
  echo "--> Running: $NAME ($CMD)"
  if eval "$CMD"; then
    echo "✔ PASS: $NAME"
  else
    echo "❌ FAIL: $NAME"
    FAILED=$((FAILED + 1))
  fi
  echo ""
}

run_step "Step 1: Install Dependencies" "npm install"
run_step "Step 2: Determinism Bit-Identity Test" "npm run test:determinism"
run_step "Step 3: GSD Grid Verification" "npm run test:gsd"
run_step "Step 4: DEM Slope Gradient Test" "npm run test:dem"
run_step "Step 5: Ground Truth NASA Benchmark" "npm run test:groundtruth"
run_step "Step 6: Uncertainty Propagation Test" "npm run test:uncertainty"
run_step "Step 7: Conservative Hazard Classifier" "npm run test:hazardconservative"
run_step "Step 8: Marginal Site Sensitivity Test" "npm run test:marginal"
run_step "Step 9: Agent OM State Reasoner Test" "npm run test:agentom"
run_step "Step 10: Production Full Build" "npm run build"

if [ $FAILED -eq 0 ]; then
  echo "=== ALL 10 VERIFICATION STEPS PASSED SUCCESSFULLY ==="
  exit 0
else
  echo "=== $FAILED VERIFICATION STEP(S) FAILED ==="
  exit 1
fi
