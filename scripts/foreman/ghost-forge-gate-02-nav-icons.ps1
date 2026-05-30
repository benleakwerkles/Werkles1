param(
  [int]$PauseSeconds = 90
)

$ErrorActionPreference = "Stop"

$icons = @("proof", "dues", "armory", "deck", "dossier", "blueprint", "knock", "register")
$scriptPath = Join-Path $PSScriptRoot "ghost-forge-icon-from-sally.ps1"

Write-Host "Gate 02: Nav + section icons (8)"
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
Write-Host "Gate 02 complete. Preview: http://localhost:3000/#forge-preview"
