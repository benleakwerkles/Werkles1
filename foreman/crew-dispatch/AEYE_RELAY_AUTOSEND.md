# AEYE Relay AUTO_SEND

CLASS A (`AUTO_SEND`) is **narrow**. Most packets are CLASS B.

## Current doctrine

Even when AUTO_SEND guards pass, **Ben still clicks Send in Edge** unless Comptroller explicitly opens automated Send (not enabled in v0.1).

Relay Courier:

1. Verifies packet against `dispatch-policy.json`
2. Loads paste into correct Edge tab (PowerShell fallback; Playwright when installed)
3. Logs to `SEND_LOG.md` and `RELAY_COURIER_LOG.md`
4. Never push/deploy/SQL/secrets

## ROLE_AWARENESS_SYNC

First approved locked template. Issued via dashboard **Run Network Sync Relay** or:

```powershell
node foreman/crew-dispatch/crew-relay-network-command.mjs issue
```

If context health marks cousin `STALE` or `resetRecommended: true`, AUTO_SEND normal packets blocked — generate BOOT packet first.

See `CONTEXT_HEALTH_PROTOCOL.md`.
