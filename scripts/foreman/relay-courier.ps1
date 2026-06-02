#Requires -Version 5.1
<#
.SYNOPSIS
  Relay Courier launcher — wraps scripts/foreman/relay-courier.mjs
#>
param(
  [ValidateSet("status", "verify", "deliver")]
  [string]$Action = "status",
  [string]$Cousin = "",
  [ValidateSet("network", "dispatch")]
  [string]$Kind = "network",
  [switch]$TabOnly,
  [switch]$EnsureEdge
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
  throw "Repo root not found"
}

$Root = Resolve-RepoRoot
$Mjs = Join-Path $Root "scripts\foreman\relay-courier.mjs"

$nodeArgs = @($Mjs, $Action)
if ($Cousin) {
  $nodeArgs += @("--cousin", $Cousin.ToUpper())
}
if ($Action -ne "status") {
  $nodeArgs += @("--kind", $Kind)
}
if ($TabOnly) { $nodeArgs += "--tab-only" }
if ($EnsureEdge) { $nodeArgs += "--ensure-edge" }

& node @nodeArgs
exit $LASTEXITCODE
