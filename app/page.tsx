import Link from "next/link";
import BetaSignupForm from "./beta-signup-form";
import { DraftAssetGallery } from "@/components/foundry/draft-asset-gallery";
import { DraftReviewBadge } from "@/components/foundry/draft-review-badge";
import { HeroStatic } from "@/components/foundry/hero-static";
import { SiteHeader } from "@/components/foundry/site-header";
import { LaneSigil, SiteIcon } from "@/components/foundry/site-icon";
import { copy } from "@/lib/copy";
import { homeStepIcons } from "@/lib/site-icons";
import { laneFacets, routeAtmosphere, stepFacets, workshopFacets } from "@/lib/workshop-facets";

const laneKeys = ["builder", "operator", "backer", "connector", "spark"] as const;

export default function HomePage() {
  const laneCards = laneKeys.map((key) => ({ key, ...copy.lanes[key] }));

  return (
    <>
      <SiteHeader />

      <main id="top" className={routeAtmosphere.home}>
        <div className="home-draft-badge">
          <DraftReviewBadge />
        </div>
        <HeroStatic />

        <section id="people" className="people-strip" aria-label="Werkles people lanes">
          {laneCards.map((lane) => (
            <article key={lane.key} className={workshopFacets[laneFacets[lane.key]]}>
              <LaneSigil lane={lane.key} label={lane.title} />
              <h2>{lane.headline}</h2>
              <p>{lane.description}</p>
            </article>
          ))}
        </section>

        <section id="how" className="manifesto" aria-labelledby="howTitle">
          <div>
            <p className="eyebrow">{copy.howItWorks.eyebrow}</p>
            <h2 id="howTitle">{copy.howItWorks.headline}</h2>
          </div>
          <div className="how-steps">
            {copy.howItWorks.steps.map((step, index) => (
              <article key={step.title} className={workshopFacets[stepFacets[index] ?? "blueprint"]}>
                <SiteIcon icon={homeStepIcons[index] ?? "step-dossier"} size="lg" className="how-step-icon" />
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="proof-warning proof-boundary">
          <div>
            <p className="eyebrow">{copy.trust.eyebrow}</p>
            <h2>{copy.trust.headline}</h2>
            <p className="trust-badge">{copy.trust.badge}</p>
          </div>
          <p>{copy.trust.body}</p>
        </section>

        <DraftAssetGallery />

        <section className="operations-grid">
          <article id="beta" className="ops-card">
            <div className="card-heading">
              <p>{copy.beta.eyebrow}</p>
              <h2>{copy.beta.headline}</h2>
            </div>
            <p>{copy.beta.body}</p>
            <BetaSignupForm />
          </article>

          <article className="ops-card">
            <div className="card-heading">
              <p>{copy.home.proofStack.kicker}</p>
              <h2>{copy.home.proofStack.headline}</h2>
            </div>
            <div className="trust-plate trust-plate--css" role="img" aria-label={copy.trust.badge}>
              <strong>{copy.trust.badge}</strong>
            </div>
            <div className="gate-list" aria-label="Required account gate">
              {copy.home.accountGate.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <Link className="button button-outline" href="/proof">{copy.home.proofStack.cta}</Link>
          </article>

          <article className="ops-card">
            <div className="card-heading">
              <p>{copy.home.dashboardTeaser.kicker}</p>
              <h2>{copy.home.dashboardTeaser.headline}</h2>
            </div>
            <p className="status-line">{copy.home.dashboardTeaser.body}</p>
            <Link className="button button-outline" href="/dashboard">{copy.home.dashboardTeaser.cta}</Link>
          </article>
        </section>
      </main>

      <footer className="site-footer">
        <p>{copy.disclaimer}</p>
      </footer>
    </>
  );
}
