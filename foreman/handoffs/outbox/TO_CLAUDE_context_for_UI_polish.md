# TO_CLAUDE_context_for_UI_polish

## 1. Current Gate And Scope

Current gate:

`[AWAITING HUMAN GATE: APP_INFRA_IMPLEMENTATION_REVIEW]`

Scope for Claude / Ender:

- UI polish review only.
- No app implementation.
- No deployment.
- No live Stripe actions.
- No provider calls.
- No Ghost Forge.
- No Bellows.
- No new assets generated in this pass.

Claude should return:

`FROM_CLAUDE_UI_POLISH_v1.md`

## 2. Current Built Routes

These routes exist locally and returned HTTP 200 in the local review pass:

- `/pricing`
- `/dashboard/crucible`
- `/dashboard/billing`
- `/membership`
- `/membership/success`
- `/proof`

## 3. Screenshots

Screenshots were created with local Edge headless and saved here:

`foreman/handoffs/outbox/ui-polish-screenshots/`

Files:

- `pricing.png`
- `dashboard__crucible.png`
- `dashboard__billing.png`
- `membership.png`
- `membership__success.png`
- `proof.png`

If these screenshots are attached with this packet, treat them as the primary visual evidence. If not attached, use the source excerpts below.

## 4. Ben's Feedback

Ben's current visual read:

- Mostly awesome.
- A little clunky.
- Cold / impersonal.
- Occasional unreadable text/background choices.
- Smaller integrated Steampunk Owl needed.
- Icons/assets needed.
- Workshop wallpaper/background should appear somewhere, but stay readable and controlled.

## 5. Current Visual Law

Ben wants this direction preserved:

- Brutalist midnight fortress.
- Mythic capitalism.
- Dark industrial optimism.
- Copper / bronze / sparks / ladders / gears / foundry energy.
- NOT pastel fintech.
- NOT cheap SaaS.
- NOT fairyland.
- NOT video-game portal.

## 6. Operator-Supplied Iron Palette For Review

Ben supplied this palette language for Claude's review:

```text
forge-bg: #0A0908
forge-panel: #161412
copper-base: #B87333
cream-text: #F5E6D3
heat-purple: #9333EA
patina-green: #2DD4BF
forge-orange: #EA580C
```

Token rules Ben supplied:

- `heat-purple` only for focus states and text-link hovers.
- `patina-green` for success, completed milestones, and button hovers.
- `forge-orange` only for errors, warnings, locked states.
- No invented colors.

Known tension for Claude to resolve:

- The current repo design source is `foreman/DESIGN_SYSTEM.md` v0.2, sampled from brand assets. It uses different token names and values for the duochrome brand system.
- Do not silently replace the repo palette. If Claude believes Ben's Iron Palette should supersede or reconcile with v0.2, return a clear `DESIGN_SYSTEM_DELTA` and say which values are controlling.

## 7. Current Design System Sources

### 7.1 `company/WERKLES_UX_LAW.md`

```markdown
# Werkles UX Law

Status: v0.2 review draft

## Article VIII - Interface Law

Werkles should feel like a private industrial cockpit, not a pastel SaaS brochure.

Palette v0.2 controls through `foreman/DESIGN_SYSTEM.md`.

Werkles lives in a warm dark world: the Foundry at night, copper and brass under candlelight, sparks against soot, and the violet+teal W mark as the brand-canonical duochrome.

The old Iron Palette and earlier indigo, emerald, lavender, cream, and light-mode palette language is legacy/marketing reconciliation only. It is not controlling law.

Primary CTAs use the violet or teal gradient defined in `foreman/DESIGN_SYSTEM.md`. Forge orange is atmosphere, not a CTA color. Copper is the frame, not the content.

## Component Feel

Components should feel useful, weighty, and direct:

- heavy buttons
- clear states
- sharp hierarchy
- compact dashboards
- no nested decorative cards
- no generic team-collab fluff
- no fragile glassmorphism that hurts readability

## People Over Avatars

Werkles is people-centric.

Show real work, roles, proof posture, arena, turf, and intent. Avoid reducing users to toy avatars or empty profile badges.

## Empty States

Empty states should be alive but useful.

Examples:

- "Nothing in the deck worth wasting your time on. Broaden the search or sharpen the ask."
- "The machine is coughing. Feed it better information."
- "Inspecting the steel."

Tone is allowed. Confusion is not.
```

### 7.2 `company/WERKLES_BRAND_VOICE.md`

```markdown
# Werkles Brand Voice

Status: v0.2 review draft

## Mythic Capitalism

Werkles speaks in Mythic Capitalism: Joe MacMillan voltage, Willy Wonka invention, worker respect, and anti-gatekeeper bite.

Always joking. Always serious.

The voice should be:

- physical
- practical
- slightly strange
- warm under the steel
- anti-guru
- pro-builder
- clear when legal or trust boundaries matter

## Lexicon

Approved or preferred terms:

- Werkles
- The Forge
- The Foundry
- Foundry Dues
- Blueprint
- Dossier
- Lock the Joints
- Knock on the door
- Proof signal
- Inspecting the steel
- Built on trust
- Builder
- Worker
- Operator
- Backer
- Connector
- Spark
- Sponsored Anvil
- The Crucible
- The Armory
- The Drafting Table
- Iron Firewall

## Blacklist

Avoid or ban in product copy unless quoted for review:

- pitch
- raise
- investment opportunity
- ROI
- alpha
- deal room
- syndicate
- broker
- intermediary
- guaranteed
- democratized deal flow
- passive income
- boss babe
- guru
- synergy
- disrupt
- optimize your hustle

## Tone Guidance

Do not write corporate team collaboration slop.

Do not make users feel like marks.

Do not overdo the bit when trust, legal boundaries, payments, identity, or safety are involved.

Clear beats clever when the user could be harmed.
```

### 7.3 `foreman/DESIGN_SYSTEM.md` Excerpt

Current repo design source says:

```markdown
VERSION: 0.2
LAST_UPDATED: 2026-05-24
LAST_UPDATED_BY: claude

Palette v0.2 was sampled from:
1. werkles app icon
2. werkles_workshop_banner.png
3. werkles_helper_avatar.png

The W is a violet+teal duochrome. These are the brand.

Brand mark:
--werkles-violet:        #3D16CA
--werkles-violet-bright: #672EED
--werkles-violet-deep:   #2A0E8C
--werkles-teal:          #02917E
--werkles-teal-bright:   #18C5AE
--werkles-teal-deep:     #015E51

Foundations:
--werkles-forge-black:    #050404
--werkles-workshop-night: #191817
--werkles-smoke:          #2C231D
--werkles-iron:           #3B342A

Frame metals:
--werkles-copper:        #9F6633
--werkles-copper-light:  #C08B52
--werkles-brass-bright:  #E0B569
--werkles-blueprint-tan: #685141

Atmosphere:
--werkles-forge-orange:  #F6AD55
--werkles-ember:         #FBC368
--werkles-owl-eye-green: #5FD178

Text:
--werkles-text-primary:   #F4E2B1
--werkles-text-secondary: #C08B52
--werkles-text-muted:     #6D5B46
```

Important usage rules from current repo source:

- Brand mark gradient is precious. Reserved for W mark, hero moments, splash screens, and key brand surfaces.
- Primary CTAs use violet gradient.
- Secondary CTAs use teal gradient.
- Pure white and pure black are forbidden.
- Forge orange is not a CTA color.
- Owl-eye-green is mascot territory and success territory.
- Copper is frame, not content.

## 8. Current Code Sources

### 8.1 `lib/design-tokens.ts`

```ts
export const designTokens = {
  version: "0.2",
  source: "foreman/DESIGN_SYSTEM.md",
  colors: {
    violet: "#3D16CA",
    violetBright: "#672EED",
    violetDeep: "#2A0E8C",
    teal: "#02917E",
    tealBright: "#18C5AE",
    tealDeep: "#015E51",
    forgeBlack: "#050404",
    workshopNight: "#191817",
    smoke: "#2C231D",
    iron: "#3B342A",
    copper: "#9F6633",
    copperLight: "#C08B52",
    brassBright: "#E0B569",
    blueprintTan: "#685141",
    forgeOrange: "#F6AD55",
    ember: "#FBC368",
    owlEyeGreen: "#5FD178",
    textPrimary: "#F4E2B1",
    textSecondary: "#C08B52",
    textMuted: "#6D5B46"
  },
  gradients: {
    brandMark:
      "linear-gradient(90deg, #3D16CA 0%, #672EED 45%, #18C5AE 55%, #02917E 100%)",
    violetVertical:
      "linear-gradient(180deg, #672EED 0%, #3D16CA 60%, #2A0E8C 100%)",
    tealVertical:
      "linear-gradient(180deg, #18C5AE 0%, #02917E 60%, #015E51 100%)",
    forgeRadial:
      "radial-gradient(circle at 70% 80%, #F6AD55 0%, #2C231D 60%, #050404 100%)"
  },
  rules: [
    "Pure white (#FFFFFF) is forbidden; use the warm-cream text token.",
    "Pure black (#000000) is forbidden; use the forge-black surface token.",
    "The W mark is brand-canonical and never recolored.",
    "Primary CTAs use the violet or teal gradient.",
    "Forge orange is atmosphere, not a CTA color.",
    "Copper is the frame, not the content."
  ]
} as const;
```

### 8.2 `lib/pricing.ts` Summary

Pricing source:

```ts
pricing.version = "v0.1";
pricing.source = "company/PRICING.md";
pricing.foundryDues.monthly.displayPrice = "$9.99/month";
pricing.foundryDues.annual.displayPrice = "$99/year";
pricing.foundryDues.annual.flavorName = "The Long Run";
```

Crucible includes identity, phone, funds, license, reference, employment, background, monitoring, and refresh/reverification items. Hard bans include:

```text
No tiered membership
No lane-priced membership
No take-rate
No success fee
No escrow
No pay-per-introduction on user-to-user deals
No premium trust badges
```

### 8.3 `lib/crucible.ts`

```ts
export type CrucibleState =
  | "not_started"
  | "membership_required"
  | "payment_required"
  | "ready_to_start"
  | "provider_redirect"
  | "pending"
  | "verified"
  | "failed"
  | "expired"
  | "manual_review"
  | "unavailable";

export const crucibleStateCopy = {
  not_started: "No steel inspected yet.",
  membership_required: "Foundry Dues unlocks this workflow. It does not buy the result.",
  payment_required: "This check passes through provider cost plus the published handling fee.",
  ready_to_start: "Ready for inspection.",
  provider_redirect: "The provider handles the sensitive parts. Werkles waits for the receipt.",
  pending: "Inspecting the steel.",
  verified: "Claim checked. Receipt filed.",
  failed: "Something did not hold. Fix the claim or pull it out.",
  expired: "This proof has gone cold. Refresh it before leaning on it.",
  manual_review: "This one needs human eyes.",
  unavailable: "The forge is not wired for this check yet."
};

export const crucibleTrustCopy = [
  "Membership unlocks access to our verification providers. It does not unlock verification itself.",
  "Werkles cannot make anyone trustworthy. We make claims harder to fake.",
  "Paid status alone is not a proof signal.",
  "We store receipts and statuses, not raw sensitive material."
];
```

Only identity and funds have active route placeholders. Other checks are unavailable.

## 9. Current Route File Contents

### 9.1 `app/pricing/page.tsx`

```tsx
import Link from "next/link";
import { PricingTable } from "@/components/pricing/pricing-table";
import { pricing } from "@/lib/pricing";

export default function PricingPage() {
  return (
    <main className="dashboard-main pricing-page">
      <nav className="dashboard-nav" aria-label="Pricing navigation">
        <Link href="/">Home</Link>
        <Link href="/membership">Foundry Dues</Link>
        <Link href="/proof">Proof</Link>
        <Link href="/signup">Enter the Foundry</Link>
      </nav>

      <section className="membership-hero pricing-hero">
        <p className="eyebrow">Pricing v0.1</p>
        <h1>One floor. Clear prices. No hidden rake.</h1>
        <p>
          Source of truth: {pricing.source}. Foundry Dues is one democratic membership.
          The Crucible publishes provider costs and handling rules before the hammer swings.
        </p>
      </section>

      <PricingTable />
    </main>
  );
}
```

### 9.2 `app/dashboard/crucible/page.tsx`

```tsx
import Link from "next/link";
import { CruciblePanel } from "@/components/crucible/crucible-panel";

export default function CruciblePage() {
  return (
    <main className="dashboard-main">
      <nav className="dashboard-nav" aria-label="Crucible navigation">
        <Link href="/dashboard">Match deck</Link>
        <Link href="/dashboard/profile">Profile</Link>
        <Link href="/dashboard/billing">Billing</Link>
        <Link href="/pricing">Pricing</Link>
      </nav>
      <CruciblePanel />
    </main>
  );
}
```

### 9.3 `app/dashboard/billing/page.tsx`

```tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { pricing } from "@/lib/pricing";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type BillingProfile = {
  membership_tier?: string | null;
  subscription_status?: string | null;
  current_period_end?: string | null;
  stripe_customer_id?: string | null;
};

export default function BillingPage() {
  const [profile, setProfile] = useState<BillingProfile | null>(null);
  const [status, setStatus] = useState("Checking the brass register.");

  useEffect(() => {
    async function loadBilling() {
      try {
        const supabase = getSupabaseBrowser();
        const { data: userData } = await supabase.auth.getUser();

        if (!userData.user) {
          setStatus("Log in to inspect billing.");
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("membership_tier, subscription_status, current_period_end, stripe_customer_id")
          .eq("id", userData.user.id)
          .maybeSingle();

        if (error) {
          setStatus(error.message);
          return;
        }

        setProfile(data || {});
        setStatus("Billing profile loaded.");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "The register is not wired yet.");
      }
    }

    loadBilling();
  }, []);

  async function openPortal() {
    setStatus("Billing portal is gated. No live portal session is created in this pass.");
  }

  return (
    <main className="dashboard-main">
      <nav className="dashboard-nav" aria-label="Billing navigation">
        <Link href="/dashboard">Match deck</Link>
        <Link href="/membership">Membership</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/dashboard/crucible">Crucible</Link>
      </nav>

      <section className="ops-card billing-panel">
        <div className="card-heading">
          <p>Billing</p>
          <h1>The brass register tells the truth after Stripe signs it.</h1>
        </div>
        <div className="trust-state-strip">
          <span>Tier: {profile?.membership_tier || "free"}</span>
          <span>Status: {profile?.subscription_status || "none"}</span>
          <span>Customer: {profile?.stripe_customer_id ? "linked" : "not linked"}</span>
        </div>
        <p>
          Monthly Foundry Dues are {pricing.foundryDues.monthly.displayPrice}. The Long Run is{" "}
          {pricing.foundryDues.annual.displayPrice}. Membership state changes only after the
          Stripe webhook lands.
        </p>
        <p>
          Current period end:{" "}
          {profile?.current_period_end
            ? new Date(profile.current_period_end).toLocaleDateString()
            : "not set"}
        </p>
        <button className="button button-outline" type="button" onClick={openPortal}>
          Prepare billing portal
        </button>
        <p className="status-line" role="status">{status}</p>
      </section>
    </main>
  );
}
```

### 9.4 `app/membership/page.tsx`

```tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { copy } from "@/lib/copy";
import { pricing } from "@/lib/pricing";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type Plan = "monthly" | "annual";

export default function MembershipPage() {
  const [status, setStatus] = useState("Choose your dues. Stripe handles the brass register.");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("checkout") === "cancelled") {
      setStatus(copy.membership.cancelled);
    }
  }, []);

  async function startCheckout(plan: Plan) {
    setStatus("Opening Stripe checkout.");
    const supabase = getSupabaseBrowser();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      setStatus("Log in before paying dues.");
      return;
    }

    const response = await fetch("/api/membership/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ plan })
    });

    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error || "Checkout jammed. Try again.");
      return;
    }

    window.location.href = payload.url;
  }

  return (
    <main className="dashboard-main membership-page">
      <nav className="dashboard-nav" aria-label="Membership navigation">
        <Link href="/">Home</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/dashboard">Match deck</Link>
        <Link href="/onboarding">Onboarding</Link>
      </nav>

      <section className="membership-hero">
        <p className="eyebrow">{copy.membership.eyebrow}</p>
        <h1>{copy.membership.headline}</h1>
        <p>{copy.membership.subhead}</p>
      </section>

      <section className="membership-grid" aria-label="Foundry Dues plans">
        <article className="ops-card plan-card">
          <p className="plan-kicker">Free Dossier</p>
          <h2>$0</h2>
          <p>Create your profile, choose your lane, build the dossier, browse the match deck, and read summaries.</p>
          <Link className="button button-outline" href="/onboarding">Start free</Link>
        </article>

        <article className="ops-card plan-card plan-card-featured">
          <p className="plan-kicker">{copy.membership.monthly}</p>
          <h2>{pricing.foundryDues.monthly.displayPrice}</h2>
          <p>Unlock intro requests, workspace access, verification triggers, and the path toward heavier trust weight.</p>
          <button className="button button-light" type="button" onClick={() => startCheckout("monthly")}>
            {copy.membership.checkout}
          </button>
        </article>

        <article className="ops-card plan-card">
          <p className="plan-kicker">{copy.membership.annual}</p>
          <h2>{pricing.foundryDues.annual.displayPrice}</h2>
          <p>Same foundry access, one yearly clang, roughly twenty bucks kept in your pocket.</p>
          <button className="button button-dark" type="button" onClick={() => startCheckout("annual")}>
            Start The Long Run
          </button>
        </article>
      </section>

      <section className="ops-card membership-trust">
        <h2>Trust still has to earn its boots.</h2>
        <p>{copy.membership.trust}</p>
        <p className="status-line" role="status">{status}</p>
      </section>
    </main>
  );
}
```

### 9.5 `app/membership/success/page.tsx`

```tsx
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
        <Link className="button button-dark" href="/dashboard/profile">Back to your dossier</Link>
      </section>
    </main>
  );
}
```

### 9.6 `app/proof/page.tsx`

```tsx
import { readStaticBody } from "@/lib/static-page";
import { crucibleTrustCopy } from "@/lib/crucible";
import { pricing } from "@/lib/pricing";

export default function ProofPage() {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: readStaticBody("proof.html") }} />
      <main className="proof-main">
        <section className="proof-warning proof-boundary">
          <div>
            <p className="eyebrow">The Crucible</p>
            <h2>Transparent checks. No paid trust theater.</h2>
            <p className="trust-badge">Pricing source: {pricing.source}</p>
          </div>
          <div className="gate-list" aria-label="Crucible proof rules">
            {crucibleTrustCopy.map((line) => (
              <span key={line}>{line}</span>
            ))}
            <span>Maximum handling fee: $5 per check.</span>
          </div>
        </section>
      </main>
    </>
  );
}
```

## 10. Component Excerpts

### 10.1 `components/pricing/pricing-table.tsx`

The pricing route renders:

- Foundry Dues membership cards.
- Armory pricing grid.
- Crucible pricing grid.
- Iron Firewall hard-ban list.

Main issue candidates:

- Dense table layouts may be clunky.
- Pricing information may need more warmth and hierarchy.
- Hard-ban section may need an icon/header treatment.

### 10.2 `components/crucible/crucible-panel.tsx`

The Crucible route renders:

- Hero card: "Trust is not for sale. The workflow is."
- Trust rules as pill-like spans.
- Verification cards for identity/funds/etc.
- Identity and funds buttons point to existing sandbox route placeholders.

Main issue candidates:

- It may feel cold or too status-grid heavy.
- Needs clearer proof hierarchy and small Owl/supporting iconography.
- Needs contrast audit across badges, unavailable states, buttons, and status line.

## 11. What Claude Should Return

Return:

`FROM_CLAUDE_UI_POLISH_v1.md`

Required sections:

1. Overall UI diagnosis.
2. Warmth/personality fixes.
3. Contrast/accessibility fixes.
4. Owl integration rules.
5. Icon/asset list.
6. Workshop wallpaper/background placement rules.
7. Component-level polish recommendations.
8. Route-by-route notes.
9. Exact files Codex should modify.
10. What Codex should not touch yet.

## 12. Specific Questions For Claude

1. Which current surfaces feel most cold or impersonal?
2. Where can we add humanity without slipping into generic mascot SaaS?
3. Where should the Steampunk Owl appear, and at what size?
4. Should the Workshop wallpaper be used on `/membership`, `/pricing`, `/proof`, or dashboard shells?
5. What overlay treatment keeps wallpaper readable?
6. Which text/background pairs look risky?
7. Which route should Codex polish first?
8. Should Codex reconcile Ben's Iron Palette language with `DESIGN_SYSTEM.md` v0.2 before UI work, or treat it as directional feedback only?

## 13. Boundaries

Claude should not recommend:

- Live Stripe product creation.
- Secret entry.
- Deployment.
- SQL changes.
- Ghost Forge or Bellows execution.
- New monetization mechanics.
- User-to-user payments.
- Take-rate.
- Success fee.
- Escrow.
- Lending.
- Premium trust badges.
- A new palette without a formal `DESIGN_SYSTEM_DELTA`.
- Large asset generation batches.

## 14. Desired Output Shape

Use this structure:

1. `VERDICT: GO / CONDITIONAL GO / NO-GO FOR CODEX UI POLISH`
2. Highest-priority polish findings
3. Route-by-route recommendations
4. Token/contrast fixes
5. Owl integration spec
6. Asset/icon list
7. Workshop wallpaper rules
8. File-level implementation checklist
9. Do-not-touch list
10. Open questions for Ben

