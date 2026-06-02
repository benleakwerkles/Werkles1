# Finance Command Module v0.1

Status: **local Operator Cockpit module**  
Location: `foreman/finance/`  
Runner: `scripts/foreman/finance-command.mjs`

## Doctrine (locked)

| This module **is** | This module **is not** |
|--------------------|-------------------------|
| Local Operator Cockpit spend tracker | Bank connection |
| Manual/importable JSON ledger | Accounting finalization |
| Classification + mismatch flags | Moving money |
| Masks only (`...XXXX`, `planned`) | Creating cards |
| Reimbursement **tracking** (no submit) | Storing account/card secrets |

**Finance tracker = local Operator Cockpit module.** Full stop.

## What this is

A **local JSON ledger** on Sally for tracking spend by entity, payment rail, project, lane, and reimbursement risk — so Ben can see cross-entity mess without muling spreadsheets or hunting repo paths.

## What this is NOT

- **Not** a bank connection
- **Not** accounting finalization
- **Not** moving money
- **Not** creating cards
- **Not** storing account numbers, card numbers, routing numbers, credentials, or API keys

Masks like `...XXXX` or `planned` are allowed. Full account numbers are forbidden.

---

## Entities

Kind Sir Holdings · Kind Sir Corporate · Kind Sir Real Estate · Kind Sir Concrete · Kind Sir Insulation · Valley Vanguard · Valley Microfutures · Werkles · Ben Personal / Owner Draw · Unknown / Needs Classification

Config: `entities.json`

---

## Commands (Ben-friendly)

Double-click path: use **Foreman Dashboard** → Finance Command section.

Scripts (Maker / optional):

```text
node scripts\foreman\finance-command.mjs summarize
node scripts\foreman\finance-command.mjs validate
node scripts\foreman\finance-command.mjs dashboard-json
node scripts\foreman\finance-command.mjs add-sample
```

PowerShell wrapper:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\foreman\finance-command.ps1 -Action summarize
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\foreman\finance-command.ps1 -Action validate
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\foreman\finance-command.ps1 -Action dashboard
```

---

## Files

| File | Purpose |
|------|---------|
| `entities.json` | Legal/operating entities |
| `payment-rails.json` | Rails with masks only (placeholder) |
| `spend-buckets.json` | Classification buckets |
| `mismatch-rules.json` | Cross-entity / threshold rules |
| `spend-ledger.json` | Manual transaction rows |
| `reimbursement-queue.json` | Reimbursement tracking (no submit) |
| `recurring-saas.json` | Recurring SaaS review list |
| `finance-dashboard.json` | Generated summary for cockpit |

---

## Ayes / Finances integration note

**Petra (ChatGPT)** may inspect connected financial data through **Finances** when Ben asks in that seat.

**Maker / this local repo** does **not** have direct access to Finances-connected data unless a later **approved export/bridge** is built under human gate.

This module is Sally-local JSON only. Ben or Petra may manually transcribe summaries — never paste full account numbers into the repo.

---

## Human gates (always stop)

- Create bank account · create virtual card · change billing method  
- Pay vendor · transfer funds · submit reimbursement  
- Final legal/tax classification · connect financial accounts  
- Import real bank data from new source · store secrets  

---

## Foreman Control Panel

Dashboard card at **http://localhost:4317** — **Refresh Finance Dashboard** button.

See `FINANCE_COCKPIT_REQUIREMENTS.md`.
