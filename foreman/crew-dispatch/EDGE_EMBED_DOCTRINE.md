# Edge Embed Doctrine — No iframe AI Chats

Status: **ACTIVE** — Foreman Control Panel architecture  
Primary operator UI: **http://localhost:4317**  
Robot Zone: **separate Edge Dispatch Bay window**

---

## Decision

**Do not iframe ChatGPT, Gemini, Claude, DeepSeek, or Perplexity inside the Foreman dashboard.**

Major external AI sites block embedding via `X-Frame-Options` and CSP `frame-ancestors`. Embedded AI chat tabs are **unreliable / no-go** for production operator UX.

Build toward **dashboard-controlled Edge**, not **Edge-inside-dashboard**.

---

## Correct architecture

| Layer | Role |
|-------|------|
| **Foreman Control Panel** | Operator UI at `localhost:4317` — status, gates, relay buttons, tab mapping |
| **Edge Dispatch Bay** | Dedicated Edge window + profile (`foreman/.edge-aeye-crew-profile`) with fixed Aeye tabs |
| **Relay Courier** | Local automation — open/focus tabs, load packets, **Class A** policy only for auto-send eligibility, **Class B** stop before Send, **Class C** blocked |

**Ben interacts primarily with Foreman.** Edge is **Robot Zone**, not normal browsing.

---

## What Foreman shows (not embeds)

- Aeye tab order and mapping from `crew-tabs.config.json`
- Relay session step status (pending / pasted / sent)
- Courier lock (`RELAY_LOCK.json`) and context health
- Buttons that **trigger Relay Courier** (`deliver`, `verify`, tab focus) — they control Edge externally

Foreman may show **localhost:4317** in the Edge bay as tab 6 — that is the control panel in Edge for convenience, not an iframe of external AI.

---

## Dispatch classes (courier behavior)

See `DISPATCH_CLASSIFICATION.md`:

- **CLASS A** — AUTO_SEND eligible (locked templates only); Send still manual per doctrine
- **CLASS B** — AUTO_LOAD_HUMAN_SEND (default); paste then **stop before Send**
- **CLASS C** — BLOCKED

---

## Future embedded shell (research only)

If a future in-dashboard shell is ever desired, treat it as a **separate research track** — not iframe of vendor sites:

→ `foreman/crew-dispatch/FUTURE_EMBEDDED_AEYE_SHELL.md` (WebView2 / Electron / dedicated browser surface)

Until that gate opens: **keep Edge Dispatch Bay separate.**

---

## Related docs

- `EDGE_DISPATCH_BAY.md` — tab order, profile, launch
- `RELAY_COURIER.md` — verify, deliver, lock
- `BEN_DASHBOARD_QUICKSTART.md` — human operator loop
- `foreman/control-panel/README.md` — Foreman entrypoint
