# Werkles Site Map — Route Planning

Status: **planning source of truth** (2026-05-26)  
Scope: routes, navigation labels, product surfaces — not full feature builds unless separately approved.

## Naming doctrine

| Term | Meaning |
|------|---------|
| **Bellows** | Public **learning / education product surface** on werkles.com — anti-guru lessons, SOPs, templates, honest operator knowledge. Squibb is the guide/host inside Bellows. |
| **Education Forge** | Internal **drafting worker** (repo: `education-forge/`) — text-only curriculum scaffold. Not a public route. Not Bellows. |
| **Ghost Forge** | Internal **image/asset batch worker** — unrelated to Bellows. |
| **Blog** | Reserved for **public marketing posts** only — do not use as a synonym for Bellows. |

Hard stop: **Do not call Bellows an AI worker or background job.**

---

## Public marketing & discovery

| Route | Nav label | Status | Description |
|-------|-----------|--------|-------------|
| `/` | (home) | **live** | Foundry floor — lanes, how it works, beta knock |
| `/#people` | People | **live** | Lane cards (anchor on home) |
| `/#how` | How | **live** | How Werkles works (anchor on home) |
| `/proof` | Proof | **live** | Crucible trust copy, proof posture |
| `/bellows` | **Bellows** | **shell** | Practical lessons, SOPs, and anti-guru operator knowledge from the Werkles foundry |
| `/membership` | Dues | **live** | Foundry Dues / membership |
| `/pricing` | — | **live** | Public pricing manifest (not in primary nav yet) |
| `/login` | Login | **live** | Auth entry |
| `/signup` | Enter the Foundry | **live** | Primary header CTA |

### Bellows — planned surface (not full build)

**Primary route:** `/bellows`

**Navigation label:** Bellows

**Short description:** Practical lessons, SOPs, and anti-guru operator knowledge from the Werkles foundry.

**Host:** Squibb (same canonical mascot — see `foreman/MASCOT_RULES.md`)

**Content lanes (inside Bellows, not separate products):**

- Anti-guru / de-gating operator knowledge
- Practical business & operator lessons
- SOPs and templates
- Honest “how this actually works” material

**Optional later routes (planning only — do not implement without approval):**

| Route | Purpose |
|-------|---------|
| `/bellows/[slug]` | Individual lesson or article |
| `/bellows/sops` | Standard operating procedures index |
| `/bellows/anti-guru` | Anti-guru curriculum index |
| `/bellows/templates` | Downloadable templates index |

**Draft staging (internal, not public):**

- `content/education/drafts/` — Education Forge output
- `foreman/education-forge-output/` — operator review artifacts

---

## Auth & onboarding

| Route | Status | Notes |
|-------|--------|-------|
| `/signup` | live | |
| `/login` | live | |
| `/auth/callback` | live | |
| `/onboarding` | live | First weld / lane pick |

---

## Member app (auth required)

| Route | Status | Notes |
|-------|--------|-------|
| `/dashboard` | live | Match deck |
| `/dashboard/profile` | live | Foundry record |
| `/dashboard/blueprints` | live | Workshops / blueprints |
| `/dashboard/blueprints/[id]` | live | |
| `/dashboard/intros` | live | Intro requests |
| `/dashboard/crucible` | live | Verification center |
| `/dashboard/billing` | live | Billing shell |

---

## Membership flow

| Route | Status |
|-------|--------|
| `/membership` | live |
| `/membership/success` | live |

---

## API routes (not in nav)

See `app/api/**` — billing, intros, verification, webhooks, cron, etc.

---

## Internal workers (not routes)

| Worker | Repo path | Writes to | Human gate |
|--------|-----------|-----------|------------|
| Ghost Forge | `ghost-forge-worker/` | draft assets | yes |
| Education Forge | `education-forge/` | `content/education/drafts/`, `foreman/education-forge-output/` | yes — does **not** publish to `/bellows` |

---

## Primary navigation (public header)

Current order (`components/foundry/site-header.tsx`):

1. People → `/#people`
2. How → `/#how`
3. Proof → `/proof`
4. **Bellows → `/bellows`**
5. Dues → `/membership`
6. Login → `/login`
7. Beta → `/#beta`
8. CTA → `/signup`

---

## Workshop atmosphere tokens

Route facet class: `workshop-route--bellows` (see `lib/workshop-facets.ts`)

---

## Related docs

- `foreman/MASCOT_RULES.md` — Squibb in Bellows
- `education-forge/README.md` — Education Forge worker (internal)
- `foreman/SITE_STYLE_APPROVED_v0.6.md` — visual doctrine
- `docs/architecture.md` — platform architecture
