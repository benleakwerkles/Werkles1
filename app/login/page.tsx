"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { InfraPreviewBanner } from "@/components/foundry/infra-preview-banner";
import { WorkshopGreeter } from "@/components/foundry/workshop-greeter";
import { routeAtmosphere } from "@/lib/workshop-facets";
import { copy } from "@/lib/copy";
import { isAppInfraPreview } from "@/lib/app-infra-preview";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const preview = isAppInfraPreview();
  const [status, setStatus] = useState(
    preview ? copy.infraPreview.login : copy.auth.loginIdle
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (preview) return;

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");

    const { error } = await getSupabaseBrowser().auth.signInWithPassword({ email, password });
    if (error) {
      setStatus(error.message);
      return;
    }

    window.location.href = "/onboarding";
  }

  return (
    <main className={`auth-shell ${routeAtmosphere.auth}`}>
      <section className="auth-panel">
        <WorkshopGreeter className="auth-panel-greeter" />
        <InfraPreviewBanner detail={copy.infraPreview.login} />
        <p className="eyebrow">{copy.brand}</p>
        <h1>{copy.auth.loginTitle}</h1>
        <p>{copy.auth.loginSubhead}</p>
        <form className="form-stack" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input name="email" type="email" autoComplete="email" required disabled={preview} />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={preview}
            />
          </label>
          <button className="button button-dark" type="submit" disabled={preview}>
            {preview ? "Sign-in disabled (preview)" : "Log in"}
          </button>
          <p className="status-line" role="status">{status}</p>
        </form>
        <Link className="button button-outline" href="/signup">Create an account</Link>
      </section>
    </main>
  );
}
