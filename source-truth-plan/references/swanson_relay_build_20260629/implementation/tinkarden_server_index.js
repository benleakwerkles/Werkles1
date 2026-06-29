#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");
const fastify = require("fastify")({ logger: true });
const registerFeralContractRoutes = require("./feral_contract_routes");

const TINKARDEN_ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.TINKARDEN_API_PORT || 3339);
const HOST = process.env.TINKARDEN_API_HOST || "0.0.0.0";
const SPEAKER_RAW_INBOX = process.env.SPEAKER_RAW_INBOX || "C:\\speaker\\receipts\\raw\\inbox";
const SPEAKER_INGEST_LOG = process.env.SPEAKER_INGEST_LOG || "C:\\speaker\\logs\\ingest.jsonl";
const SPEAKERCTL_PATH = process.env.SPEAKERCTL_PATH || "C:\\speaker\\bin\\speakerctl.js";
const SPEAKER_ACTION_CAPSULE_INBOX = process.env.SPEAKER_ACTION_CAPSULE_INBOX || "C:\\speaker\\action_capsules\\inbox";
const STREAM_LOG_TAIL_BYTES = Number(process.env.STREAM_LOG_TAIL_BYTES || 65536);
const GIT_BASH_PATH = process.env.GIT_BASH_PATH || "C:\\Program Files\\Git\\bin\\bash.exe";
const GIT_SNAPSHOT_SCRIPT_PATH = process.env.GIT_SNAPSHOT_SCRIPT_PATH || "C:\\speaker\\bin\\git-snapshot.sh";
const CURRENT_REPO_STATE_PATH = process.env.CURRENT_REPO_STATE_PATH || "C:\\speaker\\bootloader\\templates\\CURRENT_REPO_STATE.md";
const SKYBRO_BOOTPACK_PATH = process.env.SKYBRO_BOOTPACK_PATH || "C:\\speaker\\bootpacks\\out\\Skybro.Betsy.BOOTPACK.md";
const PETRA_BOOTPACK_PATH = process.env.PETRA_BOOTPACK_PATH || "C:\\speaker\\bootpacks\\out\\Petra.Betsy.NERDKLE_BRAINBOOT.BOOTPACK.md";
const BRAINBOOT_ROOT = process.env.BRAINBOOT_ROOT || "C:\\speaker\\brainboot";
const BRAINBOOT_OUTBOX_DIR = path.join(BRAINBOOT_ROOT, "outbox");
const BRAINBOOT_RECEIPTS_DIR = path.join(BRAINBOOT_ROOT, "receipts");
const BRAINBOOT_LEDGER_PATH = path.join(BRAINBOOT_ROOT, "ledger.jsonl");
const BRAINBOOT_PUBLIC_BASE_URL = process.env.BRAINBOOT_PUBLIC_BASE_URL || `http://10.1.10.8:${PORT}`;
const AEYE_RELAY_ROOT = process.env.AEYE_RELAY_ROOT || "C:\\speaker\\aeye_relay";
const AEYE_RELAY_OUTBOX_DIR = path.join(AEYE_RELAY_ROOT, "outbox");
const AEYE_RELAY_RECEIPTS_DIR = path.join(AEYE_RELAY_ROOT, "receipts");
const AEYE_RELAY_LEDGER_PATH = path.join(AEYE_RELAY_ROOT, "ledger.jsonl");
const AEYE_RELAY_PROOFS_DIR = path.join(AEYE_RELAY_ROOT, "proofs");
const THINKIT_MERGE_DIR = path.join(AEYE_RELAY_ROOT, "merge");
const THINKIT_RELAY_MERGE_CONTRACT_PATH = path.join(THINKIT_MERGE_DIR, "THINKIT_RELAY_MERGE_CONTRACT.json");
const AEYE_RELAY_E2E_PROOF_PATH = path.join(AEYE_RELAY_ROOT, "proofs", "latest_e2e_proof.json");
const AEYE_RELAY_CHASER_STATUS_PATH = path.join(AEYE_RELAY_ROOT, "chaser", "chaser_status.json");
const AEYE_RELAY_CHASER_SCRIPT_PATH = path.join(TINKARDEN_ROOT, "nervous_system", "relay_chaser.js");
const ORIGIN_DASH_RETURN_DIR = path.join(AEYE_RELAY_ROOT, "origin_dash");
const ORIGIN_DASH_RETURN_LEDGER_PATH = path.join(ORIGIN_DASH_RETURN_DIR, "return_ledger.jsonl");
const ORIGIN_DASH_LATEST_RETURN_PATH = path.join(ORIGIN_DASH_RETURN_DIR, "latest_return_readback.json");
const ORIGIN_DASH_ACTIONABLE_RETURNS_PATH = path.join(ORIGIN_DASH_RETURN_DIR, "actionable_returns.json");
const ORIGIN_DASH_OPERATOR_DECISIONS_PATH = path.join(ORIGIN_DASH_RETURN_DIR, "operator_decisions.jsonl");
const NERDKLE_OPERATOR_INTAKE_DIR = path.join(AEYE_RELAY_ROOT, "operator_intake");
const NERDKLE_OPERATOR_INTAKE_LEDGER_PATH = path.join(NERDKLE_OPERATOR_INTAKE_DIR, "operator_intake_ledger.jsonl");
const SWANSON_OUTPUTS_DIR = process.env.SWANSON_OUTPUTS_DIR || "C:\\Users\\BenLeak\\Documents\\Codex\\2026-06-20\\to-swanson-doss-mission-branch-truth\\outputs";
const SWANSON_BUTTON_REPAIR_RECEIPT_PATH = path.join(SWANSON_OUTPUTS_DIR, "SWANSON_DOSS_MOMENT_VELOCITY_BUTTON_REPAIR_RECEIPT.json");
const BOOK_SOURCE_TRUTH_ROOT = process.env.BOOK_SOURCE_TRUTH_ROOT || "C:\\wt\\stbook\\source-truth-plan\\references\\betsy_desktop_nerdkle_the_book";
const BOOK_SOURCE_TRUTH_REPO_URL = process.env.BOOK_SOURCE_TRUTH_REPO_URL || "https://github.com/benleakwerkles/Werkles1/tree/main/source-truth-plan/references/betsy_desktop_nerdkle_the_book";
const AEYE_THREAD_BRIDGE_DIR = path.join(AEYE_RELAY_ROOT, "thread_bridge");
const AEYE_THREAD_BRIDGE_QUEUE_DIR = path.join(AEYE_THREAD_BRIDGE_DIR, "queue");
const AEYE_THREAD_BRIDGE_SENT_DIR = path.join(AEYE_THREAD_BRIDGE_DIR, "sent");
const AEYE_THREAD_BRIDGE_BLOCKED_DIR = path.join(AEYE_THREAD_BRIDGE_DIR, "blocked");
const AEYE_THREAD_BRIDGE_LEDGER_PATH = path.join(AEYE_THREAD_BRIDGE_DIR, "thread_bridge_ledger.jsonl");
const AEYE_THREAD_TARGETS_PATH = path.join(AEYE_THREAD_BRIDGE_DIR, "target_threads.json");
const AEYE_FILE_INBOX_DIR = path.join(AEYE_RELAY_ROOT, "file_inbox");
const AEYE_FILE_INBOX_LEDGER_PATH = path.join(AEYE_FILE_INBOX_DIR, "file_inbox_ledger.jsonl");
const AEYE_RECEIVER_BOOTSTRAP_DIR = path.join(AEYE_RELAY_ROOT, "receiver_bootstrap");
const AEYE_RECEIVER_BOOTSTRAP_LEDGER_PATH = path.join(AEYE_RECEIVER_BOOTSTRAP_DIR, "receiver_bootstrap_ledger.jsonl");
const AEYE_THREAD_BINDING_DIR = path.join(AEYE_RELAY_ROOT, "thread_binding");
const AEYE_THREAD_BINDING_LEDGER_PATH = path.join(AEYE_THREAD_BINDING_DIR, "thread_binding_ledger.jsonl");
const CODEX_THREAD_BRIDGE_AUTOMATION_PATH = process.env.CODEX_THREAD_BRIDGE_AUTOMATION_PATH || "C:\\Users\\BenLeak\\.codex\\automations\\nerdkle-aeye-thread-bridge\\automation.toml";
const DEFAULT_AEYE_THREAD_TARGETS = {
  "Skybro.Betsy": "019f0c7b-7571-7451-9e68-82b1b9fd79a3",
  "Petra.Betsy": "019f0c81-701b-7fb1-b768-b705126442be",
};
const AEYE_THREAD_TARGET_LABELS = {
  "Skybro.Betsy": "Skybro@Betsy LIVE Relay Receiver",
  "Petra.Betsy": "Petra@Betsy LIVE Relay Receiver",
};
const AEYE_HOME_THREAD_POLICY = {
  status: "HOME_THREAD_REUSE_REQUIRED",
  name: "Sticky receiver chats",
  rule: "Reuse the mapped receiver thread for each Aeye until an explicit rotation receipt exists.",
  rotation_gate: "A new thread id is blocked unless route_rotation_requested is true and rotation_reason explains why the old chat degraded.",
  operator_meaning: "ThinkIt should not create new Aeye chats by default. Packets continue inside the same receiver chat so that chat can carry working memory.",
};

function existsWithHashTarget(filePath) {
  return {
    path: filePath,
    exists: fs.existsSync(filePath),
  };
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex").toUpperCase();
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return fallback;
  }
}

function fileReadback(filePath) {
  if (!fs.existsSync(filePath)) {
    return {
      path: filePath,
      exists: false,
    };
  }
  const raw = fs.readFileSync(filePath);
  const stat = fs.statSync(filePath);
  return {
    path: filePath,
    exists: true,
    byte_count: raw.length,
    sha256: sha256Buffer(raw),
    modified_at: stat.mtime.toISOString(),
  };
}

function parseJsonOutput(stdout) {
  try {
    return stdout ? JSON.parse(stdout) : null;
  } catch {
    return null;
  }
}

function runSpeakerctlJson(args) {
  try {
    const stdout = execFileSync(process.execPath, [SPEAKERCTL_PATH, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    });
    return {
      ok: true,
      stdout,
      result: parseJsonOutput(stdout),
    };
  } catch (error) {
    const stdout = error.stdout ? String(error.stdout) : "";
    return {
      ok: false,
      stdout,
      result: parseJsonOutput(stdout),
      error: error.message,
    };
  }
}

function runGitSnapshot() {
  if (!fs.existsSync(GIT_BASH_PATH)) {
    const error = new Error(`Git Bash not found at ${GIT_BASH_PATH}`);
    error.statusCode = 500;
    throw error;
  }
  if (!fs.existsSync(GIT_SNAPSHOT_SCRIPT_PATH)) {
    const error = new Error(`Git snapshot script not found at ${GIT_SNAPSHOT_SCRIPT_PATH}`);
    error.statusCode = 500;
    throw error;
  }
  const stdout = execFileSync(GIT_BASH_PATH, [GIT_SNAPSHOT_SCRIPT_PATH], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
    maxBuffer: 1024 * 1024,
  });
  const verify = runSpeakerctlJson(["verify-current-repo-state"]);
  return {
    status: verify.ok ? "REPO_STATE_REFRESHED" : "REPO_STATE_REFRESHED_VERIFY_FAILED",
    snapshot_stdout: stdout,
    verify_result: verify.result,
    verify_error: verify.ok ? null : verify.error,
    template: fileReadback(CURRENT_REPO_STATE_PATH),
  };
}

function runRelayChaserOnce() {
  if (!fs.existsSync(AEYE_RELAY_CHASER_SCRIPT_PATH)) {
    const error = new Error(`Relay chaser script not found at ${AEYE_RELAY_CHASER_SCRIPT_PATH}`);
    error.statusCode = 500;
    throw error;
  }
  const stdout = execFileSync(process.execPath, [AEYE_RELAY_CHASER_SCRIPT_PATH, "--once"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
    maxBuffer: 1024 * 1024,
  });
  const chaser = parseJsonOutput(stdout) || readRelayChaserStatus();
  return {
    status: "RELAY_CHASER_RAN",
    stdout,
    chaser,
    chaser_status_path: AEYE_RELAY_CHASER_STATUS_PATH,
    chaser_status_file: fileReadback(AEYE_RELAY_CHASER_STATUS_PATH),
    rule: "This runs the file-backed chaser once. It does not fabricate receiver receipts.",
  };
}

async function readSpeakerIngestTail(limit = 20) {
  const boundedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const readback = {
    status: "OK",
    source_path: SPEAKER_INGEST_LOG,
    generated_at: new Date().toISOString(),
    tail_bytes: STREAM_LOG_TAIL_BYTES,
    events: [],
    invalid_lines: [],
  };

  let handle;
  try {
    const stat = await fs.promises.stat(SPEAKER_INGEST_LOG);
    readback.byte_count = stat.size;
    readback.modified_at = stat.mtime.toISOString();

    const start = Math.max(0, stat.size - STREAM_LOG_TAIL_BYTES);
    const length = stat.size - start;
    const buffer = Buffer.alloc(length);
    handle = await fs.promises.open(SPEAKER_INGEST_LOG, "r");
    if (length > 0) {
      await handle.read(buffer, 0, length, start);
    }

    const lines = buffer.toString("utf8").split(/\r?\n/).filter(Boolean);
    const completeLines = start > 0 ? lines.slice(1) : lines;
    const tailLines = completeLines.slice(-boundedLimit);

    readback.events = tailLines.map((line, index) => {
      try {
        const parsed = JSON.parse(line);
        return {
          line_index: completeLines.length - tailLines.length + index,
          raw: line,
          parsed,
          receipt_id: parsed.receipt_id || "UNKNOWN",
          packet_id: parsed.packet_id || "UNKNOWN",
          event: parsed.event || "UNKNOWN",
          status: parsed.status || "UNKNOWN",
          logged_at: parsed.logged_at || parsed.started_at || null,
        };
      } catch (error) {
        readback.invalid_lines.push({
          line_index: completeLines.length - tailLines.length + index,
          error: error.message,
          raw: line,
        });
        return {
          line_index: completeLines.length - tailLines.length + index,
          raw: line,
          parsed: null,
          receipt_id: "UNKNOWN",
          packet_id: "UNKNOWN",
          event: "INVALID_JSONL",
          status: "INVALID",
          logged_at: null,
        };
      }
    });

    return readback;
  } catch (error) {
    return {
      status: "MISSING_OR_UNREADABLE",
      source_path: SPEAKER_INGEST_LOG,
      generated_at: new Date().toISOString(),
      error: error.message,
      events: [],
      invalid_lines: [],
    };
  } finally {
    if (handle) {
      await handle.close();
    }
  }
}

function safeReceiptStem(value) {
  return String(value || "receipt").replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 120);
}

const BOOK_CHAPTER_NUMBER_WORDS = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
  SIX: 6,
  SEVEN: 7,
  EIGHT: 8,
  NINE: 9,
  TEN: 10,
  ELEVEN: 11,
  TWELVE: 12,
  THIRTEEN: 13,
  FOURTEEN: 14,
  FIFTEEN: 15,
  SIXTEEN: 16,
  SEVENTEEN: 17,
  EIGHTEEN: 18,
  NINETEEN: 19,
  TWENTY: 20,
  THIRTY: 30,
};

function bookRepoUrlFor(relativePath) {
  return `${BOOK_SOURCE_TRUTH_REPO_URL}/${relativePath.split(path.sep).map(encodeURIComponent).join("/")}`;
}

function parseBookChapterNumber(name) {
  const upper = String(name || "").toUpperCase();
  if (upper.includes("FOREWORD")) return 0;
  const chapterMatch = upper.match(/CHAPTER\s+([A-Z]+)(?:[-\s]+([A-Z]+))?/);
  if (chapterMatch) {
    const first = BOOK_CHAPTER_NUMBER_WORDS[chapterMatch[1]] || 0;
    const second = BOOK_CHAPTER_NUMBER_WORDS[chapterMatch[2]] || 0;
    if (first || second) return first + second;
  }
  if (upper.includes("ESCAPE VELOCITY")) return 2;
  if (upper.includes("COST OF FORGETTING")) return 5;
  if (upper.includes("INHERITANCE")) return 6;
  if (upper.includes("RATCHET")) return 7;
  if (upper.includes("DEAD CONTINUE")) return 8;
  if (upper.includes("SOVEREIGNTY")) return 9;
  if (upper.includes("HEALTH")) return 10;
  if (upper.includes("COOPERATION")) return 11;
  if (upper.includes("CONSCIOUSNESS")) return 12;
  if (upper.includes("CAPACITY")) return 13;
  if (upper.includes("OPPORTUNITY")) return 14;
  if (upper.includes("HOPEFUL FUTURE")) return 16;
  if (upper.includes("HOPE")) return 15;
  if (upper.includes("OPERATOR PRINCIPLE")) return 17;
  if (upper.includes("GARDEN") && upper.includes("RELIGION")) return 18;
  if (upper.includes("TINKULARITY")) return 19;
  if (upper.includes("THE TEST") || upper.includes("REALITY GETS A VOTE")) return 20;
  if (upper.includes("THE LOOP")) return 21;
  if (upper.includes("THE END")) return 22;
  return 900;
}

function isBookChapterCandidate(fileName) {
  const lower = String(fileName || "").toLowerCase();
  const ext = path.extname(lower);
  if (![".docx", ".md", ".pdf"].includes(ext)) return false;
  return (
    lower.includes("foreword")
    || lower.startsWith("chapter ")
    || lower.includes("escape velocity")
    || lower.includes("cost of forgetting")
    || lower.includes("dead continue")
    || lower.includes("operator principle")
    || lower.includes("garden")
    || lower.includes("religion")
    || lower.includes("tinkularity")
    || lower.includes("hopeful future")
    || lower === "the end.docx"
  );
}

function bookChapterTitle(fileName, chapterNumber) {
  const base = path.basename(fileName, path.extname(fileName))
    .replace(/\s+\(\d+\)$/u, " copy")
    .replaceAll("_", " ")
    .replace(/\s+/g, " ")
    .trim();
  if (chapterNumber === 0) return base;
  if (chapterNumber > 0 && chapterNumber < 900 && !/^Chapter\s/i.test(base)) {
    return `Chapter ${chapterNumber} - ${base}`;
  }
  return base;
}

function listBookChapters() {
  if (!fs.existsSync(BOOK_SOURCE_TRUTH_ROOT)) {
    const error = new Error(`Book source truth path not found: ${BOOK_SOURCE_TRUTH_ROOT}`);
    error.statusCode = 404;
    throw error;
  }
  return fs.readdirSync(BOOK_SOURCE_TRUTH_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isFile() && isBookChapterCandidate(entry.name))
    .map((entry) => {
      const absolutePath = path.join(BOOK_SOURCE_TRUTH_ROOT, entry.name);
      const relativePath = path.relative(BOOK_SOURCE_TRUTH_ROOT, absolutePath);
      const stat = fs.statSync(absolutePath);
      const raw = fs.readFileSync(absolutePath);
      const chapterNumber = parseBookChapterNumber(entry.name);
      const chapterId = safeReceiptStem(`${String(chapterNumber).padStart(3, "0")}_${path.basename(entry.name, path.extname(entry.name))}_${path.extname(entry.name).slice(1)}`);
      const variantMatch = entry.name.match(/\((\d+)\)\.[^.]+$/);
      const variantSort = variantMatch ? Number(variantMatch[1]) : 0;
      const baseSortName = entry.name.replace(/\s+\(\d+\)(\.[^.]+)$/u, "$1").toLowerCase();
      return {
        chapter_id: chapterId,
        chapter_number: chapterNumber < 900 ? chapterNumber : null,
        sort_key: `${String(chapterNumber).padStart(3, "0")}_${baseSortName}_${String(variantSort).padStart(3, "0")}`,
        title: bookChapterTitle(entry.name, chapterNumber),
        filename: entry.name,
        extension: path.extname(entry.name).slice(1).toLowerCase(),
        local_path: absolutePath,
        repo_path: `source-truth-plan/references/betsy_desktop_nerdkle_the_book/${relativePath.replaceAll(path.sep, "/")}`,
        github_url: bookRepoUrlFor(relativePath),
        byte_count: raw.length,
        sha256: sha256Buffer(raw),
        modified_at: stat.mtime.toISOString(),
      };
    })
    .sort((a, b) => a.sort_key.localeCompare(b.sort_key));
}

function loadBookChapter(chapterIdOrFileName) {
  const requested = String(chapterIdOrFileName || "").trim();
  const chapters = listBookChapters();
  const chapter = chapters.find((item) => item.chapter_id === requested || item.filename === requested);
  if (!chapter) {
    const error = new Error(`Book chapter not found: ${requested}`);
    error.statusCode = 404;
    throw error;
  }
  return { chapter, chapters };
}

function dispatchBookChapterPacket(request, payload) {
  const target = String(payload.target || "Skybro.Betsy").trim();
  const { chapter, chapters } = loadBookChapter(payload.chapter_id || payload.filename);
  const editingMode = String(payload.editing_mode || "chapter_edit").trim();
  const operatorNote = String(payload.operator_note || "").trim();
  const packet = createRelayPacket(request, {
    packet_type: "BOOK_CHAPTER_EDIT",
    target,
    title: `Book chapter edit: ${chapter.title}`,
    evidence_path: chapter.local_path,
    body: [
      "MISSION: Edit one Nerdkle book chapter from source truth without asking Ben to paste the chapter.",
      "",
      `Chapter: ${chapter.title}`,
      `Chapter id: ${chapter.chapter_id}`,
      `Source filename: ${chapter.filename}`,
      `Source repo path: ${chapter.repo_path}`,
      `GitHub source-truth URL: ${chapter.github_url}`,
      `Doss local source path: ${chapter.local_path}`,
      `Source sha256: ${chapter.sha256}`,
      `Byte count: ${chapter.byte_count}`,
      `Editing mode: ${editingMode}`,
      operatorNote ? `Operator note: ${operatorNote}` : "Operator note: none",
      "",
      "Return requirements:",
      "1. Write RECEIVED when this packet is visible in your Aeye thread or inbox.",
      "2. Read the referenced source-truth chapter from GitHub or local repo path if accessible.",
      "3. Return COMPLETED with an editing report, suggested next action, and any source-access gaps.",
      "4. Return BLOCKER if you cannot access the chapter; include exact path/URL/proof gap.",
      "5. Do not call SENT success.",
    ].join("\n"),
    producer: "Book Courier Handeye@Doss",
    destination: "Skybro Book Editing Queue",
  });
  return {
    status: "BOOK_CHAPTER_PACKET_DISPATCHED",
    target,
    chapter,
    chapter_count: chapters.length,
    relay_packet: packet,
    delivery_state: packet.thread_bridge?.status || "NOT_QUEUED",
    receiver_chat: packet.thread_bridge?.home_thread_title || target,
    receiver_thread_id: packet.thread_bridge?.thread_id || null,
    operator_meaning: packet.thread_bridge?.status === "QUEUED_FOR_CODEX_THREAD_SEND"
      ? "Chapter packet was created and queued locally. It will not appear in the receiver chat until the Codex thread bridge posts it."
      : packet.thread_bridge?.status === "SENT_TO_CODEX_THREAD"
        ? "Chapter packet has been posted into the receiver chat. Now wait for RECEIVED then COMPLETED or BLOCKER."
        : "Chapter packet state requires bridge/status readback before claiming delivery.",
    missing_proof: "This is queued work only until the thread bridge sends it and Skybro returns RECEIVED then COMPLETED or BLOCKER.",
  };
}

function chapterIdFromBookPacket(packet) {
  const body = String(packet.body || "");
  const match = body.match(/Chapter id:\s*([^\s]+)/);
  return match ? match[1] : null;
}

function bookCourierStatus(limit = 30) {
  const chapters = listBookChapters();
  const chapterById = new Map(chapters.map((chapter) => [chapter.chapter_id, chapter]));
  const bookPackets = latestRelayPackets(500)
    .filter((packet) => String(packet.packet_type || "").toUpperCase() === "BOOK_CHAPTER_EDIT")
    .map((packet) => {
      const chapterId = chapterIdFromBookPacket(packet);
      return {
        packet_id: packet.packet_id,
        status: packet.status || "UNKNOWN",
        target: packet.target || "UNKNOWN_TARGET",
        title: packet.title || "Book chapter edit",
        chapter_id: chapterId,
        chapter_title: chapterId && chapterById.has(chapterId) ? chapterById.get(chapterId).title : null,
        source_sha256: chapterId && chapterById.has(chapterId) ? chapterById.get(chapterId).sha256 : null,
        thread_bridge_status: packet.thread_bridge?.status || "NOT_QUEUED",
        thread_id: packet.thread_bridge?.thread_id || null,
        last_receiver_status: packet.last_receiver_status || null,
        last_receiver_receipt_id: packet.last_receiver_receipt_id || null,
        last_receiver_receipt_sha256: packet.last_receiver_receipt_sha256 || null,
        created_at: packet.created_at || null,
        updated_at: packet.updated_at || packet.packet_modified_at || null,
      };
    });
  const touched = new Set(bookPackets.map((packet) => packet.chapter_id).filter(Boolean));
  const completed = new Set(bookPackets
    .filter((packet) => String(packet.status || "").includes("COMPLETED_RECEIPT_PROVEN"))
    .map((packet) => packet.chapter_id)
    .filter(Boolean));
  const active = bookPackets.filter((packet) => {
    const status = String(packet.status || "").toUpperCase();
    return !status.includes("COMPLETED") && !status.includes("BLOCKER");
  });
  const nextUnsent = chapters.find((chapter) => !touched.has(chapter.chapter_id)) || null;
  const nextUncompleted = chapters.find((chapter) => !completed.has(chapter.chapter_id)) || null;
  const bridge = threadBridgeStatus(10);
  return {
    status: "BOOK_COURIER_STATUS",
    generated_at: new Date().toISOString(),
    source_root: BOOK_SOURCE_TRUTH_ROOT,
    source_repo_url: BOOK_SOURCE_TRUTH_REPO_URL,
    chapter_count: chapters.length,
    book_packet_count: bookPackets.length,
    completed_chapter_count: completed.size,
    active_packet_count: active.length,
    next_unsent_chapter: nextUnsent,
    next_uncompleted_chapter: nextUncompleted,
    latest_book_packets: bookPackets.slice(0, limit),
    bridge_actuator: bridge.actuator,
    rule: "A chapter is not complete when queued or sent. It is complete only after Skybro returns RECEIVED then COMPLETED or BLOCKER.",
  };
}

function dispatchNextBookChapterPacket(request, payload) {
  const status = bookCourierStatus(100);
  const strategy = String(payload.strategy || "first_unsent").trim().toLowerCase();
  const chapter = strategy === "first_uncompleted"
    ? status.next_uncompleted_chapter
    : status.next_unsent_chapter;
  if (!chapter) {
    const error = new Error("No next book chapter candidate found for the requested strategy.");
    error.statusCode = 409;
    throw error;
  }
  const result = dispatchBookChapterPacket(request, {
    ...payload,
    chapter_id: chapter.chapter_id,
    operator_note: String(payload.operator_note || `Automated next-chapter courier using ${strategy}.`).trim(),
  });
  return {
    ...result,
    status: "NEXT_BOOK_CHAPTER_PACKET_DISPATCHED",
    strategy,
    previous_courier_status: {
      completed_chapter_count: status.completed_chapter_count,
      book_packet_count: status.book_packet_count,
      active_packet_count: status.active_packet_count,
    },
  };
}

function writeActionCapsuleFromRequest(body) {
  const capsule = body && body.capsule && typeof body.capsule === "object" ? body.capsule : body;
  if (!capsule || typeof capsule !== "object" || Array.isArray(capsule)) {
    const error = new Error("request body must be an action capsule object or { capsule }");
    error.statusCode = 400;
    throw error;
  }

  const capsuleId = String(capsule.capsule_id || "").trim();
  if (!capsuleId) {
    const error = new Error("capsule_id is required");
    error.statusCode = 400;
    throw error;
  }

  ensureDir(SPEAKER_ACTION_CAPSULE_INBOX);
  const capsulePath = path.join(SPEAKER_ACTION_CAPSULE_INBOX, `${safeReceiptStem(capsuleId)}.json`);
  fs.writeFileSync(capsulePath, `${JSON.stringify(capsule, null, 2)}\n`, "utf8");
  return capsulePath;
}

function writeRatchetDecisionReceipt(payload) {
  const decision = String(payload.decision || "").toUpperCase();
  const reason = String(payload.reason || "").trim();
  const recommendationId = String(payload.recommendation_id || "FERAL_RECOMMENDATION_LOCAL_001").trim();
  const recommendationTitle = String(payload.recommendation_title || "Local recommendation").trim();
  const recommendationText = String(payload.recommendation_text || "No recommendation text provided.").trim();

  if (!["DEFER", "KILL"].includes(decision)) {
    const error = new Error("decision must be DEFER or KILL");
    error.statusCode = 400;
    throw error;
  }

  if (reason.length < 3) {
    const error = new Error("reason is required for DEFER or KILL");
    error.statusCode = 400;
    throw error;
  }

  if (reason.length > 280) {
    const error = new Error("reason must be 280 characters or fewer");
    error.statusCode = 400;
    throw error;
  }

  const createdAt = new Date().toISOString();
  const stamp = createdAt.replace(/[-:.TZ]/g, "").slice(0, 14);
  const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
  const receiptId = `RATCHET_DECISION_${decision}_${stamp}_${suffix}`;
  const operatorApprovalReceiptId = `OPERATOR_APPROVAL_${receiptId}`;
  const receipt = {
    receipt_id: receiptId,
    receipt_type: "DECISION",
    type: "DECISION",
    packet_id: recommendationId,
    mission: "BIRD_0063_SWANSON_RATCHET_FEEDBACK",
    producer: "FeralMembrane@Doss",
    owner: "Speaker",
    status: "ARTIFACT",
    decision,
    reason,
    operator_approval_receipt_id: operatorApprovalReceiptId,
    created_at: createdAt,
    recommendation: {
      recommendation_id: recommendationId,
      title: recommendationTitle,
      text: recommendationText,
    },
    evidence: {
      ui_surface: "Feral Membrane",
      api_route: "POST /v1/action/ratchet_feedback",
      correction_requires_reason: true,
      raw_inbox: SPEAKER_RAW_INBOX,
    },
  };

  ensureDir(SPEAKER_RAW_INBOX);
  const receiptJson = `${JSON.stringify(receipt, null, 2)}\n`;
  const receiptPath = path.join(SPEAKER_RAW_INBOX, `${safeReceiptStem(receiptId)}.json`);
  fs.writeFileSync(receiptPath, receiptJson, "utf8");
  const receiptHash = sha256Buffer(Buffer.from(receiptJson, "utf8"));
  return {
    receipt,
    receipt_path: receiptPath,
    receipt_sha256: receiptHash,
    byte_count: Buffer.byteLength(receiptJson, "utf8"),
  };
}

function appendJsonl(filePath, entry) {
  ensureDir(path.dirname(filePath));
  fs.appendFileSync(filePath, `${JSON.stringify(entry)}\n`, "utf8");
}

function readJsonl(filePath, maxLines = 100) {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean);
  return lines.slice(-maxLines).map((line) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      return {
        event: "INVALID_JSONL",
        error: error.message,
        raw: line,
      };
    }
  });
}

function ensureThreadBridgeTargets() {
  ensureDir(AEYE_THREAD_BRIDGE_DIR);
  if (!fs.existsSync(AEYE_THREAD_TARGETS_PATH)) {
    fs.writeFileSync(AEYE_THREAD_TARGETS_PATH, `${JSON.stringify(DEFAULT_AEYE_THREAD_TARGETS, null, 2)}\n`, "utf8");
  }
}

function readThreadTargets() {
  ensureThreadBridgeTargets();
  const configured = readJson(AEYE_THREAD_TARGETS_PATH, DEFAULT_AEYE_THREAD_TARGETS);
  return configured && typeof configured === "object" ? configured : DEFAULT_AEYE_THREAD_TARGETS;
}

function threadIdForTarget(target) {
  const configured = readThreadTargets()[target];
  if (!configured) return null;
  if (typeof configured === "string") return configured;
  if (typeof configured === "object" && configured.thread_id) return String(configured.thread_id);
  return null;
}

function targetConfigForTarget(target) {
  const configured = readThreadTargets()[target];
  if (!configured) return {};
  if (typeof configured === "string") return { thread_id: configured, relay_mode: "CODEX_THREAD_BRIDGE" };
  if (typeof configured === "object" && configured) return configured;
  return {};
}

function safeTargetDirName(target) {
  return safeReceiptStem(target).replace(/\./g, "_");
}

function fileInboxUrlForTarget(target) {
  return `${BRAINBOOT_PUBLIC_BASE_URL}/aeye/${encodeURIComponent(target)}`;
}

function fileInboxDirForTarget(target) {
  return path.join(AEYE_FILE_INBOX_DIR, safeTargetDirName(target));
}

function fileInboxPacketPath(target, packetId) {
  return path.join(fileInboxDirForTarget(target), `${safeReceiptStem(packetId)}.json`);
}

function listFileInboxRecords(limit = 50) {
  if (!fs.existsSync(AEYE_FILE_INBOX_DIR)) return [];
  const records = [];
  for (const targetDir of fs.readdirSync(AEYE_FILE_INBOX_DIR)) {
    const dir = path.join(AEYE_FILE_INBOX_DIR, targetDir);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.toLowerCase().endsWith(".json")) continue;
      const filePath = path.join(dir, name);
      const value = readJson(filePath, {});
      records.push({
        ...value,
        path: filePath,
        modified_at: fs.statSync(filePath).mtime.toISOString(),
      });
    }
  }
  return records
    .sort((a, b) => String(b.created_at || b.modified_at || "").localeCompare(String(a.created_at || a.modified_at || "")))
    .slice(0, limit);
}

function threadTargetDetails() {
  const targets = readThreadTargets();
  return Object.entries(targets).map(([target, configured]) => {
    const threadId = typeof configured === "string" ? configured : configured?.thread_id;
    const detail = typeof configured === "object" && configured ? configured : {};
    const relayMode = detail.relay_mode || (threadId ? "CODEX_THREAD_BRIDGE" : "NOT_CONFIGURED");
    const latestReceiverProof = relayMode === "LOCAL_ONLY"
      ? {
          latest_packet_channel: null,
          latest_receiver_packet_id: null,
          latest_packet_status: "LOCAL_CONTROL_THREAD",
          latest_packet_created_at: null,
          latest_packet_updated_at: null,
          latest_receiver_status: null,
          latest_receiver_receipt_id: null,
          latest_receiver_receipt_path: null,
          latest_receiver_receipt_sha256: null,
          latest_completion_state: "LOCAL_CONTROL_THREAD",
          latest_proof_gap: "This is the current Swanson control thread, not a remote Aeye relay target.",
        }
      : latestReceiverProofForTarget(target);
    return {
      target,
      thread_id: threadId || null,
      title: detail.title || AEYE_THREAD_TARGET_LABELS[target] || target,
      machine: detail.machine || target.split(".")[1] || "UNKNOWN_MACHINE",
      aeye: detail.aeye || target.split(".")[0] || "UNKNOWN_AEYE",
      route_status: threadId ? "MAPPED_TO_CODEX_THREAD" : detail.route_status || "NO_THREAD_MAPPING",
      availability: detail.availability || (threadId ? "AVAILABLE_IF_ACTUATOR_ACTIVE" : "UNVERIFIED"),
      relay_mode: relayMode,
      home_thread_id: threadId || null,
      home_thread_title: detail.title || AEYE_THREAD_TARGET_LABELS[target] || target,
      home_thread_policy: threadId ? AEYE_HOME_THREAD_POLICY.status : "NO_HOME_THREAD_BOUND",
      rotation_requires_reason: Boolean(threadId),
      actuator: threadId ? "Codex send_message_to_thread" : relayMode === "FILE_INBOX_LAN" ? "LAN file inbox receiver page" : detail.actuator || "No active actuator",
      file_inbox_url: relayMode === "FILE_INBOX_LAN" ? fileInboxUrlForTarget(target) : null,
      file_inbox_dir: relayMode === "FILE_INBOX_LAN" ? fileInboxDirForTarget(target) : null,
      proof_rule: threadId
        ? "The dashboard can queue work, but this Codex thread bridge must post it into the mapped home chat before the Aeye can receive it. New chats require an explicit rotation receipt."
        : relayMode === "FILE_INBOX_LAN"
          ? "The dashboard can place work in the LAN receiver inbox, but completion still requires the receiver page to write RECEIVED then COMPLETED or BLOCKER."
        : detail.proof_rule || "This target cannot receive chat packets until a real receiver thread mapping exists.",
      ...latestReceiverProof,
    };
  });
}

function parseSimpleToml(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const result = {};
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z0-9_-]+)\s*=\s*(.+?)\s*$/);
    if (!match) continue;
    const key = match[1];
    const raw = match[2].trim();
    if (raw.startsWith('"') && raw.endsWith('"')) {
      result[key] = raw.slice(1, -1);
    } else if (/^\d+$/.test(raw)) {
      result[key] = Number(raw);
    } else {
      result[key] = raw;
    }
  }
  return result;
}

function threadBridgeActuatorStatus() {
  const automation = parseSimpleToml(CODEX_THREAD_BRIDGE_AUTOMATION_PATH);
  if (!automation) {
    return {
      status: "MISSING",
      active: false,
      path: CODEX_THREAD_BRIDGE_AUTOMATION_PATH,
      name: "Nerdkle Aeye Thread Bridge",
      schedule: null,
      can_post_to_aeye_chats: false,
      operator_meaning: "No Codex heartbeat automation file exists. Packets can queue locally, but nothing will post them into Aeye chats.",
    };
  }
  const status = String(automation.status || "UNKNOWN").toUpperCase();
  const active = status === "ACTIVE";
  return {
    status,
    active,
    path: CODEX_THREAD_BRIDGE_AUTOMATION_PATH,
    name: automation.name || "Nerdkle Aeye Thread Bridge",
    schedule: automation.rrule || null,
    target_thread_id: automation.target_thread_id || null,
    can_post_to_aeye_chats: active,
    operator_meaning: active
      ? "Bridge heartbeat is active. Queued packets should be posted into mapped Aeye receiver chats on the schedule."
      : "Bridge heartbeat is paused. Dashboard clicks can create packets, but they will not reach Aeye chats until the bridge is resumed or drained manually by Swanson.",
  };
}

function routableRelayTargets() {
  return threadTargetDetails().filter((target) => {
    if (target.relay_mode === "DO_NOT_ROUTE") return false;
    if (target.relay_mode === "LOCAL_ONLY") return false;
    return target.relay_mode === "CODEX_THREAD_BRIDGE" || target.relay_mode === "FILE_INBOX_LAN";
  });
}

function packetThreadPrompt(packet, channel) {
  const label = channel === "brainboot" ? "Brainboot" : "Relay";
  const targetConfig = targetConfigForTarget(packet.target);
  const homeThreadTitle = targetConfig.title || AEYE_THREAD_TARGET_LABELS[packet.target] || packet.target;
  return [
    `PACKET_ID: ${packet.packet_id}`,
    `TO: ${packet.target}`,
    "FROM: TinkerDen Flight Deck@Doss",
    "STREAM: AEYE RELAY / THREAD BRIDGE",
    "",
    `MISSION: Receive and answer this ${label} packet without making Ben the courier.`,
    "",
    "HOME THREAD RULE:",
    `This packet is being delivered inside the standing receiver chat named "${homeThreadTitle}".`,
    "Do not create a new chat for this packet.",
    "If this receiver chat is degraded, return BLOCKER: THREAD_ROTATION_REQUIRED with the reason and stop; do not silently rotate.",
    "",
    "SOURCE:",
    packet.receive_url || "NO_RECEIVER_URL",
    "",
    "TITLE:",
    packet.title || packet.mission || packet.packet_type || "Untitled packet",
    "",
    "BODY:",
    packet.body || packet.rule || "No packet body.",
    "",
    "DO:",
    "1. Write RECEIVED for this packet using the local receiver surface or endpoint.",
    "2. Complete the requested work if possible.",
    "3. Write COMPLETED with exact evidence, or BLOCKER with the exact missing proof.",
    "4. Do not call SENT success.",
    "5. If another packet arrives while this one is open, do not silently supersede this packet; finish it or write BLOCKER first.",
    "",
    "RETURN:",
    "RECEIVED then COMPLETED or BLOCKER.",
  ].join("\n");
}

function enqueueThreadBridgePacket(packet, channel) {
  const threadId = threadIdForTarget(packet.target);
  const targetConfig = targetConfigForTarget(packet.target);
  const relayMode = targetConfig.relay_mode || (threadId ? "CODEX_THREAD_BRIDGE" : "NOT_CONFIGURED");
  const routeStatus = targetConfig.route_status || (threadId ? "MAPPED_TO_CODEX_THREAD" : "NO_THREAD_MAPPING");
  const createdAt = new Date().toISOString();
  const queueId = `THREAD_BRIDGE_${safeReceiptStem(packet.packet_id)}`;
  const sourcePacketPath = channel === "brainboot" ? brainbootPacketPath(packet.packet_id) : relayPacketPath(packet.packet_id);
  const baseRecord = {
    queue_id: queueId,
    channel,
    packet_id: packet.packet_id,
    target: packet.target,
    thread_id: threadId,
    home_thread_id: threadId,
    home_thread_title: targetConfig.title || AEYE_THREAD_TARGET_LABELS[packet.target] || packet.target,
    home_thread_policy: threadId ? AEYE_HOME_THREAD_POLICY.status : "NO_HOME_THREAD_BOUND",
    thread_reuse_required: Boolean(threadId),
    rotation_requires_operator_reason: Boolean(threadId),
    source_packet_path: sourcePacketPath,
    receive_url: packet.receive_url || null,
    status: threadId ? "QUEUED_FOR_CODEX_THREAD_SEND" : relayMode === "FILE_INBOX_LAN" ? "FILE_INBOX_WAITING_FOR_RECEIVER" : "NO_THREAD_MAPPING",
    created_at: createdAt,
    relay_mode: relayMode,
    route_status: routeStatus,
    rule: "Local packet creation is not Aeye delivery. This queue must be drained by the Codex thread bridge or completed through a receiver-side LAN inbox.",
  };
  if (!threadId && relayMode === "FILE_INBOX_LAN") {
    ensureDir(fileInboxDirForTarget(packet.target));
    const inboxPath = fileInboxPacketPath(packet.target, packet.packet_id);
    const inboxRecord = {
      ...baseRecord,
      file_inbox_path: inboxPath,
      file_inbox_url: fileInboxUrlForTarget(packet.target),
      receiver_requirement: "Receiver must open the inbox URL and write RECEIVED then COMPLETED or BLOCKER.",
    };
    fs.writeFileSync(inboxPath, `${JSON.stringify(inboxRecord, null, 2)}\n`, "utf8");
    appendJsonl(AEYE_FILE_INBOX_LEDGER_PATH, {
      event: "FILE_INBOX_WRITTEN",
      queue_id: queueId,
      packet_id: packet.packet_id,
      target: packet.target,
      channel,
      file_inbox_path: inboxPath,
      file_inbox_url: inboxRecord.file_inbox_url,
      created_at: createdAt,
    });
    appendJsonl(AEYE_THREAD_BRIDGE_LEDGER_PATH, {
      event: "THREAD_BRIDGE_FILE_INBOX_WAITING",
      queue_id: queueId,
      packet_id: packet.packet_id,
      target: packet.target,
      channel,
      file_inbox_path: inboxPath,
      file_inbox_url: inboxRecord.file_inbox_url,
      created_at: createdAt,
    });
    return {
      ...inboxRecord,
      queue_path: inboxPath,
    };
  }
  if (!threadId) {
    ensureDir(AEYE_THREAD_BRIDGE_BLOCKED_DIR);
    const blockedPath = path.join(AEYE_THREAD_BRIDGE_BLOCKED_DIR, `${queueId}.json`);
    const blockedRecord = {
      ...baseRecord,
      blocked_reason: `No known Codex thread mapping for ${packet.target}`,
    };
    fs.writeFileSync(blockedPath, `${JSON.stringify(blockedRecord, null, 2)}\n`, "utf8");
    appendJsonl(AEYE_THREAD_BRIDGE_LEDGER_PATH, {
      event: "THREAD_BRIDGE_BLOCKED",
      queue_id: queueId,
      packet_id: packet.packet_id,
      target: packet.target,
      reason: blockedRecord.blocked_reason,
      created_at: createdAt,
    });
    return {
      ...blockedRecord,
      queue_path: blockedPath,
    };
  }

  ensureDir(AEYE_THREAD_BRIDGE_QUEUE_DIR);
  const queuePath = path.join(AEYE_THREAD_BRIDGE_QUEUE_DIR, `${queueId}.json`);
  const record = {
    ...baseRecord,
    queue_path: queuePath,
    prompt: packetThreadPrompt(packet, channel),
  };
  fs.writeFileSync(queuePath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  appendJsonl(AEYE_THREAD_BRIDGE_LEDGER_PATH, {
    event: "THREAD_BRIDGE_QUEUED",
    queue_id: queueId,
    packet_id: packet.packet_id,
    target: packet.target,
    thread_id: threadId,
    home_thread_id: threadId,
    home_thread_policy: AEYE_HOME_THREAD_POLICY.status,
    channel,
    queue_path: queuePath,
    created_at: createdAt,
  });
  return record;
}

function listThreadBridgeFiles(dir, limit = 50) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.toLowerCase().endsWith(".json"))
    .map((name) => {
      const filePath = path.join(dir, name);
      const value = readJson(filePath, {});
      return {
        ...value,
        path: filePath,
        modified_at: fs.statSync(filePath).mtime.toISOString(),
      };
    })
    .sort((a, b) => String(b.created_at || b.modified_at || "").localeCompare(String(a.created_at || a.modified_at || "")))
    .slice(0, limit);
}

function threadBridgeStatus(limit = 30) {
  ensureThreadBridgeTargets();
  const queued = listThreadBridgeFiles(AEYE_THREAD_BRIDGE_QUEUE_DIR, limit);
  const sent = listThreadBridgeFiles(AEYE_THREAD_BRIDGE_SENT_DIR, limit);
  const blocked = listThreadBridgeFiles(AEYE_THREAD_BRIDGE_BLOCKED_DIR, limit);
  const file_inbox = listFileInboxRecords(limit);
  const actuator = threadBridgeActuatorStatus();
  return {
    status: "THREAD_BRIDGE_STATUS",
    generated_at: new Date().toISOString(),
    root: AEYE_THREAD_BRIDGE_DIR,
    targets_path: AEYE_THREAD_TARGETS_PATH,
    actuator,
    home_thread_policy: AEYE_HOME_THREAD_POLICY,
    known_targets: readThreadTargets(),
    known_target_threads: threadTargetDetails(),
    queued,
    sent,
    blocked,
    file_inbox,
    ledger_tail: readJsonl(AEYE_THREAD_BRIDGE_LEDGER_PATH, limit),
    operator_warning: !actuator.active && queued.length
      ? "QUEUED_WITH_BRIDGE_PAUSED: these packets are not in Aeye chats yet."
      : null,
    rule: "Queued means the dashboard produced work only. Sent means send_message_to_thread was called for the mapped home Codex chat. Receiver proof still requires RECEIVED then COMPLETED or BLOCKER. New receiver chats are not created unless a rotation receipt is explicit.",
  };
}

function relayCoverageStatus(limit = 20) {
  const bridge = threadBridgeStatus(limit);
  const targets = bridge.known_target_threads.map((target) => {
    const completion = String(target.latest_completion_state || "UNKNOWN").toUpperCase();
    let coverage = "NOT_STARTED";
    if (completion === "COMPLETED_RECEIPT_PROVEN") coverage = "ROUND_TRIP_PROVEN";
    else if (completion === "BLOCKER_RECEIPT_PROVEN") coverage = "RETURNED_BLOCKER";
    else if (completion === "RECEIVED_NOT_COMPLETED") coverage = "RECEIVED_WAITING_COMPLETION";
    else if (completion.includes("FILE_INBOX_WAITING")) coverage = "FILE_INBOX_WAITING_FOR_RECEIVER";
    else if (completion.includes("SENT") || completion.includes("QUEUED")) coverage = "WAITING_FOR_RECEIVER";
    else if (target.relay_mode === "DO_NOT_ROUTE") coverage = "HELD_BY_TOPOLOGY";
    else if (target.relay_mode === "LOCAL_ONLY") coverage = "LOCAL_CONTROL_THREAD";
    return {
      target: target.target,
      machine: target.machine,
      aeye: target.aeye,
      relay_mode: target.relay_mode,
      route_status: target.route_status,
      availability: target.availability,
      coverage,
      latest_completion_state: target.latest_completion_state,
      latest_packet_id: target.latest_receiver_packet_id || null,
      latest_receiver_receipt_id: target.latest_receiver_receipt_id || null,
      latest_receiver_receipt_sha256: target.latest_receiver_receipt_sha256 || null,
      proof_gap: target.latest_proof_gap,
      file_inbox_url: target.file_inbox_url || null,
      thread_id: target.thread_id || null,
    };
  });
  const byMachine = targets.reduce((acc, target) => {
    const machine = target.machine || "UNKNOWN_MACHINE";
    if (!acc[machine]) {
      acc[machine] = {
        total: 0,
        round_trip_proven: 0,
        file_inbox_waiting: 0,
        waiting_for_receiver: 0,
        returned_blocker: 0,
        held: 0,
        local_only: 0,
      };
    }
    acc[machine].total += 1;
    if (target.coverage === "ROUND_TRIP_PROVEN") acc[machine].round_trip_proven += 1;
    else if (target.coverage === "FILE_INBOX_WAITING_FOR_RECEIVER") acc[machine].file_inbox_waiting += 1;
    else if (target.coverage === "WAITING_FOR_RECEIVER" || target.coverage === "RECEIVED_WAITING_COMPLETION") acc[machine].waiting_for_receiver += 1;
    else if (target.coverage === "RETURNED_BLOCKER") acc[machine].returned_blocker += 1;
    else if (target.coverage === "HELD_BY_TOPOLOGY") acc[machine].held += 1;
    else if (target.coverage === "LOCAL_CONTROL_THREAD") acc[machine].local_only += 1;
    return acc;
  }, {});
  const summary = {
    target_count: targets.length,
    round_trip_proven: targets.filter((target) => target.coverage === "ROUND_TRIP_PROVEN").length,
    file_inbox_waiting: targets.filter((target) => target.coverage === "FILE_INBOX_WAITING_FOR_RECEIVER").length,
    waiting_for_receiver: targets.filter((target) => target.coverage === "WAITING_FOR_RECEIVER" || target.coverage === "RECEIVED_WAITING_COMPLETION").length,
    returned_blocker: targets.filter((target) => target.coverage === "RETURNED_BLOCKER").length,
    held: targets.filter((target) => target.coverage === "HELD_BY_TOPOLOGY").length,
    local_only: targets.filter((target) => target.coverage === "LOCAL_CONTROL_THREAD").length,
  };
  return {
    status: "AEYE_RELAY_COVERAGE_STATUS",
    generated_at: new Date().toISOString(),
    actuator: bridge.actuator,
    summary,
    by_machine: byMachine,
    targets,
    rule: "ROUND_TRIP_PROVEN requires receiver-side COMPLETED receipt. File inbox placement is not delivery.",
  };
}

function buildThinkItRelayMergeContract(limit = 20) {
  const generatedAt = new Date().toISOString();
  const coverage = relayCoverageStatus(limit);
  const originReturn = buildOriginReturnSnapshot(Math.min(limit, 12));
  const threadBridge = threadBridgeStatus(limit);
  const bookStatus = (() => {
    try {
      return bookCourierStatus(Math.min(limit, 30));
    } catch (error) {
      return {
        status: "BOOK_COURIER_STATUS_BLOCKED",
        error: error.message,
      };
    }
  })();
  const readinessBlockers = [];
  if (!threadBridge.actuator?.active) {
    readinessBlockers.push("THREAD_BRIDGE_ACTUATOR_NOT_ACTIVE");
  }
  if (coverage.summary.waiting_for_receiver > 0) {
    readinessBlockers.push("RELAY_TARGETS_WAITING_FOR_RECEIVER");
  }
  if (coverage.summary.file_inbox_waiting > 0) {
    readinessBlockers.push("FILE_INBOX_TARGETS_WAITING_FOR_RECEIVER");
  }
  if (!originReturn.returns?.length) {
    readinessBlockers.push("NO_ORIGIN_RETURN_PROOF");
  }
  const targetRoundTrip = coverage.summary.round_trip_proven;
  const routableTargets = coverage.targets.filter((target) => (
    target.relay_mode === "CODEX_THREAD_BRIDGE" ||
    target.relay_mode === "FILE_INBOX_LAN"
  )).length;
  return {
    status: readinessBlockers.length ? "THINKIT_RELAY_MERGE_READY_WITH_BLOCKERS" : "THINKIT_RELAY_MERGE_READY",
    generated_at: generatedAt,
    official_names: {
      merged_product_name: "ThinkIt",
      incoming_command_dash_name: "Feral Membrane Main Dash",
      incoming_command_dash_owner: "Dink@Betsy",
      relay_module_name: "Swanson Relay Build",
      relay_module_owner: "Swanson@Doss",
    },
    merge_rule: "ThinkIt may use Relay Build as transport only if UI actions preserve the packet -> queued/sent -> RECEIVED -> COMPLETED/BLOCKER -> origin return proof chain.",
    role_boundaries: {
      thinkit_command_dash_owns: [
        "operator-facing UI",
        "button placement and copy",
        "operator intent capture",
        "decision cards and queue visibility",
        "showing returned answers from origin_return"
      ],
      swanson_relay_build_owns: [
        "packet creation",
        "target routing and thread bridge queue",
        "SENT_TO_CODEX_THREAD marking after Codex actuator success",
        "receiver-side RECEIVED and COMPLETED/BLOCKER receipts",
        "origin dash return ledger and readback",
        "book chapter courier packets"
      ],
      speaker_brainboot_owns: [
        "source-truth pointers",
        "bootpack rendering",
        "raw receipt ingestion",
        "memory baseline readback"
      ],
    },
    proof_states: {
      not_success: [
        "CREATED_LOCAL_ONLY",
        "QUEUED_FOR_CODEX_THREAD_SEND",
        "SENT_TO_CODEX_THREAD",
        "FILE_INBOX_WAITING_FOR_RECEIVER",
        "SENT_UNACKNOWLEDGED"
      ],
      in_progress: [
        "RECEIVED_NOT_COMPLETED",
        "WAITING_FOR_RECEIVER"
      ],
      terminal_success: [
        "COMPLETED_RECEIPT_PROVEN",
        "RETURNED_TO_ORIGIN_DASH"
      ],
      terminal_blocker: [
        "BLOCKER_RECEIPT_PROVEN",
        "RETURNED_BLOCKER"
      ],
      operator_rule: "ThinkIt UI must not show success until a terminal receiver receipt is read back and origin_return records the answer."
    },
    endpoint_contract: [
      {
        surface: "Operator intent / assign work",
        method: "POST",
        path: "/v1/operator/intent",
        call_when: "Operator types an intent or clicks Assign Work from ThinkIt.",
        required_fields: ["target", "title", "body"],
        success_readback: "relay_packet.packet_id plus missing_proof; still not receiver success"
      },
      {
        surface: "Direct relay dispatch",
        method: "POST",
        path: "/v1/relay/dispatch",
        call_when: "ThinkIt already has a fully formed packet payload.",
        required_fields: ["target", "title", "body"],
        success_readback: "relay_packet.thread_bridge.status"
      },
      {
        surface: "Brainboot dispatch",
        method: "POST",
        path: "/v1/action/brainboot_dispatch",
        call_when: "Operator clicks Brainboot / Session source-truth reboot.",
        required_fields: ["targets"],
        success_readback: "brainboot_packets array; receiver completion still required"
      },
      {
        surface: "Startup dispatch",
        method: "POST",
        path: "/v1/relay/dispatch_startup",
        call_when: "ThinkIt wants both Brainboot and source-truth startup relay packets.",
        required_fields: ["targets"],
        success_readback: "brainboot_packets and relay_packets arrays"
      },
      {
        surface: "Book chapter courier",
        method: "POST",
        path: "/v1/book/dispatch_next_chapter",
        call_when: "ThinkIt asks Skybro or another Aeye to edit the next source-truth book chapter.",
        required_fields: ["target", "strategy", "editing_mode"],
        success_readback: "relay_packet.packet_id and chapter metadata; completion requires receiver receipt"
      },
      {
        surface: "Thread bridge status",
        method: "GET",
        path: "/v1/relay/thread_bridge/status",
        call_when: "ThinkIt needs to show queued/sent/blocked transport state.",
        required_fields: [],
        success_readback: "queued, sent, blocked, known_target_threads"
      },
      {
        surface: "Relay coverage",
        method: "GET",
        path: "/v1/relay/coverage",
        call_when: "ThinkIt needs all-Aeye proof coverage.",
        required_fields: [],
        success_readback: "summary.round_trip_proven and target proof gaps"
      },
      {
        surface: "Origin return",
        method: "GET",
        path: "/v1/relay/origin_return",
        call_when: "ThinkIt needs answers back on the operator dash.",
        required_fields: [],
        success_readback: "latest_return.answer_evidence with receiver receipt path/hash"
      },
      {
        surface: "Actionable returns",
        method: "GET",
        path: "/v1/relay/actionable_returns",
        call_when: "ThinkIt needs KEEP/KILL/STEAL/MERGE or next-action decision cards from returned Aeye answers.",
        required_fields: [],
        success_readback: "actionable return list"
      },
      {
        surface: "Relay chaser",
        method: "POST",
        path: "/v1/relay/run_chaser",
        call_when: "ThinkIt wants a manual sweep for stale unreturned packets.",
        required_fields: [],
        success_readback: "chaser output; not completion by itself"
      }
    ],
    button_mapping_for_thinkit: [
      {
        button_label: "Brainboot Aeyes",
        endpoint: "POST /v1/action/brainboot_dispatch",
        show_after_click: "packet ids, target list, missing proof"
      },
      {
        button_label: "Assign Work",
        endpoint: "POST /v1/operator/intent",
        show_after_click: "intent id, relay packet id if target is remote, receiver proof gap"
      },
      {
        button_label: "Send Packet",
        endpoint: "POST /v1/relay/dispatch",
        show_after_click: "packet id, target, thread bridge status"
      },
      {
        button_label: "Send Next Book Chapter",
        endpoint: "POST /v1/book/dispatch_next_chapter",
        show_after_click: "chapter title, packet id, source hash, receiver proof gap"
      },
      {
        button_label: "Check Returns",
        endpoint: "GET /v1/relay/origin_return",
        show_after_click: "latest returned answer and receiver receipt hash"
      },
      {
        button_label: "Check All Aeyes",
        endpoint: "GET /v1/relay/coverage",
        show_after_click: "round trip proof counts by machine and open proof gaps"
      }
    ],
    current_readback: {
      coverage_summary: coverage.summary,
      coverage_by_machine: coverage.by_machine,
      bridge_actuator: threadBridge.actuator,
      latest_origin_return: originReturn.latest_return || null,
      returned_answer_count: originReturn.returned_answer_count || 0,
      book_courier: {
        status: bookStatus.status,
        source_repo_url: bookStatus.source_repo_url || BOOK_SOURCE_TRUTH_REPO_URL,
        chapter_count: bookStatus.chapter_count || 0,
        completed_chapter_count: bookStatus.completed_chapter_count || 0,
        active_packet_count: bookStatus.active_packet_count || 0,
      }
    },
    readiness: {
      merge_recommendation: readinessBlockers.length ? "CONDITIONAL_GO" : "GO",
      blockers: readinessBlockers,
      routable_targets: routableTargets,
      round_trip_proven_targets: targetRoundTrip,
      held_targets: coverage.summary.held,
      local_only_targets: coverage.summary.local_only,
      caution: "Ender.Sally remains held by topology. Swanson.Doss is local-only and should not route through the thread bridge."
    },
    files: {
      relay_server: fileReadback(__filename),
      target_threads: fileReadback(AEYE_THREAD_TARGETS_PATH),
      latest_e2e_proof: fileReadback(AEYE_RELAY_E2E_PROOF_PATH),
      origin_return_readback: fileReadback(ORIGIN_DASH_LATEST_RETURN_PATH),
      merge_contract_path: THINKIT_RELAY_MERGE_CONTRACT_PATH,
    }
  };
}

function writeThinkItRelayMergeContract() {
  ensureDir(THINKIT_MERGE_DIR);
  const contract = buildThinkItRelayMergeContract(50);
  fs.writeFileSync(THINKIT_RELAY_MERGE_CONTRACT_PATH, `${JSON.stringify(contract, null, 2)}\n`, "utf8");
  const readback = fileReadback(THINKIT_RELAY_MERGE_CONTRACT_PATH);
  appendJsonl(AEYE_RELAY_LEDGER_PATH, {
    event: "THINKIT_RELAY_MERGE_CONTRACT_WRITTEN",
    generated_at: contract.generated_at,
    status: contract.status,
    merge_recommendation: contract.readiness.merge_recommendation,
    contract_path: THINKIT_RELAY_MERGE_CONTRACT_PATH,
    contract_sha256: readback.sha256,
  });
  return {
    status: "THINKIT_RELAY_MERGE_CONTRACT_WRITTEN",
    contract_path: THINKIT_RELAY_MERGE_CONTRACT_PATH,
    contract_sha256: readback.sha256,
    byte_count: readback.byte_count,
    contract,
  };
}

function receiverBootstrapTargets(limit = 20) {
  const coverage = relayCoverageStatus(limit);
  return {
    coverage,
    targets: coverage.targets.filter((target) => (
      target.coverage === "FILE_INBOX_WAITING_FOR_RECEIVER" &&
      target.relay_mode === "FILE_INBOX_LAN" &&
      !target.thread_id
    )),
  };
}

function receiverBootstrapPrompt(target, bootstrapId) {
  return [
    `PACKET_ID: ${bootstrapId}`,
    `TO: ${target.target}`,
    "FROM: Swanson@Doss",
    "STREAM: AEYE RELAY / RECEIVER BOOTSTRAP",
    "",
    "MISSION: Become a receiver-side proof thread for this target without making Ben the courier.",
    "",
    "CONTEXT:",
    "The dashboard can place packets in a LAN inbox, but this Aeye has no mapped Codex receiver thread yet.",
    "File inbox placement is not delivery. Receiver-side RECEIVED and COMPLETED or BLOCKER are required.",
    "",
    "STANDING INBOX:",
    target.file_inbox_url || "NO_FILE_INBOX_URL",
    "",
    "LATEST WAITING PACKET:",
    target.latest_packet_id || "NO_PACKET_ID",
    "",
    "DO:",
    "1. Open the standing inbox URL.",
    "2. Find the newest unacknowledged packet for your target.",
    "3. Write RECEIVED using the receiver page or ack endpoint.",
    "4. Complete the requested work if possible.",
    "5. Write COMPLETED with exact evidence, or BLOCKER with exact missing access/path/thread.",
    "6. Return exact packet id, receipt ids, receipt paths, and hashes.",
    "",
    "DO NOT:",
    "- call SENT success",
    "- ask Ben to paste packets",
    "- claim delivery without receiver-side receipt proof",
    "",
    "RETURN:",
    `${target.target.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_RECEIVER_BOOTSTRAP_RECEIPT`,
    "***",
  ].join("\n");
}

function writeReceiverBootstraps() {
  const { coverage, targets } = receiverBootstrapTargets(50);
  const createdAt = new Date().toISOString();
  const stamp = createdAt.replace(/[-:.TZ]/g, "").slice(0, 14);
  ensureDir(AEYE_RECEIVER_BOOTSTRAP_DIR);
  const bootstraps = targets.map((target) => {
    const bootstrapId = `RECEIVER_BOOTSTRAP_${safeReceiptStem(target.target).toUpperCase()}_${stamp}`;
    const targetDir = path.join(AEYE_RECEIVER_BOOTSTRAP_DIR, safeTargetDirName(target.target));
    ensureDir(targetDir);
    const prompt = receiverBootstrapPrompt(target, bootstrapId);
    const jsonPath = path.join(targetDir, `${bootstrapId}.json`);
    const mdPath = path.join(targetDir, `${bootstrapId}.md`);
    const packet = {
      bootstrap_id: bootstrapId,
      target: target.target,
      machine: target.machine,
      aeye: target.aeye,
      status: "THREAD_BOOTSTRAP_REQUIRED",
      created_at: createdAt,
      file_inbox_url: target.file_inbox_url,
      latest_waiting_packet_id: target.latest_packet_id,
      latest_completion_state: target.latest_completion_state,
      proof_gap: target.proof_gap,
      prompt,
      rule: "This is a bootstrap packet, not delivery proof. It becomes useful only when placed in a real Aeye receiver thread.",
    };
    fs.writeFileSync(jsonPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
    fs.writeFileSync(mdPath, `${prompt}\n`, "utf8");
    return {
      target: target.target,
      bootstrap_id: bootstrapId,
      json_path: jsonPath,
      json_sha256: fileReadback(jsonPath).sha256,
      md_path: mdPath,
      md_sha256: fileReadback(mdPath).sha256,
      file_inbox_url: target.file_inbox_url,
      latest_waiting_packet_id: target.latest_packet_id,
    };
  });
  const manifest = {
    status: "AEYE_RECEIVER_BOOTSTRAPS_WRITTEN",
    created_at: createdAt,
    bootstrap_count: bootstraps.length,
    coverage_summary: coverage.summary,
    bootstraps,
    blocked_by: bootstraps.length
      ? "Receiver Codex threads do not exist or are not mapped for these targets."
      : "No missing receiver bootstrap targets were found.",
    rule: "No bootstrap artifact is proof of receipt. It only defines the first message for a real receiver thread.",
  };
  const manifestPath = path.join(AEYE_RECEIVER_BOOTSTRAP_DIR, `RECEIVER_BOOTSTRAP_MANIFEST_${stamp}.json`);
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  const readback = fileReadback(manifestPath);
  appendJsonl(AEYE_RECEIVER_BOOTSTRAP_LEDGER_PATH, {
    event: "AEYE_RECEIVER_BOOTSTRAPS_WRITTEN",
    created_at: createdAt,
    manifest_path: manifestPath,
    manifest_sha256: readback.sha256,
    bootstrap_count: bootstraps.length,
    targets: bootstraps.map((item) => item.target),
  });
  return {
    ...manifest,
    manifest_path: manifestPath,
    manifest_sha256: readback.sha256,
    byte_count: readback.byte_count,
  };
}

function writeRelayCoverageReceipt() {
  const coverage = relayCoverageStatus(50);
  const createdAt = new Date().toISOString();
  const stamp = createdAt.replace(/[-:.TZ]/g, "").slice(0, 14);
  const receipt = {
    receipt_id: `SWANSON_DOSS_RELAY_COVERAGE_${stamp}`,
    receipt_type: "AEYE_RELAY_COVERAGE_RECEIPT",
    status: "ARTIFACT",
    generated_at: createdAt,
    dashboard_url: `http://127.0.0.1:${PORT}/`,
    coverage_endpoint: `http://127.0.0.1:${PORT}/v1/relay/coverage`,
    server_file: __filename,
    server_sha256: fileReadback(__filename).sha256,
    target_threads_file: AEYE_THREAD_TARGETS_PATH,
    target_threads_sha256: fileReadback(AEYE_THREAD_TARGETS_PATH).sha256,
    coverage,
    missing_receiver_targets: receiverBootstrapTargets(50).targets.map((target) => target.target),
    proof_rule: "ROUND_TRIP_PROVEN requires receiver-side COMPLETED receipt. SENT, queued, and file-inbox placement do not count as complete.",
  };
  const json = `${JSON.stringify(receipt, null, 2)}\n`;
  const proofPath = path.join(AEYE_RELAY_ROOT, "proofs", `${receipt.receipt_id}.json`);
  const outputPath = path.join(SWANSON_OUTPUTS_DIR, `${receipt.receipt_id}.json`);
  ensureDir(path.dirname(proofPath));
  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(proofPath, json, "utf8");
  fs.writeFileSync(outputPath, json, "utf8");
  appendJsonl(AEYE_RELAY_LEDGER_PATH, {
    event: "AEYE_RELAY_COVERAGE_RECEIPT_WRITTEN",
    receipt_id: receipt.receipt_id,
    proof_path: proofPath,
    output_path: outputPath,
    proof_sha256: fileReadback(proofPath).sha256,
    created_at: createdAt,
  });
  return {
    status: "AEYE_RELAY_COVERAGE_RECEIPT_WRITTEN",
    receipt,
    proof_path: proofPath,
    proof_sha256: fileReadback(proofPath).sha256,
    output_path: outputPath,
    output_sha256: fileReadback(outputPath).sha256,
    byte_count: Buffer.byteLength(json, "utf8"),
  };
}

function writeMissingReceiverBlockerReceipt() {
  const coverage = relayCoverageStatus(50);
  const { targets } = receiverBootstrapTargets(50);
  const createdAt = new Date().toISOString();
  const stamp = createdAt.replace(/[-:.TZ]/g, "").slice(0, 14);
  const receipt = {
    receipt_id: `SWANSON_DOSS_MISSING_RECEIVER_BLOCKERS_${stamp}`,
    receipt_type: "AEYE_RELAY_BLOCKER_RECEIPT",
    status: targets.length ? "BLOCKER" : "NO_BLOCKER_FOUND",
    blocker_type: "MISSING_RECEIVER_THREAD_MAPPING",
    generated_at: createdAt,
    dashboard_url: `http://127.0.0.1:${PORT}/`,
    receiver_bootstrap_url: `http://127.0.0.1:${PORT}/relay/receiver_bootstrap`,
    coverage_endpoint: `http://127.0.0.1:${PORT}/v1/relay/coverage`,
    server_file: __filename,
    server_sha256: fileReadback(__filename).sha256,
    target_threads_file: AEYE_THREAD_TARGETS_PATH,
    target_threads_sha256: fileReadback(AEYE_THREAD_TARGETS_PATH).sha256,
    coverage_summary: coverage.summary,
    missing_receivers: targets.map((target) => ({
      target: target.target,
      machine: target.machine,
      aeye: target.aeye,
      relay_mode: target.relay_mode,
      route_status: target.route_status,
      latest_packet_id: target.latest_packet_id,
      file_inbox_url: target.file_inbox_url,
      proof_gap: target.proof_gap,
      resolution_required: "Create or identify a real receiver thread for this Aeye, bind that thread id, dispatch a probe, and require receiver-side RECEIVED then COMPLETED or BLOCKER.",
    })),
    topology_holds: coverage.targets
      .filter((target) => target.coverage === "HELD_BY_TOPOLOGY")
      .map((target) => ({
        target: target.target,
        route_status: target.route_status,
        proof_gap: target.proof_gap,
      })),
    proven_targets: coverage.targets
      .filter((target) => target.coverage === "ROUND_TRIP_PROVEN")
      .map((target) => ({
        target: target.target,
        latest_packet_id: target.latest_packet_id,
        receiver_receipt_id: target.latest_receiver_receipt_id,
        receiver_receipt_sha256: target.latest_receiver_receipt_sha256,
      })),
    proof_rule: "This is a blocker receipt, not success. It exists so the dashboard cannot silently imply all-Aeye relay when receiver threads are missing.",
    next_required_action: targets.length
      ? "Bind actual receiver threads for the listed targets or explicitly hold them by topology, then run /v1/relay/dispatch_probe_all and verify receiver-side receipts."
      : "No missing receiver thread blockers are currently detected.",
  };
  const json = `${JSON.stringify(receipt, null, 2)}\n`;
  const proofPath = path.join(AEYE_RELAY_PROOFS_DIR, `${receipt.receipt_id}.json`);
  const outputPath = path.join(SWANSON_OUTPUTS_DIR, `${receipt.receipt_id}.json`);
  ensureDir(path.dirname(proofPath));
  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(proofPath, json, "utf8");
  fs.writeFileSync(outputPath, json, "utf8");
  const proofReadback = fileReadback(proofPath);
  const outputReadback = fileReadback(outputPath);
  appendJsonl(AEYE_RELAY_LEDGER_PATH, {
    event: "AEYE_RELAY_MISSING_RECEIVER_BLOCKER_RECEIPT_WRITTEN",
    receipt_id: receipt.receipt_id,
    status: receipt.status,
    missing_receiver_count: targets.length,
    proof_path: proofPath,
    proof_sha256: proofReadback.sha256,
    output_path: outputPath,
    output_sha256: outputReadback.sha256,
    created_at: createdAt,
  });
  return {
    status: "AEYE_RELAY_MISSING_RECEIVER_BLOCKER_RECEIPT_WRITTEN",
    receipt,
    proof_path: proofPath,
    proof_sha256: proofReadback.sha256,
    output_path: outputPath,
    output_sha256: outputReadback.sha256,
    byte_count: Buffer.byteLength(json, "utf8"),
  };
}

function latestReceiverBootstrapManifest() {
  if (!fs.existsSync(AEYE_RECEIVER_BOOTSTRAP_DIR)) return null;
  const manifests = fs.readdirSync(AEYE_RECEIVER_BOOTSTRAP_DIR)
    .filter((name) => /^RECEIVER_BOOTSTRAP_MANIFEST_.*\.json$/i.test(name))
    .map((name) => {
      const filePath = path.join(AEYE_RECEIVER_BOOTSTRAP_DIR, name);
      return {
        path: filePath,
        modified_at: fs.statSync(filePath).mtime.toISOString(),
      };
    })
    .sort((a, b) => String(b.modified_at).localeCompare(String(a.modified_at)));
  if (!manifests.length) return null;
  const manifest = readJson(manifests[0].path, null);
  if (!manifest) return null;
  return {
    ...manifest,
    manifest_path: manifests[0].path,
    manifest_sha256: fileReadback(manifests[0].path).sha256,
  };
}

function validateReceiverThreadId(threadId) {
  return /^[A-Za-z0-9-]{12,90}$/.test(String(threadId || ""));
}

function receiverThreadRotationRequested(payload) {
  return payload?.route_rotation_requested === true || payload?.rotation_requested === true || payload?.rotate === true;
}

function receiverThreadRotationReason(payload) {
  return String(payload?.rotation_reason || payload?.reason || "").trim();
}

function writeThreadTargets(targets) {
  ensureDir(path.dirname(AEYE_THREAD_TARGETS_PATH));
  fs.writeFileSync(AEYE_THREAD_TARGETS_PATH, `${JSON.stringify(targets, null, 2)}\n`, "utf8");
}

function registerReceiverThread(payload) {
  const target = String(payload?.target || "").trim();
  const threadId = String(payload?.thread_id || payload?.threadId || "").trim();
  const title = String(payload?.title || "").trim();
  const note = String(payload?.note || "").trim();
  const targets = readThreadTargets();
  const current = targets[target];
  if (!target || !current) {
    const error = new Error(`known target is required; got ${target || "EMPTY_TARGET"}`);
    error.statusCode = 400;
    throw error;
  }
  if (!validateReceiverThreadId(threadId)) {
    const error = new Error("thread_id must be a Codex thread id or durable receiver id");
    error.statusCode = 400;
    throw error;
  }
  const currentConfig = typeof current === "string" ? { thread_id: current } : { ...current };
  if (currentConfig.relay_mode === "DO_NOT_ROUTE" || currentConfig.relay_mode === "LOCAL_ONLY") {
    const error = new Error(`${target} is ${currentConfig.relay_mode}; binding blocked`);
    error.statusCode = 409;
    throw error;
  }
  const existingThreadId = String(currentConfig.thread_id || "").trim();
  if (existingThreadId && existingThreadId === threadId) {
    return {
      status: "AEYE_RECEIVER_HOME_THREAD_ALREADY_BOUND",
      target,
      thread_id: threadId,
      title: currentConfig.title || title || `${target} LIVE Relay Receiver`,
      home_thread_policy: AEYE_HOME_THREAD_POLICY,
      proof_rule: "No new chat was created. This target already uses the requested standing receiver chat.",
      target_threads_path: AEYE_THREAD_TARGETS_PATH,
      target_threads_sha256: fileReadback(AEYE_THREAD_TARGETS_PATH).sha256,
    };
  }
  const rotationRequested = receiverThreadRotationRequested(payload);
  const rotationReason = receiverThreadRotationReason(payload);
  if (existingThreadId && existingThreadId !== threadId && (!rotationRequested || rotationReason.length < 12)) {
    const error = new Error(`HOME_THREAD_ROTATION_REQUIRES_OPERATOR_REASON: ${target} already has a mapped receiver chat; provide route_rotation_requested=true and rotation_reason before replacing it.`);
    error.statusCode = 409;
    error.details = {
      target,
      existing_thread_id: existingThreadId,
      proposed_thread_id: threadId,
      home_thread_policy: AEYE_HOME_THREAD_POLICY,
    };
    throw error;
  }
  const createdAt = new Date().toISOString();
  const stamp = createdAt.replace(/[-:.TZ]/g, "").slice(0, 14);
  const bindingMode = existingThreadId ? "HOME_THREAD_ROTATION" : "INITIAL_HOME_THREAD_BINDING";
  const receiptId = `${existingThreadId ? "RECEIVER_THREAD_ROTATION" : "RECEIVER_THREAD_BINDING"}_${safeReceiptStem(target).toUpperCase()}_${stamp}`;
  const nextConfig = {
    ...currentConfig,
    thread_id: threadId,
    title: title || currentConfig.title || `${target} LIVE Relay Receiver`,
    route_status: "MAPPED_TO_CODEX_THREAD",
    availability: "AVAILABLE_IF_ACTUATOR_ACTIVE",
    relay_mode: "CODEX_THREAD_BRIDGE",
    proof_rule: "Dashboard queue is not delivery. Delivery begins only after the Codex thread bridge posts into this mapped home chat and the receiver writes RECEIVED. New chats require explicit rotation.",
    home_thread_policy: AEYE_HOME_THREAD_POLICY.status,
    thread_reuse_required: true,
    rotation_requires_operator_reason: true,
    bound_at: createdAt,
    binding_receipt_id: receiptId,
  };
  if (existingThreadId) {
    nextConfig.rotated_from_thread_id = existingThreadId;
    nextConfig.rotated_at = createdAt;
    nextConfig.rotation_reason = rotationReason;
  }
  const previousConfig = targets[target];
  targets[target] = nextConfig;
  writeThreadTargets(targets);
  ensureDir(AEYE_THREAD_BINDING_DIR);
  const receipt = {
    receipt_id: receiptId,
    receipt_type: existingThreadId ? "AEYE_RECEIVER_THREAD_ROTATION" : "AEYE_RECEIVER_THREAD_BINDING",
    status: "MAPPING_RECORDED_UNVERIFIED",
    binding_mode: bindingMode,
    created_at: createdAt,
    target,
    thread_id: threadId,
    previous_thread_id: existingThreadId || null,
    rotation_requested: rotationRequested,
    rotation_reason: rotationReason || null,
    home_thread_policy: AEYE_HOME_THREAD_POLICY,
    previous_config: previousConfig,
    next_config: nextConfig,
    note,
    target_threads_path: AEYE_THREAD_TARGETS_PATH,
    target_threads_sha256: fileReadback(AEYE_THREAD_TARGETS_PATH).sha256,
    next_required_proof: "Dispatch a probe to this target and obtain receiver-side RECEIVED then COMPLETED or BLOCKER.",
    proof_rule: "Thread binding is addressability proof only. It is not receiver completion proof.",
  };
  const receiptPath = path.join(AEYE_THREAD_BINDING_DIR, `${receiptId}.json`);
  fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  const readback = fileReadback(receiptPath);
  appendJsonl(AEYE_THREAD_BINDING_LEDGER_PATH, {
    event: existingThreadId ? "AEYE_RECEIVER_THREAD_ROTATED" : "AEYE_RECEIVER_THREAD_BOUND",
    receipt_id: receiptId,
    target,
    thread_id: threadId,
    previous_thread_id: existingThreadId || null,
    binding_mode: bindingMode,
    receipt_path: receiptPath,
    receipt_sha256: readback.sha256,
    created_at: createdAt,
  });
  return {
    status: existingThreadId ? "AEYE_RECEIVER_THREAD_ROTATION_WRITTEN" : "AEYE_RECEIVER_THREAD_BINDING_WRITTEN",
    receipt,
    receipt_path: receiptPath,
    receipt_sha256: readback.sha256,
    byte_count: readback.byte_count,
  };
}

function renderReceiverBootstrapConsole() {
  const latestManifest = latestReceiverBootstrapManifest();
  const missing = receiverBootstrapTargets(50);
  const rows = missing.targets.map((target) => {
    const manifestItem = latestManifest?.bootstraps?.find((item) => item.target === target.target) || {};
    const promptPath = manifestItem.md_path || null;
    const promptText = promptPath && fs.existsSync(promptPath) ? fs.readFileSync(promptPath, "utf8") : receiverBootstrapPrompt(target, `RECEIVER_BOOTSTRAP_${safeReceiptStem(target.target).toUpperCase()}_DRAFT`);
    return `
      <article class="bootstrap-card">
        <div class="topline">
          <strong>${escapeHtml(target.target)}</strong>
          <span class="pill warn">${escapeHtml(target.coverage)}</span>
        </div>
        <div class="meta">Machine: <code>${escapeHtml(target.machine)}</code> | Aeye: <code>${escapeHtml(target.aeye)}</code></div>
        <div class="meta">LAN inbox: <a href="${escapeHtml(target.file_inbox_url)}" target="_blank" rel="noreferrer">${escapeHtml(target.file_inbox_url)}</a></div>
        <div class="meta">Latest waiting packet: <code>${escapeHtml(target.latest_packet_id || "NO_PACKET")}</code></div>
        <div class="meta">Bootstrap file: <code>${escapeHtml(promptPath || "DRAFT_NOT_WRITTEN")}</code></div>
        <textarea readonly>${escapeHtml(promptText)}</textarea>
        <form class="bind-form" data-target="${escapeHtml(target.target)}">
          <input name="thread_id" placeholder="Paste receiver Codex thread id after it exists" />
          <input name="title" placeholder="Optional thread title" />
          <button type="submit">BIND THREAD ID</button>
        </form>
        <div class="bind-status" data-target-status="${escapeHtml(target.target)}">No binding submitted.</div>
      </article>`;
  }).join("");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Aeye Receiver Bootstrap</title>
  <style>
    :root { color-scheme: dark; font-family: Arial, sans-serif; background: #101418; color: #edf2f7; }
    body { margin: 0; padding: 28px; }
    main { max-width: 1100px; margin: 0 auto; }
    h1 { margin: 0 0 6px; }
    .sub { color: #aab6c3; margin-bottom: 18px; line-height: 1.45; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 12px; }
    .bootstrap-card { border: 1px solid #2f4658; border-left: 4px solid #ffd36c; border-radius: 8px; background: #0d1319; padding: 16px; min-width: 0; }
    .topline { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; align-items: center; }
    .pill { display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 12px; font-weight: 700; }
    .warn { background: #3a3015; color: #ffd36c; }
    .ok { background: #153c2e; color: #8df0be; }
    .bad { background: #461d25; color: #ff9aa9; }
    .meta { color: #aab6c3; font-size: 12px; line-height: 1.5; margin: 8px 0; overflow-wrap: anywhere; }
    code { color: #d3e8ff; overflow-wrap: anywhere; }
    textarea { width: 100%; min-height: 260px; box-sizing: border-box; border: 1px solid #405468; border-radius: 6px; background: #080d12; color: #edf2f7; padding: 10px; margin: 10px 0; font-family: Consolas, monospace; font-size: 12px; line-height: 1.35; }
    input { min-width: 0; border: 1px solid #405468; border-radius: 6px; background: #080d12; color: #edf2f7; padding: 10px; }
    button { border: 1px solid #6caee8; border-radius: 6px; color: #edf2f7; background: #24435e; padding: 10px 14px; font-weight: 700; cursor: pointer; }
    .bind-form { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto; gap: 8px; }
    .bind-status { margin-top: 8px; color: #aab6c3; font-size: 12px; overflow-wrap: anywhere; }
    .top-actions { display: flex; gap: 10px; flex-wrap: wrap; margin: 14px 0; }
    a { color: #8fc7ff; }
    @media (max-width: 760px) { .bind-form { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main>
    <h1>Aeye Receiver Bootstrap</h1>
    <div class="sub">This page prepares receiver threads for Aeyes that are stuck at LAN file inbox only. Binding a thread id records addressability, not completion. A probe and receiver receipt are still required.</div>
    <div class="top-actions">
      <button id="build-bootstrap-button">REBUILD BOOTSTRAPS</button>
      <a href="/">Back to Command Dash</a>
      <a href="/v1/relay/missing_receivers?limit=50">Missing receiver JSON</a>
    </div>
    <div class="meta">Latest manifest: <code>${escapeHtml(latestManifest?.manifest_path || "NO_MANIFEST_YET")}</code></div>
    <div class="grid">${rows || `<div class="bootstrap-card"><strong>No missing receiver targets.</strong><div class="meta">Everything routable has either a mapped thread, a topology hold, or local-only status.</div></div>`}</div>
  </main>
  <script>
    document.getElementById("build-bootstrap-button").addEventListener("click", async () => {
      const response = await fetch("/v1/relay/build_receiver_bootstraps", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      const result = await response.json();
      if (!response.ok) alert(result.error || "Bootstrap build failed");
      else window.location.reload();
    });
    document.querySelectorAll(".bind-form").forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const target = form.getAttribute("data-target");
        const status = document.querySelector('[data-target-status="' + CSS.escape(target) + '"]');
        const data = new FormData(form);
        status.textContent = "Binding " + target + "...";
        const response = await fetch("/v1/relay/register_receiver_thread", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ target, thread_id: data.get("thread_id"), title: data.get("title") })
        });
        const result = await response.json();
        status.textContent = response.ok
          ? "Binding written: " + result.receipt.receipt_id + " | " + result.receipt_sha256
          : "Binding blocked: " + (result.error || "unknown error");
      });
    });
  </script>
</body>
</html>`;
}

function isTerminalReceiverStatus(status) {
  const upper = String(status || "").toUpperCase();
  return upper.includes("COMPLETED") || upper.includes("BLOCKER");
}

function readReceiverReceiptForPacket(packet) {
  const receiptPath = packet.last_receiver_receipt_path;
  if (!receiptPath || !fs.existsSync(receiptPath)) {
    return {
      exists: false,
      path: receiptPath || null,
      receipt: null,
      sha256: packet.last_receiver_receipt_sha256 || null,
    };
  }
  const raw = fs.readFileSync(receiptPath);
  return {
    exists: true,
    path: receiptPath,
    receipt: readJson(receiptPath, null),
    sha256: sha256Buffer(raw),
    byte_count: raw.length,
    modified_at: fs.statSync(receiptPath).mtime.toISOString(),
  };
}

function originReturnFromPacket(channel, packet) {
  const receiptReadback = readReceiverReceiptForPacket(packet);
  const receipt = receiptReadback.receipt || {};
  const status = String(packet.status || receipt.status || "UNKNOWN");
  const returnedAt = packet.completed_at || packet.blocked_at || packet.updated_at || receipt.created_at || packet.packet_modified_at || packet.created_at || null;
  return {
    channel,
    packet_id: packet.packet_id || "UNKNOWN_PACKET",
    target: packet.target || "UNKNOWN_TARGET",
    packet_status: status,
    answer_status: receipt.status || packet.last_receiver_status || "UNKNOWN",
    answer_evidence: receipt.evidence || "No receiver evidence text found.",
    returned_at: returnedAt,
    source_packet_path: packet.packet_path || receipt.source_packet_path || null,
    receiver_receipt_id: packet.last_receiver_receipt_id || receipt.receipt_id || "NO_RECEIVER_RECEIPT",
    receiver_receipt_path: receiptReadback.path,
    receiver_receipt_sha256: receiptReadback.sha256,
    receiver_receipt_exists: receiptReadback.exists,
    origin_readback_status: receiptReadback.exists && isTerminalReceiverStatus(status)
      ? "RETURNED_TO_ORIGIN_DASH"
      : "RETURN_NOT_PROVEN",
  };
}

function buildOriginReturnSnapshot(limit = 12) {
  const brainbootReturns = latestBrainbootPackets(200)
    .filter((packet) => isTerminalReceiverStatus(packet.status))
    .map((packet) => originReturnFromPacket("brainboot", packet));
  const relayReturns = latestRelayPackets(200)
    .filter((packet) => isTerminalReceiverStatus(packet.status))
    .map((packet) => originReturnFromPacket("relay", packet));
  const returns = [...brainbootReturns, ...relayReturns]
    .sort((a, b) => String(b.returned_at || "").localeCompare(String(a.returned_at || "")))
    .slice(0, limit);
  const snapshot = {
    status: returns.length ? "ORIGIN_RETURN_READBACK_PROVEN" : "NO_ORIGIN_RETURNS_FOUND",
    generated_at: new Date().toISOString(),
    origin_dash_url: `http://127.0.0.1:${PORT}/`,
    snapshot_path: ORIGIN_DASH_LATEST_RETURN_PATH,
    return_ledger_path: ORIGIN_DASH_RETURN_LEDGER_PATH,
    returned_answer_count: returns.length,
    latest_return: returns[0] || null,
    returns,
    rule: "A receiver answer counts as returned to origin dash only when the origin can read a terminal packet status plus the receiver receipt file and hash.",
  };
  ensureDir(ORIGIN_DASH_RETURN_DIR);
  fs.writeFileSync(ORIGIN_DASH_LATEST_RETURN_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  return snapshot;
}

function recordOriginReturn({ channel, packet, receipt, receipt_path: receiptPath, receipt_sha256: receiptSha256, source_packet_path: sourcePacketPath }) {
  if (!isTerminalReceiverStatus(receipt?.status)) return null;
  const entry = {
    event: "ORIGIN_DASH_RETURNED_ANSWER",
    channel,
    packet_id: packet.packet_id,
    target: packet.target,
    answer_status: receipt.status,
    receiver_receipt_id: receipt.receipt_id,
    receiver_receipt_path: receiptPath,
    receiver_receipt_sha256: receiptSha256,
    answer_evidence: receipt.evidence || "",
    returned_at: receipt.created_at || new Date().toISOString(),
    source_packet_path: sourcePacketPath || packet.packet_path || null,
    origin_dash_url: `http://127.0.0.1:${PORT}/`,
    proof_rule: "Terminal receiver receipt was written and recorded back to origin dash return ledger.",
  };
  appendJsonl(ORIGIN_DASH_RETURN_LEDGER_PATH, entry);
  try {
    buildOriginReturnSnapshot(12);
  } catch (error) {
    appendJsonl(ORIGIN_DASH_RETURN_LEDGER_PATH, {
      event: "ORIGIN_DASH_RETURN_SNAPSHOT_FAILED",
      packet_id: packet.packet_id,
      error: error.message,
      returned_at: new Date().toISOString(),
    });
  }
  return entry;
}

function classifyReturnPurpose(originReturn) {
  const packet = readJson(originReturn.source_packet_path || "", {});
  const packetType = String(packet.packet_type || packet.mission || originReturn.channel || "").toUpperCase();
  const target = originReturn.target || "the target Aeye";
  const answer = originReturn.answer_status || "UNKNOWN";
  const completed = answer === "COMPLETED";
  const blocked = answer === "BLOCKER";

  if (originReturn.channel === "brainboot" || packetType.includes("BRAINBOOT")) {
    return {
      sent: `Session Brainboot/source-truth packet to ${target}.`,
      advanced: completed
        ? `${target} has receiver-side proof that it loaded the session context and can take a next packet.`
        : `${target} returned a Brainboot blocker that must be handled before assigning follow-up work.`,
      decision: `Can ${target} be treated as booted for this session?`,
      recommendation: completed ? "SEND_NEXT_PACKET" : "RESOLVE_BLOCKER",
      operator_choices: blocked ? ["RESOLVE BLOCKER", "RETRY BRAINBOOT", "HOLD"] : ["SEND NEXT PACKET", "ASSIGN WORK", "HOLD"],
      advancement_type: "SESSION_BOOTSTRAP",
    };
  }

  if (packetType.includes("SOURCE_TRUTH_STARTUP")) {
    return {
      sent: `Source-truth startup read request to ${target}.`,
      advanced: completed
        ? `${target} confirmed the source-truth startup packet was received and completed; Ben no longer has to re-explain that context.`
        : `${target} could not complete source-truth startup and needs a routed blocker fix.`,
      decision: `Can source-truth handoff to ${target} stop being Ben-carried?`,
      recommendation: completed ? "TRUST_SESSION_CONTEXT" : "CHASE_OR_REPAIR",
      operator_choices: blocked ? ["REPAIR CONTEXT", "RETRY", "HOLD"] : ["TRUST CONTEXT", "SEND NEXT PACKET", "ASSIGN WORK", "HOLD"],
      advancement_type: "SOURCE_TRUTH_ALIGNMENT",
    };
  }

  if (packetType.includes("REPORT_DELIVERY")) {
    return {
      sent: `Report or receipt pickup packet to ${target}: ${packet.title || originReturn.packet_id}.`,
      advanced: completed
        ? `${target} completed the report handoff; the result can be assimilated or used to spawn the next packet.`
        : `${target} returned a blocker on report pickup; do not assimilate until the blocker is resolved.`,
      decision: "Should this returned report become an assimilation packet, a next mission, or a hold?",
      recommendation: completed ? "ASSIMILATE_OR_SPAWN_NEXT_PACKET" : "RESOLVE_BLOCKER",
      operator_choices: blocked ? ["RESOLVE BLOCKER", "RETRY", "HOLD"] : ["ASSIMILATE", "CREATE NEXT PACKET", "ASSIGN WORK", "HOLD"],
      advancement_type: "REPORT_PICKUP",
    };
  }

  return {
    sent: `Packet ${originReturn.packet_id} to ${target}.`,
    advanced: completed
      ? `${target} returned terminal receiver proof; the handoff is no longer open.`
      : `${target} returned a terminal blocker; the handoff is closed but unresolved.`,
    decision: "Does this returned proof need assimilation, a successor packet, or no action?",
    recommendation: completed ? "REVIEW_FOR_NEXT_ACTION" : "RESOLVE_BLOCKER",
    operator_choices: blocked ? ["RESOLVE BLOCKER", "RETRY", "HOLD"] : ["CREATE NEXT PACKET", "ASSIGN WORK", "ASSIMILATE", "NO ACTION"],
    advancement_type: "GENERIC_HANDOFF",
  };
}

function buildActionableReturnsSnapshot(limit = 8) {
  const origin = buildOriginReturnSnapshot(limit);
  const decisions = readJsonl(ORIGIN_DASH_OPERATOR_DECISIONS_PATH, 500);
  const actionable = (origin.returns || []).map((item) => {
    const purpose = classifyReturnPurpose(item);
    const matchingDecisions = decisions
      .filter((decision) => decision.source_packet_id === item.packet_id || decision.receiver_receipt_id === item.receiver_receipt_id)
      .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
    const latestDecision = matchingDecisions[0] || null;
    return {
      packet_id: item.packet_id,
      target: item.target,
      channel: item.channel,
      returned_at: item.returned_at,
      answer_status: item.answer_status,
      origin_readback_status: item.origin_readback_status,
      receiver_receipt_id: item.receiver_receipt_id,
      receiver_receipt_sha256: item.receiver_receipt_sha256,
      sent: purpose.sent,
      advanced: purpose.advanced,
      helps_decide: purpose.decision,
      recommendation: purpose.recommendation,
      operator_choices: purpose.operator_choices,
      advancement_type: purpose.advancement_type,
      evidence: item.answer_evidence,
      acted_on: Boolean(latestDecision),
      action_status: latestDecision ? "ALREADY_ACTED_ON" : "AWAITING_OPERATOR_DECISION",
      latest_operator_decision: latestDecision,
    };
  });
  const snapshot = {
    status: actionable.length ? "ACTIONABLE_RETURNS_READY" : "NO_ACTIONABLE_RETURNS",
    generated_at: new Date().toISOString(),
    origin_return_status: origin.status,
    actionable_count: actionable.length,
    snapshot_path: ORIGIN_DASH_ACTIONABLE_RETURNS_PATH,
    source_snapshot_path: ORIGIN_DASH_LATEST_RETURN_PATH,
    actionable,
    rule: "This view translates returned receiver proof into what was sent, what advanced, and what the Operator can decide next.",
  };
  ensureDir(ORIGIN_DASH_RETURN_DIR);
  fs.writeFileSync(ORIGIN_DASH_ACTIONABLE_RETURNS_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  return snapshot;
}

function createOperatorIntent(request, payload) {
  const message = String(payload.message || payload.body || "").trim();
  const target = String(payload.target || "Nerdkle.Intake").trim();
  const mode = String(payload.mode || "ASK_NERDKLE").trim().toUpperCase();
  const title = String(payload.title || "").trim();
  if (message.length < 3) {
    const error = new Error("message is required");
    error.statusCode = 400;
    throw error;
  }
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(target)) {
    const error = new Error("target must be Nerdkle.Intake or Aeye.Machine");
    error.statusCode = 400;
    throw error;
  }

  const createdAt = new Date().toISOString();
  const stamp = createdAt.replace(/[-:.TZ]/g, "").slice(0, 14);
  const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
  const intentId = `OPERATOR_INTENT_${safeReceiptStem(target).toUpperCase()}_${stamp}_${suffix}`;
  const intentPath = path.join(NERDKLE_OPERATOR_INTAKE_DIR, `${intentId}.json`);
  const shouldRelay = target !== "Nerdkle.Intake";
  let relayPacket = null;
  if (shouldRelay) {
    relayPacket = createRelayPacket(request, {
      packet_type: mode === "ASSIGN_WORK" ? "OPERATOR_ASSIGNMENT" : "OPERATOR_INTENT",
      target,
      title: title || (mode === "ASSIGN_WORK" ? "Operator assigned work from Flight Deck" : "Operator message from Flight Deck"),
      body: [
        `Operator mode: ${mode}`,
        `Operator intent id: ${intentId}`,
        "",
        message,
        "",
        "Return RECEIVED first, then COMPLETED with answer/artifact or BLOCKER with exact missing proof.",
      ].join("\n"),
      producer: "TinkerDen Flight Deck@Doss",
      destination: "Aeye Relay",
    });
  }

  const intent = {
    intent_id: intentId,
    intent_type: "NERDKLE_OPERATOR_INTENT",
    mode,
    target,
    title: title || null,
    message,
    created_at: createdAt,
    producer: "Operator@FlightDeck",
    storage_path: intentPath,
    relay_dispatched: Boolean(relayPacket),
    relay_packet_id: relayPacket?.packet_id || null,
    relay_receive_url: relayPacket?.receive_url || null,
    status: relayPacket ? "CREATED_AND_RELAY_PACKET_WAITING_FOR_RECEIVER" : "CREATED_LOCAL_NERDKLE_INTAKE",
    rule: "Operator intent is durable only when written to disk. It becomes relay work only if a receiver packet is created and then answered with receipts.",
  };
  ensureDir(NERDKLE_OPERATOR_INTAKE_DIR);
  fs.writeFileSync(intentPath, `${JSON.stringify(intent, null, 2)}\n`, "utf8");
  appendJsonl(NERDKLE_OPERATOR_INTAKE_LEDGER_PATH, intent);
  return {
    status: intent.status,
    intent,
    intent_file: fileReadback(intentPath),
    intake_ledger: fileReadback(NERDKLE_OPERATOR_INTAKE_LEDGER_PATH),
    relay_packet: relayPacket,
    missing_proof: relayPacket ? "Receiver must write RECEIVED then COMPLETED or BLOCKER." : "No receiver selected; this is stored local Nerdkle intake only.",
  };
}

function brainbootPacketPath(packetId) {
  return path.join(BRAINBOOT_OUTBOX_DIR, `${safeReceiptStem(packetId)}.json`);
}

function brainbootReceiptPath(receiptId) {
  return path.join(BRAINBOOT_RECEIPTS_DIR, `${safeReceiptStem(receiptId)}.json`);
}

function bootpackPathForTarget(target, result) {
  return result.output_path
    || (target === "Skybro.Betsy" ? SKYBRO_BOOTPACK_PATH : null)
    || (target === "Petra.Betsy" ? PETRA_BOOTPACK_PATH : null);
}

function brainbootBaseUrl(request) {
  const host = request?.headers?.host ? String(request.headers.host) : "";
  if (host && !host.startsWith("127.0.0.1") && !host.startsWith("localhost")) {
    return `http://${host}`;
  }
  return BRAINBOOT_PUBLIC_BASE_URL;
}

function loadBrainbootPacket(packetId) {
  const packetPath = brainbootPacketPath(packetId);
  if (!fs.existsSync(packetPath)) {
    const error = new Error(`Brainboot packet not found: ${packetId}`);
    error.statusCode = 404;
    throw error;
  }
  return {
    packet_path: packetPath,
    packet: JSON.parse(fs.readFileSync(packetPath, "utf8")),
  };
}

function writeBrainbootPacket(packet) {
  ensureDir(BRAINBOOT_OUTBOX_DIR);
  fs.writeFileSync(brainbootPacketPath(packet.packet_id), `${JSON.stringify(packet, null, 2)}\n`, "utf8");
}

function createBrainbootPacket(request, target, renderResult) {
  const artifact = renderResult.artifact || fileReadback(renderResult.artifact_path);
  const createdAt = new Date().toISOString();
  const stamp = createdAt.replace(/[-:.TZ]/g, "").slice(0, 14);
  const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
  const packetId = `BRAINBOOT_${safeReceiptStem(target).toUpperCase()}_${stamp}_${suffix}`;
  const ackToken = crypto.randomBytes(16).toString("hex").toUpperCase();
  const baseUrl = brainbootBaseUrl(request);
  const packet = {
    packet_id: packetId,
    packet_type: "BRAINBOOT_DELIVERY",
    mission: "SESSION_NERDKLE_BRAINBOOT",
    producer: "Swanson@Doss",
    target,
    status: "SENT_UNACKNOWLEDGED",
    created_at: createdAt,
    ack_token: ackToken,
    receive_url: `${baseUrl}/brainboot/receive/${encodeURIComponent(packetId)}?token=${encodeURIComponent(ackToken)}`,
    ack_endpoint: `${baseUrl}/v1/brainboot/ack`,
    bootpack_path: renderResult.artifact_path,
    bootpack_sha256: artifact && artifact.exists ? artifact.sha256 : null,
    bootpack_byte_count: artifact && artifact.exists ? artifact.byte_count : null,
    required_receiver_receipts: [
      "RECEIVED",
      "COMPLETED or BLOCKER",
    ],
    rule: "Rendered is not delivered. This packet is incomplete until the target writes a receiver-side Brainboot receipt.",
  };
  writeBrainbootPacket(packet);
  appendJsonl(BRAINBOOT_LEDGER_PATH, {
    event: "BRAINBOOT_PACKET_SENT",
    packet_id: packet.packet_id,
    target: packet.target,
    status: packet.status,
    receive_url: packet.receive_url,
    bootpack_sha256: packet.bootpack_sha256,
    created_at: packet.created_at,
  });
  const threadBridge = enqueueThreadBridgePacket(packet, "brainboot");
  const bridgeActuator = threadBridgeActuatorStatus();
  packet.thread_bridge = {
    status: threadBridge.status,
    queue_id: threadBridge.queue_id,
    queue_path: threadBridge.queue_path,
    thread_id: threadBridge.thread_id,
    relay_mode: threadBridge.relay_mode,
    route_status: threadBridge.route_status,
    file_inbox_url: threadBridge.file_inbox_url || null,
    file_inbox_path: threadBridge.file_inbox_path || null,
    actuator_status: bridgeActuator.status,
    actuator_active: bridgeActuator.active,
    operator_meaning: bridgeActuator.operator_meaning,
  };
  writeBrainbootPacket(packet);
  return packet;
}

function latestBrainbootPackets(limit = 20) {
  ensureDir(BRAINBOOT_OUTBOX_DIR);
  const packets = fs.readdirSync(BRAINBOOT_OUTBOX_DIR)
    .filter((name) => name.toLowerCase().endsWith(".json"))
    .map((name) => {
      const packetPath = path.join(BRAINBOOT_OUTBOX_DIR, name);
      try {
        const packet = JSON.parse(fs.readFileSync(packetPath, "utf8"));
        return {
          ...packet,
          packet_path: packetPath,
          packet_modified_at: fs.statSync(packetPath).mtime.toISOString(),
        };
      } catch (error) {
        return {
          packet_id: name,
          status: "INVALID_PACKET_JSON",
          error: error.message,
          packet_path: packetPath,
        };
      }
    })
    .sort((a, b) => String(b.created_at || b.packet_modified_at || "").localeCompare(String(a.created_at || a.packet_modified_at || "")))
    .slice(0, limit);
  return packets;
}

function targetMatches(packet, target) {
  return String(packet.target || "").toLowerCase() === String(target || "").toLowerCase();
}

function latestBrainbootPacketsForTarget(target, limit = 20) {
  return latestBrainbootPackets(200).filter((packet) => targetMatches(packet, target)).slice(0, limit);
}

function writeBrainbootAck(payload) {
  const packetId = String(payload.packet_id || "").trim();
  const ackToken = String(payload.ack_token || payload.token || "").trim();
  const status = String(payload.status || "").trim().toUpperCase();
  const evidence = String(payload.evidence || "").trim();
  const receiver = String(payload.receiver || "").trim();

  if (!packetId) {
    const error = new Error("packet_id is required");
    error.statusCode = 400;
    throw error;
  }
  if (!["RECEIVED", "COMPLETED", "BLOCKER"].includes(status)) {
    const error = new Error("status must be RECEIVED, COMPLETED, or BLOCKER");
    error.statusCode = 400;
    throw error;
  }
  const { packet_path: packetPath, packet } = loadBrainbootPacket(packetId);
  if (!ackToken || ackToken !== packet.ack_token) {
    const error = new Error("valid ack_token is required");
    error.statusCode = 403;
    throw error;
  }
  if ((status === "COMPLETED" || status === "BLOCKER") && evidence.length < 3) {
    const error = new Error("evidence is required for COMPLETED or BLOCKER");
    error.statusCode = 400;
    throw error;
  }

  const createdAt = new Date().toISOString();
  const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
  const receiptId = `${safeReceiptStem(packetId)}_${status}_RECEIPT_${suffix}`;
  const receipt = {
    receipt_id: receiptId,
    receipt_type: "BRAINBOOT_RECEIVER_RECEIPT",
    packet_id: packetId,
    target: packet.target,
    receiver: receiver || packet.target,
    status,
    evidence: evidence || `Receiver reported ${status}.`,
    bootpack_path: packet.bootpack_path,
    bootpack_sha256: packet.bootpack_sha256,
    created_at: createdAt,
    source_packet_path: packetPath,
  };
  const receiptJson = `${JSON.stringify(receipt, null, 2)}\n`;
  ensureDir(BRAINBOOT_RECEIPTS_DIR);
  const receiptPath = brainbootReceiptPath(receiptId);
  fs.writeFileSync(receiptPath, receiptJson, "utf8");

  const updatedPacket = {
    ...packet,
    status: status === "RECEIVED" ? "RECEIVED_NOT_COMPLETED" : `${status}_RECEIPT_PROVEN`,
    last_receiver_status: status,
    last_receiver_receipt_id: receiptId,
    last_receiver_receipt_path: receiptPath,
    last_receiver_receipt_sha256: sha256Buffer(Buffer.from(receiptJson, "utf8")),
    updated_at: createdAt,
  };
  if (status === "RECEIVED") updatedPacket.received_at = createdAt;
  if (status === "COMPLETED") updatedPacket.completed_at = createdAt;
  if (status === "BLOCKER") updatedPacket.blocked_at = createdAt;
  writeBrainbootPacket(updatedPacket);
  appendJsonl(BRAINBOOT_LEDGER_PATH, {
    event: "BRAINBOOT_RECEIVER_RECEIPT",
    packet_id: packetId,
    receipt_id: receiptId,
    target: packet.target,
    receiver: receipt.receiver,
    status,
    receipt_path: receiptPath,
    receipt_sha256: updatedPacket.last_receiver_receipt_sha256,
    created_at: createdAt,
  });
  recordOriginReturn({
    channel: "brainboot",
    packet: updatedPacket,
    receipt,
    receipt_path: receiptPath,
    receipt_sha256: updatedPacket.last_receiver_receipt_sha256,
    source_packet_path: packetPath,
  });

  return {
    status: "BRAINBOOT_RECEIVER_RECEIPT_WRITTEN",
    packet: updatedPacket,
    receipt,
    receipt_path: receiptPath,
    receipt_sha256: updatedPacket.last_receiver_receipt_sha256,
    byte_count: Buffer.byteLength(receiptJson, "utf8"),
  };
}

function relayPacketPath(packetId) {
  return path.join(AEYE_RELAY_OUTBOX_DIR, `${safeReceiptStem(packetId)}.json`);
}

function relayReceiptPath(receiptId) {
  return path.join(AEYE_RELAY_RECEIPTS_DIR, `${safeReceiptStem(receiptId)}.json`);
}

function loadRelayPacket(packetId) {
  const packetPath = relayPacketPath(packetId);
  if (!fs.existsSync(packetPath)) {
    const error = new Error(`Relay packet not found: ${packetId}`);
    error.statusCode = 404;
    throw error;
  }
  return {
    packet_path: packetPath,
    packet: JSON.parse(fs.readFileSync(packetPath, "utf8")),
  };
}

function writeRelayPacket(packet) {
  ensureDir(AEYE_RELAY_OUTBOX_DIR);
  fs.writeFileSync(relayPacketPath(packet.packet_id), `${JSON.stringify(packet, null, 2)}\n`, "utf8");
}

function createRelayPacket(request, payload) {
  const packetType = String(payload.packet_type || "REPORT_DELIVERY").trim().toUpperCase();
  const target = String(payload.target || "").trim();
  const title = String(payload.title || "").trim();
  const body = String(payload.body || payload.report || "").trim();
  const evidencePath = String(payload.evidence_path || "").trim();
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(target)) {
    const error = new Error("target must be Aeye.Machine");
    error.statusCode = 400;
    throw error;
  }
  if (!title) {
    const error = new Error("title is required");
    error.statusCode = 400;
    throw error;
  }
  if (!body && !evidencePath) {
    const error = new Error("body or evidence_path is required");
    error.statusCode = 400;
    throw error;
  }

  const createdAt = new Date().toISOString();
  const stamp = createdAt.replace(/[-:.TZ]/g, "").slice(0, 14);
  const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
  const packetId = `${safeReceiptStem(packetType)}_${safeReceiptStem(target).toUpperCase()}_${stamp}_${suffix}`;
  const ackToken = crypto.randomBytes(16).toString("hex").toUpperCase();
  const baseUrl = brainbootBaseUrl(request);
  const packet = {
    packet_id: packetId,
    packet_type: packetType,
    title,
    body,
    evidence_path: evidencePath || null,
    producer: String(payload.producer || "TinkerDen@Doss"),
    target,
    destination: String(payload.destination || "Aeye Relay").trim(),
    status: "SENT_UNACKNOWLEDGED",
    created_at: createdAt,
    ack_token: ackToken,
    receive_url: `${baseUrl}/relay/receive/${encodeURIComponent(packetId)}?token=${encodeURIComponent(ackToken)}`,
    ack_endpoint: `${baseUrl}/v1/relay/ack`,
    required_receiver_receipts: [
      "RECEIVED",
      "COMPLETED or BLOCKER",
    ],
    rule: "Sent is not delivered. This packet is incomplete until the target writes a receiver-side relay receipt.",
  };
  writeRelayPacket(packet);
  appendJsonl(AEYE_RELAY_LEDGER_PATH, {
    event: "AEYE_RELAY_PACKET_SENT",
    packet_id: packet.packet_id,
    packet_type: packet.packet_type,
    target: packet.target,
    status: packet.status,
    receive_url: packet.receive_url,
    created_at: packet.created_at,
  });
  const threadBridge = enqueueThreadBridgePacket(packet, "relay");
  const bridgeActuator = threadBridgeActuatorStatus();
  packet.thread_bridge = {
    status: threadBridge.status,
    queue_id: threadBridge.queue_id,
    queue_path: threadBridge.queue_path,
    thread_id: threadBridge.thread_id,
    relay_mode: threadBridge.relay_mode,
    route_status: threadBridge.route_status,
    file_inbox_url: threadBridge.file_inbox_url || null,
    file_inbox_path: threadBridge.file_inbox_path || null,
    actuator_status: bridgeActuator.status,
    actuator_active: bridgeActuator.active,
    operator_meaning: bridgeActuator.operator_meaning,
  };
  writeRelayPacket(packet);
  return packet;
}

function actionChoiceDispatches(choice) {
  const upper = String(choice || "").toUpperCase();
  if (!upper || upper === "HOLD") return false;
  return (
    upper.includes("SEND")
    || upper.includes("ASSIGN")
    || upper.includes("CREATE")
    || upper.includes("TRUST")
    || upper.includes("ASSIMILATE")
  );
}

function actionChoicePacketType(choice) {
  const upper = String(choice || "").toUpperCase();
  if (upper.includes("ASSIGN")) return "ASSIGN_WORK_FROM_RETURN";
  if (upper.includes("SEND")) return "NEXT_PACKET_FROM_RETURN";
  if (upper.includes("ASSIMILATE")) return "ASSIMILATION_FROM_RETURN";
  if (upper.includes("CREATE")) return "NEXT_PACKET_FROM_RETURN";
  return "ACTIONABLE_RETURN_DECISION";
}

function actionChoiceInstruction(choice) {
  const upper = String(choice || "").toUpperCase();
  if (upper.includes("ASSIGN")) {
    return "Treat this as a work assignment request. Use the returned proof as context, do the smallest useful work you can, and return ARTIFACT or BLOCKER with exact evidence.";
  }
  if (upper.includes("SEND")) {
    return "Continue the handoff chain from this returned proof. Accept the next packet context and return RECEIVED then COMPLETED or BLOCKER.";
  }
  if (upper.includes("ASSIMILATE")) {
    return "Convert the returned answer into durable shared truth, a next rule, a source-truth update, or a follow-up packet. Return ARTIFACT or BLOCKER.";
  }
  return "Continue from this returned proof without asking Ben to restate context. Return ARTIFACT or BLOCKER.";
}

function actionChoiceMeaning(choice) {
  const upper = String(choice || "").toUpperCase();
  if (upper.includes("TRUST")) return "Accept this receiver answer as enough session context to stop re-explaining this item manually.";
  if (upper.includes("ASSIGN")) return "Turn this returned answer into a concrete work request for the receiver.";
  if (upper.includes("NEXT") || upper.includes("SEND") || upper.includes("CREATE")) return "Continue this same handoff chain by creating the next packet.";
  if (upper.includes("ASSIMILATE")) return "Move the returned answer toward memory/doctrine after proof review.";
  if (upper.includes("RETRY")) return "Send the same kind of packet again because the first path did not close cleanly.";
  if (upper.includes("REPAIR") || upper.includes("RESOLVE")) return "Create a blocker-fix packet before trusting or advancing this answer.";
  if (upper.includes("HOLD") || upper.includes("NO ACTION")) return "Record that you are not advancing this answer yet.";
  return "Record this operator choice and create the smallest follow-up packet only when needed.";
}

function recordActionableDecision(request, payload) {
  const choice = String(payload.choice || "").trim();
  const target = String(payload.target || "").trim();
  const sourcePacketId = String(payload.source_packet_id || payload.packet_id || "").trim();
  const receiverReceiptId = String(payload.receiver_receipt_id || "").trim();
  const advanced = String(payload.advanced || "").trim();
  const helpsDecide = String(payload.helps_decide || "").trim();
  if (!choice) {
    const error = new Error("choice is required");
    error.statusCode = 400;
    throw error;
  }
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(target)) {
    const error = new Error("target must be Aeye.Machine");
    error.statusCode = 400;
    throw error;
  }
  if (!sourcePacketId) {
    const error = new Error("source_packet_id is required");
    error.statusCode = 400;
    throw error;
  }

  const createdAt = new Date().toISOString();
  const decisionId = `ORIGIN_DECISION_${safeReceiptStem(target).toUpperCase()}_${createdAt.replace(/[-:.TZ]/g, "").slice(0, 14)}_${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  let relayPacket = null;
  if (actionChoiceDispatches(choice)) {
    relayPacket = createRelayPacket(request, {
      packet_type: actionChoicePacketType(choice),
      target,
      title: `${choice} from returned answer`,
      body: [
        `Operator selected: ${choice}`,
        `Source returned packet: ${sourcePacketId}`,
        `Receiver receipt: ${receiverReceiptId || "NO_RECEIPT_PROVIDED"}`,
        `What advanced: ${advanced || "No advancement summary."}`,
        `Decision this answered: ${helpsDecide || "No decision question."}`,
        "",
        `Next action: ${actionChoiceInstruction(choice)}`,
      ].join("\n"),
      producer: "TinkerDen Flight Deck@Doss",
      destination: "Aeye Relay",
    });
  }

  const decision = {
    decision_id: decisionId,
    decision_type: "ACTIONABLE_RETURN_OPERATOR_DECISION",
    choice,
    target,
    source_packet_id: sourcePacketId,
    receiver_receipt_id: receiverReceiptId || null,
    advanced: advanced || null,
    helps_decide: helpsDecide || null,
    followup_dispatched: Boolean(relayPacket),
    followup_packet_id: relayPacket?.packet_id || null,
    created_at: createdAt,
    producer: "TinkerDen Flight Deck@Doss",
    rule: "Returned answers become durable operator decisions. SENT is still not success; follow-up packets require receiver receipts.",
  };
  appendJsonl(ORIGIN_DASH_OPERATOR_DECISIONS_PATH, decision);
  return {
    status: relayPacket ? "ACTIONABLE_DECISION_LOGGED_AND_PACKET_DISPATCHED" : "ACTIONABLE_DECISION_LOGGED",
    decision,
    relay_packet: relayPacket,
    decision_log: fileReadback(ORIGIN_DASH_OPERATOR_DECISIONS_PATH),
  };
}

function latestRelayPackets(limit = 20) {
  ensureDir(AEYE_RELAY_OUTBOX_DIR);
  return fs.readdirSync(AEYE_RELAY_OUTBOX_DIR)
    .filter((name) => name.toLowerCase().endsWith(".json"))
    .map((name) => {
      const packetPath = path.join(AEYE_RELAY_OUTBOX_DIR, name);
      try {
        const packet = JSON.parse(fs.readFileSync(packetPath, "utf8"));
        return {
          ...packet,
          packet_path: packetPath,
          packet_modified_at: fs.statSync(packetPath).mtime.toISOString(),
        };
      } catch (error) {
        return {
          packet_id: name,
          status: "INVALID_PACKET_JSON",
          error: error.message,
          packet_path: packetPath,
        };
      }
    })
    .sort((a, b) => String(b.created_at || b.packet_modified_at || "").localeCompare(String(a.created_at || a.packet_modified_at || "")))
    .slice(0, limit);
}

function latestRelayPacketsForTarget(target, limit = 20) {
  return latestRelayPackets(200).filter((packet) => targetMatches(packet, target)).slice(0, limit);
}

function packetSortStamp(packet) {
  return String(
    packet.updated_at ||
    packet.completed_at ||
    packet.blocked_at ||
    packet.received_at ||
    packet.created_at ||
    packet.packet_modified_at ||
    ""
  );
}

function latestReceiverProofForTarget(target) {
  const packets = [
    ...latestRelayPacketsForTarget(target, 20).map((packet) => ({ ...packet, channel: "relay" })),
    ...latestBrainbootPacketsForTarget(target, 20).map((packet) => ({ ...packet, channel: "brainboot" })),
  ].sort((a, b) => packetSortStamp(b).localeCompare(packetSortStamp(a)));
  const packet = packets[0] || null;
  if (!packet) {
    return {
      latest_packet_channel: null,
      latest_receiver_packet_id: null,
      latest_packet_status: "NO_PACKET_PLACED_YET",
      latest_packet_created_at: null,
      latest_packet_updated_at: null,
      latest_receiver_status: null,
      latest_receiver_receipt_id: null,
      latest_receiver_receipt_path: null,
      latest_receiver_receipt_sha256: null,
      latest_completion_state: "NO_PACKET_PLACED_YET",
      latest_proof_gap: "No relay or Brainboot packet has been created for this target yet.",
    };
  }
  const status = String(packet.status || "UNKNOWN_PACKET_STATUS").toUpperCase();
  let completionState = status;
  let proofGap = "Receiver proof is incomplete.";
  if (status === "COMPLETED_RECEIPT_PROVEN") {
    completionState = "COMPLETED_RECEIPT_PROVEN";
    proofGap = "Receiver returned COMPLETED with a durable receipt. This target packet has round-trip proof.";
  } else if (status === "BLOCKER_RECEIPT_PROVEN") {
    completionState = "BLOCKER_RECEIPT_PROVEN";
    proofGap = "Receiver returned BLOCKER with a durable receipt. Work did not complete, but the handoff returned.";
  } else if (status === "RECEIVED_NOT_COMPLETED") {
    completionState = "RECEIVED_NOT_COMPLETED";
    proofGap = "Receiver wrote RECEIVED, but still owes COMPLETED or BLOCKER.";
  } else if (status === "SENT_UNACKNOWLEDGED") {
    const bridgeStatus = String(packet.thread_bridge?.status || "").toUpperCase();
    completionState = bridgeStatus || "SENT_UNACKNOWLEDGED";
    proofGap = bridgeStatus === "FILE_INBOX_WAITING_FOR_RECEIVER"
      ? "Packet is in the LAN file inbox. Receiver has not written RECEIVED yet."
      : bridgeStatus === "SENT_TO_CODEX_THREAD"
        ? "Packet was posted to the mapped Aeye chat. Receiver has not written RECEIVED yet."
        : "Packet was created locally, but receiver-side proof is still missing.";
  }
  return {
    latest_packet_channel: packet.channel,
    latest_receiver_packet_id: packet.packet_id || null,
    latest_packet_status: status,
    latest_packet_created_at: packet.created_at || null,
    latest_packet_updated_at: packet.updated_at || null,
    latest_receiver_status: packet.last_receiver_status || null,
    latest_receiver_receipt_id: packet.last_receiver_receipt_id || null,
    latest_receiver_receipt_path: packet.last_receiver_receipt_path || null,
    latest_receiver_receipt_sha256: packet.last_receiver_receipt_sha256 || null,
    latest_completion_state: completionState,
    latest_proof_gap: proofGap,
  };
}

function writeRelayAck(payload) {
  const packetId = String(payload.packet_id || "").trim();
  const ackToken = String(payload.ack_token || payload.token || "").trim();
  const status = String(payload.status || "").trim().toUpperCase();
  const evidence = String(payload.evidence || "").trim();
  const receiver = String(payload.receiver || "").trim();
  if (!packetId) {
    const error = new Error("packet_id is required");
    error.statusCode = 400;
    throw error;
  }
  if (!["RECEIVED", "COMPLETED", "BLOCKER"].includes(status)) {
    const error = new Error("status must be RECEIVED, COMPLETED, or BLOCKER");
    error.statusCode = 400;
    throw error;
  }
  const { packet_path: packetPath, packet } = loadRelayPacket(packetId);
  if (!ackToken || ackToken !== packet.ack_token) {
    const error = new Error("valid ack_token is required");
    error.statusCode = 403;
    throw error;
  }
  if ((status === "COMPLETED" || status === "BLOCKER") && evidence.length < 3) {
    const error = new Error("evidence is required for COMPLETED or BLOCKER");
    error.statusCode = 400;
    throw error;
  }

  const createdAt = new Date().toISOString();
  const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
  const receiptId = `${safeReceiptStem(packetId)}_${status}_RECEIPT_${suffix}`;
  const receipt = {
    receipt_id: receiptId,
    receipt_type: "AEYE_RELAY_RECEIVER_RECEIPT",
    packet_id: packetId,
    packet_type: packet.packet_type,
    target: packet.target,
    receiver: receiver || packet.target,
    status,
    evidence: evidence || `Receiver reported ${status}.`,
    created_at: createdAt,
    source_packet_path: packetPath,
  };
  const receiptJson = `${JSON.stringify(receipt, null, 2)}\n`;
  ensureDir(AEYE_RELAY_RECEIPTS_DIR);
  const receiptPath = relayReceiptPath(receiptId);
  fs.writeFileSync(receiptPath, receiptJson, "utf8");

  const updatedPacket = {
    ...packet,
    status: status === "RECEIVED" ? "RECEIVED_NOT_COMPLETED" : `${status}_RECEIPT_PROVEN`,
    last_receiver_status: status,
    last_receiver_receipt_id: receiptId,
    last_receiver_receipt_path: receiptPath,
    last_receiver_receipt_sha256: sha256Buffer(Buffer.from(receiptJson, "utf8")),
    updated_at: createdAt,
  };
  if (status === "RECEIVED") updatedPacket.received_at = createdAt;
  if (status === "COMPLETED") updatedPacket.completed_at = createdAt;
  if (status === "BLOCKER") updatedPacket.blocked_at = createdAt;
  writeRelayPacket(updatedPacket);
  appendJsonl(AEYE_RELAY_LEDGER_PATH, {
    event: "AEYE_RELAY_RECEIVER_RECEIPT",
    packet_id: packetId,
    receipt_id: receiptId,
    packet_type: packet.packet_type,
    target: packet.target,
    receiver: receipt.receiver,
    status,
    receipt_path: receiptPath,
    receipt_sha256: updatedPacket.last_receiver_receipt_sha256,
    created_at: createdAt,
  });
  recordOriginReturn({
    channel: "relay",
    packet: updatedPacket,
    receipt,
    receipt_path: receiptPath,
    receipt_sha256: updatedPacket.last_receiver_receipt_sha256,
    source_packet_path: packetPath,
  });

  return {
    status: "AEYE_RELAY_RECEIVER_RECEIPT_WRITTEN",
    packet: updatedPacket,
    receipt,
    receipt_path: receiptPath,
    receipt_sha256: updatedPacket.last_receiver_receipt_sha256,
    byte_count: Buffer.byteLength(receiptJson, "utf8"),
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function daemonSnapshot() {
  const healthPath = path.join(TINKARDEN_ROOT, "nervous_system", "daemon_health.json");
  const heatPath = path.join(TINKARDEN_ROOT, "nervous_system", "frictional_heat.json");
  return {
    generated_at: new Date().toISOString(),
    health: readJson(healthPath, { status: "MISSING", path: healthPath }),
    heat: readJson(heatPath, { status: "MISSING", path: heatPath }),
  };
}

function relayStatusClass(status) {
  const upper = String(status || "").toUpperCase();
  if (upper.includes("COMPLETED")) return "ok";
  if (upper.includes("BLOCKER") || upper.includes("INVALID")) return "bad";
  return "warn";
}

function relayCardClass(status) {
  const upper = String(status || "").toUpperCase();
  if (upper.includes("COMPLETED")) return "complete";
  if (upper.includes("BLOCKER") || upper.includes("INVALID")) return "blocker";
  return "pending";
}

function renderRelayCockpitPacket(packet) {
  const channel = packet.channel || "relay";
  const title = packet.title || packet.mission || packet.packet_type || "Packet";
  return `
      <article class="live-packet ${relayCardClass(packet.status)}">
        <div class="live-packet-head">
          <strong>${escapeHtml(packet.target || "UNKNOWN_TARGET")}</strong>
          <span class="pill ${relayStatusClass(packet.status)}">${escapeHtml(packet.status || "UNKNOWN")}</span>
        </div>
        <div class="live-packet-title">${escapeHtml(title)}</div>
        <div class="live-packet-meta">
          <div>channel: <code>${escapeHtml(channel)}</code></div>
          <div>packet: <code>${escapeHtml(packet.packet_id || "UNKNOWN")}</code></div>
          <div>last receipt: <code>${escapeHtml(packet.last_receiver_receipt_id || "NO_RECEIVER_RECEIPT")}</code></div>
          <div>${packet.receive_url ? `<a href="${escapeHtml(packet.receive_url)}" target="_blank" rel="noreferrer">open receiver page</a>` : "no receiver page"}</div>
        </div>
      </article>`;
}

function proofPillClass(status) {
  const upper = String(status || "").toUpperCase();
  if (upper === "PASS") return "ok";
  if (upper === "PARTIAL") return "warn";
  return "bad";
}

function readRelayE2EProof() {
  const proof = readJson(AEYE_RELAY_E2E_PROOF_PATH, null);
  if (!proof || !Array.isArray(proof.criteria)) {
    return {
      proof_id: "NO_E2E_PROOF",
      overall_status: "NO_AEYE_RELAY_E2E_PROOF",
      generated_at: new Date().toISOString(),
      proof_path: AEYE_RELAY_E2E_PROOF_PATH,
      criteria: [
        {
          letter: "A-G",
          name: "end-to-end Aeye relay proof",
          status: "FAIL",
          proof: "No durable A-G proof file exists yet.",
          evidence: AEYE_RELAY_E2E_PROOF_PATH,
        },
      ],
      open_failures: [
        "No receiver-thread proof has been recorded in the dashboard proof ledger.",
      ],
    };
  }
  return proof;
}

function renderProofCriterion(item) {
  return `
    <tr>
      <td>${escapeHtml(item.letter || "")}</td>
      <td>${escapeHtml(item.name || "")}</td>
      <td><span class="pill ${proofPillClass(item.status)}">${escapeHtml(item.status || "UNKNOWN")}</span></td>
      <td>${escapeHtml(item.proof || "")}</td>
      <td><code>${escapeHtml(item.evidence || "")}</code></td>
    </tr>`;
}

function overallProofPillClass(status) {
  const value = String(status || "");
  if (value.includes("CHASES_CLEARED")) return "warn";
  if (value.includes("PROOF") || value.includes("PASS")) return "warn";
  return "bad";
}

function renderRelayE2EProof(proof) {
  const criteria = Array.isArray(proof.criteria) ? proof.criteria : [];
  const failures = Array.isArray(proof.open_failures) ? proof.open_failures : [];
  const autopilot = proof.autopilot || {};
  const rows = criteria.map(renderProofCriterion).join("");
  const failureItems = failures.map((failure) => `<li>${escapeHtml(failure)}</li>`).join("");
  return `
    <section class="e2e-proof" data-testid="relay-e2e-proof">
      <div class="label">A-G Success Contract</div>
      <h2>Real Relay Proof, Not Dashboard Theater</h2>
      <div class="proof-head">
        <span class="pill ${overallProofPillClass(proof.overall_status)}">${escapeHtml(proof.overall_status || "UNKNOWN")}</span>
        <span>target: <code>${escapeHtml(proof.target || "UNKNOWN")}</code></span>
        <span>thread: <code>${escapeHtml(proof.receiver_thread_id || "NO_THREAD_PROOF")}</code></span>
      </div>
      <div class="rec-text">A packet is not successful because it was rendered, sent, or shown on a local page. This panel only counts a loop when an Aeye chat/query exists, the receiver writes proof, and the relay reads that answer back.</div>
      <table class="proof-table">
        <thead>
          <tr><th>Gate</th><th>Required Proof</th><th>Status</th><th>What Proved It</th><th>Evidence</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="proof-receipts">
        <div>packet: <code>${escapeHtml(proof.packet_id || "NO_PACKET")}</code></div>
        <div>received receipt: <code>${escapeHtml(proof.received_receipt?.receipt_id || "NO_RECEIVED_RECEIPT")}</code></div>
        <div>completed receipt: <code>${escapeHtml(proof.completed_receipt?.receipt_id || "NO_COMPLETED_RECEIPT")}</code></div>
        <div>dashboard proof file: <code>${escapeHtml(AEYE_RELAY_E2E_PROOF_PATH)}</code></div>
        <div>autopilot actuator: <code>${escapeHtml(autopilot.automation_id || "NO_AUTOPILOT")}</code></div>
        <div>autopilot scope: <code>${escapeHtml(autopilot.scope || "UNRECORDED")}</code></div>
      </div>
      ${failureItems ? `<div class="open-failures"><strong>Still not proven:</strong><ul>${failureItems}</ul></div>` : ""}
    </section>`;
}

function readRelayChaserStatus() {
  return readJson(AEYE_RELAY_CHASER_STATUS_PATH, {
    sensor: "RELAY_CHASER_V0",
    generated_at: new Date().toISOString(),
    status: "NO_CHASER_STATUS",
    stale_incomplete_count: 0,
    incomplete_count: 0,
    chases: [],
    rule: "Relay chaser has not produced a status file yet.",
  });
}

function readNextRelayChase() {
  const chaser = readRelayChaserStatus();
  const chases = Array.isArray(chaser.chases) ? chaser.chases : [];
  const next = chases[0] || null;
  let chase_text = null;
  if (next?.output_path && fs.existsSync(next.output_path)) {
    chase_text = fs.readFileSync(next.output_path, "utf8");
  }
  return {
    status: next ? "NEXT_CHASE_READY" : "NO_CHASE_REQUIRED",
    chaser_status: chaser.status,
    stale_incomplete_count: chaser.stale_incomplete_count || 0,
    next_chase: next,
    chase_text,
    rule: "This is the next durable successor packet for an unanswered handoff. It is not a receiver receipt.",
  };
}

function renderRelayChaser(chaser) {
  const chases = Array.isArray(chaser.chases) ? chaser.chases : [];
  const next = chases[0] || null;
  const rows = chases.slice(0, 8).map((chase) => `
    <tr>
      <td>${escapeHtml(chase.target || "UNKNOWN")}</td>
      <td><code>${escapeHtml(chase.source_packet_id || "UNKNOWN")}</code></td>
      <td>${escapeHtml(chase.channel || "")}</td>
      <td><a href="${escapeHtml(chase.receive_url || "#")}" target="_blank" rel="noreferrer">receiver</a></td>
      <td><code>${escapeHtml(chase.output_path || "")}</code></td>
    </tr>`).join("");
  return `
    <section class="relay-chaser" data-testid="relay-chaser">
      <div class="label">Dropped Handoff Chaser</div>
      <h2>Unanswered Packets Create Successors</h2>
      <div class="proof-head">
        <span class="pill ${chaser.status === "CHASE_REQUIRED" ? "warn" : "ok"}">${escapeHtml(chaser.status || "UNKNOWN")}</span>
        <span>incomplete: <code>${escapeHtml(chaser.incomplete_count ?? 0)}</code></span>
        <span>stale: <code>${escapeHtml(chaser.stale_incomplete_count ?? 0)}</code></span>
        <span>superseded: <code>${escapeHtml(chaser.superseded_stale_count ?? 0)}</code></span>
        <span>updated: <code>${escapeHtml(chaser.generated_at || "unknown")}</code></span>
      </div>
      <div class="rec-text">The chaser does not call SENT a receipt. If a packet sits unanswered past the threshold, it writes a durable CHASE_REQUIRED packet with the receiver URL, evidence required, and failure condition.</div>
      ${next ? `<div class="next-chase"><strong>Next chase:</strong> <code>${escapeHtml(next.source_packet_id || "UNKNOWN")}</code> for <code>${escapeHtml(next.target || "UNKNOWN")}</code><div class="quick-actions"><a href="${escapeHtml(next.receive_url || "#")}" target="_blank" rel="noreferrer">Open Next Receiver</a><a href="/v1/relay/next_chase" target="_blank" rel="noreferrer">Read Next Chase JSON</a></div></div>` : ""}
      ${rows ? `<table><thead><tr><th>Target</th><th>Source Packet</th><th>Channel</th><th>Open</th><th>Chase Artifact</th></tr></thead><tbody>${rows}</tbody></table>` : `<div class="proof-receipts">No stale dropped handoffs found by the latest chaser scan.</div>`}
    </section>`;
}

function renderOriginReturnPanel(snapshot) {
  const returns = Array.isArray(snapshot.returns) ? snapshot.returns : [];
  const cards = returns.slice(0, 6).map((item) => `
    <article class="origin-return-card ${item.answer_status === "BLOCKER" ? "blocker" : "complete"}">
      <div class="topline">
        <strong>${escapeHtml(item.target || "UNKNOWN_TARGET")}</strong>
        <span class="pill ${item.answer_status === "BLOCKER" ? "bad" : "ok"}">${escapeHtml(item.origin_readback_status || "UNKNOWN")}</span>
      </div>
      <div class="meta">
        <div>packet: <code>${escapeHtml(item.packet_id || "UNKNOWN_PACKET")}</code></div>
        <div>channel: <code>${escapeHtml(item.channel || "UNKNOWN")}</code> | answer: <code>${escapeHtml(item.answer_status || "UNKNOWN")}</code></div>
        <div>receipt: <code>${escapeHtml(item.receiver_receipt_id || "NO_RECEIPT")}</code></div>
        <div>hash: <code>${escapeHtml(item.receiver_receipt_sha256 || "NO_HASH")}</code></div>
        <div>evidence: ${escapeHtml(item.answer_evidence || "No receiver evidence text found.")}</div>
      </div>
    </article>`).join("");
  return `
    <section class="origin-return" data-testid="origin-return">
      <div class="label">Origin Return Inbox</div>
      <h2>Answers Returned To Command Dash</h2>
      <div class="proof-head">
        <span class="pill ${snapshot.status === "ORIGIN_RETURN_READBACK_PROVEN" ? "ok" : "warn"}">${escapeHtml(snapshot.status || "UNKNOWN")}</span>
        <span>returned answers: <code>${escapeHtml(snapshot.returned_answer_count ?? 0)}</code></span>
        <span>snapshot: <code>${escapeHtml(ORIGIN_DASH_LATEST_RETURN_PATH)}</code></span>
      </div>
      <div class="rec-text">This is the return leg. It only shows answers the origin dash can read back from a terminal packet status plus the receiver receipt file and hash.</div>
      <div id="origin-return-board" class="origin-return-board">
        ${cards || `<div class="proof-receipts">No returned answers found yet.</div>`}
      </div>
    </section>`;
}

function renderActionableReturnsPanel(snapshot) {
  const items = Array.isArray(snapshot.actionable) ? snapshot.actionable : [];
  const cards = items.slice(0, 6).map((item) => `
    <article class="action-return-card">
      <div class="topline">
        <strong>${escapeHtml(item.target || "UNKNOWN_TARGET")}</strong>
        <span class="pill ok">${escapeHtml(item.recommendation || "REVIEW")}</span>
      </div>
      <div class="action-return-body">
        <div><span>Sent</span>${escapeHtml(item.sent || "No sent summary.")}</div>
        <div><span>Advanced</span>${escapeHtml(item.advanced || "No advancement summary.")}</div>
        <div><span>Decision</span>${escapeHtml(item.helps_decide || "No decision question.")}</div>
      </div>
      <div class="action-choice-row">
        ${(item.operator_choices || []).map((choice) => `<button type="button" class="action-return-choice" data-choice="${escapeHtml(choice)}" data-target="${escapeHtml(item.target || "")}" data-packet-id="${escapeHtml(item.packet_id || "")}" data-advanced="${escapeHtml(item.advanced || "")}" data-decision="${escapeHtml(item.helps_decide || "")}" data-receipt="${escapeHtml(item.receiver_receipt_id || "")}">${escapeHtml(choice)}</button>`).join("")}
      </div>
      <div class="meta">
        <div>packet: <code>${escapeHtml(item.packet_id || "UNKNOWN_PACKET")}</code></div>
        <div>receipt: <code>${escapeHtml(item.receiver_receipt_id || "NO_RECEIPT")}</code></div>
        <div>hash: <code>${escapeHtml(item.receiver_receipt_sha256 || "NO_HASH")}</code></div>
      </div>
    </article>`).join("");
  return `
    <section class="actionable-returns" data-testid="actionable-returns">
      <div class="label">Actionable Returns</div>
      <h2>What Came Back, And What It Advances</h2>
      <div class="proof-head">
        <span class="pill ${snapshot.status === "ACTIONABLE_RETURNS_READY" ? "ok" : "warn"}">${escapeHtml(snapshot.status || "UNKNOWN")}</span>
        <span>items: <code>${escapeHtml(snapshot.actionable_count ?? 0)}</code></span>
        <span>snapshot: <code>${escapeHtml(ORIGIN_DASH_ACTIONABLE_RETURNS_PATH)}</code></span>
      </div>
      <div class="rec-text">This is the useful layer: each returned answer is translated into what was sent, what moved forward, and what it helps you decide.</div>
      <div id="actionable-return-board" class="actionable-return-board">
        ${cards || `<div class="proof-receipts">No actionable returned answers yet.</div>`}
      </div>
    </section>`;
}

function renderFlightDeckBridgePanel({ e2eProof, chaser, actionable, origin }) {
  const openFailures = Array.isArray(e2eProof.open_failures) ? e2eProof.open_failures : [];
  const staleCount = Number(chaser.stale_incomplete_count || 0);
  const mergeStatus = staleCount > 0 ? "MERGED_WITH_ACTIVE_CHASES" : "MERGED_AND_RELAY_STABLE";
  const bridgeClass = staleCount > 0 ? "warn" : "ok";
  const nextAction = staleCount > 0
    ? "Close stale receiver chases before calling the relay clear."
    : "Use Actionable Returns to decide the next packet, assignment, or hold.";
  return `
    <section class="flight-deck-bridge" data-testid="flight-deck-bridge">
      <div class="label">TinkerDen Flight Deck Relay Bridge</div>
      <h2>Command Dash -> Relay -> Receiver -> Origin Return</h2>
      <div class="proof-head">
        <span class="pill ${bridgeClass}">${escapeHtml(mergeStatus)}</span>
        <span>stale chases: <code>${escapeHtml(staleCount)}</code></span>
        <span>returned answers: <code>${escapeHtml(origin.returned_answer_count ?? 0)}</code></span>
        <span>actionable items: <code>${escapeHtml(actionable.actionable_count ?? 0)}</code></span>
      </div>
      <div class="bridge-grid">
        <div class="bridge-cell">
          <strong>What is merged</strong>
          <p>The Flight Deck now consumes the relay proof files, chaser status, actionable-return snapshot, origin-return readback, and receiver receipt lifecycle.</p>
        </div>
        <div class="bridge-cell">
          <strong>What stays isolated</strong>
          <p>The relay engine remains file-backed under <code>${escapeHtml(AEYE_RELAY_ROOT)}</code>. The UI does not rewrite proof, fake receipts, or call SENT success.</p>
        </div>
        <div class="bridge-cell">
          <strong>What this helps decide</strong>
          <p>${escapeHtml(nextAction)}</p>
        </div>
      </div>
      ${openFailures.length ? `<div class="open-failures"><strong>Relay limits still visible:</strong><ul>${openFailures.map((failure) => `<li>${escapeHtml(failure)}</li>`).join("")}</ul></div>` : ""}
    </section>`;
}

function renderLatestAeyeAnswerPanel(actionable, origin) {
  const items = Array.isArray(actionable.actionable) ? actionable.actionable : [];
  const latestActionable = items[0] || null;
  const latestReturn = latestActionable || origin.latest_return || (Array.isArray(origin.returns) ? origin.returns[0] : null);
  if (!latestReturn) {
    return `
    <section class="latest-aeye-answer missing" data-testid="latest-aeye-answer">
      <div class="label">Latest Aeye Answer</div>
      <h2>No Returned Aeye Answer Yet</h2>
      <div class="answer-status-row">
        <span class="pill warn">WAITING_FOR_RETURN</span>
        <span>returned answers: <code>${escapeHtml(origin.returned_answer_count ?? 0)}</code></span>
      </div>
      <p class="answer-text">No Aeye answer is currently readable by the origin dash. Run the chaser or dispatch a Brainboot/startup packet.</p>
    </section>`;
  }

  const isBlocker = latestReturn.answer_status === "BLOCKER";
  const statusClass = isBlocker ? "bad" : "ok";
  const choices = Array.isArray(latestActionable?.operator_choices) ? latestActionable.operator_choices : [];
  const choiceButtons = choices.map((choice) => `<button type="button" class="action-return-choice latest-choice" data-choice="${escapeHtml(choice)}" data-target="${escapeHtml(latestReturn.target || "")}" data-packet-id="${escapeHtml(latestReturn.packet_id || "")}" data-advanced="${escapeHtml(latestActionable?.advanced || "")}" data-decision="${escapeHtml(latestActionable?.helps_decide || "")}" data-receipt="${escapeHtml(latestReturn.receiver_receipt_id || "")}">${escapeHtml(choice)}</button>`).join("");
  const choiceMeanings = choices.map((choice) => `<div><strong>${escapeHtml(choice)}</strong><span>${escapeHtml(actionChoiceMeaning(choice))}</span></div>`).join("");
  const actedOn = Boolean(latestActionable?.acted_on);
  const latestDecision = latestActionable?.latest_operator_decision || null;

  return `
    <section class="latest-aeye-answer" data-testid="latest-aeye-answer">
      <div class="label">Latest Aeye Answer</div>
      <h2>${escapeHtml(latestReturn.target || "Aeye")} Answered</h2>
      <div class="answer-explainer">
        <strong>What this card is</strong>
        <p>This card is the newest receiver answer that made it back to the Command Dash. It is not automatically assimilated; it is waiting for you to either continue the chain, assign work, or hold it.</p>
      </div>
      <div class="answer-status-row">
        <span class="pill ${statusClass}">${escapeHtml(latestReturn.origin_readback_status || "RETURN_STATUS_UNKNOWN")}</span>
        <span>answer: <code>${escapeHtml(latestReturn.answer_status || "UNKNOWN")}</code></span>
        <span>returned: <code>${escapeHtml(latestReturn.returned_at || "unknown")}</code></span>
        <span class="pill ${actedOn ? "ok" : "warn"}">${escapeHtml(actedOn ? "ALREADY_ACTED_ON" : "AWAITING_OPERATOR_DECISION")}</span>
      </div>
      ${actedOn ? `<div class="already-acted">Already acted on: <code>${escapeHtml(latestDecision.choice || "UNKNOWN_CHOICE")}</code> at <code>${escapeHtml(latestDecision.created_at || "unknown")}</code>${latestDecision.followup_packet_id ? `, follow-up packet <code>${escapeHtml(latestDecision.followup_packet_id)}</code>` : ""}.</div>` : ""}
      <div class="answer-grid">
        <div class="answer-main">
          <strong>Aeye answer</strong>
          <p>${escapeHtml(latestReturn.answer_evidence || latestReturn.evidence || "No answer text found in the receiver receipt.")}</p>
        </div>
        <div class="answer-main">
          <strong>This advances</strong>
          <p>${escapeHtml(latestActionable?.advanced || "The origin dash has terminal receiver proof for this packet.")}</p>
        </div>
        <div class="answer-main decision">
          <strong>Now decide</strong>
          <p>${escapeHtml(latestActionable?.helps_decide || "Review this returned answer and choose the next move.")}</p>
          <div class="latest-choice-row">
            ${choiceButtons || `<button type="button" id="latest-refresh-button">REFRESH RETURN PROOF</button>`}
          </div>
          <div class="button-meaning">
            ${choiceMeanings || `<div><strong>Refresh Return Proof</strong><span>Read the latest receiver-return proof again before deciding.</span></div>`}
          </div>
        </div>
      </div>
      <div class="answer-proof-line">
        <span>packet <code>${escapeHtml(latestReturn.packet_id || "UNKNOWN_PACKET")}</code></span>
        <span>receipt <code>${escapeHtml(latestReturn.receiver_receipt_id || "NO_RECEIPT")}</code></span>
        <span>hash <code>${escapeHtml(latestReturn.receiver_receipt_sha256 || "NO_HASH")}</code></span>
      </div>
    </section>`;
}

function renderNerdkleOperatorPanel() {
  const targetOptions = [
    `<option value="Nerdkle.Intake">Nerdkle.Intake - store local intent only</option>`,
    ...threadTargetDetails()
      .filter((target) => target.relay_mode !== "DO_NOT_ROUTE" && target.relay_mode !== "LOCAL_ONLY")
      .map((target) => {
        const suffix = target.relay_mode === "CODEX_THREAD_BRIDGE"
          ? "mapped chat receiver"
          : target.relay_mode === "FILE_INBOX_LAN"
            ? "LAN inbox receiver"
            : "receiver route unverified";
        return `<option value="${escapeHtml(target.target)}">${escapeHtml(`${target.target} - ${suffix}`)}</option>`;
      }),
    `<option value="Swanson.Doss">Swanson.Doss - local control thread</option>`,
  ].join("");
  return `
    <section id="nerdkle-operator-panel" class="nerdkle-operator" data-testid="nerdkle-operator">
      <div class="label">Talk To Nerdkle</div>
      <h2>Operator Intent Intake</h2>
      <div class="rec-text">Use this as the mouth of the organism. A local Nerdkle note is stored as durable intake. A targeted message also creates a receiver packet and waits for receipts.</div>
      <div class="operator-form">
        <div class="operator-row">
          <label>Target
            <select id="nerdkle-target-input">
              ${targetOptions}
            </select>
          </label>
          <label>Mode
            <select id="nerdkle-mode-input">
              <option value="ASK_NERDKLE">Ask / clarify</option>
              <option value="ASSIGN_WORK">Assign work</option>
              <option value="REPORT_BLOCKER">Report blocker</option>
              <option value="CAPTURE_IDEA">Capture idea</option>
            </select>
          </label>
        </div>
        <input id="nerdkle-title-input" placeholder="Optional title" />
        <textarea id="nerdkle-message-input" placeholder="Tell Nerdkle what you want, what you are stuck on, or what should happen next."></textarea>
        <div class="relay-command-row">
          <button type="button" id="nerdkle-send-button" data-testid="nerdkle-send-button">WRITE INTENT / CREATE PACKET</button>
        </div>
      </div>
      <div id="nerdkle-intent-readback" class="relay-command-readback" data-testid="nerdkle-intent-readback">
        <strong>Ready.</strong>
        <div>No operator intent has been written from this box yet.</div>
      </div>
    </section>`;
}

function latestActionableItem(snapshot) {
  const items = Array.isArray(snapshot.actionable) ? snapshot.actionable : [];
  return items[0] || null;
}

function renderStatusBrainbootHeader({ e2eProof, chaser, actionable, origin, livePackets }) {
  const latest = latestActionableItem(actionable);
  const latestPacket = livePackets[0] || {};
  const lastReceipt = latest?.receiver_receipt_id || latestPacket.last_receiver_receipt_id || "NO_RECEIPT_YET";
  const sourceAnchor = e2eProof.proof_id || "NO_SOURCE_TRUTH_PROOF";
  const humanMuleRequired = Number(chaser.stale_incomplete_count || 0) > 0 || String(e2eProof.overall_status || "").includes("NO_");
  return `
    <section class="mv-status" data-testid="moment-status-brainboot">
      <div>
        <div class="label">Status Brainboot</div>
        <h2>Moment-Velocity Generator</h2>
        <p>Relay is treated as solved. This surface turns incoming reports, receipts, and Aeye answers into one readable next move.</p>
      </div>
      <div class="mv-status-grid">
        <div><span>Session</span><strong>Swanson@Doss</strong></div>
        <div><span>Source Truth Anchor</span><strong>${escapeHtml(sourceAnchor)}</strong></div>
        <div><span>Relay State</span><strong>${escapeHtml(chaser.status || "UNKNOWN")}</strong></div>
        <div><span>Last Receipt</span><strong>${escapeHtml(lastReceipt)}</strong></div>
        <div><span>Responses Returned</span><strong>${escapeHtml(origin.returned_answer_count ?? 0)}</strong></div>
        <div><span>human_mule_required</span><strong>${humanMuleRequired ? "true" : "false"}</strong></div>
      </div>
    </section>`;
}

function renderAutomaticaInbox(actionable, origin, chaser) {
  const items = Array.isArray(actionable.actionable) ? actionable.actionable : [];
  const cards = items.slice(0, 3).map((item) => `
    <article class="mv-inbox-card">
      <div class="mv-card-top"><strong>${escapeHtml(item.target || "Unknown Aeye")}</strong><span>${escapeHtml(item.answer_status || "UNKNOWN")}</span></div>
      <div><span>What came in</span>${escapeHtml(item.evidence || item.answer_evidence || "Receiver returned proof without readable evidence text.")}</div>
      <div><span>What changed</span>${escapeHtml(item.advanced || "No state delta recorded.")}</div>
      <div><span>Proof</span><code>${escapeHtml(item.receiver_receipt_id || "NO_RECEIPT")}</code></div>
      <div><span>Blocked?</span>${escapeHtml(item.answer_status === "BLOCKER" ? "Yes - resolve before firing." : "No blocker on this return.")}</div>
      <div><span>Influence this session?</span>${escapeHtml(item.answer_status === "COMPLETED" ? "Yes - use it for the next move." : "Only after blocker is resolved.")}</div>
    </article>`).join("");
  const staleCount = Number(chaser.stale_incomplete_count || 0);
  const fallback = `
    <article class="mv-inbox-card">
      <div class="mv-card-top"><strong>No Automatica cards yet</strong><span>WAITING</span></div>
      <div><span>What came in</span>No returned report is currently actionable.</div>
      <div><span>What changed</span>Nothing new has influenced this session.</div>
      <div><span>Proof</span><code>${escapeHtml(ORIGIN_DASH_ACTIONABLE_RETURNS_PATH)}</code></div>
    </article>`;
  return `
    <section class="mv-band" data-testid="automatica-inbox">
      <div class="mv-band-head">
        <div>
          <div class="label">Automatica Inbox</div>
          <h2>Reports That Can Influence This Session</h2>
        </div>
        <span class="pill ${staleCount > 0 ? "warn" : "ok"}">${staleCount > 0 ? "CHASES_OPEN" : "NO_STALE_CHASES"}</span>
      </div>
      <div class="mv-inbox-grid">${cards || fallback}</div>
    </section>`;
}

function renderMomentCard(actionable, origin, chaser) {
  const item = latestActionableItem(actionable);
  const latest = item || origin.latest_return || {};
  const staleCount = Number(chaser.stale_incomplete_count || 0);
  const whatHappened = latest.evidence || latest.answer_evidence || "No Aeye response has returned to the origin dash yet.";
  const whyMatters = item?.advanced || (origin.returned_answer_count ? "A receiver answer is readable at the origin dash." : "The origin dash is waiting for a receiver answer.");
  const changed = item?.answer_status === "COMPLETED"
    ? "The handoff is no longer Ben-carried for this card."
    : staleCount > 0
      ? "There are stale handoffs that need chase packets before trusting velocity."
      : "No new session-changing report is proven yet.";
  const recommended = item
    ? (item.acted_on ? `Watch follow-up packet ${item.latest_operator_decision?.followup_packet_id || "NO_FOLLOWUP_PACKET"} for receipt closure.` : (item.recommendation || "Review and choose a next move."))
    : (staleCount > 0 ? "Run the chaser and route the next stale handoff." : "Dispatch Brainboot or wait for Automatica input.");
  const benAction = item?.acted_on ? "None until follow-up receipt returns." : item ? "Review / Fire / Hold." : "None unless you want to start a packet.";
  return `
    <section class="mv-moment" data-testid="moment-card">
      <div class="label">Moment Card</div>
      <h2>What Happened, What It Means, What To Do</h2>
      <div class="mv-moment-grid">
        <div><span>What just happened</span><p>${escapeHtml(whatHappened)}</p></div>
        <div><span>Why it matters</span><p>${escapeHtml(whyMatters)}</p></div>
        <div><span>What I think changed</span><p>${escapeHtml(changed)}</p></div>
        <div><span>Recommended next move</span><p>${escapeHtml(recommended)}</p></div>
        <div><span>Confidence / proof</span><p>${escapeHtml(latest.receiver_receipt_sha256 ? "Receipt-backed" : "Waiting for proof")}</p></div>
        <div><span>Ben action</span><p>${escapeHtml(benAction)}</p></div>
      </div>
    </section>`;
}

function renderVelocityRail(actionable) {
  const item = latestActionableItem(actionable);
  const target = item?.target || "Skybro.Betsy";
  const decision = item?.helps_decide || "What should move next from the current session state?";
  const context = item?.advanced || "No returned answer context is available yet.";
  return `
    <section id="velocity-rail" class="mv-velocity" data-testid="velocity-rail">
      <div class="mv-band-head">
        <div>
          <div class="label">Relay Flight Deck</div>
          <h2>Send Work, Watch The Bridge, Read The Return</h2>
        </div>
        <span class="pill warn">SENT_IS_NOT_DONE</span>
      </div>
      <div class="mv-relay-stages" aria-label="Relay lifecycle">
        <article>
          <span>1</span>
          <strong>Packet</strong>
          <p>A button writes a durable packet. That is only the start.</p>
        </article>
        <article>
          <span>2</span>
          <strong>Thread Bridge</strong>
          <p>The Codex bridge sends known targets into real Aeye threads.</p>
        </article>
        <article>
          <span>3</span>
          <strong>Receiver Proof</strong>
          <p>The Aeye must return RECEIVED then COMPLETED or BLOCKER.</p>
        </article>
        <article>
          <span>4</span>
          <strong>Origin Return</strong>
          <p>The answer comes back here so Ben can decide the next move.</p>
        </article>
      </div>
      <div class="mv-primary-row">
        <button type="button" id="mv-send-skybro-button" data-testid="mv-send-skybro-button">SEND TO SKYBRO</button>
        <button type="button" id="mv-send-petra-button" data-testid="mv-send-petra-button">SEND TO PETRA</button>
        <button type="button" id="mv-dispatch-brainboot-button" data-testid="mv-dispatch-brainboot-button">DISPATCH BRAINBOOT</button>
        <button type="button" id="mv-probe-all-button" data-testid="mv-probe-all-button">PROBE ALL ROUTABLE</button>
        <button type="button" id="mv-run-chaser-button" data-testid="mv-run-chaser-button">RUN CHASER</button>
        <button type="button" id="mv-refresh-returns-button" data-testid="mv-refresh-returns-button">SHOW RETURNS</button>
      </div>
      <div class="mv-button-map" aria-label="Button meaning">
        <div><strong>Send to Skybro / Petra</strong><span>Creates one relay packet and queues it for the Aeye thread bridge.</span></div>
        <div><strong>Dispatch Brainboot</strong><span>Sends source-truth startup context to Skybro and Petra.</span></div>
        <div><strong>Probe All Routable</strong><span>Creates one relay probe for every mapped thread or LAN file-inbox target. Held targets stay held.</span></div>
        <div><strong>Run Chaser</strong><span>Finds stale packets and creates chase work when proof is missing.</span></div>
        <div><strong>Show Returns</strong><span>Refreshes receiver answers, bridge state, and proof status.</span></div>
      </div>
      <div class="mv-tool-row" aria-label="Feral Membrane tools">
        <span>More local muscles</span>
        <a href="/relay/receiver_bootstrap" target="_blank" rel="noreferrer">OPEN RECEIVER BOOTSTRAP</a>
        <button type="button" id="mv-show-coverage-button" data-testid="mv-show-coverage-button">SHOW RELAY COVERAGE</button>
        <button type="button" id="mv-build-receiver-bootstraps-button" data-testid="mv-build-receiver-bootstraps-button">BUILD RECEIVER BOOTSTRAPS</button>
        <button type="button" id="mv-write-coverage-receipt-button" data-testid="mv-write-coverage-receipt-button">WRITE COVERAGE RECEIPT</button>
        <button type="button" id="mv-write-missing-receiver-blockers-button" data-testid="mv-write-missing-receiver-blockers-button">WRITE MISSING RECEIVER BLOCKERS</button>
        <button type="button" id="mv-generate-meals-button" data-testid="mv-generate-meals-button">MAKE 3 NEXT-PACKET DRAFTS</button>
        <button type="button" id="mv-status-brainboot-button" data-testid="mv-status-brainboot-button">STATUS BRAINBOOT</button>
        <button type="button" id="mv-request-proof-button" data-testid="mv-request-proof-button">REQUEST PROOF</button>
        <button type="button" id="mv-hold-button" data-testid="mv-hold-button">HOLD</button>
        <button type="button" id="mv-ingest-receipts-button" data-testid="mv-ingest-receipts-button">INGEST RECEIPTS</button>
        <button type="button" id="mv-refresh-repo-button" data-testid="mv-refresh-repo-button">REFRESH REPO SNAPSHOT</button>
        <a href="#nerdkle-operator-panel">Talk to Nerdkle</a>
      </div>
      <div class="mv-context-seed" data-target="${escapeHtml(target)}" data-decision="${escapeHtml(decision)}" data-context="${escapeHtml(context)}">
        <strong>Current relay seed:</strong> ${escapeHtml(decision)}
        <div>${escapeHtml(context)}</div>
      </div>
      <div id="mv-thread-bridge-status" class="mv-thread-bridge" data-testid="mv-thread-bridge-status">
        <strong>Aeye Thread Bridge</strong>
        <span>Not checked yet.</span>
      </div>
      ${renderThreadTargetMap()}
      <div class="mv-action-console" data-testid="mv-action-console">
        <article>
          <span>Last Click</span>
          <strong id="mv-action-state">No button clicked yet.</strong>
        </article>
        <article>
          <span>Created / Changed</span>
          <strong id="mv-action-created">Nothing yet.</strong>
        </article>
        <article>
          <span>Proof State</span>
          <strong id="mv-action-proof">Waiting for an action.</strong>
        </article>
      </div>
      <div id="mv-candidate-stack" class="mv-candidate-stack" data-testid="mv-candidate-stack">
        <div class="mv-empty">Click Generate 3 Meals to make editable packet cards. Nothing fires until you click Fire.</div>
      </div>
      <div id="mv-velocity-readback" class="relay-command-readback" data-testid="mv-velocity-readback">
        <strong>Ready.</strong>
        <div>No velocity action has run yet.</div>
      </div>
      <div class="mv-action-ledger" data-testid="mv-action-ledger">
        <div class="mv-ledger-empty">Button history will appear here after each click.</div>
      </div>
    </section>`;
}

function latestBridgeItemForTarget(status, target) {
  const pools = [
    ...(Array.isArray(status.queued) ? status.queued : []),
    ...(Array.isArray(status.file_inbox) ? status.file_inbox : []),
    ...(Array.isArray(status.sent) ? status.sent : []),
    ...(Array.isArray(status.blocked) ? status.blocked : []),
  ];
  return pools.find((item) => item.target === target) || null;
}

function renderThreadTargetMap() {
  const status = threadBridgeStatus(8);
  const targets = Array.isArray(status.known_target_threads) ? status.known_target_threads : [];
  const actuator = status.actuator || {};
  const cards = targets.map((target) => {
    const latest = latestBridgeItemForTarget(status, target.target);
    const state = latest?.status || "NO_PACKET_SENT_YET";
    const routeStatus = String(target.route_status || "").toUpperCase();
    const routeClass = routeStatus.includes("MAPPED") ? "ok" : routeStatus.includes("HELD") || target.relay_mode === "DO_NOT_ROUTE" ? "bad" : "warn";
    const stateClass = state.includes("SENT") ? "ok" : state.includes("QUEUED") ? "warn" : state.includes("BLOCK") ? "bad" : routeClass;
    const missingThread = target.relay_mode === "FILE_INBOX_LAN" && !target.thread_id;
    const latestText = latest
      ? `${latest.packet_id || latest.queue_id || "UNKNOWN_PACKET"}`
      : "No target-thread packet has been created since this page loaded.";
    return `
      <article class="target-thread-card ${stateClass}">
        <div class="topline">
          <strong>${escapeHtml(target.title || target.target)}</strong>
          <span class="pill ${stateClass}">${escapeHtml(state)}</span>
        </div>
        <div class="meta">Aeye target: <code>${escapeHtml(target.target)}</code></div>
        <div class="meta">Actual Codex chat: <code>${escapeHtml(target.thread_id || "NO_THREAD_MAPPING")}</code></div>
        <div class="meta">Route: <code>${escapeHtml(target.route_status || "UNKNOWN_ROUTE")}</code> | availability: <code>${escapeHtml(target.availability || "UNKNOWN")}</code></div>
        <div class="meta">Relay mode: <code>${escapeHtml(target.relay_mode || "UNKNOWN_MODE")}</code></div>
        ${missingThread ? `<div class="meta proof-rule"><strong>Missing actual receiver chat.</strong> File inbox is addressable, but this target will not show up in an Aeye chat until a receiver thread is created or bound. <a href="/relay/receiver_bootstrap" target="_blank" rel="noreferrer">Open bootstrap</a>.</div>` : ""}
        ${target.file_inbox_url ? `<div class="meta">LAN inbox: <a href="${escapeHtml(target.file_inbox_url)}" target="_blank" rel="noreferrer">${escapeHtml(target.file_inbox_url)}</a></div>` : ""}
        <div class="meta">Latest bridge item: <code>${escapeHtml(latestText)}</code></div>
        <div class="meta">Receiver proof: <code>${escapeHtml(target.latest_completion_state || "NO_RECEIVER_PROOF")}</code></div>
        ${target.latest_receiver_receipt_id ? `<div class="meta">Return receipt: <code>${escapeHtml(target.latest_receiver_receipt_id)}</code></div>` : ""}
        ${target.latest_receiver_receipt_sha256 ? `<div class="meta">Receipt hash: <code>${escapeHtml(target.latest_receiver_receipt_sha256)}</code></div>` : ""}
        <div class="meta proof-rule">${escapeHtml(target.latest_proof_gap || "No receiver-side return has been proven for the latest packet.")}</div>
        <div class="meta">Actuator: ${escapeHtml(target.actuator || "Codex thread bridge")}</div>
        <div class="meta proof-rule">${escapeHtml(target.proof_rule || "Receiver proof required before delivery can be claimed.")}</div>
      </article>`;
  }).join("");
  const actuatorClass = actuator.active ? "ok" : "warn";
  return `
    <section class="target-thread-map" data-testid="target-thread-map">
      <div class="mv-band-head">
        <div>
          <div class="label">Actual Aeye Chat Targets</div>
          <h2>Where The Dashboard Is Sending</h2>
        </div>
        <span class="pill ${actuatorClass}">${escapeHtml(actuator.status || "ACTUATOR_UNKNOWN")}</span>
      </div>
      <div class="target-thread-note">${escapeHtml(actuator.operator_meaning || "Queue is not chat. A packet is not received by an Aeye until the mapped target chat gets it and writes RECEIVED.")}</div>
      <div id="target-thread-map-grid" class="target-thread-grid">${cards || `<div class="mv-empty">No Aeye thread mappings are configured.</div>`}</div>
    </section>`;
}

function renderReceiptTimeline(origin, livePackets) {
  const returns = Array.isArray(origin.returns) ? origin.returns : [];
  const returnItems = returns.slice(0, 4).map((item) => `
    <article class="mv-timeline-item">
      <strong>Response returned</strong>
      <span>${escapeHtml(item.target || "Unknown target")}</span>
      <p>${escapeHtml(item.answer_evidence || "Receiver proof returned.")}</p>
      <code>${escapeHtml(item.receiver_receipt_id || "NO_RECEIPT")}</code>
    </article>`).join("");
  const packetItems = livePackets.slice(0, 4).map((packet) => `
    <article class="mv-timeline-item">
      <strong>Packet ${String(packet.status || "").includes("COMPLETED") ? "closed" : "open"}</strong>
      <span>${escapeHtml(packet.target || "Unknown target")}</span>
      <p>${escapeHtml(packet.title || packet.packet_type || "Packet in relay lifecycle.")}</p>
      <code>${escapeHtml(packet.packet_id || "NO_PACKET")}</code>
    </article>`).join("");
  return `
    <section class="mv-band" data-testid="receipt-response-timeline">
      <div class="mv-band-head">
        <div>
          <div class="label">Receipt / Response Timeline</div>
          <h2>The Loop Closing</h2>
        </div>
      </div>
      <div class="mv-timeline">${returnItems || packetItems || `<div class="mv-empty">No receipt or response timeline yet.</div>`}</div>
    </section>`;
}

function renderMomentVelocityGenerator({ e2eProof, chaser, actionable, origin, livePackets }) {
  return `
    <section class="moment-velocity" data-testid="moment-velocity-generator">
      ${renderVelocityRail(actionable)}
      ${renderStatusBrainbootHeader({ e2eProof, chaser, actionable, origin, livePackets })}
      ${renderAutomaticaInbox(actionable, origin, chaser)}
      ${renderMomentCard(actionable, origin, chaser)}
      ${renderReceiptTimeline(origin, livePackets)}
    </section>`;
}

function renderRelayControlDeck({ chaser, actionable, origin, openCount, completedCount, blockerCount }) {
  const staleCount = Number(chaser.stale_incomplete_count || 0);
  const statusClass = staleCount > 0 ? "warn" : "ok";
  return `
    <section class="relay-control-deck" data-testid="relay-control-deck">
      <div class="label">Aeye Relay Controls</div>
      <h2>Do The Relay Work From Here</h2>
      <div class="rec-text">These buttons create local relay artifacts and show their readback. A button click is not delivery, not chat proof, and not completion until a receiver writes RECEIVED then COMPLETED or BLOCKER.</div>
      <div class="relay-control-summary">
        <div><span>Chaser</span><strong class="${statusClass}">${escapeHtml(chaser.status || "UNKNOWN")}</strong><small>stale ${escapeHtml(staleCount)} / superseded ${escapeHtml(chaser.superseded_stale_count ?? 0)}</small></div>
        <div><span>Actionable</span><strong>${escapeHtml(actionable.actionable_count ?? 0)}</strong><small>${escapeHtml(actionable.status || "UNKNOWN")}</small></div>
        <div><span>Returned</span><strong>${escapeHtml(origin.returned_answer_count ?? 0)}</strong><small>${escapeHtml(origin.status || "UNKNOWN")}</small></div>
        <div><span>Open</span><strong>${escapeHtml(openCount)}</strong><small>${escapeHtml(completedCount)} complete / ${escapeHtml(blockerCount)} blocker</small></div>
      </div>
      <div class="relay-command-row">
        <button type="button" id="run-chaser-button" data-testid="run-chaser-button">RUN CHASER NOW</button>
        <button type="button" id="refresh-relay-button" data-testid="refresh-relay-button">REFRESH RELAY STATE</button>
        <button type="button" id="top-brainboot-button" data-testid="top-brainboot-button">CREATE BRAINBOOT PACKETS</button>
        <button type="button" id="top-startup-button" data-testid="top-startup-button">CREATE STARTUP PACKETS</button>
        <button type="button" id="send-proof-packet-button" data-testid="send-proof-packet-button">CREATE BUTTON TEST PACKET</button>
      </div>
      <div class="relay-button-legend">
        <div><strong>Chaser</strong><span>finds packets stuck at SENT_UNACKNOWLEDGED and creates chase packets.</span></div>
        <div><strong>Brainboot</strong><span>renders bootpack context and creates receiver URLs for Skybro/Petra.</span></div>
        <div><strong>Startup</strong><span>creates both Brainboot and SOURCE_TRUTH startup packets.</span></div>
        <div><strong>Button test</strong><span>creates a test relay packet so the button can be proven by receiver receipts.</span></div>
      </div>
      <div id="relay-command-readback" class="relay-command-readback" data-testid="relay-command-readback">
        <strong>Ready. No button is running.</strong>
        <div>Clicking a button will show CREATED, WAITING_FOR_RECEIVER, RECEIVED, COMPLETED, or BLOCKER here.</div>
      </div>
    </section>`;
}

function renderBookCourierPanel() {
  let chapters = [];
  let courier = null;
  let loadStatus = "BOOK_CHAPTERS_READY";
  let loadError = null;
  try {
    chapters = listBookChapters();
    courier = bookCourierStatus(6);
  } catch (error) {
    loadStatus = "BOOK_CHAPTERS_BLOCKED";
    loadError = error.message;
  }
  const options = chapters.slice(0, 80).map((chapter) => {
    const label = `${chapter.chapter_number === null ? "Source" : `Ch ${chapter.chapter_number}`} - ${chapter.title} (${chapter.extension})`;
    return `<option value="${escapeHtml(chapter.chapter_id)}">${escapeHtml(label)}</option>`;
  }).join("");
  return `
    <section class="book-courier" data-testid="book-courier-panel">
      <div class="label">Book Courier</div>
      <h2>Send One Chapter To Skybro</h2>
      <div class="rec-text">Handeyes can now carry chapter work for Aeyes that do not have their own hands. This creates a real relay packet with source path, GitHub URL, file hash, and receiver receipt requirements.</div>
      <div class="book-courier-grid">
        <label>Chapter Source
          <select id="book-chapter-select" data-testid="book-chapter-select">
            ${options || `<option value="">${escapeHtml(loadError || "No chapter files found")}</option>`}
          </select>
        </label>
        <label>Receiver
          <input id="book-target-input" data-testid="book-target-input" value="Skybro.Betsy" />
        </label>
        <label>Editing Mode
          <select id="book-editing-mode-input" data-testid="book-editing-mode-input">
            <option value="developmental_edit">Developmental edit</option>
            <option value="continuity_audit">Continuity audit</option>
            <option value="line_edit">Line edit</option>
            <option value="source_access_test">Source access test</option>
          </select>
        </label>
      </div>
      <label class="book-note-label">Operator Note
        <textarea id="book-operator-note-input" data-testid="book-operator-note-input" placeholder="Optional: tell Skybro what kind of edit you want for this chapter."></textarea>
      </label>
      <div class="book-courier-row">
        <button type="button" id="book-refresh-button" data-testid="book-refresh-button">REFRESH CHAPTER LIST</button>
        <button type="button" id="book-dispatch-button" data-testid="book-dispatch-button">SEND CHAPTER TO SKYBRO</button>
        <button type="button" id="book-next-button" data-testid="book-next-button">SEND NEXT UNSENT CHAPTER</button>
        <button type="button" id="book-status-button" data-testid="book-status-button">READ COURIER STATUS</button>
        <a href="${escapeHtml(BOOK_SOURCE_TRUTH_REPO_URL)}" target="_blank" rel="noreferrer">Open Source Truth Folder</a>
      </div>
      <div id="book-courier-readback" class="relay-command-readback" data-testid="book-courier-readback">
        <strong>${escapeHtml(loadStatus)}</strong>
        <div>chapters indexed: ${escapeHtml(chapters.length)}</div>
        <div>completed chapters: ${escapeHtml(courier?.completed_chapter_count ?? 0)}</div>
        <div>next unsent: <code>${escapeHtml(courier?.next_unsent_chapter?.title || "UNKNOWN")}</code></div>
        <div>bridge sweep: <code>${escapeHtml(courier?.bridge_actuator?.schedule || "UNKNOWN")}</code> / <code>${escapeHtml(courier?.bridge_actuator?.status || "UNKNOWN")}</code></div>
        <div>source root: <code>${escapeHtml(BOOK_SOURCE_TRUTH_ROOT)}</code></div>
        <div>Clicking SEND CHAPTER creates a relay packet. It is not delivered until the bridge sends it, and not complete until Skybro returns RECEIVED then COMPLETED or BLOCKER.</div>
      </div>
    </section>`;
}

fastify.get("/", async (_request, reply) => {
  const snapshot = daemonSnapshot();
  const organs = Array.isArray(snapshot.health.core_organs) ? snapshot.health.core_organs : [];
  const flags = Array.isArray(snapshot.heat.flags) ? snapshot.heat.flags : [];
  const rows = organs.map((organ) => `
    <tr>
      <td>${escapeHtml(organ.name)}</td>
      <td><span class="pill ${organ.status === "ONLINE" ? "ok" : "bad"}">${escapeHtml(organ.status)}</span></td>
      <td>${escapeHtml(organ.pid ?? "")}</td>
      <td>${escapeHtml(organ.restarts ?? "")}</td>
    </tr>`).join("");
  const flagRows = flags.slice(-8).map((flag) => `
    <tr>
      <td>${escapeHtml(flag.flag || "UNKNOWN")}</td>
      <td>${escapeHtml(flag.source || "")}</td>
      <td>${escapeHtml(flag.rule || flag.error || "")}</td>
    </tr>`).join("");
  const brainbootPackets = latestBrainbootPackets(8).map((packet) => ({ channel: "brainboot", ...packet }));
  const relayPackets = latestRelayPackets(8).map((packet) => ({ channel: "relay", ...packet }));
  const livePackets = [...brainbootPackets, ...relayPackets]
    .sort((a, b) => String(b.created_at || b.packet_modified_at || "").localeCompare(String(a.created_at || a.packet_modified_at || "")))
    .slice(0, 8);
  const openCount = livePackets.filter((packet) => !String(packet.status || "").includes("COMPLETED") && !String(packet.status || "").includes("BLOCKER")).length;
  const completedCount = livePackets.filter((packet) => String(packet.status || "").includes("COMPLETED")).length;
  const blockerCount = livePackets.filter((packet) => String(packet.status || "").includes("BLOCKER")).length;
  const relayCockpitCards = livePackets.length
    ? livePackets.map(renderRelayCockpitPacket).join("")
    : `<article class="live-packet pending"><div class="live-packet-head"><strong>No packets found</strong><span class="pill warn">EMPTY</span></div><div class="live-packet-meta">Dispatch Brainboot or a report packet to start the relay.</div></article>`;
  const e2eProof = readRelayE2EProof();
  const chaserStatus = readRelayChaserStatus();
  const actionableSnapshot = buildActionableReturnsSnapshot(8);
  const originReturnSnapshot = buildOriginReturnSnapshot(8);
  const flightDeckBridgePanel = renderFlightDeckBridgePanel({
    e2eProof,
    chaser: chaserStatus,
    actionable: actionableSnapshot,
    origin: originReturnSnapshot,
  });
  const momentVelocityGenerator = renderMomentVelocityGenerator({
    e2eProof,
    chaser: chaserStatus,
    actionable: actionableSnapshot,
    origin: originReturnSnapshot,
    livePackets,
  });
  const latestAeyeAnswerPanel = renderLatestAeyeAnswerPanel(actionableSnapshot, originReturnSnapshot);
  const nerdkleOperatorPanel = renderNerdkleOperatorPanel();
  const bookCourierPanel = renderBookCourierPanel();
  const relayControlDeck = renderRelayControlDeck({
    chaser: chaserStatus,
    actionable: actionableSnapshot,
    origin: originReturnSnapshot,
    openCount,
    completedCount,
    blockerCount,
  });
  const e2eProofPanel = renderRelayE2EProof(e2eProof);
  const relayChaserPanel = renderRelayChaser(chaserStatus);
  const actionableReturnsPanel = renderActionableReturnsPanel(actionableSnapshot);
  const originReturnPanel = renderOriginReturnPanel(originReturnSnapshot);

  reply.type("text/html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>TinkerDen Flight Deck</title>
  <style>
    :root { color-scheme: dark; font-family: Arial, sans-serif; background: #101418; color: #edf2f7; }
    body { margin: 0; padding: 32px; }
    main { max-width: 1180px; margin: 0 auto; }
    h1 { margin: 0 0 8px; font-size: 32px; }
    h2 { margin-top: 28px; font-size: 18px; }
    .sub { color: #aab6c3; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
    .panel { border: 1px solid #2b3642; background: #151b22; border-radius: 8px; padding: 16px; }
    .label { color: #9fb0c0; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; }
    .value { font-size: 24px; margin-top: 6px; }
    table { width: 100%; border-collapse: collapse; background: #151b22; border: 1px solid #2b3642; }
    th, td { text-align: left; padding: 10px; border-bottom: 1px solid #26313c; vertical-align: top; }
    th { color: #9fb0c0; font-size: 12px; text-transform: uppercase; }
    .pill { display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 12px; font-weight: 700; }
    .ok { background: #153c2e; color: #8df0be; }
    .warn { background: #3a3015; color: #ffd36c; }
    .bad { background: #461d25; color: #ff9aa9; }
    .membrane { margin-top: 28px; border: 1px solid #314152; background: #151b22; border-radius: 8px; padding: 18px; }
    .membrane h2 { margin: 0 0 8px; }
    .rec-title { font-size: 18px; font-weight: 700; margin: 10px 0 6px; }
    .rec-text { color: #c4cfda; max-width: 70ch; line-height: 1.45; }
    .actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 16px; }
    button { border: 1px solid #405468; border-radius: 6px; color: #edf2f7; background: #202b36; padding: 10px 14px; font-weight: 700; cursor: pointer; }
    button:hover { background: #293746; }
    button.defer { border-color: #8f742d; background: #302815; }
    button.kill { border-color: #8d3442; background: #351b22; }
    .reason-panel { margin-top: 14px; padding: 12px; border: 1px solid #2f4050; border-radius: 6px; background: #101820; }
    .reason-panel[hidden] { display: none; }
    .reason-panel label { display: block; color: #c4cfda; font-size: 13px; margin-bottom: 8px; }
    .reason-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .reason-row input { flex: 1 1 320px; min-width: 220px; border: 1px solid #405468; border-radius: 6px; background: #0d1319; color: #edf2f7; padding: 10px; }
    #ratchet-status { min-height: 20px; margin-top: 12px; color: #9fb0c0; font-size: 13px; }
    .context-pane { margin-top: 28px; border: 1px solid #314152; background: #111820; border-radius: 8px; padding: 18px; }
    .context-head { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; flex-wrap: wrap; }
    .context-status { color: #9fb0c0; font-size: 13px; }
    .receipt-stream { display: grid; gap: 10px; margin-top: 14px; }
    .receipt-card { border: 1px solid #2e3d4c; border-left: 4px solid #5ea8ff; border-radius: 6px; background: #0d1319; padding: 12px; animation: slide-in .18s ease-out; }
    .receipt-card.quarantined { border-left-color: #ffba5a; }
    .receipt-card.invalid { border-left-color: #ff6b7f; }
    .receipt-card .receipt-id { font-weight: 800; color: #edf2f7; }
    .receipt-card .receipt-meta { margin-top: 6px; color: #aab6c3; font-size: 12px; line-height: 1.35; }
    .receipt-card code { color: #d3e8ff; overflow-wrap: anywhere; }
    .release-valve { margin-top: 16px; border: 1px solid #314152; background: #111820; border-radius: 8px; padding: 16px; }
    .relay-control-deck { margin: 0 0 18px; border: 2px solid #7bb48a; background: #0d1712; border-radius: 8px; padding: 18px; }
    .relay-control-deck h2 { margin: 0 0 8px; font-size: 28px; }
    .relay-control-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px; margin: 14px 0; }
    .relay-control-summary div { border: 1px solid #2f4a39; border-radius: 6px; background: #09110d; padding: 12px; }
    .relay-control-summary span { display: block; color: #9fb0c0; font-size: 11px; text-transform: uppercase; font-weight: 800; }
    .relay-control-summary strong { display: block; margin-top: 4px; font-size: 22px; overflow-wrap: anywhere; }
    .relay-control-summary small { display: block; margin-top: 4px; color: #aab6c3; }
    .relay-command-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
    .relay-command-row button { border-color: #5b9d70; background: #183123; color: #d8ffe2; }
    .relay-command-row button:hover { background: #22442f; }
    .relay-command-row button:disabled { opacity: .58; cursor: progress; }
    button.button-working { box-shadow: 0 0 0 2px rgba(141, 240, 190, .28) inset; filter: brightness(1.12); }
    button.just-clicked { transform: translateY(1px); }
    .relay-button-legend { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 8px; margin: 12px 0; }
    .relay-button-legend div { border: 1px solid #263c2d; border-radius: 6px; background: #08110d; padding: 10px; }
    .relay-button-legend strong { display: block; margin-bottom: 4px; }
    .relay-button-legend span { display: block; color: #aab6c3; font-size: 12px; line-height: 1.35; }
    .relay-command-readback { margin-top: 14px; border: 1px solid #2f4a39; border-radius: 6px; background: #09110d; padding: 12px; color: #c4cfda; font-size: 13px; line-height: 1.45; overflow-wrap: anywhere; }
    .relay-command-readback.active { border-color: #8df0be; box-shadow: 0 0 0 1px rgba(141, 240, 190, .2) inset; }
    .relay-command-readback.blocked { border-color: #ff6b7f; background: #1a0d10; }
    .relay-command-readback strong { color: #edf2f7; }
    .relay-command-readback pre { white-space: pre-wrap; margin: 8px 0 0; max-height: 220px; overflow: auto; background: #050a08; border: 1px solid #203629; border-radius: 6px; padding: 10px; }
    .relay-outcome-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 10px; margin-top: 12px; }
    .relay-outcome-card { border: 1px solid #2f4a39; border-left: 5px solid #ffd36c; border-radius: 6px; background: #07100c; padding: 12px; }
    .relay-outcome-card.complete { border-left-color: #8df0be; }
    .relay-outcome-card.blocker { border-left-color: #ff6b7f; }
    .relay-outcome-card strong { display: block; margin-bottom: 6px; }
    .relay-outcome-card .stage { display: inline-block; margin-bottom: 8px; }
    .relay-outcome-card .meta { color: #aab6c3; font-size: 12px; line-height: 1.45; }
    .relay-outcome-card code { color: #d3e8ff; overflow-wrap: anywhere; }
    .relay-outcome-card a { font-weight: 800; }
    .mv-action-console { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 14px; }
    .mv-action-console article { border: 1px solid #314d3b; border-radius: 6px; background: #07110c; padding: 12px; min-height: 72px; }
    .mv-action-console span { display: block; color: #9fb0c0; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 5px; }
    .mv-action-console strong { display: block; color: #edf2f7; line-height: 1.25; overflow-wrap: anywhere; }
    .mv-thread-bridge { display: flex; justify-content: space-between; gap: 12px; align-items: center; flex-wrap: wrap; border: 1px solid #476b8d; border-left: 4px solid #8fd3ff; border-radius: 6px; background: #0b131c; padding: 12px; margin-top: 12px; color: #c4cfda; }
    .mv-thread-bridge strong { color: #edf2f7; }
    .mv-thread-bridge span { overflow-wrap: anywhere; }
    .mv-thread-bridge.warn { border-left-color: #ffd36c; }
    .mv-thread-bridge.ok { border-left-color: #8df0be; }
    .mv-thread-bridge.bad { border-left-color: #ff6b7f; }
    .mv-thread-bridge.paused { border-left-color: #c8a46b; background: #17130b; }
    .target-thread-map { border: 1px solid #36526b; border-radius: 6px; background: #09121a; padding: 14px; margin-top: 12px; }
    .target-thread-note { color: #c4cfda; font-size: 13px; line-height: 1.45; margin: 8px 0 12px; }
    .target-thread-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .target-thread-card { border: 1px solid #314b61; border-left: 4px solid #8fd3ff; border-radius: 6px; background: #0d151d; padding: 12px; min-width: 0; }
    .target-thread-card.ok { border-left-color: #8df0be; }
    .target-thread-card.warn { border-left-color: #ffd36c; }
    .target-thread-card.bad { border-left-color: #ff6b7f; }
    .target-thread-card .topline { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
    .target-thread-card strong { color: #edf2f7; }
    .target-thread-card .meta { color: #aab6c3; font-size: 12px; line-height: 1.45; margin-top: 7px; overflow-wrap: anywhere; }
    .target-thread-card .proof-rule { color: #d7c08d; }
    .target-thread-card code { color: #d3e8ff; overflow-wrap: anywhere; }
    .mv-action-ledger { display: grid; gap: 8px; margin-top: 12px; }
    .mv-ledger-empty, .mv-ledger-item { border: 1px solid #263c2d; border-radius: 6px; background: #08110d; padding: 10px; color: #aab6c3; font-size: 12px; line-height: 1.4; }
    .mv-ledger-item strong { display: block; color: #edf2f7; font-size: 13px; margin-bottom: 3px; }
    .mv-ledger-item.active { border-color: #8df0be; color: #d8ffe2; }
    .mv-ledger-item.blocked { border-color: #ff6b7f; background: #1a0d10; color: #ffd3da; }
    .latest-aeye-answer { margin: 0 0 18px; border: 3px solid #8df0be; background: #08110d; border-radius: 8px; padding: 20px; box-shadow: 0 0 0 1px rgba(141, 240, 190, .12) inset; }
    .latest-aeye-answer.missing { border-color: #ffd36c; background: #151309; }
    .latest-aeye-answer h2 { margin: 0 0 8px; font-size: 30px; }
    .answer-explainer { border: 1px solid #2f4a39; border-radius: 6px; background: #0b1711; padding: 12px; margin: 10px 0 12px; }
    .answer-explainer strong { display: block; margin-bottom: 4px; }
    .answer-explainer p { margin: 0; color: #c4cfda; line-height: 1.45; }
    .answer-status-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; color: #c4cfda; margin: 8px 0 14px; }
    .already-acted { border: 1px solid #476b8d; border-radius: 6px; background: #0b131c; color: #c4cfda; padding: 10px; margin: 0 0 12px; font-size: 13px; }
    .answer-grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr) minmax(0, 1fr); gap: 12px; margin-top: 12px; }
    .answer-main { border: 1px solid #2f4a39; border-radius: 6px; background: #0b1711; padding: 14px; }
    .answer-main strong { display: block; margin-bottom: 6px; color: #edf2f7; }
    .answer-main p { margin: 0; color: #d9e4ee; line-height: 1.45; overflow-wrap: anywhere; }
    .answer-main.decision { border-color: #476b8d; background: #0b131c; }
    .latest-choice-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    .latest-choice-row button { border-color: #6caee8; color: #dff0ff; background: #17314a; }
    .latest-choice-row button:hover { background: #204768; }
    .button-meaning { display: grid; gap: 8px; margin-top: 12px; }
    .button-meaning div { border: 1px solid #263c2d; border-radius: 6px; background: #08110d; padding: 8px; }
    .button-meaning strong { display: block; color: #edf2f7; margin-bottom: 3px; }
    .button-meaning span { display: block; color: #aab6c3; font-size: 12px; line-height: 1.35; }
    .answer-proof-line { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; color: #aab6c3; font-size: 12px; line-height: 1.45; }
    .answer-proof-line code, .latest-aeye-answer code { color: #d3e8ff; overflow-wrap: anywhere; }
    .answer-text { color: #d9e4ee; line-height: 1.45; margin: 10px 0 0; }
    .nerdkle-operator { margin: 0 0 18px; border: 2px solid #6caee8; background: #0d141d; border-radius: 8px; padding: 18px; }
    .nerdkle-operator h2 { margin: 0 0 8px; font-size: 26px; }
    .operator-form { display: grid; gap: 10px; margin-top: 14px; }
    .operator-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 10px; }
    .operator-form label { display: grid; gap: 5px; color: #c4cfda; font-size: 12px; font-weight: 800; text-transform: uppercase; }
    .operator-form select, .operator-form input, .operator-form textarea { border: 1px solid #405468; border-radius: 6px; background: #0d1319; color: #edf2f7; padding: 10px; font-family: inherit; }
    .operator-form textarea { min-height: 96px; resize: vertical; line-height: 1.4; }
    .book-courier { margin: 0 0 18px; border: 2px solid #9f8f5e; background: #17150e; border-radius: 8px; padding: 18px; }
    .book-courier h2 { margin: 0 0 8px; font-size: 26px; }
    .book-courier-grid { display: grid; grid-template-columns: minmax(280px, 1.4fr) minmax(190px, .8fr) minmax(190px, .8fr); gap: 10px; margin-top: 14px; }
    .book-courier label, .book-note-label { display: grid; gap: 5px; color: #c4cfda; font-size: 12px; font-weight: 800; text-transform: uppercase; }
    .book-courier select, .book-courier input, .book-courier textarea { border: 1px solid #5e5230; border-radius: 6px; background: #0d1319; color: #edf2f7; padding: 10px; font-family: inherit; }
    .book-courier textarea { min-height: 72px; resize: vertical; line-height: 1.4; }
    .book-note-label { margin-top: 10px; }
    .book-courier-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 12px; }
    .book-courier-row button, .book-courier-row a { border: 1px solid #9f8f5e; border-radius: 6px; background: #2a2413; color: #fff1bd; padding: 10px 12px; font-weight: 800; text-decoration: none; }
    .book-courier-row button:hover, .book-courier-row a:hover { background: #3b331c; }
    @media (max-width: 820px) { .answer-grid { grid-template-columns: 1fr; } }
    @media (max-width: 860px) { .book-courier-grid { grid-template-columns: 1fr; } }
    .moment-velocity { display: grid; gap: 16px; margin: 0 0 18px; }
    .mv-status, .mv-band, .mv-moment, .mv-velocity { border: 1px solid #2f4050; background: #111820; border-radius: 8px; padding: 18px; }
    .mv-status { display: grid; grid-template-columns: minmax(260px, .8fr) minmax(320px, 1.2fr); gap: 18px; align-items: start; border-color: #6caee8; background: #0e1720; }
    .mv-status h2, .mv-band h2, .mv-moment h2, .mv-velocity h2 { margin: 0 0 8px; font-size: 24px; }
    .mv-status p { margin: 0; color: #c4cfda; line-height: 1.45; }
    .mv-status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px; }
    .mv-status-grid div, .mv-moment-grid div { border: 1px solid #314960; border-radius: 6px; background: #0b1118; padding: 12px; }
    .mv-status-grid span, .mv-moment-grid span, .mv-inbox-card span { display: block; color: #9fb0c0; font-size: 11px; text-transform: uppercase; font-weight: 800; margin-bottom: 4px; }
    .mv-status-grid strong { display: block; color: #edf2f7; overflow-wrap: anywhere; }
    .mv-band-head { display: flex; justify-content: space-between; gap: 12px; align-items: start; flex-wrap: wrap; }
    .mv-inbox-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px; margin-top: 12px; }
    .mv-inbox-card { border: 1px solid #314960; border-left: 5px solid #8fc7ff; border-radius: 6px; background: #0b1118; padding: 12px; display: grid; gap: 8px; }
    .mv-card-top { display: flex; justify-content: space-between; gap: 8px; align-items: center; flex-wrap: wrap; }
    .mv-card-top strong { font-size: 16px; }
    .mv-card-top span { color: #8df0be; font-size: 12px; font-weight: 800; margin: 0; }
    .mv-inbox-card code, .mv-context-seed code, .mv-timeline-item code { color: #d3e8ff; overflow-wrap: anywhere; }
    .mv-moment { border-color: #8df0be; background: #08110d; }
    .mv-moment-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 12px; }
    .mv-moment-grid p { margin: 0; color: #d9e4ee; line-height: 1.42; overflow-wrap: anywhere; }
    .mv-velocity { border: 2px solid #8df0be; background: #0a1410; box-shadow: 0 0 0 1px rgba(141, 240, 190, .12) inset; }
    .mv-relay-stages { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin: 14px 0; }
    .mv-relay-stages article { border: 1px solid #2f4a39; border-radius: 6px; background: #07100c; padding: 12px; min-height: 116px; }
    .mv-relay-stages span { display: inline-grid; place-items: center; width: 24px; height: 24px; border-radius: 999px; background: #8df0be; color: #07100c; font-weight: 900; margin-bottom: 8px; }
    .mv-relay-stages strong { display: block; color: #edf2f7; margin-bottom: 5px; }
    .mv-relay-stages p { margin: 0; color: #aab6c3; font-size: 12px; line-height: 1.35; }
    .mv-primary-row { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; margin: 12px 0; }
    .mv-primary-row button { min-height: 54px; border-color: #8df0be; background: #183123; color: #edfff2; font-size: 13px; }
    .mv-primary-row button:hover { background: #22442f; }
    .mv-button-map { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 8px; margin: 12px 0; }
    .mv-button-map div { border: 1px solid #2d3d4c; border-radius: 6px; background: #0b1118; padding: 10px; }
    .mv-button-map strong { display: block; color: #edf2f7; margin-bottom: 4px; }
    .mv-button-map span { display: block; color: #aab6c3; font-size: 12px; line-height: 1.35; }
    .mv-launch-row { display: flex; flex-wrap: wrap; gap: 10px; margin: 12px 0; }
    .mv-launch-row button { border-color: #5b9d70; background: #183123; color: #d8ffe2; }
    .mv-launch-row button:hover { background: #22442f; }
    .mv-tool-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 0 0 12px; padding: 10px; border: 1px solid #2f4a39; border-radius: 6px; background: #09110d; }
    .mv-tool-row span { color: #9fb0c0; font-size: 11px; text-transform: uppercase; font-weight: 800; margin-right: 4px; }
    .mv-tool-row button, .mv-tool-row a { border: 1px solid #405468; border-radius: 6px; background: #182634; color: #dff0ff; padding: 8px 10px; font-size: 12px; font-weight: 800; text-decoration: none; }
    .mv-tool-row button:hover, .mv-tool-row a:hover { background: #21384b; }
    .mv-context-seed { border: 1px solid #3d5f4a; border-radius: 6px; background: #09110d; padding: 12px; color: #c4cfda; overflow-wrap: anywhere; line-height: 1.4; }
    .mv-context-seed strong { color: #edf2f7; }
    .mv-context-seed div { margin-top: 5px; color: #aab6c3; }
    .mv-candidate-stack { display: grid; gap: 10px; margin-top: 12px; }
    .mv-empty { border: 1px dashed #405468; border-radius: 6px; padding: 14px; color: #aab6c3; background: #0d1319; }
    .mv-packet-card { border: 1px solid #2f4a39; border-left: 5px solid #8df0be; border-radius: 6px; background: #08110d; padding: 12px; display: grid; gap: 8px; }
    .mv-packet-card textarea, .mv-packet-card input, .mv-packet-card select { width: 100%; box-sizing: border-box; border: 1px solid #405468; border-radius: 6px; background: #0d1319; color: #edf2f7; padding: 9px; font-family: inherit; }
    .mv-packet-card textarea { min-height: 110px; resize: vertical; line-height: 1.4; }
    .mv-packet-meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px; color: #c4cfda; font-size: 12px; }
    .mv-packet-actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .mv-packet-actions button { padding: 8px 10px; }
    .mv-timeline { display: grid; gap: 8px; margin-top: 12px; }
    .mv-timeline-item { border: 1px solid #314960; border-left: 4px solid #6caee8; border-radius: 6px; background: #0b1118; padding: 10px; }
    .mv-timeline-item strong { display: block; }
    .mv-timeline-item span { color: #9fb0c0; font-size: 12px; }
    .mv-timeline-item p { margin: 6px 0; color: #d9e4ee; }
    .machine-json { margin-top: 10px; border: 1px solid #26313c; border-radius: 6px; background: #070b10; }
    .machine-json summary { cursor: pointer; padding: 8px 10px; color: #9fb0c0; font-weight: 800; }
    .machine-json pre { white-space: pre-wrap; margin: 0; max-height: 240px; overflow: auto; border-top: 1px solid #26313c; padding: 10px; color: #c4cfda; }
    .debug-drawer { margin: 18px 0; border: 1px solid #314152; border-radius: 8px; background: #0d1319; }
    .debug-drawer summary { cursor: pointer; padding: 14px 16px; font-weight: 800; color: #c4cfda; }
    .debug-drawer-body { padding: 0 16px 16px; }
    .debug-drawer[open] summary { border-bottom: 1px solid #26313c; margin-bottom: 16px; }
    @media (max-width: 960px) { .mv-relay-stages, .mv-primary-row { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 860px) { .mv-status, .mv-moment-grid, .mv-action-console, .target-thread-grid { grid-template-columns: 1fr; } }
    @media (max-width: 620px) { .mv-relay-stages, .mv-primary-row { grid-template-columns: 1fr; } }
    .relay-cockpit { margin: 0 0 18px; border: 1px solid #61717f; background: #121820; border-radius: 8px; padding: 18px; }
    .relay-cockpit h2 { margin: 0 0 8px; font-size: 24px; }
    .relay-cockpit .summary-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; margin: 14px 0; }
    .relay-cockpit .summary-box { border: 1px solid #2f4050; background: #0d1319; border-radius: 6px; padding: 12px; }
    .relay-cockpit .summary-box strong { display: block; font-size: 26px; margin-top: 4px; }
    .relay-cockpit .quick-actions { display: flex; flex-wrap: wrap; gap: 10px; margin: 12px 0 14px; }
    .relay-cockpit .quick-actions a, .relay-cockpit .quick-actions button { border: 1px solid #61717f; border-radius: 6px; color: #edf2f7; background: #202b36; padding: 10px 12px; font-weight: 800; text-decoration: none; }
    .live-packet-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 10px; margin-top: 12px; }
    .live-packet { border: 1px solid #2e3d4c; border-left: 5px solid #ffd36c; border-radius: 6px; background: #0d1319; padding: 12px; }
    .live-packet.complete { border-left-color: #8df0be; }
    .live-packet.blocker { border-left-color: #ff6b7f; }
    .live-packet-head { display: flex; justify-content: space-between; gap: 8px; align-items: center; flex-wrap: wrap; }
    .live-packet-title { margin-top: 8px; color: #d9e4ee; font-weight: 700; }
    .live-packet-meta { margin-top: 8px; color: #aab6c3; font-size: 12px; line-height: 1.45; }
    .live-packet code { color: #d3e8ff; overflow-wrap: anywhere; }
    .brainboot { margin: 0 0 18px; border: 1px solid #42607a; background: #121d26; border-radius: 8px; padding: 18px; }
    .brainboot h2 { margin: 0 0 8px; font-size: 20px; }
    .brainboot .rec-text { max-width: 78ch; }
    .brainboot .brainboot-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-top: 14px; }
    .brainboot button { background: #24435e; border-color: #6caee8; }
    .brainboot .mini { color: #9fb0c0; font-size: 12px; }
    .brainboot-board { display: grid; gap: 10px; margin-top: 14px; }
    .brainboot-card { border: 1px solid #2f4658; border-left: 4px solid #6caee8; border-radius: 6px; background: #0d1319; padding: 12px; }
    .brainboot-card.complete { border-left-color: #8df0be; }
    .brainboot-card.blocker { border-left-color: #ff6b7f; }
    .brainboot-card.pending { border-left-color: #ffd36c; }
    .brainboot-card .topline { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
    .brainboot-card .target { font-weight: 800; }
    .brainboot-card .meta { color: #aab6c3; font-size: 12px; line-height: 1.45; margin-top: 8px; }
    .brainboot-card code { color: #d3e8ff; overflow-wrap: anywhere; }
    .brainboot-card a { font-weight: 700; }
    .relay-panel { margin: 0 0 18px; border: 1px solid #3f5c48; background: #101d17; border-radius: 8px; padding: 18px; }
    .relay-panel h2 { margin: 0 0 8px; font-size: 20px; }
    .relay-form { display: grid; gap: 8px; margin-top: 12px; }
    .relay-form input, .relay-form textarea { border: 1px solid #405468; border-radius: 6px; background: #0d1319; color: #edf2f7; padding: 10px; font-family: inherit; }
    .relay-form textarea { min-height: 84px; resize: vertical; }
    .relay-board { display: grid; gap: 10px; margin-top: 14px; }
    .relay-card { border: 1px solid #2f4a39; border-left: 4px solid #76d996; border-radius: 6px; background: #0d1319; padding: 12px; }
    .relay-card.pending { border-left-color: #ffd36c; }
    .relay-card.complete { border-left-color: #8df0be; }
    .relay-card.blocker { border-left-color: #ff6b7f; }
    .relay-card .topline { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
    .relay-card .target { font-weight: 800; }
    .relay-card .meta { color: #aab6c3; font-size: 12px; line-height: 1.45; margin-top: 8px; }
    .relay-card code { color: #d3e8ff; overflow-wrap: anywhere; }
    .inbox-links { margin: 0 0 18px; border: 1px solid #4c4b2f; background: #1d1b10; border-radius: 8px; padding: 16px; }
    .inbox-links .links { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
    .inbox-links a { display: inline-block; border: 1px solid #7d7643; border-radius: 6px; padding: 8px 10px; background: #25220f; color: #f7e7a2; text-decoration: none; font-weight: 700; }
    .e2e-proof { margin: 0 0 18px; border: 2px solid #8f742d; background: #16150f; border-radius: 8px; padding: 18px; }
    .e2e-proof h2 { margin: 0 0 8px; font-size: 24px; }
    .proof-head { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin: 10px 0 12px; color: #c4cfda; }
    .proof-table { margin-top: 14px; }
    .proof-table td:nth-child(2) { font-weight: 800; color: #edf2f7; }
    .proof-table code, .proof-receipts code { color: #d3e8ff; overflow-wrap: anywhere; }
    .proof-receipts { margin-top: 12px; border: 1px solid #4d4120; border-radius: 6px; background: #0d1319; padding: 12px; color: #c4cfda; font-size: 12px; line-height: 1.55; }
    .open-failures { margin-top: 12px; color: #ffd36c; }
    .open-failures ul { margin: 8px 0 0; padding-left: 18px; }
    .relay-chaser { margin: 0 0 18px; border: 1px solid #5d5331; background: #15170f; border-radius: 8px; padding: 18px; }
    .relay-chaser h2 { margin: 0 0 8px; font-size: 22px; }
    .relay-chaser table { margin-top: 14px; }
    .next-chase { margin-top: 12px; border: 1px solid #4d4120; border-radius: 6px; background: #0d1319; padding: 12px; color: #c4cfda; }
    .origin-return { margin: 0 0 18px; border: 2px solid #3f8060; background: #0f1914; border-radius: 8px; padding: 18px; }
    .origin-return h2 { margin: 0 0 8px; font-size: 24px; }
    .origin-return-board { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px; margin-top: 14px; }
    .origin-return-card { border: 1px solid #2e4a39; border-left: 5px solid #8df0be; border-radius: 6px; background: #0b1210; padding: 12px; }
    .origin-return-card.blocker { border-left-color: #ff6b7f; }
    .origin-return-card .topline { display: flex; justify-content: space-between; gap: 8px; align-items: center; flex-wrap: wrap; }
    .origin-return-card .meta { margin-top: 8px; color: #aab6c3; font-size: 12px; line-height: 1.45; }
    .origin-return-card code { color: #d3e8ff; overflow-wrap: anywhere; }
    .actionable-returns { margin: 0 0 18px; border: 2px solid #5f7e9e; background: #101821; border-radius: 8px; padding: 18px; }
    .actionable-returns h2 { margin: 0 0 8px; font-size: 24px; }
    .actionable-return-board { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 12px; margin-top: 14px; }
    .action-return-card { border: 1px solid #314960; border-left: 5px solid #8fc7ff; border-radius: 6px; background: #0b1118; padding: 12px; }
    .action-return-card .topline { display: flex; justify-content: space-between; gap: 8px; align-items: center; flex-wrap: wrap; }
    .action-return-body { display: grid; gap: 8px; margin-top: 10px; color: #d9e4ee; line-height: 1.35; }
    .action-return-body span { display: block; color: #9fb0c0; font-size: 11px; text-transform: uppercase; font-weight: 800; margin-bottom: 2px; }
    .action-choice-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    .action-choice-row button { padding: 7px 9px; border-color: #3c5b72; color: #b8d9f7; background: #152435; cursor: pointer; }
    .action-choice-row button:hover { background: #1d344b; }
    .action-return-card .meta { margin-top: 10px; color: #aab6c3; font-size: 12px; line-height: 1.45; }
    .action-return-card code { color: #d3e8ff; overflow-wrap: anywhere; }
    .release-valve .status-line { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-top: 8px; }
    .release-valve ul { margin: 10px 0 0; padding-left: 18px; color: #c4cfda; }
    .release-valve li { margin: 4px 0; }
    .operator-bench { margin-top: 16px; border: 1px solid #314152; background: #111820; border-radius: 8px; padding: 16px; }
    .bench-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; }
    .artifact-readback { margin-top: 12px; border: 1px solid #2e3d4c; border-radius: 6px; background: #0d1319; padding: 12px; color: #c4cfda; font-size: 13px; line-height: 1.45; overflow-wrap: anywhere; }
    .artifact-readback strong { color: #edf2f7; }
    .artifact-readback pre { white-space: pre-wrap; margin: 8px 0 0; max-height: 220px; overflow: auto; background: #080d12; border: 1px solid #22303c; border-radius: 6px; padding: 10px; }
    .flight-deck-bridge { margin: 0 0 18px; border: 2px solid #6caee8; background: #0f1720; border-radius: 8px; padding: 18px; }
    .flight-deck-bridge h2 { margin: 0 0 8px; font-size: 26px; }
    .bridge-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 10px; margin-top: 14px; }
    .bridge-cell { border: 1px solid #314960; border-radius: 6px; background: #0b1118; padding: 12px; }
    .bridge-cell strong { display: block; margin-bottom: 6px; }
    .bridge-cell p { margin: 0; color: #c4cfda; line-height: 1.45; }
    .bridge-cell code { color: #d3e8ff; overflow-wrap: anywhere; }
    @keyframes slide-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
    a { color: #8fc7ff; }
  </style>
</head>
<body>
  <main>
    <h1>TinkerDen Relay Flight Deck</h1>
    <div class="sub">Command Dash -> Aeye Thread Bridge -> receiver proof -> origin return. This page is useful only when a click creates work, the bridge moves it, and the answer comes back here.</div>
    ${flightDeckBridgePanel}
    ${momentVelocityGenerator}
    ${latestAeyeAnswerPanel}
    ${nerdkleOperatorPanel}
    ${bookCourierPanel}
    <details class="debug-drawer">
      <summary>Machine Evidence / Debug Panels</summary>
      <div class="debug-drawer-body">
    ${relayControlDeck}
    ${actionableReturnsPanel}
    ${relayChaserPanel}
    ${originReturnPanel}
    ${e2eProofPanel}
    <section class="relay-cockpit" data-testid="relay-cockpit">
      <div class="label">Command Dash To Aeye Relay</div>
      <h2>Momentum Relay</h2>
      <div class="rec-text">This is the anti-mule surface. Packets are not done when sent. They are done only when the receiver writes RECEIVED and then COMPLETED or BLOCKER.</div>
      <div class="summary-row">
        <div class="summary-box"><div class="label">Open / Unacknowledged</div><strong>${openCount}</strong></div>
        <div class="summary-box"><div class="label">Completed</div><strong>${completedCount}</strong></div>
        <div class="summary-box"><div class="label">Blockers</div><strong>${blockerCount}</strong></div>
      </div>
      <div class="quick-actions">
        <button type="button" id="dispatch-startup-button" data-testid="dispatch-startup-button">DISPATCH SKYBRO + PETRA STARTUP</button>
        <a href="/aeye/Skybro.Betsy" target="_blank" rel="noreferrer">Skybro Inbox</a>
        <a href="/aeye/Petra.Betsy" target="_blank" rel="noreferrer">Petra Inbox</a>
        <a href="/aeye/Swanson.Doss" target="_blank" rel="noreferrer">Swanson Inbox</a>
      </div>
      <div class="live-packet-grid" data-testid="relay-cockpit-packets">
        ${relayCockpitCards}
      </div>
    </section>
    <section class="brainboot" data-testid="brainboot-panel">
      <div class="label">Session Start</div>
      <h2>Nerdkle Brainboot</h2>
      <div class="rec-text">Dispatch shared source-truth Brainboot packets to Skybro and Petra. A packet is not complete until the receiver writes back RECEIVED and then COMPLETED or BLOCKER.</div>
      <div class="brainboot-row">
        <button type="button" id="brainboot-primary-button" data-testid="brainboot-primary-button">DISPATCH SESSION NERDKLE BRAINBOOT</button>
        <span class="mini">Creates durable packets in C:\speaker\brainboot\outbox and receiver receipts in C:\speaker\brainboot\receipts.</span>
      </div>
      <div id="brainboot-status-board" class="brainboot-board" data-testid="brainboot-status-board">
        <div class="brainboot-card pending">
          <div class="topline"><span class="target">Brainboot dispatch not checked yet.</span><span class="pill warn">UNKNOWN</span></div>
          <div class="meta">Polling <code>/v1/brainboot/status</code> for receiver-side ACK / COMPLETE / BLOCKER receipts.</div>
        </div>
      </div>
    </section>
    <section class="relay-panel" data-testid="aeye-relay-panel">
      <div class="label">Aeye Relay</div>
      <h2>Report Packet Dispatch</h2>
      <div class="rec-text">Send any report, decision packet, or source-truth note through the same receiver receipt lifecycle. This removes Ben as the courier: every packet must come back RECEIVED, COMPLETED, or BLOCKER.</div>
      <div class="relay-form">
        <input id="relay-target-input" data-testid="relay-target-input" value="Skybro.Betsy" aria-label="Target Aeye Machine" />
        <input id="relay-title-input" data-testid="relay-title-input" value="Source Truth Report Pickup" aria-label="Packet title" />
        <textarea id="relay-body-input" data-testid="relay-body-input" aria-label="Packet body">Read the latest source truth / Brainboot context and return a receiver receipt.</textarea>
        <button type="button" id="relay-dispatch-button" data-testid="relay-dispatch-button">DISPATCH REPORT PACKET</button>
      </div>
      <div id="relay-status-board" class="relay-board" data-testid="relay-status-board">
        <div class="relay-card pending">
          <div class="topline"><span class="target">No report relay packets checked yet.</span><span class="pill warn">UNKNOWN</span></div>
          <div class="meta">Polling <code>/v1/relay/status</code> for receiver-side receipts.</div>
        </div>
      </div>
    </section>
    <section class="inbox-links" data-testid="aeye-inbox-links">
      <div class="label">Standing Aeye Inboxes</div>
      <div class="rec-text">These are the receiver surfaces each Aeye can open at session start. They show pending Brainboot and report packets and write receiver receipts back to this dashboard.</div>
      <div class="links">
        <a href="/aeye/Skybro.Betsy" target="_blank" rel="noreferrer">Skybro@Betsy Inbox</a>
        <a href="/aeye/Petra.Betsy" target="_blank" rel="noreferrer">Petra@Betsy Inbox</a>
        <a href="/aeye/Swanson.Doss" target="_blank" rel="noreferrer">Swanson@Doss Inbox</a>
        <a href="/aeye/Fucko.Betsy" target="_blank" rel="noreferrer">Fucko@Betsy Inbox</a>
      </div>
    </section>
    <section class="grid">
      <div class="panel"><div class="label">Daemon</div><div class="value">${escapeHtml(snapshot.health.status || "UNKNOWN")}</div></div>
      <div class="panel"><div class="label">Friction</div><div class="value">${escapeHtml(snapshot.heat.status || "UNKNOWN")}</div></div>
      <div class="panel"><div class="label">Daemon Fractures</div><div class="value">${escapeHtml(snapshot.heat.summary?.daemon_fracture_count ?? 0)}</div></div>
      <div class="panel"><div class="label">Updated</div><div class="value" style="font-size:14px">${escapeHtml(snapshot.health.generated_at || snapshot.generated_at)}</div></div>
    </section>
    <section class="release-valve" data-testid="release-valve">
      <div class="label">Release Valve</div>
      <h2>GitHub Source Truth Gate</h2>
      <div class="status-line">
        <span id="release-valve-pill" class="pill warn">CHECKING</span>
        <span id="release-valve-summary" class="context-status">Reading release readiness...</span>
      </div>
      <ul id="release-valve-blockers"><li>Waiting for first readback.</li></ul>
    </section>
    <section class="operator-bench" data-testid="operator-bench">
      <div class="label">Operator Workbench</div>
      <h2>Safe Local Muscles</h2>
      <div class="rec-text">These buttons create or validate local artifacts only. They do not push, merge, delete doctrine, or promote canonical Source Truth.</div>
      <div class="bench-actions">
        <button type="button" id="ingest-inbox-button" data-testid="ingest-inbox-button">INGEST RAW RECEIPTS</button>
        <button type="button" id="refresh-repo-button" data-testid="refresh-repo-button">REFRESH REPO SNAPSHOT</button>
        <button type="button" id="render-bootpack-button" data-testid="render-bootpack-button">DISPATCH BRAINBOOT</button>
      </div>
      <div id="operator-workbench-status" class="artifact-readback" data-testid="operator-workbench-status">
        <strong>Ready.</strong> Choose a safe muscle to produce a readback.
      </div>
    </section>
    <section class="membrane" data-testid="feral-membrane">
      <div class="label">Feral Membrane</div>
      <h2>Recommendation Card</h2>
      <div class="rec-title" id="ratchet-rec-title">Keep Speaker receipts in raw inbox until deterministic ingest runs</div>
      <div class="rec-text" id="ratchet-rec-text">This test card exists so Operator corrections can enter inheritance as DECISION receipts instead of disappearing as a silent click.</div>
      <div class="actions">
        <button type="button" data-testid="proceed-button" id="proceed-button">PROCEED</button>
        <button type="button" class="defer" data-testid="defer-button" id="defer-button">DEFER</button>
        <button type="button" class="kill" data-testid="kill-button" id="kill-button">KILL</button>
      </div>
      <div class="reason-panel" id="ratchet-reason-panel" data-testid="ratchet-reason-panel" hidden>
        <label id="ratchet-reason-label" for="ratchet-reason-input">Reason required</label>
        <div class="reason-row">
          <input id="ratchet-reason-input" data-testid="ratchet-reason-input" maxlength="280" />
          <button type="button" id="ratchet-submit-button" data-testid="ratchet-submit-button">WRITE RECEIPT</button>
        </div>
      </div>
      <div id="ratchet-status" data-testid="ratchet-status"></div>
    </section>
    <h2>Core Organs</h2>
    <table><thead><tr><th>Organ</th><th>Status</th><th>PID</th><th>Restarts</th></tr></thead><tbody>${rows}</tbody></table>
    <h2>Recent Friction Flags</h2>
    <table><thead><tr><th>Flag</th><th>Source</th><th>Rule</th></tr></thead><tbody>${flagRows || "<tr><td colspan='3'>No flags.</td></tr>"}</tbody></table>
    <section class="context-pane" data-testid="context-pane">
      <div class="context-head">
        <div>
          <div class="label">Context Pane</div>
          <h2>Graveyard / Ledger</h2>
        </div>
        <div class="context-status" id="stream-log-status">Waiting for Speaker ingest log...</div>
      </div>
      <div id="receipt-stream" class="receipt-stream" data-testid="receipt-stream">
        <div class="receipt-card">
          <div class="receipt-id">No stream events loaded yet.</div>
          <div class="receipt-meta">Polling <code>/v1/system/stream_log</code> for canonicalized or quarantined Speaker receipts.</div>
        </div>
      </div>
    </section>
      </div>
    </details>
    <p><a href="/health">JSON health</a> · <a href="/daemon">JSON daemon snapshot</a> · <a href="/friction">JSON friction</a></p>
  </main>
  <script>
    let pendingRatchetDecision = null;
    const seenStreamEvents = new Set();
    let latestActionableSnapshot = null;

    function brainbootCardClass(status) {
      const upper = String(status || "").toUpperCase();
      if (upper.includes("COMPLETED")) return "complete";
      if (upper.includes("BLOCKER") || upper.includes("INVALID")) return "blocker";
      return "pending";
    }

    function brainbootPillClass(status) {
      const upper = String(status || "").toUpperCase();
      if (upper.includes("COMPLETED")) return "ok";
      if (upper.includes("BLOCKER") || upper.includes("INVALID")) return "bad";
      return "warn";
    }

    function renderBrainbootBoard(packets) {
      const board = document.getElementById("brainboot-status-board");
      board.innerHTML = "";
      if (!packets || packets.length === 0) {
        const empty = document.createElement("div");
        empty.className = "brainboot-card pending";
        empty.innerHTML = '<div class="topline"><span class="target">No Brainboot packets yet.</span><span class="pill warn">EMPTY</span></div><div class="meta">Click DISPATCH SESSION NERDKLE BRAINBOOT to create receiver-visible packets.</div>';
        board.appendChild(empty);
        return;
      }
      for (const packet of packets.slice(0, 6)) {
        const card = document.createElement("div");
        card.className = "brainboot-card " + brainbootCardClass(packet.status);
        const status = packet.status || "UNKNOWN";
        const link = packet.receive_url ? '<a href="' + packet.receive_url + '" target="_blank" rel="noreferrer">receiver page</a>' : 'no receiver link';
        const receipt = packet.last_receiver_receipt_id || "NO_RECEIVER_RECEIPT";
        card.innerHTML = [
          '<div class="topline">',
          '<span class="target">' + (packet.target || "UNKNOWN_TARGET") + '</span>',
          '<span class="pill ' + brainbootPillClass(status) + '">' + status + '</span>',
          '</div>',
          '<div class="meta">',
          '<div>packet: <code>' + (packet.packet_id || "UNKNOWN") + '</code></div>',
          '<div>bootpack: <code>' + (packet.bootpack_sha256 || "NO_HASH") + '</code></div>',
          '<div>receiver: ' + link + '</div>',
          '<div>last receipt: <code>' + receipt + '</code></div>',
          '</div>'
        ].join("");
        board.appendChild(card);
      }
    }

    async function pollBrainbootStatus() {
      try {
        const response = await fetch("/v1/brainboot/status?limit=10", { cache: "no-store" });
        const result = await response.json();
        renderBrainbootBoard(result.packets || []);
      } catch (error) {
        renderBrainbootBoard([{ target: "Brainboot status", status: "STATUS_READBACK_FAILED", packet_id: error.message }]);
      }
    }

    function renderRelayBoard(packets) {
      const board = document.getElementById("relay-status-board");
      board.innerHTML = "";
      if (!packets || packets.length === 0) {
        const empty = document.createElement("div");
        empty.className = "relay-card pending";
        empty.innerHTML = '<div class="topline"><span class="target">No report packets yet.</span><span class="pill warn">EMPTY</span></div><div class="meta">Dispatch a report packet to create receiver-visible work.</div>';
        board.appendChild(empty);
        return;
      }
      for (const packet of packets.slice(0, 6)) {
        const card = document.createElement("div");
        card.className = "relay-card " + brainbootCardClass(packet.status);
        const status = packet.status || "UNKNOWN";
        const link = packet.receive_url ? '<a href="' + packet.receive_url + '" target="_blank" rel="noreferrer">receiver page</a>' : 'no receiver link';
        card.innerHTML = [
          '<div class="topline">',
          '<span class="target">' + (packet.target || "UNKNOWN_TARGET") + ' | ' + (packet.packet_type || "REPORT") + '</span>',
          '<span class="pill ' + brainbootPillClass(status) + '">' + status + '</span>',
          '</div>',
          '<div class="meta">',
          '<div>title: <code>' + (packet.title || "UNTITLED") + '</code></div>',
          '<div>packet: <code>' + (packet.packet_id || "UNKNOWN") + '</code></div>',
          '<div>receiver: ' + link + '</div>',
          '<div>last receipt: <code>' + (packet.last_receiver_receipt_id || "NO_RECEIVER_RECEIPT") + '</code></div>',
          '</div>'
        ].join("");
        board.appendChild(card);
      }
    }

    async function pollRelayStatus() {
      try {
        const response = await fetch("/v1/relay/status?limit=10", { cache: "no-store" });
        const result = await response.json();
        renderRelayBoard(result.packets || []);
      } catch (error) {
        renderRelayBoard([{ target: "Relay status", status: "STATUS_READBACK_FAILED", packet_id: error.message }]);
      }
    }

    function clientEscapeHtml(value) {
      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
    }

    function clientActionChoiceMeaning(choice) {
      const upper = String(choice || "").toUpperCase();
      if (upper.includes("TRUST")) return "Accept this receiver answer as enough session context to stop re-explaining this item manually.";
      if (upper.includes("ASSIGN")) return "Turn this returned answer into a concrete work request for the receiver.";
      if (upper.includes("NEXT") || upper.includes("SEND") || upper.includes("CREATE")) return "Continue this same handoff chain by creating the next packet.";
      if (upper.includes("ASSIMILATE")) return "Move the returned answer toward memory/doctrine after proof review.";
      if (upper.includes("RETRY")) return "Send the same kind of packet again because the first path did not close cleanly.";
      if (upper.includes("REPAIR") || upper.includes("RESOLVE")) return "Create a blocker-fix packet before trusting or advancing this answer.";
      if (upper.includes("HOLD") || upper.includes("NO ACTION")) return "Record that you are not advancing this answer yet.";
      return "Record this operator choice and create the smallest follow-up packet only when needed.";
    }

    function renderLatestAeyeAnswer(snapshot) {
      const panel = document.querySelector('[data-testid="latest-aeye-answer"]');
      if (!panel) return;
      const items = snapshot && Array.isArray(snapshot.actionable) ? snapshot.actionable : [];
      const item = items[0] || null;
      if (!item) {
        panel.className = "latest-aeye-answer missing";
        panel.innerHTML = [
          '<div class="label">Latest Aeye Answer</div>',
          '<h2>No Returned Aeye Answer Yet</h2>',
          '<div class="answer-status-row">',
          '<span class="pill warn">WAITING_FOR_RETURN</span>',
          '<span>actionable items: <code>0</code></span>',
          '</div>',
          '<p class="answer-text">No Aeye answer is currently readable by the origin dash. Run the chaser or dispatch a Brainboot/startup packet.</p>'
        ].join("");
        return;
      }
      const choices = (item.operator_choices || []).map((choice) =>
        '<button type="button" class="action-return-choice latest-choice" data-choice="' + clientEscapeHtml(choice) +
        '" data-target="' + clientEscapeHtml(item.target || "") +
        '" data-packet-id="' + clientEscapeHtml(item.packet_id || "") +
        '" data-advanced="' + clientEscapeHtml(item.advanced || "") +
        '" data-decision="' + clientEscapeHtml(item.helps_decide || "") +
        '" data-receipt="' + clientEscapeHtml(item.receiver_receipt_id || "") + '">' +
        clientEscapeHtml(choice) + '</button>'
      ).join("");
      const choiceMeanings = (item.operator_choices || []).map((choice) =>
        '<div><strong>' + clientEscapeHtml(choice) + '</strong><span>' + clientEscapeHtml(clientActionChoiceMeaning(choice)) + '</span></div>'
      ).join("");
      const actedOn = Boolean(item.acted_on);
      const decision = item.latest_operator_decision || {};
      const actedLine = actedOn
        ? '<div class="already-acted">Already acted on: <code>' + clientEscapeHtml(decision.choice || "UNKNOWN_CHOICE") + '</code> at <code>' + clientEscapeHtml(decision.created_at || "unknown") + '</code>' + (decision.followup_packet_id ? ', follow-up packet <code>' + clientEscapeHtml(decision.followup_packet_id) + '</code>' : '') + '.</div>'
        : '';
      panel.className = "latest-aeye-answer";
      panel.innerHTML = [
        '<div class="label">Latest Aeye Answer</div>',
        '<h2>' + clientEscapeHtml(item.target || "Aeye") + ' Answered</h2>',
        '<div class="answer-explainer"><strong>What this card is</strong><p>This card is the newest receiver answer that made it back to the Command Dash. It is not automatically assimilated; it is waiting for you to either continue the chain, assign work, or hold it.</p></div>',
        '<div class="answer-status-row">',
        '<span class="pill ' + (item.answer_status === "BLOCKER" ? "bad" : "ok") + '">' + clientEscapeHtml(item.origin_readback_status || "RETURN_STATUS_UNKNOWN") + '</span>',
        '<span>answer: <code>' + clientEscapeHtml(item.answer_status || "UNKNOWN") + '</code></span>',
        '<span>returned: <code>' + clientEscapeHtml(item.returned_at || "unknown") + '</code></span>',
        '<span class="pill ' + (actedOn ? "ok" : "warn") + '">' + (actedOn ? "ALREADY_ACTED_ON" : "AWAITING_OPERATOR_DECISION") + '</span>',
        '</div>',
        actedLine,
        '<div class="answer-grid">',
        '<div class="answer-main"><strong>Aeye answer</strong><p>' + clientEscapeHtml(item.answer_evidence || item.evidence || "No answer text found in the receiver receipt.") + '</p></div>',
        '<div class="answer-main"><strong>This advances</strong><p>' + clientEscapeHtml(item.advanced || "The origin dash has terminal receiver proof for this packet.") + '</p></div>',
        '<div class="answer-main decision"><strong>Now decide</strong><p>' + clientEscapeHtml(item.helps_decide || "Review this returned answer and choose the next move.") + '</p><div class="latest-choice-row">' + (choices || '<button type="button" id="latest-refresh-button">REFRESH RETURN PROOF</button>') + '</div><div class="button-meaning">' + (choiceMeanings || '<div><strong>Refresh Return Proof</strong><span>Read the latest receiver-return proof again before deciding.</span></div>') + '</div></div>',
        '</div>',
        '<div class="answer-proof-line">',
        '<span>packet <code>' + clientEscapeHtml(item.packet_id || "UNKNOWN_PACKET") + '</code></span>',
        '<span>receipt <code>' + clientEscapeHtml(item.receiver_receipt_id || "NO_RECEIPT") + '</code></span>',
        '<span>hash <code>' + clientEscapeHtml(item.receiver_receipt_sha256 || "NO_HASH") + '</code></span>',
        '</div>'
      ].join("");
      bindActionableReturnButtons();
      bindClick("latest-refresh-button", () => refreshRelayReadback("Latest answer proof refreshed"));
    }

    function renderOriginReturnBoard(snapshot) {
      const board = document.getElementById("origin-return-board");
      if (!board) return;
      const returns = snapshot && Array.isArray(snapshot.returns) ? snapshot.returns : [];
      board.innerHTML = "";
      if (returns.length === 0) {
        const empty = document.createElement("div");
        empty.className = "proof-receipts";
        empty.textContent = "No returned answers found yet.";
        board.appendChild(empty);
        return;
      }
      for (const item of returns.slice(0, 6)) {
        const card = document.createElement("article");
        card.className = "origin-return-card " + (item.answer_status === "BLOCKER" ? "blocker" : "complete");
        card.innerHTML = [
          '<div class="topline">',
          '<strong>' + clientEscapeHtml(item.target || "UNKNOWN_TARGET") + '</strong>',
          '<span class="pill ' + (item.answer_status === "BLOCKER" ? "bad" : "ok") + '">' + clientEscapeHtml(item.origin_readback_status || "UNKNOWN") + '</span>',
          '</div>',
          '<div class="meta">',
          '<div>packet: <code>' + clientEscapeHtml(item.packet_id || "UNKNOWN_PACKET") + '</code></div>',
          '<div>channel: <code>' + clientEscapeHtml(item.channel || "UNKNOWN") + '</code> | answer: <code>' + clientEscapeHtml(item.answer_status || "UNKNOWN") + '</code></div>',
          '<div>receipt: <code>' + clientEscapeHtml(item.receiver_receipt_id || "NO_RECEIPT") + '</code></div>',
          '<div>hash: <code>' + clientEscapeHtml(item.receiver_receipt_sha256 || "NO_HASH") + '</code></div>',
          '<div>evidence: ' + clientEscapeHtml(item.answer_evidence || "No receiver evidence text found.") + '</div>',
          '</div>'
        ].join("");
        board.appendChild(card);
      }
    }

    async function pollOriginReturn() {
      try {
        const response = await fetch("/v1/relay/origin_return?limit=8", { cache: "no-store" });
        const result = await response.json();
        renderOriginReturnBoard(result.origin_return || {});
      } catch (error) {
        renderOriginReturnBoard({
          returns: [{
            target: "Origin return",
            packet_id: error.message,
            channel: "readback",
            answer_status: "BLOCKER",
            origin_readback_status: "ORIGIN_RETURN_READBACK_FAILED",
            receiver_receipt_id: "NO_RECEIPT",
            receiver_receipt_sha256: "NO_HASH",
            answer_evidence: "Origin return endpoint could not be read."
          }]
        });
      }
    }

    function latestBridgeItemForClient(result, target) {
      const pools = []
        .concat(Array.isArray(result.queued) ? result.queued : [])
        .concat(Array.isArray(result.file_inbox) ? result.file_inbox : [])
        .concat(Array.isArray(result.sent) ? result.sent : [])
        .concat(Array.isArray(result.blocked) ? result.blocked : []);
      return pools.find((item) => item.target === target) || null;
    }

    function bridgeStateClass(status) {
      const text = String(status || "").toUpperCase();
      if (text.includes("SENT")) return "ok";
      if (text.includes("BLOCK")) return "bad";
      return "warn";
    }

    function renderTargetThreadMapClient(result) {
      const grid = document.getElementById("target-thread-map-grid");
      if (!grid) return;
      const targets = Array.isArray(result.known_target_threads) ? result.known_target_threads : [];
      grid.innerHTML = "";
      if (!targets.length) {
        grid.innerHTML = '<div class="mv-empty">No Aeye thread mappings are configured.</div>';
        return;
      }
      for (const target of targets) {
        const latest = latestBridgeItemForClient(result, target.target);
        const state = latest?.status || "NO_PACKET_SENT_YET";
        const routeStatus = String(target.route_status || "").toUpperCase();
        const routeCls = routeStatus.includes("MAPPED") ? "ok" : routeStatus.includes("HELD") || target.relay_mode === "DO_NOT_ROUTE" ? "bad" : "warn";
        const cls = state === "NO_PACKET_SENT_YET" ? routeCls : bridgeStateClass(state);
        const card = document.createElement("article");
        card.className = "target-thread-card " + cls;
        card.innerHTML = [
          '<div class="topline"><strong>' + clientEscapeHtml(target.title || target.target || "Unknown target") + '</strong><span class="pill ' + cls + '">' + clientEscapeHtml(state) + '</span></div>',
          '<div class="meta">Aeye target: <code>' + clientEscapeHtml(target.target || "UNKNOWN_TARGET") + '</code></div>',
          '<div class="meta">Actual Codex chat: <code>' + clientEscapeHtml(target.thread_id || "NO_THREAD_MAPPING") + '</code></div>',
          '<div class="meta">Route: <code>' + clientEscapeHtml(target.route_status || "UNKNOWN_ROUTE") + '</code> | availability: <code>' + clientEscapeHtml(target.availability || "UNKNOWN") + '</code></div>',
          '<div class="meta">Relay mode: <code>' + clientEscapeHtml(target.relay_mode || "UNKNOWN_MODE") + '</code></div>',
          target.file_inbox_url ? '<div class="meta">LAN inbox: <a href="' + clientEscapeHtml(target.file_inbox_url) + '" target="_blank" rel="noreferrer">' + clientEscapeHtml(target.file_inbox_url) + '</a></div>' : '',
          '<div class="meta">Latest bridge item: <code>' + clientEscapeHtml(latest?.packet_id || latest?.queue_id || "No target-thread packet created yet.") + '</code></div>',
          '<div class="meta">Receiver proof: <code>' + clientEscapeHtml(target.latest_completion_state || "NO_RECEIVER_PROOF") + '</code></div>',
          target.latest_receiver_receipt_id ? '<div class="meta">Return receipt: <code>' + clientEscapeHtml(target.latest_receiver_receipt_id) + '</code></div>' : '',
          target.latest_receiver_receipt_sha256 ? '<div class="meta">Receipt hash: <code>' + clientEscapeHtml(target.latest_receiver_receipt_sha256) + '</code></div>' : '',
          '<div class="meta proof-rule">' + clientEscapeHtml(target.latest_proof_gap || "No receiver-side return has been proven for the latest packet.") + '</div>',
          '<div class="meta">Actuator: ' + clientEscapeHtml(target.actuator || "Codex thread bridge") + '</div>',
          '<div class="meta proof-rule">' + clientEscapeHtml(target.proof_rule || "Receiver proof required before delivery can be claimed.") + '</div>'
        ].join("");
        grid.appendChild(card);
      }
    }

    async function pollThreadBridgeStatus() {
      const box = document.getElementById("mv-thread-bridge-status");
      if (!box) return;
      try {
        const response = await fetch("/v1/relay/thread_bridge/status?limit=10", { cache: "no-store" });
        const result = await response.json();
        renderTargetThreadMapClient(result);
        const queued = Array.isArray(result.queued) ? result.queued : [];
        const sent = Array.isArray(result.sent) ? result.sent : [];
        const blocked = Array.isArray(result.blocked) ? result.blocked : [];
        const fileInbox = Array.isArray(result.file_inbox) ? result.file_inbox : [];
        const targets = Array.isArray(result.known_target_threads) ? result.known_target_threads : [];
        const roundTrip = targets.filter((target) => String(target.latest_completion_state || "").toUpperCase() === "COMPLETED_RECEIPT_PROVEN").length;
        const waitingReceiver = targets.filter((target) => String(target.latest_completion_state || "").toUpperCase().includes("WAITING") || String(target.latest_completion_state || "").toUpperCase().includes("SENT_UNACKNOWLEDGED")).length;
        const actuator = result.actuator || {};
        const latest = queued[0] || fileInbox[0] || sent[0] || blocked[0] || null;
        const bridgeClass = blocked.length ? "bad" : !actuator.active && queued.length ? "paused" : fileInbox.length ? "warn" : queued.length ? "warn" : sent.length ? "ok" : "";
        const warning = result.operator_warning || actuator.operator_meaning || "Receiver proof still requires RECEIVED then COMPLETED/BLOCKER.";
        box.className = "mv-thread-bridge " + bridgeClass;
        box.innerHTML = [
          '<strong>Aeye Thread Bridge - ' + clientEscapeHtml(actuator.status || "UNKNOWN") + '</strong>',
          '<span>round-trip proven: ' + roundTrip + ' | waiting receiver: ' + waitingReceiver + ' | queued-for-chat: ' + queued.length + ' | file-inbox: ' + fileInbox.length + ' | sent-to-chat: ' + sent.length + ' | blocked: ' + blocked.length + (latest ? ' | latest: ' + clientEscapeHtml(latest.packet_id || latest.queue_id) : '') + '</span>',
          '<span>' + clientEscapeHtml(warning) + '</span>'
        ].join("");
      } catch (error) {
        box.className = "mv-thread-bridge bad";
        box.innerHTML = '<strong>Aeye Thread Bridge</strong><span>readback failed: ' + clientEscapeHtml(error.message) + '</span>';
      }
    }

    function bindActionableReturnButtons() {
      document.querySelectorAll(".action-return-choice").forEach((button) => {
        if (button.dataset.bound === "true") return;
        button.dataset.bound = "true";
        button.addEventListener("click", () => prepareActionableReturnChoice(button));
      });
    }

    function renderMomentVelocityTop(snapshot) {
      const items = snapshot && Array.isArray(snapshot.actionable) ? snapshot.actionable : [];
      const inbox = document.querySelector('[data-testid="automatica-inbox"] .mv-inbox-grid');
      const item = items[0] || null;
      if (inbox) {
        inbox.innerHTML = "";
        if (!items.length) {
          inbox.innerHTML = '<article class="mv-inbox-card"><div class="mv-card-top"><strong>No Automatica cards yet</strong><span>WAITING</span></div><div><span>What came in</span>No returned report is currently actionable.</div><div><span>What changed</span>Nothing new has influenced this session.</div></article>';
        } else {
          for (const entry of items.slice(0, 3)) {
            const card = document.createElement("article");
            card.className = "mv-inbox-card";
            card.innerHTML = [
              '<div class="mv-card-top"><strong>' + clientEscapeHtml(entry.target || "Unknown Aeye") + '</strong><span>' + clientEscapeHtml(entry.answer_status || "UNKNOWN") + '</span></div>',
              '<div><span>What came in</span>' + clientEscapeHtml(entry.evidence || entry.answer_evidence || "Receiver returned proof without readable evidence text.") + '</div>',
              '<div><span>What changed</span>' + clientEscapeHtml(entry.advanced || "No state delta recorded.") + '</div>',
              '<div><span>Proof</span><code>' + clientEscapeHtml(entry.receiver_receipt_id || "NO_RECEIPT") + '</code></div>',
              '<div><span>Blocked?</span>' + clientEscapeHtml(entry.answer_status === "BLOCKER" ? "Yes - resolve before firing." : "No blocker on this return.") + '</div>',
              '<div><span>Influence this session?</span>' + clientEscapeHtml(entry.answer_status === "COMPLETED" ? "Yes - use it for the next move." : "Only after blocker is resolved.") + '</div>'
            ].join("");
            inbox.appendChild(card);
          }
        }
      }
      const momentGrid = document.querySelector('[data-testid="moment-card"] .mv-moment-grid');
      if (momentGrid) {
        const whatHappened = item?.evidence || item?.answer_evidence || "No Aeye response has returned to the origin dash yet.";
        const whyMatters = item?.advanced || "The origin dash is waiting for a receiver answer.";
        const changed = item?.answer_status === "COMPLETED" ? "The handoff is no longer Ben-carried for this card." : "No new session-changing report is proven yet.";
        const recommended = item ? (item.acted_on ? "Watch the follow-up packet for receipt closure." : (item.recommendation || "Review and choose a next move.")) : "Dispatch Brainboot or wait for Automatica input.";
        const proof = item?.receiver_receipt_sha256 ? "Receipt-backed" : "Waiting for proof";
        const benAction = item?.acted_on ? "None until follow-up receipt returns." : item ? "Review / Fire / Hold." : "None unless you want to start a packet.";
        momentGrid.innerHTML = [
          '<div><span>What just happened</span><p>' + clientEscapeHtml(whatHappened) + '</p></div>',
          '<div><span>Why it matters</span><p>' + clientEscapeHtml(whyMatters) + '</p></div>',
          '<div><span>What I think changed</span><p>' + clientEscapeHtml(changed) + '</p></div>',
          '<div><span>Recommended next move</span><p>' + clientEscapeHtml(recommended) + '</p></div>',
          '<div><span>Confidence / proof</span><p>' + clientEscapeHtml(proof) + '</p></div>',
          '<div><span>Ben action</span><p>' + clientEscapeHtml(benAction) + '</p></div>'
        ].join("");
      }
      const seed = document.querySelector(".mv-context-seed");
      if (seed && item) {
        seed.setAttribute("data-target", item.target || "Skybro.Betsy");
        seed.setAttribute("data-decision", item.helps_decide || "What should move next from this session?");
        seed.setAttribute("data-context", item.advanced || "No returned context is available yet.");
        seed.innerHTML = '<strong>Current seed:</strong> ' + clientEscapeHtml(item.helps_decide || "What should move next from this session?");
      }
    }

    function renderActionableReturnBoard(snapshot) {
      latestActionableSnapshot = snapshot || null;
      renderMomentVelocityTop(snapshot);
      const board = document.getElementById("actionable-return-board");
      if (!board) return;
      renderLatestAeyeAnswer(snapshot);
      const section = document.querySelector('[data-testid="actionable-returns"]');
      const items = snapshot && Array.isArray(snapshot.actionable) ? snapshot.actionable : [];
      const status = snapshot?.status || "UNKNOWN";
      if (section) {
        const pill = section.querySelector(".proof-head .pill");
        const count = section.querySelector(".proof-head code");
        if (pill) {
          pill.textContent = status;
          pill.className = "pill " + (status === "ACTIONABLE_RETURNS_READY" ? "ok" : "warn");
        }
        if (count) count.textContent = String(snapshot?.actionable_count ?? items.length);
      }
      board.innerHTML = "";
      if (items.length === 0) {
        const empty = document.createElement("div");
        empty.className = "proof-receipts";
        empty.textContent = "No actionable returned answers yet.";
        board.appendChild(empty);
        return;
      }
      for (const item of items.slice(0, 6)) {
        const card = document.createElement("article");
        card.className = "action-return-card";
        const choices = (item.operator_choices || []).map((choice) =>
          '<button type="button" class="action-return-choice" data-choice="' + clientEscapeHtml(choice) +
          '" data-target="' + clientEscapeHtml(item.target || "") +
          '" data-packet-id="' + clientEscapeHtml(item.packet_id || "") +
          '" data-advanced="' + clientEscapeHtml(item.advanced || "") +
          '" data-decision="' + clientEscapeHtml(item.helps_decide || "") +
          '" data-receipt="' + clientEscapeHtml(item.receiver_receipt_id || "") + '">' +
          clientEscapeHtml(choice) + '</button>'
        ).join("");
        card.innerHTML = [
          '<div class="topline">',
          '<strong>' + clientEscapeHtml(item.target || "UNKNOWN_TARGET") + '</strong>',
          '<span class="pill ok">' + clientEscapeHtml(item.recommendation || "REVIEW") + '</span>',
          '</div>',
          '<div class="action-return-body">',
          '<div><span>Sent</span>' + clientEscapeHtml(item.sent || "No sent summary.") + '</div>',
          '<div><span>Advanced</span>' + clientEscapeHtml(item.advanced || "No advancement summary.") + '</div>',
          '<div><span>Decision</span>' + clientEscapeHtml(item.helps_decide || "No decision question.") + '</div>',
          '</div>',
          '<div class="action-choice-row">' + choices + '</div>',
          '<div class="meta">',
          '<div>packet: <code>' + clientEscapeHtml(item.packet_id || "UNKNOWN_PACKET") + '</code></div>',
          '<div>receipt: <code>' + clientEscapeHtml(item.receiver_receipt_id || "NO_RECEIPT") + '</code></div>',
          '<div>hash: <code>' + clientEscapeHtml(item.receiver_receipt_sha256 || "NO_HASH") + '</code></div>',
          '</div>'
        ].join("");
        board.appendChild(card);
      }
      bindActionableReturnButtons();
    }

    async function pollActionableReturns() {
      try {
        const response = await fetch("/v1/relay/actionable_returns?limit=8", { cache: "no-store" });
        const result = await response.json();
        renderActionableReturnBoard(result.actionable_returns || {});
      } catch (error) {
        renderActionableReturnBoard({
          status: "ACTIONABLE_RETURNS_READBACK_FAILED",
          actionable: [{
            target: "Flight Deck",
            recommendation: "CHECK_ENDPOINT",
            sent: "Actionable return endpoint failed.",
            advanced: "No advancement can be trusted until readback succeeds.",
            helps_decide: error.message,
            packet_id: "NO_PACKET",
            receiver_receipt_id: "NO_RECEIPT",
            receiver_receipt_sha256: "NO_HASH",
            operator_choices: ["HOLD"]
          }]
        });
      }
    }

    function relayPacketStage(packet) {
      const status = String(packet?.status || "").toUpperCase();
      if (status.includes("COMPLETED")) return { label: "COMPLETED", cls: "complete" };
      if (status.includes("BLOCKER")) return { label: "BLOCKER", cls: "blocker" };
      if (status.includes("RECEIVED")) return { label: "RECEIVED_NOT_COMPLETED", cls: "" };
      if (status.includes("SENT")) return { label: "WAITING_FOR_RECEIVER", cls: "" };
      return { label: status || "UNKNOWN", cls: "" };
    }

    function collectRelayPackets(result) {
      const packets = [];
      for (const packet of result?.brainboot_packets || []) packets.push({ kind: "Brainboot", packet });
      for (const packet of result?.relay_packets || []) packets.push({ kind: "Relay", packet });
      if (result?.relay_packet) packets.push({ kind: "Relay", packet: result.relay_packet });
      if (result?.packet) packets.push({ kind: "Packet", packet: result.packet });
      return packets.filter((entry) => entry.packet && entry.packet.packet_id);
    }

    function describeButtonOutcome(label, result) {
      const packets = collectRelayPackets(result);
      const lines = [];
      if (result?.status) lines.push("status: " + result.status);
      if (result?.chaser) {
        const stale = result.chaser.stale_incomplete_count ?? "unknown";
        const count = Array.isArray(result.chaser.chases) ? result.chaser.chases.length : 0;
        lines.push("chaser: " + (result.chaser.status || "UNKNOWN") + " | stale: " + stale + " | chase packets: " + count);
      }
      if (result?.decision) {
        lines.push("decision logged: " + result.decision.decision_id);
        lines.push(result.decision.followup_dispatched ? "next packet created from decision" : "hold recorded; no packet dispatched");
      }
      if (result?.manifest_path) {
        lines.push("bootstrap manifest: " + result.manifest_path);
        lines.push("bootstrap count: " + (result.bootstrap_count ?? 0));
        if (result.manifest_sha256) lines.push("manifest sha256: " + result.manifest_sha256);
      }
      if (result?.proof_path || result?.output_path) {
        if (result.proof_path) lines.push("proof path: " + result.proof_path);
        if (result.proof_sha256) lines.push("proof sha256: " + result.proof_sha256);
        if (result.output_path) lines.push("output path: " + result.output_path);
      }
      if (result?.summary) {
        lines.push("round-trip proven: " + (result.summary.round_trip_proven ?? 0) + " | file-inbox waiting: " + (result.summary.file_inbox_waiting ?? 0));
      }
      if (packets.length) {
        const queued = packets.filter((entry) => entry.packet.thread_bridge?.status === "QUEUED_FOR_CODEX_THREAD_SEND").length;
        const fileInbox = packets.filter((entry) => entry.packet.thread_bridge?.status === "FILE_INBOX_WAITING_FOR_RECEIVER").length;
        const blocked = packets.filter((entry) => entry.packet.thread_bridge?.status === "NO_THREAD_MAPPING").length;
        const paused = packets.filter((entry) => entry.packet.thread_bridge?.actuator_active === false).length;
        lines.push("created packets: " + packets.length + " | thread bridge queued: " + queued + " | file inbox waiting: " + fileInbox + " | blocked mappings: " + blocked);
        if (paused) lines.push("bridge paused: queued packets will not appear in Aeye chats until the bridge is resumed or manually drained");
        lines.push("next state: WAITING_FOR_THREAD_SEND_THEN_RECEIVER");
      }
      if (!packets.length && !result?.decision && !result?.chaser && !result?.manifest_path && !result?.proof_path && !result?.output_path && !result?.summary) lines.push("No packet was created by this button.");
      return { packets, lines };
    }

    function renderButtonOutcome(label, result) {
      const { packets, lines } = describeButtonOutcome(label, result);
      const cards = packets.map((entry) => {
        const packet = entry.packet;
        const stage = relayPacketStage(packet);
        const receive = packet.receive_url
          ? '<a href="' + clientEscapeHtml(packet.receive_url) + '" target="_blank" rel="noreferrer">open receiver</a>'
          : 'no receiver URL';
        return [
          '<article class="relay-outcome-card ' + stage.cls + '">',
          '<strong>' + clientEscapeHtml(entry.kind + " packet") + '</strong>',
          '<span class="pill warn stage">' + clientEscapeHtml(stage.label) + '</span>',
          '<div class="meta">',
          '<div>target: <code>' + clientEscapeHtml(packet.target || "UNKNOWN") + '</code></div>',
          '<div>packet: <code>' + clientEscapeHtml(packet.packet_id || "UNKNOWN_PACKET") + '</code></div>',
          '<div>status: <code>' + clientEscapeHtml(packet.status || "UNKNOWN") + '</code></div>',
          '<div>thread bridge: <code>' + clientEscapeHtml(packet.thread_bridge?.status || "NOT_QUEUED") + '</code></div>',
          '<div>relay mode: <code>' + clientEscapeHtml(packet.thread_bridge?.relay_mode || "UNKNOWN_MODE") + '</code></div>',
          '<div>bridge actuator: <code>' + clientEscapeHtml(packet.thread_bridge?.actuator_status || "UNKNOWN") + '</code></div>',
          '<div>thread: <code>' + clientEscapeHtml(packet.thread_bridge?.thread_id || "NO_THREAD_MAPPING") + '</code></div>',
          packet.thread_bridge?.file_inbox_url ? '<div>LAN inbox: <a href="' + clientEscapeHtml(packet.thread_bridge.file_inbox_url) + '" target="_blank" rel="noreferrer">' + clientEscapeHtml(packet.thread_bridge.file_inbox_url) + '</a></div>' : '',
          '<div>receiver: ' + receive + '</div>',
          '<div>missing: <code>RECEIVED then COMPLETED or BLOCKER from receiver</code></div>',
          '</div>',
          '</article>'
        ].join("");
      }).join("");
      const proofGap = packets.length
        ? '<div class="proof-receipts">This button created local packet files. If the bridge actuator is PAUSED, nothing has reached an Aeye chat yet. Full proof requires send-to-thread, then receiver-side RECEIVED and COMPLETED or BLOCKER receipts.</div>'
        : '';
      return {
        lines,
        html: cards ? '<div class="relay-outcome-grid">' + cards + '</div>' + proofGap : ''
      };
    }

    function summarizeVelocityAction(title, lines, detail, options) {
      const textLines = Array.isArray(lines) ? lines.filter(Boolean).map(String) : [];
      const packets = [];
      if (detail?.brainboot_packets) {
        for (const packet of detail.brainboot_packets || []) packets.push(packet);
      }
      if (detail?.relay_packets) {
        for (const packet of detail.relay_packets || []) packets.push(packet);
      }
      if (detail?.relay_packet) packets.push(detail.relay_packet);

      let created = "No artifact or packet recorded.";
      if (packets.length) {
        const queuedCount = packets.filter((packet) => packet.thread_bridge?.status === "QUEUED_FOR_CODEX_THREAD_SEND").length;
        const fileInboxCount = packets.filter((packet) => packet.thread_bridge?.status === "FILE_INBOX_WAITING_FOR_RECEIVER").length;
        created = packets.length + " packet" + (packets.length === 1 ? "" : "s") + " created"
          + (queuedCount ? "; " + queuedCount + " queued for Aeye thread" : "")
          + (fileInboxCount ? "; " + fileInboxCount + " in LAN file inbox" : "");
      } else if (detail?.artifact_path) {
        created = "Artifact: " + detail.artifact_path;
      } else if (detail?.template?.path) {
        created = "Template refreshed: " + detail.template.path;
      } else if (/Generated 3 editable meals/i.test(title)) {
        created = "3 editable meals rendered on the rail";
      } else if (/held/i.test(title)) {
        created = "No packet fired";
      }

      let proof = "No receiver proof expected.";
      if (packets.length) {
        const completeCount = packets.filter((packet) => String(packet.status || "").includes("COMPLETED")).length;
        const fileInboxCount = packets.filter((packet) => packet.thread_bridge?.status === "FILE_INBOX_WAITING_FOR_RECEIVER").length;
        proof = completeCount
          ? completeCount + " packet" + (completeCount === 1 ? "" : "s") + " already completed"
          : fileInboxCount
            ? fileInboxCount + " LAN inbox packet" + (fileInboxCount === 1 ? "" : "s") + " waiting for receiver proof"
            : "Waiting for bridge send, then RECEIVED, then COMPLETED or BLOCKER";
      } else if (detail?.chaser) {
        proof = (detail.chaser.status || "CHASER") + " | stale " + (detail.chaser.stale_incomplete_count ?? "unknown");
      } else if (options?.blocked) {
        proof = "Blocked: see error";
      }

      const status = options?.blocked ? "BLOCKED" : options?.active ? "ACTIVE" : "RECORDED";
      return {
        status,
        created,
        proof,
        packets,
        lines: textLines,
      };
    }

    function updateVelocityActionConsole(title, lines, detail, options) {
      const summary = summarizeVelocityAction(title, lines, detail, options);
      const state = document.getElementById("mv-action-state");
      const created = document.getElementById("mv-action-created");
      const proof = document.getElementById("mv-action-proof");
      if (state) state.textContent = summary.status + ": " + title;
      if (created) created.textContent = summary.created;
      if (proof) proof.textContent = summary.proof;
      const ledger = document.querySelector('[data-testid="mv-action-ledger"]');
      if (!ledger) return;
      const empty = ledger.querySelector(".mv-ledger-empty");
      if (empty) empty.remove();
      const item = document.createElement("div");
      item.className = "mv-ledger-item " + (options?.blocked ? "blocked" : options?.active ? "active" : "");
      const packetLine = summary.packets.length
        ? '<div>packet: <code>' + clientEscapeHtml(summary.packets[0].packet_id || "UNKNOWN_PACKET") + '</code></div>'
        : "";
      item.innerHTML = [
        '<strong>' + clientEscapeHtml(title) + '</strong>',
        '<div>' + clientEscapeHtml(summary.created) + '</div>',
        '<div>' + clientEscapeHtml(summary.proof) + '</div>',
        packetLine,
        '<div>' + clientEscapeHtml(new Date().toLocaleTimeString()) + '</div>'
      ].join("");
      ledger.insertBefore(item, ledger.firstChild);
      while (ledger.children.length > 8) ledger.removeChild(ledger.lastChild);
    }

    function setVelocityReadback(title, lines, detail, options) {
      const box = document.getElementById("mv-velocity-readback");
      if (!box) return;
      updateVelocityActionConsole(title, lines, detail, options);
      box.innerHTML = "";
      box.className = "relay-command-readback " + (options?.blocked ? "blocked" : options?.active ? "active" : "");
      const heading = document.createElement("strong");
      heading.textContent = title;
      box.appendChild(heading);
      for (const line of lines || []) {
        const div = document.createElement("div");
        div.textContent = line;
        box.appendChild(div);
      }
      if (options?.html) {
        const wrap = document.createElement("div");
        wrap.innerHTML = options.html;
        box.appendChild(wrap);
      }
      if (detail) {
        const details = document.createElement("details");
        details.className = "machine-json";
        const summary = document.createElement("summary");
        summary.textContent = "Machine Evidence / Debug JSON";
        const pre = document.createElement("pre");
        pre.textContent = typeof detail === "string" ? detail : JSON.stringify(detail, null, 2);
        details.appendChild(summary);
        details.appendChild(pre);
        box.appendChild(details);
      }
    }

    function currentMomentSeed() {
      const seed = document.querySelector(".mv-context-seed");
      const item = latestActionableSnapshot && Array.isArray(latestActionableSnapshot.actionable)
        ? latestActionableSnapshot.actionable[0]
        : null;
      return {
        target: item?.target || seed?.getAttribute("data-target") || "Skybro.Betsy",
        decision: item?.helps_decide || seed?.getAttribute("data-decision") || "What should move next from this session?",
        context: item?.advanced || seed?.getAttribute("data-context") || "No returned context is available yet.",
        receipt: item?.receiver_receipt_id || "NO_RECEIPT",
        packet: item?.packet_id || "NO_PACKET",
        evidence: item?.evidence || item?.answer_evidence || "No receiver evidence text found."
      };
    }

    function mealCandidatesFromMoment() {
      const seed = currentMomentSeed();
      return [
        {
          title: "Interpret latest Automatica return",
          target: seed.target || "Skybro.Betsy",
          stream: "MOMENT / INTERPRETATION",
          why: "Turn the latest returned proof into a plain-English state delta.",
          body: [
            "MISSION: Interpret latest Automatica return.",
            "",
            "Context: " + seed.context,
            "Evidence: " + seed.evidence,
            "Source packet: " + seed.packet,
            "Receipt: " + seed.receipt,
            "",
            "Return: ARTIFACT or BLOCKER with what changed, risk/conflict, and one recommended next move."
          ].join("\\n")
        },
        {
          title: "Build next small proof step",
          target: "Swanson.Doss",
          stream: "MOMENT / BUILD",
          why: "Convert the recommendation into one small file-backed improvement without expanding architecture.",
          body: [
            "MISSION: Build the smallest proof step from the current Moment card.",
            "",
            "Decision: " + seed.decision,
            "Context: " + seed.context,
            "",
            "Return: ARTIFACT or BLOCKER with exact path, hash, and remaining proof gap."
          ].join("\\n")
        },
        {
          title: "Ask Petra for contradiction check",
          target: "Petra.Betsy",
          stream: "MOMENT / RISK",
          why: "Catch duplicate work, contradiction, or false velocity before firing more packets.",
          body: [
            "MISSION: Red-team the current Moment-Velocity recommendation.",
            "",
            "Decision under review: " + seed.decision,
            "Context: " + seed.context,
            "Receipt proof: " + seed.receipt,
            "",
            "Return: ARTIFACT or BLOCKER. Name the risk, if any, and the smallest safe next move."
          ].join("\\n")
        }
      ];
    }

    function renderMealCandidates(candidates) {
      const stack = document.getElementById("mv-candidate-stack");
      if (!stack) return;
      stack.innerHTML = "";
      candidates.forEach((candidate, index) => {
        const card = document.createElement("article");
        card.className = "mv-packet-card";
        card.innerHTML = [
          '<div class="mv-card-top"><strong>Meal ' + (index + 1) + ': ' + clientEscapeHtml(candidate.title) + '</strong><span>EDITABLE</span></div>',
          '<div class="mv-packet-meta">',
          '<label>Destination<input data-meal-target="' + index + '" value="' + clientEscapeHtml(candidate.target) + '" /></label>',
          '<label>Stream<input data-meal-stream="' + index + '" value="' + clientEscapeHtml(candidate.stream) + '" /></label>',
          '</div>',
          '<div><span class="label">Why now</span><input data-meal-why="' + index + '" value="' + clientEscapeHtml(candidate.why) + '" /></div>',
          '<textarea data-meal-body="' + index + '">' + clientEscapeHtml(candidate.body) + '</textarea>',
          '<div class="mv-packet-actions">',
          '<button type="button" data-fire-meal="' + index + '">Fire through Automatica</button>',
          '<button type="button" data-ask-current="' + index + '">Ask current Aeye</button>',
          '<button type="button" data-hold-meal="' + index + '">Hold</button>',
          '</div>'
        ].join("");
        stack.appendChild(card);
      });
      document.querySelectorAll("[data-fire-meal]").forEach((button) => {
        button.addEventListener("click", async () => {
          button.classList.add("button-working", "just-clicked");
          button.setAttribute("aria-busy", "true");
          window.setTimeout(() => button.classList.remove("just-clicked"), 160);
          try {
            await fireMealCandidate(button.getAttribute("data-fire-meal"));
          } finally {
            button.classList.remove("button-working");
            button.removeAttribute("aria-busy");
          }
        });
      });
      document.querySelectorAll("[data-ask-current]").forEach((button) => {
        button.addEventListener("click", () => {
          button.classList.add("just-clicked");
          window.setTimeout(() => button.classList.remove("just-clicked"), 160);
          askCurrentAeyeFromMeal(button.getAttribute("data-ask-current"));
        });
      });
      document.querySelectorAll("[data-hold-meal]").forEach((button) => {
        button.addEventListener("click", () => {
          button.classList.add("just-clicked");
          window.setTimeout(() => button.classList.remove("just-clicked"), 160);
          setVelocityReadback("Meal held", ["No packet fired.", "The candidate remains editable on the rail."], null);
        });
      });
    }

    function readMealCandidate(index) {
      return {
        target: document.querySelector('[data-meal-target="' + index + '"]')?.value.trim() || "Skybro.Betsy",
        stream: document.querySelector('[data-meal-stream="' + index + '"]')?.value.trim() || "MOMENT / VELOCITY",
        why: document.querySelector('[data-meal-why="' + index + '"]')?.value.trim() || "No why-now text.",
        body: document.querySelector('[data-meal-body="' + index + '"]')?.value.trim() || "No packet body."
      };
    }

    async function fireMealCandidate(index) {
      const meal = readMealCandidate(index);
      setVelocityReadback("Firing meal through Automatica...", ["target: " + meal.target, "stream: " + meal.stream], null, { active: true });
      const result = await runRelayControlAction("Moment meal fire", "/v1/relay/dispatch", {
        packet_type: "MOMENT_VELOCITY_MEAL",
        target: meal.target,
        title: meal.stream + " - " + meal.why,
        body: meal.body,
        producer: "Moment-Velocity Generator@Doss",
        destination: "Automatica Relay"
      });
      if (result) {
        const outcome = renderButtonOutcome("Moment meal fire", result);
        setVelocityReadback("Meal fired", outcome.lines, result, { active: true, html: outcome.html });
      }
    }

    async function askCurrentAeyeFromMeal(index) {
      const meal = readMealCandidate(index);
      document.getElementById("nerdkle-target-input").value = meal.target;
      document.getElementById("nerdkle-mode-input").value = "ASK_NERDKLE";
      document.getElementById("nerdkle-title-input").value = meal.stream + " review";
      document.getElementById("nerdkle-message-input").value = meal.body;
      setVelocityReadback("Moved meal into Talk To Nerdkle", ["target: " + meal.target, "Review/edit the message, then click WRITE INTENT / CREATE PACKET."], null, { active: true });
      document.querySelector('[data-testid="nerdkle-operator"]')?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function generateThreeMeals() {
      const candidates = mealCandidatesFromMoment();
      renderMealCandidates(candidates);
      setVelocityReadback("Generated 3 editable meals", [
        "Nothing has been fired yet.",
        "Edit a card, then click Fire through Automatica to create a relay packet."
      ], null, { active: true });
    }

    function holdMomentVelocity() {
      setVelocityReadback("Moment held", ["No packet fired.", "This records a human pause in the cockpit only; no receiver receipt is expected."], null);
    }

    function setRelayCommandStatus(title, lines, detail, options) {
      const box = document.getElementById("relay-command-readback");
      if (!box) return;
      box.innerHTML = "";
      box.className = "relay-command-readback " + (options?.blocked ? "blocked" : options?.active ? "active" : "");
      const heading = document.createElement("strong");
      heading.textContent = title;
      box.appendChild(heading);
      for (const line of lines || []) {
        const div = document.createElement("div");
        div.textContent = line;
        box.appendChild(div);
      }
      if (options?.html) {
        const wrap = document.createElement("div");
        wrap.innerHTML = options.html;
        box.appendChild(wrap);
      }
      if (detail) {
        const details = document.createElement("details");
        details.className = "machine-json";
        const summary = document.createElement("summary");
        summary.textContent = "Machine Evidence / Debug JSON";
        const pre = document.createElement("pre");
        pre.textContent = typeof detail === "string" ? detail : JSON.stringify(detail, null, 2);
        details.appendChild(summary);
        details.appendChild(pre);
        box.appendChild(details);
      }
    }

    async function refreshRelayReadback(label) {
      try {
        const chaserResponse = await fetch("/v1/relay/chaser_status", { cache: "no-store" });
        const chaserResult = await chaserResponse.json();
        const actionableResponse = await fetch("/v1/relay/actionable_returns?limit=4", { cache: "no-store" });
        const actionableResult = await actionableResponse.json();
        const originResponse = await fetch("/v1/relay/origin_return?limit=4", { cache: "no-store" });
        const originResult = await originResponse.json();
        const chaser = chaserResult.chaser || {};
        const actionable = actionableResult.actionable_returns || {};
        const origin = originResult.origin_return || {};
        setRelayCommandStatus(label || "Relay readback refreshed", [
          "chaser: " + (chaser.status || "UNKNOWN") + " | stale: " + (chaser.stale_incomplete_count ?? "unknown"),
          "actionable returns: " + (actionable.actionable_count ?? 0) + " | " + (actionable.status || "UNKNOWN"),
          "returned answers: " + (origin.returned_answer_count ?? 0) + " | " + (origin.status || "UNKNOWN")
        ], { chaser, actionable, origin });
        renderActionableReturnBoard(actionable);
        renderOriginReturnBoard(origin);
      } catch (error) {
        setRelayCommandStatus("Relay readback failed", [error.message], null);
      }
    }

    async function runRelayControlAction(label, url, body) {
      setRelayCommandStatus(label + " running...", ["Clicked. Waiting for local command readback."], null, { active: true });
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body || {})
        });
        const result = await response.json();
        if (!response.ok) {
          setRelayCommandStatus(label + " blocked", [result.status || "BLOCKED", result.error || "No error text returned."], result, { blocked: true });
          return result;
        }
        const outcome = renderButtonOutcome(label, result);
        const lines = outcome.lines;
        if (result.decision_log && result.decision_log.sha256) lines.push("decision log: " + result.decision_log.sha256);
        setRelayCommandStatus(label + " returned", lines.length ? lines : ["Readback returned."], result, { active: true, html: outcome.html });
        pollBrainbootStatus();
        pollRelayStatus();
        pollOriginReturn();
        pollActionableReturns();
        pollThreadBridgeStatus();
        return result;
      } catch (error) {
        setRelayCommandStatus(label + " failed", [error.message], null);
        return null;
      }
    }

    async function runVelocityControlAction(label, url, body) {
      setVelocityReadback(label + " running...", ["Clicked. Waiting for local command readback."], null, { active: true });
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body || {})
        });
        const result = await response.json();
        if (!response.ok) {
          setVelocityReadback(label + " blocked", [result.status || "BLOCKED", result.error || "No error text returned."], result, { blocked: true });
          return result;
        }
        const outcome = renderButtonOutcome(label, result);
        const lines = outcome.lines;
        if (result.decision_log && result.decision_log.sha256) lines.push("decision log: " + result.decision_log.sha256);
        if (result.artifact_path) lines.push("artifact: " + result.artifact_path);
        if (result.sha256) lines.push("sha256: " + result.sha256);
        if (result.result && result.result.status) lines.push("result: " + result.result.status);
        if (result.result && Number.isInteger(result.result.canonicalized_count)) lines.push("canonicalized: " + result.result.canonicalized_count);
        if (result.result && Number.isInteger(result.result.quarantined_count)) lines.push("quarantined: " + result.result.quarantined_count);
        if (result.template && result.template.path) lines.push("template: " + result.template.path);
        setVelocityReadback(label + " returned", lines.length ? lines : ["Readback returned."], result, { active: true, html: outcome.html });
        pollBrainbootStatus();
        pollRelayStatus();
        pollOriginReturn();
        pollActionableReturns();
        pollThreadBridgeStatus();
        return result;
      } catch (error) {
        setVelocityReadback(label + " failed", [error.message], null, { blocked: true });
        return null;
      }
    }

    async function statusBrainbootFromVelocity() {
      await runVelocityControlAction("Status Brainboot", "/v1/relay/dispatch_startup", {
        targets: ["Skybro.Betsy", "Petra.Betsy"]
      });
    }

    async function requestProofFromVelocity() {
      const seed = currentMomentSeed();
      await runVelocityControlAction("Proof request", "/v1/relay/dispatch", {
        packet_type: "MOMENT_VELOCITY_PROOF_REQUEST",
        target: seed.target || "Skybro.Betsy",
        title: "Moment-Velocity proof request",
        body: [
          "MISSION: Return proof for the current Moment-Velocity state.",
          "",
          "Decision: " + seed.decision,
          "Context: " + seed.context,
          "Source packet: " + seed.packet,
          "Receipt: " + seed.receipt,
          "",
          "Return: RECEIVED then COMPLETED or BLOCKER with exact evidence."
        ].join("\\n"),
        producer: "Moment-Velocity Generator@Doss",
        destination: "Automatica Relay"
      });
    }

    async function sendRelayTargetFromVelocity(target) {
      const seed = currentMomentSeed();
      const label = "Send to " + target;
      await runVelocityControlAction(label, "/v1/relay/dispatch", {
        packet_type: "FERAL_FLIGHT_DECK_RELAY",
        target,
        title: "Flight Deck relay work for " + target,
        body: [
          "MISSION: Answer the current TinkerDen Relay Flight Deck packet.",
          "",
          "What this helps decide:",
          seed.decision,
          "",
          "Current context:",
          seed.context,
          "",
          "Latest source packet: " + seed.packet,
          "Latest receiver receipt: " + seed.receipt,
          "",
          "Return requirement:",
          "1. Write RECEIVED proof.",
          "2. Complete the requested response or return BLOCKER.",
          "3. Make the answer readable by the origin dash."
        ].join("\\n"),
        producer: "TinkerDen Relay Flight Deck@Doss",
        destination: "Aeye Thread Bridge"
      });
    }

    async function dispatchBrainbootFromVelocity() {
      await runVelocityControlAction("Brainboot dispatch", "/v1/action/brainboot_dispatch", {
        targets: ["Skybro.Betsy", "Petra.Betsy"]
      });
    }

    async function probeAllRoutableFromVelocity() {
      await runVelocityControlAction("Probe all routable", "/v1/relay/dispatch_probe_all", {});
    }

    async function refreshReturnsFromVelocity() {
      setVelocityReadback("Refreshing relay returns...", [
        "Reading bridge queue, receiver returns, actionable answers, Brainboot, and relay packet status."
      ], null, { active: true });
      pollThreadBridgeStatus();
      pollOriginReturn();
      pollActionableReturns();
      pollBrainbootStatus();
      pollRelayStatus();
      await refreshRelayReadback("Relay returns refreshed");
      setVelocityReadback("Relay returns refreshed", [
        "Bridge state, receiver answers, and actionable returns have been refreshed.",
        "If a packet is only QUEUED, the Codex thread bridge still has to send it.",
        "If a packet is SENT, the receiver still owes RECEIVED then COMPLETED or BLOCKER."
      ], null, { active: true });
    }

    async function showCoverageFromVelocity() {
      setVelocityReadback("Reading relay coverage...", [
        "Checking round-trip proven targets, file-inbox waits, topology holds, and local-only targets."
      ], null, { active: true });
      try {
        const response = await fetch("/v1/relay/coverage?limit=50", { cache: "no-store" });
        const result = await response.json();
        const summary = result.summary || {};
        const lines = [
          "round-trip proven: " + (summary.round_trip_proven ?? 0),
          "file-inbox waiting: " + (summary.file_inbox_waiting ?? 0),
          "held: " + (summary.held ?? 0),
          "local only: " + (summary.local_only ?? 0),
          "rule: " + (result.rule || "Receiver-side COMPLETED receipt required.")
        ];
        setVelocityReadback("Relay coverage readback", lines, result, { active: true });
      } catch (error) {
        setVelocityReadback("Relay coverage failed", [error.message], null, { blocked: true });
      }
    }

    async function buildReceiverBootstrapsFromVelocity() {
      await runVelocityControlAction("Receiver bootstrap build", "/v1/relay/build_receiver_bootstraps", {});
    }

    async function writeCoverageReceiptFromVelocity() {
      await runVelocityControlAction("Coverage receipt write", "/v1/relay/write_coverage_receipt", {});
    }

    async function writeMissingReceiverBlockersFromVelocity() {
      await runVelocityControlAction("Missing receiver blocker receipt", "/v1/relay/write_missing_receiver_blockers", {});
      await showCoverageFromVelocity();
    }

    async function dispatchReportPacket() {
      const target = document.getElementById("relay-target-input").value.trim();
      const title = document.getElementById("relay-title-input").value.trim();
      const body = document.getElementById("relay-body-input").value.trim();
      await runWorkbenchAction("Aeye report relay dispatch", "/v1/relay/dispatch", {
        packet_type: "REPORT_DELIVERY",
        target,
        title,
        body,
        producer: "TinkerDen@Doss",
        destination: "Aeye Relay"
      });
      pollRelayStatus();
    }

    async function prepareActionableReturnChoice(button) {
      const choice = button.getAttribute("data-choice") || "REVIEW";
      const target = button.getAttribute("data-target") || "Skybro.Betsy";
      const packetId = button.getAttribute("data-packet-id") || "UNKNOWN_PACKET";
      const advanced = button.getAttribute("data-advanced") || "No advancement summary.";
      const decision = button.getAttribute("data-decision") || "No decision question.";
      const receipt = button.getAttribute("data-receipt") || "NO_RECEIPT";
      document.getElementById("relay-target-input").value = target;
      document.getElementById("relay-title-input").value = choice + " from returned answer";
      document.getElementById("relay-body-input").value = [
        "Operator selected: " + choice,
        "Source returned packet: " + packetId,
        "Receiver receipt: " + receipt,
        "What advanced: " + advanced,
        "Decision this answered: " + decision,
        "",
        "Next action: continue from this returned proof without asking Ben to restate context."
      ].join("\\n");
      await runRelayControlAction("Actionable return decision: " + choice, "/v1/relay/actionable_decision", {
        choice,
        target,
        source_packet_id: packetId,
        receiver_receipt_id: receipt,
        advanced,
        helps_decide: decision
      });
    }

    async function dispatchStartupToSkybroPetra() {
      const result = await runRelayControlAction("Skybro + Petra startup dispatch", "/v1/relay/dispatch_startup", {
        targets: ["Skybro.Betsy", "Petra.Betsy"]
      });
      if (result) {
        setWorkbenchStatus("Startup relay dispatch returned", [
          "status: " + (result.status || "UNKNOWN"),
          "brainboot packets: " + ((result.brainboot_packets || []).length),
          "relay packets: " + ((result.relay_packets || []).length)
        ], result);
      }
    }

    async function sendProofPacket() {
      const target = (document.getElementById("relay-target-input")?.value || "Skybro.Betsy").trim() || "Skybro.Betsy";
      await runRelayControlAction("Proof packet dispatch", "/v1/relay/dispatch", {
        packet_type: "FLIGHT_DECK_PROOF_REQUEST",
        target,
        title: "Flight Deck button proof request",
        body: "This packet was created by clicking SEND PROOF PACKET on the TinkerDen Flight Deck. Receiver must write RECEIVED then COMPLETED or BLOCKER so the Deck proves the button caused actual relay work.",
        producer: "TinkerDen Flight Deck@Doss",
        destination: "Aeye Relay"
      });
    }

    function setBookCourierReadback(title, lines, detail, options) {
      const box = document.getElementById("book-courier-readback");
      if (!box) return;
      box.innerHTML = "";
      box.className = "relay-command-readback " + (options?.blocked ? "blocked" : options?.active ? "active" : "");
      const heading = document.createElement("strong");
      heading.textContent = title;
      box.appendChild(heading);
      for (const line of lines || []) {
        const div = document.createElement("div");
        div.textContent = line;
        box.appendChild(div);
      }
      if (options?.html) {
        const wrap = document.createElement("div");
        wrap.innerHTML = options.html;
        box.appendChild(wrap);
      }
      if (detail) {
        const details = document.createElement("details");
        details.className = "machine-json";
        const summary = document.createElement("summary");
        summary.textContent = "Machine Evidence / Debug JSON";
        const pre = document.createElement("pre");
        pre.textContent = typeof detail === "string" ? detail : JSON.stringify(detail, null, 2);
        details.appendChild(summary);
        details.appendChild(pre);
        box.appendChild(details);
      }
    }

    async function refreshBookChapters() {
      setBookCourierReadback("Refreshing book source truth...", ["Reading chapter files from the source-truth folder."], null, { active: true });
      try {
        const response = await fetch("/v1/book/chapters", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) {
          setBookCourierReadback("Book source blocked", [result.status || "BLOCKED", result.error || "No error text returned."], result, { blocked: true });
          return;
        }
        const select = document.getElementById("book-chapter-select");
        if (select) {
          const current = select.value;
          select.innerHTML = "";
          for (const chapter of result.chapters || []) {
            const option = document.createElement("option");
            option.value = chapter.chapter_id;
            option.textContent = (chapter.chapter_number === null ? "Source" : "Ch " + chapter.chapter_number) + " - " + chapter.title + " (" + chapter.extension + ")";
            select.appendChild(option);
          }
          if (current && Array.from(select.options).some((option) => option.value === current)) select.value = current;
        }
        setBookCourierReadback("Book chapters ready", [
          "chapters indexed: " + (result.chapter_count ?? 0),
          "source root: " + (result.source_root || "UNKNOWN_SOURCE_ROOT"),
          "select one chapter, then send it to Skybro for editing"
        ], result, { active: true });
      } catch (error) {
        setBookCourierReadback("Book chapter refresh failed", [error.message], null, { blocked: true });
      }
    }

    async function refreshBookCourierStatus() {
      setBookCourierReadback("Reading book courier status...", ["Checking next chapter, completed chapters, active packets, and bridge sweep cadence."], null, { active: true });
      try {
        const response = await fetch("/v1/book/courier_status?limit=8", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) {
          setBookCourierReadback("Book courier status blocked", [result.status || "BLOCKED", result.error || "No error text returned."], result, { blocked: true });
          return result;
        }
        const latest = Array.isArray(result.latest_book_packets) ? result.latest_book_packets[0] : null;
        setBookCourierReadback("Book courier status", [
          "chapters indexed: " + (result.chapter_count ?? 0),
          "completed chapters: " + (result.completed_chapter_count ?? 0),
          "active chapter packets: " + (result.active_packet_count ?? 0),
          "next unsent: " + (result.next_unsent_chapter?.title || "NO_UNSENT_CHAPTER"),
          "latest book packet: " + (latest?.packet_id || "NO_BOOK_PACKET"),
          "latest status: " + (latest?.status || "NO_STATUS"),
          "bridge: " + (result.bridge_actuator?.status || "UNKNOWN") + " / " + (result.bridge_actuator?.schedule || "UNKNOWN_SCHEDULE")
        ], result, { active: true });
        return result;
      } catch (error) {
        setBookCourierReadback("Book courier status failed", [error.message], null, { blocked: true });
        return null;
      }
    }

    async function dispatchSelectedBookChapter() {
      const chapterId = document.getElementById("book-chapter-select")?.value || "";
      const target = (document.getElementById("book-target-input")?.value || "Skybro.Betsy").trim() || "Skybro.Betsy";
      const editingMode = document.getElementById("book-editing-mode-input")?.value || "chapter_edit";
      const operatorNote = document.getElementById("book-operator-note-input")?.value.trim() || "";
      if (!chapterId) {
        setBookCourierReadback("Book dispatch blocked", ["Choose a chapter first."], null, { blocked: true });
        return;
      }
      setBookCourierReadback("Sending chapter packet...", [
        "target: " + target,
        "chapter id: " + chapterId,
        "mode: " + editingMode
      ], null, { active: true });
      try {
        const response = await fetch("/v1/book/dispatch_chapter", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ chapter_id: chapterId, target, editing_mode: editingMode, operator_note: operatorNote })
        });
        const result = await response.json();
        if (!response.ok) {
          setBookCourierReadback("Book dispatch blocked", [result.status || "BLOCKED", result.error || "No error text returned."], result, { blocked: true });
          return;
        }
        const outcome = renderButtonOutcome("Book chapter courier", result);
        const packet = result.relay_packet || {};
        setBookCourierReadback("Book chapter packet created", [
          "chapter: " + (result.chapter?.title || "UNKNOWN_CHAPTER"),
          "target: " + (packet.target || target),
          "packet: " + (packet.packet_id || "NO_PACKET_ID"),
          "thread bridge: " + (packet.thread_bridge?.status || "NOT_QUEUED"),
          "receiver URL: " + (packet.receive_url || "NO_RECEIVER_URL"),
          "missing proof: " + (result.missing_proof || "Receiver receipts required.")
        ], result, { active: true, html: outcome.html });
        pollRelayStatus();
        pollThreadBridgeStatus();
      } catch (error) {
        setBookCourierReadback("Book dispatch failed", [error.message], null, { blocked: true });
      }
    }

    async function dispatchNextBookChapter() {
      const target = (document.getElementById("book-target-input")?.value || "Skybro.Betsy").trim() || "Skybro.Betsy";
      const editingMode = document.getElementById("book-editing-mode-input")?.value || "developmental_edit";
      const operatorNote = document.getElementById("book-operator-note-input")?.value.trim() || "Send the next unsent source-truth chapter for editing. Return access gaps, continuity issues, and the recommended next edit.";
      setBookCourierReadback("Sending next unsent chapter...", [
        "target: " + target,
        "mode: " + editingMode,
        "strategy: first_unsent"
      ], null, { active: true });
      try {
        const response = await fetch("/v1/book/dispatch_next_chapter", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ target, editing_mode: editingMode, operator_note: operatorNote, strategy: "first_unsent" })
        });
        const result = await response.json();
        if (!response.ok) {
          setBookCourierReadback("Next chapter dispatch blocked", [result.status || "BLOCKED", result.error || "No error text returned."], result, { blocked: true });
          return;
        }
        const outcome = renderButtonOutcome("Next book chapter courier", result);
        const packet = result.relay_packet || {};
        setBookCourierReadback("Next chapter packet created", [
          "chapter: " + (result.chapter?.title || "UNKNOWN_CHAPTER"),
          "target: " + (packet.target || target),
          "packet: " + (packet.packet_id || "NO_PACKET_ID"),
          "thread bridge: " + (packet.thread_bridge?.status || "NOT_QUEUED"),
          "bridge cadence: " + (packet.thread_bridge?.actuator_status || "UNKNOWN"),
          "missing proof: " + (result.missing_proof || "Receiver receipts required.")
        ], result, { active: true, html: outcome.html });
        pollRelayStatus();
        pollThreadBridgeStatus();
      } catch (error) {
        setBookCourierReadback("Next chapter dispatch failed", [error.message], null, { blocked: true });
      }
    }

    function setNerdkleIntentStatus(title, lines, detail, options) {
      const box = document.getElementById("nerdkle-intent-readback");
      if (!box) return;
      box.innerHTML = "";
      box.className = "relay-command-readback " + (options?.blocked ? "blocked" : options?.active ? "active" : "");
      const heading = document.createElement("strong");
      heading.textContent = title;
      box.appendChild(heading);
      for (const line of lines || []) {
        const div = document.createElement("div");
        div.textContent = line;
        box.appendChild(div);
      }
      if (options?.html) {
        const wrap = document.createElement("div");
        wrap.innerHTML = options.html;
        box.appendChild(wrap);
      }
      if (detail) {
        const details = document.createElement("details");
        details.className = "machine-json";
        const summary = document.createElement("summary");
        summary.textContent = "Machine Evidence / Debug JSON";
        const pre = document.createElement("pre");
        pre.textContent = typeof detail === "string" ? detail : JSON.stringify(detail, null, 2);
        details.appendChild(summary);
        details.appendChild(pre);
        box.appendChild(details);
      }
    }

    async function sendNerdkleIntent() {
      const target = document.getElementById("nerdkle-target-input").value;
      const mode = document.getElementById("nerdkle-mode-input").value;
      const title = document.getElementById("nerdkle-title-input").value.trim();
      const message = document.getElementById("nerdkle-message-input").value.trim();
      if (!message) {
        setNerdkleIntentStatus("Nerdkle intent blocked", ["Write a message first."], null, { blocked: true });
        return;
      }
      setNerdkleIntentStatus("Writing Nerdkle intent...", ["Clicked. Writing durable operator intent."], null, { active: true });
      try {
        const response = await fetch("/v1/nerdkle/operator_intent", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ target, mode, title, message })
        });
        const result = await response.json();
        if (!response.ok) {
          setNerdkleIntentStatus("Nerdkle intent blocked", [result.status || "BLOCKED", result.error || "No error text returned."], result, { blocked: true });
          return;
        }
        const outcome = renderButtonOutcome("Nerdkle operator intent", result);
        const lines = [
          "status: " + (result.status || "UNKNOWN"),
          "intent: " + (result.intent?.intent_id || "NO_INTENT_ID"),
          "intake file: " + (result.intent_file?.path || "NO_FILE"),
          result.relay_packet ? "relay packet: " + result.relay_packet.packet_id : "stored local only; no receiver packet created",
          "missing proof: " + (result.missing_proof || "UNKNOWN")
        ];
        setNerdkleIntentStatus("Nerdkle intent written", lines, result, { active: true, html: outcome.html });
        pollRelayStatus();
      } catch (error) {
        setNerdkleIntentStatus("Nerdkle intent failed", [error.message], null, { blocked: true });
      }
    }

    function setRatchetStatus(message) {
      document.getElementById("ratchet-status").textContent = message;
    }

    function openRatchetReason(decision) {
      pendingRatchetDecision = decision;
      document.getElementById("ratchet-reason-label").textContent = decision + " reason required";
      document.getElementById("ratchet-reason-input").value = "";
      document.getElementById("ratchet-reason-panel").hidden = false;
      document.getElementById("ratchet-reason-input").focus();
      setRatchetStatus(decision + " pending. Reason required before receipt can be written.");
    }

    async function submitRatchetDecision() {
      const decision = pendingRatchetDecision;
      const trimmed = document.getElementById("ratchet-reason-input").value.trim();
      if (!decision) {
        setRatchetStatus("No pending Ratchet decision.");
        return;
      }
      if (trimmed.length < 3) {
        setRatchetStatus(decision + " blocked. Reason is required.");
        return;
      }

      const response = await fetch("/v1/action/ratchet_feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          decision,
          reason: trimmed,
          recommendation_id: "FERAL_MEMBRANE_LOCAL_RECOMMENDATION_001",
          recommendation_title: document.getElementById("ratchet-rec-title").textContent,
          recommendation_text: document.getElementById("ratchet-rec-text").textContent
        })
      });
      const result = await response.json();
      if (!response.ok) {
        setRatchetStatus(decision + " failed: " + (result.error || "unknown error"));
        return;
      }
      setRatchetStatus(decision + " receipt written: " + result.receipt_id);
      document.getElementById("ratchet-reason-panel").hidden = true;
      pendingRatchetDecision = null;
    }

    document.getElementById("proceed-button").addEventListener("click", () => {
      setRatchetStatus("PROCEED noted locally. No Ratchet receipt required.");
    });
    document.getElementById("defer-button").addEventListener("click", () => openRatchetReason("DEFER"));
    document.getElementById("kill-button").addEventListener("click", () => openRatchetReason("KILL"));
    document.getElementById("ratchet-submit-button").addEventListener("click", submitRatchetDecision);

    function setWorkbenchStatus(title, lines, detail) {
      const box = document.getElementById("operator-workbench-status");
      box.innerHTML = "";
      const heading = document.createElement("strong");
      heading.textContent = title;
      box.appendChild(heading);
      for (const line of lines || []) {
        const div = document.createElement("div");
        div.textContent = line;
        box.appendChild(div);
      }
      if (detail) {
        const details = document.createElement("details");
        details.className = "machine-json";
        const summary = document.createElement("summary");
        summary.textContent = "Machine Evidence / Debug JSON";
        const pre = document.createElement("pre");
        pre.textContent = typeof detail === "string" ? detail : JSON.stringify(detail, null, 2);
        details.appendChild(summary);
        details.appendChild(pre);
        box.appendChild(details);
      }
    }

    async function runWorkbenchAction(label, url, body) {
      setWorkbenchStatus(label + " running...", ["Waiting for local readback."], null);
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body || {})
        });
        const result = await response.json();
        if (!response.ok) {
          setWorkbenchStatus(label + " blocked", [result.status || "BLOCKED", result.error || "No error text returned."], result);
          return;
        }
        const lines = [];
        if (result.status) lines.push("status: " + result.status);
        if (result.artifact_path) lines.push("artifact: " + result.artifact_path);
        if (result.sha256) lines.push("sha256: " + result.sha256);
        if (result.result && result.result.status) lines.push("result: " + result.result.status);
        if (result.result && Number.isInteger(result.result.canonicalized_count)) lines.push("canonicalized: " + result.result.canonicalized_count);
        if (result.result && Number.isInteger(result.result.quarantined_count)) lines.push("quarantined: " + result.result.quarantined_count);
        if (Array.isArray(result.brainboot_packets)) {
          lines.push("brainboot packets: " + result.brainboot_packets.length);
          renderBrainbootBoard(result.brainboot_packets);
        }
        if (result.relay_packet) {
          lines.push("relay packet: " + result.relay_packet.packet_id);
          pollRelayStatus();
        }
        setWorkbenchStatus(label + " returned", lines.length ? lines : ["Readback returned."], result);
        pollSpeakerStreamLog();
        pollReleaseValve();
        pollBrainbootStatus();
      } catch (error) {
        setWorkbenchStatus(label + " failed", [error.message], null);
      }
    }

    function bindClick(id, handler) {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener("click", async (event) => {
          element.classList.add("button-working", "just-clicked");
          element.setAttribute("aria-busy", "true");
          window.setTimeout(() => element.classList.remove("just-clicked"), 160);
          try {
            await handler(event);
          } finally {
            element.classList.remove("button-working");
            element.removeAttribute("aria-busy");
          }
        });
      }
    }

    bindClick("run-chaser-button", () => {
      runRelayControlAction("Relay chaser", "/v1/relay/run_chaser").then(() => refreshRelayReadback("Relay chaser readback refreshed"));
    });
    bindClick("refresh-relay-button", () => refreshRelayReadback("Relay state refreshed"));
    bindClick("top-brainboot-button", () => {
      runRelayControlAction("Brainboot dispatch", "/v1/action/brainboot_dispatch", {
        targets: ["Skybro.Betsy", "Petra.Betsy"]
      });
    });
    bindClick("top-startup-button", dispatchStartupToSkybroPetra);
    bindClick("send-proof-packet-button", sendProofPacket);
    bindClick("nerdkle-send-button", sendNerdkleIntent);
    bindClick("mv-generate-meals-button", generateThreeMeals);
    bindClick("mv-send-skybro-button", () => sendRelayTargetFromVelocity("Skybro.Betsy"));
    bindClick("mv-send-petra-button", () => sendRelayTargetFromVelocity("Petra.Betsy"));
    bindClick("mv-dispatch-brainboot-button", dispatchBrainbootFromVelocity);
    bindClick("mv-probe-all-button", probeAllRoutableFromVelocity);
    bindClick("mv-refresh-returns-button", refreshReturnsFromVelocity);
    bindClick("mv-show-coverage-button", showCoverageFromVelocity);
    bindClick("mv-build-receiver-bootstraps-button", buildReceiverBootstrapsFromVelocity);
    bindClick("mv-write-coverage-receipt-button", writeCoverageReceiptFromVelocity);
    bindClick("mv-write-missing-receiver-blockers-button", writeMissingReceiverBlockersFromVelocity);
    bindClick("mv-status-brainboot-button", statusBrainbootFromVelocity);
    bindClick("mv-request-proof-button", requestProofFromVelocity);
    bindClick("mv-hold-button", holdMomentVelocity);
    bindClick("mv-run-chaser-button", () => {
      runVelocityControlAction("Run chaser", "/v1/relay/run_chaser").then(() => refreshRelayReadback("Relay chaser readback refreshed"));
    });
    bindClick("mv-ingest-receipts-button", () => runVelocityControlAction("Receipt ingest", "/v1/action/ingest_raw_inbox"));
    bindClick("mv-refresh-repo-button", () => runVelocityControlAction("Repo snapshot refresh", "/v1/action/refresh_repo_state"));
    bindClick("book-refresh-button", refreshBookChapters);
    bindClick("book-dispatch-button", dispatchSelectedBookChapter);
    bindClick("book-next-button", dispatchNextBookChapter);
    bindClick("book-status-button", refreshBookCourierStatus);

    document.getElementById("ingest-inbox-button").addEventListener("click", () => {
      runWorkbenchAction("Raw receipt ingest", "/v1/action/ingest_raw_inbox");
    });
    document.getElementById("refresh-repo-button").addEventListener("click", () => {
      runWorkbenchAction("Repo snapshot refresh", "/v1/action/refresh_repo_state");
    });
    document.getElementById("render-bootpack-button").addEventListener("click", () => {
      runWorkbenchAction("Session Nerdkle Brainboot Dispatch", "/v1/action/brainboot_dispatch", {
        targets: ["Skybro.Betsy", "Petra.Betsy"]
      });
    });
    document.getElementById("brainboot-primary-button").addEventListener("click", () => {
      runWorkbenchAction("Session Nerdkle Brainboot Dispatch", "/v1/action/brainboot_dispatch", {
        targets: ["Skybro.Betsy", "Petra.Betsy"]
      });
    });
    document.getElementById("relay-dispatch-button").addEventListener("click", dispatchReportPacket);
    document.getElementById("dispatch-startup-button").addEventListener("click", dispatchStartupToSkybroPetra);
    bindActionableReturnButtons();

    function classifyStreamEvent(event) {
      const status = String(event.status || "").toUpperCase();
      const name = String(event.event || "").toUpperCase();
      if (status.includes("QUARANTINE") || name.includes("QUARANTINE")) return "quarantined";
      if (status.includes("INVALID") || name.includes("INVALID")) return "invalid";
      return "";
    }

    function renderReceiptEvent(event, prepend) {
      const stream = document.getElementById("receipt-stream");
      const empty = stream.querySelector(".receipt-card .receipt-id");
      if (empty && empty.textContent === "No stream events loaded yet.") {
        stream.innerHTML = "";
      }

      const card = document.createElement("div");
      card.className = "receipt-card " + classifyStreamEvent(event);
      const receiptId = event.receipt_id || "UNKNOWN";
      const packetId = event.packet_id || "UNKNOWN";
      const parsed = event.parsed || {};
      card.innerHTML = [
        '<div class="receipt-id">' + receiptId + '</div>',
        '<div class="receipt-meta">',
        '<div>Event: <code>' + (event.event || "UNKNOWN") + '</code> | Status: <code>' + (event.status || "UNKNOWN") + '</code></div>',
        '<div>Packet: <code>' + packetId + '</code></div>',
        '<div>Path: <code>' + (parsed.canonical_path || parsed.quarantine_path || parsed.source_path || "not provided") + '</code></div>',
        '<div>Logged: <code>' + (event.logged_at || "unknown") + '</code></div>',
        '</div>'
      ].join("");

      if (prepend && stream.firstChild) {
        stream.insertBefore(card, stream.firstChild);
      } else {
        stream.appendChild(card);
      }

      while (stream.children.length > 8) {
        stream.removeChild(stream.lastChild);
      }
    }

    async function pollSpeakerStreamLog() {
      const status = document.getElementById("stream-log-status");
      try {
        const response = await fetch("/v1/system/stream_log?limit=12", { cache: "no-store" });
        const result = await response.json();
        status.textContent = result.status + " | " + (result.events || []).length + " tail events | " + (result.modified_at || result.generated_at);
        for (const event of result.events || []) {
          const key = [event.line_index, event.receipt_id, event.status, event.logged_at].join("|");
          if (seenStreamEvents.has(key)) continue;
          seenStreamEvents.add(key);
          renderReceiptEvent(event, true);
        }
      } catch (error) {
        status.textContent = "STREAM ERROR | " + error.message;
      }
    }

    async function pollReleaseValve() {
      const pill = document.getElementById("release-valve-pill");
      const summary = document.getElementById("release-valve-summary");
      const list = document.getElementById("release-valve-blockers");
      try {
        const response = await fetch("/v1/system/release_valve", { cache: "no-store" });
        const envelope = await response.json();
        const result = envelope.result || {};
        const blockers = result.blockers || [];
        pill.textContent = result.status || envelope.status || "UNKNOWN";
        pill.className = "pill " + (result.status === "READY" ? "ok" : "warn");
        summary.textContent = "origin: " + (result.origin_configured ? "configured" : "missing") + " | branch: " + (result.current_branch || "unknown") + " | pending files: " + (result.pending_worktree_item_count ?? "unknown");
        list.innerHTML = "";
        const items = blockers.length ? blockers : (result.next_required_actions || ["No blockers reported."]);
        for (const item of items) {
          const li = document.createElement("li");
          li.textContent = item;
          list.appendChild(li);
        }
      } catch (error) {
        pill.textContent = "ERROR";
        pill.className = "pill bad";
        summary.textContent = error.message;
        list.innerHTML = "<li>Release valve readback failed.</li>";
      }
    }

    pollSpeakerStreamLog();
    pollReleaseValve();
    pollBrainbootStatus();
    pollRelayStatus();
    pollOriginReturn();
    pollActionableReturns();
    pollThreadBridgeStatus();
    refreshBookChapters();
    refreshBookCourierStatus();
    setInterval(pollSpeakerStreamLog, 3000);
    setInterval(pollReleaseValve, 5000);
    setInterval(pollBrainbootStatus, 4000);
    setInterval(pollRelayStatus, 4000);
    setInterval(pollOriginReturn, 4000);
    setInterval(pollActionableReturns, 4000);
    setInterval(pollThreadBridgeStatus, 4000);
  </script>
</body>
</html>`);
});

fastify.get("/v1/system/stream_log", async (request, reply) => {
  const result = await readSpeakerIngestTail(request.query?.limit);
  return reply
    .header("cache-control", "no-store")
    .send(result);
});

registerFeralContractRoutes(fastify);

fastify.get("/v1/system/release_valve", async (_request, reply) => {
  try {
    const stdout = execFileSync(process.execPath, [SPEAKERCTL_PATH, "verify-release-readiness", "--no-log"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    });
    return reply
      .header("cache-control", "no-store")
      .send({ status: "RELEASE_VALVE_READY", result: JSON.parse(stdout) });
  } catch (error) {
    const stdout = error.stdout ? String(error.stdout) : "";
    let result = null;
    try {
      result = stdout ? JSON.parse(stdout) : null;
    } catch {
      result = null;
    }
    return reply
      .header("cache-control", "no-store")
      .code(200)
      .send({
        status: result ? "RELEASE_VALVE_BLOCKED" : "RELEASE_VALVE_READBACK_FAILED",
        result,
        error: result ? null : error.message,
      });
  }
});

fastify.post("/v1/action/ingest_raw_inbox", async (_request, reply) => {
  const run = runSpeakerctlJson(["ingest-inbox", SPEAKER_RAW_INBOX]);
  const result = run.result || {
    status: "SPEAKERCTL_OUTPUT_UNPARSEABLE",
    stdout: run.stdout,
  };
  return reply
    .code(run.ok ? 200 : 409)
    .header("cache-control", "no-store")
    .send({
      status: run.ok ? "RAW_INBOX_INGEST_RETURNED" : "RAW_INBOX_INGEST_BLOCKED",
      raw_inbox: SPEAKER_RAW_INBOX,
      result,
      error: run.ok ? null : run.error,
    });
});

fastify.post("/v1/action/refresh_repo_state", async (_request, reply) => {
  try {
    const result = runGitSnapshot();
    return reply
      .header("cache-control", "no-store")
      .send(result);
  } catch (error) {
    return reply
      .code(error.statusCode || 500)
      .header("cache-control", "no-store")
      .send({
        status: "REPO_STATE_REFRESH_BLOCKED",
        error: error.message,
        template: fileReadback(CURRENT_REPO_STATE_PATH),
      });
  }
});

fastify.post("/v1/action/render_bootpack", async (request, reply) => {
  const target = String(request.body?.target || "Skybro.Betsy").trim();
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(target)) {
    return reply.code(400).send({
      status: "BOOTPACK_RENDER_BLOCKED",
      error: "target must be Aeye.Machine",
    });
  }

  const run = runSpeakerctlJson(["render-bootpack", target]);
  const result = run.result || {
    status: "SPEAKERCTL_OUTPUT_UNPARSEABLE",
    stdout: run.stdout,
  };
  const artifactPath = result.output_path || (target === "Skybro.Betsy" ? SKYBRO_BOOTPACK_PATH : null);
  return reply
    .code(run.ok ? 200 : 409)
    .header("cache-control", "no-store")
    .send({
      status: run.ok ? "BOOTPACK_RENDER_RETURNED" : "BOOTPACK_RENDER_BLOCKED",
      target,
      artifact_path: artifactPath,
      artifact: artifactPath ? fileReadback(artifactPath) : null,
      result,
      error: run.ok ? null : run.error,
    });
});

fastify.post("/v1/action/render_brainboot", async (request, reply) => {
  const requestedTargets = Array.isArray(request.body?.targets) ? request.body.targets : ["Skybro.Betsy", "Petra.Betsy"];
  const targets = requestedTargets
    .map((target) => String(target || "").trim())
    .filter(Boolean);
  if (targets.length === 0 || targets.length > 5) {
    return reply.code(400).send({
      status: "BRAINBOOT_RENDER_BLOCKED",
      error: "targets must contain 1-5 Aeye.Machine values",
    });
  }

  const results = [];
  for (const target of targets) {
    if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(target)) {
      results.push({
        target,
        status: "BOOTPACK_RENDER_BLOCKED",
        error: "target must be Aeye.Machine",
      });
      continue;
    }
    const run = runSpeakerctlJson(["render-bootpack", target]);
    const result = run.result || {
      status: "SPEAKERCTL_OUTPUT_UNPARSEABLE",
      stdout: run.stdout,
    };
    const artifactPath = result.output_path
      || (target === "Skybro.Betsy" ? SKYBRO_BOOTPACK_PATH : null)
      || (target === "Petra.Betsy" ? PETRA_BOOTPACK_PATH : null);
    results.push({
      target,
      status: run.ok ? "BOOTPACK_RENDERED" : "BOOTPACK_RENDER_BLOCKED",
      artifact_path: artifactPath,
      artifact: artifactPath ? fileReadback(artifactPath) : null,
      result,
      error: run.ok ? null : run.error,
    });
  }

  const blocked = results.filter((result) => result.status !== "BOOTPACK_RENDERED");
  return reply
    .code(blocked.length ? 409 : 200)
    .header("cache-control", "no-store")
    .send({
      status: blocked.length ? "BRAINBOOT_RENDER_PARTIAL" : "BRAINBOOT_RENDERED",
      targets,
      results,
      blocked,
      rule: "Session Nerdkle Brainboot renders file-backed bootpacks from Speaker source-truth readback. It does not promote canonical state.",
    });
});

fastify.post("/v1/action/brainboot_dispatch", async (request, reply) => {
  const requestedTargets = Array.isArray(request.body?.targets) ? request.body.targets : ["Skybro.Betsy", "Petra.Betsy"];
  const targets = requestedTargets
    .map((target) => String(target || "").trim())
    .filter(Boolean);
  if (targets.length === 0 || targets.length > 5) {
    return reply.code(400).send({
      status: "BRAINBOOT_DISPATCH_BLOCKED",
      error: "targets must contain 1-5 Aeye.Machine values",
    });
  }

  const results = [];
  const packets = [];
  for (const target of targets) {
    if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(target)) {
      results.push({
        target,
        status: "BOOTPACK_RENDER_BLOCKED",
        error: "target must be Aeye.Machine",
      });
      continue;
    }
    const run = runSpeakerctlJson(["render-bootpack", target]);
    const result = run.result || {
      status: "SPEAKERCTL_OUTPUT_UNPARSEABLE",
      stdout: run.stdout,
    };
    const artifactPath = bootpackPathForTarget(target, result);
    const renderResult = {
      target,
      status: run.ok ? "BOOTPACK_RENDERED" : "BOOTPACK_RENDER_BLOCKED",
      artifact_path: artifactPath,
      artifact: artifactPath ? fileReadback(artifactPath) : null,
      result,
      error: run.ok ? null : run.error,
    };
    results.push(renderResult);
    if (run.ok) {
      packets.push(createBrainbootPacket(request, target, renderResult));
    }
  }

  const blocked = results.filter((result) => result.status !== "BOOTPACK_RENDERED");
  return reply
    .code(blocked.length ? 409 : 200)
    .header("cache-control", "no-store")
    .send({
      status: blocked.length ? "BRAINBOOT_DISPATCH_PARTIAL" : "BRAINBOOT_DISPATCHED",
      targets,
      render_results: results,
      brainboot_packets: packets,
      blocked,
      rule: "Dispatch creates receiver-visible packets. It is not complete until receiver receipts return.",
    });
});

fastify.get("/v1/book/chapters", async (_request, reply) => {
  try {
    const chapters = listBookChapters();
    return reply.header("cache-control", "no-store").send({
      status: "BOOK_CHAPTERS_READY",
      source_root: BOOK_SOURCE_TRUTH_ROOT,
      source_repo_url: BOOK_SOURCE_TRUTH_REPO_URL,
      chapter_count: chapters.length,
      chapters,
      rule: "These are source-truth chapter candidates. Selecting one creates a relay packet; it is not delivery until a receiver returns receipts.",
    });
  } catch (error) {
    return reply.code(error.statusCode || 500).header("cache-control", "no-store").send({
      status: "BOOK_CHAPTERS_BLOCKED",
      source_root: BOOK_SOURCE_TRUTH_ROOT,
      error: error.message,
    });
  }
});

fastify.get("/v1/book/courier_status", async (request, reply) => {
  try {
    const limit = Math.min(Math.max(Number(request.query?.limit) || 30, 1), 100);
    return reply.header("cache-control", "no-store").send(bookCourierStatus(limit));
  } catch (error) {
    return reply.code(error.statusCode || 500).header("cache-control", "no-store").send({
      status: "BOOK_COURIER_STATUS_BLOCKED",
      source_root: BOOK_SOURCE_TRUTH_ROOT,
      error: error.message,
    });
  }
});

fastify.post("/v1/book/dispatch_chapter", async (request, reply) => {
  try {
    const result = dispatchBookChapterPacket(request, request.body || {});
    return reply.code(201).header("cache-control", "no-store").send(result);
  } catch (error) {
    return reply.code(error.statusCode || 500).header("cache-control", "no-store").send({
      status: "BOOK_CHAPTER_DISPATCH_BLOCKED",
      source_root: BOOK_SOURCE_TRUTH_ROOT,
      error: error.message,
    });
  }
});

fastify.post("/v1/book/dispatch_next_chapter", async (request, reply) => {
  try {
    const result = dispatchNextBookChapterPacket(request, request.body || {});
    return reply.code(201).header("cache-control", "no-store").send(result);
  } catch (error) {
    return reply.code(error.statusCode || 500).header("cache-control", "no-store").send({
      status: "NEXT_BOOK_CHAPTER_DISPATCH_BLOCKED",
      source_root: BOOK_SOURCE_TRUTH_ROOT,
      error: error.message,
    });
  }
});

fastify.get("/v1/brainboot/status", async (request, reply) => {
  const limit = Math.min(Math.max(Number(request.query?.limit) || 20, 1), 100);
  return reply.header("cache-control", "no-store").send({
    status: "BRAINBOOT_STATUS_READBACK",
    root: BRAINBOOT_ROOT,
    packets: latestBrainbootPackets(limit),
    ledger_tail: readJsonl(BRAINBOOT_LEDGER_PATH, limit),
  });
});

fastify.post("/v1/brainboot/ack", async (request, reply) => {
  try {
    const result = writeBrainbootAck(request.body || {});
    return reply.code(201).header("cache-control", "no-store").send(result);
  } catch (error) {
    return reply.code(error.statusCode || 500).header("cache-control", "no-store").send({
      status: "BRAINBOOT_RECEIVER_RECEIPT_BLOCKED",
      error: error.message,
    });
  }
});

fastify.get("/brainboot/receive/:packetId", async (request, reply) => {
  try {
    const token = String(request.query?.token || "");
    const { packet } = loadBrainbootPacket(request.params.packetId);
    const safePacket = JSON.stringify(packet, null, 2);
    return reply.type("text/html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Brainboot Receiver</title>
  <style>
    :root { color-scheme: dark; font-family: Arial, sans-serif; background: #101418; color: #edf2f7; }
    body { margin: 0; padding: 28px; }
    main { max-width: 860px; margin: 0 auto; }
    .card { border: 1px solid #42607a; background: #121d26; border-radius: 8px; padding: 18px; }
    button { border: 1px solid #6caee8; border-radius: 6px; color: #edf2f7; background: #24435e; padding: 10px 14px; font-weight: 700; cursor: pointer; margin-right: 8px; margin-top: 10px; }
    button.blocker { border-color: #ff6b7f; background: #351b22; }
    textarea { width: 100%; min-height: 80px; border: 1px solid #405468; border-radius: 6px; background: #0d1319; color: #edf2f7; padding: 10px; margin-top: 10px; }
    pre { white-space: pre-wrap; background: #0d1319; border: 1px solid #2e3d4c; border-radius: 6px; padding: 12px; overflow-wrap: anywhere; }
    .status { margin-top: 12px; color: #aab6c3; }
  </style>
</head>
<body>
  <main class="card">
    <h1>Brainboot Receiver</h1>
    <p>This page writes the receiver-side receipt. Sent is not proof until this page returns RECEIVED and then COMPLETED or BLOCKER.</p>
    <pre id="packet">${escapeHtml(safePacket)}</pre>
    <textarea id="evidence">I read this Brainboot packet and loaded the bootpack into session context.</textarea>
    <div>
      <button id="received">WRITE RECEIVED</button>
      <button id="completed">WRITE COMPLETED</button>
      <button id="blocker" class="blocker">WRITE BLOCKER</button>
    </div>
    <div id="status" class="status">Waiting for receiver action.</div>
  </main>
  <script>
    const packetId = ${JSON.stringify(packet.packet_id)};
    const token = ${JSON.stringify(token)};
    async function ack(status) {
      const evidence = document.getElementById("evidence").value.trim();
      const response = await fetch("/v1/brainboot/ack", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ packet_id: packetId, ack_token: token, status, evidence })
      });
      const result = await response.json();
      document.getElementById("status").textContent = response.ok
        ? status + " receipt written: " + result.receipt.receipt_id
        : status + " blocked: " + (result.error || "unknown error");
    }
    document.getElementById("received").addEventListener("click", () => ack("RECEIVED"));
    document.getElementById("completed").addEventListener("click", () => ack("COMPLETED"));
    document.getElementById("blocker").addEventListener("click", () => ack("BLOCKER"));
  </script>
</body>
</html>`);
  } catch (error) {
    return reply.code(error.statusCode || 500).send({
      status: "BRAINBOOT_RECEIVER_PAGE_BLOCKED",
      error: error.message,
    });
  }
});

fastify.post("/v1/relay/dispatch", async (request, reply) => {
  try {
    const packet = createRelayPacket(request, request.body || {});
    return reply.code(201).header("cache-control", "no-store").send({
      status: "AEYE_RELAY_PACKET_DISPATCHED",
      relay_packet: packet,
      rule: "Dispatch is not delivery. The packet remains incomplete until receiver receipts return.",
    });
  } catch (error) {
    return reply.code(error.statusCode || 500).header("cache-control", "no-store").send({
      status: "AEYE_RELAY_DISPATCH_BLOCKED",
      error: error.message,
    });
  }
});

fastify.post("/v1/relay/dispatch_probe_all", async (request, reply) => {
  const requestedTargets = Array.isArray(request.body?.targets)
    ? request.body.targets.map((target) => String(target || "").trim()).filter(Boolean)
    : [];
  const knownTargets = routableRelayTargets();
  const allowed = new Set(knownTargets.map((target) => target.target));
  const targets = requestedTargets.length
    ? requestedTargets.filter((target) => allowed.has(target))
    : knownTargets.map((target) => target.target);
  const packets = [];
  const blocked = [];
  const createdAt = new Date().toISOString();
  for (const target of targets) {
    const detail = knownTargets.find((item) => item.target === target);
    if (!detail) {
      blocked.push({
        target,
        status: "TARGET_NOT_ROUTABLE",
        reason: "Target is not mapped to a Codex thread or LAN file inbox.",
      });
      continue;
    }
    try {
      packets.push(createRelayPacket(request, {
        packet_type: "RELAY_PROBE",
        target,
        title: "Relay probe for " + target,
        body: [
          "MISSION: Prove this target can receive a relay packet without Ben as courier.",
          "",
          "Target route mode: " + detail.relay_mode,
          "Target route status: " + detail.route_status,
          "Created at: " + createdAt,
          "",
          "Return requirement:",
          "1. Write RECEIVED.",
          "2. Write COMPLETED with what you can now do from this packet, or BLOCKER with exact missing path/access/thread.",
          "3. Do not call SENT success."
        ].join("\n"),
        producer: "TinkerDen Relay Flight Deck@Doss",
        destination: "Aeye Relay Target Probe",
      }));
    } catch (error) {
      blocked.push({
        target,
        status: "TARGET_PROBE_DISPATCH_BLOCKED",
        reason: error.message,
      });
    }
  }
  return reply
    .code(blocked.length ? 207 : 201)
    .header("cache-control", "no-store")
    .send({
      status: blocked.length ? "RELAY_PROBE_PARTIAL" : "RELAY_PROBE_DISPATCHED",
      created_at: createdAt,
      requested_targets: requestedTargets,
      targets,
      packets,
      blocked,
      rule: "Probe dispatch proves only packet placement. Success still requires receiver-side RECEIVED then COMPLETED or BLOCKER.",
    });
});

fastify.get("/v1/relay/status", async (request, reply) => {
  const limit = Math.min(Math.max(Number(request.query?.limit) || 20, 1), 100);
  return reply.header("cache-control", "no-store").send({
    status: "AEYE_RELAY_STATUS_READBACK",
    root: AEYE_RELAY_ROOT,
    packets: latestRelayPackets(limit),
    ledger_tail: readJsonl(AEYE_RELAY_LEDGER_PATH, limit),
  });
});

fastify.get("/v1/relay/thread_bridge/status", async (request, reply) => {
  const limit = Math.min(Math.max(Number(request.query?.limit) || 30, 1), 100);
  return reply.header("cache-control", "no-store").send(threadBridgeStatus(limit));
});

fastify.get("/v1/relay/target_matrix", async (request, reply) => {
  const limit = Math.min(Math.max(Number(request.query?.limit) || 20, 1), 100);
  const bridge = threadBridgeStatus(limit);
  const targetRows = bridge.known_target_threads.map((target) => {
    const targetQueued = bridge.queued.filter((item) => item.target === target.target);
    const targetSent = bridge.sent.filter((item) => item.target === target.target);
    const targetFileInbox = bridge.file_inbox.filter((item) => item.target === target.target);
    const targetBlocked = bridge.blocked.filter((item) => item.target === target.target);
    const latest = targetQueued[0] || targetFileInbox[0] || targetSent[0] || targetBlocked[0] || null;
    return {
      ...target,
      latest_packet_id: latest?.packet_id || null,
      latest_route_status: latest?.status || "NO_PACKET_PLACED_YET",
      queued_count: targetQueued.length,
      sent_to_thread_count: targetSent.length,
      file_inbox_count: targetFileInbox.length,
      blocked_count: targetBlocked.length,
    };
  });
  return reply.header("cache-control", "no-store").send({
    status: "AEYE_RELAY_TARGET_MATRIX",
    generated_at: new Date().toISOString(),
    actuator: bridge.actuator,
    targets: targetRows,
    rule: "A target is complete only after receiver-side RECEIVED and COMPLETED or BLOCKER proof. Thread-send and file-inbox placement are routing states, not completion.",
  });
});

fastify.get("/v1/relay/coverage", async (request, reply) => {
  const limit = Math.min(Math.max(Number(request.query?.limit) || 20, 1), 100);
  return reply.header("cache-control", "no-store").send(relayCoverageStatus(limit));
});

fastify.get("/v1/thinkit/relay_merge_contract", async (request, reply) => {
  const limit = Math.min(Math.max(Number(request.query?.limit) || 20, 1), 100);
  return reply.header("cache-control", "no-store").send(buildThinkItRelayMergeContract(limit));
});

fastify.post("/v1/thinkit/write_relay_merge_contract", async (_request, reply) => {
  return reply.header("cache-control", "no-store").send(writeThinkItRelayMergeContract());
});

fastify.get("/v1/relay/missing_receivers", async (request, reply) => {
  const limit = Math.min(Math.max(Number(request.query?.limit) || 20, 1), 100);
  const { coverage, targets } = receiverBootstrapTargets(limit);
  return reply.header("cache-control", "no-store").send({
    status: "AEYE_RELAY_MISSING_RECEIVERS",
    generated_at: new Date().toISOString(),
    missing_receiver_count: targets.length,
    targets,
    coverage_summary: coverage.summary,
    rule: "These targets have LAN file-inbox packets but no mapped receiver thread and no receiver-side completion proof.",
  });
});

fastify.get("/relay/receiver_bootstrap", async (request, reply) => {
  return reply
    .type("text/html; charset=utf-8")
    .header("cache-control", "no-store")
    .send(renderReceiverBootstrapConsole());
});

fastify.post("/v1/relay/build_receiver_bootstraps", async (request, reply) => {
  return reply.header("cache-control", "no-store").send(writeReceiverBootstraps());
});

fastify.post("/v1/relay/write_coverage_receipt", async (request, reply) => {
  return reply.header("cache-control", "no-store").send(writeRelayCoverageReceipt());
});

fastify.post("/v1/relay/write_missing_receiver_blockers", async (request, reply) => {
  return reply.header("cache-control", "no-store").send(writeMissingReceiverBlockerReceipt());
});

fastify.post("/v1/relay/register_receiver_thread", async (request, reply) => {
  try {
    return reply.header("cache-control", "no-store").send(registerReceiverThread(request.body || {}));
  } catch (error) {
    return reply
      .code(error.statusCode || 500)
      .header("cache-control", "no-store")
      .send({
        status: "AEYE_RECEIVER_THREAD_BINDING_BLOCKED",
        error: error.message,
        details: error.details || null,
      });
  }
});

fastify.post("/v1/relay/thread_bridge/mark_sent", async (request, reply) => {
  const queueId = String(request.body?.queue_id || "").trim();
  const sentBy = String(request.body?.sent_by || "Swanson Codex thread bridge").trim();
  if (!queueId || !/^[A-Za-z0-9_.-]+$/.test(queueId)) {
    return reply.code(400).header("cache-control", "no-store").send({
      status: "THREAD_BRIDGE_MARK_SENT_BLOCKED",
      error: "queue_id is required",
    });
  }
  const queuePath = path.join(AEYE_THREAD_BRIDGE_QUEUE_DIR, `${queueId}.json`);
  if (!fs.existsSync(queuePath)) {
    return reply.code(404).header("cache-control", "no-store").send({
      status: "THREAD_BRIDGE_MARK_SENT_BLOCKED",
      error: `queue item not found: ${queueId}`,
    });
  }
  const record = readJson(queuePath, {});
  const sentAt = new Date().toISOString();
  const sentRecord = {
    ...record,
    status: "SENT_TO_CODEX_THREAD",
    sent_at: sentAt,
    sent_by: sentBy,
    send_proof: String(request.body?.send_proof || "").trim() || "send_message_to_thread returned without tool error",
  };
  ensureDir(AEYE_THREAD_BRIDGE_SENT_DIR);
  const sentPath = path.join(AEYE_THREAD_BRIDGE_SENT_DIR, `${queueId}.json`);
  fs.writeFileSync(sentPath, `${JSON.stringify(sentRecord, null, 2)}\n`, "utf8");
  fs.unlinkSync(queuePath);
  if (sentRecord.source_packet_path && fs.existsSync(sentRecord.source_packet_path)) {
    const sourcePacket = readJson(sentRecord.source_packet_path, {});
    sourcePacket.thread_bridge = {
      ...(sourcePacket.thread_bridge || {}),
      status: "SENT_TO_CODEX_THREAD",
      queue_id: queueId,
      sent_at: sentAt,
      sent_by: sentBy,
      send_proof: sentRecord.send_proof,
      sent_path: sentPath,
      thread_id: sentRecord.thread_id,
    };
    fs.writeFileSync(sentRecord.source_packet_path, `${JSON.stringify(sourcePacket, null, 2)}\n`, "utf8");
  }
  appendJsonl(AEYE_THREAD_BRIDGE_LEDGER_PATH, {
    event: "THREAD_BRIDGE_SENT_TO_CODEX_THREAD",
    queue_id: queueId,
    packet_id: sentRecord.packet_id,
    target: sentRecord.target,
    thread_id: sentRecord.thread_id,
    channel: sentRecord.channel,
    sent_path: sentPath,
    sent_at: sentAt,
  });
  return reply.header("cache-control", "no-store").send({
    status: "THREAD_BRIDGE_SENT_MARKED",
    sent: sentRecord,
    sent_file: fileReadback(sentPath),
  });
});

fastify.get("/v1/relay/e2e_proof", async (_request, reply) => {
  return reply.header("cache-control", "no-store").send({
    status: "AEYE_RELAY_E2E_PROOF_READBACK",
    proof_path: AEYE_RELAY_E2E_PROOF_PATH,
    proof: readRelayE2EProof(),
  });
});

fastify.get("/v1/relay/chaser_status", async (_request, reply) => {
  return reply.header("cache-control", "no-store").send({
    status: "AEYE_RELAY_CHASER_STATUS_READBACK",
    chaser_status_path: AEYE_RELAY_CHASER_STATUS_PATH,
    chaser: readRelayChaserStatus(),
  });
});

fastify.get("/v1/relay/origin_return", async (request, reply) => {
  const limit = Math.min(Math.max(Number(request.query?.limit) || 12, 1), 50);
  const originReturn = buildOriginReturnSnapshot(limit);
  return reply.header("cache-control", "no-store").send({
    status: "ORIGIN_DASH_RETURN_READBACK",
    origin_return_path: ORIGIN_DASH_LATEST_RETURN_PATH,
    origin_return_ledger_path: ORIGIN_DASH_RETURN_LEDGER_PATH,
    origin_return: originReturn,
  });
});

fastify.get("/v1/relay/actionable_returns", async (request, reply) => {
  const limit = Math.min(Math.max(Number(request.query?.limit) || 8, 1), 50);
  const actionable = buildActionableReturnsSnapshot(limit);
  return reply.header("cache-control", "no-store").send({
    status: "ACTIONABLE_RETURNS_READBACK",
    actionable_returns_path: ORIGIN_DASH_ACTIONABLE_RETURNS_PATH,
    actionable_returns: actionable,
  });
});

fastify.post("/v1/relay/run_chaser", async (_request, reply) => {
  try {
    const result = runRelayChaserOnce();
    return reply.header("cache-control", "no-store").send(result);
  } catch (error) {
    return reply.code(error.statusCode || 500).header("cache-control", "no-store").send({
      status: "RELAY_CHASER_BLOCKED",
      error: error.message,
      chaser_status_path: AEYE_RELAY_CHASER_STATUS_PATH,
      chaser_status_file: fileReadback(AEYE_RELAY_CHASER_STATUS_PATH),
    });
  }
});

fastify.post("/v1/relay/actionable_decision", async (request, reply) => {
  try {
    const result = recordActionableDecision(request, request.body || {});
    return reply.code(201).header("cache-control", "no-store").send(result);
  } catch (error) {
    return reply.code(error.statusCode || 500).header("cache-control", "no-store").send({
      status: "ACTIONABLE_DECISION_BLOCKED",
      error: error.message,
      decision_log: fileReadback(ORIGIN_DASH_OPERATOR_DECISIONS_PATH),
    });
  }
});

fastify.post("/v1/nerdkle/operator_intent", async (request, reply) => {
  try {
    const result = createOperatorIntent(request, request.body || {});
    return reply.code(201).header("cache-control", "no-store").send(result);
  } catch (error) {
    return reply.code(error.statusCode || 500).header("cache-control", "no-store").send({
      status: "NERDKLE_OPERATOR_INTENT_BLOCKED",
      error: error.message,
      operator_intake: fileReadback(NERDKLE_OPERATOR_INTAKE_LEDGER_PATH),
    });
  }
});

fastify.post("/v1/relay/dispatch_startup", async (request, reply) => {
  const requestedTargets = Array.isArray(request.body?.targets) ? request.body.targets : ["Skybro.Betsy", "Petra.Betsy"];
  const targets = requestedTargets
    .map((target) => String(target || "").trim())
    .filter(Boolean);
  if (targets.length === 0 || targets.length > 5) {
    return reply.code(400).send({
      status: "STARTUP_DISPATCH_BLOCKED",
      error: "targets must contain 1-5 Aeye.Machine values",
    });
  }

  const brainbootPackets = [];
  const relayPackets = [];
  const renderResults = [];
  const blocked = [];
  for (const target of targets) {
    if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(target)) {
      blocked.push({ target, status: "TARGET_INVALID", error: "target must be Aeye.Machine" });
      continue;
    }
    const run = runSpeakerctlJson(["render-bootpack", target]);
    const result = run.result || {
      status: "SPEAKERCTL_OUTPUT_UNPARSEABLE",
      stdout: run.stdout,
    };
    const artifactPath = bootpackPathForTarget(target, result);
    const renderResult = {
      target,
      status: run.ok ? "BOOTPACK_RENDERED" : "BOOTPACK_RENDER_BLOCKED",
      artifact_path: artifactPath,
      artifact: artifactPath ? fileReadback(artifactPath) : null,
      result,
      error: run.ok ? null : run.error,
    };
    renderResults.push(renderResult);
    if (!run.ok) {
      blocked.push(renderResult);
      continue;
    }
    brainbootPackets.push(createBrainbootPacket(request, target, renderResult));
    relayPackets.push(createRelayPacket(request, {
      packet_type: "SOURCE_TRUTH_STARTUP",
      target,
      title: "Read Brainboot and Source Truth",
      body: "Open your standing inbox, read the latest Brainboot/source-truth packet, and return RECEIVED then COMPLETED or BLOCKER. Ben is not the courier.",
      producer: "TinkerDen Flight Deck@Doss",
      destination: "Aeye Relay",
    }));
  }

  return reply
    .code(blocked.length ? 409 : 200)
    .header("cache-control", "no-store")
    .send({
      status: blocked.length ? "STARTUP_DISPATCH_PARTIAL" : "STARTUP_DISPATCHED",
      targets,
      render_results: renderResults,
      brainboot_packets: brainbootPackets,
      relay_packets: relayPackets,
      blocked,
      rule: "Startup dispatch creates receiver-visible packets. It is not complete until receiver receipts return.",
    });
});

fastify.get("/v1/relay/next_chase", async (_request, reply) => {
  return reply.header("cache-control", "no-store").send({
    status: "AEYE_RELAY_NEXT_CHASE_READBACK",
    chaser_status_path: AEYE_RELAY_CHASER_STATUS_PATH,
    ...readNextRelayChase(),
  });
});

fastify.post("/v1/relay/ack", async (request, reply) => {
  try {
    const result = writeRelayAck(request.body || {});
    return reply.code(201).header("cache-control", "no-store").send(result);
  } catch (error) {
    return reply.code(error.statusCode || 500).header("cache-control", "no-store").send({
      status: "AEYE_RELAY_RECEIVER_RECEIPT_BLOCKED",
      error: error.message,
    });
  }
});

fastify.get("/relay/receive/:packetId", async (request, reply) => {
  try {
    const token = String(request.query?.token || "");
    const { packet } = loadRelayPacket(request.params.packetId);
    const safePacket = JSON.stringify(packet, null, 2);
    return reply.type("text/html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Aeye Relay Receiver</title>
  <style>
    :root { color-scheme: dark; font-family: Arial, sans-serif; background: #101418; color: #edf2f7; }
    body { margin: 0; padding: 28px; }
    main { max-width: 860px; margin: 0 auto; }
    .card { border: 1px solid #3f5c48; background: #101d17; border-radius: 8px; padding: 18px; }
    button { border: 1px solid #76d996; border-radius: 6px; color: #edf2f7; background: #1f4a31; padding: 10px 14px; font-weight: 700; cursor: pointer; margin-right: 8px; margin-top: 10px; }
    button.blocker { border-color: #ff6b7f; background: #351b22; }
    textarea { width: 100%; min-height: 80px; border: 1px solid #405468; border-radius: 6px; background: #0d1319; color: #edf2f7; padding: 10px; margin-top: 10px; }
    pre { white-space: pre-wrap; background: #0d1319; border: 1px solid #2e3d4c; border-radius: 6px; padding: 12px; overflow-wrap: anywhere; }
    .status { margin-top: 12px; color: #aab6c3; }
  </style>
</head>
<body>
  <main class="card">
    <h1>Aeye Relay Receiver</h1>
    <p>This page writes the receiver-side receipt. Sent is not proof until this packet returns RECEIVED and then COMPLETED or BLOCKER.</p>
    <pre id="packet">${escapeHtml(safePacket)}</pre>
    <textarea id="evidence">I received this packet and completed the requested readback/action.</textarea>
    <div>
      <button id="received">WRITE RECEIVED</button>
      <button id="completed">WRITE COMPLETED</button>
      <button id="blocker" class="blocker">WRITE BLOCKER</button>
    </div>
    <div id="status" class="status">Waiting for receiver action.</div>
  </main>
  <script>
    const packetId = ${JSON.stringify(packet.packet_id)};
    const token = ${JSON.stringify(token)};
    async function ack(status) {
      const evidence = document.getElementById("evidence").value.trim();
      const response = await fetch("/v1/relay/ack", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ packet_id: packetId, ack_token: token, status, evidence })
      });
      const result = await response.json();
      document.getElementById("status").textContent = response.ok
        ? status + " receipt written: " + result.receipt.receipt_id
        : status + " blocked: " + (result.error || "unknown error");
    }
    document.getElementById("received").addEventListener("click", () => ack("RECEIVED"));
    document.getElementById("completed").addEventListener("click", () => ack("COMPLETED"));
    document.getElementById("blocker").addEventListener("click", () => ack("BLOCKER"));
  </script>
</body>
</html>`);
  } catch (error) {
    return reply.code(error.statusCode || 500).send({
      status: "AEYE_RELAY_RECEIVER_PAGE_BLOCKED",
      error: error.message,
    });
  }
});

fastify.get("/v1/aeye/:target/inbox", async (request, reply) => {
  const target = String(request.params.target || "").trim();
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(target)) {
    return reply.code(400).header("cache-control", "no-store").send({
      status: "AEYE_INBOX_BLOCKED",
      error: "target must be Aeye.Machine",
    });
  }
  const limit = Math.min(Math.max(Number(request.query?.limit) || 20, 1), 100);
  return reply.header("cache-control", "no-store").send({
    status: "AEYE_INBOX_READBACK",
    target,
    brainboot_packets: latestBrainbootPacketsForTarget(target, limit),
    relay_packets: latestRelayPacketsForTarget(target, limit),
    rule: "The Aeye owns returning RECEIVED and then COMPLETED or BLOCKER. Ben is not the courier.",
  });
});

fastify.get("/aeye/:target", async (request, reply) => {
  const target = String(request.params.target || "").trim();
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(target)) {
    return reply.code(400).send({
      status: "AEYE_INBOX_BLOCKED",
      error: "target must be Aeye.Machine",
    });
  }
  const brainbootPackets = latestBrainbootPacketsForTarget(target, 20);
  const relayPackets = latestRelayPacketsForTarget(target, 20);
  const packets = [
    ...brainbootPackets.map((packet) => ({ channel: "brainboot", ...packet })),
    ...relayPackets.map((packet) => ({ channel: "relay", ...packet })),
  ].sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
  const packetsJson = JSON.stringify(packets);
  const cards = packets.length === 0 ? `
    <div class="card pending">
      <div class="topline"><strong>No packets for ${escapeHtml(target)}.</strong><span class="pill warn">EMPTY</span></div>
      <p>This inbox is working, but no dispatcher has assigned work to this Aeye yet.</p>
    </div>` : packets.map((packet) => {
      const status = String(packet.status || "UNKNOWN");
      const statusClass = status.includes("COMPLETED") ? "ok" : status.includes("BLOCKER") ? "bad" : "warn";
      const cardClass = status.includes("COMPLETED") ? "complete" : status.includes("BLOCKER") ? "blocker" : "pending";
      const title = packet.title || packet.mission || packet.packet_type || "Packet";
      const body = packet.body || packet.rule || "No packet body.";
      return `
    <div class="card ${cardClass}" data-packet-id="${escapeHtml(packet.packet_id)}" data-channel="${escapeHtml(packet.channel)}">
      <div class="topline"><strong>${escapeHtml(title)}</strong><span class="pill ${statusClass}">${escapeHtml(status)}</span></div>
      <p>${escapeHtml(body)}</p>
      <div class="meta">
        <div>channel: <code>${escapeHtml(packet.channel)}</code></div>
        <div>packet: <code>${escapeHtml(packet.packet_id)}</code></div>
        <div>last receipt: <code>${escapeHtml(packet.last_receiver_receipt_id || "NO_RECEIVER_RECEIPT")}</code></div>
        <div>artifact/hash: <code>${escapeHtml(packet.bootpack_sha256 || packet.evidence_path || "NO_HASH")}</code></div>
      </div>
      <textarea data-evidence="${escapeHtml(packet.packet_id)}">${escapeHtml(packet.channel === "brainboot" ? "I read this Brainboot packet and loaded the bootpack into session context." : "I received this packet and completed the requested readback/action.")}</textarea>
      <div>
        <button data-action="RECEIVED" data-channel="${escapeHtml(packet.channel)}" data-packet-id="${escapeHtml(packet.packet_id)}">WRITE RECEIVED</button>
        <button data-action="COMPLETED" data-channel="${escapeHtml(packet.channel)}" data-packet-id="${escapeHtml(packet.packet_id)}">WRITE COMPLETED</button>
        <button class="blocker" data-action="BLOCKER" data-channel="${escapeHtml(packet.channel)}" data-packet-id="${escapeHtml(packet.packet_id)}">WRITE BLOCKER</button>
      </div>
    </div>`;
    }).join("");

  return reply.type("text/html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Aeye Inbox | ${escapeHtml(target)}</title>
  <style>
    :root { color-scheme: dark; font-family: Arial, sans-serif; background: #101418; color: #edf2f7; }
    body { margin: 0; padding: 28px; }
    main { max-width: 920px; margin: 0 auto; }
    h1 { margin: 0 0 6px; }
    .sub { color: #aab6c3; margin-bottom: 18px; }
    .card { border: 1px solid #2f4658; border-left: 4px solid #ffd36c; border-radius: 8px; background: #0d1319; padding: 16px; margin-bottom: 12px; }
    .card.complete { border-left-color: #8df0be; }
    .card.blocker { border-left-color: #ff6b7f; }
    .topline { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; align-items: center; }
    .pill { display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 12px; font-weight: 700; }
    .ok { background: #153c2e; color: #8df0be; }
    .warn { background: #3a3015; color: #ffd36c; }
    .bad { background: #461d25; color: #ff9aa9; }
    .meta { color: #aab6c3; font-size: 12px; line-height: 1.5; margin: 8px 0; }
    code { color: #d3e8ff; overflow-wrap: anywhere; }
    textarea { width: 100%; min-height: 76px; border: 1px solid #405468; border-radius: 6px; background: #080d12; color: #edf2f7; padding: 10px; margin: 10px 0; font-family: inherit; }
    button { border: 1px solid #6caee8; border-radius: 6px; color: #edf2f7; background: #24435e; padding: 10px 14px; font-weight: 700; cursor: pointer; margin-right: 8px; margin-top: 6px; }
    button.blocker { border-color: #ff6b7f; background: #351b22; }
    #status { margin: 12px 0; color: #aab6c3; }
    a { color: #8fc7ff; }
  </style>
</head>
<body>
  <main>
    <h1>${escapeHtml(target)} Inbox</h1>
    <div class="sub">Standing receiver surface for Brainboot and report packets. Write RECEIVED, then COMPLETED or BLOCKER. Ben should not have to carry this state.</div>
    <div id="status">Ready.</div>
    ${cards}
    <p><a href="/">Back to Command Dash</a></p>
  </main>
  <script>
    const packets = ${packetsJson};
    async function writeReceipt(button) {
      const packetId = button.getAttribute("data-packet-id");
      const channel = button.getAttribute("data-channel");
      const status = button.getAttribute("data-action");
      const packet = packets.find((item) => item.packet_id === packetId && item.channel === channel);
      const evidence = document.querySelector('[data-evidence="' + packetId + '"]').value.trim();
      const endpoint = channel === "brainboot" ? "/v1/brainboot/ack" : "/v1/relay/ack";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ packet_id: packetId, ack_token: packet.ack_token, status, evidence, receiver: ${JSON.stringify(target)} })
      });
      const result = await response.json();
      document.getElementById("status").textContent = response.ok
        ? status + " receipt written: " + result.receipt.receipt_id
        : status + " blocked: " + (result.error || "unknown error");
      if (response.ok) window.setTimeout(() => window.location.reload(), 850);
    }
    document.querySelectorAll("button[data-action]").forEach((button) => {
      button.addEventListener("click", () => writeReceipt(button));
    });
  </script>
</body>
</html>`);
});

fastify.post("/v1/action/promote_staged", async (request, reply) => {
  let capsulePath;
  try {
    capsulePath = writeActionCapsuleFromRequest(request.body || {});
    const stdout = execFileSync(process.execPath, [SPEAKERCTL_PATH, "promote-staged", capsulePath], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    });
    const result = JSON.parse(stdout);
    return reply.code(200).send({
      status: "PROMOTE_STAGED_RETURNED",
      capsule_path: capsulePath,
      result,
    });
  } catch (error) {
    const stdout = error.stdout ? String(error.stdout) : "";
    let result = null;
    try {
      result = stdout ? JSON.parse(stdout) : null;
    } catch {
      result = null;
    }
    return reply.code(error.statusCode || 409).send({
      status: "PROMOTE_STAGED_BLOCKED",
      capsule_path: capsulePath || null,
      result,
      error: result ? null : error.message,
    });
  }
});

fastify.post("/v1/action/ratchet_feedback", async (request, reply) => {
  try {
    const result = writeRatchetDecisionReceipt(request.body || {});
    return reply.code(201).send({
      status: "RATCHET_RECEIPT_WRITTEN",
      receipt_id: result.receipt.receipt_id,
      receipt_type: result.receipt.receipt_type,
      decision: result.receipt.decision,
      reason: result.receipt.reason,
      operator_approval_receipt_id: result.receipt.operator_approval_receipt_id,
      receipt_path: result.receipt_path,
      receipt_sha256: result.receipt_sha256,
      byte_count: result.byte_count,
    });
  } catch (error) {
    return reply.code(error.statusCode || 500).send({
      status: "RATCHET_RECEIPT_BLOCKED",
      error: error.message,
    });
  }
});

fastify.get("/v1/swanson/button-repair-receipt", async (_request, reply) => {
  if (!fs.existsSync(SWANSON_BUTTON_REPAIR_RECEIPT_PATH)) {
    return reply.code(404).header("cache-control", "no-store").send({
      status: "RECEIPT_NOT_FOUND",
      path: SWANSON_BUTTON_REPAIR_RECEIPT_PATH,
    });
  }
  return reply.header("cache-control", "no-store").send({
    status: "RECEIPT_READBACK",
    readback: fileReadback(SWANSON_BUTTON_REPAIR_RECEIPT_PATH),
    receipt: readJson(SWANSON_BUTTON_REPAIR_RECEIPT_PATH, null),
  });
});

fastify.get("/swanson/button-repair-receipt", async (_request, reply) => {
  if (!fs.existsSync(SWANSON_BUTTON_REPAIR_RECEIPT_PATH)) {
    return reply.code(404).type("text/html").send(`<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><title>Receipt Missing</title></head>
<body>
  <h1>Receipt Missing</h1>
  <p>The button repair receipt was not found at:</p>
  <pre>${escapeHtml(SWANSON_BUTTON_REPAIR_RECEIPT_PATH)}</pre>
  <p><a href="/">Back to Command Dash</a></p>
</body>
</html>`);
  }
  const raw = fs.readFileSync(SWANSON_BUTTON_REPAIR_RECEIPT_PATH, "utf8");
  const readback = fileReadback(SWANSON_BUTTON_REPAIR_RECEIPT_PATH);
  const receipt = readJson(SWANSON_BUTTON_REPAIR_RECEIPT_PATH, {});
  const buttonTests = Array.isArray(receipt.visible_button_tests) ? receipt.visible_button_tests : [];
  const remainingWork = Array.isArray(receipt.remaining_work) ? receipt.remaining_work : [];
  const fixSummary = Array.isArray(receipt.fix_summary) ? receipt.fix_summary : [];
  const buttonCards = buttonTests.map((test) => `
      <article class="mini-card">
        <strong>${escapeHtml(test.button || "Button")}</strong>
        <span class="pill ${test.result === "PASS" ? "ok" : "warn"}">${escapeHtml(test.result || "UNKNOWN")}</span>
        <p>${escapeHtml(test.visible_readback || "No visible readback recorded.")}</p>
      </article>`).join("");
  const fixItems = fixSummary.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const remainingItems = remainingWork.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const rawWithoutBom = raw.replace(/^\uFEFF/, "");
  return reply.header("cache-control", "no-store").type("text/html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Swanson Button Repair Receipt</title>
  <style>
    :root { color-scheme: dark; font-family: Arial, sans-serif; background: #0d1217; color: #eef4f8; }
    body { margin: 0; padding: 28px; }
    main { max-width: 1040px; margin: 0 auto; }
    h1 { margin: 0 0 8px; }
    h2 { margin: 0 0 10px; font-size: 18px; }
    p { color: #c4d2dd; line-height: 1.5; }
    .hero { border: 1px solid #304658; border-left: 4px solid #8fd3ff; border-radius: 8px; background: #111922; padding: 18px; margin: 16px 0; }
    .hero strong { color: #ffffff; }
    .actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 14px; }
    .actions a, summary { border: 1px solid #4d7798; border-radius: 6px; color: #eef4f8; background: #1c3346; padding: 10px 12px; font-weight: 700; text-decoration: none; cursor: pointer; }
    .actions a.primary { background: #2d5f7f; border-color: #8fd3ff; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 16px 0; }
    .mini-card, .meta, .work { border: 1px solid #304658; border-radius: 8px; background: #101821; padding: 14px; }
    .mini-card p { margin-bottom: 0; }
    .pill { float: right; display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 12px; font-weight: 700; }
    .ok { background: #173b2a; color: #8df0be; }
    .warn { background: #3a3015; color: #ffd36c; }
    .bad { background: #441d25; color: #ff9aaa; }
    ul { margin: 0; padding-left: 20px; color: #c4d2dd; line-height: 1.55; }
    code, pre { color: #d8ecff; overflow-wrap: anywhere; }
    pre { white-space: pre-wrap; border: 1px solid #304658; border-radius: 8px; background: #070b10; padding: 16px; line-height: 1.45; }
    details { margin-top: 16px; }
    details pre { max-height: 360px; overflow: auto; }
    a { color: #8fd3ff; }
    @media (max-width: 780px) { .grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main>
    <h1>Button Repair Readback</h1>
    <section class="hero">
      <h2>Verdict: the old receipt view was not useful.</h2>
      <p><strong>What broke:</strong> ${escapeHtml(receipt.root_cause || "The dashboard controls did not produce visible human-facing readback.")}</p>
      <p><strong>What this page is for:</strong> a short operator readback. It is not the command surface. The command surface is the dashboard.</p>
      <div class="actions">
        <a class="primary" href="/">Open Command Dash</a>
        <a href="/#velocity-rail">Go To Buttons</a>
        <a href="/v1/swanson/button-repair-receipt">Raw JSON Endpoint</a>
      </div>
    </section>
    <section class="work">
      <h2>What Was Repaired</h2>
      <ul>${fixItems || "<li>No repair summary recorded.</li>"}</ul>
    </section>
    <section>
      <h2>Button Test Readback</h2>
      <div class="grid">${buttonCards || '<article class="mini-card"><strong>No button tests recorded.</strong><p>Receipt file did not include visible_button_tests.</p></article>'}</div>
    </section>
    <section class="work">
      <h2>Still Not Done</h2>
      <ul>${remainingItems || "<li>No remaining work recorded.</li>"}</ul>
    </section>
    <div class="meta">
      <div>path: <code>${escapeHtml(readback.path)}</code></div>
      <div>sha256: <code>${escapeHtml(readback.sha256)}</code></div>
      <div>bytes: <code>${escapeHtml(String(readback.byte_count))}</code></div>
      <div>modified: <code>${escapeHtml(readback.modified_at)}</code></div>
    </div>
    <details>
      <summary>Show Raw Receipt JSON</summary>
      <pre>${escapeHtml(rawWithoutBom)}</pre>
    </details>
  </main>
</body>
</html>`);
});

fastify.get("/receipt", async (_request, reply) => {
  return reply.code(302).header("location", "/swanson/button-repair-receipt").send();
});

fastify.get("/health", async () => ({
  status: "OK",
  organ: "index",
  generated_at: new Date().toISOString(),
  surfaces: {
    circulation_db: existsWithHashTarget(path.join(TINKARDEN_ROOT, "server", "circulation.db")),
    world_state: existsWithHashTarget(path.join(TINKARDEN_ROOT, "world_state.json")),
    frictional_heat: existsWithHashTarget(path.join(TINKARDEN_ROOT, "nervous_system", "frictional_heat.json")),
    speaker_queue: existsWithHashTarget(path.join(TINKARDEN_ROOT, "intake", "speaker_queue")),
  },
  rule: "Health readback only. This API does not execute work or promote canonical state.",
}));

fastify.get("/daemon", async () => daemonSnapshot());

fastify.get("/friction", async () => {
  const heatPath = path.join(TINKARDEN_ROOT, "nervous_system", "frictional_heat.json");
  if (!fs.existsSync(heatPath)) {
    return { status: "MISSING", path: heatPath };
  }
  return JSON.parse(fs.readFileSync(heatPath, "utf8"));
});

fastify.get("/state", async () => {
  const statePath = path.join(TINKARDEN_ROOT, "world_state.json");
  if (!fs.existsSync(statePath)) {
    return { status: "MISSING", path: statePath };
  }
  return JSON.parse(fs.readFileSync(statePath, "utf8"));
});

fastify.listen({ port: PORT, host: HOST }).catch((error) => {
  fastify.log.error(error);
  process.exit(1);
});
