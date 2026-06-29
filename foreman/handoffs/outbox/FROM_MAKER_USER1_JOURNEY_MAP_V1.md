# FROM_MAKER_USER1_JOURNEY_MAP_V1

Date: 2026-06-12
Author: Maker (Cursor) · EXECUTION_CONTEXT: CURSOR_CLOUD_CONTAINER
Type: journey map / analysis only. No build, no code, no redesign, no marketing copy.

## Framing

Werkles is evolving from **Business Matchmaking** → **Human Opportunity Discovery**. This maps User #1 from homepage arrival to their **first actionable opportunity recommendation**, using existing repo concepts where they exist (lanes: Builder/Operator/Backer/Connector/Spark; onboarding "The First Weld" — lane/arena/turf; dossier; match deck; knock/intro; "proof signals, visible reasons, not magic") and the new discovery layers (Layer 0 → Need Translation → Bottleneck Discovery → Possible Outcomes).

Per-step fields: **User Goal · System Goal · Information Required · Risk of Drop-Off · Open Questions.**

---

## 1. Homepage arrival

- **User Goal:** Understand in seconds whether this is for them ("is there something here for me?").
- **System Goal:** Establish credibility + the discovery promise; earn the first click; avoid feeling like a guru funnel or a sterile job board.
- **Information Required:** What Werkles does (find people/opportunities to build with), who it's for (the five lanes / anyone with a starting point), the anti-guru trust posture.
- **Risk of Drop-Off:** Bounce if it reads as generic SaaS, MLM/guru, or "another matching app"; confusion if the promise is abstract ("opportunity discovery" without a concrete hook).
- **Open Questions:** Is the hook "find a partner" or the broader "find your next move"? Does User #1 self-identify with a lane, or arrive needing translation first?

## 2. First click

- **User Goal:** Take the lowest-commitment step toward "show me something relevant to me."
- **System Goal:** Capture intent with minimal friction; route into onboarding without demanding an account or payment first.
- **Information Required:** A single clear primary action and what happens after it (expectation setting).
- **Risk of Drop-Off:** Too many CTAs; the click demands signup/payment too early; unclear payoff.
- **Open Questions:** Should first click be "start" (onboarding) vs "browse" (see opportunities) vs "tell us your situation" (need-first)? Account before or after first value?

## 3. Onboarding ("The First Weld")

- **User Goal:** Tell the system enough about themselves to get relevance, without a heavy form.
- **System Goal:** Capture lane, arena, turf (and starting assets/constraints) to seed discovery; keep it short ("three sparks before the dossier gets heavier").
- **Information Required:** Lane (or "not sure yet"), arena/industry, turf/location, rough goal, what they bring.
- **Risk of Drop-Off:** Form fatigue; forced lane choice when the user doesn't know their lane; ZIP/location friction.
- **Open Questions:** Can a user proceed with "unsure" on lane? How much is required vs optional for a first recommendation? Quick-weld vs full-audit path for User #1?

## 4. Layer 0 (raw starting point)

- **User Goal:** Be understood at the most basic level — "here's where I actually am right now."
- **System Goal:** Capture the rawest truth (situation, resources, constraints, intent) *before* structuring it; the zero-th layer discovery builds on.
- **Information Required:** Plain-language self-description; what they have (time/money/skill/network/asset); what they want to move toward; hard constraints.
- **Risk of Drop-Off:** Feels like therapy or a long survey; user can't articulate their situation; fear of judgment.
- **Open Questions:** Is Layer 0 free-text, guided prompts, or structured? How do we capture "I don't know what I want" as a valid Layer 0 state?

## 5. Need Translation

- **User Goal:** Have their messy situation turned into "so what you actually need is X."
- **System Goal:** Convert Layer 0 into structured, actionable needs (need vectors) the matching/discovery engine can operate on; reflect it back for confirmation.
- **Information Required:** Mapping rules from raw inputs → need categories (partner, capital, customer, skill, license, intro, validation); a confirmation step.
- **Risk of Drop-Off:** Mistranslation ("that's not what I meant") erodes trust; over-automation feels like it's not listening.
- **Open Questions:** Is translation AI-assisted or rule-based for V1? How much does the user confirm/correct vs accept? How are mistranslations recovered?

## 6. Bottleneck Discovery

- **User Goal:** Find out what's *actually* stopping them ("what's the real blocker?").
- **System Goal:** Identify the single highest-leverage constraint — remove it and progress unlocks (capital? a co-founder? a first customer? a credential? clarity?).
- **Information Required:** Constraint taxonomy; signals distinguishing a real bottleneck from a stated one; prioritization logic.
- **Risk of Drop-Off:** Generic/obvious output ("you need money") with no insight; feels like a personality quiz; no proof behind the claim.
- **Open Questions:** How is the *primary* bottleneck chosen when several exist? Does the user rank/confirm? How to avoid demoralizing framing?

## 7. Possible Outcomes

- **User Goal:** See the realistic paths open to them ("what could actually happen from here?").
- **System Goal:** Surface a small, honest opportunity space tied to their need + bottleneck (partner types, opportunity types, next moves) — options, not yet one answer.
- **Information Required:** Outcome/opportunity catalog; how inputs map to a shortlist; honesty about uncertainty (no guarantees).
- **Risk of Drop-Off:** Too many options (paralysis) or too few (feels empty); outcomes feel generic or unattainable.
- **Open Questions:** How many outcomes to show? Ranked or exploratory? How tightly coupled to the eventual single recommendation?

## 8. First Recommendation

- **User Goal:** Get one concrete, believable, actionable thing to pursue.
- **System Goal:** Deliver a single recommendation with **visible reasons** (proof signals, why-this-why-now), not magic — a person to meet, an opportunity to test, or a move to make.
- **Information Required:** Ranking + explanation; the proof/signal behind it; what the user can actually do next with it; what's still self-reported/unverified.
- **Risk of Drop-Off:** Recommendation feels random or unexplained; no clear action; trust gap ("why should I believe this?").
- **Open Questions:** Is rec #1 a *person* (matchmaking heritage) or an *opportunity/path* (discovery future) — or both? What's the minimum proof to justify it? What if there's no good match yet?

## 9. Next Action

- **User Goal:** Do the concrete next thing (request an intro / knock, strengthen dossier, verify a claim, explore an outcome).
- **System Goal:** Convert recommendation into a tracked action; set expectations for response; bring them back (return loop).
- **Information Required:** The action mechanics (knock/intro request, dossier step, verification), expected timing, status visibility (ties to SoleDash-style states).
- **Risk of Drop-Off:** Dead end after the rec; action requires payment/verification the user isn't ready for; no feedback after acting.
- **Open Questions:** Is the first Next Action gated by membership/verification, or free to build trust? How is "what happens after I act" shown? What's the comeback trigger?

---

## Cross-cutting risks

- **Identity ambiguity:** the product is mid-pivot (matchmaking ↔ opportunity discovery); User #1 may not know which they're using.
- **Translation trust:** Need Translation + Bottleneck Discovery are the make-or-break trust moments; a wrong read loses the user.
- **Time-to-value:** every layer (0 → translation → bottleneck → outcomes) adds friction before the payoff (first rec). Too many layers = drop-off.
- **Proof posture:** the brand promise ("visible reasons, not magic") must hold at step 8 or trust collapses.

---

## Required Final Question

**"What is the smallest version of this journey that could be tested with real users within 30 days?"**

**Smallest testable slice (concierge / Wizard-of-Oz, not a built engine):**

- **Collapse the layers into one short intake.** Steps 3–5 (Onboarding + Layer 0 + Need Translation) become a single guided form/conversation capturing: where you are, what you have, what you want, hard constraints — plain language allowed.
- **Manual translation + bottleneck + recommendation.** Skip building the engine. A human (Ben/operator) or a single assisted pass reads the intake and produces: one named bottleneck + one explained first recommendation (a person, opportunity, or move) **with visible reasons**. Wizard-of-Oz is acceptable for a 30-day test.
- **One concrete Next Action.** A single low-friction action (e.g., "request this intro" / "do this next step"), no payment or verification gate, with a simple status so the user knows what happens next.
- **Cut for the test:** the "Possible Outcomes" browsing layer, lane perfection, account/payment, and any automated matching — all deferred. The goal is to learn whether the **Layer 0 → translation → bottleneck → one believable recommendation** chain creates trust and action.
- **Success signal to measure:** does User #1 (a) complete intake, (b) say the bottleneck/recommendation "feels right," and (c) take the Next Action? That validates the core discovery promise before any engine is built.

In one line: **a single-intake, human-in-the-loop concierge test that takes a real person from "here's my situation" to "one believable, explained recommendation + one action" — everything else stubbed.**

---

## Hard stops honored

Analysis only. No build, no code, no redesign, no marketing copy.
