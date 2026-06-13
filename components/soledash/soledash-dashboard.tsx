import type { Concern } from "@/lib/soledash/workflow";
import type { HandoffEntry, SoleDashData } from "@/lib/soledash/cockpit-data";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="soledash-kv">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: Concern["severity"] }) {
  return <span className={`soledash-badge soledash-badge--${severity}`}>{severity}</span>;
}

function CollapsibleHandoffs({ items, label }: { items: HandoffEntry[]; label: string }) {
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

function statusLabel(status: string) {
  switch (status) {
    case "completed":
      return "Completed";
    case "blocked":
      return "Blocked";
    case "in_progress":
      return "In progress";
    default:
      return "Unknown";
  }
}

export function SoleDashDashboard({ data }: { data: SoleDashData }) {
  const {
    machineCard,
    lastWorkedHere,
    nextSteps,
    concerns,
    urgentGates,
    humanGateLabels,
    crew,
    outbox,
    inbox,
    receipts,
    stackBoundaries,
    plumbing,
    sources
  } = data;

  return (
    <div className="soledash-root">
      <header className="soledash-header">
        <div>
          <p className="soledash-eyebrow">Werkles operator cockpit · {data.version}</p>
          <h1>SoleDash</h1>
          <p className="soledash-tagline">
            What machine am I on, what was last worked here, what next, and what needs my approval?
          </p>
        </div>
      </header>

      <div className="soledash-top-grid">
        <section className="soledash-panel">
          <h2>1 · Machine / Branch</h2>
          <dl className="soledash-readback">
            <Row label="Machine" value={`${machineCard.werklesName} (${machineCard.hostname})`} />
            <Row label="Repo" value={machineCard.repo} />
            <Row label="Branch" value={machineCard.branch} />
            <Row
              label="Commit"
              value={`${machineCard.commit.slice(0, 12)} — ${machineCard.commitSubject}`}
            />
            <Row label="Working tree" value={machineCard.workingTree} />
            <Row label="Localhost" value={machineCard.localhostSummary} />
            <Row label="Execution context" value={machineCard.executionContext} />
          </dl>
          {machineCard.warnings.length > 0 ? (
            <ul className="soledash-warnings">
              {machineCard.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="soledash-panel">
          <h2>2 · Last worked here</h2>
          <dl className="soledash-readback">
            <Row label="Task" value={lastWorkedHere.task} />
            <Row label="Tool / app" value={lastWorkedHere.tool} />
            <Row label="Status" value={statusLabel(lastWorkedHere.status)} />
            <Row label="Commit" value={lastWorkedHere.commit ?? "—"} />
            <Row label="Receipt" value={lastWorkedHere.receipt ?? "—"} />
            <Row
              label="When"
              value={
                lastWorkedHere.timestamp
                  ? new Date(lastWorkedHere.timestamp).toLocaleString()
                  : "—"
              }
            />
          </dl>
          <p className="soledash-muted soledash-ref">Source: {lastWorkedHere.source}</p>
        </section>
      </div>

      <section className="soledash-panel">
        <h2>3 · Top 3 suggested next steps</h2>
        <ol className="soledash-steps">
          {nextSteps.map((step) => (
            <li key={step.rank} className="soledash-step">
              <div className="soledash-step-head">
                <span className="soledash-step-rank">Step {step.rank}</span>
                {step.benMustApprove ? (
                  <span className="soledash-badge soledash-badge--high">Ben must approve</span>
                ) : (
                  <span className="soledash-badge soledash-badge--low">No gate</span>
                )}
              </div>
              <h3>{step.title}</h3>
              <p className="soledash-muted">
                <strong>Why:</strong> {step.why}
              </p>
              <p className="soledash-muted">
                <strong>Agent:</strong> {step.agent}
              </p>
            </li>
          ))}
        </ol>
        <div className="soledash-gate-buttons" role="group" aria-label="Human gate labels (read-only)">
          {humanGateLabels.map((label) => (
            <span key={label} className="soledash-gate-btn" aria-disabled="true">
              {label}
            </span>
          ))}
        </div>
      </section>

      <div className="soledash-top-grid">
        <section className="soledash-panel">
          <h2>4 · Areas of concern</h2>
          {concerns.length === 0 ? (
            <p className="soledash-ok">No concerns detected from local cockpit signals.</p>
          ) : (
            <ul className="soledash-concerns">
              {concerns.map((c) => (
                <li key={`${c.label}-${c.detail}`}>
                  <SeverityBadge severity={c.severity} />
                  <strong>{c.label}</strong>
                  <span>{c.detail}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="soledash-panel">
          <h2>5 · Time-sensitive human gates</h2>
          {urgentGates.length === 0 ? (
            <p className="soledash-muted">No urgent gates flagged from NEXT_ACTION / HUMAN_GATES.</p>
          ) : (
            <ul className="soledash-concerns">
              {urgentGates.map((g) => (
                <li key={`${g.title}-${g.category}`}>
                  <span className="soledash-badge soledash-badge--medium">{g.category}</span>
                  <strong>{g.title}</strong>
                  <span>{g.detail}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="soledash-panel">
        <h2>6 · Crew dispatch</h2>
        <div className="soledash-grid">
          {crew.map((block) => (
            <article key={block.id} className="soledash-crew-card">
              <h3>{block.label}</h3>
              <p className="soledash-crew-summary">{block.summary}</p>
              <p className="soledash-muted">{block.note}</p>
              <CollapsibleHandoffs items={block.outbox} label={block.label} />
            </article>
          ))}
        </div>
      </section>

      <section className="soledash-panel">
        <h2>Handoffs</h2>
        <details className="soledash-details soledash-details--section">
          <summary>Outbox ({outbox.length})</summary>
          <CollapsibleHandoffs items={outbox} label="Outbox" />
        </details>
        <details className="soledash-details soledash-details--section">
          <summary>Inbox ({inbox.length})</summary>
          <CollapsibleHandoffs items={inbox} label="Inbox" />
        </details>
        <details className="soledash-details soledash-details--section">
          <summary>Receipts ({receipts.length})</summary>
          <CollapsibleHandoffs items={receipts} label="Receipts" />
        </details>
      </section>

      <section className="soledash-panel">
        <h2>7 · What owns what?</h2>
        <ul className="soledash-stack">
          {stackBoundaries.map((item) => (
            <li key={item.name}>
              <strong>{item.name}</strong> — {item.role}
            </li>
          ))}
        </ul>
        <p className="soledash-muted soledash-ref">
          Foreman {plumbing.foreman} · GimpDash {plumbing.gimpdash} · Speaker {plumbing.speaker}
        </p>
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
