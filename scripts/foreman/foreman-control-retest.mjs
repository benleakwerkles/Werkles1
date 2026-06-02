#!/usr/bin/env node
/**
 * Foreman Control Panel — Bean hardening automated retests (local only).
 */

import fs from "node:fs";
import path from "node:path";
import http from "node:http";

const REPO_ROOT = "C:\\Users\\benle\\Desktop\\github\\Werkles";
const PORT = 4317;
const HOST = "127.0.0.1";

const serverPath = path.join(REPO_ROOT, "scripts", "foreman", "foreman-control-server.mjs");
const source = fs.readFileSync(serverPath, "utf8");

const checks = [];

function pass(name) {
  checks.push({ name, ok: true });
  console.log(`PASS  ${name}`);
}

function fail(name, detail) {
  checks.push({ name, ok: false, detail });
  console.log(`FAIL  ${name} — ${detail}`);
}

if (!source.includes("foreman-control.pid")) fail("pid file", "missing PID file reference");
else pass("PID file referenced");

if (source.includes("kill all node") || source.includes("taskkill /IM node.exe")) {
  fail("no mass node kill", "found broad node kill pattern");
} else pass("no mass node kill");

if (!source.includes("HUMAN GATE REQUIRED")) fail("human gate message", "missing");
else pass("HUMAN GATE REQUIRED message");

if (!source.includes("DROP_ZONE_MAX_BYTES")) fail("drop zone limit", "missing");
else pass("Drop zone 100KB limit");

if (!source.includes("verifyLocalToken")) fail("local token", "missing");
else pass("Local token verification");

if (!source.includes("127.0.0.1")) fail("localhost bind", "missing");
else pass("Localhost bind");

async function request(method, urlPath, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["X-Foreman-Local-Token"] = token;
  const payload = body ? JSON.stringify(body) : undefined;
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: HOST, port: PORT, path: urlPath, method, headers },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, json: JSON.parse(data || "{}") });
          } catch {
            resolve({ status: res.statusCode, json: {} });
          }
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function liveTests() {
  let token = "";
  const tokenPath = path.join(REPO_ROOT, "foreman", "control-panel", ".local_token");
  if (fs.existsSync(tokenPath)) token = fs.readFileSync(tokenPath, "utf8").trim();

  try {
    const noToken = await request("POST", "/api/action", { action: "show-current-gate" });
    if (noToken.status === 401) pass("POST without token rejected");
    else fail("POST without token rejected", `status ${noToken.status}`);
  } catch {
    fail("POST without token rejected", "server not running on 4317");
    return;
  }

  if (!token) {
    fail("token file present", "start server once to generate .local_token");
    return;
  }

  const big = "x".repeat(100 * 1024 + 1);
  const tooBig = await request("POST", "/api/drop-zone/save", { content: big, slugHint: "big" }, token);
  if (tooBig.status >= 400 && tooBig.json.ok === false) pass("Drop zone rejects >100KB");
  else fail("Drop zone rejects >100KB", `status ${tooBig.status}`);

  const traversal = await request(
    "POST",
    "/api/drop-zone/save",
    { content: "# test", slugHint: "../../evil" },
    token
  );
  if (traversal.status >= 400) pass("Drop zone rejects traversal slug");
  else fail("Drop zone rejects traversal slug", `status ${traversal.status}`);

  const status = await request("GET", "/api/status");
  if (status.status === 200 && status.json.gate) pass("Dashboard status API");
  else fail("Dashboard status API", `status ${status.status}`);
}

await liveTests();

const failed = checks.filter((c) => !c.ok);
console.log("");
console.log(`${checks.length - failed.length}/${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
