# TO_CLAUDE_UI_POLISH_v1

## Manifest

- Target AI: Claude / Ender
- Phase: App Infrastructure UX Review
- Task type: UI polish specification only
- Risk level: Medium visual/product risk, no implementation requested
- Generated: 2026-05-25
- Current gate: `[AWAITING HUMAN GATE: APP_INFRA_IMPLEMENTATION_REVIEW]`
- Codex instructions: Do not edit app code from this packet. Return a file-level implementation spec for Codex.

## Current Routes Built

These routes exist locally and returned 200 in the current review server smoke check:

- `/pricing`
- `/dashboard/crucible`
- `/dashboard/billing`
- `/membership`
- `/membership/success`
- `/proof`

## Current Design System Sources

Use these repo files as controlling context:

- `foreman/DESIGN_SYSTEM.md`
- `company/WERKLES_UX_LAW.md`
- `company/WERKLES_BRAND_VOICE.md`
- `lib/design-tokens.ts`

Do not invent a competing palette, typography system, or brand law. If a recommendation conflicts with these files, call out the conflict and propose a delta instead of silently overriding.

## Operator Visual Feedback

Ben's current read:

- Mostly awesome.
- A little clunky in places.
- Some surfaces feel cold / impersonal.
- Rare unreadable text/background combinations need a contrast pass.
- Integrate the Steampunk Owl smaller.
- Add icons/assets where they help comprehension and warmth.
- Use the Workshop wallpaper/background somewhere, but keep it controlled, dimmed, and subordinate to the UI.

## What Claude / Ender Should Produce

Return a single file named:

`FROM_CLAUDE_UI_POLISH_v1.md`

The response should be specific enough for Codex to implement without guessing, but should not include raw full-file rewrites unless necessary.

Please include:

1. **UI Warmth Pass**
   - Where the current shells feel cold or overly mechanical.
   - Specific recommendations for making the experience feel more human, tactile, and Werkles-native without drifting into generic SaaS.
   - Priority order: what matters most before the next visual review.

2. **Contrast / Accessibility Pass**
   - Any likely unreadable text/background pairings.
   - Specific contrast-safe replacements using existing design tokens.
   - Button, badge, card, table, and form readability guidance.

3. **Steampunk Owl Integration Spec**
   - Where the Owl belongs and where it does not.
   - Recommended size ranges and placements.
   - How to keep it as a small companion/signature element instead of a mascot takeover.
   - Whether it should appear on `/pricing`, `/dashboard/crucible`, `/dashboard/billing`, `/membership`, `/membership/success`, and/or `/proof`.

4. **Icon And Asset List**
   - Route-by-route list of icons/assets to add.
   - Prefer simple, comprehensible icons over decorative clutter.
   - Include asset intent, approximate placement, and whether the asset should be existing, generated later, or drawn in CSS/icon library.

5. **Workshop Wallpaper / Background Placement Rules**
   - Where the Workshop background should appear.
   - How dimmed it should be.
   - Overlay rules, text safety rules, blur/no-blur recommendation, and mobile treatment.
   - Surfaces where the wallpaper must not be used.

6. **Specific File-Level Implementation Recommendations**
   - List exact files Codex should modify.
   - For each file, describe the intended change.
   - Separate safe immediate edits from edits that require another human gate.

7. **What Codex Should Not Touch Yet**
   - Anything that should stay frozen until Ben approves.
   - Any assets that should not be regenerated.
   - Any routes/components that need strategy/legal/product review before visual polish.

## Boundaries

Claude should not recommend:

- Live Stripe product creation.
- Secret entry.
- Deployment.
- SQL changes.
- Ghost Forge or Bellows execution.
- New monetization mechanics.
- User-to-user payments, take-rate, success fee, escrow, lending, or premium trust badges.
- A new palette that overrides `foreman/DESIGN_SYSTEM.md`.
- Large asset generation batches.

## Desired Output Shape

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

