#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
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

function repoPath(...parts) {
  return path.join(repoRoot, ...parts);
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function sha256File(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex").toUpperCase();
}

function classifyBranch(branch) {
  if (branch === "main") return "CANONICAL_SOURCE_TRUTH";
  if (branch.startsWith("source-truth/")) return "SOURCE_TRUTH_REVIEW";
  if (branch.startsWith("book/")) return "MANUSCRIPT_REVIEW";
  if (branch.startsWith("audit/")) return "AUDIT_EVIDENCE";
  if (branch.startsWith("preview/")) return "PREVIEW_EVIDENCE";
  if (branch.startsWith("salvage/")) return "PRESERVATION_EVIDENCE";
  if (branch.startsWith("rescue/")) return "PRESERVATION_EVIDENCE";
  if (branch.startsWith("snapshot/")) return "PRESERVATION_EVIDENCE";
  if (branch.startsWith("cursor/")) return "CURSOR_CANDIDATE";
  return "REMOTE_BRANCH_CANDIDATE";
}

const pointerPath = repoPath("foreman", "source-truth", "SOURCE_TRUTH_POINTER.json");
const pointer = JSON.parse(readFileSync(pointerPath, "utf8"));
const remote = pointer.canonical_remote || "origin";
const remoteUrl = git(["config", "--get", `remote.${remote}.url`]);
const lines = git(["ls-remote", "--heads", remote]).split(/\r?\n/).filter(Boolean);
const branches = lines
  .map((line) => {
    const [hash, ref] = line.split(/\s+/);
    const branch = ref.replace("refs/heads/", "");
    return {
      branch,
      ref,
      hash,
      classification: classifyBranch(branch),
      canonical: branch === pointer.canonical_branch,
    };
  })
  .sort((a, b) => {
    if (a.canonical !== b.canonical) return a.canonical ? -1 : 1;
    return a.branch.localeCompare(b.branch);
  });

const canonicalBranch = branches.find((b) => b.canonical);
const index = {
  index_id: "ATLAS_GITHUB_BRANCH_INDEX",
  created_at: new Date().toISOString(),
  organ: "Atlas",
  source_truth_statement: "GitHub origin/main is canonical. Other GitHub branches are candidate, audit, preview, or preservation evidence until human-gated promotion.",
  remote,
  remote_url: remoteUrl,
  canonical_branch: pointer.canonical_branch,
  canonical_hash: canonicalBranch?.hash || null,
  branch_count: branches.length,
  branches,
  local_only_rule: "If a file or branch is not represented in GitHub, it is local evidence only and cannot be called source truth.",
};

if (writeMode) {
  const readbackDir = repoPath("foreman", "source-truth", "readbacks");
  const receiptDir = repoPath("foreman", "source-truth", "receipts");
  mkdirSync(readbackDir, { recursive: true });
  mkdirSync(receiptDir, { recursive: true });

  const indexPath = path.join(readbackDir, "ATLAS_GITHUB_BRANCH_INDEX.json");
  writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");

  const receipt = {
    receipt_id: "ATLAS_GITHUB_BRANCH_INDEX_RECEIPT",
    mission: "ATLAS_GITHUB_BRANCH_INDEX",
    owner: "Atlas",
    created_at: new Date().toISOString(),
    status: "ARTIFACT",
    index_path: rel(indexPath),
    index_hash: sha256File(indexPath),
    index_byte_count: statSync(indexPath).size,
    canonical_branch: pointer.canonical_branch,
    canonical_hash: canonicalBranch?.hash || null,
    branch_count: branches.length,
    readback_method: "git ls-remote --heads origin",
    canonical_readiness: "GITHUB_MAIN_ONLY",
  };

  const receiptPath = path.join(receiptDir, "ATLAS_GITHUB_BRANCH_INDEX_RECEIPT.json");
  writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  index.receipt = {
    path: rel(receiptPath),
    hash: sha256File(receiptPath),
    byte_count: statSync(receiptPath).size,
  };
}

process.stdout.write(`${JSON.stringify(index, null, 2)}\n`);
