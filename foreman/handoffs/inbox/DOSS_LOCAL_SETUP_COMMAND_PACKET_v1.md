# DOSS_LOCAL_SETUP_COMMAND_PACKET_v1

Date: 2026-06-12
Prepared by: Maker (Cursor) · EXECUTION_CONTEXT: CURSOR_CLOUD_CONTAINER
Type: command packet (commands to RUN on Doss). **Not an audit. Not a verified baseline.**

## Status

- **Doss baseline status = NOT AUDITED**
- **Required execution context = `LOCAL_DOSS_WINDOWS`**
- A `CURSOR_CLOUD_CONTAINER` agent prepared this packet and **cannot** verify Doss's tools, `localhost`, repo cleanliness, branch, or hardware. Every Doss-local fact below is **unverified** until this packet is run on Doss by a `LOCAL_DOSS_WINDOWS` agent/operator.

## Alignment target (origin-side facts only)

- Repo: `https://github.com/benleakwerkles/Werkles1.git`
- Target path on Doss: `C:\Users\Ben Leak\Desktop\github\Werkles`
- Branch: `snapshot/sally-good-werkles-2026-06-12`
- Target commit: **`437792b`** — "docs(crew): mandate LOCAL HANDS READBACK at session start"
- These are read from `origin` (GitHub), not from Doss.

## Setup commands (run on Doss; path has a space, keep quotes; use npm.cmd)

```powershell
New-Item -ItemType Directory -Force -Path "C:\Users\Ben Leak\Desktop\github" | Out-Null
cd "C:\Users\Ben Leak\Desktop\github"
git clone https://github.com/benleakwerkles/Werkles1.git Werkles   # skip if already cloned
cd "C:\Users\Ben Leak\Desktop\github\Werkles"
git fetch --all --prune
git checkout snapshot/sally-good-werkles-2026-06-12
git pull origin snapshot/sally-good-werkles-2026-06-12
npm.cmd install
npm.cmd run dev
```

Then open `http://localhost:3000`.

After checkout, confirm alignment:
```powershell
git log -1 --format="%h %s"   # expect: 437792b docs(crew): mandate LOCAL HANDS READBACK at session start
```

## LOCAL HANDS READBACK (run on Doss; read-only)

```powershell
"machine: $env:COMPUTERNAME"
"user: $env:USERNAME"
"os: $((Get-CimInstance Win32_OperatingSystem).Caption) $((Get-CimInstance Win32_OperatingSystem).Version)"
"git: $(git --version 2>&1)"
"node: $(node -v 2>&1)"
"npm: $(npm -v 2>&1)"
"repo path exists: $(Test-Path 'C:\Users\Ben Leak\Desktop\github\Werkles')"
if (Test-Path 'C:\Users\Ben Leak\Desktop\github\Werkles\.git') {
  Push-Location 'C:\Users\Ben Leak\Desktop\github\Werkles'
  "branch: $(git branch --show-current)"
  "commit: $(git log -1 --format='%h %s')"
  "clean: $((git status --porcelain).Length -eq 0)"
  Pop-Location
}
```

### Readback results — UNVERIFIED until run on Doss

- Machine name: `NOT AUDITED`
- OS / user: `NOT AUDITED`
- Git / Node / npm: `NOT AUDITED`
- Repo path exists: `NOT AUDITED`
- Branch: `NOT AUDITED` (target: `snapshot/sally-good-werkles-2026-06-12`)
- Commit: `NOT AUDITED` (target: `437792b`)
- Working tree clean: `NOT AUDITED`
- localhost:3000 working: `NOT AUDITED`

## Audit vs Betsy

- **NOT AUDITED.** Blocked: `foreman/BETSY_BASELINE_v1.md` does not exist, and Doss-local data has not been collected. Requires `LOCAL_DOSS_WINDOWS` execution context to gather, plus a written Betsy baseline to compare against.
- Missing tools vs Betsy: `NOT AUDITED`.

## Human gates

- Installing major software on Doss (Git, Node, editor) if missing — HG before install.
- Creating `foreman/BETSY_BASELINE_v1.md` — prerequisite for any real Doss-vs-Betsy audit.

## Boundaries

No merge to main, no app-code edits, no push beyond this packet's branch, no BIOS changes. Commands are for a `LOCAL_DOSS_WINDOWS` operator/agent; the cloud agent did not and cannot run them on Doss.
