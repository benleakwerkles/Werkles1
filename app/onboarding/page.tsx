"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { copy } from "@/lib/copy";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type Phase = "first-weld" | "doors" | "quick-weld" | "blueprint";

function splitTags(value: FormDataEntryValue | null) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function OnboardingPage() {
  const [phase, setPhase] = useState<Phase>("first-weld");
  const [status, setStatus] = useState("The machine needs lane, arena, and turf.");
  const [busy, setBusy] = useState(false);

  async function currentUser() {
    const supabase = getSupabaseBrowser();
    const { data } = await supabase.auth.getUser();
    return data.user;
  }

  async function saveFirstWeld(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setStatus("Heating the first weld.");

    try {
      const lane = String(form.get("lane") || "Builder");
      const arena = String(form.get("arena") || "").trim();
      const turf = String(form.get("turf") || "").replace(/\D/g, "").slice(0, 5);

      if (!arena || turf.length !== 5) {
        setStatus("Arena and a valid ZIP are required.");
        return;
      }

      const supabase = getSupabaseBrowser();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        setStatus(copy.onboarding.loginRequired);
        return;
      }

      const response = await fetch("/api/onboarding/first-weld", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ lane, arena, turf })
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setStatus(payload.error || copy.onboarding.zipFailed);
        return;
      }

      setStatus(`${copy.onboarding.saved} Pick a door below, or go straight to Foundry Dues.`);
      setPhase("doors");
    } catch {
      setStatus("First weld jammed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function chooseDepth(profileDepth: "full_audit" | "blueprint") {
    const user = await currentUser();
    if (!user) {
      setStatus("Log in before choosing a door.");
      return;
    }

    if (profileDepth === "blueprint") {
      setPhase("blueprint");
      return;
    }

    const { error } = await getSupabaseBrowser()
      .from("profiles")
      .update({ profile_depth: profileDepth })
      .eq("id", user.id);

    if (error) {
      setStatus(error.message);
      return;
    }

    window.location.href = "/dashboard/profile";
  }

  async function saveQuickWeld(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setStatus("Locking the quick weld.");
    const user = await currentUser();
    if (!user) {
      setBusy(false);
      setStatus("Log in before saving.");
      return;
    }

    const { error } = await getSupabaseBrowser()
      .from("profiles")
      .update({
        profile_depth: "quick_weld",
        skills_offered: splitTags(form.get("skills_offered")),
        skills_sought: splitTags(form.get("skills_sought")),
        timeline_to_launch: String(form.get("timeline_to_launch") || "").trim() || null,
        primary_goal: String(form.get("primary_goal") || "").trim() || null,
        work_preference: String(form.get("work_preference") || "Local Only")
      })
      .eq("id", user.id);

    setBusy(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    window.location.href = "/dashboard/profile";
  }

  async function saveBlueprint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const narrative = String(form.get("blueprint_narrative") || "").trim();

    if (narrative.length < 20) {
      setStatus(copy.onboarding.workshopMinLength);
      return;
    }

    setBusy(true);
    setStatus("Rolling out the Workshop.");
    const user = await currentUser();
    if (!user) {
      setBusy(false);
      setStatus("Log in before saving.");
      return;
    }

    const { error } = await getSupabaseBrowser()
      .from("profiles")
      .update({
        profile_depth: "blueprint",
        blueprint_narrative: narrative
      })
      .eq("id", user.id);

    setBusy(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    window.location.href = "/dashboard/profile";
  }

  return (
    <main className="dashboard-main onboarding-page">
      <nav className="dashboard-nav" aria-label="Onboarding navigation">
        <Link href="/">Home</Link>
        <Link href="/membership">Foundry Dues</Link>
        <Link href="/dashboard/profile">Profile</Link>
      </nav>

      <section className="onboarding-hero">
        <p className="eyebrow">{copy.brand}</p>
        <h1>{copy.onboarding.headline}</h1>
        <p>{copy.onboarding.subhead}</p>
      </section>

      {phase === "first-weld" && (
        <section className="ops-card onboarding-panel">
          <form className="first-weld-grid" onSubmit={saveFirstWeld}>
            <label className="field">
              <span>{copy.onboarding.lane}</span>
              <select name="lane" defaultValue="Builder">
                {copy.laneOptions.map((lane) => (
                  <option key={lane}>{lane}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>{copy.onboarding.arena}</span>
              <input name="arena" placeholder="plumbing, food service, HVAC" required />
            </label>
            <label className="field">
              <span>{copy.onboarding.turf}</span>
              <input name="turf" inputMode="numeric" maxLength={5} placeholder="ZIP code" required />
            </label>
            <button className="button button-light" type="submit" disabled={busy}>
              Set the First Weld
            </button>
          </form>
          <p className="status-line" role="status">{status}</p>
        </section>
      )}

      {phase === "doors" && (
        <section className="door-section">
          <div className="card-heading">
            <p>Three doors</p>
            <h2>{copy.onboarding.doorsHeadline}</h2>
          </div>
          <div className="profile-actions">
            <Link className="button button-light" href="/membership">
              Continue to Foundry Dues
            </Link>
          </div>
          <div className="door-grid">
            <article className="ops-card door-card">
              <h3>{copy.onboarding.doors.quickWeld.title}</h3>
              <p>{copy.onboarding.doors.quickWeld.body}</p>
              <button className="button button-light" type="button" onClick={() => setPhase("quick-weld")}>
                {copy.onboarding.doors.quickWeld.cta}
              </button>
            </article>
            <article className="ops-card door-card">
              <h3>{copy.onboarding.doors.fullAudit.title}</h3>
              <p>{copy.onboarding.doors.fullAudit.body}</p>
              <button className="button button-dark" type="button" onClick={() => chooseDepth("full_audit")}>
                {copy.onboarding.doors.fullAudit.cta}
              </button>
            </article>
            <article className="ops-card door-card">
              <h3>{copy.onboarding.doors.workshop.title}</h3>
              <p>{copy.onboarding.doors.workshop.body}</p>
              <button className="button button-outline" type="button" onClick={() => chooseDepth("blueprint")}>
                {copy.onboarding.doors.workshop.cta}
              </button>
            </article>
          </div>
          <p className="status-line" role="status">{status}</p>
        </section>
      )}

      {phase === "quick-weld" && (
        <section className="ops-card onboarding-panel">
          <div className="card-heading">
            <p>The Quick Weld</p>
            <h2>Five answers. No marble lobby.</h2>
          </div>
          <form className="profile-grid" onSubmit={saveQuickWeld}>
            <label className="field wide-field">
              <span>Skills offered</span>
              <input name="skills_offered" placeholder="field work, books, dispatch" required />
            </label>
            <label className="field wide-field">
              <span>Skills sought</span>
              <input name="skills_sought" placeholder="license, crews, sales" required />
            </label>
            <label className="field">
              <span>Timeline</span>
              <input name="timeline_to_launch" placeholder="0-3 months" required />
            </label>
            <label className="field">
              <span>Primary goal</span>
              <input name="primary_goal" placeholder="Durable local company" required />
            </label>
            <label className="field">
              <span>Work preference</span>
              <select name="work_preference" defaultValue="Local Only">
                {copy.workPreferences.map((preference) => (
                  <option key={preference}>{preference}</option>
                ))}
              </select>
            </label>
            <div className="profile-actions">
              <button className="button button-light" type="submit" disabled={busy}>
                Save Quick Weld
              </button>
              <p className="status-line" role="status">{status}</p>
            </div>
          </form>
        </section>
      )}

      {phase === "blueprint" && (
        <section className="ops-card onboarding-panel">
          <div className="card-heading">
            <p>The Workshop</p>
            <h2>Tell the machine what wants to exist.</h2>
          </div>
          <form className="form-stack" onSubmit={saveBlueprint}>
            <label className="field">
              <span>Workshop narrative</span>
              <textarea
                name="blueprint_narrative"
                rows={8}
                placeholder="What are you building, who is missing, what proof do you already have, and where does this thing live?"
                required
              />
            </label>
            <button className="button button-light" type="submit" disabled={busy}>
              Save Workshop
            </button>
            <p className="status-line" role="status">{status}</p>
          </form>
        </section>
      )}
    </main>
  );
}
