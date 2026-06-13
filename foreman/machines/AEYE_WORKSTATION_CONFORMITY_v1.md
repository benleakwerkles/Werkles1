# Aeye Workstation Standard v1.1 - Google Drive Integration

Date: 2026-06-13
Mission: Aeye Workstation Standard v1.1 - Google Drive Integration
Scope: Infrastructure only. No Werkles app code, Node/npm, homepage, SoleDash, Speaker, matching engine, BIOS, drivers, paid apps, account logins, or security settings were changed.

## Canonical Workstation Software Stack

Required:

- Cursor
- Git
- Node LTS
- GitHub Desktop
- Microsoft PowerToys
- FancyZones
- PowerToys Run
- Text Extractor
- Always On Top
- Keyboard Manager
- File Locksmith
- Peek
- Hosts File Editor
- Mouse Without Borders when useful
- Google Drive for Desktop

Required PowerToys baseline:

- FancyZones
- PowerToys Run
- Text Extractor
- Always On Top
- Keyboard Manager
- File Locksmith
- Peek
- Hosts File Editor
- Mouse Without Borders only if needed/available and explicitly paired across machines

## Google Drive Rules

Google Drive = Warehouse.

GitHub Repo = Factory.

Drive stores documents.

Git stores code.

- Use streaming by default.
- Pin active folders offline only when needed.
- Do not mirror entire business drives unless explicitly approved.
- Do not place the Werkles repo inside Google Drive.
- Do not place Google Drive inside the Werkles repo.
- Do not place Kind Sir repo or archive folders inside the Werkles repo.
- Do not sync `node_modules`, `.next`, `.git`, or local dev artifacts.
- Keep Drive content separate from code workspaces.
- Keep company archives separate from code workspaces.

Recommended structure:

```text
Code:
C:\Users\<user>\Desktop\github\Werkles

Documents:
Google Drive\Werkles
Google Drive\Kind Sir
```

## Company Drive Structure

Werkles Drive:

- VDR
- Speaker
- Bellows
- Images
- Legal
- Research
- Handoffs
- Investor Materials

Kind Sir Drive:

- Accounting
- Contracts
- Operations
- HR
- Historical Records

## Machine Roles

- Betsy: Primary Forge
- Doss: Mobile/Mirror Forge
- Sally: Archive / Snapshot Surface

## Guardrails

No workstation may:

- place repos inside Drive
- place Drive inside repos
- mix company archives with code workspaces

## Summary

| Machine | Hostname | Standard role | Local hands status | PowerToys status | Google Drive status | Conformity status |
| --- | --- | --- | --- | --- | --- | --- |
| Betsy | DESKTOP-KTBH0LA, per topology, not live-verified here | Primary forge | Pending local hands | Unknown | Unknown | Pending |
| Doss | BLDER | Mobile/mirror forge | Complete from this Codex local session | Installed v0.100.0; required modules enabled | Not verified in this session | PowerToys conformed except Mouse Without Borders pairing; Drive pending verification |
| Sally | DESKTOP-SJSJMNK, per topology | Archive/snapshot surface | Pending local hands | Unknown | Unknown | Pending |

## Local Hands Readback

### Betsy

- Machine name: Betsy
- Hostname: DESKTOP-KTBH0LA, from `foreman/MACHINE_TOPOLOGY.md`; no live readback from this session
- Repo path if present: unknown from this execution context
- Branch if repo present: unknown from this execution context
- Terminal access: no direct terminal access from this Doss Codex session
- Execution context: not locally reachable from current session
- Result: requires a Betsy-local readback before any install or enablement claim

### Doss

- Machine name: Doss
- Hostname: BLDER
- Repo path if present: `C:\Users\BenLeak\Desktop\github\Werkles`
- Branch if repo present: `snapshot/sally-good-werkles-2026-06-12`, read from `.git/HEAD`
- Terminal access: yes, PowerShell 5.1.22621.2506
- Execution context: Codex local sandbox on Doss; hostname `BLDER`; sandbox account observed as `CodexSandboxOffline`, user profile `C:\Users\BenLeak`
- Notes: Cursor had the Werkles repo open as a local `file:///c:/Users/BenLeak/Desktop/github/Werkles` folder in the prior audit. This report only writes the conformity report file.

### Sally

- Machine name: Sally
- Hostname: DESKTOP-SJSJMNK, from `foreman/MACHINE_TOPOLOGY.md`
- Repo path if present: topology lists `C:\Users\benle\Desktop\github\Werkles` and `C:\Dev\Werkles`
- Branch if repo present: topology lists `rescue/sally-dirty-worktree-2026-06-01` for the Desktop path and `snapshot/sally-good-werkles-2026-06-12` for `C:\Dev\Werkles`
- Terminal access: no direct terminal access from this Doss Codex session
- Execution context: not locally reachable from current session
- Result: requires a Sally-local readback before any install or enablement claim

## PowerToys Verification

### Betsy

- PowerToys installed: unknown
- Version: unknown
- Enabled modules: unknown
- Missing modules: unknown
- Admin prompts: none from this session
- Reboot needed: unknown
- Differences from other machines: cannot compare until Betsy-local readback is performed

### Doss

- PowerToys installed: yes
- Version: v0.100.0
- Install location: `C:\Users\BenLeak\AppData\Local\PowerToys\PowerToys.exe`
- Install action: installed Microsoft PowerToys with `winget install --id Microsoft.PowerToys --exact --source winget --accept-package-agreements --accept-source-agreements` after Ben approved the install prompt
- Settings file: `C:\Users\BenLeak\AppData\Local\Microsoft\PowerToys\settings.json`
- Settings backups created:
  - `C:\Users\BenLeak\AppData\Local\Microsoft\PowerToys\settings.json.aeye-backup-20260613-113825`
  - `C:\Users\BenLeak\AppData\Local\Microsoft\PowerToys\settings.json.aeye-backup-20260613-113849`
  - `C:\Users\BenLeak\AppData\Local\Microsoft\PowerToys\settings.json.aeye-backup-20260613-114155`
- Enabled required modules verified from settings:
  - FancyZones: enabled
  - PowerToys Run: enabled
  - Text Extractor: enabled
  - Always On Top: enabled
  - Keyboard Manager: enabled
  - File Locksmith: enabled
  - Peek: enabled
  - Hosts File Editor: enabled
- Mouse Without Borders: available but left disabled; pairing should be explicit because it depends on cross-machine trust and setup
- Missing required modules: none, excluding Mouse Without Borders because it is conditional
- Admin prompts: Codex approval prompts were required for install and settings changes; no separate paid app, login, driver, BIOS, or security-setting prompt was used
- Reboot needed: no reboot indicated by installer or verification
- Differences from other machines: Doss is the only machine live-conformed in this session; Betsy and Sally remain pending local hands

### Sally

- PowerToys installed: unknown
- Version: unknown
- Enabled modules: unknown
- Missing modules: unknown
- Admin prompts: none from this session
- Reboot needed: unknown
- Differences from other machines: cannot compare until Sally-local readback is performed

## Google Drive for Desktop Verification

### Betsy

- Google Drive for Desktop installed: unknown
- Mode: must be streaming by default
- Offline pinning: active folders only when needed
- Drive/code separation: must keep Drive content separate from code workspaces
- Differences from other machines: pending Betsy-local readback

### Doss

- Google Drive for Desktop installed: not verified in this session
- Mode: standard requires streaming by default
- Offline pinning: active folders only when needed
- Mirror restriction: do not mirror entire business drives without explicit approval
- Code workspace restriction: do not place the Werkles repo inside Google Drive
- Archive restriction: do not place Kind Sir repo or archive folders inside the Werkles repo
- Dev artifact restriction: do not sync `node_modules`, `.next`, `.git`, or local dev artifacts
- Differences from other machines: Doss has the Drive standard recorded; install/mode still requires local verification

### Sally

- Google Drive for Desktop installed: unknown
- Mode: must be streaming by default
- Offline pinning: active folders only when needed
- Drive/code separation: must keep Drive content separate from code workspaces
- Differences from other machines: pending Sally-local readback

## Missing Modules Matrix

| Module | Betsy | Doss | Sally |
| --- | --- | --- | --- |
| FancyZones | Unknown | Enabled | Unknown |
| PowerToys Run | Unknown | Enabled | Unknown |
| Text Extractor | Unknown | Enabled | Unknown |
| Always On Top | Unknown | Enabled | Unknown |
| Keyboard Manager | Unknown | Enabled | Unknown |
| File Locksmith | Unknown | Enabled | Unknown |
| Peek | Unknown | Enabled | Unknown |
| Hosts File Editor | Unknown | Enabled | Unknown |
| Mouse Without Borders | Unknown | Available, disabled pending pairing decision | Unknown |
| Google Drive for Desktop | Unknown | Not verified | Unknown |

## Human Gates

- Paid app: not triggered
- Account login: not triggered
- Driver update: not triggered
- BIOS update: not triggered
- Security setting change: not triggered
- Mouse Without Borders pairing: human gate required before enabling across machines
- Betsy/Sally install or settings changes: human gate/local hands required on each machine
- Google Drive account login or sync scope change: human gate required
- Mirroring entire business drives: explicit approval required
- Moving repos into Google Drive or syncing code artifacts: forbidden by workstation standard

## Next Local Hands Commands

Run on Betsy and Sally locally before claiming conformity:

```powershell
$repoCandidates = @('C:\Users\BenLeak\Desktop\github\Werkles','C:\Users\benle\Desktop\github\Werkles','C:\Dev\Werkles')
[pscustomobject]@{
  Hostname = $env:COMPUTERNAME
  User = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
  Shell = 'powershell'
  PSVersion = $PSVersionTable.PSVersion.ToString()
  RepoCandidates = ($repoCandidates | Where-Object { Test-Path -LiteralPath $_ }) -join '; '
}
```

Then verify PowerToys:

```powershell
$settings = "$env:LOCALAPPDATA\Microsoft\PowerToys\settings.json"
$exe = "$env:LOCALAPPDATA\PowerToys\PowerToys.exe"
[pscustomobject]@{
  PowerToysExe = if (Test-Path -LiteralPath $exe) { $exe } else { $null }
  Version = if (Test-Path -LiteralPath $exe) { (Get-Item -LiteralPath $exe).VersionInfo.ProductVersion } else { $null }
  Settings = if (Test-Path -LiteralPath $settings) { Get-Content -LiteralPath $settings -Raw } else { $null }
}
```

Then verify Google Drive for Desktop without changing sync settings:

```powershell
$driveExeCandidates = @(
  "$env:ProgramFiles\Google\Drive File Stream\GoogleDriveFS.exe",
  "${env:ProgramFiles(x86)}\Google\Drive File Stream\GoogleDriveFS.exe",
  "$env:LOCALAPPDATA\Google\DriveFS\GoogleDriveFS.exe"
)
[pscustomobject]@{
  GoogleDriveExe = ($driveExeCandidates | Where-Object { Test-Path -LiteralPath $_ }) -join '; '
  DriveGPathExists = Test-Path -LiteralPath 'G:\'
  StandardMode = 'Streaming by default; pin active folders offline only when needed'
  Forbidden = 'Do not put Werkles repo in Drive; do not sync node_modules, .next, .git, or local dev artifacts'
}
```
