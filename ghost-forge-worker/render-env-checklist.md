# Ghost Forge Render Environment Checklist

Set these in Render Dashboard. Do not paste values into Codex or chat.

## Secret / Private Values

- [x] `GHOST_FORGE_API_KEY` saved privately by Ben
- [x] `ANTHROPIC_API_KEY` saved privately by Ben
- [ ] `ANTHROPIC_MODEL=claude-haiku-4-5-20251001`
- [x] `REPLICATE_API_TOKEN` saved privately by Ben
- [x] `REPLICATE_WEBHOOK_SECRET` saved privately by Ben
- [x] `SUPABASE_URL` saved privately by Ben
- [x] `SUPABASE_SERVICE_ROLE_KEY` saved privately by Ben
- [x] `PUBLIC_BASE_URL=https://werkles-ghost-forge1.onrender.com`

## Non-Secret First-Test Values

- [x] `PORT=3000`
- [x] `SUPABASE_BUCKET=ghost-forge`
- [x] `MAX_PROMPTS_PER_BATCH=1`
- [x] `DAILY_BUDGET_USD=1.00`
- [x] `DAILY_CLAUDE_BUDGET_USD=1.00`
- [x] `DEFAULT_COST_PER_IMAGE_USD=0.20`
- [x] `REPLICATE_CONCURRENCY=1`
- [x] `REPLICATE_WAVE_DELAY_MS=2000`
- [x] `MAX_IMAGE_BYTES=26214400`
- [x] `MAX_BATCH_REQUESTS_PER_HOUR=3`
- [x] `DEFAULT_REPLICATE_MODEL=ideogram-ai/ideogram-v3-quality`
- [x] `MODEL_COSTS_JSON={"ideogram-ai/ideogram-v3-quality":0.20}`

## Gate

Do not run the one-prompt test until:

- [x] Supabase SQL is applied and verified.
- [x] Render service exists at `https://werkles-ghost-forge1.onrender.com`.
- [x] All env vars are set privately by Ben.
- [x] `PUBLIC_BASE_URL` points to the final Render URL in Render Environment.
- [x] `/health` passes.
