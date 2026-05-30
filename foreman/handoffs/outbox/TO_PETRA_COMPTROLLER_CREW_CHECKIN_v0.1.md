# To Petra (ChatGPT Comptroller): Crew Check-In — UI Stable, Functionality Pivot

## Cast (do not confuse)

| Name | Role | Platform |
|------|------|----------|
| **Ben** | Operator — decisions, human gates, brand lock | Sally (local Windows) |
| **Petra** | Comptroller — scope, gates, GO/NO-GO, lane law | ChatGPT / Cockpit / Ayes |
| **Codex** | Foreman — cockpit sync, infra packets, Ghost Forge execution | Not Sally |
| **Maker** | Cursor — bounded UI/app implementation on Sally | Sally |
| **Ghost Forge** | Image worker on Render (`werkles-ghost-forge1`) | Cloud |

**Petra** is the Comptroller seat named in the Cockpit/Ayes ecosystem. Repo doctrine files use **ChatGPT / Comptroller** (`foreman/AI_COUSINS_PROTOCOL.md`).

---

## Status

**READY FOR COMPTROLLER REVIEW** — prepared by Maker on Sally (2026-05-26).

Operator reports home UI atmosphere pass is **stabilizing** (BG/chunk opacity balance improving). Operator requests **crew check-in** before opening APP_INFRA functionality work or resuming asset lanes.

This packet does **not** authorize deploy, push, SQL, secrets, live Stripe products, or new spend.

---

## Read first (cockpit)

| File | Role |
|------|------|
| `foreman/platform-instructions/CHATGPT_PROJECT_INSTRUCTIONS.md` | Comptroller authority |
| `foreman/HUMAN_GATES.md` | Hard stops |
| `foreman/LANES.md` | Approved automation lanes |
| `foreman/BUDGET.md` | Spend caps |
| `foreman/NEXT_ACTION.md` | Current active work |
| `foreman/ACTIVE_AGENT.md` | Single-writer lock |
| `foreman/SITE_STYLE_APPROVED_v0.6.md` | Locked UI direction |
| `foreman/APP_INFRA_UX_START_PACKET.md` | Queued functionality scope |
| `foreman/ghost-forge/DRAFT_SITE_ASSET_RESULTS_v0.2.md` | Asset run log |
| `foreman/gates/APPROVAL_LOG.md` | Ben approvals on record |

**Stale — treat as unreliable until Codex syncs:**

- `foreman/CURRENT_STATE.md`
- `foreman/OPERATOR_DASHBOARD.md`

---

## Problem statement

Werkles has spent recent cycles on **draft site assets + visible UI** (Maker lane). That work is converging. Operator wants to **pivot toward functionality** but needs Comptroller to:

1. Pick the **first APP_INFRA slice** (not open the whole packet at once).
2. Decide whether **Ghost Forge Gate 05** stays parallel or pauses.
3. Classify gates for the chosen slice (Tier 1 / Tier 2, human-only stops).
4. Issue GO / NO-GO and downstream handoffs to Codex and Maker.

---

## Completed since last Comptroller touch

### Approvals (Ben)

| Date | Item | Record |
|------|------|--------|
| 2026-05-28 | Site style v0.6 | `foreman/SITE_STYLE_APPROVED_v0.6.md` |
| 2026-05-28 | One canonical Squibb | `foreman/MASCOT_RULES.md` |
| 2026-05-28 | Ghost Forge batch v0.2 direction | `foreman/ghost-forge/DRAFT_SITE_ASSET_BATCH_v0.2.md` |
| 2026-05-29 | Non-human gate doctrine (budget cleared for approved batches) | `foreman/NEXT_ACTION.md` |

### Ghost Forge assets (Gates 01–04 complete)

- **16 icons** on disk under `public/assets/draft/icons/`
- **Atmosphere v0.2**: hero + proof under `public/assets/draft/ghost-forge/`
- **Ben-pass plates**: workshop interior, conservatory
- Result log: `foreman/ghost-forge/DRAFT_SITE_ASSET_RESULTS_v0.2.md`

### Gate 05 style variants (partial)

| Metric | Value |
|--------|-------|
| Target | 40 images |
| Landed | **12/40** |
| Stop reason | Render **429** rate limit |
| Failed at | `[13/40] enamel/connector` |
| Log | `foreman/ghost-forge/gate-05-style-variants-run.log` |
| Remaining | 28 assets after rate window |

### Maker UI work (local, uncommitted)

- Home hero restored to **Ben workshop interior** plate
- **How** + **Beta** column mash repaired (`WorkshopBandPanel` split/bare layouts)
- Washout reduced; atmosphere plates more visible; smaller paper chunks in front of plates
- New components: `workshop-band-panel`, `workshop-trust-rail`, `workshop-atmosphere`, etc.
- `npm run typecheck` passing
- Preview: `npm run dev` → http://localhost:3000

### Ben live-review notes (not final brand lock)

- **Header lockup:** **W + erkles** is the clear winner — do not chase style-variant W marks for header
- **Enamel logo direction:** liked but not crisp enough — regen when rate limit clears
- **Icon mood anchors:** purple-leaning hammer, book/dossier, knocker
- **Atmosphere:** content in smaller paper chunks in front of plates; rotation over time is desired future pass
- **Reject likely:** `icon-proof-v0.1.png` (readable "INSPECTION" text violates Ghost Forge rules)

---

## Repo state (Sally, 2026-05-26)

- **Branch:** `main` (tracking `origin/main`)
- **Working tree:** large local diff — UI, foreman cockpit, Ghost Forge scripts, draft assets (mostly untracked PNGs)
- **Push:** not done — **human gate**
- **Deploy / SQL / secrets:** not in scope

---

## APP_INFRA slice candidates (from start packet)

Petra should pick **one** bounded slice for the next cycle. Options already scoped in `foreman/APP_INFRA_UX_START_PACKET.md`:

| Slice | Summary | Typical gates |
|-------|---------|---------------|
| **A — Pricing + membership shells** | `/pricing`, `/membership`, checkout route audit, pricing manifest | Stripe env prep; no live products without approval |
| **B — Billing shell** | `/dashboard/billing`, portal route shell | Stripe Customer Portal setup |
| **C — Crucible verification UX** | `/dashboard/crucible`, verification cards, proof page Crucible copy | Bean audit; provider env gates |
| **D — Auth / beta flow** | Beta signup → auth shell wiring (if prioritized over packet order) | Supabase/auth secrets; schema if needed |
| **E — Cockpit sync only** | Codex updates `CURRENT_STATE`, `OPERATOR_DASHBOARD`, `NEXT_ACTION` | No app code — doctrine lane |

Forbidden across all slices unless explicitly opened:

- live Stripe product creation
- deploy, push, SQL/RLS apply
- secrets in chat/repo
- user-to-user payment logic
- treating draft assets as final brand approval

---

## Decisions requested from Petra

Reply with a Comptroller verdict block (see Output Format below).

### Required decisions

1. **First APP_INFRA slice** — A, B, C, D, E, or a narrower custom slice?
2. **Gate 05** — `RESUME` after rate window, `PAUSE` until APP_INFRA slice lands, or `STOP` until brand lock?
3. **UI commit timing** — `PUSH_NOW` (after Ben says push), `HOLD_LOCAL` until brand lock, or `COMMIT_LOCAL_NO_PUSH`?
4. **Codex activation** — `SYNC_COCKPIT_ONLY`, `SYNC_PLUS_HANDOFF`, or `DEFER`?
5. **Maker activation** — stay on UI polish, switch to chosen APP_INFRA slice, or `PAUSE` pending your packet?

### Optional decisions

6. Squibb cutout priority vs functionality?
7. Render worker redeploy for newer endpoints (`/batch/preflight`, `/diagnostics/budget`) — now or defer?
8. Bean audit required before which slices?

---

## Suggested execution order (if GO on functionality)

```text
Petra (scope + gates)
  → Codex (cockpit sync + handoff packet for slice)
  → Maker (implement on Sally inside Lanes file areas)
  → Bean (if trust/billing/verification touch)
  → Ben (human gates only: login, billing, secrets, push, deploy, SQL, brand lock)
```

**Do not** route UI/atmosphere work back to Codex — Maker owns that lane and it is working.

---

## Human gates (reminder)

Per `foreman/NEXT_ACTION.md` (Ben 2026-05-29), **human gates only:**

- login / OAuth
- billing / credit card
- secrets in chat
- push / deploy / SQL / production data mutation
- creative final brand lock
- spend above approved lane caps

Routine health checks, approved Ghost Forge batches inside budget, typecheck/build, and local preview are **not** stop points.

---

## Output format (Petra response)

Petra should reply with:

```text
VERDICT: GO | NO-GO | GO_WITH_CONDITIONS

SLICE: <letter or custom name>
GATE_05: RESUME | PAUSE | STOP
UI_COMMIT: PUSH_NOW | HOLD_LOCAL | COMMIT_LOCAL_NO_PUSH
CODEX: SYNC_COCKPIT_ONLY | SYNC_PLUS_HANDOFF | DEFER
MAKER: UI_POLISH | APP_INFRA_SLICE | PAUSE

CONDITIONS:
- <bullet>

DOWNSTREAM_HANDOFFS:
- To Codex: <one sentence task>
- To Maker: <one sentence task>
- To Bean: <if any>

NEXT_HUMAN_GATE:
- <exact phrase or action Ben must take>
```

Save Comptroller gate artifact per `foreman/FOREMAN_RULES.md` if this slice requires formal gate logging.

---

## After Petra responds

Ben pastes Petra's verdict back to Maker or Codex on Sally:

- **To Codex:** `EXECUTE PETRA VERDICT — <slice>` + this packet path
- **To Maker:** `EXECUTE PETRA VERDICT — <slice>` + Codex handoff when ready

---

## Packet metadata

| Field | Value |
|-------|-------|
| Packet ID | `TO_PETRA_COMPTROLLER_CREW_CHECKIN_v0.1` |
| Prepared by | Maker (Cursor) on Sally |
| Prepared for | Petra (ChatGPT Comptroller) |
| Operator | Ben |
| Date | 2026-05-26 |
| Branch | `main` (local uncommitted work) |
| Stop gate | `[AWAITING COMPTROLLER VERDICT: APP_INFRA_SLICE_AND_CREW_ROUTING]` |
