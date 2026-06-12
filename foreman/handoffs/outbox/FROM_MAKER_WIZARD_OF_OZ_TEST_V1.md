# FROM_MAKER_WIZARD_OF_OZ_TEST_V1

Date: 2026-06-12
Author: Maker (Cursor) · EXECUTION_CONTEXT: CURSOR_CLOUD_CONTAINER
Type: test design only. No code, no build, no automation.
Source: `FROM_MAKER_USER1_JOURNEY_MAP_V1.md` (smallest 30-day slice).

## Goal

Validate the core Human Opportunity Discovery chain — **Layer 0 → need translation → one bottleneck → one explained recommendation → one action** — using a human in the loop, before building any engine.

Shape: a real person submits **one intake**; a human reviewer produces **one bottleneck + one explained recommendation + one next action**, by hand. Everything else is stubbed.

**Recommendation rule:**
- **Primary recommendation = the best NEXT PATH** (a move/step the user should take).
- **Supporting recommendation = a person / resource / tool**, only if it directly unblocks the primary path.

---

## 1. Intake questions

Plain-language, ~10 questions, mostly free text. No account, no payment. Goal: capture Layer 0 + enough to translate need and spot a bottleneck. (Functional wording below — not final user-facing copy.)

1. **In a sentence or two, where are you right now?** (situation)
2. **What are you trying to move toward in the next 3–6 months?** (intent/goal)
3. **Why now? What changed or is pushing you?** (motivation/urgency)
4. **What do you already have to work with?** (assets: skills, time, money, network, tools, customers, a place, an idea) — list what applies.
5. **What feels like the biggest thing in your way?** (self-stated bottleneck — captured but not trusted as truth)
6. **What have you already tried, and what happened?** (history / what's not working)
7. **What can't change?** (hard constraints: location, time, money floor/ceiling, obligations)
8. **If a stranger could hand you ONE thing right now, what would it be?** (reveals perceived need)
9. **Which best describes you today?** Builder / Operator / Backer / Connector / Spark / **Not sure yet** (lane, optional)
10. **How do we reach you, and how soon do you want a first answer?** (contact + expectation)

Optional: "Anything else you want us to know?" (free text).

Capture mode: a form or a guided 1:1 (call/chat). No automated parsing in V1.

---

## 2. Reviewer worksheet (human-completed)

The reviewer (operator) fills this per intake. ~15 minutes. This IS the "engine" for V1.

```
INTAKE ID: __________   Date: ______   Reviewer: ______

A. RESTATE (Layer 0)
   - Situation in my words: ______
   - What they have: ______
   - What they want: ______
   - Hard constraints: ______

B. TRANSLATE NEED (what they actually need vs what they said)
   - Stated need (their words, Q5/Q8): ______
   - Translated need(s): [partner | capital | customer | skill | license/credential | intro | validation | clarity | other]: ______
   - Mismatch noticed (stated vs real)? ______

C. BOTTLENECK CANDIDATES
   - List all plausible blockers: ______
   - PRIMARY bottleneck (the one that, if removed, unlocks the most): ______
   - Why this one (evidence from intake): ______
   - Confidence: HIGH / MEDIUM / LOW

D. PRIMARY RECOMMENDATION (best next path)
   - The single move/step: ______
   - Why this is the best next path (visible reasons): ______
   - What it is NOT claiming / what stays uncertain: ______

E. SUPPORTING RECOMMENDATION (only if needed)
   - Person / resource / tool that unblocks the primary path: ______
   - Why it helps: ______

F. ONE NEXT ACTION (concrete, low-friction, no payment/verification)
   - The action: ______
   - Expected response/timing: ______

G. NOTES / UNKNOWNS / what I'd want the engine to learn: ______
```

---

## 3. Recommendation format (delivered to the user)

One clean artifact (message/doc). No marketing tone; honest and specific.

```
YOUR SITUATION
<one-paragraph reflection of where they are — proves we listened>

THE REAL BOTTLENECK
<the single primary blocker, named plainly>

YOUR BEST NEXT PATH  (primary recommendation)
<one concrete move/step>

WHY WE THINK THIS
<visible reasons tied to their intake — not magic>

WHAT WOULD HELP  (supporting — only if included)
<one person / resource / tool that unblocks the path>

YOUR NEXT ACTION
<one concrete, low-friction thing to do now>

WHAT WE'RE NOT CLAIMING
<honesty line: what's still self-reported / uncertain / not guaranteed>
```

Rule reflected: exactly **one** primary path; supporting is optional and only if it directly serves the path.

---

## 4. Success metrics

Quantitative (per cohort of test users):
- **Intake completion rate** — % who finish the intake.
- **Recommendation delivery rate** — % who receive a rec within the promised window.
- **"Feels right" rate** — % who, on a 1-question check, say the bottleneck + path resonate (target signal of translation trust).
- **Action-taken rate** — % who take the single Next Action.
- **Time-to-first-rec** — median reviewer turnaround.

Qualitative:
- Users can restate their bottleneck back in their own words (comprehension).
- Unprompted "that's exactly it" / "I hadn't thought of that" moments.
- Reviewer confidence vs user reaction correlation.

**North-star for V1:** does a real person go from "here's my situation" → "one believable, explained recommendation" → **takes the action**?

---

## 5. Failure metrics

- **Drop-off in intake** (which question loses them — instrument question-level abandonment).
- **Mistranslation rate** — user says "that's not what I meant" about need/bottleneck.
- **Generic-output flag** — user reaction "I already knew that" / "too obvious."
- **No-action rate** — receives rec, does nothing (and why: not believable / not feasible / no clear step / wrong timing).
- **Trust break** — user feels judged, sold to, or guru-handled.
- **Reviewer ambiguity** — reviewer can't pick a single bottleneck/path from the intake (signals intake gaps).
- **Latency failure** — rec not delivered in the promised window.

Each failure maps to a fix target: intake design, translation rubric, bottleneck logic, recommendation believability, or action design.

---

## 6. What NOT to build yet

- No matching/recommendation **engine**, ML, or scoring algorithm.
- No automated **need translation** or bottleneck detection.
- No **accounts / auth / profiles** (intake is standalone).
- No **payments / Stripe / membership** gates.
- No **Crucible / verification** flows.
- No **dashboards**, match deck, or intro-routing system.
- No **Ghost Forge** assets or visual polish for the test.
- No **scaling infra** — a form + a human reviewer + a delivered doc is the whole system.
- No **multi-rec / browsing** ("Possible Outcomes" layer) — one primary path only.

The point is to learn whether the human-judged chain earns trust and action. Build only what's needed to run that learning loop.

---

## How to run it (operational, no code)

- Intake = a form or scheduled 1:1. Reviewer = Ben/operator using the worksheet. Delivery = the recommendation format sent back. Track metrics in a simple sheet. Target a small first cohort (enough to see patterns, not statistical significance).

## Hard stops honored

Test design only. No code, no build, no automation.
