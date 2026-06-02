#!/usr/bin/env node
/**
 * AEYE Edge Network — first command issuer (ROLE_AWARENESS_SYNC).
 *
 * Run from repo root:
 *   node foreman/crew-dispatch/crew-relay-network-command.mjs issue
 *   node foreman/crew-dispatch/crew-relay-network-command.mjs show
 *   node foreman/crew-dispatch/crew-relay-network-command.mjs show --cousin PETRA
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildOutgoingMetadata,
  buildRelayMetadataBlock,
  loadSchema,
  paths,
  ensureRelayDirs,
  truncateHash,
  computeCockpitHashes,
} from "./crew-relay-lib.mjs";
import { read, nowIso } from "../../scripts/foreman/_foreman-core.mjs";

const ROLES_PATH = "foreman/crew-dispatch/crew-network-roles.json";
const LATEST_MANIFEST = "foreman/crew-dispatch/LATEST_NETWORK_COMMAND.json";
const COMMAND_ID = "ROLE_AWARENESS_SYNC";
const COMMAND_VERSION = "v0.1";

function timestampSlug() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}`;
}

export function loadNetworkRoles() {
  return JSON.parse(read(ROLES_PATH));
}

function networkTable(rolesDoc) {
  const rows = Object.entries(rolesDoc.cousins).map(([id, c]) => {
    return `| ${c.edgeTabIndex} | **${c.name}** (${id}) | ${c.platform} | ${c.lane} |`;
  });
  return ["| Tab | Cousin | Platform | Lane |", "|-----|--------|----------|------|", ...rows].join("\n");
}

function buildCousinPacket(cousinId, rolesDoc, commandMeta) {
  const cousin = rolesDoc.cousins[cousinId];
  if (!cousin) throw new Error(`Unknown cousin: ${cousinId}`);

  const schema = loadSchema();
  const hashes = computeCockpitHashes();
  const packetId = `TO_${cousinId}_RELAY_${COMMAND_ID}_${COMMAND_VERSION}_${commandMeta.timestampSlug}`;
  const packetFile = `${packetId}.md`;

  const metadata = {
    ...buildOutgoingMetadata(cousinId),
    packet_id: packetId,
    source_packet_file: packetFile,
    network_command: COMMAND_ID,
    network_command_version: COMMAND_VERSION,
    role_lane: cousin.lane,
    human_gate_required: true,
    edge_tab_index: cousin.edgeTabIndex,
    edge_url: cousin.edgeUrl,
  };

  const others = Object.entries(rolesDoc.cousins)
    .filter(([id]) => id !== cousinId)
    .map(([id, c]) => `- **${c.name}** (${id}, tab ${c.edgeTabIndex}): ${c.lane}`)
    .join("\n");

  const body = `# AEYE Network Command — ${COMMAND_ID}

**To ${cousin.name}** (${cousin.platform} · tab ${cousin.edgeTabIndex})

## Command

\`${COMMAND_ID}\` ${COMMAND_VERSION} — **Role awareness sync across the Edge network.**

Ben is issuing the **first network command** so every Aeye cousin knows their seat, lane, and relay rules before real handoffs flow.

**STOP BEFORE SEND:** this packet was prepared on Sally. Ben pastes manually. You do not auto-act on repo files.

---

## Your role in the relay

| Field | Value |
|-------|-------|
| **Cousin ID** | ${cousinId} |
| **Seat** | ${cousin.seat} |
| **Platform** | ${cousin.platform} |
| **Edge tab** | #${cousin.edgeTabIndex} → ${cousin.edgeUrl} |
| **Lane** | ${cousin.lane} |
| **Relay job (this command)** | ${cousin.relayJob} |

### You must NOT

${cousin.mustNot.map((x) => `- ${x}`).join("\n")}

### Read first (cockpit)

${cousin.readsFirst.map((f) => `- \`${f}\``).join("\n")}

---

## The Edge network (cousins)

${networkTable(rolesDoc)}

**Outside this paste loop (Sally, not Edge tabs):**

${rolesDoc.outsideEdgeRelay.map((x) => `- **${x.name}** — ${x.note}`).join("\n")}

---

## Relay doctrine (all cousins)

| Rule | Detail |
|------|--------|
| Stops before Send | Ben pastes; Ben clicks Send |
| Response inbox | \`${rolesDoc.networkDoctrine.responseInbox}\` as \`FROM_${cousinId}_*.md\` |
| Response template | \`${rolesDoc.networkDoctrine.responseTemplate}\` |
| Intake | Sally validates with \`${rolesDoc.networkDoctrine.intakeScript}\` — no auto-merge |
| Stale cockpit | If \`nextActionHash\` differs from packet → **STALE_DO_NOT_APPLY** |
| Hash source | \`foreman/NEXT_ACTION.md\` raw SHA-256 (see relay metadata) |

Current cockpit hashes (for your response metadata):

- \`nextActionHash\`: \`${hashes.nextActionHash}\` (trunc: ${truncateHash(hashes.nextActionHash)})
- \`currentStateHash\`: ${hashes.currentStateHash ? `\`${hashes.currentStateHash}\` (trunc: ${truncateHash(hashes.currentStateHash)})` : "(CURRENT_STATE.md missing)"}

---

## Required response (${cousin.name})

Reply with a \`FROM_${cousinId}_RELAY_ROLE_ACK_*.md\` saved to inbox (Ben will paste your reply into a file, or you output markdown Ben saves).

Include **Relay metadata** JSON with all \`REQUIRED_RESPONSE_FIELDS\` from schema plus:

- \`VERDICT\`: one line — e.g. \`ROLE_ACK — ${cousinId} lane understood\`
- \`CONFIDENCE\`: \`HIGH\` or \`LOW\`
- \`UNKNOWNS\`: \`none\` or list; say **outside my lane** if unsure
- \`source_packet_id\`: \`${packetId}\`
- \`source_packet_file\`: \`${packetFile}\`
- \`nextActionHash\`: copy from this packet metadata exactly

Summarize in prose:

1. Your lane in one sentence
2. One thing you will **not** do (human gate)
3. One cousin you would escalate to for work outside your lane

---

${buildRelayMetadataBlock(metadata)}
`;

  return { cousinId, packetId, packetFile, metadata, body, cousin };
}

function buildPasteBlock(cousinId, cousin, packetId, packetFile) {
  return `[AEYE RELAY — ${COMMAND_ID} ${COMMAND_VERSION}]

${cousin.name} (${cousin.platform}, Edge tab ${cousin.edgeTabIndex}):

You are receiving the **first network command** on the Werkles Aeye Edge relay.

COMMAND: ${COMMAND_ID}
PACKET: ${packetFile}
YOUR LANE: ${cousin.lane}
RELAY JOB: ${cousin.relayJob}

STOP BEFORE SEND — Ben pasted this manually.

Reply with ROLE_ACK using FROM_${cousinId}_* and required relay metadata fields:
- VERDICT: ROLE_ACK — lane understood
- CONFIDENCE: HIGH | LOW
- UNKNOWNS: none | list
- Copy nextActionHash from full packet metadata (open ${packetFile} on Sally if needed)

Full packet on Sally: foreman/handoffs/outbox/${packetFile}
`;
}

function buildMasterCommand(manifest, rolesDoc) {
  const checklist = manifest.cousins
    .map(
      (c) =>
        `${c.edgeTabIndex}. **${c.name}** — open tab → dashboard **Load ${c.name} Network Paste** (or ${c.pasteBlockSuffix}) → Ctrl+V → **Ben Send** → save reply to inbox`
    )
    .join("\n");

  return `# AEYE Edge Network — First Command Issued

**Command:** \`${COMMAND_ID}\` ${COMMAND_VERSION}  
**Issued:** ${manifest.issued_at}  
**Issued by:** Operator (Ben) via Foreman relay  
**Doctrine:** STOP BEFORE SEND — no auto-submit across Edge tabs

---

## What this is

The **first command across the Edge network** synchronizes role awareness for all five Aeye cousins before real cousin handoffs are processed.

Each cousin receives:

1. A full packet in \`foreman/handoffs/outbox/\`
2. A short paste block for the Edge chat tab
3. Relay metadata with cockpit hashes for stale detection

---

## Network map

${networkTable(rolesDoc)}

---

## Operator walk (Edge bay)

1. **Open Aeye Crew Bay** (Foreman dashboard → tab order in \`crew-tabs.config.json\`)
2. For each cousin, in tab order:

${checklist}

3. After all five reply: **Validate Inbox** → **Process Responses** on Foreman dashboard
4. Review processed summary for Ben-review flags — **never auto-merge**

---

## Artifacts

| Artifact | Path |
|----------|------|
| Master command (this file) | \`${manifest.masterCommandFile}\` |
| Manifest | \`${LATEST_MANIFEST}\` |
${manifest.cousins.map((c) => `| ${c.name} packet | \`foreman/handoffs/outbox/${c.packetFile}\` |`).join("\n")}
${manifest.cousins.map((c) => `| ${c.name} paste | \`foreman/handoffs/outbox/${c.pasteBlockSuffix}\` |`).join("\n")}

---

## CLI

\`\`\`powershell
node foreman/crew-dispatch/crew-relay-network-command.mjs show
node foreman/crew-dispatch/crew-relay-network-command.mjs show --cousin PETRA
\`\`\`

See \`foreman/crew-dispatch/RELAY_NETWORK.md\`.
`;
}

export function issueNetworkCommand() {
  ensureRelayDirs();
  loadSchema();
  const rolesDoc = loadNetworkRoles();
  const ts = timestampSlug();
  const issuedAt = nowIso();
  const outbox = paths().outbox;

  const commandMeta = { timestampSlug: ts, issuedAt, commandId: COMMAND_ID, commandVersion: COMMAND_VERSION };
  const cousinIds = Object.keys(rolesDoc.cousins);
  const cousins = [];

  for (const cousinId of cousinIds) {
    const built = buildCousinPacket(cousinId, rolesDoc, commandMeta);
    const packetPath = path.join(outbox, built.packetFile);
    fs.writeFileSync(packetPath, built.body, "utf8");

    const paste = buildPasteBlock(cousinId, built.cousin, built.packetId, built.packetFile);
    const pastePath = path.join(outbox, built.cousin.pasteBlockSuffix);
    fs.writeFileSync(pastePath, paste, "utf8");

    cousins.push({
      cousinId,
      name: built.cousin.name,
      platform: built.cousin.platform,
      edgeTabIndex: built.cousin.edgeTabIndex,
      packetId: built.packetId,
      packetFile: built.packetFile,
      packetPath: path.relative(process.cwd(), packetPath).replace(/\\/g, "/"),
      pasteBlockSuffix: built.cousin.pasteBlockSuffix,
      pastePath: path.relative(process.cwd(), pastePath).replace(/\\/g, "/"),
      nextActionHashTrunc: truncateHash(built.metadata.nextActionHash),
    });
  }

  const masterFile = `RELAY_NETWORK_${COMMAND_ID}_${COMMAND_VERSION}_${ts}.md`;
  const manifest = {
    ok: true,
    command: COMMAND_ID,
    version: COMMAND_VERSION,
    issued_at: issuedAt,
    timestamp_slug: ts,
    masterCommandFile: `foreman/handoffs/outbox/${masterFile}`,
    cousins,
    doctrine: rolesDoc.networkDoctrine,
  };

  const masterBody = buildMasterCommand(
    { ...manifest, masterCommandFile: `foreman/handoffs/outbox/${masterFile}` },
    rolesDoc
  );
  fs.writeFileSync(path.join(outbox, masterFile), masterBody, "utf8");
  fs.writeFileSync(abs(LATEST_MANIFEST), JSON.stringify(manifest, null, 2), "utf8");

  return manifest;
}

function abs(rel) {
  return path.join(process.cwd(), rel);
}

function showManifest(cousinFilter) {
  if (!fs.existsSync(abs(LATEST_MANIFEST))) {
    console.log("No network command issued yet. Run: node foreman/crew-dispatch/crew-relay-network-command.mjs issue");
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(abs(LATEST_MANIFEST), "utf8"));
  if (cousinFilter) {
    const id = cousinFilter.toUpperCase();
    const c = manifest.cousins.find((x) => x.cousinId === id);
    if (!c) {
      console.error(`Cousin ${id} not in latest manifest`);
      process.exit(1);
    }
    console.log(JSON.stringify({ command: manifest.command, issued_at: manifest.issued_at, cousin: c }, null, 2));
    if (fs.existsSync(abs(c.pastePath))) {
      console.log("\n--- PASTE BLOCK ---\n");
      console.log(fs.readFileSync(abs(c.pastePath), "utf8"));
    }
    return;
  }
  console.log(JSON.stringify(manifest, null, 2));
}

function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] || "help";

  if (cmd === "issue") {
    const manifest = issueNetworkCommand();
    console.log("AEYE Edge network command issued:");
    console.log(`  Command: ${manifest.command} ${manifest.version}`);
    console.log(`  Master:  ${manifest.masterCommandFile}`);
    console.log(`  Manifest: ${LATEST_MANIFEST}`);
    console.log("");
    for (const c of manifest.cousins) {
      console.log(`  Tab ${c.edgeTabIndex} ${c.name}: ${c.packetFile}`);
    }
    console.log("");
    console.log("Next: Open Aeye Crew Bay → load each cousin network paste → Ben Send → inbox → validate");
    return;
  }

  if (cmd === "show") {
    let cousin = null;
    const idx = args.indexOf("--cousin");
    if (idx >= 0 && args[idx + 1]) cousin = args[idx + 1];
    showManifest(cousin);
    return;
  }

  console.log(`Usage:
  node foreman/crew-dispatch/crew-relay-network-command.mjs issue
  node foreman/crew-dispatch/crew-relay-network-command.mjs show [--cousin PETRA]`);
}

const isNetworkCommandCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isNetworkCommandCli) {
  main();
}
