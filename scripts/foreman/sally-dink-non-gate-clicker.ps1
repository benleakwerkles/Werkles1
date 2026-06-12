param(
  [ValidateSet("Allow", "Stop")]
  [string]$Click = "Allow",

  [string]$ConfigPath = (Join-Path $PSScriptRoot "sally-dink-non-gate-clicker.local.json"),

  [switch]$LiveClick
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $ConfigPath)) {
  throw "Missing local config: $ConfigPath. Copy scripts\foreman\sally-dink-non-gate-clicker.local.example.json to this path and fill Sally-local coordinates."
}

$Config = Get-Content -Raw -LiteralPath $ConfigPath | ConvertFrom-Json
$Target = if ($Click -eq "Allow") { $Config.allowButton } else { $Config.stopButton }

if ($null -eq $Target -or $null -eq $Target.x -or $null -eq $Target.y) {
  throw "Config is missing coordinates for $Click button."
}

$TargetX = [int]$Target.x
$TargetY = [int]$Target.y

if ($TargetX -le 0 -or $TargetY -le 0) {
  throw "Coordinates for $Click still look unset. Edit the Sally-local config before using the click helper."
}

if ($Config.windowTitleRegex) {
  $Window = Get-Process |
    Where-Object { $_.MainWindowTitle -and $_.MainWindowTitle -match $Config.windowTitleRegex } |
    Select-Object -First 1

  if ($null -eq $Window) {
    throw "No window matched title regex '$($Config.windowTitleRegex)'. Put Dink/Codex in the fixed Sally position or update the local config."
  }
}

if (-not ("SallyNonGate.NativeMethods" -as [type])) {
  Add-Type -Namespace SallyNonGate -Name NativeMethods -MemberDefinition @"
    [System.Runtime.InteropServices.DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(System.IntPtr hWnd);

    [System.Runtime.InteropServices.DllImport("user32.dll")]
    public static extern bool SetCursorPos(int X, int Y);

    [System.Runtime.InteropServices.DllImport("user32.dll")]
    public static extern void mouse_event(int dwFlags, int dx, int dy, int cButtons, int dwExtraInfo);
"@
}

Write-Host "Decision required before clicking:"
if ($Click -eq "Allow") {
  Write-Host "  PROCEED: not a human gate."
} else {
  Write-Host "  STOP: HUMAN GATE."
}
Write-Host "Configured target: $Click at x=$($Target.x), y=$($Target.y)"

if ($Config.windowTitleRegex) {
  Write-Host "Matched window: $($Window.MainWindowTitle)"
}

if (-not $LiveClick) {
  Write-Host "Dry run only. Re-run with -LiveClick after classification if you intend to click."
  exit 0
}

if ($Click -ne "Allow") {
  Write-Host "Stop button click requested. Verify this is a local dismiss/cancel action, not a final approval."
}

if ($Config.windowTitleRegex) {
  [void][SallyNonGate.NativeMethods]::SetForegroundWindow($Window.MainWindowHandle)
  Start-Sleep -Milliseconds 250
}

[void][SallyNonGate.NativeMethods]::SetCursorPos($TargetX, $TargetY)
Start-Sleep -Milliseconds 80
[SallyNonGate.NativeMethods]::mouse_event(0x0002, 0, 0, 0, 0)
Start-Sleep -Milliseconds 80
[SallyNonGate.NativeMethods]::mouse_event(0x0004, 0, 0, 0, 0)

Write-Host "Clicked $Click. Log the prompt summary and cockpit source if this affects repo state."
