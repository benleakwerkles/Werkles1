"use client";

import { useCallback, useEffect, useState } from "react";

import type { RelayCardView } from "@/lib/soledash/automatica-relay/types";

const POLL_MS = 4000;

function stateClass(state: string): string {
  return state.toLowerCase().replace(/\s+/g, "-");
}

function formatReceiptReadable(receipt: Record<string, unknown>): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  const pick = (key: string, label: string) => {
    const v = receipt[key];
    if (v == null || v === "") return;
    rows.push({ label, value: String(v) });
  };
  pick("card_name", "Card");
  pick("status", "Status");
  pick("packet_id", "Packet ID");
  pick("timestamp", "Fired at");
  pick("updated_at", "Updated");
  pick("success", "Success");
  pick("blocker", "Blocker");
  pick("error", "Error");
  pick("packet_path", "Packet path");
  pick("receipt_path", "Receipt path");
  pick("outbound_path", "Outbound path");
  pick("next_action", "Next action");
  pick("next_missing_integration", "Missing integration");
  return rows;
}

export function AutomaticaRelayGrid({ onRefresh }: { onRefresh?: () => void | Promise<void> }) {
  const [cards, setCards] = useState<RelayCardView[]>([]);
  const [loading, setLoading] = useState(true);
  const [firingId, setFiringId] = useState<string | null>(null);
  const [confirmCard, setConfirmCard] = useState<RelayCardView | null>(null);
  const [receiptModal, setReceiptModal] = useState<Record<string, unknown> | null>(null);
  const [dirs, setDirs] = useState({ packet_dir: "", receipt_dir: "" });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/soledash/v1/automatica-relay", { cache: "no-store" });
      const data = await res.json();
      if (data.cards) setCards(data.cards);
      if (data.packet_dir) {
        setDirs({ packet_dir: data.packet_dir, receipt_dir: data.receipt_dir });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  async function fire(cardId: string) {
    setFiringId(cardId);
    try {
      const res = await fetch("/api/soledash/v1/automatica-relay/fire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card_id: cardId })
      });
      await res.json();
      await load();
      if (onRefresh) await onRefresh();
    } finally {
      setFiringId(null);
    }
  }

  async function openReceipt(packetId: string) {
    const res = await fetch(
      `/api/soledash/v1/automatica-relay/receipt?packet_id=${encodeURIComponent(packetId)}`
    );
    const data = await res.json();
    if (data.receipt) setReceiptModal(data.receipt as Record<string, unknown>);
  }

  if (loading && cards.length === 0) {
    return (
      <section className="auto-relay" aria-label="Automatica relay cards">
        <p className="auto-relay__loading">Loading Automatica relay cards…</p>
      </section>
    );
  }

  return (
    <section className="auto-relay" aria-label="Automatica relay cards">
      <div className="auto-relay__head">
        <div>
          <p className="auto-relay__eyebrow">Automatica · LightTrip relay</p>
          <h2 className="auto-relay__title">Relay card grid</h2>
          <p className="auto-relay__hint">
            Fire real packets · poll receipts · no mock success. Unwired routes say ROUTE NOT CONNECTED.
          </p>
        </div>
        <div className="auto-relay__dirs">
          <span>Packets: <code>{dirs.packet_dir || "…"}</code></span>
          <span>Receipts: <code>{dirs.receipt_dir || "…"}</code></span>
        </div>
      </div>

      <div className="auto-relay__grid">
        {cards.map((card) => {
          const canFire = card.state === "READY" || card.state === "RECEIPT RETURNED" || card.state === "BLOCKED" || card.state === "EXPLODED";
          return (
            <article
              key={card.id}
              className={`auto-relay__card auto-relay__card--${stateClass(card.state)} ${!card.routeConnected ? "auto-relay__card--disconnected" : ""}`}
            >
              <div className="auto-relay__card-head">
                <h3 className="auto-relay__card-name">{card.name}</h3>
                <span className={`auto-relay__state auto-relay__state--${stateClass(card.state)}`}>
                  {card.state}
                </span>
              </div>

              <dl className="auto-relay__meta">
                <div>
                  <dt>Aeye / machine</dt>
                  <dd>
                    {card.targetAgent} · {card.targetComputer}
                  </dd>
                </div>
                <div>
                  <dt>Task</dt>
                  <dd>{card.taskType}</dd>
                </div>
                <div>
                  <dt>Last update</dt>
                  <dd>{card.lastUpdate ?? "—"}</dd>
                </div>
                <div>
                  <dt>Next action</dt>
                  <dd>{card.nextAction}</dd>
                </div>
              </dl>

              {card.blocker ? (
                <p className="auto-relay__blocker" role="alert">
                  BLOCKER: {card.blocker}
                </p>
              ) : null}

              {!card.routeConnected && card.state === "READY" ? (
                <p className="auto-relay__route-warn">ROUTE NOT CONNECTED</p>
              ) : null}

              <div className="auto-relay__actions">
                <button
                  type="button"
                  className="auto-relay__fire"
                  disabled={!canFire || firingId !== null}
                  onClick={() => setConfirmCard(card)}
                >
                  {firingId === card.id ? "FIRING…" : "FIRE"}
                </button>
                <button
                  type="button"
                  className="auto-relay__receipt"
                  disabled={!card.receiptPath || !card.packetId}
                  onClick={() => card.packetId && void openReceipt(card.packetId)}
                >
                  OPEN RECEIPT
                </button>
              </div>

              {card.packetPath ? (
                <p className="auto-relay__path">
                  Packet: <code>{card.packetPath}</code>
                </p>
              ) : null}
            </article>
          );
        })}
      </div>

      {confirmCard ? (
        <div className="auto-relay__modal-backdrop" role="presentation" onClick={() => setConfirmCard(null)}>
          <div
            className="auto-relay__modal auto-relay__modal--confirm"
            role="dialog"
            aria-label="Confirm fire"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="auto-relay__modal-head">
              <h3>Confirm FIRE</h3>
              <button type="button" onClick={() => setConfirmCard(null)}>
                Cancel
              </button>
            </div>
            <p className="auto-relay__confirm-name">{confirmCard.name}</p>
            <p className="auto-relay__confirm-target">
              {confirmCard.targetAgent} · {confirmCard.targetComputer}
            </p>
            {confirmCard.blocker ? (
              <p className="auto-relay__blocker">BLOCKER: {confirmCard.blocker}</p>
            ) : null}
            <div className="auto-relay__confirm-actions">
              <button type="button" className="auto-relay__receipt" onClick={() => setConfirmCard(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="auto-relay__fire"
                disabled={firingId !== null}
                onClick={() => {
                  const id = confirmCard.id;
                  setConfirmCard(null);
                  void fire(id);
                }}
              >
                Confirm FIRE
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {receiptModal ? (
        <div className="auto-relay__modal-backdrop" role="presentation" onClick={() => setReceiptModal(null)}>
          <div
            className="auto-relay__modal"
            role="dialog"
            aria-label="Relay receipt"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="auto-relay__modal-head">
              <h3>Relay receipt</h3>
              <button type="button" onClick={() => setReceiptModal(null)}>
                Close
              </button>
            </div>
            <dl className="auto-relay__receipt-readable">
              {formatReceiptReadable(receiptModal).map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
            <details className="auto-relay__receipt-raw">
              <summary>Raw JSON</summary>
              <pre className="auto-relay__modal-body">{JSON.stringify(receiptModal, null, 2)}</pre>
            </details>
          </div>
        </div>
      ) : null}
    </section>
  );
}
