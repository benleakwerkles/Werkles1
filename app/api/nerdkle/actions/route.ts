import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { EVENTS_PATH, EXECUTION_PACKETS_PATH, OBJECTS_DIR, PLANS_DIR, repoRelative, stageForObject } from "../_lib";
import type { NerdkleObject } from "../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readJsonl(filePath: string) {
  try {
    const text = await fs.readFile(filePath, "utf8");
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .flatMap((line) => {
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
  const [objects, events, packetEvents] = await Promise.all([
    readObjects(),
    readJsonl(EVENTS_PATH),
    readJsonl(EXECUTION_PACKETS_PATH)
  ]);
  const plans = new Set(
    (await fs.readdir(PLANS_DIR).catch(() => []))
      .filter((name) => name.endsWith(".md"))
      .map((name) => name.replace(/\.md$/, ""))
  );
  const packeted = new Set(packetEvents.map((event) => event.object_id));
  const actionCards = objects.flatMap((item) => {
    if (item.stage === "completed") return [];
    if (item.stage === "blocked") {
      return [{
        priority: "high",
        action_type: "clear_blocker",
        object_id: item.object.id,
        execution_owner: item.object.execution_owner,
        stage: item.stage,
        label: "Clear blocker",
        detail: item.object.next_action
      }];
    }
    if (item.stage === "needs_clarification") {
      return [{
        priority: "high",
        action_type: "answer_questions",
        object_id: item.object.id,
        execution_owner: item.object.execution_owner,
        stage: item.stage,
        label: "Answer unresolved fields",
        detail: `Resolve ${(item.object.unresolved_fields ?? []).join(", ")}.`
      }];
    }
    if (item.stage === "waiting_on_human_gate") {
      return [{
        priority: "high",
        action_type: "review_human_gate",
        object_id: item.object.id,
        execution_owner: item.object.execution_owner,
        stage: item.stage,
        label: "Review human gate",
        detail: (item.object.human_gates ?? []).filter((gate) => gate !== "none").join(", ")
      }];
    }

    const cards = [];
    if (!plans.has(item.object.id)) {
      cards.push({
        priority: "medium",
        action_type: "create_execution_plan",
        object_id: item.object.id,
        execution_owner: item.object.execution_owner,
        stage: item.stage,
        label: "Create execution plan",
        detail: "Generate the one-screen plan before handing off execution."
      });
    }
    if (!packeted.has(item.object.id)) {
      cards.push({
        priority: "medium",
        action_type: "create_handoff_packet",
        object_id: item.object.id,
        execution_owner: item.object.execution_owner,
        stage: item.stage,
        label: "Create handoff packet",
        detail: "Prepare the owner packet without sending it externally."
      });
    }
    if (cards.length === 0) {
      cards.push({
        priority: "low",
        action_type: "wait_for_receipt",
        object_id: item.object.id,
        execution_owner: item.object.execution_owner,
        stage: item.stage,
        label: "Wait for receipt",
        detail: "Plan and packet exist. The next loop closure is a receipt."
      });
    }
    return cards;
  });

  const priorityOrder = { high: 0, medium: 1, low: 2 } as Record<string, number>;
  actionCards.sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9));

  return NextResponse.json({
    ok: true,
    count: actionCards.length,
    event_count: events.length + packetEvents.length,
    actions: actionCards
  });
}
