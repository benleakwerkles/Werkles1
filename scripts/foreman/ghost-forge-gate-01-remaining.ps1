param(
  [int]$PauseSeconds = 90
)

$ErrorActionPreference = "Stop"

$icons = @("backer", "connector", "spark")
$scriptPath = Join-Path $PSScriptRoot "ghost-forge-icon-from-sally.ps1"

Write-Host "Gate 01 remaining: backer (regen), connector, spark"
Write-Host ""

for ($i = 0; $i -lt $icons.Count; $i++) {
  $icon = $icons[$i]
  Write-Host "=== [$($i + 1)/$($icons.Count)] $icon ==="
  & $scriptPath -Icon $icon
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }

  if ($i -lt ($icons.Count - 1)) {
    Write-Host "Waiting $PauseSeconds seconds before next icon..."
    Start-Sleep -Seconds $PauseSeconds
  }
}

Write-Host ""
Write-Host "Done. Preview: http://localhost:3000/#people"
