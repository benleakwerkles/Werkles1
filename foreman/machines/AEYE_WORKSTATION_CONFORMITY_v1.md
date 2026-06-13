# Aeye Workstation Conformity v1

Date: 2026-06-13
Mission: Aeye Workstation Conformity Build v1
Scope: Infrastructure only. No Werkles app code, Node/npm, homepage, SoleDash, Speaker, matching engine, BIOS, drivers, paid apps, account logins, or security settings were changed.

## Standard

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

## Summary

| Machine | Hostname | Local hands status | PowerToys status | Conformity status |
| --- | --- | --- | --- | --- |
| Betsy | DESKTOP-KTBH0LA, per topology, not live-verified here | Pending local hands | Unknown | Pending |
| Doss / BLDER | BLDER | Complete from this Codex local session | Installed v0.100.0; required modules enabled | Conformed except Mouse Without Borders pairing not configured |
| Sally | DESKTOP-SJSJMNK, per topology | Pending local hands | Unknown | Pending |

## Local Hands Readback

### Betsy

- Machine name: Betsy
- Hostname: DESKTOP-KTBH0LA, from `foreman/MACHINE_TOPOLOGY.md`; no live readback from this session
- Repo path if present: unknown from this execution context
- Branch if repo present: unknown from this execution context
- Terminal access: no direct terminal access from Doss/BLDER Codex session
- Execution context: not locally reachable from current session
- Result: requires a Betsy-local readback before any install or enablement claim

### Doss / BLDER

- Machine name: Doss / BLDER
- Hostname: BLDER
- Repo path if present: `C:\Users\BenLeak\Desktop\github\Werkles`
- Branch if repo present: `snapshot/sally-good-werkles-2026-06-12`, read from `.git/HEAD`
- Terminal access: yes, PowerShell 5.1.22621.2506
- Execution context: Codex local sandbox on Doss/BLDER; Windows identity observed as `BLDer\CodexSandboxOffline`, user profile `C:\Users\BenLeak`
- Notes: Cursor had the Werkles repo open as a local `file:///c:/Users/BenLeak/Desktop/github/Werkles` folder in the prior audit. This report only writes the conformity report file.

### Sally

- Machine name: Sally
- Hostname: DESKTOP-SJSJMNK, from `foreman/MACHINE_TOPOLOGY.md`
- Repo path if present: topology lists `C:\Users\benle\Desktop\github\Werkles` and `C:\Dev\Werkles`
- Branch if repo present: topology lists `rescue/sally-dirty-worktree-2026-06-01` for the Desktop path and `snapshot/sally-good-werkles-2026-06-12` for `C:\Dev\Werkles`
- Terminal access: no direct terminal access from Doss/BLDER Codex session
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

### Doss / BLDER

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

## Missing Modules Matrix

| Module | Betsy | Doss / BLDER | Sally |
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

## Human Gates

- Paid app: not triggered
- Account login: not triggered
- Driver update: not triggered
- BIOS update: not triggered
- Security setting change: not triggered
- Mouse Without Borders pairing: human gate required before enabling across machines
- Betsy/Sally install or settings changes: human gate/local hands required on each machine

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
