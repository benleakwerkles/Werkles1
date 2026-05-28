import Link from "next/link";
import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { PricingTable } from "@/components/pricing/pricing-table";
import { copy } from "@/lib/copy";
import { pricing } from "@/lib/pricing";
import { routeAtmosphere } from "@/lib/workshop-facets";

export default function PricingPage() {
  return (
    <CockpitShell>
      <main className={`dashboard-main pricing-page ${routeAtmosphere.pricing}`}>
      <nav className="dashboard-nav" aria-label="Pricing navigation">
        <Link href="/">Home</Link>
        <Link href="/membership">Foundry Dues</Link>
        <Link href="/proof">Proof</Link>
        <Link href="/signup">Enter the Foundry</Link>
      </nav>

      <section className="membership-hero pricing-hero">
        <p className="eyebrow">{copy.pricing.eyebrow}</p>
        <h1>{copy.pricing.headline}</h1>
        <p>{copy.pricing.subhead} Source of truth: {pricing.source}.</p>
      </section>

      <PricingTable />
      </main>
    </CockpitShell>
  );
}
