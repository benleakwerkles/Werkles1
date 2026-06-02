#Requires -Version 5.1
<#
.SYNOPSIS
  Finance Command Module v0.1 — local spend tracker wrapper

.EXAMPLE
  .\scripts\foreman\finance-command.ps1 -Action summarize

.EXAMPLE
  .\scripts\foreman\finance-command.ps1 -Action dashboard
#>
param(
  [ValidateSet("summarize", "validate", "dashboard", "add-sample")]
  [string]$Action = "summarize"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$NodeScript = Join-Path $ScriptDir "finance-command.mjs"

$map = @{
  summarize   = "summarize"
  validate    = "validate"
  dashboard   = "dashboard-json"
  "add-sample" = "add-sample"
}

$nodeAction = $map[$Action]
& node $NodeScript $nodeAction
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
