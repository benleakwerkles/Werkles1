import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { OBJECTS_DIR, repoRelative, stageForObject } from "../_lib";
import type { NerdkleObject } from "../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STALE_HOURS = 24;

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
  const now = Date.now();
  const objects = await readObjects();
  const stale = objects
    .filter((item) => item.stage !== "completed")
    .map((item) => {
      const updatedAt = item.object.status?.updated_at ?? item.object.created_at;
      const ageHours = Math.max(0, Math.round((now - Date.parse(updatedAt)) / 36_000) / 100);
      return {
        object_id: item.object.id,
        object_path: item.path,
        stage: item.stage,
        execution_owner: item.object.execution_owner,
        age_hours: ageHours,
        stale: ageHours >= STALE_HOURS,
        next_action: item.object.next_action
      };
    })
    .filter((item) => item.stale);

  return NextResponse.json({
    ok: true,
    stale_after_hours: STALE_HOURS,
    count: stale.length,
    stale
  });
}
