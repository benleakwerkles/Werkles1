import type { WorkItem, WorkLane } from "@/lib/soledash/v12-workflow";
import type { HandoffEntry, SoleDashData } from "@/lib/soledash/cockpit-data";

const LANE_LABELS: Record<WorkLane, string> = {
  act: "Act",
  at_risk: "At Risk",
  in_progress: "In Progress",
  done: "Done"
};

const LANE_ORDER: WorkLane[] = ["act", "at_risk", "in_progress", "done"];

function ownershipLabel(ownership: WorkItem["ownership"]) {
  return ownership === "waiting_on_ben" ? "WAITING ON BEN" : "WAITING ON COUSIN";
}

function CollapsibleHandoffs({ items }: { items: HandoffEntry[] }) {
  if (items.length === 0) {
    return <p className="soledash-muted">None on disk.</p>;
  }
  return (
    <ul className="soledash-list soledash-list--compact">
      {items.map((item) => (
        <li key={item.relPath}>
          <details className="soledash-details">
            <summary>
              <strong>{item.name}</strong>
              <span className="soledash-meta">{new Date(item.modifiedAt).toLocaleString()}</span>
            </summary>
            <pre className="soledash-excerpt soledash-excerpt--copy">{item.excerpt}</pre>
          </details>
        </li>
      ))}
    </ul>
  );
}

function WorkItemRow({ item }: { item: WorkItem }) {
  return (
    <li className="soledash-work-item">
      <div className="soledash-work-item__head">
        <strong>{item.title}</strong>
        <span
          className={`soledash-ownership soledash-ownership--${item.ownership === "waiting_on_ben" ? "ben" : "cousin"}`}
        >
          {ownershipLabel(item.ownership)}
        </span>
      </div>
      {item.detail ? <p className="soledash-muted">{item.detail}</p> : null}
    </li>
  );
}

export function SoleDashDashboard({ data }: { data: SoleDashData }) {
  const {
    machineCard,
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
    sources
  } = data;

  return (
    <div className="soledash-root">
      <header className="soledash-header soledash-header--compact">
        <p className="soledash-eyebrow">SoleDash · {data.version}</p>
        <p className="soledash-context-line">
          {machineCard.werklesName} · {machineCard.branch} · {machineCard.commit.slice(0, 7)} ·{" "}
          {machineCard.workingTree} · {machineCard.localhostOk ? "localhost up" : "localhost down"}
        </p>
      </header>

      <section className="soledash-needs-you" aria-labelledby="needsYouTitle">
        <h2 id="needsYouTitle">Needs you now</h2>
        {needsYouNow ? (
          <>
            <p className="soledash-needs-you__kind">
              {needsYouNow.kind === "human_gate" ? "Human Gate" : "Next Action"}
            </p>
            <p className="soledash-needs-you__title">{needsYouNow.title}</p>
            <p className="soledash-needs-you__detail">{needsYouNow.detail}</p>
          </>
        ) : allClear ? (
          <div className="soledash-all-clear">
            <p className="soledash-all-clear__headline">{allClear.headline}</p>
            <p className="soledash-all-clear__body">
              {allClear.cousinsWorking} cousin{allClear.cousinsWorking === 1 ? "" : "s"} working.
            </p>
            <p className="soledash-all-clear__body">
              Next expected gate in {allClear.nextGateEstimate}.
            </p>
          </div>
        ) : (
          <p className="soledash-muted">No single priority surfaced — review lanes below.</p>
        )}
      </section>

      <section
        className={`soledash-posture soledash-posture--${posture.color}`}
        aria-labelledby="postureTitle"
      >
        <h2 id="postureTitle">System posture</h2>
        <p className="soledash-posture__label">{posture.label}</p>
        <p className="soledash-posture__explanation">{posture.explanation}</p>
      </section>

      <section className="soledash-since" aria-labelledby="sinceTitle">
        <h2 id="sinceTitle">Since you were last here</h2>
        <p className="soledash-since__line">
          <strong>{sinceLastVisit.sinceLabel}:</strong> {sinceLastVisit.summary}
        </p>
      </section>

      {squibb ? (
        <aside className={`soledash-squibb soledash-squibb--${squibb.kind}`} role="note">
          <span className="soledash-squibb__tag">{squibb.kind}</span>
          <p>{squibb.line}</p>
        </aside>
      ) : null}

      <div className="soledash-lanes">
        {LANE_ORDER.map((lane) => {
          const laneItems = workItems.filter((item) => item.lane === lane);
          return (
            <section key={lane} className="soledash-panel soledash-lane">
              <h2>{LANE_LABELS[lane]}</h2>
              {laneItems.length === 0 ? (
                <p className="soledash-muted">Nothing in this lane.</p>
              ) : (
                <ul className="soledash-work-list">
                  {laneItems.map((item) => (
                    <WorkItemRow key={item.id} item={item} />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <section className="soledash-panel">
        <h2>Crew dispatch</h2>
        <div className="soledash-grid">
          {crew.map((block) => (
            <article key={block.id} className="soledash-crew-card">
              <h3>{block.label}</h3>
              <p className="soledash-crew-summary">{block.summary}</p>
              <p className="soledash-muted">{block.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="soledash-panel">
        <h2>Outbox</h2>
        <CollapsibleHandoffs items={outbox} />
      </section>

      <section className="soledash-panel">
        <h2>Inbox</h2>
        <CollapsibleHandoffs items={inbox} />
      </section>

      <section className="soledash-panel">
        <h2>Receipts</h2>
        <CollapsibleHandoffs items={receipts} />
      </section>

      <footer className="soledash-footer">
        <ul className="soledash-sources">
          {sources.map((s) => (
            <li key={s.path} className={s.loaded ? "ok" : "missing"}>
              {s.path} {s.loaded ? "✓" : "✗"}
            </li>
          ))}
        </ul>
      </footer>
    </div>
  );
}
