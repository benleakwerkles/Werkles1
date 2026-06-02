param(
  [ValidateSet("Validate", "Process", "DryRun", "SelfTest", "RunFixtures", "MarkSent", "ArchiveSent", "ListOutbox")]
  [string]$Action = "Validate",
  [string]$PacketFile = "",
  [switch]$IncludeSent
)

$ErrorActionPreference = "Stop"
$RepoRoot = $PSScriptRoot
while ($RepoRoot -and -not (Test-Path (Join-Path $RepoRoot "foreman\crew-dispatch\crew-response-intake.mjs"))) {
  $parent = Split-Path $RepoRoot -Parent
  if ($parent -eq $RepoRoot) { break }
  $RepoRoot = $parent
}
if (-not (Test-Path (Join-Path $RepoRoot "foreman\crew-dispatch\crew-response-intake.mjs"))) {
  throw "Could not find repo root from $PSScriptRoot"
}

$Intake = Join-Path $RepoRoot "foreman\crew-dispatch\crew-response-intake.mjs"

Push-Location $RepoRoot
try {
  switch ($Action) {
    "Validate" {
      node $Intake validate
      exit $LASTEXITCODE
    }
    "Process" {
      node $Intake process
      exit $LASTEXITCODE
    }
    "DryRun" {
      node $Intake process --dry-run
      exit $LASTEXITCODE
    }
    "SelfTest" {
      node $Intake --self-test
      exit $LASTEXITCODE
    }
    "RunFixtures" {
      node $Intake run-fixtures
      exit $LASTEXITCODE
    }
    "MarkSent" {
      if (-not $PacketFile) { throw "MarkSent requires -PacketFile TO_COUSIN_*.md" }
      node $Intake mark-sent $PacketFile
      exit $LASTEXITCODE
    }
    "ArchiveSent" {
      node $Intake archive-sent
      exit $LASTEXITCODE
    }
    "ListOutbox" {
      if ($IncludeSent) {
        node $Intake list-outbox --sent
      } else {
        node $Intake list-outbox
      }
      exit $LASTEXITCODE
    }
    default { throw "Unknown action: $Action" }
  }
}
finally {
  Pop-Location
}
