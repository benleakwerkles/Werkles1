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
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
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

  reply.type("text/html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Nerdkle Daemon Health</title>
  <style>
    :root { color-scheme: dark; font-family: Arial, sans-serif; background: #101418; color: #edf2f7; }
    body { margin: 0; padding: 32px; }
    main { max-width: 980px; margin: 0 auto; }
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
    .brainboot { margin: 0 0 18px; border: 1px solid #42607a; background: #121d26; border-radius: 8px; padding: 18px; }
    .brainboot h2 { margin: 0 0 8px; font-size: 20px; }
    .brainboot .rec-text { max-width: 78ch; }
    .brainboot .brainboot-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-top: 14px; }
    .brainboot button { background: #24435e; border-color: #6caee8; }
    .brainboot .mini { color: #9fb0c0; font-size: 12px; }
    .release-valve .status-line { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-top: 8px; }
    .release-valve ul { margin: 10px 0 0; padding-left: 18px; color: #c4cfda; }
    .release-valve li { margin: 4px 0; }
    .operator-bench { margin-top: 16px; border: 1px solid #314152; background: #111820; border-radius: 8px; padding: 16px; }
    .bench-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; }
    .artifact-readback { margin-top: 12px; border: 1px solid #2e3d4c; border-radius: 6px; background: #0d1319; padding: 12px; color: #c4cfda; font-size: 13px; line-height: 1.45; overflow-wrap: anywhere; }
    .artifact-readback strong { color: #edf2f7; }
    .artifact-readback pre { white-space: pre-wrap; margin: 8px 0 0; max-height: 220px; overflow: auto; background: #080d12; border: 1px solid #22303c; border-radius: 6px; padding: 10px; }
    @keyframes slide-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
    a { color: #8fc7ff; }
  </style>
</head>
<body>
  <main>
    <h1>Nerdkle Daemon Health</h1>
    <div class="sub">Live local preview from Doss. This is a command-health surface, not canonical promotion.</div>
    <section class="brainboot" data-testid="brainboot-panel">
      <div class="label">Session Start</div>
      <h2>Nerdkle Brainboot</h2>
      <div class="rec-text">Render the shared source-truth base for Skybro and Petra before a session starts drifting. This reads GitHub-backed source-truth files and writes bootpacks with exact hashes.</div>
      <div class="brainboot-row">
        <button type="button" id="brainboot-primary-button" data-testid="brainboot-primary-button">SESSION NERDKLE BRAINBOOT</button>
        <span class="mini">Outputs: Skybro.Betsy.BOOTPACK.md and Petra.Betsy.NERDKLE_BRAINBOOT.BOOTPACK.md</span>
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
        <button type="button" id="render-bootpack-button" data-testid="render-bootpack-button">SESSION NERDKLE BRAINBOOT</button>
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
    <p><a href="/health">JSON health</a> · <a href="/daemon">JSON daemon snapshot</a> · <a href="/friction">JSON friction</a></p>
  </main>
  <script>
    let pendingRatchetDecision = null;
    const seenStreamEvents = new Set();

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
        const pre = document.createElement("pre");
        pre.textContent = typeof detail === "string" ? detail : JSON.stringify(detail, null, 2);
        box.appendChild(pre);
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
        setWorkbenchStatus(label + " returned", lines.length ? lines : ["Readback returned."], result);
        pollSpeakerStreamLog();
        pollReleaseValve();
      } catch (error) {
        setWorkbenchStatus(label + " failed", [error.message], null);
      }
    }

    document.getElementById("ingest-inbox-button").addEventListener("click", () => {
      runWorkbenchAction("Raw receipt ingest", "/v1/action/ingest_raw_inbox");
    });
    document.getElementById("refresh-repo-button").addEventListener("click", () => {
      runWorkbenchAction("Repo snapshot refresh", "/v1/action/refresh_repo_state");
    });
    document.getElementById("render-bootpack-button").addEventListener("click", () => {
      runWorkbenchAction("Session Nerdkle Brainboot", "/v1/action/render_brainboot", {
        targets: ["Skybro.Betsy", "Petra.Betsy"]
      });
    });
    document.getElementById("brainboot-primary-button").addEventListener("click", () => {
      runWorkbenchAction("Session Nerdkle Brainboot", "/v1/action/render_brainboot", {
        targets: ["Skybro.Betsy", "Petra.Betsy"]
      });
    });

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
    setInterval(pollSpeakerStreamLog, 3000);
    setInterval(pollReleaseValve, 5000);
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
