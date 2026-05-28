#!/usr/bin/env node
import {
  appendGoNoGoLog,
  appendOperatorLog,
  checkApplyGate,
  enforceRiskClassification,
  ensureForemanDirs,
  gitStatusPaths,
  isHighCritical,
  isWithinScope,
  logProtectionFailures,
  packageScripts,
  parsePhaseStatus,
  phaseTouchedDatabaseOrRls,
  read,
  runNpmScript,
  verdict,
  exists
} from "./_foreman-core.mjs";

ensureForemanDirs();

const status = parsePhaseStatus();
const input = process.argv[2] || `${status.phase}-${status.step}`;
const apply = checkApplyGate(input);
const scripts = packageScripts();
const changedPaths = gitStatusPaths();
const testsRequired = [];
const testsPassed = [];
const testsFailed = [];
const failures = [];

if (!apply.ok) failures.push(...apply.failures);

const riskCheck = enforceRiskClassification(status);
if (!riskCheck.ok) failures.push(...riskCheck.failures);

if (scripts.lint) {
  testsRequired.push("npm run lint");
  const lint = runNpmScript("lint");
  if (lint.ok) testsPassed.push("npm run lint");
  else {
    testsFailed.push("npm run lint");
    failures.push(`npm run lint failed with status ${lint.status}`);
  }
}

if (scripts.build) {
  testsRequired.push("npm run build");
  const build = runNpmScript("build");
  if (build.ok) testsPassed.push("npm run build");
  else {
    testsFailed.push("npm run build");
    failures.push(`npm run build failed with status ${build.status}`);
  }
}

if (phaseTouchedDatabaseOrRls(changedPaths)) {
  testsRequired.push("supabase db reset");
  testsFailed.push("supabase db reset");
  failures.push("Database/schema/RLS files changed; supabase db reset must be run manually in an approved Supabase environment.");
}

const outOfScopeCritical = changedPaths.filter((file) => (
  isHighCritical(file) && !isWithinScope(file, status.approvedScope)
));
if (outOfScopeCritical.length) {
  failures.push(`HIGH/CRITICAL changes outside approved scope: ${outOfScopeCritical.join(", ")}`);
}

if (changedPaths.length) {
  failures.push(`working tree is not clean: ${changedPaths.join(", ")}`);
}

if (!exists("foreman/OPERATOR_LOG.md")) failures.push("foreman/OPERATOR_LOG.md is missing");
if (!exists("foreman/GO_NO_GO_LOG.md")) failures.push("foreman/GO_NO_GO_LOG.md is missing");
failures.push(...logProtectionFailures());

const beanVerdict = safeVerdict(`handoffs/gates/${apply.id}-bean-audit.md`);
const comptrollerVerdict = safeVerdict(`handoffs/gates/${apply.id}-comptroller-gate.md`);
const allowed = failures.length === 0;

appendGoNoGoLog({
  phase: apply.phase,
  step: apply.step,
  beanVerdict: beanVerdict || "missing",
  comptrollerVerdict: comptrollerVerdict || "missing",
  testsRequired,
  testsPassed,
  testsFailed: [...testsFailed, ...failures.filter((failure) => !testsFailed.includes(failure))],
  pushAllowed: allowed,
  reason: allowed ? "Push gate passes. Still requires explicit PUSH command." : failures.join("; ")
});

appendOperatorLog({
  command: `FOREMAN PUSH CHECK ${apply.id}`,
  phase: apply.phase,
  step: apply.step,
  filesRead: [
    "foreman/PHASE_STATUS.md",
    "foreman/OPERATOR_LOG.md",
    `handoffs/gates/${apply.id}-bean-audit.md`,
    `handoffs/gates/${apply.id}-comptroller-gate.md`,
    "package.json",
    "git status",
    "foreman/GO_NO_GO_LOG.md",
    "foreman/PHASE_LEDGER.ndjson"
  ],
  filesWritten: ["foreman/GO_NO_GO_LOG.md", "foreman/OPERATOR_LOG.md", "foreman/PHASE_LEDGER.ndjson"],
  checksRun: ["strict apply gate", "risk classification", ...testsRequired, "HIGH/CRITICAL scope check", "clean working tree check", "log protection check"],
  result: allowed ? "push gate passes; waiting for explicit PUSH command" : `push refused: ${failures.join("; ")}`,
  nextApproval: allowed ? "Ben must say PUSH" : "fix failed push gate conditions"
});

console.log(`Push gate: ${allowed ? "PASS" : "FAIL"}`);
if (!allowed) failures.forEach((failure) => console.log(`- ${failure}`));
else console.log("Push still blocked until Ben says: PUSH");

process.exit(allowed ? 0 : 1);

function safeVerdict(file) {
  try {
    return verdict(read(file));
  } catch {
    return null;
  }
}
