# ADR-001: Web-First, Mobile-First Werkles

Status: Accepted
Date: 2026-05-20

## Context

Werkles needs to move from a static prototype to a functional product without splitting early engineering effort across web, iOS, Android, and backend surfaces. The product will still be used heavily on phones, especially for onboarding, profile review, match browsing, and future verification handoff.

## Decision

Build Werkles as a web-first, mobile-first responsive application using Next.js on Vercel. Defer native iOS and Android apps until product metrics justify the extra surface area. A PWA can be considered during beta if it improves user testing without creating a second product.

## Architecture Direction

- Frontend: Next.js on Vercel.
- Backend: Supabase Postgres plus Supabase Auth.
- Authentication: email plus phone for two-factor authentication.
- Data protection: Row-Level Security on every user-data table.
- Sensitive data: zero raw sensitive document storage in Werkles v0-v1.
- Verification: store boolean/status receipts from third-party verification APIs, not raw SSNs, bank account numbers, full ID documents, or face images.
- Design system: `:root` CSS tokens are the source of truth. Tailwind, if added later, is an implementation detail and must consume the same token values.

## Native App Gate

Native mobile work is deferred until the product proves need through metrics such as:

- repeated mobile usage after profile creation
- intro-request conversion on mobile
- verification-flow completion rate
- push-notification need that cannot be solved acceptably on web
- user research showing App Store presence is required for trust or retention

## Consequences

- The first functional product can ship faster.
- The same Vercel deployment path stays intact.
- The matching, proof, and intro-request loops can be tested before native investment.
- Future React Native work must reuse design tokens and backend contracts rather than inventing a parallel app model.
