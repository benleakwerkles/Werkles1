#!/usr/bin/env node
/**
 * NMCLR first movement.
 *
 * First muscle: packet -> work -> artifact.
 * Receipt is proof only; it is not a new organ.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BUILD_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(BUILD_DIR, "..", "..", "..");
const ARTIFACTS_DIR = path.join(BUILD_DIR, "artifacts");
const RECEIPTS_DIR = path.join(BUILD_DIR, "receipts");
const DEFAULT_PACKET = path.join(BUILD_DIR, "fixtures", "packet-causes-action.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function requireObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value;
}

function validatePacket(packet) {
  const root = requireObject(packet, "packet");
  const missing = [];

  if (!hasOwn(root, "id") || typeof root.id !== "string" || root.id.length === 0) {
    missing.push("packet.id");
  }

  if (!hasOwn(root, "work")) {
    missing.push("packet.work");
  }

  if (missing.length > 0) {
    throw new Error(`Missing required field(s): ${missing.join(", ")}`);
  }

  const work = requireObject(root.work, "packet.work");
  const workMissing = [];

  if (!hasOwn(work, "id") || typeof work.id !== "string" || work.id.length === 0) {
    workMissing.push("packet.work.id");
  }

  if (!hasOwn(work, "artifact_path") || typeof work.artifact_path !== "string" || work.artifact_path.length === 0) {
    workMissing.push("packet.work.artifact_path");
  }

  if (!hasOwn(work, "body")) {
    workMissing.push("packet.work.body");
  }

  if (workMissing.length > 0) {
    throw new Error(`Missing required field(s): ${workMissing.join(", ")}`);
  }

  return {
    id: root.id,
    work: {
      id: work.id,
      artifact_path: work.artifact_path,
      body: work.body
    }
  };
}

function resolveArtifactPath(artifactPath) {
  const candidate = path.isAbsolute(artifactPath)
    ? path.resolve(artifactPath)
    : path.resolve(REPO_ROOT, artifactPath);
  const relative = path.relative(ARTIFACTS_DIR, candidate);

  if (relative.startsWith("..") || path.isAbsolute(relative) || relative === "") {
    throw new Error(`Artifact path must be inside ${path.relative(REPO_ROOT, ARTIFACTS_DIR).replace(/\\/g, "/")}`);
  }

  return candidate;
}

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(`${filePath}.tmp`, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(`${filePath}.tmp`, filePath);
}

function writeReceipt(packet, artifactPath) {
  const receipt = {
    id: `receipt-${packet.id}`,
    packet_id: packet.id,
    work_id: packet.work.id,
    artifact_path: path.relative(REPO_ROOT, artifactPath).replace(/\\/g, "/"),
    pass: true,
    proof_only: true,
    muscle: "packet-work-artifact",
    created_at: new Date().toISOString()
  };
  const receiptPath = path.join(RECEIPTS_DIR, `${receipt.id}.json`);

  writeJsonAtomic(receiptPath, receipt);
  return receiptPath;
}

function main() {
  const packetPath = path.resolve(process.argv[2] || DEFAULT_PACKET);
  const packet = validatePacket(readJson(packetPath));
  const artifactPath = resolveArtifactPath(packet.work.artifact_path);

  writeJsonAtomic(artifactPath, packet.work.body);
  const receiptPath = writeReceipt(packet, artifactPath);

  console.log(JSON.stringify({
    pass: true,
    muscle: "packet -> work -> artifact",
    packet: path.relative(REPO_ROOT, packetPath).replace(/\\/g, "/"),
    artifact_path: path.relative(REPO_ROOT, artifactPath).replace(/\\/g, "/"),
    receipt_path: path.relative(REPO_ROOT, receiptPath).replace(/\\/g, "/")
  }, null, 2));
}

main();
