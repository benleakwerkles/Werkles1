# AEYE_DESKTOP_SHARE_POLICY

Status: ACTIVE_POLICY
Owner: Swanson@Doss
Scope: Aeye Workstation LAN file sharing

## Rule

When Ben gives an Aeye a folder path on a workstation desktop, the Aeye must treat it as a shared-workstation reference, not as a Doss-local path.

Bad:

```text
C:\Users\Ben Leak\Desktop\Nerdkle The Book
```

interpreted on Doss as Doss's `C:` drive.

Good:

```text
Source machine: Betsy
Local desktop path: C:\Users\Ben Leak\Desktop\Nerdkle The Book
Resolved shared candidates:
\\Betsy\AeyeDesktop\Nerdkle The Book
\\Betsy.local\AeyeDesktop\Nerdkle The Book
```

## Standard Share

Each Aeye workstation must expose the current user's Desktop as:

```text
\\<MachineName>\AeyeDesktop
```

The share should be LAN/private-profile only and account-scoped to Ben's authenticated Windows account. Do not expose this share publicly. Do not grant anonymous access.

## Required Tooling

- `scripts/foreman/Enable-AeyeDesktopShare.ps1`
- `scripts/foreman/Resolve-AeyeDesktopPath.ps1`
- `scripts/foreman/Test-AeyeWorkstationShares.ps1`
- `foreman/workstation/AEYE_WORKSTATION_SHARE_MAP.json`

## Operating Procedure

1. If Ben gives a local path and a machine name, run `Resolve-AeyeDesktopPath.ps1`.
2. If the resolver returns `RESOLVED`, use the returned path.
3. If the resolver returns `UNRESOLVED_SHARE_MISSING`, do not ask Ben to translate the path. Return a blocker naming the source machine and run/assign the share bootstrap.
4. If the machine is reachable but share enumeration fails, report `MACHINE_REACHABLE_SHARE_NOT_PROVEN`.
5. If the machine itself is unreachable, report `MACHINE_UNREACHABLE`.

## One-Time Bootstrap On Each Machine

Run this on the source machine, not from Doss:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Enable-AeyeDesktopShare.ps1
```

If the current shell is not elevated, use:

```cmd
scripts\foreman\Enable-AeyeDesktopShare-Elevated.cmd
```

The elevated launcher exists because creating an SMB share is an operating-system permission boundary. The required human action is accepting the Windows admin prompt on the source machine, not translating paths or carrying files.

## Boundary

This policy creates a deterministic file-sharing convention. It does not copy secrets, open public network exposure, or imply that every existing desktop folder is already readable until the share bootstrap receipt exists on that machine.
