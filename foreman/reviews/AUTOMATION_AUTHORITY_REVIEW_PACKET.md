# Automation Authority Doctrine Review Packet

Status: REVIEW ARTIFACT - HUMAN REVIEW REQUIRED

This packet translates the automation authority doctrine into a reviewable form. It does not approve the doctrine, push, deploy, apply SQL, run Ghost Forge, run Bellows, generate images, enter secrets, or publish anything.

Dashboard:

- `foreman/reviews/AUTOMATION_AUTHORITY_REVIEW.html`

Source doctrine files:

- `company/WERKLES_CONSTITUTION.md`
- `foreman/HUMAN_GATES.md`
- `foreman/AI_COUSINS_PROTOCOL.md`
- `foreman/LANES.md`
- `foreman/BUDGET.md`
- `foreman/NEXT_ACTION.md`
- `foreman/platform-instructions/CODEX_FOREMAN_INSTRUCTIONS.md`
- `AGENTS.md`
- `.cursorrules`
- `.cursor/rules/foreman-cockpit.mdc`

## Core Decision

The doctrine says:

Human gates are for authority, judgment, money, credentials, public exposure, production data, and irreversible moves. They are not for routine technical proof inside an approved lane.

Ben is the Operator and decision-maker. Ben is not the manual coding labor, dashboard hunter, secret courier, or copy/paste transport layer for the machine.

## Approval Boundary

Ben must approve:

- login, OAuth, or account creation
- billing or credit card action
- private secret entry
- live deploy
- git push or merge
- SQL/schema apply
- RLS or policy changes
- any mutation of production data, including `INSERT`, `UPDATE`, or `DELETE` on live tables
- provider account creation
- external or public launch
- legal or compliance approval
- creative direction approval
- spend above approved budget
- destructive or irreversible changes
- promotion of draft/review outputs to approved or published status

## Automation Boundary

AI workers may continue routine technical proofs only when all are true:

1. The lane is listed as approved in `foreman/LANES.md`.
2. The current scope is written in `foreman/NEXT_ACTION.md` or another cockpit file.
3. The action is non-production, or the written scope explicitly permits the exact production action.
4. The action does not mutate production data unless separately approved.
5. The cost is within machine-readable limits in `foreman/BUDGET.md`.
6. No public launch, deploy, push, or merge occurs.
7. No SQL/schema/RLS/policy change is applied.
8. No user data or sensitive data is exposed.
9. Outputs remain draft/review-only unless Ben explicitly approves promotion.
10. Secrets are already configured privately or not needed.

## Explicit Scope Test

An action is explicitly scoped only if a cockpit artifact names:

- lane
- environment
- allowed action
- limit
- stop condition

Chat memory alone is not scope.

## Current Lane Snapshot

| Lane | Status | Paid calls | Stop condition |
|---|---|---:|---|
| Ghost Forge One-Prompt Technical Proof | APPROVED but completed | No more tests remaining | Stop after completed callback proof unless new written scope appears |
| Ghost Forge Batch Asset Generation | BLOCKED | No | Await creative direction and explicit batch budget approval |
| Doctrine And Cockpit Maintenance | APPROVED | No | Stop after review packet/dashboard are prepared |

## Current Budget Snapshot

| Lane | Max per test | Max per run | Daily cap | Paid calls |
|---|---:|---:|---:|---|
| Ghost Forge One-Prompt Technical Proof | $0.25 | $0.25 | $1.00 | Completed; no more tests remaining |
| Ghost Forge Batch Asset Generation | $0.00 | $0.00 | $0.00 | No |
| Doctrine And Cockpit Maintenance | $0.00 | $0.00 | $0.00 | No |

## Ghost Forge Status

The technical proof succeeded.

- Batch: `09e7c950-92bd-4469-ad2e-f355c367fdb6`
- Output: `98fd5fa4-0841-436a-94bc-b168b37cdf64`
- Replicate prediction: `g7ka1m0701rmt0cycqvssjdq48`
- Storage path: `09e7c950-92bd-4469-ad2e-f355c367fdb6/hero-background/98fd5fa4-0841-436a-94bc-b168b37cdf64.png`
- Result: automatic webhook callback worked
- Creative status: not approved as a brand asset

Next true Ghost Forge gate:

```text
[AWAITING HUMAN GATE: GHOST_FORGE_CREATIVE_DIRECTION_AND_BATCH_BUDGET_APPROVAL]
```

## Red-Team Questions

1. Does this doctrine give AI workers too much freedom to spend money?
2. Is the difference between one-prompt proof and batch generation clear enough?
3. Is production data mutation blocked strongly enough?
4. Should technical proofs in production always need separate written scope?
5. Are draft/review outputs protected from accidental promotion?
6. Should the default repair limit be lower than 2?
7. Should provider dashboard navigation be allowed when no secret entry occurs?
8. Should "live deploy" always stay a human gate, even for staging?
9. Should Cursor/Agents only classify gates, or should they ever auto-respond?
10. Does the conflict precedence order feel right?

## Review Checklist

- [ ] Human gates list is complete.
- [ ] Technical proof rules are strict enough.
- [ ] `LANES.md` is clear enough for workers.
- [ ] `BUDGET.md` is clear enough for workers.
- [ ] Cursor/Agents rules classify but do not approve human gates.
- [ ] Ghost Forge next gate is creative/budget, not technical proof.
- [ ] No doctrine implies silence is approval.
- [ ] No doctrine allows secret entry, billing, deploy, push, SQL, RLS, production data mutation, public launch, or draft promotion without Ben.

## Possible Ben Decisions

Approve doctrine as-is:

```text
APPROVE AUTOMATION AUTHORITY DOCTRINE
```

Request revisions:

```text
REVISE AUTOMATION AUTHORITY DOCTRINE:
<notes>
```

Pause automation doctrine:

```text
PAUSE AUTOMATION AUTHORITY DOCTRINE
```
