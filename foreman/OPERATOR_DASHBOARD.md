# Operator Dashboard

- **Current phase:** Supabase Auth + Stripe test wiring
- **Current step:** `foreman/gates/OAUTH_STRIPE_OPERATOR_CHECKLIST.md`
- **Current risk level:** MEDIUM (provider consoles; Ben-only secrets)
- **Effective gate:** `[IN PROGRESS: SUPABASE_AUTH_STRIPE_TEST_WIRING]`

## Petra crew-checkin

**GO_WITH_CONDITIONS** — APP_INFRA-01 is the slice. Infrastructure and visual exploration are **not** the next action.

| Petra line | Status |
|------------|--------|
| GATE_05 | **PAUSE** |
| UI_COMMIT | **OPEN** |
| APP_INFRA-01 | **APPROVED** (2026-06-03) |
| Codex | Cockpit sync only |

## Review packet

**`foreman/reviews/APP_INFRA_01_FUNCTIONAL_SURFACE_REVIEW.md`**

Ben **APPROVED** preview-gated functional surfaces (commit `02bf718`).

## Ben — next hands

1. `foreman/gates/OAUTH_STRIPE_OPERATOR_CHECKLIST.md` — Supabase redirect URLs + keys
2. Stripe test products, webhook, test checkout
3. Record each provider milestone in `foreman/gates/APPROVAL_LOG.md`

## APPLY / PUSH / DEPLOY

**No** — all blocked.

## Plain English

APP_INFRA-01 closed with preview-safe surfaces approved. Next slice is Supabase + Stripe **test** wiring (operator checklist). Ghost Forge stays parked.

## Imagery doctrine (wired — not active gate)

**`foreman/IMAGERY_DIRECTION.md`** is canonical. Viable with restrained grammar — transformation via cards, props, formation states, subtle motion; **not** morphing.

| Artifact | Path |
|----------|------|
| Doctrine | `foreman/IMAGERY_DIRECTION.md` |
| Ghost Forge prompts | `foreman/ghost-forge/IMAGERY_PROMPT_TEMPLATE.md` (Gate 05 **PAUSE**) |
| Ender wire packet | `foreman/handoffs/outbox/TO_ENDER_IMAGERY_DIRECTION_WIRE_v0.1.md` |
| Dashboard card | Foreman @ :4317 — Imagery Doctrine |

**No new assets.** **UI_COMMIT OPEN.** Gate 05 spend still **PAUSE**.
