#!/usr/bin/env node
/**
 * NMCLR first metabolism.
 *
 * Input: a proof receipt.
 * Output: a future work recommendation artifact.
 *
 * No AI, daemon, scheduler, or queue. This is a deterministic local conversion:
 * receipt -> extracted lesson -> next-action artifact.
 */
import fs from "node:fs";
import path from "node:path";
import nodeProcess from "node:process";
import { fileURLToPath } from "node:url";

const BUILD_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(BUILD_DIR, "..", "..", "..");
const DEFAULT_RECEIPT = path.join(BUILD_DIR, "receipts", "breath-receipt-packet-first-movement-001.json");
const NEXT_ACTIONS_DIR = path.join(BUILD_DIR, "next-actions");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(`${filePath}.tmp`, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(`${filePath}.tmp`, filePath);
}

function repoRelative(filePath) {
  return path.relative(REPO_ROOT, filePath).replace(/\\/g, "/");
}

function requireString(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} is required`);
  }
  return value;
}

function validateReceipt(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("receipt must be an object");
  }

  if (value.pass !== true) {
    throw new Error("receipt.pass must be true before metabolism can recommend future work");
  }

  return {
    id: requireString(value.id, "receipt.id"),
    packet_id: requireString(value.packet_id, "receipt.packet_id"),
    work_id: requireString(value.work_id, "receipt.work_id"),
    artifact_path: requireString(value.artifact_path, "receipt.artifact_path"),
    breath: value.breath && typeof value.breath === "object" ? value.breath : null
  };
}

function extractLesson(receipt) {
  return {
    lesson_id: `lesson-from-${receipt.id}`,
    statement: "A passed breath receipt proves packet-to-artifact movement can become future work.",
    evidence: {
      receipt_id: receipt.id,
      packet_id: receipt.packet_id,
      work_id: receipt.work_id,
      artifact_path: receipt.artifact_path
    }
  };
}

function createNextAction(receipt, lesson) {
  return {
    id: `next-action-from-${receipt.id}`,
    source_receipt: receipt.id,
    source_packet: receipt.packet_id,
    prior_artifact: receipt.artifact_path,
    recommendation: {
      title: "Build the next bounded NMCLR artifact from the proven breath loop",
      reason: lesson.statement,
      action_type: "write_artifact_from_packet",
      constraints: [
        "stay inside NMCLR/spec/build",
        "use receipt evidence only",
        "do not introduce router, daemon, scheduler, queue, database, UI, or bridge"
      ]
    },
    lesson,
    created_at: new Date().toISOString()
  };
}

function main() {
  const receiptPath = path.resolve(nodeProcess.argv[2] || DEFAULT_RECEIPT);
  const receipt = validateReceipt(readJson(receiptPath));
  const lesson = extractLesson(receipt);
  const nextAction = createNextAction(receipt, lesson);
  const outputPath = path.join(NEXT_ACTIONS_DIR, `${nextAction.id}.json`);

  writeJsonAtomic(outputPath, nextAction);

  console.log(JSON.stringify({
    pass: true,
    metabolism: "receipt -> lesson -> next-action artifact",
    input: repoRelative(receiptPath),
    output: repoRelative(outputPath)
  }, null, 2));
}

main();
