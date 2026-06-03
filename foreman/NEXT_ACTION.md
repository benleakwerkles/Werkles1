# NEXT ACTION

**Effective gate:** `[IN PROGRESS: SUPABASE_AUTH_STRIPE_TEST_WIRING]`

---

## Ben (Operator) — APP_INFRA-01 closed (2026-06-03)

**Verdict:** **APPROVE** — recorded in `foreman/gates/APPROVAL_LOG.md`.

**Next hands:** Follow **`foreman/gates/OAUTH_STRIPE_OPERATOR_CHECKLIST.md`** (Supabase Auth URL + keys → Stripe test mode → webhook → test checkout).

**Preview flag:** `APP_INFRA_PREVIEW` remains `true` in `lib/app-infra-preview.ts` until you flip it for test wiring or deploy prep.

---

## Petra verdict — crew-checkin (2026-05-31)

**VERDICT: GO_WITH_CONDITIONS** — human gate **closed** with Ben **APPROVE**.

**GATE_05:** **PAUSE** — APP_INFRA-01 closed; Ghost Forge image spend still needs separate budget/render gate.

**UI_COMMIT:** **OPEN** — app UI commits allowed per lane; push/deploy/SQL/secrets remain human gates.

**Maker deliverable:** `foreman/reviews/APP_INFRA_01_FUNCTIONAL_SURFACE_REVIEW.md` — Ben **APPROVED** preview-gated surfaces (`02bf718`).

---

## Maker (Cursor) — parked for provider wiring

- **No** deploy, push, SQL, secrets entry, Ghost Forge, Education Forge worker
- Provider consoles: Ben-only per checklist
- Routine typecheck/build = non-gates inside approved scope

---

## Codex — on request

- Cockpit sync after provider milestones (record each in `APPROVAL_LOG.md`)

---

## Conditions (active)

- Supabase + Stripe **test** wiring is the slice — operator checklist order
- No Stripe **live** until test webhook + checkout pass
- No Ghost Forge spend (Gate 05 PAUSE)
- No Bellows content generation until D lane gate
- No push / deploy / SQL / secrets from automation

---

## Gate 05 — PAUSE

| Metric | Value |
|--------|--------|
| Landed | 12/40 style variants |
| Status | **PAUSE** |
| Resume | Separate approval only |

---

## Hard stops

no deploy | no push | no SQL | no secrets | no Ghost Forge | no Education Forge worker | no external Aeye Send unless separately requested
