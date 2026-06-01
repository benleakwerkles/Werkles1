# Foreman Control Panel (GimpDash)

A small, read-only local console that renders the **Human Gates Console** — clickable cards for APP_INFRA preview routes, repo/PRs, and provider dashboards.

## Run

On the build/relay machine (Sally/Betsy), from the repo root:

```bash
node scripts/foreman/foreman-control-server.mjs
```

Then open: **http://127.0.0.1:4317**

(Port override: `FOREMAN_CONTROL_PORT=4500 node scripts/foreman/foreman-control-server.mjs`.)

## What it shows

Sections: **APP_INFRA Review**, **Repo / PRs**, **Deploy / Hosting**, **Ghost Forge / Render**, **Supabase**, **Stripe**, **Aeye / Crew**.

Each card shows: name, URL or local path, purpose, gate type, status, and an **Open** button when the link is safe to open.

Gate types (color-coded):

- **SAFE LINK** — open / read only.
- **HUMAN GATE** — opening the dashboard is fine, but changing settings / taking the action is a Ben-only gate.
- **BLOCKED** — do not perform from this console.

Links that are not project-exact are tagged **GENERIC LINK**.

## Safety (by construction)

- Read-only. The page is static HTML built from a data model in `scripts/foreman/foreman-control-server.mjs`.
- No secrets are read, printed, or stored. No link carries a token.
- No provider API calls. No deploy, push, SQL, or shell exec.
- Clicking a link only opens a dashboard/route in the browser; it never performs the gated action.
- Local folder paths (Outbox/Inbox) are shown as text — no local-open side effects.

## Notes

- APP_INFRA preview routes require the app dev server (`npm run dev`) running on the same machine.
- `/bellows` route and `foreman/reviews/APP_INFRA_01_FUNCTIONAL_SURFACE_REVIEW.md` are referenced but not yet present; the console labels their status honestly.
- To change the links, edit the `sections` data model in `scripts/foreman/foreman-control-server.mjs`.
