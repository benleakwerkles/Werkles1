param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("line", "enamel", "blueprint", "etched")]
  [string]$Style,

  [Parameter(Mandatory = $true)]
  [ValidateSet("logo-w", "builder", "operator", "backer", "connector", "spark", "proof", "knock", "dossier", "step-fit")]
  [string]$Asset,

  [string]$BaseUrl = $env:PUBLIC_BASE_URL,

  [int]$PollSeconds = 15,

  [int]$MaxWaitMinutes = 12
)

$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "ghost-forge-lib.ps1")

$repoRoot = Get-GhostForgeRepoRoot
Import-GhostForgeEnvFile

$styleSuffix = @{
  line      = "line"
  enamel    = "enamel"
  blueprint = "blueprint"
  etched    = "etched"
}

$stylePromptPrefix = @{
  line      = "Minimal single-stroke copper line art icon, 2px stroke weight, no fill, transparent background"
  enamel    = "Hard enamel pin badge style, glossy copper rim, restrained violet and teal accents, transparent background"
  blueprint = "Technical blueprint wireframe icon, cyan lines on transparent dark, engineering drawing style"
  etched    = "Dark steel plate with copper etching inlay, subtle depth, transparent outer background"
}

$assetPrompts = @{
  "logo-w"   = "Stylized letter W mark only, violet to teal gradient on the W shape, no other letters, centered app icon"
  builder    = "Single builder hammer icon centered"
  operator   = "Single operator gear with calendar plate icon centered"
  backer     = "Single capital runway rail or backing weight on anvil corner, no fuel can, no dollar sign"
  connector  = "Single network node with copper connecting wires"
  spark      = "Single fuse flame tip in brass holder"
  proof      = "Single inspection stamp and shield"
  knock      = "Single door knocker on plate"
  dossier    = "Single closed dossier folder with clasp"
  "step-fit" = "Single brass calipers measuring fit"
}

$assetFiles = @{
  "logo-w"   = "werkles-draft-logo-w-style-{0}-v0.1.png"
  builder    = "icon-lane-builder-style-{0}-v0.1.png"
  operator   = "icon-lane-operator-style-{0}-v0.1.png"
  backer     = "icon-lane-backer-style-{0}-v0.1.png"
  connector  = "icon-lane-connector-style-{0}-v0.1.png"
  spark      = "icon-lane-spark-style-{0}-v0.1.png"
  proof      = "icon-proof-style-{0}-v0.1.png"
  knock      = "icon-knock-style-{0}-v0.1.png"
  dossier    = "icon-dossier-style-{0}-v0.1.png"
  "step-fit" = "icon-step-fit-style-{0}-v0.1.png"
}

if (-not $BaseUrl) {
  $BaseUrl = Get-GhostForgeBaseUrl
} else {
  $BaseUrl = Get-GhostForgeBaseUrl -BaseUrl $BaseUrl
}

if (-not $env:GHOST_FORGE_API_KEY) {
  Write-Error "Set GHOST_FORGE_API_KEY in ghost-forge-worker/.env. Do not paste it in chat."
  exit 1
}

$suffix = $styleSuffix[$Style]
$targetFile = $assetFiles[$Asset] -f $suffix
$destDir = if ($Asset -eq "logo-w") {
  Join-Path $repoRoot "public\assets\draft\ghost-forge"
} else {
  Join-Path $repoRoot "public\assets\draft\icons"
}

$promptCore = $assetPrompts[$Asset]
$styleLead = $stylePromptPrefix[$Style]
$brief = "Werkles Ghost Forge style variant ($Style). $styleLead. Subject: $promptCore. 64x64 app icon scale, no readable text, no watermark, not pastel SaaS, not cartoon mascot."

Write-Host "Submitting style variant: $Style / $Asset -> $targetFile"

$body = @{
  brief = $brief
  count = 1
  model = "ideogram-ai/ideogram-v3-quality"
  metadata = @{
    project = "werkles"
    source = "sally-api-bypass"
    style = $Style
    asset = $Asset
    target_filename = $targetFile
    gate = "05-style-variants"
  }
} | ConvertTo-Json -Depth 5

$base = $BaseUrl
$headers = @{
  Authorization  = "Bearer $env:GHOST_FORGE_API_KEY"
  "Content-Type" = "application/json"
}

try {
  $createResponse = Invoke-GhostForgeApi -Method POST -Path "/batch/create" -Headers $headers -Body $body -TimeoutSec 180
  if (-not $createResponse.Ok) {
    Write-Error "batch/create failed: $($createResponse.StatusCode) $($createResponse.Body)"
    exit 1
  }
  $create = $createResponse.Json
} catch {
  Write-Error "batch/create failed: $($_.Exception.Message)"
  exit 1
}

if (-not $create.ok) {
  Write-Error "batch/create returned ok=false"
  $create | ConvertTo-Json -Depth 8
  exit 1
}

$batchId = $create.batch_id
Write-Host "Batch queued: $batchId (est `$$($create.estimated_cost_usd))"

$deadline = (Get-Date).AddMinutes($MaxWaitMinutes)
while ((Get-Date) -lt $deadline) {
  Start-Sleep -Seconds $PollSeconds
  try {
    $poll = Invoke-GhostForgeApi -Method GET -Path "/batches/$batchId" -Headers @{ Authorization = "Bearer $env:GHOST_FORGE_API_KEY" } -TimeoutSec 60
    if (-not $poll.Ok) {
      Write-Warning "Poll failed: $($poll.StatusCode)"
      continue
    }
    $status = $poll.Json
  } catch {
    Write-Warning "Poll failed: $($_.Exception.Message)"
    continue
  }

  $batchStatus = $status.batch.status
  $output = $status.outputs | Select-Object -First 1
  Write-Host "Batch status: $batchStatus | output: $($output.status)"

  if ($batchStatus -eq "completed" -and $output.status -eq "completed") {
    New-Item -ItemType Directory -Force -Path $destDir | Out-Null
    $destPath = Join-Path $destDir $targetFile

    if ($output.source_url) {
      Save-GhostForgeDownload -Uri $output.source_url -OutFile $destPath -TimeoutSec 120
      Write-Host ""
      Write-Host "DONE. Saved:"
      Write-Host "  $destPath"
    } else {
      Write-Host ""
      Write-Host "DONE. source_url missing - copy manually to:"
      Write-Host "  $destPath"
    }

    exit 0
  }

  if ($batchStatus -eq "failed" -or $output.status -eq "failed") {
    Write-Error "Batch or output failed."
    $status | ConvertTo-Json -Depth 8
    exit 1
  }
}

Write-Error "Timed out after $MaxWaitMinutes minutes. Batch may still complete - check GET /batches/$batchId"
exit 1
