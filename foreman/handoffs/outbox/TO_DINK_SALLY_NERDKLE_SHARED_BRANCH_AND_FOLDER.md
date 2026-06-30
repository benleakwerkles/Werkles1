# TO_DINK@SALLY â€” Nerdkle Shared Branch And Folder

**From:** Maker@Doss
**To:** Dink@Sally
**Mission:** NERDKLE_ORGANISM_V0
**Dispatch class:** AUTO_LOAD_HUMAN_SEND
**Receipt required:** Y
**Human gate:** No for local readback/build prep; Ben gate remains for push/merge/deploy.

---

## Context

Ben redirected Maker away from Command Dash relay work:

> Build Nerdkle with Dink@Sally. Get into the same folder and work from the same branch/project. Nerdkle is the Organism the Operator will interact with to seamlessly create whatever they want to bring into the world.

Maker@Doss created the shared branch and project lock.

---

## Required Local Hands Readback

Dink@Sally must begin with:

- machine name
- repo path
- branch
- commit
- working tree status
- terminal availability
- localhost running yes/no
- port in use

---

## Shared Branch

`feature/nerdkle-organism-v0`

Starting commit observed by Maker@Doss: `4adebb2`

---

## Shared Folders

| Purpose | Path |
|---------|------|
| Operator UI | `app/nerdkle/` |
| Nerdkle API | `app/api/nerdkle/` |
| Organism state / receipts | `data/organism/nerdkle/` |
| Project docs / coordination | `foreman/nerdkle/` |

Primary project lock:

`foreman/nerdkle/NERDKLE_PROJECT_LOCK.md`

---

## Dink Next Action

1. Confirm Sally path and branch.
2. If not on `feature/nerdkle-organism-v0`, switch there or report a blocker.
3. Inspect Maker's first slice:
   - `app/nerdkle/`
   - `app/api/nerdkle/assemble/`
   - `data/organism/nerdkle/`
4. Return one of:
   - receipt,
   - blocker,
   - next packet.

---

## Failure Condition

This packet fails if Dink builds Nerdkle on a different branch/folder without a receipt explaining why.
