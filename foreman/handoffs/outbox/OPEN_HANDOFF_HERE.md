# Who is who (read once)

| Name | What it is |
|------|------------|
| **Sally** | This computer. Local repo, dev server, Explorer, clipboard. |
| **Maker** | Cursor (bounded UI writer on Sally). Structure, CSS, wiring — not Ghost Forge runs. |
| **Codex** | Foreman. Record keeper + Ghost Forge operator via Render. Not Sally. |
| **Petra** | ChatGPT Comptroller in Cockpit/Ayes. Scope, gates, GO/NO-GO — not implementation. |
| **Ghost Forge** | Cloud worker on Render (`werkles-ghost-forge1`). Image generation happens there, not on Sally. |

**Sally's job tonight:** run the launcher script, paste into Codex, wait for PNGs on disk.  
**Codex's job:** hit Ghost Forge, save icons to `public/assets/draft/icons/`.  
**Maker's job (after):** wire icons when Ben says `ASSETS_LANDED v0.2`.

Do not run local image generation on Sally (no SD, no ComfyUI, no batch GPU).

---

# Handoff launcher — Petra crew check-in (functionality pivot)

## Quick launch on Sally

PowerShell — opens packet + copies paste block to clipboard:

```powershell
Get-Content "C:\Users\benle\Desktop\github\Werkles\foreman\handoffs\outbox\PETRA_PASTE_BLOCK.txt" | Set-Clipboard
Start-Process "C:\Users\benle\Desktop\github\Werkles\foreman\handoffs\outbox\TO_PETRA_COMPTROLLER_CREW_CHECKIN_v0.1.md"
```

## Paste into Petra / ChatGPT Comptroller (Ctrl+V after script)

- [PETRA_PASTE_BLOCK.txt](file:///C:/Users/benle/Desktop/github/Werkles/foreman/handoffs/outbox/PETRA_PASTE_BLOCK.txt)
- Full packet: [TO_PETRA_COMPTROLLER_CREW_CHECKIN_v0.1.md](file:///C:/Users/benle/Desktop/github/Werkles/foreman/handoffs/outbox/TO_PETRA_COMPTROLLER_CREW_CHECKIN_v0.1.md)

---

# Handoff launcher — Dink/Codex non-gate click relief

## Quick launch on Sally

PowerShell — copies the focused non-gate agent paste block, opens the packet, and creates the local coordinate config if missing:

```powershell
& "C:\Users\benle\Desktop\github\Werkles\scripts\foreman\open-sally-dink-non-gate-agent.ps1"
```

## Paste into the focused local agent

- [SALLY_DINK_NON_GATE_PASTE_BLOCK.txt](file:///C:/Users/benle/Desktop/github/Werkles/foreman/handoffs/outbox/SALLY_DINK_NON_GATE_PASTE_BLOCK.txt)
- Full packet: [TO_SALLY_DINK_NON_GATE_AGENT_v0.1.md](file:///C:/Users/benle/Desktop/github/Werkles/foreman/handoffs/outbox/TO_SALLY_DINK_NON_GATE_AGENT_v0.1.md)

## Local coordinate helper

Copy/edit local coordinates only on Sally:

```powershell
.\scripts\foreman\sally-dink-non-gate-clicker.ps1 -Click Allow
.\scripts\foreman\sally-dink-non-gate-clicker.ps1 -Click Allow -LiveClick
```

Only use `-LiveClick` after the prompt has been classified as `PROCEED: not a human gate.` Stop at true or unknown gates.

---

# Handoff launcher — Ghost Forge v0.2 icons first

## Quick launch on Sally

PowerShell — copies Codex paste block to clipboard, opens packet, opens icons folder:

```powershell
& "C:\Users\benle\Desktop\github\Werkles\scripts\foreman\open-codex-handoff.ps1"
```

## 1. Paste into Codex (Ctrl+V after script)

- [CODEX_PASTE_BLOCK.txt](file:///C:/Users/benle/Desktop/github/Werkles/foreman/handoffs/outbox/CODEX_PASTE_BLOCK.txt)

Verify phrase is already in the paste block for tonight.

## 2. Codex packet

- [TO_CODEX_GHOST_FORGE_ICONS_FIRST_v0.2.md](file:///C:/Users/benle/Desktop/github/Werkles/foreman/handoffs/outbox/TO_CODEX_GHOST_FORGE_ICONS_FIRST_v0.2.md)

## 3. Manifest + inventory

- [DRAFT_SITE_ASSET_BATCH_v0.2.md](file:///C:/Users/benle/Desktop/github/Werkles/foreman/ghost-forge/DRAFT_SITE_ASSET_BATCH_v0.2.md)
- [ASSET_INVENTORY_STATUS.md](file:///C:/Users/benle/Desktop/github/Werkles/foreman/ghost-forge/ASSET_INVENTORY_STATUS.md)
- [DRAFT_SITE_ASSET_RESULTS_v0.2.md](file:///C:/Users/benle/Desktop/github/Werkles/foreman/ghost-forge/DRAFT_SITE_ASSET_RESULTS_v0.2.md)

## 4. PNG drop folders (on Sally's disk)

- [public/assets/draft/icons/](file:///C:/Users/benle/Desktop/github/Werkles/public/assets/draft/icons)
- [public/assets/draft/ghost-forge/](file:///C:/Users/benle/Desktop/github/Werkles/public/assets/draft/ghost-forge)

## 5. Back to Maker on Sally

When Codex lands files, paste in Cursor:

`ASSETS_LANDED v0.2`
