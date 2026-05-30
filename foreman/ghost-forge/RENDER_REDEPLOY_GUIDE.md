# Render redeploy guide — `werkles-ghost-forge1`

Purpose: reload env vars and pick up the latest worker code **without changing env values**.

No secrets are copied in this guide.

## When to use

- Ghost Forge returns **402** on `POST /batch/create`
- `/health` does **not** show `daily_budget_usd` (older running build)
- You changed Render env vars and need the running process to reload them

## Human gate

Ben approves redeploy by replying in chat:

```text
RENDER REDEPLOY APPROVED
```

Codex does **not** click Render for you. Ben performs the click below.

## Steps (Ben — about 30 seconds)

1. Open [Render Dashboard](https://dashboard.render.com/).
2. Sign in if prompted.
3. Open service **`werkles-ghost-forge1`**.
4. Click **Manual Deploy**.
5. Choose **Deploy latest commit**.
6. Wait until status is **Live** (usually 1–3 minutes).

Do **not** edit Environment variables during this step unless you intentionally need a change.

## After redeploy

Tell Codex:

```text
RENDER REDEPLOY DONE
```

Codex will re-run:

```powershell
cd C:\Users\benle\Desktop\github\Werkles
.\scripts\foreman\ghost-forge-budget-diagnostic.ps1
```

## What redeploy does / does not do

| Does | Does not |
|------|----------|
| Reload env vars into the Node process | Reset Supabase spend rows |
| Deploy latest committed worker code | Push git commits |
| Expose budget fields on `/health` after code lands | Charge Replicate or run icon batches |

## CLI note

Render CLI is **not** installed on Sally. Dashboard click is the supported path unless Ben later installs Render CLI with credentials locally.
