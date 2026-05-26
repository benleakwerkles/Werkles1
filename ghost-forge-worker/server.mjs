import crypto from "node:crypto";
import express from "express";
import slugify from "slugify";
import { createClient } from "@supabase/supabase-js";

const {
  PORT = "3000",
  PUBLIC_BASE_URL,
  GHOST_FORGE_API_KEY,
  ANTHROPIC_API_KEY,
  ANTHROPIC_MODEL = "claude-haiku-4-5-20251001",
  REPLICATE_API_TOKEN,
  REPLICATE_WEBHOOK_SECRET,
  DEFAULT_REPLICATE_MODEL = "ideogram-ai/ideogram-v3-quality",
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_BUCKET = "ghost-forge",
  MAX_PROMPTS_PER_BATCH = "50",
  MAX_BATCH_REQUESTS_PER_HOUR = "10",
  DAILY_BUDGET_USD = "25.00",
  DEFAULT_COST_PER_IMAGE_USD = "0.09",
  MODEL_COSTS_JSON = "{}",
  DAILY_CLAUDE_BUDGET_USD = "1.00",
  DEFAULT_CLAUDE_COST_PER_REQUEST_USD = "0.02",
  CLAUDE_INPUT_COST_PER_MILLION_USD = "1.00",
  CLAUDE_OUTPUT_COST_PER_MILLION_USD = "5.00",
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
  maxBatchRequestsPerHour: parsePositiveInt(MAX_BATCH_REQUESTS_PER_HOUR, "MAX_BATCH_REQUESTS_PER_HOUR"),
  dailyBudgetUsd: parsePositiveNumber(DAILY_BUDGET_USD, "DAILY_BUDGET_USD"),
  defaultCostPerImageUsd: parsePositiveNumber(DEFAULT_COST_PER_IMAGE_USD, "DEFAULT_COST_PER_IMAGE_USD"),
  modelCosts: parseModelCosts(MODEL_COSTS_JSON),
  dailyClaudeBudgetUsd: parsePositiveNumber(DAILY_CLAUDE_BUDGET_USD, "DAILY_CLAUDE_BUDGET_USD"),
  defaultClaudeCostPerRequestUsd: parsePositiveNumber(DEFAULT_CLAUDE_COST_PER_REQUEST_USD, "DEFAULT_CLAUDE_COST_PER_REQUEST_USD"),
  claudeInputCostPerMillionUsd: parsePositiveNumber(CLAUDE_INPUT_COST_PER_MILLION_USD, "CLAUDE_INPUT_COST_PER_MILLION_USD"),
  claudeOutputCostPerMillionUsd: parsePositiveNumber(CLAUDE_OUTPUT_COST_PER_MILLION_USD, "CLAUDE_OUTPUT_COST_PER_MILLION_USD"),
  replicateConcurrency: parsePositiveInt(REPLICATE_CONCURRENCY, "REPLICATE_CONCURRENCY"),
  replicateWaveDelayMs: parsePositiveInt(REPLICATE_WAVE_DELAY_MS, "REPLICATE_WAVE_DELAY_MS"),
  maxImageBytes: parsePositiveInt(MAX_IMAGE_BYTES, "MAX_IMAGE_BYTES")
};

const batchRequestWindow = [];

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
    const preflightImageCost = estimateImageCostForRequest(request);

    await checkDailyImageBudget(preflightImageCost);
    enforceBatchRequestRateLimit();
    await reserveClaudeSpend(config.defaultClaudeCostPerRequestUsd);

    const claudeResult = await generatePromptsWithClaude(request);
    const { prompts } = claudeResult;
    const estimatedCost = estimateImageCostForPrompts(prompts, request.model);

    await reserveDailySpend(estimatedCost);
    await recordClaudeUsage(claudeResult.estimatedClaudeCostUsd, claudeResult.usage);
    logClaudeUsage(claudeResult);

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
    logError("POST /batch/create failed", error);
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

      if (isKnownNonFinalStatus(payload?.status)) {
        await updateOutput(output.id, {
          status: internalStatusFromProvider(payload?.status),
          provider_payload: payload,
          updated_at: new Date().toISOString()
        });
        await refreshBatchStatus(output.batch_id);
        return res.json({ ok: true, handled: "not_ready", output_id: output.id });
      }

      if (!isSuccessStatus(payload?.status)) {
        throw badRequest(`Unknown Replicate webhook status: ${String(payload?.status || "missing")}`);
      }

      if (output.storage_path) {
        return res.json({
          ok: true,
          handled: "duplicate_completed_webhook",
          output_id: output.id,
          storage_path: output.storage_path
        });
      }

      const claimed = await claimOutputForWebhook(output.id);

      if (!claimed) {
        return res.json({
          ok: true,
          handled: "already_handled",
          output_id: output.id
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
      logError("POST /webhook/replicate failed", error);
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
    logError("GET /batches/:id failed", error);
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
  if (Buffer.byteLength(JSON.stringify(metadata), "utf8") > 16 * 1024) {
    throw badRequest("Metadata exceeds 16 KB limit.");
  }

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
      model: ANTHROPIC_MODEL,
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
    throw new Error(`Claude prompt generation failed ${response.status}: ${redactSensitiveText(payload?.error?.message || "unknown error")}`);
  }

  const usage = normalizeClaudeUsage(payload?.usage);
  const estimatedClaudeCostUsd = estimateClaudeCost(usage);

  const text = payload?.content
    ?.map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();

  return {
    prompts: validatePromptObjects(parsePromptJson(text), request),
    usage,
    estimatedClaudeCostUsd
  };
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

async function checkDailyImageBudget(estimatedCost) {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("ghost_forge_spend")
    .select("estimated_amount_usd")
    .eq("date", today)
    .maybeSingle();

  if (error) throw new Error(`Image budget preflight failed: ${error.message}`);

  const currentEstimated = Number(data?.estimated_amount_usd || 0);
  if (currentEstimated + estimatedCost > config.dailyBudgetUsd) {
    const errorObject = new Error("Daily Ghost Forge image budget would be exceeded before Claude call.");
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

async function reserveClaudeSpend(estimatedCost) {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase.rpc("ghost_forge_reserve_claude_spend", {
    p_date: today,
    p_estimated_amount_usd: estimatedCost,
    p_daily_budget_usd: config.dailyClaudeBudgetUsd
  });

  if (error) throw new Error(`Claude spend reservation failed: ${error.message}`);
  if (!data) {
    const errorObject = new Error("Daily Ghost Forge Claude budget would be exceeded.");
    errorObject.statusCode = 402;
    throw errorObject;
  }
}

async function recordClaudeUsage(amount, usage) {
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.rpc("ghost_forge_record_claude_usage", {
    p_date: today,
    p_actual_amount_usd: amount,
    p_input_tokens: usage.inputTokens,
    p_output_tokens: usage.outputTokens
  });

  if (error) throw new Error(`Claude usage update failed: ${error.message}`);
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
      status: internalStatusFromProvider(prediction.status || "queued"),
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
    throw new Error(`Replicate prediction failed ${response.status}: ${providerErrorMessage(payload)}`);
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

async function claimOutputForWebhook(outputId) {
  const { data, error } = await supabase
    .from("ghost_forge_outputs")
    .update({
      status: "processing_webhook",
      updated_at: new Date().toISOString()
    })
    .eq("id", outputId)
    .in("status", ["processing", "pending", "queued"])
    .is("storage_path", null)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(`Webhook claim failed: ${error.message}`);
  return Boolean(data);
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

function isKnownNonFinalStatus(status) {
  return ["starting", "processing", "pending", "queued"].includes(String(status).toLowerCase());
}

function internalStatusFromProvider(status) {
  const normalized = String(status || "").toLowerCase();
  if (["starting", "processing"].includes(normalized)) return "processing";
  if (["pending", "queued"].includes(normalized)) return "queued";
  if (isSuccessStatus(normalized)) return "completed";
  if (isFailureStatus(normalized)) return "failed";
  return "processing";
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

function parseModelCosts(value) {
  let parsed;

  try {
    parsed = JSON.parse(value || "{}");
  } catch {
    throw new Error("MODEL_COSTS_JSON must be valid JSON.");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("MODEL_COSTS_JSON must be a JSON object.");
  }

  return Object.fromEntries(
    Object.entries(parsed).map(([model, cost]) => [
      model,
      parsePositiveNumber(cost, `MODEL_COSTS_JSON.${model}`)
    ])
  );
}

function estimateImageCostForRequest(request) {
  return request.count * costPerImageForModel(request.model);
}

function estimateImageCostForPrompts(prompts, defaultModel) {
  return prompts.reduce((total, prompt) => (
    total + costPerImageForModel(prompt.model || defaultModel)
  ), 0);
}

function costPerImageForModel(model) {
  if (Object.hasOwn(config.modelCosts, model)) {
    return config.modelCosts[model];
  }

  console.warn(`Ghost Forge cost warning: no model-specific image cost for "${model}". Using DEFAULT_COST_PER_IMAGE_USD; keep this value conservative.`);

  if (config.defaultCostPerImageUsd < 0.09) {
    console.warn("Ghost Forge cost warning: DEFAULT_COST_PER_IMAGE_USD is below 0.09. Unknown model costs may be undercounted.");
  }

  return config.defaultCostPerImageUsd;
}

function enforceBatchRequestRateLimit() {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  while (batchRequestWindow.length && batchRequestWindow[0] < oneHourAgo) {
    batchRequestWindow.shift();
  }

  if (batchRequestWindow.length >= config.maxBatchRequestsPerHour) {
    const error = new Error("Ghost Forge batch request rate limit exceeded.");
    error.statusCode = 429;
    throw error;
  }

  batchRequestWindow.push(now);
}

function normalizeClaudeUsage(usage) {
  return {
    inputTokens: Number(usage?.input_tokens || 0),
    outputTokens: Number(usage?.output_tokens || 0)
  };
}

function estimateClaudeCost(usage) {
  const tokenCost =
    (usage.inputTokens / 1_000_000) * config.claudeInputCostPerMillionUsd +
    (usage.outputTokens / 1_000_000) * config.claudeOutputCostPerMillionUsd;

  return tokenCost > 0 ? tokenCost : config.defaultClaudeCostPerRequestUsd;
}

function logClaudeUsage({ usage, estimatedClaudeCostUsd }) {
  console.info("Ghost Forge Claude usage", {
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    estimatedClaudeCostUsd: Number(estimatedClaudeCostUsd.toFixed(6))
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logError(context, error) {
  console.error(context, sanitizeError(error));
}

function sanitizeError(error) {
  return {
    name: error?.name,
    message: redactSensitiveText(error?.message || ""),
    statusCode: error?.statusCode
  };
}

function providerErrorMessage(payload) {
  const message = payload?.detail || payload?.error?.message || payload?.error || JSON.stringify(payload);
  return redactSensitiveText(message || "unknown provider error");
}

function redactSensitiveText(text) {
  return String(text)
    .replace(/authorization\s*:\s*bearer\s+[^\s,"'}]+/gi, "authorization: Bearer [REDACTED]")
    .replace(/authorization\s*:\s*token\s+[^\s,"'}]+/gi, "authorization: Token [REDACTED]")
    .replace(/bearer\s+[A-Za-z0-9._~+/=-]{12,}/gi, "Bearer [REDACTED]")
    .replace(/token\s+[A-Za-z0-9._~+/=-]{12,}/gi, "Token [REDACTED]")
    .replace(/(ANTHROPIC_API_KEY|REPLICATE_API_TOKEN|SUPABASE_SERVICE_ROLE_KEY|GHOST_FORGE_API_KEY)=([^\s,"'}]+)/g, "$1=[REDACTED]");
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
