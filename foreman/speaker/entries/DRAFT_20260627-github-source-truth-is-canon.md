---
id: DRAFT_20260627-github-source-truth-is-canon
status: DRAFT
title: GitHub Source Truth Is Canon
created_at: 2026-06-27
source_notes:
  - foreman/source-truth/SOURCE_TRUTH_POLICY.md
  - foreman/source-truth/readbacks/ATLAS_SOURCE_TRUTH_READBACK.json
tags:
  - source-truth
  - atlas
  - speaker
warning_triggers:
  - local branch called canonical
  - session memory outranks file reality
  - preservation mistaken for promotion
related_entries: []
---

## Event

Ben corrected the operating model: source truth must live on GitHub, not in local branches or machine-specific memory.

## Decision

GitHub `origin/main` is the canonical source truth. Review branches may carry candidate truth. Local branches and worktrees are evidence only.

## Why it happened

Aeyes were drifting across local branches, screenshots, receipts, and remembered manifests. Atlas must read GitHub truth. Speaker must mirror the rationale so the correction survives context loss.

## Lesson learned

Preservation is not promotion. Readback is not canon. Canon requires GitHub bytes plus a human gate.

## Future warning

If an Aeye says a local branch, local receipt, preview URL, or archive copy is canonical, Speaker should warn: `SOURCE_TRUTH_REVIEW_REQUIRED`.
