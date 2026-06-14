# Proposal Engine v1

Status: **V1 DRAFT** - master-plan-driven opportunity engine
Subject: How The MaSheen decides what belongs in Proposed Builds
Purpose: Convert the Master Plan into daily executable choices for Ben to select

Artifact validity:

- Cousin role: Dink
- Machine name: Doss
- Hostname: BLDER
- Repo path: `C:\Users\BenLeak\Desktop\github\Werkles`
- Branch: `snapshot/sally-good-werkles-2026-06-12`
- Commit: `43d5db4`
- Execution runtime: Codex Desktop

Prime rule:

```text
The MaSheen generates opportunities.
Ben selects opportunities.
No proposal executes itself.
```

---

## Core Principle

Proposal Engine converts the Master Plan into daily executable choices.

The engine does not ask:

```text
What could we build?
```

The engine asks:

```text
Given the current company objective, what should Ben be offered today?
```

If a proposed build cannot trace back to the Master Plan or a live urgent ask, it is backlog noise.

---

## Master Plan Authority

The Master Plan is the current company objective plus its active constraints.

Source order:

1. Explicit Master Plan artifact, if present.
2. `foreman/NEXT_ACTION.md`
3. `foreman/CURRENT_STATE.md`
4. `foreman/HUMAN_GATES.md`
5. `foreman/LANES.md`
6. `foreman/BUDGET.md`
7. `foreman/MONETIZATION_ROADMAP.md`
8. Company law files under `company/`
9. Current user-specified urgent ask

If these sources conflict, the engine uses the same precedence as Human Gates unless Ben gives a newer explicit objective.

No proposal may outrank the Master Plan unless Ben marks an urgent ask as overriding.

---

## Inputs

### 1. Master Plan / Current Company Objective

Purpose: Anchor every proposal to the present company direction.

Signals:

- effective gate
- active lane
- current next action
- current revenue objective
- current trust/safety constraint
- current forbidden actions
- objective explicitly supplied by Ben

Proposal rule:

```text
Generate proposals that convert the objective into selectable next moves.
```

### 2. Open Missions

Purpose: Find incomplete work already in motion.

Signals:

- current mission text
- unfinished artifact
- pending packet
- unprocessed receipt
- unresolved operator ask
- selected but incomplete work

Proposal rule:

```text
If a mission is open, propose the smallest executable next step that advances or closes it.
```

### 3. Human Gates

Purpose: Separate real Ben decisions from machine-preparable work.

Signals:

- true gate requiring Ben
- missing review packet
- missing durable approval log
- blocked spend, deploy, push, SQL, legal, compliance, credential, or public-exposure action
- non-gate mechanical prep still available

Proposal rule:

```text
If a gate blocks progress, propose prep work before proposing the gated act.
```

### 4. Mule Elimination Map

Purpose: Remove Ben from the routing layer.

Signals:

- high-frequency copy/paste work
- repeated routing work
- repeated context relay
- response capture burden
- cross-machine state relay
- approval classification burden

Proposal rule:

```text
If Ben is acting as the message bus, propose a machine-owned transport replacement.
```

### 5. Active Roadmap

Purpose: Surface work that advances approved or current strategic direction.

Signals:

- near-term revenue proof
- roadmap item with safe proof step
- roadmap item blocked by missing artifact
- roadmap item requiring counsel, accounting, or operator review
- roadmap item already constrained by company law

Proposal rule:

```text
If roadmap work has a safe reversible proof, propose the proof rather than the finished future system.
```

### 6. Blocked Work

Purpose: Turn stalled work into a selectable unblock.

Signals:

- missing source
- missing approval
- missing proof
- missing budget
- unsafe execution path
- stale branch/machine context
- repeated failed attempt

Proposal rule:

```text
If work is blocked, propose the smallest evidence, prep, or decision packet that changes the blocker's state.
```

### 7. Infrastructure Backlog

Purpose: Reduce operational drag and repeated failure modes.

Signals:

- command approval friction
- stale context risk
- missing state capsule
- missing validation
- machine mismatch
- courier/relay failure
- duplicate artifact risk

Proposal rule:

```text
If infrastructure friction repeats, propose a bounded hardening build.
```

### 8. Business Backlog

Purpose: Convert business ideas into proof-bearing next steps.

Signals:

- revenue-adjacent idea without proof
- customer/operator evidence gap
- packaging task
- sales or validation pressure
- compliance-sensitive business idea needing constraints

Proposal rule:

```text
If business backlog can be tested without forbidden posture, propose the smallest reversible proof.
```

### 9. Machine Health Issues

Purpose: Protect execution reliability across Betsy, Doss, and Sally.

Signals:

- missing required workstation utility
- command approval friction
- repo not accessible
- runtime mismatch
- branch ambiguity
- local tool failure
- stale machine topology

Proposal rule:

```text
If machine health threatens execution, propose the smallest read-only check or config repair path.
```

### 10. User-Specified Urgent Asks

Purpose: Respect Ben's live priority without losing safety.

Signals:

- Ben says urgent, now, today, stop, pause, unblock, or fix
- Ben corrects routing
- Ben changes the current objective
- Ben asks for a specific artifact

Proposal rule:

```text
If Ben gives an urgent ask, generate proposals around that ask first, but still apply Human Gates and safety filters.
```

---

## Proposal Object Schema

The engine emits an array of proposal objects.

No proposal may omit a required field.

Each proposal object must satisfy this schema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "proposal-object-v1",
  "title": "ProposalObjectV1",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "title",
    "description",
    "why_now",
    "source",
    "expected_impact",
    "risk",
    "urgency",
    "owner_cousin",
    "machine",
    "dependencies",
    "human_gate_required",
    "priority_score",
    "button_actions"
  ],
  "properties": {
    "title": {
      "type": "string",
      "minLength": 3
    },
    "description": {
      "type": "string",
      "minLength": 10
    },
    "why_now": {
      "type": "string",
      "minLength": 10
    },
    "source": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["type", "reference", "signal"],
        "properties": {
          "type": {
            "type": "string",
            "enum": [
              "MASTER_PLAN",
              "OPEN_MISSION",
              "HUMAN_GATE",
              "MULE_MAP",
              "ROADMAP",
              "BLOCKED_WORK",
              "INFRASTRUCTURE_BACKLOG",
              "BUSINESS_BACKLOG",
              "MACHINE_HEALTH",
              "URGENT_ASK"
            ]
          },
          "reference": {
            "type": "string",
            "minLength": 1
          },
          "signal": {
            "type": "string",
            "minLength": 3
          }
        }
      }
    },
    "expected_impact": {
      "type": "string",
      "minLength": 10
    },
    "risk": {
      "type": "string",
      "enum": ["LOW", "MEDIUM", "HIGH", "BLOCKED"]
    },
    "urgency": {
      "type": "string",
      "enum": ["LOW", "MEDIUM", "HIGH", "NOW"]
    },
    "owner_cousin": {
      "type": "string",
      "enum": ["Ben", "Dink", "Maker", "Skybro", "Bean", "Petra", "Unassigned"]
    },
    "machine": {
      "type": "string",
      "enum": ["Betsy", "Doss", "Sally", "Unknown"]
    },
    "dependencies": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "uniqueItems": true
    },
    "human_gate_required": {
      "type": "boolean"
    },
    "priority_score": {
      "type": "integer",
      "minimum": 0,
      "maximum": 100
    },
    "button_actions": {
      "type": "array",
      "minItems": 4,
      "maxItems": 4,
      "prefixItems": [
        { "const": "YEA" },
        { "const": "NAY" },
        { "const": "MORE INFO" },
        { "const": "DEFER" }
      ]
    }
  }
}
```

Field rules:

| Field | Meaning | Rule |
|-------|---------|------|
| `title` | Short proposal name | Must name the build or prep step, not the imagined final system. |
| `description` | What would be built or prepared | Must be concrete enough for the owner cousin to execute after selection. |
| `why_now` | Why the proposal is being shown today | Must cite live pressure from Master Plan, urgent ask, mule burden, gate, blocker, roadmap, business, infrastructure, or health issue. |
| `source` | Evidence trail | Must include at least one typed source with reference and signal. |
| `expected_impact` | What improves if selected | Must name the bottleneck removed, proof gained, risk reduced, or objective advanced. |
| `risk` | Execution risk class | Use `BLOCKED` if work cannot start without a true gate. |
| `urgency` | Time pressure | `NOW` only for current objective blockers, urgent asks, or high-risk safety/trust issues. |
| `owner_cousin` | Responsible cousin role | Must use cousin role, not runtime. |
| `machine` | Canonical machine | Must use Betsy, Doss, Sally, or Unknown. |
| `dependencies` | Required inputs before work starts | Empty array allowed only for independent, low-risk work. |
| `human_gate_required` | Whether Ben must approve before action | `true` for Human Gate actions; `false` for safe mechanical prep. |
| `priority_score` | 0-100 score | Computed by ranking logic below. |
| `button_actions` | Allowed Ben decisions | Always exactly `YEA`, `NAY`, `MORE INFO`, `DEFER`. These are decision states, not an interface build. |

---

## Button Action Semantics

The engine must treat button actions as decision outcomes only.

```text
YEA = Ben selects this proposal for execution or next packet generation.
NAY = Ben rejects this proposal; engine should not resurface unless source conditions materially change.
MORE INFO = Ben requests evidence, dependency detail, risk explanation, or alternate options.
DEFER = Ben keeps the proposal available but not active today.
```

No button action executes code by itself.

---

## Candidate Generation

The engine generates candidates in ten passes:

1. Master Plan pass: extract current company objective and active constraints.
2. Urgent ask pass: detect user-specified urgent asks that override normal queue order.
3. Mission pass: find open work with a clear next machine step.
4. Gate pass: find blocked work where mechanical prep can reduce Ben's burden.
5. Mule pass: find repeated message-bus actions with high frequency, time cost, or cognitive cost.
6. Roadmap pass: find roadmap items with safe proof steps.
7. Blocker pass: find stalled work with a missing artifact, proof, or decision packet.
8. Infrastructure pass: find repeated operational friction.
9. Business pass: find reversible proof steps tied to revenue, validation, or packaging.
10. Machine health pass: find execution problems that threaten the current objective.

Each candidate becomes a proposal only if it passes all filters:

- It traces to Master Plan or current urgent ask.
- It is machine-actionable or machine-preparable.
- It has a concrete next build/prep step.
- It does not require guessing Ben's intent.
- It does not bypass a human gate.
- It does not duplicate an already open proposal.
- It does not loosen safety doctrine.
- It does not promote draft work to approved work.
- It does not create a dependency larger than the problem it solves.
- It does not merely rename, polish, or speculate.

---

## Ranking Logic

Priority score is 0-100.

Ranking order:

1. Remove mule labor.
2. Unblock other work.
3. Protect revenue.
4. Protect trust/safety.
5. Advance current Master Plan.
6. Prevent future architecture corruption.

Do not over-prioritize:

- cosmetic polish
- naming
- new doctrine
- speculative features
- duplicate dashboards

### Score Formula

```text
priority_score =
  mule_labor_removed
  + unblock_value
  + revenue_protection
  + trust_safety_protection
  + master_plan_fit
  + architecture_corruption_prevention
  + urgency_bonus
  + dependency_readiness
  + reversibility
  - risk_penalty
  - deprioritization_penalty
```

### Scoring Components

Mule labor removed: 0-20

- 0: does not reduce Ben's transport work
- 5: removes one small manual relay
- 10: removes repeated copy/paste, routing, or status relay
- 15: removes high-cognitive dispatch work
- 20: removes a top Mule Elimination Map burden

Unblock value: 0-20

- 0: does not unblock anything
- 5: unblocks one artifact
- 10: unblocks one lane
- 15: unblocks multiple handoffs or machines
- 20: unblocks the current next action or several dependent workstreams

Revenue protection: 0-15

- 0: no revenue relevance
- 5: protects a future revenue option
- 10: protects near-term business proof or billing-safe work
- 15: prevents revenue loss, wasted spend, or unsafe monetization posture

Trust/safety protection: 0-15

- 0: no trust/safety relevance
- 5: reduces minor confusion or evidence risk
- 10: prevents unsafe routing, unclear authority, or gate confusion
- 15: prevents legal/compliance/financial/privacy/trust harm

Master Plan fit: 0-15

- 0: not tied to current objective
- 5: supports a known backlog item
- 10: supports active roadmap or open mission
- 15: directly advances current company objective

Architecture corruption prevention: 0-10

- 0: no architecture consequence
- 3: reduces local confusion
- 6: prevents duplicate artifacts or stale state
- 10: protects canonical machine, cousin, routing, source, or authority structure

Urgency bonus: 0-10

- 0: no time pressure
- 3: useful soon
- 6: tied to current active work
- 10: Ben explicitly marked urgent or the current next action is blocked

Dependency readiness: 0-10

- 0: missing core source
- 3: dependencies unclear
- 6: dependencies known but not ready
- 10: dependencies ready or machine-readable

Reversibility: 0-10

- 0: irreversible or destructive
- 3: hard to undo
- 6: reversible with cleanup
- 10: draft-only, local-only, read-only, or evidence-only

Risk penalty: 0-30

- 0: low risk
- 5: medium risk
- 15: high risk
- 30: blocked or requires major human gate before any work

Deprioritization penalty: 0-30

- 0: none
- 10: mostly polish, naming, or speculative
- 20: duplicate of existing artifact, route, or backlog item
- 30: duplicate dashboard, speculative feature, or new doctrine not demanded by Master Plan

Priority bands:

```text
80-100 = offer first today
60-79 = strong proposed build
40-59 = deferable backlog candidate
0-39 = do not emit unless Ben asks for low-priority backlog
```

Caps:

- If the proposal cannot trace to Master Plan or urgent ask, cap at 39.
- If owner cousin is ambiguous, cap at 59.
- If machine is unknown, cap at 59.
- If human gate is required before any work can begin, cap at 69.
- If proposal is mostly cosmetic polish, cap at 49.
- If proposal is naming-only, cap at 39 unless Ben specifically asked for naming.
- If proposal creates new doctrine, cap at 49 unless Ben specifically asked for doctrine.
- If proposal is speculative feature work, cap at 39 unless tied to current objective.
- If proposal creates a duplicate dashboard, set risk to `BLOCKED` and cap at 19.

---

## Human Gate Rule

`human_gate_required` is `true` when the proposal requires any of the following before action:

- login, OAuth, account creation, or credential handling
- billing, spend, credit card action, or budget expansion
- production deploy
- public launch or external send
- git push, merge, or branch promotion
- SQL, schema, RLS, policy, or production data mutation
- legal, compliance, tax, financial, medical, immigration, or counsel-sensitive approval
- destructive or irreversible action
- doctrine/protocol authority change
- promotion of draft/review work to approved or published status
- loosening safety, privacy, command, or automation restrictions

If a proposal has both mechanical prep and a human-gated final action, the proposal must describe only the mechanical prep unless Ben selects the gated action explicitly.

---

## Owner Cousin Rule

Owner cousin is assigned by work type:

| Work type | Default owner cousin |
|-----------|----------------------|
| Speaker doctrine / diagnostic flow / leverage inventory | Dink |
| Thesis / conceptual framework / naming when asked | Skybro |
| Architecture / schemas / infrastructure | Dink |
| Hostile audit / failure modes | Bean |
| Synthesis / red-team / GO-NO-GO | Petra |
| Operator judgment / selection / approval | Ben |
| Implementation work explicitly assigned to Maker | Maker |

Ownership is attributed to cousin role, not runtime.

If ownership is ambiguous, set `owner_cousin` to `Unassigned`, add routing clarification to dependencies, and cap score at 59.

---

## Machine Rule

Machine is selected by canonical role:

| Machine | Proposal fit |
|---------|--------------|
| Betsy | primary forge work |
| Doss | mobile/mirror forge, doctrine, diagnostic artifacts |
| Sally | archive, snapshot, architecture, schemas, infrastructure |

If machine is unknown, set `machine` to `Unknown`, add local hands readback to dependencies, and cap score at 59.

---

## Deduplication Rule

The engine must merge proposals when they share the same:

- Master Plan objective
- bottleneck
- owner cousin
- machine
- source input
- expected impact

Keep the proposal that is:

1. more directly tied to Master Plan
2. more reversible
3. less gated
4. more concrete
5. better at removing mule labor

Discard proposals that are only restatements of the same desired outcome.

---

## Blocked Proposal Rule

A blocked proposal may still be emitted if it helps Ben choose what to unblock.

Blocked proposals must:

- set `risk` to `BLOCKED`
- set `human_gate_required` to `true`
- name the dependency that blocks work
- include `MORE INFO` and `DEFER` as available actions
- score below equivalent non-blocked prep work

The engine should prefer:

```text
prepare review packet
```

over:

```text
perform gated action
```

---

## Proposal Lifecycle

Proposal state is controlled by Ben's decision action.

```text
Generated -> YEA -> Selected for execution planning
Generated -> NAY -> Rejected unless source conditions materially change
Generated -> MORE INFO -> Evidence request or alternate proposal set
Generated -> DEFER -> Parked until objective, urgency, or dependencies change
```

Selection does not bypass Human Gates.

Selection authorizes only the next safe planning or execution step named in the proposal.

---

## Output Rule

The engine outputs only proposal objects.

The engine does not execute proposals.

The engine does not assume approval.

The engine does not auto-route selected work unless Ben selects it.

The engine does not treat high score as permission.

The engine does not create implementation files.

The engine does not touch application code.

---

## Example Proposal Objects

```json
[
  {
    "title": "Machine State Capsule",
    "description": "Create a reusable local readback packet that records machine name, hostname, repo path, branch, commit, dirty status, runtime, and terminal access.",
    "why_now": "Cross-machine state relay is a high-burden mule action and local artifacts require valid execution context.",
    "source": [
      {
        "type": "MULE_MAP",
        "reference": "foreman/MULE_ELIMINATION_MAP_v1.md",
        "signal": "Cross-machine state relay and local hands readback relay rank as repeated Ben transport burdens."
      },
      {
        "type": "MASTER_PLAN",
        "reference": "foreman/NEXT_ACTION.md",
        "signal": "Active work depends on accurate machine and branch context."
      }
    ],
    "expected_impact": "Reduces Ben's need to relay machine state between Betsy, Doss, and Sally.",
    "risk": "LOW",
    "urgency": "HIGH",
    "owner_cousin": "Dink",
    "machine": "Doss",
    "dependencies": ["foreman/MULE_ELIMINATION_MAP_v1.md", "foreman/AI_COUSINS_PROTOCOL.md"],
    "human_gate_required": false,
    "priority_score": 88,
    "button_actions": ["YEA", "NAY", "MORE INFO", "DEFER"]
  },
  {
    "title": "Gate Prep Packet For Blocked Work",
    "description": "Generate a concise decision packet for a blocked lane, listing exact blocker, mechanical prep completed, remaining human decision, and stop condition.",
    "why_now": "Blocked work should become a selectable Ben decision instead of scattered context.",
    "source": [
      {
        "type": "HUMAN_GATE",
        "reference": "foreman/HUMAN_GATES.md",
        "signal": "True gates require durable decision packets and approval logging."
      },
      {
        "type": "BLOCKED_WORK",
        "reference": "foreman/CURRENT_STATE.md",
        "signal": "Production rollout, Stripe live, live verification, and Ghost Forge spend remain gated or paused."
      }
    ],
    "expected_impact": "Turns blocked work into a clear select/defer decision without executing the gated action.",
    "risk": "MEDIUM",
    "urgency": "MEDIUM",
    "owner_cousin": "Petra",
    "machine": "Sally",
    "dependencies": ["foreman/HUMAN_GATES.md", "foreman/NEXT_ACTION.md"],
    "human_gate_required": true,
    "priority_score": 74,
    "button_actions": ["YEA", "NAY", "MORE INFO", "DEFER"]
  }
]
```

---

## Engine Summary

The MaSheen should propose work when one of these is true:

1. It converts the current Master Plan into a daily executable choice.
2. It removes mule labor.
3. It unblocks other work.
4. It protects revenue.
5. It protects trust or safety.
6. It advances the current Master Plan.
7. It prevents future architecture corruption.
8. It answers a user-specified urgent ask safely.

Ben selects from the generated opportunities. Selection is the boundary between proposal and action.
