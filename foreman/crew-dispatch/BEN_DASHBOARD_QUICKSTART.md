# Ben — Foreman Dashboard Quickstart (human)

**You are not doing it wrong.** The dashboard was built with AI/cockpit vocabulary first. This page is the human version.

---

## What this is (30 seconds)

| Thing | What it actually is |
|-------|---------------------|
| **Foreman Dashboard** | A local website on **your PC only**: http://localhost:4317 — opened by **Werkles - Foreman Dashboard** on Desktop |
| **Aeye Crew Bay** | A **separate Edge window** with 5 tabs (Petra, Skybro, Ender, Bean, Computer) — **not** embedded inside Foreman |
| **Outbox files** | Packets sitting in a **folder on Sally** — they do **not** appear in ChatGPT until the relay **pastes** them |
| **Relay** | The machine that moves text from Sally **into** the Edge chat box — **you** still click Send |

**Pipes laid ≠ water flowing.** Files in `foreman/handoffs/outbox/` mean the packets were **written**. Your Edge chats stay empty until you **Run Network Sync Relay** and the courier pastes into each tab.

---

## Before you start (checklist)

- [ ] **Foreman Dashboard running** — double-click Desktop **Werkles - Foreman Dashboard** (keep that window open)
- [ ] Bookmark http://localhost:4317 — this is home base
- [ ] **Edge Crew Bay** — on dashboard click **Open Aeye Crew Bay** once (or Desktop **Werkles - Aeye Crew Bay**)
- [ ] Edge window shows tabs 1–5: ChatGPT, Gemini, Claude, DeepSeek, Perplexity

If Foreman is not running, buttons do nothing useful.

---

## The one workflow that moves water through the pipes

Scroll to the card: **AEYE Network Relay (automated)**

### Step 1 — Start the relay

Click **Run Network Sync Relay**

The machine will:

1. Make sure fresh network packets exist (or reissue if stale)
2. Open Edge bay if needed
3. **Paste the Petra command into Edge tab 1** automatically

You should see on the dashboard:

- **State:** AWAITING SEND  
- **Tab 1 Petra — paste delivered, waiting for Send**

### Step 2 — Send (your gate)

1. Switch to the **Edge** window (not the dashboard)
2. Click **tab 1** (ChatGPT / Petra) if you're not already there
3. **Look at the chat input** — there should be text starting with `[AEYE RELAY — ROLE_AWARENESS_SYNC`
4. If the box is empty: click inside the chat input once, try **Ctrl+V** (paste is still on clipboard as fallback)
5. Click **Send** in ChatGPT — **only you** do this

Nothing is "issued" to the cousins until **you Send**.

### Step 3 — Tell the dashboard you sent

Back on Foreman dashboard, click **I Sent - Next Cousin**

The machine pastes into tab 2 (Skybro). Repeat:

- Edge → Send  
- Dashboard → I Sent - Next Cousin  

…for tabs 3, 4, 5 (Ender, Bean, Computer).

### Step 4 — After all five

Dashboard shows **COMPLETE**.

1. Copy each cousin's reply from Edge into a file, or use **Drop Zone** on the dashboard  
2. Save as `FROM_PETRA_…md`, `FROM_SKYBRO_…md`, etc. in inbox  
3. Click **Validate Inbox** then **Process Responses**

Still no auto-merge into the repo — you review what landed.

---

## What each dashboard area is for

### Operator plow (top)

Big buttons for daily work: open crew bay, prepare Petra packet, load paste to clipboard.  
**For network role sync, use the Relay card below instead** — it replaces manual copy/paste.

### AEYE Network Relay (automated)

**Primary path** for "tell all cousins their roles."  
Two buttons matter: **Run Network Sync Relay** and **I Sent - Next Cousin**.

### Edge Dispatch Bay (Robot Zone)

Shows Aeye tab order and relay status. **Vendor AI chats are not iframe'd here** — use **Open Aeye Crew Bay** for ChatGPT/Gemini/etc.  
**Verify Tab Mapping** before relay if you changed tab order or re-issued network sync.

### Drop Zone

Where **responses** land when you paste cousin replies from Edge into the dashboard. Not for outgoing commands.

### Safe local actions / Generate packets

For **mission** packets (crew check-in, Petra verdict), not the network role-sync. Different job.

---

## Why your Edge chats might still be empty

| Cause | Fix |
|-------|-----|
| Relay never started | Click **Run Network Sync Relay** — session file was `idle` |
| Foreman not running | Open Desktop **Werkles - Foreman Dashboard** |
| Edge bay not open | **Open Aeye Crew Bay** first, then Run Relay |
| Paste missed chat box | Click chat input, **Ctrl+V**, then Send |
| Old dashboard code | Restart Foreman (close cmd window, open Desktop shortcut again) |
| Looking at wrong Edge profile | Use **Aeye Crew Bay** — not your personal Edge |

Outgoing packets on disk **do not** notify ChatGPT. Only **Send** after paste does.

---

## What you should NOT do as primary path

- Hunt `foreman/handoffs/outbox/` and manually copy files (fallback only)
- Run `crew-dispatch.bat` for network role sync (that's for Petra **mission** check-in)
- Expect cousins to "just know" — they only know what you **Send** into their tab

---

## When to ask Petra

Ask Petra (Comptroller) for **routing verdicts** — APP_INFRA slice, Gate 05, GO/NO-GO.  
Ask the dashboard for **mechanical relay** — moving packets to Edge tabs.

Petra's script for explaining this to you: `foreman/crew-dispatch/PETRA_TO_OPERATOR_DASHBOARD_SCRIPT.md`

---

## One-line summary

**Dashboard prepares and pastes; Edge Send delivers; inbox collects replies; you never merge without reading.**
