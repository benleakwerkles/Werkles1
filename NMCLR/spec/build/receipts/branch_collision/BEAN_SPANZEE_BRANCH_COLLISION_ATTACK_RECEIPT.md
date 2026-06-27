# BEAN_SPANZEE_BRANCH_COLLISION_ATTACK_RECEIPT

OWNER: Swanson@Doss  
SOURCE: Bean@Spanzee branch-collision receipt, ingested from current operator-provided thread text  
STREAM: NERDKLE / NMCLR / RECEIPT INGESTION  
INGESTED_AT: 2026-06-26T18:34:00-04:00  
STATUS: DURABLE_RECEIPT_CANDIDATE  

## Receipt Anchors

- `BS-BRANCHCOLLISION-20260626-1645`
- `BS-BRANCHCOLLISION-20260626-1700`

## Timestamp(s)

- Anchor timestamp: 2026-06-26 16:45, source label `BS-BRANCHCOLLISION-20260626-1645`
- Anchor timestamp: 2026-06-26 17:00, source label `BS-BRANCHCOLLISION-20260626-1700`
- Receiver-side ingest timestamp: 2026-06-26T18:34:00-04:00

## Core Ruling

Bean@Spanzee ruling, preserved as a receipt candidate:

- Two NMCLR build descriptions may legitimately coexist.
- Branch A and Branch B are both `PRESERVED_ONLY / NOT_CANONICAL`.
- Preservation is allowed only as read-only audit material.
- Canonical promotion is blocked until branch identity, filesystem snapshot, lineage, and branch-specific execution proof exist.

## Branch A File Family

Current normalized taxonomy classifies Branch A as the NCL/PS1 file family.

Branch A expected family:

- `BUILD_SPEC_v2.3.json`
- `runnable_slices/slice_001_init.ps1`
- `runnable_slices/slice_002_validate.ncl`
- `runnable_slices/slice_003_emit.json`
- `manifest.lock`
- `packet_manifest.sig`

Current Doss classification:

- `BRANCH_A_NCL_PS1`
- Current Doss live filesystem snapshot found these expected files missing from `C:\Users\BenLeak\Desktop\github\Werkles\NMCLR\spec\build`.
- Git branch at readback: `snapshot/sally-good-werkles-2026-06-12`
- Git head at readback: `4adebb2dfaf2fc2dae3284f24969eebe8b7adf6f`
- NMCLR status at readback: `?? NMCLR/`

## Branch B File Family

Current normalized taxonomy classifies Branch B as the Node/ESM first-slice file family.

Branch B expected/present family from live Doss filesystem snapshot:

- `README.md`
- `nmclr-first-slice.mjs`
- `first_movement.mjs`
- `first_breath.mjs`
- `first_metabolism.mjs`
- `fixtures/packet-causes-action.json`
- `artifacts/first-artifact.json`
- `receipts/receipt-packet-first-slice-001.json`

Current Doss readback found this family at:

`C:\Users\BenLeak\Desktop\github\Werkles\NMCLR\spec\build`

Filesystem snapshot classification:

- `BRANCH_B_NODE_ESM`
- Snapshot: `NMCLR_SPEC_BUILD_FS_SNAPSHOT_V0.json`
- Aggregate tree hash: `849D72FC4BCA5AAF63D4B1C4E579CA4B629A087F9176391ED79A6E7FAC46B16A`
- This proves current file presence only. It does not prove canonical status.

## Exploits Analyzed

Bean collision ruling blocks these failure modes:

1. False equivalence exploit:
   - Treating two different build descriptions as one consistent build.
   - Ruling: preserve separately; do not collapse.

2. Canonical promotion exploit:
   - Calling either Branch A or Branch B canonical because it has files, chat descriptions, or partial proof.
   - Ruling: both are `PRESERVED_ONLY / NOT_CANONICAL`.

3. Motion theater exploit:
   - Treating status, pasted chat, or file presence as motion.
   - Ruling: motion requires `packet -> work -> artifact`.

4. Branch identity exploit:
   - Losing which branch/worktree/session produced which file family.
   - Ruling: canonical promotion blocked until branch identity and lineage are proven.

5. Preservation/canon confusion exploit:
   - Treating read-only preservation as promotion.
   - Ruling: read-only preservation is allowed; canonical promotion remains blocked.

## Missing Receipts

Canonical promotion remains blocked because the following proof is missing:

- Branch-specific git branch name for each build family.
- Branch-specific commit hash for each build family.
- Branch-specific filesystem snapshot for Branch A NCL/PS1 family.
- Branch-specific execution proof for Branch A.
- Branch-specific execution proof for Branch B.
- Lineage showing where Branch A originated.
- Lineage showing where Branch B originated.
- Receiver-side readback of the original Bean@Spanzee receipt text outside this ingest artifact.
- Promotion decision receipt from Petra or Ben.

## NO-GO Canonical Ruling

Canonical status:

- Branch A: `PRESERVED_ONLY / NOT_CANONICAL`
- Branch B: `PRESERVED_ONLY / NOT_CANONICAL`
- Combined/collapsed NMCLR branch: `NO-GO_FOR_CANONICAL`

Reason:

- Ready to preserve is not ready to call canonical.
- Doss current tree proves Branch B Node/ESM file family exists locally, but not a clean canonical branch.
- Branch A NCL/PS1 family is not present in the current Doss NMCLR/spec/build tree.
- First-slice proof is partial and bounded; it does not prove full organism life.

## Preserved vs Canonical Distinction

PRESERVED_ONLY may mean:

- Keep files.
- Hash files.
- Snapshot files.
- Record branch identity.
- Record lineage.
- Prevent deletion while audit continues.

CANONICAL may mean only after:

- Branch identity is proven.
- Filesystem snapshot is proven.
- Lineage is proven.
- Branch-specific execution proof exists.
- Receiver-side readback exists.
- Promotion decision exists.

This artifact is preservation evidence only. It is not canonical promotion.

## Source Discipline

This candidate receipt is aligned with existing Doss NMCLR constraints:

- `SWANSON_DOSS_NMCLR_FIRST_SLICE_READBACK_RECEIPT` classifies proof as `PARTIAL_MOTION`, not canonical.
- `NMCLR_SPEC_BUILD_FS_SNAPSHOT_V0` classifies the current Doss tree as `BRANCH_B_NODE_ESM`.
- `NMCLR_MUSCLE_RECEIPT_STANDARD` requires `packet -> work -> artifact`; chat/status/file presence alone is not motion proof.

## Ben Action Status

- Not required for audit.
- Required only for promotion decision.

## Do Not

- Do not promote Branch A.
- Do not promote Branch B.
- Do not collapse the two builds.
- Do not call pasted chat durable storage.
- Do not treat this receipt as canonical proof until stored and read back.
- Do not infer branch identity from file names alone.

## Current Proof Level

`RECEIPT_CANDIDATE_STORED_AND_READ_BACK`

This becomes stronger only after receiver-side readback confirms this exact artifact and a later promotion authority acts on it.
