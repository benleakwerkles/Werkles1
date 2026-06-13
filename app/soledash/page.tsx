import type { Metadata } from "next";

import { SoleDashDashboard } from "@/components/soledash/soledash-dashboard";
import { loadSoleDashData } from "@/lib/soledash/cockpit-data";

export const metadata: Metadata = {
  title: "SoleDash | Werkles Operator Cockpit",
  description: "Canonical operator cockpit v1.2 — needs you now, posture, work lanes, crew handoffs.",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function SoleDashPage() {
  const data = await loadSoleDashData();
  return <SoleDashDashboard data={data} />;
}
