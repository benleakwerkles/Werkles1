import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { readStaticBody } from "@/lib/static-page";
import { crucibleTrustCopy } from "@/lib/crucible";
import { copy } from "@/lib/copy";
import { routeAtmosphere } from "@/lib/workshop-facets";
import { pricing } from "@/lib/pricing";

export default function ProofPage() {
  return (
    <CockpitShell className="proof-cockpit">
      <div className="static-proof-shell" dangerouslySetInnerHTML={{ __html: readStaticBody("proof.html") }} />
      <main className={`proof-main ${routeAtmosphere.proof}`}>
        <section className="proof-warning proof-boundary">
          <div>
            <p className="eyebrow">{copy.uiPass.cockpitEyebrow}</p>
            <h2>{copy.uiPass.proofAtmosphere}</h2>
            <p className="trust-badge">Pricing source: {pricing.source}</p>
          </div>
          <div className="gate-list" aria-label="Crucible proof rules">
            {crucibleTrustCopy.map((line) => (
              <span key={line}>{line}</span>
            ))}
            <span>Maximum handling fee: $5 per check.</span>
          </div>
        </section>
      </main>
    </CockpitShell>
  );
}
