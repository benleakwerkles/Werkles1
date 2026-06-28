param(
  [string]$ShareName = "AeyeDesktop",
  [string]$DesktopPath = [Environment]::GetFolderPath("Desktop"),
  [string]$AccessAccount = "$env:USERDOMAIN\$env:USERNAME",
  [string]$ReceiptPath = ""
)

$ErrorActionPreference = "Stop"

function Write-Receipt {
  param([hashtable]$Receipt)
  if (-not $ReceiptPath) {
    $script:ReceiptPath = Join-Path $DesktopPath "AEYE_DESKTOP_SHARE_RECEIPT.json"
  }
  $receiptDir = Split-Path -Parent $ReceiptPath
  if ($receiptDir) {
    New-Item -ItemType Directory -Force -Path $receiptDir | Out-Null
  }
  $Receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8
  Write-Output ($Receipt | ConvertTo-Json -Depth 8)
}

$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
$now = (Get-Date).ToUniversalTime().ToString("o")

if (-not (Test-Path -LiteralPath $DesktopPath)) {
  Write-Receipt @{
    receipt_id = "AEYE_DESKTOP_SHARE_BOOTSTRAP"
    created_at = $now
    machine = $env:COMPUTERNAME
    status = "BLOCKED_DESKTOP_PATH_MISSING"
    desktop_path = $DesktopPath
    share_name = $ShareName
    blocker = "Desktop path does not exist on this machine."
  }
  exit 2
}

if (-not $isAdmin) {
  Write-Receipt @{
    receipt_id = "AEYE_DESKTOP_SHARE_BOOTSTRAP"
    created_at = $now
    machine = $env:COMPUTERNAME
    status = "BLOCKED_NEEDS_ELEVATED_SHELL"
    desktop_path = $DesktopPath
    share_name = $ShareName
    unc = "\\$env:COMPUTERNAME\$ShareName"
    blocker = "Creating SMB shares requires an elevated PowerShell session."
    rerun_command = "powershell -ExecutionPolicy Bypass -File scripts\foreman\Enable-AeyeDesktopShare.ps1"
  }
  exit 2
}

$existing = Get-SmbShare -Name $ShareName -ErrorAction SilentlyContinue
if ($existing -and ($existing.Path -ne $DesktopPath)) {
  Write-Receipt @{
    receipt_id = "AEYE_DESKTOP_SHARE_BOOTSTRAP"
    created_at = $now
    machine = $env:COMPUTERNAME
    status = "BLOCKED_SHARE_NAME_CONFLICT"
    desktop_path = $DesktopPath
    share_name = $ShareName
    existing_path = $existing.Path
    blocker = "Share name already exists for a different path."
  }
  exit 3
}

if (-not $existing) {
  New-SmbShare -Name $ShareName -Path $DesktopPath -ChangeAccess $AccessAccount -Description "Aeye Workstation shared Desktop root for folder-link resolution" | Out-Null
} else {
  Set-SmbShare -Name $ShareName -Description "Aeye Workstation shared Desktop root for folder-link resolution" -Force | Out-Null
  Grant-SmbShareAccess -Name $ShareName -AccountName $AccessAccount -AccessRight Change -Force | Out-Null
}

try {
  Set-NetFirewallRule -DisplayGroup "File and Printer Sharing" -Profile Private -Enabled True | Out-Null
} catch {
  # Share creation succeeded; firewall rule adjustment may vary by Windows edition.
}

$markerPath = Join-Path $DesktopPath ".aeye-shared-root.json"
@{
  marker = "AEYE_DESKTOP_SHARED_ROOT"
  machine = $env:COMPUTERNAME
  desktop_path = $DesktopPath
  share_name = $ShareName
  unc = "\\$env:COMPUTERNAME\$ShareName"
  created_at = $now
} | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $markerPath -Encoding UTF8

$share = Get-SmbShare -Name $ShareName
Write-Receipt @{
  receipt_id = "AEYE_DESKTOP_SHARE_BOOTSTRAP"
  created_at = $now
  machine = $env:COMPUTERNAME
  status = "SHARE_READY"
  desktop_path = $DesktopPath
  share_name = $ShareName
  unc = "\\$env:COMPUTERNAME\$ShareName"
  access_account = $AccessAccount
  marker_path = $markerPath
  share_state = $share.ShareState.ToString()
}
