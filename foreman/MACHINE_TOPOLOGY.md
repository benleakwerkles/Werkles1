# Machine Topology

Status: cockpit reference — **machine registry + forge roles**. Pairs with `foreman/EXECUTION_CONTEXT_RULES.md` (LOCAL HANDS READBACK required before hands-capable agents mutate repo/runtime state).

**Source of truth is the GitHub repo `benleakwerkles/Werkles1` (`main`), not any single machine.** Machines are work surfaces; the repo is canon.

**Registry rule:** Do not rename machines by guess. Do not mark **Doss** PASS without a live Doss readback (`LOCAL_DOSS_WINDOWS` or a confirmed Windows hostname). Update this file after every LOCAL HANDS READBACK that changes branch, commit, path, or localhost state.

---

## Machine registry

| Human name | Windows hostname | Primary repo path | Current branch | Current commit | Forge role | Localhost | Evidence |
|------------|------------------|-------------------|----------------|----------------|------------|-----------|----------|
| **Sally** | `DESKTOP-SJSJMNK` | `C:\Users\benle\Desktop\github\Werkles` | `rescue/sally-dirty-worktree-2026-06-01` | `8ba905b` | **mirror forge** | `:3000` running on host (live) | Live readback 2026-06-12 on `DESKTOP-SJSJMNK`; historical: `foreman/reviews/WORKTREE_STABILIZATION_2026-06-01.md`, `FROM_DINK_BETSY_SETUP_RECORD_V1.md` |
| **Sally** *(second surface, same host)* | `DESKTOP-SJSJMNK` | `C:\Dev\Werkles` | `snapshot/sally-good-werkles-2026-06-12` | `437792b` | **mirror forge** (snapshot lane) | shares host `:3000` (live) | Live readback 2026-06-12 on `DESKTOP-SJSJMNK` |
| **Betsy** | `DESKTOP-KTBH0LA` | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | **primary forge** (intended) | **UNKNOWN** | Operator prior readback only — **no live readback this session** |
| **Doss** | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | **UNASSIGNED** | **UNKNOWN** | **NOT PROVEN** — awaiting `LOCAL_DOSS_WINDOWS` readback or confirmed hostname |
| **Atlas** | **UNKNOWN** | vault path per `foreman/ATLAS_MACHINE_PLAN.md` | n/a (not a git writer) | n/a | **archive forge** | n/a | Plan doc only — no live readback recorded |

### Sally work-surface detail (live 2026-06-12, host `DESKTOP-SJSJMNK`)

| Path | Branch | Commit | Working tree | Notes |
|------|--------|--------|--------------|-------|
| `C:\Users\benle\Desktop\github\Werkles` | `rescue/sally-dirty-worktree-2026-06-01` | `8ba905b` | **dirty** (modified + untracked; ahead of origin rescue by 27) | Historical Sally relay path. **Do not switch branch or reset without explicit Operator approval.** |
| `C:\Dev\Werkles` | `snapshot/sally-good-werkles-2026-06-12` | `437792b` | **clean** (synced with `origin/snapshot/sally-good-werkles-2026-06-12`) | Snapshot lane; current Maker session workspace. |

**Localhost on `DESKTOP-SJSJMNK`:** `127.0.0.1:3000` listening (live). Foreman/GD default `4317` not observed listening at last readback.

### Betsy (unverified live)

Operator reports `DESKTOP-KTBH0LA` as Betsy from a prior readback. Dink handoff `FROM_DINK_BETSY_SETUP_RECORD_V1.md` explicitly states **`DESKTOP-SJSJMNK` is not confirmed Betsy**. Treat Betsy repo path, branch, commit, and localhost as **UNKNOWN** until a readback is taken **on `DESKTOP-KTBH0LA`**.

Intended primary path per Dink critical-path note: `C:\Users\benle\Desktop\github\Werkles` **on Betsy** — not verified.

### Doss (unproven machine)

**Doss machine identity is unresolved.**

- `foreman/handoffs/live/DOSS_HANDOFF.md` defines **Doss** as a live handoff operator surface (task routing), not proof of a Windows host.
- No `LOCAL_DOSS_WINDOWS` readback and no confirmed hostname are on record.
- **Do not mark Doss PASS** for branch verification until live evidence exists.

---

## Unresolved identity conflicts

1. **Two Werkles clones on Sally (`DESKTOP-SJSJMNK`)** — rescue mirror at Desktop path vs clean snapshot at `C:\Dev\Werkles`. Same host, different branches/commits. Operator must name which surface is canonical for each task.
2. **Betsy hostname vs Sally hostname** — prior Operator readback maps Betsy → `DESKTOP-KTBH0LA`; live session and Dink records map Sally work to `DESKTOP-SJSJMNK`. These are **different hosts**; do not collapse them without Operator confirmation.
3. **Doss: machine vs operator role** — live handoff files use "Doss" as a crew operator name. Physical machine mapping (hostname, repo path, forge role) is **still unknown**.
4. **BLDer legacy name** — earlier docs reference **BLDer** (Builder). Relationship to Betsy is unconfirmed. Do not alias BLDer → Betsy without Operator say-so.

---

## Forge roles (definitions)

| Role | Meaning | Typical machine |
|------|---------|-----------------|
| **primary forge** | Main app/UI build, local dev server, primary commits | Betsy (when live-verified) |
| **mirror forge** | Relay/coordination, rescue lanes, snapshot lanes, crew bay | Sally |
| **archive forge** | Backups, asset vault, non-critical jobs — not canon writer | Atlas |

Legacy permission matrix (unchanged intent):

| Name | Source of truth? | Active writer? | May deploy/push/SQL/secrets/money? |
|------|------------------|----------------|------------------------------------|
| **Sally** | No (mirrors repo) | Only when named in `foreman/ACTIVE_AGENT.md` | No automatically — human gates apply |
| **Betsy** | No (mirrors repo) | Yes, when named active writer | Push/deploy/SQL/secrets remain human gates |
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
| Doss (when proven) | `LOCAL_DOSS_WINDOWS` (reserved) | confirmed hostname only |
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

**Last registry readback:** 2026-06-12 — `DESKTOP-SJSJMNK` (Sally), Maker session, paths above.
