# FROM_MAKER_SOLEDASH_ONBOARDING_SURFACE_V1

Date: 2026-06-12
Author: Maker (Cursor) · EXECUTION_CONTEXT: CURSOR_CLOUD_CONTAINER
Type: **proposal / panel structure only** — no build.
Naming: SoleDash = visible UI name · GD = legacy/internal shorthand · GimpDash = deprecated.

## The question

If a new cousin (AI or human) entered SoleDash with **zero context**, what do they need *immediately* — before they can safely act?

## What they need immediately (prioritized)

1. **Where am I + what is this?** SoleDash = the operator command console for Werkles. Read-only status surface, not a place that performs gated actions.
2. **Declare your execution context.** Before any filesystem/repo/runtime/deploy claim, state one of `LOCAL_SALLY_WINDOWS | CURSOR_CLOUD_CONTAINER | CODEX_LOCAL | COWORK_BROWSER | UNKNOWN`. A cloud agent cannot see local files — it must request a local check. (Source: `foreman/EXECUTION_CONTEXT_RULES.md`.)
3. **Source of truth.** Repo cockpit files are canon; chat memory is not scope. Conflict order: HUMAN_GATES → LANES → BUDGET → NEXT_ACTION → AI_COUSINS_PROTOCOL → shims.
4. **Who's who.** The cast and the active writer, so the cousin doesn't collide or impersonate a lane.
5. **What's happening right now.** The active human gate, what's paused, what's in flight (from `NEXT_ACTION.md`).
6. **What they may NOT do.** Human gates + hard stops + secret boundary — the lines that need Ben.
7. **How to read "what happened to what I sent."** Inbox / Outbox / Receipts + the status-state legend.
8. **How to act correctly.** Read NEXT_ACTION → declare context → propose on a branch + draft PR → never merge/push to main/deploy without Ben.

## Proposed onboarding panel structure

A collapsible **"Start Here"** panel pinned at the very top of SoleDash (above the Status Layer), dismissible per session. Six cards:

### Card 1 — You are in SoleDash
- One line: what SoleDash is (read-only operator command console).
- Naming note: SoleDash (visible) · GD (internal) · GimpDash (deprecated).
- Build/version + last cockpit-sync date.

### Card 2 — Declare your context (gate to everything else)
- The five `EXECUTION_CONTEXT` values + a one-line "can / cannot see" for each.
- Callout: "Cloud agents cannot read local Sally/Betsy files or `.env` — request a local check."
- Link: `foreman/EXECUTION_CONTEXT_RULES.md`.

### Card 3 — Source of truth + cast
- "Repo cockpit files are canon; chat memory is not scope."
- Conflict-precedence list.
- Cast table: Ben (Operator), Maker (Cursor), Codex (Foreman), Petra (Comptroller), Ender (Claude), Ghost Forge, Bellows; machines Sally / Betsy / Atlas.
- Current **active writer** (from `ACTIVE_AGENT.md`).

### Card 4 — Right now
- Active human gate (e.g., APP_INFRA-01 Functional Surface Review).
- Paused/blocked (e.g., Gate 05 / Ghost Forge).
- Pointer to `NEXT_ACTION.md`. (Mirrors the Status Layer.)

### Card 5 — Hard stops + secret boundary
- Human gates: login/OAuth, billing, secrets in chat, push-to-main/deploy/SQL/production-data, final brand lock, spend over caps.
- "Never paste secret values; env var *names* are fine."
- Color cue reusing the Human Gates Console (SAFE / HUMAN GATE / BLOCKED).

### Card 6 — How to act / first move
- Steps: declare context → read `NEXT_ACTION.md` → propose on a `cursor/<slug>` branch + **draft PR** → stop at human gates → never merge yourself.
- Status-state legend: Received · Thinking · Blocked · Failed · Response Incoming · Complete.
- "Where to look next" links: NEXT_ACTION, HUMAN_GATES, LANES, BUDGET, MACHINE_TOPOLOGY.

## Data sources (all read-only)

| Card | Source |
|------|--------|
| 1 | static + cockpit-sync date |
| 2 | `foreman/EXECUTION_CONTEXT_RULES.md` |
| 3 | `foreman/AI_COUSINS_PROTOCOL.md`, `foreman/ACTIVE_AGENT.md`, `foreman/MACHINE_TOPOLOGY.md` |
| 4 | `foreman/NEXT_ACTION.md` (+ existing Status Layer) |
| 5 | `foreman/HUMAN_GATES.md` |
| 6 | static checklist + state legend |

## First 60 seconds (intended flow)

1. Panel greets: "You're in SoleDash. Declare your context."
2. Cousin notes its context → learns what it can/can't see.
3. Reads cast + active writer → knows its lane.
4. Reads "Right now" → knows the active gate and what's paused.
5. Reads hard stops → knows the lines.
6. Follows "first move" → reads NEXT_ACTION, proposes on a branch/PR.

## What to deliberately leave OUT

- No secrets, tokens, or env values (names only).
- No full doctrine text — link to files, don't dump.
- No action buttons that perform gated work (stay read-only).
- Avoid overload: 6 cards max, collapsible, scannable in under a minute.

## Smallest implementation path (when approved)

- Render the "Start Here" panel from existing cockpit files (read-only), reusing the SoleDash console + state chips.
- Cards 3–5 can pull live text from `ACTIVE_AGENT.md` / `NEXT_ACTION.md` / `HUMAN_GATES.md`; Cards 1–2 + 6 are largely static.
- Add a `GET /onboarding` read-only JSON for programmatic cousins.
- One file touched (`scripts/foreman/foreman-control-server.mjs`) + this doc.

## Risks

- **Staleness:** Cards 3–4 must read live cockpit files, not hard-coded copy, or they rot.
- **Overload:** too much text defeats "immediate context" — keep to 6 scannable cards.
- **False authority:** onboarding must not imply a cousin can act without declaring context / honoring gates.
- **Secret leakage:** never surface values; names only.

## Hard stops honored

Proposal only. No build, no routing, no Speaker, no automation, no production, no deploy, no repo behavior change.
