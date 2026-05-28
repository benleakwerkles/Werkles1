#!/usr/bin/env node
import {
  appendOperatorLog,
  checkApplyGate,
  ensureForemanDirs,
  parsePhaseStatus
} from "./_foreman-core.mjs";

ensureForemanDirs();

const input = process.argv[2] || "";
const status = input ? null : parsePhaseStatus();
const result = checkApplyGate(input || `${status.phase}-${status.step}`);

console.log(`Gate check for ${result.phase}/${result.step}: ${result.ok ? "PASS" : "FAIL"}`);
if (!result.ok) result.failures.forEach((failure) => console.log(`- ${failure}`));

appendOperatorLog({
  command: `FOREMAN GATE CHECK ${result.id}`,
  phase: result.phase,
  step: result.step,
  filesRead: Object.values(result.files),
  filesWritten: [],
  checksRun: ["strict apply gate preview"],
  result: result.ok ? "gate preview passes" : `gate preview fails: ${result.failures.join("; ")}`,
  nextApproval: result.ok ? "FOREMAN APPLY may run" : "fix failed gate conditions"
});

process.exit(result.ok ? 0 : 1);
