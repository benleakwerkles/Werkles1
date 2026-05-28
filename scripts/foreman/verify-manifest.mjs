#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  ROOT,
  enforceRiskClassification,
  verifyMachineManifest,
  verifyManifestRequiredFiles
} from "./_foreman-core.mjs";

const input = process.argv[2];

if (!input) {
  console.error("Usage: node scripts/foreman/verify-manifest.mjs <handoff-packet.md>");
  process.exit(2);
}

const target = path.isAbsolute(input) ? input : path.join(ROOT, input);
const markdown = fs.readFileSync(target, "utf8");
const result = verifyMachineManifest(markdown);

if (result.manifest) {
  const risk = enforceRiskClassification({
    riskLevel: result.manifest.riskLevel,
    approvedScope: result.manifest.approvedScope || []
  });
  if (!risk.ok) result.failures.push(...risk.failures);
  const required = verifyManifestRequiredFiles(result.manifest);
  if (!required.ok) result.failures.push(...required.failures);
}

console.log(`Manifest check: ${result.failures.length ? "FAIL" : "PASS"}`);
if (result.manifest) {
  console.log(`- target AI: ${result.manifest.targetAI}`);
  console.log(`- phase: ${result.manifest.phase}`);
  console.log(`- step: ${result.manifest.step}`);
  console.log(`- readiness: ${result.manifest.readiness}`);
  console.log(`- risk: ${result.manifest.riskLevel}`);
}
result.failures.forEach((failure) => console.log(`- ${failure}`));

process.exit(result.failures.length ? 1 : 0);
