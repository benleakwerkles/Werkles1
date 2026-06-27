#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const READBACK_DIR = path.join(REPO_ROOT, "foreman", "source-truth", "readbacks", "nervous-system");
const RECEIPT_DIR = path.join(REPO_ROOT, "foreman", "source-truth", "receipts", "nervous-system");

const REQUIRED_FILES = [
  "tinkarden/package.json",
  "tinkarden/package-lock.json",
  "tinkarden/nervous_system/README.md",
  "tinkarden/nervous_system/swateyes.js",
  "tinkarden/nervous_system/swateyes.test.js",
  "tinkarden/nervous_system/fleyes.js",
  "tinkarden/nervous_system/ender_apoptosis.js",
  "foreman/source-truth/NEXT_NERDKLE_NERVOUS_SYSTEM_PACKET.json",
  "scripts/foreman/check-nerdkle-nervous-system-organs.mjs",
];

function repoRelative(targetPath) {
  return path.relative(REPO_ROOT, targetPath).replaceAll(path.sep, "/");
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex").toUpperCase();
}

function readText(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
}

function hashFile(relativePath) {
  const absolutePath = path.join(REPO_ROOT, relativePath);
  const buffer = fs.readFileSync(absolutePath);
  return {
    relative_path: relativePath.replaceAll(path.sep, "/"),
    byte_count: buffer.length,
    sha256: sha256(buffer),
  };
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || REPO_ROOT,
    encoding: "utf8",
    shell: false,
  });
  return {
    command: [command, ...args].join(" "),
    cwd: options.cwd ? repoRelative(options.cwd) : ".",
    status: result.status === 0 ? "PASS" : "FAIL",
    exit_code: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}

function parseLastJson(stdout) {
  const text = String(stdout || "").trim();
  if (!text) return null;
  const start = text.lastIndexOf("\n{");
  const candidate = start >= 0 ? text.slice(start + 1) : text;
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

function writeJson(targetPath, value) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  const buffer = fs.readFileSync(targetPath);
  return {
    path: repoRelative(targetPath),
    byte_count: buffer.length,
    sha256: sha256(buffer),
  };
}

function main() {
  const createdAt = new Date().toISOString();
  const missingFiles = REQUIRED_FILES.filter((relativePath) => !fs.existsSync(path.join(REPO_ROOT, relativePath)));
  const fileManifest = REQUIRED_FILES
    .filter((relativePath) => fs.existsSync(path.join(REPO_ROOT, relativePath)))
    .map(hashFile);

  const syntaxChecks = [
    "tinkarden/nervous_system/swateyes.js",
    "tinkarden/nervous_system/swateyes.test.js",
    "tinkarden/nervous_system/fleyes.js",
    "tinkarden/nervous_system/ender_apoptosis.js",
    "scripts/foreman/check-nerdkle-nervous-system-organs.mjs",
  ].map((relativePath) => run("node", ["--check", relativePath]));

  const swateyesTest = run("node", ["tinkarden/nervous_system/swateyes.test.js"]);
  const fleyesSelfTest = run("node", [
    "tinkarden/nervous_system/fleyes.js",
    "--self-test",
    "--output",
    path.join(REPO_ROOT, "foreman", "source-truth", "readbacks", "nervous-system", "FLEYES_SELF_TEST_FRICTIONAL_HEAT.json"),
  ]);
  const enderSelfTest = run("node", ["tinkarden/nervous_system/ender_apoptosis.js", "--self-test"]);

  const swateyesParsed = parseLastJson(swateyesTest.stdout);
  const fleyesParsed = parseLastJson(fleyesSelfTest.stdout);
  const enderParsed = parseLastJson(enderSelfTest.stdout);

  const swateyesFracture = swateyesParsed?.results?.some((row) =>
    row.name === "destructive delete is FRACTURE" &&
    row.expected === "FRACTURE" &&
    row.actual === "FRACTURE" &&
    row.pass === true
  );
  const fleyesFlags = fleyesParsed?.result?.summary?.stalled_count === 1 &&
    fleyesParsed?.result?.summary?.churn_count === 1;
  const enderDeleted = enderParsed?.result?.cache?.deleted_rows?.length === 1 &&
    enderParsed?.result?.cache?.deleted_rows?.[0]?.id === "DRY_RUN_STALE_001";
  const enderQuarantined = enderParsed?.result?.quarantine?.quarantine_count === 1;
  const enderDocsGate = enderParsed?.result?.cache?.skipped_rows?.some((row) =>
    row.id === "DOCS_DRY_RUN_001" &&
    row.reason === "HUMAN_GATE_REQUIRED_FOR_DOCS"
  );

  const status = missingFiles.length === 0 &&
    syntaxChecks.every((check) => check.status === "PASS") &&
    swateyesTest.status === "PASS" &&
    fleyesSelfTest.status === "PASS" &&
    enderSelfTest.status === "PASS" &&
    swateyesFracture &&
    fleyesFlags &&
    enderDeleted &&
    enderQuarantined &&
    enderDocsGate
    ? "ARTIFACT"
    : "BLOCKER";

  const readback = {
    readback_id: "NERDKLE_NERVOUS_SYSTEM_ORGANS_READBACK",
    created_at: createdAt,
    status,
    source_truth_rule: "GitHub main remains canonical. This branch preserves local nervous-system organ candidates for review.",
    canonical_status: "PRESERVED_ONLY_NOT_CANONICAL",
    files: fileManifest,
    missing_files: missingFiles,
    organ_results: {
      swateyes: {
        status: swateyesTest.status,
        destructive_delete_is_fracture: Boolean(swateyesFracture),
      },
      fleyes: {
        status: fleyesSelfTest.status,
        stalled_count: fleyesParsed?.result?.summary?.stalled_count ?? null,
        churn_count: fleyesParsed?.result?.summary?.churn_count ?? null,
      },
      ender_apoptosis: {
        status: enderSelfTest.status,
        deleted_stale_dry_run: Boolean(enderDeleted),
        quarantined_old_packet: Boolean(enderQuarantined),
        docs_human_gate_guard: Boolean(enderDocsGate),
      },
    },
    checks: [...syntaxChecks, swateyesTest, fleyesSelfTest, enderSelfTest],
    proof_boundary: "Self-tests prove deterministic behavior against generated fixtures. Production movement requires real circulation.db, world_state.json, and production outbox readback.",
  };

  const readbackArtifact = writeJson(
    path.join(READBACK_DIR, "NERDKLE_NERVOUS_SYSTEM_ORGANS_READBACK.json"),
    readback,
  );

  const receipt = {
    receipt_id: "NERDKLE_NERVOUS_SYSTEM_ORGANS_PRESERVATION_RECEIPT",
    mission: "Preserve Swateyes, Fleyes, and Ender apoptosis as auditable GitHub review artifacts",
    owner: "Swanson@Doss",
    created_at: new Date().toISOString(),
    status,
    readback_path: readbackArtifact.path,
    readback_sha256: readbackArtifact.sha256,
    organs_preserved: [
      "tinkarden/nervous_system/swateyes.js",
      "tinkarden/nervous_system/fleyes.js",
      "tinkarden/nervous_system/ender_apoptosis.js",
    ],
    next_packet_path: "foreman/source-truth/NEXT_NERDKLE_NERVOUS_SYSTEM_PACKET.json",
    proof_boundary: readback.proof_boundary,
    missing_for_go: [
      "real C:/tinkarden/server/circulation.db or configured production ledger",
      "real Wormeyes world_state.json",
      "production outbox readback",
      "human review before canonical promotion",
    ],
  };

  const receiptArtifact = writeJson(
    path.join(RECEIPT_DIR, "NERDKLE_NERVOUS_SYSTEM_ORGANS_PRESERVATION_RECEIPT.json"),
    receipt,
  );

  console.log(JSON.stringify({
    ...receipt,
    receipt_path: receiptArtifact.path,
    receipt_sha256: receiptArtifact.sha256,
  }, null, 2));

  process.exit(status === "ARTIFACT" ? 0 : 1);
}

main();
