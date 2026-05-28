# READY FOR OPERATOR TO SEND

# Comptroller Gate Packet

## Manifest
- target AI: Comptroller
- phase: DRY-RUN-0.1
- step: foreman-pipeline-copy
- task type: GO/NO-GO gate
- risk level: LOW
- readiness: READY FOR OPERATOR TO SEND
- approved scope:
  - /lib/copy.ts
- required files:
  - /docs/ai/00_SOURCE_OF_TRUTH.md
  - /docs/ai/01_WHO_RUNS_WHAT.md
  - /docs/ai/07_BUILD_ORDER.md
  - /docs/ai/03_COMPTROLLER_GATE.md
  - /handoffs/received/DRY-RUN-0.1-foreman-pipeline-copy-output.md
  - /handoffs/gates/DRY-RUN-0.1-foreman-pipeline-copy-bean-audit.md
  - /foreman/PHASE_STATUS.md
  - /foreman/FOREMAN_RULES.md
- source files consulted:
  - docs/ai/00_SOURCE_OF_TRUTH.md
  - docs/ai/01_WHO_RUNS_WHAT.md
  - docs/ai/07_BUILD_ORDER.md
  - docs/ai/03_COMPTROLLER_GATE.md
  - handoffs/received/DRY-RUN-0.1-foreman-pipeline-copy-output.md
  - handoffs/gates/DRY-RUN-0.1-foreman-pipeline-copy-bean-audit.md
  - foreman/PHASE_STATUS.md
  - foreman/FOREMAN_RULES.md
- latest previous Bean audit: handoffs/gates/DRY-RUN-0.1-foreman-pipeline-copy-bean-audit.md
- latest previous Comptroller gate: none
- relevant schema/spec files:
  - none
- generated_at: 2026-05-24T04:08:14.643Z
- phase_transitioned_at: 2026-05-24T00:05:37.433Z
- expected source file missing: no
- missing source files:
  - none

## Manifest JSON

```json
{
  "schemaVersion": "foreman-manifest/v1",
  "targetAI": "Comptroller",
  "phase": "DRY-RUN-0.1",
  "step": "foreman-pipeline-copy",
  "taskType": "GO/NO-GO gate",
  "riskLevel": "LOW",
  "readiness": "READY FOR OPERATOR TO SEND",
  "approvedScope": [
    "lib/copy.ts"
  ],
  "requiredFiles": [
    "docs/ai/00_SOURCE_OF_TRUTH.md",
    "docs/ai/01_WHO_RUNS_WHAT.md",
    "docs/ai/07_BUILD_ORDER.md",
    "docs/ai/03_COMPTROLLER_GATE.md",
    "handoffs/received/DRY-RUN-0.1-foreman-pipeline-copy-output.md",
    "handoffs/gates/DRY-RUN-0.1-foreman-pipeline-copy-bean-audit.md",
    "foreman/PHASE_STATUS.md",
    "foreman/FOREMAN_RULES.md"
  ],
  "sourceFilesConsulted": [
    "docs/ai/00_SOURCE_OF_TRUTH.md",
    "docs/ai/01_WHO_RUNS_WHAT.md",
    "docs/ai/07_BUILD_ORDER.md",
    "docs/ai/03_COMPTROLLER_GATE.md",
    "handoffs/received/DRY-RUN-0.1-foreman-pipeline-copy-output.md",
    "handoffs/gates/DRY-RUN-0.1-foreman-pipeline-copy-bean-audit.md",
    "foreman/PHASE_STATUS.md",
    "foreman/FOREMAN_RULES.md"
  ],
  "latestPreviousBeanAudit": "handoffs/gates/DRY-RUN-0.1-foreman-pipeline-copy-bean-audit.md",
  "latestPreviousComptrollerGate": null,
  "relevantSchemaFiles": [],
  "generated_at": "2026-05-24T04:08:14.643Z",
  "generatedTimestamp": "2026-05-24T04:08:14.643Z",
  "phase_transitioned_at": "2026-05-24T00:05:37.433Z",
  "expectedSourceFileMissing": false,
  "missingSourceFiles": [],
  "riskCheck": {
    "ok": true,
    "declaredRisk": "LOW",
    "requiredRisk": "LOW",
    "failures": []
  },
  "preflightFailures": []
}
```


## Comptroller Instructions

Review the builder output, Bean audit, current diff, and source files. Decide whether Codex may apply this output locally.

Return exactly one verdict line:

`VERDICT: GO`
or
`VERDICT: NO-GO`

Then list conditions or blockers.

## Builder Output

# Foreman Builder Output Receipt

Phase: DRY-RUN-0.1
Step: foreman-pipeline-copy
Saved Timestamp: 2026-05-24T04:04:07.487Z
Superseded: no

## Pasted Builder Output

Phase: DRY-RUN-0.1
Step: foreman-pipeline-copy
Superseded: no
Simulation: yes, explicitly permitted by Operator on 2026-05-24.

Implementation note:
Create centralized Werkles mock UI microcopy constants in /lib/copy.ts. Keep it front-end/mock-only, avoid backend claims, avoid guru jargon, avoid forbidden investment/deal/fundraise language, and preserve the dark copper/metallurgy direction.

Language-risk assumptions:
- "Backer" is allowed as the capital-lane label, but this mock copy avoids investor/investment/fundraise/deal language.
- "Proof signal" and "claim checked" are used instead of broad verified/trust guarantees.
- No Supabase, Stripe, auth, RLS, vendor, or production behavior is claimed.

Proposed file content for /lib/copy.ts:

```ts
export const copy = {
  brand: "Werkles",
  tagline: "Private partner discovery from The Forge",
  disclaimer:
    "Werkles helps people discover possible business partners. Werkles does not hold money, move money, arrange financing, or make off-platform paperwork for you.",
  hero: {
    eyebrow: "Dark copper matchmaking for people who actually build",
    headline: "Bring your piece to The Forge.",
    subhead:
      "A private floor for Builders, Operators, Backers, Connectors, and Sparks looking for serious fit, not guru fog.",
    brandPromise: "Create with trust. Build to thrive.",
    primaryCta: "Enter the Foundry",
    secondaryCta: "Inspect the deck",
    trustLine: "Proof signals. Private knocks. No public shouting into the void."
  },
  lanes: {
    builder: {
      title: "Builder",
      headline: "The hands that make the thing real.",
      description:
        "Craft, crew sense, repetition, customer memory, field judgment, and the kind of grit that does not fit in a slide deck."
    },
    operator: {
      title: "Operator",
      headline: "The Dynamo that keeps the floor moving.",
      description:
        "Schedules, licenses, estimates, equipment, delivery, and the calm brutality of making promises survive contact with Tuesday."
    },
    backer: {
      title: "Backer",
      headline: "Fuel without a throne.",
      description:
        "Runway, assets, credit, or practical support brought to the bench without pretending money is the whole machine."
    },
    connector: {
      title: "Connector",
      headline: "The room needs a pulse.",
      description:
        "Customers, books, hiring, vendors, venues, introductions, and the social voltage that gets a cold engine turning."
    },
    spark: {
      title: "Spark",
      headline: "The strange opening worth testing.",
      description:
        "A lead, property, customer, concept, route, or half-lit chance that needs steel around it before anyone calls it real."
    }
  },
  howItWorks: {
    eyebrow: "How Werkles works",
    headline: "Open the dossier. Test the fit. Lock the joints.",
    steps: [
      {
        title: "Open the dossier.",
        body: "Name your lane, arena, turf, skills, timeline, and proof posture. Keep it plain. The Forge hates perfume."
      },
      {
        title: "Test the fit.",
        body: "Werkles compares complementary lanes and shared intent with visible reasons, not magic smoke."
      },
      {
        title: "Knock on the door.",
        body: "When the fit looks worth a conversation, request an intro. The rest belongs to humans and their advisers."
      }
    ]
  },
  trust: {
    eyebrow: "Proof matters. Claims still need steel.",
    badge: "Built on Trust",
    headline: "Inspect the signal, not the fairy tale.",
    body:
      "Werkles can show proof signals and claim receipts. Some signals are stronger than others. Nothing here makes anyone trustworthy by magic. It just makes the fog harder to sell."
  },
  beta: {
    eyebrow: "Private beta",
    headline: "The Forge opens narrow first.",
    body:
      "One careful floor, useful dossiers, and fewer tourists. The machine starts small so the steel can be checked.",
    cta: "Request a gate knock",
    idle: "Mock-only copy. No production signup behavior is claimed here.",
    loading: "Checking the floorboards.",
    success: "The knock has been made. Now we see who opens the door."
  },
  onboarding: {
    headline: "The First Weld",
    subhead: "Lane, arena, turf. Three sparks before the dossier gets heavier.",
    lane: "Lane",
    arena: "Arena",
    turf: "Turf",
    doorsHeadline: "Choose your first door.",
    doors: {
      quickWeld: {
        title: "The Quick Weld",
        body: "A fast pass through skills, timeline, and goal. Enough heat to start shaping the metal.",
        cta: "Run the Quick Weld"
      },
      fullAudit: {
        title: "The Full Audit",
        body: "A heavier inventory of claims, receipts, history, readiness, and proof posture.",
        cta: "Start the Full Audit"
      },
      blueprint: {
        title: "The Blueprint",
        body: "Tell The Forge what you are building in plain language. Poetry may have calluses.",
        cta: "Open the Blueprint"
      }
    },
    saved: "First weld set. The floor knows where to send you.",
    zipFailed: "That turf did not resolve cleanly. Check the ZIP and try again."
  },
  membership: {
    eyebrow: "Foundry Dues",
    headline: "Keep the tourists outside the hot room.",
    subhead:
      "Membership is platform access, not a promise that anyone is safe, rich, ready, or right for you.",
    monthly: "Monthly",
    annual: "Lock the Joints",
    checkout: "Step into the Foundry",
    processing: "Processing the brass plate.",
    cancelled: "The door is still warm.",
    trust:
      "Membership can open provider checks later. It does not create proof by itself. Werkles cannot make anyone trustworthy; it can only make claims harder to fake."
  },
  access: {
    insufficientWeightTitle: "Insufficient Weight",
    insufficientWeight:
      "The other side is carrying heavier proof signals. Return to The Forge, strengthen the dossier, and knock when the steel can hold.",
    membershipRequired:
      "Foundry Dues opens intro requests. Build the dossier first, then knock with weight."
  },
  verification: {
    requiresMembership:
      "Claim checks require the right access. Step into The Forge before asking the inspectors to swing the hammer.",
    sandboxPrepared: "Proof Signal Prepared",
    prepared: "Claim Check Prepared",
    pending: "Inspecting the steel.",
    failed: "Something did not hold. Fix the claim or pull it out."
  },
  deepAudit: {
    title: "Deep Audit",
    body:
      "A future heavy check for claims that need more than a quick clang. Not live in this mock.",
    cta: "Demand a Deep Audit",
    placeholder: "Mock-only placeholder. No checkout, queue, or provider workflow is claimed."
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
    verificationFailed: "Something did not hold. Fix the claim or pull it out.",
    workspaceCreated: "The joint is locked. Try not to blow up The Forge."
  },
  auth: {
    signupTitle: "Create your Werkles dossier",
    loginTitle: "Back to the floor",
    phoneConsent: "I consent to phone checks for account security when that feature is live."
  },
  laneOptions: ["Builder", "Operator", "Backer", "Connector", "Spark"] as const,
  workPreferences: ["Local Only", "Remote Only", "Open to Travel", "Willing to Relocate"] as const,
  visibilityModes: ["full_name", "first_name_only", "alias"] as const,
  introStatuses: ["Pending Co-Sign", "Auto-Approved", "Co-Signed", "Declined", "Expired", "Locked"] as const
};

export type UserLane = (typeof copy.laneOptions)[number];
export type WorkPreference = (typeof copy.workPreferences)[number];
```


## Bean Audit

# Foreman Bean Audit Receipt

Phase: DRY-RUN-0.1
Step: foreman-pipeline-copy
Saved Timestamp: 2026-05-24T04:07:32.285Z

VERDICT: GO

Simulation: yes, explicitly permitted by Operator on 2026-05-24.

Findings:
- No forbidden investment/deal/fundraise language found in the proposed mock copy.
- No misleading claim that Werkles verifies every person or guarantees trust.
- No backend, Supabase, Stripe, auth, RLS, real user data, or production behavior is claimed.
- The output stays within approved scope: /lib/copy.ts.
- Dark copper/metallurgy voice and Werkles-native terms are present.

Residual risk:
- Existing /lib/copy.ts is used by the app, so applying this dry-run copy may change visible UI copy, but it remains within the explicitly approved dry-run artifact and does not alter backend behavior.


## Current Diff

```diff
No current diff.
```
