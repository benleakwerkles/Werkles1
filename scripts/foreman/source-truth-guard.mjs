#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "..", "..");
const requireMainMatch = process.argv.includes("--require-main-match");

function git(args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function fail(message, detail = {}) {
  process.stdout.write(`${JSON.stringify({
    guard_id: "SOURCE_TRUTH_GUARD",
    status: "BLOCKER",
    message,
    ...detail,
  }, null, 2)}\n`);
  process.exit(1);
}

const pointerPath = path.join(repoRoot, "foreman", "source-truth", "SOURCE_TRUTH_POINTER.json");
if (!existsSync(pointerPath)) {
  fail("Missing foreman/source-truth/SOURCE_TRUTH_POINTER.json");
}

const pointer = JSON.parse(readFileSync(pointerPath, "utf8"));
const policyFailures = [];
if (pointer.local_branches_are_canonical !== false) policyFailures.push("local_branches_are_canonical must be false");
if (pointer.review_branches_are_canonical !== false) policyFailures.push("review_branches_are_canonical must be false");
if (pointer.promotion_requires_human_gate !== true) policyFailures.push("promotion_requires_human_gate must be true");
if ((pointer.canonical_remote || "") !== "origin") policyFailures.push("canonical_remote must be origin");
if ((pointer.canonical_branch || "") !== "main") policyFailures.push("canonical_branch must be main");
if (policyFailures.length) {
  fail("Source truth pointer violates policy", { policyFailures });
}

const canonicalRemote = pointer.canonical_remote;
const canonicalRef = pointer.canonical_ref || "refs/heads/main";
const remoteHash = git(["ls-remote", canonicalRemote, canonicalRef]).split(/\s+/)[0] || "";
if (!remoteHash) fail(`Cannot read ${canonicalRemote} ${canonicalRef}`);

const localBranch = git(["branch", "--show-current"]);
const localHead = git(["rev-parse", "HEAD"]);
const statusShort = git(["status", "--short"]);
const statusLines = statusShort ? statusShort.split(/\r?\n/) : [];
const clean = statusLines.length === 0;
const localMatchesMain = localBranch === pointer.canonical_branch && localHead === remoteHash && clean;
const classification = localMatchesMain ? "CANONICAL_MATCH" : "NONCANONICAL_WORKSPACE";

const result = {
  guard_id: "SOURCE_TRUTH_GUARD",
  status: requireMainMatch && !localMatchesMain ? "BLOCKER" : "ACK",
  created_at: new Date().toISOString(),
  canonical: {
    remote: canonicalRemote,
    ref: canonicalRef,
    branch: pointer.canonical_branch,
    remote_hash: remoteHash,
  },
  local: {
    branch: localBranch,
    head: localHead,
    clean,
    status_short: statusLines,
  },
  classification,
  canonical_claim_allowed: localMatchesMain,
  candidate_claim_allowed: !localMatchesMain,
  rule: "GitHub origin/main is source truth. Local/review branches are evidence until human-gated promotion.",
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (requireMainMatch && !localMatchesMain) process.exit(1);
