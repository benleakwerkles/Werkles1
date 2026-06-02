# Crew Dispatch Console v2

Status: **ACTIVE** — Sally operator console for crew handoffs  
Location: `foreman/crew-dispatch-console/`  
Launcher: `scripts/foreman/crew-dispatch-console.ps1`

## Doctrine

**Stops before Send.** The console may:

- refresh cockpit status into a dashboard
- generate role-specific packets and paste blocks
- copy paste blocks to clipboard
- open packet files and Edge tabs

The console must **not**:

- auto-paste into AI chats
- send email or Teams messages
- POST to provider APIs
- deploy, push, or apply SQL

Ben is always the Send gate.

---

## Quick start (Sally)

**Double-click:** `DISPATCH_GO.cmd` (repo root) or `foreman/crew-dispatch-console/DISPATCH_GO.cmd`

That is the whole operator loop: refresh cockpit into packet, copy paste block to clipboard, open packet + pointer. **Stops before Send.**

Optional PowerShell (same default — no flags needed):

```powershell
cd C:\Users\benle\Desktop\github\Werkles
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\foreman\crew-dispatch-console.ps1
```

Dashboard only (no regenerate):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\foreman\crew-dispatch-console.ps1 -Action Show
```

Edge workspace:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\foreman\crew-dispatch-console.ps1 -Action OpenWorkspace
```

---

## Actions

| Action | Purpose |
|--------|---------|
| `Go` | **Default.** Same as Prepare — Petra crew-checkin unless `-Mission`/`-Role` set |
| `Refresh` | Re-read `NEXT_ACTION.md` / `ACTIVE_AGENT.md` → update dashboard JSON/MD/HTML |
| `Generate` | Create packet + paste block only (no clipboard) |
| `Prepare` | Alias for `Go` |
| `OpenLatest` | Reopen last packet + reload clipboard (no regenerate) |
| `OpenWorkspace` | Launch Edge with fixed tab order |
| `Show` | Refresh dashboard and open `dashboard.html` (no regenerate) |

---

## Missions

| ID | Primary role | Use when |
|----|--------------|----------|
| `crew-checkin` | petra | Functionality pivot / APP_INFRA scope |
| `ghost-forge-resume` | codex | Gate 05 or asset batch resume |
| `morale-preview` | maker | Post-deploy visual verification |
| `app-infra-slice` | maker | After Petra verdict — implementation slice |

---

## Roles

| ID | Seat | Paste block |
|----|------|-------------|
| `petra` | Comptroller | `PETRA_PASTE_BLOCK.txt` |
| `codex` | Foreman | `CODEX_PASTE_BLOCK.txt` |
| `maker` | Cursor | `MAKER_PASTE_BLOCK.txt` |
| `ender` | Claude UX | `ENDER_PASTE_BLOCK.txt` |
| `bean` | Trust audit | `BEAN_PASTE_BLOCK.txt` |

Config source of truth: `dispatch-config.json`

---

## Files

| Path | Role |
|------|------|
| `dispatch-config.json` | Tab order, roles, missions, paths |
| `DISPATCH_DASHBOARD.json` | Machine-readable status (generated) |
| `DISPATCH_DASHBOARD.md` | Operator-readable status (generated) |
| `dashboard.html` | Edge tab 1 — visual cockpit (generated) |
| `EDGE_WORKSPACE_PLAN.md` | Manual Edge Workspace setup |
| `POWER_AUTOMATE_FLOW_SPEC.md` | Flow spec — stops before Send |
| `templates/` | Packet + paste block templates |

---

## Related cockpit

- `foreman/handoffs/outbox/OPEN_HANDOFF_HERE.md` — legacy launcher index
- `foreman/AI_COUSINS_PROTOCOL.md` — crew law
- `foreman/HUMAN_GATES.md` — hard stops
