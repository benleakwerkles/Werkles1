# Draft Site Asset Batch v0.2

Status: **APPROVED DIRECTION** — Ben 2026-05-28 (`one batch direction`). Execute Tier 3 icons first, then atmosphere upgrades. Mixed-facet workshop energy per `foreman/SITE_STYLE_APPROVED_v0.6.md` — not heavy industrial forge only.

Prior batch: `DRAFT_SITE_ASSET_BATCH_v0.1.md` (2 of 10 atmosphere plates landed)

Purpose: Itemized Ghost Forge / Ideogram prompt manifest for atmosphere, wonder, and micro UI assets. Cursor owns this list; Codex Foreman executes generation one image at a time.

Generator: `ideogram-ai/ideogram-v3-quality` via Ghost Forge on Render (`werkles-ghost-forge1`)

Hard rules for every prompt:

- No readable text, letters, numbers, logos, or watermarks in generated images
- Dark industrial optimism — enchanted foundry, not candy fantasy, not crypto, not pastel SaaS
- Blackened steel, brushed copper frames, restrained violet and teal brand energy, warm forge glow
- Werkles = private business partner matching for Builders, Operators, Backers, Connectors, Sparks
- Draft/review only until Ben approves final creative direction

Operational notes:

- Worker `MAX_PROMPTS_PER_BATCH=1` — submit **one prompt per request**
- Save outputs under `public/assets/draft/ghost-forge/` with exact filenames below
- Record each run in `foreman/ghost-forge/DRAFT_SITE_ASSET_RESULTS_v0.2.md`
- Respect Replicate/Ghost Forge rate limits — pause between requests if `429`
- Tier 2 mascot cutouts (W01–W03) are **manual Ben cutouts**, not Ghost Forge

Suggested budget envelope for v0.2 atmosphere + icons (Foreman to confirm against `foreman/BUDGET.md` before spend):

- Atmosphere upgrades/new: up to 10 images × ~$0.20 ≈ `$2.00`
- Micro icons: up to 20 images × ~$0.20 ≈ `$4.00` (may require separate budget gate)
- Stop immediately if daily cap or lane budget is exceeded

---

## Global negative prompt (append to every Ghost Forge request)

`readable text, letters, numbers, watermark, logo, stock photo smile, handshake cliché, pastel SaaS, crypto, fantasy portal, candy wonderland, cluttered cyberpunk, neon overload, pure white background, cartoon mascot`

---

## Tier 1 — Atmosphere plates (wide backgrounds)

Use behind UI with heavy left-side gradient scrim. Never place body copy directly on bright forge glow.

### A01 — Homepage hero v0.2 (upgrade)

| Field | Value |
|---|---|
| Filename | `werkles-draft-hero-foundry-v0.2.png` |
| Aspect | 16:9 |
| Replaces | `werkles-draft-hero-foundry-v0.1.png` on `/` |
| Prompt | Enchanted industrial foundry interior at night, wide cinematic 16:9, blackened steel workbenches in foreground, massive furnace glow in deep background, brushed copper pipe frames and riveted panels, subtle floating brass gauges and dial faces with no readable numbers, faint violet and teal light bleeding through ceiling rafters like aurora through smoke, one distant secret door crack glowing warm amber, premium private workshop for serious builders, moody atmospheric depth, photoreal cinematic lighting, no people, no text |

### A02 — Proof / trust v0.2 (upgrade)

| Field | Value |
|---|---|
| Filename | `werkles-draft-proof-trust-v0.2.png` |
| Aspect | 16:9 |
| Route | `/proof`, home trust section |
| Prompt | Industrial inspection room for trust verification, wide 16:9, row of dark steel tables with brass calipers and stamp tools, green inspection lamp glow suggesting verified signal without readable labels, copper-framed cabinets, violet-teal accent light on edges, private operator cockpit not a courtroom, serious premium mood, no faces, no documents with readable text, no text |

### A03 — Membership / Foundry Dues

| Field | Value |
|---|---|
| Filename | `werkles-draft-membership-dues-v0.1.png` |
| Aspect | 16:9 |
| Route | `/membership` hero |
| Prompt | Brass turnstile and velvet rope leading into a hot foundry floor, wide 16:9, tourists kept outside in cold shadow while warm copper gate opens to inner workshop, democratic membership club energy without luxury hotel cliché, dark steel and copper, restrained violet-teal rim light, no people, no text |

### A04 — Pricing / Armory

| Field | Value |
|---|---|
| Filename | `werkles-draft-pricing-armory-v0.1.png` |
| Aspect | 16:9 |
| Route | `/pricing` hero |
| Prompt | Industrial armory wall of labeled tool drawers and blueprint racks without readable labels, wide 16:9, dark workshop storage for templates and kits, brushed copper drawer pulls, blackened steel cabinets, faint forge glow, organized serious business toolkit atmosphere, no text |

### A05 — Dashboard cockpit

| Field | Value |
|---|---|
| Filename | `werkles-draft-dashboard-cockpit-v0.1.png` |
| Aspect | 16:9 |
| Route | `/dashboard` |
| Prompt | Operator cockpit inside a private foundry, wide 16:9, dark control deck with brass gauges and dossier slots, match deck rail with empty card frames, blackened steel surfaces, copper bezels, subtle violet-teal indicator lights, no readable screens, no people, no text |

### A06 — Crucible verification

| Field | Value |
|---|---|
| Filename | `werkles-draft-crucible-v0.1.png` |
| Aspect | 16:9 |
| Route | `/dashboard/crucible` |
| Prompt | Crucible inspection station with heavy anvil, brass claim stamp, and hammer resting on dark steel table, wide 16:9, trust workflow not for sale, green verification glow accent, copper frame, industrial precision, no readable stamps, no people, no text |

### A07 — People lanes

| Field | Value |
|---|---|
| Filename | `werkles-draft-lanes-v0.1.png` |
| Aspect | 16:9 |
| Route | Home `#people` strip background |
| Prompt | Five distinct workbench stations in one foundry floor receding into depth, wide 16:9, each station subtly different trade tools suggesting builder operator backer connector spark roles, unified copper and steel palette, restrained violet-teal accents, no people, no text |

### A08 — Private intros

| Field | Value |
|---|---|
| Filename | `werkles-draft-intros-v0.1.png` |
| Aspect | 16:9 |
| Route | `/dashboard/intros` |
| Prompt | Two ornate brass door knockers on a heavy private workshop door, wide 16:9, warm amber sidelight, dark steel door plates, intimate business introduction energy without handshake stock photo, no faces, no text |

### A09 — Mobile atmosphere

| Field | Value |
|---|---|
| Filename | `werkles-draft-mobile-atmosphere-v0.1.png` |
| Aspect | 4:5 |
| Route | Mobile hero crops |
| Prompt | Vertical enchanted foundry corridor with copper pipes and distant furnace glow, 4:5 crop, blackened steel walls, violet-teal light in rafters, secret workshop depth, cinematic mood, no people, no text |

### A10 — Panel texture

| Field | Value |
|---|---|
| Filename | `werkles-draft-panel-texture-v0.1.png` |
| Aspect | 16:9 |
| Route | Card/panel backgrounds globally |
| Prompt | Seamless dark smoke metal panel texture with faint etched blueprint grid lines and copper rivets, wide 16:9, subtle repeatable surface for UI cards, low contrast, no text, no logos |

---

## Tier 2 — Wonder layer (character + enchantment)

### W01 — Brass foreman full (MANUAL)

| Field | Value |
|---|---|
| Filename | `public/assets/mascot/brass-foreman-full.png` |
| Size | ~800×1000, transparent PNG |
| Route | `/membership/success` |
| Source | Cut out from `coolowl.png` per `public/assets/mascot/README.md` |
| Prompt | N/A — manual cutout, not Ghost Forge |

### W02 — Brass foreman bust (MANUAL)

| Field | Value |
|---|---|
| Filename | `public/assets/mascot/brass-foreman-bust.png` |
| Size | ~600×600, transparent PNG |
| Route | `/dashboard/crucible`, proof sidebar |
| Source | Crop from W01 |

### W03 — Brass foreman thinking (GENERATE or MANUAL)

| Field | Value |
|---|---|
| Filename | `public/assets/mascot/brass-foreman-thinking.png` |
| Size | ~600×600, transparent PNG |
| Route | Empty states, loading |
| Prompt | Steampunk brass owl inspector in workshop suit with goggles pushed up on forehead, one wing on chin thinking pose, transparent background, character only, no floor shadow, copper goggles, tool belt, friendly serious expression, no text |

### W04 — Secret door glow

| Field | Value |
|---|---|
| Filename | `werkles-draft-secret-door-v0.1.png` |
| Aspect | 3:4 |
| Route | Home hero aside, onboarding |
| Prompt | Heavy foundry door slightly ajar with violet-teal light leaking through crack and warm copper frame, vertical 3:4, magical but industrial, no readable signs, no people, no text |

### W05 — Forge elevator gate

| Field | Value |
|---|---|
| Filename | `werkles-draft-elevator-gate-v0.1.png` |
| Aspect | 3:4 |
| Route | Membership featured plan card |
| Prompt | Ornate copper elevator gate in industrial foundry shaft, vertical 3:4, brass lattice pattern, warm amber backlight, stepping into the foundry energy, no people, no text |

### W06 — Match deck carousel

| Field | Value |
|---|---|
| Filename | `werkles-draft-match-deck-v0.1.png` |
| Aspect | 16:9 |
| Route | `/dashboard` match deck panel |
| Prompt | Brass dossier carousel mechanism with empty card slots on dark steel deck, wide 16:9, subtle violet-teal edge lighting, partner matching machine aesthetic without casino vibes, no readable cards, no text |

---

## Tier 3 — Micro icons (64×64 and 128×128 PNG, transparent)

Generate as single centered object on transparent or very dark background. Cursor will resize in UI.

### Lane sigils

| Filename | Prompt |
|---|---|
| `icon-lane-builder-v0.1.png` | Single brass hammer with tiny spark, icon centered, transparent background, copper and steel, no text |
| `icon-lane-operator-v0.1.png` | Single brass gear overlapping calendar plate, icon centered, transparent background, no text |
| `icon-lane-backer-v0.1.png` | Single fuel canister or runway tank in brass, no dollar sign, transparent background, no text |
| `icon-lane-connector-v0.1.png` | Single network node with connecting wires in copper, transparent background, no text |
| `icon-lane-spark-v0.1.png` | Single unlit fuse catching flame tip in brass holder, transparent background, no text |

### Nav / section icons

| Filename | Prompt |
|---|---|
| `icon-proof-v0.1.png` | Brass inspection stamp and shield, transparent background, no text |
| `icon-dues-v0.1.png` | Brass membership token or turnstile coin, transparent background, no text |
| `icon-armory-v0.1.png` | Small armory drawer pull with tiny blueprint scroll, transparent background, no text |
| `icon-deck-v0.1.png` | Stack of brass dossier cards, transparent background, no text |
| `icon-dossier-v0.1.png` | Closed brass dossier folder with copper clasp, transparent background, no text |
| `icon-blueprint-v0.1.png` | Rolled blueprint tube with copper cap, transparent background, no text |
| `icon-knock-v0.1.png` | Brass door knocker, transparent background, no text |
| `icon-register-v0.1.png` | Brass cash register drawer closed, no readable numbers, transparent background, no text |

### How-it-works steps

| Filename | Prompt |
|---|---|
| `icon-step-dossier-v0.1.png` | Open dossier folder with blank papers, brass, transparent background, no text |
| `icon-step-fit-v0.1.png` | Brass calipers measuring fit, transparent background, no text |
| `icon-step-knock-v0.1.png` | Brass knocker mid-swing on door plate, transparent background, no text |

### Crucible check stamps (match pricing.crucible keys)

| Filename | Prompt |
|---|---|
| `icon-check-identity-v0.1.png` | Brass ID stamp, transparent background, no text |
| `icon-check-funds-v0.1.png` | Brass asset vault stamp, transparent background, no text |
| `icon-check-license-v0.1.png` | Brass license plate stamp, transparent background, no text |
| `icon-check-employment-v0.1.png` | Brass employment ledger stamp, transparent background, no text |
| `icon-check-reference-v0.1.png` | Brass reference seal stamp, transparent background, no text |

### Trust status badges (no baked text)

| Filename | Prompt |
|---|---|
| `badge-plate-trust-v0.1.png` | Empty copper badge plate with owl-eye green rim, transparent center for CSS label, no text |
| `badge-plate-verified-v0.1.png` | Copper badge with green check notch, no text |
| `badge-plate-pending-v0.1.png` | Copper badge with amber pending notch, no text |
| `badge-plate-weight-v0.1.png` | Copper badge with heavy weight symbol, no text |

---

## Tier 4 — Brand marks (restore or regenerate separately)

These paths are referenced in app code but may be missing locally. **Not part of Ghost Forge draft batch** — requires brand approval gate.

| Filename | Notes |
|---|---|
| `public/assets/werkles-word-only.png` | Wordmark |
| `public/assets/werkles-brand-plate.png` | Hero brand plate |
| `public/assets/werkles-trust-badge-plate.png` | Trust badge plate |
| `public/assets/werkles-app-icon-board.png` | Favicon / app icon |
| `public/assets/brand/werkles-helper-avatar.png` | Legacy helper owl — brand mark, not Brass |

---

## Generation order (recommended)

1. A01, A02 upgrades (biggest visual lift)
2. W01, W02 manual cutouts (warmth/magic ROI)
3. A03–A10 one at a time
4. W04–W06 wonder accents
5. Lane sigils + nav icons in pairs (watch rate limits)
6. Crucible + step + badge icons last

---

## Handoff back to Cursor

When assets land, tell Cursor: `ASSETS_LANDED v0.2`

Cursor will:

- Wire atmosphere files into route heroes via `app/globals.css` and page classes
- Place icons in lane strips, nav, crucible cards, and step lists
- Integrate Brass bust/full per mascot README
- Run typecheck/build and route smoke on `ben-sandbox`

Do not treat any output as final brand approval until Ben says so.

---

## P0 addendum — Maker hook engine (Cursor wired)

These assets unblock the homepage dynamic hero (session hooks + workbench backdrops). Generate **before** A03–A10 if Ben wants live preview without CSS fallbacks.

### P0-A — Trust badge plate (text-free)

**Filename:** `werkles-draft-trust-plate-v0.2.png`  
**Path:** `public/assets/draft/ghost-forge/`  
**Use:** Optional replacement for CSS trust badge on hero + ops card. **No baked text.** Copper frame, green accent glow, steel table hint. 16:9 or 3:2, dark foundry floor.

### P0-B — Workbench hook crops (5)

Square or 4:3 crops, dark copper foundry, **no text**, subtle tool/anvil/steel detail. Each distinct mood (morning steam, brass register, owl silhouette optional, proof table, lane sigil hint).

| File | Filename |
|------|----------|
| 01 | `werkles-draft-workbench-hook-01.png` |
| 02 | `werkles-draft-workbench-hook-02.png` |
| 03 | `werkles-draft-workbench-hook-03.png` |
| 04 | `werkles-draft-workbench-hook-04.png` |
| 05 | `werkles-draft-workbench-hook-05.png` |

Until landed, Cursor falls back to hero v0.1 / proof v0.1 paths in `copy.hooks.workbenchBackdrops`.

### Easter egg (copy only — no asset)

Nav order **People → How → Proof** in one session swaps hero eyebrow/trust line per `copy.hooks.easterEgg`. Ben approves Tier 2 voice on the 20 variants separately.
