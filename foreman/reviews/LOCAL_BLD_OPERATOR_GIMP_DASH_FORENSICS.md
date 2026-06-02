# Local File Forensics — BLD / Operator / Gimp Dash Inventory

Status: **read-only inventory** (2026-05-31)  
Active repo: `C:\Users\benle\Desktop\github\Werkles`  
Method: filename + content scan across requested roots; excluded `node_modules`, `.git`, `.next`, and deep browser extension trees unless filename-matched.

---

## Executive summary

| Target | Result |
|--------|--------|
| **BLDer bootup logs** | **Not found** on this machine (no filename or text match for `BLDer`, `BLD boot`, `bootup log`) |
| **Gimp Dash files** | **Not found** (no filename or text match for `Gimp Dash`, `GimpDash`, `gimpdash`) |
| **Operator Dashboard** | **Found** — cockpit markdown, Foreman Control Panel, crew dispatch dashboards, Desktop shortcut |
| **Foreman / Cockpit / Aeye crew** | **Found** — extensive tree in active repo (much of Operator UX reset is **untracked**) |
| **Boot-adjacent (not BLDer)** | **Found** — cousin **boot packet** builder (`build-boot-packet.*`), not BLDer boot logs |

---

## 1. Files found

### 1A. Primary targets — NOT FOUND

| Search term | Scope | Result |
|-------------|-------|--------|
| `BLDer`, `BLD boot`, `bootup log` | Desktop, Documents, Downloads, `Werkles`, `Werkles1`, `Werkles_DIRTY_BACKUP`, shallow AppData | **Zero matches** |
| `Gimp Dash`, `GimpDash`, `gimpdash`, `gimp dash` | Same | **Zero matches** |

**Conclusion:** Either files use different naming, live on another drive/machine/account, or were never saved locally under these terms.

---

### 1B. Operator Dashboard & Foreman Control Panel (active repo)

| Full path | Size | Last modified (UTC) | Why matched | Classification |
|-----------|------|---------------------|-------------|----------------|
| `C:\Users\benle\Desktop\github\Werkles\foreman\OPERATOR_DASHBOARD.md` | 2,062 B | 2026-05-31T16:26:02Z | `operator dashboard` | **Operator Dashboard** (cockpit markdown) |
| `C:\Users\benle\Desktop\github\Werkles\foreman\OPERATOR_LOG.md` | 23,086 B | 2026-05-28T23:15:40Z | `operator` | Foreman/Cockpit related — operator session log |
| `C:\Users\benle\Desktop\github\Werkles\foreman\crew-dispatch\BEN_DASHBOARD_QUICKSTART.md` | 5,056 B | 2026-05-31T15:00:56Z | `dashboard` | **Operator Dashboard** human quickstart |
| `C:\Users\benle\Desktop\github\Werkles\foreman\crew-dispatch\PETRA_TO_OPERATOR_DASHBOARD_SCRIPT.md` | 5,024 B | 2026-05-31T15:00:56Z | `operator dash` | Operator Dashboard explain script (Petra) |
| `C:\Users\benle\Desktop\github\Werkles\foreman\handoffs\outbox\TO_PETRA_OPERATOR_DASHBOARD_BRIEF.md` | 3,434 B | 2026-05-31T15:00:56Z | `operator dash` | Foreman/Cockpit handoff |
| `C:\Users\benle\Desktop\github\Werkles\scripts\foreman\foreman-control-server.mjs` | 86,953 B | 2026-05-31T17:07:23Z | `foreman`, `control panel` | **Foreman Control Panel** server (:4317) |
| `C:\Users\benle\Desktop\github\Werkles\foreman-control.cmd` | 516 B | 2026-05-31T16:49:08Z | `foreman` | Foreman launcher |
| `C:\Users\benle\Desktop\github\Werkles\foreman\control-panel\README.md` | 3,008 B | 2026-05-31T16:49:08Z | `control panel` | Foreman Control Panel docs |
| `C:\Users\benle\Desktop\github\Werkles\foreman\control-panel\RETEST_CHECKLIST.md` | (see repo) | 2026-05-31 | `control panel` | Foreman QA checklist |
| `C:\Users\benle\Desktop\github\Werkles\foreman\control-panel\TOKENS_SYNC.md` | (see repo) | 2026-05-31 | `control panel` | Design token sync notes |
| `C:\Users\benle\Desktop\github\Werkles\scripts\foreman\operator.mjs` | 12,143 B | 2026-05-28T23:15:41Z | `operator` | Foreman CLI helper (tracked) |
| `C:\Users\benle\Desktop\github\Werkles\foreman\crew-dispatch-console\dashboard.html` | 5,227 B | 2026-05-31T14:49:49Z | `dashboard` | Crew dispatch HTML dashboard (links localhost:3000) |
| `C:\Users\benle\Desktop\github\Werkles\foreman\crew-dispatch-console\DISPATCH_DASHBOARD.md` | (see repo) | 2026-05-31 | `dashboard` | Crew dispatch markdown dashboard |
| `C:\Users\benle\Desktop\github\Werkles\foreman\crew-dispatch-console\DISPATCH_DASHBOARD.json` | (see repo) | 2026-05-31 | `dashboard` | Generated dispatch state |
| `C:\Users\benle\Desktop\github\Werkles\foreman\finance\finance-dashboard.json` | (see repo) | 2026-05-31 | `dashboard` | Finance Command scaffold (local only) |

---

### 1C. Boot-adjacent (NOT BLDer bootup logs)

| Full path | Size | Last modified (UTC) | Why matched | Classification |
|-----------|------|---------------------|-------------|----------------|
| `C:\Users\benle\Desktop\github\Werkles\foreman\crew-dispatch\build-boot-packet.mjs` | 3,766 B | 2026-05-31T15:00:56Z | `boot` | Cousin **context boot packet** generator — **not** BLDer |
| `C:\Users\benle\Desktop\github\Werkles\foreman\crew-dispatch\build-boot-packet.ps1` | (see repo) | 2026-05-31 | `boot` | PS wrapper for boot packets |
| `C:\Users\benle\Desktop\github\Werkles\foreman\templates\BOOT_COUSIN_PACKET_TEMPLATE.md` | (see repo) | 2026-05-31 | `boot` | Template for cousin boot packets |
| `C:\Users\benle\Desktop\github\Werkles\foreman\next-dev-3000.log` | 1,812 B | 2026-05-27T06:05:14Z | `*.log`, Next dev | **Next.js dev server log** — not BLDer |
| `C:\Users\benle\Desktop\github\Werkles\supabase\admin_bootstrap.sql` | (see repo) | tracked | `bootstrap` | Supabase admin bootstrap SQL — not BLDer |

---

### 1D. Outside active repo — duplicates / imports

| Full path | Size | Last modified (UTC) | Why matched | Classification |
|-----------|------|---------------------|-------------|----------------|
| `C:\Users\benle\Desktop\Werkles - Foreman Dashboard.cmd` | 110 B | 2026-05-31T15:00:56Z | `Foreman Dashboard` | Desktop shortcut → calls `foreman-control.cmd` |
| `C:\Users\benle\Desktop\Werkles_DIRTY_BACKUP\foreman\OPERATOR_DASHBOARD.md` | 1,650 B | 2026-05-26T20:20:29Z | `operator dash` | **Duplicate/stale** (older than active repo) |
| `C:\Users\benle\Desktop\Werkles_DIRTY_BACKUP\` (241+ files) | — | mostly May 2026 | prior Werkles snapshot | **Archive local only** — full dirty backup tree |
| `C:\Users\benle\Documents\Werkles\foreman\platform-instructions\CODEX_FOREMAN_INSTRUCTIONS.md` | 1,420 B | 2026-05-25T07:05:37Z | `foreman` | **Stale partial copy** outside github path |
| `C:\Users\benle\Downloads\FROM_CLAUDE_cockpit_v2.md` | 12,309 B | 2026-05-24T16:33:45Z | `cockpit` | Source material — import candidate |
| `C:\Users\benle\Downloads\TO_OPERATOR_werkles_pricing_audit.md` | 15,502 B | 2026-05-25T02:33:08Z | `TO_OPERATOR` | Source material — import candidate |
| `C:\Users\benle\Downloads\TO_OPERATOR_werkles_constitution_red_team.md` | (see Downloads) | 2026-05-25 | `TO_OPERATOR` | **Possible duplicate** of tracked repo file |
| `C:\Users\benle\Downloads\TO_OPERATOR_werkles_monetization_ideas.md` | (see Downloads) | 2026-05-25 | `TO_OPERATOR` | **Possible duplicate** of tracked repo file |
| `C:\Users\benle\Desktop\github\Werkles1\` | 94 files | snapshot | GitHub remote mirror | **Separate repo** — app-only; no foreman/Operator UX tree |

---

### 1E. Runtime / local-only (do not disseminate)

| Full path | Why listed | Classification |
|-----------|------------|----------------|
| `foreman/control-panel/.local_token` | Foreman POST auth token (gitignored) | **DO NOT COMMIT** |
| `foreman/control-panel/foreman-control.pid` | Runtime PID record | **DO NOT COMMIT** |
| `foreman/.edge-aeye-crew-profile/` | Edge browser profile (cookies, extensions) | **DO NOT COMMIT** |
| `foreman/crew-dispatch/RELAY_LOCK.json` | Courier runtime lock | **DO NOT COMMIT** (or commit empty template only) |
| `foreman/crew-dispatch/.relay-session.json` | Relay session state | **DO NOT COMMIT** |
| `ghost-forge-worker/.env` | Local env file (gitignored) | **DO NOT COMMIT** — SECRET-LIKE CONTENT DETECTED |

---

## 2. Repo status (active `Werkles`)

| Item | Inside repo? | Git tracked? | Notes |
|------|--------------|--------------|-------|
| `foreman/OPERATOR_DASHBOARD.md` | Yes | **Tracked** (modified `M`) | Canonical cockpit operator view |
| `foreman/OPERATOR_LOG.md` | Yes | **Tracked** | |
| `scripts/foreman/operator.mjs` | Yes | **Tracked** | |
| `company/source_material/TO_OPERATOR_*.md` | Yes | **Tracked** | |
| `scripts/foreman/foreman-control-server.mjs` | Yes | **Untracked** `??` | Operator UX reset — not yet in Git |
| `foreman-control.cmd` | Yes | **Untracked** `??` | |
| `foreman/control-panel/` | Yes | **Untracked** `??` (except gitignored `.local_token`) | |
| `foreman/crew-dispatch/` | Yes | **Untracked** `??` | Relay, courier, boot builder |
| `foreman/crew-dispatch-console/` | Yes | **Untracked** `??` | |
| `foreman/finance/` | Yes | **Untracked** `??` | |
| `foreman/gates/OAUTH_STRIPE_OPERATOR_CHECKLIST.md` | Yes | **Untracked** `??` | |
| Desktop `Werkles - Foreman Dashboard.cmd` | **Outside repo** | N/A | Shortcut only — optional copy to repo `foreman/control-panel/` as doc reference |
| `Werkles_DIRTY_BACKUP/` | **Outside repo** | N/A | Do not import wholesale |
| `Downloads/TO_OPERATOR_*` | **Outside repo** | N/A | Compare to tracked `company/source_material/` before import |
| `Werkles1/` | **Outside repo** (separate clone) | Its own Git | No foreman operator stack |

---

## 3. Safety screen

| Path / area | Flag |
|-------------|------|
| `ghost-forge-worker/.env` | **SECRET-LIKE CONTENT DETECTED** (local env file; gitignored) |
| `foreman/control-panel/.local_token` | **SECRET-LIKE CONTENT DETECTED** (local session token; gitignored) |
| `foreman/.edge-aeye-crew-profile/` | **SECRET-LIKE CONTENT DETECTED** (browser session data; may contain OAuth cookies) |
| `foreman/crew-dispatch/dispatch-policy.json` | Contains **secret-detection regex patterns only** — not live secrets |
| `foreman/gates/OAUTH_STRIPE_OPERATOR_CHECKLIST.md` | Env **names** only — no values printed |
| `foreman/OPERATOR_LOG.md` | Review for pasted credentials before any commit — **REVIEW_FIRST** |
| `Werkles_DIRTY_BACKUP/` | May contain old `.env` or local state — **DO NOT COMMIT** without per-file review |

No bank/card numbers, production DB dumps, or financial exports were identified in scanned text files under foreman/docs (excluding browser profile binaries).

---

## 4. Recommended GitHub dissemination plan

### COMMIT_NOW_SAFE (after human review of diff)

- `foreman/OPERATOR_DASHBOARD.md` (already tracked; sync current cockpit gate text)
- `foreman/control-panel/README.md`, `RETEST_CHECKLIST.md`, `TOKENS_SYNC.md`
- `foreman/crew-dispatch/BEN_DASHBOARD_QUICKSTART.md`
- `foreman/crew-dispatch/PETRA_TO_OPERATOR_DASHBOARD_SCRIPT.md`
- `foreman/handoffs/outbox/TO_PETRA_OPERATOR_DASHBOARD_BRIEF.md`
- `foreman/gates/OAUTH_STRIPE_OPERATOR_CHECKLIST.md`
- `foreman/reviews/LOCAL_BLD_OPERATOR_GIMP_DASH_FORENSICS.md` (this report)

### REVIEW_FIRST

- Entire `scripts/foreman/foreman-control-server.mjs` + `foreman-control.cmd` (large Operator UX reset — verify no machine-specific paths before commit)
- `foreman/crew-dispatch/` tree (relay, courier, dispatch policy)
- `foreman/crew-dispatch-console/` (generated JSON may embed local paths)
- `foreman/finance/` scaffold
- `foreman/OPERATOR_LOG.md` (historical operator notes)
- `Downloads/TO_OPERATOR_*` vs existing `company/source_material/` — dedupe before import

### DO_NOT_COMMIT

- `ghost-forge-worker/.env`
- `foreman/control-panel/.local_token`
- `foreman/.edge-aeye-crew-profile/`
- Runtime JSON: `RELAY_LOCK.json`, `.relay-session.json`, `.autosend-rate-limit.json` (unless sanitized templates)
- `foreman/*.png` (alt-tab/chrome focus debug screenshots) unless explicitly wanted

### ARCHIVE_LOCAL_ONLY

- `C:\Users\benle\Desktop\Werkles_DIRTY_BACKUP\` — keep as local snapshot; do not push
- `C:\Users\benle\Documents\Werkles\` — stale partial copy
- `foreman/next-dev-3000.log` — dev noise

### POSSIBLE_DUPLICATE

- `Werkles_DIRTY_BACKUP\foreman\OPERATOR_DASHBOARD.md` vs active `foreman/OPERATOR_DASHBOARD.md` (active is newer)
- `Downloads\TO_OPERATOR_werkles_*.md` vs `company/source_material/TO_OPERATOR_werkles_*.md`
- `crew-dispatch-console/dashboard.html` vs Foreman Control Panel at `:4317` (two dashboards — document which is canonical)

---

## 5. Proposed repo destinations (if importing)

| Material | Suggested path |
|----------|----------------|
| Operator cockpit markdown | `foreman/OPERATOR_DASHBOARD.md` (already) |
| Foreman Control Panel code/docs | `scripts/foreman/`, `foreman/control-panel/`, `foreman-control.cmd` |
| Crew dispatch legacy HTML | `foreman/crew-dispatch-console/` or archive under `foreman/source_material/` if deprecated |
| Downloads `TO_OPERATOR_*` (if not duplicate) | `company/source_material/` or `foreman/source_material/` |
| Downloads `FROM_CLAUDE_cockpit_v2.md` | `foreman/source_material/` |
| BLDer bootup logs (if found later) | `foreman/source_material/blder/` + index in this review |
| Gimp Dash (if found later) | `foreman/source_material/gimp-dash/` + index in this review |

---

## 6. Git plan recommendation

**Recommended:** **copy/import then review** — no commit in this session.

1. **No action** on BLDer / Gimp Dash until primary artifacts are located (different machine, rename, or cloud storage).
2. **Stage safe docs only** after Ben reviews untracked Operator UX reset scope (Foreman server, crew-dispatch, finance scaffold).
3. **Do not stage** runtime secrets, Edge profile, or `.env`.
4. **Local commit only** — requires human gate after APP_INFRA-01 or dedicated infra commit gate.
5. **Push** — **requires human gate** (explicit Ben approval; not part of APP_INFRA-01 unless scoped).

---

## 7. Next human gate

**Recommendation:**

`[AWAITING HUMAN GATE: LOCAL_FILE_FORENSICS_REVIEW]`

Ben decides:

1. Whether BLDer / Gimp Dash live elsewhere (search terms, drive, cloud path).
2. Whether to commit the untracked Operator UX reset (`foreman-control-server.mjs`, `crew-dispatch/`, etc.) as one infra slice.
3. Whether to import Downloads `TO_OPERATOR_*` / `FROM_CLAUDE_cockpit_v2.md` or treat as duplicates.
4. Whether `crew-dispatch-console/dashboard.html` remains or Foreman `:4317` is the sole operator dashboard.

---

## 8. Search coverage notes

| Location | Searched? | Notes |
|----------|-----------|-------|
| `C:\Users\benle\Desktop\github\Werkles` | Yes | Primary inventory |
| `C:\Users\benle\Desktop\github\Werkles1` | Yes | App-only clone; no foreman operator stack |
| `C:\Users\benle\Desktop\Werkles_DIRTY_BACKUP` | Yes | Stale snapshot |
| `C:\Users\benle\Desktop` | Yes (filename patterns) | Desktop shortcut found |
| `C:\Users\benle\Documents` | Partial | `Documents\Werkles` stale copy; full Documents content scan timed out |
| `C:\Users\benle\Downloads` | Yes | Operator/cockpit markdown exports |
| `AppData\Roaming` / `Local` | Shallow (depth 6) | No BLDer/Gimp Dash filename hits |

---

*Inventory only. No files were moved, edited (except this report), staged, committed, or pushed.*
