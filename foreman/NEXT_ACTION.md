[MECHANICAL PREP: GHOST_FORGE_MODEL_PATCH_DEPLOY]

One-prompt Ghost Forge test was approved and attempted from the Render Web Shell.

Result:

```json
{"ok":false,"error":"Claude prompt generation failed 404: model: claude-3-5-haiku-latest"}
```

HTTP status:

```text
500
```

Interpretation:

- The request reached the Ghost Forge worker.
- It failed before Replicate image generation.
- No image was produced.
- The running worker is using a hardcoded Anthropic model alias: `claude-3-5-haiku-latest`.
- Local repo patch now makes the Anthropic model configurable and defaults to the stable dated model: `claude-3-5-haiku-20241022`.
- Local syntax check passed with `node --check ghost-forge-worker/server.mjs`.

Files patched locally:

- `ghost-forge-worker/server.mjs`
- `ghost-forge-worker/README.md`
- `ghost-forge-worker/render-env-checklist.md`
- `foreman/WERKLES_SPEND_LEDGER.md`
- `foreman/UNCLASSIFIED_SPEND_INBOX.md`
- `foreman/REIMBURSEMENT_AND_INTERCOMPANY_LOG.md`

APPROVAL RECEIVED:
Ben approved pushing/deploying the Ghost Forge model patch with:

```text
APPROVE GHOST FORGE MODEL PATCH DEPLOY
```

NEXT CODEX ACTION:
Codex should:

1. Commit/push only the Ghost Forge model patch and cockpit updates that are needed for this fix.
2. Trigger or stage the Render deploy for `werkles-ghost-forge1`.
3. Stop if Render asks for final deploy approval not already covered.
4. Re-run exactly one prompt test only after the patched service is live.

Still blocked:

- One-prompt retry.
- Background/batch image generation.
- Google Drive spend sheet creation until Google OAuth/connector authorization is ready.

Do not enter, print, save, request, or paste secrets into chat.
