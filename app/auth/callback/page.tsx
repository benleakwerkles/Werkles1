"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Confirming your account.");

  useEffect(() => {
    async function confirmAccount() {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");

      if (!code) {
        setStatus("No confirmation code found. Log in with your email and password.");
        return;
      }

      const { error } = await getSupabaseBrowser().auth.exchangeCodeForSession(code);
      if (error) {
        setStatus(error.message);
        return;
      }

      router.replace("/onboarding");
    }

    confirmAccount();
  }, [router]);

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <p className="eyebrow">Werkles</p>
        <h1>Opening the gate.</h1>
        <p className="status-line" role="status">{status}</p>
      </section>
    </main>
  );
}
