import Link from "next/link";
import { denNavObjects } from "@/lib/den-atmosphere";
import { copy } from "@/lib/copy";

const sampleFactors = [
  { key: "lane_fit", value: "Connector voltage meets Builder craft" },
  { key: "geo_overlap", value: "Same metro, two complementary turfs" },
  { key: "proof_posture", value: "Identity verified · intro knock ready" }
];

/** Static Den mood preview — layout + interaction notes without live data. */
export function DenPreviewScene() {
  return (
    <div className="den-scene">
      <aside className="den-scene__pegboard" aria-label="Desk objects navigation preview">
        <p className="den-scene__pegboard-kicker">On the pegboard</p>
        <ul className="den-scene__object-nav">
          {denNavObjects.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="den-scene__object-link">
                <span className="den-scene__object-glyph" aria-hidden="true" />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.object}</small>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      <section className="den-scene__lamp-desk" aria-labelledby="den-preview-heading">
        <p className="eyebrow">Wonka facet · draft review</p>
        <h1 id="den-preview-heading">The Den</h1>
        <p className="den-scene__lede">
          Cozy inventor nook for Connectors — lamp desk, paper stack, inspect pacing. Not a throne. Not a cockpit.
        </p>

        <div className="den-scene__card-stack">
          <article className="den-scene__inspect-card" data-interaction="inspect-hold">
            <header className="den-scene__card-top">
              <span className="avatar connector" aria-hidden="true">
                C
              </span>
              <div>
                <h2>Candidate dossier</h2>
                <p className="den-scene__card-hint">Long-press to inspect · tap to advance</p>
              </div>
              <span className="score">87</span>
            </header>
            <ul className="reason-list factor-list den-scene__factor-list">
              {sampleFactors.map((row) => (
                <li key={row.key}>
                  <strong>{row.key.replaceAll("_", " ")}</strong>
                  <span>{row.value}</span>
                </li>
              ))}
            </ul>
            <p className="compliance-note">{copy.disclaimer}</p>
          </article>
          <div className="den-scene__stack-shadow" aria-hidden="true" />
        </div>
      </section>

      <footer className="den-scene__scrap-tray">
        <span className="den-scene__scrap">Blueprint pin</span>
        <span className="den-scene__scrap">Metro filter</span>
        <span className="den-scene__scrap">Knock draft</span>
      </footer>
    </div>
  );
}
