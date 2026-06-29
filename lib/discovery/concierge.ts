import { appendFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  discoveryAssetValues,
  discoveryLaneValues,
  discoveryResponseSpeedValues,
  type DiscoveryAsset,
  type DiscoveryIntakeInput,
  type DiscoveryIntakeRecord
} from "@/lib/discovery/schema";

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function oneOf<T extends readonly string[]>(value: unknown, allowed: T, fallback: T[number]): T[number] {
  const candidate = text(value);
  return (allowed as readonly string[]).includes(candidate) ? (candidate as T[number]) : fallback;
}

function assetList(value: unknown): DiscoveryAsset[] {
  const raw = Array.isArray(value) ? value : [];
  const allowed = new Set<string>(discoveryAssetValues);
  return raw.map((item) => text(item)).filter((item): item is DiscoveryAsset => allowed.has(item));
}

export function normalizeDiscoveryIntake(body: unknown): DiscoveryIntakeInput {
  const record = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  return {
    name: text(record.name),
    contact: text(record.contact),
    situation: text(record.situation),
    goal: text(record.goal),
    why_now: text(record.why_now),
    assets: assetList(record.assets),
    stated_blocker: text(record.stated_blocker),
    tried: text(record.tried),
    constraints: text(record.constraints),
    one_thing: text(record.one_thing),
    lane: oneOf(record.lane, discoveryLaneValues, "Unsure"),
    response_speed: oneOf(record.response_speed, discoveryResponseSpeedValues, "Few days"),
    notes: text(record.notes)
  };
}

export function validateDiscoveryIntake(input: DiscoveryIntakeInput): string[] {
  const missing: string[] = [];
  if (!input.name) missing.push("name");
  if (!input.contact) missing.push("contact");
  if (!input.situation) missing.push("situation");
  if (!input.goal) missing.push("goal");
  if (!input.stated_blocker) missing.push("stated_blocker");
  if (!input.one_thing) missing.push("one_thing");
  if (input.assets.length === 0) missing.push("assets");
  return missing;
}

function markdownValue(value: string | string[]): string {
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "Not provided";
  return value || "Not provided";
}

function recordMarkdown(record: DiscoveryIntakeRecord): string {
  return `# Werkles Discovery Record ${record.user_id}

Schema: ${record.schema}
State: ${record.state}
Intake date: ${record.intake_date}

## Intake

- Name: ${markdownValue(record.name)}
- Contact: ${markdownValue(record.contact)}
- Lane: ${markdownValue(record.lane)}
- Response speed: ${markdownValue(record.response_speed)}
- Assets: ${markdownValue(record.assets)}

### Situation

${markdownValue(record.situation)}

### Goal

${markdownValue(record.goal)}

### Why now

${markdownValue(record.why_now)}

### Self-stated blocker

${markdownValue(record.stated_blocker)}

### What they already tried

${markdownValue(record.tried)}

### Hard constraints

${markdownValue(record.constraints)}

### One thing a stranger could hand them

${markdownValue(record.one_thing)}

### Notes

${markdownValue(record.notes)}

## Bottleneck Review

- Reviewer:
- Review date:
- Situation restated:
- Translated need:
- Stated vs real mismatch:
- Primary bottleneck:
- Bottleneck why:
- Confidence: High / Medium / Low
- Notes:

## Recommendation Card

### What You Asked For

### What We Heard Underneath It

### Visible Reasons

### Recommendation

Best next path:

What would help:

### Why Not The Alternatives

### What Would Change This

## Outcome Tracking

- Acted: Pending
- Acted date:
- Felt right: Unknown
- Result:
- Disposition: Awaiting
- Next touch date:
- Follow-up notes:
`;
}

export async function writeDiscoveryIntake(input: DiscoveryIntakeInput): Promise<DiscoveryIntakeRecord> {
  const now = new Date();
  const shortId = randomUUID().slice(0, 8);
  const dateSlug = now.toISOString().slice(0, 10).replace(/-/g, "");
  const userId = `WZ-${dateSlug}-${shortId}`;
  const dataDir = path.join(process.cwd(), "data", "discovery");
  const recordDir = path.join(dataDir, "records");
  const recordRelativePath = path.join("data", "discovery", "records", `${userId}.md`).replaceAll("\\", "/");
  const record: DiscoveryIntakeRecord = {
    schema: "werkles_discovery_intake_v1",
    user_id: userId,
    intake_date: now.toISOString(),
    state: "Received",
    record_path: recordRelativePath,
    ...input
  };

  await mkdir(recordDir, { recursive: true });
  await appendFile(path.join(dataDir, "intakes.jsonl"), `${JSON.stringify(record)}\n`, "utf8");
  await writeFile(path.join(process.cwd(), recordRelativePath), recordMarkdown(record), "utf8");

  return record;
}
