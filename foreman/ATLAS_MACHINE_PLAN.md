# Atlas Machine Plan

Status: cockpit plan. Atlas = archive / asset vault / local worker box. Part of the topology in `foreman/MACHINE_TOPOLOGY.md`.

## Role

Atlas is a **storage / archive / non-critical worker** box. It keeps copies and runs throwaway jobs. It never holds canon and never takes privileged actions.

## Hard boundaries

Atlas must NOT:

- be treated as the source of truth (canon is GitHub `Werkles1` `main`)
- be the main active writer (see `foreman/ACTIVE_AGENT.md`)
- deploy
- push to `main` or any shared branch as the authoritative writer
- apply SQL / schema / RLS
- hold or enter secrets, API keys, tokens, or credentials
- move money or touch billing/payment
- run Ghost Forge or Bellows as production (live, spend-bearing) jobs

Anything in the above list remains a human gate handled on the appropriate machine, not Atlas.

## Allowed uses

- **Repo backups** — periodic mirror of active repo artifacts into the Atlas vault (no secrets, no `.git`).
- **Asset vault** — long-term storage of draft/approved images, exports, design source files.
- **Screenshot / log archive** — UI screenshots, run logs, review captures.
- **Ghost Forge output archive** — copies of generated images for reference (including rejects, "what not to do").
- **Bellows draft archive** — draft framework/source preservation copies (ingest/source-preservation lane only).
- **Local preview mirror** — a local copy to run `npm run dev` previews without touching Betsy.
- **File indexing / search** — index the vault for fast lookup.
- **Non-critical background jobs** — batch resizing, thumbnailing, dedupe, checksum runs.
- **Optional local image/video experiments** — sandbox only; not brand-approved output.

## Vault layout (suggested)

```text
<AtlasVault>/werkles/
  repo-mirror/          # mirror of active repo artifacts (no node_modules/.next/.git/secrets)
  assets/               # asset vault (images, exports, design sources)
  ghost-forge-archive/  # generated image archive incl. rejects
  bellows-drafts/       # Bellows source/draft preservation
  screenshots/          # UI/review captures
  logs/                 # run + backup logs
  index/                # search index output
  backup-log.txt        # append-only mirror run log
```

## Mirror workflow

Use `scripts/foreman/mirror-werkles-to-atlas.ps1`:

1. **Dry-run first** (default): lists what would copy, copies nothing.
2. Review the planned file list + counts.
3. Re-run with `-Execute` to perform the copy.
4. Script appends a backup-log entry (timestamp, mode, counts, source, dest).

Mirror guarantees:

- copy-only — **never deletes source files**
- never deletes vault files (no purge/mirror-delete)
- excludes `node_modules`, `.next`, `.git`, `.env*`, `*.local_token`, and common secret patterns
- never pushes, deploys, or applies SQL

## Restore note

Atlas is a convenience copy, not a recovery system of record. Authoritative restore is always `git clone`/`git pull` from `origin`. Vault copies help with large binary assets and history that may not live in git.

## Setup checklist (Operator, when ready)

1. Choose the Atlas vault path (external drive or dedicated folder).
2. On Atlas (or the machine writing to it), run the mirror script in dry-run; confirm exclusions look right.
3. Run with `-Execute`; confirm `backup-log.txt` entry.
4. Schedule as a non-critical background job if desired (no secrets, no network push).
