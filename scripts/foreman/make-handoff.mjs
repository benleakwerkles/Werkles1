#!/usr/bin/env node
import fs from "node:fs";
import {
  appendGoNoGoLog,
  appendOperatorLog,
  assertPhaseLedger,
  buildManifest,
  checkApplyGate,
  enforceRiskClassification,
  ensureForemanDirs,
  git,
  inspectSources,
  latestFile,
  nowIso,
  parsePhaseStatus,
  phaseStepId,
  read,
  readSnippet,
  requiredSourcesFor,
  resolvePhaseStep,
  verdict,
  write,
  writeHandoffFile,
  writeGateHash
} from "./_foreman-core.mjs";

ensureForemanDirs();

const [modeOrPhaseStep, maybePhaseStep] = process.argv.slice(2);
const modes = new Set([
  "handoff",
  "bean",
  "comptroller",
  "save-output",
  "save-bean",
  "save-comptroller"
]);
const mode = modes.has(modeOrPhaseStep) ? modeOrPhaseStep : "handoff";
const phaseStepArg = modes.has(modeOrPhaseStep) ? maybePhaseStep : modeOrPhaseStep;

if (mode === "save-output") await saveOutput(phaseStepArg);
else if (mode === "save-bean") await saveBean(phaseStepArg);
else if (mode === "save-comptroller") await saveComptroller(phaseStepArg);
else if (mode === "bean") prepareBeanAudit(phaseStepArg);
else if (mode === "comptroller") prepareComptrollerGate(phaseStepArg);
else prepareHandoff(phaseStepArg);

function prepareHandoff(input) {
  const status = resolvePhaseStep(input);
  assertPhaseLedger(status);
  const sourceFiles = requiredSourcesFor({
    targetAI: status.targetAI,
    extraSources: status.requiredTaskSources
  });
  const sources = inspectSources(sourceFiles);
  const beanAudit = latestFile("handoffs/gates", `${status.id}-bean-audit`)?.relativePath || null;
  const comptrollerGate = latestFile("handoffs/gates", `${status.id}-comptroller-gate`)?.relativePath || null;
  const riskCheck = enforceRiskClassification(status);
  const preflightFailures = [
    ...sources.missing.map((source) => `missing source: ${source}`),
    ...riskCheck.failures
  ];
  const readiness = sources.missing.length
    ? "NOT READY - MISSING SOURCE FILES"
    : riskCheck.ok
      ? "READY FOR OPERATOR TO SEND"
      : "NOT READY - RISK CLASSIFICATION FAILED";
  const manifest = buildManifest({
    targetAI: status.targetAI,
    phase: status.phase,
    step: status.step,
    taskType: status.taskType,
    riskLevel: status.riskLevel,
    readiness,
    approvedScope: status.approvedScope,
    requiredFiles: sourceFiles,
    sourceFilesConsulted: sources.consulted,
    missingSources: sources.missing,
    beanAudit,
    comptrollerGate,
    relevantSchemaFiles: [],
    riskCheck,
    preflightFailures
  });
  const target = `handoffs/pending/${status.id}-handoff.md`;
  const approvedScope = status.approvedScope.map((item) => `- /${item}`).join("\n") || "- none";
  const taskRules = status.taskRules.map((item) => `- ${item}`).join("\n") || "- none";
  const expectedOutput = status.expectedOutput.map((item) => `- ${item}`).join("\n") || "- none";
  const auditFocus = status.auditFocus.map((item) => `- ${item}`).join("\n") || "- none";
  const packet = `# ${readiness}

# Foreman Handoff Packet

${manifest}

## Operator Boundary

Codex is preparing this packet only. Codex is not approving GO, applying output, or pushing.

## Task

Target AI: ${status.targetAI}

Phase: ${status.phase}

Step: ${status.step}

Risk: ${status.riskLevel}

Task type: ${status.taskType}

Approved scope:
${approvedScope}

## Instructions To Target AI

${status.taskBrief || "Create only the requested output for this phase and step."}

Do not change files outside the approved scope. Return a concise implementation note plus any patch/content required.

## Task Rules

${taskRules}

## Expected Output

${expectedOutput}

## Audit Focus

${auditFocus}

For the current dry run, the expected artifact is LOW-risk and mock-only. Do not touch schema, RLS, Stripe, verification, auth, payment, API routes, or real product logic.

## Source Notes

${sources.consulted.map((source) => `### /${source}\n\n${readSnippet(source, 2500)}`).join("\n\n") || "No source files were available."}
`;

  const handoffWrite = writeHandoffFile(target, packet);
  appendOperatorLog({
    command: `make-handoff ${status.id}`,
    phase: status.phase,
    step: status.step,
    filesRead: sources.consulted,
    filesWritten: handoffWrite.filesWritten,
    checksRun: ["handoff manifest source check", "Sally handoff size check"],
    result: handoffWrite.warnings.length ? `${readiness}; ${handoffWrite.warnings.join("; ")}` : readiness,
    nextApproval: sources.missing.length ? "provide missing /docs/ai source files" : "Operator sends packet to target AI"
  });
  console.log(`${readiness}: /${target}`);
  if (sources.missing.length) console.log(`Missing: ${sources.missing.join(", ")}`);
}

function prepareBeanAudit(input) {
  const status = resolvePhaseStep(input);
  assertPhaseLedger(status);
  const outputPath = `handoffs/received/${status.id}-output.md`;
  const sourceFiles = requiredSourcesFor({
    targetAI: "Bean",
    extraSources: [outputPath]
  });
  const sources = inspectSources(sourceFiles);
  const riskCheck = enforceRiskClassification(status);
  const preflightFailures = [
    ...sources.missing.map((source) => `missing source: ${source}`),
    ...riskCheck.failures
  ];
  const readiness = sources.missing.length
    ? "NOT READY - MISSING SOURCE FILES"
    : riskCheck.ok
      ? "READY FOR OPERATOR TO SEND"
      : "NOT READY - RISK CLASSIFICATION FAILED";
  const manifest = buildManifest({
    targetAI: "Bean",
    phase: status.phase,
    step: status.step,
    taskType: "audit",
    riskLevel: status.riskLevel,
    readiness,
    approvedScope: status.approvedScope,
    requiredFiles: sourceFiles,
    sourceFilesConsulted: sources.consulted,
    missingSources: sources.missing,
    beanAudit: "none",
    comptrollerGate: latestFile("handoffs/gates", `${status.id}-comptroller-gate`)?.relativePath || null,
    riskCheck,
    preflightFailures
  });
  const target = `handoffs/pending/${status.id}-bean-audit-packet.md`;
  const packet = `# ${readiness}

# Bean Audit Packet

${manifest}

## Audit Instructions

Audit the builder output for correctness, scope control, missing tests, and hidden risk. Return exactly one verdict line:

\`VERDICT: GO\`
\`VERDICT: CONDITIONAL GO\`
or
\`VERDICT: NO-GO\`

Then list findings.

## Builder Output

${sources.consulted.includes(outputPath) ? readSnippet(outputPath, 12000) : "MISSING BUILDER OUTPUT"}
`;
  const handoffWrite = writeHandoffFile(target, packet);
  appendOperatorLog({
    command: `make-handoff bean ${status.id}`,
    phase: status.phase,
    step: status.step,
    filesRead: sources.consulted,
    filesWritten: handoffWrite.filesWritten,
    checksRun: ["Bean packet source check", "Sally handoff size check"],
    result: handoffWrite.warnings.length ? `${readiness}; ${handoffWrite.warnings.join("; ")}` : readiness,
    nextApproval: sources.missing.length ? "provide missing source/output files" : "Operator sends packet to Bean"
  });
  console.log(`${readiness}: /${target}`);
  if (sources.missing.length) console.log(`Missing: ${sources.missing.join(", ")}`);
}

function prepareComptrollerGate(input) {
  const status = resolvePhaseStep(input);
  assertPhaseLedger(status);
  const outputPath = `handoffs/received/${status.id}-output.md`;
  const beanPath = `handoffs/gates/${status.id}-bean-audit.md`;
  const diff = safeGitDiff();
  const sourceFiles = requiredSourcesFor({
    targetAI: "Comptroller",
    extraSources: [outputPath, beanPath, "foreman/PHASE_STATUS.md", "foreman/FOREMAN_RULES.md"]
  });
  const sources = inspectSources(sourceFiles);
  const riskCheck = enforceRiskClassification(status);
  const preflightFailures = [
    ...sources.missing.map((source) => `missing source: ${source}`),
    ...riskCheck.failures
  ];
  const readiness = sources.missing.length
    ? "NOT READY - MISSING SOURCE FILES"
    : riskCheck.ok
      ? "READY FOR OPERATOR TO SEND"
      : "NOT READY - RISK CLASSIFICATION FAILED";
  const manifest = buildManifest({
    targetAI: "Comptroller",
    phase: status.phase,
    step: status.step,
    taskType: "GO/NO-GO gate",
    riskLevel: status.riskLevel,
    readiness,
    approvedScope: status.approvedScope,
    requiredFiles: sourceFiles,
    sourceFilesConsulted: sources.consulted,
    missingSources: sources.missing,
    beanAudit: sources.consulted.includes(beanPath) ? beanPath : "missing",
    comptrollerGate: latestFile("handoffs/gates", `${status.id}-comptroller-gate`)?.relativePath || null,
    riskCheck,
    preflightFailures
  });
  const target = `handoffs/pending/${status.id}-comptroller-gate-packet.md`;
  const packet = `# ${readiness}

# Comptroller Gate Packet

${manifest}

## Comptroller Instructions

Review the builder output, Bean audit, current diff, and source files. Decide whether Codex may apply this output locally.

Return exactly one verdict line:

\`VERDICT: GO\`
or
\`VERDICT: NO-GO\`

Then list conditions or blockers.

## Builder Output

${sources.consulted.includes(outputPath) ? readSnippet(outputPath, 12000) : "MISSING BUILDER OUTPUT"}

## Bean Audit

${sources.consulted.includes(beanPath) ? readSnippet(beanPath, 8000) : "MISSING BEAN AUDIT"}

## Current Diff

\`\`\`diff
${diff || "No current diff."}
\`\`\`
`;
  const handoffWrite = writeHandoffFile(target, packet);
  appendOperatorLog({
    command: `make-handoff comptroller ${status.id}`,
    phase: status.phase,
    step: status.step,
    filesRead: sources.consulted,
    filesWritten: handoffWrite.filesWritten,
    checksRun: ["Comptroller packet source check", "git diff", "Sally handoff size check"],
    result: handoffWrite.warnings.length ? `${readiness}; ${handoffWrite.warnings.join("; ")}` : readiness,
    nextApproval: sources.missing.length ? "provide missing source/output/audit files" : "Operator sends packet to Comptroller"
  });
  console.log(`${readiness}: /${target}`);
  if (sources.missing.length) console.log(`Missing: ${sources.missing.join(", ")}`);
}

async function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => { data += chunk; });
    process.stdin.on("end", () => resolve(data));
  });
}

async function saveOutput(input) {
  const status = resolvePhaseStep(input);
  assertPhaseLedger(status);
  const body = await readStdin();
  const target = `handoffs/received/${status.id}-output.md`;
  write(target, `# Foreman Builder Output Receipt

Phase: ${status.phase}
Step: ${status.step}
Saved Timestamp: ${nowIso()}
Superseded: no

## Pasted Builder Output

${body.trim()}
`);
  appendOperatorLog({
    command: `save builder output ${status.id}`,
    phase: status.phase,
    step: status.step,
    filesRead: ["stdin"],
    filesWritten: [target],
    checksRun: ["receipt wrapper written"],
    result: "Builder output saved. Apply remains blocked until Bean and Comptroller gates pass.",
    nextApproval: "prepare Bean audit packet"
  });
  console.log(`Saved builder output: /${target}`);
}

async function saveBean(input) {
  const status = resolvePhaseStep(input);
  assertPhaseLedger(status);
  const body = await readStdin();
  const target = `handoffs/gates/${status.id}-bean-audit.md`;
  write(target, `# Foreman Bean Audit Receipt

Phase: ${status.phase}
Step: ${status.step}
Saved Timestamp: ${nowIso()}

${body.trim()}
`);
  const digest = writeGateHash(target);
  appendOperatorLog({
    command: `save Bean audit ${status.id}`,
    phase: status.phase,
    step: status.step,
    filesRead: ["stdin"],
    filesWritten: [target, `${target}.sha256`],
    checksRun: ["Bean verdict parse", "SHA-256 gate receipt"],
    result: `Bean audit saved with verdict ${verdict(body) || "missing"} and SHA-256 ${digest}`,
    nextApproval: "prepare Comptroller gate packet"
  });
  console.log(`Saved Bean audit: /${target}`);
  console.log(`Saved Bean audit hash: /${target}.sha256`);
}

async function saveComptroller(input) {
  const status = resolvePhaseStep(input);
  assertPhaseLedger(status);
  const body = await readStdin();
  const target = `handoffs/gates/${status.id}-comptroller-gate.md`;
  write(target, `# Foreman Comptroller Gate Receipt

Phase: ${status.phase}
Step: ${status.step}
Saved Timestamp: ${nowIso()}

${body.trim()}
`);
  const digest = writeGateHash(target);
  const apply = checkApplyGate(status.id);
  appendOperatorLog({
    command: `save Comptroller gate ${status.id}`,
    phase: status.phase,
    step: status.step,
    filesRead: ["stdin"],
    filesWritten: [target, `${target}.sha256`],
    checksRun: ["Comptroller verdict parse", "SHA-256 gate receipt", "strict apply gate check"],
    result: `Comptroller gate saved with verdict ${verdict(body) || "missing"} and SHA-256 ${digest}. Apply gate ${apply.ok ? "passes" : "fails"}.`,
    nextApproval: apply.ok ? "FOREMAN APPLY may run; Codex still does not decide GO" : "fix failed apply gate conditions"
  });
  appendGoNoGoLog({
    phase: status.phase,
    step: status.step,
    beanVerdict: verdict(read(`handoffs/gates/${status.id}-bean-audit.md`)) || "missing",
    comptrollerVerdict: verdict(body) || "missing",
    testsRequired: ["strict apply gate"],
    testsPassed: apply.ok ? ["strict apply gate"] : [],
    testsFailed: apply.ok ? [] : apply.failures,
    pushAllowed: false,
    reason: "Comptroller gate saved. Push requires separate push gate and explicit PUSH PHASE command."
  });
  console.log(`Saved Comptroller gate: /${target}`);
  console.log(`Saved Comptroller gate hash: /${target}.sha256`);
  console.log(`Apply gate: ${apply.ok ? "PASS" : "FAIL"}`);
  if (!apply.ok) apply.failures.forEach((failure) => console.log(`- ${failure}`));
}

function safeGitDiff() {
  try {
    return git(["diff", "--"]).slice(0, 20000);
  } catch (error) {
    return `Could not read git diff: ${error.message}`;
  }
}
