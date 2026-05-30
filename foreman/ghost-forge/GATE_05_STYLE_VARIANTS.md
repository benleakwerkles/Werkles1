# Gate 05 — Style variant batches

Status: **IN PROGRESS** (autonomous run for Ben review)

Purpose: Give Ben **four distinct icon/logo styles** to compare against v0.1 brass foundry set.

Styles:

| Style | Look |
|-------|------|
| `line` | Minimal copper stroke, transparent |
| `enamel` | Hard enamel pin, glossy copper + violet/teal |
| `blueprint` | Cyan wireframe engineering drawing |
| `etched` | Dark steel plate, copper etching |

Assets per style:

- **Logo:** `werkles-draft-logo-w-style-{style}-v0.1.png` → `public/assets/draft/ghost-forge/`
- **Lanes (5):** builder, operator, backer, connector, spark
- **Nav (3):** proof, knock, dossier
- **Step (1):** step-fit

**Total:** 4 styles × 10 assets = **40 images** (~$8.00 at $0.20/image)

Run:

```powershell
# Full gate (long — ~60 min with pauses)
.\scripts\foreman\ghost-forge-gate-05-style-variants.ps1

# Or by phase
.\scripts\foreman\ghost-forge-gate-05-style-variants.ps1 -Phase logos
.\scripts\foreman\ghost-forge-gate-05-style-variants.ps1 -Phase lanes
```

Single probe:

```powershell
.\scripts\foreman\ghost-forge-variant-from-sally.ps1 -Style line -Asset logo-w
```

Log: `foreman/ghost-forge/gate-05-style-variants-run.log`

Review: `http://localhost:3000/#forge-preview` (Style variants section)

Not final brand until Ben approves.
