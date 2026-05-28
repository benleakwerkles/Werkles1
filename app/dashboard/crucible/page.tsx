import Link from "next/link";
import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { CruciblePanel } from "@/components/crucible/crucible-panel";
import { routeAtmosphere } from "@/lib/workshop-facets";

export default function CruciblePage() {
  return (
    <CockpitShell>
      <main className={`dashboard-main ${routeAtmosphere.crucible}`}>
      <nav className="dashboard-nav" aria-label="Crucible navigation">
        <Link href="/dashboard">Match deck</Link>
        <Link href="/dashboard/profile">Profile</Link>
        <Link href="/dashboard/billing">Billing</Link>
        <Link href="/pricing">Pricing</Link>
      </nav>
      <CruciblePanel />
      </main>
    </CockpitShell>
  );
}
