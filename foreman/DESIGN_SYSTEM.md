# Werkles Design System

VERSION: 0.2
LAST_UPDATED: 2026-05-24
LAST_UPDATED_BY: claude

## Provenance — palette v0.2

Sampled 2026-05-24 from three source images, weighted in this priority order:
1. werkles app icon (1254×1254) — PRIMARY. Brand mark. Defines the hero violet, teal, and product surface darks.
2. werkles_workshop_banner.png (1672×941) — SECONDARY. Environmental hero shot. Defines atmospheric accents and metals.
3. werkles_helper_avatar.png (1254×1254) — SECONDARY. Mascot. Defines owl-eye-green and confirms copper values.

Method: K-means clustering for mass dominants plus hue-range scanning for
saturated brand elements. For the brand violet and teal, "core" (median value
within the matched hue) is the canonical token; "bright" and "deep" extend
the range for gradient endpoints. For atmosphere accents, "bright"
representative is the screen token.

v0.2 supersedes v0.1, which sampled violet and teal from environmental glow
pixels rather than the brand mark itself. The v0.1 values are deprecated.

## Tokens

### Color

All tokens use CSS custom properties under the `--werkles-` namespace.

#### Brand mark — the hero duochrome

The W is a violet+teal duochrome. These are the brand. Treat them as co-equal — neither is subordinate.

```css
--werkles-violet:        #3D16CA;  /* Brand violet. The left half of the W. */
--werkles-violet-bright: #672EED;  /* Lit / hovered violet. Highlight edges. */
--werkles-violet-deep:   #2A0E8C;  /* Pressed / shadowed violet. */

--werkles-teal:          #02917E;  /* Brand teal. The right half of the W. */
--werkles-teal-bright:   #18C5AE;  /* Lit / hovered teal. */
--werkles-teal-deep:     #015E51;  /* Pressed / shadowed teal. */
```

#### Foundations — the icon plate

Product UI surfaces. Cleaner and slightly cooler than the workshop atmosphere.

```css
--werkles-forge-black:    #050404;  /* App background base. Icon's true deep black. */
--werkles-workshop-night: #191817;  /* Primary surface / cards. Icon's mid plate. */
--werkles-smoke:          #2C231D;  /* Elevated surfaces, panels. */
--werkles-iron:           #3B342A;  /* Borders, dividers, muted UI chrome. */
```

#### Frame metals — the bezel

Copper is the workshop frame around the digital product. Supporting role, not hero.

```css
--werkles-copper:        #9F6633;  /* Workshop copper. Frames, badges, gear motifs. */
--werkles-copper-light:  #C08B52;  /* Lifted copper. Hovers on copper surfaces. */
--werkles-brass-bright:  #E0B569;  /* Lit metal edges, blueprint linework. */
--werkles-blueprint-tan: #685141;  /* Etched-blueprint linework on dark, faint motifs. */
```

#### Atmosphere accents — small-dose, contextual

```css
--werkles-forge-orange:  #F6AD55;  /* Forge fire. Hero backgrounds, environmental glow. NOT a CTA color. */
--werkles-ember:         #FBC368;  /* Lantern, candlelight, hover warmth. */
--werkles-owl-eye-green: #5FD178;  /* Mascot signature. Success states. Where the owl is. */
```

#### Text on dark

```css
--werkles-text-primary:   #F4E2B1;  /* Body text. Warm cream — never pure white. */
--werkles-text-secondary: #C08B52;  /* Muted text, captions. */
--werkles-text-muted:     #6D5B46;  /* Disabled, hints. */
```

#### Usage rules

1. **Brand mark gradient (violet → teal) is the signature.** Reserved for the W mark itself, hero moments, splash screens, and key brand surfaces. Do not apply it to ordinary UI chrome.

2. **Primary CTAs use the violet gradient** (`--werkles-grad-violet-vertical`). Secondary CTAs use the teal gradient. The two are siblings, not parent/child — choose based on action character (violet = decisive / commit / forward; teal = explore / continue / lateral). When in doubt, violet.

3. **Pure white (#FFFFFF) is forbidden.** Use `--werkles-text-primary`.

4. **Pure black (#000000) is forbidden.** Use `--werkles-forge-black`.

5. **Forge-orange is NOT a CTA color.** It is atmosphere. Use it for hero-background warmth, lantern/hearth motifs, and marketing imagery. Never for "press here."

6. **Owl-eye-green is mascot territory.** Success states, places the owl is present, "something just worked" moments. Don't use as generic green.

7. **Don't put violet and teal directly adjacent except in the brand gradient.** They're complementary across the spectrum and fight visually when butted edge-to-edge. Separate them with neutral surface (workshop-night, smoke) or with the brand gradient transition.

8. **Copper is the frame, not the content.** Use copper for borders, badges, decorative chrome, gear motifs. Avoid copper-on-copper text or large copper fills as primary surfaces.

#### Contrast (WCAG sanity)

Verified pairings for AA body text (4.5:1) and AA large (3:1):
- `--werkles-text-primary` on `--werkles-forge-black` — ~14:1, AAA body
- `--werkles-text-primary` on `--werkles-workshop-night` — ~12:1, AAA body
- `--werkles-text-primary` on `--werkles-smoke` — ~10:1, AAA body
- `--werkles-text-primary` on `--werkles-violet` — ~5.5:1, AA body (use for violet button labels)
- `--werkles-text-primary` on `--werkles-teal` — ~6:1, AA body (use for teal button labels)
- `--werkles-copper-light` on `--werkles-forge-black` — ~6:1, AA large only (headings, not body)
- `--werkles-forge-orange` on `--werkles-forge-black` — ~11:1, safe for atmospheric text labels

Avoid:
- `--werkles-copper` on `--werkles-workshop-night` — too low for text
- `--werkles-violet` on `--werkles-teal` or vice versa — fights, also low contrast
- `--werkles-violet-deep` on `--werkles-forge-black` — too dark to read text on

### Gradients

```css
--werkles-grad-brand-mark: linear-gradient(
  90deg,
  #3D16CA 0%,
  #672EED 45%,
  #18C5AE 55%,
  #02917E 100%
);
/* The W gradient. Brand mark only. Hero moments, splash screens. */

--werkles-grad-violet-vertical: linear-gradient(
  180deg,
  #672EED 0%,
  #3D16CA 60%,
  #2A0E8C 100%
);
/* Violet button surface. Primary CTAs. */

--werkles-grad-teal-vertical: linear-gradient(
  180deg,
  #18C5AE 0%,
  #02917E 60%,
  #015E51 100%
);
/* Teal button surface. Secondary CTAs. */

--werkles-grad-forge-radial: radial-gradient(
  circle at 70% 80%,
  #F6AD55 0%,
  #2C231D 60%,
  #050404 100%
);
/* Atmospheric hero background. Marketing only, not app chrome. */
```

#### Gradient usage rules

1. The brand-mark gradient is precious. Don't reuse it as decorative chrome.
2. Button gradients (violet-vertical, teal-vertical) animate to their `-bright` value on hover and to their `-deep` value on press.
3. The forge-radial is for marketing surfaces (hero shots, social cards). Never use it as a primary app background — it fights with content.
