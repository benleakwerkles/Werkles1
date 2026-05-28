# To Cursor / Claude: Draft Site Asset + UI Pass v0.1

## Status

Approved bounded real-work lane on branch `ben-sandbox`.

Codex remains Foreman / record keeper.

## Read First

- `foreman/NEXT_ACTION.md`
- `foreman/LANES.md`
- `foreman/BUDGET.md`
- `foreman/HUMAN_GATES.md`
- `foreman/ACTIVE_AGENT.md`
- `foreman/DESIGN_SYSTEM.md`

## Goal

Use the draft Ghost Forge site assets to make visible Werkles UI/UX improvements that Ben can see and test locally.

## Allowed File Areas

- `app/page.tsx`
- `app/proof/page.tsx`
- `app/membership/page.tsx`
- `app/pricing/page.tsx`
- `app/dashboard/**`
- `components/**`
- `app/globals.css`
- `lib/copy.ts`
- `lib/design-tokens.ts`
- `public/assets/**`

## Forbidden

- no edits outside allowed file areas
- no push
- no deploy
- no SQL/RLS/schema changes
- no secrets
- no provider/account/billing changes
- no additional Ghost Forge/image generation
- no Bellows
- no production data mutation
- do not treat draft assets as final brand approval

## Design Direction

Use `foreman/DESIGN_SYSTEM.md` as palette law. The work should feel like a serious foundry cockpit for business partner matching: dark, precise, copper-framed, violet/teal brand moments, useful over ornamental.

## Stop Condition

Stop after local typecheck/build, route smoke test, and screenshots are ready for Ben review.

## Draft Assets Available

Use these local repo assets as draft/review-only materials:

- `/assets/draft/ghost-forge/werkles-draft-hero-foundry-v0.1.png`
- `/assets/draft/ghost-forge/werkles-draft-proof-trust-v0.1.png`

Do not treat them as final brand approval. They are visual material for the local UI pass only.

## Asset Result Record

- `foreman/ghost-forge/DRAFT_SITE_ASSET_RESULTS_v0.1.md`
