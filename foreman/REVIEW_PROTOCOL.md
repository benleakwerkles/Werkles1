# Review Protocol

Status: ongoing protocol source of truth

This protocol makes review artifacts automatic for doctrine, protocol, gate, lane, budget, platform-instruction, Cursor/Agents, and other operating-rule changes.

Ben should not have to ask twice for a reviewable format.

## When This Protocol Applies

Create a review packet and local dashboard whenever a change affects:

- company constitution or law
- human gates
- automation authority
- lanes
- budgets
- AI cousin protocol
- platform instruction shims
- Cursor rules
- `AGENTS.md`
- deployment/push/apply/governance rules
- any rule that changes what AI workers may do without stopping

This protocol does not apply to ordinary app/product implementation unless Ben asks for a review dashboard or the change alters governance, money, trust, legal posture, production data, or public launch posture.

## Required Artifacts

For each reviewable protocol change, create:

1. Markdown review packet:
   - path: `foreman/reviews/<TOPIC>_REVIEW_PACKET.md`
2. Local static HTML dashboard:
   - path: `foreman/reviews/<TOPIC>_REVIEW.html`
3. `foreman/NEXT_ACTION.md` update:
   - current gate must point to the review decision
4. Source-file map:
   - list every source doctrine/rule file touched or affected

Do not require a dev server. The HTML dashboard must open directly in a browser.

## Review Packet Must Include

- status: `REVIEW ARTIFACT - HUMAN REVIEW REQUIRED`
- what changed
- why it matters
- files touched
- source-of-truth order
- current decision Ben is being asked to make
- red-team questions
- review checklist
- approval phrase
- revision phrase
- pause/stop phrase
- explicit statement that the artifact does not push, deploy, apply SQL, enter secrets, generate images, or publish anything

## Dashboard Must Include

- plain-English doctrine summary
- gate/decision classifier when relevant
- lane and budget view when relevant
- current status and downstream gate
- red-team questions
- review checklist
- source file links
- possible decision phrases
- visible disclaimer that it is a local review artifact only

## NEXT_ACTION Rule

After creating or updating review artifacts, update `foreman/NEXT_ACTION.md` to the review gate:

```text
[AWAITING HUMAN GATE: <TOPIC>_REVIEW]
```

The file must include:

- review packet path
- dashboard path
- current decision phrase options
- downstream gate, if any
- blocked actions

## Approval Rules

Silence is not approval.

A review artifact does not approve itself.

Draft/review doctrine becomes approved only when Ben explicitly approves it and the approval is recorded in a cockpit artifact or next-action gate.

Cursor/Agents may classify whether a requested action is a human gate, but must not approve doctrine, creative direction, budget, push, deploy, SQL, secrets, billing, public launch, production data mutation, or draft promotion for Ben.

## Forbidden During Review Preparation

Do not:

- push
- deploy
- apply SQL
- enter, print, save, or request secrets
- mutate production data
- change billing
- run image generation
- run Bellows live
- promote draft/review outputs
- publish externally

## Naming Convention

Use uppercase topic stems:

- `AUTOMATION_AUTHORITY_REVIEW_PACKET.md`
- `AUTOMATION_AUTHORITY_REVIEW.html`
- `PRICING_LOCKDOWN_REVIEW_PACKET.md`
- `PRICING_LOCKDOWN_REVIEW.html`
- `GHOST_FORGE_BATCH_BUDGET_REVIEW_PACKET.md`
- `GHOST_FORGE_BATCH_BUDGET_REVIEW.html`

If a topic supersedes an older review, keep the older file and create a new versioned artifact only when the differences matter:

- `<TOPIC>_V2_REVIEW_PACKET.md`
- `<TOPIC>_V2_REVIEW.html`

## Minimum Quality Bar

The dashboard must be useful without reading chat.

The review packet must be useful when pasted into another AI thread.

The next action must be one concrete review decision, not a vague gate.
