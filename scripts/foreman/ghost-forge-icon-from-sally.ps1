param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("builder", "operator", "backer", "connector", "spark", "proof", "dues", "deck", "knock")]
  [string]$Icon,

  [string]$BaseUrl = $env:PUBLIC_BASE_URL,

  [int]$PollSeconds = 15,

  [int]$MaxWaitMinutes = 12
)

$ErrorActionPreference = "Stop"

$iconPrompts = @{
  builder   = "Single brass hammer with tiny spark, icon centered, transparent background, copper and steel, no text, 64x64 app icon"
  operator  = "Single brass gear overlapping calendar plate, icon centered, transparent background, no text, 64x64 app icon"
  backer    = "Single fuel canister or runway tank in brass, no dollar sign, transparent background, no text, 64x64 app icon"
  connector = "Single network node with connecting wires in copper, transparent background, no text, 64x64 app icon"
  spark     = "Single unlit fuse catching flame tip in brass holder, transparent background, no text, 64x64 app icon"
  proof     = "Brass inspection stamp and shield, transparent background, no text, 64x64 app icon"
  dues      = "Brass membership token or turnstile coin, transparent background, no text, 64x64 app icon"
  deck      = "Stack of brass dossier cards, transparent background, no text, 64x64 app icon"
  knock     = "Brass door knocker, transparent background, no text, 64x64 app icon"
}

$iconFiles = @{
  builder   = "icon-lane-builder-v0.1.png"
  operator  = "icon-lane-operator-v0.1.png"
  backer    = "icon-lane-backer-v0.1.png"
  connector = "icon-lane-connector-v0.1.png"
  spark     = "icon-lane-spark-v0.1.png"
  proof     = "icon-proof-v0.1.png"
  dues      = "icon-dues-v0.1.png"
  deck      = "icon-deck-v0.1.png"
  knock     = "icon-knock-v0.1.png"
}

if (-not $BaseUrl) {
  $BaseUrl = "https://werkles-ghost-forge1.onrender.com"
}

if (-not $env:GHOST_FORGE_API_KEY) {
  Write-Error "Set GHOST_FORGE_API_KEY in this PowerShell session. Do not paste it in chat."
  exit 1
}

$base = $BaseUrl.TrimEnd("/").TrimEnd(".")
$targetFile = $iconFiles[$Icon]
$brief = "Werkles Ghost Forge micro icon. $($iconPrompts[$Icon]). Dark industrial optimism, enchanted foundry, not pastel SaaS, not cartoon mascot."

Write-Host "Submitting one icon: $Icon -> $targetFile"

$body = @{
  brief = $brief
  count = 1
  model = "ideogram-ai/ideogram-v3-quality"
  metadata = @{
    project = "werkles"
    source = "sally-api-bypass"
    icon = $Icon
    target_filename = $targetFile
  }
} | ConvertTo-Json -Depth 5

$headers = @{
  Authorization = "Bearer $env:GHOST_FORGE_API_KEY"
  "Content-Type" = "application/json"
}

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
    Write-Host ""
    Write-Host "DONE. Save to repo as:"
    Write-Host "  public/assets/draft/icons/$targetFile"
    Write-Host "Supabase storage_path:"
    Write-Host "  $($output.storage_path)"
    Write-Host ""
    Write-Host "Then tell Cursor: ASSETS_LANDED v0.2"
    $status | ConvertTo-Json -Depth 8
    exit 0
  }

  if ($batchStatus -eq "failed" -or $output.status -eq "failed") {
    Write-Error "Batch or output failed."
    $status | ConvertTo-Json -Depth 8
    exit 1
  }
}

Write-Error "Timed out after $MaxWaitMinutes minutes. Batch may still complete on Render — check GET /batches/$batchId"
exit 1
