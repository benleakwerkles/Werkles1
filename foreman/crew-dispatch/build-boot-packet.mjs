#!/usr/bin/env node
/**
 * Build BOOT context-reset packet for a cousin when context health recommends reset.
 *   node foreman/crew-dispatch/build-boot-packet.mjs --cousin PETRA
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { read, abs, nowIso, exists } from "../../scripts/foreman/_foreman-core.mjs";
import { computeCockpitHashes } from "./crew-relay-lib.mjs";

const COUSINS = ["PETRA", "SKYBRO", "ENDER", "BEAN", "COMPUTER"];
const ROLE_CARDS = "foreman/crew-dispatch/crew-role-cards.json";
const CONTEXT_HEALTH = "foreman/crew-dispatch/context-health.json";
const TEMPLATE = "foreman/templates/BOOT_COUSIN_PACKET_TEMPLATE.md";
const OUTBOX = "foreman/handoffs/outbox";

function loadRoleCards() {
  return JSON.parse(read(ROLE_CARDS));
}

function loadHealth() {
  if (!exists(CONTEXT_HEALTH)) return { cousins: {}, expectedGate: "(unknown)" };
  return JSON.parse(read(CONTEXT_HEALTH));
}

function saveHealth(data) {
  fs.writeFileSync(abs(CONTEXT_HEALTH), JSON.stringify(data, null, 2), "utf8");
}

function expand(template, tokens) {
  let out = template;
  for (const [k, v] of Object.entries(tokens)) {
    out = out.split(`{{${k}}}`).join(String(v ?? ""));
  }
  return out;
}

export function buildBootPacket(cousinId) {
  const id = cousinId.toUpperCase();
  if (!COUSINS.includes(id)) throw new Error(`Unknown cousin: ${cousinId}`);

  const cards = loadRoleCards();
  const card = cards.cousins[id];
  if (!card) throw new Error(`No role card for ${id}`);

  const hashes = computeCockpitHashes();
  const health = loadHealth();
  const generatedAt = nowIso();
  const slug = generatedAt.replace(/[:.]/g, "-").slice(0, 19);
  const packetId = `TO_${id}_BOOT_CONTEXT_${slug}`;
  const packetRel = `${OUTBOX}/${packetId}.md`;
  const pasteRel = `${OUTBOX}/${id}_BOOT_PASTE_BLOCK.txt`;

  const nextAction = exists("foreman/NEXT_ACTION.md") ? read("foreman/NEXT_ACTION.md").slice(0, 2000) : "";
  const currentState = exists("foreman/CURRENT_STATE.md") ? read("foreman/CURRENT_STATE.md").slice(0, 1500) : "";
  const cockpitSnippet = [nextAction, "", currentState].join("\n").trim();

  const tokens = {
    COUSIN: id,
    PLATFORM: card.platform,
    ROLE: card.role,
    EXPECTED_GATE: health.expectedGate || "(see NEXT_ACTION.md)",
    GENERATED_AT: generatedAt,
    COCKPIT_SNIPPET: cockpitSnippet,
    LANE_CARD: `${id}: ${card.lane}`,
    PACKET_ID: packetId,
    NEXT_ACTION_HASH: hashes.nextActionHash || "",
    CURRENT_STATE_HASH: hashes.currentStateHash || "",
  };

  const body = expand(read(TEMPLATE), tokens);
  fs.mkdirSync(abs(OUTBOX), { recursive: true });
  fs.writeFileSync(abs(packetRel), body, "utf8");
  fs.writeFileSync(abs(pasteRel), body, "utf8");

  if (health.cousins?.[id]) {
    health.cousins[id].bootPacketPath = packetRel;
    health.cousins[id].lastPacketId = packetId;
    health.cousins[id].lastPacketTimestamp = generatedAt;
    health.cousins[id].contextLoad = "LOW";
    health.cousins[id].resetRecommended = false;
    health.cousins[id].resetReason = null;
    health.cousins[id].status = "BOOT_ISSUED";
    health.updatedAt = generatedAt;
    saveHealth(health);
  }

  return { ok: true, packetId, packetRel, pasteRel, cousin: id };
}

function main() {
  let cousin = null;
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--cousin" && args[i + 1]) cousin = args[++i];
  }
  if (!cousin) {
    console.error("Usage: build-boot-packet.mjs --cousin PETRA");
    process.exit(1);
  }
  const result = buildBootPacket(cousin);
  console.log(JSON.stringify(result, null, 2));
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) main();
