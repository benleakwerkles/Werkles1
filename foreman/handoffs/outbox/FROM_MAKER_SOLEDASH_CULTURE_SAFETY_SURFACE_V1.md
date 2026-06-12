# FROM_MAKER_SOLEDASH_CULTURE_SAFETY_SURFACE_V1

Date: 2026-06-12
Author: Maker (Cursor) · EXECUTION_CONTEXT: CURSOR_CLOUD_CONTAINER
Type: design only. No build, no code, no automation.

## Source note (honesty first)

There is **no "culture-not-cult findings" document in the repo** (searched: no `culture`, `cult`, `dissent`, or `status theater` files). Those findings live outside the cockpit (memory/another cousin). Rather than invent them, this design is built from the repo doctrine that already encodes anti-cult posture — **human gates, execution-context provenance, anti-guru / no-vouching, "Operator not a mule," chat-memory-is-not-scope** — mapped to the five indicators requested. If a real findings doc exists, point me at it and I'll reconcile.

## Question

Where should SoleDash show culture-safety warnings, and what lightweight UI indicators support: dissent channel, source path visible, human gate owner, exit/no-pressure note, doctrine conflict flag?

## Principle

Cults hide sources, centralize unquestioned authority, punish dissent, trap members, and suppress contradiction. The healthy inverse — **show your source, name who owns the call, make disagreement easy, make leaving free, surface contradictions** — is exactly the five indicators. SoleDash should make these **ambient and quiet**, not naggy: present where decisions/claims appear, never blocking, never theatrical.

---

## The five indicators

### 1. Dissent channel
- **What it is:** an always-available, penalty-free way to disagree, flag, or push back on any item (packet, recommendation, gate, state).
- **Where in SoleDash:** a small persistent **"Disagree / Flag"** affordance on every card and on the recommendation card; plus a standing line in the onboarding/Start-Here panel: "Disagreement is expected here. Flagging costs you nothing."
- **Trigger:** always present (not conditional).
- **Visual:** subtle outline chip, neutral color — not alarming; clicking opens a note field that writes to a `dissent`/flags log (a file or sheet), no automation.
- **Cult-risk mitigated:** suppression of disagreement.

### 2. Source path visible
- **What it is:** every claim/state shows where it came from (which cockpit file / packet path / who set it).
- **Where in SoleDash:** a `source:` provenance line on each card (SoleDash already carries `sourcePath`); states show "set by sidecar/operator," not anonymous.
- **Trigger:** always; if a source is missing, show **"source: unverified"** rather than implying authority.
- **Visual:** small monospace `source:` tag under the item title; "unverified" rendered in a muted warning tone.
- **Cult-risk mitigated:** hidden/unaccountable claims; manufactured authority.

### 3. Human gate owner
- **What it is:** explicit ownership of any gated decision — *who* must approve (Ben), so no agent implies it can decide.
- **Where in SoleDash:** a **"Gate owner: Ben"** badge on anything gated (push/merge/deploy/SQL/secrets/spend/brand lock), reusing the Human Gates Console SAFE/HUMAN GATE/BLOCKED chips.
- **Trigger:** on any item classed HUMAN_GATE or BLOCKED.
- **Visual:** amber HUMAN GATE chip + "owner: Ben"; agents/cousins shown as proposers, never approvers.
- **Cult-risk mitigated:** diffuse/charismatic authority; agents speaking as if they hold the decision.

### 4. Exit / no-pressure note
- **What it is:** a visible reminder that any user/cousin can stop, decline, or leave with no penalty or pressure.
- **Where in SoleDash:** a quiet inline note on action prompts and on the recommendation card footer: "You can decline, pause, or walk away. Nothing here pressures you, and no status is lost for saying no."
- **Trigger:** present wherever an action/next-step is offered.
- **Visual:** small muted footer text; never a countdown, urgency badge, or "act now."
- **Cult-risk mitigated:** entrapment, false urgency, sunk-cost pressure.

### 5. Doctrine conflict flag
- **What it is:** a warning when an item conflicts with cockpit doctrine, or when two sources disagree.
- **Where in SoleDash:** a **conflict badge** on the affected item + a one-line "what conflicts" + a pointer to the precedence order (HUMAN_GATES → LANES → BUDGET → NEXT_ACTION → AI_COUSINS_PROTOCOL → shims).
- **Trigger:** when a state/claim contradicts a cockpit file, or chat-memory is being used as scope (it isn't scope).
- **Visual:** red/amber "Doctrine conflict" chip; expands to show the conflicting sources and which wins by precedence.
- **Cult-risk mitigated:** unchallengeable doctrine; silent contradictions; memory overriding canon.

---

## Placement summary

| Indicator | Lives on | Always-on? |
|-----------|----------|-----------|
| Dissent channel | every card + Start-Here panel | yes |
| Source path | every card/state | yes |
| Gate owner | gated items only | conditional |
| Exit/no-pressure | action/recommendation prompts | where actions appear |
| Doctrine conflict | items that contradict canon | conditional (only when detected) |

Design tone: **ambient, quiet, non-blocking.** These are safety rails, not alarms. They should make the healthy behavior obvious, not lecture.

## What NOT to do (anti-patterns)

- No fake "we value your feedback" theater — the dissent channel must actually log somewhere reviewable.
- No urgency/streak/pressure mechanics anywhere near actions.
- No anonymous authority ("the system says") — always a named owner or a cited source.
- No burying the exit note in fine print.
- No auto-resolving doctrine conflicts — flag for human judgment; don't hide them.

## Smallest implementation path (when approved)

- Source path + gate owner: already derivable in SoleDash (sourcePath + Human Gates classification) — render the tags.
- Exit note + dissent affordance + conflict badge: static UI elements + a simple flags/dissent log file. Read-only console stays read-only except for an explicit, human-initiated flag write (no automation, no AI).
- One file (`scripts/foreman/foreman-control-server.mjs`) + this doc when built.

## Boundaries honored

Design only. No build, no code, no automation.
