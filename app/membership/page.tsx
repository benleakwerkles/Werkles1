"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { copy } from "@/lib/copy";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type Plan = "monthly" | "annual";

export default function MembershipPage() {
  const [status, setStatus] = useState("Choose your dues. Stripe handles the brass register.");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("checkout") === "cancelled") {
      setStatus(copy.membership.cancelled);
    }
  }, []);

  async function startCheckout(plan: Plan) {
    setStatus("Opening Stripe checkout.");
    const supabase = getSupabaseBrowser();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      setStatus("Log in before paying dues.");
      return;
    }

    const response = await fetch("/api/membership/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ plan })
    });

    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error || "Checkout jammed. Try again.");
      return;
    }

    window.location.href = payload.url;
  }

  return (
    <main className="dashboard-main membership-page">
      <nav className="dashboard-nav" aria-label="Membership navigation">
        <Link href="/">Home</Link>
        <Link href="/dashboard">Match deck</Link>
        <Link href="/onboarding">Onboarding</Link>
      </nav>

      <section className="membership-hero">
        <p className="eyebrow">{copy.membership.eyebrow}</p>
        <h1>{copy.membership.headline}</h1>
        <p>{copy.membership.subhead}</p>
      </section>

      <section className="membership-grid" aria-label="Foundry Dues plans">
        <article className="ops-card plan-card">
          <p className="plan-kicker">Free Dossier</p>
          <h2>$0</h2>
          <p>Create your profile, choose your lane, build the dossier, browse the match deck, and read summaries.</p>
          <Link className="button button-outline" href="/onboarding">Start free</Link>
        </article>

        <article className="ops-card plan-card plan-card-featured">
          <p className="plan-kicker">{copy.membership.monthly}</p>
          <h2>$9.99/mo</h2>
          <p>Unlock intro requests, workspace access, verification triggers, and the path toward heavier trust weight.</p>
          <button className="button button-light" type="button" onClick={() => startCheckout("monthly")}>
            {copy.membership.checkout}
          </button>
        </article>

        <article className="ops-card plan-card">
          <p className="plan-kicker">{copy.membership.annual}</p>
          <h2>$99/yr</h2>
          <p>Same foundry access, one yearly clang, roughly twenty bucks kept in your pocket.</p>
          <button className="button button-dark" type="button" onClick={() => startCheckout("annual")}>
            Lock the Joints
          </button>
        </article>
      </section>

      <section className="ops-card membership-trust">
        <h2>Trust still has to earn its boots.</h2>
        <p>{copy.membership.trust}</p>
        <p className="status-line" role="status">{status}</p>
      </section>
    </main>
  );
}
