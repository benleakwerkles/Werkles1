# Edge Dispatch Bay — Werkles Aeye Crew (Robot Zone)

Status: **Robot Zone** — Ben does not browse here for normal use  
Primary: **http://localhost:4317** → **Open Aeye Crew Bay**  
Launcher: `open-aeye-crew.cmd` (emergency fallback)

**Architecture:** separate Edge window — **not** iframe inside Foreman. See `EDGE_EMBED_DOCTRINE.md` and `FUTURE_EMBEDDED_AEYE_SHELL.md`.

---

## Robot Zone safety

When **Relay Courier** runs, Foreman shows:

**COURIER RUNNING — DO NOT CLICK EDGE**

Lock file: `foreman/crew-dispatch/RELAY_LOCK.json`  
Courier: `scripts/foreman/relay-courier.mjs` · See `RELAY_COURIER.md`

Duplicate courier runs are blocked while status is `RUNNING`.

---

## What this is

The **clean Edge window** for the Aeye crew. One launch opens Microsoft Edge with a **dedicated local profile** and **fixed tab order**.

Profile: `foreman/.edge-aeye-crew-profile` (gitignored)

**Do not use this Edge profile for normal browsing.**

---

## Tab order

| # | Seat | URL |
|---|------|-----|
| 1 | Petra / ChatGPT | https://chatgpt.com/ |
| 2 | Skybro / Gemini | https://gemini.google.com/ |
| 3 | Ender / Claude | https://claude.ai/ |
| 4 | Bean / DeepSeek | https://chat.deepseek.com/ |
| 5 | Computer / Perplexity | https://www.perplexity.ai/ |
| 6 | Foreman Control Panel | http://localhost:4317 |
| 7 | GitHub | https://github.com/benleakwerkles/Werkles1 |
| 8 | Render | https://dashboard.render.com/ |
| 9 | Supabase | https://supabase.com/dashboard |
| 10 | Werkles | https://werkles.com/ |

Config: `foreman/crew-dispatch/crew-tabs.config.json`

---

## Operator loop

1. Foreman → **Open Aeye Crew Bay**
2. **Run Network Sync Relay**
3. **Send** in Edge (human gate)
4. **I Sent — Next Cousin**

Load failure → **MANUAL LOAD REQUIRED**

---

## Does not

- Auto-Send by default
- Deploy, push, SQL, secrets, Ghost Forge, Education Forge

See `RELAY_COURIER.md`, `DISPATCH_CLASSIFICATION.md`, `AEYE_CREW_RELAY.md`, `EDGE_EMBED_DOCTRINE.md`.
