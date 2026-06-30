#!/usr/bin/env node
/**
 * Builds a TinkerDen-friendly Command Dash relay status snapshot.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const ORGANISM_DIR = path.join(REPO_ROOT, "data", "organism");
const STATUS_PATH = path.join(ORGANISM_DIR, "command_dash_relay_status.json");

const SOURCES = {
  events: path.join(ORGANISM_DIR, "packet_relay_events.jsonl"),
  receipts: path.join(ORGANISM_DIR, "receipt_pickup.jsonl"),
  intake: path.join(ORGANISM_DIR, "command_dash_intake.jsonl"),
  intakeReceipts: path.join(ORGANISM_DIR, "command_dash_relay_intake_receipts.jsonl"),
  doctor: path.join(ORGANISM_DIR, "command_dash_relay_doctor.json"),
  triage: path.join(ORGANISM_DIR, "command_dash_inbox_triage.json")
};

function repoRelative(filePath) {
  return path.relative(REPO_ROOT, filePath).replace(/\\/g, "/");
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function readJsonl(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line)];
      } catch {
        return [];
      }
    });
}

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(`${filePath}.tmp`, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(`${filePath}.tmp`, filePath);
}

function main() {
  const events = readJsonl(SOURCES.events);
  const receipts = readJsonl(SOURCES.receipts);
  const intake = readJsonl(SOURCES.intake);
  const intakeReceipts = readJsonl(SOURCES.intakeReceipts);
  const doctor = readJson(SOURCES.doctor, { pass: false, counts: {} });
  const triage = readJson(SOURCES.triage, { pass: false, counts: {}, pending_packets: [] });
  const relayPacketIds = events
    .map((event) => event.packet?.packet_id)
    .filter(Boolean);
  const receiptPacketIds = new Set(receipts.map((receipt) => receipt.linked_packet_id).filter(Boolean));

  const status = {
    ok: true,
    built_at: new Date().toISOString(),
    health: {
      doctor_pass: doctor.pass === true,
      triage_pass: triage.pass === true,
      manual_send_boundary: events.every((event) =>
        event.delivery_mode === "manual_operator_paste_send" &&
        event.auto_send_to_external_aeye_chat === false
      )
    },
    counts: {
      relay_events: events.length,
      relay_receipts: relayPacketIds.filter((packetId) => receiptPacketIds.has(packetId)).length,
      intake_rows: intake.length,
      intake_processed: intakeReceipts.filter((receipt) => receipt.status === "processed").length,
      pending_aeye_receipts: triage.counts?.pending_packets ?? relayPacketIds.length
    },
    latest: {
      event: events.at(-1) || null,
      receipt: receipts.at(-1) || null,
      intake_receipt: intakeReceipts.at(-1) || null
    },
    sources: Object.fromEntries(Object.entries(SOURCES).map(([key, filePath]) => [key, repoRelative(filePath)])),
    doctor,
    triage
  };

  writeJsonAtomic(STATUS_PATH, status);
  console.log(JSON.stringify({
    pass: true,
    status_path: repoRelative(STATUS_PATH),
    counts: status.counts,
    health: status.health
  }, null, 2));
}

main();
