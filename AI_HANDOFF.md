# Werkles AI Team Handoff

Use this file to brief Gemini, DeepSeek, Perplexity, or any other review agent on the current Werkles prototype.

Current locked spec: Werkles v0.2 final master spec, May 20, 2026. Discard earlier partial handoffs.

## One-Sentence Product

Werkles is business partner matching for builders, operators, backers, connectors, and sparks who want to start, buy, or scale Main Street businesses together.

## Current State

- Domain: `werkles.com`
- Hosting: Vercel
- Repo: GitHub repo connected to Vercel
- App type: static HTML/CSS/JavaScript prototype
- Backend: Supabase schema and Vercel beta-signup API scaffold are in repo, not fully wired into the live UI yet
- Persistence: browser `localStorage`
- Next architecture: web-first, mobile-first responsive Next.js on Vercel with Supabase Postgres and Supabase Auth
- Current files:
  - `index.html`: app structure and UI
  - `styles.css`: visual design
  - `app.js`: mock profiles, matching logic, local storage, intro queue
  - `README.md`: project overview
  - `DEPLOY.md`: deploy notes
  - `vercel.json`: static deploy headers
  - `supabase/migrations/202605200001_initial_werkles_schema.sql`: v0.2 schema, RLS, triggers, and matching function
  - `supabase/admin_bootstrap.sql`: Camelot admin bootstrap after Auth signup/profile creation

## Architecture Decisions

- Platform: web-first, mobile-first responsive Next.js on Vercel.
- Native mobile: deferred by `docs/adr/ADR-001-web-first-mobile-first.md`; gate by product metrics.
- PWA: optional during beta.
- Backend: Supabase Postgres plus Supabase Auth.
- Auth: email plus phone for two-factor authentication.
- Security: Row-Level Security on every user-data table.
- Sensitive data: zero raw sensitive document storage in v0-v1.
- Verification: store scoped third-party verification receipts only, not raw SSNs, bank account numbers, full ID documents, or face images.
- Monetization: subscription only for v0-v1. No transaction-based compensation, success fees, or referral fees tied to deals.
- Design system: CSS tokens in `:root` are the source of truth. Tailwind is an implementation detail and future React Native must map to the same tokens.
- Admins: authorization comes from `public.admin_users`; do not hardcode admin emails into RLS policies.

## Locked Vendor Stack

- Identity verification: Stripe Identity
- Funds verification: Plaid Assets
- Background checks: Checkr hosted flow, attorney/FCRA review required
- Phone verification: Twilio Verify
- Subscriptions: Stripe Billing
- Analytics: PostHog
- Push notifications: Expo Push, deferred to v1.5

## Product Thesis

Banks, large employers, and traditional capital markets leave a lot of capable people stuck. Werkles helps undervalued builders, operators, backers, connectors, and sparks find each other laterally:

- A plumber with field skill can meet someone with startup capital and sales ability.
- A warehouse floor lead can meet someone who needs operations talent and wants to offer equity.
- A small investor can meet real operators instead of passively chasing paper deals.
- A dispatcher, bookkeeper, closer, or crew lead can turn invisible company-building skill into ownership opportunity.

The MVP should be an introductions and trust platform, not a money-transfer or securities platform.

## Current UX Direction

The desired tone is energetic, credible, and human. Avoid:

- sterile procurement dashboard energy
- beige corporate sameness
- generic fintech hero copy
- overexplaining how the UI works inside the UI
- anything that makes users feel like they are filling out government paperwork

Prefer:

- match/deck mechanics
- strong but practical copy
- clear trust signals
- proof without snobbery
- fast profile tuning
- visible reasons behind match scores
- a little swagger, but not parody

## Profile Lanes

1. Builder
   - Floor leads, techs, dispatchers, closers, crew bosses, back-office operators, customer-facing workers.
   - They may bring skill, trust, customer relationships, process knowledge, or management capability instead of cash.

2. Operator
   - Licensed tradespeople, mechanics, service pros, estimators, and owner-operators.
   - They bring craft, licenses, equipment, field credibility, and technical judgment.

3. Backer
   - Small investors, sales operators, admin partners, bookkeepers, marketers, or people with cash and company-building skill.
   - They bring capital, systems, sales, hiring, admin, or finance.

4. Connector
   - Sales, admin, books, hiring, relationships, venues, customer access, and operational glue.

5. Spark
   - A lead, idea, property, customer opening, or strange chance that needs people and pressure.

## Current Matching Inputs

- Role / lane
- Industry / arena
- City and state
- Radius
- Money available
- Money needed
- Skills
- Goals
- Verification checks
- Skills offered and sought
- Industry tags
- Timeline to launch
- Primary goal

## Current Matching Heuristics

The prototype scores matches based on:

- complementary roles
- same industry
- same state
- user skills covering candidate needs
- candidate skills complementing user gaps
- shared goals
- money fit
- proof signal strength

This is intentionally explainable. Do not replace it with opaque AI matching yet. Improve the logic only if the explanation remains legible to users.

Production matching is scaffolded as `public.match_candidates_for_blueprint(p_blueprint_id, p_scout_user_id)`. It returns target IDs, scores, and explainable JSONB factors. It uses the Gemini-refined lane matrix, location gate, verified capital overlap, skills, industry tags, timeline, goal alignment, and endgame penalty. It never returns raw financial ranges.

## Compliance Frame

Werkles should stay framed as:

- partner discovery
- introductions
- trust and verification
- profile matching
- readiness and fit assessment

Werkles should not yet be framed as:

- a securities marketplace
- a crowdfunding portal
- a lending platform
- a broker-dealer
- a money movement platform
- a business-sale facilitator
- legal, tax, or investment advice

All deals happen off-platform. Werkles does not solicit, recommend, structure, or facilitate any securities transaction, loan, investment, or sale of business. Any real investment, lending, equity, revenue-share, acquisition, background-check, or verification-retention workflow needs legal review before production.

Required disclaimer for footer, Terms, and match cards:

> Werkles is a partner discovery and verification platform. We do not facilitate any securities transaction, loan, investment, or sale of business. Werkles never holds or transmits funds.

Phone collection requires explicit consent before phone verification or two-factor authentication. Execute DPAs with Stripe, Plaid, Twilio, PostHog, and Checkr before beta users.

## Proposed AI Team Roles

### Codex

Role: build captain and repo owner.

Responsibilities:

- keep one coherent implementation path
- edit the repo
- run checks
- deploy through GitHub/Vercel
- turn reviewed recommendations into code
- maintain product scope discipline

### Gemini Pro

Role: product and UX strategist.

Ask Gemini for:

- better onboarding questions
- user personas
- stronger first-run experience
- clearer trust and verification language
- copy improvements
- interaction flow critique
- ways to make the site feel engaging without becoming unserious

Do not ask Gemini to own final implementation.

### DeepSeek

Role: engineering and risk critic.

Ask DeepSeek for:

- code review
- matching algorithm critique
- data model proposal
- Supabase schema review
- auth/security review
- privacy risks
- edge cases
- tests to add before production

Ask it to be blunt and specific. It should return file-level recommendations or schema changes, not broad inspiration.

### Perplexity Max

Role: research scout.

Ask Perplexity for:

- competitor landscape
- current regulatory/compliance risks
- vendor research for identity, license, work-history, funds, and background verification
- pricing and integration notes
- market-entry research by trade and geography
- sources and citations

Ask it to distinguish facts, assumptions, and legal questions for an attorney.

## Standard Return Format For Other AIs

Ask every external model to respond in this structure:

```text
1. Best current read
2. What is working
3. What is weak or risky
4. Highest-leverage changes now
5. Later / not yet
6. Specific edits, schema, copy, or research findings
7. Questions for Ben
```

## What Not To Do

- Do not add payment flows yet.
- Do not add transaction-based compensation, success fees, or deal-tied referral fees.
- Do not ask for GoDaddy, Vercel, GitHub, bank, or identity credentials in chat.
- Do not invent fake legal certainty.
- Do not add a complex backend before the product flow is strong.
- Do not let every AI produce a separate vision; bring their output back to Codex for integration.

## Immediate Next Build Milestones

1. Polish the live static match-deck experience.
2. Convert to Next.js while preserving Vercel deployment.
3. Add Supabase schema, Auth, and RLS.
4. Replace mock profiles with database profiles.
5. Add explainable matching from stored profile data.
6. Add intro request storage and admin review.
7. Add verification receipt/status fields without raw sensitive document storage.
8. Validate the product with a narrow first market, such as one metro and one or two trades.

## Camelot Admin Bootstrap

Initial admin emails:

- `shaunmroberts1230@gmail.com`
- `ben.leak@kindsir.com`

After those users create Supabase Auth accounts and profiles, run `supabase/admin_bootstrap.sql`. It inserts their UUIDs into `public.admin_users`; RLS policies read from that table.

## Copywriting Overrides

- Pending action: "Checking the Blueprint"
- Accept action: "Lock the Joints"
- Decline action: "No fit. Keep building."
- Keep quirky terms such as Dynamo, Werkle, and Traflium as UI flair or 404 jokes only. Do not use them as database enums.

## Sharing Instructions

Give external AIs:

1. This `AI_HANDOFF.md` file.
2. The live URL: `https://werkles.com`
3. The GitHub repo link, if they can browse code.
4. The specific role prompt from `AI_TEAM_PROMPTS.md`.

If they cannot access GitHub, paste `index.html`, `styles.css`, and `app.js` after this handoff.
