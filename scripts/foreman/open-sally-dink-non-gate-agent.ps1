$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$PasteFile = Join-Path $RepoRoot "foreman\handoffs\outbox\SALLY_DINK_NON_GATE_PASTE_BLOCK.txt"
$PacketFile = Join-Path $RepoRoot "foreman\handoffs\outbox\TO_SALLY_DINK_NON_GATE_AGENT_v0.1.md"
$ExampleConfig = Join-Path $RepoRoot "scripts\foreman\sally-dink-non-gate-clicker.local.example.json"
$LocalConfig = Join-Path $RepoRoot "scripts\foreman\sally-dink-non-gate-clicker.local.json"

if (-not (Test-Path -LiteralPath $PasteFile)) {
  throw "Missing paste block: $PasteFile"
}

Get-Content -Raw -LiteralPath $PasteFile | Set-Clipboard
Write-Host "Copied Sally/Dink non-gate agent paste block to clipboard."

foreach ($Path in @($PacketFile, $ExampleConfig)) {
  if (Test-Path -LiteralPath $Path) {
    Start-Process $Path
  } else {
    Write-Warning "Missing expected file: $Path"
  }
}

if (-not (Test-Path -LiteralPath $LocalConfig) -and (Test-Path -LiteralPath $ExampleConfig)) {
  Copy-Item -LiteralPath $ExampleConfig -Destination $LocalConfig
  Write-Host "Created local coordinate config:"
  Write-Host $LocalConfig
  Write-Host "Edit this local file with Sally's fixed Dink/Codex button coordinates before live clicking."
}

Write-Host ""
Write-Host "Next:"
Write-Host "1. Paste the clipboard block into the focused Dink/Codex non-gate agent."
Write-Host "2. Keep Dink/Codex in the fixed Sally window position."
Write-Host "3. Use the click helper only after a prompt is classified as: PROCEED: not a human gate."
Write-Host "4. Stop at login/OAuth/secrets/billing/push/merge/deploy/SQL/final approvals or unknown prompts."
