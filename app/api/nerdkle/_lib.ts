import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export const NERDKLE_ROOT = path.join(process.cwd(), "data", "organism", "nerdkle");
export const OBJECTS_DIR = path.join(NERDKLE_ROOT, "objects");
export const RECEIPTS_DIR = path.join(NERDKLE_ROOT, "receipts");
export const PLANS_DIR = path.join(NERDKLE_ROOT, "plans");
export const EVENTS_PATH = path.join(NERDKLE_ROOT, "events.jsonl");
export const EXECUTION_PACKETS_PATH = path.join(NERDKLE_ROOT, "execution_packets.jsonl");
export const HANDOFF_OUTBOX_DIR = path.join(process.cwd(), "foreman", "handoffs", "outbox");

export type NerdkleObject = {
  id: string;
  object_type: string;
  operator_intent: string;
  artifact_created: string;
  unresolved_fields: string[];
  human_gates: string[];
  execution_owner: string;
  next_action: string;
  evidence_required: string[];
  failure_condition: string;
  receipt_required?: {
    required: string;
    destination: string;
  };
  resolved_fields?: Record<string, string>;
  status?: {
    stage: string;
    updated_at: string;
    last_receipt_path?: string;
  };
  created_at: string;
};

export function repoRelative(filePath: string) {
  return path.relative(process.cwd(), filePath).replace(/\\/g, "/");
}

export function sha256(value: unknown) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export async function writeJsonAtomic(filePath: string, value: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(`${filePath}.tmp`, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await fs.rename(`${filePath}.tmp`, filePath);
}

export async function writeTextAtomic(filePath: string, value: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(`${filePath}.tmp`, value, "utf8");
  await fs.rename(`${filePath}.tmp`, filePath);
}

export async function appendJsonl(filePath: string, value: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.appendFile(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

export async function findObjectFile(objectId: string) {
  const safeId = objectId.trim();
  if (!/^nerdkle_[a-z0-9-]+_[a-z0-9]+$/i.test(safeId)) {
    throw new Error("invalid object_id");
  }

  const filePath = path.join(OBJECTS_DIR, `${safeId}.json`);
  const object = JSON.parse(await fs.readFile(filePath, "utf8")) as NerdkleObject;
  return { filePath, object };
}

export function questionForField(field: string) {
  const normalized = field.toLowerCase();
  if (normalized.includes("target")) return "Who is this for, and who benefits first?";
  if (normalized.includes("timeline")) return "When does this need to exist, and what is the smallest useful deadline?";
  if (normalized.includes("constraints") || normalized.includes("budget")) return "What constraints, budget, time box, or materials should the executor respect?";
  if (normalized.includes("evidence")) return "What proof should count as done?";
  return `What should Nerdkle know about ${field}?`;
}

export function questionsForObject(object: NerdkleObject) {
  return (object.unresolved_fields ?? []).map((field) => ({
    field,
    question: questionForField(field)
  }));
}

export function stageForObject(object: NerdkleObject) {
  if (object.status?.stage === "completed" || object.status?.stage === "blocked") return object.status.stage;
  if ((object.unresolved_fields ?? []).length > 0) return "needs_clarification";
  const gates = object.human_gates ?? [];
  if (gates.some((gate) => gate !== "none")) return "waiting_on_human_gate";
  return "ready_for_execution";
}

export function qualityForObject(object: NerdkleObject) {
  const stage = stageForObject(object);
  const unresolved = object.unresolved_fields ?? [];
  const trueGates = (object.human_gates ?? []).filter((gate) => gate !== "none");
  const issues = [
    ...unresolved.map((field) => `unresolved: ${field}`),
    ...trueGates.map((gate) => `human gate: ${gate}`),
    ...(object.execution_owner ? [] : ["missing execution owner"]),
    ...((object.evidence_required ?? []).length > 0 ? [] : ["missing evidence requirement"]),
    ...(stage === "blocked" ? ["object is blocked"] : [])
  ];
  const score = Math.max(0, 100
    - unresolved.length * 18
    - trueGates.length * 22
    - (object.execution_owner ? 0 : 18)
    - ((object.evidence_required ?? []).length > 0 ? 0 : 12)
    - (stage === "blocked" ? 35 : 0)
  );

  return {
    score,
    stage,
    ready: score >= 80 && stage === "ready_for_execution",
    issues,
    recommendation: issues.length > 0
      ? `Resolve ${issues[0]} first.`
      : "Ready to plan, packet, or execute."
  };
}

export function safeOwnerName(value: string) {
  return String(value || "OWNER")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "OWNER";
}

export function executionPacketBody(object: NerdkleObject, objectPath: string) {
  return [
    `# TO_${safeOwnerName(object.execution_owner)} - Nerdkle Execution Packet`,
    "",
    `**Object ID:** \`${object.id}\``,
    `**Object path:** \`${repoRelative(objectPath)}\``,
    `**Execution owner:** ${object.execution_owner}`,
    `**Receipt required:** ${object.receipt_required?.required || "Y"}`,
    "",
    "---",
    "",
    "## Operator Intent",
    "",
    object.operator_intent,
    "",
    "## Next Action",
    "",
    object.next_action,
    "",
    "## Unresolved Fields",
    "",
    ...((object.unresolved_fields ?? []).length > 0 ? object.unresolved_fields.map((field) => `- ${field}`) : ["- none"]),
    "",
    "## Human Gates",
    "",
    ...((object.human_gates ?? []).length > 0 ? object.human_gates.map((gate) => `- ${gate}`) : ["- none"]),
    "",
    "## Evidence Required",
    "",
    ...((object.evidence_required ?? []).length > 0 ? object.evidence_required.map((item) => `- ${item}`) : ["- receipt written"]),
    "",
    "## Failure Condition",
    "",
    object.failure_condition,
    "",
    "## Return",
    "",
    "Return receipt to `data/organism/nerdkle/receipts/` and `foreman/handoffs/inbox/` if routed to another Aeye.",
    ""
  ].join("\n");
}

export function executionPlanBody(object: NerdkleObject, objectPath: string) {
  const stage = stageForObject(object);
  return [
    `# Nerdkle Execution Plan - ${object.id}`,
    "",
    `**Stage:** ${stage}`,
    `**Object path:** \`${repoRelative(objectPath)}\``,
    `**Execution owner:** ${object.execution_owner}`,
    "",
    "## Operator Intent",
    "",
    object.operator_intent,
    "",
    "## One-Screen Plan",
    "",
    `1. Confirm unresolved fields: ${(object.unresolved_fields ?? []).join(", ") || "none"}.`,
    `2. Respect human gates: ${(object.human_gates ?? []).join(", ") || "none"}.`,
    `3. Execute the next action: ${object.next_action}`,
    `4. Return proof to ${object.receipt_required?.destination || "data/organism/nerdkle/receipts"}.`,
    "",
    "## Resolved Context",
    "",
    ...Object.entries(object.resolved_fields ?? {}).map(([field, answer]) => `- ${field}: ${answer}`),
    ...((Object.keys(object.resolved_fields ?? {}).length === 0) ? ["- none"] : []),
    "",
    "## Evidence Required",
    "",
    ...((object.evidence_required ?? []).length > 0 ? object.evidence_required.map((item) => `- ${item}`) : ["- receipt written"]),
    "",
    "## Failure Condition",
    "",
    object.failure_condition,
    ""
  ].join("\n");
}
