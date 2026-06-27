#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "..", "..");
const writeMode = process.argv.includes("--write");

function git(args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function sha256Text(text) {
  return createHash("sha256").update(text, "utf8").digest("hex").toUpperCase();
}

function sha256File(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex").toUpperCase();
}

function repoPath(...parts) {
  return path.join(repoRoot, ...parts);
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

const pointerPath = repoPath("foreman", "source-truth", "SOURCE_TRUTH_POINTER.json");
if (!existsSync(pointerPath)) {
  throw new Error(`Missing source truth pointer: ${rel(pointerPath)}`);
}

const pointer = JSON.parse(readFileSync(pointerPath, "utf8"));
const canonicalRemote = pointer.canonical_remote || "origin";
const canonicalRef = pointer.canonical_ref || `refs/heads/${pointer.canonical_branch || "main"}`;
const canonicalBranch = pointer.canonical_branch || "main";
const remoteUrl = git(["config", "--get", `remote.${canonicalRemote}.url`]);
const remoteLine = git(["ls-remote", canonicalRemote, canonicalRef]);
const remoteHash = remoteLine.split(/\s+/)[0] || "";
if (!remoteHash) {
  throw new Error(`Could not read ${canonicalRemote} ${canonicalRef}`);
}

const localBranch = git(["branch", "--show-current"]);
const localHead = git(["rev-parse", "HEAD"]);
const statusShort = git(["status", "--short"]);
const statusLines = statusShort ? statusShort.split(/\r?\n/) : [];
const localClean = statusLines.length === 0;
const localMatchesCanonical = localBranch === canonicalBranch && localHead === remoteHash && localClean;

const readback = {
  readback_id: "ATLAS_SOURCE_TRUTH_READBACK",
  created_at: new Date().toISOString(),
  organ: "Atlas",
  machine_context: "Doss",
  source_truth: {
    repository: pointer.canonical_repository || remoteUrl,
    remote: canonicalRemote,
    remote_url: remoteUrl,
    branch: canonicalBranch,
    ref: canonicalRef,
    remote_hash: remoteHash,
  },
  local_workspace: {
    path: repoRoot,
    branch: localBranch,
    head: localHead,
    clean: localClean,
    status_short: statusLines,
  },
  classification: localMatchesCanonical ? "LOCAL_MATCHES_GITHUB_MAIN" : "LOCAL_NONCANONICAL_WORKSPACE",
  source_truth_statement: "GitHub origin/main is canonical. Local branches and worktrees are evidence until promoted through a human gate.",
  gates: {
    local_branches_are_canonical: false,
    review_branches_are_canonical: false,
    canonical_promotion_requires_human_gate: true,
  },
  atlas_boundaries: {
    may: ["read GitHub main", "compare local state", "write readback receipts"],
    may_not: ["promote branches", "push main", "deploy", "delete", "execute production actions"],
  },
};

if (writeMode) {
  const readbackDir = repoPath("foreman", "source-truth", "readbacks");
  const receiptDir = repoPath("foreman", "source-truth", "receipts");
  mkdirSync(readbackDir, { recursive: true });
  mkdirSync(receiptDir, { recursive: true });

  const readbackPath = path.join(readbackDir, "ATLAS_SOURCE_TRUTH_READBACK.json");
  writeFileSync(readbackPath, `${JSON.stringify(readback, null, 2)}\n`, "utf8");

  const receipt = {
    receipt_id: "ATLAS_SOURCE_TRUTH_READBACK_RECEIPT",
    mission: "ATLAS_SOURCE_TRUTH_READBACK",
    owner: "Atlas",
    created_at: new Date().toISOString(),
    status: "ARTIFACT",
    readback_path: rel(readbackPath),
    readback_hash: sha256File(readbackPath),
    readback_byte_count: statSync(readbackPath).size,
    remote_hash: remoteHash,
    local_classification: readback.classification,
    canonical_readiness: "GITHUB_MAIN_ONLY",
    readback_method: "git ls-remote origin refs/heads/main + git rev-parse HEAD + git status --short",
    ben_action: "None unless promoting a candidate branch to main.",
  };

  const receiptPath = path.join(receiptDir, "ATLAS_SOURCE_TRUTH_READBACK_RECEIPT.json");
  writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  readback.receipt = {
    path: rel(receiptPath),
    hash: sha256File(receiptPath),
    byte_count: statSync(receiptPath).size,
  };
}

process.stdout.write(`${JSON.stringify(readback, null, 2)}\n`);
