param(
  [int]$PauseSeconds = 90
)

$ErrorActionPreference = "Stop"

$icons = @("step-dossier", "step-fit", "step-knock")
$scriptPath = Join-Path $PSScriptRoot "ghost-forge-icon-from-sally.ps1"

Write-Host "Gate 03: How-it-works step icons (3)"
Write-Host ""

for ($i = 0; $i -lt $icons.Count; $i++) {
  $icon = $icons[$i]
  Write-Host "=== [$($i + 1)/$($icons.Count)] $icon ==="
  & $scriptPath -Icon $icon
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }

  if ($i -lt ($icons.Count - 1)) {
    Write-Host "Waiting $PauseSeconds seconds..."
    Start-Sleep -Seconds $PauseSeconds
  }
}

Write-Host ""
Write-Host "Gate 03 complete."
