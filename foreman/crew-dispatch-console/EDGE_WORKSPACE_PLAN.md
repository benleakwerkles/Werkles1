# Edge Workspace Plan — Crew Dispatch v2

Status: operator setup guide  
Workspace name: **Werkles Crew Dispatch**

Microsoft Edge Workspaces keep a **fixed tab order** for the crew circuit. Tab 1 is always the dispatch dashboard; tab order must not drift between sessions.

---

## Fixed tab order (do not reorder)

| # | Tab | Target | Notes |
|---|-----|--------|-------|
| 1 | **Dispatch Dashboard** | `foreman/crew-dispatch-console/dashboard.html` | Auto-generated; refresh before each session |
| 2 | **Morale preview** | https://werkles.com | Crawler-walled; not public launch |
| 3 | **Local preview** | http://localhost:3000 | Run `npm run dev` on Sally first |
| 4 | **Petra** | ChatGPT Comptroller project | Paste only — no auto-send |
| 5 | **Codex** | Codex Foreman thread | Paste only — no auto-send |
| 6 | **GitHub** | https://github.com/benleakwerkles/Werkles1 | Repo truth |
| 7 | **Ghost Forge** | Render dashboard | Cloud worker — not Sally |

**Outside Edge (same physical desk):**

- **Maker (Cursor)** — desktop app beside Edge; not a browser tab

---

## One-time setup

1. Run on Sally:

```powershell
cd C:\Users\benle\Desktop\github\Werkles
.\scripts\foreman\crew-dispatch-console.ps1 -Action OpenWorkspace
```

2. Log into ChatGPT / Codex seats in tabs 4–5 if needed.
3. Edge menu → **Workspaces** → **Save all tabs as workspace**.
4. Name it **Werkles Crew Dispatch**.

---

## Daily operator loop

1. `.\scripts\foreman\crew-dispatch-console.ps1 -Action Refresh`
2. Open saved Edge Workspace.
3. Confirm tab 1 dashboard shows current `NEXT_ACTION` headline.
4. `Prepare` for the target role (example Petra):

```powershell
.\scripts\foreman\crew-dispatch-console.ps1 -Action Prepare -Mission crew-checkin -Role petra
```

5. Switch to tab 4 → **Ctrl+V** manually → Send is human gate.
6. After reply, paste verdict back to Maker on Cursor — not through Automate.

---

## Rules

- Do not add social, news, or unrelated tabs inside this workspace.
- If a tab URL changes, update `dispatch-config.json` and re-save the workspace.
- Cursor stays outside Edge by design — Maker is Sally-local.

---

## Config reference

Machine-readable tab list: `foreman/crew-dispatch-console/dispatch-config.json` → `edgeWorkspace.fixedTabOrder`
