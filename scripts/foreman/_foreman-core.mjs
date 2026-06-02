import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export const ROOT = path.resolve(process.cwd());

export const REQUIRED_MINIMUM_SOURCES = [
  "docs/ai/00_SOURCE_OF_TRUTH.md",
  "docs/ai/01_WHO_RUNS_WHAT.md",
  "docs/ai/07_BUILD_ORDER.md"
];

export const HIGH_CRITICAL_PREFIXES = [
  "supabase/",
  "app/api/",
  "pages/api/",
  "lib/supabase/",
  "lib/stripe/",
  "lib/auth/",
  "middleware.ts"
];

export const HIGH_CRITICAL_TERMS = [
  ".env",
  "verification",
  "payment",
  "stripe",
  "auth",
  "rls"
];

export const FOREMAN_LOG_FILES = [
  "foreman/OPERATOR_LOG.md",
  "foreman/GO_NO_GO_LOG.md",
  "foreman/PHASE_LEDGER.ndjson"
];

export const RISK_LEVEL_ORDER = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4
};

export const RISK_CLASSIFICATION = [
  {
    level: "LOW",
    description: "Foreman scaffolding, handoff packets, docs/ai source files, and mock-only static copy artifacts.",
    examples: ["foreman/", "handoffs/", "docs/ai/", "scripts/foreman/", "lib/copy.ts"]
  },
  {
    level: "MEDIUM",
    description: "Non-sensitive product UI, static pages, and presentation-layer components without auth, payment, verification, or API behavior.",
    examples: ["app/ public pages", "components/", "styles"]
  },
  {
    level: "HIGH",
    description: "Runtime server behavior, app APIs, authentication helpers, payment helpers, verification helpers, and middleware.",
    examples: ["app/api/", "pages/api/", "lib/supabase/", "lib/stripe/", "lib/auth/", "middleware.ts"]
  },
  {
    level: "CRITICAL",
    description: "Database schema, RLS, secrets, environment files, live verification, money movement, or release controls.",
    examples: ["supabase/", ".env*", "RLS", "schema migrations", "production verification"]
  }
];

export const HANDOFF_WARN_BYTES = 25 * 1024;
export const HANDOFF_MAX_BYTES = 50 * 1024;
export const HANDOFF_CONTINUE_MAX_FILES = 3;

export function rel(filePath) {
  return filePath.replaceAll("\\", "/").replace(ROOT.replaceAll("\\", "/") + "/", "");
}

export function abs(relativePath) {
  return path.join(ROOT, relativePath);
}

export function cleanPath(filePath) {
  return String(filePath || "").replace(/^\/+/, "").replaceAll("\\", "/");
}

export function nowIso() {
  return new Date().toISOString();
}

export function exists(relativePath) {
  return fs.existsSync(abs(relativePath));
}

export function read(relativePath) {
  return fs.readFileSync(abs(relativePath), "utf8");
}

export function write(relativePath, content) {
  const target = abs(relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
}

export function byteLength(content) {
  return Buffer.byteLength(String(content), "utf8");
}

export function handoffSize(relativePath) {
  if (!exists(relativePath)) return null;
  return fs.statSync(abs(relativePath)).size;
}

export function pendingHandoffFiles() {
  const dir = abs("handoffs/pending");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .map((name) => {
      const relativePath = `handoffs/pending/${name}`;
      return { relativePath, size: handoffSize(relativePath) || 0 };
    })
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

export function handoffSizeWarnings(files = pendingHandoffFiles()) {
  return files
    .filter((file) => file.size > HANDOFF_WARN_BYTES)
    .map((file) => `${file.relativePath} is ${file.size} bytes`);
}

export function writeHandoffFile(relativePath, content) {
  const size = byteLength(content);
  if (size <= HANDOFF_MAX_BYTES) {
    write(relativePath, content);
    return { filesWritten: [relativePath], warnings: size > HANDOFF_WARN_BYTES ? [`/${relativePath} is ${size} bytes`] : [] };
  }

  const ext = path.extname(relativePath);
  const base = relativePath.slice(0, -ext.length);
  const chunks = [];
  let remaining = String(content);
  while (remaining.length) {
    let end = Math.min(remaining.length, HANDOFF_MAX_BYTES - 2048);
    const newline = remaining.lastIndexOf("\n", end);
    if (newline > 1000) end = newline + 1;
    chunks.push(remaining.slice(0, end));
    remaining = remaining.slice(end);
  }

  const index = [
    "# Handoff Split Required",
    "",
    `Original target: /${relativePath}`,
    `Original size: ${size} bytes`,
    `Parts: ${chunks.length}`,
    "",
    "Sally Resource Protection split this oversized handoff. Send parts in order.",
    "",
    ...chunks.map((_, index) => `- /${base}.part-${String(index + 1).padStart(2, "0")}${ext}`)
  ].join("\n");

  write(relativePath, `${index}\n`);
  const filesWritten = [relativePath];
  chunks.forEach((chunk, index) => {
    const partPath = `${base}.part-${String(index + 1).padStart(2, "0")}${ext}`;
    write(partPath, chunk);
    filesWritten.push(partPath);
  });
  return {
    filesWritten,
    warnings: [`/${relativePath} was ${size} bytes and was split into ${chunks.length} parts`]
  };
}

export function append(relativePath, content) {
  const target = abs(relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.appendFileSync(target, content, "utf8");
}

export function ensureForemanDirs() {
  [
    "foreman",
    "handoffs/pending",
    "handoffs/sent",
    "handoffs/received",
    "handoffs/gates",
    "handoffs/superseded",
    "scripts/foreman",
    "docs/ai"
  ].forEach((dir) => fs.mkdirSync(abs(dir), { recursive: true }));
}

export function sha256Text(text) {
  return createHash("sha256").update(String(text), "utf8").digest("hex");
}

/** Raw buffer SHA-256 (lowercase hex). Does not normalize line endings. */
export function sha256Buffer(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

/** Cockpit / relay hash: reads raw file bytes — no UTF-8 or line-ending normalization. */
export function sha256FileRaw(relativePath) {
  const target = abs(relativePath);
  if (!fs.existsSync(target)) return null;
  return sha256Buffer(fs.readFileSync(target));
}

export function truncateHash(hash, length = 12) {
  if (!hash) return "(missing)";
  if (hash.length <= length) return hash;
  return `${hash.slice(0, length)}...`;
}

/** Self-test: generator/intake hash parity on NEXT_ACTION.md (same raw read twice). */
export function runCockpitHashSelfTest() {
  const nextAction = "foreman/NEXT_ACTION.md";
  const currentState = "foreman/CURRENT_STATE.md";
  const failures = [];
  let nextActionHash = null;
  let currentStateHash = null;

  if (!exists(nextAction)) {
    failures.push("NEXT_ACTION.md missing");
  } else {
    const first = sha256FileRaw(nextAction);
    const second = sha256FileRaw(nextAction);
    nextActionHash = first;
    if (first !== second) failures.push("hash parity failed: two reads of NEXT_ACTION.md differ");
    if (!first || first.length !== 64) failures.push("NEXT_ACTION.md hash invalid");
  }

  if (exists(currentState)) {
    currentStateHash = sha256FileRaw(currentState);
  }

  return {
    ok: failures.length === 0,
    failures,
    nextActionHash,
    currentStateHash,
    nextActionHashTrunc: truncateHash(nextActionHash),
    currentStateHashTrunc: truncateHash(currentStateHash),
  };
}

export function sha256File(relativePath) {
  return sha256Text(read(relativePath));
}

export function canonicalJson(value) {
  return JSON.stringify(sortObject(value));
}

function sortObject(value) {
  if (Array.isArray(value)) return value.map(sortObject);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => [key, sortObject(nested)])
  );
}

export function gateHashPath(gatePath) {
  return `${gatePath}.sha256`;
}

export function writeGateHash(gatePath) {
  const digest = sha256File(gatePath);
  const receipt = {
    file: gatePath,
    sha256: digest,
    generatedTimestamp: nowIso()
  };
  write(gateHashPath(gatePath), `${JSON.stringify(receipt, null, 2)}\n`);
  return digest;
}

export function verifyGateHash(gatePath) {
  const receiptPath = gateHashPath(gatePath);
  if (!exists(gatePath)) {
    return { ok: false, failure: `gate hash check failed: gate missing at /${gatePath}` };
  }
  if (!exists(receiptPath)) {
    return { ok: false, failure: `gate hash check failed: hash receipt missing at /${receiptPath}` };
  }
  try {
    const receipt = JSON.parse(read(receiptPath));
    const actual = sha256File(gatePath);
    if (receipt.file !== gatePath) {
      return { ok: false, failure: `gate hash check failed: receipt file mismatch for /${gatePath}` };
    }
    if (receipt.sha256 !== actual) {
      return { ok: false, failure: `gate hash check failed: SHA-256 mismatch for /${gatePath}` };
    }
    return { ok: true, sha256: actual };
  } catch (error) {
    return { ok: false, failure: `gate hash check failed: unreadable hash receipt for /${gatePath}: ${error.message}` };
  }
}

export function normalizeRiskLevel(value) {
  return String(value || "").trim().toUpperCase();
}

export function minimumRiskForPath(filePath) {
  const clean = cleanPath(filePath).toLowerCase();
  if (!clean) return "LOW";
  if (
    clean.startsWith("supabase/") ||
    clean.startsWith(".env") ||
    clean.includes("/.env") ||
    clean.includes("rls") ||
    clean.includes("schema")
  ) return "CRITICAL";
  if (
    clean.startsWith("app/api/") ||
    clean.startsWith("pages/api/") ||
    clean.startsWith("lib/supabase/") ||
    clean.startsWith("lib/stripe/") ||
    clean.startsWith("lib/auth/") ||
    clean === "middleware.ts" ||
    clean.includes("verification") ||
    clean.includes("payment") ||
    clean.includes("stripe") ||
    clean.includes("auth")
  ) return "HIGH";
  if (clean === "lib/copy.ts") return "LOW";
  if (clean.startsWith("app/") || clean.startsWith("components/") || clean.startsWith("lib/")) return "MEDIUM";
  return "LOW";
}

export function highestRisk(risks) {
  return risks.reduce((highest, risk) => (
    RISK_LEVEL_ORDER[risk] > RISK_LEVEL_ORDER[highest] ? risk : highest
  ), "LOW");
}

export function requiredRiskForScope(approvedScope = []) {
  return highestRisk((approvedScope.length ? approvedScope : [""]).map(minimumRiskForPath));
}

export function enforceRiskClassification(status) {
  const declaredRisk = normalizeRiskLevel(status.riskLevel);
  const requiredRisk = requiredRiskForScope(status.approvedScope);
  const failures = [];

  if (!RISK_LEVEL_ORDER[declaredRisk]) {
    failures.push(`risk classification failed: unknown declared risk level "${status.riskLevel}"`);
  } else if (RISK_LEVEL_ORDER[declaredRisk] < RISK_LEVEL_ORDER[requiredRisk]) {
    failures.push(`risk classification failed: declared ${declaredRisk}, but approved scope requires ${requiredRisk}`);
  }

  return {
    ok: failures.length === 0,
    declaredRisk,
    requiredRisk,
    failures
  };
}

export function phaseOrderParts(phase) {
  const numeric = String(phase || "").match(/\d+(?:\.\d+)?/g);
  if (!numeric) return [0];
  return numeric.flatMap((part) => part.split(".").map((piece) => Number(piece)));
}

export function comparePhaseOrder(left, right) {
  const a = phaseOrderParts(left);
  const b = phaseOrderParts(right);
  const max = Math.max(a.length, b.length);
  for (let index = 0; index < max; index += 1) {
    const diff = (a[index] || 0) - (b[index] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function ledgerEntryHash(entry) {
  const { entryHash, ...payload } = entry;
  return sha256Text(canonicalJson(payload));
}

export function readPhaseLedger() {
  if (!exists("foreman/PHASE_LEDGER.ndjson")) return [];
  return read("foreman/PHASE_LEDGER.ndjson")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        return { parseError: error.message, lineNumber: index + 1, raw: line };
      }
    });
}

export function verifyPhaseLedger(currentStatus = null) {
  const entries = readPhaseLedger();
  const failures = [];
  let previousHash = null;
  let previousPhase = null;

  entries.forEach((entry, index) => {
    if (entry.parseError) {
      failures.push(`phase ledger line ${entry.lineNumber} is not valid JSON: ${entry.parseError}`);
      return;
    }
    const expected = ledgerEntryHash(entry);
    if (entry.entryHash !== expected) {
      failures.push(`phase ledger entry ${index + 1} hash mismatch`);
    }
    if ((entry.previousHash || null) !== previousHash) {
      failures.push(`phase ledger entry ${index + 1} previousHash mismatch`);
    }
    if (previousPhase && comparePhaseOrder(entry.phase, previousPhase) < 0) {
      failures.push(`phase ledger entry ${index + 1} regresses from ${previousPhase} to ${entry.phase}`);
    }
    previousHash = entry.entryHash || expected;
    previousPhase = entry.phase || previousPhase;
  });

  const last = entries.filter((entry) => !entry.parseError).at(-1) || null;
  if (currentStatus && last && comparePhaseOrder(currentStatus.phase, last.phase) < 0) {
    failures.push(`current phase ${currentStatus.phase} regresses behind ledger phase ${last.phase}`);
  }

  return { ok: failures.length === 0, failures, last, entries };
}

export function assertPhaseLedger(currentStatus = null) {
  const ledger = verifyPhaseLedger(currentStatus);
  if (!ledger.ok) {
    throw new Error(`Phase ledger protection failed: ${ledger.failures.join("; ")}`);
  }
  return ledger;
}

export function appendPhaseLedger({
  command,
  phase,
  step,
  result,
  event = "foreman-command",
  phaseTransitionedAt = null
}) {
  const ledger = verifyPhaseLedger();
  if (!ledger.ok) {
    throw new Error(`Phase ledger integrity failed: ${ledger.failures.join("; ")}`);
  }
  const timestamp = nowIso();
  const entry = {
    timestamp,
    event,
    command,
    phase: phase || "unknown",
    step: step || "unknown",
    phaseOrder: phaseOrderParts(phase || "unknown").join("."),
    phase_transitioned_at: phaseTransitionedAt || currentPhaseTransitionedAt(phase) || timestamp,
    result: result || "unknown",
    previousHash: ledger.last?.entryHash || null
  };
  const entryHash = ledgerEntryHash(entry);
  append("foreman/PHASE_LEDGER.ndjson", `${JSON.stringify({ ...entry, entryHash })}\n`);
}

export function currentPhaseTransitionedAt(phase) {
  const entries = readPhaseLedger().filter((entry) => !entry.parseError && entry.phase === phase);
  const transition = entries
    .filter((entry) => entry.event === "phase-transition")
    .at(-1);
  return transition?.phase_transitioned_at || null;
}

export function parsePhaseStatus() {
  const statusPath = "foreman/PHASE_STATUS.md";
  if (!exists(statusPath)) {
    throw new Error("foreman/PHASE_STATUS.md is missing");
  }

  const text = read(statusPath);
  const value = (label) => {
    const match = text.match(new RegExp(`^${label}:\\s*(.+)$`, "mi"));
    return match ? match[1].trim() : "";
  };

  const approvedScope = [];
  const requiredTaskSources = parseListBlock(text, "Required Task Sources");
  const taskBrief = parseTextBlock(text, "Task Brief");
  const taskRules = parseListBlock(text, "Task Rules");
  const expectedOutput = parseListBlock(text, "Expected Output");
  const auditFocus = parseListBlock(text, "Audit Focus");
  const scopeMatch = text.match(/^Approved Scope:\s*\n([\s\S]*?)(?:\n\n|$)/im);
  if (scopeMatch) {
    for (const line of scopeMatch[1].split(/\r?\n/)) {
      const item = line.replace(/^\s*-\s*/, "").trim();
      if (item) approvedScope.push(item.replace(/^\/+/, ""));
    }
  }

  return {
    phase: value("Current Phase"),
    step: value("Current Step"),
    riskLevel: value("Risk Level"),
    taskType: value("Task Type"),
    targetAI: value("Target AI"),
    approvedScope,
    requiredTaskSources,
    taskBrief,
    taskRules,
    expectedOutput,
    auditFocus,
    raw: text
  };
}

function parseListBlock(text, label) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim().toLowerCase() === `${label.toLowerCase()}:`);
  if (start === -1) return [];
  const items = [];
  for (const line of lines.slice(start + 1)) {
    if (!line.trim()) break;
    if (!line.trim().startsWith("-")) break;
    items.push(line.replace(/^\s*-\s*/, "").trim().replace(/^\/+/, ""));
  }
  return items;
}

function parseTextBlock(text, label) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim().toLowerCase() === `${label.toLowerCase()}:`);
  if (start === -1) return "";
  const block = [];
  for (const line of lines.slice(start + 1)) {
    if (!line.trim()) break;
    block.push(line);
  }
  return block.join("\n").trim();
}

export function phaseStepId(phase, step) {
  return `${phase}-${step}`;
}

export function resolvePhaseStep(input = "") {
  const status = parsePhaseStatus();
  const trimmed = input.trim();

  if (!trimmed) {
    return { ...status, id: phaseStepId(status.phase, status.step) };
  }

  if (trimmed.includes(":")) {
    const [phase, ...stepParts] = trimmed.split(":");
    const step = stepParts.join(":");
    return { ...status, phase, step, id: phaseStepId(phase, step) };
  }

  if (trimmed === status.phase) {
    return { ...status, id: phaseStepId(status.phase, status.step) };
  }

  if (trimmed.startsWith(`${status.phase}-`)) {
    const step = trimmed.slice(status.phase.length + 1);
    return { ...status, step, id: phaseStepId(status.phase, step) };
  }

  const [phase, ...stepParts] = trimmed.split("-");
  const step = stepParts.join("-");
  return { ...status, phase, step, id: phaseStepId(phase, step) };
}

export function latestFile(dir, includesText) {
  const targetDir = abs(dir);
  if (!fs.existsSync(targetDir)) return null;
  const files = fs.readdirSync(targetDir)
    .filter((name) => name.includes(includesText))
    .map((name) => {
      const filePath = path.join(targetDir, name);
      return { name, relativePath: rel(filePath), mtimeMs: fs.statSync(filePath).mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
  return files[0] || null;
}

export function roleSourceFiles(targetAI) {
  const normalized = String(targetAI || "").toLowerCase();
  if (normalized.includes("bean")) return ["docs/ai/02_BEAN_AUDIT.md"];
  if (normalized.includes("comptroller")) return ["docs/ai/03_COMPTROLLER_GATE.md"];
  if (normalized.includes("builder")) return ["docs/ai/02_BUILDER.md"];
  return [];
}

export function requiredSourcesFor({ targetAI, extraSources = [] }) {
  return [
    ...REQUIRED_MINIMUM_SOURCES,
    ...roleSourceFiles(targetAI),
    ...extraSources
  ];
}

export function inspectSources(sourceFiles) {
  const seen = new Set();
  const consulted = [];
  const missing = [];

  for (const source of sourceFiles) {
    const clean = source.replace(/^\/+/, "");
    if (seen.has(clean)) continue;
    seen.add(clean);
    if (exists(clean)) consulted.push(clean);
    else missing.push(clean);
  }

  return { consulted, missing };
}

export function readSnippet(relativePath, maxChars = 6000) {
  if (!exists(relativePath)) return `MISSING: ${relativePath}`;
  const text = read(relativePath);
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n\n[TRUNCATED ${text.length - maxChars} CHARS]`;
}

export function verdict(text) {
  const match = text.match(/VERDICT:\s*(CONDITIONAL GO|GO|NO-GO|NO GO)/i);
  if (!match) return null;
  return match[1].toUpperCase().replace("NO GO", "NO-GO");
}

export function isBeanGo(text) {
  const found = verdict(text);
  return found === "GO" || found === "CONDITIONAL GO";
}

export function isComptrollerGo(text) {
  return verdict(text) === "GO";
}

export function outputReceiptMatches(text, phase, step) {
  return (
    new RegExp(`^Phase:\\s*${escapeRegExp(phase)}\\s*$`, "mi").test(text) &&
    new RegExp(`^Step:\\s*${escapeRegExp(step)}\\s*$`, "mi").test(text)
  );
}

export function handoffGeneratedAt(relativePath) {
  if (!exists(relativePath)) return null;
  const text = read(relativePath);
  try {
    const manifest = parseMachineManifest(text);
    if (manifest?.generated_at) return manifest.generated_at;
    if (manifest?.generatedTimestamp) return manifest.generatedTimestamp;
  } catch {
    // Fall through to human-readable generated_at.
  }
  const match = text.match(/generated_at:\s*([^\r\n]+)/i) || text.match(/generated timestamp:\s*([^\r\n]+)/i);
  return match ? match[1].trim() : null;
}

export function staleHandoffFailuresFor({ id, phase }) {
  const transitionedAt = currentPhaseTransitionedAt(phase);
  if (!transitionedAt) return [];
  const transitionMs = Date.parse(transitionedAt);
  if (Number.isNaN(transitionMs)) return [`staleness check failed: phase transition timestamp is invalid for ${phase}`];
  const handoffs = [
    `handoffs/pending/${id}-handoff.md`,
    `handoffs/sent/${id}-handoff.md`
  ].filter(exists);
  return handoffs.flatMap((handoff) => {
    const generatedAt = handoffGeneratedAt(handoff);
    if (!generatedAt) return [`staleness check failed: /${handoff} has no generated_at`];
    const generatedMs = Date.parse(generatedAt);
    if (Number.isNaN(generatedMs)) return [`staleness check failed: /${handoff} generated_at is invalid`];
    if (generatedMs < transitionMs) {
      return [`staleness check failed: /${handoff} generated_at predates current phase transition`];
    }
    return [];
  });
}

export function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function git(args, options = {}) {
  return execFileSync(gitPath(), args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: options.stdio || ["ignore", "pipe", "pipe"]
  });
}

export function gitPath() {
  const githubDesktopGit = "C:/Users/benle/AppData/Local/GitHubDesktop/app-3.5.8/resources/app/git/cmd/git.exe";
  return fs.existsSync(githubDesktopGit) ? githubDesktopGit : "git";
}

export function gitStatusPaths() {
  const output = git(["status", "--porcelain"], { stdio: ["ignore", "pipe", "pipe"] });
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^.. /, "").replace(/^"|"$/g, "").replaceAll("\\", "/"));
}

export function gitTrackedContent(relativePath) {
  try {
    return git(["show", `HEAD:${relativePath}`], { stdio: ["ignore", "pipe", "pipe"] });
  } catch {
    return null;
  }
}

export function logProtectionFailures() {
  const failures = [];
  for (const logFile of FOREMAN_LOG_FILES) {
    if (!exists(logFile)) {
      failures.push(`log protection failed: /${logFile} is missing`);
      continue;
    }
    const headContent = gitTrackedContent(logFile);
    if (headContent !== null && !read(logFile).startsWith(headContent)) {
      failures.push(`log protection failed: /${logFile} was rewritten instead of appended`);
    }
  }
  const ledger = verifyPhaseLedger();
  if (!ledger.ok) failures.push(...ledger.failures.map((failure) => `log protection failed: ${failure}`));
  return failures;
}

export function isHighCritical(filePath) {
  const clean = cleanPath(filePath);
  return (
    HIGH_CRITICAL_PREFIXES.some((prefix) => clean === prefix.replace(/\/$/, "") || clean.startsWith(prefix)) ||
    HIGH_CRITICAL_TERMS.some((term) => clean.toLowerCase().includes(term.toLowerCase()))
  );
}

export function isWithinScope(filePath, approvedScope) {
  const clean = cleanPath(filePath);
  return approvedScope.some((scope) => {
    const normalized = cleanPath(scope);
    return clean === normalized || clean.startsWith(`${normalized.replace(/\/$/, "")}/`);
  });
}

export function packageScripts() {
  if (!exists("package.json")) return {};
  return JSON.parse(read("package.json")).scripts || {};
}

export function runNpmScript(scriptName) {
  const npmCmd = fs.existsSync("C:/Program Files/nodejs/npm.cmd")
    ? "C:/Program Files/nodejs/npm.cmd"
    : "npm";
  const env = {
    ...process.env,
    Path: `C:\\Program Files\\nodejs;${process.env.Path || process.env.PATH || ""}`,
    PATH: `C:\\Program Files\\nodejs;${process.env.PATH || process.env.Path || ""}`
  };
  const result = spawnSync(npmCmd, ["run", scriptName], {
    cwd: ROOT,
    env,
    encoding: "utf8",
    shell: false
  });
  return {
    command: `npm run ${scriptName}`,
    status: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    ok: result.status === 0
  };
}

export function appendOperatorLog({
  command,
  phase,
  step,
  filesRead = [],
  filesWritten = [],
  checksRun = [],
  result,
  nextApproval = "none"
}) {
  append("foreman/OPERATOR_LOG.md", `

## ${nowIso()}
- command received: \`${command}\`
- phase: ${phase || "unknown"}
- step: ${step || "unknown"}
- files read:
${bulletList(filesRead)}
- files written:
${bulletList(filesWritten)}
- checks run:
${bulletList(checksRun)}
- result: ${result}
- next required human approval: ${nextApproval}
`);
  appendPhaseLedger({
    command,
    phase,
    step,
    result,
    event: "operator-log"
  });
}

export function appendGoNoGoLog({
  phase,
  step,
  beanVerdict = "missing",
  comptrollerVerdict = "missing",
  testsRequired = [],
  testsPassed = [],
  testsFailed = [],
  pushAllowed = false,
  reason
}) {
  append("foreman/GO_NO_GO_LOG.md", `

## ${nowIso()}
- phase: ${phase || "unknown"}
- step: ${step || "unknown"}
- Bean verdict: ${beanVerdict}
- Comptroller verdict: ${comptrollerVerdict}
- tests required:
${bulletList(testsRequired)}
- tests passed:
${bulletList(testsPassed)}
- tests failed:
${bulletList(testsFailed)}
- push allowed: ${pushAllowed ? "yes" : "no"}
- reason: ${reason}
`);
}

export function bulletList(items) {
  if (!items || items.length === 0) return "  - none";
  return items.map((item) => `  - ${item}`).join("\n");
}

export function buildManifest({
  targetAI,
  phase,
  step,
  taskType,
  riskLevel,
  readiness = "UNKNOWN",
  approvedScope = [],
  sourceFilesConsulted,
  requiredFiles = [],
  missingSources,
  beanAudit,
  comptrollerGate,
  relevantSchemaFiles = [],
  riskCheck = null,
  preflightFailures = []
}) {
  const generatedAt = nowIso();
  const phaseTransitionedAt = currentPhaseTransitionedAt(phase);
  const manifestObject = {
    schemaVersion: "foreman-manifest/v1",
    targetAI,
    phase,
    step,
    taskType,
    riskLevel: normalizeRiskLevel(riskLevel),
    readiness,
    approvedScope: approvedScope.map(cleanPath),
    requiredFiles: requiredFiles.map(cleanPath),
    sourceFilesConsulted,
    latestPreviousBeanAudit: beanAudit || null,
    latestPreviousComptrollerGate: comptrollerGate || null,
    relevantSchemaFiles,
    generated_at: generatedAt,
    generatedTimestamp: generatedAt,
    phase_transitioned_at: phaseTransitionedAt,
    expectedSourceFileMissing: Boolean(missingSources.length),
    missingSourceFiles: missingSources,
    riskCheck,
    preflightFailures
  };
  return `## Manifest
- target AI: ${targetAI}
- phase: ${phase}
- step: ${step}
- task type: ${taskType}
- risk level: ${manifestObject.riskLevel}
- readiness: ${readiness}
- approved scope:
${bulletList(manifestObject.approvedScope.map((item) => `/${item}`))}
- required files:
${bulletList(manifestObject.requiredFiles.map((item) => `/${item}`))}
- source files consulted:
${bulletList(sourceFilesConsulted)}
- latest previous Bean audit: ${beanAudit || "none"}
- latest previous Comptroller gate: ${comptrollerGate || "none"}
- relevant schema/spec files:
${bulletList(relevantSchemaFiles)}
- generated_at: ${generatedAt}
- phase_transitioned_at: ${phaseTransitionedAt || "unknown"}
- expected source file missing: ${missingSources.length ? "yes" : "no"}
- missing source files:
${bulletList(missingSources)}

## Manifest JSON

\`\`\`json
${JSON.stringify(manifestObject, null, 2)}
\`\`\`
`;
}

export function parseMachineManifest(markdown) {
  const match = String(markdown).match(/## Manifest JSON\s*```json\s*([\s\S]*?)\s*```/m);
  if (!match) return null;
  return JSON.parse(match[1]);
}

export function verifyMachineManifest(markdown) {
  const failures = [];
  let manifest = null;
  try {
    manifest = parseMachineManifest(markdown);
  } catch (error) {
    failures.push(`manifest JSON is not parseable: ${error.message}`);
  }
  if (!manifest) {
    failures.push("manifest JSON block missing");
    return { ok: false, failures, manifest: null };
  }

  const required = [
    "schemaVersion",
    "targetAI",
    "phase",
    "step",
    "taskType",
    "riskLevel",
    "readiness",
    "approvedScope",
    "requiredFiles",
    "sourceFilesConsulted",
    "generated_at",
    "generatedTimestamp",
    "expectedSourceFileMissing",
    "missingSourceFiles"
  ];
  for (const key of required) {
    if (!(key in manifest)) failures.push(`manifest missing required field: ${key}`);
  }
  if (manifest.schemaVersion !== "foreman-manifest/v1") {
    failures.push(`manifest schemaVersion unsupported: ${manifest.schemaVersion}`);
  }
  if (!RISK_LEVEL_ORDER[manifest.riskLevel]) {
    failures.push(`manifest riskLevel invalid: ${manifest.riskLevel}`);
  }
  if (!Array.isArray(manifest.approvedScope)) failures.push("manifest approvedScope must be an array");
  if (!Array.isArray(manifest.sourceFilesConsulted)) failures.push("manifest sourceFilesConsulted must be an array");
  if (!Array.isArray(manifest.missingSourceFiles)) failures.push("manifest missingSourceFiles must be an array");
  if (Boolean(manifest.missingSourceFiles?.length) !== Boolean(manifest.expectedSourceFileMissing)) {
    failures.push("manifest expectedSourceFileMissing does not match missingSourceFiles");
  }
  const firstLine = String(markdown).split(/\r?\n/)[0].replace(/^#\s*/, "").trim();
  if (manifest.readiness && firstLine && manifest.readiness !== firstLine) {
    failures.push(`manifest readiness "${manifest.readiness}" does not match packet heading "${firstLine}"`);
  }
  if (manifest.riskCheck && manifest.riskCheck.ok === false && !String(manifest.readiness).startsWith("NOT READY")) {
    failures.push("manifest has failed riskCheck but packet is not marked NOT READY");
  }
  if (manifest.expectedSourceFileMissing && !String(manifest.readiness).startsWith("NOT READY")) {
    failures.push("manifest has missing source files but packet is not marked NOT READY");
  }

  return { ok: failures.length === 0, failures, manifest };
}

export function readRequiredManifestMapping() {
  const mappingPath = "foreman/REQUIRED_MANIFEST_FILES.md";
  if (!exists(mappingPath)) return null;
  const text = read(mappingPath);
  const match = text.match(/```json\s*([\s\S]*?)\s*```/m);
  if (!match) return null;
  return JSON.parse(match[1]);
}

export function requiredManifestFilesFor(manifest) {
  const mapping = readRequiredManifestMapping();
  if (!mapping) {
    return { required: [], failures: ["required manifest file mapping is missing or unreadable"] };
  }
  const required = new Set(mapping.always || []);
  const target = String(manifest?.targetAI || "").toLowerCase();
  if (target.includes("builder")) (mapping.byTargetAI?.Builder || []).forEach((file) => required.add(file));
  if (target.includes("bean") || target.includes("deepseek")) (mapping.byTargetAI?.Bean || []).forEach((file) => required.add(file));
  if (target.includes("comptroller") || target.includes("chatgpt")) {
    (mapping.byTargetAI?.Comptroller || []).forEach((file) => required.add(file));
  }
  return { required: [...required].map(cleanPath), failures: [] };
}

export function verifyManifestRequiredFiles(manifest) {
  const { required, failures } = requiredManifestFilesFor(manifest);
  if (failures.length) return { ok: false, failures, required };
  const listed = new Set([
    ...(manifest.sourceFilesConsulted || []),
    ...(manifest.relevantSchemaFiles || []),
    ...(manifest.requiredFiles || [])
  ].map(cleanPath));
  const missing = required.filter((file) => !listed.has(file));
  return {
    ok: missing.length === 0,
    failures: missing.map((file) => `manifest required file not listed: ${file}`),
    required
  };
}

export function checkApplyGate(input) {
  const { phase, step, id } = resolvePhaseStep(input);
  const status = parsePhaseStatus();
  const outputPath = `handoffs/received/${id}-output.md`;
  const beanPath = `handoffs/gates/${id}-bean-audit.md`;
  const comptrollerPath = `handoffs/gates/${id}-comptroller-gate.md`;
  const failures = [];
  const ledger = verifyPhaseLedger(status);

  if (!ledger.ok) {
    failures.push(...ledger.failures.map((failure) => `phase ledger failed: ${failure}`));
  }

  if (!exists(outputPath)) failures.push(`1 failed: output file missing at /${outputPath}`);
  if (!exists(beanPath)) failures.push(`2 failed: Bean audit missing at /${beanPath}`);
  if (exists(beanPath) && !isBeanGo(read(beanPath))) {
    failures.push("3 failed: Bean audit lacks VERDICT: GO or VERDICT: CONDITIONAL GO");
  }
  if (exists(beanPath)) {
    const beanHash = verifyGateHash(beanPath);
    if (!beanHash.ok) failures.push(`3 failed: ${beanHash.failure}`);
  }
  if (!exists(comptrollerPath)) failures.push(`4 failed: Comptroller gate missing at /${comptrollerPath}`);
  if (exists(comptrollerPath) && !isComptrollerGo(read(comptrollerPath))) {
    failures.push("5 failed: Comptroller gate lacks VERDICT: GO");
  }
  if (exists(comptrollerPath)) {
    const comptrollerHash = verifyGateHash(comptrollerPath);
    if (!comptrollerHash.ok) failures.push(`5 failed: ${comptrollerHash.failure}`);
  }
  if (phase !== status.phase || step !== status.step) {
    failures.push(`6 failed: requested ${phase}/${step} does not match current ${status.phase}/${status.step}`);
  }
  failures.push(...staleHandoffFailuresFor({ id, phase }).map((failure) => `7 failed: ${failure}`));
  const riskCheck = enforceRiskClassification(status);
  if (!riskCheck.ok) {
    failures.push(...riskCheck.failures.map((failure) => `risk failed: ${failure}`));
  }

  if (exists(outputPath)) {
    const outputStat = fs.statSync(abs(outputPath));
    const newerPending = [
      latestFile("handoffs/pending", `${id}-handoff`),
      latestFile("handoffs/sent", `${id}-handoff`)
    ].filter(Boolean).filter((file) => file.mtimeMs > outputStat.mtimeMs);
    const superseded = latestFile("handoffs/superseded", id);
    if (newerPending.length || superseded) {
      failures.push("7 failed: newer handoff or superseded marker exists for this output");
    }

    const outputText = read(outputPath);
    if (!outputReceiptMatches(outputText, phase, step)) {
      failures.push("8 failed: output receipt phase/step metadata does not match request");
    }
    if (/Superseded:\s*yes/i.test(outputText)) {
      failures.push("8 failed: output is marked superseded");
    }
  }

  return {
    ok: failures.length === 0,
    failures,
    phase,
    step,
    id,
    files: { outputPath, beanPath, comptrollerPath }
  };
}

export function computePushGatePreview(input = "") {
  const status = parsePhaseStatus();
  const apply = checkApplyGate(input || `${status.phase}-${status.step}`);
  const changedPaths = gitStatusPaths();
  const failures = [...apply.failures];
  const riskCheck = enforceRiskClassification(status);
  if (!riskCheck.ok) failures.push(...riskCheck.failures);
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
  failures.push("required test suite has not been run by STATUS");
  return {
    ok: failures.length === 0,
    failures,
    apply,
    changedPaths
  };
}

export function phaseTouchedDatabaseOrRls(changedPaths) {
  return changedPaths.some((filePath) => {
    const clean = cleanPath(filePath).toLowerCase();
    return clean.startsWith("supabase/") || clean.includes("schema") || clean.includes("rls");
  });
}
