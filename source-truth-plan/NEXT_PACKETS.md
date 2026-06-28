# NEXT_PACKETS

Generated: 2026-06-28T03:44:11.383Z

## PACKET 1: IMPORT_BETSY_NERDKLE_THE_BOOK

Status: COMPLETE AS RAW REFERENCE IMPORT.

Owner: Dink@Betsy pushed; Swanson@Doss verified and promoted into source-truth.

Evidence: `source-truth-plan/references/betsy_desktop_nerdkle_the_book/` contains the imported raw source packet. Original push branch was `preserve/tinkerden-packet-engine-20260622` at commit `dda5d295554e70b0a75bf4b186e569f5b7393f5a`; Doss readback counted `120` files.

## PACKET 2: SOURCE_TRUTH_REVIEW_TO_MAIN

Owner: Petra/Ben approval, Swanson executes.

Mission: Review this branch and merge accepted source-truth-plan material to `origin/main`.

Pass: GitHub main contains `source-truth-plan/` or its accepted successor.

## PACKET 3: CHAPTER_SOURCE_LOCK

Owner: Fucko@Betsy for prose, Swanson for source ledger.

Mission: For each planned chapter, choose one primary source and one architecture support source. No rewriting yet.

Pass: `CHAPTER_SOURCE_LOCK.json` records primary source, support source, proof state, and missing gaps for every chapter.

## PACKET 4: ATLAS_SPEAKER_REMOTE_DECISION

Owner: Ben/Petra.

Mission: Decide whether `C:\speaker` gets its own GitHub remote or remains material copied into the Werkles source-truth branch.

Pass: Exact remote URL is written as a receipt, or decision says no separate Speaker repo yet.
