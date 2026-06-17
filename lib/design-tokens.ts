export const designTokens = {
  version: "0.6",
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
  icons: {
    root: "/assets/draft/icons",
    manifest: "lib/site-icons.ts"
  },
  draftAssets: {
    heroFoundry: "/assets/draft/ghost-forge/werkles-draft-hero-foundry-v0.1.png",
    heroFoundryV2: "/assets/draft/ghost-forge/werkles-draft-hero-foundry-v0.2.png",
    proofTrust: "/assets/draft/ghost-forge/werkles-draft-proof-trust-v0.1.png",
    proofTrustV2: "/assets/draft/ghost-forge/werkles-draft-proof-trust-v0.2.png",
    manifest: "foreman/ghost-forge/DRAFT_SITE_ASSET_BATCH_v0.2.md",
    status: "APPROVED_DIRECTION_v0.6"
  },
  rules: [
    "Pure white (#FFFFFF) is forbidden; use the warm-cream text token.",
    "Pure black (#000000) is forbidden; use the forge-black surface token.",
    "The W mark is brand-canonical and never recolored.",
    "Primary CTAs use the violet or teal gradient.",
    "Forge orange is atmosphere, not a CTA color.",
    "Copper is the frame, not the content.",
    "Ghost Forge draft assets are review-only until Ben approves final creative direction."
  ],
  den: {
    source: "foreman/design/WONKA_DEN_MOOD_REFERENCE.md",
    previewRoute: "/proof/den",
    facetClass: "workshop-facet--den",
    status: "DRAFT_REVIEW"
  }
} as const;

export type DesignTokens = typeof designTokens;
