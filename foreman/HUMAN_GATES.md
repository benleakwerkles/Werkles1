# Human Gates

Status: cockpit rule anchor

Human gates are for authority, judgment, money, credentials, public exposure, production data, and irreversible moves. They are not routine technical proof inside an approved lane.

## Conflict Precedence

If cockpit files or platform shims conflict, use this order:

1. `foreman/HUMAN_GATES.md`
2. `foreman/LANES.md`
3. `foreman/BUDGET.md`
4. `foreman/NEXT_ACTION.md`
5. `foreman/AI_COUSINS_PROTOCOL.md`
6. platform instruction shims
7. chat memory

Chat memory alone is not scope.

## Non-Gate Technical Proofs

Technical proofs are not human gates.

If an action is classified as a non-gate under this file, do not trigger the Gate Review UI Protocol at all. Log a normal status line and continue within the approved lane.

Non-gate technical proofs inside approved scope include:

- typecheck
- build
- lint if non-interactive and already configured
- health check
- local route load
- webhook callback proof
- one test request inside approved budget
- dry run
- upload-path proof
- scaffold verification
- any routine technical proof inside an approved lane

Routine technical proofs may continue without stopping only when all are true:

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

## Human Gates Are Not Errands

When a task reaches a provider, dashboard, or account gate, Codex and all cousins must:

1. Do all mechanical prep first.
2. Open or navigate to the exact provider page if a controllable browser/session is available.
3. Stop only at the point where Ben must personally handle login, OAuth, billing, secret entry, or final approval.
4. Never ask Ben to manually find dashboards, hunt menus, copy long values, or interpret provider UI if Codex can drive there.
5. After Ben says the gate phrase, resume mechanical work until the next true human-only gate.
6. Never enter, print, save, or request secrets in chat.
7. Never click final create, deploy, billing, or approval buttons without explicit approval.

## Ben Must Approve

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

## Gate Classification

When an `[AWAITING HUMAN GATE]` is reached, classify it as Tier 1 or Tier 2.

Any human gate not explicitly listed as Tier 2 defaults to Tier 1 until Ben reclassifies it.

Technical proofs are not Tier 1 or Tier 2 gates. They are non-gate technical proofs.

### Tier 1 Gates

Tier 1 gates require a static HTML review dashboard and a matching Markdown packet.

Tier 1 includes:

- doctrine/protocol changes
- automation authority changes
- budget/spend approvals
- batch generation approvals
- deploy/release approvals
- SQL/schema/RLS approvals
- production data mutation
- Stripe/payment go-live
- provider account creation
- public launch/external send
- legal/compliance approval
- major architecture decisions
- any unclassified human gate

For Tier 1, create gate-specific artifacts:

```text
foreman/reviews/GATE-<short-slug>-<yyyymmdd-HHMM>.html
foreman/reviews/GATE-<short-slug>-<yyyymmdd-HHMM>.md
```

Do not use `CURRENT_GATE_REVIEW.html` as the only artifact. If it exists, it must be an index or pointer to the current active gate review.

Every Tier 1 gate dashboard must include:

- Confidence: `HIGH`, `MEDIUM`, or `LOW`
- confidence justification
- unknowns
- blast radius
- files changed
- systems affected
- budget/spend implications
- lane status
- known risks
- what remains blocked
- approval, rejection, and patch phrases

Do not present AI-generated risk analysis as certain if source visibility is incomplete.

### Tier 2 Gates

Tier 2 gates require concise Markdown only. A `NEXT_ACTION.md` update can be enough.

Tier 2 includes low-risk human decisions that do not affect money, secrets, deploys, schema, production data, public exposure, legal posture, or core doctrine.

Examples:

- minor copy approval
- small visual/taste approval
- scaffold review
- local-only non-production file review
- choosing between already-safe implementation options

Do not create an HTML dashboard for Tier 2 unless Ben requests it.

## Explicit Scope

An action is explicitly scoped only if a cockpit artifact names:

- lane
- environment
- allowed action
- limit
- stop condition

Chat memory alone is not scope.

## Approved Lane

A lane is approved only if it appears in `foreman/LANES.md` with:

- lane name
- status: `APPROVED`, `BLOCKED`, or `PAUSED`
- allowed actions
- forbidden actions
- budget reference
- current stop condition

## Approved Budget

Before any Tier 1 spend or batch gate can proceed, `foreman/BUDGET.md` must define:

- lane
- paid calls allowed: `yes` or `no`
- max cost per test
- max cost per run
- daily cap
- stop condition when budget is exceeded

If `foreman/BUDGET.md` is missing or incomplete for the lane, the gate is blocked until budget is defined.

## Approval Durability

Chat approval alone is not durable.

When Ben approves, rejects, or patches a human gate, record it in:

```text
foreman/gates/APPROVAL_LOG.md
```

Each entry must include:

- timestamp
- gate name
- gate artifact path
- exact Ben phrase
- decision: `APPROVED`, `REJECTED`, `PATCH_REQUESTED`, or `PAUSED`
- next gate

Silence is not approval.

Draft/review outputs become approved only when Ben explicitly approves them and the approval is recorded in the cockpit.

## Concurrent Gate Rule

Do not overwrite gate review artifacts.

Use gate-specific filenames:

```text
foreman/reviews/GATE-<short-slug>-<yyyymmdd-HHMM>.html
foreman/reviews/GATE-<short-slug>-<yyyymmdd-HHMM>.md
```

Default operating mode: Foreman serializes gates. Only one active human gate should be presented to Ben at a time unless Ben explicitly approves parallel gate review.

Maintain either:

- a single active gate pointer/index in `foreman/reviews/CURRENT_GATE_REVIEW.html`, or
- a simple active gate queue in `foreman/NEXT_ACTION.md`

Current default for this repo: use the active gate queue in `foreman/NEXT_ACTION.md`.

## Failure Handling

Failure of a technical proof inside an approved lane is not automatically a human gate.

Codex may attempt bounded self-repair only when:

- repair stays inside the same approved lane
- no secrets are changed
- no schema/RLS/production data mutation is required
- no deploy/push/merge is required
- cost remains within `foreman/BUDGET.md`
- repair attempts do not exceed the lane's repair limit

Default repair limit:

- 2 attempts per failed technical proof unless `foreman/LANES.md` says otherwise

Codex must stop and report if:

- repair requires a human gate
- repair exceeds budget
- repair exceeds allowed attempts
- failure cause is unknown after bounded repair
- logs suggest secret, provider, billing, schema, RLS, production data, or user-data risk

## Self-Modifying Doctrine Rule

Protocol changes are Tier 1 gates.

If the AI is modifying the protocol it follows, it may prepare the review dashboard and Markdown packet, but it must pause before applying self-modifying doctrine unless Ben has explicitly approved the patch.

No automated re-entry on doctrine changes.

## Ghost Forge Rule

A single callback proof inside an already-approved one-prompt test is a technical proof, not a creative approval gate.

Ben does not approve the test image unless the next stated gate is creative direction approval.

## Secret Boundary

Codex must not ask Ben to paste secrets into chat. Codex must not enter, print, save, or request secret values in repo files, logs, or messages.

If a provider screen requires a secret value, Codex stops with the page staged and tells Ben exactly which field needs Ben-only private entry.

## Execution Context And Evidence Locality

Every agent must report its execution context before making file-system, repo-state, environment, runtime, or deployment claims. See `foreman/EXECUTION_CONTEXT_RULES.md` for the full rules and allowed contexts.

Before any merge, push, or deploy recommendation, the agent must identify whether the required evidence is cloud-side, local Sally-side, or both. A `CURSOR_CLOUD_CONTAINER` agent must not assert local Windows working-tree state, local `.env` contents, or local dev-server state; if such local evidence is required for the gate, it must request a `LOCAL_SALLY_WINDOWS` check and mark the recommendation CONDITIONAL until that evidence is supplied. This does not lower any existing gate: push/merge/deploy remain human gates.

## Cursor Bulk-Work Authority

Promoting Cursor / Smart Factory from smoke-test writer to real bulk-work writer is a human gate because it changes write authority.

Cursor may not do real bulk work until all are true:

- `foreman/ACTIVE_AGENT.md` names Cursor as the active writer.
- `foreman/LANES.md` lists the exact approved lane.
- `foreman/NEXT_ACTION.md` scopes the work, environment, limits, and stop condition.
- Ben explicitly approves Cursor bulk-work authority or a bounded Cursor task.
- Push, merge, deploy, SQL/schema/RLS/policy changes, secrets, production data mutation, provider/account/billing work, and public launch remain separate human gates.

Cursor prompting Ben once per file means the smoke test has not met the no-copy/no-micromanagement operating goal. Treat that as `PATCH_REQUESTED`, not as approval for real work.
