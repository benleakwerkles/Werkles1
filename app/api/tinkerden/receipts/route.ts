import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RECEIPT_SOURCE = path.join(process.cwd(), "data", "organism", "receipt_pickup.jsonl");

function asString(value: unknown, fallback = "UNKNOWN") {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function asNullableString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function normalizeReceipt(value: unknown) {
  if (!value || typeof value !== "object") return null;

  const row = value as Record<string, unknown>;
  const receiptId = asString(row.receipt_id, "");
  if (!receiptId) return null;

  return {
    receipt_id: receiptId,
    mission: asString(row.mission),
    producer: asString(row.producer),
    path: asString(row.path, ""),
    timestamp: asString(row.timestamp),
    hash: asString(row.hash, ""),
    status_guess: asString(row.status_guess),
    linked_packet_id: asNullableString(row.linked_packet_id)
  };
}

export async function GET() {
  try {
    const contents = await fs.readFile(RECEIPT_SOURCE, "utf8");
    const receipts: ReturnType<typeof normalizeReceipt>[] = [];
    const errors: Array<{ line: number; error: string }> = [];

    contents.split(/\r?\n/).forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      try {
        const receipt = normalizeReceipt(JSON.parse(trimmed));
        if (receipt) receipts.push(receipt);
      } catch (error) {
        errors.push({
          line: index + 1,
          error: error instanceof Error ? error.message : "Unknown JSON parse error"
        });
      }
    });

    return NextResponse.json({
      ok: true,
      source: "data/organism/receipt_pickup.jsonl",
      count: receipts.length,
      parse_errors: errors,
      receipts
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "data/organism/receipt_pickup.jsonl",
        count: 0,
        parse_errors: [],
        receipts: [],
        error: error instanceof Error ? error.message : "Unable to read receipt source"
      },
      { status: 500 }
    );
  }
}
