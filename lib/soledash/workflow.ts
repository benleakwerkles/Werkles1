import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import type { HandoffEntry, LocalhostStatusRecord } from "@/lib/soledash/cockpit-data";

const SESSION_FILE = path.join(process.cwd(), "foreman", "soledash", "OPERATOR_SESSION.json");

export type WorkflowStatus = "completed" | "blocked" | "in_progress" | "unknown";

export type LastWorkedHere = {
  task: string;
  tool: string;
  commit: string | null;
  receipt: string | null;
  timestamp: string | null;
  status: WorkflowStatus;
  source: string;
};

export type NextStep = {
  rank: 1 | 2 | 3;
  title: string;
  why: string;
  owner: string;
  humanGateRequired: boolean;
};

export type Concern = {
  severity: "high" | "medium" | "low";
  label: string;
  detail: string;
};

export type UrgentGate = {
  title: string;
  detail: string;
  category: "approval" | "deploy" | "push" | "account" | "blocker";
};

export type StackBoundary = {
  name: string;
  role: string;
};

export type MachineCard = {
  werklesName: string;
  hostname: string;
  repo: string;
  branch: string;
  commit: string;
  commitSubject: string;
  workingTree: string;
  workingTreeDirty: boolean;
  executionContext: string;
  localhostSummary: string;
  localhostOk: boolean;
  warnings: string[];
};

type SessionRecord = {
  task: string;
  tool: string;
  commit: string | null;
  receipt: string | null;
  timestamp: string;
  status: WorkflowStatus;
  branch: string;
  hostname: string;
};

export type VisitSnapshot = {
  timestamp: string;
  commit: string;
  receiptCount: number;
  urgentGateCount: number;
};

type SessionFile = {
  lastSession?: SessionRecord;
  lastVisit?: VisitSnapshot;
  updatedAt?: string;
};

function readSessionFile(): SessionFile {
  try {
    return JSON.parse(fs.readFileSync(SESSION_FILE, "utf8")) as SessionFile;
  } catch {
    return {};
  }
}

function readSession(): SessionRecord | null {
  return readSessionFile().lastSession ?? null;
}

export function readPreviousVisit(): VisitSnapshot | null {
  return readSessionFile().lastVisit ?? null;
}

export function writeVisitSnapshot(snapshot: VisitSnapshot) {
  try {
    const file = readSessionFile();
    fs.mkdirSync(path.dirname(SESSION_FILE), { recursive: true });
    fs.writeFileSync(
      SESSION_FILE,
      JSON.stringify({ ...file, lastVisit: snapshot, updatedAt: new Date().toISOString() }, null, 2)
    );
  } catch {
    /* best-effort */
  }
}

export function writeSession(record: SessionRecord) {
  try {
    const file = readSessionFile();
    fs.mkdirSync(path.dirname(SESSION_FILE), { recursive: true });
    fs.writeFileSync(
      SESSION_FILE,
      JSON.stringify({ ...file, lastSession: record, updatedAt: new Date().toISOString() }, null, 2)
    );
  } catch {
    /* best-effort */
  }
}

function inferStatus(text: string): WorkflowStatus {
  const upper = text.toUpperCase();
  if (/PAUSE|BLOCK|NO-GO|HOLD|AWAITING|GATE/.test(upper)) return "blocked";
  if (/PASS|COMPLETE|DONE|MERGED/.test(upper)) return "completed";
  if (/IN PROGRESS|ACTIVE|BUILD|REVIEW/.test(upper)) return "in_progress";
  return "unknown";
}

function inferTool(text: string): string {
  if (/Cursor|Maker/i.test(text)) return "Cursor / Maker";
  if (/Dink|LOCAL HANDS/i.test(text)) return "Dink (local hands)";
  if (/Foreman|Codex/i.test(text)) return "Foreman";
  if (/GimpDash|GD intent/i.test(text)) return "GimpDash";
  if (/PowerShell|\.cmd/i.test(text)) return "PowerShell";
  if (/browser|Edge/i.test(text)) return "Browser";
  return "SoleDash / local";
}

function parseActiveAgent(activeAgent: string | null) {
  const gate = activeAgent?.match(/## Effective gate[\s\S]*?`?\[([^\]]+)\]`?/i)?.[1]?.trim();
  const writers =
    activeAgent
      ?.match(/\*\*([^*]+)\*\* — ([^\n]+)/g)
      ?.map((line) => line.replace(/\*\*/g, ""))
      .slice(0, 3) ?? [];
  return { gate, writers };
}

export function buildLastWorkedHere(input: {
  previousSession: SessionRecord | null;
  activeAgent: string | null;
  commit: string;
  commitSubject: string;
  commitDate: string;
  latestReceipt: HandoffEntry | null;
}): LastWorkedHere {
  if (input.previousSession && input.previousSession.hostname === os.hostname()) {
    return {
      task: input.previousSession.task,
      tool: input.previousSession.tool,
      commit: input.previousSession.commit,
      receipt: input.previousSession.receipt,
      timestamp: input.previousSession.timestamp,
      status: input.previousSession.status,
      source: "foreman/soledash/OPERATOR_SESSION.json (previous visit)"
    };
  }

  const agent = parseActiveAgent(input.activeAgent);
  const task = agent.gate ?? input.commitSubject;
  const tool = inferTool(
    [input.activeAgent ?? "", agent.writers.join(" "), input.commitSubject].join(" ")
  );

  return {
    task,
    tool,
    commit: `${input.commit.slice(0, 12)} — ${input.commitSubject}`,
    receipt: input.latestReceipt?.name ?? null,
    timestamp: input.latestReceipt?.modifiedAt ?? (input.commitDate || null),
    status: inferStatus([task, input.activeAgent ?? ""].join(" ")),
    source: "Inferred from ACTIVE_AGENT.md + latest git/receipt"
  };
}

export function buildMachineCard(input: {
  werklesName: string;
  hostname: string;
  repo: string;
  branch: string;
  commit: string;
  commitSubject: string;
  workingTree: string;
  workingTreeDirty: boolean;
  executionContext: string;
  localhost: LocalhostStatusRecord;
  topology: string | null;
  expectedBranch?: string;
}): MachineCard {
  const warnings: string[] = [];

  if (input.topology && !input.topology.includes(`| **${input.werklesName}** | \`${input.hostname}\``)) {
    if (input.werklesName === input.hostname) {
      warnings.push("Hostname is not registered in foreman/MACHINE_TOPOLOGY.md for this Werkles name.");
    }
  }

  if (input.executionContext === "CURSOR_CLOUD_CONTAINER") {
    warnings.push("Cloud container must not claim local Sally/Betsy filesystem or localhost.");
  }

  if (input.expectedBranch && input.branch !== input.expectedBranch) {
    warnings.push(`Branch ${input.branch} differs from expected ${input.expectedBranch}.`);
  }

  const localhostSummary = input.localhost.ok
    ? `Up — ${input.localhost.url} (HTTP ${input.localhost.httpStatus})`
    : `Down — ${input.localhost.url}`;

  return {
    werklesName: input.werklesName,
    hostname: input.hostname,
    repo: input.repo,
    branch: input.branch,
    commit: input.commit,
    commitSubject: input.commitSubject,
    workingTree: input.workingTree,
    workingTreeDirty: input.workingTreeDirty,
    executionContext: input.executionContext,
    localhostSummary,
    localhostOk: input.localhost.ok,
    warnings
  };
}

export function buildNextSteps(input: {
  missionTitle: string;
  missionWhy: string;
  workingTreeDirty: boolean;
  unpushedCount: number;
  effectiveGate: string;
  nextAction: string | null;
}): NextStep[] {
  const petraPending = input.nextAction?.includes("TO_PETRA") ?? false;

  const step1: NextStep = {
    rank: 1,
    title: input.missionTitle,
    why: input.missionWhy,
    owner: "Maker (Cursor) + Ben (Operator)",
    humanGateRequired: false
  };

  const step2: NextStep = input.workingTreeDirty
    ? {
        rank: 2,
        title: "Clean up working tree before next lane",
        why: "Dirty tree hides real state and blocks safe commits.",
        owner: "Dink (local hands)",
        humanGateRequired: false
      }
    : input.unpushedCount > 0
      ? {
          rank: 2,
          title: `Review ${input.unpushedCount} unpushed commit(s) on snapshot`,
          why: "Snapshot branch work should be reviewed before push — push is a human gate.",
          owner: "Ben (Operator)",
          humanGateRequired: true
        }
      : {
          rank: 2,
          title: "Run localhost proof on current branch",
          why: "Confirms the snapshot still builds and previews before directing crew.",
          owner: "Maker / Dink",
          humanGateRequired: false
        };

  const step3: NextStep = petraPending
    ? {
        rank: 3,
        title: "Send or answer Petra synthesis / GO-NO-GO packet",
        why: "Comptroller verdict gates production-facing moves.",
        owner: "Petra (Comptroller)",
        humanGateRequired: true
      }
    : {
        rank: 3,
        title: "Review effective gate and redirect if stale",
        why: `Gate ${input.effectiveGate} may need Operator APPROVE / REDIRECT / DEFER.`,
        owner: "Ben (Operator)",
        humanGateRequired: true
      };

  return [step1, step2, step3];
}

export function buildConcerns(input: {
  workingTreeDirty: boolean;
  unpushedCount: number;
  branch: string;
  werklesName: string;
  hostname: string;
  topology: string | null;
  localhostOk: boolean;
  executionContext: string;
  machineWarnings: string[];
  staleOutbox: HandoffEntry | null;
  gateMismatch: boolean;
}): Concern[] {
  const concerns: Concern[] = [];

  if (input.workingTreeDirty) {
    concerns.push({
      severity: "medium",
      label: "Dirty working tree",
      detail: "Uncommitted changes on disk — verify before directing crew."
    });
  }

  if (input.unpushedCount > 0) {
    concerns.push({
      severity: "medium",
      label: "Unpushed commits",
      detail: `${input.unpushedCount} commit(s) ahead of remote — push requires Ben approval.`
    });
  }

  if (input.branch !== "snapshot/sally-good-werkles-2026-06-12" && input.branch.includes("main")) {
    concerns.push({
      severity: "high",
      label: "Branch on main",
      detail: "Operator work should stay on snapshot branch until explicit merge gate."
    });
  }

  if (input.topology && input.werklesName === input.hostname) {
    concerns.push({
      severity: "medium",
      label: "Unregistered machine identity",
      detail: `${input.hostname} is not bound to a Werkles name in MACHINE_TOPOLOGY.md.`
    });
  }

  if (!input.localhostOk) {
    concerns.push({
      severity: "high",
      label: "Localhost down",
      detail: "npm run dev not responding — SoleDash cannot preview app routes."
    });
  }

  if (input.executionContext === "CURSOR_CLOUD_CONTAINER") {
    concerns.push({
      severity: "high",
      label: "Cloud execution context",
      detail: "Agent may be pretending to be local — request LOCAL HANDS READBACK on Betsy/Doss/Sally."
    });
  }

  for (const w of input.machineWarnings) {
    concerns.push({ severity: "medium", label: "Machine label conflict", detail: w });
  }

  if (input.staleOutbox) {
    concerns.push({
      severity: "low",
      label: "Stale outbox packet",
      detail: `${input.staleOutbox.name} may need send or archive.`
    });
  }

  if (input.gateMismatch) {
    concerns.push({
      severity: "medium",
      label: "Gate mismatch",
      detail: "ACTIVE_AGENT effective gate differs from NEXT_ACTION — refresh cockpit."
    });
  }

  return concerns;
}

export function buildUrgentGates(input: {
  hardStops: string[];
  activeConditions: string[];
  benMustApprove: string[];
  nextAction: string | null;
}): UrgentGate[] {
  const urgent: UrgentGate[] = [];

  for (const stop of input.hardStops) {
    urgent.push({
      title: stop,
      detail: "Hard stop from foreman/NEXT_ACTION.md",
      category: stop.includes("push") || stop.includes("merge") ? "push" : "blocker"
    });
  }

  for (const cond of input.activeConditions.filter((c) => /PAUSE|BLOCK|gate|Stripe|deploy|NO-GO/i.test(c))) {
    urgent.push({
      title: cond.slice(0, 80),
      detail: "Active condition — worsens if ignored",
      category: cond.match(/deploy|production/i) ? "deploy" : "approval"
    });
  }

  const urgentApprovals = input.benMustApprove.filter((item) =>
    /push|merge|deploy|login|OAuth|billing|secret|production|SQL|live/i.test(item)
  );
  for (const item of urgentApprovals.slice(0, 6)) {
    urgent.push({
      title: item,
      detail: "Requires Ben approval per foreman/HUMAN_GATES.md",
      category: item.match(/push|merge/i)
        ? "push"
        : item.match(/login|OAuth|account/i)
          ? "account"
          : item.match(/deploy|live|production/i)
            ? "deploy"
            : "approval"
    });
  }

  if (input.nextAction?.includes("TO_PETRA") && input.nextAction.includes("unsent")) {
    urgent.push({
      title: "Petra synthesis packet pending",
      detail: "Homepage / merge decisions blocked until Comptroller verdict",
      category: "approval"
    });
  }

  return urgent.slice(0, 10);
}

export const STACK_BOUNDARIES: StackBoundary[] = [
  { name: "SoleDash", role: "Cockpit / daily workflow — what machine, what next, what needs approval" },
  { name: "Speaker", role: "Reasoning layer / diagnosis — what are we really doing?" },
  { name: "GimpDash", role: "Dispatch plumbing / GD intent routing / packets / receipts" },
  { name: "Foreman", role: "Local control server (:4317) / infra / pin shortcuts" },
  { name: "Petra", role: "Red-team / risk / GO-NO-GO / Comptroller verdict" }
];

export function summarizeCrew(outbox: HandoffEntry[]): string {
  if (outbox.length === 0) return "No recent outbox packets.";
  return `${outbox.length} packet(s) — latest: ${outbox[0].name}`;
}

export function readPreviousSession(): SessionRecord | null {
  return readSession();
}

export function snapshotCurrentSession(input: {
  task: string;
  tool: string;
  commit: string;
  receipt: string | null;
  status: WorkflowStatus;
  branch: string;
}) {
  writeSession({
    task: input.task,
    tool: input.tool,
    commit: input.commit,
    receipt: input.receipt,
    timestamp: new Date().toISOString(),
    status: input.status,
    branch: input.branch,
    hostname: os.hostname()
  });
}
