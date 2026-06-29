import Link from "next/link";
import { DiscoveryIntakeForm } from "./discovery-intake-form";
import { SiteHeader } from "@/components/foundry/site-header";
import { SiteIcon } from "@/components/foundry/site-icon";
import { discoveryStateValues } from "@/lib/discovery/schema";
import { routeAtmosphere } from "@/lib/workshop-facets";

const deliverySections = [
  "What you asked for",
  "What we heard underneath it",
  "Visible reasons",
  "One recommendation",
  "Why not the alternatives",
  "What would change this"
];

export default function DiscoveryPage() {
  return (
    <>
      <SiteHeader />
      <main className={`discovery-page ${routeAtmosphere.home}`}>
        <section className="discovery-hero" aria-labelledby="discoveryTitle">
          <div>
            <p className="eyebrow">Werkles discovery intake</p>
            <h1 id="discoveryTitle">Tell us where you are. Get one human-read next path.</h1>
            <p>
              This is the Maker test path: one intake, one human bottleneck read, one explained recommendation, one next action.
              No matching engine, no scoring, no payment gate.
            </p>
            <div className="hero-actions">
              <Link className="button button-light" href="#intake">Start intake</Link>
              <Link className="button button-ghost" href="#what-comes-back">What comes back</Link>
            </div>
          </div>
          <aside className="discovery-hero__panel" aria-label="Human-operated promise">
            <SiteIcon icon="icon-dossier" size="lg" />
            <strong>Human-operated first</strong>
            <p>Software captures, stores, and surfaces. A person makes the judgment.</p>
          </aside>
        </section>

        <section className="discovery-state-strip" aria-label="Discovery state model">
          {discoveryStateValues.map((state) => (
            <span key={state}>{state}</span>
          ))}
        </section>

        <section id="intake" className="discovery-layout" aria-label="Discovery intake form">
          <article className="discovery-card discovery-card--form">
            <div className="card-heading">
              <p>Layer 0</p>
              <h2>The raw starting point</h2>
            </div>
            <DiscoveryIntakeForm />
          </article>

          <aside id="what-comes-back" className="discovery-card discovery-card--sticky">
            <div className="card-heading">
              <p>What comes back</p>
              <h2>One recommendation card</h2>
            </div>
            <p>
              A reviewer turns the intake into a short card. The card is not a verdict on you, and Werkles is not vouching
              for anyone. It is a reasoned next path based on what you shared.
            </p>
            <ol className="discovery-delivery-list">
              {deliverySections.map((section) => (
                <li key={section}>{section}</li>
              ))}
            </ol>
          </aside>
        </section>
      </main>
    </>
  );
}
