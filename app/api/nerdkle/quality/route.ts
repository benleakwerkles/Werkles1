import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { OBJECTS_DIR, qualityForObject, repoRelative } from "../_lib";
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
            quality: qualityForObject(object)
          };
        })
    );
  } catch {
    return [];
  }
}

export async function GET() {
  const objects = await readObjects();
  const average_score = objects.length
    ? Math.round(objects.reduce((total, item) => total + item.quality.score, 0) / objects.length)
    : 0;

  return NextResponse.json({
    ok: true,
    count: objects.length,
    average_score,
    objects: objects.map((item) => ({
      object_id: item.object.id,
      object_path: item.path,
      execution_owner: item.object.execution_owner,
      ...item.quality
    }))
  });
}
