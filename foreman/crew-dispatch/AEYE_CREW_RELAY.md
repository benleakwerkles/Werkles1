# AEYE Crew Relay — Return Paths

Cousin responses flow **Edge → inbox → intake → processed/** (never auto-merge).

## Response filename

`FROM_{COUSIN}_{TOPIC}_{timestamp}.md`

Example: `FROM_PETRA_APP_INFRA_VERDICT_20260526.md`

## Required headers (metadata JSON)

Each response must include in `## Relay metadata`:

| Header | Metadata field |
|--------|----------------|
| SOURCE | cousin |
| PLATFORM | platform |
| ROLE | role |
| IN_REPLY_TO | source_packet_id |
| GENERATED_AT | generated_at |
| CURRENT_STATE_HASH | currentStateHash |
| NEXT_ACTION_HASH | nextActionHash |
| REQUESTED_ACTION | requested_action |
| TARGET_FILES | target_files |
| LANE | lane |
| CONFIDENCE | CONFIDENCE |
| UNKNOWNS | UNKNOWNS |
| DO_NOT | DO_NOT |

Schema: `crew-return-schema.json` · Template: `foreman/templates/FROM_COUSIN_RESPONSE_TEMPLATE.md`

## Intake rules

- Reject non-`.md` files
- Verify SOURCE matches filename (`FROM_PETRA_*` → cousin PETRA)
- Reject unknown sources
- Verify required headers
- Verify state hashes vs live cockpit
- Stale → `STALE_DO_NOT_APPLY`
- Lane conflicts → logged, never auto-merge
- Merge conflicts → `foreman/handoffs/merge-conflicts.md`

```powershell
node foreman/crew-dispatch/crew-response-intake.mjs validate
node foreman/crew-dispatch/crew-response-intake.mjs process --dry-run
node foreman/crew-dispatch/crew-response-intake.mjs process
```

## Outbound packets

Template: `foreman/templates/TO_COUSIN_PACKET_TEMPLATE.md`  
Generator: `foreman/crew-dispatch/crew-packet-generator.mjs`

## Robot Zone

Edge dispatch bay is **Robot Zone** — Ben does not browse normally there. Courier lock prevents duplicate runs.

See `RELAY_COURIER.md`, `EDGE_DISPATCH_BAY.md`, `CREW_RELAY_README.md`.
