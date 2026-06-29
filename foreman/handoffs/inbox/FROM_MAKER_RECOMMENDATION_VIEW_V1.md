# FROM MAKER - RECOMMENDATION VIEW V1

Execution context: `CURSOR_CLOUD_CONTAINER`.

Status: design/spec handoff. No production deploy, SQL, secrets, billing, merge, or live data mutation is approved by this file.

## Mission

Make the Recommendation View the centerpiece of the Werkles concierge workflow.

This view is where Dink stops behaving like a search box and starts behaving like a serious concierge: it hears the surface ask, names the deeper need, shows its work, recommends one next move, and explains why the other paths did not earn the hammer.

## Placement

Primary home: dashboard concierge surface, replacing or expanding the current Match Deck result card.

Recommended route shape:

```text
/dashboard/recommendation
```

Secondary embedding:

```text
/dashboard
  Match Deck input / Workshop selector
  Recommendation View preview panel
```

The full view should feel like the main cockpit instrument, not a side card.

## View Promise

The user should leave the screen knowing:

1. what they asked for
2. what Werkles thinks they actually need
3. what visible evidence drove the call
4. the recommended action
5. why the other doors stay closed for now
6. what new information would change the answer
7. the exact next action

No magic smoke. No black-box match worship. Visible fit.

---

# Recommendation View Structure

## 1. What You Asked For

Purpose: reflect the user's explicit request in plain language.

This section should be short, literal, and calm. It tells the user the machine heard the words before interpreting the signal underneath.

### UI

- Top-left anchor of the view.
- Looks like an intake receipt.
- Use a compact dark panel with copper frame treatment.
- Label: `What You Asked For`
- Body: one or two plain sentences.
- Metadata row: lane, arena, turf, urgency, proof posture.

### Sample copy

```text
You asked for a practical operator who can help turn a specialty food concept into a repeatable local business.
```

Metadata:

```text
Lane needed: Operator
Arena: food / local retail
Turf: 20 miles around Pittsburgh
Timeline: next 60 days
Proof posture: early but serious
```

### Rules

- Do not flatter.
- Do not over-explain.
- Do not introduce a recommendation yet.
- If the ask is vague, say so directly:

```text
The ask is still soft. The Forge can read the direction, but not the joints.
```

## 2. What We Heard Underneath It

Purpose: translate the ask into the deeper job-to-be-done.

This is the Dink concierge move. It should feel like a sharp operator saying, "Here is what this is really about."

### UI

- Large interpretive panel beside or below the receipt.
- Use the strongest hierarchy after the recommendation itself.
- Include a confidence label: `HIGH`, `MEDIUM`, or `LOW`.
- Include a short "because" line.

### Sample copy

```text
Underneath the operator request, we heard a need for operating discipline before more attention.
```

Because line:

```text
The weak point is not demand yet. It is repeatability: schedule, vendor rhythm, margin math, and who owns Tuesday when the room gets hot.
```

### Confidence display

```text
Read confidence: MEDIUM
Why: the Workshop describes the product and customer clearly, but has thin proof on cost controls and weekly operating rhythm.
```

### Rules

- Name the hidden need, not the user's personality.
- Avoid psychoanalysis.
- Use business and trust language.
- If confidence is low, say what is missing.

## 3. Visible Reasons

Purpose: show the evidence that drove the recommendation.

This is the anti-black-box section. It should be scannable, weighted, and auditable.

### UI

- Reason rail or reason stack.
- Each reason has:
  - signal name
  - signal strength
  - what Werkles saw
  - why it matters
- Use proof signal language, not "AI says."

### Reason card shape

```text
Signal: Complementary lane fit
Strength: Strong
Saw: Builder has product craft and customer memory; missing operating cadence.
Matters: An Operator can add schedules, vendor systems, and margin discipline without replacing the Builder.
```

### Example visible reasons

1. **Complementary lane fit - Strong**
   - Builder energy is present.
   - Operator capacity is missing.
   - Backer help would be premature until the machine can repeat.

2. **Turf match - Medium**
   - Local radius is narrow enough for real-world support.
   - Candidate pool may need nearby food, retail, or events experience.

3. **Proof posture - Medium**
   - The ask has product specificity.
   - Financial and operating receipts are still thin.

4. **Timing - Strong**
   - Next 60 days favors working operator discovery over broad networking.

5. **Risk signal - Watch**
   - If the ask turns into financing first, the recommendation changes.

### Rules

- Reasons must be visible and user-readable.
- Do not expose private data from other users.
- Avoid fake precision. Prefer `Strong / Medium / Thin / Watch` over mysterious decimal scores.
- Scores can exist behind the scenes, but the view should lead with reasons.

## 4. Recommendation

Purpose: make one clear call.

This is the centerpiece of the centerpiece. One primary recommendation. No mushy equal options.

### UI

- Dominant central plate.
- Label: `Recommendation`
- Big verdict line.
- One decisive CTA.
- Optional secondary CTA for saving or editing the ask.

### Sample verdict

```text
Recommended: Find an Operator first.
```

### Sample body

```text
Do not lead with a Backer or a broad Connector search yet. The strongest next move is a local Operator who has run schedules, vendors, margins, and service pressure before.

The Forge is not saying money never matters. It is saying money will leak through the floor until the operating rhythm can hold.
```

### Primary CTA

```text
Knock on Operator doors
```

### Secondary CTAs

```text
Sharpen the Workshop
Save this recommendation
```

### Rules

- One recommendation.
- No "top five" default.
- If the right answer is "not enough information", make that the recommendation:

```text
Recommended: sharpen the Workshop before knocking.
```

## 5. Why Not The Alternatives

Purpose: build trust by explaining what was rejected.

Users should see that the machine considered other paths and declined them for visible reasons.

### UI

- Three to five alternative tiles.
- Each tile has:
  - alternative
  - why it is tempting
  - why it is not first
  - when it could become right

### Example alternatives

#### Backer first

```text
Tempting because cash could buy time and equipment.
Not first because the operating pattern is not stable enough yet.
Could become right after weekly cost, capacity, and repeat-customer proof are stronger.
```

#### Connector first

```text
Tempting because the concept needs rooms and customers.
Not first because more attention before operating discipline may create expensive chaos.
Could become right after the service rhythm and vendor bench are locked.
```

#### Spark first

```text
Tempting because a new location or event could create lift.
Not first because the Workshop already has enough opening; it needs steel around the opening.
Could become right if the current market stalls or a specific property/customer lead appears.
```

#### Full pause

```text
Tempting because the proof file is incomplete.
Not first because there is enough signal to start Operator discovery while the file improves.
Could become right if identity, trust, or basic claim receipts fail.
```

### Rules

- Do not insult alternatives.
- Explain tradeoffs.
- Keep trust and legal boundaries clean.
- Do not imply Werkles guarantees the recommended person is safe, solvent, or correct.

## 6. What Would Change This Recommendation

Purpose: make the recommendation conditional and honest.

This section protects user trust. It says: "Here are the levers. Bring new steel and the answer may change."

### UI

- Conditional trigger list.
- Use clear "If / then" statements.
- Show missing evidence as action-ready checklist items.

### Sample triggers

```text
If you show three months of repeat sales and clean margin tracking, Backer discovery moves up.
```

```text
If you add a signed vendor relationship or commissary agreement, Connector discovery may move up.
```

```text
If your timeline changes from 60 days to 12 months, a Spark search becomes less urgent.
```

```text
If proof checks fail or stay thin, the recommendation changes to strengthen the Foundry record before any knock.
```

### Missing evidence checklist

- weekly operating rhythm
- rough margin model
- vendor / supply proof
- capacity constraint
- local permit or location requirements
- receipts from real customer demand

### Rules

- This section should reduce argument.
- Make it easy for users to improve the recommendation.
- Never pretend the recommendation is permanent.

## 7. Next Action

Purpose: turn the recommendation into the next concierge move.

This is not a generic footer. It is the handoff from "understanding" to "workflow."

### UI

- Sticky bottom action bar on desktop.
- Bottom action block on mobile.
- One primary action, one edit action, one safety/trust link.

### Primary action

```text
Knock on Operator doors
```

### If the Workshop is incomplete

```text
Sharpen the Workshop
```

### If trust/proof is the blocker

```text
Strengthen the Foundry record
```

### Support action

```text
Show the proof signals
```

### Confirmation copy

Before requesting intros:

```text
This sends a private knock. Werkles is opening a conversation, not making a promise. Keep your advisers in the loop when the stakes get real.
```

### Rules

- The next action must match the recommendation.
- Do not offer intro knocks if access, membership, or proof posture blocks them.
- Do not create live payment, provider, deploy, SQL, or production actions from this view without the existing gates.

---

# Full Page Wireframe

```text
+----------------------------------------------------------------------+
| Recommendation View                                    Confidence MED |
| The concierge readout for this Workshop. Visible fit, no magic smoke. |
+-------------------------------+--------------------------------------+
| What You Asked For            | What We Heard Underneath It          |
| Plain receipt of the ask      | Hidden job-to-be-done + because line |
| Lane / arena / turf / timing  | Read confidence + missing context    |
+-------------------------------+--------------------------------------+
| Visible Reasons                                                      |
| [Complementary lane fit: Strong] [Turf: Medium] [Proof: Medium]      |
| [Timing: Strong] [Risk: Watch]                                       |
+----------------------------------------------------------------------+
| Recommendation                                                       |
| Recommended: Find an Operator first.                                 |
| Explanation paragraph.                                               |
| [Knock on Operator doors] [Sharpen the Workshop]                     |
+----------------------------------------------------------------------+
| Why Not The Alternatives                                             |
| Backer first | Connector first | Spark first | Full pause            |
+----------------------------------------------------------------------+
| What Would Change This Recommendation                                |
| If/then triggers + missing evidence checklist                        |
+----------------------------------------------------------------------+
| Next Action                                                          |
| Sticky action bar: primary CTA + edit CTA + proof link               |
+----------------------------------------------------------------------+
```

## Mobile Stack

1. Recommendation verdict
2. Next action
3. What You Asked For
4. What We Heard Underneath It
5. Visible Reasons
6. Why Not The Alternatives
7. What Would Change This Recommendation
8. Trust disclaimer

Mobile users should see the recommendation and next action before the full audit trail, but the audit trail must remain present.

---

# Visual Direction

Use `foreman/DESIGN_SYSTEM.md` as palette law.

## Feel

- private industrial cockpit
- compact, serious, and useful
- copper as frame
- violet for decisive primary CTA
- teal for exploratory secondary CTA
- cream text on dark surfaces
- no fragile glassmorphism
- no pastel SaaS recommendation cards

## Component hierarchy

1. Recommendation verdict plate
2. Next action CTA
3. Underneath-it interpretation
4. Visible reason rail
5. Alternative rejection cards
6. Conditional trigger checklist
7. Trust/legal boundary note

## Suggested component names

```text
RecommendationView
RecommendationReceipt
UnderlyingNeedPanel
VisibleReasonRail
RecommendationVerdictPlate
AlternativeReasonCard
RecommendationChangeTriggers
RecommendationNextActionBar
```

---

# Data Shape

Draft shape for implementation:

```ts
type RecommendationViewModel = {
  id: string;
  workshopId: string;
  generatedAt: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  askedFor: {
    summary: string;
    laneNeeded?: string;
    arena?: string;
    turf?: string;
    timeline?: string;
    proofPosture?: string;
  };
  heardUnderneath: {
    summary: string;
    because: string;
    confidenceReason: string;
    missingContext: string[];
  };
  visibleReasons: Array<{
    signal: string;
    strength: "Strong" | "Medium" | "Thin" | "Watch";
    saw: string;
    matters: string;
  }>;
  recommendation: {
    verdict: string;
    body: string;
    primaryAction: RecommendationAction;
    secondaryActions: RecommendationAction[];
  };
  alternatives: Array<{
    label: string;
    temptingBecause: string;
    notFirstBecause: string;
    couldBecomeRightWhen: string;
  }>;
  changeTriggers: Array<{
    if: string;
    then: string;
  }>;
  missingEvidence: string[];
  nextAction: RecommendationAction;
  trustNote: string;
};

type RecommendationAction = {
  label: string;
  kind:
    | "request_intro"
    | "edit_workshop"
    | "strengthen_profile"
    | "view_proof"
    | "save";
  enabled: boolean;
  disabledReason?: string;
};
```

## Important implementation rule

The view can explain recommendations from existing server-scored factors, Workshop fields, and proof posture. It must not expose private details from alternative candidates or imply that Werkles has completed verification it has not completed.

---

# Empty, Loading, and Blocked States

## Loading

```text
Inspecting the steel.
```

Subtext:

```text
Dink is reading the Workshop, proof posture, lane fit, and local constraints.
```

## No recommendation yet

```text
No recommendation worth wasting your time on yet.
```

Subtext:

```text
Sharpen the ask: lane, arena, turf, timing, and what proof you can actually show.
```

CTA:

```text
Sharpen the Workshop
```

## Low confidence

```text
The Forge can see the shape, not the joints.
```

Subtext:

```text
Add operating details, proof receipts, turf constraints, or timeline before asking for a door knock.
```

## Access blocked

```text
Foundry Dues opens intro knocks. Build the Forge file first, then knock with weight.
```

## Trust blocked

```text
The proof file is too thin for this knock.
```

Subtext:

```text
Strengthen the Foundry record before asking another human to spend attention.
```

---

# Copy Bank

## Recommendation headlines

- `Find an Operator first.`
- `Sharpen the Workshop before knocking.`
- `Build proof before asking for a Backer.`
- `Open Connector doors, but keep the ask narrow.`
- `Pause. The file is not carrying enough weight.`

## Reason labels

- `Complementary lane fit`
- `Turf fit`
- `Timing fit`
- `Proof posture`
- `Operating gap`
- `Trust weight`
- `Attention risk`
- `Money-before-machine risk`

## CTA labels

- `Knock on Operator doors`
- `Sharpen the Workshop`
- `Strengthen the Foundry record`
- `Show the proof signals`
- `Save this readout`
- `No fit. Keep building.`

## Trust note

```text
Werkles can show fit signals and open a private knock. It does not guarantee safety, solvency, returns, legal readiness, or that the other human is right for you. Claims still need receipts. Big moves still need advisers.
```

---

# What This Must Not Become

- A generic ranked list.
- A black-box score page.
- A chatbot transcript pretending to be product UX.
- A legal, financial, or investment recommendation.
- A public marketplace listing.
- A final approval surface for payments, deploys, provider actions, SQL, secrets, or production data changes.

The Recommendation View is a concierge readout and workflow junction. It tells the user where to swing the hammer next, then shows why.

---

# Maker Recommendation

Build V1 as a static/dynamic hybrid:

1. Start with mocked recommendation content for visual/product review.
2. Bind it later to existing Workshop and match-factor data.
3. Keep the server-scored match details behind visible reason cards.
4. Make the recommendation verdict and next action the first thing users can understand.
5. Keep alternatives and change triggers close enough that the user trusts the answer.

V1 success condition:

```text
Ben can open the dashboard, read one Recommendation View, and immediately say:
"I understand what Dink thinks, why it thinks that, what it rejected, and what I should do next."
```
