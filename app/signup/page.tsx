"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { InfraPreviewBanner } from "@/components/foundry/infra-preview-banner";
import { WorkshopGreeter } from "@/components/foundry/workshop-greeter";
import { routeAtmosphere } from "@/lib/workshop-facets";
import { copy } from "@/lib/copy";
import { isAppInfraPreview } from "@/lib/app-infra-preview";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export default function SignupPage() {
  const preview = isAppInfraPreview();
  const [status, setStatus] = useState(
    preview ? copy.infraPreview.signup : copy.auth.signupIdle
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (preview) return;

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    const confirm = String(form.get("confirm") || "");

    if (password !== confirm) {
      setStatus("Passwords do not match.");
      return;
    }

    const { data, error } = await getSupabaseBrowser().auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    if (data.session) {
      window.location.href = "/onboarding";
      return;
    }

    setStatus("Check your email, then come back to make the first weld.");
  }

  return (
    <main className={`auth-shell ${routeAtmosphere.auth}`}>
      <section className="auth-panel">
        <WorkshopGreeter className="auth-panel-greeter" />
        <InfraPreviewBanner detail={copy.infraPreview.signup} />
        <p className="eyebrow">{copy.brand}</p>
        <h1>{copy.auth.signupTitle}</h1>
        <p>{copy.auth.signupSubhead}</p>
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
              autoComplete="new-password"
              required
              minLength={8}
              disabled={preview}
            />
          </label>
          <label className="field">
            <span>Confirm password</span>
            <input
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              disabled={preview}
            />
          </label>
          <button className="button button-dark" type="submit" disabled={preview}>
            {preview ? "Sign-up disabled (preview)" : copy.auth.signupCta}
          </button>
          <p className="status-line" role="status">{status}</p>
        </form>
        <Link className="button button-outline" href="/login">I already have an account</Link>
      </section>
    </main>
  );
}
