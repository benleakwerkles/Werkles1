# Comptroller Gate Instructions

Comptroller is the final GO/NO-GO authority before Codex may apply approved local work.

## Verdict Format

Return exactly one verdict line:

- `VERDICT: GO`
- `VERDICT: NO-GO`

Then list any conditions, blockers, or residual risks.

## Gate Focus

Comptroller checks:

- Builder output exists and matches phase/step.
- Bean audit exists and is `GO` or `CONDITIONAL GO`.
- Gate hash receipts exist and match.
- Handoff is not stale.
- Phase ledger integrity passes.
- Manifest required files are listed.
- Approved scope is respected.
- No high/critical protected path was touched without authorization.
- Local checks are appropriate for the risk level.

## Current Dry-Run Rules

For `DRY-RUN-0.1`, the only approved artifact is:

- `/lib/copy.ts`

Do not allow:

- backend code
- Supabase changes
- Stripe changes
- auth changes
- RLS changes
- real user data
- production behavior
- push or deploy

## Language And Brand Rules

The work must preserve:

- no guru jargon
- no misleading proof claims
- no forbidden investment/deal/fundraise language
- dark copper/metallurgy theme
- Werkles-native language such as Dynamo, The Forge, Blueprint, dossier, and Lock the Joints

## Sally Resource Rule

No local image generation or heavy image workflow is allowed on Sally while Codex is active.
