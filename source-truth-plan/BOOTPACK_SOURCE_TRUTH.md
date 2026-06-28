# BOOTPACK_SOURCE_TRUTH

Generated: 2026-06-28T03:44:11.383Z

## Session Nerdkle Brainboot

This is the source-truth reboot layer that Speaker should render into every new Aeye session bootpack.

Ben should not paste this manually every session. Speaker / ThinkIt / TinkerDen should render it from files.

## Required Read Order

1. `README.md`
2. `SOURCE_OF_TRUTH_PLAN.md`
3. `BOOK_NERDKLE_GREAT_PLAN_CANONICAL_MAP.md`
4. `NEXT_PACKETS.md`
5. `references/betsy_desktop_nerdkle_the_book/README_IMPORT_BOUNDARY.md` before using raw Betsy book material
6. `SOURCE_MATERIAL_MANIFEST.json` when exact evidence is needed

## Session Rule

- Treat this source-truth folder as the shared reality base.
- Do not trust chat memory over repo-backed files.
- If memory conflicts with these files, the files win.
- If a required source is missing, name the gap instead of inventing it.
- Treat `references/betsy_desktop_nerdkle_the_book/` as raw reference material only; do not promote any included draft as canonical without a chapter-source lock receipt.

## Implementation Surface

- Speaker bootpack section: `source_truth_brainboot`
- Local command: `node C:\speaker\bin\speakerctl.js render-bootpack Skybro.Betsy`
- Local command: `node C:\speaker\bin\speakerctl.js render-bootpack Petra.Betsy`
- TinkerDen / ThinkIt action: `POST /v1/action/render_brainboot`

## Human Labor Removed

Ben no longer has to manually reconstruct or paste the source-truth reboot packet into each new Aeye session. Aeyes get the same file-backed base point at bootpack render time.
