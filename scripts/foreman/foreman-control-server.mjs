#!/usr/bin/env node
/**
 * Foreman Control Panel — SoleDash local console.
 * (Naming: "SoleDash" is the visible UI name. "GD" is legacy/internal shorthand only.
 *  "GimpDash" is deprecated and should not appear in visible UI.)
 *
 * Serves a read-only "Human Gates Console" at http://127.0.0.1:4317 so the
 * Operator can click directly into APP_INFRA preview routes, repo/PRs, and
 * provider dashboards.
 *
 * SAFETY (by construction):
 *   - Read-only. Renders static HTML from the data model below.
 *   - No secrets are read, printed, or stored. No links carry tokens.
 *   - No provider API calls. No deploy/push/SQL. No shell exec.
 *   - Clicking a link only opens a dashboard/route in the browser; it never
 *     performs the gated action.
 *
 * Run (locally, on Sally/Betsy):
 *   node scripts/foreman/foreman-control-server.mjs
 *   # then open http://127.0.0.1:4317
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HOST = "127.0.0.1";
const PORT = Number(process.env.FOREMAN_CONTROL_PORT || 4317);

// Repo root (this file is at scripts/foreman/). Used for the file-derived
// SoleDash Inbox/Outbox feed. Read-only.
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUTBOX_DIR = path.join(REPO_ROOT, "foreman", "handoffs", "outbox");
const INBOX_DIR = path.join(REPO_ROOT, "foreman", "handoffs", "inbox");
// Optional, read-only status sidecar: { "<packet filename>": "Complete" | ... }.
// Lets the operator/feed set real states without routing or automation.
const STATUS_SIDECAR = path.join(REPO_ROOT, "foreman", "handoffs", "soledash-status.json");

// Gate types -> badge styling
//   SAFE_LINK  : open/read only
//   HUMAN_GATE : opening is fine, but changing settings/taking the action is a Ben-only gate
//   BLOCKED    : do not perform from this dashboard
const GATE = { SAFE: "SAFE_LINK", GATE: "HUMAN_GATE", BLOCKED: "BLOCKED" };

const sections = [
  {
    title: "APP_INFRA Review",
    note: "Local preview routes (require the dev server: npm run dev on the build machine).",
    cards: [
      { name: "Homepage preview", href: "http://localhost:3000/", purpose: "Home surface review", gate: GATE.SAFE, exact: true, openSafe: true, status: "route present" },
      { name: "Pricing preview", href: "http://localhost:3000/pricing", purpose: "Pricing surface review", gate: GATE.SAFE, exact: true, openSafe: true, status: "route present" },
      { name: "Membership preview", href: "http://localhost:3000/membership", purpose: "Membership surface review", gate: GATE.SAFE, exact: true, openSafe: true, status: "route present" },
      { name: "Crucible preview", href: "http://localhost:3000/dashboard/crucible", purpose: "Crucible verification UX review", gate: GATE.SAFE, exact: true, openSafe: true, status: "route present" },
      { name: "Billing preview", href: "http://localhost:3000/dashboard/billing", purpose: "Billing shell review", gate: GATE.SAFE, exact: true, openSafe: true, status: "route present" },
      { name: "Login preview", href: "http://localhost:3000/login", purpose: "Auth surface review", gate: GATE.SAFE, exact: true, openSafe: true, status: "route present" },
      { name: "Proof preview", href: "http://localhost:3000/proof", purpose: "Trust/Crucible explainer review", gate: GATE.SAFE, exact: true, openSafe: true, status: "route present" },
      { name: "Bellows preview", href: "http://localhost:3000/bellows", purpose: "Bellows surface review", gate: GATE.SAFE, exact: true, openSafe: true, status: "route NOT present yet (expect 404)" },
      { name: "Review packet", path: "foreman/reviews/APP_INFRA_01_FUNCTIONAL_SURFACE_REVIEW.md", purpose: "APP_INFRA-01 functional surface review packet", gate: GATE.SAFE, exact: true, openSafe: false, status: "file NOT created yet" }
    ]
  },
  {
    title: "Repo / PRs",
    cards: [
      { name: "GitHub repo", href: "https://github.com/benleakwerkles/Werkles1", purpose: "Canonical source of truth", gate: GATE.SAFE, exact: true, openSafe: true, status: "main" },
      { name: "Pull requests", href: "https://github.com/benleakwerkles/Werkles1/pulls", purpose: "All PRs", gate: GATE.SAFE, exact: true, openSafe: true, status: "open list" },
      { name: "PR #3 — Atlas", href: "https://github.com/benleakwerkles/Werkles1/pull/3", purpose: "Atlas machine role", gate: GATE.SAFE, exact: true, openSafe: true, status: "MERGED" },
      { name: "PR #4 — NEXT_ACTION cleanup", href: "https://github.com/benleakwerkles/Werkles1/pull/4", purpose: "Post-merge cockpit cleanup", gate: GATE.SAFE, exact: true, openSafe: true, status: "MERGED" }
    ]
  },
  {
    title: "Deploy / Hosting",
    note: "Opening a dashboard is allowed. Changing settings may be a human gate.",
    cards: [
      { name: "Vercel dashboard", href: "https://vercel.com/dashboard", purpose: "Hosting/deploys overview", gate: GATE.GATE, exact: false, openSafe: true, status: "generic link — provider may require login" },
      { name: "Vercel project settings", href: "https://vercel.com/dashboard", purpose: "Open Vercel project \u2192 Settings", gate: GATE.GATE, exact: false, openSafe: true, status: "generic — navigate to the Werkles project" },
      { name: "Vercel Git settings / notifications", path: "open Vercel project \u2192 Settings \u2192 Git", purpose: "Git integration / notification cleanup", gate: GATE.GATE, exact: false, openSafe: false, status: "navigate manually; settings change = human gate" },
      { name: "Werkles live site", href: "https://werkles.com", purpose: "Production site", gate: GATE.SAFE, exact: true, openSafe: true, status: "live (read-only view)" }
    ]
  },
  {
    title: "Ghost Forge / Render",
    note: "Opening Render is allowed. Redeploy and env changes are human gates.",
    cards: [
      { name: "Render dashboard", href: "https://dashboard.render.com/", purpose: "Open Render \u2192 werkles-ghost-forge1", gate: GATE.GATE, exact: false, openSafe: true, status: "generic link — service: werkles-ghost-forge1" },
      { name: "Render redeploy / env", path: "Render \u2192 werkles-ghost-forge1 \u2192 Settings/Environment", purpose: "Redeploy or change env vars", gate: GATE.BLOCKED, exact: false, openSafe: false, status: "human gate — do not change from this console" }
    ]
  },
  {
    title: "Supabase",
    note: "Opening Supabase is allowed. SQL/schema/RLS/auth/provider/secrets are human gates.",
    cards: [
      { name: "Supabase dashboard", href: "https://supabase.com/dashboard", purpose: "Open project (read-only browsing)", gate: GATE.GATE, exact: false, openSafe: true, status: "generic link — provider may require login" },
      { name: "SQL / schema / RLS / auth", path: "Supabase \u2192 SQL editor / Auth / Policies", purpose: "Schema, RLS, auth, secrets", gate: GATE.BLOCKED, exact: false, openSafe: false, status: "human gate — do not apply from this console" }
    ]
  },
  {
    title: "Stripe",
    note: "Opening Stripe is allowed. Live products, checkout, billing, webhooks, and secret entry are human gates.",
    cards: [
      { name: "Stripe dashboard", href: "https://dashboard.stripe.com/", purpose: "Overview (read-only browsing)", gate: GATE.GATE, exact: false, openSafe: true, status: "generic link — provider may require login" },
      { name: "Stripe products", href: "https://dashboard.stripe.com/products", purpose: "Product/price prep", gate: GATE.GATE, exact: false, openSafe: true, status: "generic — creating live products is a human gate" },
      { name: "Stripe webhooks", href: "https://dashboard.stripe.com/webhooks", purpose: "Webhook endpoints", gate: GATE.GATE, exact: false, openSafe: true, status: "generic — webhook/secret changes are human gates" }
    ]
  },
  {
    title: "Aeye / Crew",
    cards: [
      { name: "Foreman Control Panel", href: "http://127.0.0.1:4317", purpose: "This console (SoleDash)", gate: GATE.SAFE, exact: true, openSafe: true, status: "running" },
      { name: "Edge Aeye Crew Bay launcher", path: "(launcher status — not wired in repo)", purpose: "Crew bay launch status", gate: GATE.SAFE, exact: false, openSafe: false, status: "status only — not implemented in repo" },
      { name: "Outbox folder", path: "foreman/handoffs/outbox/", purpose: "Outbound crew packets", gate: GATE.SAFE, exact: true, openSafe: false, status: "path shown (local open not supported)" },
      { name: "Inbox folder", path: "foreman/handoffs/inbox/", purpose: "Inbound crew packets", gate: GATE.SAFE, exact: true, openSafe: false, status: "path shown (local open not supported)" }
    ]
  }
];

// --- GD Status Layer V1 (UI only) ---------------------------------------
// Lifecycle states a crew member / task can be in. V1 is sample data; wire to
// a real source later (e.g. a status file or relay feed) via STATUS_FEED.
const STATE = {
  RECEIVED: "Received",
  THINKING: "Thinking",
  BLOCKED: "Blocked",
  FAILED: "Failed",
  INCOMING: "Response Incoming",
  COMPLETE: "Complete"
};

// Sample status entries demonstrating each state. Replace/feed later.
const statusItems = [
  { actor: "Maker (Cursor)", state: STATE.COMPLETE, detail: "SoleDash Human Gates Console shipped" },
  { actor: "Status Layer", state: STATE.INCOMING, detail: "rendering live states" },
  { actor: "Petra (Comptroller)", state: STATE.THINKING, detail: "APP_INFRA slice verdict" },
  { actor: "Ghost Forge", state: STATE.BLOCKED, detail: "Gate 05 paused (28 remaining)" },
  { actor: "Codex (Foreman)", state: STATE.RECEIVED, detail: "awaiting next packet" },
  { actor: "Bellows", state: STATE.BLOCKED, detail: "source-preservation lane only" }
];

const STATE_META = {
  "Received":          { key: "received", fg: "#0a3a66", bg: "#cfe4fb", pulse: false },
  "Thinking":          { key: "thinking", fg: "#7a5200", bg: "#fbe6c5", pulse: true },
  "Blocked":           { key: "blocked",  fg: "#8a1f1f", bg: "#f7d6d6", pulse: false },
  "Failed":            { key: "failed",   fg: "#5a0f0f", bg: "#e9b8b8", pulse: false },
  "Response Incoming": { key: "incoming", fg: "#3a1f6e", bg: "#e3d6f7", pulse: true },
  "Complete":          { key: "complete", fg: "#1f7a3f", bg: "#d6f5e0", pulse: false }
};

function stateChip(state) {
  const m = STATE_META[state] || STATE_META["Received"];
  const cls = "state-chip state-" + m.key + (m.pulse ? " state-pulse" : "");
  return `<span class="${cls}" style="color:${m.fg};background:${m.bg}">${esc(state)}</span>`;
}

function statusSectionHtml() {
  const rows = statusItems.map((s) => `
      <div class="status-row">
        <span class="status-actor">${esc(s.actor)}</span>
        ${stateChip(s.state)}
        <span class="status-detail">${esc(s.detail || "")}</span>
      </div>`).join("");
  const legend = Object.keys(STATE_META).map((st) => stateChip(st)).join(" ");
  return `
    <section class="section status-layer">
      <h2>Status Layer</h2>
      <p class="section-note">Live crew/task states. V1 sample feed — UI only.</p>
      <div class="status-legend">${legend}</div>
      <div class="status-list">${rows}</div>
    </section>`;
}

// --- SoleDash Inbox / Outbox / Receipts V1 (read-only, file-derived) ----
// Lists packet files in foreman/handoffs/{outbox,inbox}. Metadata only — file
// BODIES ARE NEVER READ into the UI (secret-boundary discipline). States are
// V1 defaults (file-derived), not a live feed; labeled as such in the UI.
// Read-only status overrides from the optional sidecar JSON. Maps packet
// filename -> state. Invalid/missing file => no overrides.
function getStatusOverrides() {
  try {
    const raw = fs.readFileSync(STATUS_SIDECAR, "utf8");
    const obj = JSON.parse(raw);
    const valid = new Set(Object.values(STATE));
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (valid.has(v)) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

function readPacketDir(dir, kind) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const overrides = getStatusOverrides();
  return entries
    .filter((e) => e.isFile() && !e.name.startsWith(".") && /\.(md|txt)$/i.test(e.name))
    .map((e) => {
      const full = path.join(dir, e.name);
      let time = null;
      try { time = fs.statSync(full).mtime.toISOString(); } catch { /* ignore */ }
      const base = e.name.replace(/\.(md|txt)$/i, "");
      const m = base.match(/^(TO|FROM)_([A-Za-z0-9]+)/);
      const actor = m ? m[2] : "\u2014";
      // V1 default states: outbox "Received", inbox "Response Incoming";
      // overridden by the optional read-only status sidecar if present.
      const state = overrides[e.name] || (kind === "inbox" ? STATE.INCOMING : STATE.RECEIVED);
      return {
        id: e.name,
        actor,
        subject: base,
        time,
        state,
        sourcePath: path.posix.join("foreman/handoffs", kind, e.name)
      };
    })
    .sort((a, b) => String(b.time || "").localeCompare(String(a.time || "")));
}

function getOutbox() { return readPacketDir(OUTBOX_DIR, "outbox"); }
function getInbox() { return readPacketDir(INBOX_DIR, "inbox"); }

// Receipts derive from outbox state: Complete->Delivered, Failed->Failed, else Awaiting.
function getReceipts() {
  return getOutbox().map((p) => ({
    packetId: p.id,
    destination: p.actor,
    status: p.state === STATE.COMPLETE ? "Delivered" : p.state === STATE.FAILED ? "Failed" : "Awaiting",
    lastUpdate: p.time
  }));
}

function fmtTime(t) {
  return t ? esc(t.replace("T", " ").replace(/\..*$/, " UTC")) : "\u2014";
}

function packetRows(items) {
  if (!items.length) return `<div class="sd-empty">Nothing here yet.</div>`;
  return items.map((p) => `
      <div class="sd-row">
        <span class="sd-actor">${esc(p.actor)}</span>
        <span class="sd-subject" title="${esc(p.sourcePath)}">${esc(p.subject)}</span>
        <span class="sd-time">${fmtTime(p.time)}</span>
        ${stateChip(p.state)}
      </div>`).join("");
}

function receiptBuckets() {
  const r = getReceipts();
  const by = { Delivered: [], Failed: [], Awaiting: [] };
  r.forEach((x) => { (by[x.status] || by.Awaiting).push(x); });
  const bucket = (name) => {
    const list = by[name] || [];
    const rows = list.length
      ? list.map((x) => `<div class="sd-row"><span class="sd-actor">${esc(x.destination)}</span><span class="sd-subject">${esc(x.packetId)}</span><span class="sd-time">${fmtTime(x.lastUpdate)}</span></div>`).join("")
      : `<div class="sd-empty">none</div>`;
    return `<div class="sd-bucket"><h3>${name} <span class="sd-count">${list.length}</span></h3>${rows}</div>`;
  };
  return bucket("Delivered") + bucket("Failed") + bucket("Awaiting");
}

// Summary counts: outbox by state + receipts by bucket. Read-only.
function getSummary() {
  const outbox = getOutbox();
  const byState = {};
  Object.values(STATE).forEach((s) => { byState[s] = 0; });
  outbox.forEach((p) => { byState[p.state] = (byState[p.state] || 0) + 1; });
  const receipts = { Delivered: 0, Failed: 0, Awaiting: 0 };
  getReceipts().forEach((r) => { receipts[r.status] = (receipts[r.status] || 0) + 1; });
  return { outboxTotal: outbox.length, inboxTotal: getInbox().length, byState, receipts };
}

function summaryStripHtml() {
  const s = getSummary();
  const chips = Object.entries(s.byState)
    .filter(([, n]) => n > 0)
    .map(([st, n]) => `${stateChip(st)}<span class="sd-strip-n">${n}</span>`)
    .join("");
  const stateChipsHtml = chips || '<span class="sd-empty">no outbox state counts</span>';
  return `
    <div class="sd-strip">
      <span class="sd-strip-item">Outbox <b>${s.outboxTotal}</b></span>
      <span class="sd-strip-item">Inbox <b>${s.inboxTotal}</b></span>
      <span class="sd-strip-item">Receipts \u2014 Delivered <b>${s.receipts.Delivered}</b> \u00b7 Failed <b>${s.receipts.Failed}</b> \u00b7 Awaiting <b>${s.receipts.Awaiting}</b></span>
      <span class="sd-strip-states">${stateChipsHtml}</span>
    </div>`;
}

function soledashHtml() {
  return `
    <section class="section soledash">
      <h2>SoleDash \u2014 Inbox / Outbox / Receipts</h2>
      <p class="section-note">Read-only, file-derived from <code>foreman/handoffs/</code>. States default unless set in the optional <code>soledash-status.json</code> sidecar (no live feed, no automation). Metadata only \u2014 packet bodies are not read.</p>
      ${summaryStripHtml()}
      <div class="sd-grid">
        <div class="sd-col">
          <h3>Inbox <span class="sd-count">${getInbox().length}</span></h3>
          <div class="sd-note">responses received \u00b7 newest first</div>
          <div class="sd-list">${packetRows(getInbox())}</div>
        </div>
        <div class="sd-col">
          <h3>Outbox <span class="sd-count">${getOutbox().length}</span></h3>
          <div class="sd-note">packets sent \u00b7 newest first</div>
          <div class="sd-list">${packetRows(getOutbox())}</div>
        </div>
        <div class="sd-col">
          <h3>Receipts</h3>
          <div class="sd-note">delivered \u00b7 failed \u00b7 awaiting</div>
          <div class="sd-list">${receiptBuckets()}</div>
        </div>
      </div>
    </section>`;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function badge(gate) {
  const map = {
    SAFE_LINK: ["SAFE LINK", "#1f7a3f", "#d6f5e0"],
    HUMAN_GATE: ["HUMAN GATE", "#8a5a00", "#fbe6c5"],
    BLOCKED: ["BLOCKED", "#8a1f1f", "#f7d6d6"]
  };
  const [label, fg, bg] = map[gate] || map.SAFE_LINK;
  return `<span class="badge" style="color:${fg};background:${bg}">${label}</span>`;
}

function cardHtml(c) {
  const target = c.href
    ? `<a class="loc" href="${esc(c.href)}" target="_blank" rel="noopener noreferrer">${esc(c.href)}</a>`
    : `<code class="loc">${esc(c.path || "")}</code>`;
  const exactTag = c.exact === false ? `<span class="tag tag-generic">GENERIC LINK</span>` : `<span class="tag tag-exact">exact</span>`;
  const openBtn = c.openSafe && c.href
    ? `<a class="open" href="${esc(c.href)}" target="_blank" rel="noopener noreferrer">Open \u2197</a>`
    : `<span class="open open-disabled" title="Open not available / gated">\u2014</span>`;
  return `
    <div class="card gate-${c.gate}">
      <div class="card-head">
        <span class="name">${esc(c.name)}</span>
        ${badge(c.gate)}
      </div>
      <div class="loc-row">${target} ${exactTag}</div>
      <div class="purpose">${esc(c.purpose)}</div>
      <div class="status">status: ${esc(c.status || "unknown")}</div>
      <div class="actions">${openBtn}</div>
    </div>`;
}

function pageHtml() {
  const body = sections.map((s) => `
    <section class="section">
      <h2>${esc(s.title)}</h2>
      ${s.note ? `<p class="section-note">${esc(s.note)}</p>` : ""}
      <div class="grid">${s.cards.map(cardHtml).join("")}</div>
    </section>`).join("");

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>SoleDash — Operator Command Console</title>
<style>
  :root { color-scheme: light dark; }
  body { font: 15px/1.5 system-ui, sans-serif; margin: 0; background: #14110e; color: #efe7da; }
  header { padding: 20px 24px; background: #1d1813; border-bottom: 2px solid #5a3a1f; }
  h1 { margin: 0 0 6px; font-size: 20px; color: #e8c79a; }
  .labels { font-size: 13px; color: #cdbfa9; }
  .labels b { color: #f0d9b5; }
  .legend { display:flex; gap:10px; flex-wrap:wrap; margin-top:10px; }
  .badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; letter-spacing:.03em; }
  main { padding: 20px 24px 60px; }
  .section { margin-bottom: 28px; }
  h2 { font-size: 16px; color: #e8c79a; border-bottom: 1px solid #3a2f22; padding-bottom: 6px; }
  .section-note { font-size: 13px; color: #cdbfa9; margin: 6px 0 12px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px; }
  .card { background: #1e1813; border: 1px solid #3a2f22; border-radius: 10px; padding: 12px 14px; }
  .card.gate-HUMAN_GATE { border-left: 4px solid #c98a1e; }
  .card.gate-BLOCKED { border-left: 4px solid #c0392b; }
  .card.gate-SAFE_LINK { border-left: 4px solid #2e9e5b; }
  .card-head { display:flex; justify-content:space-between; align-items:center; gap:8px; }
  .name { font-weight: 600; color: #f3ead9; }
  .loc-row { margin: 6px 0; font-size: 12px; word-break: break-all; }
  .loc { color: #9ec5ff; }
  .tag { font-size: 10px; padding: 1px 6px; border-radius: 4px; margin-left:6px; }
  .tag-generic { background:#5a4a2a; color:#f3e2bf; }
  .tag-exact { background:#26402e; color:#bfe6cd; }
  .purpose { font-size: 13px; color: #d8cbb6; }
  .status { font-size: 12px; color: #a99b85; margin-top: 4px; }
  .actions { margin-top: 8px; }
  .open { display:inline-block; font-size: 13px; font-weight:600; color:#14110e; background:#e8c79a; padding:4px 12px; border-radius:6px; text-decoration:none; }
  .open-disabled { background:#2a241d; color:#776a57; cursor:default; }
  footer { padding: 16px 24px; color:#8a7d68; font-size:12px; border-top:1px solid #3a2f22; }
  /* GD Status Layer */
  .status-layer { background:#1b1610; border:1px solid #3a2f22; border-radius:10px; padding:14px 16px; }
  .status-legend { display:flex; gap:8px; flex-wrap:wrap; margin:6px 0 12px; }
  .status-list { display:flex; flex-direction:column; gap:6px; }
  .status-row { display:flex; align-items:center; gap:10px; padding:6px 8px; border-radius:8px; background:#231c15; }
  .status-actor { min-width:160px; font-weight:600; color:#f3ead9; }
  .status-detail { color:#cdbfa9; font-size:13px; }
  .state-chip { font-size:11px; font-weight:700; padding:2px 10px; border-radius:999px; letter-spacing:.02em; white-space:nowrap; }
  .state-pulse { animation: gdpulse 1.4s ease-in-out infinite; }
  @keyframes gdpulse { 0%,100% { opacity:1; } 50% { opacity:.55; } }
  @media (prefers-reduced-motion: reduce) { .state-pulse { animation: none; } }
  /* SoleDash Inbox/Outbox/Receipts */
  .soledash { background:#1b1610; border:1px solid #3a2f22; border-radius:10px; padding:14px 16px; }
  .sd-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(280px,1fr)); gap:14px; }
  .sd-col h3, .sd-bucket h3 { font-size:14px; color:#e8c79a; margin:0 0 2px; }
  .sd-note { font-size:12px; color:#a99b85; margin-bottom:8px; }
  .sd-list { display:flex; flex-direction:column; gap:6px; }
  .sd-row { display:flex; align-items:center; gap:10px; padding:6px 8px; border-radius:8px; background:#231c15; }
  .sd-actor { min-width:90px; font-weight:600; color:#f3ead9; font-size:13px; }
  .sd-subject { flex:1; color:#cdbfa9; font-size:12px; word-break:break-all; }
  .sd-time { color:#8a7d68; font-size:11px; white-space:nowrap; }
  .sd-count { font-size:11px; background:#3a2f22; color:#e8c79a; border-radius:999px; padding:1px 8px; }
  .sd-empty { color:#776a57; font-size:12px; font-style:italic; padding:4px 8px; }
  .sd-bucket { margin-bottom:10px; }
  .sd-strip { display:flex; flex-wrap:wrap; align-items:center; gap:14px; margin:0 0 12px; padding:8px 10px; background:#231c15; border-radius:8px; font-size:12px; color:#cdbfa9; }
  .sd-strip-item b { color:#f3ead9; }
  .sd-strip-states { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
  .sd-strip-n { color:#e8c79a; font-weight:700; margin-right:4px; }
</style></head>
<body>
<header>
  <h1>SoleDash — Operator Command Console</h1>
  <div class="labels">
    <div><b>Provider may require login.</b></div>
    <div><b>Opening a dashboard is allowed. Changing settings may be a human gate.</b></div>
    <div class="legend">
      ${badge("SAFE_LINK")} open / read only
      ${badge("HUMAN_GATE")} setting/action requires Ben
      ${badge("BLOCKED")} do not do from this dashboard
    </div>
  </div>
</header>
<main>${statusSectionHtml()}${soledashHtml()}${body}</main>
<footer>
  Read-only console. No secrets are stored or displayed. No provider API calls, deploys, pushes, or SQL are performed by this page.
  Generated by <code>scripts/foreman/foreman-control-server.mjs</code>.
</footer>
</body></html>`;
}

// --- Field Mode (mobile) -------------------------------------------------
// Thumb-first, read-only mobile view answering: what moved, what came back,
// what needs me, what can I fire next. FIRE has no live relay backend on this
// build, so it is labeled SIMULATED (no fake action).
const RELAY_BACKEND_CONNECTED = false; // no relay-courier wired on this branch

function fieldHumanGates() {
  const out = [];
  for (const sec of sections) {
    for (const c of sec.cards) {
      if (c.gate === GATE.GATE || c.gate === GATE.BLOCKED) {
        out.push({ name: c.name, purpose: c.purpose, manual: true, status: c.status });
      }
    }
  }
  return out;
}

function fieldBlockers() {
  return statusItems
    .filter((s) => s.state === STATE.BLOCKED)
    .map((s) => ({ blocker: s.detail, owner: s.actor, next: "Operator decision — see foreman/NEXT_ACTION.md" }));
}

function fieldModeHtml() {
  const fireTag = RELAY_BACKEND_CONNECTED ? "" : ` <span class="fm-sim">SIMULATED</span>`;
  const relayCards = getOutbox().map((p) => `
      <div class="fm-card fm-relay">
        <div class="fm-card-top"><span class="fm-name">${esc(p.subject)}</span>${stateChip(p.state)}</div>
        <div class="fm-meta">to <b>${esc(p.actor)}</b> · ${fmtTime(p.time)}</div>
        <div class="fm-actions">
          <button class="fm-btn fm-fire" onclick="return fmFire(this)" data-name="${esc(p.subject)}">FIRE${fireTag}</button>
          <button class="fm-btn fm-hold" onclick="return fmHold(this)">HOLD</button>
          <a class="fm-btn fm-open" href="/receipts" target="_blank" rel="noopener">OPEN RECEIPT</a>
        </div>
      </div>`).join("") || `<div class="fm-empty">No active relay cards.</div>`;

  const receipts = getInbox().map((r) => `
      <div class="fm-card fm-receipt">
        <div class="fm-card-top"><span class="fm-name">${esc(r.subject)}</span>${stateChip(r.state)}</div>
        <div class="fm-meta">from <b>${esc(r.actor)}</b> · ${fmtTime(r.time)}</div>
        <a class="fm-btn fm-open" href="/inbox" target="_blank" rel="noopener">OPEN</a>
      </div>`).join("") || `<div class="fm-empty">No receipts returned yet.</div>`;

  const gates = fieldHumanGates().map((g) => `
      <div class="fm-card fm-gate">
        <div class="fm-card-top"><span class="fm-name">${esc(g.name)}</span><span class="fm-redgate">RED GATE — BEN ONLY</span></div>
        <div class="fm-meta">${esc(g.purpose)}</div>
        <div class="fm-meta fm-muted">${esc(g.status || "")}</div>
      </div>`).join("") || `<div class="fm-empty">No open human gates.</div>`;

  const blockers = fieldBlockers().map((b) => `
      <div class="fm-card fm-blocker">
        <div class="fm-name">${esc(b.blocker)}</div>
        <div class="fm-meta">owner: <b>${esc(b.owner)}</b></div>
        <div class="fm-meta fm-muted">next: ${esc(b.next)}</div>
      </div>`).join("") || `<div class="fm-empty">No blockers.</div>`;

  const relayBanner = RELAY_BACKEND_CONNECTED
    ? ""
    : `<div class="fm-banner">Relay backend not connected — FIRE is <b>SIMULATED</b> on this build (nothing is sent).</div>`;

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>SoleDash — Field Mode</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin:0; background:#14110e; color:#efe7da; font:16px/1.45 system-ui, sans-serif; -webkit-text-size-adjust:100%; }
  header { position:sticky; top:0; background:#1d1813; border-bottom:2px solid #5a3a1f; padding:12px 16px; }
  h1 { margin:0; font-size:18px; color:#e8c79a; }
  .fm-sub { font-size:12px; color:#cdbfa9; margin-top:2px; }
  .fm-banner { margin:10px 16px 0; padding:8px 12px; background:#3a2a12; border:1px solid #8a5a00; border-radius:10px; font-size:13px; color:#fbe6c5; }
  main { padding:12px 16px 40px; }
  h2 { font-size:14px; color:#e8c79a; margin:20px 0 8px; letter-spacing:.03em; }
  .fm-card { background:#1e1813; border:1px solid #3a2f22; border-left:4px solid #5a3a1f; border-radius:12px; padding:14px; margin-bottom:10px; }
  .fm-relay { border-left-color:#2e9e5b; }
  .fm-gate { border-left-color:#c0392b; }
  .fm-blocker { border-left-color:#c98a1e; }
  .fm-card-top { display:flex; justify-content:space-between; align-items:center; gap:8px; }
  .fm-name { font-weight:700; font-size:15px; color:#f3ead9; word-break:break-word; }
  .fm-meta { font-size:13px; color:#cdbfa9; margin-top:4px; }
  .fm-muted { color:#a99b85; }
  .fm-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; }
  .fm-btn { display:inline-flex; align-items:center; justify-content:center; min-height:48px; padding:0 16px; border-radius:12px; font-size:15px; font-weight:700; border:0; text-decoration:none; cursor:pointer; }
  .fm-fire { background:#e8c79a; color:#14110e; }
  .fm-hold { background:#2a241d; color:#e8c79a; border:1px solid #5a3a1f; }
  .fm-open { background:#26303f; color:#cfe0ff; }
  .fm-sim { font-size:10px; background:#8a5a00; color:#fff; border-radius:6px; padding:1px 5px; margin-left:6px; }
  .fm-redgate { font-size:11px; font-weight:800; color:#fff; background:#8a1f1f; border-radius:8px; padding:3px 8px; white-space:nowrap; }
  .state-chip { font-size:11px; font-weight:700; padding:2px 10px; border-radius:999px; white-space:nowrap; }
  .fm-empty { color:#776a57; font-style:italic; padding:8px 2px; }
  .chip-legend { font-size:11px; color:#8a7d68; margin-top:24px; }
</style></head>
<body>
<header>
  <h1>SoleDash — Field Mode</h1>
  <div class="fm-sub">What moved · what came back · what needs me · what I can fire</div>
</header>
${relayBanner}
<main>
  <h2>1 · ACTIVE RELAY CARDS</h2>
  ${relayCards}
  <h2>2 · RECEIPTS RETURNED</h2>
  ${receipts}
  <h2>3 · HUMAN GATES</h2>
  ${gates}
  <h2>4 · BLOCKERS</h2>
  ${blockers}
  <div class="chip-legend">Read-only field view. States are file-derived/sample (not a live feed). FIRE is simulated on this build.</div>
</main>
<script>
  function fmFire(btn){
    var name = btn.getAttribute('data-name') || 'this card';
    if(!confirm('FIRE ' + name + '?\\n\\nRelay backend is NOT connected on this build — this will NOT actually send.')) return false;
    alert('SIMULATED: no relay backend connected. Nothing was sent. (Wire relay-courier to enable live FIRE.)');
    return false;
  }
  function fmHold(btn){ btn.textContent = 'HELD'; btn.disabled = true; return false; }
</script>
</body></html>`;
}

const server = http.createServer((req, res) => {
  if (req.method === "GET" && (req.url === "/" || req.url.startsWith("/?"))) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    res.end(pageHtml());
    return;
  }
  if (req.method === "GET" && (req.url === "/field" || req.url.startsWith("/field?"))) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    res.end(fieldModeHtml());
    return;
  }
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "foreman-control-server", readOnly: true }));
    return;
  }
  if (req.method === "GET" && req.url === "/status") {
    res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    res.end(JSON.stringify({ ok: true, states: Object.values(STATE), items: statusItems }));
    return;
  }
  if (req.method === "GET" && req.url === "/outbox") {
    res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    res.end(JSON.stringify({ ok: true, items: getOutbox() }));
    return;
  }
  if (req.method === "GET" && req.url === "/inbox") {
    res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    res.end(JSON.stringify({ ok: true, items: getInbox() }));
    return;
  }
  if (req.method === "GET" && req.url === "/receipts") {
    res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    res.end(JSON.stringify({ ok: true, items: getReceipts() }));
    return;
  }
  if (req.method === "GET" && req.url === "/summary") {
    res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    res.end(JSON.stringify({ ok: true, ...getSummary() }));
    return;
  }
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
});

server.listen(PORT, HOST, () => {
  console.log(`Foreman Control Panel (SoleDash) on http://${HOST}:${PORT}`);
  console.log("Read-only Human Gates Console. No secrets, no provider calls, no deploys.");
});
