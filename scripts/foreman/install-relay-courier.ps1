#Requires -Version 5.1
<#
.SYNOPSIS
  Install Playwright + Chromium for Relay Courier (local repo only).
#>
param(
  [switch]$SkipBrowser
)

$ErrorActionPreference = "Stop"

function Resolve-RepoRoot {
  $dir = $PSScriptRoot
  while ($dir) {
    if (Test-Path (Join-Path $dir "foreman\crew-dispatch\relay-courier.config.json")) {
      return $dir
    }
    $parent = Split-Path $dir -Parent
    if ($parent -eq $dir) { break }
    $dir = $parent
  }
  throw "Werkles repo root not found"
}

$Root = Resolve-RepoRoot
$Mjs = Join-Path $Root "scripts\foreman\install-relay-courier.mjs"

$nodeArgs = @($Mjs)
if ($SkipBrowser) { $nodeArgs += "--skip-browser" }

Push-Location $Root
try {
  & node @nodeArgs
  exit $LASTEXITCODE
} finally {
  Pop-Location
}
