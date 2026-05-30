# Read-only Ghost Forge budget diagnostic. Does not mutate Supabase or Render.
# Does not print secrets.

param(
  [string]$BaseUrl = $env:PUBLIC_BASE_URL
)

$ErrorActionPreference = "Continue"

. (Join-Path $PSScriptRoot "ghost-forge-lib.ps1")

Import-GhostForgeEnvFile

if ($BaseUrl) {
  $env:PUBLIC_BASE_URL = $BaseUrl
}

$workerDateUtc = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd")
$spendResult = "not checked"
$batchPreflightStatus = $null
$liveBudgetExposed = $null
$base = Get-GhostForgeBaseUrl

function Write-Section {
  param([string]$Title)
  Write-Host ""
  Write-Host "=== $Title ==="
}

Write-Section "Ghost Forge budget diagnostic (read-only)"
Write-Host "Worker UTC date: $workerDateUtc"
Write-Host "Render service: werkles-ghost-forge1"
Write-Host "Base URL: $base"

Write-Section "Step 1 - Supabase spend row (optional local read)"

$supabaseReady = (Test-GhostForgeEnvValuePresent $env:SUPABASE_URL) -and (Test-GhostForgeEnvValuePresent $env:SUPABASE_SERVICE_ROLE_KEY) -and ($env:SUPABASE_SERVICE_ROLE_KEY.Length -ge 20)

if (-not $supabaseReady) {
  Write-Host "STATUS: SKIP - local SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set."
  Write-Host "Batch scripts only need GHOST_FORGE_API_KEY in ghost-forge-worker\.env"
  $spendResult = "skipped (optional local read)"
} else {
  $restBase = $env:SUPABASE_URL.TrimEnd("/")
  $query = ('date=eq.{0}&select=date,estimated_amount_usd,actual_amount_usd' -f $workerDateUtc)
  $headers = @{
    apikey        = $env:SUPABASE_SERVICE_ROLE_KEY
    Authorization = "Bearer $($env:SUPABASE_SERVICE_ROLE_KEY)"
    Accept        = "application/json"
  }

  try {
    $rows = Invoke-RestMethod -Method Get -Uri "$restBase/rest/v1/ghost_forge_spend?$query" -Headers $headers -TimeoutSec 30
  } catch {
    Write-Host "STATUS: ERROR - Supabase read failed."
    Write-Host "Message: $($_.Exception.Message)"
    $spendResult = "ERROR - Supabase read failed"
    $rows = $null
  }

  if ($null -ne $rows) {
    if ($rows.Count -eq 0 -or -not $rows) {
      Write-Host "STATUS: no row for today ($workerDateUtc)"
      $spendResult = "no row for today ($workerDateUtc)"
    } else {
      $row = @($rows)[0]
      $estimated = [decimal]$row.estimated_amount_usd
      $actual = [decimal]$row.actual_amount_usd
      $afterNext = $estimated + 0.20

      Write-Host "STATUS: row found"
      Write-Host "  worker_date_utc:       $($row.date)"
      Write-Host "  estimated_amount_usd:  $estimated"
      Write-Host "  actual_amount_usd:     $actual"
      Write-Host "  after_next_icon (+0.20): $afterNext"
      Write-Host "  would_402_if_budget_1: $($afterNext -gt 1.00)"
      Write-Host "  would_402_if_budget_5: $($afterNext -gt 5.00)"
      Write-Host "  would_402_if_budget_10: $($afterNext -gt 10.00)"

      $spendResult = "worker_date_utc=$($row.date); estimated=$estimated; actual=$actual"
    }
  }
}

Write-Section "Step 2 - Live worker probe (read-only, hard timeout)"

if (-not (Test-GhostForgeEnvValuePresent $env:GHOST_FORGE_API_KEY) -or $env:GHOST_FORGE_API_KEY.Length -lt 8) {
  Write-Host "STATUS: GHOST_FORGE_API_KEY missing in ghost-forge-worker\.env"
  $batchPreflightStatus = "BLOCKED - missing API key"
} else {
  $authHeaders = @{
    Authorization  = "Bearer $env:GHOST_FORGE_API_KEY"
    "Content-Type" = "application/json"
  }

  try {
    $health = Invoke-GhostForgeApi -Method GET -Path "/health" -TimeoutSec 30
    Write-Host "GET /health: $($health.StatusCode)"
    if ($health.Json) {
      Write-Host "  ok=$($health.Json.ok)"
      if ($health.Json.PSObject.Properties.Name -contains "daily_budget_usd") {
        Write-Host "  daily_budget_usd: $($health.Json.daily_budget_usd)"
        Write-Host "  default_cost_per_image_usd: $($health.Json.default_cost_per_image_usd)"
        $liveBudgetExposed = $true
      } else {
        Write-Host "  daily_budget_usd: not exposed on this deploy"
        $liveBudgetExposed = $false
      }
    }
  } catch {
    Write-Host "GET /health failed: $($_.Exception.Message)"
    $liveBudgetExposed = $false
  }

  try {
    $budgetDiag = Invoke-GhostForgeApi -Method GET -Path "/diagnostics/budget" -Headers $authHeaders -TimeoutSec 30
    Write-Host "GET /diagnostics/budget: $($budgetDiag.StatusCode)"
    if ($budgetDiag.Json) {
      Write-Host "  daily_budget_usd: $($budgetDiag.Json.daily_budget_usd)"
      Write-Host "  spend_today.estimated: $($budgetDiag.Json.spend_today.estimated_amount_usd)"
      Write-Host "  room_before_402_usd: $($budgetDiag.Json.room_before_402_usd)"
    }
  } catch {
    Write-Host "GET /diagnostics/budget failed: $($_.Exception.Message)"
  }

  $preflightBody = '{"brief":"budget-diagnostic-preflight","count":1,"model":"ideogram-ai/ideogram-v3-quality"}'
  try {
    $preflight = Invoke-GhostForgeApi -Method POST -Path "/batch/preflight" -Headers $authHeaders -Body $preflightBody -TimeoutSec 30
    $batchPreflightStatus = $preflight.StatusCode
    Write-Host "POST /batch/preflight: $($preflight.StatusCode)"
    if ($preflight.Body) {
      Write-Host "  body: $($preflight.Body)"
    }
  } catch {
    Write-Host "POST /batch/preflight failed: $($_.Exception.Message)"
    $batchPreflightStatus = "ERROR"
  }

  if ($batchPreflightStatus -eq 404) {
    Write-Host "POST /batch/preflight not deployed yet; falling back to GET /diagnostics/budget only."
    $batchPreflightStatus = "404 (use diagnostics/budget or redeploy worker)"
  }
}

Write-Section "Summary"
Write-Host "1. Supabase spend: $spendResult"
Write-Host "2. Live budget exposed on /health: $liveBudgetExposed"
Write-Host "3. Batch preflight: $batchPreflightStatus"
Write-Host "4. Secrets printed: NO"
Write-Host "5. SQL data mutated: NO"

exit 0
