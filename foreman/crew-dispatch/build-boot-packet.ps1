#Requires -Version 5.1
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("PETRA", "SKYBRO", "ENDER", "BEAN", "COMPUTER")]
  [string]$Cousin
)

$ErrorActionPreference = "Stop"
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not (Test-Path (Join-Path $Root "foreman\NEXT_ACTION.md"))) {
  $dir = $PSScriptRoot
  while ($dir) {
    if (Test-Path (Join-Path $dir "foreman\NEXT_ACTION.md")) { $Root = $dir; break }
    $parent = Split-Path $dir -Parent
    if ($parent -eq $dir) { break }
    $dir = $parent
  }
}

$Mjs = Join-Path $Root "foreman\crew-dispatch\build-boot-packet.mjs"
& node $Mjs --cousin $Cousin
exit $LASTEXITCODE
