# Lanes

Status: automation authority source of truth

An approved lane is the only place where AI workers may continue routine technical proofs without stopping for Ben. Chat memory alone is not scope.

Each lane must define:

- lane name
- status: `APPROVED`, `BLOCKED`, or `PAUSED`
- allowed actions
- forbidden actions
- budget reference
- current stop condition
- repair limit

## Lane: Ghost Forge One-Prompt Technical Proof

- Status: `APPROVED`
- Environment: Render service `werkles-ghost-forge1`
- Budget reference: `foreman/BUDGET.md#lane-ghost-forge-one-prompt-technical-proof`
- Current scope source:
  - `foreman/NEXT_ACTION.md`
  - `foreman/HUMAN_GATES.md`
- Allowed actions:
  - health check
  - authenticated diagnostic that does not print secrets
  - one-prompt technical smoke test inside approved budget
  - webhook callback proof for that one prompt
  - upload-path proof for that one prompt
  - status polling for the one prompt
  - cockpit documentation updates
- Forbidden actions:
  - creating a new provider account
  - entering, printing, saving, or requesting secrets
  - billing or credit card action
  - live deploy unless Ben explicitly approves deploy
  - git push or merge unless Ben explicitly approves push/merge
  - SQL/schema apply
  - RLS or policy changes
  - mutation of production data except the explicitly scoped Ghost Forge test records created by the one-prompt smoke test
  - batch image generation beyond one prompt
  - creative direction approval
  - public launch or public publish
  - promotion of draft/review assets to approved status
- Current stop condition:
  - Stop after the one-prompt automatic webhook callback proof is complete, or if bounded repair hits a true human gate, exceeds budget, exceeds repair limit, or exposes provider/billing/secret/schema/RLS/production-data risk.
- Repair limit:
  - 2 bounded repair attempts per failed technical proof.
- Current status:
  - Completed. The callback proof succeeded. This lane should not run more paid prompts unless `NEXT_ACTION.md` or another cockpit file explicitly scopes a new approved test.

## Lane: Ghost Forge Batch Asset Generation

- Status: `APPROVED`
- Environment: Render service `werkles-ghost-forge1`
- Budget reference: `foreman/BUDGET.md#lane-ghost-forge-batch-asset-generation`
- Current scope source:
  - `foreman/NEXT_ACTION.md`
  - Ben phrase: `APPROVE DRAFT SITE ASSET + UI PASS v0.1`
- Allowed actions:
  - generate up to 10 draft Werkles site images
  - use Ghost Forge `/batch/create`
  - poll batch status
  - record draft asset metadata and storage paths
  - hand off draft assets to Cursor/Claude for visible UI/UX work
- Forbidden actions:
  - more than 10 images in this lane
  - image spend above `$2.50`
  - Claude prompt spend above `## Lane: Ghost Forge Batch Asset Generation

- Status: `BLOCKED`
- Environment: Render service `werkles-ghost-forge1`
- Budget reference: `foreman/BUDGET.md#lane-ghost-forge-batch-asset-generation`
- Allowed actions:
  - none until Ben approves creative direction and batch budget
- Forbidden actions:
  - batch image generation
  - background generation
  - approving generated images
  - publishing or using generated assets in the app as approved brand assets
- Current stop condition:
  - Await Ben's creative direction approval and explicit batch budget approval.
- Repair limit:
  - 0 until approved.
.10`
  - daily spend above `$3.00`
  - publish or treat generated assets as final brand approval
  - deploy
  - push or merge
  - SQL/schema/RLS/policy apply
  - provider/account/billing changes
  - secrets in chat or repo
  - production data mutation outside the explicitly scoped Ghost Forge batch records
  - Bellows live runs
- Current stop condition:
  - Stop after the approved draft batch is generated, recorded, and handed off for local UI/UX work, or earlier if login/OAuth/secrets/provider billing/account settings are required.
- Repair limit:
  - 2 bounded repair attempts inside the approved budget.
## Lane: Doctrine And Cockpit Maintenance

- Status: `APPROVED`
- Environment: local repo files only
- Budget reference: `foreman/BUDGET.md#lane-doctrine-and-cockpit-maintenance`
- Allowed actions:
  - edit cockpit doctrine files
  - edit platform instruction shims
  - edit Cursor/Agents rule anchors
  - create missing `foreman/LANES.md` and `foreman/BUDGET.md`
  - create or update gate-specific review artifacts for Tier 1 doctrine gates
  - create or update `foreman/gates/APPROVAL_LOG.md`
  - run read-only checks and diffs
- Forbidden actions:
  - app/product code mutation
  - deploy
  - push or merge
  - SQL/schema/RLS/policy apply
  - provider calls
  - secrets
  - image generation
  - Bellows live runs
  - production data mutation
- Current stop condition:
  - Stop after doctrine files, Cursor/Agents rule anchors, gate review rules, and approval log are updated and report the current next true human gate.
- Repair limit:
  - 2 bounded repair attempts per failed doctrine patch.

## Lane: Gate Review UI Protocol

- Status: `APPROVED`
- Environment: local repo doctrine/cockpit files only
- Budget reference: `foreman/BUDGET.md#lane-gate-review-ui-protocol`
- Allowed actions:
  - define Tier 1 and Tier 2 gate review requirements
  - explicitly keep routine technical proofs out of gate tiers
  - create gate-specific review artifact rules
  - update cockpit doctrine files
  - update platform shims to point at cockpit docs instead of duplicating gate law
  - create or update approval log format
  - update `NEXT_ACTION.md`
- Forbidden actions:
  - app/product code mutation
  - deploy
  - push or merge
  - SQL/schema/RLS/policy apply
  - provider calls
  - secrets
  - Ghost Forge runs
  - Bellows live runs
  - image generation
  - production data mutation
- Current stop condition:
  - Stop after the Gate Review UI Protocol v2 red-team patch is applied and the current true human gate is reported.
- Repair limit:
  - 2 bounded repair attempts per failed doctrine patch.

## Lane: Cursor Permission Fix

- Status: `APPROVED`
- Environment: local Cursor/repo settings and cockpit files only
- Budget reference: `foreman/BUDGET.md#lane-cursor-permission-fix`
- Allowed actions:
  - inspect Cursor rule anchors and cockpit files
  - prepare a bounded Cursor settings/permission fix packet
  - rerun sandbox-only smoke test after Ben/Cursor settings are adjusted
  - record whether Cursor prompts per file, once, or not at all
- Forbidden actions:
  - app/product code mutation
  - deploy
  - push or merge
  - SQL/schema/RLS/policy apply
  - provider calls
  - secrets
  - image generation
  - Bellows live runs
  - Ghost Forge runs
  - production data mutation
  - bulk work before Ben approves Cursor write authority
- Current stop condition:
  - Completed. Ben reported the permission retry passed. Cursor still requires a bounded real-work lane before editing beyond sandbox smoke-test files.
- Repair limit:
  - 2 bounded attempts.

## Lane: Cursor First Bounded Real Work

- Status: `APPROVED`
- Environment: local repo branch `ben-sandbox`
- Budget reference: `foreman/BUDGET.md#lane-cursor-first-bounded-real-work`
- Allowed file areas:
  - `app/page.tsx`
  - `app/proof/page.tsx`
  - `app/membership/page.tsx`
  - `app/pricing/page.tsx`
  - `app/dashboard/**`
  - `components/**`
  - `app/globals.css`
  - `lib/copy.ts`
  - `lib/design-tokens.ts`
  - `public/assets/**`
- Allowed actions:
  - visible UI/UX edits using draft/review-only assets
  - responsive polish
  - local typecheck/build fixes within the allowed file areas
  - route smoke-test fixes within the allowed file areas
- Forbidden actions:
  - unscoped bulk work
  - edits outside allowed file areas
  - deploy
  - push or merge
  - SQL/schema/RLS/policy apply
  - provider calls
  - secrets
  - image generation beyond the approved 10-image Ghost Forge batch
  - Bellows live runs
  - production data mutation
  - treating draft assets as final brand approval
- Current stop condition:
  - Stop after local typecheck/build, route smoke test, and screenshots are produced for Ben review.
- Repair limit:
  - 2 bounded repair attempts for local UI/build issues.
