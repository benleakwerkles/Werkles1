# Edge Workspace Setup (optional)

The **Aeye Crew Dispatch Bay** uses a dedicated Edge profile — not Edge Workspaces collections.

## One-time setup

1. Run Foreman → **Open Aeye Crew Bay** (or `open-aeye-crew.cmd`)
2. Log into each AI seat once in the **Robot Zone** profile only
3. Pin Render project and Supabase project after login
4. Do not sync this profile to personal Edge

## Profile path

`foreman/.edge-aeye-crew-profile`

Gitignored — local Sally only.

## Tab config

Edit URLs in `foreman/crew-dispatch/crew-tabs.config.json` if endpoints change.

## Courier

Relay Courier focuses tabs by index from config. If focus fails → **MANUAL LOAD REQUIRED**.

See `EDGE_DISPATCH_BAY.md` and `RELAY_COURIER.md`.
