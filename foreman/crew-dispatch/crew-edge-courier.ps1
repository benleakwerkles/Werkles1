#Requires -Version 5.1
<#
.SYNOPSIS
  AEYE Edge courier - focus dispatch bay tab, paste clipboard, STOP BEFORE SEND.

.DESCRIPTION
  Automates mechanical relay steps only. Never clicks Send, Submit, or Post.
  Targets Edge profile: foreman/.edge-aeye-crew-profile

.PARAMETER WalkNetworkSync
  Deliver paste to all five cousins in order; pauses between tabs for manual Send.
#>
param(
  [string]$RepoRoot = "",
  [ValidateSet("PETRA", "SKYBRO", "ENDER", "BEAN", "COMPUTER")]
  [string]$CousinId = "",
  [string]$PasteFile = "",
  [int]$TabIndex = 0,
  [switch]$EnsureEdge,
  [switch]$TabOnly,
  [switch]$WalkNetworkSync
)

$ErrorActionPreference = "Stop"

function Resolve-RepoRoot {
  param([string]$Start)
  if ($Start -and (Test-Path (Join-Path $Start "foreman\crew-dispatch\crew-tabs.config.json"))) {
    return (Resolve-Path $Start).Path
  }
  $dir = $PSScriptRoot
  while ($dir) {
    if (Test-Path (Join-Path $dir "foreman\crew-dispatch\crew-tabs.config.json")) {
      return $dir
    }
    $parent = Split-Path $dir -Parent
    if ($parent -eq $dir) { break }
    $dir = $parent
  }
  throw "Could not find repo root (crew-tabs.config.json)"
}

function Get-CrewTabsConfig {
  param([string]$Root)
  $path = Join-Path $Root "foreman\crew-dispatch\crew-tabs.config.json"
  Get-Content $path -Raw -Encoding UTF8 | ConvertFrom-Json
}

function Get-NetworkManifest {
  param([string]$Root)
  $path = Join-Path $Root "foreman\crew-dispatch\LATEST_NETWORK_COMMAND.json"
  if (-not (Test-Path $path)) { return $null }
  Get-Content $path -Raw -Encoding UTF8 | ConvertFrom-Json
}

function Find-EdgeExecutable {
  $candidates = @(
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
  )
  foreach ($c in $candidates) {
    if (Test-Path $c) { return $c }
  }
  throw "Microsoft Edge not found"
}

function Get-AeyeEdgeProcesses {
  $profileMarker = "edge-aeye-crew-profile"
  $job = Start-Job -ScriptBlock {
    param($marker)
    Get-CimInstance Win32_Process -Filter "Name = 'msedge.exe'" |
      Where-Object { $_.CommandLine -like "*$marker*" } |
      Sort-Object CreationDate -Descending
  } -ArgumentList $profileMarker
  $done = Wait-Job $job -Timeout 8
  if (-not $done) {
    Stop-Job $job -Force -ErrorAction SilentlyContinue
    Remove-Job $job -Force -ErrorAction SilentlyContinue
    return @()
  }
  $result = Receive-Job $job
  Remove-Job $job -Force -ErrorAction SilentlyContinue
  return @($result)
}

function Test-AeyeEdgeRunning {
  return [bool](Get-AeyeEdgeProcesses | Select-Object -First 1)
}

function Get-AeyeEdgeWindowProcess {
  param([int]$TimeoutSec = 25)
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    foreach ($cim in (Get-AeyeEdgeProcesses)) {
      $p = Get-Process -Id $cim.ProcessId -ErrorAction SilentlyContinue
      if ($p -and $p.MainWindowHandle -and [int64]$p.MainWindowHandle -ne 0) {
        return $p
      }
    }
    foreach ($p in (Get-Process -Name "msedge" -ErrorAction SilentlyContinue)) {
      if (-not $p.MainWindowHandle -or [int64]$p.MainWindowHandle -eq 0) { continue }
      try {
        $cim = Get-CimInstance Win32_Process -Filter "ProcessId=$($p.Id)" -ErrorAction SilentlyContinue
        if ($cim -and $cim.CommandLine -like "*edge-aeye-crew-profile*") {
          return $p
        }
      } catch { }
    }
    Start-Sleep -Milliseconds 350
  }
  return $null
}

function Open-AeyeCrewBay {
  param([string]$Root)
  $edge = Find-EdgeExecutable
  $config = Get-CrewTabsConfig -Root $Root
  $profile = Join-Path $Root "foreman\.edge-aeye-crew-profile"
  $urls = @($config.tabs | Sort-Object tabIndex | ForEach-Object { $_.url })
  if ($urls.Count -eq 0) { throw "No crew tab URLs in config" }
  $args = @("--new-window", "--user-data-dir=$profile") + $urls
  Start-Process -FilePath $edge -ArgumentList $args | Out-Null
  Start-Sleep -Seconds 6
}

function Wait-EdgeMainWindow {
  param([int]$TimeoutSec = 25)
  $proc = Get-AeyeEdgeWindowProcess -TimeoutSec $TimeoutSec
  if (-not $proc) {
    throw "Edge dispatch bay window not ready - open Aeye Crew Bay and retry"
  }
  return $proc
}

Add-Type @"
using System;
using System.Runtime.InteropServices;
public class CourierWin32 {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
}
"@

function Focus-EdgeWindow {
  param([System.Diagnostics.Process]$Process)
  if ([CourierWin32]::IsIconic($Process.MainWindowHandle)) {
    [CourierWin32]::ShowWindow($Process.MainWindowHandle, 9) | Out-Null
  }
  Start-Sleep -Milliseconds 150
  [void][CourierWin32]::SetForegroundWindow($Process.MainWindowHandle)
  Start-Sleep -Milliseconds 200
}

Add-Type -AssemblyName System.Windows.Forms

function Select-EdgeTab {
  param([int]$Index)
  if ($Index -lt 1 -or $Index -gt 9) {
    throw "Tab index must be 1-9 for Ctrl+N shortcut (got $Index)"
  }
  $key = "^$Index"
  [System.Windows.Forms.SendKeys]::SendWait($key)
  Start-Sleep -Milliseconds 500
}

function Invoke-ChatPaste {
  # Ctrl+V only - never Enter (Send gate stays with Ben)
  [System.Windows.Forms.SendKeys]::SendWait("^v")
  Start-Sleep -Milliseconds 100
}

function Set-PasteClipboard {
  param([string]$Text)
  Set-Clipboard -Value $Text
}

function Resolve-CousinTab {
  param([string]$Root, [string]$Id)
  $config = Get-CrewTabsConfig -Root $Root
  $tab = $config.tabs | Where-Object { $_.id -eq $Id } | Select-Object -First 1
  if (-not $tab) { throw "Unknown cousin tab id: $Id" }
  return $tab
}

function Resolve-NetworkPaste {
  param([string]$Root, [string]$Id)
  $manifest = Get-NetworkManifest -Root $Root
  if (-not $manifest) { throw "No LATEST_NETWORK_COMMAND.json - issue network sync first" }
  $cousin = $manifest.cousins | Where-Object { $_.cousinId -eq $Id } | Select-Object -First 1
  if (-not $cousin) { throw "Cousin $Id not in network manifest" }
  $pasteRel = $cousin.pastePath -replace "/", "\"
  $pastePath = Join-Path $Root $pasteRel
  if (-not (Test-Path $pastePath)) { throw "Paste block missing: $pastePath" }
  return @{
    PastePath = $pastePath
    TabIndex = [int]$cousin.edgeTabIndex
    Name = $cousin.name
  }
}

function Test-CousinTabMapping {
  param(
    [string]$Root,
    [string]$Id,
    [int]$TabIdx = 0
  )
  $tab = Resolve-CousinTab -Root $Root -Id $Id
  $errors = @()
  $idx = if ($TabIdx -gt 0) { $TabIdx } else { [int]$tab.tabIndex }
  if ($TabIdx -gt 0 -and $TabIdx -ne [int]$tab.tabIndex) {
    $errors += "Requested tab $TabIdx != config tab $($tab.tabIndex) for $Id"
  }
  if ($idx -gt 9) {
    $errors += "Tab index $idx exceeds Ctrl+N range (1-9) for $Id"
  }
  $manifest = Get-NetworkManifest -Root $Root
  if ($manifest) {
    $mc = $manifest.cousins | Where-Object { $_.cousinId -eq $Id } | Select-Object -First 1
    if ($mc -and [int]$mc.edgeTabIndex -ne [int]$tab.tabIndex) {
      $errors += "Manifest tab $($mc.edgeTabIndex) != config tab $($tab.tabIndex) for $Id"
    }
  }
  if ($errors.Count) {
    throw ($errors -join "; ")
  }
  return @{
    ok = $true
    cousinId = $Id
    tabIndex = $idx
    name = $tab.name
    url = $tab.url
  }
}

function Invoke-CourierDeliver {
  param(
    [string]$Root,
    [string]$Id,
    [string]$PastePath,
    [int]$TabIdx,
    [switch]$SkipPaste
  )

  $mapping = Test-CousinTabMapping -Root $Root -Id $Id -TabIdx $TabIdx
  $tab = Resolve-CousinTab -Root $Root -Id $Id
  $idx = $mapping.tabIndex

  $proc = Get-AeyeEdgeProcesses | Select-Object -First 1
  if (-not $proc) {
    if ($EnsureEdge) {
      Open-AeyeCrewBay -Root $Root
      $proc = Get-AeyeEdgeProcesses | Select-Object -First 1
    }
  }
  if (-not $proc) {
    throw "Aeye Crew Edge not running. Click Open Aeye Crew Bay first, or pass -EnsureEdge"
  }

  $pasteText = $null
  if (-not $SkipPaste) {
    if (-not $PastePath -or -not (Test-Path $PastePath)) {
      throw "Paste file missing: $PastePath"
    }
    $pasteText = Get-Content -Path $PastePath -Raw -Encoding UTF8
    if ([string]::IsNullOrWhiteSpace($pasteText)) { throw "Paste file empty: $PastePath" }
    Set-PasteClipboard -Text $pasteText
  }

  $edgeProc = Get-AeyeEdgeWindowProcess -TimeoutSec 12
  if (-not $edgeProc) {
    return @{
      ok = $true
      partial = $true
      cousinId = $Id
      tabIndex = $idx
      tabName = $tab.name
      pasteFile = $PastePath
      humanGate = "STOP BEFORE SEND - Edge focus failed; paste block is on clipboard - switch tab manually and Ctrl+V"
    }
  }

  Focus-EdgeWindow -Process $edgeProc
  Select-EdgeTab -Index $idx
  # Blur omnibox / stray focus before paste
  [System.Windows.Forms.SendKeys]::SendWait("{ESC}")
  Start-Sleep -Milliseconds 120

  if (-not $SkipPaste) {
    Invoke-ChatPaste
  }

  return @{
    ok = $true
    cousinId = $Id
    tabIndex = $idx
    tabName = $tab.name
    pasteFile = $PastePath
    humanGate = "STOP BEFORE SEND - review and Send manually"
  }
}

$RepoRoot = Resolve-RepoRoot -Start $RepoRoot

if ($WalkNetworkSync) {
  $manifest = Get-NetworkManifest -Root $RepoRoot
  if (-not $manifest) { throw "Issue network sync before walk" }
  if ($EnsureEdge -and -not (Test-AeyeEdgeRunning)) {
    Open-AeyeCrewBay -Root $RepoRoot
  }
  $results = @()
  foreach ($c in $manifest.cousins) {
    $pasteRel = $c.pastePath -replace "/", "\"
    $pastePath = Join-Path $RepoRoot $pasteRel
    Write-Host ""
    Write-Host "=== Courier: tab $($c.edgeTabIndex) $($c.name) ($($c.cousinId)) ===" -ForegroundColor Cyan
    $r = Invoke-CourierDeliver -Root $RepoRoot -Id $c.cousinId -PastePath $pastePath -TabIdx $c.edgeTabIndex
    $results += $r
    Write-Host "Pasted. STOP BEFORE SEND - review tab $($c.edgeTabIndex) and Send manually." -ForegroundColor Yellow
    $answer = Read-Host "Enter = next cousin, S = skip rest, Q = quit walk"
    if ($answer -match '^[Qq]') { break }
    if ($answer -match '^[Ss]') { break }
  }
  Write-Host ""
  Write-Host "Courier walk ended. Save FROM_* replies to inbox, then Validate on Foreman dashboard." -ForegroundColor Green
  exit 0
}

if (-not $CousinId) {
  Write-Host @"
Usage:
  .\crew-edge-courier.ps1 -CousinId PETRA -PasteFile path\to\paste.txt [-EnsureEdge]
  .\crew-edge-courier.ps1 -CousinId PETRA -TabOnly
  .\crew-edge-courier.ps1 -WalkNetworkSync [-EnsureEdge]
"@
  exit 1
}

if (-not $PasteFile -and -not $TabOnly) {
  $resolved = Resolve-NetworkPaste -Root $RepoRoot -Id $CousinId
  $PasteFile = $resolved.PastePath
  if ($TabIndex -le 0) { $TabIndex = $resolved.TabIndex }
}

if ($EnsureEdge -and -not (Test-AeyeEdgeRunning)) {
  Open-AeyeCrewBay -Root $RepoRoot
}

$result = Invoke-CourierDeliver -Root $RepoRoot -Id $CousinId -PastePath $PasteFile -TabIdx $TabIndex -SkipPaste:$TabOnly
$result | ConvertTo-Json -Compress
exit 0
