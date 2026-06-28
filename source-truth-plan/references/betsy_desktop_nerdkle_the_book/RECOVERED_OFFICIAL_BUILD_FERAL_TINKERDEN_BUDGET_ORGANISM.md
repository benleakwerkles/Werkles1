# RECOVERED OFFICIAL BUILD — Feral/TinkerDen Budget Organism

## Status
Recovered from the June 26, 2026 pasted build trace. This is the closest found artifact to the “budget build of the organism.”

## Governor Read
This is not the whole Body/Nerdkle. It is the budget organism cockpit / membrane:

- **Feral Tinkularity** = control membrane / cockpit.
- **TinkerDen** = execution engine / muscle.
- **Strategy** = wrap TinkerDen, do not replace, do not greenfield.
- **Build surface** = dashboard-style web app with fixed shell and adaptive center workspace.

## Official Build Shape

### Fixed Shell
- Global header
- Lexical Governor toggle
- Rejoin Shadow control
- Graveyard receipt counter
- Friction gauge
- Context ribbon
- Drift Log footer

### Primary Objects
- Intent
- Receipt
- Doctrine
- Action
- Branch
- Friction State

### Primary Views
- Map
- Draft
- Review
- Compare
- Drift Log

### Five Membrane Modes
- Explore
- Build
- Strain
- Risk
- Drift

### Design Style
- Dark-neutral base
- One organism accent, likely teal/green
- Compact typography
- Provenance badges everywhere
- Event blocks / intent cards / branch markers instead of chat bubbles
- “High friction detected,” not diagnosis language
- Flight deck, not sci-fi poster

## Red-Team Corrections

### Lexical Governor
The additive formula is rejected. Continuity and cooperation are not summed.

Correct rule:
- One term is a hard constraint.
- The other is the objective.
- Operator sets the rank.

### Endocrine / Telemetry
The action-scorer is demoted to telemetry aggregation. It may emit risk/friction deltas but must not generate purpose.

### Vulture / Graveyard
No hard delete. Obsolete or garbage context goes to the Graveyard ledger with a receipt.

### Starfish / Self-Healing
Self-healing may propose a patch. It may not apply one without the operator gate.

### Platypus / Task Simplification
Friction-driven simplification is an offering. It may not silently take over tasks.

## Known Poison Still Present In Source
The recovered source still contains legacy unsafe language in places:

- “Operator Path (LIVE)” for risky/destructive actions.
- “Orgasm-defined constraint.”
- Casual “[Force Live]” button language.
- Over-broad native TinkerDen UI deprecation language.

Corrected requirement:
- For risky/destructive actions, left pane should be **Operator Intent / Staged Path**, not live execution.
- “Force Live” must require receipt.
- “Orgasm-defined constraint” becomes **Organism-defined constraint**.
- Native TinkerDen UI deprecation is not V1 scope.

## Implementation Notes Recovered
- Frontend state store: Redux/Zustand.
- Single source of truth for membraneMode, lexicalRank, and shadowBranch.
- TinkerDen integration via REST/gRPC client.
- Shadow commands go to mock/dry-run path.
- Rejoin Shadow triggers merge/replay into TinkerDen.
- Telemetry uses keystroke timing/cursor position locally, then aggregated drift logs.

## Actual Current Blocker
The UI design handoff is logically complete, but implementation cannot proceed safely until the backend contract exists.

## Next Required Packet

### BIRD #002 — FERAL_TINKERDEN_CONTRACT

Owner:
- Ender@Doss or Ender backend/systems owner
- Thufir validates merge semantics

Mission:
Define the minimal API wrapper for Feral/TinkerDen Risk + Drift states.

Required endpoints:
- `POST /v1/action/dry_run`
- `POST /v1/action/shadow_merge`
- `GET /v1/receipt/{id}`

Evidence required:
- OpenAPI v3 YAML or gRPC proto committed to `tinkarden/contracts/`
- Validation script proving UI event blocks map to API fields

Failure condition:
- If dry_run output is not 1:1 comparable with live execution, Rejoin Shadow is fake safety.
- If merge can partially apply without a full receipt, Graveyard/receipt continuity breaks.

## Current Build Verdict
CONDITIONAL GO.

Build the membrane/cockpit and API contract first.
Do not expand into full Body/Nerdkle until packet/receipt transport is real.
