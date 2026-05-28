# TO_DEEPSEEK: Foreman Re-Audit

generated_at: 2026-05-23T19:20:00Z

## Operator Context

Werkles product development is paused. Audit the Foreman control layer only.

Do not ask the Operator to run internal Foreman commands. Ben now uses only:

- `STATUS`
- `CONTINUE`
- `STOP`
- `APPROVE`
- `PUSH`

## Current State

- Current phase: DRY-RUN-0.1
- Current step: foreman-pipeline-copy
- Risk level: LOW
- Product code changed: no
- Dry-run resumed: no
- Push allowed: no
- Apply allowed: no
- Current next action: DeepSeek / Bean audit

## Audit Ask

Audit the patched Foreman layer after these changes:

1. Immutable append-only phase ledger / monotonic phase protection.
2. Gate-file SHA-256 hash integrity for Bean and Comptroller gates.
3. Machine-checkable handoff manifest plus `verify-manifest.mjs`.
4. Concrete risk classification table and enforcement.
5. Clean working tree push protection and log protection.
6. Operator Cockpit Mode, hiding internal command sequencing behind five Operator commands.
7. Sally Resource Protection Rule.

Return exactly one verdict line:

`VERDICT: GO`

or

`VERDICT: CONDITIONAL GO`

or

`VERDICT: NO-GO`

Then list findings by severity.

## Evidence Canary

`/foreman/PRE_PATCH_DRY_RUN_STATUS.md` says:

- command being run: `FOREMAN APPLY CHECK DRY-RUN-0.1-foreman-pipeline-copy`
- guardrail fired: strict apply gate refused because required gate artifacts were missing
- FOREMAN APPLY refused: yes
- Builder output missing
- Bean audit missing
- Comptroller gate missing
- product code changed: no
- high/critical paths touched: no

## Files To Audit

Foreman docs:

- `/foreman/FOREMAN_RULES.md`
- `/foreman/OPERATOR_DASHBOARD.md`
- `/foreman/CURRENT_STATE.md`
- `/foreman/NEXT_ACTION.md`
- `/foreman/PHASE_STATUS.md`
- `/foreman/PHASE_LEDGER.ndjson`
- `/foreman/PRE_PATCH_DRY_RUN_STATUS.md`
- `/foreman/RISK_CLASSIFICATION.md`

Foreman scripts:

- `/scripts/foreman/_foreman-core.mjs`
- `/scripts/foreman/make-handoff.mjs`
- `/scripts/foreman/foreman-status.mjs`
- `/scripts/foreman/foreman-next.mjs`
- `/scripts/foreman/foreman-gate-check.mjs`
- `/scripts/foreman/foreman-apply-check.mjs`
- `/scripts/foreman/foreman-push-check.mjs`
- `/scripts/foreman/verify-manifest.mjs`

Handoff files:

- `/handoffs/pending/TO_DEEPSEEK.md`
- `/handoffs/pending/TO_CHATGPT_COMPTROLLER.md`
- `/handoffs/pending/TO_CLAUDE.md`
- `/handoffs/pending/TO_GEMINI.md`
- `/handoffs/pending/FOREMAN-BEAN-RE-AUDIT.md`

## Key Rules To Verify

Strict apply gate must refuse unless:

- Builder output exists.
- Bean audit exists.
- Bean verdict is `GO` or `CONDITIONAL GO`.
- Bean gate hash receipt exists and matches.
- Comptroller gate exists.
- Comptroller verdict is `GO`.
- Comptroller hash receipt exists and matches.
- Requested phase/step matches `/foreman/PHASE_STATUS.md`.
- Phase ledger integrity passes.
- Risk classification is valid.
- Output is not stale or superseded.

Push gate must refuse unless:

- Apply gate passes.
- Required tests pass.
- HIGH/CRITICAL changes are in approved scope.
- Working tree is clean before push.
- Logs pass append-only protection.
- Phase ledger passes integrity checks.
- Ben explicitly says `PUSH`.

Operator cockpit must:

- Preserve safety gates.
- Stop asking Ben to remember internal commands.
- Keep one exact next action in `/foreman/NEXT_ACTION.md`.
- Keep handoff files stable and self-contained.

## Known Gaps / Questions

- Existing pre-patch handoffs do not have the new machine manifest because dry-run was not resumed.
- Existing log entries are not retroactively ledgered.
- The phase ledger is header-only because no Foreman command has run after the patch.
- Push check writes logs, so clean working tree protection may need an explicit staged/committed sequence in future.
- There is still no real apply implementation, only apply gate checking.

## Protected Product Paths

Verify these were not modified by the Foreman patch:

- `/supabase/`
- `/app/api/`
- `/pages/api/`
- `/lib/supabase/`
- `/lib/stripe/`
- `/lib/auth/`
- `/middleware.ts`
- `/.env*`

## Retest Commands

Recommended non-dry-run checks:

```powershell
node --check scripts\foreman\_foreman-core.mjs
node --check scripts\foreman\make-handoff.mjs
node --check scripts\foreman\verify-manifest.mjs
node --check scripts\foreman\foreman-push-check.mjs
node --check scripts\foreman\foreman-status.mjs
node --check scripts\foreman\foreman-next.mjs
node --check scripts\foreman\foreman-apply-check.mjs
node --check scripts\foreman\foreman-gate-check.mjs
node -e "import('./scripts/foreman/_foreman-core.mjs').then((m)=>{const r=m.verifyPhaseLedger(); console.log(r)})"
```

Do not run the dry-run.

## Git Status Summary

```text
?? docs/ai/
?? foreman/
?? handoffs/
?? scripts/
```

The Foreman layer is currently untracked. `git diff --stat` is empty because the files are new/untracked.
