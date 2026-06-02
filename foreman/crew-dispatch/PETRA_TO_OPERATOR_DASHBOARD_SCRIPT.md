# Petra → Operator: How to explain the Foreman Dashboard

**Audience:** Petra (Comptroller) explains to **Ben (Operator)** in plain English.  
**Not for:** repo paths, schema fields, or AI-to-AI relay metadata unless Ben asks.

---

## Petra's opening (say this)

> Ben, the Foreman Dashboard is not the live website and not the AI chats themselves. It's a **local control panel on Sally** — like a flight deck on your own machine. The Edge Crew Bay is a **separate browser window** with five cousin tabs.  
>  
> **Packets on disk are not commands delivered.** They're drafts in a folder until the relay **pastes** them into a chat and **you click Send**. If the Edge chats look empty, the relay probably never ran — or paste didn't land in the chat box yet.

---

## The mental model (use metaphors)

| Cockpit term | Tell Ben |
|--------------|----------|
| Foreman Dashboard | "Your local cockpit at localhost:4317 — open it from the Desktop shortcut." |
| Aeye Crew Bay | "Your five-seat conference room in Edge — Petra, Skybro, Ender, Bean, Computer." |
| Outbox | "Outgoing mail sitting on your desk — not in anyone's inbox until you deliver it." |
| Relay / Run Network Sync | "The courier that walks each letter to the right seat and puts it on the notepad. **You** still hit Send." |
| I Sent - Next Cousin | "You telling the courier: I mailed this one, go to the next seat." |
| Drop Zone | "Where incoming replies get filed when you bring them back from Edge." |
| Validate / Process inbox | "Clerk checks the replies — still doesn't change the repo without you." |
| Human gate / STOP BEFORE SEND | "Only **you** click Send on ChatGPT/Gemini/Claude/etc. The machine never does." |

---

## Step-by-step for Ben (Petra walks him through)

1. **Start Foreman** — Desktop: `Werkles - Foreman Dashboard.cmd` — keep it open.  
2. **Open Crew Bay** — dashboard button **Open Aeye Crew Bay** (Edge with 5 tabs).  
3. **Scroll to** "AEYE Network Relay (automated)".  
4. **Click** `Run Network Sync Relay` — wait until dashboard says **AWAITING SEND** and **Tab 1 Petra**.  
5. **Switch to Edge tab 1** — text should appear in the ChatGPT input (`[AEYE RELAY — ROLE_AWARENESS_SYNC…]`).  
6. If empty: click in chat box, **Ctrl+V**, then **Send**.  
7. **Back to dashboard** — click **I Sent - Next Cousin**.  
8. Repeat Send + I Sent for tabs 2–5.  
9. When **COMPLETE**: save cousin replies to inbox (Drop Zone or files), then **Validate Inbox**.

**If Edge never shows text:** relay didn't run, Foreman isn't running, wrong Edge window, or paste focus failed — not "cousins ignoring orders."

---

## What Petra should NOT tell Ben to do first

- Do not send stale `TO_PETRA_*` check-in packets until routing verdict is the mission.  
- Do not use `crew-dispatch.bat` as the primary path for **network role awareness** — that's mission dispatch, different packet.  
- Do not assume outbox files = cousins received anything.  
- Do not recommend deploy, push, SQL, or auto-merge from cousin chat.

---

## Two different jobs (Petra must keep these separate)

| Job | Tool | Outcome |
|-----|------|---------|
| **A. Network role sync** | Dashboard → **Run Network Sync Relay** | All five cousins acknowledge lanes (ROLE_AWARENESS_SYNC) |
| **B. Comptroller verdict** | Fresh **Petra mission packet** + Ben Send to Petra tab only | GO/NO-GO, APP_INFRA slice, Gate 05 |

Job A is "everyone learns the wiring." Job B is "Petra rules on what happens next." Ben may need A before B makes sense.

---

## If Ben says "nothing is flowing"

Petra checks (ask Ben, don't assume):

1. Did he click **Run Network Sync Relay**? (If relay session is `idle`, he didn't.)  
2. Is Foreman dashboard actually running (port 4317)?  
3. Is he looking at **Aeye Crew Edge**, not personal Edge?  
4. After Run Relay, did dashboard show **AWAITING SEND** or an error?  
5. Did he **Send** in Edge, or only paste on Sally?

Petra verdict: **NO-GO on blaming cousins** until mechanical relay completed or failure is logged.

---

## Petra's closing

> The dashboard automates the boring parts — paste, tab order, packet freshness. Your authority is **Send**, **save replies**, and **approve anything that changes the repo**. If chats are empty, fix the relay on Sally first; don't re-explain doctrine into a void.

---

## Reference for Petra (if Ben wants detail)

- Operator quickstart: `foreman/crew-dispatch/BEN_DASHBOARD_QUICKSTART.md`  
- Automation spec: `foreman/crew-dispatch/CREW_RELAY_AUTOMATION.md`  
- Network map: `foreman/crew-dispatch/RELAY_NETWORK.md`

---

## Suggested VERDICT block when Ben asks for routing while relay untested

```
VERDICT: GO_WITH_CONDITIONS
SLICE: Complete network ROLE_AWARENESS_SYNC relay once before APP_INFRA routing
GATE_05: PAUSE
UI_COMMIT: hold
CODEX: sync cockpit after relay complete
MAKER: hold
CONDITIONS: Edge tabs must show sent ROLE_AWARENESS_SYNC before Comptroller check-in packet
NEXT_HUMAN_GATE: Ben Send on all five tabs + inbox validate
```
