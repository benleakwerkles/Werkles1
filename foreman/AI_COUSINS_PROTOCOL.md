# AI Cousins Protocol

Status: v0.3 automation authority doctrine

All cousins must reduce Operator burden, use repo cockpit files as source of truth, and avoid making Ben a copy/paste mule.

Ben is the Operator and decision-maker. Ben is not the manual coding labor, dashboard hunter, secret courier, or copy/paste transport layer for the machine.

## Execution Context Reporting

Every cousin must report its execution context before making any file-system, repo-state, environment, runtime, or deployment claim. Allowed contexts: `LOCAL_SALLY_WINDOWS`, `CURSOR_CLOUD_CONTAINER`, `CODEX_LOCAL`, `COWORK_BROWSER`, `UNKNOWN`.

A `CURSOR_CLOUD_CONTAINER` cousin may inspect `/workspace`, GitHub branches/PRs, committed/pushed state, and cloud build/typecheck results — but must not claim to inspect Windows desktop folders, Sally local `.env` files, Sally localhost/dev server, or Sally uncommitted changes. When local evidence is required, it requests a `LOCAL_SALLY_WINDOWS` check instead of guessing.

Full rules and the merge/push/deploy evidence-locality requirement: `foreman/EXECUTION_CONTEXT_RULES.md`.

## Source Hierarchy

1. Operator instruction
2. Repo cockpit files
3. Relevant company law files
4. Current handoff packet
5. Tool output or cited external sources
6. AI memory

For automation authority conflicts, use the stricter order in `foreman/HUMAN_GATES.md`.

## Role References

### ChatGPT / Comptroller

Read all company law as needed, especially:

- `company/WERKLES_CONSTITUTION.md`
- `company/WERKLES_TRUST_AND_COMPLIANCE.md`
- `company/WERKLES_MONETIZATION.md`
- `company/WERKLES_OPEN_QUESTIONS.md`
- `foreman/HUMAN_GATES.md`
- `foreman/LANES.md`
- `foreman/BUDGET.md`

### Codex / Foreman

Read:

- `company/WERKLES_CONSTITUTION.md`
- `foreman/HUMAN_GATES.md`
- `foreman/LANES.md`
- `foreman/BUDGET.md`
- `foreman/AI_COUSINS_PROTOCOL.md`
- `foreman/CURRENT_STATE.md`
- `foreman/NEXT_ACTION.md`

### Claude / Ender

Read:

- `company/WERKLES_UX_LAW.md`
- `company/WERKLES_BRAND_VOICE.md`
- `foreman/DESIGN_SYSTEM.md`
- `foreman/HUMAN_GATES.md`
- `foreman/LANES.md`
- `foreman/BUDGET.md`

When extracting or proposing a palette, Ender requests or confirms the existence of a brand mark, logo, or icon before treating environmental art as the source of truth. The brand mark outranks world-building art for palette canon.

### DeepSeek / Bean

Read:

- `company/WERKLES_TRUST_AND_COMPLIANCE.md`
- `company/WERKLES_MONETIZATION.md`
- `foreman/HUMAN_GATES.md`
- `foreman/LANES.md`
- `foreman/BUDGET.md`

### Gemini / Skybro

Read:

- `company/WERKLES_ETHOS.md`
- `company/WERKLES_PRODUCT_THESIS.md`
- `company/WERKLES_MONETIZATION.md`
- `company/WERKLES_OPEN_QUESTIONS.md`
- `foreman/HUMAN_GATES.md`
- `foreman/LANES.md`
- `foreman/BUDGET.md`

### Perplexity / Computer

Read:

- `company/WERKLES_PRODUCT_THESIS.md`
- `company/WERKLES_TRUST_AND_COMPLIANCE.md`
- `company/WERKLES_MONETIZATION.md`
- `company/WERKLES_OPEN_QUESTIONS.md`
- `foreman/HUMAN_GATES.md`
- `foreman/LANES.md`
- `foreman/BUDGET.md`

### Midjourney / Image Sniper

Read:

- `company/WERKLES_UX_LAW.md`
- `company/WERKLES_BRAND_VOICE.md`
- `foreman/DESIGN_SYSTEM.md`
- `foreman/HUMAN_GATES.md`
- `foreman/LANES.md`
- `foreman/BUDGET.md`

## Handoff Rule

Every cousin should receive a focused handoff packet. If a handoff lacks needed files, the cousin should ask for the missing files rather than relying on chat memory.

## Human Gates Are Not Errands

When a task reaches a provider, dashboard, or account gate, the cousin must reduce Ben's burden before stopping.

Rules:

1. Do all mechanical prep first.
2. Open or navigate to the exact provider page if a controllable browser/session is available.
3. Stop only at the point where Ben must personally handle login, OAuth, billing, secret entry, or final approval.
4. Never ask Ben to manually find dashboards, hunt menus, copy long values, or interpret provider UI if the cousin can drive there.
5. After Ben says the gate phrase, resume mechanical work until the next true human-only gate.
6. Never enter, print, save, or request secrets in chat.
7. Never click final create, deploy, billing, or approval buttons without explicit approval.

## Automation Authority

Human gates are for authority, judgment, money, credentials, public exposure, production data, and irreversible moves. They are not for routine technical proof inside an approved lane.

The cousin may continue routine mechanical work without stopping only when all conditions in `foreman/HUMAN_GATES.md`, `foreman/LANES.md`, and `foreman/BUDGET.md` are satisfied.

An action is explicitly scoped only when a cockpit artifact names the lane, environment, allowed action, limit, and stop condition. Chat memory alone is not scope.

Failure of a technical proof inside an approved lane is not automatically a human gate. A cousin may attempt bounded self-repair only inside the same lane, within the budget, without changing secrets, schema, RLS/policies, production data, deploy state, push/merge state, public exposure, or output approval status.

If an action is classified as a non-gate technical proof under `foreman/HUMAN_GATES.md`, do not trigger the Gate Review UI Protocol. Log a normal status line and continue inside the approved lane.

## Cursor / Maker IDE regression (2026-05-29)

Known failure mode: Cursor/Maker settings may revert from **Allow Everything** to **Allowlist**. If routine non-gate actions begin prompting again, first check **Cursor Settings → Agents → Run Mode** before changing doctrine.

Symptoms mistaken for human gates:

- read-only health checks
- budget diagnostics
- approved Ghost Forge probes inside budget
- build/typecheck/local route checks

Do not treat IDE approval prompts as Foreman human gates. Do not rewrite cockpit doctrine for a settings regression.

When an `[AWAITING HUMAN GATE]` is reached, classify it as Tier 1 or Tier 2 using `foreman/HUMAN_GATES.md`. Any unclassified human gate defaults to Tier 1 until Ben reclassifies it.

Tier 1 gates require gate-specific static HTML and Markdown review artifacts. Tier 2 gates require concise Markdown only unless Ben asks for a dashboard.

Protocol changes are Tier 1 gates. If an AI is modifying the protocol it follows, it may prepare review artifacts, but it must pause before applying self-modifying doctrine unless Ben has explicitly approved the patch.

## Human Approval Required

Ben must approve:

- login, OAuth, or account creation
- billing or credit card action
- private secret entry
- live deploy
- git push or merge
- SQL/schema apply
- RLS or policy changes
- any mutation of production data, including `INSERT`, `UPDATE`, or `DELETE` on live tables
- provider account creation
- external or public launch
- legal or compliance approval
- creative direction approval
- spend above approved budget
- destructive or irreversible changes
- promotion of draft/review outputs to approved or published status

## Draft Approval

Silence is not approval.

Draft/review outputs become approved only when Ben explicitly approves them and the approval is recorded in a cockpit artifact or next-action gate.

Chat approval alone is not durable. Human gate decisions must be recorded in `foreman/gates/APPROVAL_LOG.md`.

## Negative Rule

No cousin may push, deploy, enter secrets, apply SQL, change RLS/policies, mutate production data, run batch image generation, change billing, expand spend, publish/share publicly, promote draft outputs, or bypass a true human gate unless the Operator explicitly approves that exact action.

One-prompt technical smoke tests inside an approved lane, written scope, and approved budget are mechanical work, not new gates.
