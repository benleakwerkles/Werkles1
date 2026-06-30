#!/usr/bin/env node
/**
 * Shared autonomous round-trip orchestration — cousin-agnostic.
 * Explicit test flag only; does not change production humanSendGate doctrine.
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, abs, read, nowIso } from "./_foreman-core.mjs";
import {
  loadDispatchPolicy,
  verifyPacketForCourier,
  runAutonomousRoundTripCousin,
  isAutonomousRoundTripSendAllowed,
  checkAutonomousPreflight,
  appendCourierLog,
  appendSendLog,
  detectReceivedToken,
  RECEIVED_TOKENS,
} from "./relay-courier-lib.mjs";
import {
  buildOutgoingMetadata,
  buildRelayMetadataBlock,
  ensureRelayDirs,
  paths,
  markPacketSent,
  processInbox,
  validateInbox,
} from "../../foreman/crew-dispatch/crew-relay-lib.mjs";

export { RECEIVED_TOKENS, detectReceivedToken };

export function timestampSlug() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
}

function expandTemplate(template, tokens) {
  let out = template;
  for (const [k, v] of Object.entries(tokens)) {
    out = out.split(`{{${k}}}`).join(String(v ?? ""));
  }
  return out;
}

const HELD_COUSIN_REASONS = {
  ENDER:
    "ENDER autonomous relay is HELD: Ender@Sally is retired until Sally RAM upgrade and a clearing receipt. See foreman/change-capsules/CHANGE_CAPSULE_ENDER_SALLY_RETIRED.json. Do not silently move Ender to another machine without availability proof.",
};

function assertCousinNotHeld(cousinId) {
  const cousin = String(cousinId || "").toUpperCase();
  if (HELD_COUSIN_REASONS[cousin]) {
    throw new Error(HELD_COUSIN_REASONS[cousin]);
  }
}

function loadRoleCard(cousinId) {
  const cards = JSON.parse(read("foreman/crew-dispatch/crew-role-cards.json"));
  const card = cards.cousins[cousinId.toUpperCase()];
  if (!card) throw new Error(`Unknown cousin: ${cousinId}`);
  return card;
}

function loadTemplateMeta(templateId) {
  const policy = loadDispatchPolicy();
  const tplMeta = policy.approvedLockedTemplates[templateId];
  if (!tplMeta) throw new Error(`${templateId} missing from dispatch-policy.json`);
  return tplMeta;
}

export function generateAutonomousPacket({
  cousinId,
  templateId,
  missionDescription,
  shortPasteLines,
  buildShortPaste,
  packetIdPrefix,
}) {
  const cousin = cousinId.toUpperCase();
  assertCousinNotHeld(cousin);
  const tplMeta = loadTemplateMeta(templateId);
  const role = loadRoleCard(cousin);

  ensureRelayDirs();
  const templatePath = abs(tplMeta.packetTemplate);
  const template = fs.readFileSync(templatePath, "utf8");

  const prefix = packetIdPrefix || `TO_${cousin}_${templateId}`;
  const packetId = `${prefix}_v1_${timestampSlug()}`;
  const packetFileName = `${packetId}.md`;
  const packetPath = path.join(paths().outbox, packetFileName);

  const metadata = {
    ...buildOutgoingMetadata(cousin),
    packet_id: packetId,
    source_packet_file: packetFileName,
    template: templateId,
    packet_template: templateId,
    dispatch_class: templateId,
    autonomous_round_trip_test: true,
    role_lane: role.lane,
    human_gate_required: false,
  };

  const cousinCfg =
    templateId === "WERKLES_HOMEPAGE_DISCOVERY_FULL_CREW"
      ? {
          ENDER: "UX / structure / conversion lens",
          SKYBRO: "Positioning / narrative / category lens",
          COMPUTER: "Market / competitor / trust lens",
        }[cousin]
      : null;

  const body = expandTemplate(template, {
    COUSIN_LABEL: role.role?.split("—")[0]?.trim() || cousin,
    COUSIN_PLATFORM: role.platform,
    COUSIN_LENS: cousinCfg || role.lane,
    GENERATED_AT: metadata.generated_at,
    MISSION_DESCRIPTION: missionDescription,
    RELAY_METADATA_JSON: JSON.stringify(metadata, null, 2),
    RECEIVED_TOKEN: RECEIVED_TOKENS.primary,
  });

  fs.writeFileSync(packetPath, body, "utf8");

  const pastePath = abs(tplMeta.pasteBlock || `foreman/handoffs/outbox/${cousin}_PASTE_BLOCK.txt`);
  const lines =
    typeof buildShortPaste === "function"
      ? buildShortPaste({ packetId, metadata, cousin, role })
      : shortPasteLines;
  const shortPaste = lines.join("\n");
  const pasteBody = [
    `# ${templateId} — paste block for ${cousin} (${role.platform})`,
    "",
    shortPaste,
    "",
    "---",
    "",
    "Full packet:",
    "",
    body.trim(),
    "",
  ].join("\n");
  fs.writeFileSync(pastePath, pasteBody, "utf8");

  return {
    cousin,
    packetId,
    packetFileName,
    packetPath,
    pastePath,
    metadata,
    pasteBody: shortPaste,
    pasteBlockFull: pasteBody,
  };
}

export function buildInboxResponseFromScrape({
  cousinId,
  templateId,
  scrapedText,
  outgoingMeta,
  packetId,
  packetFileName,
  verdictPrefix = "AUTONOMOUS_ROUND_TRIP",
}) {
  const cousin = cousinId.toUpperCase();
  const role = loadRoleCard(cousin);
  const slug = timestampSlug();
  const fileName = `FROM_${cousin}_${templateId}_${slug}.md`;
  const token = detectReceivedToken(scrapedText);

  const responseMeta = {
    schemaVersion: outgoingMeta.schemaVersion,
    cousin,
    source_packet_id: packetId,
    source_packet_file: packetFileName,
    generated_at: nowIso(),
    platform: role.platform,
    role: role.role,
    requested_action: `ACK_${templateId}`,
    target_files: [],
    lane: role.lane,
    currentStateHash: outgoingMeta.currentStateHash,
    nextActionHash: outgoingMeta.nextActionHash,
    CONFIDENCE: token.matched ? "HIGH" : "LOW",
    VERDICT: token.matched ? `${verdictPrefix}_ACK` : `${verdictPrefix}_PARTIAL`,
    UNKNOWNS: token.matched ? "none" : `token_missing: expected ${RECEIVED_TOKENS.primary}`,
    DO_NOT: "deploy; push; SQL; secrets",
  };

  const body = `# From ${cousin} — response to ${packetId}

## Summary

${(scrapedText || "").trim() || "(empty scrape)"}

---

## Verdict

${responseMeta.VERDICT} — autonomous relay reply captured by Playwright.

---

${buildRelayMetadataBlock(responseMeta)}
`;

  return { fileName, body, metadata: responseMeta, token };
}

function writeProof({
  templateId,
  cousinId,
  proofPath,
  startedAt,
  finishedAt,
  status,
  steps,
  error,
  failureKind,
  deliver,
  generated,
  inboxFile,
  processed,
  artifacts,
  batch,
}) {
  const proof = {
    schemaVersion: "autonomous-round-trip-proof/v1",
    template: templateId,
    cousin: cousinId,
    startedAt,
    finishedAt,
    status,
    failureKind: failureKind || null,
    steps,
    error: error || null,
    tokenMatched: deliver?.receivedToken ?? null,
    tokenMatchKind: deliver?.tokenMatchKind ?? null,
    scrapedText: deliver?.scrapedText || null,
    profileMode: deliver?.profileMode || null,
    batch: batch || null,
    artifacts:
      artifacts ||
      {
        outboxPacket: generated ? path.relative(ROOT, generated.packetPath) : null,
        pasteBlock: generated ? path.relative(ROOT, generated.pastePath) : null,
        inboxResponse: inboxFile ? path.join("foreman/handoffs/inbox", inboxFile) : null,
        proofManifest: path.relative(ROOT, proofPath),
      },
  };

  if (processed?.moved?.[0]) {
    proof.artifacts.processedReceipt = path.join(
      "foreman/handoffs/inbox/processed",
      processed.moved[0].to
    );
    proof.artifacts.processedSummary = path.join(
      "foreman/handoffs/inbox/processed",
      `${processed.moved[0].to}.summary.json`
    );
  }

  fs.writeFileSync(proofPath, JSON.stringify(proof, null, 2), "utf8");
  return proof;
}

export async function runAutonomousRoundTrip({
  cousinId,
  templateId,
  missionDescription,
  shortPasteLines,
  buildShortPaste,
  packetIdPrefix,
  proofManifestRel,
  verdictPrefix,
  ...options
}) {
  const cousin = cousinId.toUpperCase();
  const tplMeta = loadTemplateMeta(templateId);
  const proofPath = abs(proofManifestRel || tplMeta.proofManifest);
  const startedAt = nowIso();
  const steps = [];

  const generated = generateAutonomousPacket({
    cousinId: cousin,
    templateId,
    missionDescription,
    shortPasteLines,
    buildShortPaste,
    packetIdPrefix,
  });
  steps.push({
    step: "generate",
    ok: true,
    packet: generated.packetFileName,
    pasteBlock: path.relative(ROOT, generated.pastePath),
  });

  const verification = await verifyPacketForCourier(generated.packetPath, { cousinId: cousin });
  steps.push({
    step: "verify",
    ok: verification.ok,
    dispatchClass: verification.dispatchClass,
    errors: verification.errors,
    warnings: verification.warnings,
  });
  if (!verification.ok) {
    return writeProof({
      templateId,
      cousinId: cousin,
      proofPath,
      startedAt,
      finishedAt: nowIso(),
      status: "FAIL",
      failureKind: "verify",
      steps,
      error: "Packet verification failed",
      generated,
    });
  }

  if (options.generateOnly) {
    return writeProof({
      templateId,
      cousinId: cousin,
      proofPath,
      startedAt,
      finishedAt: nowIso(),
      status: "GENERATE_ONLY",
      steps,
      generated,
    });
  }

  const preflight = await checkAutonomousPreflight();
  steps.push({ step: "preflight", ok: preflight.ok, mode: preflight.mode, errors: preflight.errors });
  if (!preflight.ok && !options.skipPreflight) {
    return writeProof({
      templateId,
      cousinId: cousin,
      proofPath,
      startedAt,
      finishedAt: nowIso(),
      status: "FAIL",
      failureKind: "profile_lock",
      steps,
      error: preflight.errors.join("; "),
      generated,
    });
  }

  if (!isAutonomousRoundTripSendAllowed(options)) {
    return writeProof({
      templateId,
      cousinId: cousin,
      proofPath,
      startedAt,
      finishedAt: nowIso(),
      status: "FAIL",
      failureKind: "send_blocked",
      steps,
      error: "Send blocked — use --execute or ALLOW_AUTONOMOUS_ROUND_TRIP_SEND=1",
      generated,
    });
  }

  const deliver = await runAutonomousRoundTripCousin({
    cousinId: cousin,
    pasteText: generated.pasteBody,
    packetFile: generated.packetFileName,
    templateId,
    allowSend: true,
    timeoutMs: options.timeoutMs,
  });

  steps.push({
    step: "send",
    ok: deliver.ok,
    status: deliver.status,
    error: deliver.error || null,
    receivedToken: deliver.receivedToken,
    tokenMatchKind: deliver.tokenMatchKind,
    profileMode: deliver.profileMode,
    sendSelector: deliver.sendResult?.selector,
    scrapedPreview: deliver.scrapedText ? deliver.scrapedText.slice(0, 400) : null,
  });

  if (!deliver.scrapedText?.trim()) {
    return writeProof({
      templateId,
      cousinId: cousin,
      proofPath,
      startedAt,
      finishedAt: nowIso(),
      status: "FAIL",
      failureKind: deliver.error?.includes("Timed out") ? "timeout" : deliver.error?.includes("composer") ? "selector" : "scrape",
      steps,
      error: deliver.error || deliver.status || "No scraped reply text",
      deliver,
      generated,
    });
  }

  const inboxBuilt = buildInboxResponseFromScrape({
    cousinId: cousin,
    templateId,
    scrapedText: deliver.scrapedText,
    outgoingMeta: generated.metadata,
    packetId: generated.packetId,
    packetFileName: generated.packetFileName,
    verdictPrefix,
  });

  const inboxPath = path.join(paths().inbox, inboxBuilt.fileName);
  fs.writeFileSync(inboxPath, inboxBuilt.body, "utf8");
  steps.push({
    step: "inbox_capture",
    ok: true,
    file: inboxBuilt.fileName,
    path: path.relative(ROOT, inboxPath),
  });

  const preValidate = validateInbox();
  steps.push({
    step: "inbox_validate",
    ok: preValidate.ok,
    fileCount: preValidate.fileCount,
    errors: preValidate.results.flatMap((r) => r.errors),
  });
  if (!preValidate.ok) {
    return writeProof({
      templateId,
      cousinId: cousin,
      proofPath,
      startedAt,
      finishedAt: nowIso(),
      status: "FAIL",
      failureKind: "intake_validate",
      steps,
      error: "Inbox validation failed before process",
      deliver,
      generated,
      inboxFile: inboxBuilt.fileName,
    });
  }

  const sent = markPacketSent(generated.packetFileName);
  steps.push({ step: "mark_sent", ok: sent.ok, detail: sent });

  const processed = processInbox();
  steps.push({
    step: "intake_process",
    ok: processed.ok,
    moved: processed.moved,
    message: processed.message,
  });

  const tokenPass =
    options.tokenMode === "any"
      ? Boolean(deliver.tokenMatchKind)
      : deliver.receivedToken;

  const pass =
    tokenPass &&
    preValidate.ok &&
    processed.ok &&
    (processed.moved?.length || 0) > 0;

  appendCourierLog(`${templateId} ${cousin} ${pass ? "PASS" : "FAIL"} inbox=${inboxBuilt.fileName}`);
  appendSendLog(`${templateId} ${cousin} ${pass ? "PASS" : "FAIL"} — ${path.relative(ROOT, proofPath)}`);

  return writeProof({
    templateId,
    cousinId: cousin,
    proofPath,
    startedAt,
    finishedAt: nowIso(),
    status: pass ? "PASS" : "FAIL",
      failureKind: pass ? null : tokenPass ? "intake" : "token_detection",
    steps,
    deliver,
    generated,
    inboxFile: inboxBuilt.fileName,
    processed,
    artifacts: {
      outboxPacket: path.relative(ROOT, generated.packetPath),
      pasteBlock: path.relative(ROOT, generated.pastePath),
      inboxResponse: path.relative(ROOT, inboxPath),
      proofManifest: path.relative(ROOT, proofPath),
    },
  });
}

export async function runAutonomousBatch({
  cousinId,
  templateId,
  count = 5,
  gapMs = 8000,
  buildShortPaste,
  missionDescription,
  shortPasteLines,
  packetIdPrefix,
  verdictPrefix,
  ...runOptions
}) {
  const results = [];
  let consecutive = 0;
  for (let i = 1; i <= count; i++) {
    const proofPath = abs(
      `foreman/crew-dispatch/${templateId}_BATCH_${cousinId}_${i}_${timestampSlug()}.json`
    );
    const result = await runAutonomousRoundTrip({
      cousinId,
      templateId,
      missionDescription,
      shortPasteLines,
      buildShortPaste,
      packetIdPrefix,
      verdictPrefix,
      proofManifestRel: path.relative(ROOT, proofPath),
      ...runOptions,
    });
    result.batch = { run: i, of: count };
    fs.writeFileSync(proofPath, JSON.stringify(result, null, 2), "utf8");
    results.push({ run: i, status: result.status, proof: path.relative(ROOT, proofPath) });
    if (result.status === "PASS") consecutive++;
    else consecutive = 0;
    if (i < count && gapMs > 0) await new Promise((r) => setTimeout(r, gapMs));
  }
  const summary = {
    template: templateId,
    cousin: cousinId.toUpperCase(),
    requested: count,
    passed: results.filter((r) => r.status === "PASS").length,
    failed: results.filter((r) => r.status !== "PASS").length,
    consecutiveAtEnd: consecutive,
    allPass: results.every((r) => r.status === "PASS"),
    results,
    finishedAt: nowIso(),
  };
  const summaryPath = abs(`foreman/crew-dispatch/${templateId}_BATCH_${cousinId}_SUMMARY.json`);
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf8");
  return { ...summary, summaryPath: path.relative(ROOT, summaryPath) };
}
