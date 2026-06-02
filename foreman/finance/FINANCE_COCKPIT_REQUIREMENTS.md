# Finance Cockpit Requirements v0.1

Status: spec for Foreman Control Panel integration

## Doctrine (locked)

**Finance tracker = local Operator Cockpit module.**

- **Not** bank connection  
- **Not** accounting finalization  
- **Not** moving money  
- **Not** creating cards  
- **Not** storing account/card secrets  

---

## Dashboard card — Finance Command

When Foreman Control Panel is available (`http://localhost:4317`), expose:

| Widget | Source |
|--------|--------|
| Month-to-date spend by entity | `finance-dashboard.json` → `month_to_date_by_entity` |
| AI/API spend this month | `ai_api_spend_this_month_usd` |
| Unclassified transactions | `unclassified_count` + `needs_classification` |
| Cross-entity mismatch warnings | `mismatch_warnings` |
| Reimbursement queue | `reimbursement_queue_count` |
| Recurring SaaS review | `recurring_saas_review_count` |
| Human gates | static list — no automation |

### Actions

- **Refresh Finance Dashboard** — runs `dashboard-json`, reloads card
- Blocked finance actions show **HUMAN GATE REQUIRED**

---

## Data entry (v0.1)

Manual JSON edits to `spend-ledger.json` or future approved import bridge.

Each ledger row fields:

`id`, `date`, `merchant`, `amount`, `currency`, `source_account_label`, `source_account_mask`, `actual_entity`, `expected_entity`, `spend_bucket`, `project`, `lane`, `recurring`, `reimbursable`, `needs_cpa_review`, `needs_legal_review`, `status`, `notes`

Statuses: `draft` | `needs_classification` | `classified` | `reimbursement_needed` | `resolved`

---

## Mismatch rules (active)

1. Werkles AI/API on Kind Sir or Valley accounts  
2. Valley R&D on Werkles  
3. Kind Sir ops on Werkles  
4. Personal reimbursable expenses  
5. Unknown merchant/entity  
6. Recurring SaaS without entity  
7. Large unknown bucket (≥ $250 default)  
8. Unknown entity over threshold (≥ $25 default)  

Thresholds in `mismatch-rules.json`.

---

## Security requirements

- Never store full PAN, routing, CVV, bank tokens, API keys  
- Validate on every dashboard refresh  
- Scan all finance JSON for forbidden keys and digit patterns  

---

## Future (not v0.1)

- CSV import with human gate  
- Finances export bridge (Petra-approved)  
- Load packet style buttons tied to reimbursement queue  
- Power Automate **does not** submit reimbursements  

---

## Integration point

Control panel reads `foreman/finance/finance-dashboard.json` after:

```text
node scripts/foreman/finance-command.mjs dashboard-json
```

Or via POST action `refresh-finance-dashboard`.
