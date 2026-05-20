# Werkles Architecture Decisions

This document is the current source of truth for architecture, monetization boundaries, and cross-agent working assumptions.

Current locked spec: Werkles v0.2 final master spec, May 20, 2026. This supersedes earlier AI handoffs.

## Platform

Werkles is web-first and mobile-first responsive. The functional app should be built with Next.js on Vercel. Native iOS and Android are deferred by ADR-001 and gated by product metrics. A PWA is optional during beta.

## Backend

Use Supabase Postgres and Supabase Auth.

- Auth starts with email plus phone for two-factor authentication.
- Apply Row-Level Security to every user-data table.
- Keep the existing Vercel deployment path.
- Admin authorization is table-driven through `public.admin_users`; do not hardcode admin emails into RLS policies.

## Data Philosophy

Werkles should not store raw SSNs, bank account numbers, full ID documents, or face images in v0-v1.

Sensitive verification should be handled through third-party APIs. Werkles stores only scoped verification receipts such as:

- category
- status
- method/provider
- checked-at timestamp
- expires-at timestamp when applicable
- non-sensitive reference ID from the provider

Members see proof status, not source documents.

## Monetization Boundary

For v0-v1, monetization is subscription only.

Werkles should not take:

- transaction-based compensation
- success fees
- referral fees tied to deals
- carried interest
- commissions on investments, loans, acquisitions, or business sales

This is a compliance boundary, not just a pricing preference.

## Compliance Frame

Werkles is a partner discovery and verification platform.

Werkles does not:

- solicit securities transactions
- recommend investments or loans
- structure deals
- facilitate securities transactions
- facilitate loans
- facilitate the sale of a business
- move money

All deals happen off-platform. Anything involving securities, lending, business sale facilitation, equity, revenue share, paid introductions tied to capital, background checks, or verification retention must be reviewed by qualified counsel before production use.

Required platform disclaimer:

> Werkles is a partner discovery and verification platform. We do not facilitate any securities transaction, loan, investment, or sale of business. Werkles never holds or transmits funds.

This disclaimer must appear in the footer, Terms, and every match card.

Phone collection requires explicit consent before phone verification or two-factor authentication. Checkr/FCRA workflows, Terms, Privacy Policy, tax treatment, and transaction/investment boundary language need attorney/accountant review before launch.

DPAs must be executed with Stripe, Plaid, Twilio, PostHog, and Checkr before the first beta user.

## Vendor Stack

Locked v0 vendor choices:

| Function | Vendor |
| --- | --- |
| Identity verification | Stripe Identity |
| Funds verification | Plaid Assets |
| Background checks | Checkr hosted flow |
| Phone verification | Twilio Verify |
| Subscriptions | Stripe Billing |
| Analytics | PostHog |
| Push notifications | Expo Push, deferred to v1.5 |

Do not add money movement, lending, securities, broker-dealer, or deal-facilitation features in v0-v1.

## Product Language

Approved action copy:

- Pending: "Checking the Blueprint"
- Accept: "Lock the Joints"
- Decline: "No fit. Keep building."

Quirky words such as Dynamo, Werkle, and Traflium may be used as UI flair, empty states, or 404 jokes. They must not become database enums, API statuses, or compliance-critical labels.

## Design System

The CSS custom properties in `:root` are the design-token source of truth. Future Tailwind config should consume these tokens. Future React Native work should map back to the same token names and values.

## Intro Request State Machine

Intro requests use double-key co-sign.

- Initial status: `Pending Co-Sign`
- Co-signer action: `Co-Signed` or `Declined`
- Hourly TTL: after 48 hours, pending requests become `Auto-Approved` only if scout and co-signer are still blueprint members; otherwise `Expired`
- Target action after `Co-Signed` or `Auto-Approved`: `Locked` or `Declined`

Frontend copy:

- `Pending Co-Sign`: "Checking the Blueprint"
- Target accept: "Lock the Joints"
- Target decline: "No fit. Keep building."

## Blueprint Lane Caps

Active blueprint caps are enforced server-side.

- Builder, Operator, Connector: max 3 active blueprints
- Backer, Spark: max 10 active blueprints
- Active means blueprint status `Active`; `Draft`, `Completed`, and `Archived` do not count

## Quarantine And Blocking

Admin quarantine sets `profiles.account_status = 'Quarantined'`. Quarantined users disappear from `profiles_public`, but existing blueprint memberships stay untouched.

Blocking must be respected both directions before showing a profile in the match deck or allowing an intro request.

## Matching Engine

Production matching starts in Postgres with `public.match_candidates_for_blueprint(p_blueprint_id uuid, p_scout_user_id uuid)`.

The function returns `target_user_id`, integer `score`, and explainable `factors` JSONB. It uses:

- fluid location gate by blueprint environment
- Gemini lane complementarity matrix
- candidate verified Capital badge plus range overlap
- skill lock-and-key from `skills_sought` to `skills_offered`
- shared `industry_tags`
- `timeline_to_launch` and `primary_goal`
- endgame penalty for `Venture Scale/Exit` vs `Generational Family Business`
- blocking and quarantine exclusion

It must never return raw financial ranges.

## Camelot Admin Bootstrap

Initial admin emails:

- `shaunmroberts1230@gmail.com`
- `ben.leak@kindsir.com`

After those people create Supabase Auth accounts and profiles, run `supabase/admin_bootstrap.sql`. The script maps emails to `auth.users` UUIDs and inserts matching profile IDs into `public.admin_users`. RLS policies continue to use `public.admin_users` only.
