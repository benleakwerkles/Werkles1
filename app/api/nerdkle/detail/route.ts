import { promises as fs } from "node:fs";
import { NextRequest, NextResponse } from "next/server";
import {
  EVENTS_PATH,
  EXECUTION_PACKETS_PATH,
  findObjectFile,
  qualityForObject,
  questionsForObject,
  RECEIPTS_DIR,
  repoRelative,
  stageForObject
} from "../_lib";

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

async function readReceiptsForObject(objectId: string) {
  try {
    const names = await fs.readdir(RECEIPTS_DIR);
    const receipts = await Promise.all(
      names
        .filter((name) => name.endsWith(".json"))
        .map(async (name) => {
          const filePath = `${RECEIPTS_DIR}/${name}`;
          return {
            path: repoRelative(filePath),
            receipt: JSON.parse(await fs.readFile(filePath, "utf8"))
          };
        })
    );
    return receipts.filter((item) => item.receipt?.object_id === objectId);
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const objectId = request.nextUrl.searchParams.get("object_id") ?? "";
  if (!objectId) {
    return NextResponse.json({ ok: false, error: "object_id is required" }, { status: 400 });
  }

  const { filePath, object } = await findObjectFile(objectId);
  const [events, packetEvents, receipts] = await Promise.all([
    readJsonl(EVENTS_PATH),
    readJsonl(EXECUTION_PACKETS_PATH),
    readReceiptsForObject(object.id)
  ]);
  const lineage = [...events, ...packetEvents]
    .filter((event) => event.object_id === object.id)
    .sort((a, b) => String(a.created_at ?? "").localeCompare(String(b.created_at ?? "")));

  return NextResponse.json({
    ok: true,
    object,
    object_path: repoRelative(filePath),
    stage: stageForObject(object),
    questions: questionsForObject(object),
    quality: qualityForObject(object),
    receipts,
    lineage
  });
}
