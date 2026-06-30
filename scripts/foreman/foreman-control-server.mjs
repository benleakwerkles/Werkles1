#!/usr/bin/env node
/**
 * Foreman Control Panel — local operator dashboard (127.0.0.1:4317)
 * Bean hardening: PID-safe port, local POST token, Drop Zone validation, server-confirmed UI.
 * Doctrine: safe local actions only. Stops before Send.
 */

import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { verifyAllRelayTabDestinations } from "./relay-courier-lib.mjs";
import { classifyGdCommand, formatGdCommandVerdict } from "../../foreman/gd-intent-router/gd-command-governor.mjs";
import { buildSpeakerStatus, draftSpeakerEntry } from "../../foreman/speaker/speaker-lib.mjs";

function readArgValue(name) {
  const prefix = `${name}=`;
  const exactIndex = process.argv.indexOf(name);
  if (exactIndex >= 0 && process.argv[exactIndex + 1]) return process.argv[exactIndex + 1];
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  return inline ? inline.slice(prefix.length) : null;
}

const MOBILE_READONLY_LAN = process.argv.includes("--mobile-readonly-lan");
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const PORT = 4317;
const HOST = readArgValue("--host") || (MOBILE_READONLY_LAN ? "0.0.0.0" : "127.0.0.1");
const LOCAL_HOST = "127.0.0.1";
const LOCAL_PANEL_URL = `http://${LOCAL_HOST}:${PORT}/`;
const LOCAL_PANEL_DISPLAY_URL = LOCAL_PANEL_URL.replace(/\/$/, "");
const CONTROL_PANEL_DIR = path.join(REPO_ROOT, "foreman", "control-panel");
const PID_FILE = path.join(CONTROL_PANEL_DIR, "foreman-control.pid");
const TOKEN_FILE = path.join(CONTROL_PANEL_DIR, ".local_token");
const DROP_ZONE_MAX_BYTES = 100 * 1024;
const FOREMAN_SCRIPT_MARKER = "foreman-control-server.mjs";

const DISPATCH_PS1 = path.join(REPO_ROOT, "scripts", "foreman", "crew-dispatch-console.ps1");
const DISPATCH_CONFIG = path.join(REPO_ROOT, "foreman", "crew-dispatch-console", "dispatch-config.json");
const PACKET_TEMPLATE = path.join(REPO_ROOT, "foreman", "crew-dispatch-console", "templates", "packet.template.md");
const PASTE_TEMPLATE = path.join(REPO_ROOT, "foreman", "crew-dispatch-console", "templates", "paste-block.template.txt");
const DESIGN_TOKENS_TS = path.join(REPO_ROOT, "lib", "design-tokens.ts");
const GLOBALS_CSS = path.join(REPO_ROOT, "app", "globals.css");

const PATHS = {
  outbox: path.join(REPO_ROOT, "foreman", "handoffs", "outbox"),
  inbox: path.join(REPO_ROOT, "foreman", "handoffs", "inbox"),
  reviews: path.join(REPO_ROOT, "foreman", "reviews"),
  nextAction: path.join(REPO_ROOT, "foreman", "NEXT_ACTION.md"),
  currentState: path.join(REPO_ROOT, "foreman", "CURRENT_STATE.md"),
  operatorDashboard: path.join(REPO_ROOT, "foreman", "OPERATOR_DASHBOARD.md"),
  activeAgent: path.join(REPO_ROOT, "foreman", "ACTIVE_AGENT.md"),
  budget: path.join(REPO_ROOT, "foreman", "BUDGET.md"),
  dispatchDashboardJson: path.join(REPO_ROOT, "foreman", "crew-dispatch-console", "DISPATCH_DASHBOARD.json"),
  latestDispatchJson: path.join(REPO_ROOT, "foreman", "crew-dispatch-console", "LATEST_DISPATCH.json"),
};

const CREW_TABS_CONFIG = path.join(REPO_ROOT, "foreman", "crew-dispatch", "crew-tabs.config.json");
const EDGE_AEYE_PROFILE = path.join(REPO_ROOT, "foreman", ".edge-aeye-crew-profile");
const OPEN_AEYE_CREW_CMD = path.join(REPO_ROOT, "open-aeye-crew.cmd");
const CREW_DISPATCH_BAT = path.join(REPO_ROOT, "crew-dispatch.bat");
const FINANCE_DASHBOARD_JSON = path.join(REPO_ROOT, "foreman", "finance", "finance-dashboard.json");
const FINANCE_COMMAND_MJS = path.join(REPO_ROOT, "scripts", "foreman", "finance-command.mjs");
const CREW_RELAY_INTAKE = path.join(REPO_ROOT, "foreman", "crew-dispatch", "crew-response-intake.mjs");
const CREW_RELAY_GENERATOR = path.join(REPO_ROOT, "foreman", "crew-dispatch", "crew-packet-generator.mjs");
const CREW_RELAY_LIB = path.join(REPO_ROOT, "foreman", "crew-dispatch", "crew-relay-lib.mjs");
const CREW_RELAY_NETWORK_CMD = path.join(REPO_ROOT, "foreman", "crew-dispatch", "crew-relay-network-command.mjs");
const CREW_EDGE_COURIER_MJS = path.join(REPO_ROOT, "foreman", "crew-dispatch", "crew-edge-courier.mjs");
const CREW_EDGE_COURIER_PS1 = path.join(REPO_ROOT, "foreman", "crew-dispatch", "crew-edge-courier.ps1");
const CREW_RELAY_RUNNER = path.join(REPO_ROOT, "foreman", "crew-dispatch", "crew-relay-runner.mjs");
const LATEST_NETWORK_COMMAND_JSON = path.join(REPO_ROOT, "foreman", "crew-dispatch", "LATEST_NETWORK_COMMAND.json");
const RELAY_COURIER_MJS = path.join(REPO_ROOT, "scripts", "foreman", "relay-courier.mjs");
const RELAY_LOCK_JSON = path.join(REPO_ROOT, "foreman", "crew-dispatch", "RELAY_LOCK.json");
const CONTEXT_HEALTH_JSON = path.join(REPO_ROOT, "foreman", "crew-dispatch", "context-health.json");
const BUILD_BOOT_PACKET_MJS = path.join(REPO_ROOT, "foreman", "crew-dispatch", "build-boot-packet.mjs");
const IMAGERY_DIRECTION = path.join(REPO_ROOT, "foreman", "IMAGERY_DIRECTION.md");
const IMAGERY_PROMPT_TEMPLATE = path.join(REPO_ROOT, "foreman", "ghost-forge", "IMAGERY_PROMPT_TEMPLATE.md");
const ENDER_IMAGERY_WIRE_PACKET = path.join(REPO_ROOT, "foreman", "handoffs", "outbox", "TO_ENDER_IMAGERY_DIRECTION_WIRE_v0.1.md");
const CREW_PACKET_GENERATOR = path.join(REPO_ROOT, "foreman", "crew-dispatch", "crew-packet-generator.mjs");
const GD_ROUTER_MJS = path.join(REPO_ROOT, "foreman", "gd-intent-router", "gd-intent-router.mjs");
const THREAD_REFRESH_PACKET = path.join(REPO_ROOT, "foreman", "handoffs", "outbox", "THREAD_REFRESH_PACKET.md");
const GD_MISSION_CLASSES = path.join(REPO_ROOT, "foreman", "gd-intent-router", "mission-classes.json");
const GD_RUNS_DIR = path.join(REPO_ROOT, "foreman", "gd-intent-router", "runs");
const CRAWLER_NUGGETS_JSON = path.join(REPO_ROOT, "foreman", "nuggets_of_wisdom_top_25.json");
const ACTIVE_TASK_JSON = path.join(REPO_ROOT, "foreman", "soledash", "ACTIVE_TASK.json");
const MACHINE_HEALTH_JSON = path.join(REPO_ROOT, "foreman", "soledash", "MACHINE_HEALTH.json");
const WORK_QUEUE_JSON = path.join(REPO_ROOT, "foreman", "soledash", "WORK_QUEUE.json");
const PROJECT_LOCKS_JSON = path.join(REPO_ROOT, "foreman", "soledash", "PROJECT_LOCKS.json");
const CRAWLER_PEARLS_JSON = path.join(REPO_ROOT, "foreman", "soledash", "CRAWLER_PEARLS.json");
const SWATTER_EVENT_STREAM_JSON = path.join(REPO_ROOT, "foreman", "soledash", "SWATTER_EVENT_STREAM.json");
const AUTOMATICA_ROUTE_MAP = path.join(REPO_ROOT, "foreman", "soledash", "AUTOMATICA_ROUTE_MAP.json");
const AUTOMATICA_APPROVALS = path.join(REPO_ROOT, "foreman", "soledash", "AUTOMATICA_APPROVALS.json");
const AUTOMATICA_RUNNER = path.join(REPO_ROOT, "foreman", "soledash", "automatica", "run_automatica_route.py");
const AUTOMATICA_ACTIONS_DIR = path.join(REPO_ROOT, "foreman", "soledash", "actions");
const AUTOMATICA_RECEIPTS_DIR = path.join(REPO_ROOT, "foreman", "soledash", "receipts");
const CARD_LOCALITY_ACTOR = "Dink@Doss";

const OVERSEER_RUNNER = path.join(REPO_ROOT, "foreman", "overseer", "return_to_work.py");
const OVERSEER_POLICY = path.join(REPO_ROOT, "foreman", "overseer", "README.md");
const OVERSEER_ACTIONS_DIR = path.join(REPO_ROOT, "foreman", "overseer", "actions");
const OVERSEER_RECEIPTS_DIR = path.join(REPO_ROOT, "foreman", "overseer", "receipts");

const COUSIN_BY_ROLE = {
  petra: "PETRA",
  skybro: "SKYBRO",
  ender: "ENDER",
  bean: "BEAN",
  computer: "COMPUTER",
};

const FINANCE_BLOCKED_ACTIONS = [
  { id: "finance-create-bank", label: "Create bank account" },
  { id: "finance-virtual-card", label: "Create virtual card" },
  { id: "finance-change-billing", label: "Change billing method" },
  { id: "finance-pay-vendor", label: "Pay vendor" },
  { id: "finance-transfer", label: "Transfer funds" },
  { id: "finance-submit-reimbursement", label: "Submit reimbursement" },
  { id: "finance-connect-bank", label: "Connect financial account" },
  { id: "finance-import-bank", label: "Import bank data (new source)" },
];

const CREW_COUSIN_IDS = {
  petra: "PETRA",
  skybro: "SKYBRO",
  ender: "ENDER",
  bean: "BEAN",
  computer: "COMPUTER",
};

const ROLES = {
  petra: {
    id: "petra",
    label: "Petra",
    title: "ChatGPT Comptroller",
    platform: "ChatGPT / Cockpit / Ayes",
    packetPrefix: "TO_PETRA",
    pasteBlockSuffix: "PETRA_PASTE_BLOCK.txt",
    ps1Role: "petra",
  },
  skybro: {
    id: "skybro",
    label: "Skybro",
    title: "Gemini architecture / product exploration",
    platform: "Gemini Gem",
    packetPrefix: "TO_SKYBRO",
    pasteBlockSuffix: "SKYBRO_PASTE_BLOCK.txt",
    ps1Role: null,
  },
  ender: {
    id: "ender",
    label: "Ender",
    title: "Claude UX / brand",
    platform: "Claude",
    packetPrefix: "TO_CLAUDE",
    pasteBlockSuffix: "ENDER_PASTE_BLOCK.txt",
    ps1Role: "ender",
  },
  bean: {
    id: "bean",
    label: "Bean",
    title: "DeepSeek trust audit",
    platform: "DeepSeek",
    packetPrefix: "TO_BEAN",
    pasteBlockSuffix: "BEAN_PASTE_BLOCK.txt",
    ps1Role: "bean",
  },
  computer: {
    id: "computer",
    label: "Computer",
    title: "Perplexity research / current-world checks",
    platform: "Perplexity Computer",
    packetPrefix: "TO_COMPUTER",
    pasteBlockSuffix: "COMPUTER_PASTE_BLOCK.txt",
    ps1Role: null,
  },
};

const BLOCKED_ACTIONS = [
  { id: "deploy", label: "Deploy to production" },
  { id: "push", label: "Git push / merge" },
  { id: "sql", label: "Apply SQL / schema" },
  { id: "ghost-forge", label: "Run Ghost Forge batch" },
  { id: "education-forge", label: "Run Education Forge" },
  { id: "send-packet", label: "Send packet to external AI" },
  { id: "stripe", label: "Create live Stripe products" },
  { id: "oauth", label: "OAuth / billing / provider setup" },
  { id: "secrets", label: "Read / print / store secrets" },
];

const GATE_REVIEW_MAP = {
  AUTOMATION_AUTHORITY: path.join(REPO_ROOT, "foreman", "reviews", "AUTOMATION_AUTHORITY_REVIEW.html"),
  AUTOMATION_AUTHORITY_DOCTRINE_REVIEW: path.join(
    REPO_ROOT,
    "foreman",
    "reviews",
    "AUTOMATION_AUTHORITY_REVIEW.html"
  ),
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readText(filePath, maxLines = null) {
  if (!fs.existsSync(filePath)) {
    return { ok: false, error: `Missing: ${rel(filePath)}`, text: "" };
  }
  const raw = fs.readFileSync(filePath, "utf8");
  if (!maxLines) return { ok: true, text: raw };
  return { ok: true, text: raw.split(/\r?\n/).slice(0, maxLines).join("\n") };
}

function rel(absPath) {
  return path.relative(REPO_ROOT, absPath).replace(/\\/g, "/");
}

function cardLocalityFields({ action = null, receipt = null, actor = CARD_LOCALITY_ACTOR, timestamp = null } = {}) {
  return {
    last_action: action ? String(action) : null,
    last_receipt: receipt ? String(receipt) : null,
    last_actor: actor ? String(actor) : CARD_LOCALITY_ACTOR,
    last_timestamp: timestamp ? String(timestamp) : null,
  };
}

function normalizeCardLocality(source = {}, fallback = {}) {
  source = source || {};
  fallback = fallback || {};
  return cardLocalityFields({
    action: source.last_action || fallback.action || null,
    receipt: source.last_receipt || source.latest_receipt_path || source.receipt_path || source.path || source.file || fallback.receipt || null,
    actor: source.last_actor || fallback.actor || CARD_LOCALITY_ACTOR,
    timestamp:
      source.last_timestamp ||
      source.updated_at ||
      source.created_at ||
      source.modifiedAt ||
      fallback.timestamp ||
      null,
  });
}

function parseEffectiveGate(markdown) {
  const m = markdown.match(/\*\*Effective gate:\*\*\s*`([^`]+)`/);
  if (m) return m[1].trim();
  const m2 = markdown.match(/^\[ACTIVE:[^\]]+\]/m);
  if (m2) return m2[0].trim();
  return "(gate not found)";
}

function parseStateSummary(markdown) {
  const lines = [];
  let inSection = false;
  for (const line of markdown.split(/\r?\n/)) {
    if (line.startsWith("## Morale deploy")) inSection = true;
    if (inSection && line.startsWith("## ") && !line.includes("Morale deploy")) break;
    if (inSection && line.trim()) lines.push(line);
  }
  if (lines.length) return lines.slice(0, 8).join("\n");
  return readText(PATHS.currentState, 14).text;
}

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    let raw = fs.readFileSync(filePath, "utf8");
    if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function loadDispatchConfig() {
  return loadJson(DISPATCH_CONFIG) || { cockpitSources: [], missions: {} };
}

function pickCssVar(css, name) {
  const m = css.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{3,8})`));
  return m?.[1] || null;
}

function pickTsColor(ts, name) {
  const m = ts.match(new RegExp(`${name}:\\s*"([^"]+)"`));
  return m?.[1] || null;
}

/** Inline CSS vars synced from lib/design-tokens.ts + app/globals.css — not independent palette law. */
function loadPanelTheme() {
  const ts = fs.existsSync(DESIGN_TOKENS_TS) ? fs.readFileSync(DESIGN_TOKENS_TS, "utf8") : "";
  const css = fs.existsSync(GLOBALS_CSS) ? fs.readFileSync(GLOBALS_CSS, "utf8") : "";
  return {
    paper: pickCssVar(css, "--werkles-workshop-paper-elevated") || pickCssVar(css, "--werkles-workshop-paper") || "#fffaf2",
    paperSoft: pickCssVar(css, "--werkles-workshop-paper") || "#f6efe5",
    ink: pickCssVar(css, "--werkles-ink-on-paper") || pickTsColor(ts, "smoke") || "#2c231d",
    inkMuted: pickCssVar(css, "--werkles-ink-muted-on-paper") || pickTsColor(ts, "textMuted") || "#5c4a3a",
    copper: pickTsColor(ts, "copper") || "#9F6633",
    ok: pickTsColor(ts, "owlEyeGreen") || "#5FD178",
    wait: pickTsColor(ts, "forgeOrange") || "#F6AD55",
    stop: pickTsColor(ts, "violetDeep") || "#2A0E8C",
    panelBorder: "rgba(159, 102, 51, 0.25)",
    gateBg: pickCssVar(css, "--werkles-workshop-paper") || "#fff3d6",
  };
}

function ensureControlPanelDir() {
  fs.mkdirSync(CONTROL_PANEL_DIR, { recursive: true });
}

function ensureLocalToken() {
  ensureControlPanelDir();
  if (fs.existsSync(TOKEN_FILE)) {
    return fs.readFileSync(TOKEN_FILE, "utf8").trim();
  }
  const token = crypto.randomBytes(32).toString("hex");
  fs.writeFileSync(TOKEN_FILE, token, "utf8");
  return token;
}

function loadPidRecord() {
  if (!fs.existsSync(PID_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(PID_FILE, "utf8"));
  } catch {
    return null;
  }
}

function writePidRecord() {
  ensureControlPanelDir();
  const record = {
    pid: process.pid,
    port: PORT,
    host: HOST,
    startedAt: new Date().toISOString(),
    script: FOREMAN_SCRIPT_MARKER,
    commandLine: process.argv.join(" "),
  };
  fs.writeFileSync(PID_FILE, JSON.stringify(record, null, 2), "utf8");
}

function removePidRecord() {
  if (fs.existsSync(PID_FILE)) {
    try {
      fs.unlinkSync(PID_FILE);
    } catch {
      /* ignore */
    }
  }
}

function runCommand(exe, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(exe, args, { windowsHide: true, cwd: options.cwd || undefined });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr?.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) reject(new Error(stderr.trim() || stdout.trim() || `${exe} exit ${code}`));
      else resolve(stdout.trim());
    });
  });
}

function runNodeScript(scriptPath, args = []) {
  return runCommand("node", [scriptPath, ...args], { cwd: REPO_ROOT });
}

function runNodeScriptAllowFail(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [scriptPath, ...args], { cwd: REPO_ROOT, windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr?.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code: code ?? 1, stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

async function stampRelayMetadata(packetFile, roleKey) {
  const cousin = COUSIN_BY_ROLE[roleKey];
  if (!cousin || !packetFile || !fs.existsSync(packetFile)) return null;
  const mod = await import(pathToFileURL(CREW_RELAY_LIB).href);
  const packetId = path.basename(packetFile, ".md");
  return mod.stampOutgoingPacket(packetFile, cousin, packetId);
}

async function runCrewRelay(action, extraArgs = []) {
  const result = await runNodeScriptAllowFail(CREW_RELAY_INTAKE, [action, ...extraArgs]);
  return result;
}

async function getListeningPid(port) {
  const out = await runCommand("netstat", ["-ano"]);
  const lines = out.split(/\r?\n/);
  for (const line of lines) {
    if (!line.includes("LISTENING")) continue;
    if (!line.includes(`127.0.0.1:${port}`) && !line.includes(`[::1]:${port}`)) continue;
    const parts = line.trim().split(/\s+/);
    const pid = parseInt(parts[parts.length - 1], 10);
    if (!Number.isNaN(pid)) return pid;
  }
  return null;
}

async function runCommandWithTimeout(exe, args, timeoutMs = 8000, options = {}) {
  return Promise.race([
    runCommand(exe, args, options),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${exe} timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

async function getProcessCommandLine(pid) {
  try {
    const tasklistOut = await runCommandWithTimeout(
      "tasklist",
      ["/FI", `PID eq ${pid}`, "/FO", "LIST", "/V"],
      4000
    );
    const m = tasklistOut.match(/Command Line:\s*(.+)/i);
    if (m?.[1]) return m[1].trim();
  } catch {
    /* fall through */
  }

  try {
    const out = await runCommandWithTimeout(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `(Get-CimInstance Win32_Process -Filter "ProcessId=${pid}" -ErrorAction SilentlyContinue).CommandLine`,
      ],
      5000
    );
    return out.trim();
  } catch {
    return "";
  }
}

function isForemanControlProcess(commandLine) {
  return commandLine.includes(FOREMAN_SCRIPT_MARKER);
}

async function killProcess(pid, timeoutMs = 8000) {
  await runCommandWithTimeout("taskkill", ["/PID", String(pid), "/F"], timeoutMs);
}

function probeForemanHealth() {
  return new Promise((resolve) => {
    const req = http.get(new URL("api/status", LOCAL_PANEL_URL), (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(2500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function probeGimpDashRoute() {
  return new Promise((resolve) => {
    const req = http.get(LOCAL_PANEL_URL, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        const integrated =
          res.statusCode === 200 &&
          body.includes('id="gimpdash"') &&
          body.includes('id="gd-routing-form"') &&
          body.includes('id="gd-route-btn"');
        resolve(integrated);
      });
    });
    req.on("error", () => resolve(false));
    req.setTimeout(4000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/** @returns {"free"|"already_running"|"cleared"} */
async function ensurePortAvailable() {
  let listenerPid = await getListeningPid(PORT);
  if (!listenerPid) return "free";

  const healthy = await probeForemanHealth();
  if (healthy) {
    console.log(
      `Foreman Control Panel already running on http://${HOST}:${PORT} (PID ${listenerPid}). Opening browser.`
    );
    return "already_running";
  }

  const pidRecord = loadPidRecord();
  const pidMatchesRecord = pidRecord && pidRecord.pid === listenerPid;
  const commandLine = pidMatchesRecord ? "" : await getProcessCommandLine(listenerPid);
  const isForeman = pidMatchesRecord || isForemanControlProcess(commandLine);

  if (isForeman) {
    console.log(`Clearing unhealthy Foreman Control Panel PID ${listenerPid}.`);
    try {
      await killProcess(listenerPid);
    } catch (err) {
      throw new Error(
        `HUMAN GATE REQUIRED: could not stop stale Foreman PID ${listenerPid} (${err.message}). Close it manually, then retry.`
      );
    }
    await sleep(600);
    listenerPid = await getListeningPid(PORT);
    if (listenerPid) {
      throw new Error(
        `HUMAN GATE REQUIRED: port ${PORT} still occupied after clearing stale Foreman PID. Close the process manually.`
      );
    }
    return "cleared";
  }

  throw new Error(
    `HUMAN GATE REQUIRED: port ${PORT} is occupied by unknown process PID ${listenerPid}. ` +
      `This panel will not kill arbitrary processes. Close the occupant manually, then retry.`
  );
}

function normalizeRemoteAddress(address) {
  return String(address || "")
    .replace(/^::ffff:/, "")
    .trim();
}

function isLoopbackAddress(address) {
  const normalized = normalizeRemoteAddress(address);
  return normalized === "127.0.0.1" || normalized === "::1" || normalized === "localhost";
}

function isLoopbackRequest(req) {
  return isLoopbackAddress(req.socket?.remoteAddress);
}

function verifyLocalToken(req) {
  if (!isLoopbackRequest(req)) return false;
  const header = req.headers["x-foreman-local-token"];
  const token = ensureLocalToken();
  return typeof header === "string" && header === token;
}

function lanIPv4Candidates() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((item) => item && item.family === "IPv4" && !item.internal)
    .map((item) => item.address)
    .filter(Boolean);
}

function buildMobileAccessStatus() {
  const lanIps = lanIPv4Candidates();
  return {
    mode: MOBILE_READONLY_LAN ? "LAN_READ_ONLY" : "LOCAL_ONLY",
    bindHost: HOST,
    localUrl: LOCAL_PANEL_URL,
    lanUrls: lanIps.map((ip) => `http://${ip}:${PORT}/#automatica`),
    phoneFireAllowed: false,
    awayFromHome: "NO-GO until Tailscale/VPN or explicit authenticated preview is approved",
    security: "Non-loopback clients receive no POST token; all POST endpoints require localhost plus token.",
  };
}

function timestampSlug() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "-" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds())
  );
}

function sanitizeSlug(input) {
  if (input == null || input === "") return "drop";
  const raw = String(input);
  if (/[\\/]|\.\./.test(raw) || raw.includes("\0")) {
    throw new Error("Invalid slug: path separators or traversal rejected");
  }
  const slug = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  if (!slug) throw new Error("Invalid slug after sanitization");
  return slug;
}

function validateDropContent(content) {
  if (typeof content !== "string") throw new Error("Content must be text");
  if (content.includes("\0")) throw new Error("Invalid content");
  const bytes = Buffer.byteLength(content, "utf8");
  if (bytes === 0) throw new Error("Empty content");
  if (bytes > DROP_ZONE_MAX_BYTES) throw new Error("Input exceeds 100KB limit");
  return content;
}

function buildInboxFilename(slugHint) {
  const slug = sanitizeSlug(slugHint);
  const filename = `${timestampSlug()}-${slug}.md`;
  if (!filename.endsWith(".md")) throw new Error("Only .md files allowed");
  if (/[\\/]|\.\./.test(filename)) throw new Error("Generated filename rejected");
  return filename;
}

function resolveInboxFile(filename) {
  if (!filename.endsWith(".md")) throw new Error("Only .md files allowed");
  if (/[\\/]|\.\./.test(filename) || path.basename(filename) !== filename) {
    throw new Error("Path traversal rejected");
  }
  const resolved = path.resolve(PATHS.inbox, filename);
  const inboxResolved = path.resolve(PATHS.inbox);
  if (!resolved.startsWith(inboxResolved + path.sep)) {
    throw new Error("Path traversal rejected");
  }
  return resolved;
}

function listInboxMarkdownFiles() {
  if (!fs.existsSync(PATHS.inbox)) return [];
  return fs
    .readdirSync(PATHS.inbox)
    .filter((f) => f.endsWith(".md"))
    .map((f) => ({
      name: f,
      path: rel(path.join(PATHS.inbox, f)),
      updatedAt: fs.statSync(path.join(PATHS.inbox, f)).mtime.toISOString(),
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function listOutboxUnsent() {
  if (!fs.existsSync(PATHS.outbox)) return [];
  return fs
    .readdirSync(PATHS.outbox)
    .filter((f) => /^TO_[A-Z]+_.*\.md$/i.test(f))
    .map((f) => ({
      name: f,
      path: rel(path.join(PATHS.outbox, f)),
      updatedAt: fs.statSync(path.join(PATHS.outbox, f)).mtime.toISOString(),
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 12);
}

async function saveDropZone(content, slugHint) {
  const validated = validateDropContent(content);
  const filename = buildInboxFilename(slugHint);
  const target = resolveInboxFile(filename);
  fs.mkdirSync(PATHS.inbox, { recursive: true });
  fs.writeFileSync(target, validated, "utf8");
  return { filename, path: rel(target), bytes: Buffer.byteLength(validated, "utf8") };
}

function expandTemplate(template, tokens) {
  let out = template;
  for (const [key, value] of Object.entries(tokens)) {
    out = out.split(`{{${key}}}`).join(String(value ?? ""));
  }
  return out;
}

function getNextActionHeadline() {
  const { text } = readText(PATHS.nextAction);
  return parseEffectiveGate(text);
}

function getActiveWriterSnippet() {
  return readText(PATHS.activeAgent, 8).text;
}

function roleActionText(roleId) {
  switch (roleId) {
    case "petra":
      return `Reply using the VERDICT block format:
- SLICE, GATE_05, UI_COMMIT, CODEX, MAKER
- CONDITIONS + DOWNSTREAM_HANDOFFS + NEXT_HUMAN_GATE`;
    case "skybro":
      return `Architecture and product exploration only.
Return options, systems, and matching logic. Do not claim implementation.`;
    case "ender":
      return `UX/brand review only. Return recommendations; do not claim implementation.`;
    case "bean":
      return `Trust/compliance audit only. Flag forbidden claims and gate risks.`;
    case "computer":
      return `Research and current-world checks only.
Cite sources; flag policy/pricing risks; no spend.`;
    default:
      return "Follow the attached packet. Stop before any Send action.";
  }
}

function roleResponseFormat(roleId) {
  switch (roleId) {
    case "petra":
      return [
        "VERDICT: GO | NO-GO | GO_WITH_CONDITIONS",
        "SLICE: ...",
        "GATE_05: RESUME | PAUSE | STOP",
        "UI_COMMIT: ...",
        "CODEX: ...",
        "MAKER: ...",
      ].join("\n");
    default:
      return "Structured review with explicit GO/NO-GO if applicable.";
  }
}

function generatePacketNode(roleKey, missionId = "crew-checkin") {
  const role = ROLES[roleKey];
  if (!role) throw new Error(`Unknown role: ${roleKey}`);

  const config = loadDispatchConfig();
  const mission = config.missions?.[missionId];
  if (!mission) throw new Error(`Unknown mission: ${missionId}`);

  const packetId = `${role.packetPrefix}_${missionId.toUpperCase().replace(/-/g, "_")}_v2_${timestampSlug().slice(0, 13)}`;
  const packetFile = path.join(PATHS.outbox, `${packetId}.md`);
  const pasteFile = path.join(PATHS.outbox, role.pasteBlockSuffix);

  const cockpitFiles = [...(config.cockpitSources || [])];
  if (mission.cockpitExtras) {
    for (const extra of mission.cockpitExtras) {
      if (!cockpitFiles.includes(extra)) cockpitFiles.push(extra);
    }
  }

  const cockpitTable = cockpitFiles.map((f) => `| \`${f}\` | cockpit source |`).join("\n");
  const cockpitList = cockpitFiles.map((f) => `   ${f}`).join("\n");
  const statusSnippet = [getNextActionHeadline(), "", getActiveWriterSnippet()].join("\n");
  const generatedAt = new Date().toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");

  const tokens = {
    ROLE_LABEL: role.label,
    ROLE_TITLE: role.title,
    ROLE_UPPER: role.label.toUpperCase(),
    ROLE_ID: role.id,
    ROLE_PLATFORM: role.platform,
    MISSION_ID: missionId,
    MISSION_LABEL: mission.label,
    MISSION_DESCRIPTION: mission.description,
    DISPATCH_STATUS: "READY FOR OPERATOR PREPARE",
    GENERATED_AT: generatedAt,
    PACKET_ID: packetId,
    PACKET_ABSPATH: packetFile,
    COCKPIT_TABLE: cockpitTable,
    COCKPIT_LIST: cockpitList,
    STATUS_SNIPPET: statusSnippet,
    ACTIVE_WRITER_SNIPPET: getActiveWriterSnippet(),
    NEXT_ACTION_HEADLINE: getNextActionHeadline(),
    ROLE_ACTION: roleActionText(role.id),
    ROLE_RESPONSE_FORMAT: roleResponseFormat(role.id),
  };

  const packetTemplate = fs.readFileSync(PACKET_TEMPLATE, "utf8");
  const pasteTemplate = fs.readFileSync(PASTE_TEMPLATE, "utf8");

  fs.mkdirSync(PATHS.outbox, { recursive: true });
  fs.writeFileSync(packetFile, expandTemplate(packetTemplate, tokens), "utf8");
  fs.writeFileSync(pasteFile, expandTemplate(pasteTemplate, tokens), "utf8");

  return { packetId, packetFile, pasteFile, role: roleKey, mission: missionId };
}

function runPs1(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", DISPATCH_PS1, ...args],
      { cwd: REPO_ROOT, windowsHide: true }
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("close", (code) => {
      if (code !== 0) reject(new Error(stderr.trim() || stdout.trim() || `PowerShell exit ${code}`));
      else resolve(stdout.trim());
    });
  });
}

function copyToClipboard(text) {
  return new Promise((resolve, reject) => {
    const child = spawn("powershell.exe", ["-NoProfile", "-Command", "Set-Clipboard -Value $input"], {
      cwd: REPO_ROOT,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("close", (code) => {
      if (code !== 0) reject(new Error(stderr.trim() || `Clipboard exit ${code}`));
      else resolve(true);
    });
    child.stdin.write(text);
    child.stdin.end();
  });
}

function openPath(targetPath) {
  return new Promise((resolve, reject) => {
    const child = spawn("cmd.exe", ["/c", "start", "", targetPath], {
      cwd: REPO_ROOT,
      windowsHide: true,
      shell: false,
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) reject(new Error(`Open failed: ${targetPath}`));
      else resolve(true);
    });
  });
}

function openFolder(folderPath) {
  return new Promise((resolve, reject) => {
    const child = spawn("explorer.exe", [folderPath], { windowsHide: true });
    child.on("error", reject);
    child.on("close", () => resolve(true));
  });
}

function loadCrewTabsConfig() {
  if (!fs.existsSync(CREW_TABS_CONFIG)) {
    throw new Error("Missing crew-tabs.config.json");
  }
  return JSON.parse(fs.readFileSync(CREW_TABS_CONFIG, "utf8"));
}

function findEdgeExecutable() {
  const candidates = [
    path.join(process.env["ProgramFiles(x86)"] || "", "Microsoft", "Edge", "Application", "msedge.exe"),
    path.join(process.env.ProgramFiles || "", "Microsoft", "Edge", "Application", "msedge.exe"),
  ];
  for (const exe of candidates) {
    if (exe && fs.existsSync(exe)) return exe;
  }
  throw new Error("Microsoft Edge not found");
}

function getCrewTab(cousinKey) {
  const config = loadCrewTabsConfig();
  const cousinId = CREW_COUSIN_IDS[cousinKey];
  if (!cousinId) throw new Error(`Unknown cousin: ${cousinKey}`);
  const tab = config.tabs.find((t) => t.id === cousinId);
  if (!tab) throw new Error(`No tab configured for ${cousinId}`);
  return tab;
}

function verifyPasteBlockFresh(cousinKey) {
  const tab = getCrewTab(cousinKey);
  const pasteRel = tab.pasteBlock;
  if (!pasteRel) return { ok: true, warning: null };
  const pastePath = path.join(REPO_ROOT, pasteRel.replace(/\//g, path.sep));
  if (!fs.existsSync(pastePath)) {
    throw new Error(`${path.basename(pastePath)} missing — generate packet first`);
  }
  const latest = loadJson(PATHS.latestDispatchJson);
  const stale = loadJson(PATHS.dispatchDashboardJson)?.staleWarning;
  let warning = null;
  if (latest?.role && latest.role !== cousinKey) {
    warning = `Latest dispatch was for ${latest.role}, not ${cousinKey}`;
  }
  if (stale?.petraPacketsBeforeSync?.includes("STALE") && cousinKey === "petra") {
    warning = (warning ? warning + ". " : "") + "Check LATEST_DISPATCH — stale packets flagged in cockpit";
  }
  return { ok: true, warning, pastePath, tab };
}

async function openAeyeCrewBay() {
  const config = loadCrewTabsConfig();
  const edge = findEdgeExecutable();
  const urls = [...config.tabs].sort((a, b) => a.tabIndex - b.tabIndex).map((t) => t.url);
  if (!urls.length) throw new Error("No crew tab URLs configured");

  const args = ["--new-window", `--user-data-dir=${EDGE_AEYE_PROFILE}`, ...urls];
  spawn(edge, args, { cwd: REPO_ROOT, detached: true, stdio: "ignore", windowsHide: true }).unref();

  return {
    success: true,
    message: `Aeye Crew Bay opened (${urls.length} tabs). STOP BEFORE SEND — paste manually.`,
    successLabel: "Bay open",
    tabCount: urls.length,
    humanGate: "No messages sent",
  };
}

async function loadCousinPacket(cousinKey, openBay = false) {
  const { warning, pastePath, tab } = verifyPasteBlockFresh(cousinKey);
  const text = fs.readFileSync(pastePath, "utf8");
  await copyToClipboard(text);
  if (openBay) {
    await openAeyeCrewBay();
  }
  const msg = `Loaded ${tab.name} — tab ${tab.tabIndex}. Clipboard ready. Ctrl+V then Send is YOUR gate.`;
  return {
    success: true,
    ok: true,
    message: warning ? `${msg} Warning: ${warning}` : msg,
    successLabel: "Loaded",
    cousin: tab.id,
    tabIndex: tab.tabIndex,
    tabName: tab.name,
    pasteFile: rel(pastePath),
    humanGate: "STOP BEFORE SEND",
  };
}

async function preparePetraDispatch() {
  await runPs1(["-Action", "Go", "-Mission", "crew-checkin", "-Role", "petra"]);
  return {
    success: true,
    message: "Petra packet fresh — clipboard loaded. Open crew bay or switch to Petra tab. STOP BEFORE SEND.",
    successLabel: "Ready",
  };
}

async function pinDesktopShortcuts() {
  const desktop = path.join(process.env.USERPROFILE || "", "Desktop");
  if (!fs.existsSync(desktop)) throw new Error("Desktop folder not found");

  const foremanShortcut = path.join(desktop, "Werkles - Foreman Dashboard.cmd");
  const bayShortcut = path.join(desktop, "Werkles - Aeye Crew Bay.cmd");

  const foremanBody = `@echo off\r\ntitle Werkles Foreman Dashboard\r\ncall "${path.join(REPO_ROOT, "foreman-control.cmd")}"\r\n`;
  const bayBody = `@echo off\r\ntitle Werkles Aeye Crew Bay\r\ncall "${OPEN_AEYE_CREW_CMD}"\r\n`;

  fs.writeFileSync(foremanShortcut, foremanBody, "utf8");
  fs.writeFileSync(bayShortcut, bayBody, "utf8");

  return {
    success: true,
    message: "Desktop shortcuts created — double-click Werkles - Foreman Dashboard",
    successLabel: "Pinned",
    shortcuts: [foremanShortcut, bayShortcut],
  };
}

function findGateReviewPath() {
  const gate = getNextActionHeadline();
  for (const [key, reviewPath] of Object.entries(GATE_REVIEW_MAP)) {
    if (gate.includes(key) && fs.existsSync(reviewPath)) return reviewPath;
  }
  if (!fs.existsSync(PATHS.reviews)) return null;
  const gateFiles = fs
    .readdirSync(PATHS.reviews)
    .filter((f) => /^GATE-.*\.html$/i.test(f))
    .map((f) => ({ f, m: fs.statSync(path.join(PATHS.reviews, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m);
  if (gateFiles.length) return path.join(PATHS.reviews, gateFiles[0].f);
  const fallback = path.join(PATHS.reviews, "AUTOMATION_AUTHORITY_REVIEW.html");
  return fs.existsSync(fallback) ? fallback : null;
}

function loadFinanceDashboard() {
  return loadJson(FINANCE_DASHBOARD_JSON);
}

async function refreshFinanceDashboard() {
  await runCommand("node", [FINANCE_COMMAND_MJS, "dashboard-json"]);
  const dash = loadFinanceDashboard();
  if (!dash) throw new Error("Finance dashboard JSON missing after refresh");
  return {
    success: true,
    message: `Finance dashboard refreshed (${dash.month})`,
    successLabel: "Refreshed",
    finance: dash,
  };
}

function formatFinanceCard(finance) {
  if (!finance) {
    return `<p class="muted">No finance dashboard yet — click <strong>Refresh Finance Dashboard</strong>.</p>`;
  }
  const entityRows = (finance.month_to_date_by_entity || [])
    .map((r) => `<li>${esc(r.entity_name)}: <strong>$${esc(String(r.amount_usd))}</strong></li>`)
    .join("");
  const warnRows = (finance.mismatch_warnings || [])
    .slice(0, 5)
    .map((w) => `<li><span class="muted">[${esc(w.severity)}]</span> ${esc(w.message)}</li>`)
    .join("");
  const financeBlocked = FINANCE_BLOCKED_ACTIONS.map(
    (b) => `<button type="button" class="btn blocked" data-action="${esc(b.id)}">${esc(b.label)}</button>`
  ).join("\n");

  return `
    <div class="banner ok-banner" style="margin-bottom:12px;font-weight:600">
      Local Operator Cockpit module only — not bank · not accounting · not moving money · not creating cards · no secrets
    </div>
    <p class="muted">Month <strong>${esc(finance.month)}</strong> · generated ${esc(finance.generated_at || "")}</p>
    <p><strong>AI/API this month:</strong> $${esc(String(finance.ai_api_spend_this_month_usd ?? 0))}</p>
    <p><strong>Unclassified:</strong> ${esc(String(finance.unclassified_count ?? 0))} ·
       <strong>Mismatches:</strong> ${esc(String(finance.mismatch_warning_count ?? 0))} ·
       <strong>Reimbursement queue:</strong> ${esc(String(finance.reimbursement_queue_count ?? 0))} ·
       <strong>SaaS review:</strong> ${esc(String(finance.recurring_saas_review_count ?? 0))}</p>
    <p class="muted">Month-to-date by entity:</p>
    <ul>${entityRows || "<li>(none this month)</li>"}</ul>
    <p class="muted">Mismatch warnings:</p>
    <ul>${warnRows || "<li>(none)</li>"}</ul>
    <div class="actions" style="margin-top:10px">
      <button type="button" class="btn primary" data-action="refresh-finance-dashboard">Refresh Finance Dashboard</button>
    </div>
    <p class="muted" style="margin-top:12px">Finance human gates — does not move money:</p>
    <div class="actions">${financeBlocked}</div>
  `;
}

function loadRelayStatusSync() {
  try {
    const sessionPath = path.join(REPO_ROOT, "foreman", "crew-dispatch", ".relay-session.json");
    const manifestPath = path.join(REPO_ROOT, "foreman", "crew-dispatch", "LATEST_NETWORK_COMMAND.json");
    let session = { state: "idle", cousins: [], steps: [], currentIndex: -1 };
    if (fs.existsSync(sessionPath)) {
      session = { ...session, ...JSON.parse(fs.readFileSync(sessionPath, "utf8")) };
    }
    let manifest = null;
    if (fs.existsSync(manifestPath)) {
      const m = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      manifest = {
        command: m.command,
        version: m.version,
        issued_at: m.issued_at,
        cousinCount: m.cousins?.length ?? 0,
        stale: false,
      };
    }
    const relayLock = loadJson(RELAY_LOCK_JSON) || { status: "IDLE" };
    const contextHealth = loadJson(CONTEXT_HEALTH_JSON);
    return { session, manifest, relayLock, contextHealth };
  } catch {
    return {
      session: { state: "idle", cousins: [], steps: [] },
      manifest: null,
      relayLock: { status: "IDLE" },
      contextHealth: null,
    };
  }
}

function formatContextHealthCard(contextHealth) {
  if (!contextHealth?.cousins) {
    return `<p class="muted">No context health file — see CONTEXT_HEALTH_PROTOCOL.md</p>`;
  }
  const rows = Object.entries(contextHealth.cousins)
    .map(([id, c]) => {
      const flag = c.resetRecommended ? " · <strong>RESET</strong>" : "";
      return `<li><code>${esc(id)}</code> load ${esc(c.contextLoad)} status ${esc(c.status || "OK")}${flag}</li>`;
    })
    .join("");
  return `
    <p class="muted">Expected gate: <code>${esc(contextHealth.expectedGate || "?")}</code></p>
    <ul>${rows}</ul>
    <div class="actions" style="margin-top:8px">
      <button type="button" class="btn" data-action="build-boot-petra">Boot Petra</button>
      <button type="button" class="btn" data-action="build-boot-bean">Boot Bean</button>
    </div>
  `;
}

function formatCourierLockBanner(relayLock) {
  if (!relayLock || relayLock.status !== "RUNNING") return "";
  return `<div class="banner" style="margin-bottom:16px;font-size:1.05rem">
    COURIER RUNNING — DO NOT CLICK EDGE · ${esc(relayLock.message || "")}
  </div>`;
}

const AEYE_RELAY_IDS = ["PETRA", "SKYBRO", "ENDER", "BEAN", "COMPUTER"];

function loadEdgeBayStatus(relay = null) {
  try {
    const config = loadCrewTabsConfig();
    const profileDir = path.join(REPO_ROOT, "foreman", ".edge-aeye-crew-profile");
    const session = relay?.session || { steps: [], state: "idle", currentIndex: -1, cousins: [] };
    const stepMap = Object.fromEntries((session.steps || []).map((s) => [s.cousinId, s]));
    const currentCousin = session.cousins?.[session.currentIndex ?? -1]?.cousinId;

    const tabs = config.tabs
      .filter((t) => AEYE_RELAY_IDS.includes(t.id))
      .sort((a, b) => a.tabIndex - b.tabIndex)
      .map((t) => {
        const step = stepMap[t.id];
        let relayStatus = "idle";
        if (step?.sentAt) relayStatus = "sent";
        else if (step?.deliveredAt) relayStatus = "pasted";
        else if (session.state === "awaiting_send" && currentCousin === t.id) relayStatus = "awaiting_send";
        else if (session.state === "delivering" && currentCousin === t.id) relayStatus = "delivering";
        return {
          id: t.id,
          name: t.name,
          tabIndex: t.tabIndex,
          url: t.url,
          relayStatus,
        };
      });

    const tabMapping = verifyAllRelayTabDestinations({ checkManifest: true });

    return {
      mode: config.mode || "edge-dispatch-bay",
      profileExists: fs.existsSync(profileDir),
      profileDir: "foreman/.edge-aeye-crew-profile",
      tabs,
      tabMapping,
      doctrine: "EDGE_EMBED_DOCTRINE.md",
    };
  } catch (e) {
    return { error: e.message };
  }
}

function formatEdgeDispatchBayCard(edgeBay) {
  if (edgeBay?.error) {
    return `<p class="muted">Edge bay status unavailable: ${esc(edgeBay.error)}</p>`;
  }

  const mappingOk = edgeBay.tabMapping?.ok !== false;
  const mappingBanner = mappingOk
    ? `<div class="banner ok-banner" style="margin-bottom:10px;font-size:.92rem">Tab mapping OK — config matches network manifest</div>`
    : `<div class="banner warn-banner" style="margin-bottom:10px">Tab mapping errors — run Verify Tab Mapping before relay</div>`;

  const relayLabel = (s) => {
    if (s === "sent") return "SENT";
    if (s === "pasted") return "PASTED";
    if (s === "awaiting_send") return "AWAITING SEND";
    if (s === "delivering") return "DELIVERING";
    return "idle";
  };

  const rows = (edgeBay.tabs || [])
    .map((t) => {
      const status = relayLabel(t.relayStatus);
      const active =
        t.relayStatus === "awaiting_send" || t.relayStatus === "delivering"
          ? " · <strong>active</strong>"
          : "";
      return `<tr><td>${esc(String(t.tabIndex))}</td><td><code>${esc(t.id)}</code></td><td>${esc(t.name)}</td><td>${esc(status)}${active}</td></tr>`;
    })
    .join("");

  const mappingErrors = (edgeBay.tabMapping?.errors || [])
    .slice(0, 5)
    .map((e) => `<li>${esc(e)}</li>`)
    .join("");

  return `
    <div class="banner ok-banner" style="margin-bottom:10px;font-size:.92rem">
      <strong>Separate Edge window</strong> — Robot Zone · <strong>no iframe</strong> of vendor AI chats in this dashboard
    </div>
    <p class="muted">Profile: <code>${esc(edgeBay.profileDir)}</code> ${edgeBay.profileExists ? "✓" : "(open bay once)"} · See <code>foreman/crew-dispatch/${esc(edgeBay.doctrine)}</code></p>
    ${mappingBanner}
    <table style="width:100%;border-collapse:collapse;font-size:.9rem;margin:10px 0">
      <thead><tr><th align="left">#</th><th align="left">Seat</th><th align="left">Name</th><th align="left">Relay</th></tr></thead>
      <tbody>${rows || "<tr><td colspan=\"4\">No tabs configured</td></tr>"}</tbody>
    </table>
    ${mappingErrors ? `<ul class="muted">${mappingErrors}</ul>` : ""}
    <div class="actions" style="margin-top:10px">
      <button type="button" class="btn primary" data-action="open-aeye-crew-bay">Open Aeye Crew Bay</button>
      <button type="button" class="btn" data-action="verify-aeye-tab-mapping">Verify Tab Mapping</button>
      <button type="button" class="btn" data-action="relay-courier-status">Courier Status</button>
    </div>
    <p class="muted" style="margin-top:8px">Focus tab only (no paste):</p>
    <div class="actions">
      <button type="button" class="btn" data-action="crew-courier-focus-petra">Focus Petra</button>
      <button type="button" class="btn" data-action="crew-courier-focus-skybro">Focus Skybro</button>
      <button type="button" class="btn" data-action="crew-courier-focus-ender">Focus Ender</button>
      <button type="button" class="btn" data-action="crew-courier-focus-bean">Focus Bean</button>
      <button type="button" class="btn" data-action="crew-courier-focus-computer">Focus Computer</button>
    </div>
  `;
}

function formatImageryDoctrineCard() {
  const doctrineExists = fs.existsSync(IMAGERY_DIRECTION);
  const ghostTemplateExists = fs.existsSync(IMAGERY_PROMPT_TEMPLATE);
  const wirePacketExists = fs.existsSync(ENDER_IMAGERY_WIRE_PACKET);
  return `
    <div class="banner ok-banner" style="margin-bottom:10px;font-size:.92rem">
      Viable with restrained grammar · transformation via cards, props, formation — <strong>not</strong> magical morphing
    </div>
    <p><strong>Doctrine:</strong> <code>foreman/IMAGERY_DIRECTION.md</code> ${doctrineExists ? "✓" : "(missing)"}</p>
    <p><strong>Ghost Forge prompts:</strong> <code>foreman/ghost-forge/IMAGERY_PROMPT_TEMPLATE.md</code> ${ghostTemplateExists ? "✓" : "(missing)"}</p>
    <p><strong>Gate 05:</strong> <code>PAUSE</code> · <strong>Product gate:</strong> APP_INFRA-01 · <strong>UI_COMMIT:</strong> HOLD</p>
    <p class="muted">No new assets from dashboard. Ender packet for placement/motion review only.</p>
    <div class="actions" style="margin-top:10px">
      <button type="button" class="btn primary" data-action="open-imagery-direction">Open Imagery Doctrine</button>
      <button type="button" class="btn" data-action="open-ender-imagery-packet">Open Ender Wire Packet</button>
      <button type="button" class="btn" data-action="generate-ender-imagery-packet">Generate Fresh Ender Packet</button>
    </div>
    <p class="muted" style="margin-top:8px">Wire packet: ${wirePacketExists ? "TO_ENDER_IMAGERY_DIRECTION_WIRE_v0.1.md" : "(generate fresh)"}</p>
  `;
}

function buildStatus() {
  const nextAction = readText(PATHS.nextAction);
  const currentState = readText(PATHS.currentState);
  const operator = readText(PATHS.operatorDashboard, 20);
  const dispatch = loadJson(PATHS.dispatchDashboardJson);
  const latest = loadJson(PATHS.latestDispatchJson);

  const pasteStatus = {};
  for (const [key, role] of Object.entries(ROLES)) {
    const pastePath = path.join(PATHS.outbox, role.pasteBlockSuffix);
    pasteStatus[key] = {
      file: role.pasteBlockSuffix,
      exists: fs.existsSync(pastePath),
      updatedAt: fs.existsSync(pastePath) ? fs.statSync(pastePath).mtime.toISOString() : null,
    };
  }

  const relay = loadRelayStatusSync();

  return {
    ok: true,
    repoRoot: REPO_ROOT,
    port: PORT,
    host: HOST,
    generatedAt: new Date().toISOString(),
    gate: parseEffectiveGate(nextAction.text),
    stateSummary: parseStateSummary(currentState.text),
    operatorSnippet: operator.text.split(/\r?\n/).slice(0, 12).join("\n"),
    dispatch: dispatch
      ? {
          generatedAt: dispatch.dashboardGeneratedAt || dispatch.generatedAt,
          mainHead: dispatch.cockpit?.mainHead,
          staleWarning: dispatch.staleWarning,
          latestDispatch: dispatch.latestDispatch,
        }
      : { missing: true },
    latestDispatch: latest,
    pasteStatus,
    gateReview: findGateReviewPath() ? rel(findGateReviewPath()) : null,
    inboxMarkdown: listInboxMarkdownFiles().slice(0, 8),
    outboxUnsent: listOutboxUnsent(),
    finance: loadFinanceDashboard(),
    relay,
    edgeBay: loadEdgeBayStatus(relay),
    automatica: buildAutomaticaStatus(),
    overseer: buildOverseerStatus(),
    mobileAccess: buildMobileAccessStatus(),
    machineHealth: buildMachineHealthStatus(),
    activeTask: loadActiveTaskStatus(),
    activeAgentSnippet: readText(PATHS.activeAgent, 10).text,
    budgetSnippet: readText(PATHS.budget, 10).text,
    gd: buildGdStatus(),
    crawlerPearls: buildCrawlerPearlsStatus(),
    swatterEvents: buildSwatterEventStreamStatus(),
    speaker: buildSpeakerStatus(REPO_ROOT),
  };
}

async function generatePacket(roleKey) {
  const role = ROLES[roleKey];
  if (!role) throw new Error(`Unknown role: ${roleKey}`);

  let result;
  if (role.ps1Role) {
    await runPs1(["-Action", "Generate", "-Mission", "crew-checkin", "-Role", role.ps1Role]);
    const packets = fs
      .readdirSync(PATHS.outbox)
      .filter((f) => f.startsWith(role.packetPrefix) && f.endsWith(".md"))
      .map((f) => ({ f, m: fs.statSync(path.join(PATHS.outbox, f)).mtimeMs }))
      .sort((a, b) => b.m - a.m);
    const packetFile = packets.length ? path.join(PATHS.outbox, packets[0].f) : null;
    result = {
      packetId: packets[0]?.f?.replace(/\.md$/, "") || null,
      packetFile,
      pasteFile: path.join(PATHS.outbox, role.pasteBlockSuffix),
      role: roleKey,
      mission: "crew-checkin",
    };
    await runPs1(["-Action", "Refresh"]);
  } else {
    result = generatePacketNode(roleKey, "crew-checkin");
    try {
      await runPs1(["-Action", "Refresh"]);
    } catch {
      /* optional */
    }
  }

  if (result.packetFile && fs.existsSync(result.packetFile)) {
    try {
      await stampRelayMetadata(result.packetFile, roleKey);
    } catch (e) {
      result.relayStampWarning = e.message;
    }
    await openPath(result.packetFile);
  }
  return {
    ...result,
    success: true,
    message: `${role.label} packet generated${result.relayStampWarning ? " (relay stamp warning: " + result.relayStampWarning + ")" : " + relay hashes"}`,
    successLabel: "Generated",
  };
}

async function copyPasteBlock(roleKey) {
  const role = ROLES[roleKey];
  if (!role) throw new Error(`Unknown role: ${roleKey}`);
  const pasteFile = path.join(PATHS.outbox, role.pasteBlockSuffix);
  if (!fs.existsSync(pasteFile)) {
    throw new Error(`${role.pasteBlockSuffix} not found — generate packet first`);
  }
  const text = fs.readFileSync(pasteFile, "utf8");
  await copyToClipboard(text);
  return {
    success: true,
    ok: true,
    file: role.pasteBlockSuffix,
    chars: text.length,
    message: `Copied ${role.pasteBlockSuffix} to clipboard`,
    successLabel: "Copied",
    humanGate: "STOP BEFORE SEND — paste manually",
  };
}

const NETWORK_COUSIN_IDS = {
  petra: "PETRA",
  skybro: "SKYBRO",
  ender: "ENDER",
  bean: "BEAN",
  computer: "COMPUTER",
};

function loadLatestNetworkManifest() {
  if (!fs.existsSync(LATEST_NETWORK_COMMAND_JSON)) {
    throw new Error("No network command issued — run Issue Role Awareness Sync first");
  }
  return JSON.parse(fs.readFileSync(LATEST_NETWORK_COMMAND_JSON, "utf8"));
}

async function issueNetworkRoleSync() {
  await runNodeScript(CREW_RELAY_NETWORK_CMD, ["issue"]);
  const manifest = loadLatestNetworkManifest();
  const masterAbs = path.join(REPO_ROOT, ...manifest.masterCommandFile.split("/"));
  if (fs.existsSync(masterAbs)) {
    await openPath(masterAbs);
  }
  const summary = manifest.cousins
    .map((c) => `Tab ${c.edgeTabIndex} ${c.name}: ${c.packetFile}`)
    .join("\n");
  return {
    success: true,
    ok: true,
    title: "AEYE Network — ROLE_AWARENESS_SYNC issued",
    content: `${manifest.command} ${manifest.version}\nIssued: ${manifest.issued_at}\n\n${summary}\n\nSee ${manifest.masterCommandFile}`,
    message: "First network command issued — master walkthrough opened",
    successLabel: "Issued",
    humanGate: "Load each cousin network paste → Edge tab → Ben Send",
  };
}

async function copyNetworkPaste(cousinKey) {
  const cousinId = NETWORK_COUSIN_IDS[cousinKey];
  if (!cousinId) throw new Error(`Unknown network cousin: ${cousinKey}`);
  const manifest = loadLatestNetworkManifest();
  const cousin = manifest.cousins.find((c) => c.cousinId === cousinId);
  if (!cousin) throw new Error(`${cousinId} not in latest network manifest`);
  const pasteFile = path.join(PATHS.outbox, cousin.pasteBlockSuffix);
  if (!fs.existsSync(pasteFile)) {
    throw new Error(`${cousin.pasteBlockSuffix} missing — re-issue network sync`);
  }
  const text = fs.readFileSync(pasteFile, "utf8");
  await copyToClipboard(text);
  return {
    success: true,
    ok: true,
    file: cousin.pasteBlockSuffix,
    chars: text.length,
    title: `Network paste — ${cousin.name}`,
    content: text,
    message: `Copied ${cousin.pasteBlockSuffix} (Edge tab ${cousin.edgeTabIndex})`,
    successLabel: "Copied",
    humanGate: "STOP BEFORE SEND — paste into Edge tab manually",
  };
}

async function deliverNetworkCourier(cousinKey, options = {}) {
  const cousinId = NETWORK_COUSIN_IDS[cousinKey];
  if (!cousinId) throw new Error(`Unknown network cousin: ${cousinKey}`);
  loadLatestNetworkManifest();
  const args = ["deliver", "--cousin", cousinId, "--kind", "network"];
  if (options.ensureEdge) args.push("--ensure-edge");
  if (options.tabOnly) args.push("--tab-only");
  const out = await runNodeScriptAllowFail(RELAY_COURIER_MJS, args);
  if (out.code !== 0) {
    let parsed = null;
    try {
      parsed = JSON.parse(out.stdout || out.stderr);
    } catch {
      /* ignore */
    }
    if (parsed?.status === "MANUAL_LOAD_REQUIRED" || parsed?.loadFailed) {
      return {
        ok: false,
        success: false,
        loadFailed: true,
        title: `Courier — MANUAL LOAD REQUIRED`,
        content: parsed?.error || out.stderr || out.stdout,
        message: "MANUAL LOAD REQUIRED — not AWAITING SEND",
        successLabel: "Manual load",
        humanGate: "MANUAL LOAD REQUIRED",
      };
    }
    if (parsed?.blocked) {
      return {
        ok: false,
        success: false,
        blocked: true,
        title: "Courier blocked",
        content: (parsed.errors || []).join("\n"),
        message: "HUMAN GATE REQUIRED — packet blocked",
        successLabel: "Blocked",
      };
    }
    throw new Error(out.stderr.trim() || out.stdout.trim() || "Relay courier failed");
  }
  const result = JSON.parse(out.stdout);
  if (!result.ok) {
    return {
      ok: false,
      success: false,
      loadFailed: Boolean(result.loadFailed),
      title: result.status === "MANUAL_LOAD_REQUIRED" ? "MANUAL LOAD REQUIRED" : "Courier failed",
      content: result.error || JSON.stringify(result, null, 2),
      message: result.humanGate || result.message || "Courier failed",
      successLabel: result.loadFailed ? "Manual load" : "Failed",
      humanGate: result.humanGate,
    };
  }
  return {
    success: true,
    ok: true,
    title: `Relay Courier — ${result.name}`,
    content: `Tab ${result.tabIndex}\nClass: ${result.dispatchClass}\n\n${result.humanGate}`,
    message: `Tab ${result.tabIndex} ${result.name} — loaded. ${result.humanGate}`,
    successLabel: "Loaded",
    tabIndex: result.tabIndex,
    cousin: cousinId,
    humanGate: result.humanGate,
  };
}

async function loadRelayModule() {
  return import(pathToFileURL(CREW_RELAY_RUNNER).href);
}

function formatCardLocalityProof(locality, label = "card") {
  const proof = normalizeCardLocality(locality, {});
  return `
    <dl class="card-locality-proof" data-card-locality="${esc(label)}">
      <div><dt>Last action</dt><dd data-card-last-action>${esc(proof.last_action || "none yet")}</dd></div>
      <div><dt>Last receipt</dt><dd><code data-card-last-receipt>${esc(proof.last_receipt || "none yet")}</code></dd></div>
      <div><dt>Last actor</dt><dd data-card-last-actor>${esc(proof.last_actor || CARD_LOCALITY_ACTOR)}</dd></div>
      <div><dt>Last timestamp</dt><dd data-card-last-timestamp>${esc(proof.last_timestamp || "none yet")}</dd></div>
    </dl>`;
}

function formatRelayPanel(session, manifestMeta, relayLock = null) {
  const state = session?.state || "idle";
  const idx = session?.currentIndex ?? -1;
  const cousin = session?.cousins?.[idx];
  const steps = session?.steps || [];
  const done = steps.filter((s) => s.sentAt).length;
  const total = session?.cousins?.length || 5;

  let stateLabel = state.replace(/_/g, " ").toUpperCase();
  let progress = `${done}/${total} sent`;
  if (state === "awaiting_send" && cousin) {
    progress = `Tab ${cousin.edgeTabIndex} ${cousin.name} — paste delivered, waiting for Send`;
  }
  if (state === "complete") progress = "All tabs delivered";

  const stepRows = steps
    .map((s) => {
      const mark = s.sentAt ? "SENT" : s.deliveredAt ? "PASTED" : "pending";
      return `<li><code>${esc(s.cousinId)}</code> tab ${s.edgeTabIndex} — ${esc(mark)}</li>`;
    })
    .join("");

  const staleNote =
    manifestMeta?.stale === true
      ? `<p class="banner warn-banner">Manifest may be stale — Run Relay will auto reissue fresh packets.</p>`
      : "";

  const canStart = ["idle", "complete", "cancelled", "error"].includes(state);
  const canSent = state === "awaiting_send";
  const canCancel = ["awaiting_send", "delivering", "preparing"].includes(state);
  const canReset = !["idle"].includes(state) || (relayLock?.status === "RUNNING");
  const relayLocality = normalizeCardLocality(session || {}, {
    action: state === "idle" ? null : state,
    receipt: rel(path.join(REPO_ROOT, "foreman", "crew-dispatch", ".relay-session.json")),
    timestamp: session?.updatedAt || session?.startedAt || null,
  });

  return `
    ${staleNote}
    <div class="relay-status" id="relay-status-box">
      <p><strong>State:</strong> <code id="relay-state">${esc(stateLabel)}</code></p>
      <p id="relay-progress">${esc(progress)}</p>
      <p class="muted" id="relay-message">${esc(session?.message || "Ready. One button runs the full mechanical relay.")}</p>
      <p class="banner ok-banner" id="relay-gate" style="${session?.humanGate ? "" : "display:none"}">${esc(session?.humanGate || "")}</p>
      <ul id="relay-steps">${stepRows || "<li>No active relay</li>"}</ul>
    </div>
    ${formatCardLocalityProof(relayLocality, "relay")}
    <div class="actions" style="margin-top:12px">
      <button type="button" class="btn primary" id="relay-start" ${canStart ? "" : "disabled"}>Run Network Sync Relay</button>
      <button type="button" class="btn hero" id="relay-sent" ${canSent ? "" : "disabled"}>I Sent - Next Cousin</button>
      <button type="button" class="btn" id="relay-cancel" ${canCancel ? "" : "disabled"}>Cancel Relay</button>
      <button type="button" class="btn" id="relay-reset" ${canReset ? "" : "disabled"}>Reset Stuck Relay</button>
    </div>
    <p class="muted" style="margin-top:10px">Mechanical steps are automated. You only click <strong>Send</strong> in Edge and <strong>I Sent</strong> here. See <code>CREW_RELAY_AUTOMATION.md</code>.</p>
  `;
}

async function relayApiStart(reissue = false) {
  const mod = await loadRelayModule();
  const result = await mod.startNetworkRelay({ reissue });
  const locality = cardLocalityFields({
    action: "send",
    receipt: rel(path.join(REPO_ROOT, "foreman", "crew-dispatch", ".relay-session.json")),
    timestamp: result.session?.updatedAt || new Date().toISOString(),
  });
  return {
    ok: true,
    success: true,
    session: result.session,
    message: result.session.message,
    humanGate: result.session.humanGate,
    successLabel: "Relay started",
    ...locality,
  };
}

async function relayApiSent() {
  const mod = await loadRelayModule();
  const result = await mod.confirmRelaySent();
  const locality = cardLocalityFields({
    action: "send",
    receipt: rel(path.join(REPO_ROOT, "foreman", "crew-dispatch", ".relay-session.json")),
    timestamp: result.session?.updatedAt || new Date().toISOString(),
  });
  return {
    ok: true,
    success: true,
    session: result.session,
    complete: result.complete,
    message: result.session.message,
    humanGate: result.session.humanGate,
    successLabel: result.complete ? "Complete" : "Next tab",
    ...locality,
  };
}

async function relayApiCancel() {
  const mod = await loadRelayModule();
  const result = mod.cancelRelay();
  return {
    ok: true,
    success: true,
    ...result,
    message: "Relay cancelled",
    successLabel: "Cancelled",
    ...cardLocalityFields({
      action: "archive",
      receipt: rel(path.join(REPO_ROOT, "foreman", "crew-dispatch", ".relay-session.json")),
      timestamp: result.session?.updatedAt || new Date().toISOString(),
    }),
  };
}

async function relayApiReset() {
  const mod = await loadRelayModule();
  const result = mod.resetRelay();
  return {
    ok: true,
    success: true,
    ...result,
    message: "Relay reset",
    successLabel: "Reset",
    ...cardLocalityFields({
      action: "reset",
      receipt: rel(path.join(REPO_ROOT, "foreman", "crew-dispatch", ".relay-session.json")),
      timestamp: result.session?.updatedAt || new Date().toISOString(),
    }),
  };
}

function startNetworkCourierWalk(options = {}) {
  try {
    loadLatestNetworkManifest();
  } catch (e) {
    throw new Error(e.message);
  }
  const psArgs = ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", CREW_EDGE_COURIER_PS1, "-RepoRoot", REPO_ROOT, "-WalkNetworkSync"];
  if (options.ensureEdge) psArgs.push("-EnsureEdge");
  spawn("powershell.exe", psArgs, { cwd: REPO_ROOT, detached: true, stdio: "ignore", windowsHide: false }).unref();
  return {
    success: true,
    ok: true,
    title: "Network courier walk",
    content: "PowerShell courier walk started.\n\nFor each tab: review paste → Send manually → Enter for next cousin.\n\nAfter all five: save FROM_* to inbox → Validate → Process.",
    message: "Courier walk opened — Send stays your gate between tabs",
    successLabel: "Walk started",
    humanGate: "STOP BEFORE SEND on each tab",
  };
}

function loadGdMissionClasses() {
  if (!fs.existsSync(GD_MISSION_CLASSES)) return [];
  try {
    const registry = JSON.parse(fs.readFileSync(GD_MISSION_CLASSES, "utf8"));
    return Object.entries(registry.missionClasses || {}).map(([id, def]) => ({
      id,
      label: def.label,
      generationMode: def.generationMode || null,
      recipients: def.recipients || [],
    }));
  } catch {
    return [];
  }
}

function gdOption(id, label, hint = "") {
  return { id, label, hint };
}

function uniqueGdOptions(options) {
  const seen = new Set();
  return options.filter((option) => {
    const key = String(option?.id || option?.label || "").toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function readCurrentGitBranch() {
  const headPath = path.join(REPO_ROOT, ".git", "HEAD");
  if (!fs.existsSync(headPath)) return "UNKNOWN";
  const head = fs.readFileSync(headPath, "utf8").trim();
  if (head.startsWith("ref: refs/heads/")) return head.replace("ref: refs/heads/", "");
  return head ? `detached:${head.slice(0, 12)}` : "UNKNOWN";
}

function buildGdRoutingOptions() {
  const currentBranch = readCurrentGitBranch();
  const missionAreas = loadGdMissionClasses().map((mission) =>
    gdOption(`mission:${mission.id}`, mission.label || mission.id, mission.id)
  );
  const automaticaAreas = loadAutomaticaRouteMap().map((route) =>
    gdOption(
      `automatica:${route.route_id}`,
      route.card_label || route.route_id,
      [route.target_owner, route.target_machine].filter(Boolean).join(" / ")
    )
  );

  return {
    projects: uniqueGdOptions([
      gdOption("werkles", "Werkles"),
      gdOption("soledash_lighttrip", "SoleDash / LightTrip"),
      gdOption("wonka_den", "Wonka Den"),
      gdOption("workstation_2_0", "Workstation 2.0"),
      gdOption("aeye_fleet", "Aeye Fleet"),
      gdOption("spanzee", "Spanzee"),
      gdOption("kind_sir", "Kind Sir"),
      gdOption("gimpdash", "GimpDash"),
    ]),
    areas: uniqueGdOptions([
      gdOption("ops:intent_router", "Intent Router"),
      gdOption("ops:operator_ui", "Operator UI Stack"),
      gdOption("ops:mobile_sd", "Mobile SD"),
      gdOption("ops:fleet_state", "Fleet State"),
      gdOption("ops:remote_access", "Remote Access"),
      ...automaticaAreas,
      ...missionAreas,
    ]),
    agents: [
      gdOption("governor", "Governor decides"),
      gdOption("petra", "Petra"),
      gdOption("maker", "Maker"),
      gdOption("dink", "Dink"),
      gdOption("dink2", "Dink2"),
      gdOption("dink4", "Dink4"),
      gdOption("bean", "Bean"),
      gdOption("ender", "Ender"),
      gdOption("thufir_skybro", "Thufir / Skybro"),
      gdOption("computer", "Computer"),
    ],
    machines: [
      gdOption("governor", "Governor decides"),
      gdOption("betsy", "Betsy"),
      gdOption("doss", "Doss"),
      gdOption("sally", "Sally"),
      gdOption("spanzee", "Spanzee"),
      gdOption("research_surface", "Research surface"),
      gdOption("maker_surface", "Maker surface"),
      gdOption("not_machine_bound", "Not machine-bound"),
    ],
    branches: uniqueGdOptions([
      gdOption("generate", "Generate from route"),
      gdOption("current", currentBranch === "UNKNOWN" ? "Current branch unknown" : `Current: ${currentBranch}`),
      gdOption("main", "main"),
      gdOption("ben_sandbox", "ben-sandbox"),
      gdOption("sally_rescue", "rescue/sally-dirty-worktree-2026-06-01"),
    ]),
    paths: [
      gdOption("repo_root", "."),
      gdOption("foreman_soledash", "foreman/soledash"),
      gdOption("foreman_soledash_actions", "foreman/soledash/actions"),
      gdOption("foreman_soledash_receipts", "foreman/soledash/receipts"),
      gdOption("foreman_overseer", "foreman/overseer"),
      gdOption("foreman_gd_intent_router", "foreman/gd-intent-router"),
      gdOption("foreman_handoffs_outbox", "foreman/handoffs/outbox"),
      gdOption("foreman_handoffs_inbox", "foreman/handoffs/inbox"),
      gdOption("scripts_foreman", "scripts/foreman"),
      gdOption("app_soledash", "app/soledash"),
      gdOption("company", "company"),
    ],
    returnReceiptTo: [
      gdOption("soledash_receipts", "foreman/soledash/receipts"),
      gdOption("overseer_receipts", "foreman/overseer/receipts"),
      gdOption("mobile_receipts", "foreman/soledash/mobile/receipts"),
      gdOption("workstation_2_queue", "Workstation 2.0 Queue"),
      gdOption("handoffs_inbox", "foreman/handoffs/inbox"),
      gdOption("speaker_log", "Speaker log"),
    ],
  };
}

function normalizeRoutingChoice(value) {
  if (value && typeof value === "object") {
    const id = String(value.id || value.value || "").trim();
    const label = String(value.label || value.text || id || "").trim();
    return { id, label };
  }
  const text = String(value || "").trim();
  return { id: text, label: text };
}

function cleanRoutingText(value, maxLength = 1200) {
  return String(value || "").replace(/\0/g, "").trim().slice(0, maxLength);
}

function routingChoiceLabel(routing, key) {
  const choice = routing?.[key];
  if (choice && typeof choice === "object") return choice.label || choice.id || "";
  return String(choice || "");
}

function routingChoiceId(routing, key) {
  const choice = routing?.[key];
  if (choice && typeof choice === "object") return choice.id || choice.label || "";
  return String(choice || "");
}

function normalizeGdStructuredRouting(raw) {
  if (!raw || typeof raw !== "object") return null;
  const routing = {
    project: normalizeRoutingChoice(raw.project),
    area: normalizeRoutingChoice(raw.area),
    agent: normalizeRoutingChoice(raw.agent),
    machine: normalizeRoutingChoice(raw.machine),
    branch: normalizeRoutingChoice(raw.branch),
    path: normalizeRoutingChoice(raw.path),
    return_receipt_to: normalizeRoutingChoice(raw.return_receipt_to || raw.returnReceiptTo),
    need: cleanRoutingText(raw.need),
    project_description: cleanRoutingText(raw.project_description || raw.projectDescription),
    special_instructions: cleanRoutingText(raw.special_instructions || raw.specialInstructions),
  };
  const branchId = routingChoiceId(routing, "branch");
  if (branchId === "generate") {
    const routeSeed = [
      routingChoiceLabel(routing, "project"),
      routingChoiceLabel(routing, "area"),
      routing.need,
    ].filter(Boolean).join(" ");
    routing.generated_branch = `work/${cleanIntentSlug(routeSeed || "route")}`;
  }
  return routing;
}

function formatGdStructuredRoutingIntent(routing) {
  if (!routing) return "";
  const branchLabel = routing.generated_branch
    ? `${routingChoiceLabel(routing, "branch")} (${routing.generated_branch})`
    : routingChoiceLabel(routing, "branch");
  const lines = [
    ["Need", routing.need],
    ["Project", routingChoiceLabel(routing, "project")],
    ["Area", routingChoiceLabel(routing, "area")],
    ["Agent", routingChoiceLabel(routing, "agent")],
    ["Machine", routingChoiceLabel(routing, "machine")],
    ["Branch", branchLabel],
    ["Path", routingChoiceLabel(routing, "path")],
    ["Return receipt to", routingChoiceLabel(routing, "return_receipt_to")],
    ["Project description", routing.project_description],
    ["Special instructions", routing.special_instructions],
  ];
  return lines
    .filter(([, value]) => String(value || "").trim())
    .map(([label, value]) => `${label}: ${String(value).trim()}`)
    .join("\n");
}

const PROJECT_LOCK_DECISIONS = ["Allowed", "Blocked", "Needs Merge"];
const PROJECT_LOCK_ACTIVE_STATUS = "active";

function projectLockStamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function seedProjectLocksState() {
  return {
    schema_version: "SOLEDASH_PROJECT_LOCKS.v0.1",
    updated_at: new Date().toISOString(),
    path: rel(PROJECT_LOCKS_JSON),
    policy:
      "One active owner_agent/owner_machine/branch lock per project_id. New cards touching the same project are Allowed, Blocked, or Needs Merge automatically.",
    decisions: PROJECT_LOCK_DECISIONS,
    active_locks: [],
    events: [],
  };
}

function normalizeProjectLock(lock) {
  const now = new Date().toISOString();
  const projectId = cleanIntentSlug(lock?.project_id || lock?.project || "unknown_project");
  const branch = String(lock?.branch || "UNKNOWN").trim() || "UNKNOWN";
  return {
    lock_id: cleanLocalityId(lock?.lock_id || `project_lock_${projectId}_${cleanIntentSlug(branch)}`, `project_lock_${projectId}`),
    project_id: projectId,
    owner_agent: String(lock?.owner_agent || "UNKNOWN").trim() || "UNKNOWN",
    owner_machine: String(lock?.owner_machine || "UNKNOWN").trim() || "UNKNOWN",
    branch,
    status: String(lock?.status || PROJECT_LOCK_ACTIVE_STATUS).toLowerCase(),
    source_card_id: lock?.source_card_id || null,
    action_id: lock?.action_id || null,
    action_path: lock?.action_path || null,
    receipt_path: lock?.receipt_path || null,
    created_at: lock?.created_at || now,
    updated_at: lock?.updated_at || now,
    reason: lock?.reason || `Active work on branch ${branch}.`,
  };
}

function saveProjectLocksState(state) {
  fs.mkdirSync(path.dirname(PROJECT_LOCKS_JSON), { recursive: true });
  const activeById = new Map();
  for (const lock of Array.isArray(state?.active_locks) ? state.active_locks : []) {
    const normalized = normalizeProjectLock(lock);
    activeById.set(normalized.lock_id, normalized);
  }
  const next = {
    schema_version: state?.schema_version || "SOLEDASH_PROJECT_LOCKS.v0.1",
    updated_at: new Date().toISOString(),
    path: rel(PROJECT_LOCKS_JSON),
    policy: state?.policy || seedProjectLocksState().policy,
    decisions: PROJECT_LOCK_DECISIONS,
    active_locks: [...activeById.values()].filter((lock) => lock.status === PROJECT_LOCK_ACTIVE_STATUS),
    events: Array.isArray(state?.events) ? state.events.slice(0, 120) : [],
  };
  fs.writeFileSync(PROJECT_LOCKS_JSON, JSON.stringify(next, null, 2), "utf8");
  return next;
}

function loadProjectLocksState() {
  const state = loadJson(PROJECT_LOCKS_JSON);
  return saveProjectLocksState(state || seedProjectLocksState());
}

function resolveProjectId(dispatchCard, routing, intent = "") {
  const explicitProject = routingChoiceId(routing, "project") || routingChoiceLabel(routing, "project");
  const source = explicitProject && !isGovernorRoutingChoice(routing, "project")
    ? explicitProject
    : dispatchCard?.project_id || dispatchCard?.route_id || dispatchCard?.title || intent || "unclassified_project";
  return cleanIntentSlug(source || "unclassified_project");
}

function resolveProjectBranch(routing, fallbackSeed = "route") {
  if (routing?.generated_branch) return routing.generated_branch;
  const branchId = String(routingChoiceId(routing, "branch") || "").trim();
  const branchLabel = String(routingChoiceLabel(routing, "branch") || "").trim();
  if (!branchId || branchId === "generate") return `work/${cleanIntentSlug(branchLabel || fallbackSeed || "route")}`;
  if (branchId === "current") return readCurrentGitBranch();
  return branchLabel && branchLabel !== "Generate from route" ? branchLabel : branchId;
}

function isBaseBranch(branch) {
  const value = String(branch || "").trim().toLowerCase();
  return value === "main" || value === "master" || value === "trunk";
}

function projectLockOwnerFromDispatch(dispatchCard) {
  return {
    owner_agent: dispatchCard?.best_aeye || "UNKNOWN",
    owner_machine: dispatchCard?.best_machine || "UNKNOWN",
  };
}

function evaluateProjectLock({ dispatchCard, routing, intent = "" }) {
  const project_id = resolveProjectId(dispatchCard, routing, intent);
  const branch = resolveProjectBranch(routing, dispatchCard?.title || dispatchCard?.route_id || intent || "route");
  const { owner_agent, owner_machine } = projectLockOwnerFromDispatch(dispatchCard);
  const state = loadProjectLocksState();
  const activeLocks = (state.active_locks || []).filter((lock) => lock.project_id === project_id);
  const sameBranch = activeLocks.find((lock) => lock.branch === branch);
  if (sameBranch) {
    return {
      decision: "Allowed",
      project_id,
      owner_agent,
      owner_machine,
      branch,
      reason: `Allowed on existing active project lock for branch ${branch}.`,
      blocker: "none",
      lock_action: "attach",
      active_lock: sameBranch,
      lock_path: state.path,
      confidence: "high",
    };
  }
  if (!activeLocks.length) {
    return {
      decision: "Allowed",
      project_id,
      owner_agent,
      owner_machine,
      branch,
      reason: "Allowed: no active work lock exists for this project.",
      blocker: "none",
      lock_action: "create",
      active_lock: null,
      lock_path: state.path,
      confidence: "high",
    };
  }
  const active = activeLocks[0];
  const needsMerge = isBaseBranch(branch) || isBaseBranch(active.branch);
  return {
    decision: needsMerge ? "Needs Merge" : "Blocked",
    project_id,
    owner_agent,
    owner_machine,
    branch,
    reason: needsMerge
      ? `Needs merge before touching ${branch}; active work is on branch ${active.branch}.`
      : `Blocked by active work on branch ${active.branch}.`,
    blocker: needsMerge
      ? `Needs merge from active branch ${active.branch}.`
      : `Blocked by active work on branch ${active.branch}.`,
    lock_action: "blocked",
    active_lock: active,
    lock_path: state.path,
    confidence: "high",
  };
}

function applyProjectLockToDispatchCard(card, routing, intent = "") {
  const projectLock = evaluateProjectLock({ dispatchCard: card, routing, intent });
  return {
    ...card,
    project_id: projectLock.project_id,
    owner_agent: projectLock.owner_agent,
    owner_machine: projectLock.owner_machine,
    branch: projectLock.branch,
    project_lock: projectLock,
    lock_decision: projectLock.decision,
    blocker: projectLock.blocker,
    evidence: [
      ...(card.evidence || []),
      `Project lock decision: ${projectLock.decision}`,
      projectLock.reason,
    ],
  };
}

function acquireProjectLock(dispatchCard, context = {}) {
  const current = evaluateProjectLock({
    dispatchCard,
    routing: dispatchCard?.structured_routing,
    intent: dispatchCard?.intent || "",
  });
  if (current.decision !== "Allowed") return current;
  const state = loadProjectLocksState();
  const now = new Date().toISOString();
  const existingIndex = (state.active_locks || []).findIndex(
    (lock) => lock.project_id === current.project_id && lock.branch === current.branch
  );
  let lock;
  if (existingIndex >= 0) {
    lock = {
      ...state.active_locks[existingIndex],
      owner_agent: current.owner_agent,
      owner_machine: current.owner_machine,
      source_card_id: context.source_card_id || state.active_locks[existingIndex].source_card_id || null,
      action_id: context.action_id || state.active_locks[existingIndex].action_id || null,
      action_path: context.action_path || state.active_locks[existingIndex].action_path || null,
      receipt_path: context.receipt_path || state.active_locks[existingIndex].receipt_path || null,
      updated_at: now,
      reason: `Active work on branch ${current.branch}.`,
    };
    state.active_locks[existingIndex] = lock;
  } else {
    lock = {
      lock_id: `project_lock_${current.project_id}_${cleanIntentSlug(current.branch)}_${projectLockStamp()}`,
      project_id: current.project_id,
      owner_agent: current.owner_agent,
      owner_machine: current.owner_machine,
      branch: current.branch,
      status: PROJECT_LOCK_ACTIVE_STATUS,
      source_card_id: context.source_card_id || null,
      action_id: context.action_id || null,
      action_path: context.action_path || null,
      receipt_path: context.receipt_path || null,
      created_at: now,
      updated_at: now,
      reason: `Active work on branch ${current.branch}.`,
    };
    state.active_locks = [lock, ...(state.active_locks || [])];
  }
  state.events = [
    {
      at: now,
      event: existingIndex >= 0 ? "project_lock_attached" : "project_lock_created",
      project_id: current.project_id,
      branch: current.branch,
      owner_agent: current.owner_agent,
      owner_machine: current.owner_machine,
      action_id: context.action_id || null,
      receipt_path: context.receipt_path || null,
    },
    ...(state.events || []),
  ];
  const saved = saveProjectLocksState(state);
  return {
    ...current,
    active_lock: lock,
    lock_acquired: true,
    lock_path: saved.path,
    reason: existingIndex >= 0
      ? `Allowed: attached to existing project lock on branch ${current.branch}.`
      : `Allowed: active project lock created on branch ${current.branch}.`,
  };
}

const CRAWLER_PEARL_STATES = ["New", "Reviewed", "Promoted to Task", "Archived", "Killed"];
const CRAWLER_PEARL_TERMINAL_STATES = new Set(["Promoted to Task", "Archived", "Killed"]);
const SWATTER_CLASSES = ["GREEN", "BLUE", "RED"];

function loadActiveTaskStatus() {
  return loadJson(ACTIVE_TASK_JSON) || {
    schema_version: "SOLEDASH_ACTIVE_TASK.v0.1",
    status: "unknown",
    blocker: "No active task file written yet.",
  };
}

const MACHINE_HEALTH_STATUSES = ["GREEN", "WATCH", "DEGRADED", "STOP", "QUARANTINE"];
const MACHINE_HEALTH_STATE_SCHEMA = {
  schema_version: "MACHINE_HEALTH_TRUTH_SOURCE.v0.2",
  source_of_truth: "foreman/soledash/MACHINE_HEALTH.json",
  allowed_states: MACHINE_HEALTH_STATUSES,
  required_state_change_fields: ["reason", "state_changed_at", "state_receipt_path"],
  local_petra_copies_allowed: false,
  rule: "All Petra instances and Aeyes read machine state from this single file. No local Petra copy may mutate or override machine state.",
  state_meanings: {
    GREEN: "Healthy",
    WATCH: "Possible issue",
    DEGRADED: "Partial functionality",
    STOP: "Unavailable",
    QUARANTINE: "Known harmful condition",
  },
};
const MACHINE_HEALTH_DEFAULT_RULES = [
  {
    rule_id: "DEV_SERVER_WEDGED",
    when: {
      port_listening: true,
      route_timed_out: true,
    },
    machine_status: "WATCH",
    reason: "DEV_SERVER_WEDGED",
    queue_action: "do_not_reroute",
    stop_only_if: [
      "shell_fails_system_wide",
      "repo_inaccessible",
      "repeated_restart_failure",
    ],
  },
  {
    rule_id: "SALLY_DEGRADED_PARTIAL_FUNCTIONALITY",
    machine_id: "sally",
    machine_status: "DEGRADED",
    reason: "Persistent Cursor launch/cmd integration failure.",
    lane: "Crawler/Swatter read-only only",
    build_allowed: false,
    cursor_allowed: false,
    terminal_allowed: false,
    reroute_build_work_to: "Doss",
    allowed_work: [
      "browser review",
      "visual audits",
      "reading crawler pearls",
      "non-terminal observation",
    ],
  },
  {
    rule_id: "BLOCKING_MODAL_QUARANTINE",
    when: {
      stuck_blocking_modal: true,
    },
    machine_status: "QUARANTINE",
    reason: "BLOCKING_MODAL",
    build_allowed: false,
    queue_action: "do_not_build",
    green_return_requires: [
      "modal_cleared",
      "shell_verified",
      "cursor_verified_if_cursor_work_required",
    ],
  },
];
const WORK_QUEUE_TERMINAL_STATUSES = new Set(["completed", "cancelled", "archived", "killed"]);

function normalizeMachineStatus(value, fallback = "WATCH") {
  const normalized = String(value || "").trim().toUpperCase();
  if (MACHINE_HEALTH_STATUSES.includes(normalized)) return normalized;
  if (normalized === "AVAILABLE") return "GREEN";
  if (normalized === "UNAVAILABLE") return "STOP";
  if (normalized === "PARTIAL" || normalized === "LIMITED" || normalized === "PARTIAL_FUNCTIONALITY") return "DEGRADED";
  if (normalized === "HARMFUL" || normalized === "QUARANTINED") return "QUARANTINE";
  if (normalized === "UNKNOWN" || normalized === "POSSIBLE_ISSUE" || normalized === "WATCH") return "WATCH";
  return MACHINE_HEALTH_STATUSES.includes(String(fallback || "").trim().toUpperCase())
    ? String(fallback).trim().toUpperCase()
    : "WATCH";
}

function normalizeMachineId(value) {
  const cleaned = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "unknown";
}

function machineDisplayName(machineId) {
  const id = normalizeMachineId(machineId);
  if (id === "doss") return "Doss";
  if (id === "sally") return "Sally";
  if (id === "betsy") return "Betsy";
  if (id === "spanzee") return "Spanzee";
  return String(machineId || "UNKNOWN");
}

function seedMachineHealthState() {
  const now = new Date().toISOString();
  return {
    schema_version: "MACHINE_HEALTH.v0.3",
    updated_at: now,
    path: rel(MACHINE_HEALTH_JSON),
    state_schema: MACHINE_HEALTH_STATE_SCHEMA,
    policy: "Machine state source is GREEN/WATCH/DEGRADED/STOP/QUARANTINE only. Every state change requires reason, state_changed_at, and state_receipt_path. No local Petra copies may mutate fleet state.",
    health_rules: MACHINE_HEALTH_DEFAULT_RULES,
    machines: [
      {
        machine_id: "betsy",
        display_name: "Betsy",
        hostname: "BETSY",
        role: "Maker/Petra/Ender surface",
        status: "WATCH",
        evidence_status: "not_checked_this_run",
        reason: "State not verified in this run.",
        blocker: "State not verified in this run.",
        fallback_priority: 20,
        latest_receipt_path: null,
        state_changed_at: now,
        state_receipt_path: null,
        updated_at: now,
      },
      {
        machine_id: "doss",
        display_name: "Doss",
        hostname: os.hostname(),
        role: "Dink/Skybro/Thufir local control surface",
        status: "GREEN",
        evidence_status: "live_local",
        reason: "Live local control surface.",
        blocker: "none",
        fallback_priority: 1,
        latest_receipt_path: null,
        state_changed_at: now,
        state_receipt_path: null,
        updated_at: now,
      },
      {
        machine_id: "sally",
        display_name: "Sally",
        hostname: "SALLY",
        role: "Bean/Dink2/Thufir backup and media surface",
        status: "DEGRADED",
        evidence_status: "operator_reported",
        reason: "Persistent Cursor launch/cmd integration failure.",
        blocker: "Build/Cursor/terminal disabled on Sally; build work rerouted to Doss.",
        lane: "Crawler/Swatter read-only only",
        build_allowed: false,
        cursor_allowed: false,
        terminal_allowed: false,
        allowed_work: [
          "browser review",
          "visual audits",
          "reading crawler pearls",
          "non-terminal observation",
        ],
        disallowed_work: [
          "build execution",
          "Cursor work",
          "terminal/cmd/PowerShell work",
        ],
        fallback_priority: 30,
        latest_receipt_path: null,
        state_changed_at: now,
        state_receipt_path: null,
        updated_at: now,
      },
      {
        machine_id: "spanzee",
        display_name: "Spanzee",
        hostname: "DESKTOP-UL1T2KE",
        role: "Compute / remote workstation candidate",
        status: "WATCH",
        evidence_status: "not_checked_this_run",
        reason: "State not verified in this run.",
        blocker: "State not verified in this run.",
        fallback_priority: 40,
        latest_receipt_path: null,
        state_changed_at: now,
        state_receipt_path: null,
        updated_at: now,
      },
    ],
    events: [],
  };
}

function normalizeMachineRecord(machine, fallback = {}) {
  const machineId = normalizeMachineId(machine?.machine_id || machine?.display_name || fallback.machine_id);
  const status = normalizeMachineStatus(machine?.status, fallback.status);
  const stateChangedAt = machine?.state_changed_at || machine?.updated_at || fallback.state_changed_at || fallback.updated_at || new Date().toISOString();
  const stateReceiptPath = machine?.state_receipt_path || machine?.latest_receipt_path || fallback.state_receipt_path || fallback.latest_receipt_path || null;
  return {
    machine_id: machineId,
    display_name: machine?.display_name || fallback.display_name || machineDisplayName(machineId),
    hostname: machine?.hostname || fallback.hostname || "UNKNOWN",
    role: machine?.role || fallback.role || "UNKNOWN",
    status,
    evidence_status: machine?.evidence_status || fallback.evidence_status || "UNKNOWN",
    reason: machine?.reason || fallback.reason || (status === "GREEN" ? "none" : "State requires attention."),
    blocker: machine?.blocker || fallback.blocker || (status === "GREEN" ? "none" : "State requires attention."),
    fallback_priority: Number.isFinite(Number(machine?.fallback_priority))
      ? Number(machine.fallback_priority)
      : Number.isFinite(Number(fallback.fallback_priority))
        ? Number(fallback.fallback_priority)
        : 99,
    latest_receipt_path: machine?.latest_receipt_path || fallback.latest_receipt_path || null,
    state_changed_at: stateChangedAt,
    state_receipt_path: stateReceiptPath,
    dev_server: machine?.dev_server || fallback.dev_server || null,
    lane: machine?.lane || fallback.lane || null,
    build_allowed: machine?.build_allowed ?? fallback.build_allowed ?? null,
    cursor_allowed: machine?.cursor_allowed ?? fallback.cursor_allowed ?? null,
    terminal_allowed: machine?.terminal_allowed ?? fallback.terminal_allowed ?? null,
    allowed_work: Array.isArray(machine?.allowed_work)
      ? machine.allowed_work
      : Array.isArray(fallback.allowed_work)
        ? fallback.allowed_work
        : [],
    disallowed_work: Array.isArray(machine?.disallowed_work)
      ? machine.disallowed_work
      : Array.isArray(fallback.disallowed_work)
        ? fallback.disallowed_work
        : [],
    updated_at: machine?.updated_at || fallback.updated_at || new Date().toISOString(),
  };
}

function saveMachineHealthState(state) {
  fs.mkdirSync(path.dirname(MACHINE_HEALTH_JSON), { recursive: true });
  const seed = seedMachineHealthState();
  const seedById = Object.fromEntries(seed.machines.map((machine) => [machine.machine_id, machine]));
  const machineById = new Map();
  for (const machine of [...seed.machines, ...(Array.isArray(state?.machines) ? state.machines : [])]) {
    const normalized = normalizeMachineRecord(machine, seedById[normalizeMachineId(machine?.machine_id || machine?.display_name)]);
    machineById.set(normalized.machine_id, normalized);
  }
  const next = {
    schema_version: "MACHINE_HEALTH.v0.3",
    updated_at: new Date().toISOString(),
    path: rel(MACHINE_HEALTH_JSON),
    state_schema: MACHINE_HEALTH_STATE_SCHEMA,
    policy: "Machine state source is GREEN/WATCH/DEGRADED/STOP/QUARANTINE only. Every state change requires reason, state_changed_at, and state_receipt_path. No local Petra copies may mutate fleet state.",
    health_rules: Array.isArray(state?.health_rules) ? state.health_rules : seed.health_rules,
    machines: [...machineById.values()].sort((a, b) => a.fallback_priority - b.fallback_priority),
    events: Array.isArray(state?.events) ? state.events.slice(0, 80) : [],
  };
  fs.writeFileSync(MACHINE_HEALTH_JSON, JSON.stringify(next, null, 2), "utf8");
  return next;
}

function loadMachineHealthState() {
  const state = loadJson(MACHINE_HEALTH_JSON);
  return saveMachineHealthState(state || seedMachineHealthState());
}

function machineStateContractViolations(health) {
  return (health?.machines || [])
    .filter((machine) =>
      !MACHINE_HEALTH_STATUSES.includes(machine.status) ||
      !machine.reason ||
      !machine.state_changed_at ||
      !machine.state_receipt_path
    )
    .map((machine) => ({
      machine_id: machine.machine_id,
      status: machine.status,
      missing: [
        !MACHINE_HEALTH_STATUSES.includes(machine.status) ? "status" : null,
        !machine.reason ? "reason" : null,
        !machine.state_changed_at ? "state_changed_at" : null,
        !machine.state_receipt_path ? "state_receipt_path" : null,
      ].filter(Boolean),
    }));
}

function seedWorkQueueState() {
  const now = new Date().toISOString();
  const activeTask = loadActiveTaskStatus();
  const tasks = [
    {
      task_id: "CRAWLER_PEARLS_BOARD_V0",
      title: "Crawler Pearls Board V0",
      source_machine: "Sally",
      assigned_machine: "Sally",
      status: "queued",
      required_capability: "local_soledash_build",
      blocker: "Sally cmd.exe unstable again.",
      latest_receipt_path: null,
      updated_at: now,
      route_history: [],
    },
    {
      task_id: "SWATTER_EVENT_STREAM_V0",
      title: "Swatter Event Stream V0",
      source_machine: "Sally",
      assigned_machine: "Sally",
      status: "queued",
      required_capability: "local_soledash_build",
      blocker: "Sally cmd.exe unstable again.",
      latest_receipt_path: null,
      updated_at: now,
      route_history: [],
    },
  ];
  if (activeTask?.active_task) {
    tasks.push({
      task_id: activeTask.active_task,
      title: activeTask.active_task,
      source_machine: activeTask.source_machine || "UNKNOWN",
      assigned_machine: activeTask.target_machine || "Doss",
      status: "active",
      required_capability: "local_soledash_build",
      blocker: activeTask.source_blocker || "none",
      latest_receipt_path: activeTask.first_receipt || null,
      updated_at: activeTask.updated_at || now,
      route_history: [
        {
          at: activeTask.created_at || now,
          from: activeTask.source_machine || "UNKNOWN",
          to: activeTask.target_machine || "Doss",
          reason: activeTask.source_blocker || "Active task handoff.",
          receipt_path: activeTask.first_receipt || null,
        },
      ],
    });
  }
  return {
    schema_version: "SOLEDASH_WORK_QUEUE.v0.1",
    updated_at: now,
    path: rel(WORK_QUEUE_JSON),
    policy: "Queue continues on healthy available machines; unhealthy machines do not create Ben work.",
    tasks,
  };
}

function normalizeWorkQueueTask(task) {
  const now = new Date().toISOString();
  const taskId = cleanLocalityId(task?.task_id || task?.title || "queue_task", `queue_task_${now}`);
  return {
    task_id: taskId,
    title: task?.title || taskId,
    source_machine: task?.source_machine || task?.original_machine || "UNKNOWN",
    assigned_machine: task?.assigned_machine || "UNKNOWN",
    status: task?.status || "queued",
    required_capability: task?.required_capability || "local_soledash_build",
    blocker: task?.blocker || "none",
    latest_receipt_path: task?.latest_receipt_path || null,
    updated_at: task?.updated_at || now,
    route_history: Array.isArray(task?.route_history) ? task.route_history : [],
  };
}

function saveWorkQueueState(queue) {
  fs.mkdirSync(path.dirname(WORK_QUEUE_JSON), { recursive: true });
  const taskById = new Map();
  for (const task of Array.isArray(queue?.tasks) ? queue.tasks : []) {
    const normalized = normalizeWorkQueueTask(task);
    taskById.set(normalized.task_id, normalized);
  }
  const next = {
    schema_version: queue?.schema_version || "SOLEDASH_WORK_QUEUE.v0.1",
    updated_at: new Date().toISOString(),
    path: rel(WORK_QUEUE_JSON),
    policy: queue?.policy || "Queue continues on healthy available machines; unhealthy machines do not create Ben work.",
    tasks: [...taskById.values()],
  };
  fs.writeFileSync(WORK_QUEUE_JSON, JSON.stringify(next, null, 2), "utf8");
  return next;
}

function loadWorkQueueState() {
  const queue = loadJson(WORK_QUEUE_JSON);
  return saveWorkQueueState(queue || seedWorkQueueState());
}

function selectMachineFallback(health, failedMachineId) {
  const failedId = normalizeMachineId(failedMachineId);
  return (health?.machines || [])
    .filter((machine) => machine.status === "GREEN" && machine.machine_id !== failedId)
    .sort((a, b) => a.fallback_priority - b.fallback_priority)[0] || null;
}

function writeMachineHealthReceipt({ machine, reason, fallback, rerouted, blocker }) {
  fs.mkdirSync(AUTOMATICA_RECEIPTS_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const receiptId = `machine_health_reroute_${cleanIntentSlug(machine.machine_id)}_${stamp}`;
  const receiptPath = path.join(AUTOMATICA_RECEIPTS_DIR, `${receiptId}.json`);
  const receipt = {
    schema_version: "MACHINE_HEALTH_REROUTE_RECEIPT.v0.1",
    receipt_id: receiptId,
    created_at: new Date().toISOString(),
    decision: "mark_unavailable_and_reroute",
    why: "Machine health automation keeps the queue moving when a workstation becomes unhealthy.",
    evidence: [
      `machine_id=${machine.machine_id}`,
      `machine_status=${machine.status}`,
      `reason=${reason}`,
      `rerouted_count=${rerouted.length}`,
      fallback ? `fallback_machine=${fallback.display_name}` : "fallback_machine=none",
    ],
    assumption: "The health signal is local/operator-supplied or monitor-supplied; no credentials or remote secrets are used.",
    blocker: blocker || "none",
    next_action: blocker && blocker !== "none"
      ? "Wait for a healthy fallback machine or local recovery, without assigning Ben manual comparison work."
      : `Queue continues on ${fallback?.display_name || "the selected available machine"}.`,
    confidence: fallback || rerouted.length === 0 ? "high" : "medium",
    machine: {
      machine_id: machine.machine_id,
      display_name: machine.display_name,
      hostname: machine.hostname,
      status: machine.status,
      evidence_status: machine.evidence_status,
      blocker: machine.blocker,
    },
    fallback_machine: fallback
      ? {
          machine_id: fallback.machine_id,
          display_name: fallback.display_name,
          hostname: fallback.hostname,
          evidence_status: fallback.evidence_status,
        }
      : null,
    rerouted_work: rerouted,
    safety: {
      credentials_stored: false,
      public_ports_opened: false,
      router_changed: false,
      destructive_change: false,
      production_deploy: false,
    },
  };
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2), "utf8");
  return { receipt, receiptPath: rel(receiptPath) };
}

function writeMachineWatchReceipt({ machine, signal }) {
  fs.mkdirSync(AUTOMATICA_RECEIPTS_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const receiptId = `machine_health_watch_${cleanIntentSlug(machine.machine_id)}_${stamp}`;
  const receiptPath = path.join(AUTOMATICA_RECEIPTS_DIR, `${receiptId}.json`);
  const receipt = {
    schema_version: "MACHINE_HEALTH_WATCH_RECEIPT.v0.1",
    receipt_id: receiptId,
    created_at: new Date().toISOString(),
    decision: "mark_watch_dev_server_wedged",
    why: "A listening port proves the machine is not STOP, but a route timeout means the dev server path is wedged and needs attention.",
    evidence: [
      `machine_id=${machine.machine_id}`,
      `machine_status=${machine.status}`,
      "port_listening=true",
      "route_timed_out=true",
      `reason=${machine.reason}`,
      signal.port ? `port=${signal.port}` : "port=UNKNOWN",
      signal.route ? `route=${signal.route}` : "route=UNKNOWN",
    ],
    assumption: "The health signal is local/operator-supplied or monitor-supplied; no credentials or remote secrets are used.",
    blocker: "DEV_SERVER_WEDGED",
    next_action: "Inspect or restart the dev server route. Do not mark STOP or reroute work unless shell fails system-wide, repo is inaccessible, or restart fails repeatedly.",
    confidence: "high",
    machine: {
      machine_id: machine.machine_id,
      display_name: machine.display_name,
      hostname: machine.hostname,
      status: machine.status,
      reason: machine.reason,
      evidence_status: machine.evidence_status,
      blocker: machine.blocker,
      dev_server: machine.dev_server,
    },
    safety: {
      credentials_stored: false,
      public_ports_opened: false,
      router_changed: false,
      destructive_change: false,
      production_deploy: false,
    },
  };
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2), "utf8");
  return { receipt, receiptPath: rel(receiptPath) };
}

function markMachineUnavailableAndReroute(machineIdInput, reasonInput = "Machine unhealthy.", options = {}) {
  const machineId = normalizeMachineId(machineIdInput);
  const reason = String(reasonInput || "Machine unhealthy.").trim();
  const now = new Date().toISOString();
  const health = options.health || loadMachineHealthState();
  const queue = options.queue || loadWorkQueueState();
  let machine = health.machines.find((item) => item.machine_id === machineId);
  if (!machine) {
    machine = normalizeMachineRecord({ machine_id: machineId, display_name: machineDisplayName(machineId) });
    health.machines.push(machine);
  }

  machine.status = "STOP";
  machine.evidence_status = options.evidence_status || machine.evidence_status || "local_health_signal";
  machine.reason = reason;
  machine.blocker = reason;
  machine.updated_at = now;

  const fallback = selectMachineFallback(health, machineId);
  const rerouted = [];
  const blocker = fallback ? "none" : "No healthy fallback machine is currently marked available.";

  for (const task of queue.tasks) {
    const assignedId = normalizeMachineId(task.assigned_machine);
    if (assignedId !== machineId || WORK_QUEUE_TERMINAL_STATUSES.has(String(task.status || "").toLowerCase())) {
      continue;
    }
    if (!fallback) continue;
    const from = task.assigned_machine;
    task.assigned_machine = fallback.display_name;
    task.status = task.status === "active" ? "active" : "rerouted";
    task.blocker = "none";
    task.updated_at = now;
    const routeEvent = {
      at: now,
      from,
      to: fallback.display_name,
      reason,
      automation: "MACHINE_HEALTH_AUTOMATION",
    };
    task.route_history = [...(Array.isArray(task.route_history) ? task.route_history : []), routeEvent];
    rerouted.push({
      task_id: task.task_id,
      title: task.title,
      from,
      to: fallback.display_name,
      status: task.status,
    });
  }

  const receiptResult = writeMachineHealthReceipt({ machine, reason, fallback, rerouted, blocker });
  machine.latest_receipt_path = receiptResult.receiptPath;
  machine.state_changed_at = now;
  machine.state_receipt_path = receiptResult.receiptPath;
  machine.updated_at = now;
  for (const task of queue.tasks) {
    if (rerouted.some((item) => item.task_id === task.task_id)) {
      task.latest_receipt_path = receiptResult.receiptPath;
      const latestRoute = task.route_history[task.route_history.length - 1];
      if (latestRoute) latestRoute.receipt_path = receiptResult.receiptPath;
    }
  }

  health.events = [
    {
      event_id: receiptResult.receipt.receipt_id,
      created_at: receiptResult.receipt.created_at,
      action: "mark_unavailable_and_reroute",
      machine_id: machine.machine_id,
      reason,
      fallback_machine: fallback?.display_name || null,
      rerouted_count: rerouted.length,
      receipt_path: receiptResult.receiptPath,
      blocker,
    },
    ...(Array.isArray(health.events) ? health.events : []),
  ].slice(0, 80);

  saveMachineHealthState(health);
  saveWorkQueueState(queue);
  appendSwatterEvent({
    source: "machine_health_automation",
    action: "mark_unavailable_and_reroute",
    class: "BLUE",
    decision: blocker === "none" ? "executed_and_receipted" : "blocked_and_receipted",
    summary: `${machine.display_name} STOP; ${rerouted.length} queue item(s) rerouted${fallback ? ` to ${fallback.display_name}` : ""}.`,
    why: "Machine health continuity is an approved local state and receipt action.",
    blocker,
    receipt_path: receiptResult.receiptPath,
    related_task: "MACHINE_HEALTH_AUTOMATION",
    machine: "Doss",
    confidence: fallback || rerouted.length === 0 ? "high" : "medium",
  });

  return {
    ok: blocker === "none",
    success: blocker === "none",
    machine_id: machine.machine_id,
    status: machine.status,
    fallback_machine: fallback?.display_name || null,
    rerouted_count: rerouted.length,
    rerouted_work: rerouted,
    receipt_path: receiptResult.receiptPath,
    blocker,
    queue_continues: blocker === "none",
  };
}

function coerceHealthBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const normalized = String(value || "").trim().toLowerCase();
  return ["true", "1", "yes", "y", "listening", "timeout", "timed_out"].includes(normalized);
}

function markMachineWatchDevServerWedged(body = {}) {
  const machineId = normalizeMachineId(body.machine_id || body.machineId || os.hostname());
  const portListening = coerceHealthBoolean(body.port_listening ?? body.portListening ?? body.listening);
  const routeTimedOut = coerceHealthBoolean(body.route_timed_out ?? body.routeTimedOut ?? body.timed_out ?? body.timedOut);
  if (!portListening || !routeTimedOut) {
    return {
      ok: false,
      success: false,
      status: "unchanged",
      blocker: "DEV_SERVER_WEDGED requires port_listening=true and route_timed_out=true.",
      queue_continues: true,
    };
  }

  const now = new Date().toISOString();
  const health = loadMachineHealthState();
  let machine = health.machines.find((item) => item.machine_id === machineId);
  if (!machine) {
    machine = normalizeMachineRecord({ machine_id: machineId, display_name: machineDisplayName(machineId) });
    health.machines.push(machine);
  }

  machine.status = "WATCH";
  machine.reason = "DEV_SERVER_WEDGED";
  machine.blocker = "DEV_SERVER_WEDGED";
  machine.evidence_status = body.evidence_status || body.evidenceStatus || "dev_server_health_rule";
  machine.dev_server = {
    port: body.port || body.local_port || body.localPort || null,
    route: body.route || body.path || body.url || null,
    route_timeout_ms: body.route_timeout_ms || body.routeTimeoutMs || null,
    port_listening: true,
    route_timed_out: true,
    stop_conditions_met: false,
  };
  machine.updated_at = now;

  const receiptResult = writeMachineWatchReceipt({ machine, signal: machine.dev_server });
  machine.latest_receipt_path = receiptResult.receiptPath;
  machine.state_changed_at = now;
  machine.state_receipt_path = receiptResult.receiptPath;
  health.events = [
    {
      event_id: receiptResult.receipt.receipt_id,
      created_at: receiptResult.receipt.created_at,
      action: "mark_watch_dev_server_wedged",
      machine_id: machine.machine_id,
      reason: machine.reason,
      fallback_machine: null,
      rerouted_count: 0,
      receipt_path: receiptResult.receiptPath,
      blocker: "DEV_SERVER_WEDGED",
    },
    ...(Array.isArray(health.events) ? health.events : []),
  ].slice(0, 80);

  saveMachineHealthState(health);
  appendSwatterEvent({
    source: "machine_health_automation",
    action: "mark_watch_dev_server_wedged",
    class: "BLUE",
    decision: "watch_and_receipted",
    summary: `${machine.display_name} WATCH: dev server port is listening but route timed out.`,
    why: "A wedged dev server is not a machine STOP condition.",
    blocker: "DEV_SERVER_WEDGED",
    receipt_path: receiptResult.receiptPath,
    related_task: "DEV_SERVER_HEALTH_RULE",
    machine: "Doss",
    confidence: "high",
  });

  return {
    ok: true,
    success: true,
    machine_id: machine.machine_id,
    status: machine.status,
    reason: machine.reason,
    receipt_path: receiptResult.receiptPath,
    blocker: "DEV_SERVER_WEDGED",
    rerouted_count: 0,
    queue_continues: true,
    stop_conditions_met: false,
  };
}

function enforceMachineHealthContinuity() {
  const health = loadMachineHealthState();
  const queue = loadWorkQueueState();
  const unavailable = new Set(
    health.machines
      .filter((machine) => machine.status === "STOP" || machine.status === "QUARANTINE")
      .map((machine) => machine.machine_id)
  );
  const assignedToUnavailable = queue.tasks.filter(
    (task) =>
      unavailable.has(normalizeMachineId(task.assigned_machine)) &&
      !WORK_QUEUE_TERMINAL_STATUSES.has(String(task.status || "").toLowerCase())
  );
  const results = [];
  const machineIds = [...new Set(assignedToUnavailable.map((task) => normalizeMachineId(task.assigned_machine)))];
  for (const machineId of machineIds) {
    const machine = health.machines.find((item) => item.machine_id === machineId);
    results.push(
      markMachineUnavailableAndReroute(machineId, machine?.blocker || "Machine marked unavailable.", { health, queue })
    );
  }
  return results;
}

function buildMachineHealthStatus() {
  const automationRuns = enforceMachineHealthContinuity();
  const health = loadMachineHealthState();
  const queue = loadWorkQueueState();
  const stateContractViolations = machineStateContractViolations(health);
  const counts = {
    ...Object.fromEntries(MACHINE_HEALTH_STATUSES.map((status) => [status, 0])),
  };
  for (const machine of health.machines) {
    counts[machine.status] = (counts[machine.status] || 0) + 1;
  }
  return {
    ok: true,
    path: rel(MACHINE_HEALTH_JSON),
    queue_path: rel(WORK_QUEUE_JSON),
    state_schema: health.state_schema || MACHINE_HEALTH_STATE_SCHEMA,
    policy: health.policy,
    state_contract_ok: stateContractViolations.length === 0,
    state_contract_violations: stateContractViolations,
    health_rules: health.health_rules || MACHINE_HEALTH_DEFAULT_RULES,
    counts,
    machines: health.machines,
    queue: queue.tasks,
    latest_receipt_path: health.events?.[0]?.receipt_path || null,
    latest_event: health.events?.[0] || null,
    automation_runs: automationRuns,
  };
}

function seedSwatterEventStream() {
  return {
    schema_version: "SWATTER_EVENT_STREAM.v0.1",
    updated_at: new Date().toISOString(),
    path: rel(SWATTER_EVENT_STREAM_JSON),
    rule: "BLUE/GREEN routine local actions may proceed with receipts; RED remains human-required every time.",
    events: [],
  };
}

function saveSwatterEventStream(stream) {
  fs.mkdirSync(path.dirname(SWATTER_EVENT_STREAM_JSON), { recursive: true });
  const next = {
    ...stream,
    schema_version: stream.schema_version || "SWATTER_EVENT_STREAM.v0.1",
    updated_at: new Date().toISOString(),
    path: rel(SWATTER_EVENT_STREAM_JSON),
    rule: stream.rule || "BLUE/GREEN routine local actions may proceed with receipts; RED remains human-required every time.",
    events: Array.isArray(stream.events) ? stream.events : [],
  };
  fs.writeFileSync(SWATTER_EVENT_STREAM_JSON, JSON.stringify(next, null, 2), "utf8");
  return next;
}

function loadSwatterEventStream() {
  let stream = loadJson(SWATTER_EVENT_STREAM_JSON);
  if (!stream || !Array.isArray(stream.events)) {
    stream = saveSwatterEventStream(seedSwatterEventStream());
  }
  stream.events = stream.events.map((event) => {
    const createdAt = event.created_at || stream.updated_at || new Date().toISOString();
    const receiptPath = event.receipt_path || event.last_receipt || null;
    const action = event.action || event.last_action || "UNKNOWN";
    return {
      event_id: event.event_id || `swatter_event_${cleanIntentSlug(event.summary || action || "unknown")}`,
      created_at: createdAt,
      source: event.source || "UNKNOWN",
      action,
      class: SWATTER_CLASSES.includes(String(event.class || "").toUpperCase()) ? String(event.class).toUpperCase() : "GREEN",
      decision: event.decision || "recorded",
      summary: event.summary || "Swatter event",
      why: event.why || "",
      blocker: event.blocker || "none",
      receipt_path: receiptPath,
      related_task: event.related_task || null,
      machine: event.machine || "Doss",
      confidence: event.confidence || "medium",
      ...cardLocalityFields({
        action: event.last_action || (receiptPath ? "swat" : action),
        receipt: event.last_receipt || receiptPath,
        actor: event.last_actor || CARD_LOCALITY_ACTOR,
        timestamp: event.last_timestamp || createdAt,
      }),
    };
  });
  return stream;
}

function appendSwatterEvent(event) {
  const stream = loadSwatterEventStream();
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const createdAt = event.created_at || new Date().toISOString();
  const receiptPath = event.receipt_path || event.last_receipt || null;
  const action = event.action || event.last_action || "record_event";
  const normalized = {
    event_id: event.event_id || `swatter_${cleanIntentSlug(action || event.summary || "event")}_${stamp}`,
    created_at: createdAt,
    source: event.source || "soledash",
    action,
    class: SWATTER_CLASSES.includes(String(event.class || "").toUpperCase()) ? String(event.class).toUpperCase() : "GREEN",
    decision: event.decision || "recorded",
    summary: event.summary || "Swatter event",
    why: event.why || "",
    blocker: event.blocker || "none",
    receipt_path: receiptPath,
    related_task: event.related_task || null,
    machine: event.machine || "Doss",
    confidence: event.confidence || "medium",
    ...cardLocalityFields({
      action: event.last_action || "swat",
      receipt: event.last_receipt || receiptPath,
      actor: event.last_actor || CARD_LOCALITY_ACTOR,
      timestamp: event.last_timestamp || createdAt,
    }),
  };
  stream.events = [normalized, ...(stream.events || [])].slice(0, 80);
  saveSwatterEventStream(stream);
  return normalized;
}

function buildSwatterEventStreamStatus() {
  const stream = loadSwatterEventStream();
  const counts = Object.fromEntries(SWATTER_CLASSES.map((cls) => [cls, 0]));
  for (const event of stream.events) counts[event.class] = (counts[event.class] || 0) + 1;
  return {
    ok: true,
    path: rel(SWATTER_EVENT_STREAM_JSON),
    rule: stream.rule,
    counts,
    events: stream.events,
    ...normalizeCardLocality(stream.events?.[0] || {}, {}),
  };
}

function seedCrawlerPearlsState() {
  const nuggets = loadJson(CRAWLER_NUGGETS_JSON);
  const now = new Date().toISOString();
  const pearls = (Array.isArray(nuggets) ? nuggets : []).map((item, index) => {
    const rank = item.rank || index + 1;
    const summary = item.title || `Crawler pearl ${rank}`;
    return {
      pearl_id: `crawler_pearl_${String(rank).padStart(2, "0")}_${cleanIntentSlug(summary)}`,
      state: "New",
      source: item.source_file_path || "UNKNOWN",
      summary,
      why_it_matters: item.why_it_matters || item.recommended_action || "UNKNOWN",
      evidence: item.quote_or_evidence || "",
      recommended_action: item.recommended_action || "",
      category: item.category || "UNKNOWN",
      confidence: item.confidence || "UNKNOWN",
      created_at: now,
      updated_at: now,
      promoted_task_id: null,
      latest_receipt_path: null,
      last_action: null,
      last_receipt: null,
      last_actor: CARD_LOCALITY_ACTOR,
      last_timestamp: null,
    };
  });
  return {
    schema_version: "CRAWLER_PEARLS.v0.1",
    updated_at: now,
    source: rel(CRAWLER_NUGGETS_JSON),
    rule: "Crawler pearls do not enter Working until promoted.",
    states: CRAWLER_PEARL_STATES,
    pearls,
  };
}

function saveCrawlerPearlsState(state) {
  fs.mkdirSync(path.dirname(CRAWLER_PEARLS_JSON), { recursive: true });
  const next = {
    ...state,
    schema_version: state.schema_version || "CRAWLER_PEARLS.v0.1",
    updated_at: new Date().toISOString(),
    states: CRAWLER_PEARL_STATES,
    rule: "Crawler pearls do not enter Working until promoted.",
  };
  fs.writeFileSync(CRAWLER_PEARLS_JSON, JSON.stringify(next, null, 2), "utf8");
  return next;
}

function loadCrawlerPearlsState() {
  let state = loadJson(CRAWLER_PEARLS_JSON);
  if (!state || !Array.isArray(state.pearls)) {
    state = saveCrawlerPearlsState(seedCrawlerPearlsState());
  }
  state.pearls = state.pearls.map((pearl) => {
    const createdAt = pearl.created_at || state.updated_at || new Date().toISOString();
    const updatedAt = pearl.updated_at || state.updated_at || createdAt;
    const latestReceipt = pearl.latest_receipt_path || pearl.last_receipt || null;
    return {
      pearl_id: pearl.pearl_id || `crawler_pearl_${cleanIntentSlug(pearl.summary || pearl.source || "unknown")}`,
      state: CRAWLER_PEARL_STATES.includes(pearl.state) ? pearl.state : "New",
      source: pearl.source || pearl.source_file_path || "UNKNOWN",
      summary: pearl.summary || pearl.title || "Untitled pearl",
      why_it_matters: pearl.why_it_matters || pearl.why || "UNKNOWN",
      evidence: pearl.evidence || pearl.quote_or_evidence || "",
      recommended_action: pearl.recommended_action || "",
      category: pearl.category || "UNKNOWN",
      confidence: pearl.confidence || "UNKNOWN",
      created_at: createdAt,
      updated_at: updatedAt,
      promoted_task_id: pearl.promoted_task_id || null,
      latest_receipt_path: latestReceipt,
      ...cardLocalityFields({
        action: pearl.last_action || null,
        receipt: latestReceipt,
        actor: pearl.last_actor || CARD_LOCALITY_ACTOR,
        timestamp: pearl.last_timestamp || (pearl.last_action || latestReceipt ? updatedAt : null),
      }),
    };
  });
  return state;
}

function buildCrawlerPearlsStatus() {
  const state = loadCrawlerPearlsState();
  const counts = Object.fromEntries(CRAWLER_PEARL_STATES.map((stateName) => [stateName, 0]));
  for (const pearl of state.pearls) counts[pearl.state] = (counts[pearl.state] || 0) + 1;
  const sortIndex = Object.fromEntries(CRAWLER_PEARL_STATES.map((stateName, index) => [stateName, index]));
  const pearls = [...state.pearls].sort((a, b) => {
    const stateDelta = (sortIndex[a.state] ?? 99) - (sortIndex[b.state] ?? 99);
    if (stateDelta) return stateDelta;
    return String(a.pearl_id).localeCompare(String(b.pearl_id));
  });
  return {
    ok: true,
    path: rel(CRAWLER_PEARLS_JSON),
    states: CRAWLER_PEARL_STATES,
    counts,
    rule: state.rule || "Crawler pearls do not enter Working until promoted.",
    pearls,
  };
}

function crawlerPearlActionTarget(action) {
  if (action === "review") return "Reviewed";
  if (action === "promote") return "Promoted to Task";
  if (action === "archive") return "Archived";
  if (action === "kill") return "Killed";
  throw new Error(`Unsupported crawler pearl action: ${action}`);
}

function writeCrawlerPearlPromotionPacket(pearl, stamp) {
  const actionId = `crawler_pearl_task_${cleanIntentSlug(pearl.pearl_id)}_${stamp}`;
  const actionPath = path.join(AUTOMATICA_ACTIONS_DIR, `${actionId}.json`);
  const packet = {
    schema_version: "CRAWLER_PEARL_TASK_PROMOTION.v0.1",
    action_id: actionId,
    created_at: new Date().toISOString(),
    source: "crawler_pearls",
    source_pearl_id: pearl.pearl_id,
    state: "Promoted to Task",
    working_status: "task_candidate_created_after_promotion",
    enters_working_before_promotion: false,
    task: {
      title: pearl.summary,
      source: pearl.source,
      why_it_matters: pearl.why_it_matters,
      recommended_action: pearl.recommended_action || "Review promoted pearl and route as task.",
      evidence: pearl.evidence || "",
    },
  };
  fs.mkdirSync(AUTOMATICA_ACTIONS_DIR, { recursive: true });
  fs.writeFileSync(actionPath, JSON.stringify(packet, null, 2), "utf8");
  return { actionId, actionPath: rel(actionPath) };
}

function writeCrawlerPearlReceipt({ action, beforeState, afterState, pearl, promotionPacket = null }) {
  fs.mkdirSync(AUTOMATICA_RECEIPTS_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const receiptId = `crawler_pearl_${action}_${cleanIntentSlug(pearl.pearl_id)}_${stamp}`;
  const receiptPath = path.join(AUTOMATICA_RECEIPTS_DIR, `${receiptId}.json`);
  const receipt = {
    schema_version: "CRAWLER_PEARL_RECEIPT.v0.1",
    receipt_id: receiptId,
    created_at: new Date().toISOString(),
    decision: `crawler_pearl_${action}`,
    why: action === "promote"
      ? "Operator promoted a crawler pearl into a task candidate."
      : action === "review"
        ? "Operator reviewed a crawler pearl without moving it into Working."
        : `Operator moved a crawler pearl to ${afterState}.`,
    evidence: [
      `Pearl: ${pearl.summary}`,
      `Source: ${pearl.source}`,
      `Before: ${beforeState}`,
      `After: ${afterState}`,
    ],
    assumption: "Crawler pearls remain outside Working unless and until they are promoted.",
    blocker: "none",
    next_action: action === "promote"
      ? "Route the promoted task candidate through GimpDash/Automatica before execution."
      : "No working task created.",
    confidence: "high",
    pearl: {
      pearl_id: pearl.pearl_id,
      state: afterState,
      source: pearl.source,
      summary: pearl.summary,
      why_it_matters: pearl.why_it_matters,
      recommended_action: pearl.recommended_action,
    },
    promotion_packet: promotionPacket,
    safety: {
      entered_working_before_promotion: false,
      credentials_captured: false,
      production_deploy: false,
      destructive_change: false,
    },
  };
  Object.assign(receipt, cardLocalityFields({
    action,
    receipt: rel(receiptPath),
    timestamp: receipt.created_at,
  }));
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2), "utf8");
  return { receipt, receiptPath: rel(receiptPath) };
}

function updateCrawlerPearl(action, pearlId) {
  const nextState = crawlerPearlActionTarget(action);
  const state = loadCrawlerPearlsState();
  const pearlIndex = state.pearls.findIndex((pearl) => pearl.pearl_id === pearlId);
  if (pearlIndex < 0) throw new Error(`Unknown crawler pearl: ${pearlId}`);
  const pearl = state.pearls[pearlIndex];
  const beforeState = pearl.state;
  if (CRAWLER_PEARL_TERMINAL_STATES.has(beforeState)) {
    throw new Error(`Crawler pearl is already ${beforeState}.`);
  }
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  let promotionPacket = null;
  if (action === "promote") {
    promotionPacket = writeCrawlerPearlPromotionPacket(pearl, stamp);
    pearl.promoted_task_id = promotionPacket.actionId;
  }
  pearl.state = nextState;
  pearl.updated_at = new Date().toISOString();
  const receiptResult = writeCrawlerPearlReceipt({ action, beforeState, afterState: nextState, pearl, promotionPacket });
  pearl.latest_receipt_path = receiptResult.receiptPath;
  Object.assign(pearl, cardLocalityFields({
    action,
    receipt: receiptResult.receiptPath,
    timestamp: receiptResult.receipt.created_at,
  }));
  appendSwatterEvent({
    source: "crawler_pearls_board_v0",
    action: `crawler_pearl_${action}`,
    class: "BLUE",
    decision: "executed_and_receipted",
    summary: `${pearl.summary}: ${beforeState} -> ${nextState}`,
    why: "Crawler pearl lifecycle actions are local state changes that must leave a receipt and must not enter Working before promotion.",
    blocker: "none",
    receipt_path: receiptResult.receiptPath,
    related_task: "CRAWLER_PEARLS_BOARD_V0",
    machine: "Doss",
    confidence: "high",
  });
  state.pearls[pearlIndex] = pearl;
  saveCrawlerPearlsState(state);
  return {
    ok: true,
    success: true,
    pearl,
    action,
    before_state: beforeState,
    after_state: nextState,
    receipt_path: receiptResult.receiptPath,
    promotion_packet_path: promotionPacket?.actionPath || null,
    ...normalizeCardLocality(pearl, { action, receipt: receiptResult.receiptPath, timestamp: receiptResult.receipt.created_at }),
    message: `${pearl.summary}: ${nextState}`,
  };
}

function listGdRunsBrief() {
  if (!fs.existsSync(GD_RUNS_DIR)) return [];
  return fs
    .readdirSync(GD_RUNS_DIR)
    .filter((name) => fs.existsSync(path.join(GD_RUNS_DIR, name, "run-manifest.json")))
    .sort()
    .reverse()
    .slice(0, 12)
    .map((runId) => {
      try {
        const m = JSON.parse(fs.readFileSync(path.join(GD_RUNS_DIR, runId, "run-manifest.json"), "utf8"));
        return { runId, missionClass: m.missionClass, status: m.status };
      } catch {
        return { runId, missionClass: "?", status: "?" };
      }
    });
}

function loadThreadRefreshPreview() {
  if (!fs.existsSync(THREAD_REFRESH_PACKET)) {
    return { exists: false };
  }
  const stat = fs.statSync(THREAD_REFRESH_PACKET);
  const text = fs.readFileSync(THREAD_REFRESH_PACKET, "utf8");
  let runId = null;
  const m = text.match(/\*\*Run:\*\* `(GD_RUN_[^`]+)`/);
  if (m) runId = m[1];
  return {
    exists: true,
    chars: text.length,
    modifiedAt: stat.mtime.toISOString(),
    runId,
    preview: text.slice(0, 2400) + (text.length > 2400 ? "\n\n… (truncated — open file for full packet)" : ""),
    path: rel(THREAD_REFRESH_PACKET),
  };
}

function buildGdStatus() {
  return {
    ok: true,
    missionClasses: loadGdMissionClasses(),
    routingOptions: buildGdRoutingOptions(),
    runs: listGdRunsBrief(),
    threadRefresh: loadThreadRefreshPreview(),
    homeAnchor: `${LOCAL_PANEL_URL}#gimpdash`,
  };
}

function loadAutomaticaRouteMap() {
  const routeMap = loadJson(AUTOMATICA_ROUTE_MAP);
  return routeMap?.routes || [];
}

function loadAutomaticaApprovals() {
  const approvals = loadJson(AUTOMATICA_APPROVALS);
  return {
    schema_version: approvals?.schema_version || "AUTOMATICA_APPROVALS.v0.1",
    actions: Array.isArray(approvals?.actions) ? approvals.actions : [],
  };
}

function cleanIntentSlug(value) {
  return String(value || "intent")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "intent";
}

function buildIntentAvailability(machine) {
  if (machine === "Doss") {
    return {
      status: "available_now",
      evidence_status: "live",
      evidence: [
        `SoleDash control server is running on ${LOCAL_PANEL_DISPLAY_URL}`,
        MOBILE_READONLY_LAN
          ? `LAN read-only mobile surface is enabled for ${lanIPv4Candidates().map((ip) => `http://${ip}:${PORT}/#automatica`).join(", ") || "LAN IPv4 unavailable"}`
          : "SoleDash is local-only in this server mode",
      ],
    };
  }
  return {
    status: "unknown",
    evidence_status: "not_live_verified_from_doss",
    evidence: ["No live machine readback is available in this request."],
  };
}

function isGovernorRoutingChoice(routing, key) {
  const id = routingChoiceId(routing, key).toLowerCase();
  const label = routingChoiceLabel(routing, key).toLowerCase();
  return !id || id === "governor" || label === "governor decides";
}

function applyStructuredRoutingToDispatchCard(card, routing, stampHint) {
  if (!routing) return card;
  const projectLabel = routingChoiceLabel(routing, "project");
  const areaLabel = routingChoiceLabel(routing, "area");
  const agentLabel = routingChoiceLabel(routing, "agent");
  const machineLabel = routingChoiceLabel(routing, "machine");
  const receiptTarget = routingChoiceLabel(routing, "return_receipt_to") || "foreman/soledash/receipts";
  const projectArea = [projectLabel, areaLabel].filter(Boolean).join(" / ");
  const structuredEvidence = [
    projectLabel ? `Structured project selected: ${projectLabel}` : null,
    areaLabel ? `Structured area selected: ${areaLabel}` : null,
    agentLabel ? `Structured agent selected: ${agentLabel}` : null,
    machineLabel ? `Structured machine selected: ${machineLabel}` : null,
  ].filter(Boolean);

  const bestMachine = isGovernorRoutingChoice(routing, "machine")
    ? card.best_machine
    : machineLabel;
  const bestAeye = isGovernorRoutingChoice(routing, "agent")
    ? card.best_aeye
    : agentLabel;
  const availability = bestMachine && bestMachine !== card.best_machine
    ? buildIntentAvailability(bestMachine)
    : card.availability;

  return {
    ...card,
    route_id: projectArea ? `structured_${cleanIntentSlug(projectArea)}` : card.route_id,
    title: projectArea || card.title,
    best_aeye: bestAeye,
    best_machine: bestMachine,
    availability,
    expected_receipt: `${receiptTarget}/intent_router_${stampHint}_<timestamp>.json`,
    structured_routing: routing,
    why: `${card.why} Structured routing selections were supplied by the operator instead of route-correction free text.`,
    evidence: [...(card.evidence || []), ...structuredEvidence],
  };
}

function buildIntentDispatchCard(intent, governorResult, structuredRouting = null) {
  const normalized = String(intent || "").trim();
  const routing = normalizeGdStructuredRouting(structuredRouting);
  const isMobileSd = /\b(build|wire|make|create|setup|ship|test)\b/i.test(normalized) &&
    (/\bmobile\s+sd\b/i.test(normalized) || /\bmobile\s+(soledash|sole\s*dash|lighttrip|light\s*trip)\b/i.test(normalized));
  const stampHint = cleanIntentSlug(normalized);

  if (isMobileSd) {
    const availability = buildIntentAvailability("Doss");
    const card = applyStructuredRoutingToDispatchCard({
      schema_version: "INTENT_ROUTER_PROPOSED_DISPATCH_CARD.v0.1",
      intent: normalized,
      route_id: "build_mobile_sd",
      title: "Build Mobile SD",
      capability_required: [
        "mobile SoleDash / LightTrip access path",
        "local operator UI implementation",
        "LAN-only safety verification",
        "receipt-backed route proof",
      ],
      best_aeye: "Maker",
      supporting_aeyes: ["Dink", "Petra"],
      best_machine: "Doss",
      availability,
      expected_receipt: `foreman/soledash/receipts/intent_router_${stampHint}_<timestamp>.json`,
      proposed_action_type: "proposed_dispatch_card",
      dispatch_class: "LOCAL_ONLY_PROPOSED",
      human_gate: "Operator accepts proposed dispatch before code changes beyond the router MVP.",
      why: "Mobile SD is a local SoleDash/LightTrip build and LAN safety task. Doss is the live mobile/mirror forge with SoleDash already running.",
      next_action: "Accept dispatch to Maker on Doss, then require a route receipt before any broader fleet replication.",
      confidence: availability.status === "available_now" ? "high" : "medium",
      evidence: [
        "Machine topology marks Doss as mobile/mirror forge.",
        "Current SoleDash endpoint is live on Doss.",
        "Mobile access work already uses LAN read-only mode and localhost-only POST token.",
      ],
    }, routing, stampHint);
    return applyProjectLockToDispatchCard(card, routing, normalized);
  }

  const lead = governorResult?.synthesisLead || governorResult?.recipients?.[0] || "OPERATOR";
  const bestAeye = lead === "MAKER" ? "Maker" : lead === "SKYBRO" ? "Thufir/Skybro" : lead === "ENDER" ? "Ender" : lead === "PETRA" ? "Petra" : lead === "BEAN" ? "Bean" : "Operator";
  const bestMachine = lead === "MAKER" || governorResult?.missionClass === "MAKER_IMPLEMENTATION" ? "Doss" : "UNKNOWN";
  const availability = bestMachine === "Doss" ? buildIntentAvailability("Doss") : buildIntentAvailability(bestMachine);

  const card = applyStructuredRoutingToDispatchCard({
    schema_version: "INTENT_ROUTER_PROPOSED_DISPATCH_CARD.v0.1",
    intent: normalized,
    route_id: `governor_${cleanIntentSlug(governorResult?.missionClass || "unclassified")}`,
    title: governorResult?.missionLabel || "Unclassified intent",
    capability_required: [governorResult?.missionDescription || "Intent classification"],
    best_aeye: bestAeye,
    supporting_aeyes: (governorResult?.recipients || []).filter((id) => id !== lead),
    best_machine: bestMachine,
    availability,
    expected_receipt: `foreman/soledash/receipts/intent_router_${stampHint}_<timestamp>.json`,
    proposed_action_type: "proposed_dispatch_card",
    dispatch_class: governorResult?.dispatchClass || "UNKNOWN",
    human_gate: governorResult?.humanGate ? governorResult.humanGateLevel : "none",
    why: "Routed through the existing deterministic GimpDash governor.",
    next_action: governorResult?.nextAction || "Review the proposed dispatch before execution.",
    confidence: governorResult?.missionClass === "UNCLASSIFIED" ? "low" : "medium",
    evidence: governorResult?.matchedRules?.length ? governorResult.matchedRules.map((rule) => `Matched rule: ${rule}`) : ["No matched rule evidence."],
  }, routing, stampHint);
  return applyProjectLockToDispatchCard(card, routing, normalized);
}

function inferDenRoomAeye(intent) {
  const text = String(intent || "").toLowerCase();
  const rules = [
    {
      aeye: "Maker",
      machine: "Doss",
      capability: "local implementation / UI wiring",
      reason: "implementation, UI, endpoint, or app behavior language",
      test: /\b(build|wire|implement|fix|code|ui|button|card|endpoint|api|frontend|component|page|room|den)\b/,
      supporting: ["Dink"],
    },
    {
      aeye: "Dink",
      machine: "Doss",
      capability: "infrastructure / routing / machine automation",
      reason: "machine, automation, routing, server, or health language",
      test: /\b(machine|automation|route|router|server|port|ssh|rdp|remote|health|queue|receipt|packet|relay)\b/,
      supporting: ["Bean"],
    },
    {
      aeye: "Thufir/Skybro",
      machine: "Research surface",
      capability: "research / market scan",
      reason: "research or market language",
      test: /\b(research|market|competitor|search|sue|grading|thufir|skybro)\b/,
      supporting: [],
    },
    {
      aeye: "Ender",
      machine: "Doss",
      capability: "human reality / UX sensemaking",
      reason: "human reality, friction, training, story, or UX language",
      test: /\b(human|reality|friction|training|workflow|story|narrative|copy|ux|feel)\b/,
      supporting: [],
    },
    {
      aeye: "Bean",
      machine: "Doss",
      capability: "audit / verification",
      reason: "audit, test, review, or verification language",
      test: /\b(audit|test|verify|check|review|regression|qa)\b/,
      supporting: [],
    },
    {
      aeye: "Petra",
      machine: "Betsy",
      capability: "comptroller decision / priority gate",
      reason: "budget, priority, accounting, or decision language",
      test: /\b(budget|priority|money|payment|accounting|decision|comptroller|petra)\b/,
      supporting: [],
    },
  ];
  return (
    rules.find((rule) => rule.test.test(text)) || {
      aeye: "Dink",
      machine: "Doss",
      capability: "operator intent routing",
      reason: "fallback Den room relay owner",
      supporting: ["Maker"],
    }
  );
}

function applyDenRoomInference(dispatchCard, intent, structuredRouting = null) {
  const routing = normalizeGdStructuredRouting(structuredRouting);
  const explicitAgent = routing && !isGovernorRoutingChoice(routing, "agent");
  const explicitMachine = routing && !isGovernorRoutingChoice(routing, "machine");
  const inference = inferDenRoomAeye(intent);
  const shouldInferAeye = !explicitAgent && (!dispatchCard.best_aeye || dispatchCard.best_aeye === "Operator");
  const shouldInferMachine = !explicitMachine && (!dispatchCard.best_machine || dispatchCard.best_machine === "UNKNOWN");
  if (!shouldInferAeye && !shouldInferMachine) {
    return {
      ...dispatchCard,
      den_room_inference: {
        applied: false,
        reason: "Structured routing or governor result already selected an Aeye/machine.",
      },
    };
  }
  const bestAeye = shouldInferAeye ? inference.aeye : dispatchCard.best_aeye;
  const bestMachine = shouldInferMachine ? inference.machine : dispatchCard.best_machine;
  const availability = bestMachine === "Doss" ? buildIntentAvailability("Doss") : buildIntentAvailability(bestMachine);
  return {
    ...dispatchCard,
    title: dispatchCard.title === "Unclassified intent" ? `Den room relay: ${inference.capability}` : dispatchCard.title,
    capability_required: Array.from(new Set([...(dispatchCard.capability_required || []), inference.capability])),
    best_aeye: bestAeye,
    supporting_aeyes: Array.from(new Set([...(dispatchCard.supporting_aeyes || []), ...(inference.supporting || [])])),
    best_machine: bestMachine,
    availability,
    confidence: dispatchCard.confidence === "low" ? "medium" : dispatchCard.confidence,
    why: `${dispatchCard.why} Den room inference applied when needed: ${inference.reason}.`,
    next_action: `Relay packet is ready for ${bestAeye} on ${bestMachine}; return receipt to the originating Den room card.`,
    evidence: [...(dispatchCard.evidence || []), `Den room inference: ${inference.reason}`],
    den_room_inference: {
      applied: true,
      aeye: inference.aeye,
      machine: inference.machine,
      capability: inference.capability,
      reason: inference.reason,
    },
  };
}

function writeIntentRouterReceipt(dispatchCard, governorResult) {
  fs.mkdirSync(AUTOMATICA_RECEIPTS_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const pathSlug = cleanIntentSlug(dispatchCard?.route_id || dispatchCard?.intent || "intent");
  const receiptPath = path.join(AUTOMATICA_RECEIPTS_DIR, `intent_router_${pathSlug}_${stamp}.json`);
  const lockBlocker = dispatchCard?.project_lock && dispatchCard.project_lock.decision !== "Allowed"
    ? dispatchCard.project_lock.blocker
    : "none";
  const lockNextAction = lockBlocker !== "none"
    ? dispatchCard.project_lock.reason
    : dispatchCard.next_action;
  const receipt = {
    schema_version: "INTENT_ROUTER_RECEIPT.v0.1",
    receipt_id: `intent_router_${pathSlug}_${stamp}`,
    created_at: new Date().toISOString(),
    status: dispatchCard?.project_lock?.decision === "Blocked"
      ? "blocked"
      : dispatchCard?.project_lock?.decision === "Needs Merge"
        ? "needs_merge"
        : "proposed",
    decision: "proposed_dispatch_card",
    why: dispatchCard.why,
    evidence: dispatchCard.evidence,
    assumption: "Intent routing proposes work; it does not execute code changes, deploys, payments, credentials, or public exposure.",
    blocker: lockBlocker,
    next_action: lockNextAction,
    confidence: dispatchCard.confidence,
    governor: {
      verdict: governorResult?.verdict,
      missionClass: governorResult?.missionClass,
      risk: governorResult?.risk,
      humanGate: governorResult?.humanGate,
    },
    structured_routing: dispatchCard.structured_routing || null,
    project_lock: dispatchCard.project_lock || null,
    proposed_dispatch_card: dispatchCard,
    safety: {
      credentials_captured: false,
      passwords_logged: false,
      payments_changed: false,
      public_ports_changed: false,
      router_changed: false,
      production_deploy: false,
      destructive_change: false,
    },
  };
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2), "utf8");
  return { ...receipt, absolutePath: receiptPath, relativePath: rel(receiptPath) };
}

function formatIntentDispatchCard(dispatchCard, receiptPath) {
  if (!dispatchCard) return "";
  const lines = [
    "PROPOSED_DISPATCH_CARD:",
    `TITLE: ${dispatchCard.title}`,
    `INTENT: ${dispatchCard.intent}`,
    `CAPABILITY_REQUIRED: ${(dispatchCard.capability_required || []).join(" | ")}`,
    `BEST_AEYE: ${dispatchCard.best_aeye}`,
    `SUPPORTING_AEYES: ${(dispatchCard.supporting_aeyes || []).join(" | ") || "none"}`,
    `BEST_MACHINE: ${dispatchCard.best_machine}`,
    `AVAILABILITY: ${dispatchCard.availability?.status || "unknown"} (${dispatchCard.availability?.evidence_status || "unknown"})`,
    `PROJECT_ID: ${dispatchCard.project_id || "unknown"}`,
    `OWNER_AGENT: ${dispatchCard.owner_agent || dispatchCard.best_aeye || "unknown"}`,
    `OWNER_MACHINE: ${dispatchCard.owner_machine || dispatchCard.best_machine || "unknown"}`,
    `BRANCH: ${dispatchCard.branch || "unknown"}`,
    `LOCK_DECISION: ${dispatchCard.project_lock?.decision || dispatchCard.lock_decision || "Allowed"}`,
    `LOCK_REASON: ${dispatchCard.project_lock?.reason || "No active project lock conflict."}`,
    `LOCK_BLOCKER: ${dispatchCard.project_lock?.blocker || "none"}`,
    `EXPECTED_RECEIPT: ${dispatchCard.expected_receipt}`,
    `WRITTEN_RECEIPT: ${receiptPath || "none"}`,
    `DISPATCH_CLASS: ${dispatchCard.dispatch_class}`,
    `HUMAN_GATE: ${dispatchCard.human_gate}`,
    `WHY: ${dispatchCard.why}`,
    `NEXT_ACTION: ${dispatchCard.next_action}`,
    `CONFIDENCE: ${dispatchCard.confidence}`,
  ];
  if (dispatchCard.structured_routing) {
    const routing = dispatchCard.structured_routing;
    lines.push(
      "STRUCTURED_ROUTING:",
      `PROJECT: ${routingChoiceLabel(routing, "project")}`,
      `AREA: ${routingChoiceLabel(routing, "area")}`,
      `AGENT: ${routingChoiceLabel(routing, "agent")}`,
      `MACHINE: ${routingChoiceLabel(routing, "machine")}`,
      `BRANCH: ${routing.generated_branch || routingChoiceLabel(routing, "branch")}`,
      `PATH: ${routingChoiceLabel(routing, "path")}`,
      `RETURN_RECEIPT_TO: ${routingChoiceLabel(routing, "return_receipt_to")}`
    );
  }
  return lines.join("\n");
}

function normalizeDenRoom(value) {
  const raw = value && typeof value === "object" ? value : {};
  const roomId = cleanLocalityId(raw.room_id || raw.roomId || raw.id || "wonka_den", "wonka_den");
  return {
    room_id: roomId,
    room_label: String(raw.room_label || raw.roomLabel || raw.label || "Wonka Den").trim() || "Wonka Den",
    zone: String(raw.zone || "den").trim() || "den",
    source_card_id: cleanLocalityId(raw.source_card_id || raw.sourceCardId || `den_room_${roomId}`, `den_room_${roomId}`),
    return_location: String(raw.return_location || raw.returnLocation || `#${roomId}`).trim() || `#${roomId}`,
  };
}

function formatDenRoomRelayBlock(artifact) {
  if (!artifact) return "";
  return [
    "DEN_ROOM_RELAY:",
    `ROOM: ${artifact.room.room_label} (${artifact.room.room_id})`,
    `STATE: ${artifact.dispatch_state}`,
    `TARGET_AEYE: ${artifact.target_aeye}`,
    `TARGET_MACHINE: ${artifact.target_machine}`,
    `PROJECT_ID: ${artifact.project_lock?.project_id || "unknown"}`,
    `PROJECT_LOCK: ${artifact.project_lock?.decision || "Allowed"}`,
    `BLOCKER: ${artifact.project_lock?.blocker || "none"}`,
    `ACTION_PACKET: ${artifact.action_path}`,
    `RECEIPT: ${artifact.receipt_path}`,
    `RETURN_LOCATION: ${artifact.room.return_location}`,
    `HUMAN_SEND_REQUIRED: ${artifact.human_send_required ? "yes" : "no"}`,
  ].join("\n");
}

function writeDenRoomIntentArtifacts({ room, intent, routing, governorResult, dispatchCard }) {
  fs.mkdirSync(AUTOMATICA_ACTIONS_DIR, { recursive: true });
  fs.mkdirSync(AUTOMATICA_RECEIPTS_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const intentSlug = cleanIntentSlug(intent || dispatchCard?.title || "room-intent");
  const roomSlug = cleanIntentSlug(room.room_id || "wonka-den");
  const actionId = `den_room_intent_${roomSlug}_${intentSlug}_${stamp}`;
  const receiptId = `den_room_intent_${roomSlug}_${intentSlug}_${stamp}`;
  const actionPath = path.join(AUTOMATICA_ACTIONS_DIR, `${actionId}.json`);
  const receiptPath = path.join(AUTOMATICA_RECEIPTS_DIR, `${receiptId}.json`);
  const targetAeye = dispatchCard.best_aeye || "Dink";
  const targetMachine = dispatchCard.best_machine || "Doss";
  let projectLock = dispatchCard.project_lock || evaluateProjectLock({ dispatchCard, routing, intent });
  let dispatchState = dispatchCard.best_aeye === "Operator" ? "NEEDS_CLARITY" : "READY_FOR_AEYE_RELAY";
  if (projectLock.decision === "Blocked") dispatchState = "BLOCKED_BY_PROJECT_LOCK";
  if (projectLock.decision === "Needs Merge") dispatchState = "NEEDS_MERGE";
  if (dispatchState === "READY_FOR_AEYE_RELAY") {
    projectLock = acquireProjectLock(dispatchCard, {
      source_card_id: room.source_card_id,
      action_id: actionId,
      action_path: rel(actionPath),
      receipt_path: rel(receiptPath),
    });
    if (projectLock.decision === "Blocked") dispatchState = "BLOCKED_BY_PROJECT_LOCK";
    if (projectLock.decision === "Needs Merge") dispatchState = "NEEDS_MERGE";
  }
  const dispatchCardWithLock = {
    ...dispatchCard,
    project_id: projectLock.project_id,
    owner_agent: projectLock.owner_agent,
    owner_machine: projectLock.owner_machine,
    branch: projectLock.branch,
    project_lock: projectLock,
    lock_decision: projectLock.decision,
    blocker: projectLock.blocker,
  };
  const humanSendRequired = true;
  const packet = {
    schema_version: "DEN_ROOM_INTENT_RELAY_PACKET.v0.1",
    action_id: actionId,
    created_at: new Date().toISOString(),
    source: "wonka_den_room",
    dispatch_state: dispatchState,
    room,
    operator_intent: intent,
    structured_routing: routing || null,
    target_aeye: targetAeye,
    target_machine: targetMachine,
    target_mission: dispatchCardWithLock.title,
    proposed_dispatch_card: dispatchCardWithLock,
    project_lock: projectLock,
    expected_receipt_path: rel(receiptPath),
    return_to: {
      card_id: room.source_card_id,
      location: room.return_location,
    },
    governor: {
      verdict: governorResult?.verdict,
      missionClass: governorResult?.missionClass,
      risk: governorResult?.risk,
      humanGate: governorResult?.humanGate,
      humanGateLevel: governorResult?.humanGateLevel,
    },
    relay_policy: {
      auto_send_to_external_aeye_chat: false,
      human_send_required: humanSendRequired,
      phone_fire_allowed: false,
      credentials_allowed: false,
      public_exposure_allowed: false,
      production_deploy_allowed: false,
    },
  };
  fs.writeFileSync(actionPath, JSON.stringify(packet, null, 2), "utf8");

  const receipt = {
    schema_version: "DEN_ROOM_INTENT_RELAY_RECEIPT.v0.1",
    receipt_id: receiptId,
    created_at: new Date().toISOString(),
    status: dispatchState === "BLOCKED_BY_PROJECT_LOCK"
      ? "blocked"
      : dispatchState === "NEEDS_MERGE"
        ? "needs_merge"
        : dispatchState === "NEEDS_CLARITY"
          ? "needs_clarity"
          : "packet_written",
    decision: dispatchState === "BLOCKED_BY_PROJECT_LOCK"
      ? "blocked_by_project_lock"
      : dispatchState === "NEEDS_MERGE"
        ? "needs_merge_before_project_work"
        : "den_room_intent_relay_packet_created",
    why: "A Wonka Den room free-form intent was classified, assigned to an Aeye/machine, and converted into a local relay packet instead of stopping at UI text.",
    evidence: [
      `room=${room.room_label}`,
      `target_aeye=${targetAeye}`,
      `target_machine=${targetMachine}`,
      `action_packet=${rel(actionPath)}`,
      `project_id=${projectLock.project_id}`,
      `project_lock=${projectLock.decision}`,
      `branch=${projectLock.branch}`,
      `governor_mission=${governorResult?.missionClass || "UNKNOWN"}`,
    ],
    assumption: "This is local packet and receipt generation only; external Aeye chats still require the approved courier/send path.",
    blocker: dispatchState === "NEEDS_CLARITY"
      ? "Intent needs clearer route before Aeye execution."
      : dispatchState === "BLOCKED_BY_PROJECT_LOCK" || dispatchState === "NEEDS_MERGE"
        ? projectLock.blocker
        : "none",
    next_action: dispatchState === "NEEDS_CLARITY"
      ? "Clarify the room intent or choose a specific Aeye/machine from the routing dropdowns."
      : dispatchState === "BLOCKED_BY_PROJECT_LOCK"
        ? projectLock.reason
        : dispatchState === "NEEDS_MERGE"
          ? projectLock.reason
          : `${targetAeye} can pick up ${rel(actionPath)} and return the next receipt to ${room.return_location}.`,
    confidence: dispatchCardWithLock.confidence || "medium",
    action_id: actionId,
    action_path: rel(actionPath),
    project_lock: projectLock,
    room,
    operator_intent: intent,
    proposed_dispatch_card: dispatchCardWithLock,
    safety: {
      credentials_captured: false,
      passwords_logged: false,
      payments_changed: false,
      public_ports_changed: false,
      router_changed: false,
      production_deploy: false,
      destructive_change: false,
      external_send_automated: false,
    },
  };
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2), "utf8");

  appendSwatterEvent({
    source: "den_room_intent",
    action: "den_room_intent_relay_packet",
    class: "BLUE",
    decision: dispatchState === "NEEDS_CLARITY" ? "blocked_and_receipted" : "packet_written_and_receipted",
    summary: `${room.room_label}: ${targetAeye} / ${targetMachine} relay packet written.`,
    why: "Room free-form intent routing is a local packet and receipt action.",
    blocker: receipt.blocker,
    receipt_path: rel(receiptPath),
    related_task: "DEN_ROOM_INTENT_RELAY",
    machine: "Doss",
    confidence: receipt.confidence,
  });

  return {
    ok: dispatchState !== "NEEDS_CLARITY",
    success: dispatchState !== "NEEDS_CLARITY",
    action_id: actionId,
    receipt_id: receiptId,
    action_path: rel(actionPath),
    receipt_path: rel(receiptPath),
    room,
    dispatch_state: dispatchState,
    target_aeye: targetAeye,
    target_machine: targetMachine,
    human_send_required: humanSendRequired,
    packet,
    receipt,
    project_lock: projectLock,
  };
}

function buildDenRoomIntentResponse(body) {
  const room = normalizeDenRoom(body.room || body.den_room || body.denRoom || body);
  const structuredRouting = normalizeGdStructuredRouting(body.routing);
  const submittedIntent = typeof body.intent === "string" ? body.intent : "";
  const fallbackIntent = [
    body.what_i_want_to_do || body.whatIWantToDo || body.need || structuredRouting?.need,
    structuredRouting ? formatGdStructuredRoutingIntent(structuredRouting) : "",
  ].filter((item) => String(item || "").trim()).join("\n\n");
  const intent = (submittedIntent.trim() || String(fallbackIntent || "").trim() || "Route this Den room intent to the best available Aeye.").slice(0, 4000);
  const result = classifyGdCommand(intent);
  const baseDispatchCard = buildIntentDispatchCard(intent, result, structuredRouting);
  const inferredDispatchCard = applyDenRoomInference(baseDispatchCard, intent, structuredRouting);
  const proposedDispatchCard = applyProjectLockToDispatchCard(inferredDispatchCard, structuredRouting, intent);
  const relayArtifact = writeDenRoomIntentArtifacts({
    room,
    intent,
    routing: structuredRouting,
    governorResult: result,
    dispatchCard: proposedDispatchCard,
  });
  const finalizedDispatchCard = relayArtifact.packet?.proposed_dispatch_card || proposedDispatchCard;
  const dispatchFormatted = formatIntentDispatchCard(finalizedDispatchCard, relayArtifact.receipt_path);
  const relayFormatted = formatDenRoomRelayBlock(relayArtifact);
  const formatted = `${formatGdCommandVerdict(result)}\n\n${dispatchFormatted}\n\n${relayFormatted}`;
  return {
    ok: true,
    success: true,
    result,
    proposed_dispatch_card: finalizedDispatchCard,
    intent_receipt_path: relayArtifact.receipt_path,
    room_receipt_path: relayArtifact.receipt_path,
    relay_packet_path: relayArtifact.action_path,
    den_room_intent: {
      room,
      dispatch_state: relayArtifact.dispatch_state,
      target_aeye: relayArtifact.target_aeye,
      target_machine: relayArtifact.target_machine,
      action_id: relayArtifact.action_id,
      action_path: relayArtifact.action_path,
      receipt_id: relayArtifact.receipt_id,
      receipt_path: relayArtifact.receipt_path,
      project_lock: relayArtifact.project_lock,
      human_send_required: relayArtifact.human_send_required,
    },
    formatted,
  };
}

function normalizeApprovalClass(value) {
  const cls = String(value || "RED").toUpperCase();
  return ["GREEN", "BLUE", "RED"].includes(cls) ? cls : "RED";
}

function isApprovalExpired(entry) {
  if (!entry?.expiration) return false;
  const expiresAt = Date.parse(entry.expiration);
  return Number.isFinite(expiresAt) && expiresAt < Date.now();
}

function resolveAutomaticaApproval(route) {
  const approvalMemory = loadAutomaticaApprovals();
  const candidates = new Set(
    [route.route_id, route.creates_action_type, route.command].filter((value) => typeof value === "string" && value)
  );
  const entries = approvalMemory.actions.filter((entry) => candidates.has(entry.action));
  const activeEntry = entries.find((entry) => !isApprovalExpired(entry));
  const expiredEntry = entries.find((entry) => isApprovalExpired(entry));
  const entry = activeEntry || expiredEntry || null;
  const cls = normalizeApprovalClass(entry?.class);
  const expired = Boolean(entry && !activeEntry);
  const approved = Boolean(entry && !expired && cls !== "RED");
  const action = entry?.action || route.creates_action_type || route.route_id || route.command || "UNKNOWN";

  return {
    action,
    class: cls,
    approved,
    expired,
    require_approval_every_time: cls === "RED",
    approved_by: entry?.approved_by || null,
    approved_date: entry?.approved_date || null,
    scope: entry?.scope || null,
    expiration: entry?.expiration || null,
    memory_path: rel(AUTOMATICA_APPROVALS),
    blocker: entry
      ? expired
        ? `Approval expired for ${action}.`
        : cls === "RED"
          ? `RED approval required every time for ${action}.`
          : "none"
      : `No Automatica approval memory entry matched ${action}.`,
  };
}

function approvalPacketFields(approval) {
  return {
    approval_memory: {
      action: approval.action,
      class: approval.class,
      approved: approval.approved,
      approved_by: approval.approved_by,
      approved_date: approval.approved_date,
      scope: approval.scope,
      expiration: approval.expiration || null,
      memory_path: approval.memory_path,
    },
  };
}

function listAutomaticaReceipts(route) {
  if (!route?.receipt_prefix || !fs.existsSync(AUTOMATICA_RECEIPTS_DIR)) return [];
  return fs
    .readdirSync(AUTOMATICA_RECEIPTS_DIR)
    .filter((name) => name.startsWith(`${route.receipt_prefix}_`) && name.endsWith(".json"))
    .map((name) => {
      const filePath = path.join(AUTOMATICA_RECEIPTS_DIR, name);
      const stat = fs.statSync(filePath);
      return { name, path: filePath, mtimeMs: stat.mtimeMs, mtime: stat.mtime.toISOString() };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
}

function readLatestAutomaticaReceipt(route) {
  const latest = listAutomaticaReceipts(route)[0];
  if (!latest) return null;
  const receipt = loadJson(latest.path);
  if (!receipt) return null;
  return { ...receipt, absolutePath: latest.path, relativePath: rel(latest.path), modifiedAt: latest.mtime };
}

function automaticaStateFromReceipt(receipt) {
  if (!receipt) return "READY";
  if (receipt.status === "failed") return "EXPLODED";
  if (receipt.status === "blocked") return "BLOCKED";
  return "RECEIPT RETURNED";
}

function automStamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function cleanLocalityId(value, fallback) {
  const cleaned = String(value || "")
    .replace(/[^A-Za-z0-9_.:-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 160);
  return cleaned || fallback;
}

function automCardId(route) {
  return cleanLocalityId(route?.card_id || `automatica_card_${route?.route_id || "unknown"}`, "automatica_card_unknown");
}

function automReturnLocation(cardId) {
  return `#automatica/${cardId}`;
}

function summarizeAutomaticaReceipt(receipt) {
  if (!receipt) return null;
  const pathRef = receipt.relativePath || receipt.receipt_path || null;
  const timestamp = receipt.last_timestamp || receipt.created_at || receipt.modifiedAt || null;
  return {
    receipt_id: receipt.receipt_id || null,
    path: pathRef,
    drawer_archive_path: receipt.receipt_drawer_archive_path || pathRef,
    created_at: receipt.created_at || receipt.modifiedAt || null,
    status: receipt.status || null,
    decision: receipt.decision || null,
    blocker: receipt.blocker || "none",
    next_action: receipt.next_action || null,
    parent_card_id: receipt.parent_card_id || receipt.card_id || null,
    action_id: receipt.action_id || null,
    approval_id: receipt.approval_id || null,
    expected_return_location: receipt.expected_return_location || null,
    ...cardLocalityFields({
      action: receipt.last_action || receipt.decision || receipt.status || null,
      receipt: receipt.last_receipt || pathRef,
      actor: receipt.last_actor || CARD_LOCALITY_ACTOR,
      timestamp,
    }),
  };
}

function buildAutomaticaStatus() {
  const routes = loadAutomaticaRouteMap();
  return {
    ok: true,
    routeMapPath: rel(AUTOMATICA_ROUTE_MAP),
    approvalMemoryPath: rel(AUTOMATICA_APPROVALS),
    runnerPath: rel(AUTOMATICA_RUNNER),
    states: ["READY", "APPROVED", "FIRED", "SENT", "WORKING", "BLOCKED", "RECEIPT RETURNED", "EXPLODED"],
    routes: routes.map((route) => {
      const receipt = readLatestAutomaticaReceipt(route);
      const blocker = receipt?.blocker || "none";
      const approval = resolveAutomaticaApproval(route);
      const cardId = automCardId(route);
      const latestReceipt = summarizeAutomaticaReceipt(receipt);
      return {
        card_id: cardId,
        route_id: route.route_id,
        card_label: route.card_label,
        target_owner: route.target_owner,
        target_machine: route.target_machine,
        creates_action_type: route.creates_action_type,
        command: route.command,
        expected_return_location: latestReceipt?.expected_return_location || automReturnLocation(cardId),
        action_id: latestReceipt?.action_id || null,
        approval_id: latestReceipt?.approval_id || null,
        approval_class: approval.class,
        approval_action: approval.action,
        approval_approved: approval.approved,
        approval_blocker: approval.blocker,
        approval_status: latestReceipt?.approval_id ? "approved" : "not requested",
        approval_timestamp: latestReceipt?.created_at || null,
        state: automaticaStateFromReceipt(receipt),
        receipt_status: receipt?.status || null,
        last_update: receipt?.created_at || receipt?.modifiedAt || null,
        blocker,
        receipt_path: receipt?.relativePath || null,
        action_path: receipt?.action_path || null,
        decision: receipt?.decision || null,
        confidence: receipt?.confidence || null,
        ...cardLocalityFields({
          action: latestReceipt?.last_action || null,
          receipt: latestReceipt?.last_receipt || receipt?.relativePath || null,
          actor: latestReceipt?.last_actor || CARD_LOCALITY_ACTOR,
          timestamp: latestReceipt?.last_timestamp || latestReceipt?.created_at || null,
        }),
        latest_receipt: latestReceipt,
      };
    }),
  };
}

function summarizeDenReceipt(filePath) {
  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const parsed = ext === ".json" ? loadJson(filePath) : null;
  let title = null;
  let preview = null;

  if (!parsed && ext === ".md") {
    const text = fs.readFileSync(filePath, "utf8");
    title = text.match(/^#\s+(.+)$/m)?.[1] || text.match(/^MISSION:\s*(.+)$/m)?.[1] || null;
    preview = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 3)
      .join(" ")
      .slice(0, 360);
  }

  return {
    receipt_id: parsed?.receipt_id || path.basename(filePath, ext),
    path: rel(filePath),
    created_at: parsed?.created_at || parsed?.createdAt || stat.mtime.toISOString(),
    modified_at: stat.mtime.toISOString(),
    source_type: ext === ".json" ? "json_receipt" : "markdown_receipt",
    status: parsed?.status || (parsed ? "recorded" : "markdown"),
    decision: parsed?.decision || parsed?.active_task || title || path.basename(filePath, ext),
    blocker: parsed?.blocker || null,
    next_action: parsed?.next_action || parsed?.nextAction || null,
    confidence: parsed?.confidence || null,
    preview,
  };
}

function listDenLatestReceipts(limit = 12) {
  if (!fs.existsSync(AUTOMATICA_RECEIPTS_DIR)) return [];
  return fs
    .readdirSync(AUTOMATICA_RECEIPTS_DIR)
    .filter((name) => name.endsWith(".json") || name.endsWith(".md"))
    .map((name) => {
      const filePath = path.join(AUTOMATICA_RECEIPTS_DIR, name);
      const stat = fs.statSync(filePath);
      return { filePath, mtimeMs: stat.mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .slice(0, limit)
    .map((item) => summarizeDenReceipt(item.filePath));
}

function buildDenMachines(machineHealth) {
  const queue = machineHealth?.queue || [];
  return (machineHealth?.machines || []).map((machine) => {
    const assignedTasks = queue.filter((task) => normalizeMachineId(task.assigned_machine) === machine.machine_id);
    return {
      machine_id: machine.machine_id,
      display_name: machine.display_name,
      hostname: machine.hostname,
      role: machine.role,
      status: machine.status,
      evidence_status: machine.evidence_status,
      reason: machine.reason || "none",
      state_changed_at: machine.state_changed_at || machine.updated_at || null,
      state_receipt_path: machine.state_receipt_path || machine.latest_receipt_path || null,
      blocker: machine.blocker || "none",
      dev_server: machine.dev_server || null,
      lane: machine.lane || null,
      build_allowed: machine.build_allowed,
      cursor_allowed: machine.cursor_allowed,
      terminal_allowed: machine.terminal_allowed,
      allowed_work: machine.allowed_work || [],
      disallowed_work: machine.disallowed_work || [],
      current_tasks: assignedTasks.map((task) => ({
        task_id: task.task_id,
        title: task.title,
        status: task.status,
        latest_receipt_path: task.latest_receipt_path || null,
      })),
      latest_receipt_path: machine.latest_receipt_path || null,
      updated_at: machine.updated_at || null,
    };
  });
}

function buildDenActiveProjects(machineHealth) {
  const queue = machineHealth?.queue || [];
  return queue
    .filter((task) => !WORK_QUEUE_TERMINAL_STATUSES.has(String(task.status || "").toLowerCase()))
    .map((task) => ({
      project_id: cleanIntentSlug(task.task_id),
      task_id: task.task_id,
      label: task.title || task.task_id,
      status: task.status,
      source_machine: task.source_machine || "UNKNOWN",
      assigned_machine: task.assigned_machine || "UNKNOWN",
      required_capability: task.required_capability || "UNKNOWN",
      blocker: task.blocker || "none",
      latest_receipt_path: task.latest_receipt_path || null,
      evidence_status: "work_queue",
      updated_at: task.updated_at || null,
      route_history: (task.route_history || []).slice(-3),
    }));
}

function buildDenProjectLocks(projectLocks) {
  return {
    path: projectLocks?.path || rel(PROJECT_LOCKS_JSON),
    policy: projectLocks?.policy || seedProjectLocksState().policy,
    decisions: projectLocks?.decisions || PROJECT_LOCK_DECISIONS,
    active_locks: (projectLocks?.active_locks || []).map((lock) => ({
      lock_id: lock.lock_id,
      project_id: lock.project_id,
      owner_agent: lock.owner_agent,
      owner_machine: lock.owner_machine,
      branch: lock.branch,
      status: lock.status,
      source_card_id: lock.source_card_id || null,
      action_id: lock.action_id || null,
      action_path: lock.action_path || null,
      receipt_path: lock.receipt_path || null,
      reason: lock.reason || `Active work on branch ${lock.branch}.`,
      updated_at: lock.updated_at || null,
    })),
    latest_event: projectLocks?.events?.[0] || null,
  };
}

function buildDenCrawlerPearls(crawlerPearls) {
  return {
    path: crawlerPearls?.path || rel(CRAWLER_PEARLS_JSON),
    rule: crawlerPearls?.rule || "Crawler pearls do not enter Working until promoted.",
    states: crawlerPearls?.states || CRAWLER_PEARL_STATES,
    counts: crawlerPearls?.counts || {},
    pearls: (crawlerPearls?.pearls || []).slice(0, 25).map((pearl) => ({
      pearl_id: pearl.pearl_id,
      state: pearl.state,
      source: pearl.source,
      summary: pearl.summary,
      why_it_matters: pearl.why_it_matters,
      confidence: pearl.confidence,
      latest_receipt_path: pearl.latest_receipt_path || null,
      last_action: pearl.last_action || null,
      last_receipt: pearl.last_receipt || pearl.latest_receipt_path || null,
      last_actor: pearl.last_actor || null,
      last_timestamp: pearl.last_timestamp || null,
      promoted_task_id: pearl.promoted_task_id || null,
      updated_at: pearl.updated_at || null,
    })),
  };
}

function buildDenForgeProjects(gdStatus, automaticaStatus) {
  const routingProjects = (gdStatus?.routingOptions?.projects || []).map((project) => ({
    project_id: project.id,
    label: project.label,
    hint: project.hint || "",
    status: "cataloged",
    evidence_status: "gimpdash_routing_option",
    source: "foreman/gd-intent-router",
    target_owner: null,
    target_machine: null,
    latest_receipt_path: null,
    blocker: "none",
  }));
  const relayProjects = (automaticaStatus?.routes || []).map((route) => ({
    project_id: `automatica_${route.route_id}`,
    label: route.card_label,
    hint: route.creates_action_type || "",
    status: route.state || "READY",
    evidence_status: "automatica_route",
    source: automaticaStatus.routeMapPath,
    target_owner: route.target_owner,
    target_machine: route.target_machine,
    latest_receipt_path: route.receipt_path || null,
    blocker: route.blocker || "none",
  }));
  return [...routingProjects, ...relayProjects];
}

function buildDenZonesPayload() {
  const machineHealth = buildMachineHealthStatus();
  const projectLocks = loadProjectLocksState();
  const crawlerPearls = buildCrawlerPearlsStatus();
  const swatter = buildSwatterEventStreamStatus();
  const gdStatus = buildGdStatus();
  const automaticaStatus = buildAutomaticaStatus();

  return {
    machines: buildDenMachines(machineHealth),
    activeProjects: buildDenActiveProjects(machineHealth),
    projectLocks: buildDenProjectLocks(projectLocks),
    latestReceipts: listDenLatestReceipts(12),
    crawlerPearls: buildDenCrawlerPearls(crawlerPearls),
    forgeProjects: buildDenForgeProjects(gdStatus, automaticaStatus),
    swatterCount: {
      total: (swatter.events || []).length,
      GREEN: swatter.counts?.GREEN || 0,
      BLUE: swatter.counts?.BLUE || 0,
      RED: swatter.counts?.RED || 0,
      latest_event_id: swatter.events?.[0]?.event_id || null,
      latest_receipt_path: swatter.events?.[0]?.receipt_path || null,
      last_action: swatter.last_action || null,
      last_receipt: swatter.last_receipt || swatter.events?.[0]?.receipt_path || null,
      last_actor: swatter.last_actor || null,
      last_timestamp: swatter.last_timestamp || null,
    },
  };
}

function writeAutomaticaPacket(route, state, extra = {}) {
  fs.mkdirSync(AUTOMATICA_ACTIONS_DIR, { recursive: true });
  const stamp = automStamp();
  const cardId = cleanLocalityId(extra.card_id, automCardId(route));
  const actionId = cleanLocalityId(extra.action_id, `automatica_fire_${route.route_id}_${stamp}`);
  const approvalId = cleanLocalityId(extra.approval_id, `approval_${route.route_id}_${stamp}`);
  const createdAt = extra.created_at || new Date().toISOString();
  const packetPath = path.join(AUTOMATICA_ACTIONS_DIR, `${actionId}.json`);
  const packet = {
    schema_version: "AUTOMATICA_FIRE_PACKET.v0.1",
    card_id: cardId,
    parent_card_id: cardId,
    action_id: actionId,
    approval_id: approvalId,
    route_id: route.route_id,
    card_label: route.card_label,
    target_owner: route.target_owner,
    target_machine: route.target_machine,
    state,
    created_at: createdAt,
    updated_at: new Date().toISOString(),
    approved_at: extra.approved_at || null,
    approval_status: extra.approval_status || (state === "FIRED" || state === "SENT" || state === "WORKING" ? "approved" : null),
    expected_return_location: extra.expected_return_location || automReturnLocation(cardId),
    command: route.command,
    creates_action_type: route.creates_action_type || null,
    ...(extra.approval_memory ? approvalPacketFields(extra.approval_memory) : {}),
    blocker: extra.blocker || "none",
    receipt_path: extra.receipt_path || null,
    route_attempted: Boolean(extra.route_attempted),
    ...cardLocalityFields({
      action: extra.last_action || String(state || "").toLowerCase(),
      receipt: extra.last_receipt || extra.receipt_path || null,
      actor: extra.last_actor || CARD_LOCALITY_ACTOR,
      timestamp: extra.last_timestamp || createdAt,
    }),
  };
  fs.writeFileSync(packetPath, JSON.stringify(packet, null, 2), "utf8");
  return { actionId, packetPath, packet };
}

function writeAutomaticaInlineReceipt(route, payload) {
  fs.mkdirSync(AUTOMATICA_RECEIPTS_DIR, { recursive: true });
  const stamp = automStamp();
  const cardId = cleanLocalityId(payload.card_id, automCardId(route));
  const actionId = cleanLocalityId(payload.action_id, `automatica_${route.route_id}_${stamp}`);
  const approvalId = cleanLocalityId(payload.approval_id, `approval_${route.route_id}_${stamp}`);
  const receiptPath = path.join(AUTOMATICA_RECEIPTS_DIR, `${route.receipt_prefix}_${stamp}.json`);
  const createdAt = new Date().toISOString();
  const receipt = {
    schema_version: "AUTOMATICA_ROUTE_RECEIPT.v0.1",
    receipt_id: `${route.receipt_prefix}_${stamp}`,
    card_id: cardId,
    parent_card_id: cardId,
    action_id: actionId,
    approval_id: approvalId,
    route_id: route.route_id,
    card_label: route.card_label,
    target_owner: route.target_owner,
    target_machine: route.target_machine,
    created_at: createdAt,
    approved_at: payload.approved_at || null,
    approval_status: payload.approval_status || "approved",
    expected_return_location: payload.expected_return_location || automReturnLocation(cardId),
    receipt_contract: ["decision", "why", "evidence", "assumption", "blocker", "next_action", "confidence"],
    ...payload,
  };
  receipt.receipt_path = rel(receiptPath);
  receipt.receipt_drawer_archive_path = rel(receiptPath);
  Object.assign(receipt, cardLocalityFields({
    action: receipt.last_action || receipt.decision || receipt.status || "receipt_returned",
    receipt: receipt.last_receipt || receipt.receipt_path,
    actor: receipt.last_actor || CARD_LOCALITY_ACTOR,
    timestamp: receipt.last_timestamp || createdAt,
  }));
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2), "utf8");
  return { ...receipt, absolutePath: receiptPath, relativePath: rel(receiptPath), modifiedAt: new Date().toISOString() };
}

async function runAutomaticaRoute(route, locality = {}) {
  try {
    const args = [AUTOMATICA_RUNNER, route.route_id];
    if (locality.action_id) args.push("--action-id", locality.action_id);
    if (locality.card_id) args.push("--card-id", locality.card_id);
    if (locality.approval_id) args.push("--approval-id", locality.approval_id);
    if (locality.expected_return_location) args.push("--expected-return-location", locality.expected_return_location);
    const stdout = await runCommand("python", args, { cwd: REPO_ROOT });
    return { ok: true, stdout, stderr: "", code: 0 };
  } catch (err) {
    return { ok: false, stdout: "", stderr: err.message || String(err), code: 1 };
  }
}

async function fireAutomaticaRoute(routeId, localityInput = {}) {
  const route = loadAutomaticaRouteMap().find((r) => r.route_id === routeId);
  if (!route) throw new Error(`Unknown Automatica route: ${routeId}`);
  const approval = resolveAutomaticaApproval(route);
  const stamp = automStamp();
  const cardId = cleanLocalityId(localityInput.cardId || localityInput.card_id, automCardId(route));
  const actionId = cleanLocalityId(localityInput.actionId || localityInput.action_id, `automatica_fire_${route.route_id}_${stamp}`);
  const approvalId = cleanLocalityId(localityInput.approvalId || localityInput.approval_id, `approval_${route.route_id}_${stamp}`);
  const approvedAt = localityInput.approvedAt || localityInput.approved_at || new Date().toISOString();
  const expectedReturnLocation = localityInput.expectedReturnLocation || localityInput.expected_return_location || automReturnLocation(cardId);
  const locality = {
    card_id: cardId,
    action_id: actionId,
    approval_id: approvalId,
    approved_at: approvedAt,
    approval_status: "approved",
    expected_return_location: expectedReturnLocation,
  };

  if (!approval.approved) {
    const receipt = writeAutomaticaInlineReceipt(route, {
      ...locality,
      status: "blocked",
      decision: approval.class === "RED" ? "red_approval_required" : "approval_memory_missing_or_expired",
      why: "Automatica approval memory blocks unapproved or RED-class actions from auto-executing.",
      evidence: [
        {
          kind: "approval_memory",
          action: approval.action,
          class: approval.class,
          approved: approval.approved,
          expired: approval.expired,
          memory_path: approval.memory_path,
        },
      ],
      assumption: "Only GREEN/BLUE actions with active approval memory may auto-execute from SoleDash.",
      blocker: approval.blocker,
      next_action: "Ben must explicitly approve this RED/expired/unlisted action before it can run.",
      confidence: "high",
      approval_memory: approvalPacketFields(approval).approval_memory,
    });
    const blockedPacket = writeAutomaticaPacket(route, "BLOCKED", {
      ...locality,
      route_attempted: false,
      blocker: approval.blocker,
      receipt_path: receipt.relativePath,
      approval_memory: approval,
    });
    return {
      ok: false,
      success: false,
      card_id: cardId,
      route_id: route.route_id,
      card_label: route.card_label,
      action_id: actionId,
      approval_id: approvalId,
      approved_at: approvedAt,
      approval_status: "blocked",
      expected_return_location: expectedReturnLocation,
      state: "BLOCKED",
      packet_path: rel(blockedPacket.packetPath),
      receipt_path: receipt.relativePath,
      latest_receipt: summarizeAutomaticaReceipt(receipt),
      blocker: approval.blocker,
      last_update: receipt.created_at,
      receipt_status: receipt.status,
      decision: receipt.decision,
      next_action: receipt.next_action,
      approval_class: approval.class,
      approval_action: approval.action,
      ...normalizeCardLocality(receipt, { action: receipt.decision, receipt: receipt.relativePath, timestamp: receipt.created_at }),
      successLabel: "BLOCKED",
      message: `${route.card_label}: RED/unknown approval blocked`,
    };
  }

  const fired = writeAutomaticaPacket(route, "FIRED", { ...locality, route_attempted: false, approval_memory: approval });
  writeAutomaticaPacket(route, "SENT", { ...locality, action_id: fired.actionId, created_at: fired.packet.created_at, approval_memory: approval });
  writeAutomaticaPacket(route, "WORKING", {
    ...locality,
    action_id: fired.actionId,
    created_at: fired.packet.created_at,
    route_attempted: true,
    approval_memory: approval,
  });

  const run = await runAutomaticaRoute(route, locality);
  let receipt = readLatestAutomaticaReceipt(route);
  if (!run.ok && !receipt) {
    receipt = {
      ...locality,
      status: "failed",
      decision: "route_exploded",
      blocker: run.stderr || "Automatica runner failed before writing route receipt.",
      next_action: "Dink should inspect the Automatica runner and rerun this card.",
      confidence: "high",
      created_at: new Date().toISOString(),
    };
  }
  if (approval.class === "BLUE" && !receipt) {
    receipt = writeAutomaticaInlineReceipt(route, {
      ...locality,
      status: "blocked",
      decision: "blue_receipt_required",
      why: "BLUE actions may execute only when a receipt is generated; approval memory cannot turn BLUE work into unreceipted work.",
      evidence: [
        {
          kind: "approval_memory",
          action: approval.action,
          class: approval.class,
          approved: approval.approved,
          memory_path: approval.memory_path,
        },
        {
          kind: "runner_result",
          ok: run.ok,
          stdout_tail: String(run.stdout || "").slice(-500),
          stderr_tail: String(run.stderr || "").slice(-500),
        },
      ],
      assumption: "The route runner completed without leaving a readable route receipt.",
      blocker: "BLUE action did not produce a route receipt; automatic follow-through is blocked until the handler writes one.",
      next_action: "Dink should repair the BLUE route handler receipt path, then rerun the card.",
      confidence: "high",
      approval_memory: approvalPacketFields(approval).approval_memory,
    });
  }

  const state = automaticaStateFromReceipt(receipt);
  const latestReceipt = summarizeAutomaticaReceipt(receipt);
  const finalPacket = writeAutomaticaPacket(route, state, {
    ...locality,
    action_id: fired.actionId,
    created_at: fired.packet.created_at,
    route_attempted: true,
    blocker: receipt?.blocker || (run.ok ? "none" : run.stderr),
    receipt_path: receipt?.relativePath || null,
    approval_memory: approval,
    last_action: latestReceipt?.last_action || state.toLowerCase(),
    last_receipt: latestReceipt?.last_receipt || receipt?.relativePath || null,
    last_actor: latestReceipt?.last_actor || CARD_LOCALITY_ACTOR,
    last_timestamp: latestReceipt?.last_timestamp || receipt?.created_at || new Date().toISOString(),
  });

  return {
    ok: run.ok || Boolean(receipt),
    success: run.ok || Boolean(receipt),
    card_id: cardId,
    route_id: route.route_id,
    card_label: route.card_label,
    action_id: actionId,
    approval_id: approvalId,
    approved_at: approvedAt,
    approval_status: "approved",
    expected_return_location: expectedReturnLocation,
    state,
    packet_path: rel(finalPacket.packetPath),
    receipt_path: receipt?.relativePath || null,
    latest_receipt: latestReceipt,
    blocker: receipt?.blocker || (run.ok ? "none" : run.stderr),
    last_update: receipt?.created_at || new Date().toISOString(),
    receipt_status: receipt?.status || null,
    decision: receipt?.decision || null,
    next_action: receipt?.next_action || null,
    approval_class: approval.class,
    approval_action: approval.action,
    stdout: run.stdout,
    stderr: run.stderr,
    ...cardLocalityFields({
      action: latestReceipt?.last_action || state.toLowerCase(),
      receipt: latestReceipt?.last_receipt || receipt?.relativePath || null,
      actor: latestReceipt?.last_actor || CARD_LOCALITY_ACTOR,
      timestamp: latestReceipt?.last_timestamp || receipt?.created_at || new Date().toISOString(),
    }),
    successLabel: state,
    message: `${route.card_label}: ${state}`,
  };
}

function readAutomaticaReceiptForRoute(routeId) {
  const route = loadAutomaticaRouteMap().find((r) => r.route_id === routeId);
  if (!route) throw new Error(`Unknown Automatica route: ${routeId}`);
  const receipt = readLatestAutomaticaReceipt(route);
  if (!receipt) throw new Error(`No receipt yet for ${route.card_label}`);
  return {
    ok: true,
    title: `${route.card_label} receipt`,
    path: receipt.relativePath,
    content: fs.readFileSync(receipt.absolutePath, "utf8"),
  };
}

function listOverseerReceipts() {
  if (!fs.existsSync(OVERSEER_RECEIPTS_DIR)) return [];
  return fs
    .readdirSync(OVERSEER_RECEIPTS_DIR)
    .filter((name) => name.startsWith("return_to_work_") && name.endsWith(".json"))
    .map((name) => {
      const filePath = path.join(OVERSEER_RECEIPTS_DIR, name);
      const stat = fs.statSync(filePath);
      return { name, path: filePath, mtimeMs: stat.mtimeMs, mtime: stat.mtime.toISOString() };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
}

function readLatestOverseerReceipt() {
  const latest = listOverseerReceipts()[0];
  if (!latest) return null;
  const receipt = loadJson(latest.path);
  if (!receipt) return null;
  return { ...receipt, absolutePath: latest.path, relativePath: rel(latest.path), modifiedAt: latest.mtime };
}

function buildOverseerStatus() {
  const latestReceipt = readLatestOverseerReceipt();
  return {
    ok: true,
    runnerPath: rel(OVERSEER_RUNNER),
    policyPath: rel(OVERSEER_POLICY),
    actionsDir: rel(OVERSEER_ACTIONS_DIR),
    receiptsDir: rel(OVERSEER_RECEIPTS_DIR),
    latestReceipt,
    latestStatus: latestReceipt?.status || "READY",
    humanRequiredCount: latestReceipt?.human_required?.length || 0,
    redGateCount: latestReceipt?.red_gates_blocked?.length || 0,
  };
}

async function runOverseerReturnToWork() {
  let stdout;
  try {
    stdout = await runCommand("python", [OVERSEER_RUNNER, "--repo-root", REPO_ROOT, "--source", "soledash-button"], {
      cwd: REPO_ROOT,
    });
  } catch (firstErr) {
    try {
      stdout = await runCommand("py", ["-3", OVERSEER_RUNNER, "--repo-root", REPO_ROOT, "--source", "soledash-button"], {
        cwd: REPO_ROOT,
      });
    } catch (secondErr) {
      throw new Error(`Permission Overseer runner failed: ${secondErr.message || firstErr.message}`);
    }
  }
  let parsed = null;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    parsed = { ok: false, success: false, raw: stdout };
  }
  const receiptText = parsed.receipt ? JSON.stringify(parsed.receipt, null, 2) : stdout;
  return {
    success: parsed.ok !== false,
    ok: parsed.ok !== false,
    title: "Permission Overseer receipt",
    content: receiptText,
    message: parsed.message || "Return-To-Work run complete",
    successLabel: parsed.human_required_count ? "Human needed" : "Restored",
    humanGate: parsed.human_required_count ? "HUMAN REQUIRED items in receipt" : null,
    receiptPath: parsed.receipt_path,
    actionPath: parsed.action_path,
    status: parsed.status,
  };
}

function speakerStatusBadge(status) {
  if (status === "RATIFIED") return `<span class="gd-ready">RATIFIED</span>`;
  if (status === "SUPERSEDED") return `<span class="muted">SUPERSEDED</span>`;
  return `<span class="warn-pill">DRAFT</span>`;
}

function formatSpeakerPanelCard(speaker) {
  const counts = speaker?.counts || { draft: 0, ratified: 0, superseded: 0 };
  const entryRows =
    (speaker?.entries || [])
      .slice(0, 16)
      .map(
        (e) =>
          `<tr><td>${speakerStatusBadge(e.status)}</td><td><code>${esc(e.id)}</code></td><td>${esc(e.title)}</td><td>${esc((e.tags || []).slice(0, 3).join(", "))}</td></tr>`
      )
      .join("") || '<tr><td colspan="4" class="muted">No entries yet</td></tr>';

  const warningRows =
    (speaker?.warnings || [])
      .slice(0, 10)
      .map(
        (e) =>
          `<li><strong>${esc(e.title)}</strong> <span class="muted">(${esc(e.status)})</span> — ${esc((e.warning_triggers || []).slice(0, 2).join("; ") || "—")}</li>`
      )
      .join("") || '<li class="muted">No warnings indexed</li>';

  const roleChips = (speaker?.roleRegistry?.roles || [])
    .slice(0, 14)
    .map((r) => `<span class="warn-pill" style="margin:2px 4px 2px 0;display:inline-block">${esc(r)}</span>`)
    .join("") || '<span class="muted">Registry not loaded</span>';

  return `
  <div class="plow" id="gd-speaker" style="margin-top:16px">
    <h2>Speaker</h2>
    <p class="lead">Independent constitutional office · <strong>why we believe this</strong> · causal memory · no executive hands</p>
    <p class="muted">GD consults Speaker. GD does not own Speaker. Only Ben ratifies. Not a summarizer — causal memory.</p>

    <div class="banner ok-banner" style="margin-bottom:10px;font-size:.92rem">
      ${counts.draft} draft · ${counts.ratified} ratified · ${counts.superseded} superseded
      · integration <code>foreman/speaker/GD_SPEAKER_CONSTITUTIONAL_INTEGRATION_V0.md</code>
    </div>

    <details open>
      <summary><strong>Aeye role registry</strong> <span class="muted">· cultural memory Speaker monitors</span></summary>
      <div style="margin-top:10px;line-height:1.8">${roleChips}</div>
      <div class="actions" style="margin-top:8px">
        <button type="button" class="btn" data-action="open-speaker-role-registry">Open Role Registry</button>
        <button type="button" class="btn" data-action="open-speaker-integration">Open Integration V0</button>
      </div>
    </details>

    <details open style="margin-top:10px">
      <summary><strong>Causal ledger</strong> <span class="muted">· ${counts.draft + counts.ratified + counts.superseded} entries</span></summary>
      <table class="gd-table" id="speaker-entries-table" style="margin-top:10px">
        <thead><tr><th>Status</th><th>ID</th><th>Title</th><th>Tags</th></tr></thead>
        <tbody>${entryRows}</tbody>
      </table>
    </details>

    <details open style="margin-top:10px">
      <summary><strong>Warnings &amp; lessons</strong> <span class="muted">· interrupt signatures</span></summary>
      <ul id="speaker-warnings-list" style="margin:10px 0 0 1rem;font-size:.92rem">${warningRows}</ul>
    </details>

    <details style="margin-top:10px">
      <summary><strong>Draft new entry</strong> <span class="muted">· DRAFT only — ten-field template</span></summary>
      <div class="gd-governor" style="margin-top:10px">
        <input id="speaker-draft-title" type="text" placeholder="Title (required)" style="width:100%;margin-bottom:8px;padding:8px" />
        <textarea id="speaker-draft-event" rows="2" placeholder="Event — what happened?" style="width:100%;margin-bottom:8px;padding:8px"></textarea>
        <textarea id="speaker-draft-context" rows="2" placeholder="Context — what was around it?" style="width:100%;margin-bottom:8px;padding:8px"></textarea>
        <textarea id="speaker-draft-lesson" rows="4" placeholder="Lesson learned (required)" style="width:100%;margin-bottom:8px;padding:8px"></textarea>
        <textarea id="speaker-draft-why" rows="2" placeholder="Why it happened — preserve cause, not slogans" style="width:100%;margin-bottom:8px;padding:8px"></textarea>
        <input id="speaker-draft-triggers" type="text" placeholder="Future warning triggers (comma-separated)" style="width:100%;margin-bottom:8px;padding:8px" />
        <div class="actions" style="margin-top:10px">
          <button type="button" class="btn primary" id="speaker-draft-btn">Save DRAFT entry</button>
          <button type="button" class="btn" data-action="open-speaker-charter">Open Charter</button>
          <button type="button" class="btn" data-action="open-speaker-ledger">Open Ledger</button>
          <button type="button" class="btn" data-action="open-speaker-template">Open Template</button>
        </div>
        <p class="muted" id="speaker-draft-meta" style="margin-top:8px">Writes <code>foreman/speaker/entries/DRAFT_*.md</code> · Ben ratifies · never auto-send</p>
        ${formatCardLocalityProof({}, "speaker-draft")}
      </div>
    </details>

    <p class="muted" style="margin-top:12px;margin-bottom:0">
      Route <code>/gd/speaker</code> → this panel · No SQL · No secrets · No canonicalize without Ben
    </p>
  </div>`;
}

function formatOverseerCard(overseer) {
  const latest = overseer?.latestReceipt;
  const humanItems = (latest?.human_required || [])
    .slice(0, 4)
    .map((item) => `<li><strong>${esc(item.gate || "HUMAN_REQUIRED")}:</strong> ${esc(item.reason || "")}</li>`)
    .join("");
  const status = overseer?.latestStatus || "READY";
  return `
  <div class="plow" id="overseer">
    <h2>Permission Overseer</h2>
    <p class="lead">Return-To-Work restores the local operator surface with BLUE gates only. RED gates return as HUMAN REQUIRED receipt entries.</p>
    <div class="overseer-status-row">
      <span><strong>Status</strong> ${esc(status)}</span>
      <span><strong>Human required</strong> ${esc(String(overseer?.humanRequiredCount || 0))}</span>
      <span><strong>Latest receipt</strong> <code>${esc(latest?.relativePath || "none yet")}</code></span>
    </div>
    <div class="actions">
      <button type="button" class="btn hero primary" data-action="overseer-return-to-work">Return-To-Work</button>
      <button type="button" class="btn hero" data-action="overseer-launch-soledash">Launch SoleDash</button>
      <button type="button" class="btn" data-action="overseer-open-receipts">Open Receipt Folder</button>
    </div>
    <div class="overseer-grid">
      <div>
        <h3>BLUE allowed</h3>
        <p>Local apps, local URLs, receipt folders, local dev/control servers, window layout, PowerToys startup, LAN-only confirmations.</p>
      </div>
      <div>
        <h3>RED locked</h3>
        <p>Passwords, MFA, payment, login, public firewall/router exposure, unknown executables, destructive cleanup, credentials/tokens.</p>
      </div>
    </div>
    ${humanItems ? `<ul class="muted" style="margin-top:10px">${humanItems}</ul>` : ""}
  </div>`;
}

function formatAutomaticaRelayCards(automatica) {
  const routes = automatica?.routes || [];
  const cards =
    routes
      .map((route) => {
        const canOpenReceipt = Boolean(route.receipt_path);
        const blocker = route.blocker || "none";
        const latest = route.latest_receipt || null;
        const receiptLabel = latest?.receipt_id || route.receipt_path || "none yet";
        const receiptDecision = latest?.decision || route.decision || "not returned";
        const receiptStatus = latest?.status || route.receipt_status || "none";
        const approvalStatus = route.approval_status || "not requested";
        return `
      <section class="automatica-card" data-automatica-card="${esc(route.route_id)}" data-card-id="${esc(route.card_id)}" data-state="${esc(route.state || "READY")}">
        <div class="automatica-card-head">
          <h3>${esc(route.card_label)}</h3>
          <span class="automatica-state" data-automatica-state>${esc(route.state || "READY")}</span>
        </div>
        <dl class="automatica-meta">
          <div><dt>Card</dt><dd><code data-automatica-card-id>${esc(route.card_id)}</code></dd></div>
          <div><dt>Target</dt><dd>${esc(route.target_owner)} / ${esc(route.target_machine)}</dd></div>
          <div><dt>Approval</dt><dd><span data-automatica-approval-status>${esc(approvalStatus)}</span><br><code data-automatica-approval>${esc(route.approval_id || "not approved")}</code></dd></div>
          <div><dt>Action</dt><dd><code data-automatica-action>${esc(route.action_id || "not fired")}</code></dd></div>
          <div><dt>Return</dt><dd><code data-automatica-return>${esc(route.expected_return_location || "same card")}</code></dd></div>
          <div><dt>Last update</dt><dd data-automatica-last-update>${esc(route.last_update || "never")}</dd></div>
          <div><dt>Blocker</dt><dd data-automatica-blocker>${esc(blocker)}</dd></div>
          <div><dt>Packet</dt><dd><code data-automatica-packet>${esc(route.action_path || "not fired")}</code></dd></div>
          <div><dt>Receipt</dt><dd><code data-automatica-receipt>${esc(route.receipt_path || "none yet")}</code></dd></div>
        </dl>
        <div class="automatica-card-receipt" data-automatica-latest-receipt>
          <div><strong>Latest receipt</strong> <span data-automatica-receipt-status>${esc(receiptStatus)}</span></div>
          <code data-automatica-receipt-id>${esc(receiptLabel)}</code>
          <p data-automatica-receipt-decision>${esc(receiptDecision)}</p>
        </div>
        ${formatCardLocalityProof({
          last_action: route.last_action,
          last_receipt: route.last_receipt || route.receipt_path,
          last_actor: route.last_actor,
          last_timestamp: route.last_timestamp || route.last_update,
        }, "automatica")}
        <div class="actions">
          <button type="button" class="btn hero primary" data-automatica-fire="${esc(route.route_id)}">APPROVE / FIRE</button>
          <button type="button" class="btn" data-automatica-open="${esc(route.route_id)}" ${canOpenReceipt ? "" : "disabled"}>OPEN RECEIPT DRAWER</button>
        </div>
      </section>`;
      })
      .join("");

  return `
  <div class="plow" id="automatica">
    <h2>Automatica Live Relay</h2>
    <p class="lead">Real local route cards. FIRE writes a packet, attempts the route, and returns receipt/blocker to the same card.</p>
    <div class="automatica-state-row">
      ${(automatica?.states || []).map((state) => `<span>${esc(state)}</span>`).join("")}
    </div>
    <div class="automatica-grid">${cards || '<p class="muted">No Automatica routes loaded.</p>'}</div>
  </div>`;
}

function formatMachineHealthCard(machineHealth) {
  const counts = machineHealth?.counts || {};
  const countPills = MACHINE_HEALTH_STATUSES
    .map((status) => `<span><strong>${esc(status)}</strong> ${esc(String(counts[status] || 0))}</span>`)
    .join("");
  const machineRows =
    (machineHealth?.machines || [])
      .map((machine) => `
        <tr data-machine-health-row="${esc(machine.machine_id)}" data-status="${esc(machine.status)}">
          <td><strong>${esc(machine.display_name)}</strong><br><code>${esc(machine.hostname)}</code></td>
          <td><span class="machine-health-status machine-health-${esc(machine.status)}">${esc(machine.status)}</span></td>
          <td>${esc(machine.role)}</td>
          <td>${esc(machine.evidence_status)}</td>
          <td>${esc(machine.blocker || "none")}</td>
          <td><code>${esc(machine.latest_receipt_path || "")}</code></td>
        </tr>`)
      .join("") || '<tr><td colspan="6" class="muted">No machine health state loaded.</td></tr>';
  const queueRows =
    (machineHealth?.queue || [])
      .map((task) => `
        <tr data-work-queue-row="${esc(task.task_id)}" data-assigned-machine="${esc(task.assigned_machine)}">
          <td><code>${esc(task.task_id)}</code><br>${esc(task.title)}</td>
          <td>${esc(task.status)}</td>
          <td>${esc(task.source_machine)}</td>
          <td><strong>${esc(task.assigned_machine)}</strong></td>
          <td>${esc(task.blocker || "none")}</td>
          <td><code>${esc(task.latest_receipt_path || "")}</code></td>
        </tr>`)
      .join("") || '<tr><td colspan="6" class="muted">No queue state loaded.</td></tr>';
  const latest = machineHealth?.latest_event;
  const latestBlock = latest
    ? `<p class="muted" style="margin-top:10px">Latest: ${esc(latest.machine_id)} ${esc(latest.action)} -> ${esc(latest.fallback_machine || "none")} | <code>${esc(latest.receipt_path || "")}</code></p>`
    : '<p class="muted" style="margin-top:10px">Latest: no machine health receipt yet.</p>';

  return `
  <div class="plow" id="machine-health" style="margin-top:16px">
    <h2>Machine Health Automation</h2>
    <p class="lead">Machine state has one source: GREEN, WATCH, DEGRADED, STOP, or QUARANTINE. Every state change requires reason, timestamp, and receipt.</p>
    <div class="automatica-state-row">${countPills}</div>
    <p class="muted">State: <code>${esc(machineHealth?.path || rel(MACHINE_HEALTH_JSON))}</code> | Queue: <code>${esc(machineHealth?.queue_path || rel(WORK_QUEUE_JSON))}</code></p>
    <div class="machine-health-grid">
      <section>
        <h3>Machines</h3>
        <div class="swatter-table-wrap">
          <table class="gd-table machine-health-table">
            <thead><tr><th>Machine</th><th>Status</th><th>Role</th><th>Evidence</th><th>Blocker</th><th>Receipt</th></tr></thead>
            <tbody>${machineRows}</tbody>
          </table>
        </div>
      </section>
      <section>
        <h3>Queue Continuity</h3>
        <div class="swatter-table-wrap">
          <table class="gd-table machine-health-table">
            <thead><tr><th>Task</th><th>Status</th><th>Source</th><th>Assigned</th><th>Blocker</th><th>Receipt</th></tr></thead>
            <tbody>${queueRows}</tbody>
          </table>
        </div>
      </section>
    </div>
    ${latestBlock}
  </div>`;
}

function formatGdSelect(id, label, options) {
  const items = (options || [])
    .map((option) => {
      const hint = option.hint ? ` (${option.hint})` : "";
      return `<option value="${esc(option.id)}">${esc(option.label)}${esc(hint)}</option>`;
    })
    .join("");
  return `
        <label class="gd-field" for="${esc(id)}">
          <span>${esc(label)}</span>
          <select id="${esc(id)}">${items}</select>
        </label>`;
}

function formatGimpDashHomeCard(gd) {
  const tr = gd?.threadRefresh || {};
  const routingOptions = gd?.routingOptions || buildGdRoutingOptions();
  const meta = tr.exists
    ? `<span class="gd-ready">Ready</span> · ${tr.chars} chars · ${esc(tr.modifiedAt || "")}` +
      (tr.runId ? ` · run <code>${esc(tr.runId)}</code>` : "")
    : "No packet yet — click Generate Thread Refresh Packet.";

  const missionRows =
    (gd?.missionClasses || [])
      .map((m) => {
        const mode =
          m.generationMode === "COCKPIT_DIRECT"
            ? "cockpit direct"
            : m.recipients?.length
              ? m.recipients.join(", ")
              : "—";
        return `<tr><td><code>${esc(m.id)}</code></td><td>${esc(m.label)}</td><td>${esc(mode)}</td></tr>`;
      })
      .join("") || '<tr><td colspan="3" class="muted">None</td></tr>';

  const runRows =
    (gd?.runs || [])
      .slice(0, 8)
      .map(
        (r) =>
          `<tr><td><code>${esc(r.runId)}</code></td><td>${esc(r.missionClass)}</td><td>${esc(r.status)}</td></tr>`
      )
      .join("") || '<tr><td colspan="3" class="muted">No runs yet</td></tr>';

  return `
  <div class="plow" id="gimpdash" style="margin-top:16px">
    <h2>GimpDash</h2>
    <p class="lead">One console · state what you want · GD governs topic and crew routing by role · <code>HUMAN_CONSUMABLE_OUTPUT_RULE_V1</code></p>

    <div class="gd-governor gd-hero">
      <h3>Room Intent Relay</h3>
      <form id="gd-routing-form" class="gd-routing-form">
        <div class="gd-routing-grid">
          ${formatGdSelect("gd-project-select", "Project", routingOptions.projects)}
          ${formatGdSelect("gd-area-select", "Area", routingOptions.areas)}
          ${formatGdSelect("gd-agent-select", "Agent", routingOptions.agents)}
          ${formatGdSelect("gd-machine-select", "Machine", routingOptions.machines)}
          ${formatGdSelect("gd-branch-select", "Branch", routingOptions.branches)}
          ${formatGdSelect("gd-path-select", "Path", routingOptions.paths)}
          ${formatGdSelect("gd-return-receipt-select", "Return Receipt To", routingOptions.returnReceiptTo)}
        </div>
        <label class="gd-field gd-field-wide" for="gd-need-input">
          <span>What I want to do</span>
          <textarea id="gd-need-input" rows="3" placeholder="Describe the outcome to route"></textarea>
        </label>
        <label class="gd-field gd-field-wide" for="gd-project-description-input">
          <span>Project description</span>
          <textarea id="gd-project-description-input" rows="3" placeholder="Useful context"></textarea>
        </label>
        <label class="gd-field gd-field-wide" for="gd-special-instructions-input">
          <span>Special instructions</span>
          <textarea id="gd-special-instructions-input" rows="3" placeholder="Limits, gates, or constraints"></textarea>
        </label>
      </form>
      <p class="muted">Plain language only. No crew picking. Governor routes Aeyes by seat — not Gmail In / Gmail Out.</p>
      <textarea id="gd-intent-input" rows="7" placeholder="State your intent in plain language.

Examples:
• Review homepage visual narrative — four beats, no deploy
• Thread refresh for a new Cursor session
• Import rent roll and check capital allocation posture
• Wire documentary nav icons locally, typecheck only"></textarea>
      <div class="actions" style="margin-top:10px">
        <button type="button" class="btn hero primary" id="gd-route-btn">Route to Aeyes</button>
        <button type="button" class="btn" id="gd-copy-governor-brief" disabled>Copy governor brief</button>
      </div>
      <div id="gd-governor-output" class="gd-governor-output hidden"></div>
    </div>

    <details style="margin-top:14px">
      <summary><strong>Thread refresh artifact</strong> <span class="muted">· cockpit-direct when governor routes thread refresh</span></summary>
      <p class="muted" style="margin-top:10px">Generate <code>THREAD_REFRESH_PACKET.md</code> from repo truth — paste into a fresh ChatGPT thread.</p>
      <div class="actions">
        <button type="button" class="btn primary" data-action="gd-thread-refresh">Generate Thread Refresh Packet</button>
        <button type="button" class="btn" data-action="copy-thread-refresh-packet">Copy to Clipboard</button>
        <button type="button" class="btn" data-action="open-thread-refresh-packet">Open Output File</button>
      </div>
      <p class="muted" style="margin-top:12px" id="gd-output-meta">${meta}</p>
      <pre id="gd-packet-preview" class="gd-preview"${tr.exists ? "" : " hidden"}>${tr.exists ? esc(tr.preview) : ""}</pre>
    </details>

    <details open style="margin-top:14px">
      <summary><strong>Mission classes</strong> <span class="muted">· cousin-routed: <code>npm run gd:generate</code></span></summary>
      <table class="gd-table" id="gd-mission-table" style="margin-top:10px">
        <thead><tr><th>Class</th><th>Label</th><th>Mode</th></tr></thead>
        <tbody>${missionRows}</tbody>
      </table>
    </details>

    <details open style="margin-top:10px">
      <summary><strong>Recent GD runs</strong></summary>
      <table class="gd-table" id="gd-runs-table" style="margin-top:10px">
        <thead><tr><th>Run</th><th>Mission</th><th>Status</th></tr></thead>
        <tbody>${runRows}</tbody>
      </table>
    </details>

    <p class="muted" style="margin-top:12px;margin-bottom:0">
      Output: <code>foreman/handoffs/outbox/THREAD_REFRESH_PACKET.md</code> · CLI: <code>npm run gd:thread-refresh</code>
      · <a href="#gd-speaker">Speaker window</a> (separate office)
    </p>
  </div>`;
}

function formatCrawlerPearlsCardLegacy(crawlerPearls) {
  const counts = crawlerPearls?.counts || {};
  const statePills = (crawlerPearls?.states || CRAWLER_PEARL_STATES)
    .map((state) => `<span><strong>${esc(state)}</strong> ${esc(String(counts[state] || 0))}</span>`)
    .join("");
  const pearlCards =
    (crawlerPearls?.pearls || [])
      .map((pearl) => {
        const terminal = CRAWLER_PEARL_TERMINAL_STATES.has(pearl.state);
        const promoteDisabled = terminal ? "disabled" : "";
        const archiveDisabled = terminal ? "disabled" : "";
        const killDisabled = terminal ? "disabled" : "";
        const latestReceipt = pearl.latest_receipt_path ? `<p class="muted">Receipt: <code>${esc(pearl.latest_receipt_path)}</code></p>` : "";
        const promotedTask = pearl.promoted_task_id ? `<p class="muted">Task packet: <code>${esc(pearl.promoted_task_id)}</code></p>` : "";
        return `
      <section class="crawler-pearl-card" data-crawler-pearl="${esc(pearl.pearl_id)}" data-state="${esc(pearl.state)}">
        <div class="crawler-pearl-head">
          <h3>${esc(pearl.summary)}</h3>
          <span class="crawler-pearl-state" data-crawler-pearl-state>${esc(pearl.state)}</span>
        </div>
        <dl class="automatica-meta">
          <div><dt>Source</dt><dd><code>${esc(pearl.source)}</code></dd></div>
          <div><dt>Summary</dt><dd>${esc(pearl.summary)}</dd></div>
          <div><dt>Why</dt><dd>${esc(pearl.why_it_matters)}</dd></div>
        </dl>
        ${promotedTask}
        ${latestReceipt}
        ${formatCardLocalityProof(pearl, "crawler-pearl")}
        <div class="actions">
          <button type="button" class="btn primary" data-crawler-pearl-action="promote" data-pearl-id="${esc(pearl.pearl_id)}" ${promoteDisabled}>Promote to Task</button>
          <button type="button" class="btn" data-crawler-pearl-action="archive" data-pearl-id="${esc(pearl.pearl_id)}" ${archiveDisabled}>Archive</button>
          <button type="button" class="btn blocked" data-crawler-pearl-action="kill" data-pearl-id="${esc(pearl.pearl_id)}" ${killDisabled}>Kill</button>
        </div>
      </section>`;
      })
      .join("");

  return `
  <div class="plow" id="crawler-pearls" style="margin-top:16px">
    <h2>Crawler Pearls</h2>
    <p class="lead">Crawler findings stay here as pearls. They do not enter Working until Ben promotes one to a task.</p>
    <div class="automatica-state-row">${statePills}</div>
    <p class="muted">Store: <code>${esc(crawlerPearls?.path || rel(CRAWLER_PEARLS_JSON))}</code> · ${esc(crawlerPearls?.rule || "Crawler pearls do not enter Working until promoted.")}</p>
    <div class="crawler-pearl-grid">${pearlCards || '<p class="muted">No crawler pearls loaded.</p>'}</div>
  </div>`;
}

function formatCrawlerPearlBoardCard(pearl) {
  const terminal = CRAWLER_PEARL_TERMINAL_STATES.has(pearl.state);
  const reviewDisabled = terminal || pearl.state === "Reviewed" ? "disabled" : "";
  const promoteDisabled = terminal ? "disabled" : "";
  const archiveDisabled = terminal ? "disabled" : "";
  const killDisabled = terminal ? "disabled" : "";
  const latestReceipt = pearl.latest_receipt_path ? `<p class="muted">Receipt: <code>${esc(pearl.latest_receipt_path)}</code></p>` : "";
  const promotedTask = pearl.promoted_task_id ? `<p class="muted">Task packet: <code>${esc(pearl.promoted_task_id)}</code></p>` : "";
  return `
      <section class="crawler-pearl-card" data-crawler-pearl="${esc(pearl.pearl_id)}" data-state="${esc(pearl.state)}">
        <div class="crawler-pearl-head">
          <h3>${esc(pearl.summary)}</h3>
          <span class="crawler-pearl-state" data-crawler-pearl-state>${esc(pearl.state)}</span>
        </div>
        <dl class="automatica-meta">
          <div><dt>Source</dt><dd><code>${esc(pearl.source)}</code></dd></div>
          <div><dt>Summary</dt><dd>${esc(pearl.summary)}</dd></div>
          <div><dt>Why</dt><dd>${esc(pearl.why_it_matters)}</dd></div>
        </dl>
        ${promotedTask}
        ${latestReceipt}
        ${formatCardLocalityProof(pearl, "crawler-pearl")}
        <div class="actions">
          <button type="button" class="btn" data-crawler-pearl-action="review" data-pearl-id="${esc(pearl.pearl_id)}" ${reviewDisabled}>Reviewed</button>
          <button type="button" class="btn primary" data-crawler-pearl-action="promote" data-pearl-id="${esc(pearl.pearl_id)}" ${promoteDisabled}>Promote to Task</button>
          <button type="button" class="btn" data-crawler-pearl-action="archive" data-pearl-id="${esc(pearl.pearl_id)}" ${archiveDisabled}>Archive</button>
          <button type="button" class="btn blocked" data-crawler-pearl-action="kill" data-pearl-id="${esc(pearl.pearl_id)}" ${killDisabled}>Kill</button>
        </div>
      </section>`;
}

function formatCrawlerPearlsCard(crawlerPearls) {
  const counts = crawlerPearls?.counts || {};
  const states = crawlerPearls?.states || CRAWLER_PEARL_STATES;
  const pearls = crawlerPearls?.pearls || [];
  const statePills = states
    .map((state) => `<span><strong>${esc(state)}</strong> ${esc(String(counts[state] || 0))}</span>`)
    .join("");
  const lanes = states
    .map((state) => {
      const lanePearls = pearls.filter((pearl) => pearl.state === state);
      return `
      <section class="crawler-pearl-lane" data-crawler-pearl-lane="${esc(state)}">
        <div class="crawler-pearl-lane-head">
          <h3>${esc(state)}</h3>
          <span>${esc(String(lanePearls.length))}</span>
        </div>
        <div class="crawler-pearl-lane-body">
          ${lanePearls.length ? lanePearls.map(formatCrawlerPearlBoardCard).join("") : '<p class="muted">Empty lane</p>'}
        </div>
      </section>`;
    })
    .join("");

  return `
  <div class="plow" id="crawler-pearls" style="margin-top:16px">
    <h2>Crawler Pearls Board V0</h2>
    <p class="lead">Crawler findings stay in board lanes. They do not enter Working until Ben promotes one to a task.</p>
    <div class="automatica-state-row">${statePills}</div>
    <p class="muted">Store: <code>${esc(crawlerPearls?.path || rel(CRAWLER_PEARLS_JSON))}</code> · ${esc(crawlerPearls?.rule || "Crawler pearls do not enter Working until promoted.")}</p>
    <div class="crawler-pearl-board">${lanes || '<p class="muted">No crawler pearls loaded.</p>'}</div>
  </div>`;
}

function formatSwatterEventStreamCard(swatterEvents) {
  const counts = swatterEvents?.counts || {};
  const classPills = SWATTER_CLASSES
    .map((cls) => `<span><strong>${esc(cls)}</strong> ${esc(String(counts[cls] || 0))}</span>`)
    .join("");
  const eventRows =
    (swatterEvents?.events || [])
      .slice(0, 18)
      .map((event) => `
        <tr data-swatter-event="${esc(event.event_id)}" data-class="${esc(event.class)}">
          <td><span class="swatter-class swatter-${esc(String(event.class).toLowerCase())}">${esc(event.class)}</span></td>
          <td>${esc(event.created_at)}</td>
          <td>${esc(event.source)}</td>
          <td>${esc(event.action)}</td>
          <td>${esc(event.summary)}</td>
          <td>${esc(event.blocker || "none")}</td>
          <td><code>${esc(event.receipt_path || "")}</code></td>
        </tr>`)
      .join("") || '<tr><td colspan="7" class="muted">No Swatter events yet</td></tr>';

  return `
  <div class="plow" id="swatter-event-stream" style="margin-top:16px">
    <h2>Swatter Event Stream V0</h2>
    <p class="lead">Hands Gate Swatter events: routine local actions become GREEN/BLUE evidence; RED remains human-required.</p>
    <div class="automatica-state-row">${classPills}</div>
    <p class="muted">Store: <code>${esc(swatterEvents?.path || rel(SWATTER_EVENT_STREAM_JSON))}</code> · ${esc(swatterEvents?.rule || "RED remains human-required.")}</p>
    ${formatCardLocalityProof(swatterEvents || {}, "swatter-event-stream")}
    <div class="swatter-table-wrap">
      <table class="gd-table swatter-table">
        <thead><tr><th>Class</th><th>Time</th><th>Source</th><th>Action</th><th>Summary</th><th>Blocker</th><th>Receipt</th></tr></thead>
        <tbody>${eventRows}</tbody>
      </table>
    </div>
  </div>`;
}

async function generateThreadRefreshPacketAction() {
  const stdout = await runNodeScript(GD_ROUTER_MJS, ["thread-refresh"]);
  let parsed = {};
  try {
    parsed = JSON.parse(stdout);
  } catch {
    parsed = { runId: "unknown" };
  }
  if (!fs.existsSync(THREAD_REFRESH_PACKET)) {
    throw new Error("THREAD_REFRESH_PACKET.md not written — check gd-intent-router");
  }
  const text = fs.readFileSync(THREAD_REFRESH_PACKET, "utf8");
  await copyToClipboard(text);
  await openPath(THREAD_REFRESH_PACKET);
  return {
    success: true,
    ok: true,
    message: `Thread refresh packet generated (${text.length} chars) — copied to clipboard. Paste into a fresh ChatGPT thread.`,
    successLabel: "Generated",
    file: rel(THREAD_REFRESH_PACKET),
    runId: parsed.runId,
    chars: text.length,
  };
}

async function handleAction(action) {
  switch (action) {
    case "refresh-crew-dispatch": {
      const out = await runPs1(["-Action", "Refresh"]);
      return {
        success: true,
        message: "Crew dispatch dashboard refreshed",
        successLabel: "Refreshed",
        detail: out,
      };
    }
    case "generate-petra":
      return generatePacket("petra");
    case "generate-skybro":
      return generatePacket("skybro");
    case "generate-ender":
      return generatePacket("ender");
    case "generate-bean":
      return generatePacket("bean");
    case "generate-computer":
      return generatePacket("computer");
    case "gd-thread-refresh":
      return generateThreadRefreshPacketAction();
    case "open-gimpdash":
      await openPath(`${LOCAL_PANEL_URL}#gimpdash`);
      return {
        success: true,
        message: "GimpDash section opened on Foreman home",
        successLabel: "Opened",
        url: `${LOCAL_PANEL_URL}#gimpdash`,
      };
    case "open-speaker-panel":
      await openPath(`${LOCAL_PANEL_URL}#gd-speaker`);
      return {
        success: true,
        message: "Speaker panel opened on Foreman home",
        successLabel: "Opened",
        url: `${LOCAL_PANEL_URL}#gd-speaker`,
      };
    case "open-speaker-charter": {
      const charter = path.join(REPO_ROOT, "foreman", "speaker", "SPEAKER_CHARTER.md");
      await openPath(charter);
      return { success: true, message: "Speaker charter opened", successLabel: "Opened", file: rel(charter) };
    }
    case "open-speaker-role-registry": {
      const registry = path.join(REPO_ROOT, "foreman", "speaker", "AEYE_ROLE_REGISTRY.md");
      await openPath(registry);
      return { ok: true, message: "Opened role registry", path: registry };
    }
    case "open-speaker-integration": {
      const integration = path.join(REPO_ROOT, "foreman", "speaker", "GD_SPEAKER_CONSTITUTIONAL_INTEGRATION_V0.md");
      await openPath(integration);
      return { ok: true, message: "Opened integration V0", path: integration };
    }
    case "open-speaker-template": {
      const template = path.join(REPO_ROOT, "foreman", "speaker", "SPEAKER_PACKET_TEMPLATE.md");
      await openPath(template);
      return { ok: true, message: "Opened packet template", path: template };
    }
    case "open-speaker-ledger": {
      const ledger = path.join(REPO_ROOT, "foreman", "speaker", "CAUSAL_LEDGER.md");
      await openPath(ledger);
      return { success: true, message: "Causal ledger opened", successLabel: "Opened", file: rel(ledger) };
    }
    case "open-thread-refresh-packet":
      if (!fs.existsSync(THREAD_REFRESH_PACKET)) {
        throw new Error("No thread refresh packet yet — click Generate Thread Refresh Packet first");
      }
      await openPath(THREAD_REFRESH_PACKET);
      return {
        success: true,
        message: "Thread refresh packet opened",
        successLabel: "Opened",
        file: rel(THREAD_REFRESH_PACKET),
      };
    case "copy-thread-refresh-packet":
      if (!fs.existsSync(THREAD_REFRESH_PACKET)) {
        throw new Error("No thread refresh packet yet — click Generate Thread Refresh Packet first");
      }
      await copyToClipboard(fs.readFileSync(THREAD_REFRESH_PACKET, "utf8"));
      return {
        success: true,
        message: "THREAD_REFRESH_PACKET.md copied to clipboard",
        successLabel: "Copied",
        file: rel(THREAD_REFRESH_PACKET),
      };
    case "open-outbox":
      await openFolder(PATHS.outbox);
      return { success: true, message: "Outbox opened", successLabel: "Opened", folder: rel(PATHS.outbox) };
    case "open-inbox":
      await openFolder(PATHS.inbox);
      return { success: true, message: "Inbox opened", successLabel: "Opened", folder: rel(PATHS.inbox) };
    case "open-reviews":
      await openFolder(PATHS.reviews);
      return { success: true, message: "Reviews opened", successLabel: "Opened", folder: rel(PATHS.reviews) };
    case "open-gate-review": {
      const review = findGateReviewPath();
      if (!review) throw new Error("No gate review HTML mapped for current gate");
      await openPath(review);
      return { success: true, message: "Gate review opened", successLabel: "Opened", file: rel(review) };
    }
    case "copy-petra-paste":
      return copyPasteBlock("petra");
    case "copy-skybro-paste":
      return copyPasteBlock("skybro");
    case "copy-ender-paste":
      return copyPasteBlock("ender");
    case "copy-bean-paste":
      return copyPasteBlock("bean");
    case "copy-computer-paste":
      return copyPasteBlock("computer");
    case "show-current-gate":
      return {
        success: true,
        title: "Current gate",
        content: readText(PATHS.nextAction, 35).text,
        message: "Current gate loaded",
        successLabel: "Shown",
      };
    case "show-active-agent":
      return {
        success: true,
        title: "Active Agent",
        content: readText(PATHS.activeAgent).text,
        message: "Active agent loaded",
        successLabel: "Shown",
      };
    case "show-budget-status":
      return {
        success: true,
        title: "Budget Status",
        content: readText(PATHS.budget, 60).text,
        message: "Budget status loaded",
        successLabel: "Shown",
      };
    case "open-aeye-crew-bay":
      return openAeyeCrewBay();
    case "overseer-return-to-work":
      return runOverseerReturnToWork();
    case "overseer-launch-soledash":
      await openPath(`${LOCAL_PANEL_URL}#overseer`);
      return {
        success: true,
        ok: true,
        message: "SoleDash / LightTrip opened",
        successLabel: "Opened",
        url: `${LOCAL_PANEL_URL}#overseer`,
      };
    case "overseer-open-receipts":
      fs.mkdirSync(OVERSEER_RECEIPTS_DIR, { recursive: true });
      await openFolder(OVERSEER_RECEIPTS_DIR);
      return {
        success: true,
        ok: true,
        message: "Permission Overseer receipt folder opened",
        successLabel: "Opened",
        folder: rel(OVERSEER_RECEIPTS_DIR),
      };
    case "prepare-petra":
      return preparePetraDispatch();
    case "pin-desktop-shortcuts":
      return pinDesktopShortcuts();
    case "load-petra-packet":
      return loadCousinPacket("petra", false);
    case "load-skybro-packet":
      return loadCousinPacket("skybro", false);
    case "load-ender-packet":
      return loadCousinPacket("ender", false);
    case "load-bean-packet":
      return loadCousinPacket("bean", false);
    case "load-computer-packet":
      return loadCousinPacket("computer", false);
    case "load-petra-and-bay":
      return loadCousinPacket("petra", true);
    case "refresh-finance-dashboard":
      return refreshFinanceDashboard();
    case "crew-relay-validate": {
      const result = await runCrewRelay("validate");
      const detail = result.stdout || result.stderr;
      const pass = result.code === 0;
      return {
        success: pass,
        ok: pass,
        title: "Crew Relay — Validate Inbox",
        content: detail,
        message: pass ? "Inbox validation passed" : "Inbox validation failed — see report",
        successLabel: pass ? "Valid" : "Failed",
      };
    }
    case "crew-relay-process-dry-run": {
      const result = await runCrewRelay("process", ["--dry-run"]);
      const detail = result.stdout || result.stderr;
      return {
        success: result.code === 0,
        ok: result.code === 0,
        title: "Crew Relay — Dry Run",
        content: detail,
        message: "Dry-run complete — nothing moved",
        successLabel: result.code === 0 ? "Dry-run OK" : "Failed",
      };
    }
    case "crew-relay-process": {
      const result = await runCrewRelay("process");
      const detail = result.stdout || result.stderr;
      const pass = result.code === 0;
      return {
        success: pass,
        ok: pass,
        title: pass ? "Crew Relay — Processed" : "Crew Relay — Process Halted",
        content: detail,
        message: pass
          ? "Responses processed to inbox/processed/"
          : "Process halted — validation failed; nothing moved",
        successLabel: pass ? "Processed" : "Halted",
      };
    }
    case "crew-relay-self-test": {
      const gen = await runNodeScript(CREW_RELAY_GENERATOR, ["--self-test"]);
      const intake = await runNodeScript(CREW_RELAY_INTAKE, ["--self-test"]);
      return {
        success: true,
        ok: true,
        title: "Crew Relay Hash Self-Test",
        content: `Generator:\n${gen}\n\nIntake:\n${intake}`,
        message: "Hash self-test passed",
        successLabel: "PASS",
      };
    }
    case "crew-relay-run-fixtures": {
      const result = await runNodeScriptAllowFail(CREW_RELAY_INTAKE, ["run-fixtures"]);
      const detail = result.stdout || result.stderr;
      const pass = result.code === 0;
      return {
        success: pass,
        ok: pass,
        title: "Crew Relay Fixtures",
        content: detail,
        message: pass ? "All fixture tests passed" : "Fixture tests failed",
        successLabel: pass ? "PASS" : "FAIL",
      };
    }
    case "crew-relay-list-sent": {
      const detail = await runNodeScript(CREW_RELAY_INTAKE, ["list-outbox", "--sent"]);
      return {
        success: true,
        ok: true,
        title: "Sent Outbox Packets",
        content: detail,
        message: "Sent packet list loaded",
        successLabel: "Listed",
      };
    }
    case "crew-relay-archive-sent": {
      const detail = await runNodeScript(CREW_RELAY_INTAKE, ["archive-sent"]);
      return {
        success: true,
        ok: true,
        title: "Archive Old Sent Packets",
        content: detail,
        message: "Archive sweep complete",
        successLabel: "Archived",
      };
    }
    case "crew-relay-issue-network-sync":
      return issueNetworkRoleSync();
    case "crew-relay-network-paste-petra":
      return copyNetworkPaste("petra");
    case "crew-relay-network-paste-skybro":
      return copyNetworkPaste("skybro");
    case "crew-relay-network-paste-ender":
      return copyNetworkPaste("ender");
    case "crew-relay-network-paste-bean":
      return copyNetworkPaste("bean");
    case "crew-relay-network-paste-computer":
      return copyNetworkPaste("computer");
    case "crew-courier-deliver-petra":
      return deliverNetworkCourier("petra", { ensureEdge: true });
    case "crew-courier-deliver-skybro":
      return deliverNetworkCourier("skybro");
    case "crew-courier-deliver-ender":
      return deliverNetworkCourier("ender");
    case "crew-courier-deliver-bean":
      return deliverNetworkCourier("bean");
    case "crew-courier-deliver-computer":
      return deliverNetworkCourier("computer");
    case "crew-courier-focus-petra":
      return deliverNetworkCourier("petra", { ensureEdge: true, tabOnly: true });
    case "crew-courier-focus-skybro":
      return deliverNetworkCourier("skybro", { tabOnly: true });
    case "crew-courier-focus-ender":
      return deliverNetworkCourier("ender", { tabOnly: true });
    case "crew-courier-focus-bean":
      return deliverNetworkCourier("bean", { tabOnly: true });
    case "crew-courier-focus-computer":
      return deliverNetworkCourier("computer", { tabOnly: true });
    case "crew-courier-walk-network-sync":
      return startNetworkCourierWalk({ ensureEdge: true });
    case "build-boot-petra": {
      const out = await runNodeScript(BUILD_BOOT_PACKET_MJS, ["--cousin", "PETRA"]);
      return {
        success: true,
        ok: true,
        title: "Boot packet — Petra",
        content: out,
        message: "BOOT packet generated — CLASS B load, human Send",
        successLabel: "Boot ready",
        humanGate: "STOP BEFORE SEND",
      };
    }
    case "build-boot-bean": {
      const out = await runNodeScript(BUILD_BOOT_PACKET_MJS, ["--cousin", "BEAN"]);
      return {
        success: true,
        ok: true,
        title: "Boot packet — Bean",
        content: out,
        message: "BOOT packet generated — CLASS B load, human Send",
        successLabel: "Boot ready",
        humanGate: "STOP BEFORE SEND",
      };
    }
    case "relay-courier-status": {
      const out = await runNodeScript(RELAY_COURIER_MJS, ["status"]);
      return {
        success: true,
        ok: true,
        title: "Relay Courier status",
        content: out,
        message: "Courier status loaded",
        successLabel: "Status",
      };
    }
    case "verify-aeye-tab-mapping": {
      const out = await runNodeScriptAllowFail(RELAY_COURIER_MJS, ["verify-tabs"]);
      let parsed = null;
      try {
        parsed = JSON.parse(out.stdout || out.stderr);
      } catch {
        parsed = { raw: out.stdout || out.stderr };
      }
      const ok = out.code === 0 && parsed?.ok !== false;
      return {
        success: ok,
        ok,
        title: ok ? "Tab mapping OK" : "Tab mapping errors",
        content: out.stdout || out.stderr || JSON.stringify(parsed, null, 2),
        message: ok
          ? "All five Aeye tabs match config + manifest"
          : "Fix tab mapping before relay — see EDGE_EMBED_DOCTRINE.md",
        successLabel: ok ? "Verified" : "Fix mapping",
        humanGate: ok ? null : "MANUAL LOAD REQUIRED if indices wrong",
      };
    }
    case "open-imagery-direction": {
      if (!fs.existsSync(IMAGERY_DIRECTION)) throw new Error("IMAGERY_DIRECTION.md missing");
      await openPath(IMAGERY_DIRECTION);
      return {
        success: true,
        ok: true,
        title: "Imagery doctrine",
        content: readText(IMAGERY_DIRECTION, 40).text,
        message: "Opened foreman/IMAGERY_DIRECTION.md",
        successLabel: "Opened",
      };
    }
    case "open-ender-imagery-packet": {
      const target = fs.existsSync(ENDER_IMAGERY_WIRE_PACKET)
        ? ENDER_IMAGERY_WIRE_PACKET
        : null;
      if (!target) throw new Error("TO_ENDER_IMAGERY_DIRECTION_WIRE_v0.1.md missing — Generate Fresh Ender Packet");
      await openPath(target);
      return {
        success: true,
        ok: true,
        title: "Ender imagery wire packet",
        content: readText(target, 35).text,
        message: "Opened Ender wire packet — STOP BEFORE SEND",
        successLabel: "Opened",
        humanGate: "STOP BEFORE SEND",
      };
    }
    case "generate-ender-imagery-packet": {
      const out = await runNodeScript(CREW_PACKET_GENERATOR, [
        "--cousin",
        "ENDER",
        "--mission",
        "ender-imagery-direction",
      ]);
      let parsed = null;
      try {
        parsed = JSON.parse(out);
      } catch {
        parsed = { raw: out };
      }
      const packetFile = parsed?.packetFile;
      if (packetFile && fs.existsSync(packetFile)) {
        await stampRelayMetadata(packetFile, "ender");
        await openPath(packetFile);
      }
      return {
        success: true,
        ok: true,
        title: "Ender imagery packet generated",
        content: out,
        message: "Fresh Ender imagery packet in outbox — STOP BEFORE SEND",
        successLabel: "Generated",
        humanGate: "STOP BEFORE SEND",
      };
    }
    default:
      if (BLOCKED_ACTIONS.some((b) => b.id === action) || FINANCE_BLOCKED_ACTIONS.some((b) => b.id === action)) {
        return { blocked: true, ok: false, success: false, message: "HUMAN GATE REQUIRED", action };
      }
      throw new Error(`Unknown action: ${action}`);
  }
}

function renderPage(status, localToken, theme) {
  const stale = status.dispatch?.staleWarning;
  const staleFiles = (stale?.stalePacketFiles || []).map((f) => `<li><code>${esc(f)}</code></li>`).join("");
  const blockedButtons = BLOCKED_ACTIONS.map(
    (b) =>
      `<button type="button" class="btn blocked" data-action="${esc(b.id)}">${esc(b.label)}</button>`
  ).join("\n");
  const inboxList = (status.inboxMarkdown || [])
    .map((f) => `<li><code>${esc(f.name)}</code></li>`)
    .join("");
  const outboxUnsentList = (status.outboxUnsent || [])
    .map((f) => `<li><code>${esc(f.name)}</code></li>`)
    .join("");

  const relayLock = status.relay?.relayLock;
  const courierLockBanner = formatCourierLockBanner(relayLock);
  const mobileReadOnlyBanner = localToken ? "" : `<div class="banner warn-banner"><strong>Mobile read-only:</strong> live cards are visible, but FIRE, relay, receipt-writing, paste, and file actions are blocked from non-localhost clients.</div>`;
  const relayStartLocality = normalizeCardLocality(status.relay?.session || {}, {
    action: status.relay?.session?.state && status.relay.session.state !== "idle" ? status.relay.session.state : null,
    receipt: rel(path.join(REPO_ROOT, "foreman", "crew-dispatch", ".relay-session.json")),
    timestamp: status.relay?.session?.updatedAt || status.relay?.session?.startedAt || null,
  });

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SoleDash / LightTrip</title>
  <style>
    /* Synced from lib/design-tokens.ts + app/globals.css — see foreman/control-panel/TOKENS_SYNC.md */
    :root {
      --paper: ${theme.paper};
      --paper-soft: ${theme.paperSoft};
      --ink: ${theme.ink};
      --ink-muted: ${theme.inkMuted};
      --copper: ${theme.copper};
      --ok: ${theme.ok};
      --wait: ${theme.wait};
      --stop: ${theme.stop};
      --panel-border: ${theme.panelBorder};
      --gate-bg: ${theme.gateBg};
    }
    * { box-sizing: border-box; }
    body { font-family: "Segoe UI", sans-serif; background: var(--paper-soft); color: var(--ink); margin: 0; padding: 24px; }
    h1 { margin: 0 0 4px; font-size: 1.6rem; }
    .sub { color: var(--ink-muted); margin-bottom: 20px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
    .card { background: var(--paper); border: 1px solid var(--panel-border); border-radius: 12px; padding: 16px; }
    .card h2 { margin: 0 0 10px; font-size: 1rem; color: var(--copper); text-transform: uppercase; letter-spacing: .06em; }
    .gate { background: var(--gate-bg); border: 2px solid var(--copper); border-radius: 12px; padding: 16px 18px; margin-bottom: 16px; }
    .gate code { font-size: 1rem; }
    pre, .mono { font-family: Consolas, monospace; font-size: .85rem; white-space: pre-wrap; background: color-mix(in srgb, var(--ink) 5%, transparent); padding: 10px; border-radius: 8px; max-height: 220px; overflow: auto; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .btn { border: 1px solid color-mix(in srgb, var(--copper) 45%, transparent); background: var(--paper); color: var(--ink); padding: 8px 12px; border-radius: 8px; cursor: pointer; font-size: .9rem; }
    .btn:hover:not(:disabled) { background: var(--gate-bg); }
    .btn:disabled { opacity: .65; cursor: wait; }
    .btn.primary { background: color-mix(in srgb, var(--copper) 15%, var(--paper)); font-weight: 600; }
    .btn.blocked { border-color: color-mix(in srgb, var(--stop) 35%, transparent); color: var(--stop); }
    .btn-pending { border-color: var(--wait); }
    .btn-success { border-color: var(--ok); color: color-mix(in srgb, var(--ok) 70%, var(--ink)); }
    .btn-failed { border-color: var(--stop); color: var(--stop); }
    .banner { background: color-mix(in srgb, var(--stop) 8%, var(--paper)); border: 1px solid color-mix(in srgb, var(--stop) 25%, transparent); color: var(--stop); padding: 10px 12px; border-radius: 8px; margin-bottom: 16px; font-weight: 600; }
    .ok-banner { background: color-mix(in srgb, var(--ok) 8%, var(--paper)); border-color: color-mix(in srgb, var(--ok) 25%, transparent); color: color-mix(in srgb, var(--ok) 70%, var(--ink)); }
    .warn-banner { background: color-mix(in srgb, var(--warn, #c9a227) 12%, var(--paper)); border-color: color-mix(in srgb, #c9a227 30%, transparent); }
    .relay-status { margin-top: 8px; }
    #toast { position: fixed; bottom: 20px; right: 20px; max-width: 420px; padding: 12px 14px; border-radius: 10px; background: var(--ink); color: var(--paper); display: none; z-index: 9; }
    #toast.error { background: var(--stop); color: var(--paper); }
    #modal { position: fixed; inset: 0; background: color-mix(in srgb, var(--ink) 18%, transparent); display: none; align-items: flex-start; justify-content: center; padding: 72px 20px 20px; z-index: 8; pointer-events: none; }
    #modal.open { pointer-events: auto; }
    #modal .panel { background: var(--paper); max-width: 900px; width: 100%; max-height: 78vh; overflow: auto; border-radius: 12px; padding: 18px; border: 1px solid color-mix(in srgb, var(--copper) 28%, transparent); box-shadow: 0 12px 40px rgba(44,35,29,.12); pointer-events: auto; }
    #modal .panel .modal-hint { margin: 0 0 10px; font-size: .82rem; color: var(--muted); }
    ul { margin: 8px 0 0 18px; }
    .muted { color: var(--ink-muted); font-size: .88rem; }
    textarea { width: 100%; min-height: 120px; padding: 10px; border-radius: 8px; border: 1px solid var(--panel-border); background: var(--paper); color: var(--ink); font-family: Consolas, monospace; font-size: .85rem; }
    input[type=text] { width: 100%; max-width: 320px; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--panel-border); background: var(--paper); color: var(--ink); }
    select { width: 100%; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--panel-border); background: var(--paper); color: var(--ink); font: inherit; }
    .plow { background: var(--gate-bg); border: 3px solid var(--copper); border-radius: 16px; padding: 22px 24px; margin-bottom: 18px; }
    .plow h2 { margin: 0 0 6px; font-size: 1.25rem; color: var(--ink); text-transform: none; letter-spacing: 0; }
    .plow .lead { margin: 0 0 16px; font-size: 1rem; color: var(--ink-muted); }
    .btn.hero { font-size: 1.05rem; padding: 14px 20px; font-weight: 700; }
    .btn.hero.primary { background: color-mix(in srgb, var(--copper) 22%, var(--paper)); border-width: 2px; }
    .overseer-status-row { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0 14px; }
    .overseer-status-row span { border: 1px solid var(--panel-border); border-radius: 8px; padding: 8px 10px; background: var(--paper); color: var(--ink-muted); font-size: .86rem; }
    .overseer-status-row strong { color: var(--ink); margin-right: 4px; }
    .overseer-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; margin-top: 12px; }
    .overseer-grid > div { border: 1px solid var(--panel-border); border-radius: 8px; padding: 12px; background: var(--paper); }
    .automatica-state-row { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0 14px; }
    .automatica-state-row span { border: 1px solid var(--panel-border); border-radius: 999px; padding: 4px 8px; font-size: .72rem; color: var(--ink-muted); background: var(--paper); }
    .automatica-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(270px, 1fr)); gap: 12px; }
    .automatica-card { background: var(--paper); border: 1px solid color-mix(in srgb, var(--copper) 28%, transparent); border-radius: 8px; padding: 14px; min-height: 260px; display: flex; flex-direction: column; justify-content: space-between; }
    .automatica-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
    .automatica-card h3 { margin: 0; font-size: .95rem; line-height: 1.2; color: var(--ink); letter-spacing: 0; }
    .automatica-state { border: 1px solid color-mix(in srgb, var(--copper) 35%, transparent); border-radius: 999px; padding: 4px 8px; font-size: .68rem; font-weight: 700; white-space: nowrap; color: var(--ink); background: color-mix(in srgb, var(--copper) 9%, var(--paper)); }
    .automatica-card[data-state="BLOCKED"] .automatica-state,
    .automatica-card[data-state="EXPLODED"] .automatica-state { border-color: color-mix(in srgb, var(--stop) 40%, transparent); color: var(--stop); background: color-mix(in srgb, var(--stop) 7%, var(--paper)); }
    .automatica-card[data-state="RECEIPT RETURNED"] .automatica-state { border-color: color-mix(in srgb, var(--ok) 40%, transparent); color: color-mix(in srgb, var(--ok) 72%, var(--ink)); background: color-mix(in srgb, var(--ok) 9%, var(--paper)); }
    .automatica-card[data-state="APPROVED"] .automatica-state,
    .automatica-card[data-state="WORKING"] .automatica-state,
    .automatica-card[data-state="FIRED"] .automatica-state,
    .automatica-card[data-state="SENT"] .automatica-state { border-color: color-mix(in srgb, var(--wait) 55%, transparent); color: color-mix(in srgb, var(--wait) 70%, var(--ink)); background: color-mix(in srgb, var(--wait) 10%, var(--paper)); }
    .automatica-meta { margin: 0 0 12px; display: grid; gap: 8px; }
    .automatica-meta div { display: grid; grid-template-columns: 76px minmax(0, 1fr); gap: 8px; }
    .automatica-meta dt { color: var(--ink-muted); font-size: .72rem; text-transform: uppercase; letter-spacing: .04em; }
    .automatica-meta dd { margin: 0; min-width: 0; font-size: .84rem; line-height: 1.35; overflow-wrap: anywhere; }
    .automatica-meta code { font-size: .76rem; }
    .automatica-card-receipt { border: 1px solid color-mix(in srgb, var(--ok) 22%, var(--panel-border)); background: color-mix(in srgb, var(--ok) 5%, var(--paper)); border-radius: 8px; padding: 10px; margin: 0 0 12px; display: grid; gap: 6px; min-height: 88px; }
    .automatica-card-receipt div { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .automatica-card-receipt span { border: 1px solid var(--panel-border); border-radius: 999px; padding: 2px 7px; font-size: .68rem; color: var(--ink-muted); background: var(--paper); white-space: nowrap; }
    .automatica-card-receipt code { font-size: .74rem; overflow-wrap: anywhere; }
    .automatica-card-receipt p { margin: 0; font-size: .8rem; line-height: 1.35; color: var(--ink-muted); overflow-wrap: anywhere; }
    .card-locality-proof { border: 1px solid color-mix(in srgb, var(--copper) 24%, var(--panel-border)); border-radius: 8px; padding: 8px 10px; margin: 0 0 12px; display: grid; gap: 5px; background: color-mix(in srgb, var(--copper) 5%, var(--paper)); }
    .card-locality-proof div { display: grid; grid-template-columns: 92px minmax(0, 1fr); gap: 8px; align-items: start; }
    .card-locality-proof dt { color: var(--ink-muted); font-size: .68rem; text-transform: uppercase; letter-spacing: .04em; }
    .card-locality-proof dd { margin: 0; min-width: 0; font-size: .8rem; line-height: 1.35; overflow-wrap: anywhere; }
    .card-locality-proof code { font-size: .74rem; overflow-wrap: anywhere; }
    .crawler-pearl-board { display: grid; grid-template-columns: repeat(5, minmax(260px, 1fr)); gap: 12px; margin-top: 12px; overflow-x: auto; padding-bottom: 6px; }
    .crawler-pearl-lane { min-width: 260px; border: 1px solid color-mix(in srgb, var(--copper) 22%, transparent); border-radius: 8px; background: color-mix(in srgb, var(--ink) 3%, transparent); padding: 10px; }
    .crawler-pearl-lane-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
    .crawler-pearl-lane-head h3 { margin: 0; font-size: .84rem; line-height: 1.2; text-transform: uppercase; letter-spacing: .04em; color: var(--ink-muted); }
    .crawler-pearl-lane-head span { border: 1px solid var(--panel-border); border-radius: 999px; padding: 2px 7px; font-size: .7rem; color: var(--ink-muted); background: var(--paper); }
    .crawler-pearl-lane-body { display: grid; gap: 10px; align-content: start; }
    .crawler-pearl-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 12px; margin-top: 12px; }
    .crawler-pearl-card { background: var(--paper); border: 1px solid color-mix(in srgb, var(--copper) 26%, transparent); border-radius: 8px; padding: 14px; display: grid; gap: 10px; }
    .crawler-pearl-card[data-state="Archived"],
    .crawler-pearl-card[data-state="Killed"] { opacity: .72; }
    .crawler-pearl-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
    .crawler-pearl-head h3 { margin: 0; font-size: .96rem; line-height: 1.25; color: var(--ink); letter-spacing: 0; }
    .crawler-pearl-state { border: 1px solid var(--panel-border); border-radius: 999px; padding: 4px 8px; font-size: .68rem; font-weight: 700; color: var(--ink-muted); background: var(--gate-bg); white-space: nowrap; }
    .crawler-pearl-card[data-state="Promoted to Task"] .crawler-pearl-state { border-color: color-mix(in srgb, var(--ok) 38%, transparent); color: color-mix(in srgb, var(--ok) 72%, var(--ink)); }
    .crawler-pearl-card[data-state="Killed"] .crawler-pearl-state { border-color: color-mix(in srgb, var(--stop) 38%, transparent); color: var(--stop); }
    .swatter-table-wrap { overflow: auto; margin-top: 12px; border: 1px solid var(--panel-border); border-radius: 8px; background: var(--paper); }
    .swatter-table { min-width: 980px; margin: 0; }
    .swatter-class { display: inline-block; border: 1px solid var(--panel-border); border-radius: 999px; padding: 2px 7px; font-size: .68rem; font-weight: 700; }
    .swatter-green { color: color-mix(in srgb, var(--ok) 72%, var(--ink)); border-color: color-mix(in srgb, var(--ok) 35%, transparent); }
    .swatter-blue { color: color-mix(in srgb, var(--wait) 76%, var(--ink)); border-color: color-mix(in srgb, var(--wait) 45%, transparent); }
    .swatter-red { color: var(--stop); border-color: color-mix(in srgb, var(--stop) 40%, transparent); }
    .machine-health-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 12px; margin-top: 12px; }
    .machine-health-grid h3 { margin: 0 0 8px; font-size: .92rem; line-height: 1.2; color: var(--ink); letter-spacing: 0; }
    .machine-health-table { min-width: 760px; margin: 0; }
    .machine-health-status { display: inline-block; border: 1px solid var(--panel-border); border-radius: 999px; padding: 2px 7px; font-size: .68rem; font-weight: 700; }
    .machine-health-GREEN { color: color-mix(in srgb, var(--ok) 72%, var(--ink)); border-color: color-mix(in srgb, var(--ok) 35%, transparent); }
    .machine-health-WATCH { color: color-mix(in srgb, var(--wait) 75%, var(--ink)); border-color: color-mix(in srgb, var(--wait) 45%, transparent); }
    .machine-health-DEGRADED { color: color-mix(in srgb, var(--copper) 78%, var(--ink)); border-color: color-mix(in srgb, var(--copper) 45%, transparent); }
    .machine-health-STOP { color: var(--stop); border-color: color-mix(in srgb, var(--stop) 40%, transparent); }
    .machine-health-QUARANTINE { color: var(--stop); border-color: color-mix(in srgb, var(--stop) 55%, transparent); background: color-mix(in srgb, var(--stop) 6%, var(--paper)); }
    .load-row .btn { min-width: 118px; }
    .gd-hero { background: color-mix(in srgb, var(--copper) 6%, var(--paper)); border: 1px solid color-mix(in srgb, var(--copper) 35%, transparent); border-radius: 12px; padding: 14px 16px; margin-top: 12px; }
    .gd-hero h3 { margin: 0 0 8px; font-size: 1rem; text-transform: uppercase; letter-spacing: .05em; color: var(--ink-muted); }
    .gd-routing-form { display: grid; gap: 10px; margin-top: 10px; }
    .gd-routing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; }
    .gd-field { display: grid; gap: 5px; min-width: 0; }
    .gd-field span { font-size: .72rem; text-transform: uppercase; letter-spacing: .05em; color: var(--ink-muted); font-weight: 700; }
    .gd-field textarea { min-height: 72px; font-family: inherit; font-size: .9rem; line-height: 1.35; margin-top: 0; }
    .gd-field-wide { grid-column: 1 / -1; }
    .gd-governor > p.muted:first-of-type, #gd-intent-input { display: none; }
    .gd-preview { background: rgba(44,35,29,.05); border-radius: 8px; padding: 12px; overflow: auto; max-height: 280px; font-size: .82rem; line-height: 1.45; white-space: pre-wrap; margin-top: 10px; }
    .gd-preview.hidden { display: none; }
    .gd-table { width: 100%; border-collapse: collapse; font-size: .88rem; }
    .gd-table th, .gd-table td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--panel-border); vertical-align: top; }
    .gd-table th { font-size: .72rem; text-transform: uppercase; letter-spacing: .05em; color: var(--ink-muted); }
    .gd-ready { color: var(--ok); font-weight: 600; }
    .gd-governor textarea { min-height: 140px; font-family: inherit; font-size: .95rem; line-height: 1.45; margin-top: 8px; }
    .gd-governor-output { margin-top: 14px; padding-top: 14px; border-top: 1px solid color-mix(in srgb, var(--copper) 25%, transparent); }
    .gd-governor-output.hidden { display: none; }
    .gd-governor-output h4 { margin: 14px 0 6px; font-size: .78rem; text-transform: uppercase; letter-spacing: .05em; color: var(--ink-muted); }
    .gd-verdict-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin: 12px 0; }
    .gd-verdict-card { background: var(--paper); border: 1px solid var(--panel-border); border-radius: 10px; padding: 10px 12px; }
    .gd-verdict-card .gd-k { display: block; font-size: .68rem; text-transform: uppercase; letter-spacing: .06em; color: var(--ink-muted); margin-bottom: 4px; }
    .gd-verdict-card .gd-v { display: block; font-weight: 700; font-size: .92rem; }
    .gd-verdict-no-go { border-color: color-mix(in srgb, var(--danger, #b42318) 45%, transparent); background: color-mix(in srgb, var(--danger, #b42318) 6%, var(--paper)); }
    .gd-verdict-review { border-color: color-mix(in srgb, var(--copper) 55%, transparent); }
    .gd-verdict-draft { border-color: color-mix(in srgb, var(--ok) 35%, transparent); }
    .gd-crew-list { margin: 6px 0 0 18px; padding: 0; }
    .gd-crew-list li { margin-bottom: 6px; }
  </style>
</head>
<body>
  <h1>SoleDash / LightTrip</h1>
  <p class="sub">Foreman Control Panel · Ben's operator dashboard · ${esc(status.generatedAt)} · <strong>Stops before Send</strong></p>
  <div class="banner ok-banner" style="margin-bottom:16px">
    <strong>This panel:</strong> <code>${LOCAL_PANEL_DISPLAY_URL}</code> &nbsp;|&nbsp;
    <strong>Not this:</strong> <code>http://localhost:3000</code> (Werkles app preview — run <code>npm run dev</code> separately)
  </div>

  ${courierLockBanner}

  ${mobileReadOnlyBanner}

  <div class="plow" id="relay-start-card">
    <h2>START HERE — Network sync relay</h2>
    <p class="lead">1) <strong>Open Aeye Crew Bay</strong> (Robot Zone) · 2) <strong>Run Network Sync Relay</strong> below · 3) Click <strong>Send</strong> in Edge · 4) <strong>I Sent — Next Cousin</strong></p>
    <div class="actions">
      <button type="button" class="btn hero primary" data-action="open-aeye-crew-bay">Open Aeye Crew Bay</button>
      <button type="button" class="btn hero" id="relay-start-plow">Run Network Sync Relay</button>
      <button type="button" class="btn hero" id="relay-sent-plow" disabled>I Sent — Next Cousin</button>
    </div>
    <p class="muted" style="margin-top:14px">Daily packets: Refresh Crew Dispatch → Generate packet → courier loads tab · Send stays your gate.</p>
    ${formatCardLocalityProof(relayStartLocality, "relay-start")}
    <div class="actions load-row" style="margin-top:10px">
      <button type="button" class="btn" data-action="prepare-petra">Prepare Petra</button>
      <button type="button" class="btn" data-action="pin-desktop-shortcuts">Pin to Desktop</button>
    </div>
  </div>

  <div class="banner ok-banner">You are on the dashboard. Repo-root .cmd files are fallback only for emergencies.</div>

  <div class="gate">
    <div class="muted">Current gate</div>
    <code>${esc(status.gate)}</code>
  </div>

  ${formatOverseerCard(status.overseer)}

  ${formatAutomaticaRelayCards(status.automatica)}

  ${formatMachineHealthCard(status.machineHealth)}

  ${formatGimpDashHomeCard(status.gd)}

  ${formatCrawlerPearlsCard(status.crawlerPearls)}

  ${formatSwatterEventStreamCard(status.swatterEvents)}

  ${formatSpeakerPanelCard(status.speaker)}

  <div class="grid">
    <div class="card">
      <h2>Current state</h2>
      <pre>${esc(status.stateSummary || "(no summary)")}</pre>
    </div>
    <div class="card">
      <h2>Operator dashboard</h2>
      <pre>${esc(status.operatorSnippet || "(missing)")}</pre>
    </div>
    <div class="card">
      <h2>Active agent</h2>
      <pre>${esc(status.activeAgentSnippet || "(missing ACTIVE_AGENT.md)")}</pre>
    </div>
    <div class="card">
      <h2>Budget status</h2>
      <pre>${esc(status.budgetSnippet || "(missing BUDGET.md)")}</pre>
    </div>
    <div class="card">
      <h2>Context health</h2>
      ${formatContextHealthCard(status.relay?.contextHealth)}
    </div>
    <div class="card">
      <h2>Robot Zone lock</h2>
      <p><strong>Status:</strong> <code>${esc(relayLock?.status || "IDLE")}</code></p>
      <p class="muted">${esc(relayLock?.message || "Courier idle")}</p>
    </div>
    <div class="card">
      <h2>Crew dispatch status</h2>
      <pre>${esc(formatDispatch(status))}</pre>
    </div>
    <div class="card">
      <h2>Stale packet warnings</h2>
      <p class="muted">${esc(stale?.petraPacketsBeforeSync || "Check dispatch dashboard")}</p>
      <ul>${staleFiles || "<li>None listed</li>"}</ul>
      <p class="muted">Gate 05: ${esc(stale?.gate05 || "see cockpit")}</p>
    </div>
  </div>

  <div class="card" style="margin-top:16px" id="imagery-doctrine">
    <h2>Imagery doctrine</h2>
    ${formatImageryDoctrineCard()}
  </div>

  <div class="card" style="margin-top:16px" id="finance-command">
    <h2>Finance Command v0.1</h2>
    <p class="muted">Operator Cockpit spend tracker — classification &amp; flags only</p>
    ${formatFinanceCard(status.finance)}
  </div>

  <div class="card" style="margin-top:16px" id="drop-zone-card">
    <h2>Drop Zone (inbox .md only)</h2>
    <p class="muted">Max 100KB · server-generated filename · saved to foreman/handoffs/inbox/</p>
    <textarea id="drop-content" placeholder="Paste markdown for inbox..."></textarea>
    <p style="margin:8px 0"><label class="muted">Optional slug hint (sanitized server-side): </label>
    <input type="text" id="drop-slug" placeholder="crew-verdict-notes"></p>
    <div class="actions" style="margin-top:8px">
      <button type="button" class="btn primary" id="drop-save">Save to Inbox</button>
    </div>
    ${formatCardLocalityProof({}, "drop-zone")}
    <p class="muted" style="margin-top:10px">Inbox markdown files:</p>
    <ul>${inboxList || "<li>None yet</li>"}</ul>
  </div>

  <div class="card" style="margin-top:16px" id="edge-dispatch-bay">
    <h2>Edge Dispatch Bay (Robot Zone)</h2>
    ${formatEdgeDispatchBayCard(status.edgeBay)}
  </div>

  <div class="card" style="margin-top:16px" id="crew-relay">
    <h2>AEYE Network Relay (automated)</h2>
    ${formatRelayPanel(status.relay?.session, status.relay?.manifest, status.relay?.relayLock)}
    <details style="margin-top:14px">
      <summary class="muted">Advanced / intake / fallback</summary>
      <div class="actions" style="margin-top:8px">
        <button type="button" class="btn" data-action="crew-relay-validate">Validate Inbox</button>
        <button type="button" class="btn" data-action="crew-relay-process">Process Responses</button>
        <button type="button" class="btn" data-action="crew-relay-issue-network-sync">Re-issue Network Sync</button>
        <button type="button" class="btn" data-action="crew-relay-self-test">Hash Self-Test</button>
      </div>
      <p class="muted" style="margin-top:8px">Emergency clipboard only (misconfigured if you need these during relay):</p>
      <div class="actions">
        <button type="button" class="btn" data-action="crew-relay-network-paste-petra">Clipboard Petra</button>
        <button type="button" class="btn" data-action="open-aeye-crew-bay">Open Aeye Crew Bay</button>
      </div>
    </details>
  </div>

  <div class="card" style="margin-top:16px">
    <h2>Safe local actions</h2>
    <div class="actions">
      <button type="button" class="btn primary" data-action="refresh-crew-dispatch">Refresh Crew Dispatch</button>
      <button type="button" class="btn" data-action="generate-petra">Generate Petra Packet</button>
      <button type="button" class="btn" data-action="generate-skybro">Generate Skybro Packet</button>
      <button type="button" class="btn" data-action="generate-ender">Generate Ender Packet</button>
      <button type="button" class="btn" data-action="generate-bean">Generate Bean Packet</button>
      <button type="button" class="btn" data-action="generate-computer">Generate Computer Packet</button>
    </div>
    <div class="actions" style="margin-top:8px">
      <button type="button" class="btn" data-action="open-outbox">Open Outbox Folder</button>
      <button type="button" class="btn" data-action="open-inbox">Open Inbox Folder</button>
      <button type="button" class="btn" data-action="open-reviews">Open Reviews Folder</button>
      <button type="button" class="btn" data-action="open-gate-review">Open Current Gate Review</button>
    </div>
    <div class="actions" style="margin-top:8px">
      <button type="button" class="btn" data-action="copy-petra-paste">Copy Latest Petra Paste Block</button>
      <button type="button" class="btn" data-action="copy-skybro-paste">Copy Latest Skybro Paste Block</button>
      <button type="button" class="btn" data-action="copy-ender-paste">Copy Latest Ender Paste Block</button>
      <button type="button" class="btn" data-action="copy-bean-paste">Copy Latest Bean Paste Block</button>
      <button type="button" class="btn" data-action="copy-computer-paste">Copy Latest Computer Paste Block</button>
    </div>
    <div class="actions" style="margin-top:8px">
      <button type="button" class="btn" data-action="show-current-gate">Show Current Gate</button>
      <button type="button" class="btn" data-action="show-active-agent">Show Active Agent</button>
      <button type="button" class="btn" data-action="show-budget-status">Show Budget Status</button>
    </div>
  </div>

  <div class="card" style="margin-top:16px">
    <h2>Blocked — human gates required</h2>
    <div class="actions">${blockedButtons}</div>
  </div>

  <div id="modal"><div class="panel"><p class="modal-hint" id="modal-hint">Cockpit reference — not an error. Click outside or Close to keep working.</p><h2 id="modal-title"></h2><pre id="modal-body"></pre><button type="button" class="btn" id="modal-close">Close</button></div></div>
  <div id="toast"></div>

  <script>
    const LOCAL_TOKEN = ${JSON.stringify(localToken)};

    const toast = document.getElementById('toast');
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    function closeModal() {
      modal.style.display = 'none';
      modal.classList.remove('open');
    }
    document.getElementById('modal-close').onclick = closeModal;
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    function showToast(msg, isError) {
      toast.textContent = msg;
      toast.className = isError ? 'error' : '';
      toast.style.display = 'block';
      setTimeout(() => { toast.style.display = 'none'; }, 6000);
    }

    async function postJson(url, payload) {
      if (!LOCAL_TOKEN) {
        return {
          res: { ok: false, status: 403 },
          data: {
            ok: false,
            blocked: true,
            message: 'MOBILE READ-ONLY',
            error: 'MOBILE READ-ONLY: actions require desktop localhost.'
          }
        };
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Foreman-Local-Token': LOCAL_TOKEN
        },
        body: JSON.stringify(payload)
      });
      let data = {};
      try { data = await res.json(); } catch { data = { ok: false, error: 'Invalid JSON response' }; }
      return { res, data };
    }

    function resetButton(btn, original) {
      btn.disabled = false;
      btn.classList.remove('btn-pending', 'btn-success', 'btn-failed');
      btn.textContent = original;
    }

    function firstProofValue(detail, keys, fallback) {
      for (const key of keys) {
        const value = detail && detail[key];
        if (value !== undefined && value !== null && String(value).trim()) return String(value);
      }
      return fallback || '';
    }

    function updateCardLocality(root, detail, fallbackAction) {
      if (!root) return;
      const latest = detail?.latest_receipt || {};
      const action = firstProofValue(detail, ['last_action', 'action', 'decision', 'state'], fallbackAction || '');
      const receipt = firstProofValue(detail, ['last_receipt', 'receipt_path', 'path', 'file', 'folder'], latest.last_receipt || latest.path || '');
      const actor = firstProofValue(detail, ['last_actor', 'actor'], '${CARD_LOCALITY_ACTOR}');
      const timestamp = firstProofValue(detail, ['last_timestamp', 'last_update', 'approved_at', 'created_at'], latest.last_timestamp || latest.created_at || new Date().toISOString());
      root.dataset.lastAction = action;
      root.dataset.lastReceipt = receipt;
      root.dataset.lastActor = actor;
      root.dataset.lastTimestamp = timestamp;
      const actionEl = root.querySelector('[data-card-last-action]');
      const receiptEl = root.querySelector('[data-card-last-receipt]');
      const actorEl = root.querySelector('[data-card-last-actor]');
      const timestampEl = root.querySelector('[data-card-last-timestamp]');
      if (actionEl) actionEl.textContent = action || 'none yet';
      if (receiptEl) receiptEl.textContent = receipt || 'none yet';
      if (actorEl) actorEl.textContent = actor || '${CARD_LOCALITY_ACTOR}';
      if (timestampEl) timestampEl.textContent = timestamp || 'none yet';
    }

    async function runAction(action, btn) {
      const original = btn.textContent;
      btn.disabled = true;
      btn.classList.remove('btn-success', 'btn-failed');
      btn.classList.add('btn-pending');
      btn.textContent = 'Working...';

      try {
        const { res, data } = await postJson('/api/action', { action });

        if (data.blocked) {
          btn.classList.add('btn-failed');
          btn.textContent = 'HUMAN GATE';
          showToast('HUMAN GATE REQUIRED — ' + action, true);
          setTimeout(() => resetButton(btn, original), 2500);
          return;
        }

        if (!res.ok || !data.ok) {
          btn.classList.add('btn-failed');
          btn.textContent = 'FAILED';
          showToast(data.error || data.message || ('Failed (' + res.status + ')'), true);
          setTimeout(() => resetButton(btn, original), 2500);
          return;
        }

        btn.classList.remove('btn-pending');
        btn.classList.add('btn-success');
        btn.textContent = data.successLabel || 'Done';
        updateCardLocality(btn.closest('.automatica-card, .crawler-pearl-card, .card, .plow'), data, action);
        showToast(data.message || ('Done: ' + action), false);

        if (data.content) {
          modalTitle.textContent = data.title || 'Cockpit';
          modalBody.textContent = data.content;
          modal.style.display = 'flex';
          modal.classList.add('open');
        }

        if (['refresh-crew-dispatch','generate-petra','generate-skybro','generate-ender','generate-bean','generate-computer','refresh-finance-dashboard','crew-relay-process','crew-relay-validate'].includes(action)) {
          setTimeout(() => location.reload(), 900);
          return;
        }

        if (['gd-thread-refresh','copy-thread-refresh-packet','open-thread-refresh-packet'].includes(action)) {
          await refreshGimpDashPanel();
        }

        setTimeout(() => resetButton(btn, original), 1800);
      } catch (e) {
        btn.classList.add('btn-failed');
        btn.textContent = 'FAILED';
        showToast(e.message || String(e), true);
        setTimeout(() => resetButton(btn, original), 2500);
      }
    }

    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => runAction(btn.dataset.action, btn));
    });

    function automaticaStampId() {
      return new Date().toISOString().replace(/[-:]/g, '').replace(/\\.\\d{3}Z$/, 'Z');
    }

    function buildAutomaticaLocality(routeId) {
      const card = document.querySelector('[data-automatica-card="' + routeId + '"]');
      const stamp = automaticaStampId();
      const cardId = card?.dataset.cardId || ('automatica_card_' + routeId);
      return {
        cardId,
        actionId: 'automatica_fire_' + routeId + '_' + stamp,
        approvalId: 'approval_' + routeId + '_' + stamp,
        approvedAt: new Date().toISOString(),
        approvalStatus: 'approved',
        expectedReturnLocation: '#automatica/' + cardId,
      };
    }

    function setAutomaticaCardState(routeId, state, detail) {
      const card = document.querySelector('[data-automatica-card="' + routeId + '"]');
      if (!card) return;
      card.dataset.state = state;
      const stateEl = card.querySelector('[data-automatica-state]');
      const approvalStatusEl = card.querySelector('[data-automatica-approval-status]');
      const approvalEl = card.querySelector('[data-automatica-approval]');
      const actionEl = card.querySelector('[data-automatica-action]');
      const returnEl = card.querySelector('[data-automatica-return]');
      const blockerEl = card.querySelector('[data-automatica-blocker]');
      const updateEl = card.querySelector('[data-automatica-last-update]');
      const packetEl = card.querySelector('[data-automatica-packet]');
      const receiptEl = card.querySelector('[data-automatica-receipt]');
      const receiptIdEl = card.querySelector('[data-automatica-receipt-id]');
      const receiptStatusEl = card.querySelector('[data-automatica-receipt-status]');
      const receiptDecisionEl = card.querySelector('[data-automatica-receipt-decision]');
      const openBtn = card.querySelector('[data-automatica-open]');
      const latest = detail?.latest_receipt || null;
      if (stateEl) stateEl.textContent = state;
      if (detail?.approval_status && approvalStatusEl) approvalStatusEl.textContent = detail.approval_status;
      if (detail?.approval_id && approvalEl) approvalEl.textContent = detail.approval_id;
      if (detail?.action_id && actionEl) actionEl.textContent = detail.action_id;
      if (detail?.expected_return_location && returnEl) returnEl.textContent = detail.expected_return_location;
      if (detail?.blocker && blockerEl) blockerEl.textContent = detail.blocker;
      if ((detail?.last_update || detail?.approved_at) && updateEl) updateEl.textContent = detail.last_update || detail.approved_at;
      if (detail?.packet_path && packetEl) packetEl.textContent = detail.packet_path;
      if (detail?.receipt_path && receiptEl) receiptEl.textContent = detail.receipt_path;
      if (latest?.receipt_id && receiptIdEl) receiptIdEl.textContent = latest.receipt_id;
      if (latest?.path && receiptEl) receiptEl.textContent = latest.path;
      if (latest?.status && receiptStatusEl) receiptStatusEl.textContent = latest.status;
      if ((latest?.decision || detail?.decision) && receiptDecisionEl) receiptDecisionEl.textContent = latest?.decision || detail.decision;
      const stateAction = state === 'APPROVED'
        ? 'approve'
        : state === 'SENT'
          ? 'send'
          : state === 'WORKING'
            ? 'swat'
            : null;
      updateCardLocality(card, detail, stateAction || String(state || '').toLowerCase());
      if (openBtn && detail?.receipt_path) openBtn.disabled = false;
    }

    async function fireAutomatica(routeId, btn) {
      const original = btn.textContent;
      const locality = buildAutomaticaLocality(routeId);
      btn.disabled = true;
      btn.classList.add('btn-pending');
      btn.textContent = 'APPROVED';
      setAutomaticaCardState(routeId, 'APPROVED', {
        approval_status: 'approved',
        approval_id: locality.approvalId,
        action_id: locality.actionId,
        approved_at: locality.approvedAt,
        expected_return_location: locality.expectedReturnLocation,
        blocker: 'approved; packet requested',
      });
      await new Promise(resolve => setTimeout(resolve, 120));
      setAutomaticaCardState(routeId, 'SENT', { ...locality, approval_status: 'approved', blocker: 'packet written; route dispatching' });
      await new Promise(resolve => setTimeout(resolve, 120));
      setAutomaticaCardState(routeId, 'WORKING', { ...locality, approval_status: 'approved', blocker: 'route running' });

      try {
        const { res, data } = await postJson('/api/automatica/fire', { routeId, ...locality });
        const finalState = data.state || (res.ok ? 'RECEIPT RETURNED' : 'EXPLODED');
        setAutomaticaCardState(routeId, finalState, data);
        btn.classList.remove('btn-pending');
        btn.classList.add(res.ok && data.ok ? 'btn-success' : 'btn-failed');
        btn.textContent = finalState;
        showToast(data.message || (routeId + ': ' + finalState), !(res.ok && data.ok));
      } catch (e) {
        setAutomaticaCardState(routeId, 'EXPLODED', { blocker: e.message || String(e), last_update: new Date().toISOString() });
        btn.classList.remove('btn-pending');
        btn.classList.add('btn-failed');
        btn.textContent = 'EXPLODED';
        showToast(e.message || String(e), true);
      } finally {
        setTimeout(() => {
          btn.disabled = false;
          btn.classList.remove('btn-pending', 'btn-success', 'btn-failed');
          btn.textContent = original;
        }, 1800);
      }
    }

    async function openAutomaticaReceipt(routeId, btn) {
      const original = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Opening...';
      try {
        const { res, data } = await postJson('/api/automatica/receipt', { routeId });
        if (!res.ok || !data.ok) {
          showToast(data.error || 'No receipt available', true);
          return;
        }
        modalTitle.textContent = data.title || 'Automatica receipt';
        modalBody.textContent = data.content || '';
        modal.style.display = 'flex';
        modal.classList.add('open');
        showToast('Opened ' + data.path, false);
      } catch (e) {
        showToast(e.message || String(e), true);
      } finally {
        btn.disabled = false;
        btn.textContent = original;
      }
    }

    document.querySelectorAll('[data-automatica-fire]').forEach(btn => {
      btn.addEventListener('click', () => fireAutomatica(btn.dataset.automaticaFire, btn));
    });
    document.querySelectorAll('[data-automatica-open]').forEach(btn => {
      btn.addEventListener('click', () => openAutomaticaReceipt(btn.dataset.automaticaOpen, btn));
    });

    async function refreshGimpDashPanel() {
      try {
        const res = await fetch('/api/gd/status');
        const data = await res.json();
        const meta = document.getElementById('gd-output-meta');
        const preview = document.getElementById('gd-packet-preview');
        if (!meta || !preview) return;

        if (data.threadRefresh?.exists) {
          meta.innerHTML = '<span class="gd-ready">Ready</span> · ' + data.threadRefresh.chars + ' chars · ' +
            (data.threadRefresh.modifiedAt || '') +
            (data.threadRefresh.runId ? ' · run <code>' + data.threadRefresh.runId + '</code>' : '');
          preview.hidden = false;
          preview.textContent = data.threadRefresh.preview || '';
        } else {
          meta.textContent = 'No packet yet — route thread refresh intent or click Generate.';
          preview.hidden = true;
          preview.textContent = '';
        }

        const mt = document.querySelector('#gd-mission-table tbody');
        if (mt) {
          mt.innerHTML = (data.missionClasses || []).map(m => {
            const mode = m.generationMode === 'COCKPIT_DIRECT' ? 'cockpit direct' : (m.recipients?.length ? m.recipients.join(', ') : '—');
            return '<tr><td><code>' + m.id + '</code></td><td>' + m.label + '</td><td>' + mode + '</td></tr>';
          }).join('') || '<tr><td colspan="3" class="muted">None</td></tr>';
        }

        const rt = document.querySelector('#gd-runs-table tbody');
        if (rt) {
          rt.innerHTML = (data.runs || []).slice(0, 8).map(r =>
            '<tr><td><code>' + r.runId + '</code></td><td>' + r.missionClass + '</td><td>' + r.status + '</td></tr>'
          ).join('') || '<tr><td colspan="3" class="muted">No runs yet</td></tr>';
        }
      } catch (e) {
        showToast('GimpDash refresh failed: ' + (e.message || String(e)), true);
      }
    }

    function escGovernorHtml(s) {
      return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function gdSelectPayload(id) {
      const el = document.getElementById(id);
      if (!el) return { id: '', label: '' };
      const selected = el.options[el.selectedIndex];
      const rawLabel = selected ? selected.textContent : el.value;
      const label = String(rawLabel || '').replace(/\\s+\\([^)]*\\)$/, '').trim();
      return { id: el.value || '', label: label || el.value || '' };
    }

    function gdTextValue(id) {
      const el = document.getElementById(id);
      return el ? String(el.value || '').trim() : '';
    }

    function collectGdRoutingPayload() {
      return {
        project: gdSelectPayload('gd-project-select'),
        area: gdSelectPayload('gd-area-select'),
        agent: gdSelectPayload('gd-agent-select'),
        machine: gdSelectPayload('gd-machine-select'),
        branch: gdSelectPayload('gd-branch-select'),
        path: gdSelectPayload('gd-path-select'),
        return_receipt_to: gdSelectPayload('gd-return-receipt-select'),
        need: gdTextValue('gd-need-input'),
        project_description: gdTextValue('gd-project-description-input'),
        special_instructions: gdTextValue('gd-special-instructions-input')
      };
    }

    function gdRoutingLabel(value) {
      return value && typeof value === 'object' ? (value.label || value.id || '') : String(value || '');
    }

    function formatGdRoutingIntent(routing) {
      const rows = [
        ['Need', routing.need],
        ['Project', gdRoutingLabel(routing.project)],
        ['Area', gdRoutingLabel(routing.area)],
        ['Agent', gdRoutingLabel(routing.agent)],
        ['Machine', gdRoutingLabel(routing.machine)],
        ['Branch', gdRoutingLabel(routing.branch)],
        ['Path', gdRoutingLabel(routing.path)],
        ['Return receipt to', gdRoutingLabel(routing.return_receipt_to)],
        ['Project description', routing.project_description],
        ['Special instructions', routing.special_instructions]
      ];
      return rows
        .filter(function (row) { return String(row[1] || '').trim(); })
        .map(function (row) { return row[0] + ': ' + String(row[1]).trim(); })
        .join('\\n');
    }

    function renderGovernorOutput(result, formatted, dispatchCard, intentReceiptPath, denRoomIntent) {
      const out = document.getElementById('gd-governor-output');
      const copyBtn = document.getElementById('gd-copy-governor-brief');
      if (!out || !result) return;

      const verdictClass = result.verdict === 'NO_GO'
        ? 'gd-verdict-no-go'
        : result.verdict === 'HUMAN_REVIEW_REQUIRED'
          ? 'gd-verdict-review'
          : 'gd-verdict-draft';

      const crewHtml = (result.routedCrew || []).map(function (c) {
        const lens = c.lens ? ' · <span class="muted">' + escGovernorHtml(c.lens) + '</span>' : '';
        return '<li><strong>' + escGovernorHtml(c.label) + '</strong> · ' +
          escGovernorHtml(c.seat) + ' · ' + escGovernorHtml(c.platform) + lens + '</li>';
      }).join('') || '<li class="muted">Cockpit direct — no cousin packets</li>';

      const hardStopsHtml = (result.hardStops || []).map(function (h) {
        return '<li>' + escGovernorHtml(h) + '</li>';
      }).join('');

      const threadRefreshCta = result.missionClass === 'THREAD_REFRESH_PACKET' && result.verdict !== 'NO_GO'
        ? '<div class="actions" style="margin-top:10px"><button type="button" class="btn primary" data-action="gd-thread-refresh">Generate Thread Refresh Packet</button></div>'
        : '';
      const routing = dispatchCard?.structured_routing || null;
      const routeField = function (key) { return routing ? gdRoutingLabel(routing[key]) : ''; };
      const branchField = routing?.generated_branch || routeField('branch');
      const routingHtml = routing
        ? '<h4>Structured routing</h4>' +
          '<div class="gd-verdict-grid">' +
            '<div class="gd-verdict-card"><span class="gd-k">Project</span><span class="gd-v">' + escGovernorHtml(routeField('project')) + '</span></div>' +
            '<div class="gd-verdict-card"><span class="gd-k">Area</span><span class="gd-v">' + escGovernorHtml(routeField('area')) + '</span></div>' +
            '<div class="gd-verdict-card"><span class="gd-k">Agent</span><span class="gd-v">' + escGovernorHtml(routeField('agent')) + '</span></div>' +
            '<div class="gd-verdict-card"><span class="gd-k">Machine</span><span class="gd-v">' + escGovernorHtml(routeField('machine')) + '</span></div>' +
            '<div class="gd-verdict-card"><span class="gd-k">Branch</span><span class="gd-v">' + escGovernorHtml(branchField) + '</span></div>' +
            '<div class="gd-verdict-card"><span class="gd-k">Path</span><span class="gd-v">' + escGovernorHtml(routeField('path')) + '</span></div>' +
            '<div class="gd-verdict-card"><span class="gd-k">Return receipt to</span><span class="gd-v">' + escGovernorHtml(routeField('return_receipt_to')) + '</span></div>' +
          '</div>'
        : '';
      const projectLock = dispatchCard?.project_lock || null;
      const lockClass = projectLock?.decision === 'Blocked'
        ? 'gd-verdict-no-go'
        : projectLock?.decision === 'Needs Merge'
          ? 'gd-verdict-review'
          : 'gd-verdict-draft';
      const lockHtml = projectLock
        ? '<h4>Project lock</h4>' +
          '<div class="gd-verdict-grid">' +
            '<div class="gd-verdict-card ' + lockClass + '"><span class="gd-k">Decision</span><span class="gd-v">' + escGovernorHtml(projectLock.decision || 'Allowed') + '</span></div>' +
            '<div class="gd-verdict-card"><span class="gd-k">Project</span><span class="gd-v">' + escGovernorHtml(projectLock.project_id || dispatchCard.project_id || 'UNKNOWN') + '</span></div>' +
            '<div class="gd-verdict-card"><span class="gd-k">Owner</span><span class="gd-v">' + escGovernorHtml((projectLock.owner_agent || dispatchCard.owner_agent || 'UNKNOWN') + ' / ' + (projectLock.owner_machine || dispatchCard.owner_machine || 'UNKNOWN')) + '</span></div>' +
            '<div class="gd-verdict-card"><span class="gd-k">Branch</span><span class="gd-v">' + escGovernorHtml(projectLock.branch || dispatchCard.branch || 'UNKNOWN') + '</span></div>' +
            '<div class="gd-verdict-card"><span class="gd-k">Blocker</span><span class="gd-v">' + escGovernorHtml(projectLock.blocker || 'none') + '</span><span class="muted">' + escGovernorHtml(projectLock.reason || '') + '</span></div>' +
          '</div>'
        : '';
      const dispatchCardHtml = dispatchCard
        ? '<h4>Proposed dispatch card</h4>' +
          '<div class="gd-verdict-grid">' +
            '<div class="gd-verdict-card"><span class="gd-k">Capability</span><span class="gd-v">' + escGovernorHtml((dispatchCard.capability_required || []).join(' / ')) + '</span></div>' +
            '<div class="gd-verdict-card"><span class="gd-k">Best Aeye</span><span class="gd-v">' + escGovernorHtml(dispatchCard.best_aeye || 'UNKNOWN') + '</span><span class="muted">' + escGovernorHtml((dispatchCard.supporting_aeyes || []).join(' + ') || 'no support') + '</span></div>' +
            '<div class="gd-verdict-card"><span class="gd-k">Best machine</span><span class="gd-v">' + escGovernorHtml(dispatchCard.best_machine || 'UNKNOWN') + '</span><span class="muted">' + escGovernorHtml(dispatchCard.availability?.status || 'unknown') + '</span></div>' +
            '<div class="gd-verdict-card"><span class="gd-k">Expected receipt</span><span class="gd-v">' + escGovernorHtml(dispatchCard.expected_receipt || 'UNKNOWN') + '</span><span class="muted">' + escGovernorHtml(intentReceiptPath || '') + '</span></div>' +
          '</div>' +
          routingHtml +
          lockHtml +
          '<p><strong>Why:</strong> ' + escGovernorHtml(dispatchCard.why || '') + '</p>' +
          '<p><strong>Next:</strong> ' + escGovernorHtml(dispatchCard.next_action || '') + '</p>'
        : '';
      const relayHtml = denRoomIntent
        ? '<h4>Relay packet</h4>' +
          '<div class="gd-verdict-grid">' +
            '<div class="gd-verdict-card"><span class="gd-k">State</span><span class="gd-v">' + escGovernorHtml(denRoomIntent.dispatch_state || 'UNKNOWN') + '</span></div>' +
            '<div class="gd-verdict-card"><span class="gd-k">Target</span><span class="gd-v">' + escGovernorHtml(denRoomIntent.target_aeye || 'UNKNOWN') + '</span><span class="muted">' + escGovernorHtml(denRoomIntent.target_machine || 'UNKNOWN') + '</span></div>' +
            '<div class="gd-verdict-card"><span class="gd-k">Packet</span><span class="gd-v"><code>' + escGovernorHtml(denRoomIntent.action_path || '') + '</code></span></div>' +
            '<div class="gd-verdict-card"><span class="gd-k">Receipt</span><span class="gd-v"><code>' + escGovernorHtml(denRoomIntent.receipt_path || '') + '</code></span></div>' +
          '</div>' +
          '<p class="muted">External Aeye chat send is still a Human Gate; this step writes the local relay packet and return receipt path.</p>'
        : '';

      out.innerHTML =
        '<div class="gd-verdict-grid">' +
          '<div class="gd-verdict-card ' + verdictClass + '"><span class="gd-k">Verdict</span><span class="gd-v">' + escGovernorHtml(result.verdict) + '</span></div>' +
          '<div class="gd-verdict-card"><span class="gd-k">Topic</span><span class="gd-v">' + escGovernorHtml(result.missionLabel) + '</span><span class="muted">' + escGovernorHtml(result.missionClass) + '</span></div>' +
          '<div class="gd-verdict-card"><span class="gd-k">Risk</span><span class="gd-v">' + escGovernorHtml(result.risk) + '</span></div>' +
          '<div class="gd-verdict-card"><span class="gd-k">Human gate</span><span class="gd-v">' + (result.humanGate ? 'Yes' : 'No') + '</span><span class="muted">' + escGovernorHtml(result.humanGateLevel) + '</span></div>' +
        '</div>' +
        '<p class="muted">' + escGovernorHtml(result.missionDescription || '') + '</p>' +
        '<h4>Auto-routed crew</h4><ul class="gd-crew-list">' + crewHtml + '</ul>' +
        dispatchCardHtml +
        relayHtml +
        '<h4>Hard stops</h4><ul>' + hardStopsHtml + '</ul>' +
        '<p><strong>Next:</strong> ' + escGovernorHtml(result.nextAction) + '</p>' +
        threadRefreshCta +
        '<h4>Draft packet</h4><pre class="gd-preview">' + escGovernorHtml(result.generatedPacket) + '</pre>' +
        '<details><summary><strong>Full export</strong></summary><pre class="gd-preview">' + escGovernorHtml(formatted) + '</pre></details>';

      out.classList.remove('hidden');
      if (copyBtn) {
        copyBtn.disabled = false;
        copyBtn.dataset.brief = formatted || '';
      }

      out.querySelectorAll('[data-action]').forEach(function (btn) {
        btn.addEventListener('click', function () { runAction(btn.dataset.action, btn); });
      });
    }

    async function routeGovernorIntent() {
      const form = document.getElementById('gd-routing-form');
      const btn = document.getElementById('gd-route-btn');
      if (!form || !btn) return;

      const original = btn.textContent;
      btn.disabled = true;
      btn.classList.add('btn-pending');
      btn.textContent = 'Routing...';

      try {
        const routing = collectGdRoutingPayload();
        const intent = formatGdRoutingIntent(routing);
        const { res, data } = await postJson('/api/soledash/v1/den-room-intent', {
          intent: intent,
          routing: routing,
          room: {
            room_id: 'gimpdash',
            room_label: 'GimpDash / Wonka Den',
            zone: 'den',
            source_card_id: 'gimpdash-room-intent',
            return_location: '#gimpdash'
          }
        });
        if (!res.ok || !data.ok) {
          showToast(data.error || 'Governor routing failed', true);
          return;
        }
        renderGovernorOutput(data.result, data.formatted, data.proposed_dispatch_card, data.intent_receipt_path, data.den_room_intent);
        showToast('Relay packet: ' + (data.den_room_intent?.target_aeye || data.result?.missionClass || 'routed'), false);
      } catch (e) {
        showToast(e.message || String(e), true);
      } finally {
        btn.disabled = false;
        btn.classList.remove('btn-pending');
        btn.textContent = original;
      }
    }

    const gdRouteBtn = document.getElementById('gd-route-btn');
    if (gdRouteBtn) gdRouteBtn.addEventListener('click', routeGovernorIntent);

    async function runCrawlerPearlAction(btn) {
      const action = btn.dataset.crawlerPearlAction;
      const pearl_id = btn.dataset.pearlId;
      const original = btn.textContent;
      btn.disabled = true;
      btn.classList.add('btn-pending');
      btn.textContent = 'Working...';
      try {
        const { res, data } = await postJson('/api/crawler-pearls/action', { action, pearl_id });
        if (!res.ok || !data.ok) {
          btn.classList.add('btn-failed');
          btn.textContent = 'FAILED';
          showToast(data.error || 'Crawler pearl action failed', true);
          setTimeout(() => resetButton(btn, original), 2500);
          return;
        }
        const card = btn.closest('[data-crawler-pearl]');
        const terminalAfter = ['Promoted to Task', 'Archived', 'Killed'].includes(data.after_state || data.pearl?.state || '');
        if (card) {
          card.dataset.state = data.after_state || data.pearl?.state || card.dataset.state || '';
          const stateEl = card.querySelector('[data-crawler-pearl-state]');
          if (stateEl) stateEl.textContent = data.after_state || data.pearl?.state || stateEl.textContent;
          updateCardLocality(card, data, action);
          if (terminalAfter) {
            card.querySelectorAll('[data-crawler-pearl-action]').forEach(function (actionBtn) {
              actionBtn.disabled = true;
            });
          }
        }
        showToast(data.message || 'Crawler pearl updated', false);
        btn.classList.remove('btn-pending');
        btn.classList.add('btn-success');
        btn.textContent = 'Done';
        if (terminalAfter) return;
        setTimeout(() => resetButton(btn, original), 1800);
      } catch (e) {
        btn.classList.add('btn-failed');
        btn.textContent = 'FAILED';
        showToast(e.message || String(e), true);
        setTimeout(() => resetButton(btn, original), 2500);
      }
    }

    document.querySelectorAll('[data-crawler-pearl-action]').forEach(function (btn) {
      btn.addEventListener('click', function () { runCrawlerPearlAction(btn); });
    });

    const gdCopyBriefBtn = document.getElementById('gd-copy-governor-brief');
    if (gdCopyBriefBtn) {
      gdCopyBriefBtn.addEventListener('click', async function () {
        const brief = this.dataset.brief;
        if (!brief) return;
        try {
          await navigator.clipboard.writeText(brief);
          showToast('Governor brief copied', false);
        } catch (e) {
          showToast('Copy failed — select Full export manually', true);
        }
      });
    }

    if (location.hash === '#gimpdash') {
      document.getElementById('gimpdash')?.scrollIntoView({ behavior: 'smooth' });
    }
    if (location.hash === '#machine-health') {
      document.getElementById('machine-health')?.scrollIntoView({ behavior: 'smooth' });
    }
    if (location.hash === '#gd-speaker') {
      document.getElementById('gd-speaker')?.scrollIntoView({ behavior: 'smooth' });
    }

    const speakerDraftBtn = document.getElementById('speaker-draft-btn');
    if (speakerDraftBtn) {
      speakerDraftBtn.addEventListener('click', async function () {
        const title = document.getElementById('speaker-draft-title')?.value || '';
        const event = document.getElementById('speaker-draft-event')?.value || '';
        const context = document.getElementById('speaker-draft-context')?.value || '';
        const lesson = document.getElementById('speaker-draft-lesson')?.value || '';
        const why = document.getElementById('speaker-draft-why')?.value || '';
        const warning_triggers = document.getElementById('speaker-draft-triggers')?.value || '';
        const original = speakerDraftBtn.textContent;
        speakerDraftBtn.disabled = true;
        speakerDraftBtn.textContent = 'Saving...';
        try {
          const { res, data } = await postJson('/api/gd/speaker/draft', {
            title,
            event,
            context,
            lesson,
            why,
            warning_triggers,
          });
          if (!res.ok || !data.ok) {
            showToast(data.error || 'Speaker draft failed', true);
            return;
          }
          updateCardLocality(speakerDraftBtn.closest('.gd-governor, .plow, .card'), data, 'save');
          showToast(data.message || 'DRAFT saved', false);
        } catch (e) {
          showToast(e.message || String(e), true);
        } finally {
          speakerDraftBtn.disabled = false;
          speakerDraftBtn.textContent = original;
        }
      });
    }

    async function runRelay(path, btn, original) {
      btn.disabled = true;
      btn.classList.add('btn-pending');
      btn.textContent = 'Working...';
      try {
        const { res, data } = await postJson(path, {});
        if (!res.ok || !data.ok) {
          btn.classList.add('btn-failed');
          btn.textContent = 'FAILED';
          showToast(data.error || data.message || 'Relay failed', true);
          setTimeout(() => resetButton(btn, original), 2500);
          return;
        }
        updateCardLocality(btn.closest('.card, .plow'), data, 'send');
        if (data.session) {
          const relayState = document.getElementById('relay-state');
          const relayMessage = document.getElementById('relay-message');
          const relayProgress = document.getElementById('relay-progress');
          if (relayState) relayState.textContent = String(data.session.state || '').replace(/_/g, ' ').toUpperCase();
          if (relayMessage) relayMessage.textContent = data.session.message || data.message || '';
          if (relayProgress) {
            const done = (data.session.steps || []).filter(function (s) { return s.sentAt; }).length;
            const total = (data.session.cousins || []).length || 5;
            relayProgress.textContent = done + '/' + total + ' sent';
          }
        }
        btn.classList.remove('btn-pending');
        btn.classList.add('btn-success');
        btn.textContent = data.successLabel || 'Done';
        showToast(data.message || 'Relay updated', false);
        setTimeout(() => resetButton(btn, original), 1800);
      } catch (e) {
        btn.classList.add('btn-failed');
        btn.textContent = 'FAILED';
        showToast(e.message || String(e), true);
        setTimeout(() => resetButton(btn, original), 2500);
      }
    }

    const relayStart = document.getElementById('relay-start');
    const relayStartPlow = document.getElementById('relay-start-plow');
    const relaySentPlow = document.getElementById('relay-sent-plow');
    const relaySent = document.getElementById('relay-sent');
    const sessionState = ${JSON.stringify(status.relay?.session?.state || "idle")};
    if (relaySentPlow && sessionState === 'awaiting_send') {
      relaySentPlow.disabled = false;
    }
    function bindRelay(btn, path) {
      if (!btn) return;
      btn.addEventListener('click', function () {
        runRelay(path, this, this.textContent);
      });
    }
    bindRelay(relayStart, '/api/relay/start');
    bindRelay(relayStartPlow, '/api/relay/start');
    bindRelay(relaySent, '/api/relay/sent');
    bindRelay(relaySentPlow, '/api/relay/sent');
    const relayCancel = document.getElementById('relay-cancel');
    if (relayCancel) {
      relayCancel.addEventListener('click', function () {
        runRelay('/api/relay/cancel', this, this.textContent);
      });
    }
    const relayReset = document.getElementById('relay-reset');
    if (relayReset) {
      relayReset.addEventListener('click', function () {
        runRelay('/api/relay/reset', this, this.textContent);
      });
    }

    document.getElementById('drop-save').addEventListener('click', async function () {
      const btn = this;
      const original = btn.textContent;
      btn.disabled = true;
      btn.classList.add('btn-pending');
      btn.textContent = 'Saving...';
      try {
        const { res, data } = await postJson('/api/drop-zone/save', {
          content: document.getElementById('drop-content').value,
          slugHint: document.getElementById('drop-slug').value
        });
        if (!res.ok || !data.ok) {
          btn.classList.add('btn-failed');
          btn.textContent = 'FAILED';
          showToast(data.error || data.message || 'Save failed', true);
          setTimeout(() => resetButton(btn, original), 2500);
          return;
        }
        btn.classList.add('btn-success');
        btn.textContent = 'Saved';
        updateCardLocality(document.getElementById('drop-zone-card'), data, 'save');
        showToast('Saved ' + data.filename + ' to inbox', false);
        document.getElementById('drop-content').value = '';
        setTimeout(() => resetButton(btn, original), 1800);
      } catch (e) {
        btn.classList.add('btn-failed');
        btn.textContent = 'FAILED';
        showToast(e.message || String(e), true);
        setTimeout(() => resetButton(btn, original), 2500);
      }
    });
  </script>
</body>
</html>`;
}

function formatDispatch(status) {
  const d = status.dispatch;
  if (d?.missing) return "DISPATCH_DASHBOARD.json missing — click Refresh Crew Dispatch";
  const lines = [
    `Dashboard: ${d.generatedAt || "unknown"}`,
    `main: ${d.mainHead || "?"}`,
    `Latest: ${status.latestDispatch?.packetId || d.latestDispatch?.packetId || "none"}`,
    `Status: ${status.latestDispatch?.status || d.latestDispatch?.status || "idle"}`,
  ];
  return lines.join("\n");
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

async function readBody(req, maxBytes = DROP_ZONE_MAX_BYTES + 4096) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) throw new Error("Request body too large");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("Invalid JSON body");
  }
}

function rejectUnauthorized(res) {
  return sendJson(res, 401, { ok: false, success: false, error: "Unauthorized — missing or invalid local token" });
}

function openBrowser() {
  const panelUrl = LOCAL_PANEL_URL;
  spawn("cmd.exe", ["/c", "start", "", panelUrl], {
    cwd: REPO_ROOT,
    windowsHide: true,
    detached: true,
  }).unref();
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${HOST}:${PORT}`);

  if (req.method === "GET" && url.pathname === "/api/gd/status") {
    return sendJson(res, 200, buildGdStatus());
  }

  if (req.method === "GET" && url.pathname === "/api/gd/speaker") {
    return sendJson(res, 200, buildSpeakerStatus(REPO_ROOT));
  }

  if (req.method === "GET" && url.pathname === "/api/crawler-pearls/status") {
    return sendJson(res, 200, buildCrawlerPearlsStatus());
  }

  if (req.method === "GET" && url.pathname === "/api/swatter/events/status") {
    return sendJson(res, 200, buildSwatterEventStreamStatus());
  }

  if (req.method === "GET" && url.pathname === "/api/machine-health/status") {
    return sendJson(res, 200, buildMachineHealthStatus());
  }

  if (req.method === "GET" && url.pathname === "/api/soledash/v1/project-locks") {
    return sendJson(res, 200, buildDenProjectLocks(loadProjectLocksState()));
  }

  if (req.method === "GET" && url.pathname === "/api/soledash/v1/den-zones") {
    return sendJson(res, 200, buildDenZonesPayload());
  }

  if (req.method === "GET" && (url.pathname === "/gd" || url.pathname === "/gimpdash")) {
    res.writeHead(302, { Location: "/#gimpdash" });
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/gd/speaker") {
    res.writeHead(302, { Location: "/#gd-speaker" });
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/status") {
    return sendJson(res, 200, buildStatus());
  }

  if (req.method === "GET" && url.pathname === "/api/automatica/status") {
    return sendJson(res, 200, buildAutomaticaStatus());
  }

  if (req.method === "GET" && url.pathname === "/api/relay/status") {
    return sendJson(res, 200, loadRelayStatusSync());
  }

  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
    const token = isLoopbackRequest(req) ? ensureLocalToken() : null;
    const html = renderPage(buildStatus(), token, loadPanelTheme());
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
    return;
  }

  if (req.method === "POST") {
    if (!verifyLocalToken(req)) {
      return rejectUnauthorized(res);
    }

    if (url.pathname === "/api/gd/route-intent") {
      try {
        const body = await readBody(req);
        const structuredRouting = normalizeGdStructuredRouting(body.routing);
        const submittedIntent = typeof body.intent === "string" ? body.intent : "";
        const intent = submittedIntent.trim() || formatGdStructuredRoutingIntent(structuredRouting);
        const result = classifyGdCommand(intent);
        const proposedDispatchCard = buildIntentDispatchCard(intent, result, structuredRouting);
        const intentReceipt = writeIntentRouterReceipt(proposedDispatchCard, result);
        const dispatchFormatted = formatIntentDispatchCard(proposedDispatchCard, intentReceipt.relativePath);
        const formatted = `${formatGdCommandVerdict(result)}\n\n${dispatchFormatted}`;
        return sendJson(res, 200, {
          ok: true,
          result,
          proposed_dispatch_card: proposedDispatchCard,
          intent_receipt_path: intentReceipt.relativePath,
          formatted,
        });
      } catch (err) {
        return sendJson(res, 500, { ok: false, error: err.message || String(err) });
      }
    }

    if (url.pathname === "/api/soledash/v1/den-room-intent") {
      try {
        const body = await readBody(req);
        const result = buildDenRoomIntentResponse(body);
        return sendJson(res, 200, result);
      } catch (err) {
        return sendJson(res, 500, { ok: false, success: false, error: err.message || String(err) });
      }
    }

    if (url.pathname === "/api/gd/speaker/draft") {
      try {
        const body = await readBody(req);
        const saved = draftSpeakerEntry(REPO_ROOT, body);
        return sendJson(res, 200, {
          ...saved,
          ...cardLocalityFields({
            action: "save",
            receipt: saved.path,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (err) {
        return sendJson(res, 400, { ok: false, error: err.message || String(err) });
      }
    }

    if (url.pathname === "/api/crawler-pearls/action") {
      try {
        const body = await readBody(req);
        const action = String(body.action || "").trim();
        const pearlId = String(body.pearl_id || body.pearlId || "").trim();
        if (!pearlId) return sendJson(res, 400, { ok: false, success: false, error: "Missing pearl_id" });
        const result = updateCrawlerPearl(action, pearlId);
        return sendJson(res, 200, result);
      } catch (err) {
        return sendJson(res, 400, { ok: false, success: false, error: err.message || String(err) });
      }
    }

    if (url.pathname === "/api/machine-health/mark-unavailable") {
      try {
        const body = await readBody(req);
        const machineId = String(body.machine_id || body.machineId || "").trim();
        const reason = String(body.reason || body.blocker || "Machine unhealthy.").trim();
        if (!machineId) return sendJson(res, 400, { ok: false, success: false, error: "Missing machine_id" });
        const result = markMachineUnavailableAndReroute(machineId, reason, {
          evidence_status: body.evidence_status || "local_health_signal",
        });
        return sendJson(res, 200, result);
      } catch (err) {
        return sendJson(res, 400, { ok: false, success: false, error: err.message || String(err) });
      }
    }

    if (url.pathname === "/api/machine-health/dev-server-timeout") {
      try {
        const body = await readBody(req);
        const result = markMachineWatchDevServerWedged(body);
        return sendJson(res, result.ok ? 200 : 400, result);
      } catch (err) {
        return sendJson(res, 400, { ok: false, success: false, error: err.message || String(err) });
      }
    }

    if (url.pathname === "/api/automatica/fire") {
      try {
        const body = await readBody(req);
        if (!body.routeId) return sendJson(res, 400, { ok: false, success: false, error: "Missing routeId" });
        const result = await fireAutomaticaRoute(body.routeId, body);
        return sendJson(res, 200, result);
      } catch (err) {
        return sendJson(res, 500, {
          ok: false,
          success: false,
          state: "EXPLODED",
          blocker: err.message || String(err),
          error: err.message || String(err),
        });
      }
    }

    if (url.pathname === "/api/automatica/receipt") {
      try {
        const body = await readBody(req);
        if (!body.routeId) return sendJson(res, 400, { ok: false, success: false, error: "Missing routeId" });
        return sendJson(res, 200, readAutomaticaReceiptForRoute(body.routeId));
      } catch (err) {
        return sendJson(res, 404, { ok: false, success: false, error: err.message || String(err) });
      }
    }

    if (url.pathname === "/api/action") {
      try {
        const body = await readBody(req);
        const action = body.action;
        if (!action) return sendJson(res, 400, { ok: false, success: false, error: "Missing action" });

      if (BLOCKED_ACTIONS.some((b) => b.id === action)) {
        return sendJson(res, 403, {
          ok: false,
          success: false,
          blocked: true,
          message: "HUMAN GATE REQUIRED",
          action,
        });
      }
      if (FINANCE_BLOCKED_ACTIONS.some((b) => b.id === action)) {
        return sendJson(res, 403, {
          ok: false,
          success: false,
          blocked: true,
          message: "HUMAN GATE REQUIRED — finance action blocked",
          action,
        });
      }

        const result = await handleAction(action);
        if (result.blocked) {
          return sendJson(res, 403, { ok: false, success: false, ...result });
        }
        return sendJson(res, 200, { ok: true, ...result });
      } catch (err) {
        return sendJson(res, 500, { ok: false, success: false, error: err.message || String(err) });
      }
    }

    if (url.pathname === "/api/drop-zone/save") {
      try {
        const body = await readBody(req);
        const saved = await saveDropZone(body.content, body.slugHint);
        return sendJson(res, 200, {
          ok: true,
          success: true,
          message: `Saved ${saved.filename} to inbox`,
          successLabel: "Saved",
          ...cardLocalityFields({
            action: "save",
            receipt: saved.path,
            timestamp: new Date().toISOString(),
          }),
          ...saved,
        });
      } catch (err) {
        return sendJson(res, 400, { ok: false, success: false, error: err.message || String(err) });
      }
    }

    if (url.pathname === "/api/relay/start") {
      try {
        const body = await readBody(req);
        const result = await relayApiStart(Boolean(body.reissue));
        return sendJson(res, 200, result);
      } catch (err) {
        return sendJson(res, 500, { ok: false, success: false, error: err.message || String(err) });
      }
    }

    if (url.pathname === "/api/relay/sent") {
      try {
        const result = await relayApiSent();
        return sendJson(res, 200, result);
      } catch (err) {
        return sendJson(res, 500, { ok: false, success: false, error: err.message || String(err) });
      }
    }

    if (url.pathname === "/api/relay/cancel") {
      try {
        const result = await relayApiCancel();
        return sendJson(res, 200, result);
      } catch (err) {
        return sendJson(res, 500, { ok: false, success: false, error: err.message || String(err) });
      }
    }

    if (url.pathname === "/api/relay/reset") {
      try {
        const result = await relayApiReset();
        return sendJson(res, 200, result);
      } catch (err) {
        return sendJson(res, 500, { ok: false, success: false, error: err.message || String(err) });
      }
    }

    return sendJson(res, 404, { ok: false, success: false, error: "Not found" });
  }

  sendJson(res, 404, { ok: false, error: "Not found" });
});

async function main() {
  console.log("Starting Foreman Control Panel...");
  ensureControlPanelDir();
  ensureLocalToken();
  let portState = await ensurePortAvailable();

  if (portState === "already_running") {
    const gdOk = await probeGimpDashRoute();
    if (gdOk) {
      if (!process.argv.includes("--no-browser")) {
        openBrowser();
      }
      console.log("Reused existing server. Close its terminal window to stop Foreman.");
      return;
    }

    console.log("Foreman is running but GimpDash routes are missing — restarting with updated server...");
    const listenerPid = await getListeningPid(PORT);
    if (listenerPid) {
      const pidRecord = loadPidRecord();
      const commandLine = await getProcessCommandLine(listenerPid);
      const isKnownForeman =
        (pidRecord && pidRecord.pid === listenerPid) || isForemanControlProcess(commandLine);
      if (!isKnownForeman) {
        throw new Error(
          `HUMAN GATE REQUIRED: port ${PORT} occupied by PID ${listenerPid} without GimpDash routes. Close manually.`
        );
      }
      await killProcess(listenerPid);
      await sleep(600);
      if (await getListeningPid(PORT)) {
        throw new Error(`HUMAN GATE REQUIRED: port ${PORT} still occupied after Foreman restart.`);
      }
    }
    portState = "free";
  }

  server.listen(PORT, HOST, () => {
    writePidRecord();
    console.log(`Foreman Control Panel listening on http://${HOST}:${PORT}`);
    if (MOBILE_READONLY_LAN) {
      console.log(`Mobile LAN read-only URLs: ${lanIPv4Candidates().map((ip) => `http://${ip}:${PORT}/#automatica`).join(", ") || "(no LAN IPv4 found)"}`);
      console.log("Mobile POST/FIRE actions are blocked unless request comes from localhost with local token.");
    }
    console.log(`Repo: ${REPO_ROOT}`);
    if (MOBILE_READONLY_LAN) {
      console.log("LAN read-only enabled. POST endpoints still require localhost plus local token.");
    } else {
      console.log("Localhost only. POST endpoints require local token.");
    }
    console.log("Stops before Send. Close this window to stop the server.");
    if (!process.argv.includes("--no-browser")) {
      openBrowser();
    }
  });
}

function shutdown() {
  removePidRecord();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("exit", removePidRecord);

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
