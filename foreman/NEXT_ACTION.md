# NEXT ACTION

[ACTIVE: SITE ICONS + UI/UX — MAKER ON SALLY]

Yesterday lost to Codex browser repair loop. Today: **visible site work + icon assets.**

## Maker (Cursor on Sally) — today

- [x] **Brightened workshop v0.4** — warm paper panels, visible forge atmosphere (middle path vs image 1)
- [x] Unified `SiteIcon` — PNG + SVG fallback
- [x] Wired: header nav, `#people` lanes, `#how` steps, crucible verification cards
- [ ] Wire icons on pricing/membership/dashboard nav when Ben confirms priority
- [ ] Replace forge preview gallery rows when PNGs land

## Icon assets (Sally PowerShell — no Codex browser)

Drop Ghost Forge PNGs into: `public/assets/draft/icons/`

```powershell
cd C:\Users\benle\Desktop\github\Werkles
$env:PUBLIC_BASE_URL = "https://werkles-ghost-forge1.onrender.com"
$env:GHOST_FORGE_API_KEY = "..."   # local session only
.\scripts\foreman\ghost-forge-icon-from-sally.ps1 -Icon builder
```

Icons auto-swap from SVG fallback to PNG when filenames match `lib/site-icons.ts`.

Priority filenames tonight: `icon-lane-*`, `icon-step-*`, `icon-check-*`, `icon-proof-v0.1.png`

## Preview site

```powershell
cd C:\Users\benle\Desktop\github\Werkles
npm run dev
```

## Codex

Optional for logging only. **Do not** resume browser MCP repair. See `foreman/EMERGENCY_BYPASS.md`.

## Hard stops

no push | no deploy | no SQL | no secrets in chat
