# Aeye Relay Contract V0

## Purpose

Remove Ben as the courier between Command / Momentum Dash and the Aeyes.

The relay exists because `sent` is not delivery. A packet is only complete when the receiver writes back durable proof.

## Packet Lifecycle

1. `SENT_UNACKNOWLEDGED`
2. `RECEIVED_NOT_COMPLETED`
3. `COMPLETED_RECEIPT_PROVEN` or `BLOCKER_RECEIPT_PROVEN`

No UI may present `SENT_UNACKNOWLEDGED` as done.

## Brainboot Packets

Brainboot dispatch writes per-Aeye packets under:

`C:\speaker\brainboot\outbox`

Receiver receipts are written under:

`C:\speaker\brainboot\receipts`

The live TinkerDen / ThinkIt surface exposes:

`POST /v1/action/brainboot_dispatch`

`GET /v1/brainboot/status`

`GET /brainboot/receive/{packetId}`

`POST /v1/brainboot/ack`

## Generic Report Packets

Report relay dispatch writes per-Aeye packets under:

`C:\speaker\aeye_relay\outbox`

Receiver receipts are written under:

`C:\speaker\aeye_relay\receipts`

The live TinkerDen / ThinkIt surface exposes:

`POST /v1/relay/dispatch`

`GET /v1/relay/status`

`GET /relay/receive/{packetId}`

`POST /v1/relay/ack`

## Standing Aeye Inboxes

Each Aeye has a stable inbox route:

`GET /aeye/{Aeye.Machine}`

The JSON readback route is:

`GET /v1/aeye/{Aeye.Machine}/inbox`

The inbox shows all pending Brainboot and report packets for that Aeye. It lets the receiver write:

- `RECEIVED`
- `COMPLETED`
- `BLOCKER`

This is the intended session-start surface. The Operator should not need to carry one-off packet URLs if the Aeye can open its standing inbox.

Current useful inboxes:

- `http://10.1.10.8:3339/aeye/Skybro.Betsy`
- `http://10.1.10.8:3339/aeye/Petra.Betsy`
- `http://10.1.10.8:3339/aeye/Swanson.Doss`
- `http://10.1.10.8:3339/aeye/Fucko.Betsy`

## Required Receiver Receipts

Every packet requires:

- `RECEIVED`
- `COMPLETED` or `BLOCKER`

`COMPLETED` and `BLOCKER` require evidence text.

## Anti-Mule Rule

Ben should not manually re-explain packet state.

The UI must show:

- target Aeye
- packet id
- current status
- receiver page
- latest receiver receipt id

If no receiver receipt exists, the packet remains visibly incomplete.

## Command Dash First View

The TinkerDen / ThinkIt command dash must place the relay status before general daemon health.

The first visible relay surface must show:

- open / unacknowledged count
- completed count
- blocker count
- top dispatch button for Skybro + Petra startup
- standing inbox links
- latest packet cards with receiver links

This prevents the false impression that "nothing is working" when packets exist but are still waiting for receiver-side proof.

## V0 Boundary

This is a local file-backed relay and status surface.

It does not prove that Skybro or Petra have read a packet until those sessions write receiver receipts.

It does not push to GitHub automatically.

It does not auto-assimilate receiver receipts into doctrine.
