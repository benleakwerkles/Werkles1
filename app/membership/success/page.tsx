import Link from "next/link";
import { copy } from "@/lib/copy";

export default function MembershipSuccessPage() {
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <p className="eyebrow">{copy.membership.eyebrow}</p>
        <h1>{copy.membership.processing}</h1>
        <p>
          The webhook is the source of truth. If the badge takes a minute to show,
          that is the register settling, not the floor rejecting you.
        </p>
        <Link className="button button-dark" href="/dashboard/profile">{copy.dashboard.profile.backToRecord}</Link>
      </section>
    </main>
  );
}
