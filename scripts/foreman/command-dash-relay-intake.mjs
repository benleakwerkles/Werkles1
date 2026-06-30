#!/usr/bin/env node
/**
 * Command Dash relay intake worker.
 *
 * Reads messy JSONL input from data/organism/command_dash_intake.jsonl,
 * converts each unprocessed row into an Aeye relay packet through
 * command-dash-aeye-relay.mjs, and records deterministic processing state.
 *
 * Modes:
 * - --once: process current intake and exit
 * - --watch: poll for new intake rows until stopped
 *
 * No auto-send. No browser control. No account automation.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { buildCommandDashRelay } from "./command-dash-aeye-relay.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const ORGANISM_DIR = path.join(REPO_ROOT, "data", "organism");
const INTAKE_PATH = path.join(ORGANISM_DIR, "command_dash_intake.jsonl");
const STATE_PATH = path.join(ORGANISM_DIR, "command_dash_relay_state.json");
const RECEIPTS_PATH = path.join(ORGANISM_DIR, "command_dash_relay_intake_receipts.jsonl");

function parseArgs(argv) {
  const args = { once: false, watch: false, intervalMs: 2000 };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--once") args.once = true;
    if (arg === "--watch") args.watch = true;
    if (arg === "--interval-ms" && argv[index + 1]) {
      args.intervalMs = Number(argv[index + 1]);
      index += 1;
    }
  }
  if (!args.once && !args.watch) args.once = true;
  return args;
}

function sha256Text(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function repoRelative(filePath) {
  return path.relative(REPO_ROOT, filePath).replace(/\\/g, "/");
}

function ensureFiles() {
  fs.mkdirSync(ORGANISM_DIR, { recursive: true });
  if (!fs.existsSync(INTAKE_PATH)) fs.writeFileSync(INTAKE_PATH, "", "utf8");
  if (!fs.existsSync(STATE_PATH)) {
    writeJsonAtomic(STATE_PATH, { processed: {}, last_run_at: null });
  }
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(`${filePath}.tmp`, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(`${filePath}.tmp`, filePath);
}

function appendJsonl(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

function readIntakeRows() {
  const contents = fs.readFileSync(INTAKE_PATH, "utf8");
  const rows = [];
  const errors = [];

  contents.split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const hash = sha256Text(trimmed);

    try {
      rows.push({ line: index + 1, hash, input: JSON.parse(trimmed) });
    } catch (error) {
      errors.push({
        line: index + 1,
        hash,
        error: error instanceof Error ? error.message : "Invalid JSON"
      });
    }
  });

  return { rows, errors };
}

function normalizeInput(row) {
  const input = row.input && typeof row.input === "object" && !Array.isArray(row.input)
    ? row.input
    : {};
  const packetId = typeof input.packet_id === "string" && input.packet_id
    ? input.packet_id
    : `cmd_dash_intake_${row.hash.slice(0, 12)}`;

  return {
    ...input,
    packet_id: packetId,
    source: input.source || "Command Dash Intake",
    title: input.title || "Command Dash Intake Relay",
    intent: input.intent || input.command || input.text || "Relay intake row to an Aeye for manual-send review.",
    context: input.context || input.text || input.command || input.intent || "No extra context supplied.",
    target_aeye: input.target_aeye || "PETRA",
    return_destination: input.return_destination || "TinkerDen Intake / Speaker"
  };
}

function processOnce() {
  ensureFiles();
  const state = readJson(STATE_PATH, { processed: {}, last_run_at: null });
  const processed = state.processed && typeof state.processed === "object" ? state.processed : {};
  const { rows, errors } = readIntakeRows();
  const results = [];

  for (const error of errors) {
    if (processed[error.hash]) continue;
    const receipt = {
      status: "blocked",
      reason: "invalid_json",
      intake_line: error.line,
      intake_hash: error.hash,
      error: error.error,
      created_at: new Date().toISOString()
    };
    appendJsonl(RECEIPTS_PATH, receipt);
    processed[error.hash] = receipt;
    results.push(receipt);
  }

  for (const row of rows) {
    if (processed[row.hash]) continue;
    const relayInput = normalizeInput(row);
    const relay = buildCommandDashRelay(relayInput);
    const receipt = {
      status: "processed",
      intake_line: row.line,
      intake_hash: row.hash,
      packet_id: relay.packet.packet_id,
      target_aeye: relay.packet.target_aeye,
      packet_path: relay.proof.packet_path,
      paste_block_path: relay.proof.paste_block_path,
      proof_path: relay.proof.proof_path,
      manual_send_required: true,
      created_at: new Date().toISOString()
    };
    appendJsonl(RECEIPTS_PATH, receipt);
    processed[row.hash] = receipt;
    results.push(receipt);
  }

  writeJsonAtomic(STATE_PATH, {
    processed,
    last_run_at: new Date().toISOString(),
    intake_path: repoRelative(INTAKE_PATH),
    receipts_path: repoRelative(RECEIPTS_PATH)
  });

  return {
    pass: true,
    intake_path: repoRelative(INTAKE_PATH),
    processed_this_run: results.length,
    total_seen: rows.length + errors.length,
    receipts_path: repoRelative(RECEIPTS_PATH),
    state_path: repoRelative(STATE_PATH),
    results
  };
}

async function watch(intervalMs) {
  console.log(JSON.stringify({ watching: repoRelative(INTAKE_PATH), interval_ms: intervalMs }, null, 2));
  let running = false;

  setInterval(() => {
    if (running) return;
    running = true;
    try {
      const result = processOnce();
      if (result.processed_this_run > 0) {
        console.log(JSON.stringify(result, null, 2));
      }
    } finally {
      running = false;
    }
  }, intervalMs);
}

const args = parseArgs(process.argv.slice(2));

if (args.once) {
  console.log(JSON.stringify(processOnce(), null, 2));
} else {
  await watch(args.intervalMs);
}
