export const pricing = {
  version: "v0.1",
  source: "company/PRICING.md",
  foundryDues: {
    monthly: {
      key: "foundry_dues_monthly",
      name: "Foundry Dues - Monthly",
      displayPrice: "$9.99/month",
      amountCents: 999,
      interval: "month",
      flavorName: null,
      includes:
        "Full platform access, Drafting Table workspaces, intro requests, basic verification, Armory member discounts"
    },
    annual: {
      key: "foundry_dues_annual",
      name: "Foundry Dues - Annual",
      displayPrice: "$99/year",
      amountCents: 9900,
      interval: "year",
      flavorName: "The Long Run",
      includes:
        "Full platform access, roughly two months saved, and the same Foundry floor as everyone else"
    }
  },
  armory: [
    {
      tier: "Simple",
      price: "$9.99",
      memberPrice: "Free",
      examples: "Single SOP, checklist, form, or role matrix"
    },
    {
      tier: "Mid",
      price: "$19",
      memberPrice: "Free",
      examples: "Capital worksheet, first meeting checklist, vendor selection guide"
    },
    {
      tier: "Werkles signature tool",
      price: "$29",
      memberPrice: "$20.30",
      examples: "The Bare-Metal Estimator"
    },
    {
      tier: "Deep / Starter Kit",
      price: "$49",
      memberPrice: "$34.30",
      examples: "LLC skeleton, launch checklist, partnership term-sheet kit"
    },
    {
      tier: "Bundle",
      price: "$99",
      memberPrice: "Free",
      examples: "First 90 Days Kit"
    }
  ],
  crucible: [
    {
      key: "identity",
      title: "Identity",
      price: "$0",
      detail: "Bundled once per year with Foundry Dues",
      cta: "Inspect Identity"
    },
    {
      key: "identity_reverification",
      title: "Identity re-verification",
      price: "$2.99",
      detail: "After staleness or document expiration",
      cta: "Refresh Identity"
    },
    {
      key: "phone",
      title: "Phone",
      price: "$0",
      detail: "Bundled with membership",
      cta: "Check Phone"
    },
    {
      key: "funds",
      title: "Funds",
      price: "$9.99",
      detail: "Bank snapshot through the funds provider",
      cta: "Check Funds"
    },
    {
      key: "funds_reverification",
      title: "Funds re-verification",
      price: "$2.99",
      detail: "First yearly member refresh is free; later refreshes are cost recovery",
      cta: "Refresh Funds"
    },
    {
      key: "license",
      title: "License",
      price: "$14.99 per state",
      detail: "State-board lookup where available",
      cta: "Check License"
    },
    {
      key: "reference",
      title: "Reference",
      price: "$14.99",
      detail: "Provider-supported reference check",
      cta: "Prepare Reference Check"
    },
    {
      key: "employment",
      title: "Employment",
      price: "Passthrough + $5",
      detail: "Provider-supported work history check",
      cta: "Prepare Work Check"
    },
    {
      key: "background_basic",
      title: "Background - Basic",
      price: "$34.99",
      detail: "FCRA-sensitive; counsel-reviewed flow required before launch",
      cta: "Prepare Background Check"
    },
    {
      key: "background_essential",
      title: "Background - Essential",
      price: "$59.99",
      detail: "FCRA-sensitive; counsel-reviewed flow required before launch",
      cta: "Prepare Background Check"
    },
    {
      key: "background_complete",
      title: "Background - Complete",
      price: "$94.99",
      detail: "FCRA-sensitive; counsel-reviewed flow required before launch",
      cta: "Prepare Background Check"
    },
    {
      key: "continuous_monitoring",
      title: "Continuous monitoring",
      price: "$2.99/month",
      detail: "Per individual, provider-supported",
      cta: "Prepare Monitoring"
    }
  ],
  draftingTable: {
    member: "Bundled with Foundry Dues",
    standalone: "$19/month per workspace",
    status: "Available but de-emphasized"
  },
  hardBans: [
    "No tiered membership",
    "No lane-priced membership",
    "No take-rate",
    "No success fee",
    "No escrow",
    "No pay-per-introduction on user-to-user deals",
    "No premium trust badges"
  ]
} as const;

export type CruciblePriceKey = (typeof pricing.crucible)[number]["key"];
