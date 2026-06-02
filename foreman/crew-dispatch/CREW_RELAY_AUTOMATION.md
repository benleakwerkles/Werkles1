# AEYE Crew Relay Automation (for review)

Status: **v0.1 implemented** — dashboard orchestrator + Edge courier  
Doctrine: **automate mechanics; gate authority only**

---

## Problem

If Ben is copying and pasting at non-gates, the cockpit is misconfigured. Clipboard loops are **fallback**, not the primary operator path.

---

## Design principle

| Layer | Who runs it | Ben's job |
|-------|-------------|-----------|
| **Mechanical** | Foreman relay runner | Nothing |
| **Authority** | Ben on provider UI | **Send** per tab |
| **Intake** | Ben or drop zone | Save `FROM_*` replies (until response capture exists) |
| **Promotion** | Ben + intake validate | **Process** inbox — never auto-merge |

---

## Automated path (happy path)

One button on Foreman dashboard (http://localhost:4317):

**Run Network Sync Relay**

```text
1. Issue ROLE_AWARENESS_SYNC if missing or cockpit hash stale
2. Open Aeye Edge bay if not running
3. FOR each cousin tab 1-5:
     a. Courier: focus tab + paste (Ctrl+V)     [automated]
     b. Dashboard: AWAITING_SEND               [human gate]
     c. Ben clicks Send in Edge                 [human gate]
     d. Ben clicks "I Sent - Next Cousin"       [human gate acknowledgment only]
4. COMPLETE: prompt inbox save + Validate Inbox
```

Ben never touches clipboard for relay delivery in the happy path.

---

## Human gates (only these)

1. **Send** — message leaves Sally to external AI provider
2. **Save cousin reply** — `FROM_{COUSIN}_*.md` to inbox (drop zone or file save)
3. **Process responses** — moves validated files to `processed/` (still no repo merge)
4. **Merge / deploy / push / SQL** — separate gates, never part of relay runner

"I Sent - Next Cousin" is **not** sending the message — it tells the runner Ben already clicked Send so the next tab can be prepared.

---

## Components

| Component | Role |
|-----------|------|
| `crew-relay-network-command.mjs` | Issue packets + paste blocks + manifest |
| `crew-edge-courier.ps1` | Focus Edge dispatch bay tab + paste |
| `crew-edge-courier.mjs` | Node wrapper for courier |
| `crew-relay-runner.mjs` | Session state machine + orchestration |
| `foreman-control-server.mjs` | `/api/relay/*` + operator UI |
| `.relay-session.json` | Local session (gitignored) |

---

## API (localhost only, token required)

| Method | Path | Action |
|--------|------|--------|
| GET | `/api/relay/status` | Current session + manifest freshness |
| POST | `/api/relay/start` | `{ "reissue": false }` — begin relay |
| POST | `/api/relay/sent` | Confirm Send on current tab; deliver next |
| POST | `/api/relay/cancel` | Cancel active session |
| POST | `/api/relay/reset` | Clear session to idle |

CLI mirror:

```powershell
node foreman/crew-dispatch/crew-relay-runner.mjs start
node foreman/crew-dispatch/crew-relay-runner.mjs sent
node foreman/crew-dispatch/crew-relay-runner.mjs status
```

---

## What is NOT automated (by design)

- Clicking **Send** on ChatGPT / Gemini / Claude / DeepSeek / Perplexity
- Scraping cousin replies from provider UI into inbox
- Auto-merge into `NEXT_ACTION.md` or app code
- Deploy, push, SQL, secrets, Ghost Forge, Education Forge

Future: Power Automate or browser extension for **response capture** with Ben review gate before inbox write.

---

## Edge courier hard stops

From `crew-tabs.config.json`:

```json
"courier": {
  "automates": ["tab focus", "clipboard", "ctrl+v"],
  "neverAutomates": ["send", "submit", "post"]
}
```

---

## Operator UI (Foreman dashboard)

Primary:

- **Run Network Sync Relay**
- **I Sent - Next Cousin** (enabled only while `awaiting_send`)
- **Cancel Relay**

Secondary (collapsed "Advanced / fallback"):

- Manual validate, fixtures, hash self-test
- Clipboard paste buttons (emergency only)

---

## Failure modes

| Condition | Runner behavior |
|-----------|-----------------|
| Edge bay not open | First deliver opens bay (`-EnsureEdge`) |
| Edge focus fails | Partial deliver: paste on clipboard; message tells Ben to click chat input |
| Deliver error | State `error`; cancel and retry |
| Stale manifest | Auto reissue on start unless `reissue: false` and fresh |

---

## Review checklist for Ben

- [ ] Happy path requires zero clipboard copies for delivery
- [ ] Send remains manual on every provider tab
- [ ] "I Sent" only advances runner, never sends messages
- [ ] Inbox save still manual (acceptable for v0.1?)
- [ ] Auto reissue on stale hash is acceptable
- [ ] Advanced/clipboard buttons hidden enough not to be the default path

---

## Related docs

- `RELAY_NETWORK.md` — network map and architecture
- `CREW_RELAY_README.md` — hash, intake, outbox lifecycle
- `POWER_AUTOMATE_CREW_COURIER_SPEC.md` — courier implementation notes
