param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("A01", "A02", "A03", "A04", "A05", "A06", "A07", "A08", "A09", "A10")]
  [string]$Asset,

  [string]$BaseUrl = $env:PUBLIC_BASE_URL,

  [int]$PollSeconds = 15,

  [int]$MaxWaitMinutes = 15
)

$ErrorActionPreference = "Stop"

function Import-GhostForgeEnvFile {
  param([string]$Path)

  if (-not (Test-Path $Path)) {
    return
  }

  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) {
      return
    }

    $parts = $line -split "=", 2
    if ($parts.Count -ne 2) {
      return
    }

    $name = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"').Trim("'")
    if ($name -and -not [string]::IsNullOrWhiteSpace($value)) {
      Set-Item -Path "Env:$name" -Value $value -Force
    }
  }
}

$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Import-GhostForgeEnvFile (Join-Path $repoRoot "ghost-forge-worker\.env")

$assets = @{
  A01 = @{
    file = "werkles-draft-hero-foundry-v0.2.png"
    aspect = "16:9"
    prompt = "Enchanted industrial foundry interior at night, wide cinematic 16:9, blackened steel workbenches in foreground, massive furnace glow in deep background, brushed copper pipe frames and riveted panels, subtle floating brass gauges and dial faces with no readable numbers, faint violet and teal light bleeding through ceiling rafters like aurora through smoke, one distant secret door crack glowing warm amber, premium private workshop for serious builders, moody atmospheric depth, photoreal cinematic lighting, no people, no text"
  }
  A02 = @{
    file = "werkles-draft-proof-trust-v0.2.png"
    aspect = "16:9"
    prompt = "Industrial inspection room for trust verification, wide 16:9, row of dark steel tables with brass calipers and stamp tools, green inspection lamp glow suggesting verified signal without readable labels, copper-framed cabinets, violet-teal accent light on edges, private operator cockpit not a courtroom, serious premium mood, no faces, no documents with readable text, no text"
  }
  A03 = @{
    file = "werkles-draft-membership-dues-v0.1.png"
    aspect = "16:9"
    prompt = "Brass turnstile and velvet rope leading into a hot foundry floor, wide 16:9, tourists kept outside in cold shadow while warm copper gate opens to inner workshop, democratic membership club energy without luxury hotel cliché, dark steel and copper, restrained violet-teal rim light, no people, no text"
  }
  A04 = @{
    file = "werkles-draft-pricing-armory-v0.1.png"
    aspect = "16:9"
    prompt = "Industrial armory wall of labeled tool drawers and blueprint racks without readable labels, wide 16:9, dark workshop storage for templates and kits, brushed copper drawer pulls, blackened steel cabinets, faint forge glow, organized serious business toolkit atmosphere, no text"
  }
  A05 = @{
    file = "werkles-draft-dashboard-cockpit-v0.1.png"
    aspect = "16:9"
    prompt = "Operator cockpit inside a private foundry, wide 16:9, dark control deck with brass gauges and dossier slots, match deck rail with empty card frames, blackened steel surfaces, copper bezels, subtle violet-teal indicator lights, no readable screens, no people, no text"
  }
  A06 = @{
    file = "werkles-draft-crucible-v0.1.png"
    aspect = "16:9"
    prompt = "Crucible inspection station with heavy anvil, brass claim stamp, and hammer resting on dark steel table, wide 16:9, trust workflow not for sale, green verification glow accent, copper frame, industrial precision, no readable stamps, no people, no text"
  }
  A07 = @{
    file = "werkles-draft-lanes-v0.1.png"
    aspect = "16:9"
    prompt = "Five distinct workbench stations in one foundry floor receding into depth, wide 16:9, each station subtly different trade tools suggesting builder operator backer connector spark roles, unified copper and steel palette, restrained violet-teal accents, no people, no text"
  }
  A08 = @{
    file = "werkles-draft-intros-v0.1.png"
    aspect = "16:9"
    prompt = "Two ornate brass door knockers on a heavy private workshop door, wide 16:9, warm amber sidelight, dark steel door plates, intimate business introduction energy without handshake stock photo, no faces, no text"
  }
  A09 = @{
    file = "werkles-draft-mobile-atmosphere-v0.1.png"
    aspect = "4:5"
    prompt = "Vertical enchanted foundry corridor with copper pipes and distant furnace glow, 4:5 crop, blackened steel walls, violet-teal light in rafters, secret workshop depth, cinematic mood, no people, no text"
  }
  A10 = @{
    file = "werkles-draft-panel-texture-v0.1.png"
    aspect = "16:9"
    prompt = "Seamless dark smoke metal panel texture with faint etched blueprint grid lines and copper rivets, wide 16:9, subtle repeatable surface for UI cards, low contrast, no text, no logos"
  }
}

if (-not $BaseUrl) {
  $BaseUrl = "https://werkles-ghost-forge1.onrender.com"
}

if (-not $env:GHOST_FORGE_API_KEY) {
  Write-Error "Set GHOST_FORGE_API_KEY in ghost-forge-worker/.env. Do not paste it in chat."
  exit 1
}

$spec = $assets[$Asset]
$targetFile = $spec.file
$brief = "Werkles Ghost Forge atmosphere plate $Asset. $($spec.prompt). Dark industrial optimism, enchanted foundry, not pastel SaaS, not cartoon mascot. Global negative: readable text, letters, numbers, watermark, logo, stock photo smile, handshake cliché, pastel SaaS, crypto, fantasy portal."

Write-Host "Submitting atmosphere: $Asset -> $targetFile"

$body = @{
  brief = $brief
  count = 1
  model = "ideogram-ai/ideogram-v3-quality"
  metadata = @{
    project = "werkles"
    source = "sally-api-bypass"
    asset = $Asset
    target_filename = $targetFile
    aspect_ratio = $spec.aspect
  }
} | ConvertTo-Json -Depth 5

$headers = @{
  Authorization = "Bearer $env:GHOST_FORGE_API_KEY"
  "Content-Type" = "application/json"
}

$base = $BaseUrl.TrimEnd("/").TrimEnd(".")

try {
  $create = Invoke-RestMethod -Method Post -Uri "$base/batch/create" -Headers $headers -Body $body -TimeoutSec 120
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
    $status = Invoke-RestMethod -Method Get -Uri "$base/batches/$batchId" -Headers @{ Authorization = "Bearer $env:GHOST_FORGE_API_KEY" } -TimeoutSec 60
  } catch {
    Write-Warning "Poll failed: $($_.Exception.Message)"
    continue
  }

  $batchStatus = $status.batch.status
  $output = $status.outputs | Select-Object -First 1
  Write-Host "Batch status: $batchStatus | output: $($output.status)"

  if ($batchStatus -eq "completed" -and $output.status -eq "completed") {
    $destDir = Join-Path $repoRoot "public\assets\draft\ghost-forge"
    $destPath = Join-Path $destDir $targetFile
    New-Item -ItemType Directory -Force -Path $destDir | Out-Null

    if ($output.source_url) {
      Invoke-WebRequest -Uri $output.source_url -OutFile $destPath -TimeoutSec 180
      Write-Host ""
      Write-Host "DONE. Saved:"
      Write-Host "  $destPath"
    } else {
      Write-Host ""
      Write-Host "DONE. Download source_url missing - copy manually from Supabase:"
      Write-Host "  public/assets/draft/ghost-forge/$targetFile"
    }

    $status | ConvertTo-Json -Depth 8
    exit 0
  }

  if ($batchStatus -eq "failed" -or $output.status -eq "failed") {
    Write-Error "Batch or output failed."
    $status | ConvertTo-Json -Depth 8
    exit 1
  }
}

Write-Error "Timed out after $MaxWaitMinutes minutes. Batch may still complete on Render - check GET /batches/$batchId"
exit 1
