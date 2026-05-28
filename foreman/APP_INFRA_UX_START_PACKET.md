# App Infrastructure / UX Start Packet

Status: pending Operator review
Generated: 2026-05-24
Gate cleared by Operator: app infrastructure and UX start
Stop gate: `[AWAITING HUMAN GATE: APP_INFRA_REVIEW]`

## 0. Scope

This packet prepares the next implementation cycle. It does not create live Stripe products, enter secrets, deploy, run Ghost Forge, run Bellows, apply unrelated SQL, or add user-to-user payment logic.

Approved work lanes:

- app infrastructure scaffolding
- UX shells
- pricing UI
- Stripe product/price preparation
- Crucible verification UX based on passthrough + handling rules

Forbidden in this cycle:

- live Stripe product creation without explicit Operator approval
- secrets in repo, chat, logs, screenshots, or browser code
- deployment
- Ghost Forge or Bellows execution
- unrelated SQL
- user-to-user payment logic
- take-rate, success fee, escrow, lending, premium trust badge logic

## 1. Files To Create / Modify

### Create

- `lib/design-tokens.ts`
  - Implementation-facing token source aligned to `foreman/DESIGN_SYSTEM.md`.
  - Build tooling can later feed Tailwind and CSS variables from it.

- `lib/pricing.ts`
  - Code-readable pricing manifest derived from `company/PRICING.md`.
  - No hardcoded Stripe price IDs.
  - Dollar anchors may appear for UI display, but live checkout uses env-driven Stripe price IDs.

- `lib/stripe-manifest.ts`
  - Draft product/price manifest for Stripe Dashboard setup.
  - Product names, billing interval, env var names, and metadata keys.
  - No secret values.

- `lib/crucible.ts`
  - Verification UX states, price display helpers, and guardrail copy.
  - No provider session creation by itself.

- `components/pricing/pricing-card.tsx`
  - Reusable pricing display card.

- `components/pricing/pricing-table.tsx`
  - Foundry Dues, Armory anchors, Crucible service table, Drafting Table status.

- `components/crucible/verification-card.tsx`
  - Display a verification workflow, state, price, and action.

- `components/crucible/crucible-panel.tsx`
  - User-facing verification shell.

- `app/pricing/page.tsx`
  - Public pricing page sourced from `lib/pricing.ts`.

- `app/dashboard/crucible/page.tsx`
  - Auth-required verification center shell.

- `app/dashboard/billing/page.tsx`
  - Billing status shell and Stripe portal placeholder.

- `app/api/billing/portal/route.ts`
  - Future Stripe billing portal route.
  - Shell only until Stripe Customer Portal settings and env vars are approved.

### Modify / Audit

- `app/membership/page.tsx`
  - Align Foundry Dues UI with `company/PRICING.md`.
  - Rename annual flavor to "The Long Run".

- `app/membership/success/page.tsx`
  - Keep success page as "processing membership" only.
  - Do not grant membership from frontend success.

- `app/api/membership/checkout/route.ts`
  - Ensure checkout uses env price IDs only.
  - Ensure no live product creation occurs.
  - Ensure mode is `subscription` for Foundry Dues.

- `app/api/webhooks/stripe/route.ts`
  - Confirm webhook is source of truth for membership state.
  - Confirm raw body signature verification.

- `app/api/verification/identity/route.ts`
  - Prepare sandbox Stripe Identity session path.
  - Gate live execution behind env and membership rules.

- `app/api/verification/funds/route.ts`
  - Prepare Plaid Assets UX/API shell only.
  - No live Plaid calls until explicit provider setup.

- `app/proof/page.tsx`
  - Add Crucible language pointing to transparent passthrough + handling rules.

- `app/globals.css`
  - Later cycle: consume `lib/design-tokens.ts` output or manually reconcile CSS vars.
  - Do not hard-code new random hex values.

- `foreman/NEXT_ACTION.md`
  - Set review gate to `[AWAITING HUMAN GATE: APP_INFRA_REVIEW]`.

## 2. Proposed Routes / Pages

### Public

- `/pricing`
  - Foundry Dues membership.
  - Armory anchor pricing.
  - Crucible verification pricing.
  - Drafting Table bundled/standalone.
  - Sponsored Anvil principles with rates deferred.
  - Explicit forbidden-model note: no take-rate, no escrow, no pay-per-intro.

- `/membership`
  - Focused checkout entry for Foundry Dues.
  - Monthly and Annual "The Long Run".
  - Calls `/api/membership/checkout`.

- `/membership/success`
  - "Processing your membership."
  - Explains that webhook confirmation is the source of truth.

- `/proof`
  - Trust and Crucible explanation.
  - What Werkles verifies, what it cannot guarantee, and what it never stores.

### Authenticated Dashboard

- `/dashboard/crucible`
  - Verification center.
  - Identity, phone, funds, license, reference, employment, background.
  - Shows state, price, receipt scope, and expiration.

- `/dashboard/billing`
  - Membership status.
  - Current plan.
  - Renewal/cancellation text.
  - Future billing portal entry.

### API

- `/api/membership/checkout`
  - Subscription checkout session only.
  - Uses `STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID` and `STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID`.

- `/api/webhooks/stripe`
  - Source of truth for membership updates.
  - No frontend membership grants.

- `/api/billing/portal`
  - Future customer portal session.
  - Requires explicit Stripe portal setup gate.

- `/api/verification/identity`
  - Stripe Identity session shell.
  - Requires membership and provider env readiness.

- `/api/verification/funds`
  - Plaid Assets session shell.
  - Requires explicit Plaid setup gate.

## 3. Pricing Anchors From `company/PRICING.md`

### Foundry Dues

- Monthly: `$9.99/month`
- Annual: `$99/year`
- Annual flavor name: `The Long Run`
- One tier only.
- No Pro.
- No Enterprise.
- No lane-priced membership.

### The Armory

- Simple: `$9.99`
- Mid: `$19`
- Werkles signature tool: `$29`
- Deep / Starter Kit: `$49`
- Bundle: `$99`
- Member rules:
  - Simple: free
  - Mid: free
  - Bundle: free
  - Signature tool: 30% off
  - Deep / Starter Kit: 30% off

### The Crucible

- Identity: `$0` bundled in Foundry Dues, one per year per member
- Identity re-verification: `$2.99`
- Phone: `$0` bundled with membership
- Funds: `$9.99`
- Funds re-verification: first/year free for member, subsequent `$2.99`
- License: `$14.99 per state per check`
- Reference: `$14.99`
- Employment: passthrough + `$5`
- Background Basic: `$34.99`
- Background Essential: `$59.99`
- Background Complete: `$94.99`
- Continuous monitoring: `$2.99/month per individual`
- Maximum markup: `$5` flat handling fee per check

### Drafting Table

- Foundry Dues member: bundled
- Standalone non-member: `$19/month per workspace`, available but de-emphasized

### Sponsored Anvils

Principles locked, rates deferred:

- Sponsored Lane Spotlight: `$500-$2,000` proposed range
- Venue Partner Subscription: `$99-$199` proposed range
- Featured Meet-Up Sponsorship: `$250-$500` proposed range
- Tools Affiliate: `5%-8%` proposed range
- Insurance Affiliate: `$50-$200` proposed range
- Apprenticeship Pipeline: `$25-$75` proposed range
- Insights reports: `$199-$499` proposed range

Do not implement Sponsored Anvil payment flows in this cycle.

## 4. Stripe Product / Price Manifest Draft

This is a preparation manifest only. Do not create live Stripe products from this packet without explicit Operator approval.

### Products To Prepare

| Product key | Stripe product name | Type | Price | Env var |
| --- | --- | --- | ---: | --- |
| `foundry_dues_monthly` | Foundry Dues - Monthly | subscription | $9.99/month | `STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID` |
| `foundry_dues_annual` | Foundry Dues - Annual - The Long Run | subscription | $99/year | `STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID` |
| `drafting_table_standalone` | Drafting Table - Standalone Workspace | subscription | $19/month | `STRIPE_DRAFTING_TABLE_STANDALONE_PRICE_ID` |
| `identity_reverification` | Crucible - Identity Re-Verification | one-time | $2.99 | `STRIPE_CRUCIBLE_IDENTITY_REVERIFY_PRICE_ID` |
| `funds_verification` | Crucible - Funds Verification | one-time | $9.99 | `STRIPE_CRUCIBLE_FUNDS_PRICE_ID` |
| `funds_reverification` | Crucible - Funds Re-Verification | one-time | $2.99 | `STRIPE_CRUCIBLE_FUNDS_REVERIFY_PRICE_ID` |
| `license_check` | Crucible - License Check | one-time | $14.99 | `STRIPE_CRUCIBLE_LICENSE_PRICE_ID` |
| `reference_check` | Crucible - Reference Check | one-time | $14.99 | `STRIPE_CRUCIBLE_REFERENCE_PRICE_ID` |
| `background_basic` | Crucible - Background Basic | one-time | $34.99 | `STRIPE_CRUCIBLE_BACKGROUND_BASIC_PRICE_ID` |
| `background_essential` | Crucible - Background Essential | one-time | $59.99 | `STRIPE_CRUCIBLE_BACKGROUND_ESSENTIAL_PRICE_ID` |
| `background_complete` | Crucible - Background Complete | one-time | $94.99 | `STRIPE_CRUCIBLE_BACKGROUND_COMPLETE_PRICE_ID` |
| `continuous_monitoring` | Crucible - Continuous Monitoring | subscription | $2.99/month | `STRIPE_CRUCIBLE_MONITORING_PRICE_ID` |

### Deferred / Not Created In First Stripe Pass

- Armory template SKUs
- Sponsored Anvils
- Venue subscriptions
- Featured meet-up sponsorships
- Insurance affiliate flows
- Apprenticeship pipeline payments
- Insights reports

### Stripe Metadata Draft

Every Stripe product/price should carry:

```text
werkles_surface = foundry_dues | armory | crucible | drafting_table | sponsored_anvil
pricing_source = company/PRICING.md
pricing_version = v0.1
operator_approved = 2026-05-24
```

### Checkout Rules

- Subscriptions use Stripe Checkout `mode: subscription`.
- One-time Crucible checks use Stripe Checkout `mode: payment`.
- Membership status updates only through webhook verification.
- Crucible verification status updates only after provider verification completes.
- Stripe success pages are not source of truth.

## 5. Crucible UX States And Copy

### Shared Trust Copy

- "Membership unlocks access to our verification providers. It does not unlock verification itself."
- "Werkles cannot make anyone trustworthy. We make claims harder to fake."
- "Paid status alone is not a proof signal."
- "We store receipts and statuses, not raw sensitive material."

### State Model

| State | Meaning | User-facing copy |
| --- | --- | --- |
| `not_started` | User has not begun this check | "No steel inspected yet." |
| `membership_required` | Membership needed for bundled/provider access | "Foundry Dues unlocks this workflow. It does not buy the result." |
| `payment_required` | One-time check requires payment | "This check passes through provider cost plus the published handling fee." |
| `ready_to_start` | User can begin | "Ready for inspection." |
| `provider_redirect` | User leaves for provider flow | "The provider handles the sensitive parts. Werkles waits for the receipt." |
| `pending` | Provider/session active | "Inspecting the steel." |
| `verified` | Provider result succeeded | "Claim checked. Receipt filed." |
| `failed` | Provider result failed | "Something did not hold. Fix the claim or pull it out." |
| `expired` | Signal aged out | "This proof has gone cold. Refresh it before leaning on it." |
| `manual_review` | Needs admin/provider review | "This one needs human eyes." |
| `unavailable` | Provider not configured | "The forge is not wired for this check yet." |

### Verification Cards

Each card should show:

- check name
- who it matters for
- price
- included/free rules
- what is checked
- what Werkles stores
- expiration/staleness rule
- CTA state
- legal/compliance footnote where needed

### Check-Specific Copy

#### Identity

- Title: "Identity"
- Price: "Included once per year with Foundry Dues"
- Body: "ID plus selfie through Stripe Identity. Werkles stores the receipt, not your ID images."
- CTA: "Inspect Identity"

#### Phone

- Title: "Phone"
- Price: "Included with membership"
- Body: "Phone ownership check. Useful for account safety and basic reachability."
- CTA: "Check Phone"

#### Funds

- Title: "Funds"
- Price: "$9.99"
- Body: "Bank snapshot through the funds provider. Werkles stores a receipt and status, not account numbers."
- CTA: "Check Funds"

#### License

- Title: "License"
- Price: "$14.99 per state"
- Body: "State-board lookup where available. Signals what was checked, where, and when."
- CTA: "Check License"

#### Background

- Title: "Background"
- Price: "$34.99 / $59.99 / $94.99"
- Body: "User-initiated, user-paid, FCRA-sensitive. Attorney-reviewed flow required before launch."
- CTA: "Prepare Background Check"

#### Employment / Reference

- Title: "Work History"
- Price: "Passthrough + $5 where provider-supported"
- Body: "Work history is gameable. Werkles labels exactly what was checked and what remains self-reported."
- CTA: "Prepare Work Check"

## 6. Human Gates Required Before Live Stripe Actions

### Before creating any Stripe product or price

Human gate required:

```text
APPROVE STRIPE PRODUCT PREP
```

Ben must:

- log into Stripe
- confirm test mode vs live mode
- approve product/price names
- approve env var names

### Before entering Stripe secrets

Human gate required:

```text
APPROVE SECRET ENTRY
```

Ben must enter secrets privately. Codex must not print or store them in repo.

### Before live Stripe product creation

Human gate required:

```text
APPROVE LIVE STRIPE PRODUCT CREATE
```

Blocked until:

- pricing reviewed against `company/PRICING.md`
- counsel-sensitive Crucible copy reviewed
- webhook route verified in test mode
- no hardcoded dollar amounts in checkout code except display-only pricing source

### Before enabling paid checkout in production

Human gate required:

```text
APPROVE PAID CHECKOUT GO-LIVE
```

Blocked until:

- Stripe webhook secret configured
- checkout route tested in test mode
- webhook idempotency verified
- membership status updates only by webhook
- success page does not grant membership
- cancellation/refund copy reviewed

### Before Crucible verification provider launch

Human gate required:

```text
APPROVE CRUCIBLE PROVIDER TEST
```

Blocked until:

- Stripe Identity/Plaid/Checkr/Twilio test credentials are configured privately
- FCRA-sensitive background flow has counsel review
- storage rules confirm no raw sensitive artifacts are stored
- proof signal language is scoped by check type

## 7. Implementation Order After Review

1. Create `lib/design-tokens.ts` from `foreman/DESIGN_SYSTEM.md`.
2. Create `lib/pricing.ts` and `lib/stripe-manifest.ts`.
3. Build `/pricing` public page.
4. Align `/membership` and `/membership/success`.
5. Build `/dashboard/crucible` shell and cards.
6. Add `/dashboard/billing` shell.
7. Audit checkout/webhook routes for source-of-truth boundaries.
8. Audit verification routes for sandbox/provider-gated behavior.
9. Run `npm run typecheck`.
10. Run `npm run build`.

## 8. Current NEXT_ACTION.md

Set to:

```text
[AWAITING HUMAN GATE: APP_INFRA_REVIEW]
```
