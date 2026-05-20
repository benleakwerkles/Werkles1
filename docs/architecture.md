# Werkles Architecture Decisions

This document is the current source of truth for architecture, monetization boundaries, and cross-agent working assumptions.

## Platform

Werkles is web-first and mobile-first responsive. The functional app should be built with Next.js on Vercel. Native iOS and Android are deferred by ADR-001 and gated by product metrics. A PWA is optional during beta.

## Backend

Use Supabase Postgres and Supabase Auth.

- Auth starts with email plus phone for two-factor authentication.
- Apply Row-Level Security to every user-data table.
- Keep the existing Vercel deployment path.

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
