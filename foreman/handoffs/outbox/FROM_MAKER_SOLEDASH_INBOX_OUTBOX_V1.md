# FROM_MAKER_SOLEDASH_INBOX_OUTBOX_V1

Date: 2026-06-12
Author: Maker (Cursor) · EXECUTION_CONTEXT: CURSOR_CLOUD_CONTAINER
Type: **concept / UI plan only** — no build, no routing, no Speaker, no AI, no automation.

## Purpose

Make SoleDash feel like a real command console by answering one question:
**"I sent something. What happened?"**

This plan defines the **screens, data model, status flow, sample objects, integration points, risks, and the smallest implementation path** for Inbox / Outbox / Receipts. It builds on the existing GD status states (Received, Thinking, Blocked, Failed, Response Incoming, Complete) already rendered by the GimpDash/GD console (`scripts/foreman/foreman-control-server.mjs`).

> Naming note: "SoleDash", "GimpDash", and "GD" all appear to refer to the same operator command console. This plan assumes SoleDash = the evolving name for that console. Confirm if they are meant to be distinct surfaces.

---

## 1. Proposed screens

Three read-only views, reachable as tabs/sections in SoleDash. All are "glance and understand" — no actions that mutate routing.

### Inbox — "responses received"
- **Newest first.**
- Columns: `from` (actor) · `subject` · `received at` · **status badge** · `re: packet` (links to the originating Outbox item).
- Row click → detail drawer: full body/preview, linked packet, timestamps.
- Empty state: "No responses yet."

### Outbox — "packets sent"
- **Newest first.**
- Columns: `to` (destination) · `subject` · `sent at` · **current status badge** · `receipt` (delivered/failed/awaiting).
- Row click → detail: destination, payload summary, status history (state transitions with timestamps).
- Empty state: "Nothing sent yet."

### Receipts — "delivery truth"
- Three buckets (counts + lists): **Delivered**, **Failed**, **Awaiting response**.
- Each receipt: `packetId` · `destination` · `state` · `lastUpdate` · short reason (for failed).
- Acts as the at-a-glance health board for "did it land?"

### Shared chrome
- Reuse GD status chips (same 6 states, same colors, pulse on Thinking / Response Incoming).
- Top summary strip: counts per state across Outbox.

---

## 2. Proposed data model

Plain JSON, file-backed in V1 (no DB). Three record types.

### Packet (Outbox item)
```
Packet {
  id: string            // "pkt_2026-06-12_petra_001"
  subject: string
  to: string            // destination actor/lane: "Petra" | "Codex" | "Bellows" | ...
  from: string          // sender (usually "Ben" or "Maker")
  createdAt: ISO8601
  sentAt: ISO8601 | null
  state: State          // see status flow
  body: string          // or path to the packet file
  sourcePath?: string   // e.g. foreman/handoffs/outbox/<file>.md
  responseId?: string   // links to Response when one arrives
  history: StateEvent[] // [{ state, at, note }]
}
```

### Response (Inbox item)
```
Response {
  id: string            // "rsp_2026-06-12_petra_001"
  re: string            // Packet.id this responds to
  from: string          // responder
  receivedAt: ISO8601
  subject: string
  body: string          // or path to inbox file
  state: State          // typically "Response Incoming" -> "Complete"
  sourcePath?: string   // e.g. foreman/handoffs/inbox/<file>.md
}
```

### Receipt (delivery record)
```
Receipt {
  packetId: string
  destination: string
  status: "Delivered" | "Failed" | "Awaiting"
  lastUpdate: ISO8601
  reason?: string       // for Failed
}
```

### State (shared enum — matches GD Status Layer)
`Received | Thinking | Blocked | Failed | Response Incoming | Complete`

---

## 3. Status flow

How a packet moves, mapped onto the existing 6 states:

```
[create draft]            -> (not yet in Outbox)
Outbox: Received          -> packet queued/recorded as sent by operator
        Thinking          -> destination is working it (manual mark or future feed)
        Blocked           -> needs a human gate / dependency before progress
        Failed            -> send or processing failed (reason recorded)  --> Receipt: Failed
        Response Incoming -> a reply is arriving / partially in            --> Inbox row appears
        Complete          -> response received + closed                    --> Receipt: Delivered
```

Receipts derive from Packet.state:
- `Complete` → **Delivered**
- `Failed` → **Failed**
- anything else (`Received/Thinking/Blocked/Response Incoming`) → **Awaiting**

V1 transitions are **operator-set or file-derived** (see integration points) — not automated.

---

## 4. Sample objects

```json
{
  "outbox": [
    {
      "id": "pkt_2026-06-12_petra_001",
      "subject": "APP_INFRA slice verdict request",
      "to": "Petra",
      "from": "Ben",
      "createdAt": "2026-06-12T02:10:00Z",
      "sentAt": "2026-06-12T02:11:00Z",
      "state": "Response Incoming",
      "sourcePath": "foreman/handoffs/outbox/TO_PETRA_COMPTROLLER_CREW_CHECKIN_v0.2.md",
      "responseId": null,
      "history": [
        { "state": "Received", "at": "2026-06-12T02:11:00Z" },
        { "state": "Thinking", "at": "2026-06-12T02:12:30Z" },
        { "state": "Response Incoming", "at": "2026-06-12T02:30:00Z" }
      ]
    },
    {
      "id": "pkt_2026-06-12_ghostforge_001",
      "subject": "Gate 05 resume request",
      "to": "Ghost Forge",
      "from": "Ben",
      "createdAt": "2026-06-12T01:00:00Z",
      "sentAt": "2026-06-12T01:00:30Z",
      "state": "Blocked",
      "history": [
        { "state": "Received", "at": "2026-06-12T01:00:30Z" },
        { "state": "Blocked", "at": "2026-06-12T01:01:00Z", "note": "paused; needs credit + key" }
      ]
    }
  ],
  "inbox": [
    {
      "id": "rsp_2026-06-12_petra_001",
      "re": "pkt_2026-06-12_petra_001",
      "from": "Petra",
      "receivedAt": "2026-06-12T02:31:00Z",
      "subject": "VERDICT: GO_WITH_CONDITIONS",
      "state": "Response Incoming",
      "sourcePath": "foreman/handoffs/inbox/FROM_PETRA_verdict.md"
    }
  ],
  "receipts": [
    { "packetId": "pkt_2026-06-12_petra_001", "destination": "Petra", "status": "Awaiting", "lastUpdate": "2026-06-12T02:31:00Z" },
    { "packetId": "pkt_2026-06-12_ghostforge_001", "destination": "Ghost Forge", "status": "Awaiting", "lastUpdate": "2026-06-12T01:01:00Z" }
  ]
}
```

---

## 5. Future integration points (NOT built here)

- **File-backed feed (V1):** derive Outbox from `foreman/handoffs/outbox/` and Inbox from `foreman/handoffs/inbox/` (folders already exist). A small read-only loader maps files → records.
- **Status feed:** reuse the GD `/status` pattern; add `/inbox`, `/outbox`, `/receipts` read-only JSON endpoints later.
- **Relay/courier (future, separate mission):** a `relay-courier` could set `sentAt`/`state` — but routing is explicitly out of scope now.
- **Speaker (future):** Speaker would emit Response records — out of scope now.
- **Manual status marks:** a tiny local-only control (not in this plan) could let the operator set a packet's state; gated behind a future mission.

---

## 6. Risks

- **Naming drift:** SoleDash vs GimpDash vs GD — confirm one canonical name to avoid split surfaces.
- **Source-of-truth confusion:** if records are hand-maintained AND file-derived, they can disagree. V1 should pick one (recommend file-derived, read-only).
- **Stale state:** without a feed, states go stale; must be labeled "manual / last-updated" so no one trusts them as live.
- **Scope creep into routing/automation:** Inbox/Outbox visibly invites "send" buttons — V1 must stay read-only to honor hard stops.
- **Secret leakage:** packet bodies may reference secrets; the view must render names/paths, never secret values (reuse GD secret-boundary discipline).
- **Path coupling:** deriving from `handoffs/` folders couples UI to folder conventions; document the mapping.

---

## 7. Smallest possible implementation path (when approved)

V1 = read-only, file-derived, mirrors the GD console pattern. No routing, no automation.

1. Add a read-only loader that lists `foreman/handoffs/outbox/` and `foreman/handoffs/inbox/` and maps each file to a Packet/Response (id = filename, sentAt = mtime, state = default `Received` unless a sidecar status says otherwise).
2. Derive Receipts from Packet.state (Complete→Delivered, Failed→Failed, else Awaiting).
3. Add three sections/tabs to the existing console (`scripts/foreman/foreman-control-server.mjs`): Inbox, Outbox, Receipts — reuse the GD state chips.
4. Add read-only endpoints `GET /inbox`, `GET /outbox`, `GET /receipts` (JSON), mirroring `GET /status`.
5. Empty states + "manual / last-updated" labels.
6. No writes, no send buttons, no provider calls.

Estimated surface: one file touched (`foreman-control-server.mjs`) + this doc; ~1 reviewable PR, UI/console only.

---

## Hard stops honored

No production, no deploy, no Speaker changes, no routing changes, no automation, no PR merge, no broad refactor. This deliverable is a plan only — nothing was built or wired.
