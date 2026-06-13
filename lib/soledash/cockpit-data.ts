import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import "server-only";

import {
  buildAllClear,
  buildNeedsYouNow,
  buildSinceLastVisit,
  buildSquibbCue,
  buildSystemPosture,
  buildWorkItems,
  type AllClearState,
  type NeedsYouNow,
  type SinceLastVisit,
  type SoleDashV12View,
  type SquibbCue,
  type SystemPosture,
  type WorkItem
} from "@/lib/soledash/v12-workflow";
import {
  buildConcerns,
  buildLastWorkedHere,
  buildMachineCard,
  buildNextSteps,
  buildUrgentGates,
  readPreviousSession,
  readPreviousVisit,
  snapshotCurrentSession,
  summarizeCrew,
  writeVisitSnapshot,
  type LastWorkedHere,
  type MachineCard
} from "@/lib/soledash/workflow";

const ROOT = process.cwd();
const STATUS_DIR = path.join(ROOT, "foreman", "soledash");
const STATUS_FILE = path.join(STATUS_DIR, "LAST_LOCALHOST_STATUS.json");

export type HandoffEntry = {
  name: string;
  relPath: string;
  modifiedAt: string;
  excerpt: string;
  fullText: string;
};

export type LocalhostStatusRecord = {
  ok: boolean;
  port: string;
  checkedAt: string;
  url: string;
  httpStatus: number;
};

export type CrewBlock = {
  id: string;
  label: string;
  summary: string;
  note: string;
  outbox: HandoffEntry[];
};

export type SoleDashData = {
  version: "v1.2";
  machineCard: MachineCard;
  lastWorkedHere: LastWorkedHere;
  needsYouNow: NeedsYouNow | null;
  posture: SystemPosture;
  sinceLastVisit: SinceLastVisit;
  workItems: WorkItem[];
  squibb: SquibbCue | null;
  allClear: AllClearState | null;
  crew: CrewBlock[];
  outbox: HandoffEntry[];
  inbox: HandoffEntry[];
  receipts: HandoffEntry[];
  sources: { path: string; loaded: boolean }[];
};

const CREW_DEFINITIONS: {
  id: string;
  label: string;
  protocolHeading: RegExp;
  outboxFilter: RegExp;
  fallbackNote: string;
}[] = [
  {
    id: "maker",
    label: "Maker (Cursor)",
    protocolHeading: /### Codex \/ Foreman|Maker/i,
    outboxFilter: /^TO_(CURSOR|MAKER|CODEX)_/i,
    fallbackNote: "Bounded app/UI implementation on local build machine."
  },
  {
    id: "dink",
    label: "Dink (local hands)",
    protocolHeading: /LOCAL HANDS READBACK/i,
    outboxFilter: /^TO_DINK_/i,
    fallbackNote: "Local hands operator — LOCAL HANDS READBACK required at session start."
  },
  {
    id: "petra",
    label: "Petra (Comptroller)",
    protocolHeading: /### ChatGPT \/ Comptroller/i,
    outboxFilter: /^TO_PETRA_/i,
    fallbackNote: "Scope, gates, GO/NO-GO, lane law."
  },
  {
    id: "ender",
    label: "Ender (Claude)",
    protocolHeading: /### Claude \/ Ender/i,
    outboxFilter: /^TO_ENDER_/i,
    fallbackNote: "Prose, UX flows, narrative structure, product language."
  },
  {
    id: "skybro",
    label: "Skybro (Gemini)",
    protocolHeading: /### Gemini \/ Skybro/i,
    outboxFilter: /^TO_SKYBRO_/i,
    fallbackNote: "Architecture and product exploration."
  },
  {
    id: "bean",
    label: "Bean (DeepSeek)",
    protocolHeading: /### DeepSeek \/ Bean/i,
    outboxFilter: /^TO_BEAN_/i,
    fallbackNote: "Adversarial audit — engineering, compliance, exploit paths."
  },
  {
    id: "thufir",
    label: "Thufir (Computer / Perplexity)",
    protocolHeading: /### Perplexity \/ Computer/i,
    outboxFilter: /^TO_COMPUTER_/i,
    fallbackNote: "Research and current-world checks — vendors, docs, pricing, policy."
  }
];

function readRepoFile(relPath: string): string | null {
  try {
    return fs.readFileSync(path.join(ROOT, relPath), "utf8");
  } catch {
    return null;
  }
}

function git(args: string[]): string {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function excerpt(text: string, max = 160): string {
  const flat = text.replace(/\r\n/g, "\n").trim();
  const slice = flat.slice(0, max);
  return flat.length > max ? `${slice}…` : slice;
}

function listHandoffsInDir(
  absDir: string,
  relPrefix: string,
  filter: (name: string) => boolean,
  limit = 6
): HandoffEntry[] {
  if (!fs.existsSync(absDir)) return [];

  return fs
    .readdirSync(absDir)
    .filter((name) => name.endsWith(".md") && filter(name))
    .map((name) => {
      const abs = path.join(absDir, name);
      const stat = fs.statSync(abs);
      const raw = fs.readFileSync(abs, "utf8");
      return {
        name,
        relPath: `${relPrefix}/${name}`,
        modifiedAt: stat.mtime.toISOString(),
        excerpt: excerpt(raw),
        fullText: raw
      };
    })
    .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))
    .slice(0, limit);
}

function listOutbox(filter: (name: string) => boolean, limit = 6): HandoffEntry[] {
  return listHandoffsInDir(
    path.join(ROOT, "foreman", "handoffs", "outbox"),
    "foreman/handoffs/outbox",
    filter,
    limit
  );
}

function listInbox(filter: (name: string) => boolean, limit = 6): HandoffEntry[] {
  return listHandoffsInDir(
    path.join(ROOT, "foreman", "handoffs", "inbox"),
    "foreman/handoffs/inbox",
    filter,
    limit
  );
}

function listReceipts(limit = 10): HandoffEntry[] {
  const inbox = listInbox((name) => /^FROM_/i.test(name), limit);
  const processed = listHandoffsInDir(
    path.join(ROOT, "foreman", "handoffs", "inbox", "processed"),
    "foreman/handoffs/inbox/processed",
    (name) => name.includes("__FROM_") || name.endsWith(".md"),
    limit
  );
  return [...inbox, ...processed]
    .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))
    .slice(0, limit);
}

function parseWerklesMachine(topology: string | null): string {
  if (!topology) return "UNKNOWN";
  const host = os.hostname();
  if (topology.includes(`| **Betsy** | \`${host}\``)) return "Betsy";
  if (topology.includes(`| **Sally** | \`${host}\``)) return "Sally";
  if (host.toLowerCase().includes("betsy")) return "Betsy";
  return host;
}

function parseEffectiveGate(nextAction: string | null, activeAgent: string | null): string {
  const fromNext = nextAction?.match(/\*\*Effective gate:\*\*\s*`?\[([^\]]+)\]`?/i)?.[1]?.trim();
  const fromActive = activeAgent?.match(/## Effective gate[\s\S]*?`?\[([^\]]+)\]`?/i)?.[1]?.trim();
  return fromNext ?? fromActive ?? "UNKNOWN";
}

function parseMission(nextAction: string | null): { title: string; why: string; hardStops: string[] } {
  if (!nextAction) {
    return {
      title: "Review foreman/NEXT_ACTION.md",
      why: "Cockpit next-action file missing or unreadable.",
      hardStops: []
    };
  }

  const benBlock = nextAction.match(/## Ben \(Operator\)[\s\S]*?(?=## Maker|## Petra|## Conditions|$)/i);
  const primary =
    benBlock?.[0].match(/^\d+\.\s+\*\*(.+?)\*\*/m)?.[1] ??
    benBlock?.[0].match(/^\d+\.\s+(.+)$/m)?.[1] ??
    "Review Operator next hands in foreman/NEXT_ACTION.md";

  const why =
    benBlock?.[0].match(/Primary lane:[^\n]+/i)?.[0]?.replace(/^Primary lane:\s*/i, "") ??
    "Keeps localhost build lanes moving while production gates stay closed.";

  const hardStopsBlock = nextAction.match(/## Hard stops[\s\S]*?(?=##|$)/i)?.[0] ?? "";
  const hardStops = hardStopsBlock
    .replace(/## Hard stops/i, "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

  return { title: primary, why, hardStops };
}

function writeLastSuccess(record: LocalhostStatusRecord) {
  try {
    fs.mkdirSync(STATUS_DIR, { recursive: true });
    fs.writeFileSync(
      STATUS_FILE,
      JSON.stringify({ lastSuccess: record, updatedAt: record.checkedAt }, null, 2),
      "utf8"
    );
  } catch {
    /* best-effort */
  }
}

async function probeLocalhost(): Promise<LocalhostStatusRecord> {
  const port = process.env.PORT?.trim() || "3000";
  const url = `http://127.0.0.1:${port}/`;
  const checkedAt = new Date().toISOString();

  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(1200),
      cache: "no-store"
    });
    const ok = res.ok || res.status < 500;
    const current: LocalhostStatusRecord = {
      ok,
      port,
      checkedAt,
      url: `http://localhost:${port}/`,
      httpStatus: res.status
    };
    if (ok) writeLastSuccess(current);
    return current;
  } catch {
    return { ok: false, port, checkedAt, url: `http://localhost:${port}/`, httpStatus: 0 };
  }
}

function buildCrewBlocks(cousins: string | null, nextAction: string | null): CrewBlock[] {
  return CREW_DEFINITIONS.map((def) => {
    const protocolSection = cousins?.match(
      new RegExp(`${def.protocolHeading.source}[\\s\\S]*?(?=###|$)`, "i")
    )?.[0];
    const nextSection =
      def.id === "maker"
        ? nextAction?.match(/## Maker \(Cursor\)[\s\S]*?(?=##|$)/i)?.[0]
        : def.id === "dink"
          ? cousins?.match(/LOCAL HANDS READBACK[\s\S]*?(?=##|$)/i)?.[0]
          : null;

    const outbox = listOutbox((name) => def.outboxFilter.test(name), 3);
    return {
      id: def.id,
      label: def.label,
      summary: summarizeCrew(outbox),
      note: excerpt(nextSection ?? protocolSection ?? def.fallbackNote, 140),
      outbox
    };
  });
}

function unpushedCommitCount(): number {
  const count = git(["rev-list", "--count", "@{u}..HEAD"]);
  const n = Number.parseInt(count, 10);
  return Number.isFinite(n) ? n : 0;
}

function findStaleOutbox(): HandoffEntry | null {
  const all = listOutbox((n) => /^TO_PETRA_/i.test(n), 5);
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return all.find((item) => new Date(item.modifiedAt).getTime() < weekAgo) ?? null;
}

function petraPending(nextAction: string | null): boolean {
  if (!nextAction) return false;
  return (
    /TO_PETRA.*unsent|unsent.*TO_PETRA|Petra — pending|Petra synthesis packet pending/i.test(
      nextAction
    ) || (nextAction.includes("TO_PETRA") && /pending|unsent|unanswered/i.test(nextAction))
  );
}

export async function loadSoleDashData(): Promise<SoleDashData> {
  const nextAction = readRepoFile("foreman/NEXT_ACTION.md");
  const humanGates = readRepoFile("foreman/HUMAN_GATES.md");
  const topology = readRepoFile("foreman/MACHINE_TOPOLOGY.md");
  const cousins = readRepoFile("foreman/AI_COUSINS_PROTOCOL.md");
  const activeAgent = readRepoFile("foreman/ACTIVE_AGENT.md");

  const branch = git(["branch", "--show-current"]) || "UNKNOWN";
  const commit = git(["rev-parse", "HEAD"]) || "UNKNOWN";
  const commitSubject = git(["log", "-1", "--format=%s"]) || "UNKNOWN";
  const commitDate = git(["log", "-1", "--format=%cI"]) || "";
  const porcelain = git(["status", "--porcelain"]);
  const workingTreeDirty = Boolean(porcelain);
  const workingTree = workingTreeDirty
    ? `dirty (${porcelain.split("\n").filter(Boolean).length} entries)`
    : "clean";

  const localhost = await probeLocalhost();
  const hostname = os.hostname();
  const werklesName = parseWerklesMachine(topology);
  const missionParsed = parseMission(nextAction);
  const effectiveGate = parseEffectiveGate(nextAction, activeAgent);
  const gateFromActive = activeAgent?.match(/## Effective gate[\s\S]*?`?\[([^\]]+)\]`?/i)?.[1]?.trim();
  const gateFromNext = nextAction?.match(/\*\*Effective gate:\*\*\s*`?\[([^\]]+)\]`?/i)?.[1]?.trim();
  const gateMismatch = Boolean(gateFromActive && gateFromNext && gateFromActive !== gateFromNext);

  const benMustApprove =
    humanGates?.match(/## Ben Must Approve[\s\S]*?(?=##|$)/i)?.[0].split("\n")
      .filter((l) => l.startsWith("- "))
      .map((l) => l.replace(/^-\s+/, "").trim()) ?? [];

  const activeConditions =
    nextAction?.match(/## Conditions \(active\)[\s\S]*?(?=##|$)/i)?.[0].split("\n")
      .filter((l) => l.startsWith("- "))
      .map((l) => l.replace(/^-\s+/, "").trim()) ?? [];

  const receipts = listReceipts(12);
  const latestReceipt = receipts[0] ?? null;
  const unpushed = unpushedCommitCount();
  const executionContext =
    process.env.EXECUTION_CONTEXT?.trim() ||
    (process.env.CURSOR_CLOUD === "1" ? "CURSOR_CLOUD_CONTAINER" : "LOCAL_SALLY_WINDOWS");

  const machineCard = buildMachineCard({
    werklesName,
    hostname,
    repo: ROOT,
    branch,
    commit,
    commitSubject,
    workingTree,
    workingTreeDirty,
    executionContext,
    localhost,
    topology,
    expectedBranch: "snapshot/sally-good-werkles-2026-06-12"
  });

  const lastWorkedHere = buildLastWorkedHere({
    previousSession: readPreviousSession(),
    activeAgent,
    commit,
    commitSubject,
    commitDate,
    latestReceipt
  });

  const nextSteps = buildNextSteps({
    missionTitle: missionParsed.title,
    missionWhy: missionParsed.why,
    workingTreeDirty,
    unpushedCount: unpushed,
    effectiveGate,
    nextAction
  });

  const concerns = buildConcerns({
    workingTreeDirty,
    unpushedCount: unpushed,
    branch,
    werklesName,
    hostname,
    topology,
    localhostOk: localhost.ok,
    executionContext,
    machineWarnings: machineCard.warnings,
    staleOutbox: findStaleOutbox(),
    gateMismatch
  });

  const urgentGates = buildUrgentGates({
    hardStops: missionParsed.hardStops,
    activeConditions,
    benMustApprove,
    nextAction
  });

  const previousVisit = readPreviousVisit();
  let commitDelta = 0;
  if (previousVisit && previousVisit.commit !== commit) {
    const count = git(["rev-list", "--count", `${previousVisit.commit}..${commit}`]);
    const n = Number.parseInt(count, 10);
    commitDelta = Number.isFinite(n) ? n : 1;
  }

  const sinceLastVisit = buildSinceLastVisit({
    previousVisit,
    currentCommit: commit,
    receiptCount: receipts.length,
    urgentGateCount: urgentGates.length,
    commitDelta
  });

  const needsYouNow = buildNeedsYouNow({
    unpushedCount: unpushed,
    petraPending: petraPending(nextAction),
    missionTitle: missionParsed.title,
    missionWhy: missionParsed.why,
    urgentGates
  });

  const posture = buildSystemPosture({ needsYouNow, machineCard, concerns, urgentGates });

  const crew = buildCrewBlocks(cousins, nextAction);
  const outbox = listOutbox((n) => /^TO_[A-Z]/i.test(n) && !n.startsWith("OPEN_"), 8);
  const inbox = listInbox((n) => !["README.md", "FROM_CURSOR_READ_ME.md"].includes(n), 8);

  const workItems = buildWorkItems({
    needsYouNow,
    nextSteps,
    concerns,
    urgentGates,
    crew,
    outbox,
    inbox,
    receipts,
    workingTreeDirty,
    unpushedCount: unpushed,
    missionTitle: missionParsed.title
  });

  const squibb = buildSquibbCue({ posture, concerns, needsYouNow, nextSteps, machineCard });
  const allClear = buildAllClear({ needsYouNow, posture, crew });

  writeVisitSnapshot({
    timestamp: new Date().toISOString(),
    commit,
    receiptCount: receipts.length,
    urgentGateCount: urgentGates.length
  });

  snapshotCurrentSession({
    task: missionParsed.title,
    tool: lastWorkedHere.tool,
    commit: `${commit.slice(0, 12)} — ${commitSubject}`,
    receipt: latestReceipt?.name ?? null,
    status: lastWorkedHere.status,
    branch
  });

  return {
    version: "v1.2",
    machineCard,
    lastWorkedHere,
    needsYouNow,
    posture,
    sinceLastVisit,
    workItems,
    squibb,
    allClear,
    crew,
    outbox,
    inbox,
    receipts,
    sources: [
      { path: "foreman/NEXT_ACTION.md", loaded: Boolean(nextAction) },
      { path: "foreman/ACTIVE_AGENT.md", loaded: Boolean(activeAgent) },
      { path: "foreman/HUMAN_GATES.md", loaded: Boolean(humanGates) },
      { path: "foreman/MACHINE_TOPOLOGY.md", loaded: Boolean(topology) },
      { path: "foreman/handoffs/inbox/", loaded: fs.existsSync(path.join(ROOT, "foreman/handoffs/inbox")) },
      { path: "foreman/handoffs/outbox/", loaded: fs.existsSync(path.join(ROOT, "foreman/handoffs/outbox")) },
      { path: "foreman/AI_COUSINS_PROTOCOL.md", loaded: Boolean(cousins) }
    ]
  };
}

export type { SoleDashV12View };
