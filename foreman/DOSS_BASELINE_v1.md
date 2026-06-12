# DOSS_BASELINE_v1

Date: 2026-06-12
Author: Maker (Cursor) · EXECUTION_CONTEXT: CURSOR_CLOUD_CONTAINER
Purpose: workstation baseline for **Doss**, aligned to the Betsy Werkles baseline.

> **Status: SCAFFOLD — partially filled.** Repo-side facts are cloud-verified. Doss-local fields are marked `[LOCAL READBACK REQUIRED]` because a cloud agent cannot inspect Doss's filesystem/hardware/tools. Fill them by running the readback block below on Doss.
>
> **Blocker:** `foreman/BETSY_BASELINE_v1.md` does **not exist** in the repo (any branch). A true Doss-vs-Betsy audit cannot be completed until that reference baseline is written. The closest existing doc is `FROM_MAKER_BETSY_SITE_PREVIEW_ONLY_V1.md` (preview commands, not a tool baseline).

## Repo-side baseline (cloud-verified)

- Repo: `https://github.com/benleakwerkles/Werkles1.git`
- Target path on Doss: `C:\Users\Ben Leak\Desktop\github\Werkles`
- Aligned branch: `snapshot/sally-good-werkles-2026-06-12`
- Commit: `1280361` — "snapshot: Sally good Werkles state 2026-06-12"
- Node engine used in verification: Node 22 / npm 10 (any Node 18+ LTS expected to work)
- Verified: clean `npm install` → `npm run dev` → `http://localhost:3000` returns 200 on `/`, `/pricing`, `/proof`, `/login`, `/membership`, `/dashboard` with no env configured.
- App runs without `.env` (optional `.env.local` enables Supabase/Stripe; names in `.env.example`).

## Doss-local readback (run on Doss, paste results in here)

PowerShell, read-only:

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
  Pop-Location
}
# Optional: editors / tools present
foreach ($t in 'code','cursor','pwsh') { "$t: $((Get-Command $t -ErrorAction SilentlyContinue).Source)" }
```

### Readback results (fill in)

- Machine name: `[LOCAL READBACK REQUIRED]`
- User: `[LOCAL READBACK REQUIRED]`
- OS/version: `[LOCAL READBACK REQUIRED]`
- Git: `[LOCAL READBACK REQUIRED]`
- Node: `[LOCAL READBACK REQUIRED]`
- npm: `[LOCAL READBACK REQUIRED]`
- Repo path exists: `[LOCAL READBACK REQUIRED]`
- Branch: `[LOCAL READBACK REQUIRED — should be snapshot/sally-good-werkles-2026-06-12]`
- Commit: `[LOCAL READBACK REQUIRED — should be 1280361]`
- localhost:3000 working: `[LOCAL READBACK REQUIRED — yes/no]`

## Setup commands (run on Doss; path has a space, keep quotes)

```powershell
New-Item -ItemType Directory -Force -Path "C:\Users\Ben Leak\Desktop\github" | Out-Null
cd "C:\Users\Ben Leak\Desktop\github"
git clone https://github.com/benleakwerkles/Werkles1.git Werkles
cd "C:\Users\Ben Leak\Desktop\github\Werkles"
git fetch --all --prune
git branch -r
git checkout snapshot/sally-good-werkles-2026-06-12
npm.cmd install
npm.cmd run dev
```
Then open `http://localhost:3000`. (Use `npm.cmd` so PowerShell's `npm.ps1` block never applies.)

## Audit vs Betsy

- Status: **BLOCKED** — `foreman/BETSY_BASELINE_v1.md` does not exist. Create it first (Betsy machine/tools/versions), then compare each field here against it.
- Missing tools vs Betsy: `[CANNOT DETERMINE — needs BETSY_BASELINE_v1.md + Doss readback]`

## Human gates needed

- Installing major software on Doss (Git, Node, editor) **if missing** — HG before install per the rules.
- Creating `foreman/BETSY_BASELINE_v1.md` (the reference) — needed before a real alignment audit.
- (No merge to main, no push, no app-code edits, no BIOS changes performed or required by this doc.)

## Boundaries honored

No merge to main, no app-code edits, no push, no BIOS changes. `npm.cmd` path specified. Doss-local actions are operator steps; cloud agent cannot execute them.
