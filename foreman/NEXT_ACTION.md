# NEXT ACTION

[ACTIVE: ASSET EXECUTION — SQUIBB CUTOUT + GHOST FORGE TIER 3]

Ben approved (2026-05-28): **site style v0.6**, **one canonical Squibb**, **batch v0.2 direction**. See `foreman/gates/APPROVAL_LOG.md`.

## Ben (Sally) — next hands

1. **Squibb cutout** — `coolowl.png` → `public/assets/mascot/brass-foreman-full.png` + bust per `foreman/MASCOT_RULES.md` → say `ASSETS_LANDED`
2. **Tier 3 icons** — Ghost Forge from Sally (budget gate):

```powershell
cd C:\Users\benle\Desktop\github\Werkles
$env:PUBLIC_BASE_URL = "https://werkles-ghost-forge1.onrender.com"
$env:GHOST_FORGE_API_KEY = "..."   # local session only
.\scripts\foreman\ghost-forge-icon-from-sally.ps1 -Icon builder
```

Drop PNGs: `public/assets/draft/icons/` (filenames in `lib/site-icons.ts`).

3. **Preview** — `npm.cmd run dev` → http://localhost:3000

4. **Push** — when ready: `git push origin main` (6 commits ahead; human gate)

## Approved batch order (v0.2)

1. Tier 3 lane + step + check + nav icons (pairs; respect rate limits)
2. A01/A02 atmosphere upgrades (mixed-facet workshop, heavy paper scrim)
3. A03–A10 route plates one at a time
4. Tier 2 Squibb cutouts — **manual only**, not Ghost Forge

## Maker (Cursor)

- Wire Squibb bust when PNGs land (replace `WorkshopGreeter` W-mark where appropriate)
- Remove draft-review badge when Ben says final brand lock

## Codex

Log runs to `foreman/ghost-forge/DRAFT_SITE_ASSET_RESULTS_v0.2.md`. No browser MCP.

## Hard stops

no deploy | no SQL | no secrets in chat | no Bellows unless Ben opens gate
