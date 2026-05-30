param(
  [int]$PauseSeconds = 90,

  [ValidateSet("all", "logos", "lanes", "nav", "steps")]
  [string]$Phase = "all"
)

$ErrorActionPreference = "Stop"

$scriptPath = Join-Path $PSScriptRoot "ghost-forge-variant-from-sally.ps1"
$logPath = Join-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) "foreman\ghost-forge\gate-05-style-variants-run.log"

$styles = @("line", "enamel", "blueprint", "etched")
$logoAssets = @("logo-w")
$laneAssets = @("builder", "operator", "backer", "connector", "spark")
$navAssets = @("proof", "knock", "dossier")
$stepAssets = @("step-fit")

$queue = @()
if ($Phase -eq "all" -or $Phase -eq "logos") {
  foreach ($style in $styles) {
    foreach ($asset in $logoAssets) {
      $queue += [pscustomobject]@{ Style = $style; Asset = $asset }
    }
  }
}
if ($Phase -eq "all" -or $Phase -eq "lanes") {
  foreach ($style in $styles) {
    foreach ($asset in $laneAssets) {
      $queue += [pscustomobject]@{ Style = $style; Asset = $asset }
    }
  }
}
if ($Phase -eq "all" -or $Phase -eq "nav") {
  foreach ($style in $styles) {
    foreach ($asset in $navAssets) {
      $queue += [pscustomobject]@{ Style = $style; Asset = $asset }
    }
  }
}
if ($Phase -eq "all" -or $Phase -eq "steps") {
  foreach ($style in $styles) {
    foreach ($asset in $stepAssets) {
      $queue += [pscustomobject]@{ Style = $style; Asset = $asset }
    }
  }
}

Write-Host "Gate 05: style variant batches ($($queue.Count) requests)"
Write-Host "Log: $logPath"
Write-Host "Pause between requests: $PauseSeconds s"
Write-Host ""

$started = Get-Date -Format "yyyy-MM-dd HH:mm:ss UTC"
Add-Content -Path $logPath -Value "`n=== Gate 05 started $started phase=$Phase count=$($queue.Count) ==="

for ($i = 0; $i -lt $queue.Count; $i++) {
  $item = $queue[$i]
  $label = "$($item.Style)/$($item.Asset)"
  Write-Host "=== [$($i + 1)/$($queue.Count)] $label ==="
  Add-Content -Path $logPath -Value "[$($i + 1)/$($queue.Count)] START $label"

  & $scriptPath -Style $item.Style -Asset $item.Asset
  $code = $LASTEXITCODE
  Add-Content -Path $logPath -Value "[$($i + 1)/$($queue.Count)] END $label exit=$code"

  if ($code -ne 0) {
    Write-Host "Gate 05 stopped on failure at $label (exit $code)"
    exit $code
  }

  if ($i -lt ($queue.Count - 1)) {
    Write-Host "Waiting $PauseSeconds seconds..."
    Start-Sleep -Seconds $PauseSeconds
  }
}

Write-Host ""
Write-Host "Gate 05 complete. Review at http://localhost:3000/#forge-preview"
Add-Content -Path $logPath -Value "=== Gate 05 complete ==="
