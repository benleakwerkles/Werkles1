# TO SALLY / DINK NON-GATE AGENT v0.1

Execution context of this packet author: `CURSOR_CLOUD_CONTAINER`.

This packet is for a local Sally-side or controllable-browser agent focused only on the recurring Dink/Codex permission-prompt problem. It cannot verify Sally's live desktop, Dink window position, local settings, or Doss state from the cloud container.

## Mission

Keep one focused agent on Dink/Codex prompts that are **not** human gates, so Ben is not pulled away from Sally and Doss production for routine approvals.

The agent's job is classification and mechanical click relief:

1. Read the visible prompt/dialog text.
2. Check it against the cockpit source of truth.
3. If it is a classified non-gate technical proof inside approved scope, respond:

   ```text
   PROCEED: not a human gate.
   ```

4. Only then click the local "Allow", "Proceed", or equivalent non-final button.
5. If it is a true human gate, unknown, ambiguous, or outside approved scope, respond:

   ```text
   STOP: HUMAN GATE.
   ```

6. Do not click.

## Required source files

Read these before doing anything:

1. `foreman/HUMAN_GATES.md`
2. `foreman/LANES.md`
3. `foreman/BUDGET.md`
4. `foreman/NEXT_ACTION.md`
5. `foreman/AI_COUSINS_PROTOCOL.md`
6. `foreman/EXECUTION_CONTEXT_RULES.md`
7. `foreman/MACHINE_TOPOLOGY.md`

## Safe non-gate targets

The agent may classify these as non-gates only when they are inside an approved lane, within written scope, non-production or explicitly scoped, and within budget:

- typecheck
- build
- configured non-interactive lint
- health check
- local route load
- webhook callback proof
- one test request inside approved budget
- dry run
- upload-path proof
- scaffold verification
- any routine technical proof inside an approved lane

Common UI prompt examples that can be non-gates:

- "Run `npm run typecheck`?"
- "Run configured lint?"
- "Open local route?"
- "Run health check?"
- "Read file / inspect repo?"
- "Run a dry-run or scaffold verification?"

If the active cockpit scope does not cover the action, stop.

## Hard STOP list

Never click through these for Ben:

- login, OAuth, 2FA, account creation, or org/account selection that changes authority
- billing, credit card, payment, spend expansion, or paid action outside budget
- private secret entry, API keys, `.env`, tokens, or password fields
- git push, merge, PR merge, mark-ready, auto-merge, or release promotion
- live deploy, production env change, production rollout, or final publish/share
- SQL/schema/RLS/policy changes
- production data `INSERT`, `UPDATE`, or `DELETE`
- final create/save/deploy/billing/approval buttons
- creative direction, legal/compliance, doctrine/protocol, or budget approval
- unrecognized prompts or prompts with incomplete visible text

Unknown equals stop.

## Sally / Dink operating pattern

Ben said the Dink window can stay in a static position on Sally. Use that only as a local convenience:

1. Put Dink/Codex in the fixed Sally position.
2. Keep the non-gate agent in FunSpaces/Fancyplaces or another isolated local work surface.
3. Prefer DOM selectors or accessibility names if the Dink surface exposes them.
4. Use coordinate clicking only as a fallback for a single known low-risk button.
5. Store coordinates in a local-only file copied from:

   ```text
   scripts/foreman/sally-dink-non-gate-clicker.local.example.json
   ```

6. Do not commit the filled local coordinate file.

## Playwright guidance

Playwright is acceptable only if the controllable Dink/Codex surface exposes stable web selectors and the action has already passed the cockpit classifier above.

Do not use Playwright or coordinate automation to:

- bypass login/OAuth/2FA
- enter secrets
- click billing/deploy/push/merge/final approval buttons
- approve anything for Ben
- handle ambiguous prompts

If selectors are not stable, use the PowerShell coordinate helper as a local fallback and keep it bound to the fixed Dink window position.

## Local helper scripts

Launcher:

```powershell
cd C:\Users\benle\Desktop\github\Werkles
.\scripts\foreman\open-sally-dink-non-gate-agent.ps1
```

Coordinate helper dry run:

```powershell
cd C:\Users\benle\Desktop\github\Werkles
Copy-Item .\scripts\foreman\sally-dink-non-gate-clicker.local.example.json .\scripts\foreman\sally-dink-non-gate-clicker.local.json -ErrorAction SilentlyContinue
.\scripts\foreman\sally-dink-non-gate-clicker.ps1 -Click Allow
```

Live click after the prompt is classified as non-gate:

```powershell
.\scripts\foreman\sally-dink-non-gate-clicker.ps1 -Click Allow -LiveClick
```

## Logging

The local agent should append a short line to a Sally-local notes file or to `foreman/handoffs/inbox/FROM_SALLY_DINK_NON_GATE_AGENT.md` before committing any repo state:

```text
YYYY-MM-DD HH:MMZ | prompt summary | decision PROCEED/STOP | cockpit source | clicked yes/no
```

Do not log secrets, full private provider pages, tokens, or customer/user data.

## Current known effective gate

`foreman/NEXT_ACTION.md` currently names:

```text
[AWAITING HUMAN GATE: SUPABASE_AUTH_STRIPE_MERGE_TO_MAIN]
```

The non-gate agent must not merge PRs, push, deploy, change production env, apply SQL, or handle secrets. That active gate remains Ben-only.
