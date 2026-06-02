# Current State

Status: synced 2026-05-31 (Petra crew-checkin GO_WITH_CONDITIONS; APP_INFRA-01 review packet produced)

## Effective gate

`[AWAITING HUMAN GATE: APP_INFRA_01_FUNCTIONAL_SURFACE_REVIEW]`

Ben reads `foreman/reviews/APP_INFRA_01_FUNCTIONAL_SURFACE_REVIEW.md` and records APPROVE / PATCH / NO-GO.

## Petra crew-checkin (2026-05-31)

- **VERDICT:** GO_WITH_CONDITIONS
- **SLICE:** APP_INFRA-01 functional surface review
- **GATE_05:** PAUSE
- **UI_COMMIT:** HOLD
- **Maker review packet:** `foreman/reviews/APP_INFRA_01_FUNCTIONAL_SURFACE_REVIEW.md` — recommendation **PATCH**

## Morale deploy (complete)

- **Live:** https://werkles.com (`main` @ `60f74c8`, pushed)
- Crawler-walled preview — not public launch

## Operator UX Reset (accepted)

Foreman Control Panel, Relay Courier, dispatch policy, context health, return paths, Bean hardening, Finance scaffold — accepted prior gate.

## APP_INFRA-01 review summary

| Area | Result |
|------|--------|
| Route loads (8/8) | PASS — HTTP 200 local |
| Pricing anchors | PASS vs `company/PRICING.md` |
| Bellows | PASS — learning shell, not Education Forge worker |
| Login preview-only | FAIL — live Supabase auth when env set |
| Membership | PATCH — Stripe checkout wired when authenticated |
| Crucible | PARTIAL — sandbox APIs; not read-only mock UI |
| Billing shell | PARTIAL — portal blocked; live profile reads |

## Ghost Forge / Gate 05

**PAUSE** — do not resume image spend until APP_INFRA-01 closes or separate gate opens.

## Imagery doctrine (wired 2026-05-31)

**Source:** `foreman/IMAGERY_DIRECTION.md` · Ghost Forge prompts: `foreman/ghost-forge/IMAGERY_PROMPT_TEMPLATE.md`

**Recorded:** viable with restrained visual grammar. Transformation via **cards, formation states, props, subtle motion** — **not** literal magical morphing.

**Ender wire packet:** `foreman/handoffs/outbox/TO_ENDER_IMAGERY_DIRECTION_WIRE_v0.1.md` — placement/motion review only; **UI_COMMIT HOLD**; no new assets.

**Foreman dashboard:** Imagery Doctrine card @ http://localhost:4317

## Hard stops

no deploy | no push | no SQL | no secrets | no Ghost Forge | no Education Forge worker
