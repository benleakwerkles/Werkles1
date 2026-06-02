# Foreman Control Panel — Bean hardening retest checklist

Run on Sally after any control panel change. No deploy, push, SQL, secrets, Ghost Forge, Bellows, or external send.

## Port / PID safety

- [ ] Start another app on port 4317 (not Foreman). Double-click `foreman-control.cmd`.
  - **Expected:** `HUMAN GATE REQUIRED` — unknown process is **not** killed.
- [ ] Start Foreman Control Panel normally. Close window without clean exit (or leave PID file). Start again while stale Foreman process still listens.
  - **Expected:** stale Foreman PID from `foreman/control-panel/foreman-control.pid` + matching `foreman-control-server.mjs` command line is cleared; panel starts.
- [ ] Confirm no script kills all `node.exe` or arbitrary PIDs.

## Drop Zone validation

- [ ] Save valid markdown under 100KB with slug hint `crew-notes`.
  - **Expected:** file appears only under `foreman/handoffs/inbox/` as `YYYYMMDD-HHMMSS-crew-notes.md`.
- [ ] Slug hint `../../secrets` or `..\\windows`.
  - **Expected:** rejected (traversal / path separators).
- [ ] Paste content > 100KB.
  - **Expected:** rejected.
- [ ] Confirm inbox listing ignores non-`.md` files (only `.md` shown in panel list).

## Server-confirmed UI feedback

- [ ] Click **Copy Latest Petra Paste Block** with paste file present.
  - **Expected:** button shows **Copied** only after HTTP 2xx + `ok: true`.
- [ ] Stop server mid-action or use devtools to block `/api/action`.
  - **Expected:** button shows **FAILED** + error toast — not “Copied” on click alone.
- [ ] Blocked **Deploy** button.
  - **Expected:** **HUMAN GATE REQUIRED** toast; no success state.

## Local POST token

- [ ] `curl -X POST http://127.0.0.1:4317/api/action` without token header.
  - **Expected:** HTTP 401 JSON failure.
- [ ] Dashboard buttons include token automatically (no manual paste for Ben).

## Localhost bind

- [ ] Server logs `127.0.0.1:4317` only — not `0.0.0.0`.
- [ ] Dashboard opens at http://localhost:4317

## Design tokens

- [ ] Inline CSS documents sync via `foreman/control-panel/TOKENS_SYNC.md`.
- [ ] No new independent palette law introduced.

## Automated smoke (optional)

```powershell
cd C:\Users\benle\Desktop\github\Werkles
node scripts\foreman\foreman-control-retest.mjs
```

Pass all checks before merge/reliance.
