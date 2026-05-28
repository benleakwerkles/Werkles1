"use client";

import Link from "next/link";
import { useState } from "react";
import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { copy } from "@/lib/copy";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type IntroRow = {
  id: string;
  blueprint_id: string;
  scout_user_id: string;
  target_user_id: string;
  co_sign_user_id: string;
  status: string;
  created_at: string;
};

export default function IntrosPage() {
  const [intros, setIntros] = useState<IntroRow[]>([]);
  const [status, setStatus] = useState(copy.dashboard.intros.idle);

  async function loadIntros() {
    const { data: sessionData } = await getSupabaseBrowser().auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      setStatus("Log in before loading intros.");
      return;
    }

    const response = await fetch("/api/intros", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const result = await response.json();

    if (!response.ok) {
      setStatus(result.error || "Could not load intros.");
      return;
    }

    setIntros(result.intros || []);
    setStatus(result.intros?.length ? copy.dashboard.intros.loaded : copy.actions.decline);
  }

  return (
    <CockpitShell>
      <main className="dashboard-main">
        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          <Link href="/dashboard">Match deck</Link>
          <Link href="/dashboard/profile">Profile</Link>
          <Link href="/dashboard/blueprints">{copy.dashboard.workshops.navLabel}</Link>
        </nav>
        <section className="ops-card">
          <div className="card-heading">
            <p>{copy.dashboard.intros.kicker}</p>
            <h1>{copy.dashboard.intros.headline}</h1>
          </div>
          <button className="button button-dark" type="button" onClick={loadIntros}>Load intros</button>
          <div className="intro-queue">
            {intros.map((intro) => (
              <div className="intro-item" key={intro.id}>
                <span className="mini-avatar">I</span>
                <span>
                  <strong>{intro.status}</strong>
                  <small>{intro.blueprint_id}</small>
                </span>
              </div>
            ))}
          </div>
          <p className="status-line" role="status">{status}</p>
        </section>
      </main>
    </CockpitShell>
  );
}
