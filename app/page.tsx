import Link from "next/link";
import BetaSignupForm from "./beta-signup-form";
import { copy } from "@/lib/copy";

export default function HomePage() {
  const laneCards = Object.values(copy.lanes);

  return (
    <>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Werkles home">
          <img className="brand-wordmark" src="/assets/werkles-word-only.png" alt={copy.brand} />
        </Link>
        <nav aria-label="Primary navigation">
          <Link href="#people">People</Link>
          <Link href="#how">How</Link>
          <Link href="/proof">Proof</Link>
          <Link href="/membership">Dues</Link>
          <Link href="/login">Login</Link>
          <Link href="#beta">Beta</Link>
        </nav>
        <Link className="header-cta" href="/signup">{copy.hero.primaryCta}</Link>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">{copy.hero.eyebrow}</p>
            <h1>{copy.hero.headline}</h1>
            <p>{copy.hero.subhead}</p>
            <p className="hero-promise">{copy.hero.brandPromise}</p>
            <div className="hero-actions">
              <Link className="button button-light" href="/signup">{copy.hero.primaryCta}</Link>
              <Link className="button button-ghost" href="#how">{copy.hero.secondaryCta}</Link>
            </div>
            <p className="hero-trust">{copy.hero.trustLine}</p>
          </div>

          <aside className="hero-card" aria-label="Werkles people-first signal">
            <img className="brand-plate" src="/assets/werkles-brand-plate.png" alt="Create with trust. Build to thrive. Built on Trust." />
            <div className="hero-card-copy">
              <strong>v0.3</strong>
              <span>{copy.trust.badge}</span>
            </div>
            <div className="mini-people" aria-hidden="true">
              <span>B</span>
              <span>O</span>
              <span>C</span>
              <span>+</span>
            </div>
          </aside>
        </section>

        <section id="people" className="people-strip" aria-label="Werkles people lanes">
          {laneCards.map((lane) => (
            <article key={lane.title}>
              <span>{lane.title}</span>
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
            {copy.howItWorks.steps.map((step) => (
              <article key={step.title}>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
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
              <p>Proof Stack</p>
              <h2>{copy.microcopy.verificationPending}</h2>
            </div>
            <img className="trust-plate" src="/assets/werkles-trust-badge-plate.png" alt={copy.trust.badge} />
            <div className="gate-list" aria-label="Required account gate">
              <span>Driver&apos;s license front</span>
              <span>Driver&apos;s license back</span>
              <span>Live face capture</span>
              <span>Linked phone with consent</span>
            </div>
            <Link className="button button-outline" href="/proof">How proof will work</Link>
          </article>

          <article className="ops-card">
            <div className="card-heading">
              <p>Dashboard</p>
              <h2>The production machine is being assembled.</h2>
            </div>
            <p className="status-line">
              Auth, profile editing, match RPC calls, intro routes, and TTL cron scaffolds are now inside the Next app.
            </p>
            <Link className="button button-outline" href="/dashboard">Open dashboard</Link>
          </article>
        </section>
      </main>

      <footer className="site-footer">
        <p>{copy.disclaimer}</p>
      </footer>
    </>
  );
}
