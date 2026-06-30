# Command Dash / ThinkIt / TinkerDen -> Aeye Relay

Status: **built V0**
Machine proof: Doss
Human send boundary: **preserved**

---

## What It Does

Turns messy Command Dash / ThinkIt / TinkerDen input into:

1. Aeye packet in `foreman/handoffs/outbox/`
2. Aeye paste block in `foreman/handoffs/outbox/`
3. Packet relay event in `data/organism/packet_relay_events.jsonl`
4. Receipt pickup row in `data/organism/receipt_pickup.jsonl`
5. Proof JSON in `data/organism/command_dash_relay_proofs/`

It does **not** send, submit, post, or operate credentials.

---

## One-Shot Command

```powershell
npm.cmd run relay:command-dash -- --packet_id cmd_dash_relay_proof_0001 --source "Command Dash / ThinkIt / TinkerDen" --target_aeye PETRA --title "Command Dash to Aeye Relay Proof" --intent "Prove Command Dash, ThinkIt, and TinkerDen can prepare an Aeye relay packet without making Ben the bus." --next_action "Petra validates the relay packet and returns a receipt to TinkerDen Intake." --return_destination "TinkerDen Intake / Speaker"
```

---

## Intake File

Drop JSONL rows into:

`data/organism/command_dash_intake.jsonl`

Minimum row:

```json
{"packet_id":"cmd_dash_intake_0001","source":"TinkerDen","target_aeye":"PETRA","intent":"Validate this packet.","next_action":"Return a receipt to TinkerDen Intake."}
```

Process once:

```powershell
npm.cmd run relay:command-dash:intake
```

Watch mode:

```powershell
npm.cmd run relay:command-dash:watch
```

---

## APIs

Prepare relay packet:

`POST /api/tinkerden/relay`

Load packet lane:

`GET /api/tinkerden/packets`

Load receipt lane:

`GET /api/tinkerden/receipts`

---

## Rules

- No account automation
- No unauthorized auto-send
- No browser credential control
- No fake delivery
- Clipboard + workspace focus only in V0
- Operator must paste/send manually
