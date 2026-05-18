# Werkles Prototype

Werkles is a static web app prototype for matching builders, operators, backers, connectors, and sparks who want to start, buy, or scale local businesses together.

Open `index.html` in a browser to run it. No install step is required. The current site is deployed on Vercel and can run as static HTML, CSS, and JavaScript.

Current prototype:

- Builder, operator, backer, connector, and spark profile lanes
- Matching by role fit, trade arena, geography, capital fit, skills, goals, and verification
- Profile controls for capital available, capital needed, skills, and outcomes
- Match deck with score explanations
- Intro queue
- Verification checklist and `proof.html` trust page: Werkles verifies members; members do not inspect each other's raw documents
- Canvas-based market map
- Local browser storage for profile, intro queue, and beta signup capture
- Founder brief copy action for sharing a profile summary

This prototype is intentionally an introductions product. Real investment, lending, securities, ownership, KYC, and AML flows should be designed with legal and financial professionals before any production launch.

Next production step: migrate profile, intro, and beta signup data from local browser storage to Supabase.

SEO quarantine:

- Production currently sends `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex`.
- `index.html` includes matching robots meta tags.
- Remove those directives only when the brand, copy, and product positioning are ready for search indexing.

AI collaboration packet:

- `AI_HANDOFF.md` explains the product, codebase, current scope, risks, and next milestones.
- `AI_TEAM_PROMPTS.md` contains copy/paste prompts for Gemini Pro, DeepSeek, Perplexity Max, and Codex integration.
