"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { copy } from "@/lib/copy";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export default function SignupPage() {
  const [status, setStatus] = useState("Activation will still require ID, face capture, phone, and proof gates.");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    <main className="auth-shell">
      <section className="auth-panel">
        <p className="eyebrow">{copy.brand}</p>
        <h1>{copy.auth.signupTitle}</h1>
        <form className="form-stack" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label className="field">
            <span>Password</span>
            <input name="password" type="password" autoComplete="new-password" required minLength={8} />
          </label>
          <label className="field">
            <span>Confirm password</span>
            <input name="confirm" type="password" autoComplete="new-password" required minLength={8} />
          </label>
          <button className="button button-dark" type="submit">Create account</button>
          <p className="status-line" role="status">{status}</p>
        </form>
        <Link className="button button-outline" href="/login">I already have an account</Link>
      </section>
    </main>
  );
}
