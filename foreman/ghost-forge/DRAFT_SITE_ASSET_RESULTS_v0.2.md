# Draft Site Asset Results v0.2

Status: **GATES 01–04 COMPLETE — batch review ready**

Handoff packet: `foreman/handoffs/outbox/TO_CODEX_GHOST_FORGE_ICONS_FIRST_v0.2.md`

## Summary

| Phase | Target | Completed | Notes |
|-------|--------|-----------|-------|
| A — Lane sigils | 5 icons | **5 on disk** | Gate 01 complete |
| B — Nav icons | 8 icons | **8 on disk** | Gate 02 complete |
| C — Step icons | 3 icons | **3 on disk** | Gate 03 complete |
| D — Hero atmosphere v0.2 | 2 files | **2 on disk** | Gate 04 complete (A01, A02) |
| E — v0.1 recovery | 2 files | 2 | hero + proof v0.1 already on disk |

## Gate 01 execution (Sally)

| Icon | Batch ID | File | Gen status | Ben review |
|------|----------|------|------------|------------|
| builder | `4b82d53d-2934-4be5-86d0-72a5ca4501e6` | `icon-lane-builder-v0.1.png` | landed | **POSSIBLE** |
| operator | `e62bca3e-a8ef-4e75-8944-2e1acd1e31ce` | `icon-lane-operator-v0.1.png` | landed | **POSSIBLE** |
| backer v1 | `02e46040-d942-4e41-a5a7-4bbefe033def` | — | removed | **REJECTED** (fuel can) |
| backer v2 | `07fe45a8-9b50-4a0a-8f1d-d08d0bc8e323` | `icon-lane-backer-v0.1.png` | landed | **pending review** |
| connector | `073b3d2b-1410-4e16-967f-7e8d0b126121` | `icon-lane-connector-v0.1.png` | landed | **pending review** |
| spark | `47a4c896-2cb5-4c10-8bb5-0e54fdae7b25` | `icon-lane-spark-v0.1.png` | landed | **pending review** |

## Gate 02 execution (Sally)

| Icon | Batch ID | File | Gen status | Ben review |
|------|----------|------|------------|------------|
| proof | `b64e8595-7d2c-470d-8949-2b7c8f474060` | `icon-proof-v0.1.png` | landed | pending |
| dues | — | `icon-dues-v0.1.png` | landed | pending |
| armory | — | `icon-armory-v0.1.png` | landed | pending |
| deck | — | `icon-deck-v0.1.png` | landed | pending |
| dossier | — | `icon-dossier-v0.1.png` | landed | pending |
| blueprint | — | `icon-blueprint-v0.1.png` | landed | pending |
| knock | `eef2aeca-ffdf-4fec-abde-c754e9a63623` | `icon-knock-v0.1.png` | landed | pending |
| register | `b8f03b94-37d4-4b4a-8752-d3ab8de1b282` | `icon-register-v0.1.png` | landed | pending |

## Gate 03 execution (Sally)

| Icon | Batch ID | File | Gen status | Ben review |
|------|----------|------|------------|------------|
| step-dossier | `f56d8184-dc27-493b-9601-1d5b82706f91` | `icon-step-dossier-v0.1.png` | landed | pending |
| step-fit | `3d9947d7-2a04-4032-b4ea-2b29b8ea496a` | `icon-step-fit-v0.1.png` | landed | pending |
| step-knock | `2e3384ec-63e0-4929-8d15-8b9e5db62a9f` | `icon-step-knock-v0.1.png` | landed | pending |

## Gate 04 execution (Sally)

| Asset | Batch ID | File | Gen status | Ben review |
|-------|----------|------|------------|------------|
| A01 hero | `5f676801-cfb0-49e4-8dac-8dc3c1ba34ab` | `werkles-draft-hero-foundry-v0.2.png` | landed | pending |
| A02 proof | `ff03a852-e47b-404c-b56b-be7bc6ef250b` | `werkles-draft-proof-trust-v0.2.png` | landed | pending |

Estimated spend (Gates 03–04): **~$1.00**

## Budget notes

- 2026-05-29: 402 cleared after env reverification; generation resumed.
- 2026-05-29: Gate 02 `register` hit **429** after 7/8 nav icons; background retry landed `icon-register-v0.1.png`.
- 2026-05-29: **Gate 05 blocked (402)** on first logo request — check Render `DAILY_BUDGET_USD` (needs ≥ `$5`, recommend `$10` for 40-image style batch) and today's spend row in Supabase. Scripts ready: `ghost-forge-gate-05-style-variants.ps1`.

## Gate 05 — style variants (queued)

Status: **BLOCKED on 402** — scripts + review grid wired; run when budget opens.

| Style | Assets | Count |
|-------|--------|-------|
| line / enamel / blueprint / etched | logo W + 5 lanes + 3 nav + 1 step | 40 total |

See `foreman/ghost-forge/GATE_05_STYLE_VARIANTS.md`

## Ben draft review

- **builder** — POSSIBLE
- **operator** — POSSIBLE
- **backer v2** — review at `#people`
- **connector** — review at `#people`
- **spark** — review at `#people`
- **Gate 02 nav set** — review full 8 at `#forge-preview`
- **Gate 03 step icons** — review at `#how`
- **Gate 04 atmosphere v0.2** — A01 hero + A02 proof at `#forge-preview`

Not final brand lock.

---

## Gate 05 execution (partial — 2026-05-29)

**Status:** STOPPED at **12/40** on **429 rate limit** (`Ghost Forge batch request rate limit exceeded`).

**Failed at:** `[13/40] enamel/connector`

**Landed (12):**
- 4× logo-w (line, enamel, blueprint, etched)
- 8× lane icons (line set complete; enamel builder/operator/backer)

**Blocker:** Render `MAX_BATCH_REQUESTS_PER_HOUR` — resume remaining **28 assets** after rate window (~1 hour from stop at 22:01 UTC).

**Resume:** re-run Gate 05 phases for missing assets only, or full script after window clears.

Log: `foreman/ghost-forge/gate-05-style-variants-run.log`

## Ben review pass (2026-05-29 — live preview)

**Header lockup:** Current **W + erkles** combination is the **clear winner**. Do not chase style-variant W marks for header unless Ben reopens.

**Logo style:** **Enamel** direction liked for logos but **not crisp/done enough yet** — regen or refine before promotion; not final.

**Micro / nav icons:** Ben knows policy is not hyper-real micro at nav size, but **favorites for imagery/coloration** (carry mood even if style simplifies):
- leaning / purple **hammer** (builder-adjacent)
- **book** (dossier)
- **knocker**

**Atmosphere plates:** Room for **all landed plates + more**, with **rotation over time** for site dynamism (prior Ben ask). Presentation fix — not wash-out scrims alone:
- balance text against plates, **or**
- put **paper bubbles / content chunks in front** of atmosphere so plates feel intentional, not afterthought/ephemeral background.

Not final brand lock. Maker: hold header lockup; defer enamel logo promotion; atmosphere = stronger foreground panels + selective rotation (future pass).

---

## Handoff to Cursor

`ASSETS_LANDED v0.2` — Gates 01–04 complete (16 icons + 2 atmosphere v0.2 on disk).
