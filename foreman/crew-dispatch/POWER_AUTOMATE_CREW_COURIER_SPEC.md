# Power Automate Crew Courier — Implemented via crew-edge-courier

Status: **implemented** (`crew-edge-courier.ps1` + `crew-edge-courier.mjs`)  
Doctrine: **STOP BEFORE SEND** — never auto-click Send

This document specifies a future local courier flow. It does **not** authorize deploy, push, SQL, secrets access, Ghost Forge, Bellows, or external Send automation today.

---

## Implementation

```powershell
# Single cousin — focus tab + paste (network sync paste)
node foreman/crew-dispatch/crew-edge-courier.mjs deliver --cousin PETRA --ensure-edge

# Walk all five — pauses between tabs for manual Send
powershell -NoProfile -ExecutionPolicy Bypass -File foreman/crew-dispatch/crew-edge-courier.ps1 -WalkNetworkSync -EnsureEdge
```

Foreman dashboard:

- **Walk Network Sync (auto-paste all 5)** — opens PowerShell walk; Enter between tabs after you Send
- **Deliver {Cousin}** — one tab focus + paste

---

## Purpose

Assist Ben by:

- Reading crew tab mapping from `crew-tabs.config.json`
- Loading the correct paste block for a cousin
- Focusing the matching Edge Dispatch Bay tab
- Pasting the packet into the input area **only if explicitly approved in a later human gate**

It must **never** auto-click Send, Submit, or provider POST actions.

---

## Inputs

| Input | Source |
|-------|--------|
| `cousinId` | One of: `PETRA`, `SKYBRO`, `ENDER`, `BEAN`, `COMPUTER` |
| Tab config | `foreman/crew-dispatch/crew-tabs.config.json` |
| Paste block | Path from tab entry `pasteBlock` (e.g. `foreman/handoffs/outbox/PETRA_PASTE_BLOCK.txt`) |

Optional future inputs:

- Freshness check against `foreman/crew-dispatch-console/LATEST_DISPATCH.json`
- Cockpit hash gate from `DISPATCH_DASHBOARD.json`

---

## Flow (spec)

```
1. RECEIVE cousinId (operator or Foreman Control Panel trigger)
2. LOAD crew-tabs.config.json
3. RESOLVE tab by id → tabIndex, url, pasteBlock
4. VERIFY paste block file exists and is non-empty
5. OPTIONAL: verify packet freshness (human gate if stale)
6. READ paste block text (local file only — no secrets from env)
7. FOCUS Edge window using dispatch bay profile:
     foreman/.edge-aeye-crew-profile
   ACTIVATE tab by tabIndex (UI automation — fragile; test per Edge version)
8. SET clipboard to paste block text
9. PASTE into focused input (Ctrl+V simulation)
10. STOP — display "STOP BEFORE SEND — review and Send manually"
11. DO NOT click Send / Submit / Post
```

---

## Hard stops (must enforce)

| Action | Allowed |
|--------|---------|
| Read local paste block | Yes (when spec is implemented) |
| Focus Edge dispatch bay tab | Yes (when spec is implemented) |
| Paste into input | Only with explicit later approval + STOP banner |
| Click Send | **Never** |
| HTTP POST to AI providers | **Never** |
| Read `.env` / secrets | **Never** |
| Deploy / push / SQL | **Never** |

Config flags (already in JSON):

- `"autoSend": false`
- `"humanSendGate": true`

---

## Edge profile constraint

Courier must target the **dispatch bay profile only**:

`C:\Users\benle\Desktop\github\Werkles\foreman\.edge-aeye-crew-profile`

Do not automate Ben's personal Edge profile.

---

## Failure modes

| Condition | Behavior |
|-----------|----------|
| Paste block missing | Abort with operator message |
| Stale packet | Abort — regenerate via Foreman Control Panel |
| Edge not open | Open `open-aeye-crew.cmd` or prompt Ben |
| Tab focus fails | Copy to clipboard only; Ben pastes manually |
| Any Send button detected in automation scope | **HUMAN GATE REQUIRED** — abort |

---

## Foreman Control Panel integration (planned)

Future buttons (not required for dispatch bay v1):

- Load Petra Packet  
- Load Skybro Packet  
- Load Ender Packet  
- Load Bean Packet  
- Load Computer Packet  

Each should: verify fresh → clipboard → optional courier handoff → **STOP BEFORE SEND**

---

## Implementation note

Power Automate Desktop or a Sally-local script may implement this spec later. Until then, Ben uses:

1. `open-aeye-crew.cmd`  
2. Foreman Control Panel copy/generate actions  
3. Manual Ctrl+V and manual Send
