"use client";

import { useState } from "react";

import type {
  DecisionButton,
  HumanGate,
  ReceiptCenterEntry,
  ReceiptCenterStatus
} from "@/protocol/index";

import type { ReactionEntry } from "@/lib/soledash/options-deck/types";

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    return `${hh}:${mm} UTC`;
  } catch {
    return iso;
  }
}

function statusSlug(status: ReceiptCenterStatus): string {
  return status.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function MobileFrontierPanel({
  frontierCode,
  frontierTitle,
  proposalSummary,
  waitingGatesCount,
  waitingGatesHint,
  blockerHeadline,
  humanGate,
  reactions
}: {
  frontierCode: string;
  frontierTitle: string;
  proposalSummary: string | null;
  waitingGatesCount: number;
  waitingGatesHint: string | null;
  blockerHeadline: string | null;
  humanGate: HumanGate;
  reactions: ReactionEntry[];
}) {
  const moved = reactions.slice(0, 3);

  return (
    <section className="sd-mfc-frontier" aria-label="Current frontier">
      <p className="sd-mfc-frontier__eyebrow">Active mission</p>
      <p className="sd-mfc-frontier__code">{frontierCode}</p>
      <h2 className="sd-mfc-frontier__title">{frontierTitle}</h2>
      {proposalSummary ? (
        <p className="sd-mfc-frontier__waiting">
          <span className="sd-mfc-frontier__waiting-label">Waiting on Ben</span>
          {proposalSummary}
        </p>
      ) : null}
      {waitingGatesCount > 0 ? (
        <div className="sd-mfc-frontier__gates sd-mfc-frontier__gates--alert">
          <span className="sd-mfc-frontier__gates-num">{waitingGatesCount}</span>
          <span>{waitingGatesHint ?? humanGate.operator_prompt}</span>
        </div>
      ) : humanGate.operator_line ? (
        <p className="sd-mfc-frontier__gate-line">{humanGate.operator_line}</p>
      ) : null}
      {blockerHeadline ? (
        <p className="sd-mfc-frontier__blocker" role="alert">
          Blocker: {blockerHeadline}
        </p>
      ) : null}
      {moved.length > 0 ? (
        <div className="sd-mfc-frontier__moved" aria-label="What moved since last check">
          <p className="sd-mfc-frontier__moved-label">Moved since last check</p>
          <ul className="sd-mfc-frontier__moved-list">
            {moved.map((r) => (
              <li key={r.id} className={`sd-mfc-frontier__moved-item sd-mfc-frontier__moved-item--${r.tone}`}>
                <span className="sd-mfc-frontier__moved-head">{r.headline}</span>
                <span className="sd-mfc-frontier__moved-detail">{r.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export type MobileHandAction = "yea" | "nay" | "needs_research" | "kill_test";

export function MobileHandsPanel({
  humanGate,
  busy,
  activeAction,
  yeaPendingConfirm,
  routeButtons,
  unavailable,
  onApprove,
  onReject,
  onNeedsResearch,
  onKillTest,
  onYeaConfirm,
  onYeaCancel
}: {
  humanGate: HumanGate;
  busy: boolean;
  activeAction: string | null;
  yeaPendingConfirm: boolean;
  routeButtons: DecisionButton[];
  unavailable: boolean;
  onApprove: (reason: string) => void;
  onReject: (reason: string) => void;
  onNeedsResearch: (reason: string) => void;
  onKillTest: (reason: string) => void;
  onYeaConfirm: (reason: string) => void;
  onYeaCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const needsResearch = routeButtons.find((b) => b.id === "needs_research");
  const killTest = routeButtons.find((b) => b.id === "kill_test");

  if (yeaPendingConfirm) {
    return (
      <section className="sd-mfc-hands sd-mfc-hands--confirm" aria-label="Confirm approve">
        <p className="sd-mfc-hands__prompt">Approve frontier action?</p>
        {reason.trim() ? <p className="sd-mfc-hands__reason-preview">Reason: {reason.trim()}</p> : null}
        <div className="sd-mfc-hands__row">
          <button
            type="button"
            className="sd-mfc-hands__btn sd-mfc-hands__btn--approve"
            disabled={busy}
            onClick={() => onYeaConfirm(reason)}
          >
            {busy && activeAction === "yea" ? "Sending…" : "Confirm approve"}
          </button>
          <button
            type="button"
            className="sd-mfc-hands__btn sd-mfc-hands__btn--ghost"
            disabled={busy}
            onClick={onYeaCancel}
          >
            Cancel
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="sd-mfc-hands" aria-label="Human gate hands">
      <div className="sd-mfc-hands__head">
        <p className="sd-mfc-hands__label">Hands</p>
        <p className="sd-mfc-hands__prompt">{humanGate.operator_prompt}</p>
      </div>
      <label className="sd-mfc-hands__reason-label" htmlFor="sd-mfc-reason">
        Short reason (optional)
      </label>
      <input
        id="sd-mfc-reason"
        type="text"
        className="sd-mfc-hands__reason"
        placeholder="Why approve, reject, or route…"
        value={reason}
        disabled={busy || unavailable}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="sd-mfc-hands__grid">
        <button
          type="button"
          className="sd-mfc-hands__btn sd-mfc-hands__btn--approve"
          disabled={busy || unavailable}
          title={unavailable ? "Live payload unavailable" : undefined}
          onClick={() => onApprove(reason)}
        >
          {busy && activeAction === "yea" ? "…" : "Approve"}
        </button>
        <button
          type="button"
          className="sd-mfc-hands__btn sd-mfc-hands__btn--reject"
          disabled={busy || unavailable}
          onClick={() => onReject(reason)}
        >
          {busy && activeAction === "nay" ? "…" : "Reject"}
        </button>
        <button
          type="button"
          className="sd-mfc-hands__btn sd-mfc-hands__btn--research"
          disabled={busy || unavailable || !needsResearch?.enabled}
          title={needsResearch?.reason_disabled ?? undefined}
          onClick={() => onNeedsResearch(reason)}
        >
          {busy && activeAction === "needs_research" ? "…" : "Needs research"}
        </button>
        <button
          type="button"
          className="sd-mfc-hands__btn sd-mfc-hands__btn--kill"
          disabled={busy || unavailable || !killTest?.enabled}
          title={killTest?.reason_disabled ?? undefined}
          onClick={() => onKillTest(reason)}
        >
          {busy && activeAction === "kill_test" ? "…" : "Kill test"}
        </button>
      </div>
      {!needsResearch?.enabled && needsResearch?.reason_disabled ? (
        <p className="sd-mfc-hands__disabled-hint">{needsResearch.reason_disabled}</p>
      ) : null}
    </section>
  );
}

function receiptRows(entry: ReceiptCenterEntry): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [
    { label: "Target", value: entry.target },
    { label: "Status", value: entry.status },
    { label: "Action ID", value: entry.action_id },
    { label: "Owner", value: entry.owner ?? "—" },
    { label: "Updated", value: formatTime(entry.last_update) },
    { label: "Created", value: formatTime(entry.created_at) }
  ];
  if (entry.receipt_link) rows.push({ label: "Receipt path", value: entry.receipt_link });
  if (entry.simulated) rows.push({ label: "Transport", value: "SIMULATED (file-backed)" });
  else if (entry.mock_test) rows.push({ label: "Transport", value: "MOCK TEST" });
  else if (entry.mock) rows.push({ label: "Transport", value: "MOCK" });
  else rows.push({ label: "Transport", value: "LIVE" });
  return rows;
}

export function MobileReceiptList({ entries }: { entries: ReceiptCenterEntry[] }) {
  const [open, setOpen] = useState<ReceiptCenterEntry | null>(null);
  const list = entries.slice(0, 12);

  return (
    <section className="sd-mfc-receipts" aria-label="Receipts">
      <div className="sd-mfc-receipts__head">
        <h2 className="sd-mfc-receipts__title">Receipts</h2>
        <span className="sd-mfc-receipts__count">{entries.length}</span>
      </div>
      {list.length === 0 ? (
        <p className="sd-mfc-receipts__empty">No receipts yet — fire a card or use Hands.</p>
      ) : (
        <ul className="sd-mfc-receipts__list">
          {list.map((entry) => (
            <li key={entry.action_id}>
              <button
                type="button"
                className={`sd-mfc-receipts__row sd-mfc-receipts__row--${statusSlug(entry.status)}`}
                onClick={() => setOpen(entry)}
              >
                <span className={`sd-mfc-receipts__status sd-mfc-receipts__status--${statusSlug(entry.status)}`}>
                  {entry.status}
                </span>
                <span className="sd-mfc-receipts__target">{entry.target}</span>
                <span className="sd-mfc-receipts__time">{formatTime(entry.last_update)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <div className="auto-relay__modal-backdrop" role="presentation" onClick={() => setOpen(null)}>
          <div
            className="auto-relay__modal sd-mfc-receipts__modal"
            role="dialog"
            aria-label="Receipt detail"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="auto-relay__modal-head">
              <h3>Receipt</h3>
              <button type="button" onClick={() => setOpen(null)}>
                Close
              </button>
            </div>
            <dl className="auto-relay__receipt-readable">
              {receiptRows(open).map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      ) : null}
    </section>
  );
}
