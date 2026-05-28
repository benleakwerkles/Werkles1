# READY FOR OPERATOR TO SEND

# Foreman Handoff Packet

## Manifest
- target AI: Builder
- phase: DRY-RUN-0.1
- step: foreman-pipeline-copy
- task type: static mock-only artifact
- risk level: LOW
- readiness: READY FOR OPERATOR TO SEND
- approved scope:
  - /lib/copy.ts
- required files:
  - /docs/ai/00_SOURCE_OF_TRUTH.md
  - /docs/ai/01_WHO_RUNS_WHAT.md
  - /docs/ai/07_BUILD_ORDER.md
  - /docs/ai/02_BUILDER.md
  - /docs/ai/04_WORDS_WE_CAN_AND_CANNOT_SAY.md
- source files consulted:
  - docs/ai/00_SOURCE_OF_TRUTH.md
  - docs/ai/01_WHO_RUNS_WHAT.md
  - docs/ai/07_BUILD_ORDER.md
  - docs/ai/02_BUILDER.md
  - docs/ai/04_WORDS_WE_CAN_AND_CANNOT_SAY.md
- latest previous Bean audit: none
- latest previous Comptroller gate: none
- relevant schema/spec files:
  - none
- generated_at: 2026-05-24T00:42:51.179Z
- phase_transitioned_at: 2026-05-24T00:05:37.433Z
- expected source file missing: no
- missing source files:
  - none

## Manifest JSON

```json
{
  "schemaVersion": "foreman-manifest/v1",
  "targetAI": "Builder",
  "phase": "DRY-RUN-0.1",
  "step": "foreman-pipeline-copy",
  "taskType": "static mock-only artifact",
  "riskLevel": "LOW",
  "readiness": "READY FOR OPERATOR TO SEND",
  "approvedScope": [
    "lib/copy.ts"
  ],
  "requiredFiles": [
    "docs/ai/00_SOURCE_OF_TRUTH.md",
    "docs/ai/01_WHO_RUNS_WHAT.md",
    "docs/ai/07_BUILD_ORDER.md",
    "docs/ai/02_BUILDER.md",
    "docs/ai/04_WORDS_WE_CAN_AND_CANNOT_SAY.md"
  ],
  "sourceFilesConsulted": [
    "docs/ai/00_SOURCE_OF_TRUTH.md",
    "docs/ai/01_WHO_RUNS_WHAT.md",
    "docs/ai/07_BUILD_ORDER.md",
    "docs/ai/02_BUILDER.md",
    "docs/ai/04_WORDS_WE_CAN_AND_CANNOT_SAY.md"
  ],
  "latestPreviousBeanAudit": null,
  "latestPreviousComptrollerGate": null,
  "relevantSchemaFiles": [],
  "generated_at": "2026-05-24T00:42:51.179Z",
  "generatedTimestamp": "2026-05-24T00:42:51.179Z",
  "phase_transitioned_at": "2026-05-24T00:05:37.433Z",
  "expectedSourceFileMissing": false,
  "missingSourceFiles": [],
  "riskCheck": {
    "ok": true,
    "declaredRisk": "LOW",
    "requiredRisk": "LOW",
    "failures": []
  },
  "preflightFailures": []
}
```


## Operator Boundary

Codex is preparing this packet only. Codex is not approving GO, applying output, or pushing.

## Task

Target AI: Builder

Phase: DRY-RUN-0.1

Step: foreman-pipeline-copy

Risk: LOW

Task type: static mock-only artifact

Approved scope:
- /lib/copy.ts

## Instructions To Target AI

Create /lib/copy.ts containing centralized Werkles UI microcopy constants for mock UI only.

Do not change files outside the approved scope. Return a concise implementation note plus any patch/content required.

## Task Rules

- No backend code.
- No Supabase.
- No Stripe.
- No auth.
- No RLS.
- No real user data.
- No production behavior.
- Must obey Words We Can and Cannot Say.

## Expected Output

- lib/copy.ts
- short note listing any language-risk assumptions

## Audit Focus

- forbidden investment/deal/fundraise language
- no misleading verified claims
- no backend claims
- no product behavior changes

For the current dry run, the expected artifact is LOW-risk and mock-only. Do not touch schema, RLS, Stripe, verification, auth, payment, API routes, or real product logic.

## Source Notes

### /docs/ai/00_SOURCE_OF_TRUTH.md

# Werkles Source Of Truth

Werkles is a private partner-discovery platform for serious builders, operators, backers, connectors, and sparks. It helps people find the missing piece for a real-world business effort while staying out of money movement, lending, securities, broker-dealer, or deal facilitation territory.

## Core Product Boundary

- Werkles is a partner discovery and verification-gated networking platform.
- Werkles does not hold, move, transmit, escrow, lend, solicit, recommend, structure, broker, or facilitate funds.
- Werkles does not promise outcomes, returns, equity, financing, or business success.
- Deals, contracts, investments, loans, purchases, and legal structures happen off-platform with professional review.

## Foreman Boundary

Foreman controls the build workflow. It prepares packets, preserves evidence, checks gates, and stops when approvals are missing.

Ben-facing commands are:

- `STATUS`
- `CONTINUE`
- `STOP`
- `APPROVE`
- `PUSH`

Internal Foreman commands may exist, but Ben should not be required to remember or manually sequence them.

## Brand Voice

The voice is Mythic Capitalism: industrial, warm, sharp, funny, and serious. Think dark copper, steel benches, The Forge, and late-night builders with real stakes.

Use Werkles-native language:

- Werkles
- Dynamo
- The Forge
- dossier
- Blueprint
- Lock the Joints
- The Foundry
- knock on the door
- inspect the steel

Avoid guru jargon, hustle-bro fog, and MBA mist:

- no synergy
- no unlock your potential
- no abundance mindset
- no thought-leader sludge
- no vague optimization talk
- no generic team-collaboration slop

## Visual Rules

- Preserve the dark copper/metallurgy direction.
- Favor industrial warmth, blackened steel, copper, teal-green oxidation, worn paper, blueprint lines, subtle iridescence, and workshop light.
- Do not drift into pastel SaaS, beige coaching brands, glassy guru dashboards, or generic startup gradients.
- UI should feel built, not floated.

## Sally Resource Protection

Do not run local image generation on Sally.

Forbidden on Sally while Codex is active:

- Stable Diffusion
- ComfyUI
- Automatic1111
- local models
- local GPU rendering
- local upscalers
- local batch image processing
- large image batch downloads
- opening many generated images at once

Use cloud-hosted image generation only:

- ChatGPT image generation
- hosted Midjourney / Discord
- hosted Adobe Firefly
- hosted Ideogram
- hosted Runway
- other browser/cloud services

Sally is 

[TRUNCATED 72 CHARS]

### /docs/ai/01_WHO_RUNS_WHAT.md

# Who Runs What

Werkles uses multiple AI assistants, but Codex is the build captain inside the repo.

## Operator

Ben is the Operator.

Ben decides:

- GO / NO-GO
- product direction
- brand taste
- legal/accounting escalation
- push/release approval
- whether simulation is allowed
- when the dry-run resumes

Ben should only need these Foreman commands:

- `STATUS`
- `CONTINUE`
- `STOP`
- `APPROVE`
- `PUSH`

## Codex

Codex is the build captain and Foreman command executor.

Codex may:

- inspect the repo
- create handoff packets
- apply approved local patches
- run local checks
- preserve logs and evidence
- update Foreman cockpit files
- stop at gates

Codex must not:

- decide GO
- push without explicit `PUSH`
- deploy without explicit instruction
- modify product code during Foreman-only phases
- bypass Bean or Comptroller gates
- use local image generation on Sally

## DeepSeek / Bean

Bean is the engineering critic and audit layer.

Bean checks:

- scope creep
- hidden risk
- missing tests
- unclear gate logic
- forbidden language
- compliance traps
- workflow drift

Bean may return:

- `VERDICT: GO`
- `VERDICT: CONDITIONAL GO`
- `VERDICT: NO-GO`

## ChatGPT / Comptroller

Comptroller is the final GO/NO-GO gate.

Comptroller checks:

- whether Bean findings were handled
- whether the diff matches the approved scope
- whether safety gates passed
- whether apply or push should remain blocked

Comptroller may return:

- `VERDICT: GO`
- `VERDICT: NO-GO`

## Gemini

Gemini supports strategy, copy alternatives, matching logic, and structured critique. Gemini is useful for optional parallel thinking but does not override Foreman gates.

## Claude

Claude may be used for prose review, UX critique, or structured document review. Claude does not override Foreman gates.

## Shared Rules

All AIs must obey:

- no local image generation on Sally
- no guru jargon
- dark copper/metallurgy visual direction
- Werkles-native language
- no money movement, lending, securities, broker-dealer, or deal-facilitation features
- no product-code changes unless the phase allows it and gates pass


### /docs/ai/07_BUILD_ORDER.md

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


### /docs/ai/02_BUILDER.md

# Builder Instructions

Builder produces the requested artifact and nothing outside scope.

## Prime Rule

Build exactly the requested file or patch. Do not wander into product logic, auth, Stripe, Supabase, RLS, middleware, API routes, or deployment unless the phase explicitly authorizes that work.

For the current dry-run, the target artifact is mock-only:

- `/lib/copy.ts`

No backend code. No Supabase. No Stripe. No auth. No RLS. No real user data. No production behavior.

## Required Output Format

Builder output must include:

- `Phase: <phase>`
- `Step: <step>`
- `Superseded: no`
- concise implementation note
- exact file content or patch
- language-risk assumptions

## Voice Rules

Use Werkles-native language:

- Werkles
- Dynamo
- The Forge
- Blueprint
- dossier
- The Foundry
- inspect the steel
- Lock the Joints
- knock on the door

Avoid guru jargon:

- no synergy
- no abundance
- no unlock your potential
- no thought leader
- no passive-income bait
- no generic SaaS collaboration fluff

Tone should feel like dark copper, metallurgy, pressure, and craft. Always joking, always serious.

## Visual Rules

If the task touches UI copy or visual direction:

- preserve dark copper/metallurgy
- use industrial warmth
- use blackened steel, copper, teal-green oxidation, blueprint marks, and workshop light
- avoid pastel SaaS, beige guru branding, and generic gradients

## Sally Resource Rule

Do not run local image generation on Sally.

Do not invoke:

- Stable Diffusion
- ComfyUI
- Automatic1111
- local GPU rendering
- local upscalers
- local model batches

Use cloud-hosted image tools only when image generation is explicitly needed.

## Compliance Language

Do not imply Werkles verifies all claims equally.

Do not imply Werkles:

- holds funds
- moves money
- brokers deals
- recommends investments
- makes anyone trustworthy
- guarantees identity, capital, work history, or references beyond the actual verification source

Use careful proof language:

- verification-gated
- receipt
- signal
- claim checked
- harder to fake
- inspected, not guaranteed


### /docs/ai/04_WORDS_WE_CAN_AND_CANNOT_SAY.md

# Words We Can And Cannot Say

This file governs Werkles copy, UI labels, handoff language, and mock dry-run copy.

## Approved Werkles Language

Use:

- Werkles
- Dynamo
- The Forge
- The Foundry
- Blueprint
- dossier
- inspect the steel
- Lock the Joints
- knock on the door
- open a conversation
- request an intro
- verified signal
- proof receipt
- claim checked
- harder to fake
- membership
- Foundry Dues
- platform access
- verification-gated networking

## Approved Tone

Werkles should sound:

- industrial
- warm
- funny
- precise
- skeptical
- anti-gatekeeper
- grounded in real work

The visual and verbal world is dark copper/metallurgy:

- blackened steel
- copper edges
- teal oxidation
- blueprint lines
- workshop light
- pressure and craft

## Avoid Guru Jargon

Do not use:

- synergy
- abundance
- manifestation
- thought leader
- unlock your potential
- level up your life
- passive income
- boss babe
- mastermind energy
- hustle harder
- optimize your destiny
- generic team collaboration
- world-class solutions
- seamless innovation

## Compliance-Sensitive Words To Avoid

Avoid or escalate before using:

- invest
- investment
- investor
- fundraise
- raise
- pitch
- deal room
- syndicate
- securities
- ROI
- return
- equity
- loan opportunity
- broker
- intermediary
- advisor
- guaranteed
- certified trustworthy

Prefer:

- Backer
- Builder
- Operator
- Connector
- Spark
- membership
- intro request
- dossier
- proof signal
- verification receipt
- partner discovery
- off-platform professional review

## Verification Language

Do not say:

- “Werkles proves they are trustworthy.”
- “Werkles guarantees capital.”
- “Werkles verifies every claim.”
- “Verified means safe.”

Say:

- “Werkles checks specific claims through available proof signals.”
- “Verification makes claims harder to fake.”
- “Some proof is stronger than other proof.”
- “References and work history can be gameable; identity and vendor receipts are stronger signals.”

## Image Generation Rule

Do not run local image generation on Sally. Use cloud-hosted image generation only.

Allowed:

- ChatGPT image generation
- hosted Midjourney / Discord
- hosted Adobe Firefly
- hosted Ideogram
- hosted Runway
- other browser/cloud services

Forbidden:

- Stable Diffusion on Sally
- ComfyUI on Sally
- Automatic1111 on Sally
- local GPU rendering
- local upscalers
- local image batch processing

