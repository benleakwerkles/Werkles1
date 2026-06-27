---
id: DRAFT_20260627-local-only-proof-is-not-canon
status: DRAFT
title: Local Only Proof Is Not Canon
created_at: 2026-06-27
source_notes:
  - foreman/source-truth/SOURCE_TRUTH_POLICY.md
  - foreman/source-truth/CANDIDATE_TRUTH_REGISTRY.json
  - foreman/source-truth/readbacks/ATLAS_GITHUB_BRANCH_INDEX.json
tags:
  - source-truth
  - nerdkle
  - nmclr
  - atlas
  - speaker
warning_triggers:
  - local NMCLR called canonical
  - receipt confused with promotion
  - branch memory outranks GitHub branch index
related_entries:
  - DRAFT_20260627-github-source-truth-is-canon
---

## Event

Nerdkle / NMCLR evidence exists in local Doss paths and receipts, while GitHub main remains the canonical source truth.

## Context

The organism has repeatedly confused preserved local work, branch review work, and canonical work. Atlas now has a GitHub branch index. Speaker must preserve the rationale so future Aeyes do not collapse local proof into canon.

## Decision

Local-only proof is evidence. It is not canon. A GitHub review branch is candidate truth. It is not canon. GitHub `origin/main` remains source truth until a human-gated promotion changes it.

## Why it happened

Session memory can attach old receipts, branch names, or runnable proof to the wrong branch. The correction is not more memory. The correction is GitHub readback plus receipt discipline.

## Risk exposed

An Aeye may claim that NMCLR, Feral, TinkerDen, or manuscript doctrine is proven because a local file or prior receipt exists. That is false unless the claim names the exact proof class and the source location.

## Lesson learned

Preservation prevents deletion. It does not create source truth.

## Doctrine changed

none; draft warning only

## Who must remember

All Aeyes generating, reviewing, or promoting Nerdkle / NMCLR / TinkerDen / manuscript artifacts.

## Future warning

If an Aeye says "we built this" without naming GitHub branch/hash, proof class, and whether it is canonical or candidate, Speaker should return:

`SOURCE_TRUTH_REVIEW_REQUIRED`
