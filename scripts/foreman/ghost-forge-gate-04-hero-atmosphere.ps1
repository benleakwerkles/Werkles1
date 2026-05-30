param(
  [int]$PauseSeconds = 120
)

$ErrorActionPreference = "Stop"

$assets = @("A01", "A02")
$scriptPath = Join-Path $PSScriptRoot "ghost-forge-atmosphere-from-sally.ps1"

Write-Host "Gate 04: Hero atmosphere upgrades (A01, A02)"
Write-Host ""

for ($i = 0; $i -lt $assets.Count; $i++) {
  $asset = $assets[$i]
  Write-Host "=== [$($i + 1)/$($assets.Count)] $asset ==="
  & $scriptPath -Asset $asset
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }

  if ($i -lt ($assets.Count - 1)) {
    Write-Host "Waiting $PauseSeconds seconds..."
    Start-Sleep -Seconds $PauseSeconds
  }
}

Write-Host ""
Write-Host "Gate 04 complete."
