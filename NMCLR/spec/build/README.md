# NMCLR First Buildable Slice

Status: **first slice**  
Mission: `NMCLR_BUILD_FIRST_SLICE`  
Owner: Maker@Doss  
Scope: `NMCLR/spec/build/` only

---

## Slice Definition

This slice proves the smallest NMCLR loop:

| NMCLR term | Build proof | File evidence |
|------------|-------------|---------------|
| **Muscle** | Packet causes an action | `fixtures/packet-causes-action.json` -> `work/work-first-slice-action.json` |
| **Breath** | Intake/output cycle completes | runner summary + `receipts/receipt-packet-first-slice-001.json` |
| **Metabolism** | Receipt is converted into next work | `work/next-work-from-receipt.json` |

---

## Run

From repo root:

```powershell
node NMCLR/spec/build/nmclr-first-slice.mjs
```

The runner is dependency-free and writes only inside `NMCLR/spec/build/`.

---

## Pass Criteria

PASS when all are true:

- packet validates required fields: `id`, `cause`, `action`
- action writes a concrete work item
- receipt records the intake/output cycle
- metabolism writes a next-work item derived from the receipt

FAIL when any are true:

- packet cannot be parsed
- packet lacks required fields
- action type is unsupported
- any output path escapes `NMCLR/spec/build/`

---

## Return Shape

```text
FILES:
- NMCLR/spec/build/README.md
- NMCLR/spec/build/nmclr-first-slice.mjs
- NMCLR/spec/build/fixtures/packet-causes-action.json
- NMCLR/spec/build/work/work-first-slice-action.json
- NMCLR/spec/build/receipts/receipt-packet-first-slice-001.json
- NMCLR/spec/build/work/next-work-from-receipt.json

FIRST SLICE:
- muscle = packet causes action
- breath = intake/output/receipt cycle
- metabolism = receipt converted into next work

PASS/FAIL:
- PASS after runner emits pass=true and output files exist.

BLOCKERS:
- None for first local slice.
```
