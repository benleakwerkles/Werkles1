"use client";

import { useEffect, useMemo, useState } from "react";

type JsonRecord = Record<string, unknown>;

type RelaySnapshot = {
  contract: JsonRecord | null;
  coverage: JsonRecord | null;
  originReturn: JsonRecord | null;
  threadBridge: JsonRecord | null;
  actionableReturns: JsonRecord | null;
  bookChapters: JsonRecord | null;
  bookCourier: JsonRecord | null;
};

type ActionResult = {
  label: string;
  endpoint: string;
  timestamp: string;
  ok: boolean;
  statusCode: number;
  result: JsonRecord | null;
  error?: string;
};

const emptySnapshot: RelaySnapshot = {
  contract: null,
  coverage: null,
  originReturn: null,
  threadBridge: null,
  actionableReturns: null,
  bookChapters: null,
  bookCourier: null
};

function valueAt(source: unknown, path: string[]) {
  let current = source;
  for (const key of path) {
    if (!current || typeof current !== "object" || !(key in current)) return null;
    current = (current as JsonRecord)[key];
  }
  return current;
}

function asText(value: unknown, fallback = "UNKNOWN") {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" ? (value as JsonRecord) : null;
}

function humanTargetName(target: string) {
  if (!target || target === "UNKNOWN_TARGET") return "Unknown receiver";
  return target.replace(".", "@");
}

function findReceiver(threadBridge: JsonRecord | null, target: string) {
  const targetThreads = asArray(valueAt(threadBridge, ["known_target_threads"]));
  const fromList = targetThreads.find((item) => asText(asRecord(item)?.target, "") === target);
  if (fromList) return asRecord(fromList);

  const knownTarget = valueAt(threadBridge, ["known_targets", target]);
  return asRecord(knownTarget);
}

function receiverTitle(threadBridge: JsonRecord | null, target: string) {
  const receiver = findReceiver(threadBridge, target);
  return asText(receiver?.title, humanTargetName(target));
}

function receiverSurface(receiver: JsonRecord | null) {
  const mode = asText(receiver?.relay_mode, "");
  const status = asText(receiver?.route_status, "");
  if (mode === "CODEX_THREAD_BRIDGE") return "Codex receiver thread";
  if (mode === "FILE_INBOX_LAN") return "LAN receiver inbox";
  if (mode === "DO_NOT_ROUTE" || status === "HELD_BY_TOPOLOGY") return "Held by routing rules";
  if (mode === "LOCAL_ONLY") return "Local control thread";
  return "Receiver surface";
}

function receiverInstruction(receiver: JsonRecord | null, target: string) {
  const title = asText(receiver?.title, humanTargetName(target));
  const mode = asText(receiver?.relay_mode, "");
  const inboxUrl = asText(receiver?.file_inbox_url, "");
  if (mode === "CODEX_THREAD_BRIDGE") {
    return `Continue directly in the Codex thread named "${title}". ThinkIt is showing the receipt that thread wrote back.`;
  }
  if (inboxUrl && inboxUrl !== "UNKNOWN") {
    return `Open the receiver inbox for ${humanTargetName(target)}. ThinkIt is waiting for that inbox to write back.`;
  }
  return "This return is file-backed. ThinkIt can show the proof, but no friendly receiver surface is linked yet.";
}

function humanLabel(value: unknown, fallback = "Review") {
  return asText(value, fallback).replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function humanizeTargetText(value: unknown, target: string, fallback: string) {
  return asText(value, fallback).replaceAll(target, humanTargetName(target));
}

const evidenceSectionKeys = new Set([
  "source_access",
  "editing_mode",
  "chapter_read",
  "what_works",
  "access_gaps",
  "continuity_issues",
  "developmental_edit",
  "risk_conflict",
  "recommended_next_edit"
]);

function clippedText(value: unknown, maxLength = 7000) {
  const text = asText(value, "");
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}\n\n[clipped for dashboard packet size; see receiver receipt for full text]`;
}

function parseEvidenceSections(value: unknown) {
  const sections: Record<string, string> = {};
  let currentKey = "";
  for (const line of asText(value, "").split(/\r?\n/)) {
    const match = line.match(/^([a-z_]+):\s*(.*)$/i);
    const key = match?.[1]?.toLowerCase() ?? "";
    if (key && evidenceSectionKeys.has(key)) {
      currentKey = key;
      sections[currentKey] = match?.[2]?.trim() ?? "";
      continue;
    }
    if (currentKey) {
      sections[currentKey] = `${sections[currentKey]}${sections[currentKey] ? "\n" : ""}${line}`.trim();
    }
  }
  return sections;
}

function returnedWorkHeadline(record: JsonRecord, target: string) {
  const channel = asText(record.channel, "");
  const advancement = asText(record.advancement_type, "");
  const packet = asText(record.packet_id, "");
  const receiver = humanTargetName(target);

  if (advancement === "SESSION_BOOTSTRAP" || channel === "brainboot") {
    return `${receiver} finished Brainboot and is ready for the next move.`;
  }
  if (packet.startsWith("BOOK_CHAPTER_EDIT")) {
    return `${receiver} returned a book edit.`;
  }
  if (asText(record.answer_status, "") === "COMPLETED") {
    return `${receiver} returned a completed answer.`;
  }
  return `${receiver} returned work for review.`;
}

type AeyeRosterEntry = {
  target: string;
  role: string;
  statusHint?: "alias" | "local" | "retired" | "unwired";
  note?: string;
};

type AeyeRosterRow = AeyeRosterEntry & {
  aeye: string;
  machine: string;
  coverageRecord: JsonRecord | null;
  status: string;
  statusLabel: string;
  statusTone: string;
  latestPacket: string;
  latestReceipt: string;
  proofGap: string;
  nextMove: string;
};

const expectedAeyeRoster: AeyeRosterEntry[] = [
  { target: "Skybro.Betsy", role: "Architecture, book editing, source-truth synthesis" },
  { target: "Petra.Betsy", role: "Operator judgment, routing, decision packets" },
  { target: "Dink.Betsy", role: "Hand work, build/merge execution" },
  { target: "Maker.Betsy", role: "Builder/courier work and local artifact handling" },
  { target: "Fucko.Betsy", role: "Speaker intake, manuscript pressure, packet language" },
  {
    target: "Swanson.Doss",
    role: "Relay, repo truth, infrastructure, proof readback",
    statusHint: "local",
    note: "Current local control surface. This is not a remote receiver chat."
  },
  {
    target: "Dink.Doss",
    role: "Old label for Dink-style execution on Doss",
    statusHint: "alias",
    note: "Operational route is Swanson@Doss. Do not fake-route to a literal Dink@Doss inbox."
  },
  { target: "Bean.Spanzee", role: "Red-team audit and contradiction finding" },
  { target: "Computer.Spanzee", role: "Spanzee machine-side execution and receiver proof" },
  {
    target: "Ender.Betsy",
    role: "Book filtration, cut-list, controlled forgetting",
    statusHint: "unwired",
    note: "Ender is only retired on Sally. This route needs a receiver thread before ThinkIt can send work here."
  },
  {
    target: "Ender.Doss",
    role: "Local filtration/editing candidate",
    statusHint: "unwired",
    note: "Potential Doss-side Ender route. Needs a receiver surface before routing work."
  },
  { target: "Thufir.Sally", role: "Validation, adversarial review, proof discipline" },
  {
    target: "Ender.Sally",
    role: "Filtration / controlled forgetting",
    statusHint: "retired",
    note: "Retired until Sally RAM upgrade arrives. Hold new work."
  },
  {
    target: "FuckoJr.Sally",
    role: "Accountability / receipt follow-through candidate",
    statusHint: "unwired",
    note: "Known topology name. No ThinkIt receiver thread is bound yet."
  },
  {
    target: "Skybro.Sally",
    role: "Sally-side strategy/editing candidate",
    statusHint: "unwired",
    note: "Known topology name. Needs a receiver surface before routing work."
  },
  {
    target: "Bean.Sally",
    role: "Bean route if Sally has capacity",
    statusHint: "unwired",
    note: "Known topology name. Held until Sally capacity/routing is explicit."
  },
  {
    target: "Ender.Spanzee",
    role: "Spanzee-side filtration/editing candidate",
    statusHint: "unwired",
    note: "Potential Ender route. Needs a receiver surface before routing work."
  }
];

function splitTarget(target: string) {
  const [aeye = "Unknown", machine = "Unassigned"] = target.split(".");
  return { aeye, machine };
}

function statusLabel(status: string) {
  switch (status) {
    case "ROUND_TRIP_PROVEN":
      return "Answered";
    case "HELD_BY_TOPOLOGY":
      return "Retired / held";
    case "LOCAL_CONTROL_THREAD":
      return "Local control";
    case "FILE_INBOX_WAITING":
      return "Waiting on inbox";
    case "WAITING_FOR_RECEIVER":
      return "Sent / waiting";
    case "RETURNED_BLOCKER":
      return "Returned blocker";
    case "ALIAS_TO_SWANSON":
      return "Alias";
    default:
      return "Not wired yet";
  }
}

function statusTone(status: string) {
  if (status === "ROUND_TRIP_PROVEN") return "proven";
  if (status === "HELD_BY_TOPOLOGY") return "held";
  if (status === "LOCAL_CONTROL_THREAD") return "local";
  if (status === "ALIAS_TO_SWANSON") return "alias";
  if (status === "RETURNED_BLOCKER") return "blocked";
  if (status.includes("WAITING")) return "waiting";
  return "unwired";
}

function nextMoveForStatus(status: string, entry: AeyeRosterEntry) {
  if (entry.statusHint === "retired") return "Do not route new work until the RAM/topology lift receipt exists.";
  if (entry.statusHint === "alias") return "Use Swanson@Doss for this route.";
  if (status === "ROUND_TRIP_PROVEN") return "Callable from ThinkIt. Send the next packet when the work needs this Aeye.";
  if (status === "LOCAL_CONTROL_THREAD") return "This is the local Swanson control lane, not a remote receiver.";
  if (status === "RETURNED_BLOCKER") return "Open the blocker receipt before sending another packet.";
  if (status.includes("WAITING")) return "Wait for the receiver receipt, or run the chaser if it is stale.";
  return "Bind a receiver thread or LAN inbox before claiming relay coverage.";
}

function buildAeyeRoster(coverage: JsonRecord | null) {
  const coverageRows = asArray(valueAt(coverage, ["targets"]));
  const coverageByTarget = new Map<string, JsonRecord>();
  for (const item of coverageRows) {
    const record = asRecord(item);
    const target = asText(record?.target, "");
    if (record && target) coverageByTarget.set(target, record);
  }

  const seen = new Set<string>();
  const rows: AeyeRosterRow[] = [];
  const addRow = (entry: AeyeRosterEntry) => {
    const coverageRecord = coverageByTarget.get(entry.target) ?? null;
    const coverageStatus = asText(coverageRecord?.coverage, "");
    const status =
      coverageStatus ||
      (entry.statusHint === "retired"
        ? "HELD_BY_TOPOLOGY"
        : entry.statusHint === "local"
          ? "LOCAL_CONTROL_THREAD"
          : entry.statusHint === "alias"
            ? "ALIAS_TO_SWANSON"
            : "NOT_WIRED");
    const { aeye, machine } = splitTarget(entry.target);
    seen.add(entry.target);
    rows.push({
      ...entry,
      aeye,
      machine,
      coverageRecord,
      status,
      statusLabel: statusLabel(status),
      statusTone: statusTone(status),
      latestPacket: asText(coverageRecord?.latest_packet_id, "No packet sent yet"),
      latestReceipt: asText(coverageRecord?.latest_receiver_receipt_id, "No receiver receipt yet"),
      proofGap: entry.note ?? asText(coverageRecord?.proof_gap, "No proof gap has been written back yet."),
      nextMove: nextMoveForStatus(status, entry)
    });
  };

  expectedAeyeRoster.forEach(addRow);

  for (const [target, coverageRecord] of coverageByTarget.entries()) {
    if (seen.has(target)) continue;
    addRow({
      target,
      role: "Relay target discovered from live coverage readback",
      note: asText(coverageRecord.proof_gap, "Discovered from live relay coverage.")
    });
  }

  const machineOrder = ["Betsy", "Doss", "Sally", "Spanzee", "Unassigned"];
  return rows.sort((left, right) => {
    const machineDelta = machineOrder.indexOf(left.machine) - machineOrder.indexOf(right.machine);
    if (machineDelta !== 0) return machineDelta;
    return left.aeye.localeCompare(right.aeye);
  });
}

function summarizePackets(value: unknown) {
  const packets = asArray(value);
  return packets
    .map((packet) => {
      const record = packet && typeof packet === "object" ? (packet as JsonRecord) : {};
      return asText(record.packet_id ?? record.relay_id ?? record.id, "UNKNOWN_PACKET");
    })
    .slice(0, 3)
    .join(", ");
}

function isRouteHeld(status: string) {
  return status === "HELD_BY_TOPOLOGY" || status === "LOCAL_CONTROL_THREAD" || status === "ALIAS_TO_SWANSON";
}

function isRoutableReceiver(receiver: JsonRecord | null, row?: AeyeRosterRow) {
  if (row && isRouteHeld(row.status)) return false;
  return asText(receiver?.relay_mode, "") === "CODEX_THREAD_BRIDGE";
}

function scrollToDashboardSection(id: string) {
  if (typeof document === "undefined") return;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function readJson(endpoint: string): Promise<JsonRecord> {
  const response = await fetch(endpoint, { cache: "no-store" });
  const result = (await response.json()) as JsonRecord;
  if (!response.ok) {
    throw new Error(asText(result.error, `HTTP_${response.status}`));
  }
  return result;
}

async function postJson(endpoint: string, payload: JsonRecord): Promise<{ statusCode: number; result: JsonRecord }> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const result = (await response.json()) as JsonRecord;
  return { statusCode: response.status, result };
}

export default function SwansonRelayControl() {
  const [snapshot, setSnapshot] = useState<RelaySnapshot>(emptySnapshot);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<ActionResult | null>(null);
  const [target, setTarget] = useState("Skybro.Betsy");
  const [proofBody, setProofBody] = useState(
    "Return ACK / BLOCKER / ARTIFACT proving this packet reached the Aeye thread, was understood, and came back to the ThinkIt origin dash."
  );
  const [roundTripOpen, setRoundTripOpen] = useState(true);
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [bookEditingMode, setBookEditingMode] = useState("developmental_edit");
  const [bookOperatorNote, setBookOperatorNote] = useState(
    "Edit this chapter from source truth. Return access gaps, continuity issues, a recommended edit, and any cousin-editor packets you need ThinkIt to route next."
  );
  const [selectedBookReportId, setSelectedBookReportId] = useState("");
  const [threadScope, setThreadScope] = useState("main receiver lane");
  const [universalBody, setUniversalBody] = useState(
    "Return one useful status delta: what you received, what changed on your side, what is blocked, and what ThinkIt should decide next."
  );
  const [enderTarget, setEnderTarget] = useState("Ender.Betsy");
  const [enderInstruction, setEnderInstruction] = useState(
    "Filter this returned chapter report for what should be cut, parked, or preserved. Return a concise edit/factoring recommendation with proof gaps."
  );

  async function refresh(reason = "Relay state refreshed") {
    setLoading(true);
    setError(null);
    try {
      const [contract, coverage, originReturn, threadBridge, actionableReturns, bookChapters, bookCourier] = await Promise.all([
        readJson("/api/thinkit/swanson/thinkit/relay_merge_contract"),
        readJson("/api/thinkit/swanson/relay/coverage"),
        readJson("/api/thinkit/swanson/relay/origin_return"),
        readJson("/api/thinkit/swanson/relay/thread_bridge/status?limit=12"),
        readJson("/api/thinkit/swanson/relay/actionable_returns"),
        readJson("/api/thinkit/swanson/book/chapters"),
        readJson("/api/thinkit/swanson/book/courier_status?limit=12")
      ]);
      setSnapshot({ contract, coverage, originReturn, threadBridge, actionableReturns, bookChapters, bookCourier });
      setLastAction((current) =>
        current ?? {
          label: reason,
          endpoint: "GET relay readback bundle",
          timestamp: new Date().toISOString(),
          ok: true,
          statusCode: 200,
          result: { status: reason }
        }
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Relay readback failed");
    } finally {
      setLoading(false);
    }
  }

  async function runAction(label: string, endpoint: string, payload: JsonRecord = {}) {
    setActionPending(label);
    setError(null);
    try {
      const { statusCode, result } = await postJson(endpoint, payload);
      const ok = statusCode >= 200 && statusCode < 300;
      setLastAction({
        label,
        endpoint,
        timestamp: new Date().toISOString(),
        ok,
        statusCode,
        result,
        error: ok ? undefined : asText(result.error, "REQUEST_FAILED")
      });
      await refresh(`${label} returned`);
    } catch (actionError) {
      setLastAction({
        label,
        endpoint,
        timestamp: new Date().toISOString(),
        ok: false,
        statusCode: 0,
        result: null,
        error: actionError instanceof Error ? actionError.message : "Action failed"
      });
      setError(actionError instanceof Error ? actionError.message : "Action failed");
    } finally {
      setActionPending(null);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const coverageSummary = valueAt(snapshot.coverage, ["summary"]) as JsonRecord | null;
  const contractReadiness = valueAt(snapshot.contract, ["readiness"]) as JsonRecord | null;
  const latestReturn = valueAt(snapshot.originReturn, ["origin_return", "latest_return"]) as JsonRecord | null;
  const directLatestReturn = valueAt(snapshot.originReturn, ["latest_return"]) as JsonRecord | null;
  const latest = latestReturn ?? directLatestReturn ?? snapshot.originReturn;
  const actuator = valueAt(snapshot.coverage, ["actuator"]) as JsonRecord | null;
  const queued = asArray(valueAt(snapshot.threadBridge, ["queued"]));
  const blocked = asArray(valueAt(snapshot.threadBridge, ["blocked"]));
  const actionable =
    valueAt(snapshot.actionableReturns, ["actionable_returns", "actionable"]) ??
    valueAt(snapshot.actionableReturns, ["actionable_returns", "items"]) ??
    valueAt(snapshot.actionableReturns, ["items"]);
  const actionables = asArray(actionable);
  const bookReturnRecords = useMemo(
    () =>
      actionables
        .map((item) => asRecord(item))
        .filter((item): item is JsonRecord => Boolean(item) && asText(item?.packet_id, "").startsWith("BOOK_CHAPTER_EDIT")),
    [actionables]
  );
  const bookChapters = asArray(valueAt(snapshot.bookChapters, ["chapters"]));
  const bookPackets = asArray(valueAt(snapshot.bookCourier, ["latest_book_packets"]));
  const nextUnsentChapter = asRecord(valueAt(snapshot.bookCourier, ["next_unsent_chapter"]));
  const nextUncompletedChapter = asRecord(valueAt(snapshot.bookCourier, ["next_uncompleted_chapter"]));
  const defaultChapterId = asText(nextUnsentChapter?.chapter_id ?? asRecord(bookChapters[0])?.chapter_id, "");
  const rosterRows = useMemo(() => buildAeyeRoster(snapshot.coverage), [snapshot.coverage]);
  const rosterByMachine = useMemo(() => {
    return rosterRows.reduce<Record<string, AeyeRosterRow[]>>((groups, row) => {
      groups[row.machine] = groups[row.machine] ?? [];
      groups[row.machine].push(row);
      return groups;
    }, {});
  }, [rosterRows]);
  const rosterAnswered = rosterRows.filter((row) => row.status === "ROUND_TRIP_PROVEN").length;
  const rosterHeld = rosterRows.filter((row) => row.status === "HELD_BY_TOPOLOGY").length;
  const rosterLocal = rosterRows.filter((row) => row.status === "LOCAL_CONTROL_THREAD" || row.status === "ALIAS_TO_SWANSON").length;
  const rosterUnwired = rosterRows.filter((row) => row.status === "NOT_WIRED").length;

  const contractStatus = asText(snapshot.contract?.status, "NO_CONTRACT");
  const relayReady = contractStatus.includes("THINKIT_RELAY_MERGE_READY");
  const readinessLabel = contractStatus.includes("WITH_BLOCKERS")
    ? "CONDITIONAL GO"
    : relayReady
      ? "MERGE READY"
      : "READBACK BLOCKED";
  const roundTrip = asNumber(coverageSummary?.round_trip_proven ?? valueAt(snapshot.contract, ["current_readback", "coverage_summary", "round_trip_proven"]));
  const targetCount = asNumber(coverageSummary?.target_count ?? valueAt(snapshot.contract, ["current_readback", "coverage_summary", "target_count"]));
  const held = asNumber(coverageSummary?.held ?? valueAt(snapshot.contract, ["current_readback", "coverage_summary", "held"]));
  const bridgeStatus = asText(actuator?.status ?? valueAt(snapshot.threadBridge, ["actuator", "status"]), "UNKNOWN");
  const latestPacket = asText(latest?.packet_id ?? latest?.relay_id, "NO_RETURN_YET");
  const latestTarget = asText(latest?.target ?? latest?.destination_label, "UNKNOWN_TARGET");
  const latestStatus = asText(latest?.packet_status ?? latest?.answer_status ?? latest?.origin_readback_status ?? latest?.status, "UNKNOWN_STATUS");
  const latestAnswer = asText(latest?.answer_evidence ?? latest?.answer_text, "No returned answer has been read back yet.");
  const latestReceiver = findReceiver(snapshot.threadBridge, latestTarget);
  const latestReceiverTitle = receiverTitle(snapshot.threadBridge, latestTarget);
  const latestReceiptId = asText(latest?.receiver_receipt_id, "NO_RECEIPT_YET");
  const latestReceiptPath = asText(latest?.receiver_receipt_path, "No receipt file read back yet.");
  const latestSourcePacketPath = asText(latest?.source_packet_path, "No source packet path read back yet.");
  const bookChapterCount = asNumber(valueAt(snapshot.bookCourier, ["chapter_count"]) ?? valueAt(snapshot.bookChapters, ["chapter_count"]));
  const completedChapterCount = asNumber(valueAt(snapshot.bookCourier, ["completed_chapter_count"]));
  const activeBookPacketCount = asNumber(valueAt(snapshot.bookCourier, ["active_packet_count"]));
  const bookPacketCount = asNumber(valueAt(snapshot.bookCourier, ["book_packet_count"]));
  const bookSourceUrl = asText(valueAt(snapshot.bookCourier, ["source_repo_url"]) ?? valueAt(snapshot.bookChapters, ["source_repo_url"]), "No source URL read back yet.");
  const nextUnsentTitle = asText(nextUnsentChapter?.title, "No next unsent chapter read back yet.");
  const nextUncompletedTitle = asText(nextUncompletedChapter?.title, "No next unfinished chapter read back yet.");
  const latestActionable = asRecord(actionables.find((item) => asText(asRecord(item)?.packet_id, "") === latestPacket));
  const latestChange = humanizeTargetText(
    latestActionable?.advanced ?? latest?.advanced,
    latestTarget,
    "No organism-change summary has been returned yet."
  );
  const latestDecisionHelp = humanizeTargetText(
    latestActionable?.helps_decide ?? latest?.helps_decide,
    latestTarget,
    "No decision question has been attached yet."
  );
  const connectedRelayRows = rosterRows.filter((row) => isRoutableReceiver(findReceiver(snapshot.threadBridge, row.target), row));
  const enderRows = rosterRows.filter((row) => row.aeye === "Ender");
  const selectedEnderRow = rosterRows.find((row) => row.target === enderTarget) ?? null;
  const selectedEnderReceiver = findReceiver(snapshot.threadBridge, enderTarget);
  const selectedEnderCanRoute = isRoutableReceiver(selectedEnderReceiver, selectedEnderRow ?? undefined);
  const defaultBookReportId = asText(bookReturnRecords[0]?.packet_id, "");
  const selectedBookReport =
    bookReturnRecords.find((record) => asText(record.packet_id, "") === selectedBookReportId) ?? bookReturnRecords[0] ?? null;
  const selectedBookReportPacketId = asText(selectedBookReport?.packet_id, "NO_BOOK_REPORT_SELECTED");
  const selectedBookReportTarget = asText(selectedBookReport?.target, "Skybro.Betsy");
  const selectedBookReportReceipt = asText(selectedBookReport?.receiver_receipt_id, "NO_RECEIPT_SELECTED");
  const selectedBookReportEvidence = parseEvidenceSections(selectedBookReport?.evidence);
  const selectedBookReportChapter = selectedBookReportEvidence.chapter_read || "No chapter readback selected yet.";
  const selectedBookReportRecommendation = selectedBookReportEvidence.recommended_next_edit || "No recommended edit has been parsed yet.";

  useEffect(() => {
    if (!selectedChapterId && defaultChapterId) setSelectedChapterId(defaultChapterId);
  }, [defaultChapterId, selectedChapterId]);

  useEffect(() => {
    if (!selectedBookReportId && defaultBookReportId) setSelectedBookReportId(defaultBookReportId);
  }, [defaultBookReportId, selectedBookReportId]);

  const actionSummary = useMemo(() => {
    if (!lastAction?.result) return "No action result yet.";
    return JSON.stringify(lastAction.result, null, 2).slice(0, 2200);
  }, [lastAction]);

  function selectedBookFollowupBody(instruction: string) {
    return [
      "MISSION: Continue Nerdkle book work from a returned Skybro chapter report without making Ben the courier.",
      "",
      `Source returned packet: ${selectedBookReportPacketId}`,
      `Receiver receipt: ${selectedBookReportReceipt}`,
      `Original receiver: ${humanTargetName(selectedBookReportTarget)}`,
      `Chapter read: ${selectedBookReportChapter}`,
      "",
      `Operator instruction: ${instruction}`,
      "",
      "Skybro report fields:",
      `what_works: ${selectedBookReportEvidence.what_works || "No what_works field parsed."}`,
      `continuity_issues: ${selectedBookReportEvidence.continuity_issues || "No continuity_issues field parsed."}`,
      `developmental_edit: ${selectedBookReportEvidence.developmental_edit || "No developmental_edit field parsed."}`,
      `risk_conflict: ${selectedBookReportEvidence.risk_conflict || "No risk_conflict field parsed."}`,
      `recommended_next_edit: ${selectedBookReportRecommendation}`,
      "",
      "Full evidence excerpt:",
      clippedText(selectedBookReport?.evidence),
      "",
      "Return requirements:",
      "1. Write RECEIVED first.",
      "2. Return COMPLETED with a usable editorial report or artifact, or BLOCKER with exact missing proof.",
      "3. Do not ask Ben to restate the chapter or report.",
      "4. Do not call SENT success."
    ].join("\n");
  }

  function dispatchBookWorkbenchPacket(label: string, destination: string, packetType: string, title: string, instruction: string) {
    return runAction(label, "/api/thinkit/swanson/relay/dispatch", {
      packet_type: packetType,
      target: destination,
      title,
      body: [
        `Thread scope: ${threadScope}`,
        "",
        selectedBookFollowupBody(instruction)
      ].join("\n")
    });
  }

  function recordBookWorkbenchDecision(label: string, choice: string) {
    return runAction(label, "/api/thinkit/swanson/relay/actionable_decision", {
      choice,
      target: selectedBookReportTarget,
      source_packet_id: selectedBookReportPacketId,
      receiver_receipt_id: selectedBookReportReceipt,
      advanced: `Book workbench decision for ${selectedBookReportChapter}.`,
      helps_decide: "What should happen next with this returned chapter report?"
    });
  }

  function selectReportAndOpenWorkbench(packetId: string) {
    setSelectedBookReportId(packetId);
    window.setTimeout(() => scrollToDashboardSection("thinkit-chapter-workbench"), 0);
  }

  function recordActionableRecordDecision(record: JsonRecord, choice: string) {
    const itemTarget = asText(record.target, "UNKNOWN_TARGET");
    return runAction(`Decision: ${humanLabel(choice)}`, "/api/thinkit/swanson/relay/actionable_decision", {
      choice,
      target: itemTarget,
      source_packet_id: asText(record.packet_id, ""),
      receiver_receipt_id: asText(record.receiver_receipt_id, ""),
      advanced: asText(record.advanced, ""),
      helps_decide: asText(record.helps_decide, "")
    });
  }

  function pingAeye(row: AeyeRosterRow) {
    const receiver = findReceiver(snapshot.threadBridge, row.target);
    if (!isRoutableReceiver(receiver, row)) {
      return requestReceiverSetup(row.target);
    }
    return runAction(`Ping ${humanTargetName(row.target)}`, "/api/thinkit/swanson/relay/dispatch", {
      packet_type: "THINKIT_TARGET_PING",
      target: row.target,
      title: `ThinkIt ping: ${humanTargetName(row.target)}`,
      body: [
        "MISSION: Prove this receiver lane is alive and visible to ThinkIt.",
        "",
        `Receiver lane: ${receiverTitle(snapshot.threadBridge, row.target)}`,
        `Thread scope: ${threadScope}`,
        "",
        "Return RECEIVED, then COMPLETED or BLOCKER.",
        "Include whether this Aeye is available for book, architecture, relay, or editing work.",
        "Do not call SENT success."
      ].join("\n")
    });
  }

  function requestReceiverSetup(targetToConnect: string) {
    return runAction(`Request setup for ${humanTargetName(targetToConnect)}`, "/api/thinkit/swanson/relay/dispatch", {
      packet_type: "RECEIVER_SETUP_REQUEST",
      target: "Petra.Betsy",
      title: `Receiver setup needed: ${humanTargetName(targetToConnect)}`,
      body: [
        "MISSION: Create or identify the missing receiver surface so ThinkIt can route packets without Ben as courier.",
        "",
        `Requested receiver: ${humanTargetName(targetToConnect)}`,
        `Raw target: ${targetToConnect}`,
        "",
        "Current proof boundary:",
        "ThinkIt cannot ping an unwired Aeye directly. This packet asks the routing owner to create/bind the receiver thread or mark the target held.",
        "",
        "Return:",
        "1. RECEIVED.",
        "2. COMPLETED with receiver title and binding proof, or BLOCKER with exact missing access/thread.",
        "3. Do not call SENT success."
      ].join("\n")
    });
  }

  async function sendUniversalMessage() {
    const targets = connectedRelayRows.map((row) => row.target);
    setActionPending("Send Universal Message");
    setError(null);
    const results: JsonRecord[] = [];
    try {
      for (const destination of targets) {
        const { statusCode, result } = await postJson("/api/thinkit/swanson/relay/dispatch", {
          packet_type: "UNIVERSAL_OPERATOR_MESSAGE",
          target: destination,
          title: `Universal ThinkIt message: ${threadScope}`,
          body: [
            "MISSION: Receive this universal ThinkIt message and answer with a receiver-side status delta.",
            "",
            `Receiver: ${humanTargetName(destination)}`,
            `Thread scope: ${threadScope}`,
            "",
            "Operator message:",
            universalBody,
            "",
            "Return:",
            "1. RECEIVED.",
            "2. COMPLETED with what changed, what is blocked, and what ThinkIt should decide next, or BLOCKER with exact missing proof.",
            "3. Do not call SENT success."
          ].join("\n")
        });
        results.push({ target: destination, statusCode, result });
      }
      const ok = results.every((item) => asNumber(item.statusCode) >= 200 && asNumber(item.statusCode) < 300);
      setLastAction({
        label: "Send Universal Message",
        endpoint: "POST /v1/relay/dispatch per connected target",
        timestamp: new Date().toISOString(),
        ok,
        statusCode: ok ? 201 : 207,
        result: {
          status: ok ? "UNIVERSAL_MESSAGE_QUEUED" : "UNIVERSAL_MESSAGE_PARTIAL",
          target_count: targets.length,
          targets,
          results,
          proof_boundary: "Queued is not delivery. Each target still needs RECEIVED then COMPLETED or BLOCKER."
        }
      });
      await refresh("Universal message dispatched");
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : "Universal dispatch failed";
      setLastAction({
        label: "Send Universal Message",
        endpoint: "POST /v1/relay/dispatch per connected target",
        timestamp: new Date().toISOString(),
        ok: false,
        statusCode: 0,
        result: { targets, results },
        error: message
      });
      setError(message);
    } finally {
      setActionPending(null);
    }
  }

  return (
    <section className="thinkit-relay" aria-label="Swanson relay control">
      <header className="thinkit-relay__header">
        <div>
          <p className="td-bridge__eyebrow">Swanson Relay Build / live transport</p>
          <h2>Relay first. Receipts visible. Return proof or it did not happen.</h2>
          <p>
            This is the runtime bridge between ThinkIt and the working Swanson relay core on <code>127.0.0.1:3339</code>.
            Buttons below call the relay endpoints and immediately show the packet/queue/return evidence they get back.
          </p>
        </div>
        <strong data-state={relayReady ? "ready" : "blocked"}>{readinessLabel}</strong>
      </header>

      <div className="thinkit-relay__metrics" aria-label="Relay proof metrics">
        <button
          type="button"
          className="thinkit-relay__metric-card"
          aria-expanded={roundTripOpen}
          aria-controls="thinkit-round-trip-proof-map"
          onClick={() => {
            setRoundTripOpen(true);
            window.setTimeout(() => scrollToDashboardSection("thinkit-round-trip-proof-map"), 0);
          }}
        >
          <span>Round-trip proof</span>
          <strong>{roundTrip}/{targetCount || "?"}</strong>
          <small>{held} held target(s) / open full Aeye map</small>
        </button>
        <button type="button" className="thinkit-relay__metric-card" onClick={() => scrollToDashboardSection("thinkit-thread-bridge-panel")}>
          <span>Thread bridge</span>
          <strong>{bridgeStatus}</strong>
          <small>{queued.length} queued / {blocked.length} blocked / open send lane</small>
        </button>
        <button type="button" className="thinkit-relay__metric-card" onClick={() => scrollToDashboardSection("thinkit-latest-return")}>
          <span>Latest return</span>
          <strong>{latestStatus}</strong>
          <small>{latestChange}</small>
        </button>
        <button type="button" className="thinkit-relay__metric-card" onClick={() => scrollToDashboardSection("thinkit-action-cards")}>
          <span>Action cards</span>
          <strong>{actionables.length}</strong>
          <small>decisions available / open decision cards</small>
        </button>
      </div>

      <section id="thinkit-thread-bridge-panel" className="thinkit-relay__bridge-panel" aria-label="Thread bridge controls">
        <header>
          <div>
            <p className="td-bridge__eyebrow">Thread bridge / receiver lanes</p>
            <h3>Send, chase, or request a missing receiver from here.</h3>
            <p>
              The bridge currently maps one receiver lane per Aeye. The <strong>Thread scope</strong> field is carried inside packets until ThinkIt has true
              multi-thread routing per Aeye.
            </p>
          </div>
          <a href="http://10.1.10.8:3339/relay/receiver_bootstrap" target="_blank" rel="noreferrer">
            Open Receiver Setup
          </a>
        </header>
        <dl className="thinkit-relay__bridge-stats">
          <div>
            <dt>Actuator</dt>
            <dd>{bridgeStatus}</dd>
          </div>
          <div>
            <dt>Queued for bridge</dt>
            <dd>{queued.length}</dd>
          </div>
          <div>
            <dt>Blocked bridge items</dt>
            <dd>{blocked.length}</dd>
          </div>
          <div>
            <dt>Universal targets</dt>
            <dd>{connectedRelayRows.length}</dd>
          </div>
        </dl>
        <div className="thinkit-relay__bridge-actions">
          <button type="button" disabled={actionPending !== null} onClick={() => void runAction("Run Chaser Once", "/api/thinkit/swanson/relay/run_chaser", {})}>
            {actionPending === "Run Chaser Once" ? "Chasing" : "Run Chaser Once"}
          </button>
          <button
            type="button"
            disabled={actionPending !== null}
            onClick={() => void runAction("Build Receiver Setup Packets", "/api/thinkit/swanson/relay/build_receiver_bootstraps", {})}
          >
            {actionPending === "Build Receiver Setup Packets" ? "Writing" : "Build Receiver Setup Packets"}
          </button>
          <button
            type="button"
            disabled={actionPending !== null}
            onClick={() => void runAction("Write Missing Receiver Blockers", "/api/thinkit/swanson/relay/write_missing_receiver_blockers", {})}
          >
            {actionPending === "Write Missing Receiver Blockers" ? "Writing" : "Write Missing Receiver Blockers"}
          </button>
        </div>
      </section>

      {roundTripOpen ? (
        <section id="thinkit-round-trip-proof-map" className="thinkit-relay__coverage" aria-label="Round-trip proof by Aeye and machine">
          <header>
            <div>
              <h3>Round-trip proof map</h3>
              <p>
                The <strong>{targetCount || 0}</strong> relay targets are only the currently wired coverage list. This roster maps the wider known helper mesh
                and marks what actually answered, what is local-only, what is retired, and what still needs a receiver surface.
              </p>
            </div>
            <dl className="thinkit-relay__coverage-summary">
              <div>
                <dt>Mapped Aeyes</dt>
                <dd>{rosterRows.length}</dd>
              </div>
              <div>
                <dt>Answered</dt>
                <dd>{rosterAnswered}</dd>
              </div>
              <div>
                <dt>Held / retired</dt>
                <dd>{rosterHeld}</dd>
              </div>
              <div>
                <dt>Not wired</dt>
                <dd>{rosterUnwired}</dd>
              </div>
            </dl>
          </header>

          <div className="thinkit-relay__coverage-machines">
            {Object.entries(rosterByMachine).map(([machine, rows]) => (
              <article key={machine} className="thinkit-relay__machine-proof">
                <header>
                  <h4>{machine}</h4>
                  <span>
                    {rows.filter((row) => row.status === "ROUND_TRIP_PROVEN").length}/{rows.length} answered
                  </span>
                </header>
                <div className="thinkit-relay__roster-list">
                  {rows.map((row) => {
                    const receiver = findReceiver(snapshot.threadBridge, row.target);
                    const receiverName = receiverTitle(snapshot.threadBridge, row.target);
                    const readableSurface =
                      row.status === "NOT_WIRED"
                        ? "No receiver bound yet"
                        : row.status === "ALIAS_TO_SWANSON"
                          ? "Alias to Swanson@Doss"
                          : row.status === "HELD_BY_TOPOLOGY"
                            ? "Held by routing rules"
                            : row.status === "LOCAL_CONTROL_THREAD"
                              ? "Local control thread"
                              : receiverSurface(receiver);
                    return (
                      <article key={row.target} className="thinkit-relay__roster-card" data-status={row.statusTone}>
                        <header>
                          <div>
                            <strong>{humanTargetName(row.target)}</strong>
                            <small>{row.role}</small>
                          </div>
                          <span>{row.statusLabel}</span>
                        </header>
                        <dl>
                          <div>
                            <dt>Receiver surface</dt>
                            <dd>{readableSurface === "Codex receiver thread" ? receiverName : readableSurface}</dd>
                          </div>
                          <div>
                            <dt>Last response</dt>
                            <dd>{row.latestReceipt}</dd>
                          </div>
                          <div>
                            <dt>Last packet</dt>
                            <dd>{row.latestPacket}</dd>
                          </div>
                          <div>
                            <dt>Next move</dt>
                            <dd>{row.nextMove}</dd>
                          </div>
                        </dl>
                        <p>{row.proofGap}</p>
                        <div className="thinkit-relay__roster-buttons">
                          {row.status === "HELD_BY_TOPOLOGY" ? (
                            <button type="button" disabled>
                              Held by topology
                            </button>
                          ) : row.status === "LOCAL_CONTROL_THREAD" || row.status === "ALIAS_TO_SWANSON" ? (
                            <button type="button" disabled>
                              Local / alias route
                            </button>
                          ) : (
                            <button type="button" disabled={actionPending !== null} onClick={() => void pingAeye(row)}>
                              {isRoutableReceiver(receiver, row)
                                ? actionPending === `Ping ${humanTargetName(row.target)}`
                                  ? "Pinging"
                                  : "Ping Aeye"
                                : actionPending === `Request setup for ${humanTargetName(row.target)}`
                                  ? "Requesting"
                                  : "Request Receiver Setup"}
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>

          <p className="thinkit-relay__coverage-note">
            Local-only and alias rows are counted separately from missing receivers. They are real topology facts, but not proof that a separate Aeye chat answered.
            Current local/alias count: {rosterLocal}.
          </p>
        </section>
      ) : null}

      <section className="thinkit-relay__book" aria-label="Book chapter courier">
        <header>
          <div>
            <p className="td-bridge__eyebrow">Book courier / Skybro writing lane</p>
            <h3>One chapter at a time, no paste-mule loop.</h3>
            <p>
              ThinkIt reads the repo chapter list, creates a chapter packet with source path, GitHub URL, hash, and edit instructions,
              then the thread bridge carries it to the selected Aeye. A chapter is not done until a receiver receipt comes back here.
            </p>
          </div>
          <strong>{completedChapterCount}/{bookChapterCount || "?"} completed</strong>
        </header>

        <dl className="thinkit-relay__book-summary">
          <div>
            <dt>Source folder</dt>
            <dd>{bookSourceUrl}</dd>
          </div>
          <div>
            <dt>Next unsent</dt>
            <dd>{nextUnsentTitle}</dd>
          </div>
          <div>
            <dt>Next unfinished</dt>
            <dd>{nextUncompletedTitle}</dd>
          </div>
          <div>
            <dt>Active packets</dt>
            <dd>{activeBookPacketCount} active / {bookPacketCount} total</dd>
          </div>
        </dl>

        <div className="thinkit-relay__book-form">
          <label>
            <span>Chapter to send</span>
            <select value={selectedChapterId} onChange={(event) => setSelectedChapterId(event.target.value)}>
              {bookChapters.slice(0, 120).map((item) => {
                const chapter = asRecord(item) ?? {};
                const chapterId = asText(chapter.chapter_id, "");
                const chapterNumber = chapter.chapter_number === null ? "Source" : `Ch ${asText(chapter.chapter_number, "?")}`;
                return (
                  <option key={chapterId} value={chapterId}>
                    {chapterNumber} - {asText(chapter.title, "Untitled chapter")} ({asText(chapter.extension, "file")})
                  </option>
                );
              })}
            </select>
          </label>
          <label>
            <span>Receiver</span>
            <select value={target} onChange={(event) => setTarget(event.target.value)}>
              {rosterRows.map((row) => (
                <option key={row.target} value={row.target}>
                  {humanTargetName(row.target)} - {row.statusLabel}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Edit mode</span>
            <input value={bookEditingMode} onChange={(event) => setBookEditingMode(event.target.value)} />
          </label>
          <label className="thinkit-relay__book-note">
            <span>Skybro instructions</span>
            <textarea rows={3} value={bookOperatorNote} onChange={(event) => setBookOperatorNote(event.target.value)} />
          </label>
        </div>

        <div className="thinkit-relay__book-buttons">
          <button type="button" disabled={loading || actionPending !== null} onClick={() => void refresh("Book courier refreshed")}>
            Refresh Book State
          </button>
          <button
            type="button"
            disabled={actionPending !== null || !selectedChapterId}
            onClick={() =>
              void runAction("Send Selected Chapter", "/api/thinkit/swanson/book/dispatch_chapter", {
                target,
                chapter_id: selectedChapterId,
                editing_mode: bookEditingMode,
                operator_note: bookOperatorNote
              })
            }
          >
            {actionPending === "Send Selected Chapter" ? "Sending" : "Send Selected Chapter"}
          </button>
          <button
            type="button"
            disabled={actionPending !== null}
            onClick={() =>
              void runAction("Send Next Book Chapter", "/api/thinkit/swanson/book/dispatch_next_chapter", {
                target,
                editing_mode: bookEditingMode,
                strategy: "first_unsent",
                operator_note: bookOperatorNote
              })
            }
          >
            {actionPending === "Send Next Book Chapter" ? "Sending" : "Send Next Unsent"}
          </button>
        </div>

        <div className="thinkit-relay__book-loop">
          <article>
            <strong>Route owner</strong>
            <p>ThinkIt / Swanson relay. It creates packets, sends through the bridge, chases stale work, and reads receipts back into this dash.</p>
          </article>
          <article>
            <strong>Writing owner</strong>
            <p>Skybro@Betsy by default. Skybro reads the source-truth chapter, writes the report/edit, and returns COMPLETED or BLOCKER.</p>
          </article>
          <article>
            <strong>Cousin editors</strong>
            <p>Skybro should return requested editor packets when it needs Thufir, Bean, Petra, Dink, Maker, or another Aeye. ThinkIt routes those next.</p>
          </article>
        </div>

        <section id="thinkit-chapter-workbench" className="thinkit-relay__workbench" aria-label="Chapter workbench">
          <header>
            <div>
              <p className="td-bridge__eyebrow">Chapter workbench / returned report</p>
              <h4>Read the report, then choose the next editorial move.</h4>
              <p>
                This is the handoff room: Skybro's returned report is visible here, and the buttons below route the next packet or record a hold without
                making you carry text between Aeyes.
              </p>
            </div>
            <label>
              <span>Returned report</span>
              <select value={selectedBookReportId} onChange={(event) => setSelectedBookReportId(event.target.value)}>
                {bookReturnRecords.map((record) => (
                  <option key={asText(record.packet_id, "UNKNOWN_REPORT")} value={asText(record.packet_id, "")}>
                    {asText(record.receiver_receipt_id, asText(record.packet_id, "Book report"))}
                  </option>
                ))}
              </select>
            </label>
          </header>

          <dl className="thinkit-relay__workbench-proof">
            <div>
              <dt>Chapter</dt>
              <dd>{selectedBookReportChapter}</dd>
            </div>
            <div>
              <dt>Returned by</dt>
              <dd>{humanTargetName(selectedBookReportTarget)}</dd>
            </div>
            <div>
              <dt>Receipt</dt>
              <dd>{selectedBookReportReceipt}</dd>
            </div>
            <div>
              <dt>Source packet</dt>
              <dd>{selectedBookReportPacketId}</dd>
            </div>
          </dl>

          <div className="thinkit-relay__workbench-sections">
            <article>
              <span>What works</span>
              <p>{selectedBookReportEvidence.what_works || "No what_works field parsed yet."}</p>
            </article>
            <article>
              <span>Continuity issues</span>
              <p>{selectedBookReportEvidence.continuity_issues || "No continuity_issues field parsed yet."}</p>
            </article>
            <article>
              <span>Recommended edit</span>
              <p>{selectedBookReportRecommendation}</p>
            </article>
            <article>
              <span>Risk / conflict</span>
              <p>{selectedBookReportEvidence.risk_conflict || "No risk_conflict field parsed yet."}</p>
            </article>
          </div>

          <div className="thinkit-relay__workbench-buttons">
            <button
              type="button"
              disabled={actionPending !== null || !selectedBookReport}
              onClick={() => void recordBookWorkbenchDecision("Accept Direction", "TRUST DIRECTION")}
            >
              {actionPending === "Accept Direction" ? "Recording" : "Accept Direction"}
            </button>
            <button
              type="button"
              disabled={actionPending !== null || !selectedBookReport || !selectedEnderCanRoute}
              onClick={() =>
                void dispatchBookWorkbenchPacket(
                  "Ask Ender",
                  enderTarget,
                  "BOOK_ENDER_FILTRATION_REVIEW",
                  `Ender filtration: ${selectedBookReportChapter}`,
                  enderInstruction
                )
              }
            >
              {selectedEnderCanRoute ? (actionPending === "Ask Ender" ? "Routing" : "Ask Ender") : "Ask Ender Needs Setup"}
            </button>
            <button
              type="button"
              disabled={actionPending !== null || !selectedBookReport}
              onClick={() =>
                void dispatchBookWorkbenchPacket(
                  "Send to Thufir",
                  "Thufir.Sally",
                  "BOOK_ADVERSARIAL_EDIT_REVIEW",
                  `Thufir review: ${selectedBookReportChapter}`,
                  "Red-team Skybro's chapter report. Find structural weakness, duplicated purpose, missing chapter ownership, and any claim that needs proof."
                )
              }
            >
              {actionPending === "Send to Thufir" ? "Routing" : "Send to Thufir"}
            </button>
            <button
              type="button"
              disabled={actionPending !== null || !selectedBookReport}
              onClick={() =>
                void dispatchBookWorkbenchPacket(
                  "Ask Bean",
                  "Bean.Spanzee",
                  "BOOK_RED_TEAM_CONTRADICTION_REVIEW",
                  `Bean audit: ${selectedBookReportChapter}`,
                  "Attack the returned chapter direction. Look for contradictions, overclaiming, doctrine fog, and where the reader will stop trusting the argument."
                )
              }
            >
              {actionPending === "Ask Bean" ? "Routing" : "Ask Bean"}
            </button>
            <button
              type="button"
              disabled={actionPending !== null || !selectedBookReport}
              onClick={() =>
                void dispatchBookWorkbenchPacket(
                  "Draft Revision Packet",
                  "Skybro.Betsy",
                  "BOOK_REVISION_DRAFT_REQUEST",
                  `Draft revision: ${selectedBookReportChapter}`,
                  "Turn the accepted direction into a concrete revision plan or draft patch. Preserve the source-truth boundary and name any missing source material."
                )
              }
            >
              {actionPending === "Draft Revision Packet" ? "Routing" : "Draft Revision Packet"}
            </button>
            <button
              type="button"
              disabled={actionPending !== null || !selectedBookReport}
              onClick={() => void recordBookWorkbenchDecision("Hold Chapter Report", "HOLD")}
            >
              {actionPending === "Hold Chapter Report" ? "Recording" : "Hold"}
            </button>
          </div>

          <p className="thinkit-relay__workbench-note">
            Accept/Hold records an operator decision. Thufir, Bean, and Draft Revision create successor packets and still require receiver receipts before they count.
          </p>
        </section>

        <section className="thinkit-relay__ender" aria-label="Ender editing lane">
          <header>
            <div>
              <p className="td-bridge__eyebrow">Ask Ender / controlled forgetting</p>
              <h4>Ender can edit somewhere else. Sally is the retired route.</h4>
              <p>
                This lane is for cut-list, filtration, and preserve/park/delete judgment. If the selected Ender route is not wired, ThinkIt will request receiver setup
                instead of pretending it delivered work.
              </p>
            </div>
            <span>{selectedEnderCanRoute ? "Receiver mapped" : "Receiver setup needed"}</span>
          </header>
          <div className="thinkit-relay__ender-form">
            <label>
              <span>Ender route</span>
              <select value={enderTarget} onChange={(event) => setEnderTarget(event.target.value)}>
                {enderRows.map((row) => (
                  <option key={row.target} value={row.target}>
                    {humanTargetName(row.target)} - {row.statusLabel}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Ender instruction</span>
              <textarea rows={3} value={enderInstruction} onChange={(event) => setEnderInstruction(event.target.value)} />
            </label>
          </div>
          <div className="thinkit-relay__ender-buttons">
            <button
              type="button"
              disabled={actionPending !== null || !selectedBookReport || !selectedEnderCanRoute}
              onClick={() =>
                void dispatchBookWorkbenchPacket(
                  "Ask Ender",
                  enderTarget,
                  "BOOK_ENDER_FILTRATION_REVIEW",
                  `Ender filtration: ${selectedBookReportChapter}`,
                  enderInstruction
                )
              }
            >
              {selectedEnderCanRoute ? "Send to Ender" : "Ender Not Wired"}
            </button>
            <button type="button" disabled={actionPending !== null || selectedEnderCanRoute} onClick={() => void requestReceiverSetup(enderTarget)}>
              {actionPending === `Request setup for ${humanTargetName(enderTarget)}` ? "Requesting" : "Request Ender Receiver Setup"}
            </button>
          </div>
          <p className="thinkit-relay__workbench-note">
            Current selected route: {humanTargetName(enderTarget)}. {selectedEnderRow?.proofGap ?? "No proof gap read back yet."}
          </p>
        </section>

        <div className="thinkit-relay__book-packets">
          <header>
            <h4>Latest chapter reports</h4>
            <span>{bookPackets.length} shown</span>
          </header>
          {bookPackets.slice(0, 5).map((item) => {
            const packet = asRecord(item) ?? {};
            const packetId = asText(packet.packet_id, "UNKNOWN_BOOK_PACKET");
            return (
              <article key={packetId}>
                <header>
                  <div>
                    <strong>{asText(packet.chapter_title ?? packet.title, "Book chapter")}</strong>
                    <small>{humanTargetName(asText(packet.target, "Skybro.Betsy"))}</small>
                  </div>
                  <span>{humanLabel(packet.status, "Unknown")}</span>
                </header>
                <dl>
                  <div>
                    <dt>Returned receipt</dt>
                    <dd>{asText(packet.last_receiver_receipt_id, "No receiver receipt yet")}</dd>
                  </div>
                  <div>
                    <dt>Receiver state</dt>
                    <dd>{asText(packet.last_receiver_status, "No receiver state yet")}</dd>
                  </div>
                  <div>
                    <dt>Packet</dt>
                    <dd>{packetId}</dd>
                  </div>
                  <div>
                    <dt>Updated</dt>
                    <dd>{asText(packet.updated_at, "No update timestamp")}</dd>
                  </div>
                </dl>
                <button type="button" onClick={() => selectReportAndOpenWorkbench(packetId)}>
                  Open in Workbench
                </button>
              </article>
            );
          })}
          {bookPackets.length === 0 ? <p>No chapter packets have returned yet.</p> : null}
        </div>
      </section>

      <div className="thinkit-relay__controls" aria-label="Relay buttons">
        <button type="button" disabled={loading || actionPending !== null} onClick={() => void refresh("Manual refresh")}>
          {loading ? "Refreshing" : "Refresh Proof"}
        </button>
        <button
          type="button"
          disabled={actionPending !== null}
          onClick={() => void runAction("Dispatch Startup", "/api/thinkit/swanson/relay/dispatch_startup", { targets: ["Skybro.Betsy", "Petra.Betsy"] })}
        >
          {actionPending === "Dispatch Startup" ? "Sending" : "Dispatch Startup"}
        </button>
        <button
          type="button"
          disabled={actionPending !== null}
          onClick={() => void runAction("Brainboot Aeyes", "/api/thinkit/swanson/action/brainboot_dispatch", { targets: ["Skybro.Betsy", "Petra.Betsy"] })}
        >
          {actionPending === "Brainboot Aeyes" ? "Sending" : "Brainboot Aeyes"}
        </button>
        <button
          type="button"
          disabled={actionPending !== null}
          onClick={() =>
            void runAction("Send Proof Packet", "/api/thinkit/swanson/relay/dispatch", {
              packet_type: "THINKIT_OPERABILITY_PROOF",
              target,
              title: "ThinkIt relay operability proof",
              body: [`Thread scope: ${threadScope}`, "", proofBody].join("\n")
            })
          }
        >
          {actionPending === "Send Proof Packet" ? "Sending" : "Send Proof Packet"}
        </button>
        <button
          type="button"
          disabled={actionPending !== null}
          onClick={() => void runAction("Run Chaser Once", "/api/thinkit/swanson/relay/run_chaser", {})}
        >
          {actionPending === "Run Chaser Once" ? "Chasing" : "Run Chaser Once"}
        </button>
      </div>

      <div className="thinkit-relay__operator">
        <label>
          <span>Specific receiver</span>
          <select value={target} onChange={(event) => setTarget(event.target.value)}>
            {rosterRows.map((row) => (
              <option key={row.target} value={row.target}>
                {humanTargetName(row.target)} - {row.statusLabel}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Thread scope / menu lane</span>
          <input value={threadScope} onChange={(event) => setThreadScope(event.target.value)} />
        </label>
        <label>
          <span>Proof packet body</span>
          <textarea rows={3} value={proofBody} onChange={(event) => setProofBody(event.target.value)} />
        </label>
      </div>

      <section className="thinkit-relay__universal" aria-label="Universal relay message">
        <header>
          <div>
            <p className="td-bridge__eyebrow">Universal message / all mapped receivers</p>
            <h3>Send one message to every connected Aeye lane.</h3>
            <p>
              Universal means one packet per mapped receiver. It does not include held, local-only, alias, or unwired targets, and it still requires a return receipt
              from each receiver.
            </p>
          </div>
          <strong>{connectedRelayRows.length} target(s)</strong>
        </header>
        <label>
          <span>Universal message</span>
          <textarea rows={4} value={universalBody} onChange={(event) => setUniversalBody(event.target.value)} />
        </label>
        <button type="button" disabled={actionPending !== null || connectedRelayRows.length === 0} onClick={() => void sendUniversalMessage()}>
          {actionPending === "Send Universal Message" ? "Sending" : "Send Universal Message"}
        </button>
      </section>

      <section id="thinkit-latest-return" className="thinkit-relay__return" aria-label="Latest origin return">
        <header>
          <h3>Latest returned answer on the origin dash</h3>
          <code>{latestPacket}</code>
        </header>
        <div className="thinkit-relay__provenance" aria-label="Where the latest answer came from">
          <article>
            <span>Answered by</span>
            <strong>{latestReceiverTitle}</strong>
            <small>{receiverSurface(latestReceiver)}</small>
          </article>
          <article>
            <span>Where to continue</span>
            <strong>{humanTargetName(latestTarget)}</strong>
            <small>{receiverInstruction(latestReceiver, latestTarget)}</small>
          </article>
          <article>
            <span>Proof ThinkIt read</span>
            <strong>{latestReceiptId}</strong>
            <small>{latestReceiptPath}</small>
          </article>
          <article>
            <span>Original packet</span>
            <strong>{latestPacket}</strong>
            <small>{latestSourcePacketPath}</small>
          </article>
        </div>
        <dl className="thinkit-relay__change-readback">
          <div>
            <dt>What changed</dt>
            <dd>{latestChange}</dd>
          </div>
          <div>
            <dt>What this helps decide</dt>
            <dd>{latestDecisionHelp}</dd>
          </div>
        </dl>
        <p>{latestAnswer}</p>
      </section>

      <section id="thinkit-action-cards" className="thinkit-relay__actions" aria-label="Returned work waiting on operator decision">
        <header>
          <h3>Returned work waiting on you</h3>
          <span>{actionables.length} usable return(s)</span>
        </header>
        <div className="thinkit-relay__action-list">
          {actionables.slice(0, 4).map((item, index) => {
            const record = asRecord(item) ?? {};
            const itemTarget = asText(record.target, "UNKNOWN_TARGET");
            const itemPacket = asText(record.packet_id, `RETURN_${index + 1}`);
            const itemReceiver = findReceiver(snapshot.threadBridge, itemTarget);
            const operatorChoices = asArray(record.operator_choices).map((choice) => asText(choice, "")).filter(Boolean);
            return (
              <article key={itemPacket}>
                <header>
                  <div>
                    <strong>{returnedWorkHeadline(record, itemTarget)}</strong>
                    <small>{receiverTitle(snapshot.threadBridge, itemTarget)} / {receiverSurface(itemReceiver)}</small>
                  </div>
                  <span>{humanLabel(record.recommendation, "Review")}</span>
                </header>
                <dl>
                  <div>
                    <dt>What advanced</dt>
                    <dd>{humanizeTargetText(record.advanced, itemTarget, "The receiver returned a terminal proof receipt.")}</dd>
                  </div>
                  <div>
                    <dt>What this helps decide</dt>
                    <dd>{humanizeTargetText(record.helps_decide, itemTarget, "Review whether this return needs a next packet, assimilation, or no action.")}</dd>
                  </div>
                  <div>
                    <dt>Your useful choices</dt>
                    <dd>{asArray(record.operator_choices).map((choice) => humanLabel(choice)).join(" / ") || "Review / Hold"}</dd>
                  </div>
                  <div>
                    <dt>Receipt</dt>
                    <dd>{asText(record.receiver_receipt_id, "NO_RECEIPT_ID")}</dd>
                  </div>
                </dl>
                <div className="thinkit-relay__action-buttons">
                  {operatorChoices.map((choice) => (
                    <button
                      key={`${itemPacket}-${choice}`}
                      type="button"
                      disabled={actionPending !== null}
                      onClick={() => void recordActionableRecordDecision(record, choice)}
                    >
                      {humanLabel(choice)}
                    </button>
                  ))}
                  {itemPacket.startsWith("BOOK_CHAPTER_EDIT") ? (
                    <button type="button" onClick={() => selectReportAndOpenWorkbench(itemPacket)}>
                      Review Report In Workbench
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
          {actionables.length === 0 ? <p>No returned work is waiting on an operator decision right now.</p> : null}
        </div>
      </section>

      <section className="thinkit-relay__result" aria-label="Last relay action result">
        <header>
          <h3>{lastAction ? lastAction.label : "No button run yet"}</h3>
          <code>{lastAction ? `${lastAction.statusCode} / ${lastAction.endpoint}` : "Click a button to create readback"}</code>
        </header>
        {error ? <p className="thinkit-relay__error">BLOCKER: {error}</p> : null}
        {lastAction ? (
          <dl>
            <div>
              <dt>Status</dt>
              <dd>{lastAction.ok ? "REQUEST_RETURNED" : "REQUEST_BLOCKED"}</dd>
            </div>
            <div>
              <dt>Timestamp</dt>
              <dd>{lastAction.timestamp}</dd>
            </div>
            <div>
              <dt>Packets</dt>
              <dd>{summarizePackets(lastAction.result?.relay_packets ?? lastAction.result?.brainboot_packets ?? lastAction.result?.packets)}</dd>
            </div>
            <div>
              <dt>Proof boundary</dt>
              <dd>Created/queued/sent is not success until receiver and origin-return receipts come back.</dd>
            </div>
          </dl>
        ) : null}
        <pre>{actionSummary}</pre>
      </section>
    </section>
  );
}
