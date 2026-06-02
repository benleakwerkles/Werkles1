# Control Panel token sync

Foreman Control Panel inline CSS is **not independent palette law**.

Values are read at runtime from:

| Source | Tokens used |
|--------|-------------|
| `lib/design-tokens.ts` | `copper`, `owlEyeGreen`, `forgeOrange`, `violetDeep`, `smoke`, `textMuted` |
| `app/globals.css` | `--werkles-workshop-paper`, `--werkles-workshop-paper-elevated`, `--werkles-ink-on-paper`, `--werkles-ink-muted-on-paper` |

Authoritative references:

- `foreman/DESIGN_SYSTEM.md`
- `company/WERKLES_UX_LAW.md`

When design tokens change, restart the control panel to pick up new values. Do not hardcode new hex values in the panel without syncing these sources.

Semantic states (not brand colors):

- **Success:** `owlEyeGreen`
- **Pending:** `forgeOrange`
- **Human gate / failure border:** `violetDeep`

Do not resurrect deprecated palette values.
