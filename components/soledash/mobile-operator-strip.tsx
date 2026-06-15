"use client";

import type { HumanGate } from "@/protocol/index";

export function MobileOperatorStrip({
  frontierCode,
  frontierTitle,
  waitingGatesCount,
  waitingGatesHint,
  blockerHeadline,
  humanGate
}: {
  frontierCode: string;
  frontierTitle: string;
  waitingGatesCount: number;
  waitingGatesHint: string | null;
  blockerHeadline: string | null;
  humanGate: HumanGate;
}) {
  return (
    <section className="sd-mobile-strip" aria-label="Mobile operator status">
      <div className="sd-mobile-strip__row">
        <div className="sd-mobile-strip__chip sd-mobile-strip__chip--frontier">
          <span className="sd-mobile-strip__label">Frontier</span>
          <span className="sd-mobile-strip__code">{frontierCode}</span>
          <span className="sd-mobile-strip__detail">{frontierTitle}</span>
        </div>
        <div
          className={`sd-mobile-strip__chip ${waitingGatesCount > 0 ? "sd-mobile-strip__chip--alert" : ""}`}
        >
          <span className="sd-mobile-strip__label">Human gates</span>
          <span className="sd-mobile-strip__num">{waitingGatesCount}</span>
          {waitingGatesHint ? (
            <span className="sd-mobile-strip__detail">{waitingGatesHint}</span>
          ) : null}
        </div>
      </div>
      {blockerHeadline ? (
        <p className="sd-mobile-strip__blocker" role="alert">
          Blocker: {blockerHeadline}
        </p>
      ) : null}
      {humanGate.operator_line ? (
        <p className="sd-mobile-strip__gate">{humanGate.operator_line}</p>
      ) : null}
    </section>
  );
}
