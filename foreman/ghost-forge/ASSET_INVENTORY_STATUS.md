# Asset inventory status

Last checked: Maker pass (local workspace scan)

## Ghost Forge atmosphere (`public/assets/draft/ghost-forge/`)

| File | Foreman record | In this workspace |
|------|----------------|-------------------|
| `werkles-draft-hero-foundry-v0.1.png` | landed (v0.1 results) | **missing** — README only |
| `werkles-draft-proof-trust-v0.1.png` | landed (v0.1 results) | **missing** — README only |
| `werkles-draft-hero-foundry-v0.2.png` | planned (batch v0.2 A01) | not generated |
| `werkles-draft-proof-trust-v0.2.png` | planned (batch v0.2 A02) | not generated |
| `werkles-draft-workbench-hook-01.png` … `05.png` | planned (batch v0.2 P0-B) | not generated |
| A03–A10 route plates | planned (batch v0.2) | not generated |

## Micro icons (`public/assets/draft/icons/`)

| File | Batch | In this workspace |
|------|-------|-------------------|
| `icon-lane-*-v0.1.png` (5) | Tier 3 | **not generated** — folder staged |
| `icon-proof`, `icon-dues`, `icon-deck`, `icon-knock` | Tier 3 nav | not generated |
| `icon-step-*` (3) | Tier 3 steps | not generated |
| Crucible + badge icons | Tier 3 | not generated |

**Codex handoff:** `foreman/handoffs/outbox/TO_CODEX_GHOST_FORGE_ICONS_FIRST_v0.2.md`

Foreman log: `foreman/ghost-forge/DRAFT_SITE_ASSET_RESULTS_v0.1.md`  
Next batch manifest: `foreman/ghost-forge/DRAFT_SITE_ASSET_BATCH_v0.2.md`  
App inventory mirror: `lib/draft-asset-inventory.ts`

**If PNGs were generated on another machine:** copy them into `public/assets/draft/ghost-forge/` and say `ASSETS_LANDED v0.2`.

## Logo / wordmark

| Asset | Path | In workspace |
|-------|------|--------------|
| Word-only mark | `public/assets/werkles-word-only.png` | referenced by app (verify locally) |
| W mark / full logo | batch v0.2 brand section | not staged |

## Owl / mascot — Squibb vs Brass

| Name | Lane | Status |
|------|------|--------|
| **Squibb** | Education / Bellows voice (`education-forge/`) | **copy + rules only** — no PNG in repo |
| **Brass** (Crucible foreman) | Product mascot (`public/assets/mascot/`) | **blocked on manual cutout** from `coolowl.png` per `public/assets/mascot/README.md` |
| Old helper avatar | brand mark (legacy) | not in repo |

Ghost Forge negative prompt explicitly excludes cartoon mascot — **Squibb/Brass are not Ghost Forge outputs**. Ben cutout → `brass-foreman-full.png` + `brass-foreman-bust.png` → tell Foreman `ASSETS_LANDED`.

## Maker wiring

- Homepage `#forge-preview` gallery reads `lib/draft-asset-inventory.ts` and shows landed vs missing per file.
- Anchor scroll offset: `--site-header-scroll-offset` in `app/globals.css` for `#people`, `#how`, `#beta`.
