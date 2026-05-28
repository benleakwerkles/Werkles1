param(
  [string]$BaseUrl = $env:PUBLIC_BASE_URL
)

$ErrorActionPreference = "Stop"

Write-Warning "Do not run until SQL applied, Render deployed, env vars set, and health check passes."
Write-Warning "This script submits exactly one prompt."

if (-not $BaseUrl) {
  Write-Error "PUBLIC_BASE_URL is required. Pass -BaseUrl or set it in the environment."
  exit 1
}

if (-not $env:GHOST_FORGE_API_KEY) {
  Write-Error "GHOST_FORGE_API_KEY is required in the environment. Do not paste it into chat."
  exit 1
}

$base = $BaseUrl.TrimEnd("/")
$url = "$base/batch/create"

$body = @{
  brief = "Create one premium Werkles homepage hero background. Brutalist midnight fortress, mythic capitalism, dark industrial optimism, blackened steel, brushed copper, bronze sparks, subtle gears and ladders, warm foundry glow, dream job energy, serious not childish, not pastel SaaS, not video game portal. Aspect ratio 16:9."
  count = 1
  model = "ideogram-ai/ideogram-v3-quality"
  metadata = @{
    project = "werkles"
    source = "operator"
    test = "one-prompt"
  }
} | ConvertTo-Json -Depth 5

$headers = @{
  Authorization = "Bearer $env:GHOST_FORGE_API_KEY"
  "Content-Type" = "application/json"
}

try {
  $response = Invoke-RestMethod -Method Post -Uri $url -Headers $headers -Body $body -TimeoutSec 120
  Write-Host "Ghost Forge one-prompt request submitted."
  $response | ConvertTo-Json -Depth 10
} catch {
  Write-Error "One-prompt test failed. $($_.Exception.Message)"
  exit 1
}
