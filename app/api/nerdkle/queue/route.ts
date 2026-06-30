import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { OBJECTS_DIR, questionsForObject, repoRelative, stageForObject } from "../_lib";
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
            stage: stageForObject(object),
            questions: questionsForObject(object)
          };
        })
    );
  } catch {
    return [];
  }
}

export async function GET() {
  const objects = await readObjects();
  const queue = {
    needs_clarification: objects.filter((item) => item.stage === "needs_clarification"),
    waiting_on_human_gate: objects.filter((item) => item.stage === "waiting_on_human_gate"),
    ready_for_execution: objects.filter((item) => item.stage === "ready_for_execution"),
    completed: objects.filter((item) => item.stage === "completed"),
    blocked: objects.filter((item) => item.stage === "blocked")
  };

  return NextResponse.json({
    ok: true,
    counts: Object.fromEntries(Object.entries(queue).map(([stage, items]) => [stage, items.length])),
    queue
  });
}
