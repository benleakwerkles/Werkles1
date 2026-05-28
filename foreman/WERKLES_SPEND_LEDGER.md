# Werkles Spend Ledger

Status: active local cockpit
Last updated: 2026-05-25

This file tracks Werkles operating spend until a dedicated Google Sheet is approved/available. Do not store credit card numbers, API keys, invoices with private data, OAuth tokens, or account credentials here.

Default attribution: `Werkles, Inc (pending)`.

Use this ledger for Werkles product, site, Ghost Forge, AI/image assets, Render, Supabase, Replicate, Anthropic, Midjourney assets, and related build tooling.

Google Sheets status: pending. Codex should create/sync a separate Google Sheet named `Werkles Spend Ledger` when Google Drive authorization is available.

## Live Budget Controls

Ghost Forge Render env caps as currently staged:

- Daily image budget cap: `$1.00`
- Daily Claude budget cap: `$1.00`
- One-prompt image estimate reserve: `$0.20`
- Default Claude request estimate reserve: `$0.02`
- One-prompt preflight estimate: `$0.22`
- Max prompts per first batch: `1`
- Max batch requests per hour: `3`

Rule: Background image generation stays blocked until the one-prompt loop succeeds and Ben explicitly approves a batch budget.

## Ledger

| Date | Company | Vendor | Service / Item | Type | Amount | Cadence | Status | Source | Notes |
|---|---|---|---|---|---:|---|---|---|---|
| 2026-05-25 | Werkles, Inc (pending) | Render | `werkles-ghost-forge1` Starter web service | Actual / recurring | 7.00 | monthly | Active | Ben statement | Ben said he bought `$7/mo` access. Public service URL: `https://werkles-ghost-forge1.onrender.com`. |
| 2026-05-25 | Werkles, Inc (pending) | Supabase | Ghost Forge SQL/storage setup | Actual / infra | 0.00 | n/a | Applied | Codex verification | SQL applied and verified. No new paid Supabase plan recorded here. |
| 2026-05-25 | Werkles, Inc (pending) | Replicate + Anthropic | Ghost Forge one-prompt test | Estimate / pending | 0.22 | one-time | Approved, blocked by model patch deploy | Repo config | Estimate uses `$0.20` image reserve plus `$0.02` Claude reserve. Actual provider billing may differ and must be reconciled later. |
| 2026-05-25 | Werkles, Inc (pending) | Anthropic | Failed Ghost Forge one-prompt attempt | Internal reserve / possible provider check | 0.02 | one-time | Failed before image generation | Render shell output | Request reached worker and failed with `Claude prompt generation failed 404: model: claude-3-5-haiku-latest`. No Replicate image generation occurred. Actual Anthropic billing needs provider reconciliation. |
| 2026-05-25 | Werkles, Inc (pending) | Anthropic | Failed Ghost Forge one-prompt retry after first model patch | Internal reserve / possible provider check | 0.02 | one-time | Failed before image generation | Render shell output | Request reached worker and failed with `Claude prompt generation failed 404: model: claude-3-5-haiku-20241022`. No Replicate image generation occurred. Account model list later showed `claude-haiku-4-5-20251001` is available. |
| 2026-05-26 | Werkles, Inc (pending) | Anthropic | Successful prompt generation before Replicate credit block | Actual / API usage | 0.000761 | one-time | Actual recorded in Supabase | Ghost Forge DB query | Claude generated the one-prompt payload using `claude-haiku-4-5-20251001`; Replicate then blocked image generation for insufficient credit. |
| 2026-05-26 | Werkles, Inc (pending) | Replicate | One-prompt image attempt | Estimate / reserved, not spent | 0.20 | one-time | Blocked by insufficient credit | Ghost Forge DB query | Batch `bfd1dbf7-478d-484c-b2ba-ff57dbaf760e`; output `75735fdc-c80b-4cc6-9a9a-7fd7161fa900` failed before prediction creation. Actual image spend `$0.00`. |
| 2026-05-26 | Werkles, Inc (pending) | Anthropic | Credited retry prompt generation before Replicate credit block | Actual / API usage | 0.000741 | one-time | Actual recorded in Supabase | Ghost Forge DB query | Delta from `$0.000761` to `$0.001502`; Replicate still returned 402 after Ben said credit was done. |
| 2026-05-26 | Werkles, Inc (pending) | Replicate | Credited retry one-prompt image attempt | Estimate / reserved, not spent | 0.20 | one-time | Blocked by insufficient credit | Ghost Forge DB query | Batch `9d0ba70e-f117-40d1-a724-07b33e27529d`; output `b5044f75-bd7b-41ca-9acf-615cd97e3b28` failed before prediction creation. Actual image spend `$0.00`. |
| 2026-05-25 | Werkles, Inc (pending) | Midjourney | Image generation subscription | Actual / recurring | TBD | likely monthly | Active | Ben statement | Ben said Midjourney is already paid. Keep until Ghost Forge completes one-image loop; amount and plan need receipt/provider confirmation. |

## Monthly Run Rate Snapshot

Known recurring run rate:

- Render Starter: `$7.00/mo`
- Midjourney: `TBD/mo` until receipt/plan is confirmed

Known one-time pending test exposure:

- Ghost Forge one-prompt retry after model patch: estimated `$0.22`, with daily provider caps in place
- Current recorded actual provider usage: Claude `$0.001502`; Replicate image actual `$0.00`

## Reconciliation Rules

- Estimates are logged before provider calls.
- Actual charges are reconciled from provider billing pages or receipts later.
- If an expense is shared across companies, mark `Unclassified` until Ben assigns allocation.
- Do not cancel a tool solely because a replacement exists; cancel only after the replacement succeeds for the needed workflow.
- Do not push, deploy, run image batches, or change billing from this ledger.

## Next Money Actions

- Run exactly one Ghost Forge test only after Render login allows a secret-safe execution path.
- Reconcile actual Replicate/Anthropic charges after the one-prompt result lands.
- Confirm Midjourney amount and plan from provider billing or receipt, without pasting private payment info into chat.
- When Ben approves Google Drive sheet creation/update, mirror this ledger into a separate `Werkles Spend Ledger` Google Sheet.
