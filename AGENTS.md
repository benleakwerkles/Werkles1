# Werkles AI Worker Rules

Use `foreman/platform-instructions/CODEX_FOREMAN_INSTRUCTIONS.md` as the repo-local Codex Foreman instruction shim for this workspace.

Repo cockpit files are source of truth. Do not make Ben a copy/paste mule.

## Automation Authority

Before stopping for Ben, check:

1. `foreman/HUMAN_GATES.md`
2. `foreman/LANES.md`
3. `foreman/BUDGET.md`
4. `foreman/NEXT_ACTION.md`
5. `foreman/AI_COUSINS_PROTOCOL.md`

If `foreman/HUMAN_GATES.md` classifies the action as a non-gate technical proof inside approved scope, proceed without asking Ben and do not trigger the Gate Review UI Protocol.

Cursor/Agents may classify a prompt as `PROCEED: not a human gate` or `STOP: HUMAN GATE`, but must never approve a human gate for Ben.

Do not enter credentials, secrets, payment information, OAuth approvals, account settings, or final create/save/share/deploy approvals automatically.
