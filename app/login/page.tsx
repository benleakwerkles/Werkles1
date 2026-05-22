"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { copy } from "@/lib/copy";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const [status, setStatus] = useState("Use the account you created for Werkles.");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    <main className="auth-shell">
      <section className="auth-panel">
        <p className="eyebrow">{copy.brand}</p>
        <h1>{copy.auth.loginTitle}</h1>
        <form className="form-stack" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label className="field">
            <span>Password</span>
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button className="button button-dark" type="submit">Log in</button>
          <p className="status-line" role="status">{status}</p>
        </form>
        <Link className="button button-outline" href="/signup">Create an account</Link>
      </section>
    </main>
  );
}
