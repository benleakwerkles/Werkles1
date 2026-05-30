param(
  [int]$PauseSeconds = 60
)

$ErrorActionPreference = "Stop"

$icons = @("builder", "operator", "backer", "connector", "spark")
$scriptPath = Join-Path $PSScriptRoot "ghost-forge-icon-from-sally.ps1"

Write-Host "Gate 01: Tier 3 lane sigils (5 icons)"
Write-Host "Lane budget: foreman/BUDGET.md -> lane-ghost-forge-batch-asset-generation"
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
Write-Host "Gate 01 complete. Preview at http://localhost:3000/#people"
Write-Host "If icons look good, tell Cursor: ASSETS_LANDED v0.2"
