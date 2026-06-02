#!/usr/bin/env node
/**
 * AEYE Edge courier — CLI wrapper (focus tab + paste, STOP BEFORE SEND).
 *
 *   node foreman/crew-dispatch/crew-edge-courier.mjs deliver --cousin PETRA
 *   node foreman/crew-dispatch/crew-edge-courier.mjs deliver --cousin PETRA --kind dispatch
 *   node foreman/crew-dispatch/crew-edge-courier.mjs deliver --cousin PETRA --tab-only
 *   node foreman/crew-dispatch/crew-edge-courier.mjs walk [--ensure-edge]
 */
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { read } from "../../scripts/foreman/_foreman-core.mjs";

const REPO_ROOT = process.cwd();
const PS1 = path.join(REPO_ROOT, "foreman", "crew-dispatch", "crew-edge-courier.ps1");
const TABS_CONFIG = "foreman/crew-dispatch/crew-tabs.config.json";
const LATEST_NETWORK = "foreman/crew-dispatch/LATEST_NETWORK_COMMAND.json";

const COUSIN_IDS = ["PETRA", "SKYBRO", "ENDER", "BEAN", "COMPUTER"];

function loadTabsConfig() {
  return JSON.parse(read(TABS_CONFIG));
}

function loadNetworkManifest() {
  const p = path.join(REPO_ROOT, LATEST_NETWORK);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

export function resolvePasteFile(cousinId, kind = "network") {
  const id = cousinId.toUpperCase();
  if (!COUSIN_IDS.includes(id)) throw new Error(`Unknown cousin: ${cousinId}`);

  if (kind === "network") {
    const manifest = loadNetworkManifest();
    if (!manifest) throw new Error("No network command issued — run Issue Role Awareness Sync first");
    const cousin = manifest.cousins.find((c) => c.cousinId === id);
    if (!cousin) throw new Error(`${id} not in latest network manifest`);
    const pastePath = path.join(REPO_ROOT, cousin.pastePath.replace(/\//g, path.sep));
    if (!fs.existsSync(pastePath)) throw new Error(`Paste missing: ${cousin.pastePath}`);
    return { pastePath, tabIndex: cousin.edgeTabIndex, name: cousin.name, kind: "network" };
  }

  const config = loadTabsConfig();
  const tab = config.tabs.find((t) => t.id === id);
  if (!tab) throw new Error(`Tab ${id} not in crew-tabs.config.json`);
  if (!tab.pasteBlock) throw new Error(`No pasteBlock for ${id} in crew-tabs config`);
  const pastePath = path.join(REPO_ROOT, tab.pasteBlock.replace(/\//g, path.sep));
  if (!fs.existsSync(pastePath)) throw new Error(`Paste missing: ${tab.pasteBlock} — generate packet first`);
  return { pastePath, tabIndex: tab.tabIndex, name: tab.name, kind: "dispatch" };
}

function runCourierPs1(args, options = {}) {
  return new Promise((resolve, reject) => {
    const psArgs = [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      PS1,
      "-RepoRoot",
      REPO_ROOT,
      ...args,
    ];
    const child = spawn(
      "powershell.exe",
      psArgs,
      { cwd: REPO_ROOT, windowsHide: options.hidden !== false }
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || stdout.trim() || `courier exit ${code}`));
        return;
      }
      resolve(stdout.trim());
    });
  });
}

export async function deliverToCousin(cousinId, options = {}) {
  const kind = options.kind || "network";
  const tabOnly = Boolean(options.tabOnly);
  const ensureEdge = Boolean(options.ensureEdge);
  const resolved = resolvePasteFile(cousinId, kind);

  const args = ["-CousinId", cousinId.toUpperCase(), "-TabIndex", String(resolved.tabIndex)];
  if (tabOnly) {
    args.push("-TabOnly");
  } else {
    args.push("-PasteFile", resolved.pastePath);
  }
  if (ensureEdge) args.push("-EnsureEdge");

  const out = await runCourierPs1(args);
  let parsed = null;
  try {
    parsed = JSON.parse(out);
  } catch {
    parsed = { raw: out };
  }
  return {
    ok: true,
    cousinId: cousinId.toUpperCase(),
    ...resolved,
    result: parsed,
    humanGate: "STOP BEFORE SEND — review and Send manually",
  };
}

export function walkNetworkSync(options = {}) {
  const args = ["-WalkNetworkSync"];
  if (options.ensureEdge) args.push("-EnsureEdge");
  const child = spawn(
    "powershell.exe",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", PS1, "-RepoRoot", REPO_ROOT, ...args],
    { cwd: REPO_ROOT, detached: true, stdio: "ignore", windowsHide: false }
  );
  child.unref();
  return {
    ok: true,
    message: "Courier walk opened — follow PowerShell prompts between tabs",
    humanGate: "Send is manual between each cousin",
  };
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (cmd === "deliver") {
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
      console.error("Usage: deliver --cousin PETRA [--kind network|dispatch] [--tab-only] [--ensure-edge]");
      process.exit(1);
    }
    const result = await deliverToCousin(cousin, { kind, tabOnly, ensureEdge });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (cmd === "walk") {
    const ensureEdge = args.includes("--ensure-edge");
    const result = walkNetworkSync({ ensureEdge });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`Usage:
  node foreman/crew-dispatch/crew-edge-courier.mjs deliver --cousin PETRA [--kind network|dispatch]
  node foreman/crew-dispatch/crew-edge-courier.mjs walk [--ensure-edge]`);
  process.exit(args.length === 0 ? 1 : 0);
}

const isCourierCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCourierCli) {
  main().catch((e) => {
    console.error(e.message || String(e));
    process.exit(1);
  });
}
