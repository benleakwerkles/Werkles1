# Future Embedded Aeye Shell — Research Item (Not Active)

Status: **RESEARCH / NO-GO for now**  
Active path: **separate Edge Dispatch Bay** + **Relay Courier** + **Foreman dashboard controls**

See `EDGE_EMBED_DOCTRINE.md` — **do not iframe** vendor AI sites in the Foreman dashboard.

---

## Why iframe is rejected

External AI products (ChatGPT, Gemini, Claude, DeepSeek, Perplexity) typically send:

- `X-Frame-Options: DENY` or `SAMEORIGIN`
- CSP `frame-ancestors 'none'` or allowlists that exclude `localhost`

Embedding them in `<iframe>` inside Foreman will fail intermittently or permanently. **Not a viable operator surface.**

---

## What “embedded shell” would mean instead

A **dedicated local browser surface** controlled by Foreman — not an iframe of `chatgpt.com`:

| Approach | Notes |
|----------|--------|
| **WebView2** (Windows) | Host a native Edge WebView2 control in a small local app; same profile dir as dispatch bay; still loads vendor URLs in real browser context |
| **Electron** | Similar; heavier; profile + automation via Playwright/CDP |
| **Playwright-attached panel** | Foreman triggers Playwright against Edge profile; UI stays Foreman, rendering stays Edge |

None of these replace the **human Send gate** or dispatch class policy without explicit new gates.

---

## Prerequisites before any build

1. Human gate: **EMBEDDED_AEYE_SHELL_RESEARCH_APPROVED**
2. Security review: secrets, session cookies, profile isolation
3. Confirm vendor ToS / automation limits (separate from Werkles repo policy)
4. Prove tab focus + paste + verification without Send automation
5. Fallback: **open-aeye-crew.cmd** must remain working

---

## Non-goals (until gated)

- iframe of vendor chat UIs inside `:4317`
- Auto-Send without CLASS A + logging + human doctrine update
- Merging Robot Zone profile with Ben’s personal Edge profile
- Replacing Relay Courier lock / `RELAY_LOCK.json` semantics

---

## Current implementation (use this)

1. `foreman-control.cmd` → Foreman at `:4317`
2. `open-aeye-crew.cmd` → Edge Dispatch Bay
3. `scripts/foreman/relay-courier.mjs` → verify / deliver / tab focus
4. Dashboard buttons → courier actions (no embedded chat DOM)

---

## Open questions for future spike

- Can WebView2 share `foreman/.edge-aeye-crew-profile` safely with standalone Edge?
- CDP tab index vs Ctrl+N — same verification as `crew-edge-courier.ps1`?
- Operator UX: one window vs Foreman + Edge (current) vs WebView2 docked beside Foreman
- Telemetry: tab URL verification without scraping chat content

**Do not implement this file’s options without an explicit human gate.**
