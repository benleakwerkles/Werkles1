# Draft Site Asset Results v0.1

Status: DRAFT - HUMAN REVIEW REQUIRED BEFORE FINAL BRAND USE

Approval phrase: `APPROVE DRAFT SITE ASSET + UI PASS v0.1`

## Summary

Ghost Forge attempted a draft site asset run for Werkles on `ben-sandbox`.

The running Render service is currently configured with `MAX_PROMPTS_PER_BATCH=1`, so the approved 10-image request could not be submitted as a single batch.

Codex stayed within the approved budget and submitted single-image requests instead.

## Results

Generated and downloaded locally:

1. Homepage hero foundry environment
   - Local file: `public/assets/draft/ghost-forge/werkles-draft-hero-foundry-v0.1.png`
   - Batch ID: `579430bb-52f4-49bb-b3c5-85b168d5a5bb`
   - Output ID: `3497453a-a5fa-4812-b79d-a1f039a1427c`
   - Prediction ID: `ebffww5qzsrmr0cycxysj9nntc`
   - Storage path: `579430bb-52f4-49bb-b3c5-85b168d5a5bb/hero-background/3497453a-a5fa-4812-b79d-a1f039a1427c.png`
   - Status: `completed`

2. Proof / trust signal environment
   - Local file: `public/assets/draft/ghost-forge/werkles-draft-proof-trust-v0.1.png`
   - Batch ID: `412fde31-2493-4194-a1b7-34a3088c7ee2`
   - Output ID: `4b88159c-ce98-41a2-acaf-29582a2f5000`
   - Prediction ID: `7sz29tqvadrmy0cycxz95jf2pw`
   - Storage path: `412fde31-2493-4194-a1b7-34a3088c7ee2/hero-background/4b88159c-ce98-41a2-acaf-29582a2f5000.png`
   - Status: `completed`

## Attempted But Not Completed

- A 10-count request returned `400 Count exceeds MAX_PROMPTS_PER_BATCH (1)` before image generation.
- One single-image request returned Replicate `429` due the account's low-credit prediction burst limit. It did not create a Replicate prediction.
- A later single-image request returned Ghost Forge `429` due the worker's batch request rate limit.

## Budget Notes

Approved budget:

- max image spend: `$2.50`
- max Claude prompt spend: `$0.10`
- daily cap: `$3.00`

Observed from request responses:

- completed image requests: `2`
- estimated image spend from completed requests: `$0.40`
- Claude prompt requests attempted before worker-level throttling: `3`
- conservative Claude reservation ceiling from worker defaults: `$0.06`

No secrets were printed or saved.
No deploy, push, SQL/RLS/schema change, provider/account/billing change, Bellows run, or production data mutation was performed beyond the approved Ghost Forge draft batch records.

## Draft Review Notes

Both assets are industrial/foundry environments with no readable text. They are useful as draft atmosphere and UI texture sources, especially for homepage/proof/dashboard treatment. They are not final brand approval.

## Next Use

Cursor/Claude may use these local files for the approved visible UI/UX pass:

- `/assets/draft/ghost-forge/werkles-draft-hero-foundry-v0.1.png`
- `/assets/draft/ghost-forge/werkles-draft-proof-trust-v0.1.png`
