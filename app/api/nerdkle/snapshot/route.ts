import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { EVENTS_PATH, EXECUTION_PACKETS_PATH, OBJECTS_DIR, PLANS_DIR, RECEIPTS_DIR, repoRelative, stageForObject } from "../_lib";
import type { NerdkleObject } from "../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readJsonFiles(directory: string) {
  try {
    const names = await fs.readdir(directory);
    return Promise.all(
      names
        .filter((name) => name.endsWith(".json"))
        .map(async (name) => {
          const filePath = path.join(directory, name);
          return {
            path: repoRelative(filePath),
            value: JSON.parse(await fs.readFile(filePath, "utf8"))
          };
        })
    );
  } catch {
    return [];
  }
}

async function readJsonl(filePath: string) {
  try {
    const text = await fs.readFile(filePath, "utf8");
    return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).flatMap((line) => {
      try {
        return [JSON.parse(line)];
      } catch {
        return [];
      }
    });
  } catch {
    return [];
  }
}

export async function GET() {
  const [objectFiles, receipts, events, packetEvents] = await Promise.all([
    readJsonFiles(OBJECTS_DIR),
    readJsonFiles(RECEIPTS_DIR),
    readJsonl(EVENTS_PATH),
    readJsonl(EXECUTION_PACKETS_PATH)
  ]);
  const objects = objectFiles.map((file) => ({
    path: file.path,
    object: file.value as NerdkleObject,
    stage: stageForObject(file.value as NerdkleObject)
  }));
  const plans = (await fs.readdir(PLANS_DIR).catch(() => [])).filter((name) => name.endsWith(".md"));
  const stages = objects.reduce<Record<string, number>>((counts, item) => {
    counts[item.stage] = (counts[item.stage] ?? 0) + 1;
    return counts;
  }, {});
  const owners = objects.reduce<Record<string, number>>((counts, item) => {
    const owner = item.object.execution_owner || "Unassigned";
    counts[owner] = (counts[owner] ?? 0) + 1;
    return counts;
  }, {});
  const focus = objects.find((item) => item.stage === "needs_clarification")
    ?? objects.find((item) => item.stage === "waiting_on_human_gate")
    ?? objects.find((item) => item.stage === "ready_for_execution")
    ?? objects[0];

  return NextResponse.json({
    ok: true,
    generated_at: new Date().toISOString(),
    counts: {
      objects: objects.length,
      receipts: receipts.length,
      plans: plans.length,
      events: events.length,
      packet_events: packetEvents.length,
      owners: Object.keys(owners).length
    },
    stages,
    owners,
    operator_focus: focus ? {
      object_id: focus.object.id,
      stage: focus.stage,
      execution_owner: focus.object.execution_owner,
      next_action: focus.object.next_action,
      object_path: focus.path
    } : null
  });
}
