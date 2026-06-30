#!/usr/bin/env node
/**
 * AEYE Crew Relay — outgoing packet generator + hash self-test.
 * Run from repo root: node foreman/crew-dispatch/crew-packet-generator.mjs --cousin BEAN
 */
import fs from "node:fs";
import path from "node:path";
import { runCockpitHashSelfTest } from "../../scripts/foreman/_foreman-core.mjs";
import {
  buildOutgoingMetadata,
  loadSchema,
  paths,
  ensureRelayDirs,
  stampOutgoingPacket,
  buildRelayMetadataBlock,
} from "./crew-relay-lib.mjs";

const COUSIN_MAP = {
  PETRA: { label: "Petra", title: "ChatGPT Comptroller", prefix: "TO_PETRA" },
  SKYBRO: { label: "Skybro", title: "Infra Cousin", prefix: "TO_SKYBRO" },
  ENDER: { label: "Ender", title: "Product Cousin", prefix: "TO_ENDER" },
  BEAN: { label: "Bean", title: "Hostile Audit", prefix: "TO_BEAN" },
  COMPUTER: { label: "Computer", title: "Doctrine Synthesis", prefix: "TO_COMPUTER" },
};

function usage() {
  console.log(`Usage (repo root):
  node foreman/crew-dispatch/crew-packet-generator.mjs --self-test
  node foreman/crew-dispatch/crew-packet-generator.mjs --cousin BEAN [--stamp path/to/TO_BEAN_*.md]
  node foreman/crew-dispatch/crew-packet-generator.mjs --cousin PETRA [--mission crew-checkin]`);
}

function timestampSlug() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}`;
}

function expandTemplate(template, tokens) {
  let out = template;
  for (const [k, v] of Object.entries(tokens)) {
    out = out.split(`{{${k}}}`).join(String(v ?? ""));
  }
  return out;
}

function runSelfTest() {
  const result = runCockpitHashSelfTest();
  console.log("Crew relay hash self-test");
  console.log(`  NEXT_ACTION.md hash: ${result.nextActionHashTrunc}`);
  console.log(`  CURRENT_STATE.md hash: ${result.currentStateHashTrunc ?? "(file missing)"}`);
  if (result.ok) {
    console.log("  PASS — generator/intake hash parity OK");
    process.exit(0);
  }
  console.log("  FAIL");
  for (const f of result.failures) console.log(`    - ${f}`);
  process.exit(1);
}

function generatePacket(cousinKey, missionId = "crew-checkin") {
  const cousin = cousinKey.toUpperCase();
  const info = COUSIN_MAP[cousin];
  if (!info) throw new Error(`Unknown cousin: ${cousinKey}`);

  if (cousin === "ENDER") {
    throw new Error(
      "ENDER dispatch is HELD: Ender@Sally is retired until Sally RAM upgrade and a clearing receipt. See foreman/change-capsules/CHANGE_CAPSULE_ENDER_SALLY_RETIRED.json. Do not silently move Ender to another machine without availability proof."
    );
  }

  ensureRelayDirs();
  loadSchema();

  const useImageryTemplate = cousin === "ENDER" && missionId === "ender-imagery-direction";
  const templateRel = useImageryTemplate
    ? "foreman/templates/TO_ENDER_IMAGERY_PACKET_TEMPLATE.md"
    : "foreman/templates/TO_COUSIN_PACKET_TEMPLATE.md";
  const templatePath = path.join(paths().root, templateRel);
  const template = fs.readFileSync(templatePath, "utf8");

  const missionExtras = {
    "ender-imagery-direction": [
      "foreman/IMAGERY_DIRECTION.md",
      "foreman/ghost-forge/IMAGERY_PROMPT_TEMPLATE.md",
      "foreman/SITE_STYLE_APPROVED_v0.6.md",
      "foreman/SITE_MAP.md",
    ],
  };

  const packetId = `${info.prefix}_${missionId.toUpperCase().replace(/-/g, "_")}_v2_${timestampSlug()}`;
  const packetFile = path.join(paths().outbox, `${packetId}.md`);
  const metadata = {
    ...buildOutgoingMetadata(cousin),
    packet_id: packetId,
    source_packet_file: `${packetId}.md`,
    role_lane: loadSchema().cousins[cousin]?.lane || null,
    human_gate_required: true,
    ...(useImageryTemplate
      ? {
          dispatch_class: "AUTO_LOAD_HUMAN_SEND",
          doctrine_files: ["foreman/IMAGERY_DIRECTION.md"],
        }
      : {}),
  };

  const cockpitFiles = [
    ...metadata.source_files_included,
    ...(missionExtras[missionId] || []),
  ];
  metadata.source_files_included = [...new Set(cockpitFiles)];
  const cockpitTable = metadata.source_files_included
    .map((f) => `| \`${f}\` | cockpit / doctrine source |`)
    .join("\n");

  const missionDescriptions = {
    "ender-imagery-direction":
      "Review IMAGERY_DIRECTION — site placements, static vs motion, formation beats. No assets. UI_COMMIT HOLD. Gate 05 PAUSE.",
  };

  const body = expandTemplate(template, {
    COUSIN_LABEL: info.label,
    COUSIN_TITLE: info.title,
    COUSIN_UPPER: cousin,
    MISSION_LABEL: missionId.replace(/-/g, " "),
    GENERATED_AT: metadata.generated_at,
    MISSION_DESCRIPTION:
      missionDescriptions[missionId] || `${info.label} crew relay packet — ${missionId}`,
    COCKPIT_TABLE: cockpitTable,
    RELAY_METADATA_JSON: JSON.stringify(metadata, null, 2),
  });

  fs.writeFileSync(packetFile, body, "utf8");
  return { packetId, packetFile, metadata };
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--self-test")) {
    runSelfTest();
    return;
  }

  let cousin = null;
  let stampPath = null;
  let mission = "crew-checkin";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--cousin" && args[i + 1]) cousin = args[++i];
    if (args[i] === "--stamp" && args[i + 1]) stampPath = args[++i];
    if (args[i] === "--mission" && args[i + 1]) mission = args[++i];
  }

  if (stampPath) {
    if (!cousin) {
      console.error("--stamp requires --cousin");
      process.exit(1);
    }
    const absStamp = path.isAbsolute(stampPath) ? stampPath : path.join(process.cwd(), stampPath);
    const packetId = path.basename(absStamp, ".md");
    const stamped = stampOutgoingPacket(absStamp, cousin, packetId);
    console.log(JSON.stringify(stamped, null, 2));
    return;
  }

  if (!cousin) {
    usage();
    process.exit(1);
  }

  const result = generatePacket(cousin, mission);
  console.log(JSON.stringify({ ok: true, ...result, packetFile: path.relative(process.cwd(), result.packetFile) }, null, 2));
}

main();
