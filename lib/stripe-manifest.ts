export const stripeManifest = {
  source: "company/PRICING.md",
  pricingVersion: "v0.1",
  operatorApproved: "2026-05-24",
  products: [
    {
      key: "foundry_dues_monthly",
      name: "Foundry Dues - Monthly",
      mode: "subscription",
      displayPrice: "$9.99/month",
      envVar: "STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID"
    },
    {
      key: "foundry_dues_annual",
      name: "Foundry Dues - Annual - The Long Run",
      mode: "subscription",
      displayPrice: "$99/year",
      envVar: "STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID"
    },
    {
      key: "drafting_table_standalone",
      name: "Drafting Table - Standalone Workspace",
      mode: "subscription",
      displayPrice: "$19/month",
      envVar: "STRIPE_DRAFTING_TABLE_STANDALONE_PRICE_ID"
    },
    {
      key: "identity_reverification",
      name: "Crucible - Identity Re-Verification",
      mode: "payment",
      displayPrice: "$2.99",
      envVar: "STRIPE_CRUCIBLE_IDENTITY_REVERIFY_PRICE_ID"
    },
    {
      key: "funds_verification",
      name: "Crucible - Funds Verification",
      mode: "payment",
      displayPrice: "$9.99",
      envVar: "STRIPE_CRUCIBLE_FUNDS_PRICE_ID"
    },
    {
      key: "funds_reverification",
      name: "Crucible - Funds Re-Verification",
      mode: "payment",
      displayPrice: "$2.99",
      envVar: "STRIPE_CRUCIBLE_FUNDS_REVERIFY_PRICE_ID"
    },
    {
      key: "license_check",
      name: "Crucible - License Check",
      mode: "payment",
      displayPrice: "$14.99",
      envVar: "STRIPE_CRUCIBLE_LICENSE_PRICE_ID"
    },
    {
      key: "reference_check",
      name: "Crucible - Reference Check",
      mode: "payment",
      displayPrice: "$14.99",
      envVar: "STRIPE_CRUCIBLE_REFERENCE_PRICE_ID"
    },
    {
      key: "background_basic",
      name: "Crucible - Background Basic",
      mode: "payment",
      displayPrice: "$34.99",
      envVar: "STRIPE_CRUCIBLE_BACKGROUND_BASIC_PRICE_ID"
    },
    {
      key: "background_essential",
      name: "Crucible - Background Essential",
      mode: "payment",
      displayPrice: "$59.99",
      envVar: "STRIPE_CRUCIBLE_BACKGROUND_ESSENTIAL_PRICE_ID"
    },
    {
      key: "background_complete",
      name: "Crucible - Background Complete",
      mode: "payment",
      displayPrice: "$94.99",
      envVar: "STRIPE_CRUCIBLE_BACKGROUND_COMPLETE_PRICE_ID"
    },
    {
      key: "continuous_monitoring",
      name: "Crucible - Continuous Monitoring",
      mode: "subscription",
      displayPrice: "$2.99/month",
      envVar: "STRIPE_CRUCIBLE_MONITORING_PRICE_ID"
    }
  ],
  metadata: {
    pricing_source: "company/PRICING.md",
    pricing_version: "v0.1",
    operator_approved: "2026-05-24"
  }
} as const;
