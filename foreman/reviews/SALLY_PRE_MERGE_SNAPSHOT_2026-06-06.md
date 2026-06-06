# Sally Pre-Merge Snapshot

**Mission:** `SALLY_MERGE_SAFETY_PROTOCOL`  
**Captured:** 2026-06-06  
**Branch:** `rescue/sally-dirty-worktree-2026-06-01`  
**Pre-merge HEAD:** `488e6c6` — chore(cockpit): record APP_INFRA approval and next gate  
**Merge target:** `origin/main` @ `0c727a2`

## Intent

Checkpoint uncommitted Sally lane work before merging `origin/main` into the rescue branch. **No merge to `main`.** No production deploy.

## Lane commits (planned)

| Commit | Lane | Scope |
|--------|------|--------|
| 1 | Snapshot | This file + `.gitignore` quarantine updates |
| 2 | Homepage | Rewrite v1, Ender visual tests, stock-preview imagery |
| 3 | Dispatch | Autonomous round-trip, homepage discovery proofs, relay courier |
| 4 | Doctrine | Imagery direction, scope lock, handoffs, review packets |
| 5 | Tooling | `package.json` npm scripts, minor UI/icon scaffolding |

## Conflict policy (merge)

- Adopt **main** split preview gate (`lib/app-infra-preview.ts`).
- Take **main** for auth/Stripe/billing route and page conflicts.
- **Synthesize** cockpit truth fresh post-merge.
- Append main **Preview proof PASS** row to `APPROVAL_LOG.md`.
- Mark Preview OAuth/Stripe checklist steps 2–3 complete; production/live unchecked.

## Preserved local lanes (not dropped)

- `foreman/WERKLES_HOMEPAGE_REWRITE_SCOPE_LOCK.md`
- Homepage v1 app surfaces (`lib/copy.ts`, hero, trust rail, visual-system)
- Dispatch proof manifests under `foreman/crew-dispatch/`
- Petra handoff `TO_PETRA_WERKLES_HOMEPAGE_DISCOVERY_SYNTHESIS_v1_*` (unsent)

## Excluded from checkpoint (quarantine)

- `.cursor/`
- `public/assets/draft/ghost-forge/_import/`
- `foreman/education-forge-output/`
- Foreman runtime PNGs/logs per `.gitignore`

## Post-merge verification

- [ ] `git status` clean
- [ ] `npm run typecheck` pass
- [ ] Homepage rewrite surfaces still present
- [ ] `isAuthStripeTestBlocked()` / `isCruciblePreview()` from main
