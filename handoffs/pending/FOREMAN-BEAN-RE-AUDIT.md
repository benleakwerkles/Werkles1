# Foreman Bean Re-Audit Packet

generated_at: 2026-05-23T19:00:00Z

## Manifest

- target AI: DeepSeek / Bean
- phase: FOREMAN-PATCH
- step: bean-re-audit
- task type: audit packet
- risk level: LOW
- generated timestamp: 2026-05-23T19:00:00Z
- operator instruction: Do not modify product code. Do not run dry-run. Do not push.
- evidence canary: `/foreman/PRE_PATCH_DRY_RUN_STATUS.md`
- packet file: `/handoffs/pending/FOREMAN-BEAN-RE-AUDIT.md`

## Audit Ask

Audit the patched Foreman layer after five Bean findings were addressed:

1. Immutable append-only phase ledger / monotonic phase protection.
2. Gate-file SHA-256 hash integrity for Bean and Comptroller gates.
3. Machine-checkable handoff manifest plus `verify-manifest.mjs`.
4. Concrete risk classification table and enforcement.
5. Clean working tree push protection and log protection.

Return exactly one verdict line:

`VERDICT: GO`

or

`VERDICT: CONDITIONAL GO`

or

`VERDICT: NO-GO`

Then list findings by severity.

## Scope Boundaries

Foreman-only patch. No Werkles product code was intentionally modified.

Do not audit the product app itself except to verify that protected product paths were not touched by this patch.

Protected paths:

- `/supabase/`
- `/app/api/`
- `/pages/api/`
- `/lib/supabase/`
- `/lib/stripe/`
- `/lib/auth/`
- `/middleware.ts`
- `/.env*`

## FOREMAN_RULES.md

Source: `/foreman/FOREMAN_RULES.md`

Key current rules:

- Codex prepares packets, applies only approved local changes, runs tests, logs everything, and stops at gates.
- Codex never decides GO.
- Strict apply gate requires Builder output, Bean audit, Comptroller gate, verdict checks, SHA-256 gate receipts, phase/step match, no superseding packet, correct output receipt metadata, and risk classification.
- Push gate requires apply gate, tests, no HIGH/CRITICAL out-of-scope changes, clean working tree, current logs, timestamped GO/NO-GO log, log protection, and explicit `PUSH PHASE <phase>`.
- Handoffs require a human-readable manifest and machine-checkable `Manifest JSON` block using schema `foreman-manifest/v1`.
- Sally resource protection rule forbids local image generation, local GPU rendering, local upscalers, and local batch image processing while Codex is running.

Recent added sections:

- Phase Ledger
- Risk Classification
- Sally Resource Protection Rule
- `verify-manifest.mjs` command entry

## PHASE_STATUS.md

Source: `/foreman/PHASE_STATUS.md`

Current phase:

- Current Phase: `DRY-RUN-0.1`
- Current Step: `foreman-pipeline-copy`
- Risk Level: `LOW`
- Task Type: `static mock-only artifact`
- Target AI: `Builder`
- Approved Scope: `/lib/copy.ts`
- Required Task Sources: `/docs/ai/04_WORDS_WE_CAN_AND_CANNOT_SAY.md`

Current blockers listed in status:

- `/docs/ai/00_SOURCE_OF_TRUTH.md` is missing.
- `/docs/ai/01_WHO_RUNS_WHAT.md` is missing.
- `/docs/ai/07_BUILD_ORDER.md` is missing.
- `/docs/ai/02_BUILDER.md` is missing.
- `/docs/ai/04_WORDS_WE_CAN_AND_CANNOT_SAY.md` is missing.
- External AI output simulation is not permitted until Ben explicitly permits simulation.

## PHASE_LEDGER.ndjson

Source: `/foreman/PHASE_LEDGER.ndjson`

Current contents:

```text
# Foreman append-only phase ledger. Scripts append NDJSON entries below this line; do not edit prior entries.
```

Audit note:

- Ledger was added after the pre-patch canary.
- Dry-run was not resumed after ledger creation.
- Therefore, ledger has only a header and no command entries yet.
- `verifyPhaseLedger()` was tested and returned `PASS` for the empty/header-only ledger state.

## OPERATOR_LOG.md Summary

Source: `/foreman/OPERATOR_LOG.md`

Relevant events:

- `FOREMAN NEXT` generated dry-run handoff packets.
- `make-handoff DRY-RUN-0.1-foreman-pipeline-copy` generated `/handoffs/pending/DRY-RUN-0.1-foreman-pipeline-copy-handoff.md`.
- Packets were marked `NOT READY - MISSING SOURCE FILES`.
- `FOREMAN STATUS` reported missing `/docs/ai` sources.
- `FOREMAN APPLY CHECK DRY-RUN-0.1-foreman-pipeline-copy` refused apply because:
  - Builder output was missing.
  - Bean audit was missing.
  - Comptroller gate was missing.

Audit note:

- OPERATOR_LOG entries are from pre-patch Foreman activity.
- The patch added future append-only ledger protection, but old log entries were not retroactively ledgered.

## GO_NO_GO_LOG.md Summary

Source: `/foreman/GO_NO_GO_LOG.md`

Recorded failed gates:

- `DRY-RUN / faq-static-page`
  - Bean verdict: missing
  - Comptroller verdict: missing
  - push allowed: no
  - reason: Apply gate failed
- `DRY-RUN-0.1 / foreman-pipeline-copy`
  - Bean verdict: missing
  - Comptroller verdict: missing
  - push allowed: no
  - reason: Apply gate failed

No GO gate is recorded.

## Scripts / Foreman Files Changed

### `/scripts/foreman/_foreman-core.mjs`

Changed to add:

- SHA-256 helpers:
  - `sha256Text()`
  - `sha256File()`
  - `gateHashPath()`
  - `writeGateHash()`
  - `verifyGateHash()`
- Machine manifest helpers:
  - `buildManifest()` now emits human manifest plus `Manifest JSON`.
  - `parseMachineManifest()`
  - `verifyMachineManifest()`
- Risk classification helpers:
  - `RISK_CLASSIFICATION`
  - `RISK_LEVEL_ORDER`
  - `minimumRiskForPath()`
  - `requiredRiskForScope()`
  - `enforceRiskClassification()`
- Phase ledger helpers:
  - `phaseOrderParts()`
  - `comparePhaseOrder()`
  - `ledgerEntryHash()`
  - `readPhaseLedger()`
  - `verifyPhaseLedger()`
  - `assertPhaseLedger()`
  - `appendPhaseLedger()`
- Log protection helpers:
  - `FOREMAN_LOG_FILES`
  - `gitTrackedContent()`
  - `logProtectionFailures()`
- Apply gate now checks gate hashes and risk classification.

### `/scripts/foreman/make-handoff.mjs`

Changed to add:

- Phase ledger assertion before prepare/save operations.
- Risk classification preflight for handoff, Bean audit packet, and Comptroller packet.
- `Manifest JSON` payload passed into `buildManifest()`.
- Bean audit save writes `.sha256` receipt.
- Comptroller gate save writes `.sha256` receipt.
- Comptroller save immediately runs apply gate after writing hash receipt.

### `/scripts/foreman/foreman-push-check.mjs`

Changed to add:

- Risk classification check.
- Clean working tree protection.
- Log protection check.
- Phase ledger protection through `logProtectionFailures()`.
- Push gate result includes failures in GO/NO-GO log.

### `/scripts/foreman/foreman-status.mjs`

Changed to add:

- Risk classification status.
- Phase ledger status.
- Blockers now include ledger and risk failures.

### `/scripts/foreman/verify-manifest.mjs`

New script.

Purpose:

- Reads a handoff packet.
- Parses `Manifest JSON`.
- Validates required machine fields.
- Checks readiness/source mismatch conditions.
- Runs risk classification against manifest approved scope.

Usage:

```powershell
node scripts\foreman\verify-manifest.mjs handoffs\pending\<packet>.md
```

## Hash / Gate Integrity Logic

Bean and Comptroller gates are expected at:

- `/handoffs/gates/<phase>-<step>-bean-audit.md`
- `/handoffs/gates/<phase>-<step>-comptroller-gate.md`

Hash receipts are expected at:

- `/handoffs/gates/<phase>-<step>-bean-audit.md.sha256`
- `/handoffs/gates/<phase>-<step>-comptroller-gate.md.sha256`

Receipt format:

```json
{
  "file": "handoffs/gates/<phase>-<step>-bean-audit.md",
  "sha256": "<hex digest>",
  "generatedTimestamp": "<ISO timestamp>"
}
```

Apply gate now refuses if:

- gate exists but hash receipt is missing
- receipt file path does not match gate path
- current gate hash differs from receipt hash
- receipt JSON is unreadable

## Apply Gate Logic

Current `checkApplyGate()` checks:

- Builder output exists.
- Bean audit exists.
- Bean audit verdict is `GO` or `CONDITIONAL GO`.
- Bean audit hash receipt exists and matches.
- Comptroller gate exists.
- Comptroller verdict is `GO`.
- Comptroller hash receipt exists and matches.
- Requested phase/step matches `/foreman/PHASE_STATUS.md`.
- Phase ledger integrity passes.
- Declared risk classification is valid and not lower than approved scope requires.
- Output is not superseded by a newer handoff or superseded marker.
- Output receipt contains matching phase/step metadata.
- Output is not marked superseded.

## Push Gate Logic

Current `foreman-push-check.mjs` checks:

- Strict apply gate.
- Risk classification.
- `npm run lint`, if available.
- `npm run build`, if available.
- `supabase db reset` requirement if database/schema/RLS files changed.
- No HIGH/CRITICAL file changes outside approved scope.
- Working tree is clean before push.
- `OPERATOR_LOG.md` exists.
- `GO_NO_GO_LOG.md` exists.
- Foreman logs pass append-only protection.
- Phase ledger passes integrity checks.
- Push remains blocked unless Ben explicitly says `PUSH PHASE <phase>`.

Audit concern to inspect:

- Because push check writes GO/NO-GO and OPERATOR logs as part of the check, the "clean working tree" check may fail whenever logs are uncommitted. This is intentional strictness but may require a documented commit/stage sequence before future push.

## Risk Classification Table

Source: `/foreman/RISK_CLASSIFICATION.md`

Summary:

- LOW: Foreman scaffolding, handoff packets, `docs/ai`, `scripts/foreman`, mock-only `lib/copy.ts`.
- MEDIUM: Non-sensitive product UI/static presentation components without auth/payment/API/database behavior.
- HIGH: `app/api/`, `pages/api/`, `lib/supabase/`, `lib/stripe/`, `lib/auth/`, `middleware.ts`, paths containing `auth`, `stripe`, `payment`, or `verification`.
- CRITICAL: `supabase/`, `.env*`, RLS, schema/migrations, live verification, money movement, release controls, secrets.

Enforcement:

- Scripts compute minimum required risk from approved scope.
- If declared risk in `/foreman/PHASE_STATUS.md` is lower than required, packet/gate fails.

## Retest Commands

Already run after patch:

```powershell
node --check scripts\foreman\_foreman-core.mjs
node --check scripts\foreman\make-handoff.mjs
node --check scripts\foreman\verify-manifest.mjs
node --check scripts\foreman\foreman-push-check.mjs
node --check scripts\foreman\foreman-status.mjs
node --check scripts\foreman\foreman-next.mjs
node --check scripts\foreman\foreman-apply-check.mjs
node --check scripts\foreman\foreman-gate-check.mjs
node -e "import('./scripts/foreman/_foreman-core.mjs').then((m)=>{const r=m.verifyPhaseLedger(); console.log('Phase ledger check: '+(r.ok?'PASS':'FAIL')); if(!r.ok) process.exit(1)})"
```

All passed.

Suggested Bean retest commands:

```powershell
node --check scripts\foreman\_foreman-core.mjs
node --check scripts\foreman\make-handoff.mjs
node --check scripts\foreman\verify-manifest.mjs
node --check scripts\foreman\foreman-push-check.mjs
node --check scripts\foreman\foreman-status.mjs
node -e "import('./scripts/foreman/_foreman-core.mjs').then((m)=>{const r=m.verifyPhaseLedger(); console.log(r)})"
```

Do not run dry-run commands during this re-audit unless Operator explicitly says to resume.

## Git Diff Summary

`git status --short`:

```text
?? docs/ai/
?? foreman/
?? handoffs/
?? scripts/
```

`git diff --stat`:

```text
empty, because the Foreman layer is currently untracked
```

Untracked files under Foreman/docs/handoffs/scripts:

```text
docs/ai/README.md
foreman/FOREMAN_RULES.md
foreman/GO_NO_GO_LOG.md
foreman/OPERATOR_LOG.md
foreman/PHASE_LEDGER.ndjson
foreman/PHASE_STATUS.md
foreman/PRE_PATCH_DRY_RUN_STATUS.md
foreman/RISK_CLASSIFICATION.md
handoffs/gates/.gitkeep
handoffs/pending/.gitkeep
handoffs/pending/DRY-RUN-0.1-foreman-pipeline-copy-handoff.md
handoffs/pending/DRY-RUN-faq-static-page-handoff.md
handoffs/received/.gitkeep
handoffs/sent/.gitkeep
handoffs/superseded/.gitkeep
scripts/foreman/_foreman-core.mjs
scripts/foreman/foreman-apply-check.mjs
scripts/foreman/foreman-gate-check.mjs
scripts/foreman/foreman-next.mjs
scripts/foreman/foreman-push-check.mjs
scripts/foreman/foreman-status.mjs
scripts/foreman/make-handoff.mjs
scripts/foreman/verify-manifest.mjs
```

## Assumptions

- The Foreman layer is allowed to remain untracked until Bean/Comptroller review approves it.
- The re-audit packet itself is a Foreman handoff artifact, not product code.
- The pre-patch dry-run status note is accepted canary evidence and should not be rewritten.
- Empty/header-only phase ledger is acceptable because dry-run was paused and not resumed after patch.

## Not Implemented / Known Gaps

- No actual `FOREMAN APPLY` implementation applies patches yet; current apply script is an apply-check gate.
- Gate hash receipts are generated for future saved Bean/Comptroller gates only; no current gate files exist to hash.
- Existing pre-patch handoff packets do not yet contain the new `Manifest JSON` block because dry-run was not resumed.
- Existing OPERATOR_LOG and GO_NO_GO_LOG entries are not retroactively hash-ledgered.
- Push implementation is not present; only `foreman-push-check.mjs` exists.
- Missing `/docs/ai` source files remain unresolved.
- `/lib/copy.ts` was not applied or modified.

## Auditor Focus Questions

1. Does the SHA-256 receipt design sufficiently prevent silent gate edits?
2. Is the append-only ledger meaningful before files are tracked in git?
3. Is clean working tree protection too strict when Foreman logging itself writes during push checks?
4. Should `verify-manifest.mjs` be required by `foreman-next.mjs` immediately after packet generation?
5. Should old pre-patch handoff packets be superseded once the new manifest schema is active?
