param(
  [Parameter(Mandatory=$true)]
  [string]$InputPath,
  [string]$SourceMachine = "",
  [string]$ShareMapPath = "foreman/workstation/AEYE_WORKSTATION_SHARE_MAP.json"
)

$ErrorActionPreference = "Stop"

function Test-Candidate {
  param([string]$Path, [string]$Kind)
  $exists = $false
  $errorText = $null
  try {
    $exists = Test-Path -LiteralPath $Path -ErrorAction Stop
  } catch {
    $errorText = $_.Exception.Message
  }
  [pscustomobject]@{
    kind = $Kind
    path = $Path
    exists = $exists
    error = $errorText
  }
}

function Get-DesktopRelativePath {
  param([string]$Path)
  $normalized = $Path -replace '/', '\'
  $match = [regex]::Match($normalized, '^[A-Za-z]:\\Users\\[^\\]+\\Desktop\\?(.*)$')
  if (-not $match.Success) {
    return $null
  }
  return $match.Groups[1].Value.TrimStart('\')
}

$map = $null
if (Test-Path -LiteralPath $ShareMapPath) {
  $map = Get-Content -LiteralPath $ShareMapPath -Raw | ConvertFrom-Json
}

$candidates = @()

if ($InputPath -match '^\\\\') {
  $candidates += Test-Candidate -Path $InputPath -Kind "input_unc"
} else {
  $localExists = $false
  try { $localExists = Test-Path -LiteralPath $InputPath -ErrorAction Stop } catch { $localExists = $false }
  if ($localExists) {
    $candidates += Test-Candidate -Path $InputPath -Kind "local_path"
  }

  $relative = Get-DesktopRelativePath -Path $InputPath
  if ($relative -ne $null) {
    if (-not $SourceMachine) {
      $machineNames = @()
      if ($map -and $map.machines) {
        $machineNames = $map.machines.PSObject.Properties.Name
      }
    } else {
      $machineNames = @($SourceMachine)
    }

    foreach ($machine in $machineNames) {
      $hostnames = @($machine)
      if ($map -and $map.machines -and $map.machines.$machine -and $map.machines.$machine.hostnames) {
        $hostnames = @($map.machines.$machine.hostnames)
      }
      foreach ($hostName in $hostnames) {
        $candidates += Test-Candidate -Path "\\$hostName\AeyeDesktop\$relative" -Kind "standard_aeye_desktop_share"
      }

      foreach ($hostName in $hostnames) {
        $adminPath = $InputPath -replace '^[A-Za-z]:', "\\$hostName\C$"
        $candidates += Test-Candidate -Path $adminPath -Kind "diagnostic_admin_share"
      }
    }
  }
}

$resolved = $candidates | Where-Object { $_.exists } | Select-Object -First 1
$status = if ($resolved) {
  "RESOLVED"
} elseif (($InputPath -notmatch '^\\\\') -and (-not $SourceMachine) -and ((Get-DesktopRelativePath -Path $InputPath) -ne $null)) {
  "UNRESOLVED_SOURCE_MACHINE_REQUIRED_OR_SHARE_MISSING"
} elseif ($candidates.Count -gt 0) {
  "UNRESOLVED_SHARE_MISSING"
} else {
  "UNRESOLVED_UNSUPPORTED_PATH"
}

[pscustomobject]@{
  status = $status
  input_path = $InputPath
  source_machine = $SourceMachine
  resolved_path = if ($resolved) { $resolved.path } else { $null }
  candidates = $candidates
  rule = "Desktop paths resolve through \\<Machine>\\AeyeDesktop\\<relative desktop path>; local C: paths do not cross machines."
} | ConvertTo-Json -Depth 8

if (-not $resolved) { exit 2 }
