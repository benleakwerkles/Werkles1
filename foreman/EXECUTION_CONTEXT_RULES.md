# Execution Context Rules

Status: automation authority doctrine. Source of truth for execution-context reporting.

Every agent must report its execution context **before** making any file-system, repo-state, environment, runtime, or deployment claim. An agent that has not declared context may not assert what it can or cannot see.

## Allowed execution contexts

- `LOCAL_SALLY_WINDOWS`
- `CURSOR_CLOUD_CONTAINER`
- `CODEX_LOCAL`
- `COWORK_BROWSER`
- `UNKNOWN`

Report format (lead with this before file ops):

```text
EXECUTION_CONTEXT: <one of the above>
```

## Context rules

### 1. `LOCAL_SALLY_WINDOWS`

Can inspect:

- `C:\Users\benle\...` and other local Windows desktop folders
- local repo files
- local working tree (including uncommitted changes)
- local dev server / runtime state
- local `.env` **existence** — but must never print, save, or transmit secret values

### 2. `CURSOR_CLOUD_CONTAINER`

Can inspect:

- `/workspace`
- GitHub branches
- pull requests
- committed/pushed repo state
- cloud build/typecheck results

Cannot inspect (must not claim to):

- `C:\Users\...` or any Windows desktop folder
- Sally/BLDer local `.env` files
- Sally localhost / local dev server state
- Sally uncommitted changes
- local runtime logs unless committed or uploaded into the repo

If asked to inspect any of the above, a `CURSOR_CLOUD_CONTAINER` agent must decline the direct claim and instead request a `LOCAL_SALLY_WINDOWS` check (provide a read-only command for the Operator to run).

### 3. `CODEX_LOCAL`

Must declare whether it is local to Sally or sandboxed elsewhere **before** claiming local filesystem or runtime access. If sandboxed, the `CURSOR_CLOUD_CONTAINER` "cannot inspect" limits apply by analogy.

### 4. `COWORK_BROWSER`

Operates browser / computer-use only within its current browser session. Must not claim direct repo filesystem access unless that access is explicitly available in the session.

### 5. `UNKNOWN`

If context is unknown, the agent must **stop and identify** before any file operation. No filesystem, repo-state, runtime, or deployment claim is allowed under `UNKNOWN`.

## Merge / push / deploy evidence locality

Before any merge, push, or deploy recommendation, identify whether the required evidence is:

- cloud-side (GitHub / `/workspace` / cloud build), or
- local Sally-side (Windows working tree, local `.env`, local dev server), or
- both.

If local evidence is required, a `CURSOR_CLOUD_CONTAINER` agent must **request a `LOCAL_SALLY_WINDOWS` check** rather than guessing or fabricating local state. A recommendation that depends on unseen local evidence must be marked CONDITIONAL until that evidence is supplied.

## Relationship to other cockpit files

- This file is the source of truth for execution-context reporting.
- `foreman/AI_COUSINS_PROTOCOL.md` references this rule for all cousins.
- `foreman/HUMAN_GATES.md` references the evidence-locality rule for merge/push/deploy gates.
- Secret handling remains governed by `foreman/HUMAN_GATES.md` (Secret Boundary) — no context may print or request secret values.
