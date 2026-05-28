import Link from "next/link";
import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { copy } from "@/lib/copy";
import { routeAtmosphere } from "@/lib/workshop-facets";
import MatchDeck from "./match-deck";

export default function DashboardPage() {
  return (
    <CockpitShell>
      <main className={`dashboard-main ${routeAtmosphere.dashboard}`}>
      <nav className="dashboard-nav" aria-label="Dashboard navigation">
        <Link href="/">Home</Link>
        <Link href="/dashboard/profile">Profile</Link>
        <Link href="/dashboard/blueprints">{copy.dashboard.workshops.navLabel}</Link>
        <Link href="/dashboard/intros">Intros</Link>
        <Link href="/dashboard/crucible">Crucible</Link>
        <Link href="/dashboard/billing">Billing</Link>
      </nav>
      <MatchDeck />
      </main>
    </CockpitShell>
  );
}
