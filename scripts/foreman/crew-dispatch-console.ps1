#Requires -Version 5.1
<#
.SYNOPSIS
  Crew Dispatch Console v2 — packet generation, paste blocks, dashboard, Edge workspace.

.DESCRIPTION
  Stops before Send. Copies paste blocks to clipboard and opens packets only.
  Does not POST, email, deploy, push, or auto-submit to AI providers.

.EXAMPLE
  Double-click DISPATCH_GO.cmd (repo root or foreman/crew-dispatch-console/)

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\foreman\crew-dispatch-console.ps1

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\foreman\crew-dispatch-console.ps1 -Action Show
#>
param(
  [ValidateSet("Go", "Refresh", "Generate", "Prepare", "OpenWorkspace", "Show", "OpenLatest")]
  [string]$Action = "Go",

  [ValidateSet("crew-checkin", "ghost-forge-resume", "morale-preview", "app-infra-slice")]
  [string]$Mission = "crew-checkin",

  [ValidateSet("petra", "codex", "maker", "ender", "bean")]
  [string]$Role = "petra"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $ScriptDir "crew-dispatch-lib.ps1")

$RepoRoot = Get-RepoRoot -StartPath $ScriptDir
$Config = Get-DispatchConfig -RepoRoot $RepoRoot

function Open-LatestDispatchFiles {
  param([string]$RepoRoot, [object]$Config)

  $latestMd = Join-Path $RepoRoot ($Config.paths.latestDispatchMd -replace '/', '\')
  $openThis = Join-Path $RepoRoot ($Config.paths.openThisPacket -replace '/', '\')
  $latest = Get-LatestDispatchRecord -RepoRoot $RepoRoot -Config $Config

  if ($latest -and $latest.packetPath -and (Test-Path $latest.packetPath)) {
    Start-Process $latest.packetPath
    Start-Process explorer.exe -ArgumentList "/select,`"$($latest.packetPath)`""
  }
  if ($latest -and $latest.pasteBlockPath -and (Test-Path $latest.pasteBlockPath)) {
    Get-Content $latest.pasteBlockPath -Raw | Set-Clipboard
    Write-Host "CLIPBOARD: paste block loaded - Ctrl+V in AI seat" -ForegroundColor Magenta
  }
  if (Test-Path $latestMd) { Start-Process $latestMd }
  elseif (Test-Path $openThis) { Start-Process $openThis }
  else {
    Write-Host "No latest dispatch yet. Double-click DISPATCH_GO.cmd"
  }
}

switch ($Action) {
  { $_ -in @("Go", "Prepare") } {
    Invoke-DispatchPrepare -RepoRoot $RepoRoot -Config $Config -MissionId $Mission -RoleId $Role | Out-Null
  }
  "Refresh" {
    Update-DispatchDashboard -RepoRoot $RepoRoot -Config $Config | Out-Null
    $latestMd = Join-Path $RepoRoot ($Config.paths.latestDispatchMd -replace '/', '\')
    Write-Host "Dashboard refreshed."
    Write-Host "OPEN THIS: $latestMd"
    if (Test-Path $latestMd) { Write-Host "  $(Get-FileUri -Path $latestMd)" }
  }
  "Generate" {
    $result = New-DispatchPacket -RepoRoot $RepoRoot -Config $Config -MissionId $Mission -RoleId $Role
    Show-DispatchResult -RepoRoot $RepoRoot -Config $Config -Result $result -Mode "generated"
    Update-DispatchDashboard -RepoRoot $RepoRoot -Config $Config | Out-Null
  }
  "OpenLatest" {
    Open-LatestDispatchFiles -RepoRoot $RepoRoot -Config $Config
  }
  "OpenWorkspace" {
    Update-DispatchDashboard -RepoRoot $RepoRoot -Config $Config | Out-Null
    Open-EdgeWorkspace -RepoRoot $RepoRoot -Config $Config
  }
  "Show" {
    Update-DispatchDashboard -RepoRoot $RepoRoot -Config $Config | Out-Null
    Open-LatestDispatchFiles -RepoRoot $RepoRoot -Config $Config
    $dashPath = Join-Path $RepoRoot ($Config.paths.dashboardHtml -replace '/', '\')
    if (Test-Path $dashPath) { Start-Process $dashPath }
  }
}
