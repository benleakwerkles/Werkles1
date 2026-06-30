#!/usr/bin/env node
/**
 * Nerdkle execution packet builder.
 *
 * Converts a Nerdkle operating object into a handoff packet for its execution
 * owner. No send automation; packet lands in foreman/handoffs/outbox.
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const NERDKLE_ROOT = path.join(REPO_ROOT, "data", "organism", "nerdkle");
const OBJECTS_DIR = path.join(NERDKLE_ROOT, "objects");
const OUTBOX_DIR = path.join(REPO_ROOT, "foreman", "handoffs", "outbox");
const EXECUTION_EVENTS = path.join(NERDKLE_ROOT, "execution_packets.jsonl");

function repoRelative(filePath) {
  return path.relative(REPO_ROOT, filePath).replace(/\\/g, "/");
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    args[arg.slice(2)] = argv[index + 1];
    index += 1;
  }
  return args;
}

function latestObjectPath() {
  const files = fs.readdirSync(OBJECTS_DIR)
    .filter((name) => name.endsWith(".json"))
    .map((name) => path.join(OBJECTS_DIR, name))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  if (!files[0]) throw new Error("No Nerdkle objects found");
  return files[0];
}

function safeName(value) {
  return String(value || "OWNER")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "OWNER";
}

function packetBody(object, objectPath) {
  return [
    `# TO_${safeName(object.execution_owner)} - Nerdkle Execution Packet`,
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
    ...(object.unresolved_fields?.length ? object.unresolved_fields.map((field) => `- ${field}`) : ["- none"]),
    "",
    "## Human Gates",
    "",
    ...(object.human_gates?.length ? object.human_gates.map((gate) => `- ${gate}`) : ["- none"]),
    "",
    "## Evidence Required",
    "",
    ...(object.evidence_required?.length ? object.evidence_required.map((item) => `- ${item}`) : ["- receipt written"]),
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

function writeAtomic(filePath, body) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(`${filePath}.tmp`, body, "utf8");
  fs.renameSync(`${filePath}.tmp`, filePath);
}

function appendJsonl(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

const args = parseArgs(process.argv.slice(2));
const objectPath = args.object ? path.resolve(REPO_ROOT, args.object) : latestObjectPath();
const object = JSON.parse(fs.readFileSync(objectPath, "utf8"));
const owner = safeName(object.execution_owner);
const packetPath = path.join(OUTBOX_DIR, `TO_${owner}_NERDKLE_EXECUTE_${object.id}.md`);
const body = packetBody(object, objectPath);

writeAtomic(packetPath, body);
appendJsonl(EXECUTION_EVENTS, {
  event_type: "nerdkle_execution_packet_created",
  object_id: object.id,
  object_path: repoRelative(objectPath),
  packet_path: repoRelative(packetPath),
  execution_owner: object.execution_owner,
  created_at: new Date().toISOString()
});

console.log(JSON.stringify({
  pass: true,
  object_id: object.id,
  execution_owner: object.execution_owner,
  packet_path: repoRelative(packetPath)
}, null, 2));
