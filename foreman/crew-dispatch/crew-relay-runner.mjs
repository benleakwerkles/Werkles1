#!/usr/bin/env node
/**
 * AEYE Crew Relay Runner — orchestrated network sync.
 * Mechanical steps automated. Human gates: Send (per tab), inbox save, process/merge.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { pathToFileURL, fileURLToPath } from "node:url";
import { read, nowIso, exists } from "../../scripts/foreman/_foreman-core.mjs";
import { computeCockpitHashes, truncateHash } from "./crew-relay-lib.mjs";
import { issueNetworkCommand } from "./crew-relay-network-command.mjs";
import {
  clearStaleRelayLockIfNeeded,
  forceReleaseRelayLock,
} from "../../scripts/foreman/relay-courier-lib.mjs";

const SESSION_PATH = "foreman/crew-dispatch/.relay-session.json";
const MANIFEST_PATH = "foreman/crew-dispatch/LATEST_NETWORK_COMMAND.json";

export const RELAY_STATES = {
  IDLE: "idle",
  PREPARING: "preparing",
  DELIVERING: "delivering",
  AWAITING_SEND: "awaiting_send",
  COMPLETE: "complete",
  CANCELLED: "cancelled",
  ERROR: "error",
};

function sessionAbs() {
  return path.join(process.cwd(), SESSION_PATH);
}

function manifestAbs() {
  return path.join(process.cwd(), MANIFEST_PATH);
}

export function loadManifest() {
  const p = manifestAbs();
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

export function loadSession() {
  const p = sessionAbs();
  if (!fs.existsSync(p)) {
    return { state: RELAY_STATES.IDLE, cousins: [], currentIndex: -1, steps: [] };
  }
  try {
    const raw = fs.readFileSync(p, "utf8").trim();
    if (!raw || raw.startsWith("{")) {
      const parsed = JSON.parse(raw || "{}");
      if (parsed.state) return parsed;
    }
  } catch {
    /* fall through */
  }
  return { state: RELAY_STATES.IDLE, cousins: [], currentIndex: -1, steps: [] };
}

function saveSession(session) {
  fs.writeFileSync(sessionAbs(), JSON.stringify(session, null, 2), "utf8");
}

function clearSession() {
  saveSession({
    state: RELAY_STATES.IDLE,
    cousins: [],
    currentIndex: -1,
    steps: [],
    updatedAt: nowIso(),
  });
}

function manifestIsStale(manifest) {
  const live = computeCockpitHashes();
  const first = manifest.cousins?.[0];
  if (!first?.nextActionHashTrunc) return false;
  const liveTrunc = truncateHash(live.nextActionHash);
  return first.nextActionHashTrunc !== liveTrunc;
}

async function importCourier() {
  const mod = await import(
    pathToFileURL(path.join(process.cwd(), "scripts/foreman/relay-courier.mjs")).href
  );
  return {
    deliverToCousin: (cousinId, options) => mod.courierDeliver(cousinId, options),
  };
}

function buildHumanGate(cousin) {
  return `HUMAN GATE: Review Edge tab ${cousin.edgeTabIndex} (${cousin.name}) and click Send. Then press I Sent on the dashboard.`;
}

function buildSessionFromManifest(manifest) {
  return {
    id: crypto.randomUUID(),
    command: manifest.command,
    version: manifest.version,
    issuedAt: manifest.issued_at,
    state: RELAY_STATES.PREPARING,
    startedAt: nowIso(),
    updatedAt: nowIso(),
    currentIndex: 0,
    cousins: manifest.cousins.map((c) => ({
      cousinId: c.cousinId,
      name: c.name,
      edgeTabIndex: c.edgeTabIndex,
      pastePath: c.pastePath,
      packetFile: c.packetFile,
    })),
    steps: manifest.cousins.map((c) => ({
      cousinId: c.cousinId,
      name: c.name,
      edgeTabIndex: c.edgeTabIndex,
      deliveredAt: null,
      sentAt: null,
      partial: false,
      error: null,
    })),
    humanGate: null,
    message: "Preparing relay...",
    automated: ["issue packets", "open edge bay", "tab focus", "paste"],
    neverAutomated: ["Send", "save FROM_* to inbox", "merge to repo"],
  };
}

async function deliverStep(session, index) {
  const cousin = session.cousins[index];
  const step = session.steps[index];
  const { deliverToCousin } = await importCourier();

  session.state = RELAY_STATES.DELIVERING;
  session.updatedAt = nowIso();
  session.message = `Delivering tab ${cousin.edgeTabIndex} ${cousin.name}...`;
  saveSession(session);

  try {
    const result = await deliverToCousin(cousin.cousinId, {
      kind: "network",
      ensureEdge: index === 0,
    });

    if (!result.ok && (result.loadFailed || result.status === "MANUAL_LOAD_REQUIRED")) {
      step.error = result.error || "Load failed";
      step.partial = true;
      session.state = RELAY_STATES.ERROR;
      session.currentIndex = index;
      session.humanGate = "MANUAL LOAD REQUIRED — paste manually in Edge; do not press I Sent until loaded";
      session.message = `MANUAL LOAD REQUIRED — tab ${cousin.edgeTabIndex} ${cousin.name}`;
      session.updatedAt = nowIso();
      saveSession(session);
      return { session, deliver: result, manualLoad: true };
    }

    step.deliveredAt = nowIso();
    step.partial = Boolean(result.result?.partial);
    step.error = null;
    session.state = RELAY_STATES.AWAITING_SEND;
    session.currentIndex = index;
    session.humanGate = buildHumanGate(cousin);
    session.message = step.partial
      ? `Tab ${cousin.edgeTabIndex} ${cousin.name}: clipboard ready, focus failed - click chat input then Ctrl+V if needed`
      : `Tab ${cousin.edgeTabIndex} ${cousin.name}: pasted. Click Send in Edge.`;
    session.updatedAt = nowIso();
    saveSession(session);
    return { session, deliver: result };
  } catch (e) {
    step.error = e.message || String(e);
    session.state = RELAY_STATES.ERROR;
    session.message = `Deliver failed on ${cousin.name}: ${step.error}`;
    session.humanGate = "Fix Edge bay or cancel relay and retry";
    session.updatedAt = nowIso();
    saveSession(session);
    throw e;
  }
}

const STALE_SESSION_MS = 90 * 1000;

function isStaleActiveSession(session) {
  if (![RELAY_STATES.DELIVERING, RELAY_STATES.PREPARING].includes(session.state)) return false;
  const ts = Date.parse(session.updatedAt || session.startedAt || 0);
  if (!ts || Number.isNaN(ts)) return true;
  return Date.now() - ts >= STALE_SESSION_MS;
}

export async function startNetworkRelay(options = {}) {
  clearStaleRelayLockIfNeeded();
  const active = loadSession();

  if (active.state === RELAY_STATES.AWAITING_SEND) {
    const cousin = active.cousins?.[active.currentIndex];
    throw new Error(
      `Relay waiting for Send${cousin ? ` on tab ${cousin.edgeTabIndex} ${cousin.name}` : ""}. Click I Sent — Next Cousin or Cancel Relay.`
    );
  }

  if ([RELAY_STATES.DELIVERING, RELAY_STATES.PREPARING].includes(active.state)) {
    if (!isStaleActiveSession(active)) {
      throw new Error(`Relay already active (${active.state}). Wait, Cancel Relay, or Reset Stuck Relay.`);
    }
    cancelRelay();
  } else if (active.state !== RELAY_STATES.IDLE && active.state !== RELAY_STATES.COMPLETE && active.state !== RELAY_STATES.CANCELLED && active.state !== RELAY_STATES.ERROR) {
    throw new Error(`Relay already active (${active.state}). Cancel or Reset before starting again.`);
  }

  let manifest = loadManifest();
  const mustReissue =
    options.reissue ||
    !manifest ||
    (options.ensureFresh !== false && manifest && manifestIsStale(manifest));

  if (mustReissue) {
    manifest = issueNetworkCommand();
  }

  if (!manifest?.cousins?.length) {
    throw new Error("Network manifest has no cousins");
  }

  const session = buildSessionFromManifest(manifest);
  if (mustReissue && !options.reissue) {
    session.message = "Fresh network command issued (cockpit hash sync)";
  }
  saveSession(session);

  const out = await deliverStep(session, 0);
  return {
    ok: true,
    reissued: mustReissue,
    session: loadSession(),
    deliver: out.deliver,
  };
}

export async function confirmRelaySent() {
  const session = loadSession();
  if (session.state !== RELAY_STATES.AWAITING_SEND) {
    throw new Error(`Cannot confirm Send in state: ${session.state}`);
  }

  const idx = session.currentIndex;
  const step = session.steps[idx];
  if (!step) throw new Error("Invalid relay step index");
  step.sentAt = nowIso();

  const nextIndex = idx + 1;
  if (nextIndex >= session.cousins.length) {
    session.state = RELAY_STATES.COMPLETE;
    session.currentIndex = nextIndex - 1;
    session.humanGate = "HUMAN GATE: Save each cousin reply as FROM_* in inbox, then Validate Inbox on dashboard";
    session.message = "All five tabs delivered. Save responses to inbox, then Validate and Process.";
    session.updatedAt = nowIso();
    saveSession(session);
    return { ok: true, session, complete: true };
  }

  saveSession(session);
  const out = await deliverStep(loadSession(), nextIndex);
  return { ok: true, session: loadSession(), complete: false, deliver: out.deliver };
}

export function cancelRelay() {
  const session = loadSession();
  session.state = RELAY_STATES.CANCELLED;
  session.message = "Relay cancelled by operator";
  session.humanGate = null;
  session.updatedAt = nowIso();
  saveSession(session);
  forceReleaseRelayLock("Cancelled by operator");
  return { ok: true, session };
}

export function resetRelay() {
  forceReleaseRelayLock("Reset by operator");
  clearSession();
  return { ok: true, session: loadSession() };
}

export function getRelayStatus() {
  const session = loadSession();
  const manifest = loadManifest();
  return {
    ok: true,
    session,
    manifest: manifest
      ? {
          command: manifest.command,
          version: manifest.version,
          issued_at: manifest.issued_at,
          cousinCount: manifest.cousins?.length ?? 0,
          stale: manifestIsStale(manifest),
        }
      : null,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] || "status";
  if (cmd === "status") {
    console.log(JSON.stringify(getRelayStatus(), null, 2));
    return;
  }
  if (cmd === "start") {
    const reissue = args.includes("--reissue");
    console.log(JSON.stringify(await startNetworkRelay({ reissue }), null, 2));
    return;
  }
  if (cmd === "sent") {
    console.log(JSON.stringify(await confirmRelaySent(), null, 2));
    return;
  }
  if (cmd === "cancel") {
    console.log(JSON.stringify(cancelRelay(), null, 2));
    return;
  }
  if (cmd === "reset") {
    console.log(JSON.stringify(resetRelay(), null, 2));
    return;
  }
  console.log("Usage: status | start [--reissue] | sent | cancel | reset");
  process.exit(1);
}

const isRunnerCli =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isRunnerCli) {
  main().catch((e) => {
    console.error(e.message || String(e));
    process.exit(1);
  });
}
