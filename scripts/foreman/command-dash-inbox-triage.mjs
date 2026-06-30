#!/usr/bin/env node
/**
 * Command Dash Aeye inbox triage.
 *
 * Scans foreman/handoffs/inbox for FROM_* replies and classifies whether each
 * Command Dash relay packet has a returned Aeye receipt yet.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const ORGANISM_DIR = path.join(REPO_ROOT, "data", "organism");
const EVENTS_PATH = path.join(ORGANISM_DIR, "packet_relay_events.jsonl");
const INBOX_DIR = path.join(REPO_ROOT, "foreman", "handoffs", "inbox");
const TRIAGE_PATH = path.join(ORGANISM_DIR, "command_dash_inbox_triage.json");

function repoRelative(filePath) {
  return path.relative(REPO_ROOT, filePath).replace(/\\/g, "/");
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

function inboxFiles() {
  if (!fs.existsSync(INBOX_DIR)) return [];
  return fs.readdirSync(INBOX_DIR)
    .filter((name) => /^FROM_.*\.(md|json)$/i.test(name))
    .map((name) => path.join(INBOX_DIR, name));
}

function classifyInboxFile(filePath, packetIds) {
  const body = fs.readFileSync(filePath, "utf8");
  const matchedPacketIds = packetIds.filter((packetId) => body.includes(packetId));
  const filename = path.basename(filePath);
  const from = filename.match(/^FROM_([^_]+)/i)?.[1]?.toUpperCase() || "UNKNOWN";

  return {
    path: repoRelative(filePath),
    from,
    matched_packet_ids: matchedPacketIds,
    command_dash_related: matchedPacketIds.length > 0 || /command dash|thinkit|tinkerden|packet relay/i.test(body)
  };
}

function main() {
  const events = readJsonl(EVENTS_PATH);
  const packetIds = events
    .map((event) => event.packet?.packet_id)
    .filter((packetId) => typeof packetId === "string" && packetId.length > 0);
  const inbox = inboxFiles().map((filePath) => classifyInboxFile(filePath, packetIds));
  const matched = new Set(inbox.flatMap((file) => file.matched_packet_ids));
  const pendingPackets = packetIds.filter((packetId) => !matched.has(packetId));
  const triage = {
    pass: true,
    triaged_at: new Date().toISOString(),
    source: {
      events: repoRelative(EVENTS_PATH),
      inbox: repoRelative(INBOX_DIR)
    },
    counts: {
      relay_packets: packetIds.length,
      inbox_files: inbox.length,
      command_dash_related_inbox_files: inbox.filter((file) => file.command_dash_related).length,
      matched_packets: matched.size,
      pending_packets: pendingPackets.length
    },
    pending_packets: pendingPackets.map((packetId) => ({
      packet_id: packetId,
      status: "awaiting_aeye_receipt",
      next_action: "Operator manually sends prepared paste block; Aeye response returns as FROM_* inbox file."
    })),
    inbox
  };

  writeJsonAtomic(TRIAGE_PATH, triage);
  console.log(JSON.stringify({
    pass: true,
    triage_path: repoRelative(TRIAGE_PATH),
    counts: triage.counts
  }, null, 2));
}

main();
