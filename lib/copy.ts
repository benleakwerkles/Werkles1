export const copy = {
  brand: "Werkles",
  tagline: "Private partner discovery",
  disclaimer:
    "Werkles is a partner discovery and verification platform. We do not facilitate any securities transaction, loan, investment, or sale of business. Werkles never holds or transmits funds.",
  hero: {
    eyebrow: "Mythic capitalism for people with invoices due",
    headline: "Find the missing piece before the machine eats you.",
    subhead:
      "Private partner discovery for builders, operators, backers, connectors, and sparks putting real businesses together.",
    brandPromise: "Create with trust. Build to thrive.",
    primaryCta: "Enter the Foundry",
    secondaryCta: "See the match deck",
    trustLine: "Verified profiles. Private introductions. No public shouting into the void."
  },
  lanes: {
    builder: {
      title: "Builder",
      headline: "Sweat, trust, field sense.",
      description:
        "You bring labor, craft, floor experience, crew respect, customer memory, or hard-earned repetition."
    },
    operator: {
      title: "Operator",
      headline: "The work has to run.",
      description:
        "You bring licenses, estimating, scheduling, equipment, delivery, and the judgment to keep promises."
    },
    backer: {
      title: "Backer",
      headline: "Money without a throne.",
      description:
        "You bring capital, credit, assets, or runway, and you want to stand beside real builders."
    },
    connector: {
      title: "Connector",
      headline: "The room needs a pulse.",
      description:
        "You bring sales, admin, books, hiring, relationships, customers, venues, or the ability to make people move."
    },
    spark: {
      title: "Spark",
      headline: "An opening worth proving.",
      description:
        "You bring an idea, lead, property, customer, or strange little chance that needs people and pressure."
    }
  },
  howItWorks: {
    eyebrow: "How Werkles works",
    headline: "Open the dossier. Test the fit. Lock the joint.",
    steps: [
      {
        title: "Open the dossier.",
        body: "Build a serious profile around lane, skills, industry, geography, goals, timeline, and proof status."
      },
      {
        title: "Test the fit.",
        body: "Werkles scores complementary people with explainable factors, not mystical algorithm fog."
      },
      {
        title: "Lock the joint.",
        body: "Request private introductions through a double-key co-sign flow. The paperwork and deals stay off-platform."
      }
    ]
  },
  trust: {
    eyebrow: "Proof matters. So does staying in our lane.",
    badge: "Built on Trust",
    headline: "Create with trust. Build to thrive.",
    body:
      "The platform is built for discovery, trust, and introductions. We store verification receipts, not raw identity files, bank account numbers, or full documents. Money movement, lending, securities, and deal facilitation are not v0 features."
  },
  beta: {
    eyebrow: "Private beta",
    headline: "Bring your piece.",
    body: "One city. Real people. Useful introductions. The first version is intentionally narrow, gated, and serious.",
    cta: "Request gated invite",
    idle: "Production activation will require license front/back, face capture, phone consent, and linked phone.",
    loading: "Checking the floorboards.",
    success: "The knock has been made. Now we see who opens the door."
  },
  onboarding: {
    headline: "The First Weld",
    subhead: "Three facts first. Then the machine can route you without asking for your life story at the gate.",
    lane: "Lane",
    arena: "Arena",
    turf: "Turf",
    doorsHeadline: "Choose your first door.",
    doors: {
      quickWeld: {
        title: "The Quick Weld",
        body: "Five rapid questions. Enough heat to make your dossier useful without turning this into a tax deposition.",
        cta: "Run the Quick Weld"
      },
      fullAudit: {
        title: "The Full Audit",
        body: "Licenses, equipment, work history, capital readiness, and proof posture. Heavier file. Stronger signal.",
        cta: "Start the Full Audit"
      },
      blueprint: {
        title: "The Blueprint",
        body: "Tell the machine what you are building in plain language. The poetry can have calluses.",
        cta: "Open the Blueprint"
      }
    },
    saved: "First weld set. The floor knows where to send you.",
    zipFailed: "That turf did not resolve cleanly. Check the ZIP and try again."
  },
  membership: {
    eyebrow: "Foundry Dues",
    headline: "Membership unlocks the doors worth knocking on.",
    subhead:
      "Build the dossier for free. Browse the floor. When you are ready to request intros, trigger verification, and carry more weight, pay dues.",
    monthly: "Monthly",
    annual: "Lock the Joints",
    checkout: "Step into the foundry",
    processing: "Processing your membership. Stripe is stamping the brass plate.",
    cancelled: "Checkout closed. The foundry door is still warm.",
    trust:
      "Membership unlocks access to our verification providers. It does not unlock verification itself - that depends on the credentials you actually have. Werkles cannot make anyone trustworthy. We just make claims harder to fake."
  },
  access: {
    insufficientWeightTitle: "Insufficient Weight",
    insufficientWeight:
      "The other side is carrying a Heavyweight Dossier with live verification. Return to the foundry, complete the Full Audit, and secure your membership before knocking on this door.",
    membershipRequired:
      "Foundry Dues unlocks intro requests. Build the dossier for free, then secure your membership before knocking."
  },
  verification: {
    requiresMembership:
      "Verification requires active membership. Step into the foundry and lock your joints first.",
    sandboxPrepared: "Sandbox Verified",
    prepared: "Verification Prepared",
    pending: "Inspecting the steel.",
    failed: "Something didn't hold. Fix the claim or pull it out."
  },
  deepAudit: {
    title: "Deep Audit",
    body:
      "For heavier claims, the API check is only the first clang. Manual lien, license, and background review will live here once the legal lane is cleared.",
    cta: "Demand a Deep Audit ($150)",
    placeholder: "Not live yet. This will become a one-time Stripe checkout and private admin queue."
  },
  actions: {
    pending: "Checking the Blueprint",
    accept: "Lock the Joints",
    decline: "No fit. Keep building."
  },
  microcopy: {
    loadingMatches: "Checking the floorboards.",
    noMatches: "Nothing in the deck worth wasting your time on. Broaden the search or sharpen the ask.",
    profileIncomplete: "The machine is coughing. Feed it better information.",
    introSent: "The knock has been made. Now we see who opens the door.",
    introDeclined: "They passed. Their loss, possibly. Keep moving.",
    verificationPending: "Inspecting the steel.",
    verificationFailed: "Something didn't hold. Fix the claim or pull it out.",
    workspaceCreated: "The joint is locked. Try not to blow up the factory."
  },
  auth: {
    signupTitle: "Create your Werkles account",
    loginTitle: "Back to the floor",
    phoneConsent: "I consent to phone verification for account security."
  },
  laneOptions: ["Builder", "Operator", "Backer", "Connector", "Spark"] as const,
  workPreferences: ["Local Only", "Remote Only", "Open to Travel", "Willing to Relocate"] as const,
  visibilityModes: ["full_name", "first_name_only", "alias"] as const,
  introStatuses: ["Pending Co-Sign", "Auto-Approved", "Co-Signed", "Declined", "Expired", "Locked"] as const
};

export type UserLane = (typeof copy.laneOptions)[number];
export type WorkPreference = (typeof copy.workPreferences)[number];
