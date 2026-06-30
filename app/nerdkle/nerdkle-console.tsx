"use client";

import { FormEvent, useEffect, useState } from "react";

type NerdkleResponse = {
  ok: boolean;
  error?: string;
  artifact_path?: string;
  receipt_path?: string;
  packet_path?: string;
  plan_path?: string;
  object_id?: string;
  execution_owner?: string;
  object?: {
    id: string;
    object_type: string;
    operator_intent: string;
    unresolved_fields: string[];
    human_gates: string[];
    execution_owner: string;
    next_action: string;
    evidence_required: string[];
    failure_condition: string;
  };
};

type NerdkleEvent = {
  event_type: string;
  object_id?: string;
  packet_path?: string;
  plan_path?: string;
  receipt_path?: string;
  stage?: string;
  created_at?: string;
};

type NerdkleGate = {
  object_id: string;
  gate: string;
  stage: string;
  execution_owner: string;
  operator_intent: string;
  next_action: string;
};

type NerdkleReceipt = {
  path: string;
  receipt: {
    id: string;
    object_id: string;
    pass?: boolean;
    outcome?: string;
    created_at?: string;
  };
};

type NerdkleTemplate = {
  id: string;
  label: string;
  intent: string;
};

type NerdkleOwner = {
  owner: string;
  total: number;
  stages: Record<string, number>;
  items: Array<{
    object_id: string;
    stage: string;
    next_action: string;
    operator_intent: string;
  }>;
};

type NerdkleAction = {
  priority: string;
  action_type: string;
  object_id: string;
  execution_owner: string;
  stage: string;
  label: string;
  detail: string;
};

type NerdkleSnapshot = {
  generated_at: string;
  counts: Record<string, number>;
  stages: Record<string, number>;
  owners: Record<string, number>;
  operator_focus: {
    object_id: string;
    stage: string;
    execution_owner: string;
    next_action: string;
    object_path: string;
  } | null;
};

type NerdkleQuality = {
  object_id: string;
  score: number;
  stage: string;
  ready: boolean;
  issues: string[];
  recommendation: string;
};

type NerdkleLineage = {
  object_id: string;
  events: Array<{
    event_type: string;
    created_at?: string;
  }>;
};

type NerdklePreview = {
  object_id: string;
  stage: string;
  quality: {
    score: number;
    recommendation: string;
  };
  preview: {
    would_do: string;
    resulting_stage: string;
  };
};

type NerdkleDetail = {
  object: {
    id: string;
    operator_intent: string;
    execution_owner: string;
    next_action: string;
  };
  object_path: string;
  stage: string;
  quality: {
    score: number;
    recommendation: string;
  };
  receipts: NerdkleReceipt[];
  lineage: NerdkleEvent[];
};

type NerdkleStale = {
  object_id: string;
  stage: string;
  execution_owner: string;
  age_hours: number;
  next_action: string;
};

type NerdkleDuplicate = {
  score: number;
  shared_terms: string[];
  left: {
    object_id: string;
  };
  right: {
    object_id: string;
  };
};

type NerdkleHistoryItem = {
  path: string;
  receipt_path: string | null;
  stage: string;
  questions: Array<{
    field: string;
    question: string;
  }>;
  object: {
    id: string;
    object_type: string;
    operator_intent: string;
    execution_owner: string;
    next_action: string;
    human_gates: string[];
    unresolved_fields: string[];
    status?: {
      stage: string;
      updated_at: string;
      last_receipt_path?: string;
    };
    created_at: string;
  };
};

export function NerdkleConsole() {
  const [intent, setIntent] = useState("I want to bring a simple local proof of Nerdkle into the world by turning this messy sentence into an operating object with a receipt.");
  const [result, setResult] = useState<NerdkleResponse | null>(null);
  const [history, setHistory] = useState<NerdkleHistoryItem[]>([]);
  const [events, setEvents] = useState<NerdkleEvent[]>([]);
  const [gates, setGates] = useState<NerdkleGate[]>([]);
  const [receipts, setReceipts] = useState<NerdkleReceipt[]>([]);
  const [templates, setTemplates] = useState<NerdkleTemplate[]>([]);
  const [owners, setOwners] = useState<NerdkleOwner[]>([]);
  const [actions, setActions] = useState<NerdkleAction[]>([]);
  const [snapshot, setSnapshot] = useState<NerdkleSnapshot | null>(null);
  const [brief, setBrief] = useState("");
  const [quality, setQuality] = useState<NerdkleQuality[]>([]);
  const [lineage, setLineage] = useState<NerdkleLineage[]>([]);
  const [preview, setPreview] = useState<NerdklePreview | null>(null);
  const [detail, setDetail] = useState<NerdkleDetail | null>(null);
  const [stale, setStale] = useState<NerdkleStale[]>([]);
  const [duplicates, setDuplicates] = useState<NerdkleDuplicate[]>([]);
  const [queueCounts, setQueueCounts] = useState<Record<string, number>>({});
  const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({});
  const [receiptNotes, setReceiptNotes] = useState<Record<string, string>>({});
  const [historySearch, setHistorySearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  async function loadHistory() {
    const [objectsResponse, eventsResponse, queueResponse, gatesResponse, receiptsResponse, templatesResponse, ownersResponse, actionsResponse, snapshotResponse, briefResponse, qualityResponse, lineageResponse, staleResponse, duplicatesResponse] = await Promise.all([
      fetch("/api/nerdkle/objects", { cache: "no-store" }),
      fetch("/api/nerdkle/events", { cache: "no-store" }),
      fetch("/api/nerdkle/queue", { cache: "no-store" }),
      fetch("/api/nerdkle/gates", { cache: "no-store" }),
      fetch("/api/nerdkle/receipts", { cache: "no-store" }),
      fetch("/api/nerdkle/templates", { cache: "no-store" }),
      fetch("/api/nerdkle/owners", { cache: "no-store" }),
      fetch("/api/nerdkle/actions", { cache: "no-store" }),
      fetch("/api/nerdkle/snapshot", { cache: "no-store" }),
      fetch("/api/nerdkle/brief", { cache: "no-store" }),
      fetch("/api/nerdkle/quality", { cache: "no-store" }),
      fetch("/api/nerdkle/lineage", { cache: "no-store" }),
      fetch("/api/nerdkle/stale", { cache: "no-store" }),
      fetch("/api/nerdkle/duplicates", { cache: "no-store" })
    ]);
    const objectsPayload = await objectsResponse.json() as { ok: boolean; objects?: NerdkleHistoryItem[] };
    const eventsPayload = await eventsResponse.json() as { ok: boolean; events?: NerdkleEvent[] };
    const queuePayload = await queueResponse.json() as { ok: boolean; counts?: Record<string, number> };
    const gatesPayload = await gatesResponse.json() as { ok: boolean; gates?: NerdkleGate[] };
    const receiptsPayload = await receiptsResponse.json() as { ok: boolean; receipts?: NerdkleReceipt[] };
    const templatesPayload = await templatesResponse.json() as { ok: boolean; templates?: NerdkleTemplate[] };
    const ownersPayload = await ownersResponse.json() as { ok: boolean; owners?: NerdkleOwner[] };
    const actionsPayload = await actionsResponse.json() as { ok: boolean; actions?: NerdkleAction[] };
    const snapshotPayload = await snapshotResponse.json() as { ok: boolean } & Partial<NerdkleSnapshot>;
    const briefPayload = await briefResponse.json() as { ok: boolean; markdown?: string };
    const qualityPayload = await qualityResponse.json() as { ok: boolean; objects?: NerdkleQuality[] };
    const lineagePayload = await lineageResponse.json() as { ok: boolean; lineage?: NerdkleLineage[] };
    const stalePayload = await staleResponse.json() as { ok: boolean; stale?: NerdkleStale[] };
    const duplicatesPayload = await duplicatesResponse.json() as { ok: boolean; duplicates?: NerdkleDuplicate[] };
    if (objectsPayload.ok) setHistory(objectsPayload.objects ?? []);
    if (eventsPayload.ok) setEvents(eventsPayload.events ?? []);
    if (queuePayload.ok) setQueueCounts(queuePayload.counts ?? {});
    if (gatesPayload.ok) setGates(gatesPayload.gates ?? []);
    if (receiptsPayload.ok) setReceipts(receiptsPayload.receipts ?? []);
    if (templatesPayload.ok) setTemplates(templatesPayload.templates ?? []);
    if (ownersPayload.ok) setOwners(ownersPayload.owners ?? []);
    if (actionsPayload.ok) setActions(actionsPayload.actions ?? []);
    if (snapshotPayload.ok && snapshotPayload.generated_at && snapshotPayload.counts && snapshotPayload.stages && snapshotPayload.owners) {
      setSnapshot({
        generated_at: snapshotPayload.generated_at,
        counts: snapshotPayload.counts,
        stages: snapshotPayload.stages,
        owners: snapshotPayload.owners,
        operator_focus: snapshotPayload.operator_focus ?? null
      });
    }
    if (briefPayload.ok) setBrief(briefPayload.markdown ?? "");
    if (qualityPayload.ok) setQuality(qualityPayload.objects ?? []);
    if (lineagePayload.ok) setLineage(lineagePayload.lineage ?? []);
    if (stalePayload.ok) setStale(stalePayload.stale ?? []);
    if (duplicatesPayload.ok) setDuplicates(duplicatesPayload.duplicates ?? []);

    const focusObjectId = snapshotPayload.operator_focus?.object_id ?? objectsPayload.objects?.[0]?.object.id;
    if (focusObjectId) {
      const [previewResponse, detailResponse] = await Promise.all([
        fetch(`/api/nerdkle/preview?object_id=${encodeURIComponent(focusObjectId)}`, { cache: "no-store" }),
        fetch(`/api/nerdkle/detail?object_id=${encodeURIComponent(focusObjectId)}`, { cache: "no-store" })
      ]);
      const previewPayload = await previewResponse.json() as ({ ok: boolean } & NerdklePreview);
      const detailPayload = await detailResponse.json() as ({ ok: boolean } & NerdkleDetail);
      if (previewPayload.ok) setPreview(previewPayload);
      if (detailPayload.ok) setDetail(detailPayload);
    } else {
      setPreview(null);
      setDetail(null);
    }
  }

  useEffect(() => {
    void loadHistory();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/nerdkle/assemble", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent })
      });
      const payload = await response.json() as NerdkleResponse;
      setResult(payload);
      await loadHistory();
    } catch (error) {
      setResult({
        ok: false,
        error: error instanceof Error ? error.message : "Nerdkle assembly failed"
      });
    } finally {
      setLoading(false);
    }
  }

  async function resolveObject(objectId: string) {
    const response = await fetch("/api/nerdkle/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ object_id: objectId, answers: answers[objectId] ?? {} })
    });
    const payload = await response.json() as NerdkleResponse;
    setResult(payload);
    await loadHistory();
  }

  async function closeObject(objectId: string) {
    const response = await fetch("/api/nerdkle/receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        object_id: objectId,
        pass: true,
        outcome: "Operator-facing Nerdkle receipt recorded from console",
        notes: receiptNotes[objectId] ?? ""
      })
    });
    const payload = await response.json() as NerdkleResponse;
    setResult(payload);
    await loadHistory();
  }

  async function createPacket(objectId: string) {
    const response = await fetch("/api/nerdkle/packet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ object_id: objectId })
    });
    const payload = await response.json() as NerdkleResponse;
    setResult(payload);
    await loadHistory();
  }

  async function createPlan(objectId: string) {
    const response = await fetch("/api/nerdkle/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ object_id: objectId })
    });
    const payload = await response.json() as NerdkleResponse;
    setResult(payload);
    await loadHistory();
  }

  const visibleHistory = history.filter((item) => {
    const search = historySearch.trim().toLowerCase();
    const matchesSearch = !search
      || item.object.id.toLowerCase().includes(search)
      || item.object.operator_intent.toLowerCase().includes(search)
      || item.object.next_action.toLowerCase().includes(search);
    const matchesStage = stageFilter === "all" || item.stage === stageFilter;
    const matchesOwner = ownerFilter === "all" || item.object.execution_owner === ownerFilter;
    return matchesSearch && matchesStage && matchesOwner;
  });

  return (
    <section style={{ display: "grid", gap: "20px" }}>
      <form onSubmit={submit} style={{ display: "grid", gap: "14px" }}>
        <label htmlFor="nerdkle-intent" style={{ fontWeight: 800 }}>
          What do you want to bring into the world?
        </label>
        {templates.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setIntent(template.intent)}
                style={{
                  border: "1px solid rgba(31, 24, 20, 0.24)",
                  borderRadius: "999px",
                  background: "#fffaf2",
                  cursor: "pointer",
                  fontWeight: 800,
                  padding: "8px 12px"
                }}
              >
                {template.label}
              </button>
            ))}
          </div>
        ) : null}
        <textarea
          id="nerdkle-intent"
          value={intent}
          onChange={(event) => setIntent(event.target.value)}
          rows={7}
          style={{
            border: "1px solid rgba(159, 102, 51, 0.34)",
            borderRadius: "14px",
            font: "inherit",
            padding: "14px",
            resize: "vertical"
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            justifySelf: "start",
            border: "0",
            borderRadius: "999px",
            background: "#1f1814",
            color: "#fffaf2",
            cursor: loading ? "wait" : "pointer",
            fontWeight: 800,
            padding: "12px 18px"
          }}
        >
          {loading ? "Assembling..." : "Assemble Operating Object"}
        </button>
      </form>

      {result ? (
        <article
          style={{
            background: "rgba(255, 250, 242, 0.96)",
            border: "1px solid rgba(159, 102, 51, 0.34)",
            borderRadius: "18px",
            padding: "20px",
            boxShadow: "0 20px 48px rgba(44, 35, 29, 0.12)"
          }}
        >
          {!result.ok ? (
            <p role="alert" style={{ color: "#7f1d1d", fontWeight: 800 }}>
              {result.error}
            </p>
          ) : null}

          {result.ok && result.packet_path ? (
            <div style={{ display: "grid", gap: "8px" }}>
              <p style={{ margin: 0, color: "#2f6f61", fontWeight: 900 }}>Handoff packet created</p>
              <p style={{ margin: 0 }}>
                Owner: <strong>{result.execution_owner}</strong>
              </p>
              <p style={{ margin: 0 }}>
                Packet: <code>{result.packet_path}</code>
              </p>
            </div>
          ) : null}

          {result.ok && result.plan_path ? (
            <div style={{ display: "grid", gap: "8px" }}>
              <p style={{ margin: 0, color: "#2f6f61", fontWeight: 900 }}>Execution plan created</p>
              <p style={{ margin: 0 }}>
                Owner: <strong>{result.execution_owner}</strong>
              </p>
              <p style={{ margin: 0 }}>
                Plan: <code>{result.plan_path}</code>
              </p>
            </div>
          ) : null}

          {result.ok && result.object ? (
            <div style={{ display: "grid", gap: "14px" }}>
              <p style={{ margin: 0, color: "#2f6f61", fontWeight: 900 }}>Artifact created</p>
              <h2 style={{ margin: 0 }}>{result.object.object_type}: {result.object.id}</h2>
              <dl style={{ display: "grid", gap: "10px", margin: 0 }}>
                <div>
                  <dt style={{ fontWeight: 800 }}>Artifact</dt>
                  <dd style={{ margin: 0 }}><code>{result.artifact_path}</code></dd>
                </div>
                <div>
                  <dt style={{ fontWeight: 800 }}>Receipt</dt>
                  <dd style={{ margin: 0 }}><code>{result.receipt_path}</code></dd>
                </div>
                <div>
                  <dt style={{ fontWeight: 800 }}>Execution owner</dt>
                  <dd style={{ margin: 0 }}>{result.object.execution_owner}</dd>
                </div>
                <div>
                  <dt style={{ fontWeight: 800 }}>Next action</dt>
                  <dd style={{ margin: 0 }}>{result.object.next_action}</dd>
                </div>
                <div>
                  <dt style={{ fontWeight: 800 }}>Unresolved fields</dt>
                  <dd style={{ margin: 0 }}>{result.object.unresolved_fields.join(", ") || "none"}</dd>
                </div>
                <div>
                  <dt style={{ fontWeight: 800 }}>Human gates</dt>
                  <dd style={{ margin: 0 }}>{result.object.human_gates.join(", ")}</dd>
                </div>
                <div>
                  <dt style={{ fontWeight: 800 }}>Failure condition</dt>
                  <dd style={{ margin: 0 }}>{result.object.failure_condition}</dd>
                </div>
              </dl>
            </div>
          ) : null}
        </article>
      ) : null}

      <article
        style={{
          background: "rgba(255, 250, 242, 0.9)",
          border: "1px solid rgba(159, 102, 51, 0.28)",
          borderRadius: "18px",
          padding: "20px"
        }}
      >
        <h2 style={{ marginTop: 0 }}>Next Best Actions</h2>
        {actions.length === 0 ? (
          <p>No open Nerdkle actions.</p>
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {actions.slice(0, 6).map((action) => (
              <section key={`${action.object_id}-${action.action_type}`}>
                <strong>{action.priority}: {action.label}</strong>
                <p style={{ margin: "4px 0" }}>
                  Object: <code>{action.object_id}</code> | Owner: {action.execution_owner} | Stage: {action.stage}
                </p>
                <p style={{ margin: "4px 0" }}>{action.detail}</p>
              </section>
            ))}
          </div>
        )}
      </article>

      <article
        style={{
          background: "rgba(255, 250, 242, 0.88)",
          border: "1px solid rgba(159, 102, 51, 0.28)",
          borderRadius: "18px",
          padding: "20px"
        }}
      >
        <h2 style={{ marginTop: 0 }}>System Snapshot</h2>
        {!snapshot ? (
          <p>Snapshot not loaded yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "8px" }}>
            <small>Generated: {snapshot.generated_at}</small>
            <p style={{ margin: 0 }}>
              {Object.entries(snapshot.counts).map(([key, value]) => `${key}: ${value}`).join(" | ")}
            </p>
            {snapshot.operator_focus ? (
              <p style={{ margin: 0 }}>
                Focus: <code>{snapshot.operator_focus.object_id}</code> | {snapshot.operator_focus.stage} | {snapshot.operator_focus.next_action}
              </p>
            ) : (
              <p style={{ margin: 0 }}>Focus: none</p>
            )}
          </div>
        )}
      </article>

      <article
        style={{
          background: "rgba(255, 250, 242, 0.84)",
          border: "1px solid rgba(159, 102, 51, 0.28)",
          borderRadius: "18px",
          padding: "20px"
        }}
      >
        <h2 style={{ marginTop: 0 }}>Quality Board</h2>
        {quality.length === 0 ? (
          <p>No quality scores yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "8px" }}>
            {quality.slice(0, 6).map((item) => (
              <section key={item.object_id}>
                <strong>{item.score}/100 - {item.ready ? "ready" : "not ready"}</strong>
                <p style={{ margin: "4px 0" }}>
                  Object: <code>{item.object_id}</code> | Stage: {item.stage}
                </p>
                <p style={{ margin: "4px 0" }}>{item.recommendation}</p>
              </section>
            ))}
          </div>
        )}
      </article>

      <article
        style={{
          background: "rgba(255, 250, 242, 0.84)",
          border: "1px solid rgba(159, 102, 51, 0.28)",
          borderRadius: "18px",
          padding: "20px"
        }}
      >
        <h2 style={{ marginTop: 0 }}>Focused Object Detail</h2>
        {detail ? (
          <div style={{ display: "grid", gap: "6px" }}>
            <p style={{ margin: 0 }}>
              Object: <code>{detail.object.id}</code> | Stage: {detail.stage} | Score: {detail.quality.score}
            </p>
            <p style={{ margin: 0 }}>Owner: {detail.object.execution_owner}</p>
            <p style={{ margin: 0 }}>Next: {detail.object.next_action}</p>
            <p style={{ margin: 0 }}>
              Receipts: {detail.receipts.length} | Lineage events: {detail.lineage.length}
            </p>
            <small>Path: <code>{detail.object_path}</code></small>
          </div>
        ) : (
          <p>No focused object detail available.</p>
        )}
      </article>

      <article
        style={{
          background: "rgba(255, 250, 242, 0.84)",
          border: "1px solid rgba(159, 102, 51, 0.28)",
          borderRadius: "18px",
          padding: "20px"
        }}
      >
        <h2 style={{ marginTop: 0 }}>Stale Work Watch</h2>
        {stale.length === 0 ? (
          <p>No stale open Nerdkle work.</p>
        ) : (
          <div style={{ display: "grid", gap: "8px" }}>
            {stale.map((item) => (
              <section key={item.object_id}>
                <strong><code>{item.object_id}</code> - {item.age_hours}h old</strong>
                <p style={{ margin: "4px 0" }}>
                  {item.stage} | {item.execution_owner} | {item.next_action}
                </p>
              </section>
            ))}
          </div>
        )}
      </article>

      <article
        style={{
          background: "rgba(255, 250, 242, 0.84)",
          border: "1px solid rgba(159, 102, 51, 0.28)",
          borderRadius: "18px",
          padding: "20px"
        }}
      >
        <h2 style={{ marginTop: 0 }}>Duplicate Intent Watch</h2>
        {duplicates.length === 0 ? (
          <p>No likely duplicate Nerdkle objects.</p>
        ) : (
          <div style={{ display: "grid", gap: "8px" }}>
            {duplicates.map((item) => (
              <section key={`${item.left.object_id}-${item.right.object_id}`}>
                <strong>{item.score}% overlap</strong>
                <p style={{ margin: "4px 0" }}>
                  <code>{item.left.object_id}</code> vs <code>{item.right.object_id}</code>
                </p>
                <small>Shared: {item.shared_terms.join(", ")}</small>
              </section>
            ))}
          </div>
        )}
      </article>

      <article
        style={{
          background: "rgba(255, 250, 242, 0.84)",
          border: "1px solid rgba(159, 102, 51, 0.28)",
          borderRadius: "18px",
          padding: "20px"
        }}
      >
        <h2 style={{ marginTop: 0 }}>Next Mutation Preview</h2>
        {preview ? (
          <div style={{ display: "grid", gap: "6px" }}>
            <p style={{ margin: 0 }}>
              Object: <code>{preview.object_id}</code> | Stage: {preview.stage} | Score: {preview.quality.score}
            </p>
            <p style={{ margin: 0 }}>
              Would do: <strong>{preview.preview.would_do}</strong> | Resulting stage: {preview.preview.resulting_stage}
            </p>
            <p style={{ margin: 0 }}>{preview.quality.recommendation}</p>
          </div>
        ) : (
          <p>No preview available yet.</p>
        )}
      </article>

      <article
        style={{
          background: "rgba(255, 250, 242, 0.84)",
          border: "1px solid rgba(159, 102, 51, 0.28)",
          borderRadius: "18px",
          padding: "20px"
        }}
      >
        <h2 style={{ marginTop: 0 }}>Lineage</h2>
        {lineage.length === 0 ? (
          <p>No lineage events yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "8px" }}>
            {lineage.slice(0, 6).map((item) => (
              <section key={item.object_id}>
                <strong><code>{item.object_id}</code></strong>
                <p style={{ margin: "4px 0" }}>
                  {item.events.map((event) => event.event_type).join(" -> ")}
                </p>
              </section>
            ))}
          </div>
        )}
      </article>

      <article
        style={{
          background: "rgba(255, 250, 242, 0.82)",
          border: "1px solid rgba(159, 102, 51, 0.28)",
          borderRadius: "18px",
          padding: "20px"
        }}
      >
        <h2 style={{ marginTop: 0 }}>Operator Brief</h2>
        {brief ? (
          <pre
            style={{
              background: "#fffaf2",
              border: "1px solid rgba(159, 102, 51, 0.24)",
              borderRadius: "12px",
              overflowX: "auto",
              padding: "12px",
              whiteSpace: "pre-wrap"
            }}
          >
            {brief}
          </pre>
        ) : (
          <p>No brief available yet.</p>
        )}
      </article>

      <article
        style={{
          background: "rgba(255, 250, 242, 0.88)",
          border: "1px solid rgba(159, 102, 51, 0.28)",
          borderRadius: "18px",
          padding: "20px"
        }}
      >
        <h2 style={{ marginTop: 0 }}>Nerdkle Work Queue</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {Object.entries(queueCounts).map(([stage, count]) => (
            <span
              key={stage}
              style={{
                background: "#fffaf2",
                border: "1px solid rgba(159, 102, 51, 0.24)",
                borderRadius: "999px",
                padding: "8px 10px"
              }}
            >
              <strong>{stage}</strong>: {count}
            </span>
          ))}
        </div>
      </article>

      <article
        style={{
          background: "rgba(255, 250, 242, 0.82)",
          border: "1px solid rgba(159, 102, 51, 0.28)",
          borderRadius: "18px",
          padding: "20px"
        }}
      >
        <h2 style={{ marginTop: 0 }}>Owner Workload</h2>
        {owners.length === 0 ? (
          <p>No assigned Nerdkle owners yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {owners.map((owner) => (
              <section key={owner.owner}>
                <strong>{owner.owner}: {owner.total}</strong>
                <p style={{ margin: "4px 0" }}>
                  {Object.entries(owner.stages).map(([stage, count]) => `${stage}: ${count}`).join(" | ")}
                </p>
                {owner.items.slice(0, 3).map((item) => (
                  <small key={item.object_id} style={{ display: "block" }}>
                    <code>{item.object_id}</code> - {item.stage} - {item.next_action}
                  </small>
                ))}
              </section>
            ))}
          </div>
        )}
      </article>

      <article
        style={{
          background: "rgba(255, 250, 242, 0.82)",
          border: "1px solid rgba(159, 102, 51, 0.28)",
          borderRadius: "18px",
          padding: "20px"
        }}
      >
        <h2 style={{ marginTop: 0 }}>Operating Object History</h2>
        <div style={{ display: "grid", gap: "8px", marginBottom: "12px" }}>
          <input
            aria-label="Search Nerdkle objects"
            placeholder="Search intent, object id, or next action"
            value={historySearch}
            onChange={(event) => setHistorySearch(event.target.value)}
            style={{
              border: "1px solid rgba(159, 102, 51, 0.34)",
              borderRadius: "10px",
              font: "inherit",
              padding: "8px"
            }}
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <select
              aria-label="Filter by stage"
              value={stageFilter}
              onChange={(event) => setStageFilter(event.target.value)}
              style={{ borderRadius: "10px", font: "inherit", padding: "8px" }}
            >
              <option value="all">All stages</option>
              {Object.keys(queueCounts).map((stage) => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
            <select
              aria-label="Filter by owner"
              value={ownerFilter}
              onChange={(event) => setOwnerFilter(event.target.value)}
              style={{ borderRadius: "10px", font: "inherit", padding: "8px" }}
            >
              <option value="all">All owners</option>
              {owners.map((owner) => (
                <option key={owner.owner} value={owner.owner}>{owner.owner}</option>
              ))}
            </select>
          </div>
        </div>
        {history.length === 0 ? (
          <p>No Nerdkle objects yet.</p>
        ) : visibleHistory.length === 0 ? (
          <p>No Nerdkle objects match the current filters.</p>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {visibleHistory.slice(0, 8).map((item) => (
              <section
                key={item.object.id}
                style={{
                  borderTop: "1px solid rgba(159, 102, 51, 0.22)",
                  paddingTop: "12px"
                }}
              >
                <strong>{item.object.object_type}: {item.object.id}</strong>
                <p style={{ margin: "6px 0" }}>{item.object.operator_intent}</p>
                <p style={{ margin: "6px 0" }}>
                  Stage: <strong>{item.stage}</strong> | Owner: <strong>{item.object.execution_owner}</strong> | Gates: {item.object.human_gates.join(", ")}
                </p>
                <p style={{ margin: "6px 0" }}>Next: {item.object.next_action}</p>
                <button
                  type="button"
                  onClick={() => void createPacket(item.object.id)}
                  style={{
                    justifySelf: "start",
                    border: "1px solid rgba(31, 24, 20, 0.24)",
                    borderRadius: "999px",
                    background: "#fffaf2",
                    cursor: "pointer",
                    fontWeight: 800,
                    padding: "8px 12px"
                  }}
                >
                  Create Handoff Packet
                </button>
                <button
                  type="button"
                  onClick={() => void createPlan(item.object.id)}
                  style={{
                    justifySelf: "start",
                    border: "1px solid rgba(31, 24, 20, 0.24)",
                    borderRadius: "999px",
                    background: "#fffaf2",
                    cursor: "pointer",
                    fontWeight: 800,
                    marginLeft: "8px",
                    padding: "8px 12px"
                  }}
                >
                  Create Execution Plan
                </button>
                {item.questions.length > 0 ? (
                  <div style={{ display: "grid", gap: "8px", margin: "10px 0" }}>
                    <strong>Questions to unlock execution</strong>
                    {item.questions.map((question) => (
                      <label key={question.field} style={{ display: "grid", gap: "4px" }}>
                        <span>{question.question}</span>
                        <input
                          value={answers[item.object.id]?.[question.field] ?? ""}
                          onChange={(event) => setAnswers((current) => ({
                            ...current,
                            [item.object.id]: {
                              ...(current[item.object.id] ?? {}),
                              [question.field]: event.target.value
                            }
                          }))}
                          style={{
                            border: "1px solid rgba(159, 102, 51, 0.34)",
                            borderRadius: "10px",
                            font: "inherit",
                            padding: "8px"
                          }}
                        />
                      </label>
                    ))}
                    <button
                      type="button"
                      onClick={() => void resolveObject(item.object.id)}
                      style={{
                        justifySelf: "start",
                        border: "1px solid rgba(31, 24, 20, 0.24)",
                        borderRadius: "999px",
                        background: "#fffaf2",
                        cursor: "pointer",
                        fontWeight: 800,
                        padding: "8px 12px"
                      }}
                    >
                      Save Answers
                    </button>
                  </div>
                ) : null}
                {item.stage === "ready_for_execution" || item.stage === "waiting_on_human_gate" ? (
                  <div style={{ display: "grid", gap: "8px", margin: "10px 0" }}>
                    <label style={{ display: "grid", gap: "4px" }}>
                      <span>Receipt note</span>
                      <input
                        value={receiptNotes[item.object.id] ?? ""}
                        onChange={(event) => setReceiptNotes((current) => ({
                          ...current,
                          [item.object.id]: event.target.value
                        }))}
                        style={{
                          border: "1px solid rgba(159, 102, 51, 0.34)",
                          borderRadius: "10px",
                          font: "inherit",
                          padding: "8px"
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => void closeObject(item.object.id)}
                      style={{
                        justifySelf: "start",
                        border: "0",
                        borderRadius: "999px",
                        background: "#2f6f61",
                        color: "#fffaf2",
                        cursor: "pointer",
                        fontWeight: 800,
                        padding: "8px 12px"
                      }}
                    >
                      Record Completion Receipt
                    </button>
                  </div>
                ) : null}
                <small>
                  Artifact: <code>{item.path}</code>
                  {item.receipt_path ? <> | Receipt: <code>{item.receipt_path}</code></> : null}
                </small>
              </section>
            ))}
          </div>
        )}
      </article>

      <article
        style={{
          background: "rgba(255, 250, 242, 0.82)",
          border: "1px solid rgba(159, 102, 51, 0.28)",
          borderRadius: "18px",
          padding: "20px"
        }}
      >
        <h2 style={{ marginTop: 0 }}>Human Gate Docket</h2>
        {gates.length === 0 ? (
          <p>No true human gates currently detected.</p>
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {gates.map((gate) => (
              <section key={`${gate.object_id}-${gate.gate}`}>
                <strong>{gate.gate}</strong>
                <p style={{ margin: "4px 0" }}>
                  Object: <code>{gate.object_id}</code> | Owner: {gate.execution_owner} | Stage: {gate.stage}
                </p>
                <p style={{ margin: "4px 0" }}>{gate.next_action}</p>
              </section>
            ))}
          </div>
        )}
      </article>

      <article
        style={{
          background: "rgba(255, 250, 242, 0.82)",
          border: "1px solid rgba(159, 102, 51, 0.28)",
          borderRadius: "18px",
          padding: "20px"
        }}
      >
        <h2 style={{ marginTop: 0 }}>Receipt Ledger</h2>
        {receipts.length === 0 ? (
          <p>No Nerdkle receipts yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "8px" }}>
            {receipts.slice(0, 8).map((item) => (
              <section key={item.path}>
                <strong>{item.receipt.id}</strong>
                <p style={{ margin: "4px 0" }}>
                  Object: <code>{item.receipt.object_id}</code> | Pass: {String(item.receipt.pass ?? true)}
                </p>
                <small>
                  Path: <code>{item.path}</code>
                  {item.receipt.created_at ? <> | {item.receipt.created_at}</> : null}
                </small>
              </section>
            ))}
          </div>
        )}
      </article>

      <article
        style={{
          background: "rgba(255, 250, 242, 0.82)",
          border: "1px solid rgba(159, 102, 51, 0.28)",
          borderRadius: "18px",
          padding: "20px"
        }}
      >
        <h2 style={{ marginTop: 0 }}>Event Stream</h2>
        {events.length === 0 ? (
          <p>No Nerdkle events yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "8px" }}>
            {events.slice(0, 12).map((event, index) => (
              <section key={`${event.event_type}-${event.created_at ?? index}`}>
                <strong>{event.event_type}</strong>
                <p style={{ margin: "4px 0" }}>
                  {event.object_id ? <>Object: <code>{event.object_id}</code></> : null}
                  {event.stage ? <> | Stage: {event.stage}</> : null}
                </p>
                <small>
                  {event.packet_path ? <>Packet: <code>{event.packet_path}</code> | </> : null}
                  {event.plan_path ? <>Plan: <code>{event.plan_path}</code> | </> : null}
                  {event.receipt_path ? <>Receipt: <code>{event.receipt_path}</code> | </> : null}
                  {event.created_at ?? "no timestamp"}
                </small>
              </section>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
