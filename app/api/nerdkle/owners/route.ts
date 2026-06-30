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
  const ownerMap = new Map<string, {
    owner: string;
    total: number;
    stages: Record<string, number>;
    items: Array<{
      object_id: string;
      object_path: string;
      stage: string;
      next_action: string;
      operator_intent: string;
    }>;
  }>();

  for (const item of objects) {
    const owner = item.object.execution_owner || "Unassigned";
    const current = ownerMap.get(owner) ?? {
      owner,
      total: 0,
      stages: {},
      items: []
    };
    current.total += 1;
    current.stages[item.stage] = (current.stages[item.stage] ?? 0) + 1;
    current.items.push({
      object_id: item.object.id,
      object_path: item.path,
      stage: item.stage,
      next_action: item.object.next_action,
      operator_intent: item.object.operator_intent
    });
    ownerMap.set(owner, current);
  }

  return NextResponse.json({
    ok: true,
    count: ownerMap.size,
    owners: Array.from(ownerMap.values()).sort((a, b) => b.total - a.total)
  });
}
