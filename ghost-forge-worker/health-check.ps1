param(
  [string]$BaseUrl = $env:PUBLIC_BASE_URL
)

$ErrorActionPreference = "Stop"

if (-not $BaseUrl) {
  Write-Error "PUBLIC_BASE_URL is required. Pass -BaseUrl or set it in the environment."
  exit 1
}

$base = $BaseUrl.TrimEnd("/")
$url = "$base/health"

try {
  $response = Invoke-RestMethod -Method Get -Uri $url -TimeoutSec 30
  if ($response.ok -eq $true -and $response.service -eq "ghost-forge-worker") {
    Write-Host "PASS: Ghost Forge health check succeeded."
    $response | ConvertTo-Json -Depth 5
    exit 0
  }

  Write-Error "FAIL: Unexpected health response."
  $response | ConvertTo-Json -Depth 5
  exit 1
} catch {
  Write-Error "FAIL: Health check failed. $($_.Exception.Message)"
  exit 1
}
