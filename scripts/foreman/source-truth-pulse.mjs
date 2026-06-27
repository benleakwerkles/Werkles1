#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(__filename);
const writeFlag = process.argv.includes("--write") ? ["--write"] : [];

function run(script) {
  execFileSync(process.execPath, [path.join(scriptDir, script), ...writeFlag], {
    cwd: path.resolve(scriptDir, "..", ".."),
    stdio: "inherit",
  });
}

run("atlas-source-truth-readback.mjs");
run("speaker-truth-mirror.mjs");
