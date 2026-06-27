#!/usr/bin/env node
/**
 * NMCLR first slice.
 *
 * Muscle: a packet causes a local action.
 * Breath: each run is intake -> output -> receipt.
 * Metabolism: receipts are converted into next work.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BUILD_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_PACKET = path.join(BUILD_DIR, "fixtures", "packet-causes-action.json");
const RECEIPTS_DIR = path.join(BUILD_DIR, "receipts");
const WORK_DIR = path.join(BUILD_DIR, "work");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(`${filePath}.tmp`, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(`${filePath}.tmp`, filePath);
}

function intake(packetPath) {
  const packet = readJson(packetPath);
  const missing = ["id", "cause", "action"].filter((key) => !packet[key]);

  if (missing.length > 0) {
    throw new Error(`Packet missing required fields: ${missing.join(", ")}`);
  }

  if (packet.action.type !== "write_work_item") {
    throw new Error(`Unsupported action type: ${packet.action.type}`);
  }

  return packet;
}

function output(packet) {
  const workItem = {
    id: packet.action.work.id,
    title: packet.action.work.title,
    status: "ready",
    caused_by_packet: packet.id,
    muscle: "packet-causes-action",
    created_at: new Date().toISOString()
  };

  const outputPath = path.join(WORK_DIR, `${workItem.id}.json`);
  writeJson(outputPath, workItem);

  return {
    kind: "work_item_written",
    path: path.relative(BUILD_DIR, outputPath).replace(/\\/g, "/"),
    work_item: workItem
  };
}

function receipt(packet, outputResult) {
  const receiptDoc = {
    id: `receipt-${packet.id}`,
    packet_id: packet.id,
    pass: true,
    breath: {
      intake: "packet accepted",
      output: outputResult.kind,
      receipt: "receipt written"
    },
    output: outputResult,
    created_at: new Date().toISOString()
  };

  const receiptPath = path.join(RECEIPTS_DIR, `${receiptDoc.id}.json`);
  writeJson(receiptPath, receiptDoc);

  return {
    path: path.relative(BUILD_DIR, receiptPath).replace(/\\/g, "/"),
    doc: receiptDoc
  };
}

function metabolize(receiptResult) {
  const nextWork = {
    id: "next-work-from-receipt",
    title: "Promote NMCLR first slice into next build task",
    status: "queued",
    source_receipt: receiptResult.path,
    metabolism: "receipt-converted-into-next-work",
    created_at: new Date().toISOString()
  };

  const nextWorkPath = path.join(WORK_DIR, "next-work-from-receipt.json");
  writeJson(nextWorkPath, nextWork);

  return {
    kind: "next_work_written",
    path: path.relative(BUILD_DIR, nextWorkPath).replace(/\\/g, "/"),
    next_work: nextWork
  };
}

function main() {
  const packetPath = path.resolve(process.argv[2] || DEFAULT_PACKET);
  const packet = intake(packetPath);
  const outputResult = output(packet);
  const receiptResult = receipt(packet, outputResult);
  const metabolismResult = metabolize(receiptResult);

  const summary = {
    pass: true,
    first_slice: {
      muscle: outputResult.kind,
      breath: receiptResult.doc.breath,
      metabolism: metabolismResult.kind
    },
    files: {
      packet: path.relative(BUILD_DIR, packetPath).replace(/\\/g, "/"),
      output: outputResult.path,
      receipt: receiptResult.path,
      next_work: metabolismResult.path
    }
  };

  console.log(JSON.stringify(summary, null, 2));
}

main();
