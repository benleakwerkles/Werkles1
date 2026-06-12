# FROM MAKER - USER CATEGORY LADDER V1

Execution context: `CURSOR_CLOUD_CONTAINER`.

Status: design/metrics language handoff. No production deploy, SQL, secrets, billing, merge, legal approval, Stripe action, payment collection, payment test, app code, software build, verification run, Bellows run, or live data mutation is approved by this file.

## Mission

Create the definitive Werkles progression:

```text
Candidate
  -> Lead
  -> Tester
  -> Paid Participant
  -> Customer
  -> Repeat Customer
  -> Referrer
```

For each:

- required behavior
- time window
- evidence standard

Goal:

```text
Eliminate category inflation.
```

## Core Rule

No one moves up the ladder because Ben likes them, because they praise Werkles, because they say they would pay, or because the stronger label sounds better.

Each category requires a new behavior and a recorded evidence artifact.

## Important Boundary

`Paid Participant` means:

```text
Werkles paid or compensated the person to participate in research/testing.
```

It does not mean:

```text
The person paid Werkles.
```

So `Paid Participant -> Customer` is not automatic. It requires the person to later pay Werkles through an approved payment path.

## Pricing Flag

```text
PRICING IS PENDING OPERATOR DECISION.
```

Until Ben separately approves a payment path:

```text
Customer count = 0.
Repeat Customer count = 0.
Paid = not tested.
Would Pay may be tracked, but it does not create customers.
```

---

# One-Line Ladder

| Stage | Plain meaning | Minimum evidence |
|-------|---------------|------------------|
| Candidate | plausible fit to screen | named record + why they might fit |
| Lead | showed interest or accepted outreach | reply, form, intro, or invite acceptance |
| Tester | begins unfinished concierge test | consent + intake/session start |
| Paid Participant | Werkles compensates them for testing | compensation record |
| Customer | they pay Werkles through approved path | completed payment receipt |
| Repeat Customer | they pay again or renew after first value moment | second payment / renewal receipt |
| Referrer | they create a usable referred lead | specific referral + follow-through |

---

# 1. Candidate

## Required behavior

The person has not yet shown enough direct intent to be a lead, but they are plausible to screen.

Required behavior:

- appears to fit the target audience
- can be named or described specifically
- has a reason for inclusion
- has not yet started intake
- has not yet paid

Examples:

- "local operator Ben wants to invite"
- "warm stranger from a trusted connector"
- "builder with active project, not yet contacted"

## Time window

Candidate status expires after:

```text
30 days without outreach, response, or screening decision.
```

After 30 days:

- renew with a fresh reason
- convert to lead if they respond/show interest
- archive as stale candidate

## Evidence standard

Record:

```text
Candidate ID:
Source:
Known / Warm stranger / Stranger:
Why they might fit:
Date added:
Next action:
```

## Must not claim

Do not claim a candidate is:

- a lead
- a tester
- a participant
- a customer
- verified
- interested
- available
- a match
- proof of demand

## Safe report

```text
12 candidates identified; 5 contacted; 3 replied.
```

## Inflated report

```text
12 users in pipeline.
```

---

# 2. Lead

## Required behavior

The person shows direct interest or accepts enough contact that Werkles can reasonably follow up.

Required behavior, any one:

- responds positively to outreach
- submits interest/waitlist/contact form
- asks to learn more
- accepts an invite to the concierge test
- is introduced by a referrer and responds
- asks about access, pricing, or next steps

## Time window

Lead status expires after:

```text
14 days without response to next touch.
```

Lead may remain active if:

- next touch is scheduled
- they asked for a later date
- they are waiting on a clearly recorded step

## Evidence standard

Record at least one:

- reply text
- form submission
- intro response
- calendar/session acceptance
- explicit "yes, send me the intake"
- explicit "I want to try this"

Minimum record:

```text
Lead ID:
Source:
Interest behavior:
Date:
Next touch date:
```

## Must not claim

Do not claim a lead is:

- a tester
- a participant
- a customer
- paid
- retained
- converted
- proof of willingness to pay
- proof of product value

## Safe report

```text
7 leads accepted follow-up; 4 scheduled intake.
```

## Inflated report

```text
7 customers waiting.
```

---

# 3. Tester

## Required behavior

The person knowingly begins an unfinished Werkles concierge test.

Required behavior:

- understands this is a test
- starts intake or session
- consents to feedback/outcome tracking
- is not treated as normal production usage

Tester status starts when:

```text
They begin intake or the first session after the test boundary is explained.
```

## Time window

Tester status covers:

```text
from intake/session start through 7-day follow-up
```

After 7-day follow-up:

- outcome recorded tester
- incomplete tester
- dropped tester
- converted to customer only if later paid through approved path

## Evidence standard

Record:

```text
Tester ID:
Boundary explained: Y/N
Intake started date:
Completed intake: Y/N
Recommendation delivered: Y/N
7-day follow-up date:
Outcome:
```

## Must not claim

Do not claim a tester is:

- a customer
- paying
- retained
- production user
- product-market-fit proof
- representative of the entire market

## Safe report

```text
5 testers started; 4 completed intake; 3 recommendations delivered.
```

## Inflated report

```text
5 active users.
```

---

# 4. Paid Participant

## Required behavior

Werkles compensates the person to participate in research/testing.

Required behavior:

- Werkles gives or promises a stipend, gift card, discount, credit, or other compensation
- the person participates as research/test participant
- compensation is recorded

This is a research category, not traction revenue.

## Time window

Paid participant status applies:

```text
for the compensated research/test engagement only.
```

It does not carry forward into customer status.

## Evidence standard

Record:

```text
Paid Participant ID:
Compensation type:
Compensation amount/value:
Date offered:
Date delivered:
What they tested:
```

## Must not claim

Do not claim a paid participant is:

- a customer
- revenue
- willingness-to-pay evidence
- organic demand
- retention
- proof people would participate unpaid
- proof people would pay Werkles

## Safe report

```text
3 paid participants completed research sessions; count their clarity/trust feedback separately from demand.
```

## Inflated report

```text
3 paid users.
```

---

# 5. Customer

## Required behavior

The person pays Werkles through an approved payment path.

Required behavior:

- Ben approved the payment test or live payment path
- the offer was clearly described
- the person completed payment to Werkles
- payment was not fake-door only
- payment was not compensation from Werkles to the participant

## Time window

Customer status starts:

```text
on completed payment date.
```

For one-time payment:

```text
customer status is valid for that purchase; do not imply retention.
```

For subscription:

```text
customer status is active only while subscription is active or inside an explicitly defined paid access period.
```

## Evidence standard

Required:

- payment receipt
- checkout/payment provider record
- invoice
- subscription status
- internal payment log tied to approved payment lane

Minimum record:

```text
Customer ID:
Offer:
Amount:
Payment date:
Payment path approved? Y/N:
Receipt/source:
Access period:
```

## Must not claim

Do not claim a customer from:

- Would Pay
- Would Refer
- free test
- paid participant
- lead
- candidate
- fake-door click
- asking price
- asking for another recommendation

Do not claim:

- repeat customer
- retention
- recurring revenue
- product-market fit
- public launch readiness
- legal/compliance approval

## Safe report

```text
4 customers paid through the approved concierge payment test.
```

## Inflated report

```text
10 Would Pay signals means 10 customers.
```

---

# 6. Repeat Customer

## Required behavior

The person pays Werkles again after the first paid value moment, or renews paid access after having a real chance to stop.

Required behavior, one:

- completes a second separate payment
- renews subscription after initial paid period
- pays for another concierge session
- upgrades after completing the first paid experience

Not enough:

- one payment
- free second session
- comped extension
- asking for another round without paying
- subscription still inside first billing period with no renewal yet

## Time window

Repeat customer status starts:

```text
on second completed payment or first completed renewal after the initial paid period.
```

Minimum separation:

```text
Second payment must occur after the first value delivery or after the user had a real chance to stop.
```

## Evidence standard

Required:

- first payment receipt
- second payment or renewal receipt
- date of first value delivery
- evidence the second payment was not accidental duplicate charge

Minimum record:

```text
Repeat Customer ID:
First payment date:
First value delivered:
Second payment / renewal date:
Amount:
Receipt/source:
```

## Must not claim

Do not claim repeat customer from:

- second free session
- follow-up call
- referral
- Would Pay
- "asks for more"
- continued conversation
- unresolved first purchase

Do not claim:

- long-term retention
- stable LTV
- product-market fit
- scaled demand

## Safe report

```text
2 of 4 paying customers paid again after receiving the first recommendation.
```

## Inflated report

```text
Everyone who asked for another recommendation is a repeat customer.
```

---

# 7. Referrer

## Required behavior

The person creates a usable referral path to at least one specific serious person.

Required behavior:

- names a specific serious person or organization
- explains why they are relevant
- either makes an intro or gives Werkles a safe permissioned path to follow up
- the referred person is not imaginary, vague, or generic

Strongest behavior:

```text
The referred person responds and becomes a referred lead.
```

## Time window

Referral signal window:

```text
within 7 days of recommendation or follow-up ask.
```

Referrer status starts:

```text
when they make a usable referral path, not merely when they say "I know people."
```

Referral stays active for:

```text
30 days from intro or referral path creation.
```

After 30 days:

- referred lead responded
- referral stale
- referral not reachable

## Evidence standard

Minimum:

```text
Referrer ID:
Referral candidate:
Relationship/type:
Why relevant:
Date named:
Follow-through: None / Intro made / Permissioned path / Responded
Referred lead status:
```

## Must not claim

Do not claim a referrer is:

- a customer
- repeat customer
- proof of revenue
- proof the referred person wants Werkles
- proof the referred person is qualified
- proof of viral growth from one vague name

Referrer is a social-trust category, not a payment category.

## Safe report

```text
6 referrers created usable referral paths; 3 referred leads responded.
```

## Inflated report

```text
6 referrers means 6 new customers.
```

---

# Promotion Rules

## Candidate -> Lead

Requires:

```text
direct interest, accepted invite, response, form submission, or referral response.
```

Does not happen from:

```text
Ben thinks they would be good.
```

## Lead -> Tester

Requires:

```text
test boundary explained + intake/session started.
```

Does not happen from:

```text
they scheduled but did not show.
```

## Tester -> Paid Participant

Requires:

```text
Werkles compensates them for research/testing.
```

Does not happen from:

```text
they ask what it costs.
```

## Tester / Paid Participant -> Customer

Requires:

```text
they pay Werkles through approved payment path.
```

Does not happen from:

```text
Would Pay, Would Refer, praise, action taken, or compensation from Werkles.
```

## Customer -> Repeat Customer

Requires:

```text
second payment or renewal after first value delivery / real chance to stop.
```

Does not happen from:

```text
asking for more, free follow-up, or continued conversation.
```

## Customer / Tester / Lead -> Referrer

Requires:

```text
specific serious referral + usable follow-through path.
```

Does not happen from:

```text
"I know people" or generic enthusiasm.
```

Note:

```text
Referrer can happen from several stages, but for reporting it is the final ladder label only when the referral behavior is actually completed.
```

---

# Time Window Summary

| Category | Starts | Expires / changes |
|----------|--------|-------------------|
| Candidate | added with specific fit reason | 30 days without outreach/response/screen decision |
| Lead | direct interest or invite acceptance | 14 days without response to next touch |
| Tester | intake/session starts after boundary explained | after 7-day follow-up, mark outcome |
| Paid Participant | compensation offered/recorded | applies to compensated engagement only |
| Customer | completed approved payment | one-time purchase only, or active paid access period |
| Repeat Customer | second payment/renewal after first value | remains repeat status for that repeat purchase; do not infer long-term retention |
| Referrer | usable referral path created | 30 days to see if referred lead responds |

---

# Evidence Standard Summary

| Category | Evidence required |
|----------|-------------------|
| Candidate | named record + source + fit reason + date |
| Lead | reply/form/intro response/invite acceptance |
| Tester | consent/boundary + intake/session start |
| Paid Participant | compensation record |
| Customer | completed approved payment receipt |
| Repeat Customer | second payment/renewal receipt after first value delivery |
| Referrer | specific referral + relationship/type + usable follow-through path |

No evidence, no category.

---

# Category Inflation Red Flags

Stop and correct language if anyone says:

```text
Candidates are users.
Leads are customers.
Testers are customers.
Paid participants are paid users.
Would Pay means paid.
Would Refer means customer.
One payment means repeat customer.
Vague "I know people" means referrer.
Referrals are revenue.
```

Corrected language:

```text
Candidates identified.
Leads responded.
Testers started.
Paid participants were compensated.
Customers paid Werkles.
Repeat customers paid again.
Referrers made usable referral paths.
```

---

# N=20 Reporting Format

Use this exact ladder report:

```text
N20 CATEGORY LADDER

Candidates identified: __
Leads with direct interest: __
Testers started: __
Paid participants: __
Customers: __
Repeat customers: __
Referrers with usable referral path: __

Would Pay total: __
Strong Would Pay: __
Would Refer specific: __
Referral follow-through: __

Pricing status: PENDING OPERATOR DECISION / APPROVED PAYMENT TEST / LIVE PAYMENT PATH
Paid tested? Y/N

Notes on category inflation risk:
```

If pricing remains pending:

```text
Customers: 0
Repeat customers: 0
Paid tested: N
```

Even if Would Pay is strong.

---

# Maker Recommendation

Use the ladder, but do not let the arrows do the work.

```text
Candidate -> Lead -> Tester -> Paid Participant -> Customer -> Repeat Customer -> Referrer
```

is a label progression only when each behavior occurs and evidence is recorded.

The strictest rules:

```text
Customer requires payment from them to Werkles.
Repeat Customer requires a second payment or renewal.
Paid Participant means Werkles paid them, not the reverse.
Referrer requires a usable referral path, not vague enthusiasm.
Would Pay and Would Refer are signals, not categories.
```
