# FROM_MAKER_WOZ_OPERATOR_CONSOLE_V1

Date: 2026-06-12
Author: Maker (Cursor) · EXECUTION_CONTEXT: CURSOR_CLOUD_CONTAINER
Type: design only. No automation, no AI, no matching engine. Human-operated version first.
Builds on: `FROM_MAKER_WIZARD_OF_OZ_TEST_V1.md` and the SoleDash state model.

## Question

If Ben manually performs Human Opportunity Discovery for **20 users**, what is the **minimum console** he needs?

## Answer in one line

Two surfaces: a **per-user Record** (the work) and a **20-row Board** (the overview), sharing one **state model**. No software required to start — a spreadsheet or a folder of files is enough. Ben is the engine.

---

## The minimum console = 2 views + 1 state model

### View A — The Board (all 20 at a glance)
One row per user. Lets Ben see who needs what next without re-reading everything.

| Column | Purpose |
|--------|---------|
| User # / name | identity |
| Lane (or "unsure") | rough type |
| State | where they are (see state model) |
| Bottleneck (1 line) | the named blocker |
| Rec sent? (date) | did the recommendation go out |
| Acted? | did they take the next action |
| Outcome | what happened (see outcome tracking) |
| Next touch | the next thing Ben must do + when |

This is the whole "console" for daily driving. A sorted sheet (by State / Next touch) tells Ben exactly what to do next.

### View B — The User Record (one per user)
The deep file behind each board row. Four blocks — the exact four the mission named:

**1. Intake** (captured once)
- The 10 intake questions (situation, goal, why-now, assets, self-stated blocker, what they've tried, hard constraints, "one thing a stranger could hand you," lane?, contact/timing).
- Raw, plain-language. No parsing.

**2. Bottleneck** (Ben's read)
- Translated need(s): partner / capital / customer / skill / license / intro / validation / clarity.
- **Primary bottleneck** (one), + why (evidence from intake), + confidence (H/M/L).

**3. Recommendation** (delivered)
- **Primary = best next path** (one move).
- **Supporting = person/resource/tool** (only if it unblocks the path).
- Visible reasons. "What we're NOT claiming" line.
- Sent date + how delivered.

**4. Outcome tracking**
- Acted? (yes/no/partial) + date.
- Result: took action → what happened (intro made / step done / stalled).
- "Felt right?" check (did the bottleneck + path resonate).
- Follow-up needed? Next touch date.
- Final disposition: Win / Partial / No-fit / Dropped / Awaiting.

### The state model (shared, reuses SoleDash states)
Each user moves through:

```
Received          -> intake in, not yet reviewed
Thinking          -> Ben is reviewing / drafting
Blocked           -> needs more info from user before Ben can recommend
Response Incoming -> recommendation sent, awaiting user reaction
Complete          -> outcome recorded (Win / Partial / No-fit / Dropped)
Failed            -> couldn't produce a usable rec (record why)
```

(These are the same six states already in SoleDash — so the board maps 1:1 onto the existing console if Ben later wants it rendered.)

---

## Outcome tracking (called out, since it's the learning payoff)

For each user, record the chain so 20 runs become evidence:
- intake → primary bottleneck → primary recommendation → **acted? → result → felt-right?**

Across 20, that yields the only metrics that matter for V1:
- **"Feels right" rate** (translation/bottleneck trust)
- **Action-taken rate** (was the rec actionable + believable)
- **Win/Partial rate** (did the path actually help)
- **Drop-off points** (where the 20 fall out)

This is what tells Ben whether the discovery chain works *before* anyone builds an engine.

---

## Minimum implementation (pick the lightest that works)

Ranked simplest-first; all are human-operated, no automation:

1. **One spreadsheet** = the Board; one tab/row per user with the Record fields inline or linked. Zero setup. Recommended for 20 users.
2. **A folder of files** = one markdown Record per user in `foreman/handoffs/` (or a `discovery/` folder) + a tracker sheet for the Board.
3. **Reuse SoleDash (already built)** as a **read-only Board**: drop one Record file per user into the watched folder; the existing status sidecar sets each user's state; SoleDash renders the 20-row board. Still 100% human-operated — SoleDash only *displays*, it does not decide.

Start with #1 (sheet). Graduate to #3 only if Ben wants a live visual board. No new software is required to run the test.

---

## Daily operator flow (no automation)

1. Open the Board, sort by State + Next touch.
2. New intakes (`Received`) → review → set `Thinking`.
3. Fill the Record: translate need → name the bottleneck → write the recommendation (primary path + optional support).
4. Send it → set `Response Incoming`, log sent date.
5. On user reaction → record Acted? + felt-right? + result → set `Complete` (with disposition) or `Blocked`/`Failed`.
6. Anything needing more info → `Blocked` + note what's missing + Next touch.

---

## What NOT to build yet

- No matching/recommendation **engine**, scoring, or AI.
- No **auto-intake parsing** or auto-translation.
- No **accounts / auth / payments / verification**.
- No **notifications/automation** (Ben sets next-touch dates manually).
- No **fancy console UI** — a sheet is the MVP; SoleDash board is optional display only.
- No **integrations** (CRM, email automation, relay courier) for the test.

The minimum console is **structure, not software**: a board, a record, a state model, and Ben.

## Hard stops honored

Design only. No automation, no AI, no matching engine. Human-operated version delivered first.
