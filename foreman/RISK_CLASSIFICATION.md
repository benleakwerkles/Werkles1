# Foreman Risk Classification

Foreman must classify every phase before a packet is prepared, applied, or pushed.

## LOW

Allowed scope:
- Foreman scaffolding and command scripts.
- Handoff packets, gate receipts, and source-of-truth docs under `docs/ai/`.
- Mock-only static copy artifacts such as `lib/copy.ts` during the approved dry run.

Rules:
- No backend behavior.
- No Supabase.
- No Stripe.
- No auth.
- No RLS.
- No real user data.
- No production behavior.

## MEDIUM

Allowed scope:
- Non-sensitive product UI.
- Static pages and presentation-layer components.
- Styling and visual assets that do not alter auth, payment, verification, API, or database behavior.

Rules:
- Requires Builder output, Bean audit, and Comptroller gate before apply.
- Requires explicit approved scope in `foreman/PHASE_STATUS.md`.

## HIGH

Scope that triggers HIGH:
- `app/api/`
- `pages/api/`
- `lib/supabase/`
- `lib/stripe/`
- `lib/auth/`
- `middleware.ts`
- Any file path containing `auth`, `stripe`, `payment`, or `verification`.

Rules:
- Requires the full Foreman loop.
- Requires clean working tree before push.
- Requires log protection checks.

## CRITICAL

Scope that triggers CRITICAL:
- `supabase/`
- `.env*`
- RLS policies.
- Database schema or migration files.
- Live verification, money movement, release controls, or secrets.

Rules:
- Requires the full Foreman loop.
- Requires database/RLS reset evidence when database or RLS files are touched.
- Requires attorney/accountant review when compliance language, verification, payments, securities, lending, or background checks are implicated.

## Enforcement

The scripts compute a minimum required risk from the approved scope. If `foreman/PHASE_STATUS.md` declares a lower risk than the scope requires, the packet or gate fails.
