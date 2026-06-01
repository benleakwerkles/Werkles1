# Machine Topology

Status: cockpit reference. Defines the named machines in the Werkles topology and what each is allowed to do. Pairs with `foreman/EXECUTION_CONTEXT_RULES.md` (every agent declares execution context before filesystem/repo/runtime/deploy claims).

**Source of truth is the GitHub repo `benleakwerkles/Werkles1` (`main`), not any single machine.** Machines are work surfaces; the repo is canon.

## Machines

| Name | Role | Source of truth? | Active writer? | May deploy/push/SQL/secrets/money? |
|------|------|------------------|----------------|------------------------------------|
| **Sally** | Relay brain / Aeye bay — crew coordination, relay, operator console | No (mirrors repo) | Only when named in `foreman/ACTIVE_AGENT.md` | No automatically — human gates apply |
| **Betsy** | Primary build machine — app/UI build, local dev server, primary commits | No (mirrors repo) | Yes, when named active writer | Push/deploy/SQL/secrets remain human gates |
| **Atlas** | Archive / asset vault / local worker box | **No** | **No** | **No** |

> Note: an earlier laptop was referenced as **"BLDer"** (Builder). If BLDer is the same physical machine as **Betsy**, treat them as one; otherwise the Operator should confirm the mapping. This file does not assume they are identical.

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

## Execution context mapping

| Machine / surface | Typical `EXECUTION_CONTEXT` |
|-------------------|------------------------------|
| Sally (Windows) | `LOCAL_SALLY_WINDOWS` |
| Betsy (build laptop) | `LOCAL_SALLY_WINDOWS`-class local context (declare machine name) |
| Atlas (vault box) | local context, archive-only — declare `ATLAS` intent and the archive-only limits |
| Cursor Cloud Agent | `CURSOR_CLOUD_CONTAINER` |
| Codex | `CODEX_LOCAL` (must declare local vs sandboxed) |
| Cowork browser | `COWORK_BROWSER` |

A cloud agent (`CURSOR_CLOUD_CONTAINER`) cannot inspect any machine's local filesystem, local `.env`, or local dev server; it must request a local check. See `foreman/EXECUTION_CONTEXT_RULES.md`.
