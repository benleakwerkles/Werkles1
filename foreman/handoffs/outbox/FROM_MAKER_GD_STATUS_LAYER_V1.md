# FROM_MAKER_GD_STATUS_LAYER_V1

Date: 2026-06-11
Author: Maker (Cursor) · EXECUTION_CONTEXT: CURSOR_CLOUD_CONTAINER
Scope: UI only. No Speaker changes, no routing changes, no doctrine changes, no production.

## Mission

Make GD (GimpDash) feel alive — add a visible lifecycle status layer to the Foreman Control Panel console.

## What was added

A **GD Status Layer** section at the top of the GimpDash console (`scripts/foreman/foreman-control-server.mjs`, served at `http://127.0.0.1:4317`). It renders crew/task entries, each with a current state chip, plus a legend of all states.

### Visible states

| State | Color | Motion |
|-------|-------|--------|
| Received | blue | none |
| Thinking | amber | pulse |
| Blocked | red | none |
| Failed | dark red | none |
| Response Incoming | violet | pulse |
| Complete | green | none |

"Thinking" and "Response Incoming" gently pulse to make the board feel live (respects `prefers-reduced-motion`).

### Data model (V1 = sample feed)

`statusItems` is an array of `{ actor, state, detail }`. V1 ships sample entries (Maker, GD Status Layer, Petra, Ghost Forge, Codex, Bellows) to demonstrate every state. Wire to a real source later (status file or relay feed) — no behavior depends on the sample values.

### Endpoints

- `GET /` — console HTML incl. the GD Status Layer.
- `GET /status` — read-only JSON: `{ ok, states[], items[] }` (for future polling).
- `GET /health` — `{ ok, service, readOnly }`.

## Verification (in-container smoke test)

- `node -c` syntax: OK
- `GET /` → 200; HTML contains "GD Status Layer" + all six state labels + `state-pulse`.
- `GET /status` → returns the six states and sample items.
- Secret scan of rendered HTML: none.
- Server started only briefly to verify, then stopped.

## Boundaries honored

- UI only — change is confined to the GimpDash console tool (`scripts/foreman/`).
- No Speaker code, no routing, no doctrine files, no app/product code, no production.
- Read-only console: no secrets, no provider calls, no deploy/push/SQL.

## Files changed

- `scripts/foreman/foreman-control-server.mjs` — status layer (states, sample feed, chips + pulse CSS, `/status` endpoint).
- `foreman/control-panel/README.md` — documents the status layer + `/status`.
- `foreman/handoffs/outbox/FROM_MAKER_GD_STATUS_LAYER_V1.md` — this report.

## Next (not done here)

- Wire `statusItems` to a real status source (relay feed / status file).
- Optional auto-refresh (poll `/status`) once a live feed exists.

Stacked on PR #5 (Human Gates Console), since the console is not yet on `main`.
