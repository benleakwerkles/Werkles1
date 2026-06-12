# FROM_MAKER_CONCIERGE_CONSOLE_V1

Date: 2026-06-12
Author: Maker (Cursor) · EXECUTION_CONTEXT: CURSOR_CLOUD_CONTAINER
Type: design only. Human-operated only. No AI, no automation, no matching engine.
Companion to: `FROM_MAKER_WOZ_OPERATOR_CONSOLE_V1.md` (that doc = the *structure*; this doc = the *minimum software support*).

## Question

If Ben manually runs Opportunity Discovery for 20 users, what is the **minimum software support** needed?

## Principle

Software here does exactly three jobs and nothing more: **capture, store, surface.** It never decides, scores, matches, or messages. Ben makes every judgment. The software just keeps 20 users from falling through the cracks.

## The four capabilities × minimum software

### 1. Intake capture
- **Job:** turn a user's answers into one stored record.
- **Minimum software:** a single form that writes one record per submission.
  - No-build: a **Google/Tally form** → one row per user.
  - Repo-local: a fixed **intake template** Ben fills per user → one markdown/JSON file in a `discovery/` folder.
- **Not software's job:** parsing, interpreting, or routing the answers.

### 2. Bottleneck worksheet
- **Job:** give Ben structured fields to record his read (translated need, primary bottleneck, why, confidence).
- **Minimum software:** editable fields attached to the user record — sheet columns, or a section in the record file. That's it.
- **Not software's job:** suggesting or computing the bottleneck.

### 3. Recommendation record
- **Job:** store the delivered recommendation in a fixed shape so it's consistent and reviewable.
- **Minimum software:** a recommendation block on the record (primary = best next path; supporting = person/resource/tool if needed; visible reasons; "not claiming" line; sent date).
- **Not software's job:** generating the recommendation or sending it (Ben sends manually).

### 4. Outcome tracking
- **Job:** track state + result across all 20 so Ben knows who needs the next touch.
- **Minimum software:** a **state field** (reusing the SoleDash six states) + outcome fields (acted? / felt-right? / disposition / next-touch date), and a **board view** that lists all 20 sorted by state/next-touch.
- **Not software's job:** reminders/automation (Ben drives the next touch).

## Record schema (one per user)

```
user_id, name, contact, intake_date
intake: { situation, goal, why_now, assets[], stated_blocker, tried, constraints, one_thing, lane }
worksheet: { translated_need[], primary_bottleneck, why, confidence }
recommendation: { primary_path, supporting?, reasons, not_claiming, sent_date }
outcome: { state, acted, felt_right, result, disposition, next_touch }
```

`state` ∈ Received | Thinking | Blocked | Response Incoming | Complete | Failed.
`disposition` ∈ Win | Partial | No-fit | Dropped | Awaiting.

## Minimum stack — ranked (all human-operated)

1. **No-build (recommended to start): Form + Sheet.**
   - Intake = Google/Tally form → Sheet (one row per user).
   - Sheet = the board *and* the worksheet/recommendation/outcome columns.
   - Zero code, instant, perfect for 20. Software support = the form + the sheet.

2. **Repo-local files + SoleDash board (display).**
   - One record file per user in a `discovery/` (or `foreman/handoffs/`) folder.
   - The **existing SoleDash console** (read-only, file-derived, already built) renders the 20-row board; the status sidecar sets each user's state.
   - Ben edits records by hand; SoleDash only displays. No new write-software needed.

3. **Thin local concierge tool (only if forms-in-app are wanted).**
   - A small local web tool (same shape as the SoleDash Node server) adds simple **intake + edit forms** that save records to local files.
   - This is the *only* option that adds write-software, and even then it just persists what Ben types — no decisions.
   - Build this **only** if the form+sheet proves too clunky at 20.

**Recommendation:** start at **#1 (Form + Sheet)**. It is the true minimum software support. Graduate to #2 for a nicer board, or #3 only if Ben specifically wants in-app capture.

## What NOT to build (yet)

- No AI / scoring / matching engine.
- No auto-intake parsing or auto-translation.
- No accounts, auth, payments, or verification.
- No notifications/reminders/automation.
- No CRM or email integration.
- No custom app if a form + sheet covers it.

## Boundaries honored

Human-operated only. No AI, no automation, no matching engine. Software = capture, store, surface — Ben decides everything.
