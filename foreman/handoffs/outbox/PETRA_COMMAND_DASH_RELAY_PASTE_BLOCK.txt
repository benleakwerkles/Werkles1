# TO_PETRA — Command Dash to Aeye Relay Proof

**Packet ID:** `cmd_dash_relay_proof_0001`
**Source:** Command Dash / ThinkIt / TinkerDen
**Target Aeye:** PETRA
**Dispatch class:** AUTO_LOAD_HUMAN_SEND
**Receipt required:** Y
**Return destination:** TinkerDen Intake / Speaker

---

## Intent

Prove Command Dash, ThinkIt, and TinkerDen can prepare an Aeye relay packet without making Ben the bus.

## Context

Prove Command Dash, ThinkIt, and TinkerDen can prepare an Aeye relay packet without making Ben the bus.

## Next Action

Petra validates the relay packet and returns a receipt to TinkerDen Intake.

## Evidence Required

- Aeye response returned as FROM_* receipt
- Operator manual Send confirmation if loaded into external chat

## Unresolved Fields

- none

## Human Gates

- Operator must paste/send manually in external Aeye chat

## Failure Condition

No Aeye receipt returns, or packet is sent without operator manual Send.

## Manual Send Boundary

This packet may be loaded into a workspace or clipboard. It must not be auto-sent.
The Operator must paste/send manually.
