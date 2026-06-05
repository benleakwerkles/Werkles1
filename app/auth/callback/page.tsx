"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";

function readAuthParams() {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const queryParams = new URLSearchParams(window.location.search);
  return { hashParams, queryParams };
}

function decodeAuthMessage(value: string | null) {
  if (!value) return null;
  return decodeURIComponent(value.replace(/\+/g, " "));
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Confirming your account.");

  useEffect(() => {
    async function confirmAccount() {
      const { hashParams, queryParams } = readAuthParams();
      const supabase = getSupabaseBrowser();

      const hashError = hashParams.get("error");
      if (hashError) {
        const description =
          decodeAuthMessage(hashParams.get("error_description")) ||
          decodeAuthMessage(hashParams.get("error_code")) ||
          hashError;

        if (hashParams.get("error_code") === "otp_expired") {
          setStatus(
            `${description} Request a new confirmation email from Supabase, or log in if your account is already confirmed.`
          );
          return;
        }

        setStatus(description);
        return;
      }

      const queryError = queryParams.get("error");
      if (queryError) {
        setStatus(decodeAuthMessage(queryParams.get("error_description")) || queryError);
        return;
      }

      const code = queryParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setStatus(error.message);
          return;
        }

        router.replace("/onboarding");
        return;
      }

      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error) {
          setStatus(error.message);
          return;
        }

        router.replace("/onboarding");
        return;
      }

      setStatus("No confirmation code found. Log in with your email and password.");
    }

    confirmAccount();
  }, [router]);

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <p className="eyebrow">Werkles</p>
        <h1>Opening the gate.</h1>
        <p className="status-line" role="status">
          {status}
        </p>
        <Link className="button button-outline" href="/login">
          Back to login
        </Link>
      </section>
    </main>
  );
}
