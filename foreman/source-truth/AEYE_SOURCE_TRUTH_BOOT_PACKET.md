# AEYE_SOURCE_TRUTH_BOOT_PACKET

Status: DRAFT V0
Owner: Swanson@Doss
Destination: All Aeyes

## Purpose

Stop Aeyes from operating from local memory, stale branch names, preview URLs, screenshots, or chat-only receipts.

## First Action

Before claiming shared reality, run:

```powershell
npm.cmd run truth:guard
```

If you are preparing or updating shared source-truth artifacts, run:

```powershell
npm.cmd run truth:pulse
```

## Allowed Claims

If `truth:guard` returns `CANONICAL_MATCH`, you may say:

- `GitHub origin/main is visible and this workspace matches it.`

If `truth:guard` returns `NONCANONICAL_WORKSPACE`, you may say only:

- `This workspace is evidence or candidate work.`
- `GitHub origin/main remains source truth.`

## Forbidden Claims

Do not say:

- `local branch is canonical`
- `preview branch is canonical`
- `receipt exists, therefore source truth changed`
- `Atlas mirror is source truth`
- `Speaker ratified this`

## Required Output

Every Aeye source-truth check must return one of:

- `ACK` with guard/readback receipt path
- `BLOCKER` with exact missing access/path
- `ARTIFACT` with GitHub branch/hash and receipt path

## Human Gate

Only Ben/Petra can promote candidate truth to GitHub `main`.

Until then:

`candidate != canonical`
