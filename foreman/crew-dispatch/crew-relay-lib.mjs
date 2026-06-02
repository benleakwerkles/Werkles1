import fs from "node:fs";
import path from "node:path";
import {
  ROOT,
  abs,
  exists,
  read,
  append,
  nowIso,
  sha256FileRaw,
  truncateHash,
  runCockpitHashSelfTest,
} from "../../scripts/foreman/_foreman-core.mjs";

const SCHEMA_PATH = "foreman/crew-dispatch/crew-packet-schema.json";
const RETURN_SCHEMA_PATH = "foreman/crew-dispatch/crew-return-schema.json";
const MERGE_CONFLICTS_PATH = "foreman/handoffs/merge-conflicts.md";
const ROLE_CARDS_PATH = "foreman/crew-dispatch/crew-role-cards.json";
const INBOX_DIR = "foreman/handoffs/inbox";
const PROCESSED_DIR = "foreman/handoffs/inbox/processed";
const OUTBOX_DIR = "foreman/handoffs/outbox";
const SENT_DIR = "foreman/handoffs/outbox/sent";
const ARCHIVE_DIR = "foreman/handoffs/outbox/archive";

export { runCockpitHashSelfTest, truncateHash, sha256FileRaw };

let _schema = null;
let _returnSchema = null;

export function loadSchema() {
  if (_schema) return _schema;
  _schema = JSON.parse(read(SCHEMA_PATH));
  return _schema;
}

export function loadReturnSchema() {
  if (_returnSchema) return _returnSchema;
  _returnSchema = JSON.parse(read(RETURN_SCHEMA_PATH));
  return _returnSchema;
}

export function paths() {
  return {
    root: ROOT,
    inbox: abs(INBOX_DIR),
    processed: abs(PROCESSED_DIR),
    outbox: abs(OUTBOX_DIR),
    sent: abs(SENT_DIR),
    archive: abs(ARCHIVE_DIR),
    schema: abs(SCHEMA_PATH),
  };
}

export function ensureRelayDirs() {
  for (const rel of [PROCESSED_DIR, SENT_DIR, ARCHIVE_DIR]) {
    const dir = abs(rel);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

export function computeCockpitHashes() {
  const nextActionPath = "foreman/NEXT_ACTION.md";
  const currentStatePath = "foreman/CURRENT_STATE.md";
  return {
    nextActionHash: sha256FileRaw(nextActionPath),
    currentStateHash: exists(currentStatePath) ? sha256FileRaw(currentStatePath) : null,
    source_files_included: [
      nextActionPath,
      ...(exists(currentStatePath) ? [currentStatePath] : []),
    ],
  };
}

export function extractRelayMetadata(markdown) {
  const blockRe = /##\s*Relay metadata\s*\r?\n\r?\n```json\r?\n([\s\S]*?)\r?\n```/i;
  const match = markdown.match(blockRe);
  if (!match) return { ok: false, error: "Missing ## Relay metadata JSON block", metadata: null };
  try {
    const metadata = JSON.parse(match[1]);
    return { ok: true, metadata, error: null };
  } catch (e) {
    return { ok: false, error: `Malformed relay metadata JSON: ${e.message}`, metadata: null };
  }
}

export function parseCousinFromFilename(filename) {
  const base = path.basename(filename);
  const m = base.match(/^FROM_([A-Z]+)_/i);
  return m ? m[1].toUpperCase() : null;
}

export function listInboxResponses(inboxDir = null) {
  ensureRelayDirs();
  const inbox = inboxDir || abs(INBOX_DIR);
  if (!fs.existsSync(inbox)) return [];
  return fs
    .readdirSync(inbox)
    .filter((f) => /^FROM_[A-Z]+_.*\.md$/i.test(f) && f !== "FROM_CURSOR_READ_ME.md")
    .map((f) => path.join(inbox, f));
}

export function validateResponseFile(filePath, options = {}) {
  const schema = loadSchema();
  const filename = path.basename(filePath);
  const result = {
    file: filename,
    path: filePath,
    ok: true,
    status: "OK",
    errors: [],
    warnings: [],
    metadata: null,
    benReview: false,
  };

  if (!fs.existsSync(filePath)) {
    result.ok = false;
    result.status = "MISSING";
    result.errors.push("File not found");
    return result;
  }

  let raw;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch (e) {
    result.ok = false;
    result.status = "MALFORMED";
    result.errors.push(`Cannot read file: ${e.message}`);
    return result;
  }

  const parsed = extractRelayMetadata(raw);
  if (!parsed.ok) {
    result.ok = false;
    result.status = "MALFORMED";
    result.errors.push(parsed.error);
    return result;
  }

  const meta = parsed.metadata;
  result.metadata = meta;

  const cousinFromName = parseCousinFromFilename(filename);
  const cousin = String(meta.cousin || "").toUpperCase();

  if (!cousin) {
    result.ok = false;
    result.errors.push("Missing cousin in metadata");
  }

  if (cousinFromName && cousin && cousinFromName !== cousin) {
    result.ok = false;
    result.status = "SOURCE_MISMATCH";
    result.errors.push(
      `Filename cousin ${cousinFromName} does not match metadata cousin ${cousin}`
    );
  }

  for (const field of schema.REQUIRED_RESPONSE_FIELDS) {
    if (meta[field] === undefined || meta[field] === null || meta[field] === "") {
      result.ok = false;
      result.errors.push(`Missing required field: ${field}`);
    }
  }

  const returnSchema = loadReturnSchema();
  for (const field of schema.EXTENDED_RESPONSE_FIELDS || []) {
    if (meta[field] === undefined || meta[field] === null || meta[field] === "") {
      result.ok = false;
      result.errors.push(`Missing extended field: ${field}`);
    }
  }

  const cousinUpper = String(meta.cousin || cousinFromName || "").toUpperCase();
  if (cousinUpper && exists(ROLE_CARDS_PATH)) {
    const cards = JSON.parse(read(ROLE_CARDS_PATH));
    if (!cards.cousins?.[cousinUpper]) {
      result.ok = false;
      result.errors.push(`Unknown SOURCE/cousin: ${cousinUpper}`);
    }
  }

  if (!meta.source_packet_id && !meta.source_packet_file) {
    result.ok = false;
    result.status = "MISSING_SOURCE";
    result.errors.push("Missing SOURCE: source_packet_id and source_packet_file both empty");
  }

  const live = computeCockpitHashes();
  const expectedNext = live.nextActionHash;
  const actualNext = meta.nextActionHash;

  if (actualNext && expectedNext && actualNext !== expectedNext) {
    result.ok = false;
    result.status = "STALE_DO_NOT_APPLY";
    result.errors.push(
      `STALE_DO_NOT_APPLY: nextActionHash mismatch — expected ${truncateHash(expectedNext)} got ${truncateHash(actualNext)}`
    );
  }

  if (meta.currentStateHash && live.currentStateHash && meta.currentStateHash !== live.currentStateHash) {
    result.ok = false;
    result.status = "STALE_DO_NOT_APPLY";
    result.errors.push(
      `STALE_DO_NOT_APPLY: currentStateHash mismatch — expected ${truncateHash(live.currentStateHash)} got ${truncateHash(meta.currentStateHash)}`
    );
  }

  const knownKeys = new Set([
    ...schema.response.requiredFields,
    ...schema.response.optionalFields,
    ...schema.REQUIRED_RESPONSE_FIELDS,
    ...(schema.EXTENDED_RESPONSE_FIELDS || []),
    "source_packet_id",
    "source_packet_file",
  ]);
  for (const key of Object.keys(meta)) {
    if (!knownKeys.has(key)) {
      result.warnings.push(`Extra field (not rejected): ${key}`);
    }
  }

  applyBenReviewFlags(result, meta, raw, schema);
  applyOverreachWarnings(result, cousin, raw, schema);

  if (!result.ok && result.status === "OK") result.status = "INVALID";

  return result;
}

function applyBenReviewFlags(result, meta, raw, schema) {
  const conf = String(meta.CONFIDENCE || "").toUpperCase();
  if (conf === "LOW") {
    result.benReview = true;
    result.warnings.push("CONFIDENCE is LOW — flag for Ben review");
  }

  const unknowns = String(meta.UNKNOWNS || "").toLowerCase();
  for (const phrase of schema.response.benReviewTriggers.unknownsOutsideLane) {
    if (unknowns.includes(phrase)) {
      result.benReview = true;
      result.warnings.push(`UNKNOWNS suggests outside lane ("${phrase}") — flag for Ben review`);
      break;
    }
  }
}

function applyOverreachWarnings(result, cousin, raw, schema) {
  const rules = schema.overreachWarnings[cousin] || [];
  const haystack = `${raw}\n${JSON.stringify(result.metadata || {})}`.toLowerCase();
  for (const rule of rules) {
    const re = new RegExp(rule.pattern, "i");
    if (re.test(haystack)) {
      result.warnings.push(`[${cousin} overreach] ${rule.message}`);
      result.benReview = true;
    }
  }
}

export function detectSourceConflicts(results) {
  const bySource = new Map();
  const conflicts = [];
  for (const r of results) {
    const id = r.metadata?.source_packet_id || r.metadata?.source_packet_file;
    if (!id) continue;
    if (bySource.has(id)) {
      conflicts.push({
        source: id,
        files: [bySource.get(id).file, r.file],
        type: "duplicate_source",
      });
      r.ok = false;
      r.status = "CONFLICT";
      r.errors.push(`Conflict: multiple responses target same source packet ${id}`);
      bySource.get(id).ok = false;
      bySource.get(id).status = "CONFLICT";
      bySource.get(id).errors.push(`Conflict: multiple responses target same source packet ${id}`);
    } else {
      bySource.set(id, r);
    }
  }

  const byLane = new Map();
  for (const r of results) {
    const lane = r.metadata?.lane;
    const gate = r.metadata?.nextActionHash;
    if (!lane || !gate) continue;
    const key = `${lane}::${gate}`;
    if (byLane.has(key)) {
      const prev = byLane.get(key);
      if (prev.metadata?.VERDICT && r.metadata?.VERDICT && prev.metadata.VERDICT !== r.metadata.VERDICT) {
        conflicts.push({
          source: key,
          files: [prev.file, r.file],
          type: "lane_verdict_conflict",
        });
        r.warnings.push(`Lane conflict: verdict differs from ${prev.file} on same gate hash`);
        prev.warnings.push(`Lane conflict: verdict differs from ${r.file} on same gate hash`);
        r.benReview = true;
        prev.benReview = true;
      }
    } else {
      byLane.set(key, r);
    }
  }

  return conflicts;
}

export function writeMergeConflicts(conflicts) {
  if (!conflicts.length) return;
  ensureRelayDirs();
  const lines = [
    "",
    `## ${nowIso()}`,
    "",
    "Auto-detected conflicts — **never auto-merge**. Human review required.",
    "",
  ];
  for (const c of conflicts) {
    lines.push(`- **${c.type || "conflict"}** source \`${c.source}\`: ${c.files.join(" vs ")}`);
  }
  lines.push("");
  append(MERGE_CONFLICTS_PATH, lines.join("\n"));
}

function writeProcessedSummary(result, destDir, destName) {
  const summary = {
    processed_at: nowIso(),
    file: result.file,
    status: result.status,
    cousin: result.metadata?.cousin,
    verdict: result.metadata?.VERDICT,
    confidence: result.metadata?.CONFIDENCE,
    benReview: result.benReview,
    warnings: result.warnings,
    errors: result.errors,
    stale: result.status === "STALE_DO_NOT_APPLY",
    auto_merge: false,
  };
  const summaryPath = path.join(destDir, `${destName}.summary.json`);
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf8");
}

export function validateInbox(options = {}) {
  ensureRelayDirs();
  const inboxDir = options.inboxDir || null;
  const processedDir = options.processedDir || null;
  const files = listInboxResponses(inboxDir);
  const results = files.map((f) => validateResponseFile(f, options));
  detectSourceConflicts(results);
  const allOk = results.length === 0 || results.every((r) => r.ok);
  return { ok: allOk, results, fileCount: files.length, inboxDir, processedDir };
}

export function processInbox(options = {}) {
  const dryRun = Boolean(options.dryRun);
  const validation = validateInbox(options);
  const conflicts = detectSourceConflicts(validation.results);
  if (conflicts.length && !dryRun) {
    writeMergeConflicts(conflicts);
  }

  if (!validation.ok) {
    return {
      ok: false,
      dryRun,
      moved: [],
      conflicts,
      summary: validation.results,
      message: "Halted: one or more files failed validation — nothing moved",
    };
  }

  if (validation.fileCount === 0) {
    return {
      ok: true,
      dryRun,
      moved: [],
      summary: [],
      message: "Inbox empty — nothing to process",
    };
  }

  if (dryRun) {
    return {
      ok: true,
      dryRun: true,
      moved: [],
      summary: validation.results,
      message: "Dry-run OK — all files validated; no files moved",
    };
  }

  const moved = [];
  const timestamp = nowIso().replace(/[:.]/g, "-");
  const destDir = validation.processedDir || abs(PROCESSED_DIR);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  for (const r of validation.results) {
    const destName = `${timestamp}__${r.file}`;
    const dest = path.join(destDir, destName);
    fs.renameSync(r.path, dest);
    writeProcessedSummary(r, destDir, destName);
    moved.push({ from: r.file, to: destName });
  }

  return {
    ok: true,
    dryRun: false,
    moved,
    conflicts,
    summary: validation.results,
    message: `Processed ${moved.length} file(s) to inbox/processed/ — never auto-merged`,
  };
}

export function buildOutgoingMetadata(cousin) {
  const schema = loadSchema();
  const hashes = computeCockpitHashes();
  const generated_at = nowIso();
  return {
    schemaVersion: schema.schemaVersion,
    cousin: cousin.toUpperCase(),
    generated_at,
    currentStateHash: hashes.currentStateHash,
    nextActionHash: hashes.nextActionHash,
    source_files_included: hashes.source_files_included,
    REQUIRED_RESPONSE_FIELDS: schema.REQUIRED_RESPONSE_FIELDS,
  };
}

export function isPacketStale(metadata) {
  const live = computeCockpitHashes();
  if (metadata.nextActionHash && live.nextActionHash && metadata.nextActionHash !== live.nextActionHash) {
    return { stale: true, reason: "nextActionHash differs from live NEXT_ACTION.md" };
  }
  if (
    metadata.currentStateHash &&
    live.currentStateHash &&
    metadata.currentStateHash !== live.currentStateHash
  ) {
    return { stale: true, reason: "currentStateHash differs from live CURRENT_STATE.md" };
  }
  return { stale: false, reason: null };
}

export function listOutboxPackets(includeSent = false) {
  ensureRelayDirs();
  const dirs = [abs(OUTBOX_DIR)];
  if (includeSent) dirs.push(abs(SENT_DIR));
  const packets = [];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!/^TO_[A-Z]+_.*\.md$/i.test(f)) continue;
      const full = path.join(dir, f);
      const raw = fs.readFileSync(full, "utf8");
      const parsed = extractRelayMetadata(raw);
      packets.push({
        file: f,
        dir: path.basename(dir),
        path: full,
        sent: dir.endsWith("sent") || dir.includes(`${path.sep}sent`),
        metadata: parsed.ok ? parsed.metadata : null,
        parseError: parsed.ok ? null : parsed.error,
      });
    }
  }
  return packets;
}

export function markPacketSent(filename) {
  ensureRelayDirs();
  const src = path.join(abs(OUTBOX_DIR), filename);
  if (!fs.existsSync(src)) {
    return { ok: false, error: `Outbox packet not found: ${filename}` };
  }
  const raw = fs.readFileSync(src, "utf8");
  const parsed = extractRelayMetadata(raw);
  if (parsed.ok) {
    const stale = isPacketStale(parsed.metadata);
    if (stale.stale) {
      return {
        ok: false,
        error: `STALE — do not send: ${stale.reason}. Regenerate packet first.`,
      };
    }
  }
  const timestamp = nowIso().replace(/[:.]/g, "-");
  const dest = path.join(abs(SENT_DIR), `${timestamp}__${filename}`);
  fs.renameSync(src, dest);
  return { ok: true, from: filename, to: path.basename(dest) };
}

export function archiveOldSentPackets(maxAgeDays) {
  const schema = loadSchema();
  const days = maxAgeDays ?? schema.outboxLifecycle.archiveAfterDays ?? 30;
  ensureRelayDirs();
  const sentDir = abs(SENT_DIR);
  const archiveDir = abs(ARCHIVE_DIR);
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const archived = [];
  for (const f of fs.readdirSync(sentDir)) {
    const full = path.join(sentDir, f);
    const stat = fs.statSync(full);
    if (stat.mtimeMs < cutoff) {
      const dest = path.join(archiveDir, f);
      fs.renameSync(full, dest);
      archived.push(f);
    }
  }
  return { ok: true, archived, days };
}

export function formatValidationReport(validation) {
  const lines = [];
  lines.push(`Inbox files: ${validation.fileCount}`);
  lines.push(`Overall: ${validation.ok ? "PASS" : "FAIL"}`);
  for (const r of validation.results) {
    lines.push("");
    lines.push(`--- ${r.file} [${r.status}] ---`);
    for (const e of r.errors) lines.push(`  ERROR: ${e}`);
    for (const w of r.warnings) lines.push(`  WARN:  ${w}`);
    if (r.benReview) lines.push("  >> FLAG FOR BEN REVIEW");
  }
  return lines.join("\n");
}

const RELAY_METADATA_HEADING = "## Relay metadata";

export function buildRelayMetadataBlock(metadata) {
  return `${RELAY_METADATA_HEADING}\n\n\`\`\`json\n${JSON.stringify(metadata, null, 2)}\n\`\`\`\n`;
}

export function stampOutgoingPacket(filePath, cousin, packetId) {
  const schema = loadSchema();
  const filename = path.basename(filePath);
  const metadata = {
    ...buildOutgoingMetadata(cousin),
    packet_id: packetId || filename.replace(/\.md$/, ""),
    source_packet_file: filename,
    role_lane: schema.cousins[cousin.toUpperCase()]?.lane || null,
    human_gate_required: true,
  };

  let raw = fs.readFileSync(filePath, "utf8");
  const block = buildRelayMetadataBlock(metadata);
  const blockRe = new RegExp(`${RELAY_METADATA_HEADING.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?\`\`\`\\s*`, "i");

  if (blockRe.test(raw)) {
    raw = raw.replace(blockRe, `${block}\n`);
  } else {
    raw = `${raw.trim()}\n\n---\n\n${block}`;
  }

  fs.writeFileSync(filePath, raw, "utf8");
  return { ok: true, file: filename, metadata };
}
