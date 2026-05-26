# Current State

Ghost Forge branch is pushed:

```text
origin/ghost-forge-one-prompt-test
commit: 0f57a01 ghost-forge: add one-prompt test worker scaffold
```

Ghost Forge deployment prep has advanced to a human-created Render service.

Render service state:

- Service name: `werkles-ghost-forge1`
- Service ID: `srv-d8a8icf7f7vs73ct7ep0`
- Public URL: `https://werkles-ghost-forge1.onrender.com`
- Dashboard: `https://dashboard.render.com/web/srv-d8a8icf7f7vs73ct7ep0`
- Environment page: `https://dashboard.render.com/web/srv-d8a8icf7f7vs73ct7ep0/env`
- Repo: `benleakwerkles/Werkles1`
- Branch: `ghost-forge-one-prompt-test`
- Root directory: `ghost-forge-worker`
- Commit: `0f57a01 ghost-forge: add one-prompt test worker scaffold`
- Instance type: Starter, approved/selected by Ben on 2026-05-25.
- Create/deploy action: clicked by Ben in Render. Codex did not click deploy and did not enter secrets.
- `PUBLIC_BASE_URL` should be set in Render to `https://werkles-ghost-forge1.onrender.com`.
- Render environment variables: saved privately by Ben on 2026-05-25. Codex did not see, print, or store secret values.

Prepared helper files:

- `ghost-forge-worker/apply-supabase-sql.README.md`
- `ghost-forge-worker/apply-supabase-sql.ps1`
- `ghost-forge-worker/render-setup.README.md`
- `ghost-forge-worker/render-env-checklist.md`
- `ghost-forge-worker/health-check.ps1`
- `ghost-forge-worker/one-prompt-test.ps1`

Current gates:

- Supabase SQL was applied by Codex on 2026-05-25 after Ben approval.
- SQL verification passed:
  - `ghost_forge_batches`: true
  - `ghost_forge_outputs`: true
  - `ghost_forge_spend`: true
  - `ghost_forge_claude_spend`: true
  - private storage bucket `ghost-forge`: true
  - RLS enabled on all Ghost Forge tables: true
- Render service exists and private env values were saved by Ben.
- Secrets have not been entered in Codex and remain out of repo/chat.
- Health check passed on 2026-05-25:
  - URL: `https://werkles-ghost-forge1.onrender.com/health`
  - Response: `{"ok":true,"service":"ghost-forge-worker","renderer":"replicate"}`
- One-prompt image test has not run.
- Batch mode is blocked.

SQL safety:

- `public.ghost_forge_reserve_claude_spend` exists.
- It uses `SELECT ... FOR UPDATE`.
- It updates Claude estimated spend inside the same function.
- SQL locking is SAFE for one-prompt test after manual SQL/env/deploy setup.

Unrelated local changes remain present and must not be mixed into Ghost Forge deployment.

## Palette Lockdown v0.2

Palette: v0.2 locked (sampled from app icon, workshop banner, helper avatar)
Source of truth: foreman/DESIGN_SYSTEM.md
Swatch sheet: foreman/design/werkles_palette_v0.2.html
v0.1 superseded and removed.

- Palette v0.2 applied: yes
- DESIGN_SYSTEM.md updated: yes (VERSION = 0.2)
- Swatch sheet created at foreman/design/werkles_palette_v0.2.html: yes
- v0.1 swatch sheet removed (if existed): no v0.1 file was present in foreman/design at lockdown time
- Constitution Article VIII rewritten: yes
- UX Law reconciled to palette v0.2 source of truth: yes
- AI_COUSINS_PROTOCOL.md updated with Ender brand-mark sentence: yes
- v0.1 tokens removed (no conflicting aliases): yes
- Unrelated local changes touched: no
- Secrets in any file or log: no
- Current NEXT_ACTION: [AWAITING HUMAN GATE: next product packet — palette locked, components not yet built]

## Constitution Open-Questions Patches

- Constitution version bumped to v0.2.1: yes
- Article V #1 pricing paragraph added: yes
- Article VI Deletion/Anonymization section expanded: yes
- Article II Worker Lane paragraph rewritten: yes
- Article XV Worker Lane Protection added (six subsections + closing sentence): yes
- Article I "Lock the Joints" canonical UI language locked: yes
- Article V #1 annual plan flavor name changed to "The Long Run": yes
- Article V #5 Sponsored Anvils additional rules added: yes
- Article VIII palette law preserved during open-question patch: confirmed yes (no palette law changed)
- Unrelated local changes touched: no
- Current NEXT_ACTION after this packet: [AWAITING HUMAN GATE: pricing lockdown — see TO_OPERATOR_werkles_pricing_audit.md]

## Pricing

Source of truth: company/PRICING.md
Status: v0.1 LOCKED for Tier 1 surfaces (Foundry Dues, Armory anchors, Crucible passthrough, Drafting Table bundling). Tier 2 surfaces (Sponsored Anvils, affiliates) have principles locked but specific rates deferred until launch metro is chosen and vendors are negotiated.

Anchors:
- Foundry Dues — Monthly: $9.99/mo
- Foundry Dues — Annual: $99/yr (flavor name: "The Long Run")
- The Armory: $9.99 / $19 / $29 / $49 / $99 bundle anchors with member discounts
- The Crucible: passthrough + $5 handling fee max
- The Drafting Table: bundled into Foundry Dues for members
- Sponsored Anvils: principles per Constitution Article V; rates deferred

Hard bans:
- No transaction-based comp on user-to-user deals
- No tiered membership
- No pay-for-visibility or pay-for-better-matches
- No holding/moving/escrowing money between users

- company/PRICING.md created: yes
- CURRENT_STATE.md updated with Pricing block: yes
- Constitution path reference corrected from foreman/ to company/ (if applicable): yes
- NEXT_ACTION.md updated: yes
- Unrelated local changes touched: no
- Secrets in any file or log: no
- Current NEXT_ACTION: [AWAITING HUMAN GATE: app infrastructure / UX work may now begin. Pricing is locked. Stripe products can be created against company/PRICING.md anchors. The Crucible verification UX can be built against the passthrough+handling rules.]

## Spend Tracking

Sources of truth:

- `foreman/SPEND_LEDGER_INDEX.md`
- `foreman/WERKLES_SPEND_LEDGER.md`
- `foreman/VALLEY_VANGUARD_SPEND_LEDGER.md`
- `foreman/VALLEY_MICROFUTURES_SPEND_LEDGER.md`
- `foreman/COMMINGLING_UNTANGLING_PLAYBOOK.md`
- `foreman/UNCLASSIFIED_SPEND_INBOX.md`
- `foreman/REIMBURSEMENT_AND_INTERCOMPANY_LOG.md`

Status: active local cockpit as of 2026-05-25.

- Google Drive was searched for a Werkles finance/spend tracker; no clear existing ledger was found.
- Google Sheet creation was attempted and denied by the connector permission prompt.
- Current confirmed recurring run rate: Render Starter for Ghost Forge at `$7.00/mo`, attributed to `Werkles, Inc (pending)`.
- Midjourney is active/paid per Ben, amount TBD pending receipt/provider confirmation.
- Ghost Forge one-prompt test preflight estimate: `$0.22`, attributed to `Werkles, Inc (pending)`.
- Valley Vanguard has no confirmed logged charges yet.
- Valley Microfutures has no confirmed logged charges yet.
- Commingling cleanup system created: messy charges go to the unclassified inbox; payer/beneficiary mismatches go to reimbursement/intercompany log.
- Background image generation remains blocked until one-prompt test success and explicit batch budget approval.

## Ghost Forge One-Prompt Attempt

- One-prompt test was approved by Ben and attempted from Render Web Shell on 2026-05-25.
- Result: `{"ok":false,"error":"Claude prompt generation failed 404: model: claude-3-5-haiku-latest"}`
- HTTP status: `500`
- No image was generated.
- Root cause: running worker hardcoded `claude-3-5-haiku-latest`.
- Local patch applied:
  - `ANTHROPIC_MODEL` env/default support added.
  - Default set to stable dated model `claude-3-5-haiku-20241022`.
  - README and Render checklist updated.
- Local check: `node --check ghost-forge-worker/server.mjs` passed.
- Next gate: `[AWAITING HUMAN GATE: GHOST_FORGE_MODEL_PATCH_PUSH_DEPLOY_APPROVAL]`
