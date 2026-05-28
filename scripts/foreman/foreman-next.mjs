#!/usr/bin/env node
import {
  appendOperatorLog,
  ensureForemanDirs,
  exists,
  parsePhaseStatus
} from "./_foreman-core.mjs";
import { spawnSync } from "node:child_process";

ensureForemanDirs();

const status = parsePhaseStatus();
const buildOrder = "docs/ai/07_BUILD_ORDER.md";
const filesRead = ["foreman/PHASE_STATUS.md"];
if (exists(buildOrder)) filesRead.push(buildOrder);

const result = spawnSync(process.execPath, [
  "scripts/foreman/make-handoff.mjs",
  `${status.phase}-${status.step}`
], {
  cwd: process.cwd(),
  encoding: "utf8"
});

process.stdout.write(result.stdout || "");
process.stderr.write(result.stderr || "");

appendOperatorLog({
  command: "FOREMAN NEXT",
  phase: status.phase,
  step: status.step,
  filesRead,
  filesWritten: [`handoffs/pending/${status.phase}-${status.step}-handoff.md`],
  checksRun: ["build order existence check", "handoff generation"],
  result: result.status === 0 ? "next handoff packet generated" : "next handoff generation failed",
  nextApproval: "Operator sends packet only if it is not marked missing sources"
});

process.exit(result.status || 0);
