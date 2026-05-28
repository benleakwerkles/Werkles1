# Mascot Assets

This directory holds character mascot assets for Werkles. Source of truth: **`foreman/MASCOT_RULES.md`** (approved 2026-05-28).

## Characters

### Squibb — canonical product owl (files: `brass-foreman-*.png`)

The owl in a workshop suit, brass goggles, tool-belt, gesturing. He inspects. He does not vouch. One character for product UI and education voice.

Required asset files:

| Filename | Source dimensions | Intended display | Used on |
|---|---:|---:|---|
| `brass-foreman-full.png` | ~800x1000px, transparent bg | 200-280px | `/membership/success` |
| `brass-foreman-bust.png` | ~600x600px, transparent bg | 64-96px | `/dashboard/crucible` |
| `brass-foreman-thinking.png` | future | TBD | future packet |

## Asset rules

- All mascot assets must have transparent background (PNG with alpha channel).
- No floor shadow baked in; UI surfaces provide their own shadow.
- No environmental lighting bleed beyond the character's natural rim light.
- Source PNGs are committed at 2x display dimensions for retina sharpness.
- Do not modify these files outside of an approved Ender (Claude) packet.
- Do not use `coolowl.png` directly on UI surfaces; its workshop background is baked in.
- Do not create placeholder PNGs for Brass. Missing assets are the signal that integration is still blocked.

## Cutout workflow

Ben action required:

1. Open `coolowl.png` in remove.bg or equivalent cloud cutout tool.
2. Confirm head fluff looks clean with no halo and no missing tufts.
3. If clean, save as `brass-foreman-full.png` at roughly 800x1000px source resolution.
4. If rough, refine in an image editor before saving.
5. Create the bust crop from `brass-foreman-full.png`: head, shoulders, chest tool-belt, and gesturing wing.
6. Save bust crop as `brass-foreman-bust.png` at roughly 600x600px.
7. Drop both files into `public/assets/mascot/`.
8. Tell Codex: `ASSETS_LANDED`.

Sally should not be used for local image generation, local upscaling, local batch processing, or heavy image workflows. Browser/cloud cutout tools are allowed.

## Old owl

The original perched-on-plaque owl/helper avatar is a brand-mark asset, not the product character. It is referenced in design-system provenance as `werkles_helper_avatar.png`, but no public brand-asset copy is currently staged in this repo.

If it is later added to the app, the recommended home is:

`public/assets/brand/werkles-helper-avatar.png`

Do not move, retire, or replace the old owl from this mascot staging packet.

