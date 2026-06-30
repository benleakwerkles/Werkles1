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
  const [objectEvents, packetEvents] = await Promise.all([
    readJsonl(EVENTS_PATH),
    readJsonl(EXECUTION_PACKETS_PATH)
  ]);
  const events = [...objectEvents, ...packetEvents]
    .sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")));

  return NextResponse.json({
    ok: true,
    count: events.length,
    events: events.slice(0, 50)
  });
}
