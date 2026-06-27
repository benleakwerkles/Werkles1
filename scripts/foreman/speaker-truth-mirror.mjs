#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "..", "..");
const writeMode = process.argv.includes("--write");

function repoPath(...parts) {
  return path.join(repoRoot, ...parts);
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function sha256File(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex").toUpperCase();
}

const atlasReadbackPath = repoPath("foreman", "source-truth", "readbacks", "ATLAS_SOURCE_TRUTH_READBACK.json");
if (!existsSync(atlasReadbackPath)) {
  throw new Error("Missing Atlas readback. Run `npm run truth:atlas` first.");
}

const atlas = JSON.parse(readFileSync(atlasReadbackPath, "utf8"));
const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
const entryId = `DRAFT_${ymd}-github-source-truth-is-canon`;
const speakerDir = repoPath("foreman", "speaker");
const entriesDir = repoPath("foreman", "speaker", "entries");
const receiptDir = repoPath("foreman", "speaker", "receipts");
const mirrorPath = repoPath("foreman", "speaker", "SPEAKER_SOURCE_TRUTH_MIRROR.json");
const entryPath = path.join(entriesDir, `${entryId}.md`);

const mirror = {
  mirror_id: "SPEAKER_SOURCE_TRUTH_MIRROR",
  created_at: new Date().toISOString(),
  organ: "Speaker",
  source_readback_path: rel(atlasReadbackPath),
  source_readback_hash: sha256File(atlasReadbackPath),
  canonical_statement: "GitHub origin/main is the canonical source truth. Local branches and worktrees are evidence until promoted through a human gate.",
  remote_hash: atlas.source_truth.remote_hash,
  local_classification: atlas.classification,
  warnings: [
    "Do not let session memory outrank GitHub readback.",
    "Do not call a local branch canonical without promotion proof.",
    "Do not confuse preservation receipts with canonical promotion.",
    "Do not make Ben repeat source-truth routing rules."
  ],
  speaker_boundaries: {
    may: ["mirror rationale", "write draft causal entries", "warn on drift"],
    may_not: ["execute", "route", "ratify", "promote", "delete history"],
  },
};

let entry_status = "NOT_WRITTEN";
if (writeMode) {
  mkdirSync(speakerDir, { recursive: true });
  mkdirSync(entriesDir, { recursive: true });
  mkdirSync(receiptDir, { recursive: true });
  writeFileSync(mirrorPath, `${JSON.stringify(mirror, null, 2)}\n`, "utf8");

  if (!existsSync(entryPath)) {
    const entry = `---
id: ${entryId}
status: DRAFT
title: GitHub Source Truth Is Canon
created_at: ${new Date().toISOString().slice(0, 10)}
source_notes:
  - foreman/source-truth/SOURCE_TRUTH_POLICY.md
  - foreman/source-truth/readbacks/ATLAS_SOURCE_TRUTH_READBACK.json
tags:
  - source-truth
  - atlas
  - speaker
warning_triggers:
  - local branch called canonical
  - session memory outranks file reality
  - preservation mistaken for promotion
related_entries: []
---

## Event

Ben corrected the operating model: source truth must live on GitHub, not in local branches or machine-specific memory.

## Decision

GitHub \`origin/main\` is the canonical source truth. Review branches may carry candidate truth. Local branches and worktrees are evidence only.

## Why it happened

Aeyes were drifting across local branches, screenshots, receipts, and remembered manifests. Atlas must read GitHub truth. Speaker must mirror the rationale so the correction survives context loss.

## Lesson learned

Preservation is not promotion. Readback is not canon. Canon requires GitHub bytes plus a human gate.

## Future warning

If an Aeye says a local branch, local receipt, preview URL, or archive copy is canonical, Speaker should warn: \`SOURCE_TRUTH_REVIEW_REQUIRED\`.
`;
    writeFileSync(entryPath, entry, "utf8");
    entry_status = "CREATED";
  } else {
    entry_status = "EXISTS_UNCHANGED";
  }

  const receipt = {
    receipt_id: "SPEAKER_SOURCE_TRUTH_MIRROR_RECEIPT",
    mission: "SPEAKER_SOURCE_TRUTH_MIRROR",
    owner: "Speaker",
    created_at: new Date().toISOString(),
    status: "ARTIFACT",
    mirror_path: rel(mirrorPath),
    mirror_hash: sha256File(mirrorPath),
    mirror_byte_count: statSync(mirrorPath).size,
    draft_entry_path: rel(entryPath),
    draft_entry_status: entry_status,
    atlas_readback_path: rel(atlasReadbackPath),
    atlas_readback_hash: sha256File(atlasReadbackPath),
    canonical_readiness: "MIRROR_ONLY_NOT_PROMOTION",
  };
  const receiptPath = path.join(receiptDir, "SPEAKER_SOURCE_TRUTH_MIRROR_RECEIPT.json");
  writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  mirror.receipt = {
    path: rel(receiptPath),
    hash: sha256File(receiptPath),
    byte_count: statSync(receiptPath).size,
  };
  mirror.draft_entry = {
    path: rel(entryPath),
    status: entry_status,
  };
}

process.stdout.write(`${JSON.stringify(mirror, null, 2)}\n`);
