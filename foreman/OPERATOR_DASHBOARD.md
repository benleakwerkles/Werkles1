# Operator Dashboard

- **Current phase:** APP_INFRA-01 — Ben human gate
- **Current step:** Read review packet → record APPROVE / PATCH / NO-GO
- **Current risk level:** LOW (decision only) / MEDIUM if PATCH opens auth/billing work later
- **Effective gate:** `[AWAITING HUMAN GATE: APP_INFRA_01_FUNCTIONAL_SURFACE_REVIEW]`

## Petra crew-checkin

**GO_WITH_CONDITIONS** — APP_INFRA-01 is the slice. Infrastructure and visual exploration are **not** the next action.

| Petra line | Status |
|------------|--------|
| GATE_05 | **PAUSE** |
| UI_COMMIT | **HOLD** |
| Maker review packet | **Done** — see below |
| Codex | Cockpit sync only |

## Review packet

**`foreman/reviews/APP_INFRA_01_FUNCTIONAL_SURFACE_REVIEW.md`**

Maker recommendation: **PATCH** (marketing/pricing/Bellows OK; login/membership/billing need preview mock or explicit Ben acceptance of live sandbox wiring).

## Ben — next hands

1. Read the review packet
2. Optional: walk http://localhost:3000 routes listed in packet
3. Record verdict in `foreman/gates/APPROVAL_LOG.md`

## APPLY / PUSH / DEPLOY

**No** — all blocked.

## Plain English

Maker finished the functional surface walkthrough. Pricing and public shells look aligned. Login and membership still talk to real providers when env is configured — Ben must decide if that’s PATCH or acceptable for preview. Ghost Forge stays parked.

## Imagery doctrine (wired — not active gate)

**`foreman/IMAGERY_DIRECTION.md`** is canonical. Viable with restrained grammar — transformation via cards, props, formation states, subtle motion; **not** morphing.

| Artifact | Path |
|----------|------|
| Doctrine | `foreman/IMAGERY_DIRECTION.md` |
| Ghost Forge prompts | `foreman/ghost-forge/IMAGERY_PROMPT_TEMPLATE.md` (Gate 05 **PAUSE**) |
| Ender wire packet | `foreman/handoffs/outbox/TO_ENDER_IMAGERY_DIRECTION_WIRE_v0.1.md` |
| Dashboard card | Foreman @ :4317 — Imagery Doctrine |

**No new assets.** **UI_COMMIT HOLD.** APP_INFRA-01 remains the product gate.
