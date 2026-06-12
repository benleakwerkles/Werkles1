# Werkles local dev — one safe launch path

Goal: run Werkles at **http://localhost:3000** without manual terminal mule work.

## The one path (Windows: Doss / Betsy / Sally)

1. Make sure prerequisites are installed (one time):
   - **Git** — https://git-scm.com/download/win
   - **Node 18+ (LTS)** — https://nodejs.org
2. Clone the repo (one time), e.g. into `Desktop\github\Werkles`:
   ```
   git clone https://github.com/benleakwerkles/Werkles1.git Werkles
   ```
3. **Double-click** `scripts\dev\start-werkles.cmd`
   (or run it from a terminal: `scripts\dev\start-werkles.cmd`).

That's it. The launcher:
- verifies Node is present,
- runs `npm.cmd install` automatically on first run (and only when `node_modules` is missing),
- starts `npm.cmd run dev`,
- opens `http://localhost:3000` in your default browser.

Keep the window open while developing. Press **Ctrl + C** to stop.

> Uses `npm.cmd` so it works even if PowerShell blocks `npm.ps1` (execution policy). Running the `.cmd` from Explorer or `cmd` avoids that issue entirely.

## Optional: enable auth / Stripe locally

The app **runs without any env file** (the homepage and core pages serve fine). To exercise Supabase auth / Stripe flows locally, copy the example and fill values **privately** (never commit real secrets):

```
copy .env.example .env.local
```

Then edit `.env.local` with your own values. Variable names are listed in `.env.example`:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_MONTHLY_PRICE_ID`, `STRIPE_YEARLY_PRICE_ID`.

`.env.local` is gitignored. Do not paste secret values into chat.

## Verified

This launch path was verified on `main` in a clean environment: `npm install` → `npm run dev` → `http://localhost:3000` returns 200 (homepage, `/pricing`, `/proof`, `/login`, `/membership`) with no env configured.
