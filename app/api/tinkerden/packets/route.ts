import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PACKET_SOURCE = path.join(process.cwd(), "data", "organism", "packet_relay_events.jsonl");

function asString(value: unknown, fallback = "UNKNOWN") {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizePacketEvent(value: unknown) {
  if (!value || typeof value !== "object") return null;

  const row = value as Record<string, unknown>;
  const packet = row.packet && typeof row.packet === "object"
    ? row.packet as Record<string, unknown>
    : {};
  const packetId = asString(packet.packet_id, "");

  if (!packetId) return null;

  return {
    event_id: asString(row.event_id),
    event_type: asString(row.event_type),
    source_system: asString(row.source_system),
    target_aeye: asString(row.target_aeye),
    workspace_target: asString(row.workspace_target),
    delivery_mode: asString(row.delivery_mode),
    packet_id: packetId,
    operator_selection: asString(packet.operator_selection),
    recommendation: asString(packet.recommendation),
    composite_score: asNumber(packet.composite_score),
    return_destination: asString(packet.return_destination),
    receipt_required: asString(packet.receipt_required),
    dispatch_class: asString(packet.dispatch_class),
    packet_path: asString(row.packet_path, ""),
    paste_block_path: asString(row.paste_block_path, ""),
    created_at: asString(row.created_at)
  };
}

export async function GET() {
  try {
    const contents = await fs.readFile(PACKET_SOURCE, "utf8");
    const packets: ReturnType<typeof normalizePacketEvent>[] = [];
    const errors: Array<{ line: number; error: string }> = [];

    contents.split(/\r?\n/).forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      try {
        const packet = normalizePacketEvent(JSON.parse(trimmed));
        if (packet) packets.push(packet);
      } catch (error) {
        errors.push({
          line: index + 1,
          error: error instanceof Error ? error.message : "Unknown JSON parse error"
        });
      }
    });

    return NextResponse.json({
      ok: true,
      source: "data/organism/packet_relay_events.jsonl",
      count: packets.length,
      parse_errors: errors,
      packets
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "data/organism/packet_relay_events.jsonl",
        count: 0,
        parse_errors: [],
        packets: [],
        error: error instanceof Error ? error.message : "Unable to read packet source"
      },
      { status: 500 }
    );
  }
}
