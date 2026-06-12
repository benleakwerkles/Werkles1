# FROM MAKER - CUSTOMER LANGUAGE BOUNDARY V1

Execution context: `CURSOR_CLOUD_CONTAINER`.

Status: design/metrics language handoff. No production deploy, SQL, secrets, billing, merge, legal approval, Stripe action, payment collection, payment test, or live data mutation is approved by this file.

## Mission

Define the correct terms for the concierge test:

- candidate
- participant
- tester
- paid participant
- customer
- lead
- referral

For each:

- what qualifies them
- what Werkles must not claim

Goal:

```text
Prevent fake traction language.
```

## Core Rule

Do not upgrade a person into a stronger traction category because it sounds better.

Use the weakest accurate term:

```text
Curious person < lead < candidate < participant/tester < paid participant < customer
Referral is a source/channel label, not proof of purchase.
```

The cleanest boundary:

```text
Customer = they paid Werkles through an approved payment path.
Would pay = they said credible words.
Would refer = they would risk social trust.
Participant/tester = they joined the experiment.
Lead/candidate = they might join.
```

---

# 1. Candidate

## What qualifies them

Use `candidate` for someone under consideration for a specific role in the experiment or workflow.

Two allowed meanings:

### A. Test candidate

```text
A person who appears to fit the target audience for the concierge test but has not yet started.
```

Qualifies if:

- Ben or Werkles has identified them as possibly relevant
- they match the target audience well enough to invite or screen
- they have not completed enough intake to become a participant

### B. Match / intro candidate

```text
A person/resource/opportunity being considered as a possible fit for another user.
```

Qualifies if:

- they may satisfy a translated need
- they may be a person/resource/tool supporting a recommendation
- they have not been verified, vouched for, or approved

## What we must NOT claim

Do not claim a candidate is:

- a customer
- a participant
- verified
- interested
- available
- safe
- a match
- a lead unless they have shown direct interest
- proof of demand

## Safe sentence

```text
We have 12 test candidates to screen.
```

## Unsafe sentence

```text
We have 12 users/customers.
```

---

# 2. Participant

## What qualifies them

Use `participant` for someone who has joined the concierge experiment and begun the test flow.

Qualifies if:

- they consent to participate in the concierge test
- they begin intake, a session, or the agreed experiment workflow
- they understand this is a test / concierge experiment, not a public product promise

Recommended sub-statuses:

```text
Participant - started
Participant - completed intake
Participant - recommendation delivered
Participant - outcome recorded
```

## What we must NOT claim

Do not claim a participant is:

- a customer
- paying
- retained
- converted
- validated demand by itself
- representative of the whole market
- guaranteed serious or qualified

Do not count the same participant as a customer unless they actually paid Werkles through an approved payment path.

## Safe sentence

```text
Five participants have started the concierge test; three completed intake.
```

## Unsafe sentence

```text
Five customers are using Werkles.
```

---

# 3. Tester

## What qualifies them

Use `tester` for a participant whose explicit role is to test the experience, language, flow, or recommendation quality.

Qualifies if:

- they know they are testing an unfinished flow
- they are giving feedback on the experience
- their main role is learning/evidence, not normal product use

Tester is usually a more honest term than customer before launch.

## What we must NOT claim

Do not claim a tester is:

- a customer
- proof of market demand
- a normal production user
- a paying user
- evidence of retention
- evidence of scaled product-market fit

Do not hide the tester relationship when reporting traction.

## Safe sentence

```text
User 03 is a tester in the N=20 concierge experiment.
```

## Unsafe sentence

```text
User 03 is a retained customer.
```

---

# 4. Paid Participant

## What qualifies them

Use `paid participant` only when Werkles pays or compensates the person to participate in research/testing.

Qualifies if:

- Werkles pays them a stipend, gift card, discount, credit, or other compensation
- they join partly or fully because they are compensated
- their role is research/test participation

Important:

```text
Paid participant means Werkles paid them.
It does not mean they paid Werkles.
```

If the person paid Werkles, call them:

```text
customer
paying customer
paid user
```

only if the payment path was approved and actually completed.

## What we must NOT claim

Do not claim a paid participant is:

- a customer
- revenue
- willingness-to-pay evidence
- organic demand
- retention
- proof they would have joined without compensation

Paid participants can produce useful clarity/trust/action feedback, but they are contaminated for payment-demand claims unless separately measured.

## Safe sentence

```text
We interviewed three paid participants; their feedback counts for clarity and trust, not revenue.
```

## Unsafe sentence

```text
Three paid participants prove people will pay.
```

---

# 5. Customer

## What qualifies them

Use `customer` only when the person pays Werkles through an approved payment path for access, a session, dues, or another clearly described product/service.

Qualifies if all are true:

1. Ben approved the payment test or live payment path.
2. The user was clearly told what they were paying for.
3. The user actually completed payment to Werkles.
4. The payment was not fake-door only.
5. The payment was not a research stipend flowing from Werkles to the user.

Sub-terms:

```text
paying customer = paid Werkles
trial customer = entered a free trial with normal product intent
comped customer = access granted free, not revenue
test customer = paid or trialed inside a test, label the test context
```

## What we must NOT claim

Do not claim customer status from:

- Would Pay
- referral
- waitlist signup
- demo interest
- intake completion
- free tester
- paid participant
- fake-door click
- verbal "I would pay"
- asking for price
- asking for another recommendation

Do not claim:

- retention after one payment
- recurring revenue after one one-time payment
- product-market fit from a handful of customers
- legal/compliance approval
- public launch readiness

## Safe sentence

```text
If an approved payment test runs, 4 of 20 paid; call them paying customers for that bounded offer.
```

## Unsafe sentence

```text
Ten people said they would pay, so we have ten customers.
```

---

# 6. Lead

## What qualifies them

Use `lead` for someone who has shown enough interest that Werkles can reasonably follow up, but who has not yet joined the test or paid.

Qualifies if:

- they submit a waitlist/contact form
- they ask to learn more
- they request an invite
- they respond positively to outreach
- they ask about price/access
- a credible referrer introduces them and they have not started yet

Recommended sub-statuses:

```text
lead - cold
lead - warm
lead - qualified
lead - invited
lead - started intake
```

Once they start the experiment, call them participant/tester, not merely lead.

## What we must NOT claim

Do not claim a lead is:

- a customer
- a participant
- a conversion
- paid
- verified
- retained
- proof of willingness to pay

Do not count a lead as demand unless the report names the lead quality and source.

## Safe sentence

```text
We have seven qualified leads for the next concierge cohort.
```

## Unsafe sentence

```text
We have seven customers waiting.
```

---

# 7. Referral

## What qualifies them

Use `referral` for a person or opportunity introduced or named by someone else.

Two levels:

### A. Referral signal

```text
An existing participant/user names a specific serious person who might benefit.
```

Qualifies if:

- they name a specific person or relationship
- the person sounds relevant to the target audience
- no contact has necessarily happened yet

### B. Referred lead

```text
The referred person is actually introduced or contacts Werkles.
```

Qualifies if:

- a warm intro happens
- the referred person replies
- the referred person submits interest
- Werkles can follow up

## What we must NOT claim

Do not claim a referral is:

- a customer
- a participant
- a paid user
- proof of revenue
- proof the referred person wants Werkles
- proof the referrer would pay

Referral measures social trust. It is not payment.

## Safe sentence

```text
Eight participants named a specific referral candidate; four made a usable intro.
```

## Unsafe sentence

```text
Eight referrals means eight new customers.
```

---

# Correct Reporting Ladder

Use this ladder in updates and scorecards:

| Term | Minimum evidence | Stronger than | Weaker than |
|------|------------------|---------------|-------------|
| Candidate | identified as plausible fit | raw name/list | lead/participant |
| Lead | showed interest or was introduced for follow-up | candidate | participant/customer |
| Referral signal | participant names a specific serious person | vague "I know people" | referred lead |
| Referred lead | referred person is introduced or responds | referral signal | participant/customer |
| Participant | starts the test | lead | customer |
| Tester | knowingly tests unfinished flow | participant | customer |
| Paid participant | Werkles compensates them to test | tester | customer/revenue |
| Would Pay | credible stated payment intent | vague praise | paid/customer |
| Customer | actually pays Werkles through approved path | Would Pay | retained customer |

## Never compress this to:

```text
participants = customers
testers = customers
leads = customers
referrals = customers
would pay = paid
paid participant = paying customer
```

---

# Dashboard Language Patch

Replace fuzzy traction labels:

```text
users
customers
traction
demand
```

With precise labels:

```text
N=20 invited candidates
N started participants
N completed-intake participants
N recommendation-delivered participants
N action-taken participants
N Would Pay signals
N referral signals
N referred leads
N paying customers, if and only if payment was approved and completed
```

## Example honest first-5 update

```text
First five status:
- 5 invited candidates
- 4 started participants
- 3 completed intake
- 3 recommendations delivered
- 2 action-taken participants
- 2 Would Pay signals
- 1 referral signal
- 0 customers because no approved payment path was tested
```

## Example dishonest update

```text
We have 5 users, 2 customers, and 1 referral customer.
```

Why dishonest:

- "users" hides started vs completed
- "customers" implies payment
- referral is not a customer

---

# What Each Term Must Not Claim

| Term | Must not claim |
|------|----------------|
| Candidate | interest, participation, payment, verification, fit |
| Participant | payment, retention, customer status, representative market proof |
| Tester | normal product usage, production readiness, customer status |
| Paid participant | revenue, willingness to pay, organic demand |
| Customer | retention, product-market fit, legal/compliance approval, verified safety |
| Lead | conversion, participation, payment, proof of demand |
| Referral | payment, customer status, referred person's intent, verified fit |

---

# Maker Recommendation

For the concierge test, use these default terms:

```text
Before invite: candidate
After interest but before start: lead
After test start: participant
If explicitly testing unfinished flow: tester
If Werkles pays them: paid participant
If they name someone serious: referral signal
If that person responds: referred lead
If they pay Werkles through an approved path: customer
```

The most important rule:

```text
No one is a customer until money moves from them to Werkles through an approved payment path.
```

The second most important rule:

```text
Would Pay and Would Refer are valuable signals, but they are not customers and not revenue.
```

The third most important rule:

```text
A paid participant is evidence from compensated research, not evidence of customer demand.
```
