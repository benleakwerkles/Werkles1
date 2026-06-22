import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type VisionProvider = "gemini" | "openai" | "none";

export type OperatorAssistConfig = {
  toolRoot: string;
  outDir: string;
  provider: VisionProvider;
  geminiApiKey: string | null;
  openaiApiKey: string | null;
  geminiVisionModel: string;
  openaiVisionModel: string;
};

const srcDir = path.dirname(fileURLToPath(import.meta.url));
const toolRoot = path.resolve(srcDir, "..");

function loadDotEnv(filePath: string): void {
  if (!fs.existsSync(filePath)) return;

  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getConfig(): OperatorAssistConfig {
  loadDotEnv(path.join(toolRoot, ".env"));

  const geminiApiKey = clean(process.env.GEMINI_API_KEY);
  const openaiApiKey = clean(process.env.OPENAI_API_KEY);

  return {
    toolRoot,
    outDir: path.join(toolRoot, "out"),
    provider: geminiApiKey ? "gemini" : openaiApiKey ? "openai" : "none",
    geminiApiKey,
    openaiApiKey,
    geminiVisionModel: clean(process.env.GEMINI_VISION_MODEL) ?? "gemini-1.5-flash",
    openaiVisionModel: clean(process.env.OPENAI_VISION_MODEL) ?? "gpt-4.1-mini"
  };
}
