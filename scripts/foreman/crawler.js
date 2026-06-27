#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_INTERVAL_MS = 60_000;
const DEFAULT_LIMIT = 25;
const DEFAULT_QUEUE_DIR = path.join(path.parse(REPO_ROOT).root, "tinkarden", "intake", "speaker_queue");
const DEFAULT_DB_CANDIDATES = [
  path.join(REPO_ROOT, "circulation.db"),
  path.join(REPO_ROOT, "data", "organism", "circulation.db"),
  path.join(path.parse(REPO_ROOT).root, "tinkarden", "circulation.db"),
];

function parseArgs(argv) {
  const args = {
    db: process.env.CIRCULATION_DB || process.env.RECEIPT_CRAWLER_DB || null,
    queue: process.env.SPEAKER_QUEUE_DIR || DEFAULT_QUEUE_DIR,
    intervalMs: Number(process.env.RECEIPT_CRAWLER_INTERVAL_MS || DEFAULT_INTERVAL_MS),
    limit: Number(process.env.RECEIPT_CRAWLER_LIMIT || DEFAULT_LIMIT),
    once: false,
    selfTest: false,
    json: true,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--db") args.db = requireValue(argv, ++i, arg);
    else if (arg.startsWith("--db=")) args.db = arg.slice("--db=".length);
    else if (arg === "--queue") args.queue = requireValue(argv, ++i, arg);
    else if (arg.startsWith("--queue=")) args.queue = arg.slice("--queue=".length);
    else if (arg === "--interval-ms") args.intervalMs = Number(requireValue(argv, ++i, arg));
    else if (arg.startsWith("--interval-ms=")) args.intervalMs = Number(arg.slice("--interval-ms=".length));
    else if (arg === "--limit") args.limit = Number(requireValue(argv, ++i, arg));
    else if (arg.startsWith("--limit=")) args.limit = Number(arg.slice("--limit=".length));
    else if (arg === "--once") args.once = true;
    else if (arg === "--self-test") args.selfTest = true;
    else if (arg === "--plain") args.json = false;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isFinite(args.intervalMs) || args.intervalMs < 1_000) {
    throw new Error("--interval-ms must be a number >= 1000");
  }
  if (!Number.isFinite(args.limit) || args.limit < 1) {
    throw new Error("--limit must be a number >= 1");
  }
  return args;
}

function requireValue(argv, index, flag) {
  const value = argv[index];
  if (!value) throw new Error(`${flag} requires a value`);
  return value;
}

function printHelp() {
  console.log(`Receipt crawler

Usage:
  node scripts/foreman/crawler.js [--db circulation.db] [--queue C:\\tinkarden\\intake\\speaker_queue] [--once]
  node scripts/foreman/crawler.js --self-test

Environment:
  CIRCULATION_DB or RECEIPT_CRAWLER_DB
  SPEAKER_QUEUE_DIR
  RECEIPT_CRAWLER_INTERVAL_MS
  RECEIPT_CRAWLER_LIMIT
`);
}

function logEvent(event, json = true) {
  if (json) {
    console.log(JSON.stringify({ ...event, logged_at: new Date().toISOString() }));
  } else {
    console.log(`[${new Date().toISOString()}] ${event.event}: ${event.message || ""}`);
  }
}

function resolveDbPath(explicitDb) {
  if (explicitDb) {
    return path.resolve(explicitDb);
  }

  for (const candidate of DEFAULT_DB_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function ensureDirectory(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function quoteIdent(identifier) {
  return `"${String(identifier).replaceAll('"', '""')}"`;
}

function listColumns(db) {
  return db.prepare(`PRAGMA table_info(${quoteIdent("LiveReceipt")})`).all();
}

function requireLiveReceiptShape(db) {
  const columns = listColumns(db);
  if (columns.length === 0) {
    throw new Error('Missing table "LiveReceipt"');
  }

  const statusColumn = columns.find((column) => column.name.toLowerCase() === "status")?.name;
  const assimilatedColumn = columns.find((column) => column.name.toLowerCase() === "assimilated")?.name;

  if (!statusColumn) throw new Error('LiveReceipt is missing required "status" column');
  if (!assimilatedColumn) throw new Error('LiveReceipt is missing required "ASSIMILATED" column');

  return {
    columns: columns.map((column) => column.name),
    statusColumn,
    assimilatedColumn,
  };
}

function readPendingRows(db, shape, limit) {
  const statusColumn = quoteIdent(shape.statusColumn);
  const assimilatedColumn = quoteIdent(shape.assimilatedColumn);
  return db
    .prepare(`
      SELECT rowid AS __rowid, *
      FROM ${quoteIdent("LiveReceipt")}
      WHERE UPPER(CAST(${statusColumn} AS TEXT)) = 'SUCCESS'
        AND (
          ${assimilatedColumn} IS NULL
          OR ${assimilatedColumn} = 0
          OR LOWER(CAST(${assimilatedColumn} AS TEXT)) IN ('', 'false', 'no', 'unproven')
        )
      ORDER BY rowid ASC
      LIMIT ?
    `)
    .all(limit);
}

function pickReceiptId(row) {
  const candidateKeys = [
    "receipt_id",
    "receiptId",
    "id",
    "packet_id",
    "packetId",
    "mission",
    "__rowid",
  ];
  for (const key of candidateKeys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
      return String(row[key]).trim();
    }
  }
  return `row-${row.__rowid}`;
}

function slug(value) {
  return String(value)
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "receipt";
}

function timestampForFilename(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function stableJson(value) {
  return JSON.stringify(value, Object.keys(value).sort(), 2);
}

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex").toUpperCase();
}

function buildMarkdown(row, dbPath) {
  const receiptId = pickReceiptId(row);
  const body = row.receipt || row.body || row.content || row.payload || row.data || row.message || null;
  const rowForProof = { ...row };
  delete rowForProof.__rowid;
  const payloadJson = stableJson(rowForProof);
  const payloadHash = sha256(payloadJson);

  return {
    receiptId,
    payloadHash,
    markdown: `# LiveReceipt Speaker Queue Pickup

- receipt_id: ${receiptId}
- source_table: LiveReceipt
- source_rowid: ${row.__rowid}
- source_db: ${dbPath}
- picked_up_at: ${new Date().toISOString()}
- payload_sha256: ${payloadHash}
- crawler: scripts/foreman/crawler.js

## Receipt Body

${body ? String(body) : "_No dedicated receipt/body/content/payload field was present. See raw row below._"}

## Raw LiveReceipt Row

\`\`\`json
${payloadJson}
\`\`\`
`,
  };
}

function writeReceiptFile(row, dbPath, queueDir) {
  ensureDirectory(queueDir);
  const built = buildMarkdown(row, dbPath);
  const filename = `${timestampForFilename()}__${slug(built.receiptId)}.md`;
  const targetPath = path.join(queueDir, filename);
  fs.writeFileSync(targetPath, built.markdown, "utf8");
  return {
    receipt_id: built.receiptId,
    target_path: targetPath,
    byte_count: Buffer.byteLength(built.markdown, "utf8"),
    sha256: sha256(built.markdown),
    payload_sha256: built.payloadHash,
  };
}

function markAssimilated(db, shape, rowid) {
  db.prepare(`
    UPDATE ${quoteIdent("LiveReceipt")}
    SET ${quoteIdent(shape.assimilatedColumn)} = TRUE
    WHERE rowid = ?
  `).run(rowid);
}

function scanOnce(options) {
  const dbPath = resolveDbPath(options.db);
  if (!dbPath || !fs.existsSync(dbPath)) {
    return {
      status: "BLOCKER",
      event: "DB_MISSING",
      message: "circulation.db not found",
      searched_paths: options.db ? [path.resolve(options.db)] : DEFAULT_DB_CANDIDATES,
      queue_dir: path.resolve(options.queue),
      moved_count: 0,
    };
  }

  const db = new DatabaseSync(dbPath);
  try {
    const shape = requireLiveReceiptShape(db);
    const rows = readPendingRows(db, shape, options.limit);
    const moved = [];

    db.exec("BEGIN IMMEDIATE");
    try {
      for (const row of rows) {
        const artifact = writeReceiptFile(row, dbPath, path.resolve(options.queue));
        markAssimilated(db, shape, row.__rowid);
        moved.push({
          ...artifact,
          source_rowid: row.__rowid,
          status_transition: "SUCCESS / UNASSIMILATED -> SUCCESS / ASSIMILATED",
        });
      }
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }

    return {
      status: moved.length > 0 ? "ARTIFACT" : "ACK",
      event: moved.length > 0 ? "RECEIPT_MOVED" : "NO_PENDING_RECEIPTS",
      db_path: dbPath,
      queue_dir: path.resolve(options.queue),
      table: "LiveReceipt",
      columns_seen: shape.columns,
      moved_count: moved.length,
      moved,
    };
  } finally {
    db.close();
  }
}

function runDaemon(options) {
  let running = false;

  async function tick() {
    if (running) {
      logEvent({ status: "ACK", event: "SCAN_SKIPPED", message: "prior scan still running" }, options.json);
      return;
    }
    running = true;
    try {
      const result = scanOnce(options);
      logEvent(result, options.json);
    } catch (error) {
      logEvent({
        status: "BLOCKER",
        event: "SCAN_FAILED",
        message: error.message,
        stack: error.stack,
      }, options.json);
    } finally {
      running = false;
    }
  }

  logEvent({
    status: "ACK",
    event: "CRAWLER_STARTED",
    interval_ms: options.intervalMs,
    db: options.db ? path.resolve(options.db) : null,
    db_candidates: options.db ? undefined : DEFAULT_DB_CANDIDATES,
    queue_dir: path.resolve(options.queue),
  }, options.json);

  void tick();
  setInterval(tick, options.intervalMs);
}

function runSelfTest(options) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "receipt-crawler-self-test-"));
  const dbPath = path.join(root, "circulation.db");
  const queue = path.join(root, "tinkarden", "intake", "speaker_queue");
  const db = new DatabaseSync(dbPath);
  try {
    db.exec(`
      CREATE TABLE LiveReceipt (
        id TEXT PRIMARY KEY,
        mission TEXT,
        producer TEXT,
        status TEXT NOT NULL,
        ASSIMILATED INTEGER DEFAULT 0,
        receipt TEXT,
        created_at TEXT
      );
    `);
    db.prepare(`
      INSERT INTO LiveReceipt (id, mission, producer, status, ASSIMILATED, receipt, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      "SELF_TEST_RECEIPT_001",
      "BIRD_0019_SWANSON_RECEIPT_CRAWLER",
      "Swanson@Doss",
      "SUCCESS",
      0,
      "Self-test receipt body proving crawler movement.",
      new Date().toISOString()
    );
  } finally {
    db.close();
  }

  const result = scanOnce({
    ...options,
    db: dbPath,
    queue,
    limit: 5,
  });

  const verifyDb = new DatabaseSync(dbPath);
  let rows;
  try {
    rows = verifyDb.prepare("SELECT id, status, ASSIMILATED FROM LiveReceipt").all();
  } finally {
    verifyDb.close();
  }

  const files = fs.existsSync(queue)
    ? fs.readdirSync(queue).map((name) => path.join(queue, name))
    : [];

  const pass = result.status === "ARTIFACT"
    && result.moved_count === 1
    && rows.length === 1
    && Number(rows[0].ASSIMILATED) === 1
    && files.length === 1;

  return {
    status: pass ? "ARTIFACT" : "BLOCKER",
    event: pass ? "SELF_TEST_PASS" : "SELF_TEST_FAIL",
    self_test_root: root,
    db_path: dbPath,
    queue_dir: queue,
    moved_result: result,
    rows_after: rows,
    queue_files: files,
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.selfTest) {
    const result = runSelfTest(options);
    logEvent(result, options.json);
    process.exit(result.status === "ARTIFACT" ? 0 : 1);
  }

  if (options.once) {
    try {
      const result = scanOnce(options);
      logEvent(result, options.json);
      process.exit(result.status === "BLOCKER" ? 2 : 0);
    } catch (error) {
      logEvent({ status: "BLOCKER", event: "SCAN_FAILED", message: error.message, stack: error.stack }, options.json);
      process.exit(2);
    }
  }

  runDaemon(options);
}

main();
