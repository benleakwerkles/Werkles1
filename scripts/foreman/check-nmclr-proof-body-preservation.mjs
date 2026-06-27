#!/usr/bin/env node
import { readdirSync, readFileSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "..", "..");
const writeMode = process.argv.includes("--write");
const root = path.join(repoRoot, "NMCLR", "spec", "build");

const requiredNodeEsmFiles = [
  "README.md",
  "nmclr-first-slice.mjs",
  "first_movement.mjs",
  "first_breath.mjs",
  "first_metabolism.mjs",
  "fixtures/packet-causes-action.json",
  "artifacts/first-artifact.json",
  "receipts/receipt-packet-first-slice-001.json",
];

const nclPs1Family = [
  "BUILD_SPEC_v2.3.json",
  "runnable_slices/slice_001_init.ps1",
  "runnable_slices/slice_002_validate.ncl",
  "runnable_slices/slice_003_emit.json",
  "manifest.lock",
  "packet_manifest.sig",
];

function rel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function relFromRoot(filePath) {
  return path.relative(root, filePath).replace(/\\/g, "/");
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex").toUpperCase();
}

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const relativeDir = relFromRoot(full);
    if (entry.isDirectory() && relativeDir === "receipts/github_preservation") continue;
    if (entry.isDirectory()) files.push(...walk(full));
    if (entry.isFile()) files.push(full);
  }
  return files;
}

function role(relativePath) {
  if (relativePath.endsWith(".mjs")) return "source";
  if (relativePath === "README.md") return "source";
  if (relativePath.startsWith("fixtures/")) return "fixture";
  if (relativePath.startsWith("artifacts/")) return "artifact";
  if (relativePath.startsWith("receipts/")) return "receipt";
  if (relativePath.startsWith("work/")) return "work";
  if (relativePath.startsWith("next-actions/")) return "next-action";
  if (relativePath.startsWith("routing/")) return "routing";
  return "other";
}

const fileList = walk(root).map((filePath) => {
  const bytes = readFileSync(filePath);
  const relativePath = relFromRoot(filePath);
  return {
    relative_path: relativePath,
    byte_count: statSync(filePath).size,
    sha256: sha256(bytes),
    file_type: role(relativePath),
  };
});

const present = new Set(fileList.map((f) => f.relative_path));
const missingNodeEsm = requiredNodeEsmFiles.filter((file) => !present.has(file));
const presentNodeEsm = requiredNodeEsmFiles.filter((file) => present.has(file));
const missingNclPs1 = nclPs1Family.filter((file) => !present.has(file));
const presentNclPs1 = nclPs1Family.filter((file) => present.has(file));
const branchFamily = presentNclPs1.length && presentNodeEsm.length
  ? "BOTH"
  : presentNclPs1.length
    ? "BRANCH_A_NCL_PS1"
    : presentNodeEsm.length
      ? "BRANCH_B_NODE_ESM"
      : "OTHER";
const treeHash = sha256(Buffer.from(fileList.map((file) => `${file.relative_path}\t${file.byte_count}\t${file.sha256}`).join("\n"), "utf8"));

const result = {
  check_id: "NMCLR_PROOF_BODY_PRESERVATION_CHECK",
  created_at: new Date().toISOString(),
  status: missingNodeEsm.length ? "BLOCKER" : "ARTIFACT",
  root_path: "NMCLR/spec/build",
  recursive_file_count: fileList.length,
  aggregate_tree_hash: treeHash,
  branch_family_classification: branchFamily,
  required_node_esm_present: presentNodeEsm,
  required_node_esm_missing: missingNodeEsm,
  ncl_ps1_present: presentNclPs1,
  ncl_ps1_missing: missingNclPs1,
  canonical_status: "PRESERVED_ONLY_NOT_CANONICAL",
  proof_boundary: "This check reads and hashes files only. It does not execute NMCLR and does not prove full Nerdkle life.",
  excluded_from_fingerprint: ["receipts/github_preservation"],
  files: fileList,
};

if (writeMode) {
  const outDir = path.join(root, "receipts", "github_preservation");
  mkdirSync(outDir, { recursive: true });
  const readbackPath = path.join(outDir, "NMCLR_PROOF_BODY_GITHUB_PRESERVATION_READBACK.json");
  writeFileSync(readbackPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  const receipt = {
    receipt_id: "NMCLR_PROOF_BODY_GITHUB_PRESERVATION_RECEIPT",
    mission: "NMCLR_PROOF_BODY_GITHUB_PRESERVATION",
    owner: "Swanson@Doss",
    created_at: new Date().toISOString(),
    status: result.status,
    readback_path: rel(readbackPath),
    readback_hash: sha256(readFileSync(readbackPath)),
    aggregate_tree_hash: treeHash,
    branch_family_classification: branchFamily,
    canonical_status: "PRESERVED_ONLY_NOT_CANONICAL",
    readback_method: "recursive file hash only; no NMCLR code executed",
  };
  const receiptPath = path.join(outDir, "NMCLR_PROOF_BODY_GITHUB_PRESERVATION_RECEIPT.json");
  writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  result.receipt = {
    path: rel(receiptPath),
    hash: sha256(readFileSync(receiptPath)),
    byte_count: statSync(receiptPath).size,
  };
}

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (result.status !== "ARTIFACT") process.exit(1);
