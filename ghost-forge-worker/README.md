# Ghost Forge Worker

Ghost Forge is a cloud-resident image generation worker for Werkles brand assets. The default rendering backend is Replicate. The future fallback lane is fal.ai, but this scaffold does not implement that adapter yet.

This worker is not for Sally. Do not run local image generation, local GPU tools, local upscalers, Stable Diffusion, ComfyUI, Automatic1111, Discord automation, or unofficial Midjourney wrapper flows.

## What This Does

- `POST /batch/create` accepts an authorized brief and count.
- Claude turns the brief into structured prompt objects.
- The Cost Governor validates count, estimates image spend before Claude runs, checks daily image and Claude budgets, and reserves spend before API calls.
- Replicate creates one prediction per prompt with a webhook callback.
- `POST /webhook/replicate` verifies Replicate webhook signatures, downloads the generated image, uploads it to a private Supabase Storage bucket, and updates metadata.
- `GET /batches/:id` returns batch and output status to authorized callers only.

## Install

```bash
cd ghost-forge-worker
npm install
cp .env.example .env
```

Fill `.env` in your cloud provider or local test shell. Do not commit `.env`.

## Environment Variables

```bash
PORT=3000
PUBLIC_BASE_URL=https://your-ghost-forge-worker.example.com
GHOST_FORGE_API_KEY=replace-with-long-random-secret
ANTHROPIC_API_KEY=replace-with-claude-api-key
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
REPLICATE_API_TOKEN=replace-with-replicate-api-token
REPLICATE_WEBHOOK_SECRET=replace-with-replicate-webhook-secret
DEFAULT_REPLICATE_MODEL=ideogram-ai/ideogram-v3-quality
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=replace-with-service-role-key
SUPABASE_BUCKET=ghost-forge
MAX_PROMPTS_PER_BATCH=50
MAX_BATCH_REQUESTS_PER_HOUR=10
DAILY_BUDGET_USD=25.00
DEFAULT_COST_PER_IMAGE_USD=0.09
MODEL_COSTS_JSON={"ideogram-ai/ideogram-v3-quality":0.09}
DAILY_CLAUDE_BUDGET_USD=1.00
DEFAULT_CLAUDE_COST_PER_REQUEST_USD=0.02
CLAUDE_INPUT_COST_PER_MILLION_USD=1.00
CLAUDE_OUTPUT_COST_PER_MILLION_USD=5.00
REPLICATE_CONCURRENCY=5
REPLICATE_WAVE_DELAY_MS=2000
MAX_IMAGE_BYTES=26214400
```

## Supabase

Run this SQL before starting the worker against a real Supabase project:

```text
ghost-forge-worker/supabase-ghost-forge.sql
```

It creates:

- private storage bucket `ghost-forge`
- `ghost_forge_batches`
- `ghost_forge_outputs`
- `ghost_forge_spend`
- `ghost_forge_claude_spend`
- atomic spend reservation helpers
- RLS enabled with no anon/authenticated policies

The service role key stays server-side in the worker only.

## Run

```bash
npm start
```

Health check:

```bash
curl "$PUBLIC_BASE_URL/health"
```

## Cheap Cloud Deploy Notes

### Render

1. Create a new Web Service.
2. Point it at the repo and set root directory to `ghost-forge-worker`.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add all environment variables in Render's dashboard.

### Fly.io

1. Create a Fly app from `ghost-forge-worker`.
2. Use Node 20+.
3. Set secrets with `fly secrets set`.
4. Use `npm start` as the process command.

Do not deploy until the Operator approves.

## One-Prompt Test

The first test must be exactly one brief, one prompt, one model, one Replicate prediction, one webhook callback, and one uploaded Supabase asset.

```bash
curl -X POST "$PUBLIC_BASE_URL/batch/create" \
  -H "Authorization: Bearer $GHOST_FORGE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "brief": "Create one premium Werkles homepage hero background. Brutalist midnight fortress, mythic capitalism, dark industrial optimism, blackened steel, brushed copper, bronze sparks, subtle gears and ladders, warm foundry glow, dream job energy, serious not childish, not pastel SaaS, not video game portal. Aspect ratio 16:9.",
    "count": 1,
    "model": "ideogram-ai/ideogram-v3-quality",
    "metadata": {
      "project": "werkles",
      "source": "operator"
    }
  }'
```

## Safety Warnings

- Do not run batches until the first one-prompt path succeeds.
- Do not expose or print secrets.
- Do not connect this worker to broad image batches before Bean audit and Comptroller gate.
- The Supabase bucket is private; frontend/dashboard read policy comes later.
- `DEFAULT_COST_PER_IMAGE_USD` must be set conservatively. Unknown model costs fall back to this value and emit a warning.
- Prefer `MODEL_COSTS_JSON` for every model you allow, for example `{"ideogram-ai/ideogram-v3-quality":0.09}`.
- Claude request limiting is per worker process through `MAX_BATCH_REQUESTS_PER_HOUR`, plus daily estimated Claude spend in Supabase.
- Cost estimates are conservative scaffolding, not invoice-grade accounting.
- Use an Anthropic model name available to the configured Anthropic account for `ANTHROPIC_MODEL`. The default is `claude-haiku-4-5-20251001`, which was returned by the account's `/v1/models` endpoint during the first Ghost Forge setup.

## Pre-Claude Budget Retest

After SQL/env setup, confirm the image budget blocks before Claude runs:

```bash
DAILY_BUDGET_USD=0.01 npm start
```

Then send the one-prompt curl. Because the default image estimate is `0.09`, the request should return `402` before any Claude API call.

## Duplicate Webhook Retest

After one real Replicate webhook payload exists in a safe test environment, replay the same signed completed webhook twice at the same time. Expected result:

- one request atomically claims the output and uploads once
- the second request returns `200` with `already_handled` or `duplicate_completed_webhook`
- no second upload occurs
