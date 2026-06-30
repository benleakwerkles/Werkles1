import fs from "node:fs";
import path from "node:path";
import {
  ROOT,
  abs,
  exists,
  read,
  nowIso,
  sha256FileRaw,
  truncateHash,
} from "../../scripts/foreman/_foreman-core.mjs";

const ROUTER_DIR = "foreman/gd-intent-router";
const MISSION_CLASSES_PATH = `${ROUTER_DIR}/mission-classes.json`;
const COUSIN_ASSIGNMENT_PATH = `${ROUTER_DIR}/cousin-assignment.json`;
const COUSIN_TEMPLATE = `${ROUTER_DIR}/templates/TO_GD_INTENT_COUSIN_TEMPLATE.md`;
const SYNTHESIS_TEMPLATE = `${ROUTER_DIR}/templates/GD_INTENT_SYNTHESIS_TEMPLATE.md`;
const OPERATOR_BRIEF_TEMPLATE = `${ROUTER_DIR}/templates/OPERATOR_BRIEF_TEMPLATE.md`;
const RUNS_DIR = `${ROUTER_DIR}/runs`;
const OUTBOX_DIR = "foreman/handoffs/outbox";
const INBOX_DIR = "foreman/handoffs/inbox";
const PROCESSED_DIR = "foreman/handoffs/inbox/processed";

const COUSIN_META = {
  PETRA: { label: "Petra", platform: "ChatGPT", prefix: "TO_PETRA" },
  SKYBRO: { label: "Skybro", platform: "Gemini", prefix: "TO_SKYBRO" },
  ENDER: { label: "Ender", platform: "Claude", prefix: "TO_ENDER" },
  BEAN: { label: "Bean", platform: "DeepSeek", prefix: "TO_BEAN" },
  COMPUTER: { label: "Computer", platform: "Perplexity", prefix: "TO_COMPUTER" },
};

const HELD_COUSINS = {
  ENDER:
    "ENDER dispatch is HELD: Ender@Sally is retired until Sally RAM upgrade and a clearing receipt. See foreman/change-capsules/CHANGE_CAPSULE_ENDER_SALLY_RETIRED.json. Do not silently move Ender to another machine without availability proof.",
};

function heldRecipientDetails(recipients) {
  return recipients
    .filter((cousin) => HELD_COUSINS[cousin])
    .map((cousin) => ({
      cousin,
      reason: HELD_COUSINS[cousin],
    }));
}

function assertNoHeldRecipients(recipients) {
  const held = heldRecipientDetails(recipients);
  if (held.length) {
    throw new Error(held.map((entry) => entry.reason).join(" "));
  }
}

export function loadMissionClasses() {
  return JSON.parse(read(MISSION_CLASSES_PATH));
}

export function loadCousinAssignment() {
  return JSON.parse(read(COUSIN_ASSIGNMENT_PATH));
}

export function normalizeMissionClass(input) {
  return String(input || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

export function resolveMissionClass(missionClass) {
  const key = normalizeMissionClass(missionClass);
  const registry = loadMissionClasses();
  const assignment = loadCousinAssignment();
  const def = registry.missionClasses[key];
  if (!def) {
    const known = Object.keys(registry.missionClasses).sort();
    throw new Error(`Unknown mission class: ${missionClass}. Known: ${known.join(", ")}`);
  }
  const recipients = assignment.assignments[key] || def.recipients;
  return { key, def, recipients, registry };
}

export function routeIntent(missionClass) {
  const { key, def, recipients } = resolveMissionClass(missionClass);
  const heldRecipients = heldRecipientDetails(recipients);
  return {
    missionClass: key,
    label: def.label,
    description: def.description,
    recipients,
    heldRecipients,
    synthesisLead: def.synthesisLead,
    hgApprovalLevel: def.hgApprovalLevel,
    dispatchClass: def.dispatchClass,
  };
}

function timestampSlug() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
}

function expandTemplate(template, tokens) {
  let out = template;
  for (const [k, v] of Object.entries(tokens)) {
    out = out.split(`{{${k}}}`).join(String(v ?? ""));
  }
  return out;
}

function ensureDir(rel) {
  const dir = abs(rel);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function receiptToken(runId, cousin, missionClass) {
  return `GD_RECEIPT_${missionClass}_${cousin}_${runId}`;
}

function buildDefaultBrief(def) {
  let brief = def.description || "";
  if (def.visualBeats?.length) {
    brief += "\n\n## Visual beats\n\n";
    for (const beat of def.visualBeats) {
      brief += `- **${beat.title}** — ${beat.beat}\n`;
    }
  }
  if (def.foundryExamples?.length) {
    brief += "\n## Foundry examples (outcome scenes)\n\n";
    brief += def.foundryExamples.map((x) => `- ${x}`).join("\n");
    brief += "\n";
  }
  return brief.trim();
}

function buildRunId(missionClass) {
  return `GD_RUN_${missionClass}_${timestampSlug()}`;
}

function cockpitHashes() {
  const nextActionPath = "foreman/NEXT_ACTION.md";
  const currentStatePath = "foreman/CURRENT_STATE.md";
  return {
    next_action_hash: truncateHash(sha256FileRaw(nextActionPath)),
    current_state_hash: exists(currentStatePath)
      ? truncateHash(sha256FileRaw(currentStatePath))
      : null,
  };
}

function buildPacketMetadata({
  runId,
  missionClass,
  def,
  cousin,
  receipt,
  brief,
}) {
  return {
    router: "GD_INTENT_ROUTER_V1",
    schema_version: "gd-intent-packet/v1",
    run_id: runId,
    mission_class: missionClass,
    mission_label: def.label,
    cousin,
    receipt_token: receipt,
    synthesis_lead: def.synthesisLead,
    hg_approval_level: def.hgApprovalLevel,
    dispatch_class: def.dispatchClass,
    production_actions: false,
    stops_before_send: true,
    operator_brief: brief || null,
    generated_at: nowIso(),
    ...cockpitHashes(),
  };
}

export function listMissionClasses() {
  const registry = loadMissionClasses();
  return Object.entries(registry.missionClasses).map(([id, def]) => ({
    id,
    label: def.label,
    recipients: def.recipients,
    synthesisLead: def.synthesisLead,
    hgApprovalLevel: def.hgApprovalLevel,
  }));
}

export function generateRun(missionClass, { brief = "" } = {}) {
  const { key, def, recipients } = resolveMissionClass(missionClass);
  assertNoHeldRecipients(recipients);
  const runId = buildRunId(key);
  const runDir = `${RUNS_DIR}/${runId}`;
  const packetsDir = `${runDir}/packets`;
  const receiptsDir = `${runDir}/receipts`;
  const synthesisDir = `${runDir}/synthesis`;

  ensureDir(packetsDir);
  ensureDir(receiptsDir);
  ensureDir(synthesisDir);
  ensureDir(OUTBOX_DIR);

  const template = read(COUSIN_TEMPLATE);
  const missionDescription = brief.trim() || buildDefaultBrief(def);

  const packetManifest = [];

  for (const cousin of recipients) {
    const meta = COUSIN_META[cousin];
    if (!meta) throw new Error(`Unknown cousin in assignment: ${cousin}`);

    const receipt = receiptToken(runId, cousin, key);
    const packetId = `${meta.prefix}_GDINTENT_${key}_v1_${timestampSlug()}`;
    const packetFile = `${packetId}.md`;
    const metadata = buildPacketMetadata({
      runId,
      missionClass: key,
      def,
      cousin,
      receipt,
      brief,
    });
    metadata.packet_id = packetId;
    metadata.source_packet_file = packetFile;

    const readFirstList = (def.readFirst || [])
      .map((f) => `- \`${f}\``)
      .join("\n");
    const responseList = (def.responseRequired || [])
      .map((r) => `- ${r}`)
      .join("\n");
    const lens =
      def.cousinLenses?.[cousin] || `Respond within ${meta.label} lane.`;

    const body = expandTemplate(template, {
      COUSIN_LABEL: meta.label,
      COUSIN_PLATFORM: meta.platform,
      COUSIN_UPPER: cousin,
      MISSION_CLASS: key,
      MISSION_CLASS_LABEL: def.label,
      RUN_ID: runId,
      GENERATED_AT: nowIso(),
      MISSION_DESCRIPTION: missionDescription,
      COUSIN_LENS: lens,
      READ_FIRST_LIST: readFirstList,
      RESPONSE_REQUIRED_LIST: responseList,
      RECEIPT_TOKEN: receipt,
      RELAY_METADATA_JSON: JSON.stringify(metadata, null, 2),
    });

    const runPacketPath = path.join(abs(packetsDir), packetFile);
    const outboxPath = path.join(abs(OUTBOX_DIR), packetFile);
    fs.writeFileSync(runPacketPath, body, "utf8");
    fs.writeFileSync(outboxPath, body, "utf8");

    packetManifest.push({
      cousin,
      packetId,
      packetFile,
      receiptToken: receipt,
      runPacketPath: `${packetsDir}/${packetFile}`,
      outboxPath: `${OUTBOX_DIR}/${packetFile}`,
      status: "GENERATED",
    });
  }

  const manifest = {
    router: "GD_INTENT_ROUTER_V1",
    runId,
    missionClass: key,
    missionLabel: def.label,
    missionDescription,
    recipients,
    synthesisLead: def.synthesisLead,
    hgApprovalLevel: def.hgApprovalLevel,
    dispatchClass: def.dispatchClass,
    createdAt: nowIso(),
    status: "AWAITING_RECEIPTS",
    packets: packetManifest,
    receipts: [],
    synthesis: null,
  };

  const manifestPath = path.join(abs(runDir), "run-manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

  return manifest;
}

function readInboxCandidates() {
  const dirs = [abs(INBOX_DIR), abs(PROCESSED_DIR)].filter((d) => fs.existsSync(d));
  const files = [];
  for (const dir of dirs) {
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith(".md")) continue;
      if (!name.startsWith("FROM_")) continue;
      files.push(path.join(dir, name));
    }
  }
  return files;
}

function extractReceiptToken(markdown) {
  const line = markdown
    .split(/\r?\n/)
    .slice(0, 20)
    .find((l) => l.startsWith("GD_RECEIPT:"));
  if (!line) return null;
  return line.replace(/^GD_RECEIPT:\s*/, "").trim();
}

function extractRelayRunId(markdown) {
  const blockRe = /##\s*Relay metadata\s*\r?\n\r?\n```json\r?\n([\s\S]*?)\r?\n```/i;
  const match = markdown.match(blockRe);
  if (!match) return null;
  try {
    const metadata = JSON.parse(match[1]);
    return metadata.run_id || null;
  } catch {
    return null;
  }
}

export function loadRunManifest(runId) {
  const manifestRel = `${RUNS_DIR}/${runId}/run-manifest.json`;
  if (!exists(manifestRel)) {
    throw new Error(`Run not found: ${runId}`);
  }
  return JSON.parse(fs.readFileSync(abs(manifestRel), "utf8"));
}

export function saveRunManifest(manifest) {
  const manifestRel = `${RUNS_DIR}/${manifest.runId}/run-manifest.json`;
  fs.writeFileSync(abs(manifestRel), JSON.stringify(manifest, null, 2), "utf8");
}

export function collectReceipts(runId) {
  const manifest = loadRunManifest(runId);
  const expected = new Map(
    manifest.packets.map((p) => [p.receiptToken, p.cousin])
  );
  const found = new Map();

  for (const filePath of readInboxCandidates()) {
    const content = fs.readFileSync(filePath, "utf8");
    const token =
      extractReceiptToken(content) ||
      (() => {
        const rid = extractRelayRunId(content);
        if (rid !== runId) return null;
        const cousinMatch = path.basename(filePath).match(/^FROM_([A-Z]+)_/);
        if (!cousinMatch) return null;
        return receiptToken(runId, cousinMatch[1], manifest.missionClass);
      })();

    if (!token || !expected.has(token)) continue;
    if (found.has(token)) continue;

    const cousin = expected.get(token);
    const destName = path.basename(filePath);
    const destRel = `${RUNS_DIR}/${runId}/receipts/${destName}`;
    const destAbs = abs(destRel);

    fs.copyFileSync(filePath, destAbs);
    found.set(token, {
      cousin,
      receiptToken: token,
      sourceFile: filePath.replace(/\\/g, "/").replace(ROOT.replace(/\\/g, "/"), "").replace(/^\//, ""),
      collectedFile: destRel,
      collectedAt: nowIso(),
    });
  }

  manifest.receipts = [...found.values()];
  const receivedCousins = new Set(manifest.receipts.map((r) => r.cousin));
  const allReceived = manifest.recipients.every((c) => receivedCousins.has(c));
  manifest.status = allReceived ? "RECEIPTS_COMPLETE" : "AWAITING_RECEIPTS";
  manifest.lastCollectAt = nowIso();
  saveRunManifest(manifest);

  return {
    runId,
    expected: manifest.recipients.length,
    collected: manifest.receipts.length,
    allReceived,
    receipts: manifest.receipts,
    missing: manifest.recipients.filter((c) => !receivedCousins.has(c)),
  };
}

function summarizeReceipt(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  const preview = lines.slice(0, 12).join("\n");
  return preview.length > 800 ? `${preview.slice(0, 800)}…` : preview;
}

function readReceiptBodies(receipts) {
  return (receipts || []).map((r) => ({
    cousin: r.cousin,
    content: fs.readFileSync(abs(r.collectedFile), "utf8"),
  }));
}

function extractKeyFindingsFromReceipt(content) {
  const findings = [];
  const lines = content.split(/\r?\n/);
  let inFindingsSection = false;

  for (const line of lines) {
    if (/^##\s/.test(line)) {
      inFindingsSection =
        /Top 3|Q[1-6]:|Key finding|Verdict|Recommended hero|Repeating pattern|Unusually strong|Weak capability|Business model best|should stop|should test|Beat-by-beat|Cousin convergence/i.test(
          line
        );
      continue;
    }
    if (!inFindingsSection) continue;

    const numbered = line.match(/^\d+\.\s+\*\*(.+?)\*\*\s*[—–-]\s*(.+)/);
    if (numbered) {
      findings.push(`${numbered[1]} — ${numbered[2]}`);
      continue;
    }
    const numberedPlain = line.match(/^\d+\.\s+(.+)/);
    if (numberedPlain) {
      findings.push(numberedPlain[1].replace(/\*\*/g, ""));
      continue;
    }
    const bullet = line.match(/^[-*]\s+\*\*(.+?)\*\*\s*[—–-]\s*(.+)/);
    if (bullet) {
      findings.push(`${bullet[1]} — ${bullet[2]}`);
    }
  }

  return findings;
}

function dedupeFindings(findings, limit = 8) {
  const seen = new Set();
  const out = [];
  for (const f of findings) {
    const key = f.toLowerCase().slice(0, 60);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
    if (out.length >= limit) break;
  }
  return out;
}

function formatFindingsBullets(findings) {
  if (!findings.length) return "- _No structured findings extracted — see cousin receipts in artifact paths._";
  return findings.map((f) => `- ${f}`).join("\n");
}

function buildArtifactPaths(manifest, runId, synthesisRel, operatorBriefRel) {
  const rows = [
    "| Artifact | Path |",
    "|----------|------|",
    `| Operator Brief (read first) | \`foreman/handoffs/outbox/OPERATOR_BRIEF_${manifest.missionClass}_${runId}.md\` |`,
    `| GD synthesis (detail) | \`${manifest.synthesis?.outboxFile || `${OUTBOX_DIR}/FROM_GD_SYNTHESIS_${manifest.missionClass}_${runId}.md`}\` |`,
    `| Run folder | \`foreman/gd-intent-router/runs/${runId}/\` |`,
  ];
  for (const r of manifest.receipts || []) {
    rows.push(`| ${r.cousin} receipt | \`${r.collectedFile}\` |`);
  }
  const dossier = manifest.missionClass === "BEN_ENTREPRENEURSHIP_DOSSIER_FOR_SHERLOCK"
    ? `| Sherlock dossier | \`foreman/gd-intent-router/BEN_ENTREPRENEURSHIP_DOSSIER_FOR_SHERLOCK.md\` |`
    : null;
  if (dossier) rows.splice(2, 0, dossier);
  if (manifest.missionClass === "HOMEPAGE_VISUAL_NARRATIVE") {
    rows.push(`| Render batch order (plan) | \`foreman/gd-intent-router/runs/${runId}/RENDER_BATCH_ORDER.md\` |`);
  }
  return rows.join("\n");
}

const MISSION_BRIEF_PRESETS = {
  BEN_ENTREPRENEURSHIP_DOSSIER_FOR_SHERLOCK: {
    execSummaryComplete:
      "Four cousins reviewed repo evidence on Ben's ventures. The proven monetizable skill is packaging operator risk into sellable clarity (frameworks, checklists, governance) — not Werkles marketplace scale yet. Fastest revenue test: ship one Bellows checklist ($29). Next step: paste the Sherlock prompt below.",
    execSummaryPartial:
      "Sherlock dossier mission is incomplete — missing cousin receipts. Do not act on partial verdict.",
    nextActionComplete:
      "Paste the Sherlock prompt (Section 4) into Sherlock. Do not open repo files first.",
    nextActionPartial: (missing) => `Collect missing receipts: ${missing.join(", ")} → re-run gd:synthesize.`,
    pastePromptComplete: `\`\`\`
Given this dossier summary, identify the highest-value commercial capability and the fastest path to validate it.

Context (self-contained):
- Ben operates multiple ventures: Kind Sir (construction/real estate entities), Valley Vanguard/Microfutures (shells, $0 logged spend), Werkles (SaaS preview, production blocked), Bellows (editorial IP with $29–$97 SKUs sketched), GD intent router (internal CLI proven).
- Repo shows deep systems/doctrine building; customer revenue and KS Construction scam details are UNKNOWN in repo.
- Operator constraint: near-term revenue and proof; Ben is not a copy/paste mule.
- Four cousins converged: Ben's proven skill is operator-grade packaging of business risk into sellable clarity — not Werkles marketplace scale yet.
- Three test models ranked: (A) Bellows digital goods — fastest, (B) Operator Audit service, (C) Werkles concierge waitlist.
- Recommended 14-day test: Entity Comparison Checklist at $29 — target ≥5 paid sales.

Your task:
1. Confirm or refute: "operator-grade packaging of business risk" is Ben's most monetizable proven capability.
2. Rank models A/B/C for fastest validation given near-term revenue need.
3. Name one capability Ben should deprioritize for 90 days.
4. Propose one 14-day test with a numeric success metric.
5. Flag dossier claims requiring Ben to supply missing evidence (KS Construction, Kind Sir ops status, runway).

Do not recommend derailing Werkles homepage work. Do not invent facts where marked UNKNOWN.
\`\`\``,
    pastePromptPartial: "_None — collect missing receipts first._",
  },
  HOMEPAGE_VISUAL_NARRATIVE: {
    execSummaryComplete:
      "Three cousins agree on a four-beat homepage story: Spark (solo hero) → Space (one environmental still) → Forge (lane UI/formation) → Foundry (documentary proof gallery). Verdict: CONDITIONAL GO — approve structure; do not render or wire production yet (Gate 05 PAUSE).",
    execSummaryPartial:
      "Visual narrative review incomplete — missing cousin receipts.",
    nextActionComplete:
      "Reply YES or NO to approve the four-beat structure. If YES, queue Space + two Foundry scenes per render batch order when Gate 05 opens — do not render today.",
    nextActionPartial: (missing) => `Collect missing receipts: ${missing.join(", ")} → re-run gd:synthesize.`,
    pastePromptComplete: "_None — Operator action only. Approve or reject four-beat structure in chat._",
    pastePromptPartial: "_None — collect missing receipts first._",
  },
};

function defaultBriefPreset(manifest, missing) {
  const complete = missing.length === 0;
  return {
    execSummaryComplete: `GD mission \`${manifest.missionClass}\` complete — ${manifest.recipients.length} cousins responded. Review key findings and take recommended next action.`,
    execSummaryPartial: `GD mission \`${manifest.missionClass}\` incomplete — missing: ${missing.join(", ")}.`,
    nextActionComplete: `Review synthesis → ${manifest.synthesisLead} lane follow-up if needed. No production actions.`,
    nextActionPartial: (m) => `Collect missing receipts: ${m.join(", ")} → re-run gd:synthesize.`,
    pastePromptComplete: "_None — Operator action only._",
    pastePromptPartial: "_None — collect missing receipts first._",
  };
}

function buildOperatorBriefContent(manifest, runId, synthesisRel, receiptBodies, missing) {
  const preset = MISSION_BRIEF_PRESETS[manifest.missionClass] || defaultBriefPreset(manifest, missing);
  const complete = missing.length === 0;

  const allFindings = dedupeFindings(
    receiptBodies.flatMap((r) => extractKeyFindingsFromReceipt(r.content))
  );

  const execSummary = complete ? preset.execSummaryComplete : preset.execSummaryPartial;
  const nextAction = complete
    ? preset.nextActionComplete
    : typeof preset.nextActionPartial === "function"
      ? preset.nextActionPartial(missing)
      : preset.nextActionPartial;
  const pastePrompt = complete ? preset.pastePromptComplete : preset.pastePromptPartial;

  const template = read(OPERATOR_BRIEF_TEMPLATE);
  const body = expandTemplate(template, {
    MISSION_CLASS_LABEL: manifest.missionLabel,
    RUN_ID: runId,
    GENERATED_AT: nowIso(),
    EXEC_SUMMARY: execSummary,
    KEY_FINDINGS: formatFindingsBullets(allFindings),
    NEXT_ACTION: nextAction,
    PASTE_PROMPT: pastePrompt,
    ARTIFACT_PATHS: buildArtifactPaths(manifest, runId, synthesisRel, null),
  });

  const humanBlock = expandTemplate(
    `## Operator brief (read this first)

### 1. Executive summary (10-second read)

{{EXEC_SUMMARY}}

### 2. Key findings

{{KEY_FINDINGS}}

### 3. Recommended next action

{{NEXT_ACTION}}

### 4. Paste-ready prompt

{{PASTE_PROMPT}}

### 5. Artifact paths (supporting evidence)

{{ARTIFACT_PATHS}}

---

`,
    {
      EXEC_SUMMARY: execSummary,
      KEY_FINDINGS: formatFindingsBullets(allFindings),
      NEXT_ACTION: nextAction,
      PASTE_PROMPT: pastePrompt,
      ARTIFACT_PATHS: buildArtifactPaths(manifest, runId, synthesisRel, null),
    }
  );

  return { body, humanBlock, execSummary, keyFindings: allFindings, nextAction, pastePrompt };
}

function writeOperatorBrief(runId, manifest, briefContent) {
  const runBriefRel = `${RUNS_DIR}/${runId}/OPERATOR_BRIEF.md`;
  const outboxBriefName = `OPERATOR_BRIEF_${manifest.missionClass}_${runId}.md`;
  const outboxBriefRel = `${OUTBOX_DIR}/${outboxBriefName}`;

  fs.writeFileSync(abs(runBriefRel), briefContent.body, "utf8");
  fs.writeFileSync(abs(outboxBriefRel), briefContent.body, "utf8");

  return { runBriefRel, outboxBriefRel, outboxBriefName };
}

export function synthesizeRun(runId, { force = false } = {}) {
  const manifest = loadRunManifest(runId);
  const { def } = resolveMissionClass(manifest.missionClass);

  const receivedCousins = new Set((manifest.receipts || []).map((r) => r.cousin));
  const missing = manifest.recipients.filter((c) => !receivedCousins.has(c));
  if (missing.length && !force) {
    throw new Error(
      `Missing receipts for: ${missing.join(", ")}. Run collect first or pass --force.`
    );
  }

  const receiptTable = manifest.packets
    .map((p) => {
      const rec = (manifest.receipts || []).find((r) => r.cousin === p.cousin);
      const status = rec ? "COLLECTED" : "MISSING";
      return `| ${p.cousin} | \`${p.receiptToken}\` | ${status} |`;
    })
    .join("\n");

  const summaries = (manifest.receipts || [])
    .map((r) => {
      const body = summarizeReceipt(abs(r.collectedFile));
      return `### ${r.cousin}\n\n\`\`\`\n${body}\n\`\`\``;
    })
    .join("\n\n");

  const synthesisBody = missing.length
    ? `Partial synthesis — missing cousins: ${missing.join(", ")}. Operator must not treat as complete crew verdict.`
    : `All routed cousins responded. ${manifest.synthesisLead} should merge inputs into one operator-facing recommendation. No production actions.`;

  const hgNotes = (() => {
    const level = manifest.hgApprovalLevel;
    if (level === "HG_NONE") return "No gate record required for this mission class.";
    if (level === "HG_RECORD") return "Record synthesis outcome in `foreman/gates/APPROVAL_LOG.md` when Operator accepts.";
    if (level === "HG_OPERATOR") return "Operator approval required before implementation.";
    if (level === "HG_BLOCKING") return "BLOCKING — synthesis cannot authorize spend, deploy, or merge without explicit human gate clearance.";
    return `Level: ${level}`;
  })();

  const template = read(SYNTHESIS_TEMPLATE);
  const synthesisId = `FROM_GD_SYNTHESIS_${manifest.missionClass}_${runId}.md`;
  const synthesisRel = `${RUNS_DIR}/${runId}/synthesis/${synthesisId}`;

  const receiptBodies = readReceiptBodies(manifest.receipts);
  const briefContent = buildOperatorBriefContent(
    manifest,
    runId,
    synthesisRel,
    receiptBodies,
    missing
  );
  const operatorBrief = writeOperatorBrief(runId, manifest, briefContent);

  const preset = MISSION_BRIEF_PRESETS[manifest.missionClass] || defaultBriefPreset(manifest, missing);
  const nextActionBrief =
    missing.length === 0 ? preset.nextActionComplete : preset.nextActionPartial(missing);

  const metadata = {
    router: "GD_INTENT_ROUTER_V1",
    schema_version: "gd-intent-synthesis/v1",
    human_consumable_rule: "HUMAN_CONSUMABLE_OUTPUT_RULE_V1",
    run_id: runId,
    mission_class: manifest.missionClass,
    synthesis_lead: manifest.synthesisLead,
    hg_approval_level: manifest.hgApprovalLevel,
    receipts_complete: missing.length === 0,
    missing_cousins: missing,
    operator_brief: operatorBrief.outboxBriefRel,
    generated_at: nowIso(),
    production_actions: false,
  };

  const body = expandTemplate(template, {
    MISSION_CLASS_LABEL: manifest.missionLabel,
    RUN_ID: runId,
    SYNTHESIS_LEAD: manifest.synthesisLead,
    GENERATED_AT: nowIso(),
    HG_APPROVAL_LEVEL: manifest.hgApprovalLevel,
    HUMAN_CONSUMABLE_BLOCK: briefContent.humanBlock,
    MISSION_DESCRIPTION: manifest.missionDescription,
    RECEIPT_TABLE: receiptTable,
    COUSIN_SUMMARIES: summaries || "_No receipts collected yet._",
    SYNTHESIS_BODY: synthesisBody,
    NEXT_ACTION: nextActionBrief,
    HG_NOTES: hgNotes,
    RELAY_METADATA_JSON: JSON.stringify(metadata, null, 2),
  });

  const synthesisAbs = abs(synthesisRel);
  fs.writeFileSync(synthesisAbs, body, "utf8");

  const outboxCopy = path.join(abs(OUTBOX_DIR), synthesisId);
  fs.writeFileSync(outboxCopy, body, "utf8");

  manifest.synthesis = {
    file: synthesisRel,
    outboxFile: `${OUTBOX_DIR}/${synthesisId}`,
    operatorBrief: operatorBrief.outboxBriefRel,
    generatedAt: nowIso(),
    receiptsComplete: missing.length === 0,
    missingCousins: missing,
  };
  manifest.status = missing.length === 0 ? "SYNTHESIS_COMPLETE" : "SYNTHESIS_PARTIAL";
  saveRunManifest(manifest);

  return manifest;
}

export function listRuns() {
  const dir = abs(RUNS_DIR);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => fs.existsSync(path.join(dir, name, "run-manifest.json")))
    .sort()
    .reverse()
    .map((runId) => {
      const m = loadRunManifest(runId);
      return {
        runId,
        missionClass: m.missionClass,
        status: m.status,
        recipients: m.recipients,
        receipts: (m.receipts || []).length,
        createdAt: m.createdAt,
      };
    });
}
