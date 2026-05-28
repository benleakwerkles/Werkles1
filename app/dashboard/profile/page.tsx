"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { copy } from "@/lib/copy";
import { deriveAccessWeight } from "@/lib/access-weight-client";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type ProfileRow = {
  display_name?: string;
  first_name?: string;
  last_name?: string;
  location_city?: string;
  location_state?: string;
  lane?: string;
  work_preference?: string;
  current_employer?: string;
  skills_offered?: string[];
  skills_sought?: string[];
  industry_tags?: string[];
  timeline_to_launch?: string;
  primary_goal?: string;
  visibility_mode?: string;
  show_employer?: boolean;
  profile_depth?: string;
  membership_tier?: string;
  subscription_status?: string;
  id_status?: string;
  funds_status?: string;
  deep_audit_status?: string;
  turf_zip?: string;
  blueprint_narrative?: string;
};

function splitTags(value: FormDataEntryValue | null) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinTags(value?: string[]) {
  return (value || []).join(", ");
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileRow>({});
  const [status, setStatus] = useState("Loading profile...");
  const [verificationStatus, setVerificationStatus] = useState(copy.verification.pending);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      let supabase: ReturnType<typeof getSupabaseBrowser>;

      try {
        supabase = getSupabaseBrowser();
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "The steel is not connected yet.");
        return;
      }

      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        setStatus("Log in before creating a production profile.");
        return;
      }

      setEmail(userData.user.email || null);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .maybeSingle();

      if (error) {
        setStatus(error.message);
        return;
      }

      setProfile(data || {});
      setStatus(data ? "Profile loaded." : "Create your first production profile.");
    }

    loadProfile();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let supabase: ReturnType<typeof getSupabaseBrowser>;

    try {
      supabase = getSupabaseBrowser();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The steel is not connected yet.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setStatus("Log in before saving.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const row = {
      id: userData.user.id,
      email: userData.user.email,
      display_name: String(form.get("display_name") || "").trim(),
      first_name: String(form.get("first_name") || "").trim() || null,
      last_name: String(form.get("last_name") || "").trim() || null,
      location_city: String(form.get("location_city") || "").trim(),
      location_state: String(form.get("location_state") || "").trim().toUpperCase(),
      lane: String(form.get("lane") || "Builder"),
      work_preference: String(form.get("work_preference") || "Local Only"),
      current_employer: String(form.get("current_employer") || "").trim() || null,
      phone:
        form.get("phone_consent") === "on"
          ? String(form.get("phone") || "").trim() || null
          : null,
      past_roles: [],
      skills_offered: splitTags(form.get("skills_offered")),
      skills_sought: splitTags(form.get("skills_sought")),
      industry_tags: splitTags(form.get("industry_tags")),
      timeline_to_launch: String(form.get("timeline_to_launch") || "").trim() || null,
      primary_goal: String(form.get("primary_goal") || "").trim() || null,
      profile_depth: String(form.get("profile_depth") || "quick_weld"),
      turf_zip: String(form.get("turf_zip") || "").trim() || null,
      blueprint_narrative: String(form.get("blueprint_narrative") || "").trim() || null,
      visibility_mode: String(form.get("visibility_mode") || "full_name"),
      show_employer: form.get("show_employer") === "on"
    };

    if (!row.display_name || !row.location_city || !row.location_state) {
      setStatus("Display name, city, and state are required.");
      return;
    }

    const { error } = await supabase.from("profiles").upsert(row);
    setStatus(error ? error.message : "Profile saved.");
  }

  async function triggerVerification(kind: "identity" | "funds") {
    let supabase: ReturnType<typeof getSupabaseBrowser>;

    try {
      supabase = getSupabaseBrowser();
    } catch (error) {
      setVerificationStatus(error instanceof Error ? error.message : "The steel is not connected yet.");
      return;
    }

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      setVerificationStatus("Log in before preparing verification.");
      return;
    }

    setVerificationStatus(copy.verification.pending);
    const response = await fetch(`/api/verification/${kind}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const payload = await response.json();
    setVerificationStatus(payload.error || payload.label || copy.verification.prepared);
  }

  return (
    <CockpitShell>
      <main className="dashboard-main">
      <nav className="dashboard-nav" aria-label="Dashboard navigation">
        <Link href="/dashboard">Match deck</Link>
        <Link href="/dashboard/blueprints">{copy.dashboard.workshops.navLabel}</Link>
        <Link href="/dashboard/intros">Intros</Link>
      </nav>

      <section className="ops-card profile-editor">
        <div className="card-heading">
          <p>{copy.dashboard.profile.kicker}</p>
          <h1>{copy.dashboard.profile.headline}</h1>
        </div>
        <div className="trust-state-strip" aria-label="Trust state">
          <span>{deriveAccessWeight(profile)} Foundry record</span>
          <span>Membership: {profile.membership_tier || "free"}</span>
          <span>ID: {profile.id_status || "none"}</span>
          <span>Assets: {profile.funds_status || "none"}</span>
        </div>
        <form className="profile-grid" key={`${email || "anonymous"}:${profile.display_name || "new"}`} onSubmit={handleSubmit}>
          <label className="field">
            <span>Display name</span>
            <input name="display_name" defaultValue={profile.display_name || ""} required />
          </label>
          <label className="field">
            <span>First name</span>
            <input name="first_name" defaultValue={profile.first_name || ""} />
          </label>
          <label className="field">
            <span>Last name</span>
            <input name="last_name" defaultValue={profile.last_name || ""} />
          </label>
          <label className="field">
            <span>Email</span>
            <input value={email || ""} readOnly />
          </label>
          <label className="field">
            <span>Phone</span>
            <input name="phone" type="tel" placeholder="Twilio Verify wiring next" />
          </label>
          <label className="consent-line">
            <input name="phone_consent" type="checkbox" />
            <span>{copy.auth.phoneConsent}</span>
          </label>
          <label className="field">
            <span>City</span>
            <input name="location_city" defaultValue={profile.location_city || ""} required />
          </label>
          <label className="field">
            <span>State</span>
            <input name="location_state" defaultValue={profile.location_state || ""} maxLength={2} required />
          </label>
          <label className="field">
            <span>Turf ZIP</span>
            <input name="turf_zip" defaultValue={profile.turf_zip || ""} inputMode="numeric" maxLength={5} />
          </label>
          <label className="field">
            <span>Lane</span>
            <select name="lane" defaultValue={profile.lane || "Builder"}>
              {copy.laneOptions.map((lane) => <option key={lane}>{lane}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Work preference</span>
            <select name="work_preference" defaultValue={profile.work_preference || "Local Only"}>
              {copy.workPreferences.map((preference) => <option key={preference}>{preference}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Current employer</span>
            <input name="current_employer" defaultValue={profile.current_employer || ""} />
          </label>
          <label className="consent-line">
            <input name="show_employer" type="checkbox" defaultChecked={Boolean(profile.show_employer)} />
            <span>Show employer on public profile</span>
          </label>
          <label className="field">
            <span>Visibility</span>
            <select name="visibility_mode" defaultValue={profile.visibility_mode || "full_name"}>
              {copy.visibilityModes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
            </select>
          </label>
          <label className="field">
            <span>{copy.dashboard.profile.depthLabel}</span>
            <select name="profile_depth" defaultValue={profile.profile_depth || "quick_weld"}>
              <option value="quick_weld">Quick Weld</option>
              <option value="full_audit">Full Audit</option>
              <option value="blueprint">Blueprint</option>
            </select>
          </label>
          <label className="field">
            <span>Timeline</span>
            <input name="timeline_to_launch" defaultValue={profile.timeline_to_launch || ""} placeholder="0-3 months" />
          </label>
          <label className="field">
            <span>Primary goal</span>
            <input name="primary_goal" defaultValue={profile.primary_goal || ""} placeholder="Generational Family Business" />
          </label>
          <label className="field wide-field">
            <span>Skills offered</span>
            <input name="skills_offered" defaultValue={joinTags(profile.skills_offered)} placeholder="field, sales, books" />
          </label>
          <label className="field wide-field">
            <span>Skills sought</span>
            <input name="skills_sought" defaultValue={joinTags(profile.skills_sought)} placeholder="capital, license, admin" />
          </label>
          <label className="field wide-field">
            <span>Industry tags</span>
            <input name="industry_tags" defaultValue={joinTags(profile.industry_tags)} placeholder="plumbing, home services" />
          </label>
          <label className="field wide-field">
            <span>Blueprint narrative</span>
            <textarea
              name="blueprint_narrative"
              defaultValue={profile.blueprint_narrative || ""}
              rows={5}
              placeholder="What are you building, who is missing, and where does this thing live?"
            />
          </label>
          <div className="profile-actions">
            <button className="button button-dark" type="submit">Save profile</button>
            <p className="status-line" role="status">{status}</p>
          </div>
        </form>
      </section>

      <section className="ops-card verification-card">
        <div className="card-heading">
          <p>Verification Gates</p>
          <h2>{copy.dashboard.profile.verificationHeadline}</h2>
        </div>
        <p>{copy.dashboard.profile.verificationBody}</p>
        <div className="verification-actions">
          <button className="button button-outline" type="button" onClick={() => triggerVerification("identity")}>
            Prepare ID Check
          </button>
          <button className="button button-outline" type="button" onClick={() => triggerVerification("funds")}>
            Prepare Asset Check
          </button>
        </div>
        <p className="status-line" role="status">{verificationStatus}</p>
      </section>

      <section className="ops-card deep-audit-card">
        <div className="card-heading">
          <p>{copy.deepAudit.title}</p>
          <h2>Manual review for claims that need more weight.</h2>
        </div>
        <p>{copy.deepAudit.body}</p>
        <button className="button button-light deep-audit-button" type="button" disabled>
          {copy.deepAudit.cta}
        </button>
        <p className="status-line">
          Status: {profile.deep_audit_status || "none"}. {copy.deepAudit.placeholder}
        </p>
      </section>
      </main>
    </CockpitShell>
  );
}
