# Atlas Source Truth Role

Status: DRAFT V0

Atlas is the readback and mirror organ for source truth.

Atlas answers one question first:

> What does GitHub `origin/main` currently say?

Atlas then compares machine reality to that answer and returns a receipt. If the machine does not match GitHub main, Atlas reports drift. Drift is not a failure; pretending drift is canon is the failure.

## V0 Build

V0 is `scripts/foreman/atlas-source-truth-readback.mjs`.

It:

- reads `foreman/source-truth/SOURCE_TRUTH_POINTER.json`
- asks GitHub for `origin/main`
- records the remote hash
- records local branch/head/status
- classifies local state as canonical match or noncanonical workspace
- writes a readback receipt when run with `--write`

It does not:

- merge
- push
- deploy
- delete
- promote canonical status

## Output

Default write target:

- `foreman/source-truth/readbacks/ATLAS_SOURCE_TRUTH_READBACK.json`
- `foreman/source-truth/receipts/ATLAS_SOURCE_TRUTH_READBACK_RECEIPT.json`
