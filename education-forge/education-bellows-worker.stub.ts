/**
 * Education Bellows worker stub.
 *
 * This is not the full Bellows worker. It is a text-only curriculum scaffold
 * for Learning Corner drafts. It must not publish content or write outside:
 *
 * - content/education/drafts/
 * - foreman/bellows-output/
 * - education-forge/
 */

type BellowsConfig = {
  maxDraftsPerRun: number;
  maxSourcesPerDraft: number;
  dailyCostLimitUsd: number;
  dryRun: boolean;
};

type BacklogTopic = {
  id: string;
  title: string;
  lane: string;
  status: "queued" | "drafted" | "blocked" | "reviewed";
};

const config: BellowsConfig = {
  maxDraftsPerRun: Number(process.env.MAX_DRAFTS_PER_RUN || 1),
  maxSourcesPerDraft: Number(process.env.MAX_SOURCES_PER_DRAFT || 8),
  dailyCostLimitUsd: Number(process.env.DAILY_COST_LIMIT_USD || 5),
  dryRun: process.env.BELLOWS_DRY_RUN !== "false"
};

const allowedWriteRoots = [
  "content/education/drafts/",
  "foreman/bellows-output/",
  "education-forge/"
] as const;

function assertAllowedWritePath(path: string) {
  const normalized = path.replace(/\\/g, "/");
  const allowed = allowedWriteRoots.some((root) => normalized.startsWith(root));

  if (!allowed) {
    throw new Error(`Bellows write blocked outside allowed roots: ${path}`);
  }
}

function enforceRunLimits(topics: BacklogTopic[]) {
  if (config.maxDraftsPerRun !== 1) {
    throw new Error("MAX_DRAFTS_PER_RUN must stay at 1 for this scaffold.");
  }

  if (config.maxSourcesPerDraft > 8) {
    throw new Error("MAX_SOURCES_PER_DRAFT cannot exceed 8.");
  }

  if (config.dailyCostLimitUsd > 5) {
    throw new Error("DAILY_COST_LIMIT_USD cannot exceed 5 for this scaffold.");
  }

  return topics.filter((topic) => topic.status === "queued").slice(0, 1);
}

async function draftOneLesson(topic: BacklogTopic) {
  const outputPath = `content/education/drafts/${topic.id}.md`;
  assertAllowedWritePath(outputPath);

  if (config.dryRun) {
    return {
      status: "dry_run",
      topic: topic.title,
      outputPath,
      note: "No draft generated. Full Bellows remains gated."
    };
  }

  throw new Error("Live drafting is not enabled in the scaffold.");
}

export async function runEducationBellows(topics: BacklogTopic[]) {
  const selected = enforceRunLimits(topics);

  if (selected.length === 0) {
    return [{ status: "idle", note: "No queued Learning Corner topics." }];
  }

  return Promise.all(selected.map(draftOneLesson));
}

export const educationBellowsRules = {
  allowedWriteRoots,
  config,
  hardStops: [
    "Do not publish content.",
    "Do not edit app, lib, company, supabase, or API routes.",
    "Do not run indefinitely.",
    "Do not provide financial, legal, tax, or investment advice."
  ]
} as const;

