import Link from "next/link";
import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { copy } from "@/lib/copy";

export default async function BlueprintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <CockpitShell>
      <main className="dashboard-main">
        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          <Link href="/dashboard">Match deck</Link>
          <Link href="/dashboard/blueprints">{copy.dashboard.workshops.navLabel}</Link>
          <Link href="/dashboard/intros">Intros</Link>
        </nav>
        <section className="ops-card">
          <div className="card-heading">
            <p>{copy.dashboard.workshops.kicker}</p>
            <h1>{id}</h1>
          </div>
          <p className="status-line">{copy.dashboard.workshops.detailBody}</p>
        </section>
      </main>
    </CockpitShell>
  );
}
