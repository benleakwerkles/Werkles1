import { SiteIcon } from "@/components/foundry/site-icon";
import { WorkshopPanel } from "@/components/foundry/workshop-panel";
import { copy } from "@/lib/copy";
import { pricing } from "@/lib/pricing";
import { PricingCard } from "./pricing-card";

export function PricingTable() {
  const { monthly, annual } = pricing.foundryDues;

  return (
    <div className="pricing-stack">
      <section className="membership-grid" aria-label="Foundry Dues pricing">
        <PricingCard
          kicker="Foundry Dues"
          title={monthly.name}
          price={monthly.displayPrice}
          body={monthly.includes}
          cta={{ label: "Start monthly", href: "/membership?plan=monthly" }}
          featured
        />
        <PricingCard
          kicker={annual.flavorName || "Annual"}
          title={annual.name}
          price={annual.displayPrice}
          body={annual.includes}
          cta={{ label: "Start The Long Run", href: "/membership?plan=annual" }}
        />
        <PricingCard
          kicker={copy.membership.plans.free.kicker}
          title="$0"
          price="Build before you pay"
          body="Create a profile, choose a lane, browse summaries, and decide whether the floor is worth joining."
          cta={{ label: "Start free", href: "/onboarding" }}
        />
      </section>

      <WorkshopPanel facet="register" className="ops-card pricing-section">
        <div className="card-heading card-heading--icon">
          <SiteIcon icon="icon-armory" size="md" />
          <div>
            <p>{copy.pricing.armoryKicker}</p>
            <h2>{copy.pricing.armoryHeadline}</h2>
          </div>
        </div>
        <div className="pricing-table">
          <span>Tier</span>
          <span>Non-member</span>
          <span>Foundry Dues member</span>
          <span>Examples</span>
          {pricing.armory.map((item) => (
            <div className="pricing-row" key={item.tier}>
              <strong>{item.tier}</strong>
              <span>{item.price}</span>
              <span>{item.memberPrice}</span>
              <span>{item.examples}</span>
            </div>
          ))}
        </div>
        <p className="compliance-note">
          Starter language only. Not legal advice. Engage independent counsel before signing.
        </p>
      </WorkshopPanel>

      <WorkshopPanel facet="chem" className="ops-card pricing-section">
        <div className="card-heading card-heading--icon">
          <SiteIcon icon="check-funds" size="md" />
          <div>
            <p>{copy.pricing.crucibleKicker}</p>
            <h2>{copy.pricing.crucibleHeadline}</h2>
          </div>
        </div>
        <div className="pricing-table pricing-table-crucible">
          <span>Check</span>
          <span>Price</span>
          <span>Notes</span>
          {pricing.crucible.map((item) => (
            <div className="pricing-row" key={item.key}>
              <strong>{item.title}</strong>
              <span>{item.price}</span>
              <span>{item.detail}</span>
            </div>
          ))}
        </div>
        <p className="compliance-note">
          Membership can unlock access to workflows. It cannot buy verification. The signal only says what was checked.
        </p>
      </WorkshopPanel>

      <WorkshopPanel facet="chip" className="ops-card pricing-section pricing-boundary">
        <div className="card-heading card-heading--icon">
          <SiteIcon icon="nav-proof" size="md" />
          <div>
            <p>{copy.pricing.firewallKicker}</p>
            <h2>{copy.pricing.firewallHeadline}</h2>
          </div>
        </div>
        <div className="gate-list" aria-label="Forbidden revenue models">
          {pricing.hardBans.map((ban) => (
            <span key={ban}>{ban}</span>
          ))}
        </div>
      </WorkshopPanel>
    </div>
  );
}
