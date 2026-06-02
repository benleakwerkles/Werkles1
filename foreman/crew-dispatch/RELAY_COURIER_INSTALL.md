# Relay Courier — Playwright Install

Install local browser automation for Relay Courier. **Does not Send, paste into AI tabs, or deploy anything.**

## Quick install

From repo root:

```powershell
npm run relay:install
```

Or:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\install-relay-courier.ps1
```

## What gets installed

| Item | Scope |
|------|--------|
| `playwright` npm package | devDependency in this repo only |
| Chromium browser | Playwright-managed binary via `npx playwright install chromium` |

No global npm tools unless local install fails and Ben approves otherwise.

## Self-test (no Send)

```powershell
npm run relay:self-test
```

Or:

```powershell
node scripts/foreman/relay-courier.mjs self-test
```

Self-test rules:

- May launch Chromium or Edge channel for smoke test
- May verify tab config / destination resolution
- Must **not** paste into ChatGPT/Gemini/Claude/DeepSeek/Perplexity tabs
- Must **not** click Send
- Must **not** send external messages

## Fallback

If Playwright is unavailable, Relay Courier falls back to `foreman/crew-dispatch/crew-edge-courier.ps1` (PowerShell focus + Ctrl+V, still **STOP BEFORE SEND**).

See `RELAY_COURIER.md`.
