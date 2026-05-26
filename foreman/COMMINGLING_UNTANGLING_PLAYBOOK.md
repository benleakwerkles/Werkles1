# Commingling Untangling Playbook

Status: active local cockpit
Last updated: 2026-05-25

Purpose: help Ben separate expenses by company, identify messy charges, and prepare clean notes for a bookkeeper, CPA, attorney, or future finance tool. This is operating hygiene, not legal/tax advice.

## Authority References

- IRS Publication 583 says business records should clearly show income and expenses, and that if you are in more than one business, you should keep a complete and separate set of records for each business.
- IRS Publication 583 also notes a business checking account should be kept separate from a personal checking account.
- SBA guidance says business bank accounts help keep business funds separate from personal funds and can support limited personal liability protection.

## Core Rule

Do not ask, "Which company feels like the parent?"

Ask:

1. Which company received the benefit?
2. Which account/card actually paid?
3. Was the payment personal, company, or wrong-company?
4. Is this a reimbursement, owner contribution, intercompany receivable/payable, or unclassified item?
5. What proof exists?

## Decision Tree

### 1. Direct Company Expense

Use when the same company benefited and paid.

Example: Werkles Render worker paid by a Werkles card.

Action:

- Log in that company's ledger.
- Attach receipt later.
- No cleanup entry needed.

### 2. Personal Paid For Company

Use when Ben personally paid for a company cost.

Example: Ben's personal card paid Render for Werkles.

Action:

- Log in the benefiting company's ledger.
- Mark payment source as `Ben personal - reimbursement/contribution TBD`.
- Add a row to `foreman/REIMBURSEMENT_AND_INTERCOMPANY_LOG.md`.
- Accountant later decides reimbursement, owner contribution, or startup cost treatment.

### 3. One Company Paid For Another Company

Use when Company A paid a cost that benefited Company B.

Example: Valley Vanguard card paid Werkles SaaS.

Action:

- Log the operating expense in Company B's ledger.
- Add an intercompany cleanup row: `Company A paid / Company B benefited`.
- Do not silently move it into the paying company's ledger as if it benefited that company.

### 4. Shared / Mixed Benefit

Use when one charge benefits multiple companies.

Example: a tool used for both Werkles and Valley Microfutures.

Action:

- Put it in `foreman/UNCLASSIFIED_SPEND_INBOX.md`.
- Assign `Allocation needed`.
- Do not split until Ben chooses a reasonable allocation rule or an advisor gives one.

### 5. Unknown Charge

Use when the vendor/benefit/payment source is unclear.

Action:

- Put it in `foreman/UNCLASSIFIED_SPEND_INBOX.md`.
- Do not classify by guess.
- Gather receipt/provider page later.

## Practical Entity Defaults

- Werkles product/tool/image/site costs: `Werkles, Inc (pending)`.
- Ghost Forge Render/Supabase/Replicate/Anthropic costs: `Werkles, Inc (pending)`.
- Midjourney used for Werkles assets: `Werkles, Inc (pending)`.
- Umbrella/company-formation/admin costs: `Valley Vanguard` only if Ben explicitly says it supports the umbrella company.
- Valley Microfutures costs: `Valley Microfutures` only if specifically tied to that company/project.
- Kind Sir Holdings: create a dedicated ledger only when Ben starts assigning charges or legal/entity work there.

## Cleanup Status Labels

- `Clean`: paid by correct entity and logged.
- `Needs receipt`: amount/entity known, receipt missing.
- `Personal paid`: Ben paid personally for a company item.
- `Wrong-company paid`: one company paid another company's item.
- `Allocation needed`: mixed benefit, no allocation rule yet.
- `Advisor review`: legal/tax/accounting treatment needs professional review.
- `Corrected`: reimbursement/intercompany correction has been made and documented.

## Do Not

- Do not store card numbers, bank account numbers, passwords, OAuth tokens, API keys, or secret values.
- Do not invent tax treatment.
- Do not erase the fact that the wrong account paid.
- Do not call a personal payment "company paid" just because the expense is company-related.
- Do not use Valley Vanguard as a junk drawer for every early charge.
- Do not mix receipts from multiple companies into one primary ledger.

## Human Gates

Ben or a professional must approve:

- Reimbursement decisions.
- Intercompany payable/receivable treatment.
- Capital contribution treatment.
- Tax categorization.
- Entity formation or ownership choices.
- Any banking, credit card, payroll, or accounting system setup.
