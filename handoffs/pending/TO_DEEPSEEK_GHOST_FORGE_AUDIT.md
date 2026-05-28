# TO DEEPSEEK - GHOST FORGE AUDIT

Generated: 2026-05-24T05:48:14.604Z

## Packet Purpose

Audit the Ghost Forge Replicate scaffold before any deployment, image test, or batch generation. This packet is self-contained and supersedes the previous Midjourney-wrapper Ghost Forge packet.

## Operational Status

- No deploy has run.
- No push has run.
- No image test has run.
- No batch generation has run.
- No test curl has run.
- Ghost Forge is a scaffold only.
- The worker is intended for a cheap cloud host, not local Sally production use.
- Supabase service role key is represented only as an env placeholder in .env.example.

## Codex Build Report

- Built /ghost-forge-worker as a boxed scaffold only.
- Converted the initial Midjourney-wrapper concept to the corrected Replicate + Claude architecture.
- Implemented routes: POST /batch/create, POST /webhook/replicate, GET /batches/:id, GET /health.
- Added Claude prompt generation, strict prompt JSON validation, prompt count cap, cost reservation, limited Replicate enqueue waves, Replicate webhook signature verification, image MIME/size checks, private Supabase bucket upload, RLS-enabled tables, and spend helper functions.
- Ran syntax check only: node --check ghost-forge-worker\server.mjs passed.
- Did not install dependencies, submit prompts, run curl, deploy, push, or touch unrelated product code in the Ghost Forge build pass.

## Current Git Diff Summary

### git status --short

````text
M lib/copy.ts
?? docs/ai/
?? foreman/
?? ghost-forge-worker/
?? handoffs/
?? scripts/
````

### git diff --stat

````text
lib/copy.ts | 103 ++++++++++++++++++++++++++++++------------------------------
 1 file changed, 52 insertions(+), 51 deletions(-)
````

Note: /ghost-forge-worker is currently untracked, so git diff --stat does not include its contents until staged.

## Files For Audit

### ghost-forge-worker/package.json

````json
{
  "name": "ghost-forge-worker",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "start": "node server.mjs"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.49.0",
    "express": "^4.19.2",
    "slugify": "^1.6.6"
  },
  "engines": {
    "node": ">=20"
  }
}

````

### ghost-forge-worker/server.mjs

````js
import crypto from "node:crypto";
import express from "express";
import slugify from "slugify";
import { createClient } from "@supabase/supabase-js";

const {
  PORT = "3000",
  PUBLIC_BASE_URL,
  GHOST_FORGE_API_KEY,
  ANTHROPIC_API_KEY,
  REPLICATE_API_TOKEN,
  REPLICATE_WEBHOOK_SECRET,
  DEFAULT_REPLICATE_MODEL = "ideogram-ai/ideogram-v3-quality",
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_BUCKET = "ghost-forge",
  MAX_PROMPTS_PER_BATCH = "50",
  DAILY_BUDGET_USD = "25.00",
  DEFAULT_COST_PER_IMAGE_USD = "0.09",
  REPLICATE_CONCURRENCY = "5",
  REPLICATE_WAVE_DELAY_MS = "2000",
  MAX_IMAGE_BYTES = "26214400"
} = process.env;

const requiredEnv = {
  PUBLIC_BASE_URL,
  GHOST_FORGE_API_KEY,
  ANTHROPIC_API_KEY,
  REPLICATE_API_TOKEN,
  REPLICATE_WEBHOOK_SECRET,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_BUCKET
};

for (const [key, value] of Object.entries(requiredEnv)) {
  if (!value) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
}

const config = {
  maxPromptsPerBatch: parsePositiveInt(MAX_PROMPTS_PER_BATCH, "MAX_PROMPTS_PER_BATCH"),
  dailyBudgetUsd: parsePositiveNumber(DAILY_BUDGET_USD, "DAILY_BUDGET_USD"),
  defaultCostPerImageUsd: parsePositiveNumber(DEFAULT_COST_PER_IMAGE_USD, "DEFAULT_COST_PER_IMAGE_USD"),
  replicateConcurrency: parsePositiveInt(REPLICATE_CONCURRENCY, "REPLICATE_CONCURRENCY"),
  replicateWaveDelayMs: parsePositiveInt(REPLICATE_WAVE_DELAY_MS, "REPLICATE_WAVE_DELAY_MS"),
  maxImageBytes: parsePositiveInt(MAX_IMAGE_BYTES, "MAX_IMAGE_BYTES")
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const app = express();

app.use((req, res, next) => {
  if (req.path === "/webhook/replicate") return next();
  return express.json({ limit: "2mb" })(req, res, next);
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "ghost-forge-worker",
    renderer: "replicate"
  });
});

app.post("/batch/create", async (req, res) => {
  try {
    assertInternalAuth(req);

    const request = normalizeBatchRequest(req.body);
    const prompts = await generatePromptsWithClaude(request);
    const estimatedCost = prompts.length * config.defaultCostPerImageUsd;

    await reserveDailySpend(estimatedCost);

    const batch = await createBatch({
      brief: request.brief,
      model: request.model,
      totalPrompts: prompts.length,
      estimatedCostUsd: estimatedCost,
      metadata: request.metadata
    });

    const outputRows = await createOutputRows(batch.id, prompts, request.model);
    await enqueueReplicatePredictions(batch, outputRows);
    await updateBatch(batch.id, { status: "queued" });

    res.status(202).json({
      ok: true,
      batch_id: batch.id,
      total_prompts: prompts.length,
      estimated_cost_usd: estimatedCost,
      status: "queued"
    });
  } catch (error) {
    console.error("POST /batch/create failed:", sanitizeError(error));
    res.status(error.statusCode || 500).json({
      ok: false,
      error: error.message || "Internal error"
    });
  }
});

app.post(
  "/webhook/replicate",
  express.raw({ type: "*/*", limit: "10mb" }),
  async (req, res) => {
    try {
      verifyReplicateWebhookSignature(req);

      const payload = JSON.parse(req.body.toString("utf8"));
      const predictionId = payload?.id || payload?.prediction?.id || null;
      const outputId = req.query.output_id ? String(req.query.output_id) : null;

      if (!predictionId && !outputId) {
        throw badRequest("Replicate webhook missing prediction id.");
      }

      const output = await findOutput({ outputId, predictionId });

      if (!output) {
        throw badRequest("No matching Ghost Forge output for Replicate webhook.");
      }

      if (isFailureStatus(payload?.status)) {
        await updateOutput(output.id, {
          status: "failed",
          error: payload?.error || "Replicate prediction failed",
          provider_payload: payload,
          updated_at: new Date().toISOString()
        });
        await refreshBatchStatus(output.batch_id);
        return res.json({ ok: true, handled: "failed", output_id: output.id });
      }

      if (!isSuccessStatus(payload?.status)) {
        await updateOutput(output.id, {
          status: payload?.status || "processing",
          provider_payload: payload,
          updated_at: new Date().toISOString()
        });
        await refreshBatchStatus(output.batch_id);
        return res.json({ ok: true, handled: "not_ready", output_id: output.id });
      }

      if (output.storage_path) {
        return res.json({
          ok: true,
          handled: "duplicate_completed_webhook",
          output_id: output.id,
          storage_path: output.storage_path
        });
      }

      const imageUrl = firstImageUrl(payload?.output);

      if (!imageUrl) {
        throw badRequest("Replicate success webhook had no image output URL.");
      }

      const uploaded = await downloadAndUploadImage({
        imageUrl,
        output,
        providerPayload: payload
      });

      await updateOutput(output.id, {
        status: "completed",
        storage_bucket: SUPABASE_BUCKET,
        storage_path: uploaded.storagePath,
        source_url: imageUrl,
        content_type: uploaded.contentType,
        byte_size: uploaded.byteSize,
        provider_payload: payload,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      await recordActualSpend(config.defaultCostPerImageUsd);
      await refreshBatchStatus(output.batch_id);

      res.json({
        ok: true,
        handled: "completed",
        output_id: output.id,
        storage_path: uploaded.storagePath
      });
    } catch (error) {
      console.error("POST /webhook/replicate failed:", sanitizeError(error));
      res.status(error.statusCode || 500).json({
        ok: false,
        error: error.message || "Internal error"
      });
    }
  }
);

app.get("/batches/:id", async (req, res) => {
  try {
    assertInternalAuth(req);

    const { data: batch, error: batchError } = await supabase
      .from("ghost_forge_batches")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();

    if (batchError) throw new Error(`Batch lookup failed: ${batchError.message}`);
    if (!batch) throw notFound("Batch not found.");

    const { data: outputs, error: outputsError } = await supabase
      .from("ghost_forge_outputs")
      .select("*")
      .eq("batch_id", req.params.id)
      .order("created_at", { ascending: true });

    if (outputsError) throw new Error(`Output lookup failed: ${outputsError.message}`);

    res.json({
      ok: true,
      batch,
      outputs
    });
  } catch (error) {
    console.error("GET /batches/:id failed:", sanitizeError(error));
    res.status(error.statusCode || 500).json({
      ok: false,
      error: error.message || "Internal error"
    });
  }
});

app.listen(Number(PORT), () => {
  console.log(`Ghost Forge worker listening on port ${PORT}`);
});

function assertInternalAuth(req) {
  const header = req.header("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "").trim();

  if (!token || !timingSafeStringEqual(token, GHOST_FORGE_API_KEY)) {
    const error = new Error("Unauthorized.");
    error.statusCode = 401;
    throw error;
  }
}

function verifyReplicateWebhookSignature(req) {
  const webhookId = req.header("webhook-id");
  const webhookTimestamp = req.header("webhook-timestamp");
  const webhookSignature = req.header("webhook-signature");

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    const error = new Error("Missing Replicate webhook signature headers.");
    error.statusCode = 401;
    throw error;
  }

  const timestamp = Number(webhookTimestamp);
  const now = Math.floor(Date.now() / 1000);

  if (!Number.isFinite(timestamp) || Math.abs(now - timestamp) > 300) {
    const error = new Error("Replicate webhook timestamp is outside the allowed window.");
    error.statusCode = 401;
    throw error;
  }

  const secret = REPLICATE_WEBHOOK_SECRET.startsWith("whsec_")
    ? REPLICATE_WEBHOOK_SECRET.slice("whsec_".length)
    : REPLICATE_WEBHOOK_SECRET;
  const secretBytes = Buffer.from(secret, "base64");
  const signedContent = `${webhookId}.${webhookTimestamp}.${req.body.toString("utf8")}`;
  const expected = crypto
    .createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64");

  const signatures = webhookSignature
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.replace(/^v\d+,/, ""));

  if (!signatures.some((signature) => timingSafeStringEqual(signature, expected))) {
    const error = new Error("Invalid Replicate webhook signature.");
    error.statusCode = 401;
    throw error;
  }
}

function timingSafeStringEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));

  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function normalizeBatchRequest(body) {
  const brief = typeof body?.brief === "string" ? body.brief.trim() : "";
  const count = Number(body?.count ?? 1);
  const model = typeof body?.model === "string" && body.model.trim()
    ? body.model.trim()
    : DEFAULT_REPLICATE_MODEL;
  const metadata = body?.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
    ? body.metadata
    : {};

  if (!brief) throw badRequest("Brief is required.");
  if (!Number.isInteger(count) || count <= 0) throw badRequest("Count must be a positive integer.");
  if (count > config.maxPromptsPerBatch) {
    throw badRequest(`Count exceeds MAX_PROMPTS_PER_BATCH (${config.maxPromptsPerBatch}).`);
  }
  if (!model.includes("/")) throw badRequest("Model must use owner/model format.");

  return { brief, count, model, metadata };
}

async function generatePromptsWithClaude(request) {
  const system = [
    "You generate image prompts for a controlled brand asset pipeline.",
    "Return JSON only. No prose. No Markdown.",
    "Return an array with exactly the requested count.",
    "Each item must have prompt, aspect_ratio, category, and optionally model.",
    "Use safe commercial design language. Do not request text overlays, logos, watermarks, celebrity likenesses, or copyrighted characters."
  ].join(" ");
  const user = {
    brief: request.brief,
    count: request.count,
    default_model: request.model,
    required_shape: {
      prompt: "string",
      aspect_ratio: "16:9",
      category: "hero-background",
      model: "optional owner/model override"
    }
  };

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-latest",
      max_tokens: 2500,
      temperature: 0.5,
      system,
      messages: [
        {
          role: "user",
          content: JSON.stringify(user)
        }
      ]
    })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`Claude prompt generation failed ${response.status}: ${payload?.error?.message || "unknown error"}`);
  }

  const text = payload?.content
    ?.map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();

  return validatePromptObjects(parsePromptJson(text), request);
}

function parsePromptJson(text) {
  if (!text) throw badRequest("Claude returned an empty prompt response.");

  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw badRequest("Claude did not return a JSON array.");
    try {
      return JSON.parse(match[0]);
    } catch {
      throw badRequest("Claude returned malformed prompt JSON.");
    }
  }
}

function validatePromptObjects(prompts, request) {
  if (!Array.isArray(prompts)) throw badRequest("Prompt JSON must be an array.");
  if (prompts.length === 0) throw badRequest("Prompt JSON must not be empty.");
  if (prompts.length > config.maxPromptsPerBatch) {
    throw badRequest(`Claude generated too many prompts. Max ${config.maxPromptsPerBatch}.`);
  }
  if (prompts.length !== request.count) {
    throw badRequest(`Claude generated ${prompts.length} prompts, expected ${request.count}.`);
  }

  return prompts.map((item, index) => {
    const prompt = typeof item?.prompt === "string" ? item.prompt.trim() : "";
    const aspectRatio = typeof item?.aspect_ratio === "string" ? item.aspect_ratio.trim() : "16:9";
    const category = typeof item?.category === "string" ? item.category.trim() : "brand-asset";
    const model = typeof item?.model === "string" && item.model.trim()
      ? item.model.trim()
      : request.model;

    if (!prompt) throw badRequest(`Prompt ${index + 1} is missing prompt text.`);
    if (prompt.length > 4000) throw badRequest(`Prompt ${index + 1} exceeds 4000 characters.`);
    if (!model.includes("/")) throw badRequest(`Prompt ${index + 1} has invalid model override.`);

    return {
      prompt,
      aspect_ratio: aspectRatio,
      category,
      model
    };
  });
}

async function reserveDailySpend(estimatedCost) {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase.rpc("ghost_forge_reserve_spend", {
    p_date: today,
    p_estimated_amount_usd: estimatedCost,
    p_daily_budget_usd: config.dailyBudgetUsd
  });

  if (error) throw new Error(`Spend reservation failed: ${error.message}`);
  if (!data) {
    const errorObject = new Error("Daily Ghost Forge budget would be exceeded.");
    errorObject.statusCode = 402;
    throw errorObject;
  }
}

async function recordActualSpend(amount) {
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.rpc("ghost_forge_record_actual_spend", {
    p_date: today,
    p_actual_amount_usd: amount
  });

  if (error) throw new Error(`Actual spend update failed: ${error.message}`);
}

async function createBatch({ brief, model, totalPrompts, estimatedCostUsd, metadata }) {
  const { data, error } = await supabase
    .from("ghost_forge_batches")
    .insert({
      brief,
      model,
      total_prompts: totalPrompts,
      estimated_cost_usd: estimatedCostUsd,
      status: "pending",
      metadata
    })
    .select("*")
    .single();

  if (error) throw new Error(`Batch insert failed: ${error.message}`);
  return data;
}

async function createOutputRows(batchId, prompts, defaultModel) {
  const rows = prompts.map((prompt) => ({
    batch_id: batchId,
    prompt: prompt.prompt,
    category: prompt.category,
    model: prompt.model || defaultModel,
    aspect_ratio: prompt.aspect_ratio,
    status: "pending",
    storage_bucket: SUPABASE_BUCKET
  }));

  const { data, error } = await supabase
    .from("ghost_forge_outputs")
    .insert(rows)
    .select("*");

  if (error) throw new Error(`Output insert failed: ${error.message}`);
  return data;
}

async function enqueueReplicatePredictions(batch, outputs) {
  for (let index = 0; index < outputs.length; index += config.replicateConcurrency) {
    const wave = outputs.slice(index, index + config.replicateConcurrency);
    await Promise.all(wave.map((output) => enqueueReplicatePrediction(batch, output)));

    if (index + config.replicateConcurrency < outputs.length) {
      await sleep(config.replicateWaveDelayMs);
    }
  }
}

async function enqueueReplicatePrediction(batch, output) {
  try {
    const webhookUrl = `${PUBLIC_BASE_URL.replace(/\/$/, "")}/webhook/replicate?output_id=${encodeURIComponent(output.id)}`;
    const prediction = await createReplicatePrediction({
      model: output.model || batch.model,
      input: {
        prompt: output.prompt,
        aspect_ratio: output.aspect_ratio || "16:9"
      },
      webhook: webhookUrl
    });

    await updateOutput(output.id, {
      prediction_id: prediction.id || null,
      status: prediction.status || "queued",
      provider_payload: prediction,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    await updateOutput(output.id, {
      status: "failed",
      error: error.message || "Replicate enqueue failed",
      updated_at: new Date().toISOString()
    });
    throw error;
  }
}

async function createReplicatePrediction({ model, input, webhook }) {
  const { url, body } = replicatePredictionRequest({ model, input, webhook });
  const response = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Token ${REPLICATE_API_TOKEN}`,
      "content-type": "application/json",
      prefer: "wait=0"
    },
    body: JSON.stringify(body)
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`Replicate prediction failed ${response.status}: ${payload?.detail || JSON.stringify(payload)}`);
  }

  return payload;
}

function replicatePredictionRequest({ model, input, webhook }) {
  const [owner, nameWithVersion] = model.split("/");
  const [name, version] = nameWithVersion.split(":");
  const common = {
    input,
    webhook,
    webhook_events_filter: ["completed"]
  };

  if (version) {
    return {
      url: "https://api.replicate.com/v1/predictions",
      body: {
        version,
        ...common
      }
    };
  }

  return {
    url: `https://api.replicate.com/v1/models/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/predictions`,
    body: common
  };
}

async function downloadAndUploadImage({ imageUrl, output, providerPayload }) {
  const parsedUrl = assertHttpImageUrl(imageUrl);
  const response = await fetch(parsedUrl);

  if (!response.ok) {
    throw new Error(`Image download failed ${response.status}.`);
  }

  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > config.maxImageBytes) {
    throw new Error("Image exceeds MAX_IMAGE_BYTES.");
  }

  const contentType =
    response.headers.get("content-type") ||
    guessContentTypeFromUrl(imageUrl) ||
    "image/png";

  if (!["image/png", "image/jpeg", "image/webp"].includes(contentType)) {
    throw new Error(`Unsupported content type: ${contentType}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length > config.maxImageBytes) {
    throw new Error("Image exceeds MAX_IMAGE_BYTES after download.");
  }

  const extension = extensionFromContentType(contentType);
  const safeBatch = slugify(output.batch_id || "ghost-forge", {
    lower: true,
    strict: true
  });
  const safeCategory = slugify(output.category || "asset", {
    lower: true,
    strict: true
  });
  const objectPath = [
    safeBatch,
    safeCategory,
    `${output.id}.${extension}`
  ].join("/");

  const { data, error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(objectPath, buffer, {
      contentType,
      cacheControl: "31536000",
      upsert: false,
      metadata: {
        ghostForgeOutputId: output.id,
        batchId: output.batch_id,
        predictionId: output.prediction_id || "",
        sourceImageUrl: imageUrl,
        provider: "replicate"
      }
    });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  return {
    storagePath: data.path,
    contentType,
    byteSize: buffer.length,
    providerPayload
  };
}

async function findOutput({ outputId, predictionId }) {
  let query = supabase.from("ghost_forge_outputs").select("*").limit(1);

  if (outputId) query = query.eq("id", outputId);
  else query = query.eq("prediction_id", predictionId);

  const { data, error } = await query.maybeSingle();

  if (error) throw new Error(`Output lookup failed: ${error.message}`);
  return data;
}

async function updateBatch(batchId, fields) {
  const { error } = await supabase
    .from("ghost_forge_batches")
    .update({
      ...fields,
      updated_at: new Date().toISOString()
    })
    .eq("id", batchId);

  if (error) throw new Error(`Batch update failed: ${error.message}`);
}

async function updateOutput(outputId, fields) {
  const { error } = await supabase
    .from("ghost_forge_outputs")
    .update(fields)
    .eq("id", outputId);

  if (error) throw new Error(`Output update failed: ${error.message}`);
}

async function refreshBatchStatus(batchId) {
  const { data, error } = await supabase
    .from("ghost_forge_outputs")
    .select("status")
    .eq("batch_id", batchId);

  if (error) throw new Error(`Batch status refresh failed: ${error.message}`);

  const statuses = data.map((row) => row.status);
  const completed = statuses.filter((status) => status === "completed").length;
  const failed = statuses.filter((status) => status === "failed").length;
  const finalCount = completed + failed;
  const nextStatus = finalCount === statuses.length
    ? failed === statuses.length
      ? "failed"
      : failed > 0
        ? "completed_with_errors"
        : "completed"
    : "processing";

  await updateBatch(batchId, { status: nextStatus });
}

function firstImageUrl(output) {
  if (typeof output === "string") return output;
  if (Array.isArray(output)) {
    return output.find((item) => typeof item === "string") || null;
  }
  if (typeof output?.url === "string") return output.url;
  return null;
}

function isSuccessStatus(status) {
  return ["succeeded", "completed", "success"].includes(String(status).toLowerCase());
}

function isFailureStatus(status) {
  return ["failed", "error", "cancelled", "canceled"].includes(String(status).toLowerCase());
}

function assertHttpImageUrl(url) {
  let parsed;

  try {
    parsed = new URL(url);
  } catch {
    throw badRequest("Invalid image URL.");
  }

  if (!["https:", "http:"].includes(parsed.protocol)) {
    throw badRequest("Image URL must use http or https.");
  }

  return parsed;
}

function guessContentTypeFromUrl(url) {
  const clean = url.split("?")[0].toLowerCase();

  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return "image/jpeg";
  if (clean.endsWith(".webp")) return "image/webp";
  if (clean.endsWith(".png")) return "image/png";
  return null;
}

function extensionFromContentType(contentType) {
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/webp") return "webp";
  return "png";
}

function parsePositiveInt(value, name) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return parsed;
}

function parsePositiveNumber(value, name) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive number.`);
  }
  return parsed;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeError(error) {
  return {
    name: error?.name,
    message: error?.message,
    statusCode: error?.statusCode
  };
}

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function notFound(message) {
  const error = new Error(message);
  error.statusCode = 404;
  return error;
}

````

### ghost-forge-worker/.env.example

````bash
PORT=3000

PUBLIC_BASE_URL=https://your-ghost-forge-worker.example.com

GHOST_FORGE_API_KEY=replace-with-long-random-secret

ANTHROPIC_API_KEY=replace-with-claude-api-key

REPLICATE_API_TOKEN=replace-with-replicate-api-token
REPLICATE_WEBHOOK_SECRET=replace-with-replicate-webhook-secret
DEFAULT_REPLICATE_MODEL=ideogram-ai/ideogram-v3-quality

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=replace-with-service-role-key
SUPABASE_BUCKET=ghost-forge

MAX_PROMPTS_PER_BATCH=50
DAILY_BUDGET_USD=25.00
DEFAULT_COST_PER_IMAGE_USD=0.09
REPLICATE_CONCURRENCY=5
REPLICATE_WAVE_DELAY_MS=2000
MAX_IMAGE_BYTES=26214400

````

### ghost-forge-worker/README.md

````md
# Ghost Forge Worker

Ghost Forge is a cloud-resident image generation worker for Werkles brand assets. The default rendering backend is Replicate. The future fallback lane is fal.ai, but this scaffold does not implement that adapter yet.

This worker is not for Sally. Do not run local image generation, local GPU tools, local upscalers, Stable Diffusion, ComfyUI, Automatic1111, Discord automation, or unofficial Midjourney wrapper flows.

## What This Does

- `POST /batch/create` accepts an authorized brief and count.
- Claude turns the brief into structured prompt objects.
- The Cost Governor validates count, estimates spend, checks daily budget, and reserves spend before API calls.
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
REPLICATE_API_TOKEN=replace-with-replicate-api-token
REPLICATE_WEBHOOK_SECRET=replace-with-replicate-webhook-secret
DEFAULT_REPLICATE_MODEL=ideogram-ai/ideogram-v3-quality
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=replace-with-service-role-key
SUPABASE_BUCKET=ghost-forge
MAX_PROMPTS_PER_BATCH=50
DAILY_BUDGET_USD=25.00
DEFAULT_COST_PER_IMAGE_USD=0.09
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
- Cost estimates are conservative scaffolding, not invoice-grade accounting.

````

### ghost-forge-worker/supabase-ghost-forge.sql

````sql
-- Ghost Forge Storage Bucket
-- Private read/write. Worker uses SUPABASE_SERVICE_ROLE_KEY server-side.
-- Do not expose SUPABASE_SERVICE_ROLE_KEY to browser/client code.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'ghost-forge',
  'ghost-forge',
  false,
  26214400,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Batch tracking table.

create table if not exists public.ghost_forge_batches (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  brief text not null,
  model text not null default 'ideogram-ai/ideogram-v3-quality',
  total_prompts int not null default 0,
  estimated_cost_usd numeric not null default 0,
  status text not null default 'pending',
  metadata jsonb not null default '{}'::jsonb
);

-- Output tracking table.

create table if not exists public.ghost_forge_outputs (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.ghost_forge_batches(id) on delete cascade,
  prediction_id text unique,
  prompt text not null,
  category text,
  model text,
  aspect_ratio text,
  status text not null default 'pending',
  storage_bucket text not null default 'ghost-forge',
  storage_path text,
  source_url text,
  content_type text,
  byte_size integer,
  error text,
  provider_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Spend governor table.

create table if not exists public.ghost_forge_spend (
  date date primary key,
  estimated_amount_usd numeric not null default 0,
  actual_amount_usd numeric not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists ghost_forge_outputs_batch_id_idx
  on public.ghost_forge_outputs(batch_id);

create index if not exists ghost_forge_outputs_prediction_id_idx
  on public.ghost_forge_outputs(prediction_id);

create index if not exists ghost_forge_outputs_status_idx
  on public.ghost_forge_outputs(status);

-- Cost Governor helpers. These keep daily spend reservation atomic.

create or replace function public.ghost_forge_reserve_spend(
  p_date date,
  p_estimated_amount_usd numeric,
  p_daily_budget_usd numeric
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_estimated numeric;
begin
  insert into public.ghost_forge_spend(date, estimated_amount_usd, actual_amount_usd)
  values (p_date, 0, 0)
  on conflict (date) do nothing;

  select estimated_amount_usd
  into current_estimated
  from public.ghost_forge_spend
  where date = p_date
  for update;

  if current_estimated + p_estimated_amount_usd > p_daily_budget_usd then
    return false;
  end if;

  update public.ghost_forge_spend
  set estimated_amount_usd = estimated_amount_usd + p_estimated_amount_usd,
      updated_at = now()
  where date = p_date;

  return true;
end;
$$;

create or replace function public.ghost_forge_record_actual_spend(
  p_date date,
  p_actual_amount_usd numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.ghost_forge_spend(date, estimated_amount_usd, actual_amount_usd)
  values (p_date, 0, p_actual_amount_usd)
  on conflict (date) do update set
    actual_amount_usd = public.ghost_forge_spend.actual_amount_usd + excluded.actual_amount_usd,
    updated_at = now();
end;
$$;

alter table public.ghost_forge_batches enable row level security;
alter table public.ghost_forge_outputs enable row level security;
alter table public.ghost_forge_spend enable row level security;

-- No anon/authenticated write policies.
-- Worker uses service role server-side.
-- Dashboard read policies come later.

````

## Audit Instructions

Audit Ghost Forge.

Find:
1. Can random people trigger batches?
2. Can the Cost Governor be bypassed?
3. Can Claude generate more prompts than allowed?
4. Can Replicate webhooks be spoofed?
5. Can webhook verification fail open?
6. Can duplicate webhooks create duplicate assets?
7. Can non-image URLs or giant files be uploaded?
8. Can the service role key leak?
9. Can public users read private bucket files?
10. Is RLS locked down?
11. Can failed jobs cause retry storms?
12. Can provider payloads store sensitive data?
13. Can batch generation bankrupt us?
14. Can env vars or secrets be logged?
15. Can GET /batches/:id leak asset data?
16. Is the Supabase bucket private?
17. Are table policies safely deny-by-default?
18. Are image uploads idempotent?
19. Is there a hard one-test-prompt gate before batch mode?

Return:
- Critical findings
- Exploit path
- Damage if shipped
- Required fix
- Retest instruction
- VERDICT: GO / CONDITIONAL GO / NO-GO
