# Nerdkle Project Lock

Status: **ACTIVE V0**
Mission: Build Nerdkle â€” the Organism the Operator interacts with to create whatever they want to bring into the world.

---

## Shared Branch / Project

| Field | Value |
|-------|-------|
| Shared branch | `feature/nerdkle-organism-v0` |
| Repo | `C:\Users\BenLeak\Desktop\github\Werkles` |
| Maker surface | Doss (`DOSS`) |
| Dink surface | Sally, pending local hands readback |
| Starting commit | `4adebb2` |

All Nerdkle work should happen on `feature/nerdkle-organism-v0` until Ben redirects.

---

## Shared Folders

| Purpose | Path |
|---------|------|
| Operator UI | `app/nerdkle/` |
| Nerdkle API | `app/api/nerdkle/` |
| Organism state / receipts | `data/organism/nerdkle/` |
| Project docs / coordination | `foreman/nerdkle/` |
| Dink/Maker packets | `foreman/handoffs/outbox/` and `foreman/handoffs/inbox/` |

---

## Product Definition

Nerdkle is the Operator-facing Organism.

The Operator gives Nerdkle messy intent:

```text
I want to bring X into the world.
```

Nerdkle returns a usable operating object:

- artifact created
- unresolved fields
- human gates
- execution owner
- receipt required
- next action
- evidence required
- failure condition

---

## First Slice

`app/nerdkle` lets the Operator enter messy intent.

`POST /api/nerdkle/assemble` converts that intent into:

1. an operating object JSON artifact
2. a receipt JSON artifact
3. a response visible in the UI

No AI. No external send. No account automation.

---

## Dink@Sally Alignment Rule

Dink@Sally should first perform LOCAL HANDS READBACK, then align to:

```powershell
cd C:\Users\BenLeak\Desktop\github\Werkles
git fetch origin
git switch feature/nerdkle-organism-v0
```

If Sally uses `C:\Dev\Werkles`, Dink must state that explicitly in the readback and either switch to this repo path or report a blocker before editing.

---

## Failure Condition

Nerdkle build fails if Maker@Doss and Dink@Sally work in different branches/folders without a receipt explaining the split.
