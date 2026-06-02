#!/usr/bin/env node
/**
 * Relay Courier shared library — dispatch policy, lock, context health, verification.
 * Primary defense: dispatch class + structural markers — regex is secondary only.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { ROOT, abs, read, exists, nowIso, byteLength, append } from "./_foreman-core.mjs";

const CONFIG_REL = "foreman/crew-dispatch/relay-courier.config.json";
const POLICY_REL = "foreman/crew-dispatch/dispatch-policy.json";
const TABS_REL = "foreman/crew-dispatch/crew-tabs.config.json";

let _config = null;
let _policy = null;

export function loadCourierConfig() {
  if (_config) return _config;
  _config = JSON.parse(read(CONFIG_REL));
  return _config;
}

export function loadDispatchPolicy() {
  if (_policy) return _policy;
  _policy = JSON.parse(read(POLICY_REL));
  return _policy;
}

export function loadTabsConfig() {
  return JSON.parse(read(TABS_REL));
}

/** Five Aeye cousins in fixed relay order — not infra tabs (Foreman, GitHub, …). */
export const RELAY_COUSIN_IDS = ["PETRA", "SKYBRO", "ENDER", "BEAN", "COMPUTER"];

const EXTERNAL_AI_HOSTS = [
  "chatgpt.com",
  "gemini.google.com",
  "claude.ai",
  "deepseek.com",
  "perplexity.ai",
];

/**
 * Verify cousin → tabIndex → URL mapping (config + optional network manifest).
 * External AI hosts are never dashboard-embeddable — Edge Dispatch Bay only.
 */
export function verifyTabDestination(cousinId, options = {}) {
  const id = String(cousinId || "").toUpperCase();
  const tabs = loadTabsConfig();
  const tab = tabs.tabs.find((t) => t.id === id);
  const errors = [];
  const warnings = [];

  if (!tab) {
    return { ok: false, cousinId: id, errors: [`${id} not in crew-tabs.config.json`], warnings: [] };
  }

  if (!tab.tabIndex || tab.tabIndex < 1) {
    errors.push(`Invalid tabIndex ${tab.tabIndex} for ${id}`);
  }

  if (tab.tabIndex > 9) {
    warnings.push(
      `Tab ${tab.tabIndex} exceeds Ctrl+N shortcut range (1–9) — PS courier may not focus ${id} reliably`
    );
  }

  const dupes = tabs.tabs.filter((t) => t.tabIndex === tab.tabIndex && t.id !== id);
  if (dupes.length) {
    errors.push(`Duplicate tabIndex ${tab.tabIndex}: ${dupes.map((d) => d.id).join(", ")}`);
  }

  if (options.checkManifest !== false) {
    const manifestPath = abs("foreman/crew-dispatch/LATEST_NETWORK_COMMAND.json");
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      const mc = manifest.cousins?.find((c) => c.cousinId === id);
      if (mc) {
        if (Number(mc.edgeTabIndex) !== Number(tab.tabIndex)) {
          errors.push(
            `Manifest tab ${mc.edgeTabIndex} != config tab ${tab.tabIndex} for ${id} — re-issue network sync`
          );
        }
      } else if (RELAY_COUSIN_IDS.includes(id)) {
        warnings.push(`${id} missing from LATEST_NETWORK_COMMAND.json`);
      }
    } else if (RELAY_COUSIN_IDS.includes(id)) {
      warnings.push("No LATEST_NETWORK_COMMAND.json — network tab mapping unchecked");
    }
  }

  const url = tab.url || "";
  const externalAi = EXTERNAL_AI_HOSTS.some((h) => url.includes(h));

  return {
    ok: errors.length === 0,
    cousinId: id,
    tabIndex: tab.tabIndex,
    name: tab.name,
    url,
    externalAiHost: externalAi,
    embeddableInDashboard: !externalAi,
    embedNote: externalAi ? "Use Edge Dispatch Bay — vendor blocks iframe embedding" : null,
    errors,
    warnings,
  };
}

export function verifyAllRelayTabDestinations(options = {}) {
  const cousins = RELAY_COUSIN_IDS.map((id) => verifyTabDestination(id, options));
  const errors = cousins.flatMap((r) => r.errors.map((e) => `${r.cousinId}: ${e}`));
  const warnings = cousins.flatMap((r) => r.warnings.map((w) => `${r.cousinId}: ${w}`));
  return {
    ok: errors.length === 0,
    cousins,
    errors,
    warnings,
  };
}

export function loadContextHealth() {
  const cfg = loadCourierConfig();
  if (!exists(cfg.contextHealth)) return null;
  return JSON.parse(read(cfg.contextHealth));
}

export function saveContextHealth(data) {
  const cfg = loadCourierConfig();
  data.updatedAt = nowIso();
  fs.writeFileSync(abs(cfg.contextHealth), JSON.stringify(data, null, 2), "utf8");
}

export function loadRelayLock() {
  const cfg = loadCourierConfig();
  if (!exists(cfg.relayLock)) {
    return { status: "IDLE", message: "Lock file missing" };
  }
  return JSON.parse(read(cfg.relayLock));
}

export function writeRelayLock(patch) {
  const cfg = loadCourierConfig();
  const current = loadRelayLock();
  const next = { ...current, ...patch, updatedAt: nowIso() };
  fs.writeFileSync(abs(cfg.relayLock), JSON.stringify(next, null, 2), "utf8");
  return next;
}

export function acquireRelayLock(meta = {}) {
  clearStaleRelayLockIfNeeded();
  const lock = loadRelayLock();
  if (lock.status === "RUNNING") {
    return {
      ok: false,
      blocked: true,
      error: "COURIER RUNNING — DO NOT CLICK EDGE",
      lock,
    };
  }
  const runId = crypto.randomUUID();
  const next = writeRelayLock({
    status: "RUNNING",
    pid: process.pid,
    startedAt: nowIso(),
    completedAt: null,
    courierRunId: runId,
    cousin: meta.cousin || null,
    packetFile: meta.packetFile || null,
    message: "COURIER RUNNING — DO NOT CLICK EDGE",
  });
  return { ok: true, runId, lock: next };
}

export function releaseRelayLock(outcome, meta = {}) {
  const status = outcome === "success" ? "COMPLETE" : "FAILED";
  return writeRelayLock({
    status,
    pid: null,
    completedAt: nowIso(),
    message: meta.message || `Courier ${status.toLowerCase()}`,
    error: meta.error || null,
  });
}

const STALE_LOCK_MS = 2 * 60 * 1000;

/** Clear RUNNING lock when courier hung (PowerShell/WMI timeout). */
export function clearStaleRelayLockIfNeeded(maxAgeMs = STALE_LOCK_MS) {
  const lock = loadRelayLock();
  if (lock.status !== "RUNNING") return { cleared: false, lock };

  const started = Date.parse(lock.startedAt || lock.updatedAt || 0);
  if (!started || Number.isNaN(started)) {
    releaseRelayLock("failed", { message: "Stale lock cleared (missing startedAt)" });
    return { cleared: true, lock: loadRelayLock(), reason: "missing startedAt" };
  }

  const ageMs = Date.now() - started;
  if (ageMs < maxAgeMs) {
    return { cleared: false, lock, ageMs };
  }

  releaseRelayLock("failed", {
    message: `Stale lock cleared after ${Math.round(ageMs / 1000)}s (courier likely hung)`,
    error: lock.error || "courier timeout",
  });
  appendCourierLog(`STALE LOCK CLEARED — was RUNNING ${Math.round(ageMs / 1000)}s cousin=${lock.cousin || "?"}`);
  return { cleared: true, lock: loadRelayLock(), ageMs };
}

export function forceReleaseRelayLock(reason = "Operator unlock") {
  const lock = loadRelayLock();
  if (lock.status !== "RUNNING") {
    return { ok: true, alreadyIdle: true, lock };
  }
  releaseRelayLock("failed", { message: reason });
  appendCourierLog(`FORCE UNLOCK — ${reason}`);
  return { ok: true, lock: loadRelayLock() };
}

export function appendCourierLog(line) {
  const cfg = loadCourierConfig();
  const rel = cfg.courierLog;
  append(rel, `\n## ${nowIso()}\n- ${line}\n`);
}

export function appendSendLog(line) {
  const cfg = loadCourierConfig();
  append(cfg.sendLog, `\n## ${nowIso()}\n- ${line}\n`);
}

function loadRateLimitState() {
  const cfg = loadCourierConfig();
  const p = abs(cfg.autoSendRateLimitFile);
  if (!fs.existsSync(p)) return { events: [] };
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return { events: [] };
  }
}

function saveRateLimitState(state) {
  const cfg = loadCourierConfig();
  fs.writeFileSync(abs(cfg.autoSendRateLimitFile), JSON.stringify(state, null, 2), "utf8");
}

export function checkAutoSendRateLimit(cousinId) {
  const policy = loadDispatchPolicy();
  const limit = policy.classes.AUTO_SEND.rateLimit;
  const windowMs = limit.windowMinutes * 60 * 1000;
  const cutoff = Date.now() - windowMs;
  const state = loadRateLimitState();
  const recent = state.events.filter(
    (e) => e.cousin === cousinId && Date.parse(e.at) >= cutoff
  );
  if (recent.length >= limit.maxPerCousin) {
    return {
      ok: false,
      error: `AUTO_SEND rate limit: max ${limit.maxPerCousin} per ${limit.windowMinutes}m for ${cousinId}`,
    };
  }
  return { ok: true, remaining: limit.maxPerCousin - recent.length };
}

export function recordAutoSend(cousinId, packetFile) {
  const state = loadRateLimitState();
  state.events.push({ cousin: cousinId, at: nowIso(), packetFile });
  const policy = loadDispatchPolicy();
  const windowMs = policy.classes.AUTO_SEND.rateLimit.windowMinutes * 60 * 1000;
  const cutoff = Date.now() - windowMs;
  state.events = state.events.filter((e) => Date.parse(e.at) >= cutoff);
  saveRateLimitState(state);
}

export function extractRelayMetadata(markdown) {
  const blockRe = /##\s*Relay metadata\s*\r?\n\r?\n```json\r?\n([\s\S]*?)\r?\n```/i;
  const match = markdown.match(blockRe);
  if (!match) return { ok: false, error: "Missing relay metadata block", metadata: null };
  try {
    return { ok: true, metadata: JSON.parse(match[1]), error: null };
  } catch (e) {
    return { ok: false, error: `Malformed metadata: ${e.message}`, metadata: null };
  }
}

function hasStructuralBlock(content, policy) {
  const markers = [
    ...(policy.classes.BLOCKED.markers || []),
    ...(policy.blockedContent.structuralMarkers || []),
  ];
  const upper = content.toUpperCase();
  return markers.some((m) => upper.includes(String(m).toUpperCase()));
}

function hasNeverLoadPattern(content, policy) {
  const lower = content.toLowerCase();
  return (policy.blockedContent.neverLoadPatterns || []).some((p) => lower.includes(p.toLowerCase()));
}

function regexSecondaryWarnings(content, policy) {
  if (!policy.secretScan?.regexSecondaryOnly) return [];
  const warnings = [];
  for (const pattern of policy.secretScan.regexPatterns || []) {
    if (new RegExp(pattern, "i").test(content)) {
      warnings.push(`Secondary regex hint matched — treat as BLOCKED until reviewed`);
      break;
    }
  }
  return warnings;
}

export function classifyPacket(metadata, content, options = {}) {
  const policy = loadDispatchPolicy();
  const template = metadata?.template || metadata?.command || metadata?.packet_template;
  const explicitClass = metadata?.dispatch_class || metadata?.dispatchClass;

  if (hasStructuralBlock(content, policy) || metadata?.DO_NOT_SEND === true) {
    return { dispatchClass: "BLOCKED", reason: "DO_NOT_SEND or CLASS_C marker" };
  }

  if (explicitClass === "BLOCKED" || explicitClass === "CLASS_C") {
    return { dispatchClass: "BLOCKED", reason: "Explicit BLOCKED class" };
  }

  if (template && policy.approvedLockedTemplates[template]) {
    return {
      dispatchClass: "AUTO_SEND",
      reason: `Approved locked template: ${template}`,
      template,
    };
  }

  if (metadata?.command === "ROLE_AWARENESS_SYNC") {
    return { dispatchClass: "AUTO_SEND", reason: "Network ROLE_AWARENESS_SYNC", template: "ROLE_AWARENESS_SYNC" };
  }

  if (explicitClass === "AUTO_SEND" || explicitClass === "CLASS_A") {
    return { dispatchClass: "AUTO_SEND", reason: "Explicit AUTO_SEND — must pass guards" };
  }

  return { dispatchClass: "AUTO_LOAD_HUMAN_SEND", reason: "Default CLASS B — stop before Send" };
}

export async function verifyPacketForCourier(packetPath, options = {}) {
  const policy = loadDispatchPolicy();
  const absPath = path.isAbsolute(packetPath) ? packetPath : abs(packetPath);
  if (!fs.existsSync(absPath)) {
    return { ok: false, status: "MISSING", errors: ["Packet file not found"] };
  }

  const raw = fs.readFileSync(absPath, "utf8");
  const size = byteLength(raw);
  const parsed = extractRelayMetadata(raw);
  const errors = [];
  const warnings = [];

  if (!parsed.ok) errors.push(parsed.error);

  const metadata = parsed.metadata || {};
  const cousin = String(metadata.cousin || options.cousinId || "").toUpperCase();
  const classification = classifyPacket(metadata, raw, options);

  if (classification.dispatchClass === "BLOCKED") {
    errors.push(`CLASS C BLOCKED: ${classification.reason}`);
  }

  if (hasNeverLoadPattern(raw, policy)) {
    errors.push("CLASS C BLOCKED: prohibited content pattern (structural)");
  }

  warnings.push(...regexSecondaryWarnings(raw, policy));

  const maxBytes = policy.classes.AUTO_SEND.maxPacketBytes;
  if (classification.dispatchClass === "AUTO_SEND" && size > maxBytes) {
    errors.push(`Packet size ${size} exceeds AUTO_SEND cap ${maxBytes}`);
  }

  if (options.verifyFresh !== false && parsed.ok) {
    const libPath = path.join(ROOT, "foreman/crew-dispatch/crew-relay-lib.mjs");
    const { pathToFileURL } = await import("node:url");
    const { isPacketStale } = await import(pathToFileURL(libPath).href);
    const stale = isPacketStale(metadata);
    if (stale.stale) errors.push(`STALE: ${stale.reason}`);
    if (classification.dispatchClass === "AUTO_SEND" && stale.stale) {
      errors.push("AUTO_SEND blocked on stale hashes");
    }
  }

  const health = loadContextHealth();
  const cousinHealth = health?.cousins?.[cousin];
  if (cousinHealth?.resetRecommended || cousinHealth?.status === "STALE") {
    warnings.push(`Context health: reset recommended for ${cousin}`);
    if (classification.dispatchClass === "AUTO_SEND") {
      errors.push("AUTO_SEND blocked — context STALE or RESET_RECOMMENDED");
    }
  }

  const tabs = loadTabsConfig();
  const tab = tabs.tabs.find((t) => t.id === cousin);
  if (cousin && !tab) errors.push(`Destination cousin ${cousin} not in tabs config`);

  if (cousin) {
    const tabVerify = verifyTabDestination(cousin, { checkManifest: true });
    errors.push(...tabVerify.errors.map((e) => `Tab verify: ${e}`));
    warnings.push(...tabVerify.warnings);
  }

  if (classification.dispatchClass === "AUTO_SEND") {
    const allowed = policy.classes.AUTO_SEND.allowedCousins;
    if (cousin && !allowed.includes(cousin)) {
      errors.push(`AUTO_SEND cousin ${cousin} not allowlisted`);
    }
    const rate = checkAutoSendRateLimit(cousin);
    if (!rate.ok) errors.push(rate.error);
  }

  return {
    ok: errors.length === 0,
    status: errors.length ? "BLOCKED" : "OK",
    dispatchClass: classification.dispatchClass,
    classification,
    metadata,
    cousin,
    tab,
    pastePath: options.pastePath || null,
    size,
    errors,
    warnings,
    humanGate:
      classification.dispatchClass === "AUTO_LOAD_HUMAN_SEND"
        ? "STOP BEFORE SEND — review paste then Send manually"
        : classification.dispatchClass === "AUTO_SEND"
          ? "AUTO_SEND permitted by policy — still logged"
          : "HUMAN GATE REQUIRED",
  };
}

export function resolvePasteForCousin(cousinId, kind = "network") {
  const id = cousinId.toUpperCase();
  const tabs = loadTabsConfig();

  if (kind === "network") {
    const manifestPath = abs("foreman/crew-dispatch/LATEST_NETWORK_COMMAND.json");
    if (!fs.existsSync(manifestPath)) throw new Error("No network command — issue ROLE_AWARENESS_SYNC first");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const cousin = manifest.cousins.find((c) => c.cousinId === id);
    if (!cousin) throw new Error(`${id} not in network manifest`);
    const pastePath = abs(cousin.pastePath);
    if (!fs.existsSync(pastePath)) throw new Error(`Paste missing: ${cousin.pastePath}`);
    return {
      cousinId: id,
      tabIndex: cousin.edgeTabIndex,
      name: cousin.name,
      pastePath,
      packetFile: cousin.packetFile ? abs(cousin.packetFile) : null,
      kind: "network",
      template: "ROLE_AWARENESS_SYNC",
    };
  }

  const tab = tabs.tabs.find((t) => t.id === id);
  if (!tab?.pasteBlock) throw new Error(`No pasteBlock for ${id}`);
  const pastePath = abs(tab.pasteBlock);
  if (!fs.existsSync(pastePath)) throw new Error(`Paste missing: ${tab.pasteBlock}`);
  return {
    cousinId: id,
    tabIndex: tab.tabIndex,
    name: tab.name,
    pastePath,
    packetFile: null,
    kind: "dispatch",
    template: null,
  };
}

export async function isPlaywrightInstalled() {
  try {
    await import("playwright");
    return true;
  } catch {
    return false;
  }
}

export async function tryPlaywrightPaste(options) {
  try {
    const pw = await import("playwright");
    return {
      ok: false,
      skipped: true,
      reason: "Playwright package present but Edge paste automation not configured — using PS fallback",
      playwrightAvailable: Boolean(pw),
    };
  } catch {
    return { ok: false, skipped: true, reason: "Playwright not installed", playwrightAvailable: false };
  }
}

/**
 * No-send self-test: import Playwright, launch browser, verify tab config.
 * Must NOT paste into AI tabs or click Send.
 */
export async function runPlaywrightSelfTest() {
  const cfg = loadCourierConfig();
  const tabs = loadTabsConfig();
  const checks = [];
  const warnings = [];
  const failures = [];

  let playwright;
  try {
    playwright = await import("playwright");
    checks.push({ name: "playwright_import", ok: true });
  } catch (e) {
    failures.push(`playwright import failed: ${e.message}`);
    return {
      ok: false,
      status: "FAIL",
      checks,
      warnings,
      failures,
      humanGate: "NO SEND — self-test only",
    };
  }

  const petra = tabs.tabs.find((t) => t.id === "PETRA");
  if (!petra?.tabIndex) {
    failures.push("PETRA destination missing in crew-tabs.config.json");
  } else {
    checks.push({
      name: "destination_petra",
      ok: true,
      tabIndex: petra.tabIndex,
      url: petra.url,
    });
  }

  const foremanTab = tabs.tabs.find((t) => t.id === "FOREMAN");
  const edgeProfileRel = cfg.edgeProfileDir || "foreman/.edge-aeye-crew-profile";
  const edgeProfile = abs(edgeProfileRel);
  checks.push({
    name: "edge_profile_dir",
    ok: fs.existsSync(edgeProfile),
    path: edgeProfileRel,
  });
  if (!fs.existsSync(edgeProfile)) {
    warnings.push("Edge profile dir not created yet — open Aeye Crew Bay once");
  }

  const aiHosts = ["chatgpt.com", "gemini.google.com", "claude.ai", "deepseek.com", "perplexity.ai"];
  let browser = null;
  let launchChannel = "chromium";

  try {
    try {
      browser = await playwright.chromium.launch({ channel: "msedge", headless: true });
      launchChannel = "msedge";
    } catch {
      browser = await playwright.chromium.launch({ headless: true });
      launchChannel = "chromium";
    }
    checks.push({ name: "browser_launch", ok: true, channel: launchChannel });

    const page = await browser.newPage();
    await page.goto("about:blank");
    const blankOk = (await page.url()) === "about:blank";
    checks.push({ name: "page_control", ok: blankOk });

    if (foremanTab?.url) {
      try {
        await page.goto(foremanTab.url, {
          timeout: 8000,
          waitUntil: "domcontentloaded",
        });
        const reached = page.url().includes("4317") || page.url().includes("localhost");
        checks.push({ name: "foreman_tab_reachable", ok: reached, url: page.url() });
        if (!reached) warnings.push("Foreman tab URL did not resolve as expected");
      } catch (e) {
        warnings.push(`Foreman not reachable at ${foremanTab.url} — start foreman-control.cmd (${e.message})`);
        checks.push({ name: "foreman_tab_reachable", ok: false, skipped: true });
      }
    }

    for (const host of aiHosts) {
      if (page.url().includes(host)) {
        failures.push(`Self-test violated safe scope — navigated to ${host}`);
      }
    }
  } catch (e) {
    failures.push(`browser self-test failed: ${e.message}`);
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }

  appendCourierLog(
    `SELF-TEST ${failures.length ? "FAIL" : "PASS"} channel=${launchChannel} — NO SEND`
  );

  return {
    ok: failures.length === 0,
    status: failures.length ? "FAIL" : "PASS",
    checks,
    warnings,
    failures,
    playwrightInstalled: true,
    launchChannel,
    humanGate: "NO SEND — self-test only; no AI tabs pasted",
    neverAutomated: cfg.fallback?.neverAutomates || ["send", "submit", "post"],
  };
}

export { ROOT, abs, nowIso };
