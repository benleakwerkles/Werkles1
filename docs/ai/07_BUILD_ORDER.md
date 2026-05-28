# Build Order

This file tells Foreman what work may happen next. It does not override gates.

## Current Phase

Phase: `DRY-RUN-0.1`

Step: `foreman-pipeline-copy`

Risk: `LOW`

Goal: create a mock-only centralized copy artifact after the Foreman loop proves its gates work.

## Current Dry-Run Artifact

Target:

- `/lib/copy.ts`

Rules:

- no backend code
- no Supabase
- no Stripe
- no auth
- no RLS
- no real user data
- no production behavior
- obey Words We Can And Cannot Say

## Required Sequence

1. `STATUS`
2. `CONTINUE`
3. Codex prepares or refreshes the Builder handoff internally.
4. Builder output is saved only when provided or when simulation is explicitly approved by Ben.
5. Bean audit packet is prepared internally.
6. Bean audit is saved only when provided.
7. Comptroller gate packet is prepared internally.
8. Comptroller verdict is saved only when provided.
9. Apply gate runs internally.
10. Codex applies only if the strict apply gate passes.
11. Local checks run.
12. Push gate runs internally.
13. Push happens only if push gate passes and Ben says `PUSH`.

## Current Blockers

Before dry-run output can be accepted, Foreman needs these source files:

- `/docs/ai/00_SOURCE_OF_TRUTH.md`
- `/docs/ai/01_WHO_RUNS_WHAT.md`
- `/docs/ai/02_BUILDER.md`
- `/docs/ai/04_WORDS_WE_CAN_AND_CANNOT_SAY.md`
- `/docs/ai/07_BUILD_ORDER.md`

This file satisfies one of those blockers.

## Theme Guardrails

All output must preserve:

- dark copper/metallurgy theme
- Werkles-native language
- no guru jargon
- no local image generation on Sally

## Do Not Touch Yet

Do not touch:

- `/supabase/`
- `/app/api/`
- `/pages/api/`
- `/lib/supabase/`
- `/lib/stripe/`
- `/lib/auth/`
- `/middleware.ts`
- `/.env*`
- product code outside the approved dry-run artifact
