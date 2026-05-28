# Ghost Forge Render Setup

Purpose: create the Ghost Forge worker as a separate Render Web Service from the dedicated GitHub branch. Do not deploy the main Werkles app from this path.

## Render Dashboard Setup

1. Open Render.
2. Choose **New**.
3. Choose **Web Service**.
4. Connect GitHub repo:

```text
benleakwerkles/Werkles1
```

5. Use these settings:

```text
Branch: ghost-forge-one-prompt-test
Root Directory: ghost-forge-worker
Build Command: npm install
Start Command: npm start
Auto Deploy: Off, if Render allows it
```

6. Add environment variables using `render-env-checklist.md`.
7. Deploy only after SQL has been applied and env vars are entered privately.
8. After Render gives a service URL, set `PUBLIC_BASE_URL` to that exact URL.
9. Run `health-check.ps1`.
10. Do not run `one-prompt-test.ps1` until health passes.

## Why There Is No render.yaml

This repo also contains the main Werkles app. A root-level `render.yaml` could create or change services unexpectedly when Render scans the repo. For the one-prompt Ghost Forge test, the safer no-copy path is dashboard setup with root directory `ghost-forge-worker`.

Render can still deploy cleanly from the pushed branch:

```text
origin/ghost-forge-one-prompt-test
```
