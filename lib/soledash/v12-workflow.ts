import type { Concern, MachineCard, NextStep, UrgentGate, VisitSnapshot } from "@/lib/soledash/workflow";
import type { CrewBlock, HandoffEntry } from "@/lib/soledash/cockpit-data";

export type PostureColor = "green" | "yellow" | "red";

export type NeedsYouKind = "human_gate" | "next_action";

export type NeedsYouNow = {
  kind: NeedsYouKind;
  title: string;
  detail: string;
};

export type SystemPosture = {
  color: PostureColor;
  label: string;
  explanation: string;
};

export type Ownership = "waiting_on_ben" | "waiting_on_cousin";

export type WorkLane = "act" | "at_risk" | "in_progress" | "done";

export type WorkItem = {
  id: string;
  lane: WorkLane;
  title: string;
  detail: string;
  ownership: Ownership;
};

export type SinceLastVisit = {
  sinceLabel: string;
  summary: string;
  commitDelta: number;
  receiptsDelta: number;
  gatesOpened: number;
};

export type SquibbCueKind = "warning" | "recommendation" | "concern" | "opportunity";

export type SquibbCue = {
  kind: SquibbCueKind;
  line: string;
};

export type AllClearState = {
  headline: string;
  cousinsWorking: number;
  nextGateEstimate: string;
};

export type SoleDashV12View = {
  needsYouNow: NeedsYouNow | null;
  posture: SystemPosture;
  sinceLastVisit: SinceLastVisit;
  workItems: WorkItem[];
  squibb: SquibbCue | null;
  allClear: AllClearState | null;
};

function formatSinceTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      hour: "numeric",
      minute: "2-digit"
    });
  } catch {
    return iso;
  }
}

export function buildNeedsYouNow(input: {
  unpushedCount: number;
  petraPending: boolean;
  missionTitle: string;
  missionWhy: string;
  urgentGates: UrgentGate[];
}): NeedsYouNow | null {
  const benGate = input.urgentGates.find(
    (g) => g.category === "approval" || g.category === "push" || g.title.includes("Petra")
  );

  if (input.unpushedCount > 0) {
    return {
      kind: "human_gate",
      title: `Review ${input.unpushedCount} unpushed commit(s) before push`,
      detail: "Push to remote is a human gate — Operator must approve."
    };
  }

  if (input.petraPending) {
    return {
      kind: "human_gate",
      title: "Send or answer Petra synthesis / GO-NO-GO packet",
      detail: "Comptroller verdict gates production-facing moves."
    };
  }

  if (benGate && /push|merge|deploy|Petra|approval|OAuth|billing|secret|SQL|live/i.test(benGate.title)) {
    return {
      kind: "human_gate",
      title: benGate.title,
      detail: benGate.detail
    };
  }

  if (input.missionTitle && !/^Review foreman/i.test(input.missionTitle)) {
    return {
      kind: "next_action",
      title: input.missionTitle,
      detail: input.missionWhy
    };
  }

  return null;
}

export function buildSystemPosture(input: {
  needsYouNow: NeedsYouNow | null;
  machineCard: MachineCard;
  concerns: Concern[];
  urgentGates: UrgentGate[];
}): SystemPosture {
  const highConcerns = input.concerns.filter((c) => c.severity === "high");
  const hasBlocker =
    !input.machineCard.localhostOk ||
    input.machineCard.executionContext === "CURSOR_CLOUD_CONTAINER" ||
    highConcerns.length > 0;

  if (hasBlocker) {
    const reason = !input.machineCard.localhostOk
      ? "Localhost is down — preview and route proof blocked."
      : input.machineCard.executionContext === "CURSOR_CLOUD_CONTAINER"
        ? "Cloud execution context cannot claim local machine state."
        : highConcerns[0]?.label ?? "Blocker detected in cockpit signals.";
    return { color: "red", label: "RED", explanation: reason };
  }

  if (input.needsYouNow) {
    return {
      color: "yellow",
      label: "YELLOW",
      explanation:
        input.needsYouNow.kind === "human_gate"
          ? "Waiting on Ben — human gate needs Operator decision."
          : "Waiting on Ben — next action is ready on the build lane."
    };
  }

  const cousinWait = input.urgentGates.length === 0 && input.concerns.length === 0;
  return {
    color: "green",
    label: "GREEN",
    explanation: cousinWait
      ? "Nothing needs Ben right now — crew lanes can proceed within gates."
      : "Monitoring — no immediate Operator action required."
  };
}

export function buildWorkItems(input: {
  needsYouNow: NeedsYouNow | null;
  nextSteps: NextStep[];
  concerns: Concern[];
  urgentGates: UrgentGate[];
  crew: CrewBlock[];
  outbox: HandoffEntry[];
  inbox: HandoffEntry[];
  receipts: HandoffEntry[];
  workingTreeDirty: boolean;
  unpushedCount: number;
  missionTitle: string;
}): WorkItem[] {
  const items: WorkItem[] = [];
  const needsTitle = input.needsYouNow?.title;

  for (const step of input.nextSteps) {
    if (step.title === needsTitle) continue;
    if (step.humanGateRequired) {
      items.push({
        id: `act-step-${step.rank}`,
        lane: "act",
        title: step.title,
        detail: step.why,
        ownership: "waiting_on_ben"
      });
    } else if (/Ben|Operator/i.test(step.owner)) {
      items.push({
        id: `act-step-${step.rank}`,
        lane: "act",
        title: step.title,
        detail: step.why,
        ownership: "waiting_on_ben"
      });
    } else {
      items.push({
        id: `prog-step-${step.rank}`,
        lane: "in_progress",
        title: step.title,
        detail: `${step.why} · ${step.owner}`,
        ownership: /Dink|local hands/i.test(step.owner) ? "waiting_on_ben" : "waiting_on_cousin"
      });
    }
  }

  for (const concern of input.concerns) {
    const benConcern =
      /dirty|unpushed|Ben|Operator|push|approval|gate|localhost|cloud|branch|mismatch|machine/i.test(
        `${concern.label} ${concern.detail}`
      );
    items.push({
      id: `risk-${concern.label}`,
      lane: "at_risk",
      title: concern.label,
      detail: concern.detail,
      ownership: benConcern ? "waiting_on_ben" : "waiting_on_cousin"
    });
  }

  for (const gate of input.urgentGates) {
    if (gate.title === needsTitle) continue;
    if (gate.detail === "Hard stop from foreman/NEXT_ACTION.md") continue;
    items.push({
      id: `risk-gate-${gate.title.slice(0, 40)}`,
      lane: "at_risk",
      title: gate.title,
      detail: gate.detail,
      ownership: /Ben|Operator|approval|push|deploy|login|OAuth|billing/i.test(gate.detail + gate.title)
        ? "waiting_on_ben"
        : "waiting_on_cousin"
    });
  }

  if (input.workingTreeDirty) {
    items.push({
      id: "prog-dirty-tree",
      lane: "in_progress",
      title: "Working tree has uncommitted changes",
      detail: "Clean up before next lane or commit snapshot work.",
      ownership: "waiting_on_ben"
    });
  }

  for (const block of input.crew) {
    if (block.outbox.length === 0) continue;
    const latest = block.outbox[0];
    items.push({
      id: `prog-crew-${block.id}`,
      lane: "in_progress",
      title: `${block.label}: ${latest.name}`,
      detail: block.summary,
      ownership: "waiting_on_cousin"
    });
  }

  for (const receipt of input.receipts.slice(0, 4)) {
    items.push({
      id: `done-receipt-${receipt.name}`,
      lane: "done",
      title: receipt.name,
      detail: new Date(receipt.modifiedAt).toLocaleString(),
      ownership: "waiting_on_cousin"
    });
  }

  for (const entry of input.inbox.slice(0, 2)) {
    if (items.some((i) => i.id === `done-receipt-${entry.name}`)) continue;
    items.push({
      id: `done-inbox-${entry.name}`,
      lane: "done",
      title: entry.name,
      detail: "Received — review when Operator is ready.",
      ownership: "waiting_on_ben"
    });
  }

  const laneOrder: WorkLane[] = ["act", "at_risk", "in_progress", "done"];
  return laneOrder.flatMap((lane) => items.filter((i) => i.lane === lane));
}

export function buildSinceLastVisit(input: {
  previousVisit: VisitSnapshot | null;
  currentCommit: string;
  receiptCount: number;
  urgentGateCount: number;
  commitDelta?: number;
}): SinceLastVisit {
  if (!input.previousVisit) {
    return {
      sinceLabel: "First visit this session",
      summary: "No prior SoleDash visit recorded on this machine.",
      commitDelta: 0,
      receiptsDelta: 0,
      gatesOpened: 0
    };
  }

  const commitDelta =
    input.commitDelta ??
    (input.previousVisit.commit !== input.currentCommit ? 1 : 0);
  const receiptsDelta = Math.max(0, input.receiptCount - input.previousVisit.receiptCount);
  const gatesOpened = Math.max(0, input.urgentGateCount - input.previousVisit.urgentGateCount);
  const sinceLabel = `Since ${formatSinceTime(input.previousVisit.timestamp)}`;

  const parts: string[] = [];
  if (commitDelta > 0) parts.push(`${commitDelta} commit${commitDelta === 1 ? "" : "s"}`);
  if (receiptsDelta > 0) parts.push(`${receiptsDelta} packet${receiptsDelta === 1 ? "" : "s"} completed`);
  if (gatesOpened > 0) parts.push(`${gatesOpened} Human Gate${gatesOpened === 1 ? "" : "s"} opened`);

  const summary = parts.length > 0 ? parts.join(" · ") : "No commits, packets, or gate changes detected.";

  return { sinceLabel, summary, commitDelta, receiptsDelta, gatesOpened };
}

export function buildSquibbCue(input: {
  posture: SystemPosture;
  concerns: Concern[];
  needsYouNow: NeedsYouNow | null;
  nextSteps: NextStep[];
  machineCard: MachineCard;
}): SquibbCue | null {
  if (input.posture.color === "red" && !input.machineCard.localhostOk) {
    return {
      kind: "warning",
      line: "Localhost is down — fix dev server before directing crew to preview routes."
    };
  }

  if (input.machineCard.warnings.length > 0) {
    return {
      kind: "warning",
      line: input.machineCard.warnings[0]
    };
  }

  const highConcern = input.concerns.find((c) => c.severity === "high" || c.severity === "medium");
  if (highConcern) {
    return {
      kind: "concern",
      line: `${highConcern.label}: ${highConcern.detail}`
    };
  }

  if (input.needsYouNow?.kind === "human_gate") {
    return {
      kind: "recommendation",
      line: input.needsYouNow.detail
    };
  }

  const opportunity = input.nextSteps.find((s) => !s.humanGateRequired && s.rank === 1);
  if (opportunity && input.posture.color === "green") {
    return {
      kind: "opportunity",
      line: `${opportunity.title} — ${opportunity.why.slice(0, 120)}`
    };
  }

  return null;
}

export function buildAllClear(input: {
  needsYouNow: NeedsYouNow | null;
  posture: SystemPosture;
  crew: CrewBlock[];
}): AllClearState | null {
  if (input.needsYouNow || input.posture.color === "red") return null;
  if (input.posture.color === "yellow") return null;

  const cousinsWorking = input.crew.filter(
    (c) => c.outbox.length > 0 || /active|verification|build/i.test(c.note)
  ).length;

  return {
    headline: "All clear.",
    cousinsWorking: Math.max(cousinsWorking, 1),
    nextGateEstimate: "~2 hours"
  };
}

export function buildSoleDashV12View(input: {
  needsYouNow: NeedsYouNow | null;
  posture: SystemPosture;
  sinceLastVisit: SinceLastVisit;
  workItems: WorkItem[];
  squibb: SquibbCue | null;
  allClear: AllClearState | null;
}): SoleDashV12View {
  return input;
}
