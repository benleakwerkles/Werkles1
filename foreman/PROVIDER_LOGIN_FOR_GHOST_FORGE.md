# Provider Login For Ghost Forge

STATUS: RENDER SERVICE CREATED; ENV FINALIZATION / LOGIN MAY STILL BE REQUIRED

This is a no-copy provider login kit for the Ghost Forge one-prompt setup. It does not contain secrets and does not authorize SQL application, provider API calls, Ghost Forge execution, Bellows execution, background image generation, or additional deploys beyond Ben's explicit Render action.

Current Render service:

- Service name: `werkles-ghost-forge1`
- Service ID: `srv-d8a8icf7f7vs73ct7ep0`
- Public URL: `https://werkles-ghost-forge1.onrender.com`
- Dashboard: `https://dashboard.render.com/web/srv-d8a8icf7f7vs73ct7ep0`
- Environment page: `https://dashboard.render.com/web/srv-d8a8icf7f7vs73ct7ep0/env`
- Plan: Starter, approved/selected by Ben on 2026-05-25.
- `PUBLIC_BASE_URL`: `https://werkles-ghost-forge1.onrender.com`

## Human Gates Are Not Errands

Codex/Cowork must do mechanical prep and provider navigation before stopping. Ben should not have to manually find dashboards, hunt menus, copy long values, or interpret provider UI when Codex can drive there.

For this gate, Codex/Cowork should open Render to the Ghost Forge service setup path in the controllable browser. Ben only completes login, OAuth, account, organization, or billing/account prompts personally, then says:

```text
PROVIDER LOGIN DONE
```

Codex must never enter, print, save, or request secrets in chat, and must never click final create/deploy/billing/approval buttons without explicit approval.

## 1. First Provider Account

Codex/Cowork should open Render first. Ben handles only the Render login/OAuth/account prompts if the provider requires them.

Reason: Render is where the Ghost Forge worker web service will eventually be staged. The service URL from Render will later become `PUBLIC_BASE_URL`.

## 2. Exact Dashboard Page

Codex/Cowork should open the Render Web Service setup route:

```text
https://dashboard.render.com/new/web-service
```

If Render changes or rejects that direct route, Codex/Cowork should fall back to the Render dashboard and drive to New > Web Service:

```text
https://dashboard.render.com/
```

If Render sends the browser to a login page, Ben completes login there. If Render asks for OAuth, account selection, organization selection, or billing/account confirmation, that is Ben-only.

After Render login is done, Codex/Cowork should open the Supabase projects dashboard when the flow reaches the SQL preparation step:

```text
https://supabase.com/dashboard/projects
```

Supabase login is also Ben-only.

## 3. What Ben Must Do Manually

- Let Codex/Cowork drive to the Render page in the controllable Chrome/browser session.
- Log into Render only when Render itself asks for Ben's credentials or OAuth/account approval.
- Complete any Render OAuth, organization, or account-selection prompts.
- Do not create or deploy the service unless Codex has stopped and asked for that specific approval.
- After Render login is complete, log into Supabase only when Codex opens or uses the Supabase dashboard and Supabase itself asks for Ben's credentials or OAuth/account approval.
- Complete any Supabase OAuth, organization, project-selection, or account prompts.
- Tell Codex exactly:

```text
PROVIDER LOGIN DONE
```

## 4. What Ben Must Not Paste Into Chat

Do not paste any of these into Codex, ChatGPT, Claude, Gemini, DeepSeek, Perplexity, or any chat window:

- Passwords
- OAuth approval links or codes
- Billing or credit card information
- API keys
- Service role keys
- Database URLs
- Webhook secrets
- Render private environment values
- Supabase private project credentials
- Recovery codes
- Any private secret copied from a provider dashboard

## 5. Env Var Names Only

Secret/private env var names:

- `GHOST_FORGE_API_KEY`
- `ANTHROPIC_API_KEY`
- `REPLICATE_API_TOKEN`
- `REPLICATE_WEBHOOK_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PUBLIC_BASE_URL`

Non-secret first-test env var names:

- `PORT`
- `SUPABASE_BUCKET`
- `MAX_PROMPTS_PER_BATCH`
- `DAILY_BUDGET_USD`
- `DAILY_CLAUDE_BUDGET_USD`
- `DEFAULT_COST_PER_IMAGE_USD`
- `REPLICATE_CONCURRENCY`
- `REPLICATE_WAVE_DELAY_MS`
- `MAX_IMAGE_BYTES`
- `MAX_BATCH_REQUESTS_PER_HOUR`
- `DEFAULT_REPLICATE_MODEL`
- `MODEL_COSTS_JSON`

## 6. Where Env Vars Eventually Go

Eventually, all Ghost Forge worker env vars should be entered privately in:

```text
Render Dashboard -> Ghost Forge Web Service -> Environment
```

Provider/project values are obtained privately from:

- Supabase Dashboard for `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Anthropic Console for `ANTHROPIC_API_KEY`
- Replicate Dashboard for `REPLICATE_API_TOKEN` and `REPLICATE_WEBHOOK_SECRET`
- Render Dashboard for the final service URL used as `PUBLIC_BASE_URL`

Ben must enter private values himself or approve a provider-native secret manager flow. Codex must not see, print, store, or transmit secret values.

## 7. What Codex Will Do After Ben Says PROVIDER LOGIN DONE

Codex will continue mechanical prep only:

- Confirm Render and Supabase dashboards are reachable in the controllable browser session.
- Navigate provider UI as far as possible without requiring Ben-only authority.
- Stage the Render Web Service setup using the known non-secret settings:
  - Repo: `benleakwerkles/Werkles1`
  - Branch: `ghost-forge-one-prompt-test`
  - Root Directory: `ghost-forge-worker`
  - Build Command: `npm install`
  - Start Command: `npm start`
  - Auto Deploy: off, if Render allows it
- Stop before final Render service creation/deploy approval.
- Open or stage the Supabase SQL editor for the Ghost Forge SQL file.
- Stop before applying SQL.
- Keep all secret values out of chat and repo files.

## 8. What Remains Blocked After Provider Login

Provider login alone does not approve:

- Applying Supabase SQL
- Creating/deploying the Render service
- Entering private env var values
- Entering OAuth approvals on Ben's behalf
- Entering billing/payment/account settings
- Running `health-check.ps1`
- Running `one-prompt-test.ps1`
- Running Ghost Forge
- Running Bellows
- Generating images
- Publishing Learning Corner content
- Pushing to git
- Deploying anything

## 9. Next Expected Gate

After provider login is complete, the next expected gate is:

```text
[AWAITING HUMAN GATE: GHOST_FORGE_SERVICE_CREATE_APPROVAL]
```

At that gate, Codex should have the Render service setup staged as far as possible without final create/deploy approval.
