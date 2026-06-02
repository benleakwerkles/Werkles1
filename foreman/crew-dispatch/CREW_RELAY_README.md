# AEYE Crew Relay (Bean hardening)

Canonical schema: `crew-packet-schema.json`

## Hash utility

Shared raw-buffer SHA-256 (no line-ending normalization):

- `scripts/foreman/_foreman-core.mjs` → `sha256FileRaw`, `runCockpitHashSelfTest`
- Used by `crew-packet-generator.mjs` and `crew-response-intake.mjs`

Self-test:

```powershell
node foreman/crew-dispatch/crew-packet-generator.mjs --self-test
node foreman/crew-dispatch/crew-response-intake.mjs --self-test
```

## Outgoing packets

Generator:

```powershell
node foreman/crew-dispatch/crew-packet-generator.mjs --cousin BEAN
```

Stamp relay metadata onto an existing PS1-generated packet:

```powershell
node foreman/crew-dispatch/crew-packet-generator.mjs --cousin PETRA --stamp foreman/handoffs/outbox/TO_PETRA_*.md
```

Outgoing packets include: `generated_at`, `currentStateHash` (if CURRENT_STATE exists), `nextActionHash`, `source_files_included`, `REQUIRED_RESPONSE_FIELDS`.

Templates:

- `foreman/templates/TO_COUSIN_PACKET_TEMPLATE.md`
- `foreman/templates/FROM_COUSIN_RESPONSE_TEMPLATE.md`

## Inbox intake (atomic + dry-run)

```powershell
# Validate only — moves nothing
node foreman/crew-dispatch/crew-response-intake.mjs validate

# Dry-run process — validate all, move nothing
node foreman/crew-dispatch/crew-response-intake.mjs process --dry-run

# Process — validate all first; halt if any fail; then move all to inbox/processed/
node foreman/crew-dispatch/crew-response-intake.mjs process
```

PowerShell wrapper: `crew-response-intake.ps1` with `-Action Validate|Process|DryRun|...`

## Outbox lifecycle

| Folder | Purpose |
|--------|---------|
| `foreman/handoffs/outbox/` | Unsent packets (dashboard default) |
| `foreman/handoffs/outbox/sent/` | Mark-sent with timestamp prefix |
| `foreman/handoffs/outbox/archive/` | Old sent packets (30+ days) |

```powershell
node foreman/crew-dispatch/crew-response-intake.mjs mark-sent TO_BEAN_CREW_CHECKIN_v2_....md
node foreman/crew-dispatch/crew-response-intake.mjs archive-sent
node foreman/crew-dispatch/crew-response-intake.mjs list-outbox
node foreman/crew-dispatch/crew-response-intake.mjs list-outbox --sent
```

**Do not send stale packets** — mark-sent rejects if nextActionHash/currentStateHash differ from live cockpit.

## Ben review warnings (warn, not auto-block)

- CONFIDENCE LOW
- UNKNOWNS outside lane / unsure / not my lane
- Per-role overreach keywords (see schema)

## Network command (Edge role awareness)

First command: **`ROLE_AWARENESS_SYNC`** — see `RELAY_NETWORK.md`

```powershell
node foreman/crew-dispatch/crew-relay-network-command.mjs issue
node foreman/crew-dispatch/crew-relay-network-command.mjs show --cousin PETRA
```

Dashboard: **Issue Role Awareness Sync** -> **Walk Network Sync (auto-paste all 5)** -> Send manually each tab -> inbox -> validate/process.

Courier scripts: `crew-edge-courier.ps1`, `crew-edge-courier.mjs`

## Doctrine

- STOP BEFORE SEND
- No auto-merge cousin responses
- No deploy / push / SQL / secrets / Ghost Forge / Bellows from relay scripts
