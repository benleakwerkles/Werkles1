# Dispatch Classification

Relay Courier uses three dispatch classes. **Primary defense is class + structural markers — not regex.**

## CLASS A — AUTO_SEND

Allowed only for locked-template, low-risk operational sync packets:

- role-awareness sync (`ROLE_AWARENESS_SYNC`)
- crew routing updates
- non-secret cockpit status
- approved doctrine already committed to repo
- current gate summaries with no sensitive payload

Before AUTO_SEND:

| Guard | Requirement |
|-------|-------------|
| Template | Pre-approved locked template in `dispatch-policy.json` |
| Cousin | Allowlisted in policy |
| Hashes | Fresh vs live cockpit |
| Context | `context-health.json` not STALE / RESET_RECOMMENDED |
| Secret scan | Structural pass; regex secondary only |
| Size | Under cap in policy |
| Rate limit | Max 3 AUTO_SEND per cousin per 10 minutes |
| Log | Entry in `SEND_LOG.md` |

## CLASS B — AUTO_LOAD_HUMAN_SEND (default)

Load into target tab, **stop before Send**:

- legal/compliance
- financial/entity spending
- security/audit
- proprietary strategy
- uncommitted code diffs
- pricing/billing/payment decisions
- production-impacting recommendations

## CLASS C — BLOCKED

Never load or send:

- API keys, env values, passwords, OAuth tokens, service-role keys
- bank/card/full account numbers
- private transaction exports, customer PII, production DB dumps
- unredacted contracts
- anything marked `DO_NOT_SEND`

Blocked packets show **HUMAN GATE REQUIRED** on dashboard.

Config: `dispatch-policy.json` · Runner: `scripts/foreman/relay-courier.mjs`
