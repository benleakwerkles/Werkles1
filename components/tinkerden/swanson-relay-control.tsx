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
  elwood: JsonRecord | null;
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
  bookCourier: null,
  elwood: null
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

function chapterOptionLabel(chapter: JsonRecord) {
  const chapterNumber = chapter.chapter_number === null ? "Source" : `Ch ${asText(chapter.chapter_number, "?")}`;
  return `${chapterNumber} - ${asText(chapter.title, "Untitled chapter")} (${asText(chapter.extension, "file")})`;
}

function packetChapterLabel(packet: JsonRecord | null, fallback = "No chapter packet selected") {
  if (!packet) return fallback;
  return asText(packet.chapter_title ?? packet.title, fallback);
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
  latestCompletionState: string;
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
    case "QUEUED_FOR_BRIDGE":
      return "Queued to send";
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
  if (status === "QUEUED_FOR_BRIDGE") return "waiting";
  if (status === "HELD_BY_TOPOLOGY") return "held";
  if (status === "LOCAL_CONTROL_THREAD") return "local";
  if (status === "ALIAS_TO_SWANSON") return "alias";
  if (status === "RETURNED_BLOCKER") return "blocked";
  if (status.includes("WAITING")) return "waiting";
  return "unwired";
}

function nextMoveForStatus(status: string, entry: AeyeRosterEntry, latestCompletionState = "") {
  if (entry.statusHint === "retired") return "Do not route new work until the RAM/topology lift receipt exists.";
  if (entry.statusHint === "alias") return "Use Swanson@Doss for this route.";
  if (status === "QUEUED_FOR_BRIDGE" || latestCompletionState === "QUEUED_FOR_CODEX_THREAD_SEND") {
    return "Bridge has a packet queued. It has not become receiver proof until the Aeye writes RECEIVED and then COMPLETED or BLOCKER.";
  }
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
    const latestCompletionState = asText(coverageRecord?.latest_completion_state, "");
    let status =
      coverageStatus ||
      (entry.statusHint === "retired"
        ? "HELD_BY_TOPOLOGY"
        : entry.statusHint === "local"
          ? "LOCAL_CONTROL_THREAD"
          : entry.statusHint === "alias"
            ? "ALIAS_TO_SWANSON"
            : "NOT_WIRED");
    if (latestCompletionState === "QUEUED_FOR_CODEX_THREAD_SEND" && status === "WAITING_FOR_RECEIVER") {
      status = "QUEUED_FOR_BRIDGE";
    }
    if (entry.statusHint === "retired") status = "HELD_BY_TOPOLOGY";
    if (entry.statusHint === "local") status = "LOCAL_CONTROL_THREAD";
    if (entry.statusHint === "alias") status = "ALIAS_TO_SWANSON";
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
      latestCompletionState,
      proofGap: entry.note ?? asText(coverageRecord?.proof_gap, "No proof gap has been written back yet."),
      nextMove: nextMoveForStatus(status, entry, latestCompletionState)
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
  const [selectedIncomingId, setSelectedIncomingId] = useState("");
  const [incomingReplyText, setIncomingReplyText] = useState(
    "Acknowledge this return, name the next useful move, and tell ThinkIt what proof should come back."
  );
  const [chapterText, setChapterText] = useState<JsonRecord | null>(null);
  const [chapterTextLoading, setChapterTextLoading] = useState(false);
  const [chapterTextError, setChapterTextError] = useState<string | null>(null);
  const [threadScope, setThreadScope] = useState("main receiver lane");
  const [universalBody, setUniversalBody] = useState(
    "Return one useful status delta: what you received, what changed on your side, what is blocked, and what ThinkIt should decide next."
  );
  const [momentum, setMomentum] = useState<JsonRecord | null>(null);
  const [selectedMomentumLaneId, setSelectedMomentumLaneId] = useState("nerdkle");
  const [momentumNote, setMomentumNote] = useState(
    "Cool. Move this forward with receiver-side proof, or return the exact blocker."
  );
  const [enderTarget, setEnderTarget] = useState("Ender.Betsy");
  const [enderInstruction, setEnderInstruction] = useState(
    "Filter this returned chapter report for what should be cut, parked, or preserved. Return a concise edit/factoring recommendation with proof gaps."
  );

  async function refresh(reason = "Relay state refreshed") {
    setLoading(true);
    setError(null);
    try {
      const safeRead = async (endpoint: string) => {
        try {
          return await readJson(endpoint);
        } catch (readError) {
          return {
            ok: false,
            status: "READBACK_BLOCKED",
            endpoint,
            error: readError instanceof Error ? readError.message : "Readback failed"
          };
        }
      };
      const [contract, coverage, originReturn, threadBridge, actionableReturns, bookChapters, bookCourier, momentumReadback, elwood] = await Promise.all([
        safeRead("/api/thinkit/swanson/thinkit/relay_merge_contract"),
        safeRead("/api/thinkit/swanson/relay/coverage"),
        safeRead("/api/thinkit/swanson/relay/origin_return"),
        safeRead("/api/thinkit/swanson/relay/thread_bridge/status?limit=80"),
        safeRead("/api/thinkit/swanson/relay/actionable_returns"),
        safeRead("/api/thinkit/swanson/book/chapters"),
        safeRead("/api/thinkit/swanson/book/courier_status?limit=12"),
        safeRead("/api/thinkit/momentum/next_three"),
        safeRead("/api/thinkit/elwood/status")
      ]);
      setSnapshot({ contract, coverage, originReturn, threadBridge, actionableReturns, bookChapters, bookCourier, elwood });
      setMomentum(momentumReadback);
      const blockedReadbacks = [contract, coverage, originReturn, threadBridge, actionableReturns, bookChapters, bookCourier, momentumReadback, elwood].filter(
        (item) => asText(asRecord(item)?.status, "") === "READBACK_BLOCKED"
      );
      if (blockedReadbacks.length > 0) {
        setError(`${blockedReadbacks.length} readback(s) blocked. Loaded every surface that still answered.`);
      }
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
  const sent = asArray(valueAt(snapshot.threadBridge, ["sent"]));
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
  const bookPacketRecords = useMemo(() => bookPackets.map((item) => asRecord(item)).filter((item): item is JsonRecord => Boolean(item)), [bookPackets]);
  const bookPacketById = useMemo(() => {
    const packetMap = new Map<string, JsonRecord>();
    for (const packet of bookPacketRecords) {
      const packetId = asText(packet.packet_id, "");
      if (packetId) packetMap.set(packetId, packet);
    }
    return packetMap;
  }, [bookPacketRecords]);
  const nextUnsentChapter = asRecord(valueAt(snapshot.bookCourier, ["next_unsent_chapter"]));
  const nextUncompletedChapter = asRecord(valueAt(snapshot.bookCourier, ["next_uncompleted_chapter"]));
  const defaultChapterId = asText(nextUnsentChapter?.chapter_id ?? asRecord(bookChapters[0])?.chapter_id, "");
  const selectedChapter = useMemo(
    () => bookChapters.map((item) => asRecord(item)).find((chapter) => asText(chapter?.chapter_id, "") === selectedChapterId) ?? asRecord(bookChapters[0]) ?? null,
    [bookChapters, selectedChapterId]
  );
  const selectedChapterPacket = useMemo(
    () => bookPacketRecords.find((packet) => asText(packet.chapter_id, "") === selectedChapterId) ?? null,
    [bookPacketRecords, selectedChapterId]
  );
  const selectedChapterReports = useMemo(
    () =>
      bookReturnRecords.filter((record) => {
        const packet = bookPacketById.get(asText(record.packet_id, ""));
        return asText(packet?.chapter_id, "") === selectedChapterId;
      }),
    [bookReturnRecords, bookPacketById, selectedChapterId]
  );
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
  const rosterQueued = rosterRows.filter((row) => row.status === "QUEUED_FOR_BRIDGE").length;
  const rosterWaiting = rosterRows.filter((row) => row.status === "WAITING_FOR_RECEIVER" || row.status === "FILE_INBOX_WAITING").length;

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
  const waitingForReceiver = asNumber(coverageSummary?.waiting_for_receiver ?? valueAt(snapshot.contract, ["current_readback", "coverage_summary", "waiting_for_receiver"]));
  const fileInboxWaiting = asNumber(coverageSummary?.file_inbox_waiting ?? valueAt(snapshot.contract, ["current_readback", "coverage_summary", "file_inbox_waiting"]));
  const returnedBlocker = asNumber(coverageSummary?.returned_blocker ?? valueAt(snapshot.contract, ["current_readback", "coverage_summary", "returned_blocker"]));
  const bridgeStatus = asText(actuator?.status ?? valueAt(snapshot.threadBridge, ["actuator", "status"]), "UNKNOWN");
  const momentumLanes = useMemo(() => asArray(momentum?.lanes).map((item) => asRecord(item)).filter((item): item is JsonRecord => Boolean(item)), [momentum]);
  const momentumWorkflow = asRecord(momentum?.workflow);
  const doozerTargets = useMemo(() => asArray(momentumWorkflow?.doozer_targets).map((item) => asText(item, "")).filter(Boolean), [momentumWorkflow]);
  const reviewerTargets = useMemo(() => asArray(momentumWorkflow?.review_targets).map((item) => asText(item, "")).filter(Boolean), [momentumWorkflow]);
  const selectedMomentumLane = useMemo(
    () => momentumLanes.find((lane) => asText(lane.lane_id, "") === selectedMomentumLaneId) ?? momentumLanes[0] ?? null,
    [momentumLanes, selectedMomentumLaneId]
  );
  const selectedMomentumMoves = useMemo(
    () => asArray(selectedMomentumLane?.moves).map((item) => asRecord(item)).filter((item): item is JsonRecord => Boolean(item)),
    [selectedMomentumLane]
  );
  const speakerState = asRecord(valueAt(momentum, ["speaker"]));
  const speakerSurfaces = asArray(valueAt(momentum, ["speaker", "surfaces"])).map((item) => asRecord(item)).filter((item): item is JsonRecord => Boolean(item));
  const recentMomentumDecisions = asArray(momentum?.recent_decisions).map((item) => asRecord(item)).filter((item): item is JsonRecord => Boolean(item));
  const elwoodStatus = asRecord(snapshot.elwood);
  const elwoodRelay = asRecord(elwoodStatus?.relay);
  const elwoodCoordinates = asRecord(elwoodStatus?.current_coordinates);
  const elwoodPaths = asRecord(elwoodStatus?.output_paths);
  const elwoodHashes = asRecord(elwoodStatus?.hashes);
  const elwoodProofGaps = asArray(elwoodStatus?.proof_gaps).map((item) => asText(item, "")).filter(Boolean);
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
  const defaultBookReportId = asText(selectedChapterReports[0]?.packet_id, "");
  const selectedBookReport =
    selectedChapterReports.find((record) => asText(record.packet_id, "") === selectedBookReportId) ??
    selectedChapterReports[0] ??
    null;
  const selectedBookReportPacketId = asText(selectedBookReport?.packet_id, "NO_BOOK_REPORT_SELECTED");
  const selectedBookPacket = bookPacketById.get(selectedBookReportPacketId) ?? selectedChapterPacket;
  const selectedBookReportTarget = asText(selectedBookReport?.target, "Skybro.Betsy");
  const selectedBookReportReceipt = asText(selectedBookReport?.receiver_receipt_id, "NO_RECEIPT_SELECTED");
  const selectedBookReportEvidence = parseEvidenceSections(selectedBookReport?.evidence);
  const selectedChapterTitle = asText(selectedChapter?.title, packetChapterLabel(selectedBookPacket, "No chapter selected"));
  const selectedChapterSource = asText(selectedChapter?.github_url ?? selectedChapter?.repo_path ?? selectedChapter?.local_path, "No source path read back yet.");
  const selectedBookReportChapter = selectedBookReportEvidence.chapter_read || selectedChapterTitle;
  const selectedBookReportRecommendation = selectedBookReportEvidence.recommended_next_edit || "No recommended edit has been parsed yet.";
  const selectedIncoming =
    actionables.find((item) => asText(asRecord(item)?.packet_id, "") === selectedIncomingId) ??
    actionables[0] ??
    null;
  const selectedIncomingRecord = asRecord(selectedIncoming);
  const selectedIncomingPacketId = asText(selectedIncomingRecord?.packet_id, "NO_INCOMING_SELECTED");
  const selectedIncomingTarget = asText(selectedIncomingRecord?.target, "UNKNOWN_TARGET");
  const selectedIncomingReceipt = asText(selectedIncomingRecord?.receiver_receipt_id, "NO_RECEIPT_SELECTED");
  const selectedIncomingHeadline = selectedIncomingRecord ? returnedWorkHeadline(selectedIncomingRecord, selectedIncomingTarget) : "No incoming return selected.";
  const selectedIncomingChange = humanizeTargetText(
    selectedIncomingRecord?.advanced,
    selectedIncomingTarget,
    "No state-change summary was attached to this return."
  );
  const selectedIncomingDecision = humanizeTargetText(
    selectedIncomingRecord?.helps_decide,
    selectedIncomingTarget,
    "No decision prompt was attached to this return."
  );
  const chapterTextBody = asText(chapterText?.text, "");
  const chapterTextParagraphs = asArray(chapterText?.paragraphs);
  const chapterTextStatus = chapterTextLoading
    ? "Loading chapter text"
    : chapterTextError
      ? "Chapter text blocked"
      : asText(chapterText?.extraction_status, "No chapter text loaded");
  const chapterTextMethod = asText(chapterText?.extraction_method, "No extraction method read back yet.");
  const chapterTextCharacters = asNumber(chapterText?.character_count);
  const chapterTextParagraphCount = asNumber(chapterText?.paragraph_count, chapterTextParagraphs.length);

  useEffect(() => {
    if (!selectedChapterId && defaultChapterId) setSelectedChapterId(defaultChapterId);
  }, [defaultChapterId, selectedChapterId]);

  useEffect(() => {
    if ((!selectedMomentumLaneId || !selectedMomentumLane) && momentumLanes[0]) {
      setSelectedMomentumLaneId(asText(momentumLanes[0].lane_id, "nerdkle"));
    }
  }, [momentumLanes, selectedMomentumLane, selectedMomentumLaneId]);

  useEffect(() => {
    if (!selectedBookReportId && defaultBookReportId) setSelectedBookReportId(defaultBookReportId);
  }, [defaultBookReportId, selectedBookReportId]);

  useEffect(() => {
    const reportPacket = selectedBookReportId ? bookPacketById.get(selectedBookReportId) : null;
    if (reportPacket && asText(reportPacket.chapter_id, "") !== selectedChapterId) {
      setSelectedBookReportId(defaultBookReportId);
    }
  }, [bookPacketById, defaultBookReportId, selectedBookReportId, selectedChapterId]);

  useEffect(() => {
    const firstIncomingId = asText(asRecord(actionables[0])?.packet_id, "");
    const stillExists = actionables.some((item) => asText(asRecord(item)?.packet_id, "") === selectedIncomingId);
    if ((!selectedIncomingId || !stillExists) && firstIncomingId) setSelectedIncomingId(firstIncomingId);
  }, [actionables, selectedIncomingId]);

  useEffect(() => {
    let cancelled = false;
    async function loadChapterText() {
      if (!selectedChapterId) {
        setChapterText(null);
        setChapterTextError(null);
        return;
      }
      setChapterTextLoading(true);
      setChapterTextError(null);
      try {
        const result = await readJson(`/api/thinkit/book/chapter_text?chapter_id=${encodeURIComponent(selectedChapterId)}`);
        if (!cancelled) setChapterText(result);
      } catch (loadError) {
        if (!cancelled) {
          setChapterText(null);
          setChapterTextError(loadError instanceof Error ? loadError.message : "Chapter text extraction failed");
        }
      } finally {
        if (!cancelled) setChapterTextLoading(false);
      }
    }
    void loadChapterText();
    return () => {
      cancelled = true;
    };
  }, [selectedChapterId]);

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
    const packet = bookPacketById.get(packetId);
    const chapterId = asText(packet?.chapter_id, "");
    if (chapterId) setSelectedChapterId(chapterId);
    setSelectedBookReportId(packetId);
    window.setTimeout(() => scrollToDashboardSection("thinkit-chapter-workbench"), 0);
  }

  function selectIncomingAndOpen(packetId: string) {
    setSelectedIncomingId(packetId);
    if (packetId.startsWith("BOOK_CHAPTER_EDIT")) {
      const packet = bookPacketById.get(packetId);
      const chapterId = asText(packet?.chapter_id, "");
      if (chapterId) setSelectedChapterId(chapterId);
      setSelectedBookReportId(packetId);
      window.setTimeout(() => scrollToDashboardSection("thinkit-chapter-workbench"), 0);
      return;
    }
    window.setTimeout(() => scrollToDashboardSection("thinkit-incoming-work"), 0);
  }

  function dispatchIncomingReply(label: string, destination: string, packetType: string, title: string, body: string) {
    return runAction(label, "/api/thinkit/swanson/relay/dispatch", {
      packet_type: packetType,
      target: destination,
      title,
      body: [
        `Thread scope: ${threadScope}`,
        `Origin return packet: ${selectedIncomingPacketId}`,
        `Origin receipt: ${selectedIncomingReceipt}`,
        `Return came from: ${humanTargetName(selectedIncomingTarget)}`,
        "",
        "Operator/ThinkIt response:",
        body,
        "",
        "Return requirements:",
        "1. Write RECEIVED first.",
        "2. Return COMPLETED with the answer/artifact, or BLOCKER with exact missing proof.",
        "3. Do not call SENT success."
      ].join("\n")
    });
  }

  function recordIncomingDecision(label: string, choice: string) {
    if (!selectedIncomingRecord) return Promise.resolve();
    return recordActionableRecordDecision(selectedIncomingRecord, choice);
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

  async function runMomentumAction(label: string, payload: JsonRecord) {
    setActionPending(label);
    setError(null);
    try {
      const { statusCode, result } = await postJson("/api/thinkit/momentum/next_three", payload);
      const ok = statusCode >= 200 && statusCode < 300;
      setMomentum(result);
      setLastAction({
        label,
        endpoint: "POST /api/thinkit/momentum/next_three",
        timestamp: new Date().toISOString(),
        ok,
        statusCode,
        result,
        error: ok ? undefined : asText(result.error, "MOMENTUM_ACTION_FAILED")
      });
      await refresh(`${label} returned`);
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : "Momentum action failed";
      setLastAction({
        label,
        endpoint: "POST /api/thinkit/momentum/next_three",
        timestamp: new Date().toISOString(),
        ok: false,
        statusCode: 0,
        result: null,
        error: message
      });
      setError(message);
    } finally {
      setActionPending(null);
    }
  }

  function recordMomentumDecision(lane: JsonRecord, move: JsonRecord, choice: string) {
    return runMomentumAction(`Next Three: ${humanLabel(choice)}`, {
      action: "DECISION",
      lane_id: asText(lane.lane_id, ""),
      move_id: asText(move.move_id, ""),
      choice,
      note: momentumNote
    });
  }

  function dispatchMomentumMove(lane: JsonRecord, move: JsonRecord) {
    return runAction("Send Next Three Packet", "/api/thinkit/swanson/relay/dispatch", {
      packet_type: asText(move.packet_type, "MOMENTUM_NEXT_MOVE"),
      target: asText(move.target, "Petra.Betsy"),
      title: `${asText(lane.project, "Project")}: ${asText(move.title, "Next move")}`,
      body: [
        "MISSION: Help ThinkIt decide and move the next useful project action without making Ben the courier.",
        "",
        `Project lane: ${asText(lane.project, "Unknown project")}`,
        `Dashboard question: ${asText(lane.question, "Is this next move correct?")}`,
        `Move: ${asText(move.title, "Next move")}`,
        `Why this move: ${asText(move.why, "No why field read back.")}`,
        "",
        "Concrete command:",
        asText(move.command, "Return ACK / BLOCKER / ARTIFACT."),
        "",
        "Doozer question:",
        asText(move.doozer_question, "What should the builder/cowork lane do next?"),
        "",
        "Reviewer question:",
        asText(move.review_question, "Should this move be accepted, modified, or killed?"),
        "",
        "Operator note:",
        momentumNote,
        "",
        "Proof required:",
        asText(move.proof_required, "Receiver-side receipt or blocker required."),
        "",
        "Return requirements:",
        "1. Write RECEIVED first.",
        "2. Return COMPLETED with an artifact/report, or BLOCKER with exact missing proof.",
        "3. Do not call SENT success."
      ].join("\n")
    });
  }

  async function dispatchMomentumGroup(label: string, lane: JsonRecord, move: JsonRecord, targets: string[], rolePrompt: string) {
    const groupLabel = `Ask ${label}`;
    setActionPending(groupLabel);
    setError(null);
    const results: JsonRecord[] = [];
    try {
      for (const destination of targets) {
        const { statusCode, result } = await postJson("/api/thinkit/swanson/relay/dispatch", {
          packet_type: `${asText(move.packet_type, "MOMENTUM_NEXT_MOVE")}_${label.toUpperCase().replaceAll(" ", "_")}`,
          target: destination,
          title: `${label}: ${asText(lane.project, "Project")} / ${asText(move.title, "Next move")}`,
          body: [
            `MISSION: ${rolePrompt}`,
            "",
            `Project lane: ${asText(lane.project, "Unknown project")}`,
            `ThinkIt question: ${asText(lane.question, "What should happen next?")}`,
            `Candidate move: ${asText(move.title, "Next move")}`,
            `Why this is on the table: ${asText(move.why, "No why field read back.")}`,
            "",
            "Concrete command under review:",
            asText(move.command, "Return ACK / BLOCKER / ARTIFACT."),
            "",
            "Doozer question:",
            asText(move.doozer_question, "What should the builder/cowork lane do next?"),
            "",
            "Reviewer question:",
            asText(move.review_question, "Should this move be accepted, modified, or killed?"),
            "",
            "Operator note:",
            momentumNote,
            "",
            "Proof required:",
            asText(move.proof_required, "Receiver-side receipt or blocker required."),
            "",
            "Return requirements:",
            "1. Write RECEIVED first.",
            "2. Return COMPLETED with ACCEPT / MODIFY / KILL and evidence, or BLOCKER with exact missing proof.",
            "3. Do not call SENT success."
          ].join("\n")
        });
        results.push({ target: destination, statusCode, result });
      }

      const ok = results.every((item) => asNumber(item.statusCode) >= 200 && asNumber(item.statusCode) < 300);
      setLastAction({
        label: groupLabel,
        endpoint: "POST /v1/relay/dispatch per momentum role target",
        timestamp: new Date().toISOString(),
        ok,
        statusCode: ok ? 201 : 207,
        result: {
          status: ok ? "MOMENTUM_GROUP_PACKETS_QUEUED" : "MOMENTUM_GROUP_PACKETS_PARTIAL",
          group: label,
          targets,
          results,
          proof_boundary: "Queued is not delivery. Each target still needs RECEIVED then COMPLETED or BLOCKER."
        }
      });
      await refresh(`${groupLabel} returned`);
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : `${groupLabel} failed`;
      setLastAction({
        label: groupLabel,
        endpoint: "POST /v1/relay/dispatch per momentum role target",
        timestamp: new Date().toISOString(),
        ok: false,
        statusCode: 0,
        result: { group: label, targets, results },
        error: message
      });
      setError(message);
    } finally {
      setActionPending(null);
    }
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
          <strong>{roundTrip} completed</strong>
          <small>
            {waitingForReceiver} waiting / {queued.length} queued / {targetCount || "?"} mapped
          </small>
        </button>
        <button type="button" className="thinkit-relay__metric-card" onClick={() => scrollToDashboardSection("thinkit-thread-bridge-panel")}>
          <span>Thread bridge</span>
          <strong>{bridgeStatus}</strong>
          <small>{queued.length} queued / {sent.length} sent / {blocked.length} blocked</small>
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
        <button type="button" className="thinkit-relay__metric-card" onClick={() => scrollToDashboardSection("thinkit-elwood-status")}>
          <span>Elwood status</span>
          <strong>{asText(elwoodStatus?.status, "NO_STATUS").replace("ELWOOD_THINKIT_", "")}</strong>
          <small>paper trail for Aeye Brainboot</small>
        </button>
      </div>

      <section id="thinkit-elwood-status" className="thinkit-relay__elwood" aria-label="Elwood ThinkIt status paper trail">
        <header>
          <div>
            <p className="td-bridge__eyebrow">Elwood / faceless Operator clerk</p>
            <h3>ThinkIt is leaving a paper trail now.</h3>
            <p>
              Elwood does not decide or pretend to be an Aeye. It writes ThinkIt status, Brainboot context, and proof gaps to files that Skybro and Petra can read
              without Ben re-teaching the project state.
            </p>
          </div>
          <span>{asText(elwoodStatus?.status, "NO_ELWOOD_READBACK")}</span>
        </header>
        <dl className="thinkit-relay__elwood-grid">
          <div>
            <dt>Active book focus</dt>
            <dd>{asText(elwoodCoordinates?.active_book_focus, "No book focus read back yet.")}</dd>
          </div>
          <div>
            <dt>Active code focus</dt>
            <dd>{asText(elwoodCoordinates?.active_code_focus, "No code focus read back yet.")}</dd>
          </div>
          <div>
            <dt>Relay reality</dt>
            <dd>
              {asNumber(elwoodRelay?.round_trip_proven)}/{asNumber(elwoodRelay?.target_count)} completed, {asNumber(elwoodRelay?.queued_for_bridge)} queued,{" "}
              {asNumber(elwoodRelay?.sent_to_thread)} sent, {asNumber(elwoodRelay?.waiting_for_receiver)} waiting for proof.
            </dd>
          </div>
          <div>
            <dt>Bridge</dt>
            <dd>
              {asText(elwoodRelay?.bridge_status, "UNKNOWN")} / {asText(elwoodRelay?.bridge_schedule, "UNKNOWN_SCHEDULE")}
            </dd>
          </div>
        </dl>
        <div className="thinkit-relay__elwood-files">
          <article>
            <strong>Repo status</strong>
            <code>{asText(elwoodPaths?.repo_markdown, "No repo status file written yet.")}</code>
          </article>
          <article>
            <strong>Speaker mirror</strong>
            <code>{asText(elwoodPaths?.speaker_markdown, "No Speaker status mirror written yet.")}</code>
          </article>
          <article>
            <strong>Brainboot anchor</strong>
            <code>{asText(elwoodPaths?.speaker_brainboot, "No Brainboot anchor written yet.")}</code>
          </article>
          <article>
            <strong>Status hash</strong>
            <code>{asText(elwoodHashes?.repo_json_sha256, "No hash read back yet.")}</code>
          </article>
        </div>
        <div className="thinkit-relay__elwood-gaps">
          <strong>Current proof gaps</strong>
          {elwoodProofGaps.length > 0 ? (
            <ul>
              {elwoodProofGaps.map((gap) => (
                <li key={gap}>{gap}</li>
              ))}
            </ul>
          ) : (
            <p>No Elwood proof gaps read back yet.</p>
          )}
        </div>
      </section>

      <section id="thinkit-next-three-projects" className="thinkit-relay__next-three" aria-label="Next Three Projects">
        <header>
          <div>
            <p className="td-bridge__eyebrow">Momentum / intention machinery</p>
            <h3>Next Three Projects</h3>
            <p>
              Pick a project lane, accept, modify, kill, or send one of the proposed moves. This is the blunt instrument until Nerdkle can compute the next move
              from richer state.
            </p>
          </div>
          <button
            type="button"
            disabled={actionPending !== null}
            onClick={() => void runMomentumAction("Refresh Next Three", { action: "REFRESH_NEXT_THREE", note: momentumNote })}
          >
            {actionPending === "Refresh Next Three" ? "Building" : "G: Build Next Three"}
          </button>
        </header>

        <div className="thinkit-relay__momentum-layout">
          <div className="thinkit-relay__momentum-main">
            <div className="thinkit-relay__lane-tabs" role="tablist" aria-label="Project lanes">
              {momentumLanes.map((lane) => {
                const laneId = asText(lane.lane_id, "unknown");
                const selected = laneId === asText(selectedMomentumLane?.lane_id, "");
                return (
                  <button
                    key={laneId}
                    type="button"
                    data-selected={selected ? "true" : "false"}
                    onClick={() => setSelectedMomentumLaneId(laneId)}
                  >
                    {asText(lane.project, laneId)}
                  </button>
                );
              })}
            </div>

            <div className="thinkit-relay__momentum-flow" aria-label="Doozer proposal and reviewer sign-off loop">
              <article>
                <span>{asText(momentumWorkflow?.builder_team_name, "Doozers")}</span>
                <strong>Propose and shape the next build move.</strong>
                <p>{asText(momentumWorkflow?.builder_team_note, "Maker, Dink, and Ender propose practical work.")}</p>
                <small>{doozerTargets.map(humanTargetName).join(" / ") || "No Doozer targets read back."}</small>
              </article>
              <article>
                <span>{asText(momentumWorkflow?.review_team_name, "Reviewer cousins")}</span>
                <strong>Sign off, modify, or kill drift.</strong>
                <p>{asText(momentumWorkflow?.review_team_note, "Reviewers challenge the idea before it becomes momentum.")}</p>
                <small>{reviewerTargets.map(humanTargetName).join(" / ") || "No reviewer targets read back."}</small>
              </article>
              <article>
                <span>ThinkIt</span>
                <strong>Routes and records proof.</strong>
                <p>{asText(momentumWorkflow?.thinkit_job, "ThinkIt routes packets and refuses to call SENT success.")}</p>
                <small>Packet {"->"} receiver proof {"->"} origin dash</small>
              </article>
            </div>

            <article className="thinkit-relay__momentum-question">
              <header>
                <div>
                  <h4>{asText(selectedMomentumLane?.question, "Select a project lane.")}</h4>
                  <p>{asText(selectedMomentumLane?.state, "No project state has been read back yet.")}</p>
                </div>
                <span>{asText(selectedMomentumLane?.default_mode, "Operator chooses next move.")}</span>
              </header>
              <label>
                <span>Direction / modification note</span>
                <textarea rows={3} value={momentumNote} onChange={(event) => setMomentumNote(event.target.value)} />
              </label>
            </article>

            <div className="thinkit-relay__momentum-moves">
              {selectedMomentumMoves.map((move, index) => (
                <article key={asText(move.move_id, `move-${index}`)} className="thinkit-relay__momentum-card">
                  <header>
                    <div>
                      <span>Move {index + 1}</span>
                      <strong>{asText(move.title, "Untitled move")}</strong>
                    </div>
                    <small>{humanTargetName(asText(move.target, "Petra.Betsy"))}</small>
                  </header>
                  <p>{asText(move.why, "No why field read back.")}</p>
                  <dl>
                    <div>
                      <dt>Command</dt>
                      <dd>{asText(move.command, "No command read back.")}</dd>
                    </div>
                    <div>
                      <dt>Proof</dt>
                      <dd>{asText(move.proof_required, "Receiver-side receipt or blocker required.")}</dd>
                    </div>
                    <div>
                      <dt>Doozer ask</dt>
                      <dd>{asText(move.doozer_question, "What should the builder/cowork lane do next?")}</dd>
                    </div>
                    <div>
                      <dt>Reviewer ask</dt>
                      <dd>{asText(move.review_question, "Should this move be accepted, modified, or killed?")}</dd>
                    </div>
                    <div>
                      <dt>Risk</dt>
                      <dd>{asText(move.risk, "UNKNOWN")}</dd>
                    </div>
                    <div>
                      <dt>Human gate</dt>
                      <dd>{asText(move.human_gate, "Consequence-based approval if execution changes durable state.")}</dd>
                    </div>
                  </dl>
                  <div className="thinkit-relay__momentum-buttons">
                    <button type="button" disabled={actionPending !== null || !selectedMomentumLane} onClick={() => void recordMomentumDecision(selectedMomentumLane ?? {}, move, "ACCEPT")}>
                      Accept
                    </button>
                    <button type="button" disabled={actionPending !== null || !selectedMomentumLane} onClick={() => void recordMomentumDecision(selectedMomentumLane ?? {}, move, "MODIFY")}>
                      Modify
                    </button>
                    <button type="button" disabled={actionPending !== null || !selectedMomentumLane} onClick={() => void recordMomentumDecision(selectedMomentumLane ?? {}, move, "KILL")}>
                      Kill
                    </button>
                    <button type="button" disabled={actionPending !== null || !selectedMomentumLane} onClick={() => void dispatchMomentumMove(selectedMomentumLane ?? {}, move)}>
                      {actionPending === "Send Next Three Packet" ? "Sending" : "Send Packet"}
                    </button>
                    <button
                      type="button"
                      disabled={actionPending !== null || !selectedMomentumLane || doozerTargets.length === 0}
                      onClick={() =>
                        void dispatchMomentumGroup(
                          "Doozers",
                          selectedMomentumLane ?? {},
                          move,
                          doozerTargets,
                          "Doozer/cowork review: propose the smallest concrete build move, name owner, proof, and stop condition."
                        )
                      }
                    >
                      {actionPending === "Ask Doozers" ? "Asking" : "Ask Doozers"}
                    </button>
                    <button
                      type="button"
                      disabled={actionPending !== null || !selectedMomentumLane || reviewerTargets.length === 0}
                      onClick={() =>
                        void dispatchMomentumGroup(
                          "Reviewers",
                          selectedMomentumLane ?? {},
                          move,
                          reviewerTargets,
                          "Reviewer sign-off: accept, modify, or kill this proposed move and name the exact proof gap."
                        )
                      }
                    >
                      {actionPending === "Ask Reviewers" ? "Asking" : "Ask Reviewers"}
                    </button>
                  </div>
                </article>
              ))}
              {selectedMomentumMoves.length === 0 ? <p>No Next Three moves read back for this lane yet.</p> : null}
            </div>
          </div>

          <aside className="thinkit-relay__speaker-readback" aria-label="Speaker and Brainboot memory readback">
            <header>
              <div>
                <p className="td-bridge__eyebrow">Speaker / Brainboot</p>
                <h4>Where memory is hiding</h4>
              </div>
              <span>{asText(speakerState?.status, "UNKNOWN")}</span>
            </header>
            <p>{asText(speakerState?.memory_answer, "Speaker readback has not loaded yet.")}</p>
            <p>{asText(speakerState?.brainboot_rule, "Brainboot proof rule has not loaded yet.")}</p>
            <div className="thinkit-relay__speaker-surfaces">
              {speakerSurfaces.slice(0, 9).map((surface) => (
                <article key={asText(surface.label, asText(surface.path, ""))} data-exists={surface.exists === true ? "true" : "false"}>
                  <strong>{humanLabel(surface.label, "Surface")}</strong>
                  <small>{asText(surface.path, "No path")}</small>
                  <span>
                    {surface.exists === true
                      ? `${asText(surface.kind, "path")} / ${asText(surface.modified_at, "no timestamp")}`
                      : `missing / ${asText(surface.error, "no error read back")}`}
                  </span>
                </article>
              ))}
            </div>
            <div className="thinkit-relay__speaker-buttons">
              <button
                type="button"
                disabled={actionPending !== null}
                onClick={() => void runAction("Brainboot Aeyes", "/api/thinkit/swanson/action/brainboot_dispatch", { targets: ["Skybro.Betsy", "Petra.Betsy"] })}
              >
                {actionPending === "Brainboot Aeyes" ? "Sending" : "Brainboot Aeyes"}
              </button>
              <button type="button" disabled={actionPending !== null} onClick={() => void refresh("Speaker state refreshed")}>
                Refresh Speaker Readback
              </button>
            </div>
            <div className="thinkit-relay__momentum-recent">
              <strong>Recent choices</strong>
              {recentMomentumDecisions.slice(0, 4).map((decision) => (
                <p key={asText(decision.decision_id, asText(decision.created_at, ""))}>
                  {asText(decision.project, "Project")} / {humanLabel(decision.choice, "Choice")} / {asText(decision.move_title, "Move")}
                </p>
              ))}
              {recentMomentumDecisions.length === 0 ? <p>No Next Three choices recorded yet.</p> : null}
            </div>
          </aside>
        </div>
      </section>

      <section id="thinkit-incoming-work" className="thinkit-relay__incoming" aria-label="Incoming work and replies">
        <header>
          <div>
            <p className="td-bridge__eyebrow">Incoming work / returned answers</p>
            <h3>This is where the Aeyes answer back.</h3>
            <p>
              Returned receipts become workable cards here. Pick one, read what changed, then reply, route a follow-up, assimilate, or hold it.
            </p>
          </div>
          <strong>{actionables.length} incoming</strong>
        </header>

        <label className="thinkit-relay__incoming-picker">
          <span>Incoming return to work on</span>
          <select value={selectedIncomingId} onChange={(event) => selectIncomingAndOpen(event.target.value)} disabled={actionables.length === 0}>
            {actionables.length === 0 ? (
              <option value="">No incoming returns yet</option>
            ) : (
              actionables.slice(0, 40).map((item) => {
                const record = asRecord(item) ?? {};
                const packetId = asText(record.packet_id, "UNKNOWN_PACKET");
                const itemTarget = asText(record.target, "UNKNOWN_TARGET");
                return (
                  <option key={packetId} value={packetId}>
                    {returnedWorkHeadline(record, itemTarget)} / {asText(record.receiver_receipt_id, "no receipt id")}
                  </option>
                );
              })
            )}
          </select>
        </label>

        <div className="thinkit-relay__incoming-grid">
          <div className="thinkit-relay__incoming-list">
            {actionables.slice(0, 10).map((item) => {
              const record = asRecord(item) ?? {};
              const packetId = asText(record.packet_id, "UNKNOWN_PACKET");
              const itemTarget = asText(record.target, "UNKNOWN_TARGET");
              const selected = packetId === selectedIncomingPacketId;
              return (
                <button
                  key={packetId}
                  type="button"
                  data-packet-id={packetId}
                  data-selected={selected ? "true" : "false"}
                  onClick={() => selectIncomingAndOpen(packetId)}
                >
                  <span>{returnedWorkHeadline(record, itemTarget)}</span>
                  <small>{humanTargetName(itemTarget)} / {asText(record.receiver_receipt_id, "no receipt id")}</small>
                </button>
              );
            })}
            {actionables.length === 0 ? <p>No incoming returns read back yet.</p> : null}
          </div>

          <article className="thinkit-relay__incoming-detail">
            <header>
              <div>
                <h4>{selectedIncomingHeadline}</h4>
                <p>{selectedIncomingDecision}</p>
              </div>
              <span>{humanTargetName(selectedIncomingTarget)}</span>
            </header>
            <dl className="thinkit-relay__workbench-proof">
              <div>
                <dt>Receiver surface</dt>
                <dd>{receiverSurface(findReceiver(snapshot.threadBridge, selectedIncomingTarget))}</dd>
              </div>
              <div>
                <dt>Thread / inbox</dt>
                <dd>{receiverTitle(snapshot.threadBridge, selectedIncomingTarget)}</dd>
              </div>
              <div>
                <dt>Receipt</dt>
                <dd>{selectedIncomingReceipt}</dd>
              </div>
              <div>
                <dt>Source packet</dt>
                <dd>{selectedIncomingPacketId}</dd>
              </div>
            </dl>
            <div className="thinkit-relay__incoming-copy">
              <strong>What changed</strong>
              <p>{selectedIncomingChange}</p>
              <strong>Evidence</strong>
              <p>{clippedText(selectedIncomingRecord?.evidence, 1800) || "No evidence excerpt read back yet."}</p>
            </div>
            <label>
              <span>Reply / next instruction</span>
              <textarea rows={4} value={incomingReplyText} onChange={(event) => setIncomingReplyText(event.target.value)} />
            </label>
            <div className="thinkit-relay__incoming-buttons">
              <button
                type="button"
                disabled={actionPending !== null || !selectedIncomingRecord}
                onClick={() =>
                  void dispatchIncomingReply(
                    "Reply to Aeye",
                    selectedIncomingTarget,
                    "THINKIT_OPERATOR_REPLY",
                    `ThinkIt reply: ${selectedIncomingPacketId}`,
                    incomingReplyText
                  )
                }
              >
                {actionPending === "Reply to Aeye" ? "Sending" : "Reply To This Aeye"}
              </button>
              <button
                type="button"
                disabled={actionPending !== null || !selectedIncomingRecord}
                onClick={() =>
                  void dispatchIncomingReply(
                    "Ask Petra To Interpret",
                    "Petra.Betsy",
                    "INCOMING_RETURN_INTERPRETATION",
                    `Interpret return: ${selectedIncomingPacketId}`,
                    `Turn this return into a dashboard-readable state delta and one recommended next move.\n\n${incomingReplyText}`
                  )
                }
              >
                {actionPending === "Ask Petra To Interpret" ? "Routing" : "Ask Petra To Interpret"}
              </button>
              <button type="button" disabled={actionPending !== null || !selectedIncomingRecord} onClick={() => void recordIncomingDecision("Assimilate Return", "ASSIMILATE")}>
                {actionPending === "Assimilate Return" ? "Recording" : "Assimilate"}
              </button>
              <button type="button" disabled={actionPending !== null || !selectedIncomingRecord} onClick={() => void recordIncomingDecision("Hold Return", "HOLD")}>
                {actionPending === "Hold Return" ? "Recording" : "Hold"}
              </button>
            </div>
          </article>
        </div>
      </section>

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
                <strong>{roundTrip}</strong> completed round trip(s) means receiver-side COMPLETED proof came back to ThinkIt.{" "}
                <strong>{waitingForReceiver}</strong> waiting target(s) means packets exist but the answer is not back yet. This map separates queued, waiting,
                retired, local-only, and unwired so a zero never looks like a ghost story.
              </p>
            </div>
            <dl className="thinkit-relay__coverage-summary">
              <div>
                <dt>Mapped Aeyes</dt>
                <dd>{rosterRows.length}</dd>
              </div>
              <div>
                <dt>Completed</dt>
                <dd>{rosterAnswered}</dd>
              </div>
              <div>
                <dt>Queued</dt>
                <dd>{rosterQueued}</dd>
              </div>
              <div>
                <dt>Waiting</dt>
                <dd>{rosterWaiting}</dd>
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
                    {rows.filter((row) => row.status === "ROUND_TRIP_PROVEN").length} done / {rows.filter((row) => row.status === "QUEUED_FOR_BRIDGE").length} queued
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
                            <dt>Bridge state</dt>
                            <dd>{row.latestCompletionState || row.status}</dd>
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
            Backend coverage right now: {roundTrip}/{targetCount || "?"} completed, {waitingForReceiver} waiting, {fileInboxWaiting} file-inbox waiting,{" "}
            {returnedBlocker} blockers, {held} backend-held. Local-only and alias rows are real topology facts, but not proof that a separate Aeye chat answered.
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
                return (
                  <option key={chapterId} value={chapterId}>
                    {chapterOptionLabel(chapter)}
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
            disabled={!selectedChapterId}
            onClick={() => {
              setSelectedBookReportId(defaultBookReportId);
              window.setTimeout(() => scrollToDashboardSection("thinkit-chapter-workbench"), 0);
            }}
          >
            Open Selected Chapter
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
              <p className="td-bridge__eyebrow">Chapter workbench / source plus returns</p>
              <h4>{selectedChapterTitle}</h4>
              <p>
                This is the handoff room for the selected chapter. It shows the source, the latest packet state, and any returned report for this exact chapter.
              </p>
            </div>
            <label>
              <span>Workbench chapter</span>
              <select
                value={selectedChapterId}
                onChange={(event) => {
                  setSelectedChapterId(event.target.value);
                  setSelectedBookReportId("");
                }}
              >
                {bookChapters.slice(0, 120).map((item) => {
                  const chapter = asRecord(item) ?? {};
                  const chapterId = asText(chapter.chapter_id, "");
                  return (
                    <option key={chapterId} value={chapterId}>
                      {chapterOptionLabel(chapter)}
                    </option>
                  );
                })}
              </select>
            </label>
            <label>
              <span>Returned report</span>
              <select value={selectedBookReportId} onChange={(event) => setSelectedBookReportId(event.target.value)} disabled={selectedChapterReports.length === 0}>
                {selectedChapterReports.length === 0 ? (
                  <option value="">No return for this chapter yet</option>
                ) : (
                  selectedChapterReports.map((record) => (
                    <option key={asText(record.packet_id, "UNKNOWN_REPORT")} value={asText(record.packet_id, "")}>
                      {asText(record.receiver_receipt_id, asText(record.packet_id, "Book report"))}
                    </option>
                  ))
                )}
              </select>
            </label>
          </header>

          <dl className="thinkit-relay__workbench-proof">
            <div>
              <dt>Chapter</dt>
              <dd>{selectedChapterTitle}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>{selectedChapterSource}</dd>
            </div>
            <div>
              <dt>Packet state</dt>
              <dd>{asText(selectedBookPacket?.status, "No packet sent for this chapter yet")}</dd>
            </div>
            <div>
              <dt>Returned receipt</dt>
              <dd>{selectedBookReport ? selectedBookReportReceipt : "No returned receipt for this chapter yet"}</dd>
            </div>
          </dl>

          <section className="thinkit-relay__chapter-reader" aria-label="Actual chapter text">
            <header>
              <div>
                <p className="td-bridge__eyebrow">Actual chapter text</p>
                <h5>{chapterTextStatus}</h5>
                <p>
                  {chapterTextMethod} / {chapterTextParagraphCount} paragraph(s) / {chapterTextCharacters} character(s)
                </p>
              </div>
              <a href={selectedChapterSource} target="_blank" rel="noreferrer">
                Open Source
              </a>
            </header>
            {chapterTextError ? <p className="thinkit-relay__reader-error">{chapterTextError}</p> : null}
            {chapterTextBody ? (
              <div className="thinkit-relay__chapter-text">
                {chapterTextParagraphs.length > 0
                  ? chapterTextParagraphs.map((paragraph, index) => <p key={`${selectedChapterId}-${index}`}>{asText(paragraph, "")}</p>)
                  : <p>{chapterTextBody}</p>}
              </div>
            ) : (
              <p className="thinkit-relay__reader-empty">
                {chapterTextLoading ? "Reading the source-truth chapter file..." : "No extracted chapter text is available for this file yet."}
              </p>
            )}
          </section>

          <div className="thinkit-relay__workbench-sections">
            <article>
              <span>Selected source</span>
              <p>
                {selectedChapter
                  ? `${chapterOptionLabel(selectedChapter)}\n${asText(selectedChapter.repo_path, "No repo path")}\nsha256: ${asText(selectedChapter.sha256, "No hash")}`
                  : "No chapter selected."}
              </p>
            </article>
            <article>
              <span>Returned by</span>
              <p>
                {selectedBookReport
                  ? `${humanTargetName(selectedBookReportTarget)}\n${receiverInstruction(findReceiver(snapshot.threadBridge, selectedBookReportTarget), selectedBookReportTarget)}`
                  : "No Aeye has returned a report for this selected chapter yet."}
              </p>
            </article>
            <article>
              <span>What works</span>
              <p>{selectedBookReportEvidence.what_works || "No returned what_works field for this chapter yet."}</p>
            </article>
            <article>
              <span>Continuity issues</span>
              <p>{selectedBookReportEvidence.continuity_issues || "No returned continuity_issues field for this chapter yet."}</p>
            </article>
            <article>
              <span>Recommended edit</span>
              <p>{selectedBookReport ? selectedBookReportRecommendation : "Send this chapter, wait for the receiver receipt, or route a source review packet."}</p>
            </article>
            <article>
              <span>Risk / conflict</span>
              <p>{selectedBookReportEvidence.risk_conflict || "No returned risk_conflict field for this chapter yet."}</p>
            </article>
          </div>

          <div className="thinkit-relay__workbench-buttons">
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
              {actionPending === "Send Selected Chapter" ? "Sending" : "Send This Chapter"}
            </button>
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
