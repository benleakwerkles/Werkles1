# Foreman Control Panel

**Primary local entrypoint** for Ben on Sally. Operator UX reset — Relay Courier + Robot Zone lock.

## Open the panel

Double-click `foreman-control.cmd` or Desktop **`Werkles - Foreman Dashboard.cmd`**

Browser opens automatically: **http://localhost:4317**

## START HERE flow

1. **Open Aeye Crew Bay** (Robot Zone Edge window)
2. **Run Network Sync Relay**
3. Click **Send** in Edge per tab
4. **I Sent — Next Cousin** on dashboard

When courier runs: **COURIER RUNNING — DO NOT CLICK EDGE**

## Doctrine

- **Separate Edge window** — Aeye chats live in Edge Dispatch Bay, **not** iframe in Foreman (`EDGE_EMBED_DOCTRINE.md`)
- **Stops before Send** — CLASS B default; CLASS A only for locked templates
- **No deploy, push, SQL, secrets, Ghost Forge, Education Forge, auto-merge**
- Blocked actions → **HUMAN GATE REQUIRED**
- Localhost only (`127.0.0.1:4317`)

## Components

| Component | Path |
|-----------|------|
| Launcher | `foreman-control.cmd` |
| Server | `scripts/foreman/foreman-control-server.mjs` |
| Relay Courier | `scripts/foreman/relay-courier.mjs` |
| Dispatch policy | `foreman/crew-dispatch/dispatch-policy.json` |
| Context health | `foreman/crew-dispatch/context-health.json` |
| Robot Zone lock | `foreman/crew-dispatch/RELAY_LOCK.json` |
| Edge bay | `open-aeye-crew.cmd` |
| Embed doctrine | `foreman/crew-dispatch/EDGE_EMBED_DOCTRINE.md` |
| Future shell research | `foreman/crew-dispatch/FUTURE_EMBEDDED_AEYE_SHELL.md` |

## Required dashboard buttons

Refresh Crew Dispatch · Generate * Packet · Copy paste blocks · Open Outbox/Inbox/Reviews · Show gate/agent/budget · Blocked human gates

## Finance Command v0.1

Dashboard card — local scaffold only. Never moves money. See `foreman/finance/FINANCE_COMMAND_README.md`.

## Imagery doctrine (wired)

Dashboard **Imagery Doctrine** card — doctrine file, Ender wire packet, fresh packet generator.

| File | Role |
|------|------|
| `foreman/IMAGERY_DIRECTION.md` | Canonical imagery doctrine |
| `foreman/ghost-forge/IMAGERY_PROMPT_TEMPLATE.md` | Ghost Forge people prompts (**Gate 05 PAUSE**) |
| `foreman/handoffs/outbox/TO_ENDER_IMAGERY_DIRECTION_WIRE_v0.1.md` | Ender placement/motion review |
| `foreman/templates/TO_ENDER_IMAGERY_PACKET_TEMPLATE.md` | Fresh Ender packet template |

**Recorded:** viable with restrained grammar — cards, props, formation, subtle motion; **not** morphing. **No assets from dashboard.** APP_INFRA-01 stays active product gate.

## Fallback

`crew-dispatch.bat` — emergency only.

## Troubleshooting — panel not loading

1. **Try direct URL:** http://127.0.0.1:4317 (Foreman — **not** localhost:3000)
2. **Double-click `foreman-control.cmd` again** — if a healthy server is already up, it opens the browser and exits (no hang on restart)
3. **localhost:3000** is the **Werkles app** (`npm run dev`) — a different server, not Foreman
3. **Check port:** `netstat -ano | findstr ":4317"` — should show `LISTENING`
4. **If cmd shows `HUMAN GATE REQUIRED` + unknown PID:** close that PID in Task Manager, then retry
5. **Hard reset:** Task Manager → end any `node.exe` running `foreman-control-server.mjs` → delete `foreman/control-panel/foreman-control.pid` if present → run `foreman-control.cmd`
