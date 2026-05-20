# Supabase Notes

Apply migrations from `supabase/migrations` once a Supabase project exists.

Admin bootstrap:

- Initial Camelot admins are listed in `supabase/admin_bootstrap.sql`.
- Run that script only after the listed people have created Supabase Auth accounts and corresponding `public.profiles` rows.
- RLS policies must continue to rely on `public.admin_users`, not hardcoded admin emails.

Required Vercel environment variables for the beta signup API:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The service-role key must stay server-side only. Do not expose it in browser code.

Hourly intro request TTL:

- Run `select public.process_intro_request_ttl();` every hour with `pg_cron` or a Supabase Edge Function.
- Pending requests older than 48 hours become `Auto-Approved` only if the scout and co-signer are still blueprint members.
- If membership is broken, the request becomes `Expired`.

Capital verification decay:

- `Capital` badges automatically expire 90 days after `verified_timestamp`.
- Re-verifying means updating `verified_timestamp`; the trigger recalculates `expires_at`.

Matching:

- `public.match_candidates_for_blueprint(p_blueprint_id, p_scout_user_id)` implements the v0.2 Gemini-refined scoring rules.
- It returns target IDs, scores, and explainable factor strings.
- It does not return raw financial ranges.
