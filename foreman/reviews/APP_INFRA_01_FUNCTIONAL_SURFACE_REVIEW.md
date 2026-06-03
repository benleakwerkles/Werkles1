# APP_INFRA-01 — Functional Surface Review

**Gate:** `[CLOSED — APPROVED 2026-06-03]` → next: `[IN PROGRESS: SUPABASE_AUTH_STRIPE_TEST_WIRING]`  
**Reviewer:** Maker (Cursor)  
**Review date:** 2026-05-31  
**Ben verdict:** **APPROVE** (2026-06-03) — `foreman/gates/APPROVAL_LOG.md`  
**Petra slice:** APP_INFRA-01 — Functional Surface Review (`GO_WITH_CONDITIONS`, crew-checkin)  
**Preview method:** `npm run dev` → http://localhost:3000 (HTTP 200 on all scoped routes)  
**Pricing source checked:** `lib/pricing.ts` ↔ `company/PRICING.md` v0.1  

**Doctrine for this review:** No deploy, push, SQL, secrets access, Ghost Forge, Education Forge, or new feature work. This packet is read-only assessment for Ben’s human gate.

---

## Executive summary

All eight scoped routes **load successfully** (HTTP 200). Pricing display anchors **match** locked `company/PRICING.md`. Bellows is correctly a **public learning route shell**, not the Education Forge worker.

**Gaps:** `/login`, `/membership`, and `/dashboard/billing` are **not preview-only** when Supabase env is configured — they perform live auth, profile reads, and Stripe checkout session creation. Crucible identity/funds checks hit **sandbox API routes** (DB status updates, no external Stripe Identity/Plaid redirect in code), but still require login and network calls.

**Maker recommendation (2026-05-31):** **PATCH** — approve the static/marketing surfaces and pricing manifest; patch-gate auth/membership/billing to preview/mock mode **or** explicitly accept live sandbox wiring before APP_INFRA functional sign-off.

**Post-patch (2026-06-02):** Preview-mode implementation — commit `02bf718`. **Ben APPROVED** 2026-06-03 — see §13.

---

## 1. Routes reviewed

| Route | Loads | HTTP (local) | Notes |
|-------|-------|--------------|-------|
| `/` | Yes | 200 | Home — lanes, how, beta, proof/dashboard CTAs |
| `/pricing` | Yes | 200 | Full pricing manifest UI |
| `/membership` | Yes | 200 | Plan cards + checkout buttons |
| `/dashboard/crucible` | Yes | 200 | Verification grid + sandbox API hooks |
| `/dashboard/billing` | Yes | 200 | Profile billing read + blocked portal |
| `/login` | Yes | 200 | Email/password form |
| `/proof` | Yes | 200 | Static proof HTML + trust copy |
| `/bellows` | Yes | 200 | Learning route shell |

---

## 2. CTA / link status

| Area | Status | Detail |
|------|--------|--------|
| Site header | **Coherent** | People, How, Proof, Bellows, Dues, Login, Beta anchor, Signup CTA |
| Home hero | **Mostly coherent** | Primary → `/signup`; secondary label “Inspect the deck” → `#how` (wording mismatch — minor) |
| Home footer cards | **Coherent** | Proof → `/proof`; Dashboard teaser → `/dashboard` |
| `/pricing` nav | **Coherent** | Home, Foundry Dues, Proof, Signup |
| `/membership` nav | **Coherent** | Home, Pricing, Match deck, Onboarding |
| Dashboard sub-nav | **Coherent** | Crucible ↔ Billing ↔ Profile cross-links |
| `/pricing` in header | **Missing** | Pricing reachable via `/membership` or direct URL only — not broken, optional PATCH |
| `/bellows` | **Coherent** | Proof + Foundry Dues CTAs |

---

## 3. Pricing anchor status

**PASS** — `lib/pricing.ts` reflects locked v0.1 law:

| Anchor | Expected (`company/PRICING.md`) | UI (`/pricing`, `/membership`) |
|--------|----------------------------------|--------------------------------|
| Foundry Dues monthly | $9.99/month | `$9.99/month` ✓ |
| Foundry Dues annual | $99/year (“The Long Run”) | `$99/year` ✓ |
| Armory Simple | $9.99 | Table row ✓ |
| Armory Mid | $19 | ✓ |
| Armory signature | $29 / member $20.30 | ✓ |
| Armory Deep | $49 / member $34.30 | ✓ |
| Armory Bundle | $99 / member Free | ✓ |
| Crucible line items | Per PRICING.md §3 | Rendered on `/pricing` crucible section ✓ |
| Hard bans | Listed in `pricing.hardBans` | Surfaced in pricing copy ✓ |

Source attribution shown: `company/PRICING.md`.

---

## 4. Membership status

| Check | Status | Detail |
|-------|--------|--------|
| Flow clarity | **Clear** | Free → onboarding; paid → checkout buttons |
| Cancel query | **Works** | `?checkout=cancelled` shows cancelled copy |
| Plan query | **Weak** | `/membership?plan=monthly` from pricing CTAs — page does not pre-select/highlight plan |
| Checkout behavior | **Live when wired** | `startCheckout()` → Supabase session → `POST /api/membership/checkout` → Stripe Checkout URL |
| Unauthenticated | **Blocked message** | “Log in before paying dues.” |
| Petra condition | **Conflict** | Conditions forbid Stripe live products / provider calls during this gate — checkout path is wired for real Stripe when env present |

---

## 5. Crucible local / mock state status

| Check | Status | Detail |
|-------|--------|--------|
| UI labeling | **Good** | Trust rules, draft atmosphere, “workflow not for sale” copy |
| Check availability | **Partial** | Only `identity` + `funds` active; others `unavailable` |
| API behavior | **Sandbox** | `POST /api/verification/identity` and `/funds` set `sandbox_pending` on profile — no external provider redirect in route code |
| Auth gate | **Required** | Checks require logged-in bearer token |
| Preview-only? | **No** | Still performs authenticated API + Supabase profile writes when env configured |

---

## 6. Billing shell status

| Check | Status | Detail |
|-------|--------|--------|
| Portal button | **Safe** | `openPortal()` sets blocked message — no Stripe portal session created |
| Profile read | **Live when wired** | Reads `profiles` for tier, subscription_status, stripe_customer_id |
| Unauthenticated | **Message only** | “Log in to inspect billing.” |
| Pricing copy | **Anchored** | Shows $9.99/mo and $99/yr from `lib/pricing` |
| Money movement | **None from UI** | Portal blocked; no charge from this page |

---

## 7. Login preview-only status

| Check | Status | Detail |
|-------|--------|--------|
| Form | Email + password → `signInWithPassword` | **Live Supabase auth when env configured** |
| Success redirect | `/onboarding` | |
| Missing env | Throws user-facing “steel is not connected” error | Fail-closed |
| Preview-only? | **NO** | Real auth path — fails Petra check #7 unless Ben accepts sandbox auth as in-scope |

---

## 8. Bellows route / status

| Check | Status | Detail |
|-------|--------|--------|
| Route present | **Yes** | `/bellows` |
| Purpose | **Learning surface** | Copy: lessons, SOPs, anti-guru knowledge; Squibb hosts |
| Shell note | **Visible** | “Route shell only — full Bellows curriculum ships after separate approval.” |
| vs Education Forge | **Correct** | No worker invocation; not conflated with `education-forge/` internal worker |
| vs Ghost Forge | **Correct** | No image batch references |
| CTAs | Proof + Foundry Dues | Coherent entry paths |

---

## 9. Known placeholders

- Bellows: full curriculum not built — explicit shell note
- Crucible: 9 of 11 checks marked unavailable / not wired
- Billing portal: gated message only
- Hero secondary CTA wording vs `#how` target
- Draft asset gallery / Ghost Forge assets on home — visual placeholders (Gate 05 PAUSE)
- `/pricing` not in primary header nav
- Membership plan query param ignored

---

## 10. Broken items

**None blocking route load.** Functional / doctrine gaps:

1. **Login not preview-only** — live Supabase password auth
2. **Membership checkout** — live Stripe session creation when authenticated + env present
3. **Billing** — live Supabase profile reads (portal correctly blocked)
4. **Crucible** — sandbox APIs still mutate profile state; not a read-only mock panel
5. **Hero secondary CTA** — “Inspect the deck” links to `#how`, not dashboard/deck
6. **Membership plan deep-link** — pricing CTAs pass `?plan=` but membership page ignores it

No 404s or runtime crashes observed on scoped routes during review.

---

## 11. Provider / secrets check (Petra #9–10)

| Check | Result |
|-------|--------|
| Secrets entered/printed in review | **No** |
| Env vars referenced in code | `NEXT_PUBLIC_SUPABASE_*`, Stripe server keys (not read during review) |
| External calls when env configured | Supabase auth, Supabase DB, Stripe Checkout (membership), sandbox verification APIs (crucible) |
| External calls when env missing | Fail-closed with user-visible errors on auth/checkout paths |

---

## 12. Recommendation

### **PATCH**

**Approve as-is for:** `/`, `/pricing`, `/proof`, `/bellows` static/marketing surfaces; pricing anchor integrity; billing portal block; Bellows vs worker naming.

**Patch before APPROVE of full APP_INFRA-01:**

1. Add preview/mock mode (or prominent preview banner) on `/login`, `/membership`, `/dashboard/billing`, `/dashboard/crucible` **OR** Ben explicitly accepts current sandbox/live wiring in human gate record
2. Fix hero secondary CTA target or label
3. Honor `/membership?plan=` from pricing links (optional small PATCH)
4. Consider header link to `/pricing` (optional)

**NO-GO if:** Ben requires strict preview-only with zero provider calls on these routes before any functional sign-off — current membership/login paths fail that bar.

---

## Petra conditions acknowledged (crew-checkin)

- No new app feature work until this packet exists ✓ (packet produced)
- No auth provider setup ✓ (not performed in this task)
- No Stripe live products ✓ (not created in this task)
- No provider calls from Maker ✓
- Gate 05 / Ghost Forge: **PAUSE**
- UI commit: **HOLD**
- Human gate **closed:** Ben **APPROVE** (2026-06-03) — next **`[IN PROGRESS: SUPABASE_AUTH_STRIPE_TEST_WIRING]`**

---

## References

- `company/PRICING.md`
- `foreman/SITE_MAP.md`
- `foreman/APP_INFRA_UX_START_PACKET.md`
- Route sources under `app/`
- `lib/app-infra-preview.ts` — preview gate (`APP_INFRA_PREVIEW = true`)

---

## 13. Post-patch update (2026-06-02)

**Maker pass:** APP_INFRA preview-mode patch — commit `02bf718` on `rescue/sally-dirty-worktree-2026-06-01`.

### Preview gate

| Control | Location | Behavior |
|---------|----------|----------|
| `APP_INFRA_PREVIEW` | `lib/app-infra-preview.ts` | `true` — Ben **APPROVED** gate; flip to `false` when starting test wiring / go-live prep |

### Route status when preview is **on**

| Route | Status | Mechanism |
|-------|--------|-----------|
| `/login` | **Preview-safe** | Disabled form; submit no-op; banner |
| `/signup` | **Preview-safe** | Disabled form; submit no-op; banner |
| `/membership` | **Preview-safe** | Checkout disabled; `?plan=` highlight honored |
| `/dashboard/billing` | **Preview-safe** | Mock profile shell; Supabase load skipped; portal disabled |
| `/dashboard/crucible` | **Preview/mock-safe** | Sandbox actions disabled; API POSTs blocked client-side |
| API POST guards | **Guarded** | `/api/billing/portal`, `/api/membership/checkout`, `/api/verification/identity`, `/api/verification/funds` return **403** before auth/Stripe/DB |

### PATCH items from §10 — resolution

| Item | Before | After (preview on) |
|------|--------|---------------------|
| Login live auth | Fail | **Fixed** |
| Signup live auth | Fail (not in original list) | **Fixed** |
| Membership checkout | Fail | **Fixed** |
| Billing profile reads | Fail | **Fixed** (mock shell) |
| Crucible DB writes | Fail | **Fixed** (403 + UI block) |
| Hero secondary CTA | “Inspect the deck” → `#how` mismatch | **Fixed** — label `See how it works` matches `#how` in `hero-static.tsx` (copy-only; `app/page.tsx` not edited) |
| Membership `?plan=` | Ignored | **Fixed** |

### Remaining optional / out of scope

- `/pricing` not in header nav (optional; unchanged)
- `/auth/callback` — not gated (OAuth/email confirm path; low traffic during preview walk)
- Flip `APP_INFRA_PREVIEW` to `false` re-enables live wiring — intentional post-approval escape hatch
- **UI_COMMIT: OPEN** (2026-06-03) — push/deploy still separate human gates

### Ben verdict (2026-06-03)

**APPROVE** — `APP_INFRA_01_FUNCTIONAL_SURFACE_REVIEW: APPROVE` recorded in `foreman/gates/APPROVAL_LOG.md`.

**Next operator slice:** `foreman/gates/OAUTH_STRIPE_OPERATOR_CHECKLIST.md` — Supabase Auth + Stripe test mode.
