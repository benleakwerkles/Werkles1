import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { OBJECTS_DIR, RECEIPTS_DIR, repoRelative, stageForObject } from "../_lib";
import type { NerdkleObject } from "../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readObjects() {
  try {
    const names = await fs.readdir(OBJECTS_DIR);
    return Promise.all(
      names
        .filter((name) => name.endsWith(".json"))
        .map(async (name) => {
          const filePath = path.join(OBJECTS_DIR, name);
          const object = JSON.parse(await fs.readFile(filePath, "utf8")) as NerdkleObject;
          return {
            path: repoRelative(filePath),
            object,
            stage: stageForObject(object)
          };
        })
    );
  } catch {
    return [];
  }
}

export async function GET() {
  const objects = await readObjects();
  const receipts = (await fs.readdir(RECEIPTS_DIR).catch(() => [])).filter((name) => name.endsWith(".json"));
  const focus = objects.find((item) => item.stage === "needs_clarification")
    ?? objects.find((item) => item.stage === "waiting_on_human_gate")
    ?? objects.find((item) => item.stage === "ready_for_execution")
    ?? objects[0];
  const lines = [
    "# Nerdkle Operator Brief",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Counts",
    "",
    `- Objects: ${objects.length}`,
    `- Receipts: ${receipts.length}`,
    `- Owners: ${new Set(objects.map((item) => item.object.execution_owner || "Unassigned")).size}`,
    "",
    "## Operator Focus",
    "",
    focus ? `- Object: ${focus.object.id}` : "- Object: none",
    focus ? `- Stage: ${focus.stage}` : "- Stage: none",
    focus ? `- Owner: ${focus.object.execution_owner}` : "- Owner: none",
    focus ? `- Next: ${focus.object.next_action}` : "- Next: assemble the first operating object",
    "",
    "## Open Objects",
    "",
    ...objects
      .filter((item) => item.stage !== "completed")
      .slice(0, 8)
      .flatMap((item) => [
        `- ${item.object.id}`,
        `  - Stage: ${item.stage}`,
        `  - Owner: ${item.object.execution_owner}`,
        `  - Next: ${item.object.next_action}`
      ])
  ];

  return NextResponse.json({
    ok: true,
    markdown: lines.join("\n")
  });
}
