# Source Truth Policy

Status: DRAFT V0
Owner: Swanson@Doss
Scope: Werkles / Nerdkle / Aeye shared reality

## Canonical Source Truth

The canonical code source truth is GitHub:

- Repository: `https://github.com/benleakwerkles/Werkles1.git`
- Remote: `origin`
- Branch: `main`

Local branches, local worktrees, local archives, machine screenshots, chat receipts, and preview branches are evidence. They are not canonical truth until their bytes land on GitHub and are promoted by an explicit human gate.

## Review Branches

GitHub review branches may hold auditable candidate truth. They are not canonical until merged or otherwise promoted by Ben/Petra.

Required candidate labels:

- `CANDIDATE`
- `PRESERVED_ONLY`
- `NOT_CANONICAL`
- `BLOCKED`
- `CANONICAL_AFTER_HUMAN_GATE`

## Atlas Role

Atlas reads and mirrors source truth. Atlas does not own source truth.

Atlas may:

- read GitHub `origin/main`
- record the current remote hash
- compare local machine state to GitHub truth
- produce readback receipts
- copy/mirror artifacts as archive evidence

Atlas may not:

- promote a local branch
- decide canonical status
- push to `main`
- deploy
- run privileged production actions

## Speaker Role

Speaker mirrors the rationale behind source truth. Speaker does not execute work.

Speaker may:

- preserve why GitHub main is the source truth
- warn when local memory outranks file reality
- record draft causal entries
- mirror Atlas readbacks for Aeyes

Speaker may not:

- route missions
- execute commands
- ratify doctrine
- promote branches
- rewrite history without source notes

## Promotion Rule

A local or review branch becomes canonical only after:

1. Filesystem snapshot exists.
2. Branch identity exists.
3. Lineage receipt exists.
4. Branch-specific execution proof exists.
5. GitHub bytes exist.
6. Human gate approves promotion.

Until then, the branch is evidence, not source truth.
