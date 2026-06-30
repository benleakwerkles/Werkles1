import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { OBJECTS_DIR, repoRelative, stageForObject } from "../_lib";
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
  const gates = objects.flatMap((item) =>
    (item.object.human_gates ?? [])
      .filter((gate) => gate !== "none")
      .map((gate) => ({
        object_id: item.object.id,
        object_path: item.path,
        execution_owner: item.object.execution_owner,
        stage: item.stage,
        gate,
        operator_intent: item.object.operator_intent,
        next_action: item.object.next_action
      }))
  );

  return NextResponse.json({
    ok: true,
    count: gates.length,
    gates
  });
}
