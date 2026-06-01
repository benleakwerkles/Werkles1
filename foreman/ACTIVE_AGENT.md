# Active Agent

## Active Writer
**Maker (Cursor)** — Gate 05 style-variant batch in flight; Ghost Forge diagnostics/batches inside `foreman/BUDGET.md`.

**Ben (Sally)** — Squibb cutout when ready; restore Cursor **Run Mode → Allow Everything** if routine probes start prompting again.

Codex optional for Ghost Forge logging only. No browser MCP repair.

## Execution Context

The active writer must declare its execution context before file-system, repo-state, runtime, or deployment claims, per `foreman/EXECUTION_CONTEXT_RULES.md`. A `CURSOR_CLOUD_CONTAINER` writer can act on `/workspace`, GitHub branches/PRs, and committed state, but must request a `LOCAL_SALLY_WINDOWS` check for any Sally-local filesystem, `.env`, or dev-server evidence rather than claiming it directly.

## Known failure mode (2026-05-29)

Cursor/Maker settings may revert from **Allow Everything** to **Allowlist**. If routine non-gate actions begin prompting again, first check **Cursor Settings → Agents → Run Mode** before changing doctrine.

## Approved (2026-05-28)
- Site style v0.6 → `foreman/SITE_STYLE_APPROVED_v0.6.md`
- One canonical Squibb → `foreman/MASCOT_RULES.md`
- Batch v0.2 direction → `foreman/ghost-forge/DRAFT_SITE_ASSET_BATCH_v0.2.md`

## Ben runs next
1. Squibb cutout → `public/assets/mascot/`
2. Confirm Cursor **Run Mode = Allow Everything** after updates (see Known failure mode above)

## Maker runs now
1. **Gate 05** — `.\scripts\foreman\ghost-forge-gate-05-style-variants.ps1 -Phase all` (in progress)
2. Log → `foreman/ghost-forge/gate-05-style-variants-run.log`
3. Wire Squibb bust when PNGs land

## Preview
`npm.cmd run dev` → http://localhost:3000
