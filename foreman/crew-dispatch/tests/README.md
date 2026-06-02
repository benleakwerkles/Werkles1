# Crew Relay — fixture tests

Run from repo root:

```powershell
node foreman/crew-dispatch/crew-response-intake.mjs run-fixtures
```

Or:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File foreman/crew-dispatch/crew-response-intake.ps1 -Action RunFixtures
```

## Cases (`tests/fixtures/`)

| Fixture | Expected |
|---------|----------|
| `fresh-response-passes.md` | PASS validation |
| `stale-response.md` | `STALE_DO_NOT_APPLY` (wrong nextActionHash) |
| `missing-source.md` | Rejected — missing source_packet_id/file |
| `filename-source-mismatch.md` | Rejected — `FROM_BEAN_*` with PETRA metadata |
| `malformed-response.md` | Rejected — bad JSON block |
| `conflict-response-a/b.md` | Conflict when both in inbox |
| `overreach-bean-deploy.md` | Warning — Bean recommending deploy |
| (programmatic) | `--dry-run` process moves nothing |

Placeholders in fixtures:

- `__NEXT_ACTION_HASH__` — replaced with live hash at test time
- `__CURRENT_STATE_HASH__` — replaced with live hash if file exists
- `__STALE_HASH__` — intentional stale hash for stale test

## Do not process real cousin responses until fixtures pass

No auto-merge. No deploy. No push. No SQL.
