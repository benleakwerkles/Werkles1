# NEXT ACTION

Cockpit sync: 2026-06-01. Source of truth for scope; pairs with `foreman/OPERATOR_DASHBOARD.md` (Gimp Dash), `foreman/LANES.md`, `foreman/BUDGET.md`, `foreman/HUMAN_GATES.md`, `foreman/EXECUTION_CONTEXT_RULES.md`.

## Recently merged to `main`

- **PR #2 — Execution Context doctrine** (merge `d578cea`): agents must declare execution context before filesystem/repo-state/runtime/deploy claims. New rule file `foreman/EXECUTION_CONTEXT_RULES.md`.
- **PR #1 — Gimp Dash + cockpit sync** (merge `368c17d`): refreshed Operator Dashboard (Gimp Dash), clickable Human-Gates list, `CURRENT_STATE` sync, Petra check-in v0.2.

Both Operator-approved and recorded in `foreman/gates/APPROVAL_LOG.md`.

## Current status

- **Gate 05 / Ghost Forge: PAUSED.** No image batches active. Any resume is a deliberate Operator action inside the approved lane + budget, with `GHOST_FORGE_API_KEY` held privately in a local terminal (never in chat). 12/40 style variants remain landed; 28 unbuilt.
- **Bellows: not active.** Source/framework stays in the source-preservation / ingest lane only; no live Bellows runs.
- **Imagery direction: captured pending local verification.** Latest Sally report says `foreman/IMAGERY_DIRECTION.md` exists, status direction locked 2026-05-31, and Ender imagery packet is prepared. Gate 05 remains paused. Next visual action, if opened, is Ender Tests 1–3 UI-only card/formation implementation, not Ghost Forge image generation.

## Active human gate

- **APP_INFRA-01 — Functional Surface Review** remains the active human gate unless already closed. Before opening new app work, confirm current cockpit state and review packet status. (Maps to `[AWAITING HUMAN GATE: APP_INFRA_REVIEW]` in `foreman/APP_INFRA_UX_START_PACKET.md`; Comptroller/Petra packet at `foreman/handoffs/outbox/TO_PETRA_COMPTROLLER_CREW_CHECKIN_v0.2.md` / `PETRA_PASTE_BLOCK_v0.2.txt`.)
- **Gate link console:** run `node scripts/foreman/foreman-control-server.mjs` → http://127.0.0.1:4317 for the Human Gates Console (APP_INFRA preview routes, repo/PRs, provider dashboards; SAFE/HUMAN GATE/BLOCKED). Read-only; see `foreman/control-panel/README.md`.

## Pending (not Ghost Forge)

- **Ender visual Tests 1–3:** pending **Maker implementation/review** in the app UI — these are visual/UX checks, **not** Ghost Forge image generation.
- **Squibb cutout:** manual Ben cutout → `public/assets/mascot/brass-foreman-full.png` + bust per `foreman/MASCOT_RULES.md` → then `ASSETS_LANDED`. Not Ghost Forge.

## Hard stops (nothing below is active)

no deploy | no push without explicit approval after local commit | no SQL | no secrets in chat | no Ghost Forge | no Bellows | no app/product code change unless an approved slice opens it

## Execution context reminder

Every agent declares `EXECUTION_CONTEXT` before filesystem/repo/runtime/deploy claims. A `CURSOR_CLOUD_CONTAINER` agent acts on `/workspace` + GitHub/PRs only and must request a `LOCAL_SALLY_WINDOWS` check for any Sally-local evidence (see `foreman/EXECUTION_CONTEXT_RULES.md`).
