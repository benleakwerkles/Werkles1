param(
  [string]$SqlFile = "$PSScriptRoot\supabase-ghost-forge.sql"
)

$ErrorActionPreference = "Stop"

if (-not $env:SUPABASE_DB_URL) {
  Write-Error "SUPABASE_DB_URL is not set. Use the dashboard path or set it privately in this shell."
  exit 1
}

if (-not (Test-Path -LiteralPath $SqlFile)) {
  Write-Error "SQL file not found: $SqlFile"
  exit 1
}

$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
  Write-Error "psql not installed. Use dashboard path or install PostgreSQL tools."
  exit 1
}

Write-Host "Ghost Forge SQL apply helper"
Write-Host "SQL file: $SqlFile"
Write-Host "Connection string: [REDACTED]"
Write-Host "Running psql with ON_ERROR_STOP=1..."

$previousPgDatabase = $env:PGDATABASE
try {
  # Keep the connection string out of the command line and logs.
  $env:PGDATABASE = $env:SUPABASE_DB_URL
  & $psql.Source --set ON_ERROR_STOP=1 --file "$SqlFile"
  if ($LASTEXITCODE -ne 0) {
    throw "psql exited with code $LASTEXITCODE"
  }
  Write-Host "Ghost Forge SQL applied. Verify tables, bucket privacy, and RLS in Supabase Dashboard."
} finally {
  if ($null -eq $previousPgDatabase) {
    Remove-Item Env:\PGDATABASE -ErrorAction SilentlyContinue
  } else {
    $env:PGDATABASE = $previousPgDatabase
  }
}
