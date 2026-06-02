#!/usr/bin/env node
/**
 * Install Relay Courier browser automation deps (Playwright + Chromium).
 * Local repo only — no global install unless this script fails and operator chooses otherwise.
 *
 *   node scripts/foreman/install-relay-courier.mjs
 *   node scripts/foreman/install-relay-courier.mjs --skip-browser
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = process.cwd();
const PACKAGE_JSON = path.join(REPO_ROOT, "package.json");

function npmCmd() {
  const candidate = "C:/Program Files/nodejs/npm.cmd";
  return fs.existsSync(candidate) ? candidate : "npm.cmd";
}

function npxCmd() {
  const candidate = "C:/Program Files/nodejs/npx.cmd";
  return fs.existsSync(candidate) ? candidate : "npx.cmd";
}

function run(cmd, args, label) {
  console.log(`\n>> ${label}`);
  console.log(`   ${cmd} ${args.join(" ")}`);
  const result = spawnSync(cmd, args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      Path: `C:\\Program Files\\nodejs;${process.env.Path || process.env.PATH || ""}`,
      PATH: `C:\\Program Files\\nodejs;${process.env.PATH || process.env.Path || ""}`,
    },
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    throw new Error(`${label} failed (exit ${result.status})`);
  }
  return result.stdout?.trim() || "";
}

function playwrightListed() {
  if (!fs.existsSync(PACKAGE_JSON)) return false;
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, "utf8"));
  return Boolean(pkg.devDependencies?.playwright || pkg.dependencies?.playwright);
}

export function installRelayCourier(options = {}) {
  const skipBrowser = Boolean(options.skipBrowser);
  const report = {
    ok: true,
    repoRoot: REPO_ROOT,
    playwrightAlreadyInstalled: playwrightListed(),
    npmInstallPerformed: false,
    browserInstallPerformed: false,
    steps: [],
  };

  if (!fs.existsSync(path.join(REPO_ROOT, "foreman", "crew-dispatch", "relay-courier.config.json"))) {
    throw new Error("Not in Werkles repo root — relay-courier.config.json missing");
  }

  if (!report.playwrightAlreadyInstalled) {
    run(npmCmd(), ["install", "-D", "playwright"], "Install playwright devDependency");
    report.npmInstallPerformed = true;
    report.steps.push("npm install -D playwright");
  } else {
    report.steps.push("playwright already in package.json — skip npm install");
  }

  if (!skipBrowser) {
    run(npxCmd(), ["playwright", "install", "chromium"], "Install Playwright Chromium browser");
    report.browserInstallPerformed = true;
    report.steps.push("npx playwright install chromium");
  } else {
    report.steps.push("browser install skipped (--skip-browser)");
  }

  report.playwrightVersion = run(
    npmCmd(),
    ["list", "playwright", "--depth=0"],
    "Verify playwright package"
  );

  return report;
}

function main() {
  const skipBrowser = process.argv.includes("--skip-browser");
  try {
    const report = installRelayCourier({ skipBrowser });
    console.log("\nInstall complete.");
    console.log(JSON.stringify(report, null, 2));
  } catch (e) {
    console.error(e.message || String(e));
    process.exit(1);
  }
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) main();
