$zipPath = 'C:\Users\bagul\Desktop\LunarSafe_FullTestSuite_Verification_v2.zip'
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

# Collect all essential source modules, types, tests, and deliverables
$filesToZip = @()

Get-ChildItem -Path 'src/lib' -Recurse -File | ForEach-Object { $filesToZip += $_.FullName }
Get-ChildItem -Path 'src/types' -Recurse -File | ForEach-Object { $filesToZip += $_.FullName }
Get-ChildItem -Path 'tests' -Recurse -File | ForEach-Object { $filesToZip += $_.FullName }

$namedFiles = @(
  'package.json',
  'tsconfig.json',
  'README.md',
  'LunarSafe_full_isro_analysis_report.pdf',
  'src/assets/isro_data/full_analysis_results.json',
  'scripts/exact_consolidation_metrics.json',
  'scripts/diagnose_col800_row45000.ts'
)

foreach ($nf in $namedFiles) {
  if (Test-Path $nf) {
    $filesToZip += (Resolve-Path $nf).Path
  }
}

$projectRoot = (Get-Location).Path
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)

$addedPaths = @{}
foreach ($fullPath in $filesToZip) {
    $relPath = $fullPath.Substring($projectRoot.Length).TrimStart('\', '/')
    $entryName = $relPath.Replace('\', '/')
    if (-not $addedPaths.ContainsKey($entryName)) {
        $addedPaths[$entryName] = $true
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $fullPath, $entryName, [System.IO.Compression.CompressionLevel]::Optimal)
        Write-Host "Added: $entryName"
    }
}
$zip.Dispose()

$item = Get-Item $zipPath
Write-Host "`n--- VERIFICATION V2 ZIP CREATED ---"
Write-Host "Full Path: $($item.FullName)"
Write-Host "Size Bytes: $($item.Length)"
$hash = Get-FileHash $zipPath -Algorithm SHA256
Write-Host "SHA256: $($hash.Hash)"
