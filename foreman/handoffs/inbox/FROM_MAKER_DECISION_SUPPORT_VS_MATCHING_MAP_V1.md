# FROM MAKER - DECISION SUPPORT VS MATCHING MAP V1

Execution context: `CURSOR_CLOUD_CONTAINER`.

Status: design/taxonomy handoff. No production deploy, SQL, secrets, billing, merge, legal approval, verification run, Bellows run, or live data mutation is approved by this file.

## Question

Across current Werkles concepts, which are:

```text
A) Matching functions
B) Decision-support functions
C) Trust-verification functions
```

Concepts mapped:

- Speaker
- Crucible
- Bellows
- SoleDash
- Need Translation
- Layer 0
- Human Opportunity Discovery

## Source posture

Current repo evidence is strongest for:

- Human Opportunity Discovery
- Layer 0
- Need Translation
- Recommendation / decision-support flow
- SoleDash
- Crucible
- Bellows as a learning route/shell

Current repo evidence is weak or absent for:

- Speaker as a fully defined standalone concept

So this map classifies Speaker conservatively by inferred current product role, not by a locked implementation spec.

---

# Short Answer

| Concept | Primary class | Secondary class | Not this |
|---------|---------------|-----------------|----------|
| Speaker | B - Decision-support | A - Matching, only if it routes a need to a person/audience | C, unless it verifies claims |
| Crucible | C - Trust-verification | B - Decision-support, because proof posture informs decisions | A |
| Bellows | B - Decision-support | C, only if future lessons certify/verify completion | A |
| SoleDash | B - Decision-support / operator console | C, only when showing gate/provenance/safety state | A |
| Need Translation | B - Decision-support | A, only downstream when translated need becomes a search target | C |
| Layer 0 | B - Decision-support input layer | A, only as raw material for future matching | C |
| Human Opportunity Discovery | B - Decision-support | A, when it identifies possible people/resources | C, except when it invokes Crucible/proof posture |

## Clean rule

```text
Matching finds who/what might fit.
Decision support explains what to do next and why.
Trust verification checks whether claims/signals can be trusted.
```

Most current Werkles concierge concepts are decision-support first. Matching comes later or underneath. Trust-verification is mainly Crucible plus proof posture.

---

# Definitions

## A) Matching functions

Matching functions answer:

```text
Who or what might fit this user, Blueprint, Workshop, need, lane, turf, or opportunity?
```

Examples:

- candidate discovery
- complementary lane fit
- possible operator/backer/connector/person/resource/tool suggestions
- intro target selection
- match deck scoring
- liquidity checks

Matching should not claim:

- the person is safe
- the person is verified
- the opportunity is good
- the deal should happen
- money/legal/hiring decisions are approved

## B) Decision-support functions

Decision-support functions answer:

```text
Given what we know, what should the user do next, why, and what would change the answer?
```

Examples:

- intake interpretation
- need translation
- bottleneck naming
- visible reasons
- recommendation view
- why-not alternatives
- next action
- operator console state
- learning guidance

Decision support can use matching and verification inputs, but it is not itself proof or a guarantee.

## C) Trust-verification functions

Trust-verification functions answer:

```text
What claims, statuses, receipts, or provider checks can be trusted enough to display or use?
```

Examples:

- identity check
- phone ownership check
- funds/provider receipt
- license status
- proof badge status
- verification expiry/decay
- server-owned trust state
- source/provenance/gate state

Trust verification must stay inside zero-knowledge posture: receipts and statuses, not raw sensitive material.

---

# Concept-by-Concept Map

## 1. Speaker

## Classification

```text
Primary: B - Decision-support
Secondary: A - Matching, if Speaker routes a need toward a specific audience/person/resource
Not primary: C - Trust-verification
```

## Why

Speaker sounds like the concept that helps the user express, frame, or present the ask. If so, its core job is not to match by itself. Its core job is to turn fog into a clear signal another human or system can act on.

Speaker becomes matching only when it says:

```text
This should be spoken to these people / this lane / this room.
```

Speaker becomes trust-verification only if it starts validating claims inside what the user says, which should belong to Crucible/proof posture instead.

## Safe boundary

Speaker may help the user say:

```text
Here is what I am trying to do.
Here is who I need to hear it.
Here is what I am not claiming.
```

Speaker must not say:

```text
This person is verified.
This opportunity is safe.
This is a guaranteed fit.
This is legal/financial/investment advice.
```

## Product role

Speaker is best treated as:

```text
Decision-support for communication and framing.
```

It is upstream of matching because a clear ask makes matching possible.

---

## 2. Crucible

## Classification

```text
Primary: C - Trust-verification
Secondary: B - Decision-support
Not primary: A - Matching
```

## Why

Crucible is the proof/check surface. Current code and doctrine describe verification checks, proof rules, provider receipts/statuses, and trust copy. Trust state, membership state, verification state, and payment state are server-derived; users cannot write their own trust tier.

Crucible is decision-support only because proof posture changes what should happen next:

- strengthen the Foundry record
- unlock or block a knock
- lower confidence in a recommendation
- surface "what we do not know"

Crucible is not matching. It does not find the person; it affects whether a match/recommendation is safe enough to act on or how much confidence to show.

## Product role

```text
Crucible checks claims and proof posture. It feeds confidence into recommendation and intro workflows.
```

## Boundary

Crucible can say:

```text
This check is prepared / pending / verified / failed / expired.
This signal is self-reported.
This proof is too thin for the requested knock.
```

Crucible must not say:

```text
This person is guaranteed safe.
This person is the right partner.
This investment/job/deal is approved.
```

---

## 3. Bellows

## Classification

```text
Primary: B - Decision-support
Secondary: C - Trust-verification only if future Bellows completion/credential claims are verified
Not primary: A - Matching
```

## Why

Current repo evidence describes Bellows as a learning route/shell and education surface, not a matching engine or live worker. It is guidance: lessons, SOPs, anti-guru knowledge, frameworks, and learning support.

That makes Bellows decision-support:

- helps users learn what to do
- gives context before acting
- supports better next actions
- may explain how to strengthen proof or readiness

Bellows is not matching unless it later recommends specific people/resources/tools. Even then, that would be supporting recommendation behavior, not Bellows' primary role.

Bellows becomes trust-verification only if it creates verified completion receipts or credentials. Current docs do not authorize live Bellows runs or verified education credentials.

## Product role

```text
Bellows teaches and frames. It helps users make better decisions before and after recommendations.
```

## Boundary

Bellows can say:

```text
Here is how to inspect a claim.
Here is an SOP/checklist/template.
Here is what to learn before knocking.
```

Bellows must not say:

```text
This person is verified because they read a lesson.
This lesson completion proves competence.
This is a match.
```

---

## 4. SoleDash

## Classification

```text
Primary: B - Decision-support / operator support
Secondary: C - Trust-verification display/provenance support
Not primary: A - Matching
```

## Why

The current SoleDash docs define it as a console/board/display layer:

- capture
- store
- surface
- show state
- show inbox/outbox/receipts
- show source path
- show gate owner
- support Ben's 20-user human-operated workflow

The strongest line from the current concept docs:

```text
Software here does exactly three jobs and nothing more: capture, store, surface. It never decides, scores, matches, or messages. Ben makes every judgment.
```

So SoleDash is not matching. It can display records related to matching or decision support, but the console itself should not be treated as the matching function.

SoleDash has a trust-verification display role when it shows:

- source path
- human gate owner
- doctrine conflict flag
- receipt/provenance status
- verification/proof state from Crucible

But it should not itself verify. It displays the status and provenance.

## Product role

```text
SoleDash is the operator cockpit for seeing the work, state, source, and next touch.
```

## Boundary

SoleDash can say:

```text
This case is Received / Thinking / Blocked / Response Incoming / Complete / Failed.
This card came from this source path.
This decision has a human gate owner.
This recommendation was sent.
This outcome was recorded.
```

SoleDash must not say:

```text
This is the best match.
This user is verified.
This action is approved.
Ben has approved a human gate.
```

---

## 5. Need Translation

## Classification

```text
Primary: B - Decision-support
Secondary: A - Matching input
Not primary: C - Trust-verification
```

## Why

Need Translation is the moment where Werkles distinguishes:

```text
what the user said they need
vs
what the situation suggests they actually need next
```

That is decision-support. It names the real need and possible bottleneck so the user can understand the next move.

Need Translation becomes matching input only after it produces a target:

- partner
- capital
- customer
- skill
- license/credential
- intro
- validation
- clarity
- person/resource/tool

Then a matching layer can search for a fitting person/resource. But the translation itself is not the match.

Need Translation is not verification. It may notice that a claim is self-reported or proof is thin, but Crucible verifies.

## Product role

```text
Need Translation is the bridge from raw ask to useful recommendation.
```

## Boundary

Need Translation can say:

```text
You asked for money, but the stronger need appears to be an operator.
You asked for attention, but the bottleneck appears to be proof.
You asked for a partner, but the first move is clarity.
```

Need Translation must not say:

```text
This claim is verified.
This user is safe.
This match is guaranteed.
```

---

## 6. Layer 0

## Classification

```text
Primary: B - Decision-support input layer
Secondary: A - Matching raw material
Not primary: C - Trust-verification
```

## Why

Layer 0 is the raw human situation before product interpretation:

- where the user is now
- what they want
- why now
- what they have
- what they think blocks them
- what they already tried
- what cannot change
- what one thing would help
- lane if known

Layer 0 does not match by itself. It captures the human terrain so Need Translation and Human Opportunity Discovery can do useful work.

Layer 0 is matching raw material because later matching needs clean inputs:

- lane
- turf
- constraints
- assets
- need
- timing

Layer 0 is not trust-verification. It is mostly self-reported. It should be labeled that way.

## Product role

```text
Layer 0 is the intake substrate: honest raw context before decision support or matching.
```

## Boundary

Layer 0 can say:

```text
The user said this.
The user has these constraints.
The user believes this is the blocker.
```

Layer 0 must not say:

```text
This is true.
This is verified.
This is the right match.
```

---

## 7. Human Opportunity Discovery

## Classification

```text
Primary: B - Decision-support
Secondary: A - Matching, when it identifies possible people/resources/opportunities
Tertiary dependency: C - Trust-verification, when proof posture affects the recommendation
```

## Why

The current Wizard-of-Oz concept defines the chain:

```text
Layer 0 -> need translation -> one bottleneck -> one explained recommendation -> one action
```

That is decision-support first. It is not "show me a list of matches." It is:

```text
What is really going on?
What is the bottleneck?
What is the best next path?
Why?
What should the user do now?
```

Human Opportunity Discovery includes matching only when the best next path requires identifying a person/resource/tool:

- a local operator
- a possible customer
- a connector
- a crew lead
- a template/SOP/resource
- a proof provider

Even then, matching is subordinate to the decision:

```text
First decide the path. Then find the thing that serves it.
```

Trust-verification enters when proof posture changes confidence, gates, or next action. For example:

- "strengthen the Foundry record before knocking"
- "this is self-reported"
- "Crucible check needed before intro"

## Product role

```text
Human Opportunity Discovery is the concierge decision chain. It may use matching and verification, but its output is an explained recommendation and next action.
```

## Boundary

Human Opportunity Discovery can say:

```text
The best next path is to find an Operator first.
Here are the visible reasons.
Here is why not Backer first.
Here is the next action.
Here is what would change the answer.
```

Human Opportunity Discovery must not say:

```text
This person is guaranteed right.
This opportunity is safe.
Werkles vouches for the result.
This is legal/financial/investment advice.
```

---

# Functional Architecture

## Current concierge chain

```text
Layer 0
  -> Need Translation
  -> Bottleneck / Recommendation
  -> Human Opportunity Discovery
  -> Optional Matching support
  -> Optional Crucible proof check
  -> SoleDash state/outcome tracking
```

## Category flow

```text
B: Decision-support starts with Layer 0 and Need Translation.
B: Human Opportunity Discovery chooses a path and explains why.
A: Matching appears only when the chosen path requires a person/resource/opportunity.
C: Crucible checks proof/trust signals before confidence or action increases.
B/C: SoleDash displays state, source, gate owner, proof posture, and outcomes.
B: Bellows teaches the user how to act better.
B/A: Speaker frames the ask so the right room can hear it.
```

---

# Overlap Matrix

| Concept | A Matching | B Decision-support | C Trust-verification | Notes |
|---------|------------|--------------------|----------------------|-------|
| Speaker | Possible secondary | Primary | No | Frames the ask; routes only if it chooses audience/person/resource. |
| Crucible | No | Secondary | Primary | Proof/status layer; affects decisions but does not find matches. |
| Bellows | No | Primary | Possible future secondary | Learning/SOP surface; no live verification credential in current scope. |
| SoleDash | No | Primary | Display-only secondary | Operator cockpit; shows state/provenance/gates, does not decide. |
| Need Translation | Downstream input | Primary | No | Turns stated ask into actual need/bottleneck. |
| Layer 0 | Raw input | Primary input layer | No | Self-reported intake substrate; label as unverified. |
| Human Opportunity Discovery | Secondary | Primary | Uses C as dependency | Produces explained recommendation and next action; matching supports the path. |

---

# What To Build First

## For User #1 / N=20

Build/test decision support first:

```text
Layer 0 intake
Need Translation
Recommendation Card / Recommendation View
Human Opportunity Discovery worksheet
SoleDash or sheet tracking
```

Do not build matching engine first.

Reason:

```text
The N=20 concierge test is trying to prove that a human can turn raw context into a believable next action. If that fails, a matching engine only automates confusion.
```

## Matching comes after

Only build matching when the decision-support chain repeatedly produces:

- a clear translated need
- a stable recommendation pattern
- a specific target type
- users who act
- enough candidate supply to test fit

## Trust verification stays separate

Crucible must remain its own trust-verification lane. Do not bury verification inside matching or recommendation copy.

Correct:

```text
This recommendation is based on self-reported intake and visible reasons. Proof posture is thin.
```

Incorrect:

```text
This person is a trusted match.
```

---

# Naming Guidance

## Use "decision support" for:

- Dink concierge readout
- Recommendation View
- Need Translation
- bottleneck discovery
- Human Opportunity Discovery
- Bellows learning support
- SoleDash operator state

## Use "matching" for:

- Match Deck
- candidate selection
- intro target search
- complementary lane fit
- possible person/resource/tool discovery after the path is chosen

## Use "trust verification" for:

- Crucible
- proof signals
- provider receipts
- identity/phone/funds/license status
- server-owned trust state
- verification expiry/decay

---

# Maker Recommendation

For current Werkles concepts, say this plainly:

```text
Werkles is not primarily building a matching engine first.
Werkles is first testing a decision-support concierge:
raw human situation -> translated need -> explained recommendation -> next action.
Matching supports that only when the next action requires a person/resource/opportunity.
Crucible remains the separate trust-verification spine.
SoleDash is the operator console that keeps the work visible and honest.
```

This distinction matters because the first N=20 test should not be judged by marketplace liquidity alone. It should be judged by whether users understand, trust, and act on a recommendation. Matching and verification become inputs after the decision-support chain proves it can produce value.
