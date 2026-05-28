#!/usr/bin/env node
import fs from "node:fs";
import {
  HANDOFF_CONTINUE_MAX_FILES,
  appendOperatorLog,
  checkApplyGate,
  computePushGatePreview,
  ensureForemanDirs,
  exists,
  gitStatusPaths,
  handoffSizeWarnings,
  pendingHandoffFiles,
  parsePhaseStatus,
  read,
  write
} from "./_foreman-core.mjs";

ensureForemanDirs();

const [rawCommand = "STATUS", ...args] = process.argv.slice(2);
const command = String(rawCommand).trim().toUpperCase();
const status = parsePhaseStatus();

switch (command) {
  case "STATUS":
    refreshCockpit();
    printFile("foreman/OPERATOR_DASHBOARD.md");
    log("STATUS", "refreshed and reported live cockpit status");
    break;
  case "CONTINUE":
    continueFromOperatorPause();
    break;
  case "STOP":
    stopOperator(args.join(" ").trim());
    break;
  case "APPROVE":
    refreshCockpit();
    console.log("APPROVE received. Codex may run the next internal Foreman operation only if the saved external verdict and gates allow it.");
    printFile("foreman/NEXT_ACTION.md", "\nNext action:\n");
    log("APPROVE", "operator approval cue recorded; internal sequencing remains gate-bound");
    break;
  case "PUSH":
    refreshCockpit();
    console.log("PUSH received. Push is still blocked unless the live push gate says PUSH allowed.");
    printFile("foreman/OPERATOR_DASHBOARD.md", "\nDashboard:\n");
    log("PUSH", "push cue recorded; push remains gate-bound");
    process.exit(1);
    break;
  default:
    console.error(`Unknown operator command: ${command}`);
    console.error("Use one of: STATUS, CONTINUE, STOP, APPROVE, PUSH");
    process.exit(2);
}

function refreshCockpit() {
  const gateState = dryRunGateState();
  const apply = checkApplyGate(`${status.phase}-${status.step}`);
  const push = computePushGatePreview(`${status.phase}-${status.step}`);
  const pending = pendingHandoffFiles();
  const warnings = handoffSizeWarnings(pending);
  const gitStatus = gitStatusPaths();
  const nextAction = currentNextAction();
  const currentStatus = gateState.applied
    ? "Dry-run simulated, audited, gated, and applied locally."
    : nextAction.includes("/docs/ai")
    ? "Dry-run restarted to handoff generation; blocked by missing source files."
    : nextAction.includes("DRY-RUN-0.1-foreman-pipeline-copy-handoff.md")
      ? "Dry-run Builder handoff is ready for the next external Builder step."
      : "Foreman patched; dry-run paused; live gates computed by STATUS.";
  const nextRequiredAI = gateState.applied
    ? "none"
    : nextAction.includes("DRY-RUN-0.1-foreman-pipeline-copy-handoff.md")
      ? "Builder"
      : "none until source files exist or simulation is explicitly approved";
  const fileToSend = gateState.applied
    ? "none"
    : nextAction.includes("DRY-RUN-0.1-foreman-pipeline-copy-handoff.md")
      ? "/handoffs/pending/DRY-RUN-0.1-foreman-pipeline-copy-handoff.md"
      : "none; current Builder handoff is NOT READY";
  const blockers = gateState.applied
    ? [
        "Push remains blocked until Ben explicitly says PUSH and the push gate is clean.",
        ...push.failures,
        ...warnings
      ]
    : [
        nextAction.includes("DRY-RUN-0.1-foreman-pipeline-copy-handoff.md")
          ? "Builder output has not been received yet."
          : nextAction.includes("/docs/ai")
            ? "Dry-run handoff is NOT READY because required /docs/ai source files are missing."
            : "Dry-run has not been restarted.",
        "No Builder output, Bean audit, or Comptroller gate exists for the dry-run.",
        "The Foreman layer is untracked in git.",
        ...warnings
      ];
  const dashboard = `# Operator Dashboard

- Current phase: ${status.phase}
- Current step: ${status.step}
- Current risk level: ${status.riskLevel}
- Current status: ${currentStatus}
- Last completed gate: ${gateState.applied ? "Bean GO and Comptroller GO recorded; apply gate passed." : "Pre-patch apply canary refused correctly. No GO gate is recorded."}
- Next required AI, if any: ${nextRequiredAI}
- Exact file to send, if any: ${fileToSend}
- Exact thing Ben must do next: ${nextAction}
- APPLY allowed: ${apply.ok ? "Yes" : "No"}
- APPLY blocked because:
${bullet(apply.ok ? [] : apply.failures)}
- PUSH allowed: ${push.ok ? "Yes" : "No"}
- PUSH blocked because:
${bullet(push.ok ? [] : push.failures)}
- Handoff warnings:
${bullet(warnings)}
- Blockers:
${bullet(blockers)}
- Plain English: ${plainEnglish(nextAction)}
`;
  const current = `# Current State

## Where The Project Is Right Now

${gateState.applied
    ? "DRY-RUN-0.1 has completed the simulated Builder, Bean, and Comptroller loop. The approved mock-only copy artifact was applied locally."
    : "Foreman is patched after DeepSeek / Bean returned CONDITIONAL GO. Werkles product development remains paused. DRY-RUN-0.1 has not restarted."}

## What Has Already Happened

- Pre-patch canary proved FOREMAN APPLY refused without Builder output, Bean audit, and Comptroller gate.
- Six remaining Bean findings were patched:
  - handoff staleness checks
  - live dashboard gate flags
  - first-operation phase ledger invariant for apply check
  - required manifest file mapping
- STOP semantics
- Sally handoff/resource limits
${gateState.applied ? "- Simulated Builder output was saved, Bean returned GO, Comptroller returned GO, and the apply gate passed." : "- No product code was intentionally modified."}
${gateState.applied ? "- /lib/copy.ts was modified inside the approved LOW-risk dry-run scope only." : ""}

## What Files Matter

- /foreman/FOREMAN_RULES.md
- /foreman/OPERATOR_DASHBOARD.md
- /foreman/CURRENT_STATE.md
- /foreman/NEXT_ACTION.md
- /foreman/REQUIRED_MANIFEST_FILES.md
- /foreman/RISK_CLASSIFICATION.md
- /scripts/foreman/_foreman-core.mjs
- /scripts/foreman/operator.mjs
- /scripts/foreman/verify-manifest.mjs

## What Is Pending

${gateState.applied
    ? "- Operator review of the dry-run result.\n- Push remains blocked unless Ben explicitly says PUSH and the live push gate passes."
    : "- Builder output is pending from the READY handoff, or Ben must explicitly permit dry-run simulation.\n- Builder output, Bean audit, and Comptroller gate are still missing for the dry-run."}

## What Must Not Happen Yet

- Do not modify product code outside the approved dry-run artifact.
- Do not push.
- Do not deploy.
- Do not touch Supabase, Stripe, auth, middleware, API routes, RLS, or env files.

## Last Known Safe Point

/foreman/PRE_PATCH_DRY_RUN_STATUS.md records that the pre-patch apply check refused correctly.

## Current Git Status Summary

\`\`\`text
${gitStatus.length ? gitStatus.map((file) => `- ${file}`).join("\n") : "clean"}
\`\`\`

## Current Gate Status

- APPLY allowed: ${apply.ok ? "Yes" : "No"}
- PUSH allowed: ${push.ok ? "Yes" : "No"}
- APPLY reasons: ${apply.ok ? "none" : apply.failures.join("; ")}
- PUSH reasons: ${push.ok ? "none" : push.failures.join("; ")}
`;
  write("foreman/OPERATOR_DASHBOARD.md", dashboard);
  write("foreman/CURRENT_STATE.md", current);
  if (!isStopped()) write("foreman/NEXT_ACTION.md", `${nextAction}\n`);
}

function stopOperator(reason) {
  const timestamp = new Date().toISOString();
  const lockout = /\b(lockout|locked|do not resume)\b/i.test(reason);
  if (exists("foreman/NEXT_ACTION.md")) {
    write("foreman/NEXT_ACTION_BEFORE_STOP.md", read("foreman/NEXT_ACTION.md"));
  }
  write("foreman/NEXT_ACTION.md", `STOPPED by Operator${reason ? `: ${reason}` : "."}\n`);
  if (lockout) write("foreman/OPERATOR_LOCKOUT.md", `Locked out at ${timestamp}\nReason: ${reason || "Operator requested lockout"}\n`);
  log("STOP", `stopped at ${timestamp}${reason ? `; reason: ${reason}` : ""}${lockout ? "; lockout active" : ""}`);
  console.log(read("foreman/NEXT_ACTION.md"));
}

function continueFromOperatorPause() {
  if (exists("foreman/OPERATOR_LOCKOUT.md")) {
    printFile("foreman/OPERATOR_LOCKOUT.md");
    log("CONTINUE", "continue refused because Operator lockout is active");
    process.exit(1);
  }
  const pending = pendingHandoffFiles();
  const warnings = handoffSizeWarnings(pending);
  if (pending.length > HANDOFF_CONTINUE_MAX_FILES) {
    console.log(`CONTINUE warning: ${pending.length} pending handoff files exist; showing max ${HANDOFF_CONTINUE_MAX_FILES}.`);
  }
  warnings.forEach((warning) => console.log(`HANDOFF SIZE WARNING: ${warning}`));
  if (exists("foreman/NEXT_ACTION_BEFORE_STOP.md") && isStopped()) {
    write("foreman/NEXT_ACTION.md", read("foreman/NEXT_ACTION_BEFORE_STOP.md"));
  } else if (!exists("foreman/NEXT_ACTION.md")) {
    write("foreman/NEXT_ACTION.md", "Restart DRY-RUN-0.1 internal sequence.\n");
  }
  refreshCockpit();
  printFile("foreman/NEXT_ACTION.md");
  log("CONTINUE", "continue reported next safe action");
}

function currentNextAction() {
  if (isStopped()) return read("foreman/NEXT_ACTION.md").trim();
  const gateState = dryRunGateState();
  if (gateState.applied) {
    return "Review /lib/copy.ts and the Foreman logs. Push is blocked until Ben explicitly says PUSH and the push gate is clean.";
  }
  const handoffPath = `handoffs/pending/${status.phase}-${status.step}-handoff.md`;
  if (exists(handoffPath) && /^# NOT READY - MISSING SOURCE FILES/m.test(read(handoffPath))) {
    return "Provide the missing /docs/ai source files, or explicitly permit dry-run simulation.";
  }
  if (exists(handoffPath) && /^# READY FOR OPERATOR TO SEND/m.test(read(handoffPath))) {
    return `Send /${handoffPath} to Builder, or explicitly permit dry-run simulation.`;
  }
  return "Say CONTINUE when ready to restart DRY-RUN-0.1.";
}

function plainEnglish(nextAction) {
  if (nextAction.includes("Review /lib/copy.ts")) {
    return "The dry-run made it through the gates and placed the mock copy on the bench; nothing has been shipped.";
  }
  if (nextAction.includes("DRY-RUN-0.1-foreman-pipeline-copy-handoff.md")) {
    return "The source gate is clear; the next stop is Builder output or explicit simulation permission.";
  }
  if (nextAction.includes("/docs/ai")) {
    return "The dry-run restarted and immediately stopped at the missing source-file gate.";
  }
  return "The safety cage is patched; DRY-RUN-0.1 can restart only when Ben says CONTINUE, and apply remains blocked until real gates exist.";
}

function dryRunGateState() {
  const id = `${status.phase}-${status.step}`;
  const outputPath = `handoffs/received/${id}-output.md`;
  const beanPath = `handoffs/gates/${id}-bean-audit.md`;
  const comptrollerPath = `handoffs/gates/${id}-comptroller-gate.md`;
  const apply = checkApplyGate(id);
  return {
    id,
    outputPath,
    beanPath,
    comptrollerPath,
    hasOutput: exists(outputPath),
    hasBean: exists(beanPath),
    hasComptroller: exists(comptrollerPath),
    apply,
    applied: exists(outputPath) && exists(beanPath) && exists(comptrollerPath) && apply.ok && exists("lib/copy.ts")
  };
}

function isStopped() {
  return exists("foreman/NEXT_ACTION.md") && /^STOPPED by Operator/i.test(read("foreman/NEXT_ACTION.md").trim());
}

function printFile(relativePath, heading = "") {
  if (heading) console.log(heading);
  if (!exists(relativePath)) {
    console.log(`Missing: /${relativePath}`);
    return;
  }
  console.log(read(relativePath));
}

function log(operatorCommand, result) {
  appendOperatorLog({
    command: `OPERATOR ${operatorCommand}`,
    phase: status.phase,
    step: status.step,
    filesRead: [
      "foreman/OPERATOR_DASHBOARD.md",
      "foreman/CURRENT_STATE.md",
      "foreman/NEXT_ACTION.md"
    ].filter((file) => fs.existsSync(file)),
    filesWritten: ["foreman/OPERATOR_LOG.md", "foreman/PHASE_LEDGER.ndjson"],
    checksRun: ["operator cockpit command routing"],
    result,
    nextApproval: "follow /foreman/NEXT_ACTION.md"
  });
}

function bullet(items) {
  return items.length ? items.map((item) => `  - ${item}`).join("\n") : "  - none";
}
