import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUS_SOURCE = path.join(process.cwd(), "data", "organism", "nerdkle", "status.json");

export async function GET() {
  try {
    const status = JSON.parse(await fs.readFile(STATUS_SOURCE, "utf8"));
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "data/organism/nerdkle/status.json",
        error: error instanceof Error ? error.message : "Nerdkle status not available"
      },
      { status: 500 }
    );
  }
}
