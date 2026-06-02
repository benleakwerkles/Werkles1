#!/usr/bin/env node
/**
 * Werkles Aeye Crew — Edge Dispatch Bay launcher (PATH B)
 * Opens fixed crew tabs in a dedicated Edge profile. Stops before Send.
 */

import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";

const REPO_ROOT = "C:\\Users\\benle\\Desktop\\github\\Werkles";
const CONFIG_PATH = path.join(REPO_ROOT, "foreman", "crew-dispatch", "crew-tabs.config.json");
const SERVER_SCRIPT = path.join(REPO_ROOT, "scripts", "foreman", "foreman-control-server.mjs");
const PANEL_PORT = 4317;
const PANEL_HOST = "127.0.0.1";

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`Missing config: ${CONFIG_PATH}`);
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
}

function findEdgeExecutable() {
  const candidates = [
    path.join(process.env["ProgramFiles(x86)"] || "", "Microsoft", "Edge", "Application", "msedge.exe"),
    path.join(process.env.ProgramFiles || "", "Microsoft", "Edge", "Application", "msedge.exe"),
  ];
  for (const exe of candidates) {
    if (exe && fs.existsSync(exe)) return exe;
  }
  throw new Error("Microsoft Edge not found. Install Edge or adjust paths.");
}

function isPanelUp() {
  return new Promise((resolve) => {
    const req = http.get(`http://${PANEL_HOST}:${PANEL_PORT}/api/status`, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function startForemanPanelSilently() {
  const child = spawn(process.execPath, [SERVER_SCRIPT, "--no-browser"], {
    cwd: REPO_ROOT,
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref();
}

async function ensureForemanPanel(config) {
  if (!(await isPanelUp())) {
    if (!config.foremanControlPanel?.autoStartIfDown) {
      console.warn("Foreman Control Panel is not running. Start foreman-control.cmd, then refresh tab 6.");
      return;
    }
    console.log("Starting Foreman Control Panel on localhost:4317 (no extra browser window)...");
    startForemanPanelSilently();
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 400));
      if (await isPanelUp()) {
        console.log("Foreman Control Panel is up.");
        return;
      }
    }
    console.warn("Foreman Control Panel did not respond in time. Tab 6 may fail — run foreman-control.cmd.");
  }
}

function openEdgeDispatchBay(config) {
  const edge = findEdgeExecutable();
  const profile = config.edgeProfile?.directory || "WerklesAeyeCrew";
  const tabs = [...config.tabs].sort((a, b) => a.order - b.order);
  const urls = tabs.map((t) => t.url).filter(Boolean);

  if (!urls.length) throw new Error("No tab URLs in crew-tabs.config.json");

  const args = [`--profile-directory=${profile}`, "--new-window", ...urls];

  console.log(`Opening Edge profile "${profile}" with ${urls.length} tabs...`);
  console.log("STOP BEFORE SEND — no messages sent; you paste manually.");

  const child = spawn(edge, args, {
    cwd: REPO_ROOT,
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref();
}

async function main() {
  const config = loadConfig();
  await ensureForemanPanel(config);
  openEdgeDispatchBay(config);
  console.log("");
  console.log("Aeye Crew Dispatch Bay opened.");
  console.log(`Workspace name (save once in Edge): ${config.workspaceName}`);
  console.log("See foreman/crew-dispatch/EDGE_WORKSPACE_SETUP.md for one-time Workspace save.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
