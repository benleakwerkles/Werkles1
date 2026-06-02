# Context Health Protocol

Track per-cousin chat health in `context-health.json`.

## Fields (per cousin)

- current chat purpose
- last packet id / timestamp
- last known gate vs expected current gate
- source bundle hash/version
- context load: `LOW` | `MEDIUM` | `HIGH` | `CRITICAL`
- reset recommended + reason
- boot packet path

## Reset triggers

- major gate change
- doctrine/protocol change
- style/positioning reset
- after 3+ large packets
- stale response hash
- cousin contradiction with repo cockpit
- user says cousin seems confused
- context load `CRITICAL`
- 24 hours of high-velocity work unless explicitly continued

## When STALE or RESET_RECOMMENDED

1. Do **not** AUTO_SEND normal packets
2. Generate BOOT packet: `node foreman/crew-dispatch/build-boot-packet.mjs --cousin PETRA`
3. Load/send per dispatch class (usually CLASS B — human Send)
4. Mark old chat archived (operator note in context-health)

## Refresh

Dashboard reads `context-health.json`. Boot builder updates cousin record after generation.

Template: `foreman/templates/BOOT_COUSIN_PACKET_TEMPLATE.md`
