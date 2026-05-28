# To Codex Foreman: Ghost Forge v0.2 — icons first

## Cast (do not confuse)

- **Sally** = Ben's local Windows machine (repo + dev server). Not you.
- **Maker** = Cursor on Sally (UI wiring only). Off copy duty.
- **Codex** = you. Foreman. Ghost Forge execution + results log.
- **Ghost Forge** = Render worker `werkles-ghost-forge1`. Not Sally.

## Status

**READY FOR CODEX EXECUTION** — Maker prepared handoff on Sally (2026-05-26).

Maker is blocked on assets until PNGs exist on Sally's disk. Codex owns Ghost Forge generation, download into repo, and results logging.

## Ben verification (required before first paid prompt)

Ben: reply in Codex thread with:

`VERIFY GHOST FORGE v0.2 ICONS FIRST`

That confirms:

- Run lane: `lane-ghost-forge-batch-asset-generation`
- Priority: Tier 3 micro icons first (this packet), then P0 atmosphere addendum
- Stop at daily cap / 429 — do not retry-spend
- Draft/review only — not final brand approval

If budget lane is ambiguous in `foreman/BUDGET.md`, stop and ask Ben to confirm max spend for tonight before prompt 1.

---

## Read first (cockpit)

| File | Role |
|------|------|
| `foreman/platform-instructions/CODEX_FOREMAN_INSTRUCTIONS.md` | Foreman rules |
| `foreman/ghost-forge/DRAFT_SITE_ASSET_BATCH_v0.2.md` | Full prompt manifest |
| `foreman/ghost-forge/ASSET_INVENTORY_STATUS.md` | Landed vs missing |
| `foreman/ghost-forge/DRAFT_SITE_ASSET_RESULTS_v0.1.md` | Prior run log |
| `foreman/BUDGET.md` | Spend caps |
| `foreman/HUMAN_GATES.md` | Hard stops |
| `foreman/ACTIVE_AGENT.md` | Single-writer lock |

---

## Problem statement

The Next.js app references Ghost Forge assets and icons, but **`public/assets/` in repo is effectively empty** (READMEs only). Ben has been waiting all night to see new icons on the site. Cursor cannot generate images. **Nothing visible changes until Codex lands PNGs on disk.**

v0.1 completed 2 atmosphere images on a prior machine; they are **not in this workspace checkout**. Re-download from Supabase `ghost-forge` bucket if still available, or regenerate.

---

## Ghost Forge service

- Service: `werkles-ghost-forge1`
- URL: `https://werkles-ghost-forge1.onrender.com`
- Worker constraint: **`MAX_PROMPTS_PER_BATCH=1`** — one image per request
- Model: `ideogram-ai/ideogram-v3-quality` (per batch v0.2)
- Pause 30–90s between requests on `429`

---

## Save paths

| Asset type | Directory |
|------------|-----------|
| Micro icons (Tier 3) | `public/assets/draft/icons/` |
| Atmosphere / workbench (Tier 1, P0) | `public/assets/draft/ghost-forge/` |
| Mascot cutouts (W01–W02) | `public/assets/mascot/` — **manual Ben only, not Ghost Forge** |

Log every completed run in: `foreman/ghost-forge/DRAFT_SITE_ASSET_RESULTS_v0.2.md`

Append global negative prompt from batch v0.2 to every request.

---

## Run order (execute sequentially)

### Phase A — Lane sigils (5) — **highest UX ROI**

| # | Output filename | Prompt (from batch Tier 3) |
|---|-----------------|----------------------------|
| A1 | `icon-lane-builder-v0.1.png` | Single brass hammer with tiny spark, icon centered, transparent background, copper and steel, no text |
| A2 | `icon-lane-operator-v0.1.png` | Single brass gear overlapping calendar plate, icon centered, transparent background, no text |
| A3 | `icon-lane-backer-v0.1.png` | Single fuel canister or runway tank in brass, no dollar sign, transparent background, no text |
| A4 | `icon-lane-connector-v0.1.png` | Single network node with connecting wires in copper, transparent background, no text |
| A5 | `icon-lane-spark-v0.1.png` | Single unlit fuse catching flame tip in brass holder, transparent background, no text |

### Phase B — Nav / section icons (4)

| # | Output filename |
|---|-----------------|
| B1 | `icon-proof-v0.1.png` |
| B2 | `icon-dues-v0.1.png` |
| B3 | `icon-deck-v0.1.png` |
| B4 | `icon-knock-v0.1.png` |

Prompts: batch v0.2 Tier 3 nav table.

### Phase C — How-it-works step icons (3)

| # | Output filename |
|---|-----------------|
| C1 | `icon-step-dossier-v0.1.png` |
| C2 | `icon-step-fit-v0.1.png` |
| C3 | `icon-step-knock-v0.1.png` |

### Phase D — P0 atmosphere (if budget remains tonight)

| # | Output filename |
|---|-----------------|
| D1 | `werkles-draft-workbench-hook-01.png` … `05.png` |
| D2 | `werkles-draft-trust-plate-v0.2.png` (text-free) |

### Phase E — v0.1 recovery (if missing locally)

Re-fetch or regenerate:

- `werkles-draft-hero-foundry-v0.1.png`
- `werkles-draft-proof-trust-v0.1.png`

Stop when daily cap hit. Report partial completion — partial is still valuable.

---

## Forbidden (Codex)

- Do not run Ghost Forge from Cursor
- Do not run Bellows
- Do not push / deploy / SQL / secrets / billing changes
- Do not treat outputs as final brand approval
- Do not generate cartoon mascot (Squibb/Brass) via Ghost Forge — Ben manual cutout per `public/assets/mascot/README.md`

---

## Handoff back to Cursor (after files on disk)

Update `foreman/NEXT_ACTION.md` and tell Ben to paste in Cursor:

`ASSETS_LANDED v0.2`

Cursor will wire icons into:

- Home `#people` lane strip
- Header nav (People / How / Proof / Dues)
- `#how` step list
- Crucible verification cards (Phase C+ stamps if landed)
- `#forge-preview` gallery

Cursor lane: structure/CSS/wiring only — **off copy duty**.

---

## Completion checklist (Codex)

- [ ] Ben verification phrase received
- [ ] Budget lane confirmed before spend
- [ ] Each PNG saved to correct folder with exact filename
- [ ] `DRAFT_SITE_ASSET_RESULTS_v0.2.md` updated per image
- [ ] `ASSET_INVENTORY_STATUS.md` updated
- [ ] `ACTIVE_AGENT.md` → Cursor writer for wiring pass
- [ ] `NEXT_ACTION.md` → `[ASSETS_LANDED v0.2 — CURSOR WIRE ICONS]`
- [ ] Ben notified with Explorer path to `public/assets/draft/icons/`
