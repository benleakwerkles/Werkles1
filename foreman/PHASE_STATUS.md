# Foreman Phase Status

Current Phase: DRY-RUN-0.1
Current Step: foreman-pipeline-copy
Risk Level: LOW
Task Type: static mock-only artifact
Target AI: Builder
Approved Scope:
- /lib/copy.ts

Required Task Sources:
- /docs/ai/04_WORDS_WE_CAN_AND_CANNOT_SAY.md

Task Brief:
Create /lib/copy.ts containing centralized Werkles UI microcopy constants for mock UI only.

Task Rules:
- No backend code.
- No Supabase.
- No Stripe.
- No auth.
- No RLS.
- No real user data.
- No production behavior.
- Must obey Words We Can and Cannot Say.

Expected Output:
- /lib/copy.ts
- short note listing any language-risk assumptions

Audit Focus:
- forbidden investment/deal/fundraise language
- no misleading verified claims
- no backend claims
- no product behavior changes

Pending Handoff: none
Last Builder Output: none
Last Bean Audit: none
Last Comptroller Gate: none

Blockers:
- /docs/ai/00_SOURCE_OF_TRUTH.md is missing.
- /docs/ai/01_WHO_RUNS_WHAT.md is missing.
- /docs/ai/07_BUILD_ORDER.md is missing.
- /docs/ai/02_BUILDER.md is missing.
- /docs/ai/04_WORDS_WE_CAN_AND_CANNOT_SAY.md is missing.
- External AI output simulation is not permitted until Ben explicitly permits simulation.

Next Safe Action:
- Run `node scripts/foreman/foreman-next.mjs` to generate the dry-run handoff packet. The packet must be marked not ready until missing source files are supplied.
