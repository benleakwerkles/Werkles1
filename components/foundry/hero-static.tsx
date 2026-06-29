import Link from "next/link";
import { copy } from "@/lib/copy";
import { WorkshopGreeter } from "@/components/foundry/workshop-greeter";
import { WorkshopMomentEyebrow } from "@/components/foundry/workshop-moment-eyebrow";

export function HeroStatic() {
  return (
    <section className="hero hero--draft-v01">
      <div className="hero-copy">
        <WorkshopMomentEyebrow />
        <h1>{copy.hero.headline}</h1>
        <p>{copy.hero.subhead}</p>
        <p className="hero-promise">{copy.hero.brandPromise}</p>
        <div className="hero-actions">
          <Link className="button button-light" href="/discovery">{copy.hero.primaryCta}</Link>
          <Link className="button button-ghost" href="#how">{copy.hero.secondaryCta}</Link>
        </div>
        <p className="hero-trust">{copy.hero.trustLine}</p>
      </div>

      <aside className="hero-card" aria-label="Werkles people-first signal">
        <WorkshopGreeter size="md" className="hero-card-greeter" />
        <div className="hero-trust-plate" role="img" aria-label={copy.trust.badge}>
          <span className="hero-trust-plate__promise">{copy.hero.brandPromise}</span>
          <strong className="hero-trust-plate__badge">{copy.trust.badge}</strong>
        </div>
        <div className="hero-card-copy">
          <strong>v0.3</strong>
          <span>{copy.uiPass.cockpitEyebrow}</span>
        </div>
        <div className="mini-people" aria-hidden="true">
          <span>B</span>
          <span>O</span>
          <span>C</span>
          <span>+</span>
        </div>
      </aside>
    </section>
  );
}
