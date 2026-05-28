#!/usr/bin/env node
import {
  appendGoNoGoLog,
  appendOperatorLog,
  checkApplyGate,
  ensureForemanDirs,
  read,
  verifyPhaseLedger,
  verdict
} from "./_foreman-core.mjs";

ensureForemanDirs();

// INVARIANT: this ledger verification must be the first Foreman apply operation.
// Do not remove, reorder, or bypass it; every later apply check depends on ledger integrity.
const ledger = verifyPhaseLedger();
if (!ledger.ok) {
  console.log("Strict apply gate: FAIL");
  ledger.failures.forEach((failure) => console.log(`- phase ledger failed: ${failure}`));
  process.exit(1);
}

const input = process.argv[2] || "";
const result = checkApplyGate(input);
const beanVerdict = result.files.beanPath && safeVerdict(result.files.beanPath);
const comptrollerVerdict = result.files.comptrollerPath && safeVerdict(result.files.comptrollerPath);

console.log(`Strict apply gate: ${result.ok ? "PASS" : "FAIL"}`);
if (!result.ok) result.failures.forEach((failure) => console.log(`- ${failure}`));

appendOperatorLog({
  command: `FOREMAN APPLY CHECK ${result.id}`,
  phase: result.phase,
  step: result.step,
  filesRead: Object.values(result.files),
  filesWritten: [],
  checksRun: ["strict apply gate"],
  result: result.ok ? "apply gate passes; Codex may apply only approved local changes" : `apply refused: ${result.failures.join("; ")}`,
  nextApproval: result.ok ? "FOREMAN APPLY may proceed without push" : "fix failed gate conditions"
});

appendGoNoGoLog({
  phase: result.phase,
  step: result.step,
  beanVerdict: beanVerdict || "missing",
  comptrollerVerdict: comptrollerVerdict || "missing",
  testsRequired: ["strict apply gate"],
  testsPassed: result.ok ? ["strict apply gate"] : [],
  testsFailed: result.ok ? [] : result.failures,
  pushAllowed: false,
  reason: result.ok ? "Apply gate passes. Push still requires push gate and explicit command." : "Apply gate failed."
});

process.exit(result.ok ? 0 : 1);

function safeVerdict(file) {
  try {
    return verdict(read(file));
  } catch {
    return null;
  }
}
