param(
  [string]$ShareMapPath = "foreman/workstation/AEYE_WORKSTATION_SHARE_MAP.json",
  [string]$OutPath = "foreman/workstation/readbacks/AEYE_WORKSTATION_SHARE_READBACK.json",
  [switch]$DeepShareProbe
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $ShareMapPath)) {
  throw "Missing share map: $ShareMapPath"
}

$map = Get-Content -LiteralPath $ShareMapPath -Raw | ConvertFrom-Json
$results = @()

function Test-TcpQuick {
  param(
    [string]$ComputerName,
    [int]$Port,
    [int]$TimeoutMs = 1200
  )
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $async = $client.BeginConnect($ComputerName, $Port, $null, $null)
    $success = $async.AsyncWaitHandle.WaitOne($TimeoutMs, $false)
    if (-not $success) {
      $client.Close()
      return $false
    }
    $client.EndConnect($async)
    $client.Close()
    return $true
  } catch {
    return $false
  }
}

function Test-PathQuick {
  param(
    [string]$Path,
    [int]$TimeoutSeconds = 2
  )
  $job = Start-Job -ScriptBlock {
    param($CandidatePath)
    try {
      [pscustomobject]@{
        exists = (Test-Path -LiteralPath $CandidatePath -ErrorAction Stop)
        error = $null
      }
    } catch {
      [pscustomobject]@{
        exists = $false
        error = $_.Exception.Message
      }
    }
  } -ArgumentList $Path

  if (-not (Wait-Job -Job $job -Timeout $TimeoutSeconds)) {
    Stop-Job -Job $job | Out-Null
    Remove-Job -Job $job -Force | Out-Null
    return [pscustomobject]@{
      exists = $false
      error = "TIMEOUT_AFTER_${TimeoutSeconds}s"
    }
  }

  $result = Receive-Job -Job $job
  Remove-Job -Job $job -Force | Out-Null
  return $result
}

foreach ($machineProp in $map.machines.PSObject.Properties) {
  $machineName = $machineProp.Name
  $machine = $machineProp.Value
  $hostResults = @()
  foreach ($hostName in @($machine.hostnames)) {
    $smbOpen = $false
    $smbOpen = Test-TcpQuick -ComputerName $hostName -Port 445
    $sharePath = "\\$hostName\$($map.standard_share_name)"
    $isLocalHost = $hostName -eq $env:COMPUTERNAME -or $hostName -eq $env:COMPUTERNAME.ToLower() -or $hostName -eq "localhost" -or $hostName -eq "127.0.0.1"
    if ($DeepShareProbe -or $isLocalHost -or $hostName -match '^\d+\.\d+\.\d+\.\d+$') {
      $shareProbe = Test-PathQuick -Path $sharePath
    } else {
      $shareProbe = [pscustomobject]@{
        exists = $false
        error = "SKIPPED_REMOTE_UNC_PROBE_USE_DEEP_SHARE_PROBE"
      }
    }
    $hostResults += [pscustomobject]@{
      host = $hostName
      smb_445_open = $smbOpen
      share_path = $sharePath
      share_exists = [bool]$shareProbe.exists
      share_error = $shareProbe.error
    }
  }

  $status = if ($hostResults | Where-Object { $_.share_exists } | Select-Object -First 1) {
    "SHARE_READY"
  } elseif ($hostResults | Where-Object { $_.smb_445_open } | Select-Object -First 1) {
    "MACHINE_REACHABLE_SHARE_NOT_PROVEN"
  } else {
    "MACHINE_UNREACHABLE_OR_SMB_CLOSED"
  }

  $results += [pscustomobject]@{
    machine = $machineName
    status = $status
    hosts = $hostResults
  }
}

$receipt = [pscustomobject]@{
  receipt_id = "AEYE_WORKSTATION_SHARE_READBACK"
  created_at = (Get-Date).ToUniversalTime().ToString("o")
  source_machine = $env:COMPUTERNAME
  status = "READBACK_COMPLETE"
  results = $results
}

$outDir = Split-Path -Parent $OutPath
if ($outDir) { New-Item -ItemType Directory -Force -Path $outDir | Out-Null }
$receipt | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $OutPath -Encoding UTF8
$receipt | ConvertTo-Json -Depth 10
