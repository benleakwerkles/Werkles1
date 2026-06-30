# TO_COMPUTER — TinkerDen API Relay Proof

**Packet ID:** `cmd_dash_api_proof_0001`
**Source:** TinkerDen
**Target Aeye:** COMPUTER
**Dispatch class:** AUTO_LOAD_HUMAN_SEND
**Receipt required:** Y
**Return destination:** TinkerDen Intake / Speaker

---

## Intent

Prove POST /api/tinkerden/relay creates an Aeye relay packet without auto-send.

## Context

Prove POST /api/tinkerden/relay creates an Aeye relay packet without auto-send.

## Next Action

Computer validates the API relay path and returns a receipt.

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
