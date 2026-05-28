# Gate Review: Automation Authority Doctrine

Status: TIER 1 GATE REVIEW - HUMAN REVIEW REQUIRED

Gate:

```text
[AWAITING HUMAN GATE: AUTOMATION_AUTHORITY_DOCTRINE_REVIEW]
```

## Confidence

Confidence: MEDIUM

Confidence justification:

- High confidence that the doctrine files now classify routine technical proofs as non-gates.
- High confidence that platform shims now point back to cockpit sources instead of duplicating full gate law.
- Medium confidence overall because the doctrine is self-modifying and should be reviewed by Ben before being treated as settled operating law.

## Unknowns

- Whether Ben wants every doctrine/protocol change to get a Tier 1 dashboard, or only changes that materially alter automation authority.
- Whether the default repair limit of 2 attempts is too high or too low.
- Whether future staging deploys should remain Tier 1 or get a narrower classification.

## Blast Radius

- AI worker behavior
- human gate classification
- Cursor/Agents fly-swatter behavior
- review artifact requirements
- approval logging
- Ghost Forge batch approval path

## Files Changed

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
- `foreman/gates/APPROVAL_LOG.md`
- `foreman/reviews/GATE-automation-authority-doctrine-review-20260526-1745.md`
- `foreman/reviews/GATE-automation-authority-doctrine-review-20260526-1745.html`

## Systems Affected

- Repo cockpit process
- AI cousin handoff behavior
- Cursor/Agents repo instructions
- Gate review UI protocol
- Ghost Forge governance, not Ghost Forge runtime

## Budget / Spend Implications

- No paid calls allowed by this gate.
- No deploy, push, SQL, provider call, image generation, Bellows run, or production data mutation authorized.
- Spend/batch gates require a complete `foreman/BUDGET.md` lane before they can proceed.

## Lane Status

- Doctrine And Cockpit Maintenance: APPROVED for local doctrine/cockpit edits only.
- Gate Review UI Protocol: APPROVED for this red-team patch only.
- Ghost Forge One-Prompt Technical Proof: completed; no more paid tests remaining under current scope.
- Ghost Forge Batch Asset Generation: BLOCKED until creative direction and batch budget approval.

## Known Risks

- Over-review risk: too many Tier 1 dashboards could slow the machine.
- Under-review risk: too much automation freedom could bypass Ben's judgment.
- Drift risk: if shims duplicate gate lists, they can become stale.
- Ambiguity risk: unclassified gates default to Tier 1, which is safe but may feel heavy.

## What Remains Blocked

- approving automation doctrine as settled
- Ghost Forge creative direction approval
- Ghost Forge batch budget approval
- batch/background image generation
- using generated images as approved brand assets
- deploy, push, SQL/schema/RLS/policy changes, secrets, billing, public launch, or production data mutation

## Approval Phrase

```text
APPROVE AUTOMATION AUTHORITY DOCTRINE
```

## Rejection Phrase

```text
REJECT AUTOMATION AUTHORITY DOCTRINE
```

## Patch Phrase

```text
PATCH AUTOMATION AUTHORITY DOCTRINE:
<notes>
```
