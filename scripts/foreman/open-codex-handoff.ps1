$RepoRoot = "C:\Users\benle\Desktop\github\Werkles"
$PasteFile = Join-Path $RepoRoot "foreman\handoffs\outbox\CODEX_PASTE_BLOCK.txt"
$PacketFile = Join-Path $RepoRoot "foreman\handoffs\outbox\TO_CODEX_GHOST_FORGE_ICONS_FIRST_v0.2.md"
$LauncherFile = Join-Path $RepoRoot "foreman\handoffs\outbox\OPEN_HANDOFF_HERE.md"
$IconsDir = Join-Path $RepoRoot "public\assets\draft\icons"

if (-not (Test-Path $IconsDir)) {
  New-Item -ItemType Directory -Path $IconsDir -Force | Out-Null
}

if (Test-Path $PasteFile) {
  Get-Content $PasteFile -Raw | Set-Clipboard
  Write-Host "Copied Codex paste block to clipboard."
} else {
  Write-Warning "Missing paste block: $PasteFile"
}

foreach ($path in @($PacketFile, $LauncherFile)) {
  if (Test-Path $path) {
    Start-Process $path
  }
}

explorer.exe $IconsDir
Write-Host "Sally: Codex paste block copied to clipboard."
Write-Host "Sally: opened handoff packet. Icons folder:"
Write-Host $IconsDir
Write-Host "Next: open Codex in browser, paste (Ctrl+V), let Codex hit Render Ghost Forge."
