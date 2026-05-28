#!/usr/bin/env node
import {
  appendOperatorLog,
  enforceRiskClassification,
  ensureForemanDirs,
  exists,
  latestFile,
  parsePhaseStatus,
  verifyPhaseLedger
} from "./_foreman-core.mjs";

ensureForemanDirs();

const status = parsePhaseStatus();
const pending = latestFile("handoffs/pending", `${status.phase}-${status.step}`);
const builderOutput = latestFile("handoffs/received", `${status.phase}-${status.step}-output`);
const beanAudit = latestFile("handoffs/gates", `${status.phase}-${status.step}-bean-audit`);
const comptrollerGate = latestFile("handoffs/gates", `${status.phase}-${status.step}-comptroller-gate`);
const blockers = [
  "docs/ai/00_SOURCE_OF_TRUTH.md",
  "docs/ai/01_WHO_RUNS_WHAT.md",
  "docs/ai/07_BUILD_ORDER.md"
].filter((file) => !exists(file));
const ledger = verifyPhaseLedger(status);
const risk = enforceRiskClassification(status);
blockers.push(...ledger.failures.map((failure) => `phase ledger: ${failure}`));
blockers.push(...risk.failures);

const nextSafeAction = blockers.length
  ? "Create the missing /docs/ai source files, or explicitly permit dry-run simulation."
  : "Run FOREMAN NEXT to prepare the next handoff packet.";

console.log(`Current phase: ${status.phase}`);
console.log(`Current step: ${status.step}`);
console.log(`Pending handoff: ${pending?.relativePath || "none"}`);
console.log(`Last builder output: ${builderOutput?.relativePath || "none"}`);
console.log(`Last Bean audit: ${beanAudit?.relativePath || "none"}`);
console.log(`Last Comptroller gate: ${comptrollerGate?.relativePath || "none"}`);
console.log(`Blockers: ${blockers.length ? blockers.join(", ") : "none"}`);
console.log(`Risk check: ${risk.ok ? "PASS" : "FAIL"} (${risk.declaredRisk} declared, ${risk.requiredRisk} required)`);
console.log(`Phase ledger: ${ledger.ok ? "PASS" : "FAIL"}`);
console.log(`Next safe action: ${nextSafeAction}`);

appendOperatorLog({
  command: "FOREMAN STATUS",
  phase: status.phase,
  step: status.step,
  filesRead: ["foreman/PHASE_STATUS.md", "handoffs/", "docs/ai/"],
  filesWritten: [],
  checksRun: ["status inspection", "required source file check", "risk classification", "phase ledger protection"],
  result: blockers.length ? "blocked by missing source files" : "status reported",
  nextApproval: nextSafeAction
});
