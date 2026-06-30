#!/usr/bin/env node
/**
 * Command Dash relay doctor.
 *
 * Validates packet relay events against filesystem proof:
 * event -> packet file -> paste block -> proof -> receipt pickup row.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const ORGANISM_DIR = path.join(REPO_ROOT, "data", "organism");
const EVENTS_PATH = path.join(ORGANISM_DIR, "packet_relay_events.jsonl");
const RECEIPT_PICKUP_PATH = path.join(ORGANISM_DIR, "receipt_pickup.jsonl");
const PROOF_DIR = path.join(ORGANISM_DIR, "command_dash_relay_proofs");
const REPORT_PATH = path.join(ORGANISM_DIR, "command_dash_relay_doctor.json");

function repoRelative(filePath) {
  return path.relative(REPO_ROOT, filePath).replace(/\\/g, "/");
}

function absFromRepo(relPath) {
  return path.join(REPO_ROOT, String(relPath || "").replace(/\//g, path.sep));
}

function readJsonl(filePath) {
  if (!fs.existsSync(filePath)) return { rows: [], errors: [] };

  const rows = [];
  const errors = [];
  fs.readFileSync(filePath, "utf8").split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      rows.push(JSON.parse(trimmed));
    } catch (error) {
      errors.push({
        line: index + 1,
        error: error instanceof Error ? error.message : "Invalid JSON"
      });
    }
  });
  return { rows, errors };
}

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(`${filePath}.tmp`, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(`${filePath}.tmp`, filePath);
}

function checkEvent(event, receiptRows) {
  const packetId = event.packet?.packet_id || null;
  const proofPath = packetId ? path.join(PROOF_DIR, `${packetId}.json`) : null;
  const checks = [
    {
      name: "packet_id_present",
      pass: Boolean(packetId)
    },
    {
      name: "manual_send_boundary",
      pass: event.delivery_mode === "manual_operator_paste_send" &&
        event.auto_send_to_external_aeye_chat === false &&
        event.account_automation === false &&
        event.browser_credential_control === false &&
        event.fake_delivery === false
    },
    {
      name: "packet_file_exists",
      pass: Boolean(event.packet_path && fs.existsSync(absFromRepo(event.packet_path))),
      path: event.packet_path || null
    },
    {
      name: "paste_block_exists",
      pass: Boolean(event.paste_block_path && fs.existsSync(absFromRepo(event.paste_block_path))),
      path: event.paste_block_path || null
    },
    {
      name: "proof_exists",
      pass: Boolean(proofPath && fs.existsSync(proofPath)),
      path: proofPath ? repoRelative(proofPath) : null
    },
    {
      name: "receipt_pickup_linked",
      pass: Boolean(packetId && receiptRows.some((row) => row.linked_packet_id === packetId))
    }
  ];

  return {
    packet_id: packetId,
    target_aeye: event.target_aeye || event.packet?.target_aeye || "UNKNOWN",
    event_id: event.event_id || "UNKNOWN",
    pass: checks.every((check) => check.pass),
    checks
  };
}

function main() {
  const events = readJsonl(EVENTS_PATH);
  const receipts = readJsonl(RECEIPT_PICKUP_PATH);
  const eventReports = events.rows.map((event) => checkEvent(event, receipts.rows));
  const report = {
    pass: eventReports.every((event) => event.pass) && events.errors.length === 0 && receipts.errors.length === 0,
    checked_at: new Date().toISOString(),
    source: {
      events: repoRelative(EVENTS_PATH),
      receipts: repoRelative(RECEIPT_PICKUP_PATH)
    },
    counts: {
      events: events.rows.length,
      receipt_rows: receipts.rows.length,
      event_parse_errors: events.errors.length,
      receipt_parse_errors: receipts.errors.length,
      passing_events: eventReports.filter((event) => event.pass).length,
      failing_events: eventReports.filter((event) => !event.pass).length
    },
    parse_errors: {
      events: events.errors,
      receipts: receipts.errors
    },
    events: eventReports
  };

  writeJsonAtomic(REPORT_PATH, report);
  console.log(JSON.stringify({
    pass: report.pass,
    report_path: repoRelative(REPORT_PATH),
    counts: report.counts
  }, null, 2));
}

main();
