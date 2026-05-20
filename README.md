# Werkles Prototype

Werkles is a static web app prototype for matching builders, operators, backers, connectors, and sparks who want to start, buy, or scale local businesses together.

Open `index.html` in a browser to run it. No install step is required. The current site is deployed on Vercel and can run as static HTML, CSS, and JavaScript.

Current prototype:

- Builder, operator, backer, connector, and spark profile lanes
- Matching by role fit, trade arena, geography, money fit, skills, goals, and proof signals
- Profile controls for money available, money needed, skills, and outcomes
- Match deck with score explanations
- Intro queue
- Required account gate: driver's license front/back, face capture, and linked phone number before member activation
- Proof checklist and `proof.html` trust page: Werkles verifies members; members do not inspect each other's raw documents
- Canvas-based market map
- Local browser storage for profile, intro queue, and beta signup capture
- Founder brief copy action for sharing a profile summary

This prototype is intentionally an introductions and verification-status product. Werkles is not a money-movement, lending, securities, broker-dealer, business-sale, or deal-facilitation platform.

Architecture direction:

- Web-first, mobile-first responsive Next.js app on Vercel.
- Supabase Postgres and Supabase Auth for the first functional backend.
- Email plus phone for two-factor authentication.
- Row-Level Security on every user-data table.
- Zero raw sensitive document storage in v0-v1; store verification receipts only.
- Subscription-only monetization for v0-v1. No transaction-based compensation, success fees, or deal-tied referral fees.

Next production step: convert the static prototype into a Next.js/Supabase vertical slice with database-backed profiles, explainable matching, intro requests, and admin review.

Architecture docs:

- `docs/architecture.md`
- `docs/adr/ADR-001-web-first-mobile-first.md`
- `supabase/migrations/202605200001_initial_werkles_schema.sql`

SEO quarantine:

- Production currently sends `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex`.
- `index.html` includes matching robots meta tags.
- Remove those directives only when the brand, copy, and product positioning are ready for search indexing.

AI collaboration packet:

- `AI_HANDOFF.md` explains the product, codebase, current scope, risks, and next milestones.
- `AI_TEAM_PROMPTS.md` contains copy/paste prompts for Gemini Pro, DeepSeek, Perplexity Max, and Codex integration.
