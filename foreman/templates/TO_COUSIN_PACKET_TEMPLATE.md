# To {{COUSIN_LABEL}} ({{COUSIN_TITLE}}): {{MISSION_LABEL}}

## Cast (do not confuse)

| Name | Role |
|------|------|
| **Ben** | Operator — human gates only |
| **Petra** | Comptroller — scope, GO/NO-GO |
| **Codex** | Foreman — cockpit sync |
| **Maker** | Cursor — bounded app/UI on Sally |
| **Sally** | Local machine — repo, dev server, clipboard |

---

## Status

**READY FOR OPERATOR PREPARE** — generated {{GENERATED_AT}}.

**Stops before Send:** Ben must paste manually. No auto-send. No deploy. No push. No SQL.

---

## Mission

{{MISSION_DESCRIPTION}}

---

## Read first (cockpit)

| File | Role |
|------|------|
{{COCKPIT_TABLE}}

---

## Required cousin response

Cousin must reply using `foreman/templates/FROM_COUSIN_RESPONSE_TEMPLATE.md`.

All fields in `REQUIRED_RESPONSE_FIELDS` inside Relay metadata are mandatory.

---

## Relay metadata

```json
{{RELAY_METADATA_JSON}}
```

---

## Operator after response

1. Save cousin reply to `foreman/handoffs/inbox/` as `FROM_{{COUSIN_UPPER}}_<topic>.md`
2. Dashboard → **Validate Inbox (dry-run)**
3. Dashboard → **Process Responses** (only if validation passes)
4. **Never auto-merge** — Ben reviews processed summary
