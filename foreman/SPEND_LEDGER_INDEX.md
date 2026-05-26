# Spend Ledger Index

Status: active local cockpit
Last updated: 2026-05-25

Use separate primary ledgers per company/entity, then roll up later. This avoids commingling expenses, keeps access boundaries clearer, and gives an accountant cleaner source records.

Google Sheets recommendation:

- Create one Google Sheet file per company/entity.
- Add a separate consolidated roll-up later only after the entity map stabilizes.
- Do not use one giant workbook with many tabs as the primary accounting source unless Ben explicitly chooses convenience over clean boundaries.

Untangling support files:

- `foreman/COMMINGLING_UNTANGLING_PLAYBOOK.md`
- `foreman/UNCLASSIFIED_SPEND_INBOX.md`
- `foreman/REIMBURSEMENT_AND_INTERCOMPANY_LOG.md`

## Primary Ledgers

| Company / Entity | Local ledger | Google Sheet target | Default use |
|---|---|---|---|
| Werkles, Inc (pending) | `foreman/WERKLES_SPEND_LEDGER.md` | `Werkles Spend Ledger` | Werkles operating costs, product/site, Ghost Forge, Render, Supabase, Replicate, Anthropic, Midjourney assets |
| Valley Vanguard | `foreman/VALLEY_VANGUARD_SPEND_LEDGER.md` | `Valley Vanguard Spend Ledger` | Umbrella/top-company costs, strategic/admin infrastructure explicitly assigned by Ben |
| Valley Microfutures | `foreman/VALLEY_MICROFUTURES_SPEND_LEDGER.md` | `Valley Microfutures Spend Ledger` | Valley Microfutures-specific costs explicitly assigned by Ben |

## Entity Draft

- `Valley Vanguard`: very-top umbrella candidate.
- `Kind Sir Holdings`: legacy/family holdco candidate; create its own ledger only when Ben starts assigning charges or entity work there.
- `Werkles, Inc (pending)`: operating company for Werkles product.
- `Valley Microfutures`: separate company/project lane.

This is operating organization, not legal/tax advice. Confirm structure with a professional before tax filings, reimbursements, capitalization, or intercompany accounting.

## Logging Rules

- Attribute spend to the company that actually benefits from the cost.
- Werkles product/tool/image costs go to Werkles unless Ben says otherwise.
- Holding-company costs go to Valley Vanguard or Kind Sir Holdings only when the item truly supports the holdco/umbrella function.
- Shared costs stay `Unclassified` until Ben assigns allocation.
- Estimates are allowed, but must be marked `Estimate / pending`.
- Actual charges require a provider bill, receipt, or Ben statement.

## Cleanup Flow

1. Put messy charges in `foreman/UNCLASSIFIED_SPEND_INBOX.md`.
2. Use `foreman/COMMINGLING_UNTANGLING_PLAYBOOK.md` to choose the likely beneficiary and cleanup type.
3. If payer and beneficiary differ, add a row to `foreman/REIMBURSEMENT_AND_INTERCOMPANY_LOG.md`.
4. Move clean charges into the correct company ledger after evidence and treatment are clear.
