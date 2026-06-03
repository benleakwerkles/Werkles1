# OAuth + Stripe Operator Checklist

Status: **operator session guide** — Ben-only provider consoles  
Record decisions in `foreman/gates/APPROVAL_LOG.md`. Never paste secrets into chat or repo.

**Prerequisite:** **`[AWAITING HUMAN GATE: APP_INFRA_01_FUNCTIONAL_SURFACE_REVIEW]`** — **closed** (Ben APPROVE 2026-06-03).

**Current app auth:** Supabase **email + password** (`/login`, `/signup`). Social OAuth is optional future work — Google Cloud steps below apply only if you enable a provider.

---

## Session order

1. [x] APP_INFRA-01 verdict recorded (APPROVE 2026-06-03)
2. [ ] Supabase Auth URL config + keys → Vercel
3. [ ] Stripe **test mode** — products/prices → webhook → secrets → test checkout
4. [ ] Stripe **live mode** — only after test webhook + checkout pass
5. [ ] Crucible providers (Stripe Identity, etc.) — separate later gate

---

## A — Supabase Auth (OAuth / redirect gates)

| Step | Open | You approve |
|------|------|-------------|
| Log in | [Supabase — Projects](https://supabase.com/dashboard/projects) | Pick Werkles project |
| Redirect URLs | Project → **Authentication → URL Configuration** | Site URL + redirect allow-list |
| Email templates | Project → **Authentication → Email Templates** | Confirm/signup copy OK |
| API keys | Project → **Settings → API** | Anon + service role → Vercel (Ben-only entry) |
| Social provider (optional) | Project → **Authentication → Providers** | Enable Google/GitHub etc. |

**Redirect URLs to allow** (from app code):

```text
https://werkles.com/auth/callback
http://localhost:3000/auth/callback
```

**Vercel env vars** (after `APPROVE SECRET ENTRY`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `CRON_SECRET`

**Vercel:** [Dashboard](https://vercel.com/dashboard) → Werkles project → **Settings → Environment Variables**

### Optional — Google OAuth (only if enabling Google sign-in)

| Step | Open |
|------|------|
| OAuth client | [Google Cloud — Credentials](https://console.cloud.google.com/apis/credentials) |
| Consent screen | [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent) |

Paste Client ID + Secret into Supabase **Providers → Google** only. Do not paste into chat.

**Gate phrase when done with Supabase console work:**

```text
PROVIDER LOGIN DONE
```

---

## B — Stripe (test mode first)

Toggle **Test mode** on in Stripe before steps 1–4.

| Step | Gate phrase | Open | You approve |
|------|-------------|------|-------------|
| 1 | `APPROVE STRIPE PRODUCT PREP` | [Products (test)](https://dashboard.stripe.com/test/products) | Names/prices vs `company/PRICING.md` + `lib/stripe-manifest.ts` |
| 2 | `APPROVE SECRET ENTRY` | [API keys (test)](https://dashboard.stripe.com/test/apikeys) | Copy keys → Vercel privately |
| 3 | — (mechanical) | [Webhooks (test)](https://dashboard.stripe.com/test/webhooks) | Endpoint + events (see below) |
| 4 | `APPROVE PAID CHECKOUT GO-LIVE` | [Checkout settings](https://dashboard.stripe.com/settings/checkout) | Test checkout on `/membership` passes; webhook is source of truth |

**Webhook endpoint:**

```text
https://werkles.com/api/webhooks/stripe
```

**Subscribe to events:**

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

**Test checkout flow:** log in → https://werkles.com/membership → complete Stripe test checkout → confirm profile updates via webhook (not success page alone).

**Stripe env vars** (test first):

| Var | Notes |
|-----|--------|
| `STRIPE_SECRET_KEY` | `sk_test_…` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` from webhook endpoint |
| `STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID` | Preferred name in `lib/stripe-manifest.ts` |
| `STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID` | Preferred name in `lib/stripe-manifest.ts` |
| `STRIPE_MONTHLY_PRICE_ID` | Legacy fallback in `lib/stripe.ts` |
| `STRIPE_YEARLY_PRICE_ID` | Legacy fallback in `lib/stripe.ts` |

Crucible one-time prices (later): see full list in `lib/stripe-manifest.ts`.

---

## C — Stripe live mode (after test pass)

| Step | Gate phrase | Open | Blocked until |
|------|-------------|------|---------------|
| 1 | `APPROVE LIVE STRIPE PRODUCT CREATE` | [Products (live)](https://dashboard.stripe.com/products) | Pricing vs `company/PRICING.md`; Crucible copy reviewed |
| 2 | `APPROVE PAID CHECKOUT GO-LIVE` | [Webhooks (live)](https://dashboard.stripe.com/webhooks) | Live webhook secret in Vercel; test-mode checkout + webhook verified |
| 3 | — | [Customer portal](https://dashboard.stripe.com/settings/billing/portal) | Portal config before opening `/dashboard/billing` portal |

Switch API keys and price IDs to **live** values in Vercel only after both gate phrases are recorded.

---

## D — Crucible providers (later)

| Step | Gate phrase | Open |
|------|-------------|------|
| Identity | `APPROVE CRUCIBLE PROVIDER TEST` | [Stripe Identity](https://dashboard.stripe.com/identity/application) |

Also blocked until counsel review for FCRA-sensitive flows. See `foreman/APP_INFRA_UX_START_PACKET.md` §6.

---

## Copy-paste rows for `APPROVAL_LOG.md`

Replace timestamp and adjust **Decision** / **Next gate** as you go. One row per gate you complete.

```markdown
| YYYY-MM-DDTHH:MM:SS-04:00 | APP_INFRA-01 functional surface review | foreman/reviews/APP_INFRA_01_FUNCTIONAL_SURFACE_REVIEW.md | APPROVE APP_INFRA-01 FUNCTIONAL SURFACE | APPROVED | `[IN PROGRESS: SUPABASE_AUTH_STRIPE_TEST_WIRING]` |
| YYYY-MM-DDTHH:MM:SS-04:00 | Supabase Auth URL + keys | supabase.com dashboard; Vercel env | PROVIDER LOGIN DONE — Supabase redirect URLs and keys entered in Vercel | APPROVED | `[IN PROGRESS: STRIPE_TEST_PRODUCT_PREP]` |
| YYYY-MM-DDTHH:MM:SS-04:00 | Stripe test product prep | company/PRICING.md; lib/stripe-manifest.ts | APPROVE STRIPE PRODUCT PREP | APPROVED | `[IN PROGRESS: STRIPE_TEST_WEBHOOK]` |
| YYYY-MM-DDTHH:MM:SS-04:00 | Stripe test secrets | Vercel env; .env.example | APPROVE SECRET ENTRY | APPROVED | `[IN PROGRESS: STRIPE_TEST_CHECKOUT]` |
| YYYY-MM-DDTHH:MM:SS-04:00 | Stripe test checkout + webhook | app/api/webhooks/stripe/route.ts; /membership | APPROVE PAID CHECKOUT GO-LIVE (test mode) | APPROVED | `[AWAITING HUMAN GATE: STRIPE_LIVE_PRODUCT_CREATE]` |
| YYYY-MM-DDTHH:MM:SS-04:00 | Stripe live products | dashboard.stripe.com/products | APPROVE LIVE STRIPE PRODUCT CREATE | APPROVED | `[AWAITING HUMAN GATE: STRIPE_LIVE_CHECKOUT_GO_LIVE]` |
| YYYY-MM-DDTHH:MM:SS-04:00 | Stripe live checkout | werkles.com/membership; live webhook | APPROVE PAID CHECKOUT GO-LIVE | APPROVED | `[IN PROGRESS: MEMBERSHIP_LIVE]` |
| YYYY-MM-DDTHH:MM:SS-04:00 | Crucible Stripe Identity test | dashboard.stripe.com/identity | APPROVE CRUCIBLE PROVIDER TEST | APPROVED | `[IN PROGRESS: CRUCIBLE_PROVIDER_WIRING]` |
```

---

## Never paste into chat

Passwords · API keys · webhook secrets · service-role keys · OAuth client secrets · `sk_live_` / `sk_test_` · `whsec_` · JWTs · refresh tokens

---

## Quick links (bookmark bar)

| Provider | URL |
|----------|-----|
| Supabase | https://supabase.com/dashboard/projects |
| Stripe (test) | https://dashboard.stripe.com/test/dashboard |
| Stripe webhooks (test) | https://dashboard.stripe.com/test/webhooks |
| Vercel | https://vercel.com/dashboard |
| Google OAuth (optional) | https://console.cloud.google.com/apis/credentials |
| Werkles login | https://werkles.com/login |
| Werkles membership | https://werkles.com/membership |
| Foreman dashboard | http://localhost:4317 |

**Doctrine:** `foreman/HUMAN_GATES.md` · `foreman/APP_INFRA_UX_START_PACKET.md` §6 · `foreman/reviews/APP_INFRA_01_FUNCTIONAL_SURFACE_REVIEW.md`
