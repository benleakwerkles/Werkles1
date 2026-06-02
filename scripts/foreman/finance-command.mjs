#!/usr/bin/env node
/**
 * Finance Command Module v0.1 — local operator spend tracker
 * Not a bank app. Does not move money. Does not store secrets.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = "C:\\Users\\benle\\Desktop\\github\\Werkles";
const FINANCE_DIR = path.join(REPO_ROOT, "foreman", "finance");

const FILES = {
  entities: path.join(FINANCE_DIR, "entities.json"),
  buckets: path.join(FINANCE_DIR, "spend-buckets.json"),
  rails: path.join(FINANCE_DIR, "payment-rails.json"),
  rules: path.join(FINANCE_DIR, "mismatch-rules.json"),
  ledger: path.join(FINANCE_DIR, "spend-ledger.json"),
  reimbursement: path.join(FINANCE_DIR, "reimbursement-queue.json"),
  recurring: path.join(FINANCE_DIR, "recurring-saas.json"),
  dashboard: path.join(FINANCE_DIR, "finance-dashboard.json"),
};

const FORBIDDEN_FIELD_PATTERN = /(password|secret|api[_-]?key|routing|account_number|card_number|cvv|ssn|token)/i;
const FULL_CARD_PATTERN = /\b(?:\d[ -]*?){13,19}\b/;
const FORBIDDEN_KEYS = new Set([
  "password",
  "secret",
  "api_key",
  "apiKey",
  "routing_number",
  "account_number",
  "card_number",
  "cvv",
  "bank_token",
  "access_token",
  "refresh_token",
]);

function readJson(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing: ${filePath}`);
  let raw = fs.readFileSync(filePath, "utf8");
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  return JSON.parse(raw);
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function loadFinanceBundle() {
  return {
    entities: readJson(FILES.entities),
    buckets: readJson(FILES.buckets),
    rails: readJson(FILES.rails),
    rules: readJson(FILES.rules),
    ledger: readJson(FILES.ledger),
    reimbursement: readJson(FILES.reimbursement),
    recurring: readJson(FILES.recurring),
  };
}

function entityMap(bundle) {
  const map = new Map();
  for (const e of bundle.entities.entities) map.set(e.id, e.display_name);
  return map;
}

function bucketMap(bundle) {
  const map = new Map();
  for (const b of bundle.buckets.buckets) map.set(b.id, b.display_name);
  return map;
}

function parseMonth(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function currentMonthKey() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function entriesThisMonth(entries) {
  const month = currentMonthKey();
  return entries.filter((e) => parseMonth(e.date) === month);
}

function sumByEntity(entries, emap) {
  const totals = {};
  for (const e of entries) {
    const key = e.actual_entity || "unknown";
    totals[key] = (totals[key] || 0) + Number(e.amount || 0);
  }
  return Object.entries(totals)
    .map(([id, amount]) => ({ entity_id: id, entity_name: emap.get(id) || id, amount_usd: round2(amount) }))
    .sort((a, b) => b.amount_usd - a.amount_usd);
}

function sumByBucket(entries, bmap) {
  const totals = {};
  for (const e of entries) {
    const key = e.spend_bucket || "unknown";
    totals[key] = (totals[key] || 0) + Number(e.amount || 0);
  }
  return Object.entries(totals)
    .map(([id, amount]) => ({ bucket_id: id, bucket_name: bmap.get(id) || id, amount_usd: round2(amount) }))
    .sort((a, b) => b.amount_usd - a.amount_usd);
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function kindSirIds(bundle) {
  return bundle.entities.entities.filter((e) => e.group === "kind_sir").map((e) => e.id);
}

function valleyIds(bundle) {
  return bundle.entities.entities.filter((e) => e.group === "valley").map((e) => e.id);
}

function evaluateMismatch(entry, rule, bundle, thresholds) {
  const m = rule.match || {};
  const amount = Number(entry.amount || 0);

  if (m.spend_buckets && !m.spend_buckets.includes(entry.spend_bucket)) return null;
  if (m.actual_entities && !m.actual_entities.includes(entry.actual_entity)) return null;
  if (m.expected_entity && entry.expected_entity && entry.expected_entity !== m.expected_entity) {
    /* ok - check actual vs expected below */
  }
  if (m.expected_entities && !m.expected_entities.includes(entry.expected_entity)) return null;

  if (m.expected_entity && entry.actual_entity !== m.expected_entity) {
    if (m.spend_buckets?.includes(entry.spend_bucket)) {
      return { rule_id: rule.id, severity: rule.severity, message: rule.description, entry_id: entry.id };
    }
  }

  if (m.spend_buckets && m.actual_entities) {
    if (m.spend_buckets.includes(entry.spend_bucket) && m.actual_entities.includes(entry.actual_entity)) {
      return { rule_id: rule.id, severity: rule.severity, message: rule.description, entry_id: entry.id };
    }
  }

  if (m.expected_entity_prefix === "kind_sir_") {
    const ksBuckets = ["construction_real_estate", "admin_overhead"];
    if (ksBuckets.includes(entry.spend_bucket) && entry.actual_entity === "werkles") {
      return { rule_id: rule.id, severity: rule.severity, message: rule.description, entry_id: entry.id };
    }
  }

  if (m.actual_entities?.includes("werkles") && m.expected_entities) {
    if (entry.spend_bucket === "rd" && entry.actual_entity === "werkles") {
      return { rule_id: rule.id, severity: rule.severity, message: rule.description, entry_id: entry.id };
    }
  }

  if (m.reimbursable === true && entry.reimbursable && entry.actual_entity === "ben_personal") {
    if (m.status_not && entry.status === m.status_not) return null;
    return { rule_id: rule.id, severity: rule.severity, message: rule.description, entry_id: entry.id };
  }

  if (m.any_unknown) {
    if (entry.actual_entity === "unknown" || entry.spend_bucket === "unknown" || !entry.merchant) {
      return { rule_id: rule.id, severity: rule.severity, message: rule.description, entry_id: entry.id };
    }
  }

  if (m.recurring && entry.recurring && m.spend_buckets?.includes(entry.spend_bucket)) {
    if (m.actual_entities?.includes(entry.actual_entity)) {
      return { rule_id: rule.id, severity: rule.severity, message: rule.description, entry_id: entry.id };
    }
  }

  if (m.amount_gte_threshold) {
    const threshold = thresholds[m.amount_gte_threshold] ?? thresholds[m.amount_gte_threshold.replace("_usd", "")];
    if (threshold != null && amount >= threshold) {
      if (m.spend_buckets?.includes(entry.spend_bucket)) {
        return { rule_id: rule.id, severity: rule.severity, message: rule.description, entry_id: entry.id, amount };
      }
      if (m.actual_entities?.includes(entry.actual_entity)) {
        return { rule_id: rule.id, severity: rule.severity, message: rule.description, entry_id: entry.id, amount };
      }
    }
  }

  return null;
}

function computeMismatchWarnings(bundle) {
  const thresholds = bundle.rules.thresholds || {};
  const warnings = [];
  const seen = new Set();
  for (const entry of bundle.ledger.entries) {
    for (const rule of bundle.rules.rules) {
      const hit = evaluateMismatch(entry, rule, bundle, thresholds);
      if (hit) {
        const key = `${hit.rule_id}:${hit.entry_id}`;
        if (!seen.has(key)) {
          seen.add(key);
          warnings.push({ ...hit, merchant: entry.merchant, date: entry.date, amount: entry.amount });
        }
      }
    }
  }
  return warnings;
}

function needsClassification(entries) {
  return entries.filter(
    (e) =>
      e.status === "needs_classification" ||
      e.status === "draft" ||
      e.actual_entity === "unknown" ||
      e.spend_bucket === "unknown"
  );
}

function aiApiSpendMonth(entries) {
  return round2(
    entriesThisMonth(entries)
      .filter((e) => ["ai_api", "image_generation"].includes(e.spend_bucket))
      .reduce((s, e) => s + Number(e.amount || 0), 0)
  );
}

function recurringNeedingReview(bundle) {
  const interval = bundle.rules.thresholds?.recurring_review_interval_days || 30;
  const now = Date.now();
  return (bundle.recurring.subscriptions || []).filter((s) => {
    if (!s.last_reviewed_at) return true;
    const last = new Date(s.last_reviewed_at).getTime();
    return Number.isNaN(last) || now - last > interval * 86400000;
  });
}

function buildDashboard(bundle) {
  const emap = entityMap(bundle);
  const bmap = bucketMap(bundle);
  const monthEntries = entriesThisMonth(bundle.ledger.entries);
  const warnings = computeMismatchWarnings(bundle);
  const unclassified = needsClassification(bundle.ledger.entries);
  const reimbQueue = bundle.reimbursement.queue || [];
  const recurringReview = recurringNeedingReview(bundle);

  return {
    version: "0.1",
    generated_at: new Date().toISOString(),
    month: currentMonthKey(),
    doctrine: {
      module: "local_operator_cockpit",
      not_bank_connection: true,
      not_accounting_finalization: true,
      does_not_move_money: true,
      does_not_create_cards: true,
      no_account_or_card_secrets: true,
      no_secrets_in_repo: true,
    },
    month_to_date_by_entity: sumByEntity(monthEntries, emap),
    spend_by_bucket: sumByBucket(monthEntries, bmap),
    ai_api_spend_this_month_usd: aiApiSpendMonth(bundle.ledger.entries),
    unclassified_count: unclassified.length,
    needs_classification: unclassified.map((e) => ({
      id: e.id,
      date: e.date,
      merchant: e.merchant,
      amount: e.amount,
      status: e.status,
    })),
    mismatch_warnings: warnings,
    mismatch_warning_count: warnings.length,
    reimbursement_queue: reimbQueue,
    reimbursement_queue_count: reimbQueue.length,
    recurring_saas: bundle.recurring.subscriptions || [],
    recurring_saas_needing_review: recurringReview,
    recurring_saas_review_count: recurringReview.length,
    human_gates: [
      "create bank account",
      "create virtual card",
      "change billing method",
      "pay vendor",
      "transfer funds",
      "submit reimbursement",
      "classify final legal/tax treatment",
      "connect/reconnect financial accounts",
      "import real bank data from new source",
      "store any secret or full account/card number",
    ],
    thresholds: bundle.rules.thresholds,
  };
}

function scanForSecrets(obj, pathParts = []) {
  const issues = [];
  if (obj == null) return issues;
  if (typeof obj === "string") {
    if (FULL_CARD_PATTERN.test(obj.replace(/\./g, ""))) {
      issues.push(`Possible full card/account number at ${pathParts.join(".")}`);
    }
    if (FORBIDDEN_FIELD_PATTERN.test(pathParts[pathParts.length - 1] || "") && obj.length > 4) {
      issues.push(`Forbidden field name with value at ${pathParts.join(".")}`);
    }
    return issues;
  }
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => issues.push(...scanForSecrets(item, [...pathParts, String(i)])));
    return issues;
  }
  if (typeof obj === "object") {
    for (const [key, value] of Object.entries(obj)) {
      if (FORBIDDEN_KEYS.has(key)) {
        issues.push(`Forbidden key: ${[...pathParts, key].join(".")}`);
      }
      issues.push(...scanForSecrets(value, [...pathParts, key]));
    }
  }
  return issues;
}

function validateFinance() {
  const bundle = loadFinanceBundle();
  const errors = [];
  const warnings = [];

  const requiredEntities = [
    "kind_sir_holdings",
    "kind_sir_corporate",
    "kind_sir_real_estate",
    "kind_sir_concrete",
    "kind_sir_insulation",
    "valley_vanguard",
    "valley_microfutures",
    "werkles",
    "ben_personal",
    "unknown",
  ];
  const entityIds = bundle.entities.entities.map((e) => e.id);
  for (const id of requiredEntities) {
    if (!entityIds.includes(id)) errors.push(`Missing entity: ${id}`);
  }

  const requiredBuckets = [
    "ai_api",
    "image_generation",
    "saas_tools",
    "legal_formation",
    "trademark_ip",
    "hosting_infra",
    "domain_email_workspace",
    "rd",
    "marketing_assets",
    "construction_real_estate",
    "admin_overhead",
    "unknown",
  ];
  const bucketIds = bundle.buckets.buckets.map((b) => b.id);
  for (const id of requiredBuckets) {
    if (!bucketIds.includes(id)) errors.push(`Missing bucket: ${id}`);
  }

  for (const rail of bundle.rails.rails) {
    for (const field of ["id", "display_name", "entity_owner", "rail_type", "masked_identifier", "status"]) {
      if (rail[field] == null || rail[field] === "") warnings.push(`Rail ${rail.id}: missing ${field}`);
    }
  }

  for (const file of Object.values(FILES)) {
    if (!fs.existsSync(file)) continue;
    const data = readJson(file);
    errors.push(...scanForSecrets(data));
  }

  for (const entry of bundle.ledger.entries) {
    for (const field of [
      "id",
      "date",
      "merchant",
      "amount",
      "currency",
      "actual_entity",
      "spend_bucket",
      "status",
    ]) {
      if (entry[field] == null || entry[field] === "") {
        warnings.push(`Ledger ${entry.id}: missing ${field}`);
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

function addSampleRows() {
  const ledger = readJson(FILES.ledger);
  if (ledger.entries.length > 0) {
    console.log("spend-ledger.json already has entries — skipping add-sample");
    return false;
  }

  const samples = [
    {
      id: "sample-001",
      date: "2026-05-15",
      merchant: "SAMPLE — OpenAI API",
      amount: 42.5,
      currency: "USD",
      source_account_label: "unknown_current_business_card",
      source_account_mask: "...XXXX",
      actual_entity: "werkles",
      expected_entity: "werkles",
      spend_bucket: "ai_api",
      project: "werkles",
      lane: "lane-ghost-forge-batch-asset-generation",
      recurring: false,
      reimbursable: false,
      needs_cpa_review: false,
      needs_legal_review: false,
      status: "classified",
      notes: "SAMPLE ROW — fake data for module test",
    },
    {
      id: "sample-002",
      date: "2026-05-18",
      merchant: "SAMPLE — Render hosting",
      amount: 7.0,
      currency: "USD",
      source_account_label: "unknown_current_business_card",
      source_account_mask: "...XXXX",
      actual_entity: "werkles",
      expected_entity: "werkles",
      spend_bucket: "hosting_infra",
      project: "werkles",
      lane: "morale-deploy",
      recurring: true,
      reimbursable: false,
      needs_cpa_review: false,
      needs_legal_review: false,
      status: "classified",
      notes: "SAMPLE ROW — fake data",
    },
    {
      id: "sample-003",
      date: "2026-05-20",
      merchant: "SAMPLE — Claude API on wrong entity",
      amount: 89.0,
      currency: "USD",
      source_account_label: "kind_sir_admin_card_planned",
      source_account_mask: "planned",
      actual_entity: "kind_sir_corporate",
      expected_entity: "werkles",
      spend_bucket: "ai_api",
      project: "werkles",
      lane: "crew-checkin",
      recurring: false,
      reimbursable: true,
      needs_cpa_review: true,
      needs_legal_review: false,
      status: "needs_classification",
      notes: "SAMPLE ROW — triggers mismatch rule werkles_ai_on_wrong_entity",
    },
    {
      id: "sample-004",
      date: "2026-05-22",
      merchant: "SAMPLE — Unknown SaaS",
      amount: 299.0,
      currency: "USD",
      source_account_label: "unknown_current_business_card",
      source_account_mask: "...XXXX",
      actual_entity: "unknown",
      expected_entity: "werkles",
      spend_bucket: "unknown",
      project: "unknown",
      lane: "unknown",
      recurring: true,
      reimbursable: false,
      needs_cpa_review: true,
      needs_legal_review: false,
      status: "needs_classification",
      notes: "SAMPLE ROW — triggers large unknown bucket warning",
    },
  ];

  ledger.entries = samples;
  writeJson(FILES.ledger, ledger);

  const recurring = readJson(FILES.recurring);
  recurring.subscriptions = [
    {
      id: "sample-saas-001",
      name: "SAMPLE — GitHub Pro",
      entity_owner: "werkles",
      spend_bucket: "saas_tools",
      amount_usd: 4.0,
      billing_cycle: "monthly",
      last_reviewed_at: null,
      notes: "SAMPLE — needs review",
    },
  ];
  writeJson(FILES.recurring, recurring);

  const reimb = readJson(FILES.reimbursement);
  reimb.queue = [
    {
      id: "sample-reimb-001",
      ledger_entry_id: "sample-003",
      from_entity: "ben_personal",
      to_entity: "werkles",
      amount_usd: 89.0,
      status: "draft",
      notes: "SAMPLE — does not submit reimbursement",
    },
  ];
  writeJson(FILES.reimbursement, reimb);

  console.log(`Added ${samples.length} sample ledger rows (clearly marked SAMPLE)`);
  return true;
}

function summarize() {
  const bundle = loadFinanceBundle();
  const emap = entityMap(bundle);
  const dashboard = buildDashboard(bundle);

  console.log("");
  console.log("=== Finance Command v0.1 — summarize ===");
  console.log(`Month: ${dashboard.month}`);
  console.log("");
  console.log("Month-to-date by entity:");
  if (dashboard.month_to_date_by_entity.length === 0) console.log("  (no entries this month)");
  for (const row of dashboard.month_to_date_by_entity) {
    console.log(`  ${row.entity_name}: $${row.amount_usd}`);
  }
  console.log("");
  console.log(`AI/API spend this month: $${dashboard.ai_api_spend_this_month_usd}`);
  console.log(`Unclassified / needs work: ${dashboard.unclassified_count}`);
  console.log(`Mismatch warnings: ${dashboard.mismatch_warning_count}`);
  console.log(`Reimbursement queue: ${dashboard.reimbursement_queue_count}`);
  console.log(`Recurring SaaS needing review: ${dashboard.recurring_saas_review_count}`);
  console.log("");
  if (dashboard.mismatch_warnings.length) {
    console.log("Top mismatch warnings:");
    for (const w of dashboard.mismatch_warnings.slice(0, 8)) {
      console.log(`  [${w.severity}] ${w.message} — ${w.merchant || w.entry_id} $${w.amount ?? ""}`);
    }
  }
  console.log("");
  console.log("Human gates: this module does NOT move money or store secrets.");
}

function dashboardJson() {
  const bundle = loadFinanceBundle();
  const dashboard = buildDashboard(bundle);
  writeJson(FILES.dashboard, dashboard);
  console.log(`Wrote ${FILES.dashboard}`);
  return dashboard;
}

const command = process.argv[2] || "summarize";

switch (command) {
  case "summarize":
    summarize();
    break;
  case "add-sample":
    addSampleRows();
    break;
  case "validate": {
    const result = validateFinance();
    console.log(result.ok ? "VALIDATION OK" : "VALIDATION FAILED");
    for (const e of result.errors) console.log(`  ERROR: ${e}`);
    for (const w of result.warnings) console.log(`  WARN: ${w}`);
    process.exit(result.ok ? 0 : 1);
    break;
  }
  case "dashboard-json":
    dashboardJson();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.error("Usage: summarize | add-sample | validate | dashboard-json");
    process.exit(1);
}
