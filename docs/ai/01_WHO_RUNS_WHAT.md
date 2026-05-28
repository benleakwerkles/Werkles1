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
