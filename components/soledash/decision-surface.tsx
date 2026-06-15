"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";

import type {
  ActionLifecycle,
  DecisionButton,
  DecisionReceipt,
  DecisionSurfaceView,
  FrontierQueueItem,
  HumanGate,
  MegaWorkHomeView,
  MockTestFailureMode,
  MockTestResult,
  MockTestRoute,
  OperatorChatEntry,
  OperatorIntent,
  QueueOverrideAction,
  QueueRankSource,
  Rationale,
  ReceiptCenterEntry,
  ThreadHealthItem
} from "@/protocol/index";
import { RATIONALE_FIELDS } from "@/protocol/index";
import {
  CurrentBlockerPanel,
  CurrentRealityBanner,
  FrontierComparisonPanel,
  HonestyBadge,
  InspectDetail,
  QueueOverridePanel,
  QueueVisibilityPanel,
  ReceiptCenterPanel
} from "@/components/soledash/decision-surface-panels";
import { mergeRouteButtons } from "@/lib/soledash/decision-surface/action-routes";
import { idleLifecycle, LIFECYCLE_PHASES } from "@/lib/soledash/decision-surface/action-lifecycle";
import { realityModeDetail } from "@/lib/soledash/decision-surface/reality-mode";
import type { PetraTransportEnvelope } from "@/lib/soledash/petra-transport/types";
import {
  AmbientLayer,
  CommandLayerShell,
  CompactReceiptRail,
  LeavePointTracker,
  loadLeavePoints,
  saveLeavePoint,
  type LeavePointEntry,
  type LeavePointReason
} from "@/components/soledash/ambient-command-layers";
import {
  filterReceiptEntries,
  FleetRow,
  ReceiptSearchBar
} from "@/components/soledash/megawork-home-panels";
import { CommandActionsPanel } from "@/components/soledash/command-actions";
import { OperatorBar, type DispatchStatus, type OperatorCousinTarget } from "@/components/soledash/operator-bar";
import { PetraEmptyLinkFire } from "@/components/soledash/petra-empty-link-fire";
import { AutomaticaRelayGrid } from "@/components/soledash/automatica-relay-grid";
import {
  MobileFrontierPanel,
  MobileHandsPanel,
  MobileReceiptList
} from "@/components/soledash/mobile-field-command";
import { MockTestBanner, MockTestHarness } from "@/components/soledash/mock-test-harness";
import {
  executeMockTest,
  loadClientMockReceipts,
  loadLastMockTest,
  mergeMockReceipts,
  saveLastMockTest,
  upsertSessionReceipt
} from "@/lib/soledash/mock-test/client-runner";
import { routeForAction } from "@/lib/soledash/mock-test/shared";
import { patchFleetWithDecisionView } from "@/lib/soledash/megawork-home/fleet-utils";
import { OptionsDeck } from "@/components/soledash/options-deck";
import { optionMissionText } from "@/lib/soledash/options-deck/build-options";
import type { CompanyOption, OptionBoardState, OptionVerb, ReactionEntry, SalvoSlot } from "@/lib/soledash/options-deck/types";
import {
  lifecycleFromReceipt,
  lifecycleFromVerbResult,
  receiptMatchesOption
} from "@/lib/soledash/options-deck/lifecycle";
import { buildCompanyOptions } from "@/lib/soledash/options-deck/build-options";
import { salvoAllowed } from "@/lib/soledash/options-deck/conflicts";

type DecisionSurfaceProps = {
  initialView: DecisionSurfaceView;
  homeView?: MegaWorkHomeView | null;
};

const SOLEDASH_LOGO = "/assets/soledash/branding/logo-a-transparent.png";
const POLL_MS = 20_000;

function postureLine(health: ThreadHealthItem): { label: string; tone: "ok" | "warn" | "bad" } {
  const status = health.status.toLowerCase();
  if (status.includes("block")) {
    return { label: "Blocked — stop and read before acting", tone: "bad" };
  }
  if (status.includes("degrad") || status.includes("warn")) {
    return { label: "Attention needed — thread degraded", tone: "warn" };
  }
  if (status.includes("health") || status === "ok" || status === "green") {
    return { label: "Okay — thread healthy", tone: "ok" };
  }
  return { label: health.status, tone: "warn" };
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    const ss = String(d.getUTCSeconds()).padStart(2, "0");
    return `${hh}:${mm}:${ss} UTC`;
  } catch {
    return iso;
  }
}

function MissionPosture({
  view,
  lastRefresh,
  refreshing,
  onRefresh
}: {
  view: DecisionSurfaceView;
  lastRefresh: string;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const { payload, machine_label, data_source } = view;
  const posture = postureLine(payload.thread_health);
  const isLive = data_source === "dink";
  const isUnavailable = data_source === "unavailable";

  return (
    <header className="fm-posture" aria-label="Mission and posture">
      <div className="fm-posture__logo-row">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={SOLEDASH_LOGO}
          alt="AEYE Inc"
          className="fm-posture__logo"
          width={280}
          height={48}
        />
      </div>
      <div className="fm-posture__brand">
        <div className="fm-posture__copy">
          <div className="fm-posture__meta">
            <p className="fm-eyebrow">SoleDash</p>
            <span className="fm-machine">{machine_label}</span>
          </div>
          <p className="fm-posture__mission">{payload.mission.label}</p>
          <p className={`fm-posture__status fm-posture__status--${posture.tone}`}>
            {isUnavailable ? "LIVE PAYLOAD UNAVAILABLE" : posture.label}
          </p>
        </div>
      </div>
      <div className="fm-live-bar">
        <span className="fm-live-bar__time">Updated {formatTime(lastRefresh)}</span>
        <button type="button" className="fm-live-bar__btn" disabled={refreshing} onClick={onRefresh}>
          {refreshing ? "Refreshing…" : "Refresh now"}
        </button>
      </div>
    </header>
  );
}

function EvidenceStatusLine({ status }: { status: string | undefined }) {
  const value = status?.trim() || "UNSET";
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <p className={`fm-evidence fm-evidence--${slug}`} aria-label="Evidence status">
      <span className="fm-evidence__label">Evidence:</span>{" "}
      <span className="fm-evidence__value">{value}</span>
    </p>
  );
}

function ActionStatusRail({ lifecycle }: { lifecycle: ActionLifecycle }) {
  if (lifecycle.phase === "idle") return null;

  const phaseForIdx =
    lifecycle.phase === "failed" ? "working" : lifecycle.phase;
  const activeIdx = LIFECYCLE_PHASES.indexOf(
    phaseForIdx as (typeof LIFECYCLE_PHASES)[number]
  );
  const failed = lifecycle.phase === "failed";
  const simulated = lifecycle.simulated === true;

  return (
    <div
      className={`fm-action-rail ${failed ? "fm-action-rail--failed" : ""} ${lifecycle.mock ? "fm-action-rail--mock" : ""} ${simulated ? "fm-action-rail--simulated" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Action status"
    >
      <div className="fm-action-rail__head">
        <p className="fm-action-rail__heading">Action rail</p>
        {simulated ? (
          <span className="fm-action-rail__mock-badge">MOCK TEST</span>
        ) : lifecycle.mock ? (
          <span className="fm-action-rail__mock-badge">MOCK ACTION</span>
        ) : (
          <span className="fm-action-rail__mock-badge fm-action-rail__mock-badge--live">LIVE</span>
        )}
      </div>
      <ol className="fm-action-rail__steps">
        {LIFECYCLE_PHASES.map((phase, i) => {
          const done = failed ? i < activeIdx : activeIdx >= i;
          const current = !failed && lifecycle.phase === phase;
          const label =
            phase === "received" && lifecycle.mock && !simulated
              ? "sim received"
              : phase.replace(/_/g, " ");
          return (
            <li
              key={phase}
              className={`fm-action-rail__step ${done ? "fm-action-rail__step--done" : ""} ${current ? "fm-action-rail__step--current" : ""}`}
            >
              <span className="fm-action-rail__dot" />
              <span className="fm-action-rail__phase">{label}</span>
            </li>
          );
        })}
        {failed ? (
          <li className="fm-action-rail__step fm-action-rail__step--failed fm-action-rail__step--current">
            <span className="fm-action-rail__dot" />
            <span className="fm-action-rail__phase">failed</span>
          </li>
        ) : null}
      </ol>
      {lifecycle.message ? <p className="fm-action-rail__message">{lifecycle.message}</p> : null}
      {lifecycle.route_owner ? (
        <p className="fm-action-rail__owner">
          Route owner: <strong>{lifecycle.route_owner}</strong>
        </p>
      ) : null}
      {lifecycle.failure_reason ? (
        <p className="fm-action-rail__fail">{lifecycle.failure_reason}</p>
      ) : null}
      <p className="fm-action-rail__meta">
        {lifecycle.action?.toUpperCase()}
        {lifecycle.action_id ? ` · ${lifecycle.action_id}` : ""} · {formatTime(lifecycle.updated_at)}
      </p>
    </div>
  );
}

function ExpandWhyPanel({ rationale }: { rationale: Rationale }) {
  return (
    <dl className="ds-why__dl">
      {RATIONALE_FIELDS.map(({ key, label }) => (
        <div key={key}>
          <dt>{label}</dt>
          <dd>{rationale[key]}</dd>
        </div>
      ))}
    </dl>
  );
}

function HumanGateDetail({ gate }: { gate: HumanGate }) {
  const slug = gate.classification.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <div className={`ds-gate ds-gate--${slug}`}>
      <p className="ds-gate__prompt">{gate.operator_prompt}</p>
      <p className="ds-gate__class">{gate.classification}</p>
      <p className="ds-gate__line">{gate.operator_line}</p>
      {gate.detail ? <p className="ds-gate__detail">{gate.detail}</p> : null}
      {gate.transport_gap ? (
        <div className="ds-gap">
          <p className="ds-gap__line">{gate.transport_gap.headline}</p>
          <p className="ds-gap__detail">{gate.transport_gap.reason}</p>
          {gate.transport_gap.manual_step ? <p className="ds-gap__step">{gate.transport_gap.manual_step}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function ReceiptBlock({ receipt, mock }: { receipt: DecisionReceipt; mock?: boolean }) {
  if (!receipt.last_action && !receipt.outcome && !receipt.next_state) {
    return null;
  }

  return (
    <div className="ds-receipt" role="status" aria-label="Receipt status">
      {mock || receipt.kind === "mock_action" ? (
        <p className="ds-receipt__mock">MOCK ACTION receipt</p>
      ) : null}
      {receipt.kind ? <p className="ds-receipt__type">{receipt.kind.replace(/_/g, " ")}</p> : null}
      {receipt.outcome ? <p className="ds-receipt__outcome">{receipt.outcome}</p> : null}
      {receipt.route_owner ? (
        <p className="ds-receipt__owner">
          Route owner: <strong>{receipt.route_owner}</strong>
        </p>
      ) : null}
      {receipt.next_state ? <p className="ds-receipt__next">{receipt.next_state}</p> : null}
      {receipt.receipt_id ? <p className="ds-mono ds-receipt__id">action_id: {receipt.receipt_id}</p> : null}
      {receipt.written_to ? <p className="ds-mono ds-receipt__path">{receipt.written_to}</p> : null}
    </div>
  );
}

function OperatorIntentCard({ intent }: { intent: OperatorIntent }) {
  return (
    <div className="ds-intent" aria-label="Operator intent">
      <p className="ds-intent__label">OperatorIntent</p>
      <dl className="ds-intent__dl">
        <div>
          <dt>Kind</dt>
          <dd>{intent.kind}</dd>
        </div>
        {intent.parsed_command ? (
          <div>
            <dt>Command</dt>
            <dd>{intent.parsed_command}</dd>
          </div>
        ) : null}
        <div>
          <dt>Summary</dt>
          <dd>{intent.summary}</dd>
        </div>
      </dl>
    </div>
  );
}

function PetraTransportReceipt({ envelope }: { envelope: PetraTransportEnvelope }) {
  const statusClass = envelope.delivery_confirmed
    ? "fm-petra-receipt--confirmed"
    : envelope.delivery_status === "failed"
      ? "fm-petra-receipt--failed"
      : "fm-petra-receipt--attempted";

  return (
    <div className={`fm-petra-receipt ${statusClass}`} aria-label="Petra transport receipt">
      <p className="fm-petra-receipt__label">Petra transport</p>
      <p className="fm-petra-receipt__status">{envelope.delivery_status.replace(/_/g, " ")}</p>
      {envelope.failure_reason ? <p className="fm-petra-receipt__fail">{envelope.failure_reason}</p> : null}
    </div>
  );
}

function ChatEntry({ entry }: { entry: OperatorChatEntry }) {
  if (entry.entry_type === "operator_intent") {
    return <OperatorIntentCard intent={entry.intent} />;
  }

  const { message } = entry;
  return (
    <div className={`ds-chat__msg ds-chat__msg--${message.role}`}>
      <span className="ds-chat__role">{message.role === "operator" ? "Ben" : "System"}</span>
      <p>{message.text}</p>
    </div>
  );
}

function busyLabelFor(slot: DecisionButton): string {
  if (slot.id === "yea") return "Sending…";
  if (slot.id === "nay") return "Declining…";
  if (slot.route_owner) return `Routing to ${slot.route_owner}…`;
  return `${slot.label}…`;
}

function buttonVariant(slot: DecisionButton): string {
  switch (slot.id) {
    case "yea":
      return "fm-btn--yea";
    case "nay":
      return "fm-btn--nay";
    case "needs_research":
      return "fm-btn--research";
    case "kill_test":
      return "fm-btn--kill";
    case "human_reality":
      return "fm-btn--ender";
    default:
      return "fm-btn--neutral";
  }
}

function FrontierButton({
  slot,
  busy,
  activeAction,
  onClick
}: {
  slot: DecisionButton;
  busy: boolean;
  activeAction: string | null;
  onClick: () => void;
}) {
  const variant = buttonVariant(slot);
  const isActive = busy && activeAction === slot.id;
  const disabled = busy || !slot.enabled;

  return (
    <button
      type="button"
      className={`fm-btn ${variant} ${isActive ? "fm-btn--active" : ""} ${!slot.enabled ? "fm-btn--protocol-off" : ""}`}
      disabled={disabled}
      title={slot.reason_disabled ?? (slot.route_owner ? `Routes to ${slot.route_owner}` : undefined)}
      onClick={onClick}
    >
      {isActive ? busyLabelFor(slot) : slot.label}
    </button>
  );
}

function TierPanel({
  summary,
  children,
  defaultOpen = false,
  open
}: {
  summary: string;
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
}) {
  return (
    <details className="fm-tier" open={open ?? defaultOpen}>
      <summary>{summary}</summary>
      <div className="fm-tier__body">{children}</div>
    </details>
  );
}

export function DecisionSurface({ initialView, homeView = null }: DecisionSurfaceProps) {
  const isHome = Boolean(homeView);
  const [view, setView] = useState(initialView);
  const [busy, setBusy] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [receiptSearch, setReceiptSearch] = useState("");
  const [fleet, setFleet] = useState(homeView?.fleet ?? []);
  const [fleetStateLoaded, setFleetStateLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(
    initialView.payload.updated_at ?? initialView.payload.generated_at
  );
  const [chatSubmitting, setChatSubmitting] = useState(false);
  const payload = view.payload;
  const [receipt, setReceipt] = useState<DecisionReceipt>(payload.decision_receipt);
  const [chatInput, setChatInput] = useState("");
  const [chatEntries, setChatEntries] = useState<OperatorChatEntry[]>(payload.operator_chat.entries);
  const [petraReceipt, setPetraReceipt] = useState<PetraTransportEnvelope | null>(null);
  const [inspectedId, setInspectedId] = useState<string | null>(null);
  const [overrideReceipt, setOverrideReceipt] = useState<string | null>(null);
  const [queueBusy, setQueueBusy] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [leavePointOpen, setLeavePointOpen] = useState(false);
  const [leavePoints, setLeavePoints] = useState<LeavePointEntry[]>([]);
  const [yeaPendingConfirm, setYeaPendingConfirm] = useState(false);
  const [mockFailureMode, setMockFailureMode] = useState<MockTestFailureMode>("success");
  const [lastMockTest, setLastMockTest] = useState<MockTestResult | null>(() => loadLastMockTest());
  const [sessionReceipts, setSessionReceipts] = useState<ReceiptCenterEntry[]>([]);
  const [clientMockReceipts, setClientMockReceipts] = useState<ReceiptCenterEntry[]>([]);
  const [overlayLifecycle, setOverlayLifecycle] = useState<ActionLifecycle | null>(null);
  const [dispatchStatus, setDispatchStatus] = useState<DispatchStatus>({
    label: "Idle",
    detail: null,
    tone: "idle"
  });
  const [salvoSlots, setSalvoSlots] = useState<SalvoSlot[]>([]);
  const [reactions, setReactions] = useState<ReactionEntry[]>([]);
  const [optionBoardStates, setOptionBoardStates] = useState<Record<string, OptionBoardState>>({});
  const knownReceiptKeysRef = useRef<Set<string>>(new Set());
  const mobileHandReasonRef = useRef("");
  const operatorBarInputRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const queueSectionRef = useRef<HTMLElement>(null);
  const gateSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isHome) setLeavePoints(loadLeavePoints());
    setClientMockReceipts(loadClientMockReceipts());
    if (homeView?.fleet?.some((m) => m.fleet_source === "fleet_state")) {
      setFleetStateLoaded(true);
    }
  }, [isHome, homeView?.fleet]);

  useEffect(() => {
    if (!isHome) return;
    if (window.matchMedia("(max-width: 640px)").matches) setCommandOpen(true);
  }, [isHome]);

  const dataLive = view.data_source === "dink";
  const unavailable = view.data_source === "unavailable";
  const mockMode = view.data_source === "mock";

  const queue = payload.queue_items ?? payload.frontier_queue ?? [];
  const frontierOverride = payload.frontier_override ?? null;
  const proposal = payload.proposal;
  const frontier = payload.frontier ?? null;
  const machineFrontier = payload.machine_frontier ?? null;
  const top3Alternatives = payload.top_3_alternatives ?? [];
  const machineWhy = payload.machine_why_number_one ?? frontierOverride?.machine_why_number_one ?? null;

  const applyView = useCallback((next: DecisionSurfaceView) => {
    setView(next);
    setReceipt(next.payload.decision_receipt);
    setChatEntries(next.payload.operator_chat.entries);
    setLastRefresh(next.payload.updated_at ?? next.payload.generated_at);
    if (isHome) {
      setFleet((prev) => patchFleetWithDecisionView(prev, next));
    }
  }, [isHome]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/soledash/v1/state?mode=decision", { cache: "no-store" });
      const data = await res.json();
      if (data.ok && data.decisionView) {
        applyView(data.decisionView);
      }
      if (data.ok && Array.isArray(data.homeFleet)) {
        setFleet(data.homeFleet);
        setFleetStateLoaded(Boolean(data.fleetStateLoaded));
      }
    } finally {
      setRefreshing(false);
    }
  }, [applyView]);

  useEffect(() => {
    const timer = setInterval(() => {
      void refresh();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  function runQueueAction(proposalId: string) {
    if (unavailable || !frontierOverride) return;

    setQueueBusy(true);
    setOverrideReceipt(null);

    void (async () => {
      try {
        const res = await fetch("/api/soledash/v1/decision-surface/queue-override", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "make_frontier" as QueueOverrideAction,
            proposal_id: proposalId,
            queue,
            frontier_override: frontierOverride
          })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error ?? `Queue override failed (${res.status})`);
        }
        setOverrideReceipt(data.message ?? "Override submitted — refresh for Dink file state.");
        setInspectedId(null);
        await refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Queue override failed.";
        setOverrideReceipt(msg);
      } finally {
        setQueueBusy(false);
      }
    })();
  }

  function handleInspect(proposalId: string) {
    setInspectedId((prev) => (prev === proposalId ? null : proposalId));
  }

  const receiptEntries = payload.receipt_center ?? [];
  const mergedReceipts = mergeMockReceipts(receiptEntries, clientMockReceipts, sessionReceipts);

  const actionLifecycle = overlayLifecycle ?? payload.action_lifecycle ?? idleLifecycle();
  const realityMode = view.reality_mode ?? (mockMode ? "MOCK" : dataLive ? "LIVE" : "PARTIAL LIVE");
  const showMockTestMode = mockMode || realityMode !== "LIVE" || unavailable;

  function runMockTestRoute(
    route: MockTestRoute,
    actionOverride?: string | null,
    pivotId?: string | null
  ) {
    const proposalId = proposal?.id ?? payload.proposal?.id ?? "mock_proposal";
    const actionCode = proposal?.action_code ?? frontier?.action_code ?? null;
    const frontierTitle = proposal?.title ?? frontier?.title ?? null;

    flushSync(() => {
      setBusy(true);
      if (actionOverride) setActiveAction(actionOverride);
      else setActiveAction(route);
    });

    void (async () => {
      try {
        await executeMockTest({
          route,
          proposalId,
          failureMode: mockFailureMode,
          actionCode,
          frontierTitle,
          actionOverride: actionOverride ?? null,
          onLifecycle: setOverlayLifecycle,
          onReceipt: (entry) => setSessionReceipts((prev) => upsertSessionReceipt(prev, entry)),
          onResult: (result) => {
            setLastMockTest(result);
            saveLastMockTest(result);
          },
          onDecisionReceipt: setReceipt
        });
        if (route === "hands_gate") {
          setGateOpen(true);
          gateSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        setTimeout(() => void refresh(), 600);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Mock test failed.";
        setOverrideReceipt(msg);
      } finally {
        setBusy(false);
        setActiveAction(null);
        setYeaPendingConfirm(false);
      }
    })();
  }

  function logOperatorHandNote(action: string, note: string) {
    const text = note.trim();
    if (!text) return;
    const at = new Date().toISOString();
    setChatEntries((prev) => [
      ...prev,
      {
        entry_type: "message",
        message: { role: "operator", text: `${action.replace(/_/g, " ").toUpperCase()}: ${text}`, at }
      }
    ]);
    setDispatchStatus({
      label: `${action.replace(/_/g, " ").toUpperCase()} noted`,
      detail: text,
      tone: "warn"
    });
  }

  function runAction(action: string, _routeOwner: string | null = null, operatorNote?: string) {
    if (operatorNote?.trim()) logOperatorHandNote(action, operatorNote);

    if (action === "more_info") {
      setWhyOpen(true);
      return;
    }

    const mapped = routeForAction(action);
    if (mapped) {
      runMockTestRoute(
        mapped,
        action === "yea" || action === "nay" ? action : null,
        action
      );
      return;
    }

    runMockTestRoute("continue", action, action);
  }

  function openCommand() {
    setCommandOpen(true);
    setLeavePointOpen(false);
  }

  function requestReturnToPorch() {
    setLeavePointOpen(true);
  }

  function finishLeavePoint(reason: LeavePointReason, note: string) {
    const next = saveLeavePoint(reason, note);
    setLeavePoints(next);
    setLeavePointOpen(false);
    setCommandOpen(false);
    setYeaPendingConfirm(false);
  }

  function skipLeavePoint() {
    setLeavePointOpen(false);
    setCommandOpen(false);
    setYeaPendingConfirm(false);
  }

  function focusOperatorBar() {
    if (!commandOpen) openCommand();
    setTimeout(() => operatorBarInputRef.current?.focus(), 80);
  }

  async function dispatchPacketToCousin(
    cousin: OperatorCousinTarget,
    text: string
  ): Promise<{ ok: boolean; detail: string; tone: "ok" | "warn" | "bad" }> {
    if (!text.trim()) {
      return { ok: false, detail: "Empty packet text", tone: "bad" };
    }

    if (showMockTestMode) {
      runMockTestRoute("send_to_petra", null, cousin.toLowerCase());
      return { ok: true, detail: `${cousin} · simulated transport`, tone: "warn" };
    }

    const res = await fetch("/api/soledash/v1/cousin-dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, cousin })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return {
        ok: false,
        detail: data.message ?? data.error ?? "Dispatch blocked",
        tone: "bad"
      };
    }
    return {
      ok: true,
      detail: data.build?.outboxFilename ?? data.message ?? "Dispatched",
      tone: "ok"
    };
  }

  function upsertSalvoSlot(slot: SalvoSlot) {
    setSalvoSlots((prev) => {
      const rest = prev.filter((s) => s.id !== slot.id);
      return [slot, ...rest].slice(0, 12);
    });
  }

  function pushReaction(headline: string, detail: string, tone: ReactionEntry["tone"], source: ReactionEntry["source"]) {
    setReactions((prev) => [
      {
        id: `rx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        at: new Date().toISOString(),
        headline,
        detail,
        tone,
        source
      },
      ...prev
    ].slice(0, 12));
  }

  async function executeOptionVerb(
    option: CompanyOption,
    verb: OptionVerb,
    target: OperatorCousinTarget
  ): Promise<{ ok: boolean; detail: string; tone: "ok" | "warn" | "bad" }> {
    if (verb === "hold") {
      return { ok: true, detail: "Held — no dispatch", tone: "ok" };
    }

    if (verb === "make_frontier") {
      const proposalId = option.id.replace(/^queue:/, "");
      if (!proposalId.startsWith("prop_")) {
        return { ok: false, detail: "Invalid queue option", tone: "bad" };
      }
      runQueueAction(proposalId);
      return { ok: true, detail: "Queue override submitted", tone: "ok" };
    }

    if (verb === "dispatch") {
      const text = optionMissionText(option, chatInput);
      const result = await dispatchPacketToCousin(target, text);
      if (result.ok) setChatInput("");
      return result;
    }

    if (verb === "yea") {
      if (yeaPendingConfirm) {
        return { ok: false, detail: "YEA confirm already open", tone: "bad" };
      }
      handleGuardedYea();
      return { ok: true, detail: "YEA confirm armed", tone: "warn" };
    }

    const actionId =
      verb === "nay" ||
      verb === "needs_research" ||
      verb === "kill_test" ||
      verb === "human_reality"
        ? verb
        : null;
    if (actionId) {
      runAction(actionId);
      return { ok: true, detail: `${actionId} lifecycle started`, tone: "warn" };
    }

    return { ok: false, detail: `Unknown verb ${verb}`, tone: "bad" };
  }

  function markOptionBoard(
    option: CompanyOption,
    verb: OptionVerb,
    result: { ok: boolean; detail: string; tone: "ok" | "warn" | "bad" }
  ) {
    const lifecycle = lifecycleFromVerbResult(verb, result.ok, result.tone);
    setOptionBoardStates((prev) => {
      const next = { ...prev };
      next[option.id] = {
        lifecycle,
        expectedResult: option.expectedResult,
        actualResult: result.detail,
        firedVerb: verb,
        firedAt: new Date().toISOString(),
        dimmedReason: null
      };

      if (verb === "hold") {
        next[option.id].actualResult = "Held — option stays on board";
        next[option.id].lifecycle = "proposed";
      }

      if ((verb === "yea" || verb === "make_frontier") && result.ok) {
        for (const compId of option.conflictsWith) {
          const existing = next[compId];
          if (existing && existing.lifecycle !== "proposed") continue;
          next[compId] = {
            lifecycle: "escaped",
            expectedResult: existing?.expectedResult ?? "Competing option",
            actualResult: `Deferred — ${option.code} fired first`,
            firedVerb: null,
            firedAt: null,
            dimmedReason: option.conflictHints[0] ?? `Choosing ${option.code} changed this option's odds`
          };
        }
      }

      if (verb === "kill_test" && result.ok) {
        next[option.id].lifecycle = "exploded";
        next[option.id].actualResult = result.detail;
      }

      return next;
    });
  }

  async function fireOption(option: CompanyOption, verb: OptionVerb, target: OperatorCousinTarget) {
    const slotId = `salvo_${Date.now()}_${option.id}`;
    upsertSalvoSlot({
      id: slotId,
      optionId: option.id,
      optionTitle: option.title,
      verb,
      target,
      phase: "firing",
      detail: null,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      receiptHint: null
    });
    setBusy(true);
    setDispatchStatus({ label: `Firing ${verb}…`, detail: option.title, tone: "busy" });

    try {
      const result = await executeOptionVerb(option, verb, target);
      markOptionBoard(option, verb, result);
      upsertSalvoSlot({
        id: slotId,
        optionId: option.id,
        optionTitle: option.title,
        verb,
        target,
        phase: result.ok ? (result.tone === "warn" ? "warn" : "ok") : "failed",
        detail: result.detail,
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        receiptHint: null
      });
      pushReaction(
        result.ok ? `${verbLabelFromVerb(verb)} · ${option.code}` : `Failed · ${option.code}`,
        result.detail,
        result.tone === "bad" ? "bad" : result.tone === "warn" ? "warn" : "ok",
        "salvo"
      );
      setDispatchStatus({
        label: result.ok ? "Option fired" : "Option blocked",
        detail: result.detail,
        tone: result.tone === "bad" ? "bad" : result.tone === "warn" ? "warn" : "ok"
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function fireSalvo(options: CompanyOption[], verb: OptionVerb, target: OperatorCousinTarget) {
    if (!options.length) return;
    const gate = salvoAllowed(
      options,
      buildCompanyOptions({
        queue,
        proposal,
        routeButtons: mergeRouteButtons(
          payload.decision.buttons.filter((b) => b.id !== "defer"),
          unavailable
        ),
        unavailable,
        rationale: payload.rationale ?? null,
        machineFrontierTitle: machineFrontier?.title ?? null
      })
    );
    if (!gate.allowed) {
      pushReaction("Salvo blocked", gate.reason ?? "Conflicting selection", "bad", "salvo");
      setDispatchStatus({ label: "Salvo blocked", detail: gate.reason, tone: "bad" });
      return;
    }
    setBusy(true);
    setDispatchStatus({
      label: `Salvo ×${options.length}`,
      detail: `${verb} → ${target}`,
      tone: "busy"
    });

    for (const option of options) {
      const slotId = `salvo_${Date.now()}_${option.id}`;
      upsertSalvoSlot({
        id: slotId,
        optionId: option.id,
        optionTitle: option.title,
        verb,
        target,
        phase: "queued",
        detail: null,
        startedAt: new Date().toISOString(),
        finishedAt: null,
        receiptHint: null
      });

      upsertSalvoSlot({
        id: slotId,
        optionId: option.id,
        optionTitle: option.title,
        verb,
        target,
        phase: "firing",
        detail: null,
        startedAt: new Date().toISOString(),
        finishedAt: null,
        receiptHint: null
      });

      const result = await executeOptionVerb(option, verb, target);
      markOptionBoard(option, verb, result);
      upsertSalvoSlot({
        id: slotId,
        optionId: option.id,
        optionTitle: option.title,
        verb,
        target,
        phase: result.ok ? (result.tone === "warn" ? "warn" : "ok") : "failed",
        detail: result.detail,
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        receiptHint: null
      });
      pushReaction(
        `${verbLabelFromVerb(verb)} · ${option.code}`,
        result.detail,
        result.tone === "bad" ? "bad" : result.tone === "warn" ? "warn" : "ok",
        "salvo"
      );
    }

    setDispatchStatus({
      label: "Salvo complete",
      detail: `${options.length} plays to ${target}`,
      tone: "ok"
    });
    await refresh();
    setBusy(false);
  }

  function verbLabelFromVerb(verb: OptionVerb): string {
    switch (verb) {
      case "dispatch":
        return "Dispatch";
      case "make_frontier":
        return "Make frontier";
      case "yea":
        return "YEA";
      case "nay":
        return "NAY";
      case "needs_research":
        return "Research";
      case "kill_test":
        return "Kill test";
      case "human_reality":
        return "Human reality";
      default:
        return verb;
    }
  }

  async function sendToCousin(cousin: OperatorCousinTarget) {
    const text = chatInput.trim();
    if (!text) return;

    setBusy(true);
    setDispatchStatus({ label: `Sending to ${cousin}…`, detail: null, tone: "busy" });

    try {
      const result = await dispatchPacketToCousin(cousin, text);
      if (result.ok) setChatInput("");
      setDispatchStatus({
        label: result.ok ? `Sent to ${cousin}` : "Dispatch blocked",
        detail: result.detail,
        tone: result.tone
      });
      if (result.ok) await refresh();
    } catch (err) {
      setDispatchStatus({
        label: "Dispatch failed",
        detail: err instanceof Error ? err.message : "Network error",
        tone: "bad"
      });
    } finally {
      setBusy(false);
    }
  }

  function handleGuardedYea(reason?: string) {
    if (reason !== undefined) mobileHandReasonRef.current = reason;
    setYeaPendingConfirm(true);
  }

  function handleYeaConfirm() {
    setYeaPendingConfirm(false);
    const note = mobileHandReasonRef.current;
    mobileHandReasonRef.current = "";
    runAction("yea", null, note);
  }

  async function sendToPetra() {
    const text = chatInput.trim();
    if (!text) return;

    if (realityMode === "LIVE" && !mockMode && !showMockTestMode) {
      setBusy(true);
      setChatSubmitting(true);
      try {
        const res = await fetch("/api/soledash/v1/petra-transport", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ raw_text: text })
        });
        const data = await res.json();
        if (data.envelope) setPetraReceipt(data.envelope);
        setChatInput("");
        await refresh();
      } finally {
        setBusy(false);
        setChatSubmitting(false);
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }

    setChatInput(`Petra: ${text.slice(0, 80)}`);
    runMockTestRoute("send_to_petra", null, "send_to_petra");
  }

  async function sendChat() {
    const text = chatInput.trim();
    if (!text || unavailable) return;

    const at = new Date().toISOString();
    setChatEntries((prev) => [
      ...prev,
      { entry_type: "message", message: { role: "operator", text, at } }
    ]);
    setChatInput("");
    setBusy(true);
    setChatSubmitting(true);
    setDispatchStatus({ label: "Sending intent…", detail: null, tone: "busy" });

    try {
      const res = await fetch("/api/soledash/v1/decision-surface/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, proposal_id: proposal?.id ?? null })
      });
      const data = await res.json();
      if (data.entry) setChatEntries((prev) => [...prev, data.entry]);
      if (data.decision_receipt) setReceipt(data.decision_receipt);
      setDispatchStatus({
        label: "Intent logged",
        detail: data.decision_receipt?.outcome ?? "Chat transport complete",
        tone: "ok"
      });
      await refresh();
    } catch (err) {
      setDispatchStatus({
        label: "Chat failed",
        detail: err instanceof Error ? err.message : "Network error",
        tone: "bad"
      });
    } finally {
      setBusy(false);
      setChatSubmitting(false);
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }

  const decideButtons = payload.decision.buttons
    .filter((b) => b.id !== "defer")
    .filter((b) => b.id === "yea" || b.id === "nay");
  const routeButtons = mergeRouteButtons(
    payload.decision.buttons.filter((b) => b.id !== "defer"),
    unavailable
  );

  useEffect(() => {
    const keys = new Set(
      mergedReceipts.map((r) => r.receipt_link ?? `${r.action_id}:${r.last_update}:${r.target}`)
    );
    const prev = knownReceiptKeysRef.current;
    if (prev.size === 0) {
      knownReceiptKeysRef.current = keys;
      return;
    }
    const deckOptions = buildCompanyOptions({
      queue,
      proposal,
      routeButtons,
      unavailable,
      rationale: payload.rationale ?? null,
      machineFrontierTitle: machineFrontier?.title ?? null
    });
    for (const entry of mergedReceipts) {
      const key = entry.receipt_link ?? `${entry.action_id}:${entry.last_update}:${entry.target}`;
      if (!prev.has(key)) {
        setReactions((r) => [
          {
            id: `rx_${key}`,
            at: entry.last_update,
            headline: entry.status,
            detail: entry.target,
            tone: entry.simulated || entry.mock ? "warn" : "ok",
            source: "receipt"
          },
          ...r
        ].slice(0, 12));

        setOptionBoardStates((states) => {
          const next = { ...states };
          for (const opt of deckOptions) {
            if (!receiptMatchesOption(entry, opt.code, opt.title)) continue;
            const prevBoard = next[opt.id];
            const verb = prevBoard?.firedVerb ?? null;
            next[opt.id] = {
              lifecycle: lifecycleFromReceipt(entry, verb),
              expectedResult: prevBoard?.expectedResult ?? opt.expectedResult,
              actualResult: `${entry.status} · ${entry.target}${entry.simulated ? " (sim)" : ""}`,
              firedVerb: verb,
              firedAt: prevBoard?.firedAt ?? entry.last_update,
              dimmedReason: prevBoard?.dimmedReason ?? null
            };
          }
          return next;
        });
      }
    }
    knownReceiptKeysRef.current = keys;
  }, [mergedReceipts, queue, proposal, routeButtons, unavailable, payload.rationale, machineFrontier?.title]);

  const frontierSource: QueueRankSource =
    frontierOverride?.queue_badge ??
    (frontier?.rank_source as QueueRankSource | undefined) ??
    (machineFrontier && frontier && machineFrontier.proposal_id !== frontier.proposal_id
      ? "MIXED"
      : "MACHINE");
  const filteredReceipts = filterReceiptEntries(mergedReceipts, receiptSearch);
  const inspectedItem = queue.find((q) => q.proposal_id === inspectedId) ?? null;
  const churnPreview = payload.current_churn.summary.slice(0, 72);
  const blocker = payload.current_blocker ?? {
    headline: unavailable ? "LIVE PAYLOAD UNAVAILABLE" : "No current_blocker slot in payload",
    detail: view.load_error ?? null,
    mock: mockMode
  };

  const posture = postureLine(payload.thread_health);
  const hasBlocker =
    Boolean(blocker.headline && !blocker.headline.includes("No current_blocker")) ||
    payload.thread_health.status.toLowerCase().includes("block");

  function countWaitingHumanGates(): { count: number; hint: string | null } {
    const gate = payload.human_gate;
    const cls = gate.classification.toLowerCase();
    const waiting =
      Boolean(gate.transport_gap) ||
      cls.includes("human_gate") ||
      cls.includes("red") ||
      cls.includes("waiting") ||
      cls.includes("stop");
    if (waiting) {
      return { count: 1, hint: gate.operator_line ?? gate.operator_prompt };
    }
    return { count: 0, hint: gate.operator_line };
  }

  const waitingGates = countWaitingHumanGates();
  const operatorFrontierCode = frontier?.action_code ?? proposal?.action_code ?? "—";
  const operatorFrontierTitle = frontier?.title ?? proposal?.title ?? "No frontier";
  const chatDisabled = unavailable;
  const chatDisabledReason = unavailable ? "Live payload unavailable" : null;

  const optionsDeckProps = {
    queue,
    proposal,
    routeButtons,
    unavailable,
    chatDraft: chatInput,
    pollSeconds: POLL_MS / 1000,
    lastRefresh,
    salvoSlots,
    reactions,
    boardStates: optionBoardStates,
    rationale: payload.rationale ?? null,
    machineFrontierTitle: machineFrontier?.title ?? null,
    busy,
    onFireOption: (option: CompanyOption, verb: OptionVerb, target: OperatorCousinTarget) =>
      void fireOption(option, verb, target),
    onFireSalvo: (options: CompanyOption[], verb: OptionVerb, target: OperatorCousinTarget) =>
      void fireSalvo(options, verb, target)
  };

  return (
    <div className={`fm-root ${isHome ? "mw-home mw-ambient-command mw-with-operator-bar" : ""}`}>
      {!isHome ? (
        <CurrentRealityBanner
          mode={realityMode}
          detail={realityModeDetail(realityMode, payload)}
        />
      ) : null}

      {isHome && homeView ? (
        <div className="mw-shell">
          {leavePointOpen ? (
            <LeavePointTracker
              open
              onSubmit={finishLeavePoint}
              onSkip={skipLeavePoint}
            />
          ) : !commandOpen ? (
            <>
              <AmbientLayer
                mission={homeView.current_mission}
                realityMode={realityMode}
                proposal={proposal}
                frontier={frontier}
                fleet={fleet.length ? fleet : homeView.fleet}
                receiptCount={mergedReceipts.length}
                queueCount={queue.length}
                hasBlocker={hasBlocker}
                blockerHeadline={hasBlocker ? blocker.headline : null}
                postureTone={posture.tone}
                onOpenCommand={openCommand}
                leavePoints={leavePoints}
                refreshing={refreshing}
                onRefresh={() => void refresh()}
              />
              <div className="sd-mobile-hide">
                <OptionsDeck compact {...optionsDeckProps} />
              </div>
            </>
          ) : (
            <CommandLayerShell onReturnToPorch={requestReturnToPorch}>
              {showMockTestMode ? <MockTestBanner show /> : null}

              <div className="sd-mobile-only">
                <MobileFrontierPanel
                  frontierCode={operatorFrontierCode}
                  frontierTitle={operatorFrontierTitle}
                  proposalSummary={proposal?.summary ?? null}
                  waitingGatesCount={waitingGates.count}
                  waitingGatesHint={waitingGates.hint}
                  blockerHeadline={hasBlocker ? blocker.headline : null}
                  humanGate={payload.human_gate}
                  reactions={reactions}
                />

                <MobileHandsPanel
                  humanGate={payload.human_gate}
                  busy={busy}
                  activeAction={activeAction}
                  yeaPendingConfirm={yeaPendingConfirm}
                  routeButtons={routeButtons}
                  unavailable={unavailable}
                  onApprove={(reason) => handleGuardedYea(reason)}
                  onReject={(reason) => runAction("nay", null, reason)}
                  onNeedsResearch={(reason) => runAction("needs_research", null, reason)}
                  onKillTest={(reason) => runAction("kill_test", null, reason)}
                  onYeaConfirm={(reason) => {
                    mobileHandReasonRef.current = reason;
                    handleYeaConfirm();
                  }}
                  onYeaCancel={() => {
                    mobileHandReasonRef.current = "";
                    setYeaPendingConfirm(false);
                  }}
                />
              </div>

              <div className="sd-mobile-hide">
                <FleetRow
                  fleet={fleet.length ? fleet : homeView.fleet}
                  fleetStateLoaded={fleetStateLoaded}
                />
              </div>

              {unavailable ? (
                <section className="fm-unavailable" aria-label="Live payload unavailable">
                  <h2 className="fm-unavailable__title">LIVE PAYLOAD UNAVAILABLE</h2>
                  <p className="fm-unavailable__detail">{view.load_error ?? payload.human_gate.detail}</p>
                </section>
              ) : null}

              <div className="sd-mobile-hide">
                <CurrentBlockerPanel blocker={blocker} dataLive={dataLive && !unavailable} />
              </div>

              <AutomaticaRelayGrid onRefresh={refresh} />

              <div className="sd-mobile-only">
                <MobileReceiptList entries={mergedReceipts} />
              </div>

              <div className="sd-mobile-hide">
                <OptionsDeck {...optionsDeckProps} />
              </div>

              <section className="fm-frontier fm-frontier--command sd-mobile-hide" aria-label="Single frontier">
                <div className="fm-frontier__head">
                  <p className="fm-frontier__label">Frontier</p>
                  <HonestyBadge live={dataLive && !unavailable} compact />
                  <span className={`sd-cmd-reality sd-cmd-reality--${realityMode.toLowerCase().replace(/\s+/g, "-")}`}>
                    {realityMode}
                  </span>
                </div>
                {proposal && !unavailable ? (
                  <>
                    {proposal.action_code ? (
                      <p className="fm-frontier__code">{proposal.action_code}</p>
                    ) : null}
                    <h1 className="fm-frontier__title">{proposal.title}</h1>
                    <EvidenceStatusLine status={proposal.evidence_status} />
                    <p className="fm-frontier__ask">{proposal.summary}</p>
                    <CommandActionsPanel
                      busy={busy}
                      activeAction={activeAction}
                      yeaPendingConfirm={yeaPendingConfirm}
                      routeButtons={routeButtons}
                      unavailable={unavailable}
                      onYeaClick={handleGuardedYea}
                      onYeaConfirm={handleYeaConfirm}
                      onYeaCancel={() => setYeaPendingConfirm(false)}
                      onNay={() => runAction("nay")}
                      onRouteAction={(actionId) => runAction(actionId)}
                      onSendPacket={focusOperatorBar}
                    />
                    <CompactReceiptRail
                      entries={mergedReceipts}
                      lifecycle={actionLifecycle}
                      receipt={receipt}
                    />
                    <ActionStatusRail lifecycle={actionLifecycle} />
                  </>
                ) : (
                  <p className="fm-frontier__idle">No frontier — use queue panel below to pick one.</p>
                )}
              </section>

              <div className="sd-mobile-hide">
                <ReceiptSearchBar
                  value={receiptSearch}
                  onChange={setReceiptSearch}
                  resultCount={filteredReceipts.length}
                  totalCount={mergedReceipts.length}
                />

                <ReceiptCenterPanel
                  entries={filteredReceipts}
                  dataLive={dataLive}
                  unavailable={unavailable}
                />

                {!unavailable ? (
                  <FrontierComparisonPanel
                    operatorFrontier={frontier}
                    machineFrontier={machineFrontier}
                    source={frontierSource}
                    dataLive={dataLive}
                  />
                ) : null}

                {!unavailable ? (
                  <QueueVisibilityPanel
                    frontier={frontier}
                    machineFrontier={machineFrontier}
                    top3Alternatives={top3Alternatives}
                    machineWhyNumberOne={machineWhy}
                    dataLive={dataLive}
                  />
                ) : null}

                {queue.length > 0 && !unavailable ? (
                  <section ref={queueSectionRef} className="mw-queue-anchor">
                    <QueueOverridePanel
                      items={queue}
                      activeId={proposal?.id ?? null}
                      busy={queueBusy || busy}
                      inspectedId={inspectedId}
                      dataLive={dataLive}
                      onInspect={handleInspect}
                      onMakeFrontier={runQueueAction}
                    />
                    {overrideReceipt ? (
                      <p className="fm-rank__receipt fm-rank__receipt--standalone">{overrideReceipt}</p>
                    ) : null}
                    {inspectedItem ? (
                      <InspectDetail item={inspectedItem} rationale={payload.rationale} dataLive={dataLive} />
                    ) : null}
                  </section>
                ) : null}

                <section className="mw-chat" aria-label="Operator chat log">
                  <h2 className="mw-chat__heading">Operator Chat</h2>
                  <p className="mw-chat__bar-hint">Compose in the operator bar below — this panel shows receipts.</p>
                  <div className="mw-chat__log ds-chat__log">
                    {chatEntries.length === 0 && !petraReceipt ? (
                      <p className="ds-muted ds-chat__empty">No chat entries yet.</p>
                    ) : (
                      chatEntries.map((entry, i) => <ChatEntry key={i} entry={entry} />)
                    )}
                    {petraReceipt ? <PetraTransportReceipt envelope={petraReceipt} /> : null}
                    <div ref={chatEndRef} />
                  </div>
                </section>

                <nav className="fm-tiers fm-tiers--command" aria-label="Second-tier panels">
                  {showMockTestMode ? (
                    <TierPanel summary="Mock test harness (dev only)">
                      <MockTestHarness
                        busy={busy}
                        failureMode={mockFailureMode}
                        onFailureModeChange={setMockFailureMode}
                        lastResult={lastMockTest}
                        onRunTest={(route) => runMockTestRoute(route, null, route)}
                      />
                    </TierPanel>
                  ) : null}
                  <TierPanel summary={`Churn — ${churnPreview}${payload.current_churn.summary.length > 72 ? "…" : ""}`}>
                    <dl className="fm-dl">
                      <div>
                        <dt>Current churn</dt>
                        <dd>{payload.current_churn.summary}</dd>
                      </div>
                    </dl>
                  </TierPanel>
                  <section ref={gateSectionRef} className="mw-gate-anchor">
                    <TierPanel summary="Gate detail" defaultOpen={gateOpen}>
                      <HumanGateDetail gate={payload.human_gate} />
                    </TierPanel>
                  </section>
                </nav>
              </div>
            </CommandLayerShell>
          )}

        </div>
      ) : (
        <>
          <MockTestBanner show={showMockTestMode} />
          <MockTestHarness
            busy={busy}
            failureMode={mockFailureMode}
            onFailureModeChange={setMockFailureMode}
            lastResult={lastMockTest}
            onRunTest={(route) => runMockTestRoute(route, null, route)}
          />
          <MissionPosture
            view={view}
            lastRefresh={lastRefresh}
            refreshing={refreshing}
            onRefresh={() => void refresh()}
          />

          {unavailable ? (
            <section className="fm-unavailable" aria-label="Live payload unavailable">
              <h2 className="fm-unavailable__title">LIVE PAYLOAD UNAVAILABLE</h2>
              <p className="fm-unavailable__detail">{view.load_error ?? payload.human_gate.detail}</p>
              <p className="fm-unavailable__hint">
                Expected: foreman/soledash/DECISION_SURFACE.json with live_transport contract, plus
                receipts/ and actions/ directories.
              </p>
            </section>
          ) : null}

          <CurrentBlockerPanel blocker={blocker} dataLive={dataLive && !unavailable} />

          <ReceiptCenterPanel
            entries={mergedReceipts}
            dataLive={dataLive}
            unavailable={unavailable}
          />

          {!unavailable ? (
            <FrontierComparisonPanel
              operatorFrontier={frontier}
              machineFrontier={machineFrontier}
              source={frontierSource}
              dataLive={dataLive}
            />
          ) : null}

          {!unavailable ? (
            <QueueVisibilityPanel
              frontier={frontier}
              machineFrontier={machineFrontier}
              top3Alternatives={top3Alternatives}
              machineWhyNumberOne={machineWhy}
              dataLive={dataLive}
            />
          ) : null}

          {queue.length > 0 && !unavailable ? (
            <section ref={queueSectionRef} className="mw-queue-anchor">
              <QueueOverridePanel
                items={queue}
                activeId={proposal?.id ?? null}
                busy={queueBusy || busy}
                inspectedId={inspectedId}
                dataLive={dataLive}
                onInspect={handleInspect}
                onMakeFrontier={runQueueAction}
              />
              {overrideReceipt ? (
                <p className="fm-rank__receipt fm-rank__receipt--standalone">{overrideReceipt}</p>
              ) : null}
              {inspectedItem ? (
                <InspectDetail item={inspectedItem} rationale={payload.rationale} dataLive={dataLive} />
              ) : null}
            </section>
          ) : null}

          <section className="fm-frontier" aria-label="Single frontier">
            <div className="fm-frontier__head">
              <p className="fm-frontier__label">Frontier #1</p>
              <HonestyBadge live={dataLive && !unavailable} compact />
            </div>
            {proposal && !unavailable ? (
              <>
                {proposal.action_code ? (
                  <p className="fm-frontier__code">{proposal.action_code}</p>
                ) : null}
                <h1 className="fm-frontier__title">{proposal.title}</h1>
                <EvidenceStatusLine status={proposal.evidence_status} />
                <p className="fm-frontier__ask">{proposal.summary}</p>
                <p className="fm-frontier__gate-line">{payload.human_gate.operator_line}</p>
                <div className="fm-frontier__actions fm-frontier__actions--decide" aria-label="Decision buttons">
                  {decideButtons.map((slot) => (
                    <FrontierButton
                      key={slot.id}
                      slot={slot}
                      busy={busy}
                      activeAction={activeAction}
                      onClick={() => runAction(slot.id, slot.route_owner ?? null)}
                    />
                  ))}
                </div>
                {routeButtons.length > 0 ? (
                  <div className="fm-frontier__actions fm-frontier__actions--route" aria-label="Route buttons">
                    {routeButtons.map((slot) => (
                      <FrontierButton
                        key={slot.id}
                        slot={slot}
                        busy={busy}
                        activeAction={activeAction}
                        onClick={() => runAction(slot.id, slot.route_owner ?? null)}
                      />
                    ))}
                  </div>
                ) : null}
                {!routeButtons.some((b) => b.enabled) && !unavailable ? (
                  <p className="fm-frontier__route-hint">
                    Route buttons disabled — Dink must enable NEEDS RESEARCH, KILL TEST, or HUMAN REALITY in protocol.
                  </p>
                ) : null}
                <ActionStatusRail lifecycle={actionLifecycle} />
                <ReceiptBlock receipt={receipt} mock={actionLifecycle.mock ?? mockMode} />
                {payload.rationale ? (
                  <button type="button" className="fm-frontier__why-link" onClick={() => setWhyOpen(true)}>
                    Why this?
                  </button>
                ) : null}
              </>
            ) : (
              <p className="fm-frontier__idle">No frontier decision — Dink sets proposal null when idle.</p>
            )}
          </section>

          <section className="fm-command" aria-label="Operator command">
            <h2 className="fm-command__heading">Talk to the machine</h2>
            <p className="fm-command__hint">
              Send logs intent here. Send to Petra delivers to your ChatGPT tab. Try <strong>next</strong> to
              advance frontier.
            </p>
            <div className="ds-chat__log">
              {chatEntries.length === 0 && !petraReceipt ? (
                <p className="ds-muted ds-chat__empty">Say something — the interface responds with receipts.</p>
              ) : (
                chatEntries.map((entry, i) => <ChatEntry key={i} entry={entry} />)
              )}
              {petraReceipt ? <PetraTransportReceipt envelope={petraReceipt} /> : null}
              <div ref={chatEndRef} />
            </div>
            <div className="ds-chat__compose">
              <textarea
                className="ds-chat__input"
                rows={3}
                placeholder={payload.operator_chat.placeholder}
                value={chatInput}
                disabled={busy}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendChat();
                  }
                }}
              />
              <div className="fm-chat__actions">
                <button
                  type="button"
                  className="fm-btn fm-btn--accent"
                  disabled={busy || !chatInput.trim()}
                  onClick={() => void sendChat()}
                >
                  {chatSubmitting ? "Sending…" : "Send"}
                </button>
                <button
                  type="button"
                  className="fm-btn fm-btn--petra"
                  disabled={busy || !chatInput.trim()}
                  onClick={() => void sendToPetra()}
                >
                  {chatSubmitting ? "Delivering…" : "Send to Petra"}
                </button>
              </div>
            </div>
          </section>

          <nav className="fm-tiers" aria-label="Second-tier panels">
            <TierPanel summary={`Churn — ${churnPreview}${payload.current_churn.summary.length > 72 ? "…" : ""}`}>
              <dl className="fm-dl">
                <div>
                  <dt>Current churn</dt>
                  <dd>{payload.current_churn.summary}</dd>
                </div>
                <div>
                  <dt>Current threat</dt>
                  <dd>{payload.current_churn.current_threat}</dd>
                </div>
                <div>
                  <dt>Next after this</dt>
                  <dd>{payload.current_churn.next_decision}</dd>
                </div>
              </dl>
              <dl className="fm-dl fm-dl--queue">
                <div>
                  <dt>Active owner</dt>
                  <dd>{payload.queue_brain.active_owner ?? "—"}</dd>
                </div>
                <div>
                  <dt>Waiting report</dt>
                  <dd>{payload.queue_brain.waiting_report ?? "—"}</dd>
                </div>
                <div>
                  <dt>Blocker</dt>
                  <dd>{payload.queue_brain.blocker ?? "—"}</dd>
                </div>
                <div>
                  <dt>Recommended next</dt>
                  <dd>{payload.queue_brain.recommended_next_action ?? "—"}</dd>
                </div>
              </dl>
            </TierPanel>

            <TierPanel summary={`Thread health — ${payload.thread_health.status}`}>
              <dl className="fm-dl">
                <div>
                  <dt>Status</dt>
                  <dd>{payload.thread_health.status}</dd>
                </div>
                {payload.thread_health.detail ? (
                  <div>
                    <dt>Detail</dt>
                    <dd>{payload.thread_health.detail}</dd>
                  </div>
                ) : null}
              </dl>
            </TierPanel>

            {payload.rationale ? (
              <details className="fm-tier" open={whyOpen}>
                <summary>Expand why</summary>
                <div className="fm-tier__body">
                  <ExpandWhyPanel rationale={payload.rationale} />
                </div>
              </details>
            ) : null}

            <section ref={gateSectionRef} className="mw-gate-anchor">
              <TierPanel summary="Gate detail" defaultOpen={gateOpen}>
                <HumanGateDetail gate={payload.human_gate} />
              </TierPanel>
            </section>

            {payload.throughput_log && payload.throughput_log.length > 0 ? (
              <TierPanel summary="Throughput">
                <ul className="ds-inst-list">
                  {payload.throughput_log.map((entry, i) => (
                    <li key={i}>
                      {entry.label} — {entry.detail}
                    </li>
                  ))}
                </ul>
              </TierPanel>
            ) : null}
          </nav>
        </>
      )}

      {isHome && homeView ? (
        <>
          <div className="sd-live-fire-anchor">
            <PetraEmptyLinkFire busy={busy || chatSubmitting} onRefresh={refresh} />
          </div>
          <OperatorBar
          frontierCode={operatorFrontierCode}
          frontierTitle={operatorFrontierTitle}
          waitingGatesCount={waitingGates.count}
          waitingGatesHint={waitingGates.hint}
          chatInput={chatInput}
          chatPlaceholder={payload.operator_chat.placeholder}
          chatDisabled={chatDisabled}
          chatDisabledReason={chatDisabledReason}
          busy={busy || chatSubmitting}
          dispatchStatus={dispatchStatus}
          inputRef={operatorBarInputRef}
          onChatInputChange={setChatInput}
          onSendChat={() => void sendChat()}
          onSendToCousin={(cousin) => void sendToCousin(cousin)}
          onOpenCommand={commandOpen ? undefined : openCommand}
        />
        </>
      ) : null}
    </div>
  );
}
