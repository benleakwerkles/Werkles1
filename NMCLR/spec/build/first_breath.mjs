#!/usr/bin/env node
/**
 * NMCLR first breath.
 *
 * Intake: read and validate a packet.
 * Process: write packet.work.body to the bounded artifact path.
 * Exhale: emit a proof receipt.
 */
import fs from "node:fs";
import path from "node:path";
import nodeProcess from "node:process";
import { fileURLToPath } from "node:url";

const BUILD_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(BUILD_DIR, "..", "..", "..");
const ARTIFACTS_DIR = path.join(BUILD_DIR, "artifacts");
const RECEIPTS_DIR = path.join(BUILD_DIR, "receipts");
const DEFAULT_PACKET = path.join(BUILD_DIR, "fixtures", "packet-causes-action.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function requireObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value;
}

function requireString(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} is required`);
  }
  return value;
}

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(`${filePath}.tmp`, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(`${filePath}.tmp`, filePath);
}

function repoRelative(filePath) {
  return path.relative(REPO_ROOT, filePath).replace(/\\/g, "/");
}

function resolveArtifactPath(artifactPath) {
  const candidate = path.isAbsolute(artifactPath)
    ? path.resolve(artifactPath)
    : path.resolve(REPO_ROOT, artifactPath);
  const relative = path.relative(ARTIFACTS_DIR, candidate);

  if (relative.startsWith("..") || path.isAbsolute(relative) || relative === "") {
    throw new Error(`artifact_path must stay inside ${repoRelative(ARTIFACTS_DIR)}`);
  }

  return candidate;
}

function intake(packetPath) {
  const rawPacket = requireObject(readJson(packetPath), "packet");
  const rawWork = requireObject(rawPacket.work, "packet.work");
  const packet = {
    id: requireString(rawPacket.id, "packet.id"),
    work: {
      id: requireString(rawWork.id, "packet.work.id"),
      artifact_path: requireString(rawWork.artifact_path, "packet.work.artifact_path"),
      body: rawWork.body
    }
  };

  if (!Object.prototype.hasOwnProperty.call(rawWork, "body")) {
    throw new Error("packet.work.body is required");
  }

  return {
    packet,
    event: "intake",
    packet_path: repoRelative(packetPath)
  };
}

function processPacket(intakeResult) {
  const artifactPath = resolveArtifactPath(intakeResult.packet.work.artifact_path);
  writeJsonAtomic(artifactPath, intakeResult.packet.work.body);

  return {
    event: "process",
    packet: intakeResult.packet,
    artifact_path: repoRelative(artifactPath)
  };
}

function exhale(processResult) {
  const receipt = {
    id: `breath-receipt-${processResult.packet.id}`,
    packet_id: processResult.packet.id,
    work_id: processResult.packet.work.id,
    artifact_path: processResult.artifact_path,
    pass: true,
    proof_only: true,
    breath: {
      intake: "packet accepted",
      process: "artifact written",
      exhale: "receipt emitted"
    },
    created_at: new Date().toISOString()
  };
  const receiptPath = path.join(RECEIPTS_DIR, `${receipt.id}.json`);
  writeJsonAtomic(receiptPath, receipt);

  return {
    event: "exhale",
    receipt_path: repoRelative(receiptPath),
    receipt
  };
}

function main() {
  const packetPath = path.resolve(nodeProcess.argv[2] || DEFAULT_PACKET);
  const intakeResult = intake(packetPath);
  const processResult = processPacket(intakeResult);
  const exhaleResult = exhale(processResult);

  console.log(JSON.stringify({
    pass: true,
    respiratory_organ: "intake -> process -> exhale",
    packet: intakeResult.packet_path,
    artifact: processResult.artifact_path,
    receipt: exhaleResult.receipt_path
  }, null, 2));
}

main();
