param(
  [string]$DbPath = "",
  [string]$QueueDir = "",
  [int]$IntervalMs = 60000
)

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$LogDir = Join-Path $RepoRoot "logs\receipt-crawler"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

$Existing = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
  Where-Object { $_.CommandLine -match "scripts\\foreman\\crawler\.js|scripts/foreman/crawler\.js|crawler\.js" } |
  Select-Object -First 1

if ($Existing) {
  $LatestOut = Get-ChildItem -Path $LogDir -Filter "*.out.log" -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
  $LatestErr = Get-ChildItem -Path $LogDir -Filter "*.err.log" -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  Write-Output ([pscustomobject]@{
    status = "ALREADY_RUNNING"
    pid = $Existing.ProcessId
    repo_root = "$RepoRoot"
    stdout = if ($LatestOut) { $LatestOut.FullName } else { $null }
    stderr = if ($LatestErr) { $LatestErr.FullName } else { $null }
    command = $Existing.CommandLine
  } | ConvertTo-Json -Depth 4)
  exit 0
}

$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$StdOut = Join-Path $LogDir "crawler-$Stamp.out.log"
$StdErr = Join-Path $LogDir "crawler-$Stamp.err.log"

$Arguments = @("scripts\foreman\crawler.js", "--interval-ms", "$IntervalMs")
if ($DbPath.Trim().Length -gt 0) {
  $Arguments += @("--db", $DbPath)
}
if ($QueueDir.Trim().Length -gt 0) {
  $Arguments += @("--queue", $QueueDir)
}

$Process = Start-Process `
  -FilePath "node" `
  -ArgumentList $Arguments `
  -WorkingDirectory $RepoRoot `
  -WindowStyle Hidden `
  -RedirectStandardOutput $StdOut `
  -RedirectStandardError $StdErr `
  -PassThru

$State = [pscustomobject]@{
  status = "STARTED"
  pid = $Process.Id
  repo_root = "$RepoRoot"
  stdout = $StdOut
  stderr = $StdErr
  command = "node $($Arguments -join ' ')"
}

$StatePath = Join-Path $LogDir "current.json"
$State | ConvertTo-Json -Depth 4 | Set-Content -Encoding UTF8 -Path $StatePath
Write-Output ($State | ConvertTo-Json -Depth 4)
