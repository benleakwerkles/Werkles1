#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const RECEIPT_DIR = path.join(REPO_ROOT, "foreman", "source-truth", "receipts", "receipt-crawler");
const READBACK_DIR = path.join(REPO_ROOT, "foreman", "source-truth", "readbacks", "receipt-crawler");

const REQUIRED_FILES = [
  "scripts/foreman/crawler.js",
  "scripts/foreman/start-receipt-crawler.ps1",
  "scripts/foreman/check-receipt-crawler-preservation.mjs",
  "package.json",
  "foreman/source-truth/NEXT_RECEIPT_CRAWLER_PACKET.json",
];

const DEFAULT_DB_CANDIDATES = [
  path.join(REPO_ROOT, "circulation.db"),
  path.join(REPO_ROOT, "data", "organism", "circulation.db"),
  path.join(path.parse(REPO_ROOT).root, "tinkarden", "circulation.db"),
];

function repoRelative(targetPath) {
  return path.relative(REPO_ROOT, targetPath).replaceAll(path.sep, "/");
}

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex").toUpperCase();
}

function hashFile(relativePath) {
  const absolutePath = path.join(REPO_ROOT, relativePath);
  const buffer = fs.readFileSync(absolutePath);
  return {
    relative_path: relativePath.replaceAll(path.sep, "/"),
    byte_count: buffer.length,
    sha256: sha256Buffer(buffer),
  };
}

function stableJson(value) {
  return JSON.stringify(value, Object.keys(value).sort(), 2);
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex").toUpperCase();
}

function writeJson(targetPath, value) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  const text = fs.readFileSync(targetPath, "utf8");
  return {
    path: repoRelative(targetPath),
    byte_count: Buffer.byteLength(text, "utf8"),
    sha256: sha256Text(text),
  };
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    shell: false,
  });
  return {
    command: [command, ...args].join(" "),
    status: result.status === 0 ? "PASS" : "FAIL",
    exit_code: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}

function parseSelfTest(stdout) {
  const lines = stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const lastJson = [...lines].reverse().find((line) => line.startsWith("{"));
  if (!lastJson) return null;
  try {
    return JSON.parse(lastJson);
  } catch {
    return null;
  }
}

function main() {
  const createdAt = new Date().toISOString();
  const missingFiles = REQUIRED_FILES.filter((relativePath) => !fs.existsSync(path.join(REPO_ROOT, relativePath)));
  const fileManifest = REQUIRED_FILES
    .filter((relativePath) => fs.existsSync(path.join(REPO_ROOT, relativePath)))
    .map(hashFile);

  const nodeCheck = run("node", ["--check", "scripts/foreman/crawler.js"]);
  const psParse = run("powershell", [
    "-NoProfile",
    "-Command",
    "$tokens = $null; $errors = $null; [System.Management.Automation.Language.Parser]::ParseFile('scripts\\foreman\\start-receipt-crawler.ps1', [ref]$tokens, [ref]$errors) | Out-Null; if ($errors.Count -gt 0) { $errors | ForEach-Object { $_.Message }; exit 1 } else { 'PS_PARSE_OK' }",
  ]);
  const selfTest = run("node", ["scripts/foreman/crawler.js", "--self-test"]);
  const selfTestParsed = parseSelfTest(selfTest.stdout);

  const defaultDbReadback = DEFAULT_DB_CANDIDATES.map((candidate) => ({
    path: candidate,
    exists: fs.existsSync(candidate),
  }));

  const liveDbFound = defaultDbReadback.some((candidate) => candidate.exists);
  const selfTestMoved = selfTestParsed?.status === "ARTIFACT"
    && selfTestParsed?.moved_result?.moved_count === 1
    && Number(selfTestParsed?.rows_after?.[0]?.ASSIMILATED) === 1;

  const status = missingFiles.length === 0
    && nodeCheck.status === "PASS"
    && psParse.status === "PASS"
    && selfTest.status === "PASS"
    && selfTestMoved
    ? "ARTIFACT"
    : "BLOCKER";

  const readback = {
    readback_id: "RECEIPT_CRAWLER_PRESERVATION_READBACK",
    created_at: createdAt,
    status,
    canonical_status: "PRESERVED_ONLY_NOT_CANONICAL",
    source_truth_rule: "GitHub main remains canonical. This branch preserves a crawler candidate for review.",
    files: fileManifest,
    missing_files: missingFiles,
    default_db_candidates: defaultDbReadback,
    live_ledger_status: liveDbFound ? "DB_PRESENT_UNVERIFIED" : "DB_MISSING",
    self_test_summary: selfTestParsed
      ? {
          status: selfTestParsed.status,
          event: selfTestParsed.event,
          moved_count: selfTestParsed.moved_result?.moved_count ?? null,
          queue_files: selfTestParsed.queue_files ?? [],
          rows_after: selfTestParsed.rows_after ?? [],
        }
      : null,
    checks: [nodeCheck, psParse, selfTest],
    proof_boundary: "Self-test proves crawler mechanics against a synthetic local SQLite ledger. It does not prove a production LiveReceipt moved until circulation.db exists and logs RECEIPT_MOVED.",
  };

  const readbackArtifact = writeJson(
    path.join(READBACK_DIR, "RECEIPT_CRAWLER_PRESERVATION_READBACK.json"),
    readback,
  );

  const receipt = {
    receipt_id: "RECEIPT_CRAWLER_PRESERVATION_RECEIPT",
    mission: "Preserve receipt crawler candidate on GitHub review branch",
    owner: "Swanson@Doss",
    created_at: new Date().toISOString(),
    status,
    readback_path: readbackArtifact.path,
    readback_sha256: readbackArtifact.sha256,
    crawler_path: "scripts/foreman/crawler.js",
    launcher_path: "scripts/foreman/start-receipt-crawler.ps1",
    next_packet_path: "foreman/source-truth/NEXT_RECEIPT_CRAWLER_PACKET.json",
    live_ledger_status: readback.live_ledger_status,
    proof_boundary: readback.proof_boundary,
    missing_for_go: liveDbFound
      ? ["production LiveReceipt row movement proof"]
      : ["production circulation.db path", "production LiveReceipt row movement proof"],
  };

  const receiptArtifact = writeJson(
    path.join(RECEIPT_DIR, "RECEIPT_CRAWLER_PRESERVATION_RECEIPT.json"),
    receipt,
  );

  const output = {
    ...receipt,
    receipt_path: receiptArtifact.path,
    receipt_sha256: receiptArtifact.sha256,
  };

  console.log(JSON.stringify(output, null, 2));
  process.exit(status === "ARTIFACT" ? 0 : 1);
}

main();
