# FROM MAKER - PAYMENT SIGNAL REVIEW V1

Execution context: `CURSOR_CLOUD_CONTAINER`.

Status: design/metrics handoff. No production deploy, SQL, secrets, billing, merge, legal approval, Stripe action, payment collection, payment test, or live data mutation is approved by this file.

## Mission

Review the concierge scorecard and separate:

- Paid
- Would Pay
- Would Refer

Explain why each measures a different thing and recommend N=20 thresholds.

## Core Finding

The current scorecards use a combined "WTP / pull" bucket. That is fine for quick first-5 inspection, but it is too muddy for N=20.

For N=20, Werkles should track three separate signals:

```text
Paid = behavior under friction.
Would Pay = stated value perception.
Would Refer = social trust / audience fit.
```

Do not collapse them into one score.

---

# 1. Paid

## Definition

Paid means:

```text
A user actually completes an approved payment action for Werkles access or concierge value.
```

Examples that count only if a payment lane is separately approved:

- pays Foundry Dues
- pays for a concierge session
- pays for a verified access tier
- pays a deposit or pre-order
- completes a live checkout

Examples that do not count:

- asks what it costs
- says they would pay
- clicks a fake-door price button
- asks for another recommendation
- refers a friend
- offers to pay later

## What Paid measures

Paid measures:

- price friction
- checkout trust
- urgency strong enough to overcome money friction
- whether value survives the moment of payment
- willingness to trade dollars, not just compliments

Paid does not measure:

- referral potential
- whether the recommendation was understood
- whether the user has a network
- whether the product is safe to scale
- whether a user likes the concept in theory

## Boundary

Current handoff status does not approve payment collection. If no explicit payment test gate exists, record:

```text
Paid: not tested
```

Do not treat `0 paid` as failure unless users were actually offered an approved, safe, clearly framed payment path.

## N=20 threshold if payment is NOT tested

If no payment path is approved:

| Decision | Threshold |
|----------|-----------|
| GO | Paid is marked `not tested`; do not use it as a kill metric |
| CAUTION | Users repeatedly ask to pay, but no approved payment path exists; create a separate payment-test gate |
| STOP | Do not stop on Paid alone because Paid was not measured |

## N=20 threshold if payment IS tested

Only use this if Ben separately approves a bounded payment test.

| Decision | Threshold |
|----------|-----------|
| GO | 4+ of 20 pay |
| CAUTION | 2-3 of 20 pay |
| STOP-risk | 0-1 of 20 pay, if the payment offer was clear, safe, and appropriately priced |

Why 4+:

```text
At N=20, four actual payers is enough to show the value can cross money friction in a hand-held test.
```

Why not require more:

```text
The first concierge experiment is testing decision-support value, not full pricing conversion or paid acquisition.
```

---

# 2. Would Pay

## Definition

Would Pay means:

```text
The user states credible payment intent without completing payment.
```

Credible forms:

- asks what it costs
- asks how to keep access
- asks when paid access opens
- says a specific price feels fair
- chooses a price range from options
- says they would pay for another round
- asks whether Foundry Dues includes this

Weak forms:

- "this is valuable"
- "cool idea"
- "you should charge for this"
- "maybe"
- "I would use this someday"

## What Would Pay measures

Would Pay measures:

- perceived value
- pricing curiosity
- intent before checkout friction
- whether the recommendation feels worth money in the user's mind
- early packaging resonance

Would Pay does not measure:

- actual conversion
- checkout trust
- ability to pay
- urgency strong enough to overcome money friction
- social trust

## Ask format

Ask after the recommendation and next-action check, not before.

Use:

```text
If Werkles kept doing this, would you pay for another recommendation or ongoing access? If yes, what would feel fair?
```

Do not use:

```text
Wouldn't this be worth paying for?
```

Record exact words.

## N=20 threshold

| Decision | Threshold |
|----------|-----------|
| GO | 10+ of 20 show credible Would Pay signal |
| CAUTION | 5-9 of 20 show credible Would Pay signal |
| STOP-risk | 0-4 of 20 show credible Would Pay signal |

## Strength grading

| Grade | Count? | Meaning |
|-------|--------|---------|
| None | no | no price/access/payment curiosity |
| Soft | yes, but mark soft | asks what it costs or says "maybe" with some context |
| Strong | yes | asks how to keep access, names a price, asks for another paid round, or says they would be disappointed if it stopped |

For the N=20 threshold, count Soft and Strong separately:

```text
Would Pay total = Soft + Strong
Strong Would Pay = Strong only
```

Recommended added sub-threshold:

| Decision | Strong Would Pay |
|----------|------------------|
| GO | 5+ strong |
| CAUTION | 2-4 strong |
| STOP-risk | 0-1 strong |

---

# 3. Would Refer

## Definition

Would Refer means:

```text
The user would put social trust at risk by sending another serious person to Werkles.
```

Strong forms:

- names one specific person who should try it
- offers to introduce Ben to that person
- sends the referral within 7 days
- asks for a share link or intro language
- says "my friend / partner / operator needs this"

Weak forms:

- "I can think of people"
- "lots of people need this"
- "this could help builders"
- "I'll spread the word"

## What Would Refer measures

Would Refer measures:

- trust transfer
- audience fit
- word-of-mouth potential
- whether the value is clear enough to explain to someone else
- whether the product avoids embarrassment risk

Would Refer does not measure:

- willingness to pay
- ability to pay
- actual conversion
- whether the user personally needs more
- whether the referred person is qualified

## Ask format

Ask:

```text
Is there one specific serious person you would send this to? If yes, who are they in relation to you, and why them?
```

Do not ask for private contact details unless a separate safe referral workflow exists. For this scorecard, a named relationship/type is enough:

```text
my cousin who runs a landscaping crew
my vendor who wants to open a shop
my friend trying to find an operator
```

## N=20 threshold

| Decision | Threshold |
|----------|-----------|
| GO | 8+ of 20 name a specific serious referral candidate |
| CAUTION | 4-7 of 20 name a specific serious referral candidate |
| STOP-risk | 0-3 of 20 name a specific serious referral candidate |

Recommended stricter sub-threshold:

| Decision | Referral follow-through within 7 days |
|----------|--------------------------------------|
| GO | 4+ users actually send/offer a usable referral path |
| CAUTION | 2-3 users |
| STOP-risk | 0-1 users |

Follow-through matters because "I know people" is cheap. A real referral risks social capital.

---

# Why They Measure Different Things

| Signal | Measures | Failure means | Does not measure |
|--------|----------|---------------|------------------|
| Paid | money friction crossed | value may not survive price/checkout | referral trust, comprehension |
| Would Pay | perceived value and pricing curiosity | users may like it but not see it as worth money | actual conversion |
| Would Refer | social trust and audience fit | users may not trust it enough to share | personal payment intent |

## Examples

### Would Pay but would not refer

Meaning:

```text
The user personally values it but is not confident enough to put their name on it.
```

Interpretation:

- value exists
- social trust may be weak
- positioning may feel embarrassing or hard to explain
- safety/trust copy may need work

### Would Refer but would not pay

Meaning:

```text
The user believes someone else needs it more than they do.
```

Interpretation:

- audience targeting may be off
- referral channel may be strong
- user may be an influencer/connector but not buyer
- value is legible, but not personally urgent

### Paid but would not refer

Meaning:

```text
The user has urgent personal pain, but does not yet trust the product socially.
```

Interpretation:

- price/value may work
- brand/trust/referral language may need repair
- avoid assuming paid conversion equals word-of-mouth

### Would refer and would pay, but did not act

Meaning:

```text
The concept sounds valuable, but the recommendation did not change behavior.
```

Interpretation:

- concierge card/action design is weak
- next action may be too hard
- action timing may be wrong
- do not over-weight WTP/referral over action rate

---

# Recommended N=20 Scorecard Patch

Replace the combined row:

```text
Willingness-to-pay / pull
```

With three rows:

```text
Paid
Would Pay
Would Refer
```

## N=20 table

| Metric | GO | CAUTION | STOP-risk | Notes |
|--------|----|---------|-----------|-------|
| Paid, if approved/tested | 4+/20 | 2-3/20 | 0-1/20 | Only if a payment test is explicitly approved |
| Paid, if not approved/tested | Not tested | Payment curiosity creates new gate | Do not use as kill metric | Do not collect money by accident |
| Would Pay total | 10+/20 | 5-9/20 | 0-4/20 | Soft + Strong |
| Strong Would Pay | 5+/20 | 2-4/20 | 0-1/20 | Better indicator than total |
| Would Refer specific | 8+/20 | 4-7/20 | 0-3/20 | Must name a specific serious person/type |
| Referral follow-through | 4+/20 | 2-3/20 | 0-1/20 | Strongest referral signal |

## Interaction with existing kill thresholds

These payment/referral signals should not replace the core concierge thresholds:

- completion
- clarity
- visible-reason trust
- action taken
- safety/boundary warnings
- concierge labor
- repeatable patterns

Instead, use them as value/pull diagnostics.

```text
Action rate proves the recommendation changes behavior.
Would Pay proves perceived economic value.
Would Refer proves social trust and audience fit.
Paid proves value survives money friction.
```

---

# Decision Rules

## GO

For N=20, payment-signal GO requires:

```text
Would Pay total: 10+/20
Strong Would Pay: 5+/20
Would Refer specific: 8+/20
Referral follow-through: 4+/20
Paid: 4+/20 only if payment was explicitly tested
```

If Paid was not tested, GO can still happen if the core concierge thresholds pass and Would Pay / Would Refer are strong.

## CAUTION

CAUTION if:

```text
Would Pay total is 5-9/20
or Strong Would Pay is 2-4/20
or Would Refer specific is 4-7/20
or Referral follow-through is 2-3/20
```

Likely pivot:

- clarify packaging
- test price framing
- improve referral language
- narrow audience
- ask users who would pay vs who would refer and compare personas

## STOP-risk

STOP-risk if:

```text
Would Pay total is 0-4/20
Strong Would Pay is 0-1/20
Would Refer specific is 0-3/20
Referral follow-through is 0-1/20
Paid is 0-1/20 after an approved clean payment test
```

Do not stop on payment-signal weakness alone if completion/clarity/trust/action are strong. Instead, classify the failure:

```text
Strong action but weak Would Pay = value may be useful but not monetizable yet.
Strong Would Pay but weak action = idea sounds valuable but workflow fails behavior.
Strong Would Refer but weak Would Pay = audience/channel mismatch.
Strong Paid but weak referral = urgent private pain, weak social trust.
```

---

# Operator Recording Format

Use this per user:

```text
USER: U__

PAID
Payment path offered? Y/N
Paid? Y/N/Not tested
Amount if approved/tested:
Notes:

WOULD PAY
None / Soft / Strong
Exact words:
Named price or package:

WOULD REFER
None / Vague / Specific / Followed through
Who/type of person:
Why them:
Follow-through by 7 days? Y/N

INTERPRETATION
Buyer? Y/N/Maybe
Referrer? Y/N/Maybe
Both? Y/N
Neither? Y/N
```

Use this summary at N=20:

```text
Paid: __ / __ offered payment path
Would Pay total: __ / 20
Strong Would Pay: __ / 20
Would Refer specific: __ / 20
Referral follow-through: __ / 20

Pattern:
[ ] Buyers but not referrers
[ ] Referrers but not buyers
[ ] Both buyers and referrers
[ ] Neither
[ ] Mixed by persona/lane

Decision:
GO / CAUTION / STOP-risk

Primary interpretation:
Next test:
```

---

# Maker Recommendation

Do not ask "will they pay?" as one fuzzy question.

Ask three separate questions:

```text
1. Did they actually pay, if an approved payment path existed?
2. Did they credibly say they would pay?
3. Would they risk social capital by referring one serious person?
```

Recommended N=20 minimum for a strong concierge value signal without an approved payment test:

```text
10+ Would Pay total
5+ Strong Would Pay
8+ specific Would Refer
4+ referral follow-through
```

Recommended N=20 minimum if a payment test is later approved:

```text
4+ Paid
plus the Would Pay / Would Refer thresholds above
```

The clean read:

```text
Paid proves money friction.
Would Pay proves perceived value.
Would Refer proves social trust.
Action rate still proves the recommendation mattered.
```
