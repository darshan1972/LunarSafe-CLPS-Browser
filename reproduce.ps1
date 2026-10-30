Write-Host "=== LUNARSAFE REPRODUCIBILITY VERIFICATION ===" -ForegroundColor Cyan
$failed = 0

function Run-Step {
    param (
        [string]$Name,
        [scriptblock]$Cmd
    )
    Write-Host "`n--> Running: $Name" -ForegroundColor Yellow
    try {
        & $Cmd
        if ($LASTEXITCODE -eq 0 -or $null -eq $LASTEXITCODE) {
            Write-Host "✔ PASS: $Name" -ForegroundColor Green
        } else {
            Write-Host "❌ FAIL: $Name (Exit Code: $LASTEXITCODE)" -ForegroundColor Red
            $script:failed++
        }
    } catch {
        Write-Host "❌ FAIL: $Name - $_" -ForegroundColor Red
        $script:failed++
    }
}

Run-Step "Step 1: Install Dependencies" { npm install }
Run-Step "Step 2: Determinism Bit-Identity Test" { npm run test:determinism }
Run-Step "Step 3: GSD Grid Verification" { npm run test:gsd }
Run-Step "Step 4: DEM Slope Gradient Test" { npm run test:dem }
Run-Step "Step 5: Ground Truth NASA Benchmark" { npm run test:groundtruth }
Run-Step "Step 6: Uncertainty Propagation Test" { npm run test:uncertainty }
Run-Step "Step 7: Conservative Hazard Classifier" { npm run test:hazardconservative }
Run-Step "Step 8: Marginal Site Sensitivity Test" { npm run test:marginal }
Run-Step "Step 9: Agent OM State Reasoner Test" { npm run test:agentom }
Run-Step "Step 10: Production Full Build" { npm run build }

Write-Host "`n----------------------------------------"
if ($failed -eq 0) {
    Write-Host "=== ALL 10 VERIFICATION STEPS PASSED SUCCESSFULLY ===" -ForegroundColor Green
    exit 0
} else {
    Write-Host "=== $failed VERIFICATION STEP(S) FAILED ===" -ForegroundColor Red
    exit 1
}
