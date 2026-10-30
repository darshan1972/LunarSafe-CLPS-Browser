Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('C:\Users\bagul\Desktop\LunarSafe_FullTestSuite_Verification.zip')
Write-Host "Total entries: $($zip.Entries.Count)"
foreach ($e in $zip.Entries) {
    Write-Host "$($e.FullName) | $($e.Length) bytes"
}
$zip.Dispose()
