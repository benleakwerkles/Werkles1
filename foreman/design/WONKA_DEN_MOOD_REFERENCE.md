# WONKA_DEN_MOOD_REFERENCE

**Mission:** SPANZEE · WONKA_DEN_MOOD_REFERENCE  
**Status:** DRAFT / review-only — not brand lock  
**Facet:** `workshop-facet--wonka` (Connector lane)  
**Immersion north stars:** Black Desert (ornate diegetic menus) · GTA (world-embedded UI) · Dark Souls (weight, inspect, restraint)

---

## What The Den is

The Den is the Connector’s private inventor nook inside the same Werkles building — not a throne room, not an enterprise dashboard, not a spaceship cockpit. It is a **hobbit-hole workshop**: low ceiling energy, round corners, warm desk lamp, papers pinned at odd angles, tools hung where a hand would reach, half-finished gadgets that imply motion without spectacle.

UI should feel **lived-in and inspectable**, like opening a drawer in a game world rather than loading a SaaS module.

---

## Hard rejects

| Reject | Why |
|--------|-----|
| Throne / command chair | Connector is pulse, not monarch |
| Enterprise dashboard grids | Kills invention; reads as BI tool |
| Spaceship cockpit HUD | Wrong genre; cold glass and neon rails |
| Full-screen data walls | Den is intimate; information is scattered on surfaces |
| Pure white SaaS cards | Breaks workshop paper + lamp warmth |

---

## 10 visual notes

1. **Desk lamp as primary light source** — One warm pool (`--den-lamp-core`, ember/brass) on the working surface; everything else falls into workshop-night shadow. No even studio lighting.

2. **Hobbit-hole geometry** — Rounded arch frames, inset alcoves, slightly bowed shelves. Corners are soft; nothing is razor-rectilinear. Panels feel carved from wood and plaster, not floated on gray.

3. **Paper archaeology** — Maps, napkins, torn printouts, blueprint scraps layered with overlap and tape corners. Typography is ink-on-paper (`--werkles-ink-on-paper`), never glowing HUD text.

4. **Tools before chrome** — Calipers, spools, soldering ghosts, brass knobs, labeled drawers with **no readable labels** in imagery. Metal is copper/brass frame only; violet/teal stay rare “invention sparks,” not dashboard accents.

5. **Gadgets in media res** — Half-wound clocks, string-and-pulley sketches, a jar of parts. Objects imply story; they do not animate like a slot machine.

6. **Black Desert ornament discipline** — Borders have filigree weight: double rules, corner studs, embossed edges. Ornament frames content; it never replaces content. Menus feel like opening a ledger, not a modal.

7. **GTA diegesis** — Navigation is physical: “on the desk,” “on the pegboard,” “in the tin.” The match deck is a **stack of cards on felt**, not a carousel widget. Status is a grease pencil tick, not a pill badge.

8. **Dark Souls inspect pacing** — Selecting a candidate opens an **inspect sheet** with stillness: name, lane, proof lines, one deliberate action row. No auto-advance; the user chooses to turn the page.

9. **Depth without cockpit glass** — Shallow parallax: lamp glow, paper stack, back shelf. Three planes max. No lens flare, no scanlines, no holographic grid.

10. **Owl at the door, not on the throne** — Mascot may appear in doorway light or as a small brass figurine. The Den belongs to the Connector’s hands; the owl inspects, does not preside.

---

## 5 layout ideas

### 1. The Lamp Desk (default)

```
┌──────────────────────────────────────┐
│  [pegboard nav]     ╭── lamp glow ──╮ │
│                     │  active card  │ │
│  intro stack        │  (inspect)    │ │
│  on felt            ╰───────────────╯ │
│  ─────────────────────────────────── │
│  scrap tray: filters · blueprint pin  │
└──────────────────────────────────────┘
```

Primary work happens in the lamp circle. Nav lives on a vertical pegboard left. Secondary scraps along the bottom tray.

### 2. The Alcove Nook

Round arch contains the whole session. Match deck is a single large card on a slanted drafting board. Actions are brass tabs along the board edge. Background shelves fall to black — BDO menu depth without clutter.

### 3. The String Board

Candidates are pins on cork between red string lines (abstract, not conspiracy). Clicking a pin pulls its **dossier card** down to the desk. Good for “who connects to whom” without graph-dashboard aesthetics.

### 4. The Drawer Index

Lane tools live in labeled drawers (icons only). Opening a drawer slides a panel up from the bottom — GTA phone energy, but mechanical. Match deck stays centered; drawers are contextual tools (intro templates, venue notes, knock copy).

### 5. The Round Table Edge

For intro moments: three seats visible at the bottom arc (you + two candidates). Center is shared paper. Emphasizes Connector as room pulse, not central commander.

---

## 3 interaction ideas

### 1. Inspect hold (Dark Souls)

Press and hold (or long-press on touch) on a candidate card to **inspect** — card lifts 4px, lamp brightens slightly, factor lines expand with lore-like copy. Release returns to stack. Quick tap still advances. Teaches weight without slowing experts.

### 2. Desk scatter navigation (GTA diegetic)

Dashboard nav items are objects: **Profile** = pocket notebook; **Blueprints** = rolled plans; **Intros** = knockers on a small door model; **Crucible** = inspection loupe; **Billing** = receipt spike. Hover wobbles object 1–2°; active item sits in the lamp pool. Same routes — different metaphor.

### 3. Lamp focus sweep

When the user moves between sections, the warm lamp gradient **eases** to the new focal panel over ~400ms (respect `prefers-reduced-motion`). Peripheral panels dim 10%. Signals attention shift like walking the desk with a handheld lamp — not route transition wipes.

---

## Token hooks (implementation)

See `lib/den-atmosphere.ts` and `.den-shell` / `.workshop-facet--den` in `app/globals.css`. Preview route: `/proof/den` (draft review shell).

## Ghost Forge prompt seed (when Gate 05 resumes)

> Cozy inventor hobbit-hole workshop interior, low warm ceiling, round wooden arch, single brass desk lamp pool on scattered papers and blueprints, hand tools and small gadgets on pegboard, copper and walnut tones, faint violet invention sparkle in one jar, deep soft shadows, intimate not grand, no throne, no monitors, no spaceship panels, no readable text, cinematic still, 16:9

---

## Related cockpit

- `foreman/SITE_STYLE_APPROVED_v0.6.md` — brightened workshop baseline  
- `lib/workshop-facets.ts` — `wonka` facet for Connector  
- `foreman/MASCOT_RULES.md` — owl inspects, does not vouch
