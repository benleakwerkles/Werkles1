# From {{COUSIN}} — response to {{SOURCE_PACKET_ID}}

## Summary

{{SUMMARY}}

---

## Verdict

{{VERDICT_BODY}}

---

## Relay metadata

```json
{
  "schemaVersion": "aeye-crew-relay/v0.1",
  "cousin": "{{COUSIN}}",
  "source_packet_id": "{{SOURCE_PACKET_ID}}",
  "source_packet_file": "{{SOURCE_PACKET_FILE}}",
  "generated_at": "{{RESPONSE_GENERATED_AT}}",
  "platform": "{{PLATFORM}}",
  "role": "{{ROLE}}",
  "requested_action": "{{REQUESTED_ACTION}}",
  "target_files": [],
  "lane": "{{LANE}}",
  "currentStateHash": "{{CURRENT_STATE_HASH}}",
  "nextActionHash": "{{NEXT_ACTION_HASH}}",
  "CONFIDENCE": "HIGH",
  "VERDICT": "{{VERDICT_ONE_LINER}}",
  "UNKNOWNS": "{{UNKNOWNS}}",
  "DO_NOT": "deploy; push; SQL; secrets"
}
```

---

## Required fields (schema source of truth)

See `foreman/crew-dispatch/crew-packet-schema.json` → `REQUIRED_RESPONSE_FIELDS`.

Copy hash values from the outgoing packet Relay metadata block — do not recompute unless cockpit unchanged.

---

## Ben review triggers (warnings, not auto-block)

- `CONFIDENCE: LOW`
- `UNKNOWNS` mentions outside lane / unsure / not my lane
- Role overreach keywords (deploy, SQL apply, implementation patches, etc.)

Intake surfaces warnings in processed summary. Human gate still required for deploy/push/SQL.
