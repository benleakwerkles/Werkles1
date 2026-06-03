# Current State

Status: synced 2026-06-03 (Ben APPROVE — APP_INFRA-01 functional surface review closed)

## Effective gate

`[IN PROGRESS: SUPABASE_AUTH_STRIPE_TEST_WIRING]`

Operator guide: `foreman/gates/OAUTH_STRIPE_OPERATOR_CHECKLIST.md`

## APP_INFRA-01 (closed)

- **Ben verdict:** **APPROVE** (2026-06-03) — `foreman/gates/APPROVAL_LOG.md`
- **App commit:** `02bf718` — preview-safe surfaces (`APP_INFRA_PREVIEW = true`)
- **UI_COMMIT:** **OPEN**
- **GATE_05:** **PAUSE** (separate render gate still required for Ghost Forge spend)

## Morale deploy (complete)

- **Live:** https://werkles.com (`main` @ `60f74c8`, pushed)
- Crawler-walled preview — not public launch

## Operator UX Reset (accepted)

Foreman Control Panel, Relay Courier, dispatch policy, context health, return paths, Bean hardening, Finance scaffold — accepted prior gate.

## APP_INFRA-01 review summary (post-patch + APPROVE)

| Area | Result |
|------|--------|
| Route loads (8/8) | PASS |
| Pricing anchors | PASS vs `company/PRICING.md` |
| Bellows shell | PASS |
| Login / signup / membership / billing / crucible | PASS under preview gate |
| API POST guards | PASS when preview on |

## Ghost Forge / Gate 05

**PAUSE** — separate budget/render gate before image spend resumes.

## Imagery doctrine (wired 2026-05-31)

**Source:** `foreman/IMAGERY_DIRECTION.md` · **UI_COMMIT OPEN** for lane work; Gate 05 spend still paused.

## Hard stops

no deploy | no push | no SQL | no secrets | no Ghost Forge | no Education Forge worker
