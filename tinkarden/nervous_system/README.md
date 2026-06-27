# Tinkarden Nervous System Organs V0

This branch preserves three local Nerdkle/Tinkarden organs as auditable source artifacts.

## Organs

- `swateyes.js`: deterministic immune classifier. Returns `GNAT`, `MOSQUITO`, `WOUND`, or `FRACTURE`.
- `fleyes.js`: lymphatic mule-labor sensor. Reports `STALLED` and `CHURN`; it does not heal or delete.
- `ender_apoptosis.js`: scheduled filtration. Deletes stale non-doctrine `dry_run` cache rows and quarantines old unread packets for review.

## Proof Boundary

This branch proves code presence and deterministic self-test behavior. It does not prove production organism life until real production inputs exist:

- `circulation.db`
- Wormeyes `world_state.json`
- production outbox/readback surfaces

## Human Gate Boundary

`ender_apoptosis.js` refuses to delete rows targeting `docs/` unless an `operator_signature` is present.

## Source Truth Boundary

GitHub `origin/main` remains canonical. This branch is a preservation/review branch until explicitly promoted.
