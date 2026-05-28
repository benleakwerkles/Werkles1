param(
  [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$InstructionRoot = Join-Path $RepoRoot "foreman\platform-instructions"

$Platforms = @(
  @{
    Name = "ChatGPT Project"
    File = "CHATGPT_PROJECT_INSTRUCTIONS.md"
    Url = "https://chatgpt.com/"
    HumanAction = "Create or open the Werkles project, paste the clipboard contents into project instructions, then save."
  },
  @{
    Name = "Claude Ender Project"
    File = "CLAUDE_ENDER_PROJECT_INSTRUCTIONS.md"
    Url = "https://claude.ai/"
    HumanAction = "Create or open the Werkles project, paste the clipboard contents into project instructions, then save."
  },
  @{
    Name = "Gemini Skybro Gem"
    File = "GEMINI_SKYBRO_GEM_INSTRUCTIONS.md"
    Url = "https://gemini.google.com/"
    HumanAction = "Create or open the Werkles Gem, paste the clipboard contents into Gem instructions, then save."
  },
  @{
    Name = "DeepSeek Bean"
    File = "DEEPSEEK_BEAN_INSTRUCTIONS.md"
    Url = "https://chat.deepseek.com/"
    HumanAction = "Create or open the Werkles Bean chat/project space, paste the clipboard contents as standing instructions if available, then save."
  },
  @{
    Name = "Perplexity Computer"
    File = "PERPLEXITY_COMPUTER_INSTRUCTIONS.md"
    Url = "https://www.perplexity.ai/"
    HumanAction = "Create or open the Werkles Space/collection if available, paste the clipboard contents as instructions if supported, then save."
  },
  @{
    Name = "Codex Foreman"
    File = "CODEX_FOREMAN_INSTRUCTIONS.md"
    Url = $null
    HumanAction = "Keep this file in the repo as Codex Foreman standing instructions. Paste into a Codex project/profile only if the product UI offers a safe instructions field."
  }
)

Write-Host "Werkles AI Platform Setup Kit"
Write-Host "This script copies one instruction file at a time and waits for CONTINUE."
Write-Host "It will not enter credentials, secrets, payment details, OAuth approvals, or account settings."
Write-Host ""

foreach ($Platform in $Platforms) {
  $Path = Join-Path $InstructionRoot $Platform.File
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Missing instruction file: $Path"
  }

  $Content = Get-Content -Raw -LiteralPath $Path
  Set-Clipboard -Value $Content

  Write-Host "------------------------------------------------------------"
  Write-Host "Platform: $($Platform.Name)"
  Write-Host "Copied to clipboard: $Path"

  if ($Platform.Url -and -not $NoBrowser) {
    Write-Host "Opening: $($Platform.Url)"
    Start-Process $Platform.Url
  } elseif ($Platform.Url) {
    Write-Host "Open manually: $($Platform.Url)"
  } else {
    Write-Host "No safe public platform URL configured for this entry."
  }

  Write-Host "Human-only action: $($Platform.HumanAction)"
  Write-Host "Human gates remain: login, account creation, OAuth, billing, private secret entry, final create/save/share approval."
  Write-Host ""

  do {
    $Answer = Read-Host "Type CONTINUE after saving this platform, or STOP to exit"
    if ($Answer -eq "STOP") {
      Write-Host "Stopped by Operator."
      exit 0
    }
  } until ($Answer -eq "CONTINUE")
}

Write-Host "All platform instruction files have been presented."
