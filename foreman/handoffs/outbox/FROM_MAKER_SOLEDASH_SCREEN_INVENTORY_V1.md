# FROM_MAKER_SOLEDASH_SCREEN_INVENTORY_V1

Date: 2026-06-12
Author: Maker (Cursor) · EXECUTION_CONTEXT: CURSOR_CLOUD_CONTAINER
Type: inventory only. No code.

## One-page map of SoleDash

Status legend:
- **Exists?** any artifact at all (design or code)
- **Planned?** named in a design/plan doc
- **Mocked?** renders a static/sample view
- **Built?** working code renders it
- **Connected?** wired to real data **and** reachable on `main` (canonical)

> Critical context: all built SoleDash screens live **only on stacked draft PRs (#5 → #9 → #11 → #12), not merged to `main`.** So **Connected = No for everything** until that stack merges (and the PR #6 console collision is resolved). "Built (branch)" = code exists but unmerged.

| Screen | Exists? | Planned? | Mocked? | Built? | Connected? | Where |
|--------|:------:|:-------:|:------:|:-----:|:---------:|-------|
| **Dashboard** (the console page @ :4317) | Yes | Yes | Yes | Yes (branch) | No (unmerged, local-only) | PR #5 |
| **Inbox** | Yes | Yes | Yes | Yes (branch) | No (file-derived, branch-only) | PR #11 |
| **Outbox** | Yes | Yes | Yes | Yes (branch) | No (file-derived, branch-only) | PR #11 |
| **Receipts** | Yes | Yes | Yes | Yes (branch) | No (derived + sidecar, branch-only) | PR #11/#12 |
| **Status** (Status Layer) | Yes | Yes | Yes (sample feed) | Yes (branch) | No (sample data, not live feed) | PR #9 |
| **Concierge Cases** | Yes (as spec) | Yes | No | No | No | sheet spec / WoZ docs (#16–#20) |
| **User Detail** | Yes (as design) | Yes | No | No | No | SoleDash plan (#10) + sheet User Record |
| **Recommendation View** | Yes (as design) | Yes | No | No | No | Recommendation Card (#21) |

## What's actually real today

- **Built (code, unmerged branch):** Dashboard page, Status Layer, Inbox, Outbox, Receipts, Summary strip — all in `scripts/foreman/foreman-control-server.mjs`, read-only, served at `http://127.0.0.1:4317`.
- **Real data vs sample:**
  - Inbox/Outbox/Receipts = **real** (file-derived from `foreman/handoffs/{inbox,outbox}`).
  - Status Layer = **sample** feed (not yet wired to a live source).
- **Design-only (no screen built):** Concierge Cases, User Detail, Recommendation View — these exist as specs/cards (spreadsheet + written card formats), not as SoleDash screens.
- **On `main`:** **nothing** — the entire console is on draft PRs.

## Gaps to close (in build order, when approved)

1. **Merge the console stack** (#5 → #9 → #11 → #12) after resolving the PR #6 collision → moves Dashboard/Status/Inbox/Outbox/Receipts from "branch" to "connected."
2. **Status feed** — wire Status Layer to a real source (replace sample). 
3. **User Detail** — row-click detail view (designed, not built).
4. **Recommendation View** — render the Recommendation Card format as a screen (designed, not built).
5. **Concierge Cases** — decide: stays a Google Sheet, or becomes a SoleDash view fed by case files.

## Note on naming

SoleDash = visible name. "Dashboard" above = the SoleDash console page itself (the container for the section-screens). GD = internal shorthand; GimpDash deprecated.

## Boundaries honored

Inventory only. No code.
