# BOOT — {{COUSIN}} context reset

**Purpose:** Reset cousin chat context after STALE / RESET_RECOMMENDED trigger.

**Platform:** {{PLATFORM}}  
**Role:** {{ROLE}}  
**Expected gate:** {{EXPECTED_GATE}}  
**Generated:** {{GENERATED_AT}}

---

## Operator note

Paste this into a **new chat** (or cleared thread) for {{COUSIN}}. Archive the old thread manually.

---

## Cockpit snapshot (read-only)

{{COCKPIT_SNIPPET}}

---

## Lane card

{{LANE_CARD}}

---

## DO NOT

- deploy, push, SQL, secrets, billing changes
- claim implementation without repo receipt
- auto-merge cousin responses

---

## Relay metadata

```json
{
  "schemaVersion": "aeye-crew-relay/v0.1",
  "cousin": "{{COUSIN}}",
  "packet_id": "{{PACKET_ID}}",
  "generated_at": "{{GENERATED_AT}}",
  "template": "BOOT_CONTEXT_RESET",
  "dispatch_class": "AUTO_LOAD_HUMAN_SEND",
  "nextActionHash": "{{NEXT_ACTION_HASH}}",
  "currentStateHash": "{{CURRENT_STATE_HASH}}",
  "REQUIRED_RESPONSE_FIELDS": []
}
```

---

**STOP BEFORE SEND** — review boot packet, then Send manually.
