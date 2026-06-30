#!/usr/bin/env node
/**
 * Nerdkle Doctor.
 *
 * Proves operating objects are paired with receipts and events.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const NERDKLE_ROOT = path.join(REPO_ROOT, "data", "organism", "nerdkle");
const OBJECTS_DIR = path.join(NERDKLE_ROOT, "objects");
const RECEIPTS_DIR = path.join(NERDKLE_ROOT, "receipts");
const PLANS_DIR = path.join(NERDKLE_ROOT, "plans");
const EVENTS_PATH = path.join(NERDKLE_ROOT, "events.jsonl");
const EXECUTION_PACKETS_PATH = path.join(NERDKLE_ROOT, "execution_packets.jsonl");
const STATUS_PATH = path.join(NERDKLE_ROOT, "status.json");

function repoRelative(filePath) {
  return path.relative(REPO_ROOT, filePath).replace(/\\/g, "/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonDir(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      const filePath = path.join(directory, name);
      return {
        path: repoRelative(filePath),
        value: readJson(filePath)
      };
    });
}

function readJsonl(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line)];
      } catch {
        return [];
      }
    });
}

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(`${filePath}.tmp`, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(`${filePath}.tmp`, filePath);
}

const objects = readJsonDir(OBJECTS_DIR);
const receipts = readJsonDir(RECEIPTS_DIR);
const plans = fs.existsSync(PLANS_DIR) ? fs.readdirSync(PLANS_DIR).filter((name) => name.endsWith(".md")) : [];
const events = readJsonl(EVENTS_PATH);
const packetEvents = readJsonl(EXECUTION_PACKETS_PATH);
const receiptByObject = new Map(receipts.map((receipt) => [receipt.value.object_id, receipt]));
const eventByObject = new Map(events.map((event) => [event.object_id, event]));
function stageForObject(object) {
  if (object.status?.stage === "completed" || object.status?.stage === "blocked") return object.status.stage;
  if ((object.unresolved_fields ?? []).length > 0) return "needs_clarification";
  const gates = object.human_gates ?? [];
  if (gates.some((gate) => gate !== "none")) return "waiting_on_human_gate";
  return "ready_for_execution";
}

const objectReports = objects.map((object) => {
  const receipt = receiptByObject.get(object.value.id);
  const event = eventByObject.get(object.value.id);
  const stage = stageForObject(object.value);
  const checks = [
    { name: "artifact_created_present", pass: Boolean(object.value.artifact_created) },
    { name: "execution_owner_present", pass: Boolean(object.value.execution_owner) },
    { name: "human_gates_present", pass: Array.isArray(object.value.human_gates) && object.value.human_gates.length > 0 },
    { name: "receipt_exists", pass: Boolean(receipt), path: receipt?.path ?? null },
    { name: "event_exists", pass: Boolean(event) },
    { name: "stage_classified", pass: Boolean(stage), stage },
    {
      name: "clarification_state_valid",
      pass: stage !== "needs_clarification" || (object.value.unresolved_fields ?? []).length > 0
    },
    {
      name: "completed_object_has_execution_receipt",
      pass: stage !== "completed" || receipts.some((item) => item.value.id?.startsWith(`execution_receipt_${object.value.id}_`))
    }
  ];
  return {
    object_id: object.value.id,
    path: object.path,
    stage,
    pass: checks.every((check) => check.pass),
    checks
  };
});
const owners = new Set(objects.map((object) => object.value.execution_owner || "Unassigned"));

const status = {
  ok: true,
  pass: objectReports.every((object) => object.pass)
    && events
      .filter((event) => event.event_type === "nerdkle_execution_plan_created")
      .every((event) => event.plan_path && fs.existsSync(path.join(REPO_ROOT, event.plan_path))),
  checked_at: new Date().toISOString(),
  counts: {
    objects: objects.length,
    receipts: receipts.length,
    plans: plans.length,
    events: events.length,
    packet_events: packetEvents.length,
    lineage_events: events.length + packetEvents.length,
    owners: owners.size,
    execution_receipts: receipts.filter((receipt) => receipt.value.id?.startsWith("execution_receipt_")).length,
    passing_objects: objectReports.filter((object) => object.pass).length,
    failing_objects: objectReports.filter((object) => !object.pass).length
  },
  objects: objectReports
};

writeJsonAtomic(STATUS_PATH, status);
console.log(JSON.stringify({
  pass: status.pass,
  status_path: repoRelative(STATUS_PATH),
  counts: status.counts
}, null, 2));
