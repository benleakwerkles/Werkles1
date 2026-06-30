import { promises as fs } from "node:fs";
import { NextResponse } from "next/server";
import { EVENTS_PATH, EXECUTION_PACKETS_PATH } from "../_lib";

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

export async function GET() {
  const [events, packetEvents] = await Promise.all([
    readJsonl(EVENTS_PATH),
    readJsonl(EXECUTION_PACKETS_PATH)
  ]);
  const allEvents = [...events, ...packetEvents]
    .filter((event) => event.object_id)
    .sort((a, b) => String(a.created_at ?? "").localeCompare(String(b.created_at ?? "")));
  const byObject = new Map<string, unknown[]>();

  for (const event of allEvents) {
    const objectId = String(event.object_id);
    byObject.set(objectId, [...(byObject.get(objectId) ?? []), event]);
  }

  return NextResponse.json({
    ok: true,
    object_count: byObject.size,
    event_count: allEvents.length,
    lineage: Array.from(byObject.entries()).map(([object_id, objectEvents]) => ({
      object_id,
      events: objectEvents
    }))
  });
}
