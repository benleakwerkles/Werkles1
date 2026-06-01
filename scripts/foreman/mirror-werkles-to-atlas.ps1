<#
.SYNOPSIS
  Mirror active Werkles repo artifacts into the Atlas vault (archive box).

.DESCRIPTION
  Copy-only backup of the working repo into Atlas. Part of the Atlas archive role
  (see foreman/ATLAS_MACHINE_PLAN.md and foreman/MACHINE_TOPOLOGY.md).

  Guarantees:
    - DRY-RUN by default. Pass -Execute to actually copy.
    - Copy-only: never deletes source files; never purges the vault (no /MIR, no /PURGE).
    - Excludes node_modules, .next, .git, .vercel, .env*, *.local_token, and common secret patterns.
    - Appends a backup-log entry to the vault.
    - Never pushes, deploys, or applies SQL. This script does no git/network/db actions.

.PARAMETER AtlasVault
  Destination root on the Atlas box, e.g. "D:\AtlasVault" or "\\ATLAS\vault".
  The mirror is written under "<AtlasVault>\werkles\repo-mirror".

.PARAMETER RepoRoot
  Source repo root. Defaults to the repo this script lives in.

.PARAMETER Execute
  Perform the copy. Without this switch the script runs in dry-run (list only).

.EXAMPLE
  # Dry-run (default) — shows what would copy, copies nothing:
  .\scripts\foreman\mirror-werkles-to-atlas.ps1 -AtlasVault "D:\AtlasVault"

.EXAMPLE
  # Real copy:
  .\scripts\foreman\mirror-werkles-to-atlas.ps1 -AtlasVault "D:\AtlasVault" -Execute
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$AtlasVault,

  [string]$RepoRoot = (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent),

  [switch]$Execute
)

$ErrorActionPreference = "Stop"

# --- Safety: this script never pushes/deploys/applies SQL/handles secrets. ---

if (-not (Test-Path $RepoRoot)) {
  Write-Error "RepoRoot not found: $RepoRoot"
  exit 1
}

$vaultRoot   = Join-Path $AtlasVault "werkles"
$mirrorDest  = Join-Path $vaultRoot "repo-mirror"
$logPath     = Join-Path $vaultRoot "backup-log.txt"
$mode        = if ($Execute) { "EXECUTE" } else { "DRY-RUN" }
$startStamp  = Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"

# Directories never copied
$excludeDirs = @("node_modules", ".next", ".git", ".vercel", ".turbo", "dist", "build", "out")

# File patterns never copied (secrets / env / tokens / keys)
$excludeFiles = @(
  ".env", ".env.*", "*.local_token", "*.key", "*.pem",
  "id_rsa*", "*secret*", "*.secrets.*", "*serviceaccount*", "*.p12", "*.pfx"
)

Write-Host "=== Werkles -> Atlas mirror ($mode) ==="
Write-Host "Source : $RepoRoot"
Write-Host "Vault  : $mirrorDest"
Write-Host "Excl dirs : $($excludeDirs -join ', ')"
Write-Host "Excl files: $($excludeFiles -join ', ')"
Write-Host ""

if (-not (Get-Command robocopy -ErrorAction SilentlyContinue)) {
  Write-Error "robocopy not found. This script is intended for Windows (Atlas/Betsy/Sally)."
  exit 1
}

# robocopy flags:
#   /E         copy subdirectories including empty ones
#   /XD        exclude directories
#   /XF        exclude files
#   /R:1 /W:1  minimal retry
#   /NP        no per-file progress
#   /L         LIST ONLY (dry-run) — added unless -Execute
#   NO /MIR, NO /PURGE  => vault files are never deleted; source is never touched
$flags = @("/E", "/R:1", "/W:1", "/NP", "/NDL")
if (-not $Execute) { $flags += "/L" }

$args = @($RepoRoot, $mirrorDest) + $flags
$args += @("/XD") + ($excludeDirs | ForEach-Object { Join-Path $RepoRoot $_ })
$args += @("/XF") + $excludeFiles

if ($Execute) {
  New-Item -ItemType Directory -Force -Path $mirrorDest | Out-Null
} else {
  Write-Host "(dry-run: not creating vault directories)"
}

Write-Host "robocopy $($args -join ' ')"
Write-Host ""

& robocopy @args
$rc = $LASTEXITCODE

# robocopy exit codes: 0-7 are success-ish (>=8 indicates failure)
$status = if ($rc -ge 8) { "FAILED (robocopy code $rc)" } else { "OK (robocopy code $rc)" }
$endStamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"

Write-Host ""
Write-Host "Result: $status"

# Append backup log (only when vault exists / on execute; in dry-run just echo)
$logLine = "[$endStamp] mode=$mode start=$startStamp source=`"$RepoRoot`" dest=`"$mirrorDest`" result=$status"
if ($Execute) {
  New-Item -ItemType Directory -Force -Path $vaultRoot | Out-Null
  Add-Content -Path $logPath -Value $logLine
  Write-Host "Backup log appended: $logPath"
} else {
  Write-Host "DRY-RUN log line (not written): $logLine"
}

if ($rc -ge 8) { exit 1 } else { exit 0 }
