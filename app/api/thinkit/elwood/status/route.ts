import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type JsonRecord = Record<string, unknown>;

const DATA_DIR = path.join(process.cwd(), "data", "thinkit");
const STATUS_JSON_PATH = path.join(DATA_DIR, "elwood_status.json");
const STATUS_MD_PATH = path.join(DATA_DIR, "thinkit_status.md");
const STATUS_LOG_PATH = path.join(DATA_DIR, "thinkit_status.log");
const BRAINBOOT_MD_PATH = path.join(DATA_DIR, "brainboot.md");
const NEXT_THREE_PATH = path.join(DATA_DIR, "next_three_projects.json");
const MOMENTUM_STATE_PATH = path.join(DATA_DIR, "momentum_state.json");
const DECISIONS_PATH = path.join(DATA_DIR, "next_three_decisions.jsonl");

const SPEAKER_ROOT = process.env.SPEAKER_ROOT || "C:\\speaker";
const SPEAKER_THINKIT_STATUS_PATH = path.join(SPEAKER_ROOT, "bootloader", "templates", "THINKIT_STATUS.md");
const SPEAKER_BRAINBOOT_PATH = path.join(SPEAKER_ROOT, "brainboot", "brainboot.md");
const SPEAKER_ELWOOD_JSON_PATH = path.join(SPEAKER_ROOT, "bootloader", "templates", "ELWOOD_THINKIT_STATUS.json");

const SWANSON_RELAY_BASE = process.env.SWANSON_RELAY_BASE_URL || "http://127.0.0.1:3339";

function nowIso() {
  return new Date().toISOString();
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" ? (value as JsonRecord) : null;
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function asText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function valueAt(source: unknown, pathParts: string[]) {
  let current = source;
  for (const key of pathParts) {
    if (!current || typeof current !== "object" || !(key in current)) return null;
    current = (current as JsonRecord)[key];
  }
  return current;
}

function sha256Text(text: string) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

async function sha256File(filePath: string) {
  const buffer = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function readJsonIfExists(filePath: string): Promise<JsonRecord | null> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as JsonRecord;
  } catch {
    return null;
  }
}

async function readJsonlTail(filePath: string, limit = 5) {
  try {
    const text = await fs.readFile(filePath, "utf8");
    return text
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-limit)
      .map((line) => JSON.parse(line) as JsonRecord)
      .reverse();
  } catch {
    return [];
  }
}

async function fetchJsonSafe(endpoint: string): Promise<JsonRecord> {
  const url = new URL(endpoint, SWANSON_RELAY_BASE);
  try {
    const response = await fetch(url, { cache: "no-store" });
    const text = await response.text();
    const data = text ? (JSON.parse(text) as JsonRecord) : {};
    return {
      ok: response.ok,
      status_code: response.status,
      url: url.toString(),
      data
    };
  } catch (error) {
    return {
      ok: false,
      status_code: 0,
      url: url.toString(),
      error: error instanceof Error ? error.message : "Fetch failed"
    };
  }
}

function firstRecord(...values: unknown[]) {
  for (const value of values) {
    const record = asRecord(value);
    if (record) return record;
  }
  return null;
}

function buildHumanStatus(snapshot: JsonRecord) {
  const coordinates = asRecord(snapshot.current_coordinates) ?? {};
  const relay = asRecord(snapshot.relay) ?? {};
  const book = asRecord(snapshot.book) ?? {};
  const workflow = asRecord(snapshot.workflow) ?? {};
  const proofGaps = asArray(snapshot.proof_gaps).map((item) => `- ${asText(item, "UNKNOWN_PROOF_GAP")}`).join("\n");
  const doozers = asArray(workflow.doozer_targets).map((item) => asText(item, "")).filter(Boolean).join(", ");
  const reviewers = asArray(workflow.review_targets).map((item) => asText(item, "")).filter(Boolean).join(", ");

  return [
    "---",
    `ELWOOD_STATUS_RENDER_ID: ${asText(snapshot.status_id, "UNKNOWN")}`,
    `RENDERED_AT: ${asText(snapshot.generated_at, nowIso())}`,
    "SOURCE: ThinkIt deterministic Elwood status exporter",
    "SPEAKER_IS_ACTIVE_LLM: false",
    "---",
    "",
    "# ThinkIt Status Log",
    "",
    "Elwood is the faceless Operator clerk: it does not think, decide, or speak for an Aeye. It writes the current ThinkIt state to durable files so Skybro, Petra, and the rest of the mesh can read the same room when they wake up.",
    "",
    "## Current Coordinates",
    `- Active book focus: ${asText(coordinates.active_book_focus, "Unknown")}`,
    `- Active code focus: ${asText(coordinates.active_code_focus, "Unknown")}`,
    `- ThinkIt last known location: ${asText(coordinates.thinkit_last_known_location, "Unknown")}`,
    `- Source truth folder: ${asText(coordinates.book_source_truth, "Unknown")}`,
    "",
    "## Relay Reality",
    `- Round trips completed: ${asNumber(relay.round_trip_proven)}/${asNumber(relay.target_count)}`,
    `- Waiting for receiver proof: ${asNumber(relay.waiting_for_receiver)}`,
    `- Queued for thread bridge: ${asNumber(relay.queued_for_bridge)}`,
    `- Sent to Codex thread: ${asNumber(relay.sent_to_thread)}`,
    `- Blocked: ${asNumber(relay.blocked)}`,
    `- Bridge heartbeat: ${asText(relay.bridge_status, "UNKNOWN")} (${asText(relay.bridge_schedule, "UNKNOWN_SCHEDULE")})`,
    "",
    "## Momentum Workflow",
    `- Doozers: ${doozers || "No Doozers read back"}`,
    `- Reviewer cousins: ${reviewers || "No reviewers read back"}`,
    `- Current lane: ${asText(coordinates.active_project_lane, "Unknown")}`,
    `- Current question: ${asText(coordinates.active_project_question, "Unknown")}`,
    "",
    "## Book Workflow",
    `- Chapter count: ${asNumber(book.completed_chapter_count)}/${asNumber(book.chapter_count)}`,
    `- Next unsent chapter: ${asText(book.next_unsent_chapter, "Unknown")}`,
    `- Next unfinished chapter: ${asText(book.next_uncompleted_chapter, "Unknown")}`,
    "",
    "## Proof Gaps",
    proofGaps || "- No proof gaps recorded.",
    "",
    "## Files Aeyes Should Read",
    `- Repo status: ${STATUS_MD_PATH}`,
    `- Repo Brainboot anchor: ${BRAINBOOT_MD_PATH}`,
    `- Speaker status mirror: ${SPEAKER_THINKIT_STATUS_PATH}`,
    `- Speaker Brainboot anchor: ${SPEAKER_BRAINBOOT_PATH}`,
    "",
    "## Rules",
    "- Local packet creation is not delivery.",
    "- SENT is not completion.",
    "- Receiver proof means RECEIVED, then COMPLETED or BLOCKER, then origin dash readback.",
    "- Brainboot exists to stop Ben from re-teaching the room."
  ].join("\n");
}

function buildBrainboot(snapshot: JsonRecord) {
  const coordinates = asRecord(snapshot.current_coordinates) ?? {};
  const workflow = asRecord(snapshot.workflow) ?? {};
  const relay = asRecord(snapshot.relay) ?? {};

  return [
    "# Brainboot Project Anchor",
    "",
    "## Core Directive",
    "We are building Nerdkle / ThinkIt: a distributed asynchronous organism and command surface that moves packets, proves receipt, preserves memory, and helps write the book without making Ben the message bus.",
    "",
    "## Naming Boundary",
    "If an Aeye says Harvey, treat it as a local alias until Ben canonizes that rename. The repo and current build still use Nerdkle, ThinkIt, Speaker, and TinkerDen names.",
    "",
    "## Current Coordinates",
    `- Active book focus: ${asText(coordinates.active_book_focus, "Unknown")}`,
    `- Active code focus: ${asText(coordinates.active_code_focus, "Unknown")}`,
    `- Current project lane: ${asText(coordinates.active_project_lane, "Unknown")}`,
    `- Current project question: ${asText(coordinates.active_project_question, "Unknown")}`,
    `- Book source truth: ${asText(coordinates.book_source_truth, "Unknown")}`,
    `- ThinkIt dashboard: ${asText(coordinates.thinkit_last_known_location, "Unknown")}`,
    "",
    "## Workflow",
    `- Doozers propose and shape work: ${asArray(workflow.doozer_targets).map((item) => asText(item, "")).filter(Boolean).join(", ")}`,
    `- Reviewer cousins sign off, modify, or kill drift: ${asArray(workflow.review_targets).map((item) => asText(item, "")).filter(Boolean).join(", ")}`,
    "- ThinkIt routes and records proof.",
    "- Speaker / Brainboot stores the file-backed state needed for session restart.",
    "",
    "## Relay Proof State",
    `- Completed round trips: ${asNumber(relay.round_trip_proven)}/${asNumber(relay.target_count)}`,
    `- Waiting for receiver proof: ${asNumber(relay.waiting_for_receiver)}`,
    `- Queued for bridge: ${asNumber(relay.queued_for_bridge)}`,
    "",
    "## Non-Negotiables",
    "- Do not call SENT success.",
    "- Do not ask Ben to carry context already present in these files.",
    "- Return ACK / BLOCKER / ARTIFACT with evidence.",
    "- If you cannot see ThinkIt directly, read the status mirror and name the missing proof."
  ].join("\n");
}

async function buildElwoodStatus() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  const [nextThree, momentumState, recentDecisions, coverageRead, threadBridgeRead, bookCourierRead, originReturnRead] = await Promise.all([
    readJsonIfExists(NEXT_THREE_PATH),
    readJsonIfExists(MOMENTUM_STATE_PATH),
    readJsonlTail(DECISIONS_PATH, 6),
    fetchJsonSafe("/v1/relay/coverage"),
    fetchJsonSafe("/v1/relay/thread_bridge/status?limit=80"),
    fetchJsonSafe("/v1/book/courier_status?limit=12"),
    fetchJsonSafe("/v1/relay/origin_return")
  ]);

  const coverage = asRecord(coverageRead.data) ?? {};
  const threadBridge = asRecord(threadBridgeRead.data) ?? {};
  const bookCourier = asRecord(bookCourierRead.data) ?? {};
  const originReturn = asRecord(originReturnRead.data) ?? {};
  const coverageSummary = asRecord(coverage.summary) ?? {};
  const actuator = firstRecord(coverage.actuator, threadBridge.actuator) ?? {};
  const nextThreeWorkflow = asRecord(nextThree?.workflow) ?? asRecord(momentumState?.workflow) ?? {};
  const lanes = asArray(nextThree?.lanes).map(asRecord).filter((item): item is JsonRecord => Boolean(item));
  const activeLaneId = asText((recentDecisions[0] as JsonRecord | undefined)?.lane_id, "nerdkle");
  const activeLane = lanes.find((lane) => asText(lane.lane_id, "") === activeLaneId) ?? lanes.find((lane) => asText(lane.lane_id, "") === "nerdkle") ?? lanes[0] ?? {};
  const latestReturn = firstRecord(valueAt(originReturn, ["origin_return", "latest_return"]), originReturn.latest_return);

  const queued = asArray(threadBridge.queued).length;
  const sent = asArray(threadBridge.sent).length;
  const blocked = asArray(threadBridge.blocked).length;
  const proofGaps = [
    asNumber(coverageSummary.round_trip_proven) === 0 ? "No Aeye has returned a completed round-trip receipt in the current coverage readback." : "",
    queued > 0 ? `${queued} packet(s) are queued for the Codex thread bridge; queued is not delivery.` : "",
    asNumber(coverageSummary.waiting_for_receiver) > 0 ? `${asNumber(coverageSummary.waiting_for_receiver)} target(s) are waiting for receiver-side proof.` : "",
    blocked > 0 ? `${blocked} thread bridge item(s) are blocked.` : ""
  ].filter(Boolean);

  const snapshot: JsonRecord = {
    status: "ELWOOD_THINKIT_STATUS_READY",
    status_id: `ELWOOD_THINKIT_STATUS_${Date.now()}_${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
    generated_at: nowIso(),
    source: "ThinkIt deterministic Elwood status exporter",
    current_coordinates: {
      active_book_focus: asText(valueAt(bookCourier, ["next_uncompleted_chapter", "title"]) ?? valueAt(bookCourier, ["next_unsent_chapter", "title"]), "No active chapter read back"),
      active_code_focus: "ThinkIt relay, Elwood status mirrors, Doozer/reviewer momentum loop, and round-trip proof clarity.",
      active_project_lane: asText(activeLane.project, "Nerdkle"),
      active_project_question: asText(activeLane.question, "Nerdkle: what makes the organism more real today?"),
      thinkit_last_known_location: "http://10.1.10.8:3342/thinkit",
      book_source_truth: "https://github.com/benleakwerkles/Werkles1/tree/main/source-truth-plan/references/betsy_desktop_nerdkle_the_book"
    },
    workflow: nextThreeWorkflow,
    relay: {
      target_count: asNumber(coverageSummary.target_count),
      round_trip_proven: asNumber(coverageSummary.round_trip_proven),
      waiting_for_receiver: asNumber(coverageSummary.waiting_for_receiver),
      file_inbox_waiting: asNumber(coverageSummary.file_inbox_waiting),
      returned_blocker: asNumber(coverageSummary.returned_blocker),
      held: asNumber(coverageSummary.held),
      local_only: asNumber(coverageSummary.local_only),
      queued_for_bridge: queued,
      sent_to_thread: sent,
      blocked,
      bridge_status: asText(actuator.status, "UNKNOWN"),
      bridge_schedule: asText(actuator.schedule, "UNKNOWN"),
      latest_return_status: asText(latestReturn?.answer_status ?? latestReturn?.status, "NO_RETURN_READBACK"),
      latest_return_packet: asText(latestReturn?.packet_id, "NO_RETURN_PACKET")
    },
    book: {
      chapter_count: asNumber(bookCourier.chapter_count),
      completed_chapter_count: asNumber(bookCourier.completed_chapter_count),
      active_packet_count: asNumber(bookCourier.active_packet_count),
      next_unsent_chapter: asText(valueAt(bookCourier, ["next_unsent_chapter", "title"]), "No next unsent chapter read back"),
      next_uncompleted_chapter: asText(valueAt(bookCourier, ["next_uncompleted_chapter", "title"]), "No next unfinished chapter read back"),
      source_repo_url: asText(bookCourier.source_repo_url, "No book source URL read back")
    },
    recent_decisions: recentDecisions,
    proof_gaps: proofGaps,
    raw_readback: {
      coverage_status: asText(coverage.status, "NO_COVERAGE_STATUS"),
      thread_bridge_status: asText(threadBridge.status, "NO_THREAD_BRIDGE_STATUS"),
      book_courier_status: asText(bookCourier.status, "NO_BOOK_COURIER_STATUS"),
      origin_return_status: asText(originReturn.status, "NO_ORIGIN_RETURN_STATUS")
    },
    output_paths: {
      repo_json: STATUS_JSON_PATH,
      repo_markdown: STATUS_MD_PATH,
      repo_log: STATUS_LOG_PATH,
      repo_brainboot: BRAINBOOT_MD_PATH,
      speaker_markdown: SPEAKER_THINKIT_STATUS_PATH,
      speaker_json: SPEAKER_ELWOOD_JSON_PATH,
      speaker_brainboot: SPEAKER_BRAINBOOT_PATH
    }
  };

  const humanStatus = buildHumanStatus(snapshot);
  const brainboot = buildBrainboot(snapshot);
  const jsonText = `${JSON.stringify(snapshot, null, 2)}\n`;

  await Promise.all([
    fs.writeFile(STATUS_JSON_PATH, jsonText, "utf8"),
    fs.writeFile(STATUS_MD_PATH, `${humanStatus}\n`, "utf8"),
    fs.writeFile(BRAINBOOT_MD_PATH, `${brainboot}\n`, "utf8"),
    fs.appendFile(STATUS_LOG_PATH, `${JSON.stringify({ status_id: snapshot.status_id, generated_at: snapshot.generated_at, sha256: sha256Text(jsonText) })}\n`, "utf8"),
    fs.mkdir(path.dirname(SPEAKER_THINKIT_STATUS_PATH), { recursive: true }).then(() => fs.writeFile(SPEAKER_THINKIT_STATUS_PATH, `${humanStatus}\n`, "utf8")),
    fs.mkdir(path.dirname(SPEAKER_ELWOOD_JSON_PATH), { recursive: true }).then(() => fs.writeFile(SPEAKER_ELWOOD_JSON_PATH, jsonText, "utf8")),
    fs.mkdir(path.dirname(SPEAKER_BRAINBOOT_PATH), { recursive: true }).then(() => fs.writeFile(SPEAKER_BRAINBOOT_PATH, `${brainboot}\n`, "utf8"))
  ]);

  return {
    ...snapshot,
    hashes: {
      repo_json_sha256: await sha256File(STATUS_JSON_PATH),
      repo_markdown_sha256: await sha256File(STATUS_MD_PATH),
      repo_brainboot_sha256: await sha256File(BRAINBOOT_MD_PATH),
      speaker_markdown_sha256: await sha256File(SPEAKER_THINKIT_STATUS_PATH),
      speaker_json_sha256: await sha256File(SPEAKER_ELWOOD_JSON_PATH),
      speaker_brainboot_sha256: await sha256File(SPEAKER_BRAINBOOT_PATH)
    }
  };
}

export async function GET() {
  try {
    return NextResponse.json(await buildElwoodStatus());
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: "ELWOOD_THINKIT_STATUS_BLOCKED",
        error: error instanceof Error ? error.message : "Elwood status export failed",
        output_paths: {
          repo_json: STATUS_JSON_PATH,
          repo_markdown: STATUS_MD_PATH,
          repo_brainboot: BRAINBOOT_MD_PATH,
          speaker_markdown: SPEAKER_THINKIT_STATUS_PATH,
          speaker_brainboot: SPEAKER_BRAINBOOT_PATH
        }
      },
      { status: 500 }
    );
  }
}
