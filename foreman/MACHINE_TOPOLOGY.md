# Machine Topology

Status: cockpit reference — **machine registry + forge roles**. Pairs with `foreman/EXECUTION_CONTEXT_RULES.md` (LOCAL HANDS READBACK required before hands-capable agents mutate repo/runtime state).

**Source of truth is the GitHub repo `benleakwerkles/Werkles1` (`main`), not any single machine.** Machines are work surfaces; the repo is canon.

**Registry rule:** Do not rename machines by guess. Update this file after every LOCAL HANDS READBACK that changes branch, commit, path, or localhost state. **Doss** is the canonical machine name for hostname `BLDER`. Formerly referenced as BLDer.

**Naming rule:** Machine names are canonical. Hostnames are evidence. Agent names are roles. Runtimes are tools.

**Doss note:** Doss is the canonical mobile/mirror forge. BLDer is retired as a machine name.

---

## Canonical Workstation Software Stack

Required on Aeye workstations:

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

## Google Drive Rules

Google Drive = Warehouse.

GitHub Repo = Factory.

Drive stores documents.

Git stores code.

Do not:

- put the Werkles repo inside Google Drive
- put Google Drive inside the Werkles repo
- sync `node_modules`
- sync `.git`
- sync `.next`
- sync local build artifacts
- mix company archives with code workspaces

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

## Active Topology Locks

### Ender@Sally retirement lock (2026-06-26)

Capsule: `foreman/change-capsules/CHANGE_CAPSULE_ENDER_SALLY_RETIRED.json`

Status: **ACTIVE** until Sally receives a RAM upgrade and a new availability receipt clears this lock.

Routing rule:

- Do not assign new meals, packets, audits, cleanup tasks, or filtration work to **Ender@Sally**.
- Treat deletion/filtration work as **HELD** unless another Ender machine is explicitly assigned with proof of availability.
- Prefer **Swanson@Doss** for topology and receipt ledgers.
- Do not silently move Ender to another machine without proof of availability.

Source receipt: Operator correction in current thread - "Ender@Sally is retired until some new RAM comes in for Sally."

## Guardrails

No workstation may:

- place repos inside Drive
- place Drive inside repos
- mix company archives with code workspaces

---

## Machine registry

| Human name | Windows hostname | Primary repo path | Current branch | Current commit | Forge role | Localhost | Evidence |
|------------|------------------|-------------------|----------------|----------------|------------|-----------|----------|
| **Sally** | `DESKTOP-SJSJMNK` | `C:\Users\benle\Desktop\github\Werkles` | `rescue/sally-dirty-worktree-2026-06-01` | `8ba905b` | **archive/snapshot surface** | `:3000` running on host (live) | Live readback 2026-06-12 on `DESKTOP-SJSJMNK`; historical: `foreman/reviews/WORKTREE_STABILIZATION_2026-06-01.md`, `FROM_DINK_BETSY_SETUP_RECORD_V1.md` |
| **Sally** *(second surface, same host)* | `DESKTOP-SJSJMNK` | `C:\Dev\Werkles` | `snapshot/sally-good-werkles-2026-06-12` | `437792b` | **archive/snapshot surface** (snapshot lane) | shares host `:3000` (live) | Live readback 2026-06-12 on `DESKTOP-SJSJMNK` |
| **Betsy** | `DESKTOP-KTBH0LA` | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | **primary forge** (intended) | **UNKNOWN** | Operator prior readback only — **no live readback this session** |
| **Doss** | `BLDER` | `C:\Users\BenLeak\Desktop\github\Werkles` | `snapshot/sally-good-werkles-2026-06-12` | `8411561` | **mobile/mirror forge** | `/soledash` → Foreman `:4317` (200 OK) | Live readback 2026-06-12 on hostname `BLDER`; formerly referenced as BLDer; launcher `C:\Users\BenLeak\Desktop\soledash.cmd` |
| **Atlas** | **UNKNOWN** | vault path per `foreman/ATLAS_MACHINE_PLAN.md` | n/a (not a git writer) | n/a | **archive forge** | n/a | Plan doc only — no live readback recorded |

### Sally work-surface detail (live 2026-06-12, host `DESKTOP-SJSJMNK`)

**Ender@Sally status:** retired until Sally RAM upgrade. No Ender cleanup, filtration, review packets, meals, or audits route to Sally without a new clearing receipt.

| Path | Branch | Commit | Working tree | Notes |
|------|--------|--------|--------------|-------|
| `C:\Users\benle\Desktop\github\Werkles` | `rescue/sally-dirty-worktree-2026-06-01` | `8ba905b` | **dirty** (modified + untracked; ahead of origin rescue by 27) | Historical Sally relay path. **Do not switch branch or reset without explicit Operator approval.** |
| `C:\Dev\Werkles` | `snapshot/sally-good-werkles-2026-06-12` | `437792b` | **clean** (synced with `origin/snapshot/sally-good-werkles-2026-06-12`) | Snapshot lane; current Maker session workspace. |

**Localhost on `DESKTOP-SJSJMNK`:** `127.0.0.1:3000` listening (live). Foreman/GD default `4317` not observed listening at last readback.

### Betsy (unverified live)

Operator reports `DESKTOP-KTBH0LA` as Betsy from a prior readback. Dink handoff `FROM_DINK_BETSY_SETUP_RECORD_V1.md` explicitly states **`DESKTOP-SJSJMNK` is not confirmed Betsy**. Treat Betsy repo path, branch, commit, and localhost as **UNKNOWN** until a readback is taken **on `DESKTOP-KTBH0LA`**.

Intended primary path per Dink critical-path note: `C:\Users\benle\Desktop\github\Werkles` **on Betsy** — not verified.

### Doss (live 2026-06-12, hostname `BLDER`)

| Field | Value |
|-------|-------|
| Human name | **Doss** |
| Windows hostname | `BLDER` |
| Primary repo path | `C:\Users\BenLeak\Desktop\github\Werkles` |
| Branch | `snapshot/sally-good-werkles-2026-06-12` |
| Commit | `8411561` |
| Forge role | **mobile/mirror forge** |
| Launcher | `C:\Users\BenLeak\Desktop\soledash.cmd` |
| Localhost | `http://localhost:3000/soledash` redirects to Foreman cockpit at `:4317` — **200 OK** |

**Alias history:** Formerly referenced as BLDer.

**Localhost on hostname `BLDER`:** `:3000` (Werkles dev) and `:4317` (Foreman / SoleDash cockpit) verified live 2026-06-12.

**Power policy (2026-06-13):** AC sleep **never** (MWB / forge disconnect fix). Battery: 30 min sleep, 15 min display. See `foreman/machines/DOSS_SLEEP_MWB_DISCONNECT_V1.md`.

---

## Unresolved identity conflicts

1. **Two Werkles clones on Sally (`DESKTOP-SJSJMNK`)** — rescue mirror at Desktop path vs clean snapshot at `C:\Dev\Werkles`. Same host, different branches/commits. Operator must name which surface is canonical for each task.
2. **Betsy hostname vs Sally hostname** — prior Operator readback maps Betsy → `DESKTOP-KTBH0LA`; live session and Dink records map Sally work to `DESKTOP-SJSJMNK`. These are **different hosts**; do not collapse them without Operator confirmation.
3. **Doss canonical name** — Doss is the canonical mobile/mirror forge. Hostname `BLDER` is evidence only. Formerly referenced as BLDer. Do not alias Doss to Betsy.

---

## Forge roles (definitions)

| Role | Meaning | Typical machine |
|------|---------|-----------------|
| **primary forge** | Main app/UI build, local dev server, primary commits | Betsy (when live-verified) |
| **mobile/mirror forge** | Portable mirror surface; snapshot lane + SoleDash launcher | Doss |
| **archive/snapshot surface** | Archive work, snapshots, historical records, non-primary local surfaces | Sally |
| **archive forge** | Backups, asset vault, non-critical jobs — not canon writer | Atlas |

Legacy permission matrix (unchanged intent):

| Name | Source of truth? | Active writer? | May deploy/push/SQL/secrets/money? |
|------|------------------|----------------|------------------------------------|
| **Sally** | No (archive/snapshot surface) | Only when named in `foreman/ACTIVE_AGENT.md` | No automatically — human gates apply |
| **Betsy** | No (mirrors repo) | Yes, when named active writer | Push/deploy/SQL/secrets remain human gates |
| **Doss** | No (mirrors repo) | Snapshot lane when named | No automatically — human gates apply |
| **Atlas** | **No** | **No** | **No** |

---

## Atlas — boundaries (summary)

Atlas is **not** the source of truth and **not** the main active writer. Atlas must **not** deploy, push, apply SQL, hold secrets, or move money. Full plan: `foreman/ATLAS_MACHINE_PLAN.md`.

Atlas **may** be used for:

- repo backups
- asset vault
- screenshot / log archive
- Ghost Forge output archive
- Bellows draft archive
- local preview mirror
- file indexing / search
- non-critical background jobs
- optional local image/video experiments

---

## Execution context mapping

| Machine / surface | Typical `EXECUTION_CONTEXT` | LOCAL HANDS READBACK machine field |
|-------------------|------------------------------|-------------------------------------|
| Sally (`DESKTOP-SJSJMNK`) | `LOCAL_SALLY_WINDOWS` | `DESKTOP-SJSJMNK` |
| Betsy (`DESKTOP-KTBH0LA` when verified) | `LOCAL_SALLY_WINDOWS`-class (declare **Betsy** + hostname) | `DESKTOP-KTBH0LA` |
| Doss (hostname `BLDER`) | `LOCAL_DOSS_WINDOWS` | `Doss`; hostname field must report `BLDER` |
| Atlas (vault box) | local context, archive-only — declare `ATLAS` intent | confirmed hostname only |
| Cursor Cloud Agent | `CURSOR_CLOUD_CONTAINER` | n/a |
| Codex | `CODEX_LOCAL` (must declare local vs sandboxed) | declare actual hostname |
| Cowork browser | `COWORK_BROWSER` | n/a |

A cloud agent (`CURSOR_CLOUD_CONTAINER`) cannot inspect any machine's local filesystem, local `.env`, or local dev server; it must request a local check. See `foreman/EXECUTION_CONTEXT_RULES.md`.

---

## Registry update checklist

When taking LOCAL HANDS READBACK on any forge machine, update the registry row for:

1. Windows hostname
2. Repo path used for the session
3. `git branch --show-current`
4. `git rev-parse --short HEAD`
5. `git status -sb` summary
6. localhost running yes/no and port
7. Evidence source: `live readback YYYY-MM-DD` or cite handoff path

**Last registry readback:** 2026-06-12 — Doss on hostname `BLDER`, SoleDash v0 install session, path above. Formerly referenced as BLDer.
