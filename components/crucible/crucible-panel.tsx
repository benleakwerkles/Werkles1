"use client";

import { useState } from "react";
import { crucibleChecks, crucibleTrustCopy, type CrucibleCheck } from "@/lib/crucible";
import { copy } from "@/lib/copy";
import { isAppInfraPreview } from "@/lib/app-infra-preview";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { InfraPreviewBanner } from "@/components/foundry/infra-preview-banner";
import { VerificationCard } from "./verification-card";

export function CruciblePanel() {
  const preview = isAppInfraPreview();
  const [status, setStatus] = useState(
    preview ? copy.infraPreview.crucible : "Ready for inspection."
  );
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function startCheck(check: CrucibleCheck) {
    if (preview) {
      setStatus(copy.infraPreview.sandboxActionDisabled);
      return;
    }

    if (!check.route) {
      setStatus("The forge is not wired for this check yet.");
      return;
    }

    setBusyKey(check.key);
    setStatus("Inspecting the steel.");

    try {
      const supabase = getSupabaseBrowser();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        setStatus("Log in before asking the inspectors to swing the hammer.");
        return;
      }

      const response = await fetch(check.route, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const payload = await response.json().catch(() => ({}));
      setStatus(payload.error || payload.label || "Claim check prepared.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Something did not hold.");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <section className="crucible-shell">
      <figure className="crucible-atmosphere crucible-atmosphere--chem" aria-hidden="true">
        <div className="crucible-atmosphere__wash" />
        <figcaption>{copy.uiPass.draftBadge}</figcaption>
      </figure>

      <InfraPreviewBanner detail={copy.infraPreview.crucible} />

      <div className="ops-card crucible-hero-card workshop-facet--chem">
        <div className="card-heading">
          <p>{copy.uiPass.cockpitEyebrow}</p>
          <h1>Trust is not for sale. The workflow is.</h1>
        </div>
        <div className="gate-list" aria-label="Crucible trust rules">
          {crucibleTrustCopy.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
        <p className="status-line" role="status">{status}</p>
      </div>

      <div className="crucible-grid">
        {crucibleChecks.map((check) => (
          <VerificationCard
            key={check.key}
            check={check}
            busy={busyKey === check.key}
            previewDisabled={preview}
            onStart={startCheck}
          />
        ))}
      </div>
    </section>
  );
}
