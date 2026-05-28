# Unclassified Spend Inbox

Status: active local cockpit
Last updated: 2026-05-25

Use this inbox for charges that are real but not clean enough to put directly into a company ledger. Do not store private payment data or secrets.

## Intake Table

| Date | Vendor | Amount | Paid From | Likely Beneficiary | Problem | Proposed Treatment | Status | Receipt / Evidence | Notes |
|---|---|---:|---|---|---|---|---|---|---|
| 2026-05-25 | Midjourney | TBD | Unknown | Werkles, Inc (pending) | Amount and payment source not confirmed | Log in Werkles after receipt/plan confirmation | Needs receipt | Ben statement | Ben said Midjourney is already paid and may still be useful for asset work. |
| 2026-05-25 | Render | 7.00 | Unknown | Werkles, Inc (pending) | Payment source not confirmed | Keep in Werkles; reimbursement/contribution treatment TBD if paid personally | Needs payment-source classification | Ben statement | Render Starter for `werkles-ghost-forge1`. |
| 2026-05-25 | Anthropic | 0.02 | Unknown | Werkles, Inc (pending) | Failed API attempt may or may not bill; internal reserve was recorded before model 404 | Reconcile against Anthropic billing later | Needs provider reconciliation | Render shell output | No image generated; error was `claude-3-5-haiku-latest` 404. |
| 2026-05-25 | Anthropic | 0.02 | Unknown | Werkles, Inc (pending) | Failed retry may or may not bill; internal reserve was recorded before model 404 | Reconcile against Anthropic billing later | Needs provider reconciliation | Render shell output | No image generated; error was `claude-3-5-haiku-20241022` 404. |
| 2026-05-26 | Replicate | TBD | Ben/provider billing | Werkles, Inc (pending) | Replicate requires credit before image generation | Ben decides whether/how much credit to add | Human billing gate | Render shell output | Billing page: `https://replicate.com/account/billing#billing`. Do not enter billing automatically. |
| 2026-05-26 | Replicate | TBD | Ben/provider billing | Werkles, Inc (pending) | Ben said credit was done, but Replicate still returned 402 after 120-second wait | Confirm credit is posted/usable or wait longer | Human billing gate | Render shell output | No prediction created; no image spend. |

## Inbox Rules

- If `Paid From` is personal, add a row to `foreman/REIMBURSEMENT_AND_INTERCOMPANY_LOG.md`.
- If `Paid From` is a different company, add a row to `foreman/REIMBURSEMENT_AND_INTERCOMPANY_LOG.md`.
- If amount is unknown, keep `TBD` until provider billing or receipt confirms it.
- If beneficiary is unknown, do not force it into a company ledger.
