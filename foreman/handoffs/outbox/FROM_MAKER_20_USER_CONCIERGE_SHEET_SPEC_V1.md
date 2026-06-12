# FROM_MAKER_20_USER_CONCIERGE_SHEET_SPEC_V1

Date: 2026-06-12
Author: Maker (Cursor) · EXECUTION_CONTEXT: CURSOR_CLOUD_CONTAINER
Type: spec only. No app, no code, no automation, no AI scoring. Human-operated.

## Overview

Exact structure for the 20-user concierge test as a **Google Sheet** (5 tabs) or **Airtable** (5 tables). One row per user per tab. **`user_id` is the key** that links all tabs (in Airtable, use linked records; in Sheets, match on `user_id`, optional `VLOOKUP`).

State values (shared, reuse SoleDash): `Received | Thinking | Blocked | Response Incoming | Complete | Failed`.

> The **Metrics** tab uses plain spreadsheet aggregations (COUNTIF/COUNTA). That is counting, not scoring or AI.

---

## Tab 1 — Intake

| Column | Type | Req | Allowed values | Example |
|--------|------|-----|----------------|---------|
| user_id | Text (key) | Required | `U01`–`U20` | U01 |
| intake_date | Date | Required | date | 2026-06-12 |
| name | Text | Required | free | Dana R. |
| contact | Text | Required | email/phone | dana@example.com |
| situation | Long text | Required | free | "Run a 2-person landscaping crew, want to expand but stuck." |
| goal | Long text | Required | free | "Add a second crew in 6 months." |
| why_now | Long text | Optional | free | "Lost a big client; need to diversify." |
| assets | Multi-select | Required | Skills, Time, Money, Network, Tools, Customers, Place, Idea | Skills; Tools; Customers |
| stated_blocker | Long text | Required | free | "Not enough cash to hire." |
| tried | Long text | Optional | free | "Asked my bank, denied." |
| constraints | Long text | Optional | free | "Local only; <$5k to start." |
| one_thing | Text | Required | free | "A reliable second foreman." |
| lane | Single select | Optional | Builder, Operator, Backer, Connector, Spark, Unsure | Operator |
| response_speed | Single select | Optional | ASAP, Few days, No rush | Few days |
| notes | Long text | Optional | free | — |

Example row: `U01 | 2026-06-12 | Dana R. | dana@example.com | "...stuck" | "second crew" | "lost client" | Skills;Tools;Customers | "not enough cash" | "bank denied" | "local; <$5k" | "reliable second foreman" | Operator | Few days | —`

---

## Tab 2 — Bottleneck Review (reviewer-filled)

| Column | Type | Req | Allowed values | Example |
|--------|------|-----|----------------|---------|
| user_id | Text (key) | Required | `U01`–`U20` | U01 |
| reviewer | Text | Required | free | Ben |
| review_date | Date | Required | date | 2026-06-12 |
| situation_restated | Long text | Required | free | "Capacity-constrained crew; growth blocked by labor, not demand." |
| translated_need | Multi-select | Required | Partner, Capital, Customer, Skill, License, Intro, Validation, Clarity, Other | Partner; Clarity |
| stated_vs_real_mismatch | Single select | Optional | Yes, No, Partial | Yes |
| primary_bottleneck | Long text | Required | free | "No trustworthy second-in-command (not cash)." |
| bottleneck_why | Long text | Required | free | "Has customers + tools; the limiter is delegation/labor." |
| confidence | Single select | Required | High, Medium, Low | Medium |
| notes | Long text | Optional | free | — |

Example row: `U01 | Ben | 2026-06-12 | "capacity-constrained..." | Partner;Clarity | Yes | "needs a second foreman, not cash" | "has customers+tools" | Medium | —`

---

## Tab 3 — Recommendation

| Column | Type | Req | Allowed values | Example |
|--------|------|-----|----------------|---------|
| user_id | Text (key) | Required | `U01`–`U20` | U01 |
| primary_path | Long text | Required | free (one best next path) | "Hire/partner a working foreman before adding a crew." |
| supporting_type | Single select | Optional | Person, Resource, Tool, None | Person |
| supporting_detail | Long text | Optional | free | "Intro to 2 vetted crew leads in your area." |
| reasons | Long text | Required | free (visible reasons) | "You have demand + tools; the constraint is trusted labor." |
| not_claiming | Long text | Required | free | "We're not vouching for any candidate; you vet them." |
| sent_date | Date | Required | date | 2026-06-13 |
| delivery_method | Single select | Required | Email, Call, Chat, In-person | Email |

Example row: `U01 | "hire a working foreman first" | Person | "intro to 2 crew leads" | "demand+tools present; labor is the limit" | "not vouching; you vet" | 2026-06-13 | Email`

---

## Tab 4 — Outcome Tracking

| Column | Type | Req | Allowed values | Example |
|--------|------|-----|----------------|---------|
| user_id | Text (key) | Required | `U01`–`U20` | U01 |
| state | Single select | Required | Received, Thinking, Blocked, Response Incoming, Complete, Failed | Response Incoming |
| acted | Single select | Required | Yes, No, Partial, Pending | Pending |
| acted_date | Date | Optional | date | — |
| felt_right | Single select | Optional | Yes, No, Partial, Unknown | Yes |
| result | Long text | Optional | free | "Took both intros; one meeting booked." |
| disposition | Single select | Required | Win, Partial, No-fit, Dropped, Awaiting | Awaiting |
| next_touch_date | Date | Optional | date | 2026-06-18 |
| follow_up_notes | Long text | Optional | free | "Check if meeting happened." |

Example row: `U01 | Response Incoming | Pending | — | Yes | "took intros" | Awaiting | 2026-06-18 | "check meeting"`

---

## Tab 5 — Metrics (plain aggregations, no scoring)

One row per metric. `value` uses simple formulas over the other tabs.

| metric_name | Type | Definition / formula sketch | Example |
|-------------|------|------------------------------|---------|
| intake_count | Number | `COUNTA(Intake.user_id)` | 20 |
| recs_sent | Number | `COUNTA(Recommendation.sent_date)` | 17 |
| intake_completion_rate | Percent | recs-eligible intakes complete ÷ started | 100% |
| delivery_rate | Percent | recs_sent ÷ intake_count | 85% |
| feels_right_rate | Percent | `COUNTIF(Outcome.felt_right,"Yes") ÷ recs_sent` | 71% |
| action_taken_rate | Percent | `COUNTIF(Outcome.acted,"Yes") ÷ recs_sent` | 47% |
| win_rate | Percent | `COUNTIF(Outcome.disposition,"Win") ÷ recs_sent` | 18% |
| partial_rate | Percent | `COUNTIF(Outcome.disposition,"Partial") ÷ recs_sent` | 24% |
| no_fit_rate | Percent | `COUNTIF(Outcome.disposition,"No-fit") ÷ recs_sent` | 12% |
| dropped_rate | Percent | `COUNTIF(Outcome.disposition,"Dropped") ÷ recs_sent` | 18% |
| failed_to_recommend | Number | `COUNTIF(Outcome.state,"Failed")` | 1 |
| median_time_to_rec_days | Number | median(sent_date − intake_date) (manual or `MEDIAN`) | 1 |

Example row: `feels_right_rate | Percent | COUNTIF(Outcome.felt_right,"Yes")/recs_sent | 71%`

---

## Setup notes (human-operated)

- **Google Sheets:** 5 tabs named exactly as above; `user_id` typed consistently; Metrics uses `COUNTIF`/`COUNTA`/`MEDIAN`. Intake can be fed by a Google Form (one response = one row) — still human-operated; no scripts.
- **Airtable:** 5 tables; link Bottleneck/Recommendation/Outcome to Intake via a linked `user_id`; Metrics via roll-ups/counts.
- Single-select/multi-select values should be locked to the allowed lists (data validation) to keep metrics clean.
- No automation, no AI, no scoring — the only computed cells are count/percentage aggregations on the Metrics tab.

## Boundaries honored

Spec only. No app, no code, no automation, no AI scoring. Human-operated.
