# Relay Courier

**Deterministic local browser courier — not an AI cousin.**

Controls the **separate Edge Dispatch Bay** from Foreman — does **not** embed vendor AI UIs in the dashboard (`EDGE_EMBED_DOCTRINE.md`).

## Purpose

Relay Courier reads packet metadata, verifies freshness and dispatch class, runs secret/blocked-content checks (structural first), **verifies destination cousin/tab mapping** (config + network manifest), loads packet into the correct Edge tab, and **stops before Send** for CLASS B packets.

## Scripts

| Path | Role |
|------|------|
| `scripts/foreman/relay-courier.mjs` | Node entry |
| `scripts/foreman/relay-courier.ps1` | PowerShell launcher |
| `scripts/foreman/relay-courier-lib.mjs` | Policy, lock, verification |
| `foreman/crew-dispatch/relay-courier.config.json` | Config |
| `foreman/crew-dispatch/dispatch-policy.json` | CLASS A/B/C |
| `foreman/crew-dispatch/RELAY_LOCK.json` | Robot Zone lock |

## Install Playwright

See `RELAY_COURIER_INSTALL.md` — `npm run relay:install` · `npm run relay:self-test`

## Engine

1. **Playwright** — preferred when `playwright` package installed (paste automation scaffold)
2. **PowerShell** — fallback via `crew-edge-courier.ps1` (tab focus + Ctrl+V)

Never automates: Send, Submit, Post, deploy, push, SQL.

## CLI

```powershell
node scripts/foreman/relay-courier.mjs status
node scripts/foreman/relay-courier.mjs verify-tabs
node scripts/foreman/relay-courier.mjs verify --cousin PETRA --kind network
node scripts/foreman/relay-courier.mjs deliver --cousin PETRA --kind network --ensure-edge
```

Tab verification checks:

- Cousin exists in `crew-tabs.config.json`
- Unique `tabIndex` per tab
- `LATEST_NETWORK_COMMAND.json` `edgeTabIndex` matches config (when manifest present)
- PowerShell courier runs `Test-CousinTabMapping` before focus/paste

## Dashboard

Foreman Control Panel (`:4317`):

- **Edge Dispatch Bay** card — tab order, relay step status, mapping errors
- **COURIER RUNNING — DO NOT CLICK EDGE** when lock status is `RUNNING`
- Buttons: Open Aeye Crew Bay · Verify Tab Mapping · Focus tab (courier `--tab-only`) · Run Network Sync Relay

No iframe of ChatGPT/Gemini/Claude/DeepSeek/Perplexity in Foreman.

Load failure → **MANUAL LOAD REQUIRED** (not AWAITING SEND).

## Logs

- `RELAY_COURIER_LOG.md` — every load/failure
- `SEND_LOG.md` — AUTO_SEND-eligible events

See `DISPATCH_CLASSIFICATION.md` and `AEYE_RELAY_AUTOSEND.md`, `EDGE_EMBED_DOCTRINE.md`.
