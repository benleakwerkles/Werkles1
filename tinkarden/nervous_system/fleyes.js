#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");

const NERVOUS_SYSTEM_DIR = __dirname;
const DEFAULT_OUTPUT_PATH = path.join(NERVOUS_SYSTEM_DIR, "frictional_heat.json");
const DEFAULT_DB_CANDIDATES = [
  path.join(path.parse(NERVOUS_SYSTEM_DIR).root, "tinkarden", "circulation.db"),
  path.join(path.parse(NERVOUS_SYSTEM_DIR).root, "tinkarden", "nervous_system", "circulation.db"),
  path.join("C:", "Users", "BenLeak", "Desktop", "github", "Werkles", "data", "organism", "circulation.db"),
  path.join("C:", "Users", "BenLeak", "Desktop", "github", "Werkles", "circulation.db"),
];
const DEFAULT_WORLD_STATE_CANDIDATES = [
  path.join(path.parse(NERVOUS_SYSTEM_DIR).root, "tinkarden", "world_state.json"),
  path.join(path.parse(NERVOUS_SYSTEM_DIR).root, "tinkarden", "nervous_system", "world_state.json"),
  path.join("C:", "Users", "BenLeak", "Desktop", "github", "Werkles", "data", "organism", "world_state.json"),
  path.join("C:", "Users", "BenLeak", "Desktop", "github", "Werkles", "world_state.json"),
];

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const THIRTY_MINUTES_MS = 30 * 60 * 1000;

function parseArgs(argv) {
  const args = {
    db: process.env.CIRCULATION_DB || process.env.FLEYES_CIRCULATION_DB || null,
    worldState: process.env.WORLD_STATE_PATH || process.env.FLEYES_WORLD_STATE || null,
    output: process.env.FLEYES_OUTPUT || DEFAULT_OUTPUT_PATH,
    daemon: false,
    once: true,
    selfTest: false,
    cron: process.env.FLEYES_CRON || "*/5 * * * *",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--db") args.db = requireValue(argv, ++i, arg);
    else if (arg.startsWith("--db=")) args.db = arg.slice("--db=".length);
    else if (arg === "--world-state") args.worldState = requireValue(argv, ++i, arg);
    else if (arg.startsWith("--world-state=")) args.worldState = arg.slice("--world-state=".length);
    else if (arg === "--output") args.output = requireValue(argv, ++i, arg);
    else if (arg.startsWith("--output=")) args.output = arg.slice("--output=".length);
    else if (arg === "--cron") args.cron = requireValue(argv, ++i, arg);
    else if (arg.startsWith("--cron=")) args.cron = arg.slice("--cron=".length);
    else if (arg === "--daemon") {
      args.daemon = true;
      args.once = false;
    } else if (arg === "--once") {
      args.once = true;
      args.daemon = false;
    } else if (arg === "--self-test") {
      args.selfTest = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function requireValue(argv, index, flag) {
  const value = argv[index];
  if (!value) throw new Error(`${flag} requires a value`);
  return value;
}

function printHelp() {
  console.log(`Fleyes mule-labor sensor

Usage:
  node C:\\tinkarden\\nervous_system\\fleyes.js --once
  node C:\\tinkarden\\nervous_system\\fleyes.js --daemon
  node C:\\tinkarden\\nervous_system\\fleyes.js --self-test

Inputs:
  --db <path>             SQLite circulation.db path
  --world-state <path>    Wormeyes world_state.json path
  --output <path>         frictional_heat.json output path
  --cron <expr>           node-cron expression, default every 5 minutes
`);
}

function resolveFirstExisting(explicitPath, candidates) {
  if (explicitPath) {
    const resolved = path.resolve(explicitPath);
    return { path: resolved, exists: fs.existsSync(resolved), candidates: [resolved] };
  }

  const resolvedCandidates = candidates.map((candidate) => path.resolve(candidate));
  return {
    path: resolvedCandidates.find((candidate) => fs.existsSync(candidate)) || resolvedCandidates[0],
    exists: resolvedCandidates.some((candidate) => fs.existsSync(candidate)),
    candidates: resolvedCandidates,
  };
}

function quoteIdent(identifier) {
  return `"${String(identifier).replaceAll('"', '""')}"`;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function parseDateValue(value) {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.getTime();
  if (typeof value === "number") {
    if (value > 1_000_000_000_000) return value;
    if (value > 1_000_000_000) return value * 1000;
    return null;
  }
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function firstPresent(object, keys) {
  if (!object || typeof object !== "object") return undefined;
  for (const key of keys) {
    if (object[key] !== undefined && object[key] !== null && object[key] !== "") return object[key];
  }
  return undefined;
}

function normalizeToken(value) {
  return String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function parseMaybeJson(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function rowPayload(row) {
  const payloadLike = firstPresent(row, ["payload", "data", "json", "body", "receipt"]);
  const parsed = parseMaybeJson(payloadLike);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
}

function scanShadowCache(dbPath, nowMs) {
  if (!fs.existsSync(dbPath)) {
    return {
      source: "circulation.db",
      path: dbPath,
      status: "MISSING",
      flags: [],
      error: "circulation.db not found",
    };
  }

  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    const table = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'shadow_cache'").get();
    if (!table) {
      return {
        source: "circulation.db",
        path: dbPath,
        status: "MISSING_TABLE",
        flags: [],
        error: "shadow_cache table not found",
      };
    }

    const rows = db.prepare(`SELECT rowid AS __rowid, * FROM ${quoteIdent("shadow_cache")}`).all();
    const flags = [];

    for (const row of rows) {
      const payload = rowPayload(row);
      const merged = { ...payload, ...row };
      const kind = normalizeToken(firstPresent(merged, ["kind", "type", "action", "event_type", "cache_type"]));
      const status = normalizeToken(firstPresent(merged, ["status", "state", "phase"]));
      const operatorSignature = firstPresent(merged, ["operator_signature", "operatorSignature", "signature"]);
      const requestedAtValue = firstPresent(merged, [
        "operator_signature_requested_at",
        "operatorSignatureRequestedAt",
        "waiting_since",
        "waitingSince",
        "created_at",
        "createdAt",
        "timestamp",
        "updated_at",
        "updatedAt",
      ]);
      const requestedAtMs = parseDateValue(requestedAtValue);
      const ageMs = requestedAtMs === null ? null : nowMs - requestedAtMs;

      const isShadowMerge = kind === "shadow_merge";
      const waitingOnOperator =
        !operatorSignature &&
        (
          status === "waiting_operator_signature" ||
          status === "waiting_on_operator_signature" ||
          status === "operator_signature_required" ||
          status === "pending_operator_signature"
        );

      if (isShadowMerge && waitingOnOperator && ageMs !== null && ageMs > FIFTEEN_MINUTES_MS) {
        flags.push({
          flag: "STALLED",
          source: "shadow_cache",
          rowid: row.__rowid,
          id: firstPresent(merged, ["id", "receipt_id", "packet_id", "packetId"]) || `row-${row.__rowid}`,
          kind,
          status,
          waiting_minutes: round(ageMs / 60_000),
          threshold_minutes: 15,
          operator_signature: operatorSignature || null,
          waiting_since: requestedAtValue,
          rule: "shadow_merge waiting on operator_signature for > 15 minutes",
        });
      }
    }

    return {
      source: "circulation.db",
      path: dbPath,
      status: "OK",
      rows_scanned: rows.length,
      flags,
    };
  } finally {
    db.close();
  }
}

function scanWorldState(worldStatePath, nowMs) {
  if (!fs.existsSync(worldStatePath)) {
    return {
      source: "world_state.json",
      path: worldStatePath,
      status: "MISSING",
      flags: [],
      error: "world_state.json not found",
    };
  }

  const worldState = readJson(worldStatePath);
  const files = extractWorldStateFiles(worldState);
  const flags = [];

  for (const file of files) {
    const modified = isModifiedUncommitted(file);
    const sinceValue = firstPresent(file, [
      "uncommitted_since",
      "uncommittedSince",
      "modified_since",
      "modifiedSince",
      "last_modified",
      "lastModified",
      "modified_at",
      "modifiedAt",
      "detected_at",
      "detectedAt",
      "timestamp",
    ]);
    const sinceMs = parseDateValue(sinceValue);
    const ageMs = sinceMs === null ? null : nowMs - sinceMs;

    if (modified && ageMs !== null && ageMs > THIRTY_MINUTES_MS) {
      flags.push({
        flag: "CHURN",
        source: "world_state.json",
        path: firstPresent(file, ["path", "file", "relative_path", "relativePath"]) || "UNKNOWN",
        status: firstPresent(file, ["status", "git_status", "gitStatus", "state"]) || "modified",
        uncommitted_minutes: round(ageMs / 60_000),
        threshold_minutes: 30,
        modified_since: sinceValue,
        rule: "modified but uncommitted for > 30 minutes",
      });
    }
  }

  return {
    source: "world_state.json",
    path: worldStatePath,
    status: "OK",
    files_scanned: files.length,
    flags,
  };
}

function extractWorldStateFiles(worldState) {
  if (Array.isArray(worldState)) return worldState;
  if (!worldState || typeof worldState !== "object") return [];
  for (const key of ["files", "modified_files", "modifiedFiles", "uncommitted_files", "uncommittedFiles", "changes"]) {
    if (Array.isArray(worldState[key])) return worldState[key];
  }
  if (worldState.git && Array.isArray(worldState.git.files)) return worldState.git.files;
  if (worldState.wormeyes && Array.isArray(worldState.wormeyes.files)) return worldState.wormeyes.files;
  return [];
}

function isModifiedUncommitted(file) {
  const status = normalizeToken(firstPresent(file, ["status", "git_status", "gitStatus", "state"]));
  if (file.uncommitted === true || file.committed === false) return true;
  return [
    "modified",
    "uncommitted",
    "dirty",
    "changed",
    "m",
    "??",
    "added",
    "deleted",
    "renamed",
  ].includes(status);
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex").toUpperCase();
}

function writeFrictionalHeat(scanResult, outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(scanResult, null, 2)}\n`, "utf8");
  const text = fs.readFileSync(outputPath, "utf8");
  return {
    output_path: outputPath,
    byte_count: Buffer.byteLength(text, "utf8"),
    sha256: sha256Text(text),
  };
}

function scan(options) {
  const now = new Date();
  const nowMs = now.getTime();
  const dbResolution = resolveFirstExisting(options.db, DEFAULT_DB_CANDIDATES);
  const worldStateResolution = resolveFirstExisting(options.worldState, DEFAULT_WORLD_STATE_CANDIDATES);

  const stalled = scanShadowCache(dbResolution.path, nowMs);
  const churn = scanWorldState(worldStateResolution.path, nowMs);
  const flags = [...stalled.flags, ...churn.flags];

  const result = {
    sensor: "FLEYES_MULE_SENSOR_V0",
    packet_id: "BIRD_0025_SWANSON_FLEYE_MULE_SENSOR",
    generated_at: now.toISOString(),
    status: flags.length > 0 ? "FRICTION_DETECTED" : "NO_FRICTION_DETECTED",
    flags,
    summary: {
      stalled_count: flags.filter((flag) => flag.flag === "STALLED").length,
      churn_count: flags.filter((flag) => flag.flag === "CHURN").length,
      total_flags: flags.length,
    },
    sources: {
      circulation_db: {
        selected_path: dbResolution.path,
        exists: dbResolution.exists,
        candidates: dbResolution.candidates,
        readback: stalled,
      },
      world_state_json: {
        selected_path: worldStateResolution.path,
        exists: worldStateResolution.exists,
        candidates: worldStateResolution.candidates,
        readback: churn,
      },
    },
    rules: [
      "STALLED = shadow_cache row where kind/type/action is shadow_merge, status waits on operator_signature, operator_signature is empty, and wait age > 15 minutes.",
      "CHURN = world_state file marked modified/uncommitted/dirty/changed and uncommitted age > 30 minutes.",
      "Fleyes reports pain only. It does not delete, merge, heal, approve, or mutate tasks.",
    ],
  };

  return {
    result,
    artifact: writeFrictionalHeat(result, path.resolve(options.output)),
  };
}

function runSelfTest(options) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "fleyes-self-test-"));
  const dbPath = path.join(root, "circulation.db");
  const worldStatePath = path.join(root, "world_state.json");
  const now = Date.now();
  const oldShadowMerge = new Date(now - 20 * 60 * 1000).toISOString();
  const oldModifiedFile = new Date(now - 45 * 60 * 1000).toISOString();

  const db = new DatabaseSync(dbPath);
  try {
    db.exec(`
      CREATE TABLE shadow_cache (
        id TEXT PRIMARY KEY,
        kind TEXT,
        status TEXT,
        operator_signature TEXT,
        operator_signature_requested_at TEXT,
        payload TEXT
      );
    `);
    db.prepare(`
      INSERT INTO shadow_cache (id, kind, status, operator_signature, operator_signature_requested_at, payload)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      "SELF_TEST_SHADOW_MERGE_001",
      "shadow_merge",
      "waiting_on_operator_signature",
      null,
      oldShadowMerge,
      JSON.stringify({ receipt_id: "DELAYED_RECEIPT_001", mission: "self-test delayed receipt" })
    );
  } finally {
    db.close();
  }

  fs.writeFileSync(worldStatePath, `${JSON.stringify({
    generated_by: "Wormeyes self-test fixture",
    files: [
      {
        path: "foreman/source-truth/receipt.md",
        status: "modified",
        committed: false,
        uncommitted_since: oldModifiedFile,
      },
    ],
  }, null, 2)}\n`, "utf8");

  const output = scan({
    ...options,
    db: dbPath,
    worldState: worldStatePath,
  });

  return {
    status: output.result.flags.some((flag) => flag.flag === "STALLED" || flag.flag === "CHURN")
      ? "ARTIFACT"
      : "BLOCKER",
    event: "SELF_TEST",
    fixture_root: root,
    db_path: dbPath,
    world_state_path: worldStatePath,
    output: output.artifact,
    result: output.result,
  };
}

function log(value) {
  console.log(JSON.stringify(value, null, 2));
}

function runDaemon(options) {
  let cron;
  try {
    cron = require("node-cron");
  } catch (error) {
    log({
      status: "BLOCKER",
      event: "NODE_CRON_MISSING",
      message: error.message,
      install_hint: "Run npm install node-cron in C:\\tinkarden or use the package.json created by this packet.",
    });
    process.exit(2);
  }

  const tick = () => {
    try {
      const output = scan(options);
      log({
        status: output.result.status,
        event: "FLEYES_SCAN",
        generated_at: output.result.generated_at,
        output: output.artifact,
        summary: output.result.summary,
      });
    } catch (error) {
      log({
        status: "BLOCKER",
        event: "FLEYES_SCAN_FAILED",
        message: error.message,
      });
    }
  };

  log({
    status: "ACK",
    event: "FLEYES_DAEMON_STARTED",
    cron: options.cron,
    output: path.resolve(options.output),
  });
  tick();
  cron.schedule(options.cron, tick);
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.selfTest) {
    const result = runSelfTest(options);
    log(result);
    process.exit(result.status === "ARTIFACT" ? 0 : 1);
  }

  if (options.daemon) {
    runDaemon(options);
    return;
  }

  const output = scan(options);
  log({
    status: output.result.status,
    event: "FLEYES_SCAN",
    output: output.artifact,
    summary: output.result.summary,
    live_sources: {
      circulation_db: output.result.sources.circulation_db.readback.status,
      world_state_json: output.result.sources.world_state_json.readback.status,
    },
  });
}

main();
