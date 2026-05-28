import Link from "next/link";
import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { copy } from "@/lib/copy";

export default function BlueprintsPage() {
  return (
    <CockpitShell>
      <main className="dashboard-main">
        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          <Link href="/dashboard">Match deck</Link>
          <Link href="/dashboard/profile">Profile</Link>
          <Link href="/dashboard/intros">Intros</Link>
        </nav>
        <section className="ops-card">
          <div className="card-heading">
            <p>{copy.dashboard.workshops.kicker}</p>
            <h1>{copy.dashboard.workshops.headline}</h1>
          </div>
          <p className="status-line">{copy.dashboard.workshops.body}</p>
        </section>
      </main>
    </CockpitShell>
  );
}
