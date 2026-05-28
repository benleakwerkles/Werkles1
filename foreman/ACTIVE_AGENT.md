# Active Agent

## Active Writer
**Maker (Cursor on Sally)** — site icons + UI/UX today.

Codex optional for Ghost Forge API runs only. No browser MCP repair.

## Today
- `SiteIcon` system: PNG auto-wires when files land in `public/assets/draft/icons/`
- Fallback SVG until then
- Wired: home nav, lanes, how-steps, crucible cards

## Ben runs icons (PowerShell on Sally)
`.\scripts\foreman\ghost-forge-icon-from-sally.ps1 -Icon builder`

## Preview
`npm run dev` on Sally

## After PNGs drop
Icons swap in automatically — no code change if filenames match `lib/site-icons.ts`.
