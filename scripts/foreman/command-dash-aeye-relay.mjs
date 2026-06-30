#!/usr/bin/env node
/**
 * Command Dash -> Aeye Relay bridge.
 *
 * Turns ThinkIt / TinkerDen / Command Dash messy input into:
 * - Aeye outbox packet
 * - manual paste block
 * - packet relay event
 * - receipt pickup row
 *
 * It never sends, posts, submits, drives credentials, or claims delivery.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUTBOX_DIR = path.join(REPO_ROOT, "foreman", "handoffs", "outbox");
const ORGANISM_DIR = path.join(REPO_ROOT, "data", "organism");
const EVENTS_PATH = path.join(ORGANISM_DIR, "packet_relay_events.jsonl");
const RECEIPT_PICKUP_PATH = path.join(ORGANISM_DIR, "receipt_pickup.jsonl");
const PROOF_DIR = path.join(ORGANISM_DIR, "command_dash_relay_proofs");

const VALID_AEYES = new Set(["PETRA", "SKYBRO", "ENDER", "BEAN", "COMPUTER"]);

function repoRelative(filePath) {
  return path.relative(REPO_ROOT, filePath).replace(/\\/g, "/");
}

function slug(value) {
  return String(value || "packet")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "packet";
}

function stamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function sha256Text(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function sha256Json(value) {
  return sha256Text(JSON.stringify(value));
}

function writeAtomic(filePath, body) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(`${filePath}.tmp`, body, "utf8");
  fs.renameSync(`${filePath}.tmp`, filePath);
}

function writeJsonAtomic(filePath, value) {
  writeAtomic(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function appendJsonl(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = "true";
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

function normalizeAeye(value) {
  const aeye = String(value || "PETRA").trim().toUpperCase();
  if (!VALID_AEYES.has(aeye)) {
    throw new Error(`target_aeye must be one of ${Array.from(VALID_AEYES).join(", ")}`);
  }
  return aeye;
}

function assemblePacket(input) {
  const targetAeye = normalizeAeye(input.target_aeye);
  const source = input.source || "Command Dash";
  const title = input.title || "Command Dash Relay";
  const intent = input.intent || input.command || "Relay this Command Dash / ThinkIt / TinkerDen input to an Aeye for manual-send review.";
  const packetId = input.packet_id || `cmd_relay_${slug(source)}_${stamp()}`;
  const evidenceRequired = Array.isArray(input.evidence_required) && input.evidence_required.length > 0
    ? input.evidence_required
    : ["Aeye response returned as FROM_* receipt", "Operator manual Send confirmation if loaded into external chat"];
  const unresolvedFields = Array.isArray(input.unresolved_fields) ? input.unresolved_fields : [];
  const humanGates = Array.isArray(input.human_gates) && input.human_gates.length > 0
    ? input.human_gates
    : ["Operator must paste/send manually in external Aeye chat"];

  return {
    packet_id: packetId,
    source,
    source_aliases: ["Command Dash", "ThinkIt", "TinkerDen"],
    target_aeye: targetAeye,
    title,
    intent,
    context: input.context || intent,
    next_action: input.next_action || `Review packet and return receipt to TinkerDen Intake for ${packetId}.`,
    evidence_required: evidenceRequired,
    unresolved_fields: unresolvedFields,
    human_gates: humanGates,
    dispatch_class: "AUTO_LOAD_HUMAN_SEND",
    receipt_required: "Y",
    return_destination: input.return_destination || "TinkerDen Intake / Speaker",
    failure_condition: input.failure_condition || "No Aeye receipt returns, or packet is sent without operator manual Send.",
    rules: [
      "No account automation",
      "No unauthorized auto-send",
      "No browser credential control",
      "No fake delivery",
      "Clipboard + workspace focus only in V0",
      "Operator must paste/send manually"
    ]
  };
}

function packetMarkdown(packet) {
  return [
    `# TO_${packet.target_aeye} — ${packet.title}`,
    "",
    `**Packet ID:** \`${packet.packet_id}\``,
    `**Source:** ${packet.source}`,
    `**Target Aeye:** ${packet.target_aeye}`,
    `**Dispatch class:** ${packet.dispatch_class}`,
    `**Receipt required:** ${packet.receipt_required}`,
    `**Return destination:** ${packet.return_destination}`,
    "",
    "---",
    "",
    "## Intent",
    "",
    packet.intent,
    "",
    "## Context",
    "",
    packet.context,
    "",
    "## Next Action",
    "",
    packet.next_action,
    "",
    "## Evidence Required",
    "",
    ...packet.evidence_required.map((item) => `- ${item}`),
    "",
    "## Unresolved Fields",
    "",
    ...(packet.unresolved_fields.length > 0 ? packet.unresolved_fields.map((item) => `- ${item}`) : ["- none"]),
    "",
    "## Human Gates",
    "",
    ...packet.human_gates.map((item) => `- ${item}`),
    "",
    "## Failure Condition",
    "",
    packet.failure_condition,
    "",
    "## Manual Send Boundary",
    "",
    "This packet may be loaded into a workspace or clipboard. It must not be auto-sent.",
    "The Operator must paste/send manually.",
    ""
  ].join("\n");
}

export function buildCommandDashRelay(input = {}) {
  const packet = assemblePacket(input);
  const createdAt = new Date().toISOString();
  const packetFile = path.join(OUTBOX_DIR, `TO_${packet.target_aeye}_COMMAND_DASH_RELAY_${packet.packet_id}.md`);
  const pasteBlockFile = path.join(OUTBOX_DIR, `${packet.target_aeye}_COMMAND_DASH_RELAY_PASTE_BLOCK.txt`);
  const proofFile = path.join(PROOF_DIR, `${packet.packet_id}.json`);
  const body = packetMarkdown(packet);

  writeAtomic(packetFile, body);
  writeAtomic(pasteBlockFile, body);

  const event = {
    event_id: `packet_relay_ready_${packet.packet_id}`,
    event_type: "packet_relay_ready",
    source_system: packet.source,
    source_aliases: packet.source_aliases,
    target_aeye: packet.target_aeye,
    workspace_target: "clipboard_only_not_configured",
    delivery_mode: "manual_operator_paste_send",
    auto_send_to_external_aeye_chat: false,
    account_automation: false,
    browser_credential_control: false,
    fake_delivery: false,
    packet,
    packet_path: repoRelative(packetFile),
    paste_block_path: repoRelative(pasteBlockFile),
    created_at: createdAt
  };
  appendJsonl(EVENTS_PATH, event);

  const proof = {
    receipt_id: `receipt_${packet.packet_id}`,
    packet_id: packet.packet_id,
    mission: "COMMAND_DASH_TO_AEYE_RELAY",
    producer: "Maker@Doss",
    pass: true,
    proof_path: repoRelative(proofFile),
    packet_path: repoRelative(packetFile),
    paste_block_path: repoRelative(pasteBlockFile),
    event_path: repoRelative(EVENTS_PATH),
    packet_sha256: sha256Text(body),
    event_sha256: sha256Json(event),
    manual_send_required: true,
    receipt_required: true,
    created_at: createdAt
  };
  writeJsonAtomic(proofFile, proof);

  appendJsonl(RECEIPT_PICKUP_PATH, {
    receipt_id: proof.receipt_id,
    mission: proof.mission,
    producer: proof.producer,
    path: path.join(REPO_ROOT, proof.proof_path).replace(/\\/g, "/"),
    timestamp: createdAt,
    hash: sha256Json(proof),
    status_guess: "packet_relay_ready_manual_send_required",
    linked_packet_id: packet.packet_id
  });

  return { packet, proof };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = buildCommandDashRelay({
    packet_id: args.packet_id,
    source: args.source || "Command Dash / ThinkIt / TinkerDen",
    target_aeye: args.target_aeye || "PETRA",
    title: args.title || "Command Dash to Aeye Relay Proof",
    intent: args.intent,
    context: args.context,
    next_action: args.next_action,
    return_destination: args.return_destination
  });

  console.log(JSON.stringify({
    pass: true,
    packet_id: result.packet.packet_id,
    target_aeye: result.packet.target_aeye,
    packet_path: result.proof.packet_path,
    paste_block_path: result.proof.paste_block_path,
    proof_path: result.proof.proof_path,
    manual_send_required: true
  }, null, 2));
}

if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, "/")}`) {
  main();
}
