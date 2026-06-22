import fs from "node:fs";

import type { OperatorAssistConfig } from "./config.ts";

export type VisionAnalysisResult = {
  ok: boolean;
  provider: "gemini" | "openai" | "none";
  model: string | null;
  analysis: string;
  error: string | null;
};

const SNAPSHOT_PROMPT = `Analyze this Windows desktop screenshot for Operator workspace layout.

Return concise build notes for:
- monitor/app layout
- likely active work surfaces
- PowerToys Workspaces recommendations
- FancyZones zone suggestions
- any friction or obvious no-mulework improvement

Do not invent hidden state. If something is not visible, say unknown.`;

function asDataUrl(filePath: string): string {
  const bytes = fs.readFileSync(filePath);
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

async function analyzeWithGemini(config: OperatorAssistConfig, screenshotPath: string): Promise<VisionAnalysisResult> {
  const model = config.geminiVisionModel;
  const base64 = fs.readFileSync(screenshotPath).toString("base64");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(config.geminiApiKey ?? "")}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: SNAPSHOT_PROMPT },
            { inline_data: { mime_type: "image/png", data: base64 } }
          ]
        }
      ]
    })
  });

  const json = await res.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(json.error?.message ?? `Gemini request failed with HTTP ${res.status}`);
  }

  const analysis = json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n").trim();
  return {
    ok: Boolean(analysis),
    provider: "gemini",
    model,
    analysis: analysis || "Gemini returned no analysis text.",
    error: analysis ? null : "EMPTY_ANALYSIS"
  };
}

async function analyzeWithOpenAI(config: OperatorAssistConfig, screenshotPath: string): Promise<VisionAnalysisResult> {
  const model = config.openaiVisionModel;
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.openaiApiKey ?? ""}`
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: SNAPSHOT_PROMPT },
            { type: "input_image", image_url: asDataUrl(screenshotPath) }
          ]
        }
      ]
    })
  });

  const json = await res.json() as {
    output_text?: string;
    error?: { message?: string };
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };

  if (!res.ok) {
    throw new Error(json.error?.message ?? `OpenAI request failed with HTTP ${res.status}`);
  }

  const analysis =
    json.output_text ??
    json.output?.flatMap((item) => item.content ?? []).map((item) => item.text ?? "").join("\n").trim() ??
    "";

  return {
    ok: Boolean(analysis),
    provider: "openai",
    model,
    analysis: analysis || "OpenAI returned no analysis text.",
    error: analysis ? null : "EMPTY_ANALYSIS"
  };
}

export async function analyzeScreenshot(
  config: OperatorAssistConfig,
  screenshotPath: string
): Promise<VisionAnalysisResult> {
  if (config.provider === "none") {
    return {
      ok: false,
      provider: "none",
      model: null,
      analysis:
        "Vision analysis skipped: no GEMINI_API_KEY or OPENAI_API_KEY present. Screenshot was still captured and receipted.",
      error: "NO_VISION_PROVIDER"
    };
  }

  try {
    if (config.provider === "gemini") {
      return await analyzeWithGemini(config, screenshotPath);
    }
    return await analyzeWithOpenAI(config, screenshotPath);
  } catch (err) {
    return {
      ok: false,
      provider: config.provider,
      model: config.provider === "gemini" ? config.geminiVisionModel : config.openaiVisionModel,
      analysis: "Vision analysis failed cleanly. See error.",
      error: err instanceof Error ? err.message : "VISION_REQUEST_FAILED"
    };
  }
}
