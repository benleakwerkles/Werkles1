# Ghost Forge — Architecture Review and API Verdict

Reviewer: Perplexity Max (research scout)
For: Ben Leak (Operator)
Date: May 24, 2026
Purpose: Answer the question "what server API should I use to do this so it talks to Midjourney correctly?" — but answer it as an architect, not a junior. Flag the real risks. Recommend a path. Provide the actual API choice and starter spec.

---

## 0. TL;DR

**Skip Midjourney for the automated pipeline. Build it on Replicate or fal.ai instead.** The "Ghost Forge" architecture is right; the choice of Midjourney as the rendering backend is wrong. Three reasons:

1. **Midjourney has no official API.** Every "Midjourney API" service (PiAPI / GoAPI / useapi.net) is an unofficial wrapper that automates Discord bots. This violates Midjourney's Terms of Service and your Midjourney account can be banned at any time.
2. **Official APIs (Replicate, fal.ai, Ideogram) are first-party, ToS-clean, more reliable, and competitive in quality.** Per-image cost is often *lower* than the MJ subscription + wrapper combo.
3. **The architecture itself doesn't care which backend you use.** The cloud worker, the prompt generator, the storage bucket, and the review dashboard are all backend-agnostic. Picking the wrong backend is the only fixable mistake; the rest of the design is sound.

If Midjourney's specific aesthetic is non-negotiable for the brand work, you can still build the pipeline using PiAPI as the wrapper — I'll spec that path too. But you should know what you're trading for the aesthetic.

---

## 1. The Midjourney truth in one section

### 1.1 There is no official Midjourney API

This is the single fact that changes the architecture. Midjourney has never released a public API. They have stated repeatedly that they intend Discord and their web UI as the only interaction surfaces. As of [August 2025 PiAPI's coverage of MJ's Loop Video update](https://piapi.ai/blogs/midjourney-update-august-2025-video-loops-start-end-frames-and-api-access), the situation has not changed.

### 1.2 The "MJ API" services are Discord puppets

PiAPI, GoAPI, useapi.net, and similar all work the same way under the hood: they run pools of authenticated Discord accounts, queue your prompts through the Midjourney bot, parse the resulting Discord messages for image URLs, and resell that as a REST API.

This is technically functional. PiAPI's [Midjourney Imagine endpoint docs](https://piapi.ai/docs/midjourney-api/imagine) show the standard pattern — POST a prompt, receive a task_id, poll or receive a webhook on completion, get image URLs. The REST surface is clean.

But:

- **It violates Midjourney's Terms of Service.** Section 4 of [Midjourney's ToS](https://docs.midjourney.com/docs/terms-of-service) prohibits automation, scraping, and reverse engineering. Operators have reported account bans. [r/SaaS: "Midjourney is demanding me to shutdown my 4 months old SaaS"](https://www.reddit.com/r/SaaS/comments/1cveh43/midjourney_is_demanding_me_to_shutdown_my_4/) — a SaaS that built on PiAPI had to shut down after MJ legal contact.
- **The wrappers go down.** MJ has historically changed Discord bot behavior to break wrappers. Outages of 24–72 hours are common when MJ ships a change. [r/ScoutForge gave PiAPI 3.9/5 in their 2025 review](https://www.reddit.com/r/ScoutForge/comments/1l8vdp1/395_midjourney_api_review_unofficial_automation/) — reliable enough for indie use, not reliable enough to build a business on.
- **You pay twice.** Midjourney subscription ($10–$120/mo) PLUS the wrapper. PiAPI pricing starts at $15/mo for proxy access at lower concurrency. GoAPI's per-image MJ cost is in the same range. For 50 images you'd pay the MJ subscription plus roughly $2–4 in wrapper fees. Not catastrophic, but not free either.

### 1.3 What Midjourney is genuinely best at

- **Painterly / illustrative aesthetics** — the MJ "look" is distinctive and many other models can't quite reach it.
- **High-style hero images** — for marketing one-offs where the aesthetic is doing real work.
- **Photo-realistic product / scene compositions** when prompted well.

### 1.4 What Midjourney is NOT best at

- **Brutalist text typography** (Ideogram beats it).
- **Workflow speed** — even the official Turbo mode is slower than Replicate's fast endpoints.
- **Programmatic batch generation** — by design.
- **Cost predictability** — by design.

For a Werkles asset pipeline that wants to fire 50 prompts overnight and wake to a grid, MJ is the *worst* fit of any current image model purely because the team has deliberately built it against this use case.

---

## 2. The official-API alternatives

These are the real first-party APIs for image generation in 2026. All have webhooks, all have official Python and Node SDKs, all are ToS-clean for batch automation.

### 2.1 Replicate — best default for the Ghost Forge

- **Pricing:** Per-output, model-dependent. Ideogram v3 Quality on Replicate is **$0.09 / image** ([Replicate Pricing](https://replicate.com/pricing)). Flux 1.1 Pro is **$0.04 / image**. Stable Diffusion 3 Large is **$0.035 / image**.
- **What it is:** Replicate is a model hosting platform. Every major open-source image model is on it, plus several proprietary models that licensed in. You get one API key, one billing relationship, and access to dozens of image models behind a uniform REST interface.
- **Why for Werkles:** the most flexible. You can A/B different models per prompt category — Ideogram for typography-heavy brand cards, Flux for atmospheric scenes, SDXL fine-tunes for character work — all from the same script.
- **Webhook support:** Yes, first-class. `POST /v1/predictions` accepts a `webhook` URL and `webhook_events_filter`. Replicate calls your webhook when the prediction completes.
- **Setup time:** Lowest of any option. Sign up, get API token, write a 20-line script.

### 2.2 fal.ai — best for speed and cost optimization

- **Pricing:** Per-image, per-model. They host most of the same models as Replicate plus a few exclusives. GPT Image 2 on fal.ai is $0.006–$0.401 per image depending on size and quality ([fal.ai pricing for GPT Image 2](https://fal.ai/models/openai/gpt-image-2)).
- **What it is:** A competitor to Replicate, optimized for inference speed and predictable cost. Stronger on real-time / lower-latency use cases.
- **Why for Werkles:** if the Ghost Forge ever needs to do *interactive* generation (operator types a prompt, sees results in 5 seconds), fal.ai is better. For overnight batches, Replicate and fal.ai are roughly equivalent.
- **Webhook support:** Yes.

### 2.3 Ideogram (direct, not via Replicate)

- **Pricing:** Ideogram API pricing is by credit and plan, with discounts for higher tiers. Direct API access bypasses Replicate's per-image markup.
- **Why for Werkles:** if you're producing a lot of brand artifacts with embedded text (Foundry Dues card, banners with the Werkles wordmark, badges with labels), Ideogram is the best model in the market for legible text rendering. Significantly better than MJ or SDXL for that specific case.
- **Webhook support:** Yes via direct API.

### 2.4 OpenAI GPT Image 2 — what you've been using through me

- **Pricing:** $0.006–$0.401 per image depending on size and quality ([fal.ai breakdown](https://fal.ai/learn/tools/how-to-use-gpt-image-2)). The hero mockups I generated for the Werkles brand work were all GPT Image 2 at high quality, 1024×1024 or 1792×1024 (the ones that look like the steampunk foundry collage and the Werkles helper owl).
- **Webhook support:** Available via OpenAI's standard Files API + polling pattern, or via Replicate / fal.ai's wrappers around it.
- **Why for Werkles:** GPT Image 2 is the model that produced your best brand work to date. There's a strong argument to just continue using the model that's been producing on-brand results, automated through Replicate or fal.ai for the batch pipeline. Most consistent path from where you are now.

### 2.5 Adobe Firefly — enterprise-only

- **Pricing:** Enterprise plans, not pay-as-you-go ([Adobe Firefly API](https://developer.adobe.com/firefly-services/docs/firefly-api/)).
- **Why for Werkles:** ignore for now. Adobe Firefly is positioned for enterprise creative teams. Not for indie operators with a $5/mo cloud worker budget.

### 2.6 Google Imagen / Vertex AI — strong, but locked into GCP

- **Why for Werkles:** unless you're already in the GCP ecosystem, the auth and billing setup are an unnecessary tax. Skip.

---

## 3. Architecture verdict

### 3.1 The Ghost Forge architecture is sound

Skybro's four-component design — Brain (Claude) → Conveyor (image API) → Delivery (Supabase Storage) → Dashboard — is the right shape. I would not change the architecture. I would only change:

1. **Conveyor backend** from "Midjourney via PiAPI" to "Replicate (default) or fal.ai (speed)."
2. **Add a fifth component** — Cost Governor — that I'll explain in §4.

### 3.2 The corrected stack

```
┌────────────────────────────────────────────────────────────────┐
│  BRAIN — Anthropic Claude API                                   │
│  Generates a JSON array of N prompts from a brief template.    │
└────────────────────────────────────────────────────────────────┘
                          ↓ (50 prompts as JSON)
┌────────────────────────────────────────────────────────────────┐
│  COST GOVERNOR — Pre-flight check                               │
│  - Validates JSON shape                                         │
│  - Computes estimated cost (N × per-image rate)                 │
│  - Halts if cost exceeds OPERATOR_DAILY_BUDGET_USD env var      │
│  - Logs the run to Supabase for audit                           │
└────────────────────────────────────────────────────────────────┘
                          ↓ (validated prompts)
┌────────────────────────────────────────────────────────────────┐
│  CONVEYOR — Replicate API (default) or fal.ai (speed)          │
│  - POST each prompt as a Prediction with webhook URL            │
│  - Receives N task_ids                                          │
│  - Each task fires webhook on completion with image URL         │
└────────────────────────────────────────────────────────────────┘
                          ↓ (webhook callback per image)
┌────────────────────────────────────────────────────────────────┐
│  DELIVERY — Cloud worker on Fly.io / Render / Railway          │
│  - Receives webhook                                             │
│  - Downloads image from Replicate/fal.ai URL                    │
│  - Uploads to Supabase Storage bucket: ghost-forge/{batch_id}/  │
│  - Inserts row into ghost_forge_outputs table with metadata     │
└────────────────────────────────────────────────────────────────┘
                          ↓ (image in Supabase)
┌────────────────────────────────────────────────────────────────┐
│  DASHBOARD — Next.js page at /ghost-forge (Operator-only)      │
│  - Lists all batches                                            │
│  - Grid view of images in the active batch                      │
│  - Keep / Burn buttons per image                                │
│  - Kept images moved to /assets/ bucket                         │
│  - Burned images deleted from Supabase Storage + table          │
└────────────────────────────────────────────────────────────────┘
```

### 3.3 Why this is better than the Midjourney path

- **No ToS risk.** Replicate and fal.ai are designed for this use case. Their pricing pages explicitly support batch automation. They will not ban you for using their API as documented.
- **No double payment.** Pay only per image generated. No subscription floor. For 50 images at the Werkles brand quality range, expected cost is **$2–5 per batch** — substantially cheaper than the MJ-subscription-plus-wrapper combo.
- **Lower variance.** First-party APIs do not have the 24–72 hour wrapper-outage problem.
- **Model flexibility.** You can switch models per prompt category. Brand card → Ideogram. Atmospheric scene → Flux Pro. Avatar → GPT Image 2. All from one script, one billing relationship.
- **Same dashboard experience.** Operator still wakes to a grid of 50 images and clicks Keep/Burn. The end-user experience does not change.

---

## 4. The Cost Governor — why this isn't optional

The original Skybro design pings Claude for 50 prompts and dumps them straight into the conveyor. **This is dangerous.** Claude can occasionally generate more than 50 prompts (especially if the brief asks for "variations" or "alternatives"). A buggy prompt template can produce a JSON array with hundreds of entries. A worker stuck in a retry loop can fire the same prompt batch 10 times.

The Cost Governor exists to make every run reversibly bounded:

```python
MAX_PROMPTS_PER_BATCH = 50            # hard cap regardless of input
COST_PER_IMAGE_USD = 0.09             # Ideogram v3 Quality rate
DAILY_BUDGET_USD = 25.00              # operator-set ceiling
DAILY_SPEND_KEY = "ghost_forge:spend:{date}"
```

Before any image is enqueued:
1. Trim prompt array to `MAX_PROMPTS_PER_BATCH`.
2. Compute estimated batch cost = `len(prompts) × COST_PER_IMAGE_USD`.
3. Read today's spend from Supabase / Redis.
4. If today's spend + estimated batch cost > `DAILY_BUDGET_USD`, halt with an alert to the operator.
5. If OK, increment the daily-spend counter *before* sending to the API (pessimistic accounting; you can always reconcile after).

This is 30 lines of code that prevents a $250 surprise.

---

## 5. The recommended script (in concept)

This is **not** the script — Bulldozer / Codex / ChatGPT-as-engineer should write the actual code. This is the architect's pseudocode so you can hand it as a starter brief.

```python
# ghost_forge_worker.py
# Runs on Fly.io / Render / Railway (NOT Sally)

import os, time, hmac, json, requests, supabase
import anthropic, replicate

# Config from env
CLAUDE_KEY = os.environ['ANTHROPIC_API_KEY']
REPLICATE_KEY = os.environ['REPLICATE_API_TOKEN']
SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_SERVICE_KEY = os.environ['SUPABASE_SERVICE_ROLE_KEY']
WEBHOOK_BASE_URL = os.environ['WEBHOOK_BASE_URL']   # this worker's public URL
DAILY_BUDGET_USD = float(os.environ.get('DAILY_BUDGET_USD', '25.00'))

MAX_PROMPTS_PER_BATCH = 50
COST_PER_IMAGE_USD = 0.09     # Ideogram v3 Quality default
MODEL_DEFAULT = 'ideogram-ai/ideogram-v3-quality'

claude = anthropic.Anthropic(api_key=CLAUDE_KEY)
replicate_client = replicate.Client(api_token=REPLICATE_KEY)
sb = supabase.create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def generate_prompts(brief: str, n: int) -> list[dict]:
    """Ping Claude with the brief; receive a JSON array of n prompts."""
    msg = claude.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=8000,
        messages=[{"role": "user", "content": f"""
Produce a JSON array of {n} Midjourney-style image prompts following this brief.
Each prompt is an object with: prompt (string), aspect_ratio (string), category (string).
Return ONLY the JSON array, no preamble.
Brief: {brief}
"""}]
    )
    return json.loads(msg.content[0].text)

def cost_governor(prompts: list[dict]) -> list[dict]:
    """Enforce daily budget and batch cap."""
    prompts = prompts[:MAX_PROMPTS_PER_BATCH]
    today = time.strftime('%Y-%m-%d')
    spent_row = sb.table('ghost_forge_spend').select('*').eq('date', today).execute()
    spent_usd = spent_row.data[0]['amount_usd'] if spent_row.data else 0.0
    batch_cost = len(prompts) * COST_PER_IMAGE_USD
    if spent_usd + batch_cost > DAILY_BUDGET_USD:
        raise Exception(f"Budget exceeded: today spent ${spent_usd:.2f} + batch ${batch_cost:.2f} > ${DAILY_BUDGET_USD}")
    sb.table('ghost_forge_spend').upsert({'date': today, 'amount_usd': spent_usd + batch_cost}).execute()
    return prompts

def enqueue_batch(batch_id: str, prompts: list[dict]):
    """Send each prompt to Replicate with a webhook."""
    for i, p in enumerate(prompts):
        prediction = replicate_client.predictions.create(
            version=MODEL_DEFAULT,
            input={
                "prompt": p['prompt'],
                "aspect_ratio": p.get('aspect_ratio', '1:1'),
            },
            webhook=f"{WEBHOOK_BASE_URL}/webhook/replicate?batch_id={batch_id}&idx={i}",
            webhook_events_filter=["completed"],
        )
        sb.table('ghost_forge_outputs').insert({
            'batch_id': batch_id,
            'prediction_id': prediction.id,
            'prompt': p['prompt'],
            'category': p.get('category'),
            'status': 'pending',
        }).execute()

def handle_webhook(payload: dict, batch_id: str, idx: int):
    """Called by Replicate when an image completes."""
    if payload['status'] != 'succeeded':
        sb.table('ghost_forge_outputs').update({'status': 'failed', 'error': payload.get('error')}) \
            .eq('prediction_id', payload['id']).execute()
        return
    image_url = payload['output'][0] if isinstance(payload['output'], list) else payload['output']
    img_bytes = requests.get(image_url).content
    storage_path = f"{batch_id}/{idx}_{payload['id']}.webp"
    sb.storage.from_('ghost-forge').upload(storage_path, img_bytes, {'content-type': 'image/webp'})
    sb.table('ghost_forge_outputs').update({
        'status': 'completed',
        'storage_path': storage_path,
    }).eq('prediction_id', payload['id']).execute()
```

This is illustrative. The real implementation needs:
- HMAC signature verification on the Replicate webhook (Replicate signs webhooks; verify in your handler).
- Retry logic for the image download.
- Rate limiting on the Replicate side (don't fire 50 simultaneous predictions — chunk into 5-at-a-time waves).
- Error reporting back to the operator (a single failed prompt shouldn't crash the worker).
- Idempotency on the webhook handler (Replicate may retry webhooks on 5xx responses).

---

## 6. Supabase setup

### 6.1 Storage bucket

```sql
-- in Supabase Studio:
-- Create storage bucket "ghost-forge"
-- Set to private (auth required to download)
-- Add policy: only authenticated user with role 'operator' can read/write
```

### 6.2 Database tables

```sql
create table ghost_forge_batches (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  brief text,
  model text default 'ideogram-ai/ideogram-v3-quality',
  total_prompts int,
  status text default 'pending'
);

create table ghost_forge_outputs (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references ghost_forge_batches(id) on delete cascade,
  prediction_id text unique,
  prompt text,
  category text,
  status text default 'pending',  -- pending | completed | failed | kept | burned
  storage_path text,
  error text,
  created_at timestamptz default now()
);

create table ghost_forge_spend (
  date date primary key,
  amount_usd numeric default 0
);

-- RLS: only the operator role can access these tables.
-- The webhook handler uses the service role key to bypass RLS.
```

### 6.3 Dashboard page

`/ghost-forge` is a Next.js admin page (operator-only, RLS-gated) that:
- Lists batches with status and total cost.
- Shows the active batch as a 5×10 grid of thumbnails.
- Each thumbnail has Keep / Burn buttons.
- Keep moves the image to a `/assets/` bucket and tags it for repository sync.
- Burn deletes the image from storage and marks the row.

You wake up, open `/ghost-forge` on your phone, swipe through 50 images, and the keepers land in the repo. Monkey work eliminated.

---

## 7. Cost comparison (50 images per batch, weekly cadence)

| Backend | Per-image | Subscription floor | 50 × weekly | Monthly total | ToS risk |
|---|---|---|---|---|---|
| Midjourney via PiAPI wrapper | ~$0.05 wrapper + ~$0.05 MJ amortized | $10/mo MJ Basic + $15/mo PiAPI | ~$2.50 wrapper | **$32.50** | HIGH (MJ ban risk) |
| Replicate (Ideogram v3 Quality) | $0.09 | $0 | $4.50 | **$18.00** | None |
| Replicate (Flux 1.1 Pro) | $0.04 | $0 | $2.00 | **$8.00** | None |
| Replicate (SD 3 Large) | $0.035 | $0 | $1.75 | **$7.00** | None |
| fal.ai (GPT Image 2 high) | ~$0.21 | $0 | $10.50 | **$42.00** | None |
| fal.ai (GPT Image 2 medium) | ~$0.05 | $0 | $2.50 | **$10.00** | None |
| OpenAI direct (GPT Image 2 high) | ~$0.21 | $0 | $10.50 | **$42.00** | None |

Plus cloud worker: **$5–10/mo** (Fly.io shared-1x VM, or Render Free tier, or Railway $5 plan).

The economics favor Replicate Flux or SD 3 by a wide margin for raw output. Replicate Ideogram is the right choice when text-in-images matters (which it does for the Werkles brand cards). fal.ai GPT Image 2 medium is the cost-equivalent of MJ-via-wrapper with none of the ToS risk and better text rendering — that's the path I'd take if you want the GPT Image 2 aesthetic that's been working for the brand.

**Recommendation:** Replicate as the default backend, with the model selectable per prompt category (Ideogram for text, Flux Pro for atmospheres, GPT Image 2 medium for premium hero shots). One API key, one billing relationship, multi-model flexibility.

---

## 8. The "no-code" path (Make.com / n8n)

You asked about Make.com as an alternative. Honest take:

- **n8n** is the strongest no-code option. There's a [free AI image generator workflow on n8n](https://n8n.io/workflows/5626-free-ai-image-generator-n8n-automation-workflow-with-geminichatgpt/) that does roughly this pattern with Gemini and a [Replicate + Flux workflow template](https://n8n.io/workflows/7192-generate-images-with-replicate-and-flux/) that hits exactly your use case.
- **Make.com** has a Midjourney module that uses the same Discord-puppet pattern under the hood. Same ToS risk as PiAPI/GoAPI, with worse cost predictability.
- **Pipedream** works but is closer to "code with helpers" than true no-code.

**Verdict:** if you genuinely don't want to maintain a script, **use n8n with the Replicate + Flux template as a starting point**, deploy n8n to a free Fly.io VM, and wire the same Supabase bucket and dashboard. Skip Make.com — its Midjourney module brings the ToS risk back in.

The custom Python script is still my recommendation because:
- More flexible (model selection per prompt category, cost governor, batch tracking).
- Cheaper to run ($5/mo vs n8n cloud's $24/mo).
- The Werkles repo will already have Node and TS muscle; one more script is light lift.

But n8n is a legitimate path if Codex's plate is full.

---

## 9. Operator decision

Three paths, in order of my recommendation:

### Path A — Replicate + custom Python script (my pick)

- Most flexible.
- $5–10/mo cloud worker + ~$8–18/mo image gen for 200 images.
- Model selectable per prompt category.
- Cost Governor prevents surprises.
- Bulldozer / Codex can write this in an afternoon.

### Path B — n8n + Replicate template

- No custom script.
- ~$24–30/mo (n8n cloud + image gen).
- Less flexible than Path A but works without engineering effort.
- Use the existing [n8n Replicate+Flux template](https://n8n.io/workflows/7192-generate-images-with-replicate-and-flux/) as a starting point.

### Path C — PiAPI + Midjourney (the Skybro original)

- The MJ aesthetic specifically.
- $25–35/mo all-in.
- Ban risk. Outage risk. Account risk.
- Only choose if MJ's specific look is non-negotiable for the brand AND you can tolerate occasional outages.

**My final recommendation: Path A with Replicate as the conveyor, GPT Image 2 medium or Ideogram v3 Quality as the default model.** This continues the aesthetic that's been producing on-brand Werkles assets in our existing work, eliminates the ToS risk entirely, costs less than the MJ path, and the architect's design (Brain → Cost Governor → Conveyor → Delivery → Dashboard) survives intact.

---

## 10. What changes in the Bulldozer directive

If you take Path A, here's the corrected Bulldozer directive to paste into ChatGPT — replacing the original "Midjourney API wrapper" line with the Replicate path and adding the Cost Governor:

```
COMMAND: SWITCH TO BULLDOZER MODE

TASK: Build the "Ghost Forge" — a cloud-resident image generation pipeline for the Werkles brand asset library.

REQUIREMENTS:

1. Write a Node.js or Python service designed to run on a $5–10/mo cloud worker (Fly.io, Render, or Railway). NOT local Sally.

2. The service has three entrypoints:
   a. POST /batch/create — receives a brief, calls Claude API to generate N image prompts (max 50), runs the Cost Governor, enqueues prompts to Replicate, returns batch_id.
   b. POST /webhook/replicate — receives Replicate completion webhooks, downloads the image, uploads to Supabase Storage bucket "ghost-forge", updates the ghost_forge_outputs row.
   c. GET /batches/:id — returns batch status and image list (for the dashboard).

3. Use the Replicate Node/Python SDK as the rendering backend. Default model: ideogram-ai/ideogram-v3-quality. Make the model selectable per prompt category.

4. Implement a Cost Governor:
   - MAX_PROMPTS_PER_BATCH = 50
   - DAILY_BUDGET_USD env var (default $25)
   - Pre-flight check before enqueueing any prompts
   - Halt with operator alert if budget exceeded
   - Track daily spend in Supabase table ghost_forge_spend

5. Use Supabase Storage bucket "ghost-forge" (private, RLS-gated to operator role) for image files. Use service role key in webhook handler. Never expose service role key to frontend.

6. Verify Replicate webhook signatures using the official Replicate signing-secret pattern.

7. Implement idempotency on the webhook handler (Replicate may retry on 5xx).

8. Rate-limit Replicate API calls: chunk batches into 5-prompt waves with 2-second gaps.

OUTPUT: 
- The full Node.js or Python service.
- A SQL migration creating ghost_forge_batches, ghost_forge_outputs, ghost_forge_spend tables with RLS policies.
- A Supabase Storage bucket configuration block.
- An .env.example with all required env vars.
- A README with deploy instructions for Fly.io.

DO NOT include a frontend dashboard — that's a separate task for the Werkles Next.js app.
```

This produces a service Codex/Bulldozer can ship in a day.

End of Ghost Forge architecture review.
