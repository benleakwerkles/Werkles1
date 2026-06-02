"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { InfraPreviewBanner } from "@/components/foundry/infra-preview-banner";
import { copy } from "@/lib/copy";
import { pricing } from "@/lib/pricing";
import { routeAtmosphere } from "@/lib/workshop-facets";
import { isAppInfraPreview } from "@/lib/app-infra-preview";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type Plan = "monthly" | "annual";

export default function MembershipPage() {
  const preview = isAppInfraPreview();
  const [status, setStatus] = useState(
    preview ? copy.infraPreview.membershipCheckout : "Choose your dues. Stripe handles the brass register."
  );
  const [highlightPlan, setHighlightPlan] = useState<Plan | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("checkout") === "cancelled") {
      setStatus(copy.membership.cancelled);
    }
    const plan = searchParams.get("plan");
    if (plan === "monthly" || plan === "annual") {
      setHighlightPlan(plan);
      const planLabel = plan === "annual" ? copy.membership.annual : copy.membership.monthly;
      setStatus(
        preview
          ? `${copy.infraPreview.membershipCheckout} Highlighting ${planLabel}.`
          : `Showing ${planLabel} from pricing.`
      );
    }
  }, [preview]);

  async function startCheckout(plan: Plan) {
    if (preview) {
      setStatus(copy.infraPreview.membershipCheckout);
      return;
    }

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

  const monthlyFeatured = highlightPlan === null || highlightPlan === "monthly";
  const annualFeatured = highlightPlan === "annual";

  return (
    <CockpitShell>
      <main className={`dashboard-main membership-page ${routeAtmosphere.membership}`}>
      <nav className="dashboard-nav" aria-label="Membership navigation">
        <Link href="/">Home</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/dashboard">Match deck</Link>
        <Link href="/onboarding">Onboarding</Link>
      </nav>

      <InfraPreviewBanner detail={copy.infraPreview.membershipCheckout} />

      <section className="membership-hero">
        <p className="eyebrow">{copy.membership.eyebrow}</p>
        <h1>{copy.membership.headline}</h1>
        <p>{copy.membership.subhead}</p>
      </section>

      <section className="membership-grid" aria-label="Foundry Dues plans">
        <article className="ops-card plan-card">
          <p className="plan-kicker">{copy.membership.plans.free.kicker}</p>
          <h2>{copy.membership.plans.free.price}</h2>
          <p>{copy.membership.plans.free.body}</p>
          <Link className="button button-outline" href="/onboarding">{copy.membership.plans.free.cta}</Link>
        </article>

        <article
          className={`ops-card plan-card${monthlyFeatured ? " plan-card-featured tier2-accent--elevator" : ""}`}
        >
          <p className="plan-kicker">{copy.membership.monthly}</p>
          <h2>{pricing.foundryDues.monthly.displayPrice}</h2>
          <p>{copy.membership.plans.monthly.body}</p>
          <button
            className="button button-light"
            type="button"
            disabled={preview}
            onClick={() => startCheckout("monthly")}
          >
            {preview ? "Checkout disabled (preview)" : copy.membership.checkout}
          </button>
        </article>

        <article
          className={`ops-card plan-card${annualFeatured ? " plan-card-featured tier2-accent--elevator" : ""}`}
        >
          <p className="plan-kicker">{copy.membership.annual}</p>
          <h2>{pricing.foundryDues.annual.displayPrice}</h2>
          <p>{copy.membership.plans.annual.body}</p>
          <button
            className="button button-dark"
            type="button"
            disabled={preview}
            onClick={() => startCheckout("annual")}
          >
            {preview ? "Checkout disabled (preview)" : "Start The Long Run"}
          </button>
        </article>
      </section>

      <section className="ops-card membership-trust">
        <h2>{copy.membership.trustHeadline}</h2>
        <p>{copy.membership.trust}</p>
        <p className="status-line" role="status">{status}</p>
      </section>
      </main>
    </CockpitShell>
  );
}
