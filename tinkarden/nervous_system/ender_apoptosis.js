#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");

const NERVOUS_SYSTEM_DIR = __dirname;
const TINKARDEN_ROOT = path.resolve(NERVOUS_SYSTEM_DIR, "..");
const DEFAULT_DB = path.join(TINKARDEN_ROOT, "server", "circulation.db");
const DEFAULT_OUTBOX_CANDIDATES = [
  path.join(path.parse(TINKARDEN_ROOT).root, "foreman", "handoffs", "outbox"),
  path.join("C:", "Users", "BenLeak", "Desktop", "github", "Werkles", "foreman", "handoffs", "outbox"),
];
const DEFAULT_QUARANTINE = path.join(NERVOUS_SYSTEM_DIR, "quarantine_list.json");
const DEFAULT_LOG = path.join(NERVOUS_SYSTEM_DIR, "filtration_log.txt");
const DEFAULT_CRON = "0 3 * * 5";
const DRY_RUN_MAX_AGE_MS = 48 * 60 * 60 * 1000;
const UNREAD_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function parseArgs(argv) {
  const args = {
    db: process.env.ENDER_CIRCULATION_DB || DEFAULT_DB,
    outbox: process.env.ENDER_OUTBOX || null,
    quarantine: process.env.ENDER_QUARANTINE_LIST || DEFAULT_QUARANTINE,
    log: process.env.ENDER_FILTRATION_LOG || DEFAULT_LOG,
    cron: process.env.ENDER_CRON || DEFAULT_CRON,
    once: true,
    daemon: false,
    selfTest: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--db") args.db = requireValue(argv, ++i, arg);
    else if (arg.startsWith("--db=")) args.db = arg.slice("--db=".length);
    else if (arg === "--outbox") args.outbox = requireValue(argv, ++i, arg);
    else if (arg.startsWith("--outbox=")) args.outbox = arg.slice("--outbox=".length);
    else if (arg === "--quarantine") args.quarantine = requireValue(argv, ++i, arg);
    else if (arg.startsWith("--quarantine=")) args.quarantine = arg.slice("--quarantine=".length);
    else if (arg === "--log") args.log = requireValue(argv, ++i, arg);
    else if (arg.startsWith("--log=")) args.log = arg.slice("--log=".length);
    else if (arg === "--cron") args.cron = requireValue(argv, ++i, arg);
    else if (arg.startsWith("--cron=")) args.cron = arg.slice("--cron=".length);
    else if (arg === "--operator-interval-minutes") {
      const minutes = Number(requireValue(argv, ++i, arg));
      if (!Number.isFinite(minutes) || minutes < 1) throw new Error("--operator-interval-minutes must be >= 1");
      args.cron = `*/${minutes} * * * *`;
    }
    else if (arg.startsWith("--operator-interval-minutes=")) {
      const minutes = Number(arg.slice("--operator-interval-minutes=".length));
      if (!Number.isFinite(minutes) || minutes < 1) throw new Error("--operator-interval-minutes must be >= 1");
      args.cron = `*/${minutes} * * * *`;
    }
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
  console.log(`Ender apoptosis filtration

Usage:
  node C:\\tinkarden\\nervous_system\\ender_apoptosis.js --once
  node C:\\tinkarden\\nervous_system\\ender_apoptosis.js --daemon
  node C:\\tinkarden\\nervous_system\\ender_apoptosis.js --self-test
  node C:\\tinkarden\\nervous_system\\ender_apoptosis.js --daemon --operator-interval-minutes 5

Defaults:
  DB:         C:\\tinkarden\\server\\circulation.db
  Outbox:     C:\\foreman\\handoffs\\outbox, then Werkles foreman/handoffs/outbox
  Cron:       0 3 * * 5 (Friday 3:00 AM)
`);
}

function quoteIdent(identifier) {
  return `"${String(identifier).replaceAll('"', '""')}"`;
}

function normalizeToken(value) {
  return String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function parseDateValue(value) {
  if (value === null || value === undefined || value === "") return null;
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
  const payloadLike = firstPresent(row, ["payload", "data", "json", "body"]);
  const parsed = parseMaybeJson(payloadLike);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
}

function resolveOutbox(explicitOutbox) {
  if (explicitOutbox) return path.resolve(explicitOutbox);
  return DEFAULT_OUTBOX_CANDIDATES.find((candidate) => fs.existsSync(candidate)) || DEFAULT_OUTBOX_CANDIDATES[0];
}

function ensureParent(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function appendLog(logPath, line) {
  ensureParent(logPath);
  fs.appendFileSync(logPath, `${new Date().toISOString()} ${line}\n`, "utf8");
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex").toUpperCase();
}

function hashFile(filePath) {
  const text = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(text).digest("hex").toUpperCase();
}

function scanAndDeleteDryRuns(dbPath, logPath, nowMs) {
  if (!fs.existsSync(dbPath)) {
    appendLog(logPath, `[DB_MISSING] ${dbPath}`);
    return {
      status: "DB_MISSING",
      db_path: dbPath,
      scanned_rows: 0,
      deleted_rows: [],
      skipped_rows: [],
    };
  }

  const db = new DatabaseSync(dbPath);
  try {
    const table = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'shadow_cache'").get();
    if (!table) {
      appendLog(logPath, `[TABLE_MISSING] shadow_cache in ${dbPath}`);
      return {
        status: "TABLE_MISSING",
        db_path: dbPath,
        scanned_rows: 0,
        deleted_rows: [],
        skipped_rows: [],
      };
    }

    const rows = db.prepare(`SELECT rowid AS __rowid, * FROM ${quoteIdent("shadow_cache")}`).all();
    const deletedRows = [];
    const skippedRows = [];

    db.exec("BEGIN IMMEDIATE");
    try {
      for (const row of rows) {
        const payload = rowPayload(row);
        const merged = { ...payload, ...row };
        const dryRunToken = normalizeToken(firstPresent(merged, ["state", "status", "kind", "type", "mode"]));
        const isDryRun = dryRunToken === "dry_run" || merged.dry_run === true || merged.dryRun === true;
        const createdValue = firstPresent(merged, [
          "created_at",
          "createdAt",
          "updated_at",
          "updatedAt",
          "timestamp",
          "last_seen",
          "lastSeen",
        ]);
        const createdMs = parseDateValue(createdValue);
        const ageMs = createdMs === null ? null : nowMs - createdMs;

        if (!isDryRun || ageMs === null || ageMs <= DRY_RUN_MAX_AGE_MS) continue;

        const targetPath = String(firstPresent(merged, ["path", "target_path", "targetPath", "file", "doc_path"]) || "");
        const operatorSignature = firstPresent(merged, ["operator_signature", "operatorSignature"]);
        if (isDoctrinePath(targetPath) && !operatorSignature) {
          const skipped = {
            rowid: row.__rowid,
            id: firstPresent(merged, ["id", "packet_id", "packetId", "receipt_id"]) || `row-${row.__rowid}`,
            reason: "HUMAN_GATE_REQUIRED_FOR_DOCS",
            target_path: targetPath,
            age_hours: round(ageMs / 3_600_000),
          };
          skippedRows.push(skipped);
          appendLog(logPath, `[SKIP_DOCS_HUMAN_GATE] rowid=${skipped.rowid} id=${skipped.id} age_hours=${skipped.age_hours} path=${targetPath}`);
          continue;
        }

        db.prepare(`DELETE FROM ${quoteIdent("shadow_cache")} WHERE rowid = ?`).run(row.__rowid);
        const deleted = {
          rowid: row.__rowid,
          id: firstPresent(merged, ["id", "packet_id", "packetId", "receipt_id"]) || `row-${row.__rowid}`,
          state: dryRunToken,
          age_hours: round(ageMs / 3_600_000),
          created_at: createdValue,
        };
        deletedRows.push(deleted);
        appendLog(logPath, `[DELETE_DRY_RUN] rowid=${deleted.rowid} id=${deleted.id} age_hours=${deleted.age_hours}`);
      }
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }

    return {
      status: "OK",
      db_path: dbPath,
      scanned_rows: rows.length,
      deleted_rows: deletedRows,
      skipped_rows: skippedRows,
    };
  } finally {
    db.close();
  }
}

function isDoctrinePath(targetPath) {
  const normalized = String(targetPath || "").replaceAll("\\", "/").toLowerCase();
  return normalized.includes("/docs/") || normalized.startsWith("docs/");
}

function scanOutbox(outboxPath, quarantinePath, logPath, nowMs) {
  if (!fs.existsSync(outboxPath)) {
    appendLog(logPath, `[OUTBOX_MISSING] ${outboxPath}`);
    const payload = {
      generated_at: new Date(nowMs).toISOString(),
      status: "OUTBOX_MISSING",
      outbox_path: outboxPath,
      quarantine_count: 0,
      packets: [],
    };
    writeJson(quarantinePath, payload);
    return payload;
  }

  const files = fs.readdirSync(outboxPath, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(outboxPath, entry.name));

  const packets = [];
  for (const filePath of files) {
    const stat = fs.statSync(filePath);
    const ageMs = nowMs - stat.mtimeMs;
    if (ageMs <= UNREAD_MAX_AGE_MS) continue;
    const text = safeReadText(filePath);
    if (isMarkedRead(text)) continue;

    const item = {
      path: filePath,
      name: path.basename(filePath),
      age_days: round(ageMs / 86_400_000),
      modified_time: stat.mtime.toISOString(),
      byte_count: stat.size,
      sha256: hashFile(filePath),
      reason: "unread outbox packet older than 7 days",
    };
    packets.push(item);
    appendLog(logPath, `[QUARANTINE_PACKET] path=${filePath} age_days=${item.age_days} sha256=${item.sha256}`);
  }

  const payload = {
    generated_at: new Date(nowMs).toISOString(),
    status: packets.length > 0 ? "QUARANTINE_REVIEW_REQUIRED" : "NO_QUARANTINE",
    outbox_path: outboxPath,
    quarantine_count: packets.length,
    packets,
  };
  writeJson(quarantinePath, payload);
  return payload;
}

function safeReadText(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function isMarkedRead(text) {
  return /(^|\n)\s*(read|opened|acknowledged|assimilated)\s*:\s*(true|yes|ack|read)\b/i.test(text);
}

function writeJson(filePath, payload) {
  ensureParent(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function runOnce(options) {
  const nowMs = Date.now();
  const dbPath = path.resolve(options.db);
  const outboxPath = resolveOutbox(options.outbox);
  const quarantinePath = path.resolve(options.quarantine);
  const logPath = path.resolve(options.log);

  appendLog(logPath, `[RUN_START] db=${dbPath} outbox=${outboxPath} quarantine=${quarantinePath}`);
  const cache = scanAndDeleteDryRuns(dbPath, logPath, nowMs);
  const quarantine = scanOutbox(outboxPath, quarantinePath, logPath, nowMs);
  appendLog(logPath, `[RUN_END] deleted=${cache.deleted_rows.length} quarantined=${quarantine.quarantine_count}`);

  const logText = fs.readFileSync(logPath, "utf8");
  return {
    status: cache.deleted_rows.length > 0 || quarantine.quarantine_count > 0 ? "FILTRATION_ACTION" : "NO_ACTION",
    generated_at: new Date(nowMs).toISOString(),
    cache,
    quarantine,
    artifacts: {
      quarantine_list: {
        path: quarantinePath,
        sha256: fs.existsSync(quarantinePath) ? hashFile(quarantinePath) : null,
      },
      filtration_log: {
        path: logPath,
        byte_count: Buffer.byteLength(logText, "utf8"),
        sha256: sha256Text(logText),
      },
    },
  };
}

function createSelfTestFixture(options) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ender-apoptosis-self-test-"));
  const dbPath = path.join(root, "circulation.db");
  const outboxPath = path.join(root, "foreman", "handoffs", "outbox");
  const quarantinePath = path.join(root, "quarantine_list.json");
  const logPath = path.join(root, "filtration_log.txt");
  fs.mkdirSync(outboxPath, { recursive: true });

  const oldDryRun = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
  const freshDryRun = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const oldUnread = path.join(outboxPath, "UNREAD_PACKET_OLD.md");
  const readOld = path.join(outboxPath, "READ_PACKET_OLD.md");

  const db = new DatabaseSync(dbPath);
  try {
    db.exec(`
      CREATE TABLE shadow_cache (
        id TEXT PRIMARY KEY,
        state TEXT,
        created_at TEXT,
        target_path TEXT,
        operator_signature TEXT,
        payload TEXT
      );
    `);
    db.prepare("INSERT INTO shadow_cache (id, state, created_at, target_path, operator_signature, payload) VALUES (?, ?, ?, ?, ?, ?)")
      .run("DRY_RUN_STALE_001", "dry_run", oldDryRun, "tmp/cache.json", null, JSON.stringify({ proof: "stale dry_run fixture" }));
    db.prepare("INSERT INTO shadow_cache (id, state, created_at, target_path, operator_signature, payload) VALUES (?, ?, ?, ?, ?, ?)")
      .run("DRY_RUN_FRESH_001", "dry_run", freshDryRun, "tmp/fresh.json", null, JSON.stringify({ proof: "fresh dry_run fixture" }));
    db.prepare("INSERT INTO shadow_cache (id, state, created_at, target_path, operator_signature, payload) VALUES (?, ?, ?, ?, ?, ?)")
      .run("DOCS_DRY_RUN_001", "dry_run", oldDryRun, "docs/doctrine.md", null, JSON.stringify({ proof: "docs dry_run should be gated" }));
  } finally {
    db.close();
  }

  fs.writeFileSync(oldUnread, "# Old unread packet\n\nStatus: UNREAD\n", "utf8");
  fs.writeFileSync(readOld, "# Old read packet\n\nread: true\n", "utf8");
  const oldMtime = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
  fs.utimesSync(oldUnread, oldMtime, oldMtime);
  fs.utimesSync(readOld, oldMtime, oldMtime);

  return {
    ...options,
    root,
    db: dbPath,
    outbox: outboxPath,
    quarantine: quarantinePath,
    log: logPath,
  };
}

function runSelfTest(options) {
  const fixtureOptions = createSelfTestFixture(options);
  const result = runOnce(fixtureOptions);
  const db = new DatabaseSync(fixtureOptions.db, { readOnly: true });
  let rowsAfter;
  try {
    rowsAfter = db.prepare("SELECT id, state, target_path FROM shadow_cache ORDER BY id ASC").all();
  } finally {
    db.close();
  }

  const pass = result.cache.deleted_rows.length === 1
    && result.cache.deleted_rows[0].id === "DRY_RUN_STALE_001"
    && rowsAfter.some((row) => row.id === "DRY_RUN_FRESH_001")
    && rowsAfter.some((row) => row.id === "DOCS_DRY_RUN_001")
    && result.cache.skipped_rows.some((row) => row.id === "DOCS_DRY_RUN_001")
    && result.quarantine.quarantine_count === 1;

  return {
    status: pass ? "ARTIFACT" : "BLOCKER",
    event: "SELF_TEST",
    fixture_root: fixtureOptions.root,
    result,
    rows_after: rowsAfter,
  };
}

function runDaemon(options) {
  let cron;
  try {
    cron = require("node-cron");
  } catch (error) {
    console.log(JSON.stringify({
      status: "BLOCKER",
      event: "NODE_CRON_MISSING",
      message: error.message,
      install_hint: "Run npm install in C:\\tinkarden.",
    }, null, 2));
    process.exit(2);
  }

  const tick = () => {
    try {
      const result = runOnce(options);
      console.log(JSON.stringify({
        status: result.status,
        event: "ENDER_APOPTOSIS_RUN",
        generated_at: result.generated_at,
        deleted_rows: result.cache.deleted_rows.length,
        quarantined_packets: result.quarantine.quarantine_count,
        log_path: result.artifacts.filtration_log.path,
      }, null, 2));
    } catch (error) {
      console.log(JSON.stringify({
        status: "BLOCKER",
        event: "ENDER_APOPTOSIS_FAILED",
        message: error.message,
        stack: error.stack,
      }, null, 2));
    }
  };

  console.log(JSON.stringify({
    status: "ACK",
    event: "ENDER_APOPTOSIS_DAEMON_STARTED",
    cron: options.cron,
    db: path.resolve(options.db),
    outbox: resolveOutbox(options.outbox),
    quarantine: path.resolve(options.quarantine),
    log: path.resolve(options.log),
  }, null, 2));

  tick();
  cron.schedule(options.cron, tick);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.selfTest) {
    const result = runSelfTest(options);
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.status === "ARTIFACT" ? 0 : 1);
  }

  if (options.daemon) {
    runDaemon(options);
    return;
  }

  const result = runOnce(options);
  console.log(JSON.stringify(result, null, 2));
}

main();
