# Medulla V0 / TinkerDen Bridge Build Spec

## Verdict

GO for V0.

Build the chooser, not AI hope.

## Scope

One Node process.

No MQTT in V0.

Use Chokidar only.

Write recommendation_cards.json.

TinkerDen reads it.

## Files / Folders

/tinkerden/inbox
/tinkerden/receipts
/tinkerden/doctrine
/tinkerden/feedback
/tinkerden/recommendations/recommendation_cards.json
/tinkerden/feedback/decision-ledger.jsonl
/tinkerden/medulla/medulla.js

## Medulla Responsibilities

- Watch inbox/receipts/doctrine/feedback folders.
- Detect new or changed files.
- Generate candidate recommendation cards.
- Score cards using deterministic, inspectable placeholder rules.
- Write recommendation_cards.json.
- Include heartbeat timestamp.
- Do not call AI.
- Do not make hidden judgments.

## TinkerDen Bridge Responsibilities

Show:

- Current Frontier
- Top 3 Moves
- Move
- Why now
- Momentum gain
- Mule labor reduction
- Cooperation gain
- Continuity gain
- Capacity gain
- Reversibility gate: PASS / FAIL
- Risk / extraction flag
- Composite score
- Swateyes tier + confidence
- Deterministic rule fired, if any
- Recommendation: PROCEED / DEFER / KILL
- Operator controls
- Operator reason box
- Stale-state warning if recommendations heartbeat is old

## Corrected Recommendation Card Schema

{
  "id": "rec_001",
  "created_at": "ISO timestamp",
  "source_path": "string",
  "move": "string",
  "why_now": "string",
  "subscores": {
    "momentum_gain": {"score": 0, "rule": "string"},
    "mule_labor_reduction": {"score": 0, "rule": "string"},
    "cooperation_gain": {"score": 0, "rule": "string"},
    "continuity_gain": {"score": 0, "rule": "string"},
    "capacity_gain": {"score": 0, "rule": "string"}
  },
  "reversibility_gate": {
    "status": "PASS|FAIL",
    "rule": "string"
  },
  "risk_extraction": {
    "score": 0,
    "flags": []
  },
  "composite": {
    "hope": "derived only, not hand-entered",
    "score": 0,
    "formula": "string"
  },
  "swateyes": {
    "tier": "GNAT|MOSQUITO|WOUND|FRACTURE|POISON",
    "confidence": 0.0,
    "deterministic_rule_fired": "string|null"
  },
  "recommendation": "PROCEED|DEFER|KILL"
}

## Required Feedback Loop

Every Operator choice writes:

{
  "timestamp": "ISO timestamp",
  "card_id": "rec_001",
  "operator_decision": "PROCEED|DEFER|KILL",
  "operator_reason": "string",
  "original_recommendation": "PROCEED|DEFER|KILL",
  "score_snapshot": {}
}

This is the first learning loop.

Repeated KILL/DEFER decisions become calibration data.

## Safety Rules

- Reversibility is a gate, not only a score.
- Hope is derived, never hand-entered.
- Swateyes classification is not morality.
- Classifier proposes; gate disposes.
- Deterministic denylist floor overrides scoring.
- No irreversible deletes/deploys/secrets actions in V0.
