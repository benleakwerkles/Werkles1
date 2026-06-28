# FROM_ENDER — TINKERDEN_UI_SALVAGE_MAP_RECEIPT

**Mission:** Define the UI salvage map for Cockpit becoming TinkerDen. No code. No redesign from scratch.
**Keeper:** Cockpit (TinkerDen is Cockpit *evolved*, not a rebuild).
**Reviewer:** Petra · **Decision owner:** Ben
**Status:** MAP — provisional; gated behind preservation proof (§8).

## INPUTS — honesty first
- "Ben audit": I'm treating this as the **BEN_MEMORY_EXTRACTION** packet from this session. If you meant a different Ben-authored UI audit, name it and I'll re-anchor.
- "Branch salvage audit": **not in hand.** It isn't uploaded and isn't in my context. Anything that depends on *which branch/commit holds which salvageable UI* is marked `[NEEDS: branch salvage audit]` below — I won't invent branch names or commits.
- Live screens: I have **no** Cockpit, TinkerDen-preview, Field Mode, Inbox/Outbox, or Human-Gates screenshots. So every "keep visually" / "steal structurally" item is mapped from your descriptions + doctrine and is **provisional until §7 screenshots prove it exists and works.** That is exactly what §8 governs.

This map is therefore safe to reason from, not yet safe to build from.

---

## 1. WHAT TO KEEP VISUALLY (Cockpit → TinkerDen)
Provisional pending §7. Keep the *form*, not necessarily the current pixels:
- **Card-based at-a-glance layout.** Status legible without drilling in. This is the keeper's core virtue.
- **The Bridge / Top-3 focal structure.** A small number of foregrounded moves, not a wall of tickets.
- **The 2 / 10 / 60-second attention tiering.** Glance reads state in 2s; orient in 10s; act in 60s. Preserve that gradient explicitly.
- **Warm forge palette, not cold enterprise.** Copper/patina warmth as frame role; violet (`#3D16CA`) + teal (`#02917E`) as the hero brand (per v0.2). No pure white/black.
- **Mission Control (WHY) sitting above the Bridge (WHAT).** Keep the why-layer visible, not buried.
- **AA contrast as a hard floor.** The keeper's known defect is soft-text-on-soft-background; keeping the layout means *not* keeping that bug — body ≥4.5:1, large/UI ≥3:1.

## 2. WHAT TO STEAL STRUCTURALLY
- **Inbox/Outbox status visibility.** Lift the `foreman/handoffs` lifecycle into the surface: every packet shows its state (OPEN · BLOCKED · NEEDS_RECEIPT · RESOLVED · ARCHIVED) and its blocker. Pull-only.
- **Human Gates taxonomy as a first-class UI concept.** Gates aren't a modal afterthought; they're a visible class of object (`[AWAITING HUMAN GATE: X]`), with the gate class shown (deploy / secrets / irreversible / doctrine-change). Decision owner visible on each.
- **Packet cards/buttons language.** `FROM_[AGENT]` cards; the recommendation-card verbs **PROCEED / DEFER / KILL**; reason-attached. One shared vocabulary across packet, recommendation, and gate cards.
- **The TinkerDen-preview command-center feel.** The Top-3 Moves surfaced from the medulla `recommendation_cards.json` — the "what does the organism want next" framing, not "what ticket is next." Steal the feel; verify the preview actually renders real cards (§7).
- **Field Mode mobile affordances (if useful).** Safe/reversible actions only on Duck; pull-only; irreversible actions are *shown but not executable* from mobile (routed to a desktop gate). Keep only the affordances that survive that constraint.

## 3. WHAT TO KILL
Each kill is the no-theater rule applied; all are consistent with the graveyard audit.
- **Goop as Cockpit direction** — organic-blob visual direction. Kill; it fights legibility and the command-center read.
- **Wonka Mood as product direction** — whimsy as the product's voice. Kill. (WonkaDen was already buried in the name-sprawl corpse list. The only sanctioned whimsy remains the single "Blathering Blatherskites" easter egg.)
- **Fantasy-site direction** — RPG/secret-society theming that obscures function. Kill; it's the same defect flagged on the homepage (mood over what-it-does).
- **Old Foreman / GimpDash product direction** — the Brass-foreman lineage and the GimpDash dashboard. Kill as product direction (Foreman-owl is already a graveyard corpse, superseded by Squibb-the-scout).
- **Fake buttons without dispatch/receipt** — THE kill. Any control that doesn't dispatch to a real `Aeye@Machine` and emit a receipt is theater. It either becomes actionable (§4) or becomes display-only or is removed. (The dead-click audit flagged **Assimilate** as the highest-risk instance — verify it first.)

## 4. WHERE BUTTONS/CARDS SHOULD BECOME ACTIONABLE
The rule, then the application.

**Rule — a control may be actionable only if all three hold:**
1. it dispatches to a real `Aeye@Machine` target (§5),
2. it emits a receipt (proof-of-work, traceable),
3. it is Human-Gated if the action is irreversible/deploy/secrets/doctrine.
If 1–3 can't be met, the element is **display-only** (a status, not a control) or it's killed. No middle state.

**Application (confirm exact inventory via §7 — the current 8 TinkerDen buttons):**
- **Assimilate** — known highest-risk. Should become actionable *only* once it provably dispatches an assimilation into Speaker **and** writes a receipt. Until then, display-only. Verify first.
- **Dispatch / Send to build** — actionable: routes a packet to its lane target (`Codex@Sally`, `Maker@Betsy`), receipt on send.
- **Push to `salvage/*`** — actionable but `[NEEDS: branch salvage audit]` to define which branches and the safety rules; receipt mandatory; likely Human-Gated.
- **PROCEED / DEFER / KILL** (recommendation cards) — actionable; the operator's decision feeds back into the medulla weights and is logged (this is the line that makes it learn, not just display).
- **Gate approve/deny** — actionable, Human-Gate class by definition; records who/when/why.
- Everything that is currently a button but only *shows state* → demote to display-only. A status is not a control.

## 5. Aeye@Machine TARGET SELECTOR RULES
Every dispatch names its target explicitly on the card (`Maker@Betsy`, `Codex@Sally`, `Dink@Duck`) — no hidden routing; the operator sees who/where before dispatch.

1. **Lane routing.** Build/repo/apply → Codex/Cursor `@Sally`. UI/design packets → Maker `@Betsy`. SQL helper → DeepSeek `@Sally` (local, no-copy). Research/red-team → Skybro/Thufir. Doctrine assimilation → Speaker. Critique/selection → Ender.
2. **Machine capability constraints (hard).** `Sally` = build/repo/terminal, **no image-gen** (cloud only). `Betsy` = operator workstation. `Duck` = Field Mode, **safe/reversible only** — never deploy/secrets/irreversible. `Doss` = daemon/medulla host (background; not an interactive human-dispatch target).
3. **Gate class overrides target.** Irreversible / deploy / secrets / doctrine-change dispatches require a Human Gate *before* execution regardless of which Aeye@Machine is selected. Agent proposes; Ben disposes.
4. **Pull-only.** The selector surfaces a dispatch as a candidate; it never auto-fires. Sole exception: a genuine Human Gate may push to `Duck`.
5. **Receipt-mandatory.** Every dispatch on every target emits a receipt. A target with no receipt path is invalid — this is the §3 fake-button kill, enforced at the selector.
6. **Field Mode filter.** On `Duck`, the selector offers only safe/reversible targets+actions; irreversible ones render visible-but-disabled and route to a desktop gate.

## 6. COZY COMMAND-CENTER NOTES
"Pleasant" is operational, not decorative (per the Tinkularity UX law): the surface should reduce panic, friction, repetition, and forced remembering — carry continuity so the operator stays human.
- **Calm, not alarm.** Default state is quiet. Color/heat escalates only for things that are genuinely live (a real gate, a real blocker) — never as ambient decoration.
- **Top-3, not the firehose.** Foreground the few moves that matter; the backlog is reachable, not shoved at the operator.
- **The surface remembers so the operator doesn't.** State, context, and "where we left off" persist on the card — no reconstructing from memory each session.
- **Warm, not sterile.** Porch-setup warmth; the forge palette read as inviting workshop, not enterprise SaaS.
- **WHY above WHAT.** Mission Control answers "what future are we building"; the Bridge answers "what's the next move." Cozy comes from the operator always seeing the why, so the work never feels like blind ticket-clearing.
- Cozy ≠ cute. No mascots in prime real estate, no whimsy as voice (see §3).

## 7. SCREENSHOTS NEEDED (to validate the map and satisfy §8)
I'm mapping blind on the visuals. To confirm "keep/steal" and to prove preservation, I need:
1. **Current Cockpit/SoleDash main view** — to confirm the card layout, Top-3 structure, and attention tiering are real and worth keeping.
2. **TinkerDen-preview command-center** — to confirm it renders *real* recommendation cards (not placeholder), and the "command-center feel" exists.
3. **The 8 TinkerDen buttons, esp. Assimilate** — each showing current behavior: does it dispatch? does it produce a receipt? (Determines §4 actionable-vs-display-vs-kill.)
4. **Inbox/Outbox status view** — to confirm packet states + blockers are actually surfaced.
5. **Field Mode / Duck view** — to confirm which mobile affordances exist and whether they respect safe/reversible-only.
6. **Any Human Gates UI** — to confirm the taxonomy is represented and the decision owner is shown.
If a screen doesn't exist yet, say so — its absence is itself a finding for §8.

## 8. NO IMPLEMENTATION UNTIL PRESERVATION IS PROVEN
This map is a plan, not a build order. Before any code, each "keep" and "steal" element must be proven on two axes:
- **Exists** — visible in a §7 screenshot (or the live screen), not assumed from memory.
- **Works** — for anything actionable, a verified dispatch→receipt round-trip. A button that doesn't produce a receipt is not "kept," it's killed (§3).
Only elements that pass both are authorized to carry forward. No-theater: we do not preserve what we haven't proven is real and functional. Proof of preservation is the gate that turns this map into a build packet.

---

## RECEIPT
- **Artifact:** `TINKERDEN_UI_SALVAGE_MAP_RECEIPT` (this file) · **Author:** Ender · **For:** Ben · **Reviewer:** Petra
- **Sections delivered:** 1–8 ✓
- **Inputs used:** BEN_MEMORY_EXTRACTION (as "Ben audit") + project doctrine.
- **Inputs missing:** branch salvage audit `[NEEDS]`; all §7 live screens `[NEEDS]`.
- **Status:** MAP, provisional. Not a build order. Gated by §8 (prove-before-build).
- **Routing limitation:** filed to outputs; I can't write to TinkerDen/Cockpit or run the dispatch/receipt checks myself — validation is yours.
