# FROM MAKER - GD LOCAL TEST RUN V1

Execution context: `CURSOR_CLOUD_CONTAINER`.

Status: local runtime evidence report. No production deploy, merge, PR close, branch delete, SQL, secrets, billing, provider mutation, app code change, or live data mutation was performed.

## Important Evidence Boundary

User asked:

```text
Run SoleDash/GD locally on Betsy.
```

This agent cannot inspect or run Betsy's Windows/local runtime from `CURSOR_CLOUD_CONTAINER`.

What was actually run:

```text
SoleDash/GD top-of-stack PR #12 was run in an isolated detached cloud worktree at /tmp/werkles-gd-pr12-test.
```

So this report is:

```text
Cloud-local PR #12 runtime proof: PASS/FAIL below.
Betsy-local runtime proof: NOT PERFORMED by this agent.
```

To verify on Betsy, run the same command from the Betsy repo root after checking out or applying the PR #12 top-of-stack console code.

---

# 1. Exact Command Used

Isolated test setup:

```bash
git fetch origin main pull/12/head:refs/remotes/origin/pr/12
rm -rf /tmp/werkles-gd-pr12-test
git worktree add --detach /tmp/werkles-gd-pr12-test origin/pr/12
```

Server command used from `/tmp/werkles-gd-pr12-test`:

```bash
FOREMAN_CONTROL_PORT=4317 node scripts/foreman/foreman-control-server.mjs
```

Documented Betsy/Sally command from the PR #12 README:

```bash
node scripts/foreman/foreman-control-server.mjs
```

Port override form:

```bash
FOREMAN_CONTROL_PORT=4500 node scripts/foreman/foreman-control-server.mjs
```

Startup output observed:

```text
Foreman Control Panel (SoleDash) on http://127.0.0.1:4317
Read-only Human Gates Console. No secrets, no provider calls, no deploys.
```

---

# 2. Local URL

Runtime URL:

```text
http://127.0.0.1:4317
```

Health endpoint:

```text
GET http://127.0.0.1:4317/health
```

Observed:

```json
{"ok":true,"service":"foreman-control-server","readOnly":true}
```

---

# 3. What Worked

## Console opens

Result:

```text
PASS in cloud-local PR #12 worktree.
BETSY NOT VERIFIED by this agent.
```

Evidence:

```text
GET / -> HTTP 200
HTML title: SoleDash - Operator Command Console
HTML bytes: 37889
```

## Status layer appears

Result:

```text
PASS.
```

Evidence:

```text
GET /status -> HTTP 200
states=6
items=6
```

States returned:

```text
Received
Thinking
Blocked
Failed
Response Incoming
Complete
```

Sample status entries returned:

```text
Maker (Cursor) - Complete - SoleDash Human Gates Console shipped
Status Layer - Response Incoming - rendering live states
Petra (Comptroller) - Thinking - APP_INFRA slice verdict
Ghost Forge - Blocked - Gate 05 paused (28 remaining)
Codex (Foreman) - Received - awaiting next packet
Bellows - Blocked - source-preservation lane only
```

## Inbox / Outbox / Receipts appear

Result:

```text
PASS.
```

Evidence:

```text
GET /outbox -> HTTP 200, items=13
GET /inbox -> HTTP 200, items=1
GET /receipts -> HTTP 200, items=13
GET /summary -> HTTP 200
```

Summary returned:

```json
{
  "ok": true,
  "outboxTotal": 13,
  "inboxTotal": 1,
  "byState": {
    "Received": 13,
    "Thinking": 0,
    "Blocked": 0,
    "Failed": 0,
    "Response Incoming": 0,
    "Complete": 0
  },
  "receipts": {
    "Delivered": 0,
    "Failed": 0,
    "Awaiting": 13
  }
}
```

## File-derived packets are detected

Result:

```text
PASS.
```

Outbox examples detected:

```text
CODEX_PASTE_BLOCK.txt
FROM_MAKER_GD_STATUS_LAYER_V1.md
FROM_MAKER_SOLEDASH_BUILD_CONTINUE_V1.md
FROM_MAKER_SOLEDASH_INBOX_OUTBOX_BUILD_V1.md
OPEN_HANDOFF_HERE.md
PETRA_PASTE_BLOCK.txt
```

Inbox example detected:

```text
FROM_CURSOR_READ_ME.md
```

Metadata shown:

- packet filename
- parsed actor where filename permits
- subject
- modification time
- state
- source path

Packet bodies are not read into the UI according to the server code comments and README.

## Read-only endpoints

Result:

```text
PASS.
```

Observed endpoints:

```text
GET /
GET /health
GET /status
GET /outbox
GET /inbox
GET /receipts
GET /summary
```

Server code routes only these read-only GET endpoints.

## No production deploy / no merge

Result:

```text
PASS for this test run.
```

Evidence:

- no production deploy command was run
- no provider dashboard/API mutation was run
- no merge command was run
- current repo branch was not switched
- PR #12 was tested via detached isolated worktree

## No push during runtime test

Result:

```text
PASS for runtime test.
```

Only the reporting Markdown is intended to be committed/pushed after the test, per the user's "unless reporting only" allowance and cloud-agent repo workflow.

---

# 4. What Failed / Not Verified

## Betsy-local run

Result:

```text
NOT VERIFIED.
```

Reason:

```text
This agent is in CURSOR_CLOUD_CONTAINER and cannot inspect Betsy's local filesystem, local working tree, localhost, Windows desktop, or runtime logs.
```

Required Betsy check:

```bash
node scripts/foreman/foreman-control-server.mjs
```

Then open:

```text
http://127.0.0.1:4317
```

## Python probe attempt

Result:

```text
Environment miss, not SoleDash failure.
```

Details:

```text
python: command not found
```

Follow-up:

```text
Endpoint probing was rerun successfully using Node's built-in fetch.
```

## Edge packet creation

Result:

```text
NOT IMPLEMENTED in PR #12 tested stack.
```

Evidence:

```text
GET /edge -> 404 Not found
POST /edge -> 404 Not found
POST /outbox -> 404 Not found
POST /inbox -> 404 Not found
POST /receipts -> 404 Not found
POST /summary -> 404 Not found
```

UI/server data model says:

```text
Edge Aeye Crew Bay launcher
path: (launcher status - not wired in repo)
status: status only - not implemented in repo
```

No edge packet creation templates or dispatch artifacts were present in the PR #12 worktree at:

```text
foreman/crew-dispatch-console/templates/packet.template.md
foreman/crew-dispatch-console/DISPATCH_GO.cmd
```

Important nuance:

```text
SoleDash file-derived packets are read-only.
Edge packet creation is not implemented in the tested PR #12 stack.
```

---

# 5. Edge Packet Creation Status

Classification:

```text
Edge packets are NOT IMPLEMENTED in PR #12.
SoleDash packet display is READ-ONLY and FILE-DERIVED.
```

What exists:

- read-only outbox packet detection
- read-only inbox packet detection
- receipts derived from outbox state
- optional read-only `soledash-status.json` sidecar support if manually created

What does not exist:

- POST route to create packets
- `/edge` route
- write endpoint
- Edge Aeye Crew Bay launcher implementation
- packet template in PR #12
- dispatch command in PR #12

Optional status sidecar:

```text
foreman/handoffs/soledash-status.json
```

Observed in test:

```text
Absent.
```

Behavior:

```text
Server reads it if present.
Server does not create or write it.
```

---

# 6. Final Result

Cloud-local PR #12 test:

```text
PASS for console startup, local URL, status layer, inbox/outbox/receipts, file-derived packet detection, read-only operation.
```

Betsy-local test:

```text
NOT PERFORMED by this agent. Requires LOCAL_SALLY_WINDOWS/Betsy check.
```

Edge packet creation:

```text
NOT IMPLEMENTED in tested PR #12 stack.
```

No deploy/merge:

```text
CONFIRMED for this test run.
```
