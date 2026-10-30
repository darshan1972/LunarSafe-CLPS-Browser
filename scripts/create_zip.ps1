Add-Type -AssemblyName System.IO.Compression.FileSystem
$source = "C:\Users\bagul\Desktop\LunarSafe_ISRO_Submission"
$zip = "C:\Users\bagul\Desktop\LunarSafe_ISRO_Submission.zip"
if (Test-Path $zip) {
    Remove-Item $zip -Force
}
Write-Host "Compressing $source to $zip..."
$sw = [System.Diagnostics.Stopwatch]::StartNew()
[System.IO.Compression.ZipFile]::CreateFromDirectory($source, $zip, [System.IO.Compression.CompressionLevel]::Fastest, $false)
$sw.Stop()
Write-Host "Compression completed in $($sw.ElapsedMilliseconds) ms."
$file = Get-Item $zip
Write-Host "Zip Size: $($file.Length) bytes ($([Math]::Round($file.Length / 1MB, 2)) MB)"
$hash = Get-FileHash $zip -Algorithm SHA256
Write-Host "Zip SHA-256: $($hash.Hash)"
