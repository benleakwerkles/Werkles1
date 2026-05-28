# Budget

Status: automation authority source of truth

Budgets here are machine-readable operating limits for approved lanes. They are not invoice-grade accounting and do not replace provider billing records.

If a lane is missing from this file, paid calls are not approved for that lane.

## Lane: Ghost Forge One-Prompt Technical Proof

Anchor: `lane-ghost-forge-one-prompt-technical-proof`

- Paid calls allowed: `yes`
- Max cost per test: `$0.25`
- Max cost per run: `$0.25`
- Daily cap: `$1.00`
- Max prompts per test: `1`
- Max paid tests remaining under this scope: `0`
- Stop condition when budget is exceeded:
  - Stop immediately and report. Do not retry, expand spend, change providers, add credit, or ask Ben to paste billing details.
- Notes:
  - The approved callback proof has completed.
  - Additional one-prompt paid tests require fresh written scope in `NEXT_ACTION.md` or another cockpit file.

## Lane: Ghost Forge Batch Asset Generation

Anchor: `lane-ghost-forge-batch-asset-generation`

- Paid calls allowed: `yes`
- Max cost per test: `$3.00`
- Max cost per run: `$3.00`
- Daily cap: `$3.00`
- Max prompts per run: `12`
- Max combined image + Claude spend tonight: `$3.00`
- Stop condition when budget is exceeded:
  - Stop immediately. Do not retry, expand spend, change providers, add credit, or ask Ben to paste billing details.
- Notes:
  - Approved by Ben on 2026-05-27 for `VERIFY GHOST FORGE v0.2 ICONS FIRST`.
  - Generate icons first, draft/review only.
  - Stop at `429`, daily cap, or budget cap.
  - Generated assets are not final brand approval and must not be published without later approval.

## Lane: Doctrine And Cockpit Maintenance

Anchor: `lane-doctrine-and-cockpit-maintenance`

- Paid calls allowed: `no`
- Max cost per test: `$0.00`
- Max cost per run: `$0.00`
- Daily cap: `$0.00`
- Stop condition when budget is exceeded:
  - Stop before paid provider calls.
- Notes:
  - Local repo doctrine/cockpit edits only.

## Lane: Gate Review UI Protocol

Anchor: `lane-gate-review-ui-protocol`

- Paid calls allowed: `no`
- Max cost per test: `$0.00`
- Max cost per run: `$0.00`
- Daily cap: `$0.00`
- Stop condition when budget is exceeded:
  - Stop before paid provider calls.
- Notes:
  - Doctrine/cockpit edits only.
  - Gate review dashboards are static local files and do not authorize spend.

## Lane: Cursor Permission Fix

Anchor: `lane-cursor-permission-fix`

- Paid calls allowed: `no`
- Max cost per test: `$0.00`
- Max cost per run: `$0.00`
- Daily cap: `$0.00`
- Stop condition when budget is exceeded:
  - Stop before paid provider calls, paid automation, deploy, push, merge, or account/billing action.
- Notes:
  - Local Cursor/repo settings and cockpit documentation only.

## Lane: Cursor First Bounded Real Work

Anchor: `lane-cursor-first-bounded-real-work`

- Paid calls allowed: `no`
- Max cost per test: `$0.00`
- Max cost per run: `$0.00`
- Daily cap: `$0.00`
- Stop condition when budget is exceeded:
  - Stop before paid provider calls, paid automation, deploy, push, merge, or account/billing action.
- Notes:
  - Blocked until Ben approves exact Cursor scope.

## Tier 1 Spend/Batch Gate Requirement

Before any Tier 1 spend or batch gate can proceed, this file must define:

- lane
- paid calls allowed: `yes` or `no`
- max cost per test
- max cost per run
- daily cap
- stop condition when budget is exceeded

If the lane is missing or incomplete here, the gate is blocked until budget is defined.

## Global Budget Rules

- Do not change billing or credit card settings.
- Do not enter, print, save, or request secrets.
- Do not make paid calls outside an approved lane.
- Do not expand spend beyond the active approved lane without Ben's explicit approval.
- If provider billing, credit, or account state appears unclear, stop and report without asking Ben to paste private data.
