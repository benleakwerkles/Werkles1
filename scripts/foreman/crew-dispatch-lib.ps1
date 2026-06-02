#Requires -Version 5.1

function Get-DispatchConfig {
  param([string]$RepoRoot)
  $configPath = Join-Path $RepoRoot "foreman\crew-dispatch-console\dispatch-config.json"
  if (-not (Test-Path $configPath)) {
    throw "Missing dispatch config: $configPath"
  }
  return Get-Content $configPath -Raw | ConvertFrom-Json
}

function Get-RepoRoot {
  param([string]$StartPath = (Get-Location).Path)
  $current = (Resolve-Path $StartPath).Path
  while ($current) {
    if (Test-Path (Join-Path $current "foreman\crew-dispatch-console\dispatch-config.json")) {
      return $current
    }
    $parent = Split-Path $current -Parent
    if ($parent -eq $current) { break }
    $current = $parent
  }
  throw "Could not locate repo root from $StartPath"
}

function Read-CockpitSnippet {
  param(
    [string]$RepoRoot,
    [string]$RelativePath,
    [int]$MaxLines = 12
  )
  $full = Join-Path $RepoRoot ($RelativePath -replace '/', '\')
  if (-not (Test-Path $full)) {
    return "(missing: $RelativePath)"
  }
  $lines = Get-Content $full -TotalCount $MaxLines
  return ($lines -join [Environment]::NewLine)
}

function Get-NextActionHeadline {
  param([string]$RepoRoot)
  $path = Join-Path $RepoRoot "foreman\NEXT_ACTION.md"
  if (-not (Test-Path $path)) { return "(NEXT_ACTION.md missing)" }
  $content = Get-Content $path -Raw
  if ($content -match '(?m)^\*\*Effective gate:\*\*\s*`([^`]+)`') {
    return $Matches[1].Trim()
  }
  if ($content -match '(?m)^\[ACTIVE:[^\]]+\]') {
    return $Matches[0].Trim()
  }
  $first = (Get-Content $path -TotalCount 1 | Select-Object -First 1)
  return [string]$first
}

function Get-ActiveWriterSnippet {
  param([string]$RepoRoot)
  return Read-CockpitSnippet -RepoRoot $RepoRoot -RelativePath "foreman/ACTIVE_AGENT.md" -MaxLines 8
}

function Expand-DispatchTemplate {
  param(
    [string]$Template,
    [hashtable]$Tokens
  )
  $result = $Template
  foreach ($key in $Tokens.Keys) {
    $result = $result -replace [regex]::Escape("{{$key}}"), [string]$Tokens[$key]
  }
  return $result
}

function Get-RoleActionText {
  param(
    [string]$RoleId
  )
  switch ($RoleId) {
    "petra" {
      return @"
Reply using the VERDICT block format:
- SLICE, GATE_05, UI_COMMIT, CODEX, MAKER
- CONDITIONS + DOWNSTREAM_HANDOFFS + NEXT_HUMAN_GATE
"@
    }
    "codex" {
      return @"
Execute mission inside approved lanes only.
Log results to cockpit files. Stop at true human gates.
"@
    }
    "maker" {
      return @"
Implement only inside Lanes-approved file areas.
Run typecheck/build. Stop for Ben review - no push unless approved.
"@
    }
    "ender" {
      return @"
UX/brand review only. Return recommendations; do not claim implementation.
"@
    }
    "bean" {
      return @"
Trust/compliance audit only. Flag forbidden claims and gate risks.
"@
    }
    default {
      return "Follow the attached packet. Stop before any Send action."
    }
  }
}

function Get-RoleResponseFormat {
  param([string]$RoleId)
  switch ($RoleId) {
    "petra" {
      return @(
        "VERDICT: GO | NO-GO | GO_WITH_CONDITIONS",
        "SLICE: ...",
        "GATE_05: RESUME | PAUSE | STOP",
        "UI_COMMIT: ...",
        "CODEX: ...",
        "MAKER: ..."
      ) -join [Environment]::NewLine
    }
    "codex" {
      return "Report: changed files, checks run, blockers, exact next human gate."
    }
    "maker" {
      return "Report: files touched, typecheck/build, preview URL, screenshots if any."
    }
    default {
      return "Structured audit or review with explicit GO/NO-GO if applicable."
    }
  }
}

function Get-CockpitFileHash {
  param(
    [string]$RepoRoot,
    [string]$RelativePath
  )
  $full = Join-Path $RepoRoot ($RelativePath -replace '/', '\')
  if (-not (Test-Path $full)) { return $null }
  return (Get-FileHash $full -Algorithm SHA256).Hash.ToLower()
}

function Get-StalePacketWarnings {
  param([string]$RepoRoot)

  $staleFiles = @(
    "foreman/handoffs/outbox/TO_PETRA_COMPTROLLER_CREW_CHECKIN_v0.1.md",
    "foreman/handoffs/outbox/TO_PETRA_CREW_CHECKIN_v2_20260530-0059.md",
    "foreman/handoffs/outbox/TO_PETRA_CREW_CHECKIN_v2_20260530-0122.md",
    "foreman/handoffs/outbox/TO_PETRA_CREW_CHECKIN_v2_20260530-0124.md"
  ) | Where-Object { Test-Path (Join-Path $RepoRoot ($_ -replace '/', '\')) }

  return [ordered]@{
    effectiveGate = "[AWAITING COMPTROLLER VERDICT: APP_INFRA_SLICE_AND_CREW_ROUTING]"
    gate05 = "PAUSED / PARKED - Render 429 rate limit; 12/40 landed"
    petraPacketsBeforeSync = "STALE / DO NOT SEND"
    stalePacketFiles = @($staleFiles)
    nextDispatchAction = "Double-click crew-dispatch.bat after cockpit sync (stops before Send)"
    moraleDeployHead = "60f74c8"
  }
}

function Get-FileUri {
  param([string]$Path)
  if (-not $Path) { return $null }
  $resolved = (Resolve-Path $Path).Path
  return "file:///" + ($resolved -replace '\\', '/')
}

function Write-DispatchLatestPointer {
  param(
    [string]$RepoRoot,
    [object]$Config,
    [object]$Result,
    [string]$Status = "generated"
  )

  $latestJsonPath = Join-Path $RepoRoot ($Config.paths.latestDispatchJson -replace '/', '\')
  $latestMdPath = Join-Path $RepoRoot ($Config.paths.latestDispatchMd -replace '/', '\')
  $openThisPath = Join-Path $RepoRoot ($Config.paths.openThisPacket -replace '/', '\')
  $dashboardHtml = Join-Path $RepoRoot ($Config.paths.dashboardHtml -replace '/', '\')
  $goCmd = Join-Path $RepoRoot ($Config.paths.dispatchGoCmd -replace '/', '\')
  $now = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

  $packetUri = if ($Result.PacketPath) { Get-FileUri -Path $Result.PacketPath } else { $null }
  $pasteUri = if ($Result.PasteBlockPath) { Get-FileUri -Path $Result.PasteBlockPath } else { $null }
  $dashboardUri = if (Test-Path $dashboardHtml) { Get-FileUri -Path $dashboardHtml } else { $null }
  $goCmdUri = if (Test-Path $goCmd) { Get-FileUri -Path $goCmd } else { $null }

  $latest = [ordered]@{
    generatedAt = $now
    status = $Status
    mission = $Result.MissionId
    role = $Result.RoleId
    packetId = $Result.PacketId
    packetPath = $Result.PacketPath
    pasteBlockPath = $Result.PasteBlockPath
    packetUri = $packetUri
    pasteBlockUri = $pasteUri
    dashboardUri = $dashboardUri
    stopsBeforeSend = $true
  }

  ($latest | ConvertTo-Json -Depth 4) | Set-Content -Path $latestJsonPath -Encoding UTF8

  $md = @(
    "# OPEN THIS - Latest crew dispatch",
    "",
    "Generated: **$now**",
    "Status: **$Status**",
    "Role: **$($Result.RoleId)** | Mission: **$($Result.MissionId)**",
    "",
    "## One-click (Sally)",
    ""
  )

  if ($goCmdUri) {
    $md += "- [**DISPATCH (double-click)**]($goCmdUri) - regenerate, clipboard, open packet"
  }

  if ($packetUri) {
    $md += "- [**Open packet**]($packetUri)"
  }
  if ($pasteUri) {
    $md += "- [**Open paste block**]($pasteUri)"
  }
  if ($dashboardUri) {
    $md += "- [**Open dispatch dashboard**]($dashboardUri)"
  }

  $md += @(
    "",
    "## Full paths",
    ""
  )
  if ($Result.PacketPath) { $md += "- Packet: ``$($Result.PacketPath)``" }
  if ($Result.PasteBlockPath) { $md += "- Paste block: ``$($Result.PasteBlockPath)``" }
  $md += @(
    "",
    "**STOP BEFORE SEND** - double-click crew-dispatch.bat loads clipboard; you paste manually into the AI seat.",
    ""
  )

  ($md -join [Environment]::NewLine) | Set-Content -Path $latestMdPath -Encoding UTF8

  $openMd = @(
    "# OPEN THIS PACKET",
    "",
    "Do not hunt the outbox. Use the latest dispatch pointer:",
    "",
    "- [Latest dispatch (click here)]($((Get-FileUri -Path $latestMdPath)))",
    ""
  )
  if ($packetUri) {
    $openMd += "- [Open current packet]($packetUri)"
    $openMd += ""
    $openMd += "``$($Result.PacketPath)``"
  }
  ($openMd -join [Environment]::NewLine) | Set-Content -Path $openThisPath -Encoding UTF8

  return $latest
}

function Show-DispatchResult {
  param(
    [string]$RepoRoot,
    [object]$Config,
    [object]$Result,
    [string]$Mode = "generated"
  )

  $latest = Write-DispatchLatestPointer -RepoRoot $RepoRoot -Config $Config -Result $Result -Status $Mode
  $latestMd = Join-Path $RepoRoot ($Config.paths.latestDispatchMd -replace '/', '\')

  Write-Host ""
  Write-Host "========================================" -ForegroundColor Cyan
  Write-Host "  CREW DISPATCH - OPEN THIS" -ForegroundColor Cyan
  Write-Host "========================================" -ForegroundColor Cyan
  Write-Host ""
  if ($Result.PacketPath) {
    Write-Host "PACKET:" -ForegroundColor Green
    Write-Host "  $($Result.PacketPath)"
    Write-Host "  $($latest.packetUri)"
  }
  if ($Result.PasteBlockPath) {
    Write-Host "PASTE BLOCK:" -ForegroundColor Green
    Write-Host "  $($Result.PasteBlockPath)"
    Write-Host "  $($latest.pasteBlockUri)"
  }
  Write-Host "LATEST POINTER (bookmark this):" -ForegroundColor Yellow
  Write-Host "  $latestMd"
  Write-Host "  $(Get-FileUri -Path $latestMd)"
  Write-Host "OUTBOX SHORTCUT:" -ForegroundColor Yellow
  Write-Host "  $(Join-Path $RepoRoot ($Config.paths.openThisPacket -replace '/', '\'))"
  if ($Mode -eq "prepared_not_sent") {
    Write-Host ""
    Write-Host "CLIPBOARD: paste block loaded - Ctrl+V in AI seat" -ForegroundColor Magenta
    Write-Host "STOP BEFORE SEND - no auto-submit" -ForegroundColor Yellow
  }
  Write-Host ""

  if ($Result.PacketPath -and (Test-Path $Result.PacketPath)) {
    Start-Process $Result.PacketPath
    Start-Process explorer.exe -ArgumentList "/select,`"$($Result.PacketPath)`""
  }
  Start-Process $latestMd
}

function Get-LatestDispatchRecord {
  param(
    [string]$RepoRoot,
    [object]$Config
  )
  $path = Join-Path $RepoRoot ($Config.paths.latestDispatchJson -replace '/', '\')
  if (-not (Test-Path $path)) { return $null }
  try {
    return Get-Content $path -Raw | ConvertFrom-Json
  } catch {
    return $null
  }
}

function Update-DispatchDashboard {
  param(
    [string]$RepoRoot,
    [object]$Config,
    [hashtable]$RoleUpdates = @{}
  )

  $now = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  $headline = Get-NextActionHeadline -RepoRoot $RepoRoot
  $activeWriterRaw = Get-ActiveWriterSnippet -RepoRoot $RepoRoot
  $activeWriter = if ($activeWriterRaw.Length -gt 480) { $activeWriterRaw.Substring(0, 480) + "..." } else { $activeWriterRaw }
  $currentStateHash = Get-CockpitFileHash -RepoRoot $RepoRoot -RelativePath "foreman/CURRENT_STATE.md"
  $nextActionHash = Get-CockpitFileHash -RepoRoot $RepoRoot -RelativePath "foreman/NEXT_ACTION.md"
  $staleWarning = Get-StalePacketWarnings -RepoRoot $RepoRoot
  $latestDispatch = Get-LatestDispatchRecord -RepoRoot $RepoRoot -Config $Config

  $previousCurrentStateHash = $null
  $previousNextActionHash = $null
  $existingPath = Join-Path $RepoRoot ($Config.paths.dashboardJson -replace '/', '\')
  if (Test-Path $existingPath) {
    try {
      $existing = Get-Content $existingPath -Raw | ConvertFrom-Json
      if ($existing.cockpit.currentStateHash) { $previousCurrentStateHash = $existing.cockpit.currentStateHash }
      if ($existing.cockpit.nextActionHash) { $previousNextActionHash = $existing.cockpit.nextActionHash }
    } catch {
      Write-Verbose "Could not read prior dashboard hashes: $_"
    }
  }

  $hashMismatch = $false
  if ($previousCurrentStateHash -and $currentStateHash -ne $previousCurrentStateHash) { $hashMismatch = $true }
  if ($previousNextActionHash -and $nextActionHash -ne $previousNextActionHash) { $hashMismatch = $true }
  if ($hashMismatch) {
    $staleWarning.cockpitHashChangedSinceLastDashboard = $true
  } else {
    $staleWarning.cockpitHashChangedSinceLastDashboard = $false
  }

  $roles = @()
  foreach ($role in $Config.roles) {
    $state = @{
      id = $role.id
      label = $role.label
      title = $role.title
      platform = $role.platform
      status = "idle"
      lastPreparedAt = $null
      lastPacket = $null
      lastPasteBlock = $null
      stopBeforeSend = $true
      operatorNote = "Awaiting dispatch"
    }
    if ($RoleUpdates.ContainsKey($role.id)) {
      foreach ($key in $RoleUpdates[$role.id].Keys) {
        $state[$key] = $RoleUpdates[$role.id][$key]
      }
    }
    $roles += $state
  }

  $dashboard = [ordered]@{
    version = "2.1"
    generatedAt = $now
    dashboardGeneratedAt = $now
    stopsBeforeSend = $true
    repoRoot = $RepoRoot
    cockpit = [ordered]@{
      nextActionHeadline = $headline
      activeWriterSnippet = $activeWriter
      currentStateHash = $currentStateHash
      nextActionHash = $nextActionHash
      moralePreviewUrl = "https://werkles.com"
      localPreviewUrl = "http://localhost:3000"
      mainHead = "60f74c8"
    }
    staleWarning = $staleWarning
    latestDispatch = $latestDispatch
    edgeWorkspace = [ordered]@{
      name = $Config.edgeWorkspace.name
      tabCount = $Config.edgeWorkspace.fixedTabOrder.Count
    }
    roles = $roles
    recentDispatches = @()
  }

  if (Test-Path $existingPath) {
    try {
      $existing = Get-Content $existingPath -Raw | ConvertFrom-Json
      if ($existing.recentDispatches -and $existing.recentDispatches.Count -lt 20) {
        $merged = @($existing.recentDispatches | Select-Object -First 9)
        if ($merged.Count -gt 0 -and ($merged[0].PSObject.Properties.Name -contains 'at')) {
          $dashboard.recentDispatches = $merged
        }
      }
    } catch {
      Write-Verbose "Could not merge existing dashboard: $_"
    }
  }

  $jsonDir = Split-Path $existingPath -Parent
  if (-not (Test-Path $jsonDir)) {
    New-Item -ItemType Directory -Path $jsonDir -Force | Out-Null
  }

  ($dashboard | ConvertTo-Json -Depth 6) | Set-Content -Path $existingPath -Encoding UTF8

  $mdPath = Join-Path $RepoRoot ($Config.paths.dashboardMd -replace '/', '\')
  $md = @(
    "# Crew Dispatch Dashboard v2",
    "",
    "Generated: $now",
    "",
    "**Stops before Send:** YES - clipboard + open files only.",
    "",
    "## Cockpit hashes",
    "",
    "- **dashboardGeneratedAt:** $now",
    "- **currentStateHash:** $currentStateHash",
    "- **nextActionHash:** $nextActionHash",
    "- **main HEAD:** 60f74c8",
    "",
    "## Stale warnings",
    "",
    "- **effectiveGate:** $($staleWarning.effectiveGate)",
    "- **gate05:** $($staleWarning.gate05)",
    "- **petraPacketsBeforeSync:** $($staleWarning.petraPacketsBeforeSync)",
    "- **nextDispatchAction:** $($staleWarning.nextDispatchAction)",
    "",
    "## Cockpit",
    "",
    "- **Next action:** $headline",
    "- **Morale preview:** https://werkles.com",
    "- **Local preview:** http://localhost:3000",
    "",
    "## Crew status",
    ""
  )
  foreach ($r in $roles) {
    $md += "- **$($r.label)** ($($r.title)): ``$($r.status)`` - $($r.operatorNote)"
    if ($r.lastPacket) { $md += "  - Packet: ``$($r.lastPacket)``" }
    if ($r.lastPreparedAt) { $md += "  - Prepared: $($r.lastPreparedAt)" }
  }
  $md += ""
  $md += "## Edge workspace tab order"
  $md += ""
  foreach ($tab in $Config.edgeWorkspace.fixedTabOrder) {
    $target = if ($tab.url) { $tab.url } else { $tab.path }
    $md += "$($tab.order). **$($tab.label)** - $target"
  }
  $md -join [Environment]::NewLine | Set-Content -Path $mdPath -Encoding UTF8

  Write-DispatchDashboardHtml -RepoRoot $RepoRoot -Config $Config -Dashboard $dashboard
  return $dashboard
}

function Write-DispatchDashboardHtml {
  param(
    [string]$RepoRoot,
    [object]$Config,
    [object]$Dashboard
  )

  $roleRows = ""
  foreach ($r in $Dashboard.roles) {
    $roleRows += @"
    <tr>
      <td><strong>$($r.label)</strong><br><span class="muted">$($r.title)</span></td>
      <td><code>$($r.status)</code></td>
      <td>$($r.operatorNote)</td>
      <td class="muted">$($r.lastPreparedAt)</td>
    </tr>
"@
  }

  $latestLinks = ""
  $goCmdPath = Join-Path $RepoRoot ($Config.paths.dispatchGoCmd -replace '/', '\')
  if (Test-Path $goCmdPath) {
    $latestLinks += "<p><a href=`"$(Get-FileUri -Path $goCmdPath)`"><strong>crew-dispatch.bat (double-click)</strong></a> - regenerate + clipboard + open packet</p>"
  }
  if ($Dashboard.latestDispatch) {
    $ld = $Dashboard.latestDispatch
    if ($ld.packetUri) {
      $latestLinks += "<p><a href=`"$($ld.packetUri)`"><strong>Open latest packet</strong></a>"
      if ($ld.pasteBlockUri) { $latestLinks += " · <a href=`"$($ld.pasteBlockUri)`">Open paste block</a>" }
      $latestLinks += "</p>"
      $latestLinks += "<p class=`"muted`">$($ld.packetPath)</p>"
    }
  }
  if (-not $latestLinks) {
    $latestMdPath = Join-Path $RepoRoot ($Config.paths.latestDispatchMd -replace '/', '\')
    if (Test-Path $latestMdPath) {
      $latestLinks = "<p><a href=`"$(Get-FileUri -Path $latestMdPath)`"><strong>Open LATEST_DISPATCH.md</strong></a></p>"
    } else {
      $latestLinks = "<p class=`"muted`">No packet yet. Double-click crew-dispatch.bat at repo root.</p>"
    }
  }

  $tabRows = ""
  foreach ($tab in $Config.edgeWorkspace.fixedTabOrder) {
    $href = if ($tab.url) { $tab.url } else { "file:///" + (Join-Path $RepoRoot ($tab.path -replace '/', '\')).Replace('\', '/') }
    $tabRows += "<li><strong>$($tab.order). $($tab.label)</strong> - <a href=`"$href`">open</a></li>`n"
  }

  $html = @"
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Werkles Crew Dispatch Console v2</title>
  <style>
    :root { --paper:#f6efe5; --ink:#2c231d; --copper:#9f6633; --ok:#0d7a52; --wait:#9a6b00; }
    body { font-family: "Segoe UI", sans-serif; background: var(--paper); color: var(--ink); margin: 24px; }
    h1 { font-size: 1.5rem; margin-bottom: 0.2rem; }
    .banner { background: #fffaf2; border: 1px solid rgba(159,102,51,.35); border-radius: 10px; padding: 12px 16px; margin: 16px 0; }
    .open-box { background: #fff3d6; border: 2px solid var(--copper); border-radius: 12px; padding: 16px 18px; margin: 16px 0; }
    .open-box a { font-size: 1.1rem; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; background: #fffaf2; border-radius: 10px; overflow: hidden; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid rgba(44,35,29,.08); vertical-align: top; }
    th { background: rgba(159,102,51,.12); font-size: .78rem; text-transform: uppercase; letter-spacing: .06em; }
    .muted { color: #5c4a3a; font-size: .9rem; }
    code { background: rgba(44,35,29,.06); padding: 2px 6px; border-radius: 4px; }
    a { color: var(--copper); }
    ul { line-height: 1.6; }
  </style>
</head>
<body>
  <h1>Crew Dispatch Console v2</h1>
  <p class="muted">Generated $($Dashboard.dashboardGeneratedAt) · Stops before Send</p>
  <div class="open-box">
    <h2 style="margin-top:0">Open this - latest dispatch</h2>
    $latestLinks
  </div>
  <div class="banner"><strong>STOP BEFORE SEND</strong> - Paste blocks go to clipboard only. Ben pastes manually into each AI seat.</div>
  <h2>Cockpit hashes</h2>
  <p><code>currentStateHash</code> $($Dashboard.cockpit.currentStateHash)</p>
  <p><code>nextActionHash</code> $($Dashboard.cockpit.nextActionHash)</p>
  <p><strong>main:</strong> $($Dashboard.cockpit.mainHead)</p>
  <h2>Stale warnings</h2>
  <p><strong>Gate:</strong> $($Dashboard.staleWarning.effectiveGate)</p>
  <p><strong>Gate 05:</strong> $($Dashboard.staleWarning.gate05)</p>
  <p><strong>Petra packets:</strong> $($Dashboard.staleWarning.petraPacketsBeforeSync)</p>
  <h2>Cockpit</h2>
  <p><strong>Next action:</strong> $($Dashboard.cockpit.nextActionHeadline)</p>
  <p><a href="$($Dashboard.cockpit.moralePreviewUrl)">werkles.com morale preview</a> · <a href="$($Dashboard.cockpit.localPreviewUrl)">localhost:3000</a></p>
  <h2>Crew status</h2>
  <table>
    <thead><tr><th>Role</th><th>Status</th><th>Note</th><th>Prepared (UTC)</th></tr></thead>
    <tbody>$roleRows</tbody>
  </table>
  <h2>Edge workspace - fixed tab order</h2>
  <ol>$tabRows</ol>
  <p class="muted">Refresh: <code>scripts/foreman/crew-dispatch-console.ps1 -Action Refresh</code></p>
</body>
</html>
"@

  $htmlPath = Join-Path $RepoRoot ($Config.paths.dashboardHtml -replace '/', '\')
  $html | Set-Content -Path $htmlPath -Encoding UTF8
}

function New-DispatchPacket {
  param(
    [string]$RepoRoot,
    [object]$Config,
    [string]$MissionId,
    [string]$RoleId
  )

  if (-not $Config.missions.$MissionId) {
    throw "Unknown mission: $MissionId"
  }
  $mission = $Config.missions.$MissionId
  $role = $Config.roles | Where-Object { $_.id -eq $RoleId } | Select-Object -First 1
  if (-not $role) { throw "Unknown role: $RoleId" }

  $timestamp = Get-Date -Format "yyyyMMdd-HHmm"
  $packetId = "$($role.packetPrefix)_$($MissionId.ToUpper().Replace('-','_'))_v2_$timestamp"
  $outbox = Join-Path $RepoRoot ($Config.paths.outbox -replace '/', '\')
  if (-not (Test-Path $outbox)) { New-Item -ItemType Directory -Path $outbox -Force | Out-Null }

  $packetFile = Join-Path $outbox "$packetId.md"
  $pasteFile = Join-Path $outbox ($role.pasteBlockSuffix)

  $cockpitFiles = @($Config.cockpitSources)
  if ($mission.cockpitExtras) { $cockpitFiles += @($mission.cockpitExtras) }
  $cockpitFiles = $cockpitFiles | Select-Object -Unique

  $cockpitTable = ($cockpitFiles | ForEach-Object { "| ``$_`` | cockpit source |" }) -join [Environment]::NewLine
  $cockpitList = ($cockpitFiles | ForEach-Object { "   $_" }) -join [Environment]::NewLine
  $statusSnippet = @(
    (Get-NextActionHeadline -RepoRoot $RepoRoot),
    "",
    (Get-ActiveWriterSnippet -RepoRoot $RepoRoot)
  ) -join [Environment]::NewLine

  $generatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd HH:mm UTC")
  $tokens = @{
    ROLE_LABEL = $role.label
    ROLE_TITLE = $role.title
    ROLE_UPPER = $role.label.ToUpper()
    ROLE_ID = $role.id
    ROLE_PLATFORM = $role.platform
    MISSION_ID = $MissionId
    MISSION_LABEL = $mission.label
    MISSION_DESCRIPTION = $mission.description
    DISPATCH_STATUS = "READY FOR OPERATOR PREPARE"
    GENERATED_AT = $generatedAt
    PACKET_ID = $packetId
    PACKET_ABSPATH = $packetFile
    COCKPIT_TABLE = $cockpitTable
    COCKPIT_LIST = $cockpitList
    STATUS_SNIPPET = $statusSnippet
    ACTIVE_WRITER_SNIPPET = (Get-ActiveWriterSnippet -RepoRoot $RepoRoot)
    NEXT_ACTION_HEADLINE = (Get-NextActionHeadline -RepoRoot $RepoRoot)
    ROLE_ACTION = (Get-RoleActionText -RoleId $role.id)
    ROLE_RESPONSE_FORMAT = (Get-RoleResponseFormat -RoleId $role.id)
  }

  $packetTemplate = Get-Content (Join-Path $RepoRoot "foreman\crew-dispatch-console\templates\packet.template.md") -Raw
  $pasteTemplate = Get-Content (Join-Path $RepoRoot "foreman\crew-dispatch-console\templates\paste-block.template.txt") -Raw

  Expand-DispatchTemplate -Template $packetTemplate -Tokens $tokens | Set-Content -Path $packetFile -Encoding UTF8
  Expand-DispatchTemplate -Template $pasteTemplate -Tokens $tokens | Set-Content -Path $pasteFile -Encoding UTF8

  $result = [pscustomobject]@{
    PacketId = $packetId
    PacketPath = $packetFile
    PasteBlockPath = $pasteFile
    RoleId = $RoleId
    MissionId = $MissionId
  }

  Write-DispatchLatestPointer -RepoRoot $RepoRoot -Config $Config -Result $result -Status "generated" | Out-Null
  return $result
}

function Invoke-DispatchPrepare {
  param(
    [string]$RepoRoot,
    [object]$Config,
    [string]$MissionId,
    [string]$RoleId,
    [switch]$SkipGenerate
  )

  if (-not $SkipGenerate) {
    $generated = New-DispatchPacket -RepoRoot $RepoRoot -Config $Config -MissionId $MissionId -RoleId $RoleId
  } else {
    $role = $Config.roles | Where-Object { $_.id -eq $RoleId } | Select-Object -First 1
    $outboxDir = Join-Path $RepoRoot ($Config.paths.outbox -replace '/', '\')
    $pasteFile = Join-Path $outboxDir $role.pasteBlockSuffix
    $generated = [pscustomobject]@{
      PacketPath = $null
      PasteBlockPath = $pasteFile
      RoleId = $RoleId
      MissionId = $MissionId
    }
  }

  if (-not (Test-Path $generated.PasteBlockPath)) {
    throw "Paste block missing: $($generated.PasteBlockPath)"
  }

  Get-Content $generated.PasteBlockPath -Raw | Set-Clipboard

  if ($generated.PacketPath -and (Test-Path $generated.PacketPath)) {
    Start-Process $generated.PacketPath
  }

  $preparedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  $roleUpdate = @{
    $RoleId = @{
      status = "prepared_not_sent"
      lastPreparedAt = $preparedAt
      lastPacket = if ($generated.PacketPath) { Split-Path $generated.PacketPath -Leaf } else { $null }
      lastPasteBlock = Split-Path $generated.PasteBlockPath -Leaf
      operatorNote = "Clipboard loaded - paste manually. Send blocked."
    }
  }

  $dashboard = Update-DispatchDashboard -RepoRoot $RepoRoot -Config $Config -RoleUpdates $roleUpdate

  $recent = @{
    at = $preparedAt
    mission = $MissionId
    role = $RoleId
    packet = $generated.PacketPath
    status = "prepared_not_sent"
  }
  $dashPath = Join-Path $RepoRoot ($Config.paths.dashboardJson -replace '/', '\')
  $dash = Get-Content $dashPath -Raw | ConvertFrom-Json
  $dash.recentDispatches = @($recent) + @($dash.recentDispatches | Select-Object -First 9)
  ($dash | ConvertTo-Json -Depth 6) | Set-Content -Path $dashPath -Encoding UTF8

  Show-DispatchResult -RepoRoot $RepoRoot -Config $Config -Result $generated -Mode "prepared_not_sent"
  return $generated
}

function Open-EdgeWorkspace {
  param(
    [string]$RepoRoot,
    [object]$Config
  )

  $urls = @()
  foreach ($tab in ($Config.edgeWorkspace.fixedTabOrder | Sort-Object { [int]$_.order })) {
    if ($tab.url) {
      $urls += $tab.url
    } elseif ($tab.path) {
      $local = Join-Path $RepoRoot ($tab.path -replace '/', '\')
      if (Test-Path $local) {
        $urls += ("file:///" + $local.Replace('\', '/'))
      }
    }
  }

  if ($urls.Count -eq 0) { throw "No workspace URLs resolved." }

  $edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
  if (-not (Test-Path $edge)) {
    $edge = "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
  }
  if (-not (Test-Path $edge)) {
    throw "Microsoft Edge not found."
  }

  Start-Process $edge -ArgumentList ($urls -join ' ')
  Write-Host "Opened Edge with $($urls.Count) tabs in fixed order."
  Write-Host "Save as Edge Workspace: Werkles Crew Dispatch"
}
