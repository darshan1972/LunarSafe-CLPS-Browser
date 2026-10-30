$zipPath = 'C:\Users\bagul\Desktop\LunarSafe_FullTestSuite_Verification.zip'
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$files = @(
  'src/lib/imageProcessor.ts',
  'src/lib/validation/hazardValidation.ts',
  'src/lib/isroFullPipeline.ts',
  'src/lib/isroTileWorker.ts',
  'src/lib/isroPds4Parser.ts',
  'src/lib/isroImageLoader.ts',
  'src/lib/hazardClassifier.ts',
  'src/lib/craterConsolidation.ts',
  'src/lib/uncertainty.ts',
  'src/lib/demSlope.ts',
  'src/lib/grid.ts',
  'src/lib/scanRecord.ts',
  'src/lib/sessionIntegrity.ts',
  'src/lib/encryption.ts',
  'src/lib/digitalSignature.ts',
  'tests/isroData.test.ts',
  'tests/security.test.ts',
  'tests/multiSiteValidation.test.ts',
  'tests/isroFullPipeline.test.ts',
  'package.json',
  'tsconfig.json',
  'src/assets/isro_data/full_analysis_results.json'
)

$zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
foreach ($f in $files) {
    $fullPath = (Resolve-Path $f).Path
    $entryName = $f.Replace('\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $fullPath, $entryName, [System.IO.Compression.CompressionLevel]::Optimal)
    Write-Host "Added: $entryName"
}
$zip.Dispose()

$item = Get-Item $zipPath
Write-Host "--- ZIP CREATED ---"
Write-Host "Full Path: $($item.FullName)"
Write-Host "Size Bytes: $($item.Length)"
$hash = Get-FileHash $zipPath -Algorithm SHA256
Write-Host "SHA256: $($hash.Hash)"
