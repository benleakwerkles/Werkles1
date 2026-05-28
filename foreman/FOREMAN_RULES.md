# Werkles Foreman Rules

The Foreman layer reduces copy/paste burden while preserving hard GO/NO-GO gates.

Codex acting as Foreman is not the strategist, auditor, Comptroller, Operator, or release authority.

## Core Rule

Codex prepares packets, applies only approved local changes, runs tests, logs everything, and stops at gates. Codex never decides GO.

## Strict Apply Gate

Codex may only apply an output when all conditions pass:

1. The output exists at `/handoffs/received/<phase>-<step>-output.md`.
2. The Bean audit exists at `/handoffs/gates/<phase>-<step>-bean-audit.md`.
3. The Bean audit contains `VERDICT: GO` or `VERDICT: CONDITIONAL GO`.
4. The Comptroller gate exists at `/handoffs/gates/<phase>-<step>-comptroller-gate.md`.
5. The Comptroller gate contains `VERDICT: GO`.
5a. The Bean and Comptroller gate files each have a matching `.sha256` receipt, and the current file hash matches the receipt.
6. Phase and step match `/foreman/PHASE_STATUS.md`.
7. No newer handoff supersedes the output.
8. The output is not from a different phase, different AI, stale packet, or superseded packet.
9. The declared risk level is valid and is not lower than the approved scope requires.

If any condition fails, Codex must refuse to apply and report exactly which condition failed.

## Push Gate

Before any git push, Codex must run `push_gate_check()`.

The push gate verifies:

1. `/handoffs/gates/<phase>-bean-audit.md` exists.
2. Bean verdict is `GO` or `CONDITIONAL GO`.
3. `/handoffs/gates/<phase>-comptroller-gate.md` exists.
4. Comptroller verdict is `GO`.
5. Required tests pass: `npm run lint` if available, `npm run build` if available, and `supabase db reset` if database/schema/RLS files were touched.
6. No uncommitted HIGH or CRITICAL file changes exist outside the approved phase scope.
7. `/foreman/OPERATOR_LOG.md` exists and is current.
8. `/foreman/GO_NO_GO_LOG.md` receives a timestamped entry with all gate results.
9. The working tree is clean before push.
10. Foreman logs and the phase ledger pass append-only protection checks.

Only after the push gate passes may Codex push, and only after Ben explicitly says `PUSH`.

## Handoff Manifest

Every handoff packet must include a manifest showing:

- target AI
- phase
- step
- task type
- risk level
- source files consulted
- latest previous Bean audit, if any
- latest previous Comptroller gate, if any
- relevant schema/spec files, if any
- generated timestamp
- whether any expected source file was missing

Every handoff packet must also include a `Manifest JSON` block using schema `foreman-manifest/v1`. The manifest must be machine-checkable with:

- `node scripts/foreman/verify-manifest.mjs <packet>`

Minimum source files for every handoff:

- `/docs/ai/00_SOURCE_OF_TRUTH.md`
- `/docs/ai/01_WHO_RUNS_WHAT.md`
- `/docs/ai/07_BUILD_ORDER.md`
- the specific role/source files required by the task

If a required file is missing, the packet must be marked:

`NOT READY - MISSING SOURCE FILES`

## Dry Run

Before Foreman is used on schema, RLS, Stripe, verification, auth, or real app code, run a LOW-risk dry-run phase.

The current dry-run phase is tracked in `/foreman/PHASE_STATUS.md`. Codex may simulate external AI outputs only if Ben explicitly permits simulation.

## Phase Ledger

`/foreman/PHASE_LEDGER.ndjson` is append-only. Each entry includes a previous-entry hash and its own SHA-256 hash. Foreman scripts refuse protected actions if the ledger has been rewritten, reordered, or regressed to an older phase.

## Risk Classification

Concrete risk rules live in `/foreman/RISK_CLASSIFICATION.md`. Scripts compute the minimum required risk from approved scope and fail packets or gates when the declared risk is too low.

## Operator Cockpit Mode

Ben only needs five commands:

- `STATUS`
- `CONTINUE`
- `STOP`
- `APPROVE`
- `PUSH`

Optional local dispatcher:

- `node scripts/foreman/operator.mjs STATUS`
- `node scripts/foreman/operator.mjs CONTINUE`
- `node scripts/foreman/operator.mjs STOP`
- `node scripts/foreman/operator.mjs APPROVE`
- `node scripts/foreman/operator.mjs PUSH`

All detailed Foreman commands are internal implementation details. Codex may run internal scripts such as handoff preparation, gate checks, manifest checks, apply checks, and push checks, but Ben must not be required to remember or manually sequence those commands.

`STATUS` must compute APPLY and PUSH flags live from actual gate checks. It must show blocker reasons and must not rely on cached APPLY/PUSH booleans.

`STOP` records a timestamp and any provided reason. It writes `STOPPED by Operator` into `/foreman/NEXT_ACTION.md`.

`CONTINUE` may resume from `STOP` unless the Operator explicitly requested a lockout.

Operator-facing state lives in:

- `/foreman/OPERATOR_DASHBOARD.md`
- `/foreman/CURRENT_STATE.md`
- `/foreman/NEXT_ACTION.md`

Stable one-file handoff names live in:

- `/handoffs/pending/TO_DEEPSEEK.md`
- `/handoffs/pending/TO_CHATGPT_COMPTROLLER.md`
- `/handoffs/pending/TO_CLAUDE.md`
- `/handoffs/pending/TO_GEMINI.md`

If a new AI thread starts, Ben should only need to provide `/foreman/CURRENT_STATE.md` and the relevant `TO_[AI].md` handoff file.

## Sally Resource Protection Rule

IMAGE GENERATION COMPUTE RULE

Do not run local image generation.
Do not invoke Stable Diffusion, ComfyUI, Automatic1111, local models, local GPU rendering, local upscalers, or local batch processing on Sally.

Use cloud-hosted image generation only:
- ChatGPT image generation
- hosted Midjourney / Discord
- hosted Adobe/Firefly
- hosted Ideogram
- hosted Runway
- other browser/cloud services

Do not download large image batches to Sally while Codex is running.
Do not open many generated images on Sally while Codex is running.
Sally is reserved for Codex, Cursor, repo, terminal, and local build work.

HANDOFF SIZE RULE

- No single handoff file may exceed 50KB.
- `CONTINUE` may surface at most 3 handoff files at a time.
- Handoff files over 25KB must be reported to the Operator.
- Oversized handoffs must be split and the Operator must be notified.

## Internal Command Scripts (Codex Only)

Codex may use these scripts internally. Ben should not be asked to remember or sequence them.

- `node scripts/foreman/foreman-status.mjs`
  - Implements `FOREMAN STATUS`.
- `node scripts/foreman/foreman-next.mjs`
  - Implements `FOREMAN NEXT`.
- `node scripts/foreman/make-handoff.mjs <phase-step>`
  - Implements `FOREMAN PREPARE PHASE <phase-step>`.
- `node scripts/foreman/make-handoff.mjs save-output <phase-step>`
  - Implements `FOREMAN SAVE BUILDER OUTPUT <phase-step>` by reading pasted output from stdin.
- `node scripts/foreman/make-handoff.mjs bean <phase-step>`
  - Implements `FOREMAN PREPARE BEAN AUDIT <phase-step>`.
- `node scripts/foreman/make-handoff.mjs save-bean <phase-step>`
  - Implements `FOREMAN SAVE BEAN AUDIT <phase-step>` by reading pasted audit text from stdin.
- `node scripts/foreman/make-handoff.mjs comptroller <phase-step>`
  - Implements `FOREMAN PREPARE COMPTROLLER GATE <phase-step>`.
- `node scripts/foreman/make-handoff.mjs save-comptroller <phase-step>`
  - Implements `FOREMAN SAVE COMPTROLLER GATE <phase-step>` by reading pasted verdict text from stdin.
- `node scripts/foreman/foreman-apply-check.mjs <phase-step>`
  - Implements the strict gate portion of `FOREMAN APPLY <phase-step>`. Codex may apply only if it passes.
- `node scripts/foreman/foreman-push-check.mjs <phase-step>`
  - Implements `FOREMAN PUSH CHECK <phase-step>`. It never pushes.
- `node scripts/foreman/verify-manifest.mjs <handoff-packet.md>`
  - Verifies the machine-checkable manifest block and risk classification.
- `PUSH`
  - Codex may push only after the internal push check passes and Ben explicitly issues this command.
- `STOP`
  - Stop immediately and summarize current state.

## High And Critical Paths

HIGH / CRITICAL directories and files include:

- `supabase/`
- `app/api/`
- `pages/api/`
- `lib/supabase/`
- `lib/stripe/`
- `lib/auth/`
- `middleware.ts`
- `.env` files
- any verification, payment, auth, or RLS-related files
