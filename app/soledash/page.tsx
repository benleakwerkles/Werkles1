import type { Metadata } from "next";

import { SoleDashDashboard } from "@/components/soledash/soledash-dashboard";
import { loadSoleDashData } from "@/lib/soledash/cockpit-data";

export const metadata: Metadata = {
  title: "SoleDash | Werkles Operator Cockpit",
  description: "Canonical operator cockpit v1.1 — machine, last work, next steps, approvals.",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function SoleDashPage() {
  const data = await loadSoleDashData();
  return <SoleDashDashboard data={data} />;
}
