# TO_BEAN — ThinkIt Intake Relay Proof

**Packet ID:** `cmd_dash_intake_proof_0001`
**Source:** ThinkIt
**Target Aeye:** BEAN
**Dispatch class:** AUTO_LOAD_HUMAN_SEND
**Receipt required:** Y
**Return destination:** TinkerDen Intake / Speaker

---

## Intent

Prove JSONL intake can become an Aeye relay packet without Ben carrying context.

## Context

Prove JSONL intake can become an Aeye relay packet without Ben carrying context.

## Next Action

Bean validates intake relay safety and returns a receipt.

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
