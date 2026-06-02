#!/usr/bin/env node
/**
 * Relay Courier — deterministic local browser courier (not an AI cousin).
 *
 *   node scripts/foreman/relay-courier.mjs verify --cousin PETRA --kind network
 *   node scripts/foreman/relay-courier.mjs deliver --cousin PETRA --kind network
 *   node scripts/foreman/relay-courier.mjs status
 *   node scripts/foreman/relay-courier.mjs self-test
 */
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  acquireRelayLock,
  releaseRelayLock,
  appendCourierLog,
  appendSendLog,
  verifyPacketForCourier,
  resolvePasteForCousin,
  verifyTabDestination,
  verifyAllRelayTabDestinations,
  loadRelayLock,
  loadContextHealth,
  recordAutoSend,
  tryPlaywrightPaste,
  runPlaywrightSelfTest,
  abs,
  nowIso,
  forceReleaseRelayLock,
  clearStaleRelayLockIfNeeded,
} from "./relay-courier-lib.mjs";

const REPO_ROOT = process.cwd();
const PS1_FALLBACK = path.join(REPO_ROOT, "foreman", "crew-dispatch", "crew-edge-courier.ps1");

const PS1_COURIER_TIMEOUT_MS = 90000;

function runPs1Courier(args, timeoutMs = PS1_COURIER_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const psArgs = [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      PS1_FALLBACK,
      "-RepoRoot",
      REPO_ROOT,
      ...args,
    ];
    const child = spawn("powershell.exe", psArgs, { cwd: REPO_ROOT, windowsHide: true });
    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        child.kill("SIGTERM");
      } catch {
        /* ignore */
      }
      reject(
        new Error(
          `Edge courier timed out after ${Math.round(timeoutMs / 1000)}s — open Aeye Crew Bay, paste manually, or click Reset Stuck Relay`
        )
      );
    }, timeoutMs);

    child.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code !== 0) reject(new Error(stderr.trim() || stdout.trim() || `courier exit ${code}`));
      else resolve(stdout.trim());
    });
  });
}

export async function courierDeliver(cousinId, options = {}) {
  const kind = options.kind || "network";
  const tabOnly = Boolean(options.tabOnly);
  const ensureEdge = Boolean(options.ensureEdge);

  let resolved;
  try {
    resolved = resolvePasteForCousin(cousinId, kind);
  } catch (e) {
    return {
      ok: false,
      loadFailed: true,
      status: "MANUAL_LOAD_REQUIRED",
      error: e.message,
      humanGate: "MANUAL LOAD REQUIRED — open Edge tab and paste from outbox",
    };
  }

  let verification = {
    ok: true,
    dispatchClass: kind === "network" ? "AUTO_SEND" : "AUTO_LOAD_HUMAN_SEND",
    errors: [],
    warnings: [],
  };

  if (resolved.packetFile && fs.existsSync(resolved.packetFile)) {
    verification = await verifyPacketForCourier(resolved.packetFile, {
      cousinId: resolved.cousinId,
      pastePath: resolved.pastePath,
    });
  } else if (kind === "network") {
    verification.classification = { dispatchClass: "AUTO_SEND", reason: "ROLE_AWARENESS_SYNC network paste" };
    verification.dispatchClass = "AUTO_SEND";
  }

  if (!verification.ok) {
    appendCourierLog(`BLOCKED ${resolved.cousinId}: ${verification.errors.join("; ")}`);
    return {
      ok: false,
      blocked: true,
      status: "BLOCKED",
      cousinId: resolved.cousinId,
      errors: verification.errors,
      warnings: verification.warnings,
      humanGate: "HUMAN GATE REQUIRED — packet blocked",
    };
  }

  const lock = acquireRelayLock({
    cousin: resolved.cousinId,
    packetFile: resolved.packetFile ? path.basename(resolved.packetFile) : path.basename(resolved.pastePath),
  });
  if (!lock.ok) {
    return { ok: false, blocked: true, status: "LOCKED", error: lock.error, lock: lock.lock };
  }

  try {
    const pwProbe = await tryPlaywrightPaste({ cousinId: resolved.cousinId });
    const psArgs = ["-CousinId", resolved.cousinId, "-TabIndex", String(resolved.tabIndex)];
    if (tabOnly) {
      psArgs.push("-TabOnly");
    } else {
      psArgs.push("-PasteFile", resolved.pastePath);
    }
    if (ensureEdge) psArgs.push("-EnsureEdge");

    const out = await runPs1Courier(psArgs);
    let parsed = null;
    try {
      parsed = JSON.parse(out);
    } catch {
      parsed = { raw: out };
    }

    const loadFailed = parsed?.partial === true || parsed?.focusFailed === true;
    const dispatchClass = verification.dispatchClass;

    if (loadFailed) {
      appendCourierLog(
        `LOAD PARTIAL ${resolved.cousinId} tab ${resolved.tabIndex} — MANUAL LOAD REQUIRED`
      );
      releaseRelayLock("failed", { message: "MANUAL LOAD REQUIRED", error: "Focus/paste partial" });
      return {
        ok: false,
        loadFailed: true,
        status: "MANUAL_LOAD_REQUIRED",
        cousinId: resolved.cousinId,
        tabIndex: resolved.tabIndex,
        name: resolved.name,
        pastePath: resolved.pastePath,
        dispatchClass,
        result: parsed,
        playwright: pwProbe,
        humanGate: "MANUAL LOAD REQUIRED — do not assume AWAITING SEND",
      };
    }

    appendCourierLog(
      `LOAD OK ${resolved.cousinId} tab ${resolved.tabIndex} class=${dispatchClass} engine=powershell`
    );

    if (dispatchClass === "AUTO_SEND") {
      appendSendLog(
        `AUTO_SEND eligible ${resolved.cousinId} — policy permits but Send NOT automated (doctrine: human Send unless future Playwright send gate opened)`
      );
      recordAutoSend(resolved.cousinId, resolved.packetFile || resolved.pastePath);
    }

    releaseRelayLock("success", {
      message: dispatchClass === "AUTO_LOAD_HUMAN_SEND" ? "Loaded — STOP BEFORE SEND" : "Loaded — AUTO_SEND class",
    });

    return {
      ok: true,
      status: dispatchClass === "AUTO_LOAD_HUMAN_SEND" ? "LOADED_AWAITING_HUMAN_SEND" : "LOADED_AUTO_SEND_CLASS",
      cousinId: resolved.cousinId,
      tabIndex: resolved.tabIndex,
      name: resolved.name,
      pastePath: resolved.pastePath,
      dispatchClass,
      result: parsed,
      playwright: pwProbe,
      warnings: verification.warnings,
      humanGate:
        dispatchClass === "AUTO_LOAD_HUMAN_SEND"
          ? "STOP BEFORE SEND — review Edge tab then Send manually"
          : "AUTO_SEND class — Send still manual per doctrine",
    };
  } catch (e) {
    appendCourierLog(`FAIL ${resolved.cousinId}: ${e.message}`);
    releaseRelayLock("failed", { message: "MANUAL LOAD REQUIRED", error: e.message });
    return {
      ok: false,
      loadFailed: true,
      status: "MANUAL_LOAD_REQUIRED",
      error: e.message,
      humanGate: "MANUAL LOAD REQUIRED",
    };
  }
}

export async function courierVerify(cousinId, options = {}) {
  const kind = options.kind || "network";
  const resolved = resolvePasteForCousin(cousinId, kind);
  const target = resolved.packetFile || resolved.pastePath;
  const packetVerify = await verifyPacketForCourier(target, { cousinId: resolved.cousinId });
  const tabVerify = verifyTabDestination(resolved.cousinId, { checkManifest: kind === "network" });
  const errors = [...(packetVerify.errors || []), ...tabVerify.errors];
  const warnings = [...(packetVerify.warnings || []), ...tabVerify.warnings];
  return {
    ...packetVerify,
    ok: packetVerify.ok && tabVerify.ok,
    status: errors.length ? "BLOCKED" : packetVerify.status,
    tabVerification: tabVerify,
    errors,
    warnings,
  };
}

export function courierStatus() {
  clearStaleRelayLockIfNeeded();
  const tabMapping = verifyAllRelayTabDestinations({ checkManifest: true });
  const profileRel = "foreman/.edge-aeye-crew-profile";
  return {
    ok: true,
    lock: loadRelayLock(),
    contextHealth: loadContextHealth(),
    tabMapping,
    edgeProfileDir: profileRel,
    edgeProfileReady: fs.existsSync(abs(profileRel)),
    at: nowIso(),
  };
}

export async function courierSelfTest() {
  return runPlaywrightSelfTest();
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (cmd === "status") {
    console.log(JSON.stringify(courierStatus(), null, 2));
    return;
  }

  if (cmd === "unlock") {
    const result = forceReleaseRelayLock("CLI unlock");
    console.log(JSON.stringify({ ok: true, ...result }, null, 2));
    return;
  }

  if (cmd === "self-test") {
    const result = await runPlaywrightSelfTest();
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 1);
  }

  if (cmd === "verify-tabs") {
    const result = verifyAllRelayTabDestinations({ checkManifest: true });
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 1);
  }

  if (cmd === "verify" || cmd === "deliver") {
    let cousin = null;
    let kind = "network";
    let tabOnly = false;
    let ensureEdge = false;
    for (let i = 1; i < args.length; i++) {
      if (args[i] === "--cousin" && args[i + 1]) cousin = args[++i];
      if (args[i] === "--kind" && args[i + 1]) kind = args[++i];
      if (args[i] === "--tab-only") tabOnly = true;
      if (args[i] === "--ensure-edge") ensureEdge = true;
    }
    if (!cousin) {
      console.error("Usage: verify|deliver --cousin PETRA [--kind network|dispatch] [--tab-only] [--ensure-edge]");
      process.exit(1);
    }
    if (cmd === "verify") {
      const result = await courierVerify(cousin, { kind });
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.ok ? 0 : 1);
    }
    const result = await courierDeliver(cousin, { kind, tabOnly, ensureEdge });
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 1);
  }

  console.log(`Relay Courier — deterministic local browser courier

Commands:
  status
  verify-tabs       All five Aeye cousins — config + manifest tab mapping
  self-test          Playwright smoke test — NO SEND, no AI paste
  verify --cousin PETRA [--kind network|dispatch]
  deliver --cousin PETRA [--kind network|dispatch] [--ensure-edge]`);
  process.exit(args.length === 0 ? 1 : 0);
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  main().catch((e) => {
    console.error(e.message || String(e));
    process.exit(1);
  });
}
