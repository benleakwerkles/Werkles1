# EMERGENCY: break the Codex loop

**Root cause:** Codex spent the day trying to repair its **in-app browser bridge** (`Transport closed`, sandbox spawn error 740). Ghost Forge does **not** need that browser. The worker is HTTP on Render.

**Stop the loop. Use the API from Sally.**

---

## Step 1 — Hard-stop Codex (not Sally)

Task Manager → end **all** `Codex.exe` / `codex.exe` processes (there may be several from an old session).

Or PowerShell **as Ben** (closes Codex app only):

```powershell
Get-Process -Name "Codex","codex" -ErrorAction SilentlyContinue | Stop-Process -Force
```

Reopen Codex later if you want. **Do not** let it resume "browser repair" tonight.

Paste in Codex if it wakes up:

```
STOP. Abandon browser bridge repair. Do not retry sandbox or node_repl MCP.
Ghost Forge uses HTTP API only. Read foreman/EMERGENCY_BYPASS.md and halt.
```

---

## Step 2 — Ghost Forge from Sally (no Codex browser)

Prerequisites (already done on prior nights):

- Render service live: `https://werkles-ghost-forge1.onrender.com/health` → `"ok":true`
- `GHOST_FORGE_API_KEY` set in **your** PowerShell session only (never paste in chat)

```powershell
cd C:\Users\benle\Desktop\github\Werkles

# health
$env:PUBLIC_BASE_URL = "https://werkles-ghost-forge1.onrender.com"
.\ghost-forge-worker\health-check.ps1

# one icon (example: builder lane)
$env:GHOST_FORGE_API_KEY = "your-key-here"   # local session only
.\scripts\foreman\ghost-forge-icon-from-sally.ps1 -Icon builder
```

Script submits **one** icon, polls batch status, prints Supabase `storage_path` when complete. Copy PNG from Supabase into `public/assets/draft/icons/` with the exact filename from the batch manifest.

Repeat for operator, backer, connector, spark — **wait 60s between calls** if you hit 429.

---

## Step 3 — Site work without waiting on Codex

**Maker on Sally** wires icons and cockpit. When PNGs land in `public/assets/draft/icons/`, paste in Cursor:

`ASSETS_LANDED v0.2`

---

## What was wasting the day

| Wrong path | Right path |
|------------|------------|
| Codex in-app browser → Render Shell | Sally PowerShell → `POST /batch/create` |
| Fix `codex-windows-sandbox-setup.exe` | Ignore browser MCP; API scripts exist |
| Poll forever on broken bridge | Poll `GET /batches/:id` from script with timeout |

---

## Budget

Lane `lane-ghost-forge-batch-asset-generation` — approved in `foreman/BUDGET.md` (2026-05-27). Max $3 tonight. Stop at cap or 429.

---

Last updated: Maker emergency pass on Sally
