Add-Type -AssemblyName System.IO.Compression.FileSystem

$paths = @(
  'C:\Users\bagul\Desktop\LunarSafe_FullTestSuite_Verification.zip',
  'C:\Users\bagul\OneDrive\Desktop\LunarSafe_FullTestSuite_Verification.zip'
)

foreach ($p in $paths) {
  Write-Host "========================================"
  Write-Host "Checking Path: $p"
  $exists = Test-Path $p
  Write-Host "Test-Path result: $exists"
  if ($exists) {
    $item = Get-Item $p
    Write-Host "Full Name: $($item.FullName)"
    Write-Host "Size (bytes): $($item.Length)"
    $hash = Get-FileHash $p -Algorithm SHA256
    Write-Host "SHA256: $($hash.Hash)"
    
    $zip = [System.IO.Compression.ZipFile]::OpenRead($p)
    Write-Host "File count inside zip: $($zip.Entries.Count)"
    foreach ($entry in $zip.Entries) {
        Write-Host "  - $($entry.FullName) ($($entry.Length) bytes)"
    }
    $zip.Dispose()
  }
}
