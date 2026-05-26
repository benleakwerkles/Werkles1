# Reimbursement and Intercompany Log

Status: active local cockpit
Last updated: 2026-05-25

Use this log when the payer and beneficiary are not the same. This keeps commingling visible instead of hidden.

This is not legal/tax advice. Final treatment should be confirmed with a CPA/bookkeeper/attorney.

## Cleanup Table

| Date | Paid By | Benefiting Company | Vendor | Amount | Proposed Cleanup | Status | Evidence | Notes |
|---|---|---|---|---:|---|---|---|---|
| 2026-05-25 | Unknown | Werkles, Inc (pending) | Render | 7.00 | Determine payer; if personal, classify as reimbursement/contribution TBD | Needs payer | Ben statement | Render Starter for Ghost Forge. |
| 2026-05-25 | Unknown | Werkles, Inc (pending) | Midjourney | TBD | Determine payer and amount; likely Werkles if used for assets | Needs receipt | Ben statement | Do not cancel solely because Ghost Forge exists; wait for one-image loop success. |
| 2026-05-25 | Unknown | Werkles, Inc (pending) | Anthropic | 0.02 | Reconcile failed one-prompt attempt against provider billing; payer/treatment TBD | Needs provider reconciliation | Render shell output | Failed before image generation with Claude model 404. |
| 2026-05-25 | Unknown | Werkles, Inc (pending) | Anthropic | 0.02 | Reconcile failed one-prompt retry against provider billing; payer/treatment TBD | Needs provider reconciliation | Render shell output | Failed before image generation with dated Claude 3.5 Haiku model 404. |

## Cleanup Types

- `Reimbursement TBD`: Ben paid personally and company may reimburse later.
- `Owner contribution TBD`: Ben paid personally and may leave it as contribution/startup funding.
- `Intercompany payable TBD`: one company paid another company's cost.
- `Allocation needed`: one charge benefits multiple companies.
- `No cleanup needed`: payer and beneficiary match.

## Evidence To Attach Later

- Provider receipt or invoice.
- Billing page screenshot or exported receipt.
- Payment account/card owner, without card number.
- Notes explaining business purpose.
- Approval note from Ben or advisor.
