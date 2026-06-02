import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { computeCockpitHashes, validateResponseFile, processInbox, validateInbox } from "./crew-relay-lib.mjs";

const FIXTURES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "tests", "fixtures");

function fixturePath(name) {
  return path.join(FIXTURES_DIR, name);
}

function loadFixture(name, overrides = {}) {
  const hashes = computeCockpitHashes();
  let content = fs.readFileSync(fixturePath(name), "utf8");
  content = content.replace(/__NEXT_ACTION_HASH__/g, overrides.nextActionHash ?? hashes.nextActionHash ?? "deadbeef");
  content = content.replace(/__CURRENT_STATE_HASH__/g, overrides.currentStateHash ?? hashes.currentStateHash ?? "");
  content = content.replace(/__STALE_HASH__/g, overrides.staleHash ?? "0000000000000000000000000000000000000000000000000000000000000000");
  content = injectExtendedFields(content);
  return content;
}

function injectExtendedFields(content) {
  if (content.includes('"platform"')) return content;
  const cousinMatch = content.match(/"cousin":\s*"([A-Z]+)"/);
  const cousin = cousinMatch?.[1] || "BEAN";
  const defaults = {
    PETRA: { platform: "ChatGPT", role: "Comptroller", lane: "gate verdict" },
    SKYBRO: { platform: "Gemini", role: "Architecture", lane: "infra / ops" },
    ENDER: { platform: "Claude", role: "UX / brand", lane: "product / UX" },
    BEAN: { platform: "DeepSeek", role: "Trust audit", lane: "hostile audit" },
    COMPUTER: { platform: "Perplexity", role: "Research", lane: "doctrine synthesis" },
  };
  const d = defaults[cousin] || defaults.BEAN;
  return content.replace(
    /("UNKNOWNS":)/,
    `"platform": "${d.platform}",\n  "role": "${d.role}",\n  "requested_action": "REVIEW",\n  "target_files": [],\n  "lane": "${d.lane}",\n  "DO_NOT": "deploy",\n  $1`
  );
}

function withTempInbox(files, fn) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "crew-relay-test-"));
  const inbox = path.join(tmp, "inbox");
  const processed = path.join(tmp, "processed");
  fs.mkdirSync(inbox, { recursive: true });
  fs.mkdirSync(processed, { recursive: true });
  for (const [name, content] of files) {
    fs.writeFileSync(path.join(inbox, name), content, "utf8");
  }
  try {
    return fn({ tmp, inbox, processed });
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

export function runFixtureTests() {
  const cases = [];
  const hashes = computeCockpitHashes();

  // 1 fresh passes
  {
    const content = loadFixture("fresh-response-passes.md");
    const tmpFile = path.join(os.tmpdir(), "crew-relay-fresh-test.md");
    fs.writeFileSync(tmpFile, content, "utf8");
    const r = validateResponseFile(tmpFile);
    fs.unlinkSync(tmpFile);
    cases.push({ name: "fresh response passes", pass: r.ok && r.status === "OK", detail: r.status });
  }

  // 2 stale
  {
    const content = loadFixture("stale-response.md");
    const tmpFile = path.join(os.tmpdir(), "crew-relay-stale-test.md");
    fs.writeFileSync(tmpFile, content, "utf8");
    const r = validateResponseFile(tmpFile);
    fs.unlinkSync(tmpFile);
    cases.push({
      name: "stale after NEXT_ACTION.md changes",
      pass: !r.ok && r.status === "STALE_DO_NOT_APPLY",
      detail: r.errors[0],
    });
  }

  // 3 missing source
  {
    const content = loadFixture("missing-source.md");
    const tmpFile = path.join(os.tmpdir(), "crew-relay-missing-src.md");
    fs.writeFileSync(tmpFile, content, "utf8");
    const r = validateResponseFile(tmpFile);
    fs.unlinkSync(tmpFile);
    cases.push({ name: "missing SOURCE rejected", pass: !r.ok, detail: r.status });
  }

  // 4 filename mismatch
  {
    const content = loadFixture("filename-source-mismatch.md");
    const tmpFile = path.join(os.tmpdir(), "FROM_BEAN_mismatch.md");
    fs.writeFileSync(tmpFile, content, "utf8");
    const r = validateResponseFile(tmpFile);
    fs.unlinkSync(tmpFile);
    cases.push({ name: "filename/source mismatch rejected", pass: !r.ok && r.status === "SOURCE_MISMATCH", detail: r.status });
  }

  // 5 malformed
  {
    const content = fs.readFileSync(fixturePath("malformed-response.md"), "utf8");
    const tmpFile = path.join(os.tmpdir(), "FROM_BEAN_malformed.md");
    fs.writeFileSync(tmpFile, content, "utf8");
    const r = validateResponseFile(tmpFile);
    fs.unlinkSync(tmpFile);
    cases.push({ name: "malformed file rejected", pass: !r.ok && r.status === "MALFORMED", detail: r.status });
  }

  // 6 conflict
  {
    const a = loadFixture("conflict-response-a.md");
    const b = loadFixture("conflict-response-b.md");
    const result = withTempInbox(
      [
        ["FROM_BEAN_conflict_a.md", a],
        ["FROM_BEAN_conflict_b.md", b],
      ],
      ({ inbox }) => validateInbox({ inboxDir: inbox })
    );
    cases.push({
      name: "two responses same source cause conflict",
      pass: !result.ok && result.results.some((r) => r.status === "CONFLICT"),
      detail: result.results.map((r) => r.status).join(", "),
    });
  }

  // 7 overreach bean deploy
  {
    const content = loadFixture("overreach-bean-deploy.md");
    const tmpFile = path.join(os.tmpdir(), "FROM_BEAN_deploy.md");
    fs.writeFileSync(tmpFile, content, "utf8");
    const r = validateResponseFile(tmpFile);
    fs.unlinkSync(tmpFile);
    cases.push({
      name: "FROM_BEAN deploy triggers overreach warning",
      pass: r.warnings.some((w) => w.includes("deploy")),
      detail: r.warnings.join("; "),
    });
  }

  // 8 dry-run moves nothing
  {
    const content = loadFixture("fresh-response-passes.md");
    const result = withTempInbox([["FROM_BEAN_fresh.md", content]], ({ inbox, processed }) => {
      const before = fs.readdirSync(inbox).length;
      const out = processInbox({ dryRun: true, inboxDir: inbox, processedDir: processed });
      const afterInbox = fs.readdirSync(inbox).length;
      const afterProcessed = fs.readdirSync(processed).length;
      return { out, before, afterInbox, afterProcessed };
    });
    cases.push({
      name: "dry-run moves nothing",
      pass: result.out.ok && result.out.dryRun && result.afterInbox === 1 && result.afterProcessed === 0,
      detail: result.out.message,
    });
  }

  const ok = cases.every((c) => c.pass);
  const lines = ["Crew relay fixture tests", ""];
  for (const c of cases) {
    lines.push(`${c.pass ? "PASS" : "FAIL"} — ${c.name}${c.detail ? ` (${c.detail})` : ""}`);
  }
  lines.push("");
  lines.push(`Overall: ${ok ? "PASS" : "FAIL"} (${cases.filter((c) => c.pass).length}/${cases.length})`);

  return { ok, cases, report: lines.join("\n") };
}
